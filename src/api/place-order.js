// Vercel Serverless Function — the ONLY place an order can be created.
//
// Why this exists: if the browser writes the order, a user can open devtools,
// set total = 1, and your Firestore rules have no reliable way to catch it.
// This route ignores whatever price the browser claims and recalculates
// everything from the database, then writes the order with the Admin SDK.
//
// SETUP (one time):
//   1. Firebase Console > Project Settings > Service Accounts > Generate new private key
//   2. Open the downloaded JSON, copy the WHOLE contents
//   3. Vercel > Project Settings > Environment Variables > add:
//        FIREBASE_SERVICE_ACCOUNT  =  <paste the whole JSON on one line>
//   4. Redeploy
// Never commit that JSON to GitHub.

import admin from 'firebase-admin';

function getDb() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  }
  return admin.firestore();
}

const APP_ID = 'darkside-app';
const SIZES = ['S', 'M', 'L', 'XL'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let db;
  try { db = getDb(); }
  catch (e) { console.error(e); return res.status(500).json({ error: 'Order service not configured.' }); }

  // 1. Verify the caller really is who they say they are.
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ error: 'Not signed in.' });

  let decoded;
  try { decoded = await admin.auth().verifyIdToken(idToken); }
  catch { return res.status(401).json({ error: 'Session expired. Please sign in again.' }); }

  if (decoded.firebase?.sign_in_provider === 'password' && decoded.email_verified !== true) {
    return res.status(403).json({ error: 'Please verify your email before placing an order.' });
  }

  const { items, shippingInfo, paymentMode, promoCode } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty.' });
  if (items.length > 20) return res.status(400).json({ error: 'Too many items in one order.' });

  // 2. Validate the shipping details server-side too - the browser can be bypassed.
  const s = shippingInfo || {};
  if (!s.name || !String(s.name).trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!/^\d{10}$/.test(String(s.phone || ''))) return res.status(400).json({ error: 'Phone must be 10 digits.' });
  if (!/^\d{6}$/.test(String(s.pin || ''))) return res.status(400).json({ error: 'Pincode must be 6 digits.' });
  if (!s.address || String(s.address).trim().length < 6) return res.status(400).json({ error: 'Address looks incomplete.' });

  const base = db.collection('artifacts').doc(APP_ID).collection('public').doc('data');

  try {
    // 3. Is the store even open?
    const settingsSnap = await base.collection('settings').doc('site').get();
    const settings = settingsSnap.exists ? settingsSnap.data() : {};
    if (settings.storeOpen === false) {
      return res.status(403).json({ error: settings.storeClosedMessage || 'Store is currently closed.' });
    }
    if (paymentMode === 'CASH ON DELIVERY' && settings.codEnabled === false) {
      return res.status(400).json({ error: 'Cash on delivery is not available right now.' });
    }

    const result = await db.runTransaction(async (tx) => {
      // 4. Read every product fresh from the database.
      const refs = items.map(i => base.collection('products').doc(String(i.id)));
      const snaps = await tx.getAll(...refs);

      let subtotal = 0;
      const verifiedItems = [];
      const decrements = [];

      for (let i = 0; i < items.length; i++) {
        const snap = snaps[i];
        const requested = items[i];
        if (!snap.exists) throw new Error(`"${requested.name || 'An item'}" is no longer available.`);

        const p = snap.data();
        const size = String(requested.selectedSize || '');
        if (!SIZES.includes(size)) throw new Error('Pick a size for every item.');

        const onHand = (p.sizes && p.sizes[size]) || 0;
        const alreadyTaken = decrements.filter(d => d.id === snap.id && d.size === size).length;
        if (onHand - alreadyTaken <= 0) throw new Error(`${p.name} (${size}) just sold out.`);

        // The price comes from the DATABASE, never from the request body.
        subtotal += p.price;
        verifiedItems.push({
          id: snap.id, name: p.name, image: p.image, price: p.price,
          selectedSize: size, fitBlock: p.fitBlock || null,
          cartItemId: `${snap.id}-${size}-${i}`
        });
        decrements.push({ id: snap.id, size, ref: refs[i], promoScope: p.promoScope, promoCodes: p.promoCodes });
      }

      // 5. Apply a promo code only if it is real, active, and within its limit.
      let discount = 0;
      let appliedCode = null;
      if (promoCode) {
        const code = String(promoCode).toUpperCase().trim();
        const promoRef = base.collection('promos').doc(code);
        const promoSnap = await tx.get(promoRef);
        if (promoSnap.exists) {
          const promo = promoSnap.data();
          const withinLimit = (promo.uses || 0) < (promo.maxUses || 0);
          const eligible = decrements.every(d =>
            d.promoScope === 'all' || (d.promoScope === 'selected' && (d.promoCodes || []).includes(code))
          );
          if (promo.status === 'Active' && withinLimit && eligible) {
            const pct = parseInt(String(promo.discount).replace(/\D/g, ''), 10);
            if (pct > 0 && pct <= 90) {
              discount = Math.round(subtotal * (pct / 100));
              appliedCode = code;
              tx.update(promoRef, { uses: admin.firestore.FieldValue.increment(1) });
            }
          }
        }
      }

      const threshold = settings.freeShippingThreshold ?? 5000;
      const fee = settings.shippingFee ?? 150;
      const afterDiscount = subtotal - discount;
      const shipping = afterDiscount > threshold ? 0 : fee;
      const total = afterDiscount + shipping;

      // 6. Take the stock and write the order atomically.
      for (const d of decrements) {
        tx.update(d.ref, { [`sizes.${d.size}`]: admin.firestore.FieldValue.increment(-1) });
      }

      const orderRef = base.collection('orders').doc();
      tx.set(orderRef, {
        userId: decoded.uid,
        userEmail: decoded.name || decoded.email || decoded.phone_number || 'Guest',
        items: verifiedItems,
        subtotal, discount, shipping, total,
        promoCode: appliedCode,
        shippingInfo: {
          name: String(s.name).trim(), phone: String(s.phone), address: String(s.address).trim(),
          city: String(s.city || '').trim(), state: String(s.state || '').trim(), pin: String(s.pin)
        },
        paymentMode: paymentMode || 'CASH ON DELIVERY',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });

      return { orderId: orderRef.id, total, subtotal, discount, shipping };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Order failed:', err);
    return res.status(400).json({ error: err.message || 'Could not place the order.' });
  }
}
