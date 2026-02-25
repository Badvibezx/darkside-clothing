import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Heart, Search, Menu, X, 
  User, Zap, Crosshair, Smartphone, ChevronRight,
  ShieldCheck, Truck, Fingerprint, Sparkles, Loader2,
  LayoutDashboard, Package, Users, Activity, Plus, Trash2,
  Box, BarChart, Tag, AlertTriangle, Settings, FileText, Lock,
  ArrowLeft, Star, Ruler, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE SETUP ---
const userConfig = {
  apiKey: "AIzaSyDEY-_Gz2qbhzIh7yGimqFY-GBEgMrxXmo",
  authDomain: "darkside-clothing.firebaseapp.com",
  projectId: "darkside-clothing",
  storageBucket: "darkside-clothing.firebasestorage.app",
  messagingSenderId: "280369946472",
  appId: "1:280369946472:web:2021cb6d71d5a9223ac0dd",
  measurementId: "G-LSE39HT6Q0"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'darkside-app';

// --- INITIAL DATABASE ---
const INITIAL_PRODUCTS = [
  { id: 1, name: "VOID WALKER CARGO", price: 3499, category: "Bottoms", stock: 12, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", badge: "HIGH DEMAND" },
  { id: 2, name: "CYBER-DOGMA HOODIE", price: 4299, category: "Outerwear", stock: 4, image: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&q=80&w=800", badge: "FEW LEFT" },
  { id: 3, name: "ACID WASH TEE V.2", price: 1899, category: "Tops", stock: 45, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800" },
  { id: 4, name: "NEON SYNDICATE JACKET", price: 5999, category: "Outerwear", stock: 2, image: "https://images.unsplash.com/photo-1551028919-ac66e624ec6a?auto=format&fit=crop&q=80&w=800", badge: "NEW DROP" },
  { id: 5, name: "SYSTEM FAILURE BEANIE", price: 999, category: "Hardware", stock: 0, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800" },
  { id: 6, name: "STEALTH TACTICAL VEST", price: 4599, category: "Outerwear", stock: 8, image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800" },
];

// --- GEMINI API HELPER ---
const apiKey = ""; 

const callGeminiAPI = async (prompt, schema = null) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: "You are a rogue, cyberpunk AI stylist for DARKSIDE CLOTHING INDIA. Speak with an edgy, dystopian tone." }] }
  };
  if (schema) payload.generationConfig = { responseMimeType: "application/json", responseSchema: schema };

  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

export default function App() {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSizeAI, setShowSizeAI] = useState(false);
  const [showVibeMatcher, setShowVibeMatcher] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState('All Categories');
  const [user, setUser] = useState(null);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);

  // Dynamic Theme State (Light mode when on Shop/Product views)
  const isLight = view !== 'home' && view !== 'admin';

  // Theme Variables
  const theme = {
    bg: isLight ? 'bg-white' : 'bg-[#050505]',
    text: isLight ? 'text-black' : 'text-white',
    textMuted: isLight ? 'text-gray-600' : 'text-gray-400',
    border: isLight ? 'border-black/10' : 'border-white/10',
    card: isLight ? 'bg-gray-100' : 'bg-[#0A0A0A]',
    input: isLight ? 'bg-white border-black/20 text-black focus:border-[#8A2BE2]' : 'bg-black border-white/20 text-white focus:border-[#CCFF00]',
    btnPrimary: isLight ? 'bg-black text-white hover:bg-[#8A2BE2]' : 'bg-[#CCFF00] text-black hover:bg-white',
    accent: isLight ? 'text-[#8A2BE2]' : 'text-[#CCFF00]',
    accentHover: isLight ? 'hover:text-[#8A2BE2]' : 'hover:text-[#CCFF00]',
  };

  // --- BROWSER HISTORY / MOBILE GESTURE INTEGRATION ---
  useEffect(() => {
    // Initialize base history state
    window.history.replaceState({ view: 'home', product: null }, '');
    
    const handlePopState = (e) => {
      if (e.state) {
        setView(e.state.view || 'home');
        if (e.state.product) {
          const prod = products.find(p => p.id === e.state.product);
          setSelectedProduct(prod || null);
        } else {
          setSelectedProduct(null);
        }
        setIsCartOpen(false);
        setShowSizeAI(false);
        setShowVibeMatcher(false);
      } else {
        // Fallback for native back button if state gets lost
        setView('home');
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const handleNavigate = (newView) => {
    setView(newView); 
    setSelectedProduct(null); 
    setIsMobileMenuOpen(false); 
    window.scrollTo(0, 0);
    // Push state so back button works
    window.history.pushState({ view: newView, product: null }, '', '#' + newView);
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    window.scrollTo(0, 0);
    window.history.pushState({ view: view, product: product.id }, '', '#product-' + product.id);
  };

  const closeProduct = () => {
    window.history.back(); // Triggers popstate, safely clearing selectedProduct
  };
  // ----------------------------------------------------

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        try { await signInAnonymously(auth); } catch (e) { console.error("Auth error:", e); }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'userdata', 'state'));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.cart) setCart(data.cart);
            if (data.wishlist) setWishlist(data.wishlist);
          }
        } catch (err) { console.error("Error fetching user data", err); }
      }
    });
    return () => unsubscribe();
  }, []);

  const saveUserData = async (newCart, newWishlist) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), { cart: newCart, wishlist: newWishlist }, { merge: true });
    } catch(e) { console.error("Error saving to DB", e); }
  };

  const enterVault = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 50, 200]);
    setIsFlashing(true);
    setTimeout(() => { 
      handleNavigate('shop'); 
      setTimeout(() => { setIsFlashing(false); }, 100); 
    }, 500);
  };

  const toggleWishlist = (product) => {
    let newWishlist = wishlist.find(item => item.id === product.id) ? wishlist.filter(item => item.id !== product.id) : [...wishlist, product];
    setWishlist(newWishlist); saveUserData(cart, newWishlist);
  };

  const addToCart = (product) => {
    const newCart = [...cart, product]; setCart(newCart); setIsCartOpen(true); saveUserData(newCart, wishlist);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index); setCart(newCart); saveUserData(newCart, wishlist);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const freeShippingThreshold = 5000;
  const progressToFreeShipping = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  // --- RESTORED ORIGINAL CURSOR ---
  const CustomCursor = () => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHoveringItem, setIsHoveringItem] = useState(false);
  
    useEffect(() => {
      const handleMouseMove = (e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        const isClickable = e.target.closest('button, a, input, select, [role="button"], .cursor-pointer');
        setIsHoveringItem(!!isClickable);
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
  
    return (
      <div 
        className="fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[99999] mix-blend-difference transition-transform duration-100 ease-out flex items-center justify-center"
        style={{ 
          transform: `translate(${mousePos.x - 12}px, ${mousePos.y - 12}px) scale(${isHoveringItem ? 2.5 : 1})`,
          backgroundColor: isHoveringItem ? 'transparent' : '#CCFF00',
          border: isHoveringItem ? '1px solid #CCFF00' : 'none'
        }}
      >
        {isHoveringItem && <span className="text-[4px] font-mono text-[#CCFF00] font-bold">EXPLORE</span>}
      </div>
    );
  };

  const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState({ h: 24, m: 0, s: 0 });
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          let { h, m, s } = prev;
          if (s > 0) s--; else if (m > 0) { m--; s = 59; } else if (h > 0) { h--; m = 59; s = 59; }
          return { h, m, s };
        });
      }, 1000);
      return () => clearInterval(timer);
    }, []);
    return (
      <div className="flex justify-center gap-4 mb-8 font-mono">
        {[{ label: 'HRS', value: timeLeft.h }, { label: 'MIN', value: timeLeft.m }, { label: 'SEC', value: timeLeft.s }].map((t, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-4xl md:text-6xl text-white font-black bg-[#0A0A0A] border border-white/10 p-4 w-20 md:w-24 text-center">{String(t.value).padStart(2, '0')}</span>
            <span className="text-[10px] text-gray-500 mt-2">{t.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const Navbar = () => {
    if (view === 'admin') return null;
    return (
      <nav className={`fixed top-0 w-full z-50 ${isLight ? 'bg-white/90 border-black/10' : 'bg-[#050505]/80 border-white/10'} backdrop-blur-lg border-b transition-colors duration-1000`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Menu className={`md:hidden cursor-pointer ${isLight ? 'text-black hover:text-[#8A2BE2]' : 'text-white hover:text-[#CCFF00]'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            <div onClick={() => handleNavigate('home')} className="cursor-pointer relative z-50 flex items-center group">
              <img src="451404688_834030975111165_2058569119566201452_n.jpg" alt="Darkside" className="h-14 md:h-16 object-contain group-hover:scale-105 transition-transform" style={{ filter: isLight ? 'invert(1)' : 'contrast(1.4) brightness(1.1)', mixBlendMode: isLight ? 'normal' : 'screen' }} onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x150/${isLight ? 'FFFFFF' : '050505'}/${isLight ? '000000' : 'CCFF00'}?text=YOUR+LOGO+HERE`; e.target.style.filter = "none"; e.target.style.mixBlendMode = "normal"; }} />
              <h1 className={`hidden text-3xl font-black tracking-tighter cursor-pointer uppercase glitch-hover ${isLight ? 'text-black' : 'text-white'}`} style={{ fontFamily: "'Impact', sans-serif" }}>DARK<span className={isLight ? 'text-[#8A2BE2]' : 'text-[#CCFF00]'}>SIDE</span></h1>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {['Tees', 'Hoodies', 'Cargos'].map(link => (
              <button key={link} onClick={() => { setShopCategory(link === 'Tees' ? 'Tops' : link === 'Hoodies' ? 'Outerwear' : 'Bottoms'); handleNavigate('shop'); }} className={`text-sm font-mono uppercase tracking-widest transition-colors magnetic ${isLight ? 'text-gray-600 hover:text-black' : 'text-[#E5E5E5] hover:text-[#CCFF00]'}`}>{link}</button>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <Search className={`cursor-pointer hidden md:block w-5 h-5 ${theme.text} ${theme.accentHover}`} onClick={() => handleNavigate('shop')} />
            <User onClick={() => handleNavigate(user && !user.isAnonymous ? 'account' : 'auth')} className={`cursor-pointer w-5 h-5 ${theme.text} ${theme.accentHover}`} />
            <div className="relative cursor-pointer" onClick={() => handleNavigate('vault')}>
              <Heart className={`w-5 h-5 ${theme.text} hover:text-[#8A2BE2]`} />
              {wishlist.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#8A2BE2] text-white text-[10px] font-bold flex items-center justify-center rounded-full">{wishlist.length}</span>}
            </div>
            <div className="relative cursor-pointer" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag className={`w-5 h-5 ${theme.text} hover:text-[#8A2BE2]`} />
              {cart.length > 0 && <span className={`absolute -top-2 -right-2 w-4 h-4 ${isLight ? 'bg-black text-white' : 'bg-[#CCFF00] text-black'} text-[10px] font-bold flex items-center justify-center rounded-full`}>{cart.length}</span>}
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className={`md:hidden border-b p-4 flex flex-col gap-4 absolute top-20 left-0 w-full z-40 ${isLight ? 'bg-white border-black/10' : 'bg-[#0A0A0A] border-white/10'}`}>
            {['Home', 'Shop', 'Vault', user && !user.isAnonymous ? 'Account' : 'Login'].map(link => (
              <button key={link} onClick={() => { setShopCategory('All Categories'); handleNavigate(link === 'Login' ? 'auth' : link.toLowerCase()); }} className={`text-left font-mono uppercase py-2 border-b ${isLight ? 'text-black border-black/5 hover:text-[#8A2BE2]' : 'text-white border-white/5 hover:text-[#CCFF00]'}`}>{link}</button>
            ))}
          </div>
        )}
      </nav>
    );
  };

  const SizePredictor = () => {
    const [height, setHeight] = useState(''); const [weight, setWeight] = useState(''); const [fit, setFit] = useState('OVERSIZED (STREET)'); const [loading, setLoading] = useState(false); const [result, setResult] = useState('');
    const handleCalculate = async () => {
      if (!height || !weight) return; setLoading(true); setResult('');
      try { setResult(await callGeminiAPI(`Calculate the optimal clothing size (S, M, L, XL) for user: ${height}cm, ${weight}kg, prefers ${fit}. Reply ONLY size on line 1, edgy cyberpunk styling tip on line 2.`)); } 
      catch (err) { setResult("SYSTEM ERROR: UNABLE TO CONNECT TO NEURAL NET."); } finally { setLoading(false); }
    };
    return (
      <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`${isLight ? 'bg-white border-black/20' : 'bg-[#0A0A0A] border-[#CCFF00]/30'} border w-full max-w-md p-6 relative`}>
          <button onClick={() => setShowSizeAI(false)} className={`absolute top-4 right-4 ${theme.textMuted} hover:${theme.text}`}><X size={20} /></button>
          <div className="flex items-center gap-2 mb-6"><Fingerprint className="text-[#8A2BE2]" /><h3 className={`text-xl font-bold uppercase tracking-wider ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>AI Fit Predictor</h3></div>
          {result ? (
            <div className="space-y-4 font-mono text-sm animate-in fade-in zoom-in duration-500">
               <div className={`p-4 border ${isLight ? 'border-[#8A2BE2] bg-[#8A2BE2]/10 text-[#8A2BE2]' : 'border-[#CCFF00] bg-[#CCFF00]/10 text-[#CCFF00]'}`}><p className="font-bold mb-2 uppercase">ANALYSIS COMPLETE:</p>{result.split('\n').map((line, i) => (<p key={i} className={i === 0 ? "text-2xl font-black mb-2" : `text-xs ${theme.textMuted}`}>{line}</p>))}</div>
               <button onClick={() => setShowSizeAI(false)} className={`w-full font-bold py-3 uppercase transition-colors ${theme.btnPrimary}`}>Acknowledge & Return</button>
            </div>
          ) : (
            <>
              <p className={`font-mono text-xs mb-6 ${theme.textMuted}`}>ENTER BIOMETRICS FOR EXACT SIZING VIA NEURAL NET.</p>
              <div className="space-y-4 font-mono text-sm">
                <div><label className={`block mb-1 ${theme.accent}`}>HEIGHT (CM)</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" className={`w-full p-3 outline-none transition-colors ${theme.input}`} /></div>
                <div><label className={`block mb-1 ${theme.accent}`}>WEIGHT (KG)</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" className={`w-full p-3 outline-none transition-colors ${theme.input}`} /></div>
                <div><label className={`block mb-1 ${theme.accent}`}>FIT PREFERENCE</label><select value={fit} onChange={e => setFit(e.target.value)} className={`w-full p-3 outline-none appearance-none cursor-pointer transition-colors ${theme.input}`}><option>OVERSIZED (STREET)</option><option>REGULAR (CLEAN)</option><option>SNUG (AERO)</option></select></div>
                <button onClick={handleCalculate} disabled={loading || !height || !weight} className="w-full bg-[#8A2BE2] text-white font-bold py-4 mt-4 hover:bg-black transition-colors uppercase disabled:opacity-50 flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{loading ? "CALCULATING..." : "✨ PREDICT FIT"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const VibeMatcher = () => {
    const [scenario, setScenario] = useState(''); const [loading, setLoading] = useState(false); const [recommendations, setRecommendations] = useState(null);
    const handleMatch = async () => {
      if (!scenario) return; setLoading(true);
      try {
        const catalogContext = products.map(p => `{id: ${p.id}, name: "${p.name}"}`).join(', ');
        const jsonText = await callGeminiAPI(`Scenario: "${scenario}". Pick 2 exact products matching vibe: [${catalogContext}].`, { type: "OBJECT", properties: { items: { type: "ARRAY", items: { type: "INTEGER" } }, reasoning: { type: "STRING" } }, required: ["items", "reasoning"] });
        const data = JSON.parse(jsonText);
        setRecommendations({ products: data.items.map(id => products.find(p => p.id === id)).filter(Boolean), reasoning: data.reasoning });
      } catch (err) { setRecommendations({ error: "NEURAL LINK SEVERED. TRY AGAIN." }); } finally { setLoading(false); }
    };
    return (
      <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`${isLight ? 'bg-white' : 'bg-[#0A0A0A]'} border border-[#8A2BE2]/50 w-full max-w-2xl p-6 relative`}>
          <button onClick={() => setShowVibeMatcher(false)} className={`absolute top-4 right-4 ${theme.textMuted} hover:${theme.text}`}><X size={20} /></button>
          <div className="flex items-center gap-2 mb-2"><Sparkles className="text-[#8A2BE2]" /><h3 className={`text-2xl font-black uppercase tracking-wider ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>AI Vibe Matcher</h3></div>
          <p className={`font-mono text-xs mb-6 ${theme.textMuted}`}>DESCRIBE YOUR DESTINATION. THE NEURAL NET WILL FORGE YOUR OUTFIT.</p>
          {!recommendations ? (
            <div className="space-y-4 font-mono">
               <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="e.g., Underground techno rave in Berlin..." className={`w-full p-4 outline-none h-32 resize-none transition-colors ${theme.input}`} />
               <button onClick={handleMatch} disabled={loading || !scenario} className={`w-full font-bold py-4 uppercase transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}{loading ? "SCANNING CATALOG..." : "✨ GENERATE FIT"}
                </button>
            </div>
          ) : recommendations.error ? ( <p className="text-red-500 font-mono text-center py-8">{recommendations.error}</p> ) : (
            <div className="animate-in fade-in duration-500">
               <div className={`p-4 border-l-4 border-[#8A2BE2] bg-[#8A2BE2]/10 mb-6 font-mono text-sm italic ${theme.text}`}>"{recommendations.reasoning}"</div>
               <div className="grid grid-cols-2 gap-4 mb-6">
                 {recommendations.products.map(p => (
                   <div key={p.id} className={`border p-2 flex gap-3 ${theme.border} ${theme.card}`}><img src={p.image} className="w-16 h-20 object-cover grayscale" /><div className="flex flex-col justify-center"><p className={`font-bold text-xs uppercase ${theme.text}`}>{p.name}</p><p className={`font-mono text-xs mt-1 ${theme.accent}`}>₹{p.price}</p><button onClick={() => addToCart(p)} className="text-left text-[#8A2BE2] text-[10px] font-mono uppercase mt-2 hover:underline">+ Add to Cart</button></div></div>
                 ))}
               </div>
               <button onClick={() => setRecommendations(null)} className={`w-full border font-bold py-3 uppercase font-mono text-sm transition-colors ${theme.border} ${theme.text} hover:bg-gray-200`}>Reset Vibe</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- REDESIGNED PRODUCT DETAIL PAGE ---
  const ProductDetail = () => {
    const [activeTab, setActiveTab] = useState('desc'); // 'desc' or 'ship'
    
    return (
      <div className="pt-24 pb-32 md:pb-12 px-4 max-w-7xl mx-auto min-h-screen">
         {/* History Back integration */}
         <button onClick={closeProduct} className={`${theme.textMuted} hover:${theme.text} font-mono text-xs mb-8 flex items-center gap-2 uppercase tracking-widest transition-colors`}>
           <ArrowLeft size={16} /> Back to Catalog
         </button>
         
         <div className="grid md:grid-cols-2 gap-12 items-start">
           
           {/* Enhanced Gallery Layout */}
           <div className="space-y-4 sticky top-24">
             <div className={`aspect-[4/5] ${theme.card} border ${theme.border} relative overflow-hidden group w-full`}>
               {/* No Grayscale on PDP - Full vibrancy instantly */}
               <img src={selectedProduct.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={selectedProduct.name} />
               {selectedProduct.badge && (
                 <div className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1 uppercase tracking-widest ${isLight ? 'bg-black text-white' : 'bg-[#CCFF00] text-black'}`}>
                   {selectedProduct.badge}
                 </div>
               )}
             </div>
             {/* Thumbnail row */}
             <div className="grid grid-cols-3 gap-4 hidden md:grid">
                {[1,2,3].map(i => (
                  <div key={i} className={`aspect-square ${theme.card} border ${theme.border} cursor-pointer hover:border-gray-400 overflow-hidden`}>
                     <img src={selectedProduct.image} className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
             </div>
           </div>
           
           {/* Details Section */}
           <div className="flex flex-col">
             
             {/* Header */}
             <div className="mb-6 border-b border-gray-200 pb-6">
               <div className="flex items-center gap-2 mb-3">
                 <div className="flex text-[#8A2BE2] drop-shadow-sm">
                    {[1,2,3,4,5].map(star => <Star key={star} size={14} fill="currentColor" />)}
                 </div>
                 <span className={`text-xs font-mono ${theme.textMuted}`}>(128 Reviews)</span>
               </div>
               <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>
                 {selectedProduct.name}
               </h1>
               <p className={`text-3xl font-mono ${isLight ? 'text-black font-extrabold' : 'text-[#E5E5E5]'}`}>₹{selectedProduct.price}</p>
             </div>
             
             {/* Sizing */}
             <div className="mb-8">
               <div className="flex justify-between items-center mb-4">
                 <span className={`font-bold uppercase tracking-widest text-sm ${theme.text}`}>Select Size</span>
                 <button onClick={() => setShowSizeAI(true)} className="text-[#8A2BE2] flex items-center gap-2 font-mono text-xs hover:underline cursor-pointer">
                   <Ruler size={14} /> Size Guide
                 </button>
               </div>
               <div className="grid grid-cols-4 gap-4">
                 {['S', 'M', 'L', 'XL'].map(s => (
                   <button key={s} className={`h-14 border font-mono text-lg transition-colors ${isLight ? 'border-black/20 text-black hover:border-black hover:bg-black/5 focus:border-black focus:bg-black focus:text-white' : 'border-white/20 text-white hover:border-[#CCFF00] hover:text-[#CCFF00] focus:border-[#CCFF00] focus:bg-[#CCFF00]/10'}`}>
                     {s}
                   </button>
                 ))}
               </div>
             </div>
  
             {/* Desktop Add to Cart */}
             <div className="hidden md:flex gap-4 mb-10">
               <button onClick={() => addToCart(selectedProduct)} className={`flex-1 font-black py-5 uppercase tracking-[0.2em] text-sm transition-colors ${theme.btnPrimary} relative overflow-hidden group`}>
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                 <span className="relative z-10 flex items-center justify-center gap-2"><ShoppingBag size={18} /> Add To Cart</span>
               </button>
               <button onClick={() => toggleWishlist(selectedProduct)} className={`w-16 flex items-center justify-center border transition-colors ${isLight ? 'border-black/20 text-black hover:border-black' : 'border-white/20 text-white hover:border-[#8A2BE2]'}`}>
                 <Heart fill={wishlist.find(i => i.id === selectedProduct.id) ? (isLight ? "#000" : "#8A2BE2") : "none"} />
               </button>
             </div>
  
             {/* Enhanced Info Accordions */}
             <div className="space-y-4">
                {/* Details Tab */}
                <div className={`border ${theme.border} ${theme.card}`}>
                   <button onClick={() => setActiveTab(activeTab === 'desc' ? '' : 'desc')} className="w-full flex justify-between items-center p-4 font-bold uppercase tracking-widest text-sm">
                      Product Details {activeTab === 'desc' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                   </button>
                   {activeTab === 'desc' && (
                      <div className={`p-4 pt-0 text-sm font-mono leading-relaxed ${theme.textMuted}`}>
                         {selectedProduct.description || "Forged for the urban dystopia. This piece features advanced construction and proprietary fabric blends engineered to withstand high-friction environments."}
                         <ul className="mt-4 space-y-2 text-xs">
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#8A2BE2] rounded-full"></div> 100% Premium Heavyweight Cotton</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#8A2BE2] rounded-full"></div> Oversized drop-shoulder fit</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#8A2BE2] rounded-full"></div> Acid-washed by hand</li>
                         </ul>
                      </div>
                   )}
                </div>
                
                {/* Shipping Tab */}
                <div className={`border ${theme.border} ${theme.card}`}>
                   <button onClick={() => setActiveTab(activeTab === 'ship' ? '' : 'ship')} className="w-full flex justify-between items-center p-4 font-bold uppercase tracking-widest text-sm">
                      Shipping & Returns {activeTab === 'ship' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                   </button>
                   {activeTab === 'ship' && (
                      <div className={`p-4 pt-0 text-xs font-mono space-y-3 ${theme.textMuted}`}>
                         <p className="flex items-center gap-2"><Truck size={14} className={theme.accent} /> Express Pan-India delivery within 48-72 hours.</p>
                         <p className="flex items-center gap-2"><RefreshCw size={14} className="text-[#8A2BE2]" /> 7-day hassle-free returns. No questions asked.</p>
                      </div>
                   )}
                </div>
             </div>
             
           </div>
         </div>
         
         {/* Mobile Sticky Add to Cart Bar */}
         <div className={`fixed bottom-0 left-0 right-0 p-4 ${isLight ? 'bg-white/90 border-black/10' : 'bg-black/90 border-white/10'} backdrop-blur-md border-t md:hidden z-40 transform transition-transform`}>
            <div className="flex gap-2">
              <button onClick={() => toggleWishlist(selectedProduct)} className={`w-14 flex items-center justify-center border transition-colors ${isLight ? 'border-black/20 text-black hover:border-black' : 'border-white/20 text-white hover:border-[#8A2BE2]'}`}>
                <Heart fill={wishlist.find(i => i.id === selectedProduct.id) ? (isLight ? "#000" : "#8A2BE2") : "none"} />
              </button>
              <button onClick={() => addToCart(selectedProduct)} className={`flex-1 font-black py-4 uppercase tracking-widest flex justify-center items-center gap-2 ${theme.btnPrimary}`}>
                 <ShoppingBag size={18} /> ₹{selectedProduct.price}
              </button>
            </div>
         </div>
      </div>
    );
  };

  const Home = () => (
    <>
      <div className="relative min-h-screen pt-24 pb-12 flex flex-col items-center justify-center overflow-hidden bg-[#050505] border-b border-white/10 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-luminosity animate-pan-bg"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#CCFF00]/40 shadow-[0_0_15px_#CCFF00] animate-scan-line pointer-events-none z-10"></div>
        <div className="absolute top-32 left-8 text-[#CCFF00] font-mono text-[10px] tracking-widest opacity-40 hidden md:block animate-pulse">[ SYS.COORD : 28.6139° N, 77.2090° E ]<br/>INITIATING_PROTOCOL_V.9</div>
        <div className="absolute bottom-16 right-8 flex items-center gap-4 hidden md:flex opacity-40"><div className="text-right text-gray-500 font-mono text-[10px] tracking-widest">TARGET ACQUIRED<br/>AWAITING DIRECTIVE</div><Crosshair size={32} className="text-[#8A2BE2] animate-spin-slow" /></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl flex flex-col items-center mt-8">
          <div className="opacity-0 animate-reveal-1 mb-8"><img src="451404688_834030975111165_2058569119566201452_n.jpg" alt="The Darkside" className="h-24 md:h-32 lg:h-40 mix-blend-screen object-contain drop-shadow-[0_0_30px_rgba(204,255,0,0.15)]" style={{ filter: 'contrast(1.5) brightness(1.2)' }} /></div>
          <div className="mb-6 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-1 text-xs font-mono font-bold tracking-widest animate-pulse opacity-0 animate-reveal-2"><Zap size={14} /> EXCLUSIVE DROP RELEASING IN</div>
          <div className="opacity-0 animate-reveal-3"><CountdownTimer /></div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-2 font-display opacity-0 animate-reveal-4">THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#8A2BE2] glitch-hover" data-text="SYNDICATE">SYNDICATE</span> COLLECTION</h1>
          <p className="text-gray-400 font-mono tracking-[0.2em] uppercase text-sm mb-8 opacity-0 animate-reveal-4">Darkside — Embrace the light.</p>
          <div className="opacity-0 animate-reveal-4 mt-4 mb-8">
            <button onClick={enterVault} className="bg-white text-black px-12 py-5 font-bold uppercase tracking-widest transition-all relative overflow-hidden group/btn border border-white hover:border-[#CCFF00] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)]">
              <div className="absolute inset-0 bg-[#CCFF00] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
              <span className="relative z-10 flex items-center justify-center gap-3 group-hover/btn:text-black">Enter The Vault <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></span>
            </button>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#CCFF00] py-3 overflow-hidden border-y border-black relative z-20 shadow-[0_0_20px_rgba(204,255,0,0.2)]">
        <div className="animate-marquee whitespace-nowrap text-black font-bold font-mono text-sm tracking-widest flex items-center">
          {[...Array(4)].map((_, i) => (<span key={i} className="mx-4">✦ DARKSIDE - EMBRACE THE LIGHT ✦ 100% HEAVYWEIGHT COTTON ✦ FREE SHIPPING PAN-INDIA ✦ CASH ON DELIVERY AVAILABLE ✦ NO REFUNDS FOR THE WEAK </span>))}
        </div>
      </div>
    </>
  );

  const Shop = () => {
    const filteredProducts = shopCategory === 'All Categories' ? products : products.filter(p => p.category === shopCategory);
    return (
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
        <div className={`flex justify-between items-end mb-8 border-b ${theme.border} pb-4`}>
          <h2 className={`text-4xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Catalog</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowVibeMatcher(true)} className="hidden md:flex items-center gap-2 bg-[#8A2BE2]/20 text-[#8A2BE2] border border-[#8A2BE2] px-4 py-2 font-mono text-xs uppercase hover:bg-[#8A2BE2] hover:text-white transition-all"><Sparkles size={14} /> ✨ AI Vibe Check</button>
            <div className="flex gap-4"><select value={shopCategory} onChange={(e) => setShopCategory(e.target.value)} className={`bg-transparent p-2 font-mono text-xs uppercase outline-none cursor-pointer ${theme.textMuted} ${theme.border} border`}><option>All Categories</option><option>Outerwear</option><option>Tops</option><option>Bottoms</option><option>Hardware</option></select></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <div key={product.id} className="group cursor-pointer" onClick={() => openProduct(product)}>
            <div className={`relative aspect-[3/4] ${theme.card} overflow-hidden border ${isLight ? 'border-black/5 group-hover:border-black/50' : 'border-white/5 group-hover:border-[#CCFF00]/50'} transition-colors mb-4`}>
              {/* Removed Grayscale filter for instant vibrancy */}
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {product.badge && <div className={`absolute top-4 left-4 text-[10px] font-bold px-2 py-1 uppercase mix-blend-screen ${isLight ? 'bg-black text-white' : 'bg-white text-black'}`}>{product.badge}</div>}
            </div>
            <div className="flex justify-between items-start">
              <div><h3 className={`font-bold uppercase tracking-wider text-sm mb-1 transition-colors ${theme.text} group-hover:text-[#8A2BE2]`}>{product.name}</h3><p className={`font-mono text-xs ${theme.textMuted}`}>{product.category}</p></div>
              <span className={`font-mono font-bold ${isLight ? 'text-black font-extrabold' : 'text-[#E5E5E5]'}`}>₹{product.price}</span>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  };

  const Account = () => (
    <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen">
      <h2 className={`text-4xl font-black uppercase tracking-tighter mb-8 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Command Center</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="col-span-1 space-y-4">
          <div className={`${theme.card} border ${theme.border} p-6`}><div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl mb-4 ${isLight ? 'bg-black text-white' : 'bg-[#CCFF00] text-black'}`}>{user?.email ? user.email.charAt(0).toUpperCase() : 'A'}</div><h3 className={`font-bold uppercase truncate ${theme.text}`}>{user?.email || 'Anonymous GUEST'}</h3><p className="text-[#8A2BE2] font-mono text-xs mt-1">TIER: {user?.isAnonymous ? 'GUEST' : 'UNDERGROUND INSIDER'}</p></div>
          <div className={`${theme.card} border ${theme.border} p-6 space-y-3 font-mono text-sm`}><button className={`w-full text-left uppercase hover:underline ${theme.accent}`}>Order History</button><button className={`w-full text-left uppercase ${theme.textMuted} hover:${theme.text}`}>Saved Addresses</button><button className={`w-full text-left uppercase ${theme.textMuted} hover:${theme.text}`}>Settings</button><button onClick={() => signOut(auth).then(()=>handleNavigate('home'))} className={`w-full text-left text-red-500 uppercase hover:text-red-400 mt-4 pt-4 border-t ${theme.border}`}>Logout</button></div>
        </div>
        <div className={`col-span-2 ${theme.card} border ${theme.border} p-6`}><h3 className={`font-bold uppercase mb-6 border-b ${theme.border} pb-4 ${theme.text}`}>Recent Orders</h3><div className="text-center py-12"><p className={`font-mono text-sm ${theme.textMuted}`}>CHECKOUT HISTORY CAN BE VIEWED BY SYSTEM ADMIN.</p><button onClick={() => handleNavigate('shop')} className={`mt-4 font-mono text-xs uppercase hover:underline ${theme.accent}`}>Enter Shop</button></div></div>
      </div>
    </div>
  );

  const AuthView = () => {
    const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [isSignup, setIsSignup] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => { 
      e.preventDefault(); setError(''); setLoading(true); 
      
      // -- HIDDEN ADMIN BYPASS --
      if (email === 'admin@darkside.com' && password === 'darkside') {
        setLoading(false);
        handleNavigate('admin');
        return;
      }

      try { 
        isSignup ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password); 
        handleNavigate('account'); 
      } catch (err) { setError(err.message); } finally { setLoading(false); } 
    };

    return (
      <div className="pt-24 px-4 max-w-md mx-auto min-h-screen">
        <div className={`${theme.card} border ${theme.border} p-8`}>
          <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>{isSignup ? "Join The Syndicate" : "System Login"}</h2>
          <p className={`font-mono text-xs mb-8 ${theme.textMuted}`}>AUTHENTICATE TO ACCESS YOUR VAULT AND SECURE ORDERS.</p>
          {error && <p className="text-red-500 font-mono text-xs mb-4 p-2 bg-red-500/10 border border-red-500/30">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm">
            <div><label className={`block mb-1 ${theme.accent}`}>EMAIL IDENTIFIER</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className={`w-full p-3 outline-none ${theme.input}`} /></div>
            <div><label className={`block mb-1 ${theme.accent}`}>PASSCODE</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className={`w-full p-3 outline-none ${theme.input}`} /></div>
            <button disabled={loading} type="submit" className={`w-full font-bold py-4 mt-4 uppercase disabled:opacity-50 flex justify-center items-center ${theme.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={20} /> : (isSignup ? "Create Identity" : "Initialize")}</button>
          </form>
          <button onClick={() => setIsSignup(!isSignup)} className={`w-full mt-6 text-xs font-mono uppercase ${theme.textMuted} hover:${theme.text}`}>{isSignup ? "Already registered? Login here." : "No identity? Create one here."}</button>
        </div>
      </div>
    );
  };

  const CheckoutView = () => {
    const [formData, setFormData] = useState({ name: '', address: '', city: '', pin: '', phone: '' });
    const [paymentMode, setPaymentMode] = useState('UPI');
    const [processing, setProcessing] = useState(false);

    const handlePlaceOrder = async (e) => { 
      e.preventDefault(); 
      if(!user) return;
      setProcessing(true); 
      try {
        const orderTotal = cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150;
        const orderData = { userId: user.uid, userEmail: user.email || 'Guest', items: cart, total: orderTotal, shippingInfo: formData, paymentMode: paymentMode, status: 'PENDING', createdAt: new Date().toISOString() };
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
        setCart([]); saveUserData([], wishlist); alert("ORDER SECURED AND TRANSMITTED TO NEURAL NET. REDIRECTING."); handleNavigate('account'); 
      } catch (err) { console.error("Order sync failed", err); alert("TRANSMISSION FAILED. TRY AGAIN."); } finally { setProcessing(false); }
    };

    if (cart.length === 0) return (
      <div className="pt-32 px-4 max-w-4xl mx-auto min-h-screen text-center">
        <h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Secure Checkout</h2>
        <p className={`font-mono text-sm mb-6 ${theme.textMuted}`}>YOUR CART IS EMPTY. RETURN TO THE VOID.</p>
        <button onClick={() => handleNavigate('shop')} className={`font-bold px-8 py-3 uppercase tracking-widest ${theme.btnPrimary}`}>Back to Catalog</button>
      </div>
    );

    return (
      <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen pb-20">
        <h2 className={`text-4xl font-black uppercase tracking-tighter mb-8 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Secure Checkout</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <form onSubmit={handlePlaceOrder} className="space-y-8">
            <div className={`${theme.card} border ${theme.border} p-6`}>
              <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>1. Shipping Coordinates</h3>
              <div className="space-y-4 font-mono text-sm">
                <input required placeholder="FULL NAME" className={`w-full p-3 outline-none ${theme.input}`} onChange={e=>setFormData({...formData, name: e.target.value})} />
                <input required placeholder="STREET ADDRESS" className={`w-full p-3 outline-none ${theme.input}`} onChange={e=>setFormData({...formData, address: e.target.value})} />
                <div className="grid grid-cols-2 gap-4"><input required placeholder="CITY" className={`w-full p-3 outline-none ${theme.input}`} onChange={e=>setFormData({...formData, city: e.target.value})} /><input required placeholder="PINCODE" className={`w-full p-3 outline-none ${theme.input}`} onChange={e=>setFormData({...formData, pin: e.target.value})} /></div>
                <input required placeholder="PHONE NUMBER (+91)" className={`w-full p-3 outline-none ${theme.input}`} onChange={e=>setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className={`${theme.card} border ${theme.border} p-6`}>
              <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>2. Payment Protocol</h3>
              <div className="space-y-3 font-mono text-sm">
                {['UPI', 'CREDIT/DEBIT CARD', 'CASH ON DELIVERY'].map(mode => (
                  <label key={mode} className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${paymentMode === mode ? `border-[#8A2BE2] bg-[#8A2BE2]/10` : `${theme.border} hover:border-black/30`}`}>
                    <input type="radio" name="payment" value={mode} checked={paymentMode === mode} onChange={(e) => setPaymentMode(e.target.value)} className="accent-[#8A2BE2]" />
                    <span className={`uppercase ${theme.text}`}>{mode}</span>
                  </label>
                ))}
              </div>
            </div>
            <button disabled={processing} type="submit" className={`w-full font-black py-5 uppercase tracking-widest text-lg disabled:opacity-50 flex justify-center items-center ${theme.btnPrimary}`}>
              {processing ? <Loader2 className="animate-spin" size={24} /> : `PLACE ORDER • ₹${cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150}`}
            </button>
          </form>

          <div className={`${theme.card} border ${theme.border} p-6 h-fit sticky top-28`}>
             <h3 className={`font-bold uppercase mb-6 border-b ${theme.border} pb-4 ${theme.text}`}>Order Summary</h3>
             <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
               {cart.map((item, idx) => (
                 <div key={idx} className="flex gap-4">
                   <img src={item.image} className={`w-16 h-20 object-cover grayscale border ${theme.border}`} />
                   <div className="flex-1 flex flex-col justify-center">
                     <p className={`text-xs font-bold uppercase ${theme.text}`}>{item.name}</p>
                     <p className={`font-mono text-[10px] ${theme.textMuted}`}>QTY: 1</p>
                     <p className={`font-mono text-xs mt-1 ${theme.accent}`}>₹{item.price}</p>
                   </div>
                 </div>
               ))}
             </div>
             <div className={`border-t ${theme.border} pt-4 space-y-2 font-mono text-sm`}>
               <div className={`flex justify-between ${theme.textMuted}`}><span>SUBTOTAL</span><span>₹{cartTotal}</span></div>
               <div className={`flex justify-between ${theme.textMuted}`}><span>SHIPPING</span><span>{cartTotal > freeShippingThreshold ? 'FREE' : '₹150'}</span></div>
               <div className={`flex justify-between font-bold text-lg pt-4 border-t ${theme.border} mt-2 ${theme.text}`}>
                 <span>TOTAL</span><span className={theme.accent}>₹{cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150}</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const Vault = () => (
    <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen text-center">
      <h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>The Vault</h2>
      {wishlist.length === 0 ? ( <p className={`font-mono ${theme.textMuted}`}>YOUR VAULT IS EMPTY.</p> ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-left">
            {wishlist.map(w => (
              <div key={w.id} className={`${theme.card} border ${theme.border} p-4`}><img src={w.image} className="w-full aspect-square object-cover mb-2 grayscale" /><p className={`text-xs font-bold uppercase truncate ${theme.text}`}>{w.name}</p><p className={`font-mono text-xs ${theme.accent}`}>₹{w.price}</p><button onClick={() => addToCart(w)} className={`w-full mt-2 text-[10px] font-bold py-2 uppercase transition-colors ${theme.btnPrimary}`}>Move to Cart</button></div>
            ))}
          </div>
      )}
    </div>
  );

  // --- DRONAHQ-STYLE ENTERPRISE ADMIN SYSTEM ---
  const AdminPanel = () => {
    const [adminView, setAdminView] = useState('dashboard');
    const [orders, setOrders] = useState([]);
    const [ordersError, setOrdersError] = useState(null);
    
    useEffect(() => {
      const authenticateAndFetch = async () => {
        try {
          if (!user) await signInAnonymously(auth);
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'));
          const unsub = onSnapshot(q, (snap) => {
            const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            loaded.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
            setOrders(loaded); setOrdersError(null);
          }, (error) => { console.error("Order fetch error", error); setOrdersError(error.message); });
          return () => unsub();
        } catch (authErr) { console.error("Admin Auth Error", authErr); setOrdersError(authErr.message); }
      }
      authenticateAndFetch();
    }, [user]);

    const updateOrderStatus = async (orderId, newStatus) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus }); } catch (e) { console.error("Update failed", e); } };

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    const DronaTabs = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics Dashboard' }, { id: 'orders', icon: Package, label: 'Fulfillment Tracking' },
      { id: 'products', icon: Box, label: 'Product & Catalog' }, { id: 'inventory', icon: AlertTriangle, label: 'Inventory Alerts' },
      { id: 'crm', icon: Users, label: 'Customer Relations' }, { id: 'marketing', icon: Tag, label: 'Marketing & Promos' },
      { id: 'rbac', icon: ShieldCheck, label: 'RBAC Security' }
    ];

    return (
      <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col md:flex-row cursor-default font-mono selection:bg-[#CCFF00] selection:text-black">
        <div className="w-full md:w-72 bg-[#0A0A0A] border-r border-[#333] flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-[#333] flex items-center justify-between bg-black">
            <div><h1 className="text-2xl font-black uppercase text-[#CCFF00]" style={{ fontFamily: "'Impact', sans-serif" }}>SYS.ADMIN</h1><p className="text-[10px] text-[#8A2BE2] mt-1">DRONA_HQ SECURE PROTOCOL</p></div>
            <button onClick={() => handleNavigate('home')} className="text-gray-500 hover:text-white p-2 border border-[#333] bg-[#0A0A0A]"><LogOut size={14} /></button>
          </div>
          <div className="p-4 space-y-1 flex-1 overflow-y-auto">
            {DronaTabs.map(item => (
              <button key={item.id} onClick={() => setAdminView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 uppercase text-xs font-bold border transition-colors ${adminView === item.id ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5 hover:border-[#333]'}`}>
                <item.icon size={14} /> {item.label}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-[#333] bg-black">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#8A2BE2] flex items-center justify-center font-bold text-white text-xs">AD</div>
              <div><p className="text-xs font-bold text-white">MASTER ADMIN</p><p className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> ONLINE</p></div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
          <div className="max-w-6xl mx-auto">
            {ordersError && ( <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs"><strong>Warning:</strong> Could not load orders. Permission denied. ({ordersError})</div> )}

            {adminView === 'dashboard' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">Analytics Dashboard</h2><p className="text-xs text-gray-500 mt-1">Real-time visualization of key metrics</p></div>
                  <button className="bg-[#CCFF00] text-black text-xs font-bold px-4 py-2 uppercase">Export PDF Report</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Gross Revenue</p><p className="text-3xl text-[#CCFF00]">₹{totalRevenue}</p><p className="text-[10px] text-green-500 mt-2">↑ 14.5% vs last month</p></div>
                  <div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Order Volume</p><p className="text-3xl text-white">{orders.length}</p><p className="text-[10px] text-green-500 mt-2">↑ 8.2% vs last month</p></div>
                  <div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Conversion Rate</p><p className="text-3xl text-[#8A2BE2]">3.8%</p><p className="text-[10px] text-red-500 mt-2">↓ 0.4% vs last month</p></div>
                  <div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Cart Abandonment</p><p className="text-3xl text-white">64%</p><p className="text-[10px] text-gray-500 mt-2">Stable</p></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-[#0A0A0A] border border-[#333] p-6">
                    <h3 className="font-bold uppercase text-xs text-white border-b border-[#333] pb-3 mb-6">Sales Performance (7 Days)</h3>
                    <div className="h-48 flex items-end justify-between gap-2 px-2">
                      {[40, 70, 45, 90, 60, 100, 85].map((val, i) => (
                        <div key={i} className="w-full bg-[#333] relative group hover:bg-[#8A2BE2] transition-colors" style={{ height: `${val}%` }}>
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100">₹{val}k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#333] p-6">
                    <h3 className="font-bold uppercase text-xs text-white border-b border-[#333] pb-3 mb-4">Live Activity Feed</h3>
                    <div className="space-y-4">
                      {orders.slice(0,4).map(o => (
                        <div key={o.id} className="flex items-center gap-4 text-xs"><div className="w-2 h-2 rounded-full bg-[#CCFF00]"></div><div className="flex-1"><p className="text-gray-300">Payment of <span className="text-[#CCFF00]">₹{o.total}</span> received.</p></div><div className="text-gray-600">Just now</div></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminView === 'orders' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">Fulfillment Tracking</h2><p className="text-xs text-gray-500 mt-1">Manage orders and shipping logistics</p></div>
                </div>
                <div className="bg-[#0A0A0A] border border-[#333] overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#111] text-gray-400 uppercase">
                      <tr><th className="p-4 border-b border-[#333]">Order ID</th><th className="p-4 border-b border-[#333]">Customer</th><th className="p-4 border-b border-[#333]">Value</th><th className="p-4 border-b border-[#333]">Date</th><th className="p-4 border-b border-[#333]">Status</th><th className="p-4 border-b border-[#333]">Action</th></tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {orders.map(o => (
                        <tr key={o.id} className="border-b border-[#333] hover:bg-[#111] transition-colors">
                          <td className="p-4 font-bold text-white">#{o.id.slice(0,8)}</td>
                          <td className="p-4">{o.userEmail}</td>
                          <td className="p-4 text-[#CCFF00]">₹{o.total}</td>
                          <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="p-4"><span className={`px-2 py-1 text-[9px] font-bold uppercase ${o.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' : o.status === 'SHIPPED' ? 'bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/30' : 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30'}`}>{o.status}</span></td>
                          <td className="p-4"><select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="bg-black border border-[#333] text-white text-[10px] p-2 outline-none focus:border-[#CCFF00] cursor-pointer"><option value="PENDING">MARK PENDING</option><option value="SHIPPED">MARK SHIPPED</option><option value="DELIVERED">MARK DELIVERED</option></select></td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">NO ORDER DATA FOUND IN SYSTEM.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminView === 'inventory' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">Inventory Alerts</h2><p className="text-xs text-gray-500 mt-1">Real-time stock monitoring</p></div>
                </div>
                <div className="bg-[#0A0A0A] border border-[#333] overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#111] text-gray-400 uppercase">
                      <tr><th className="p-4 border-b border-[#333]">Product</th><th className="p-4 border-b border-[#333]">SKU</th><th className="p-4 border-b border-[#333]">Stock Level</th><th className="p-4 border-b border-[#333]">Status</th><th className="p-4 border-b border-[#333]">Action</th></tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-[#333] hover:bg-[#111] transition-colors">
                          <td className="p-4 flex items-center gap-3"><img src={p.image} className="w-8 h-8 object-cover grayscale" /><span className="font-bold text-white">{p.name}</span></td>
                          <td className="p-4 text-gray-500">DRK-{p.id}00</td>
                          <td className={`p-4 font-bold text-lg ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-yellow-500' : 'text-green-500'}`}>{p.stock}</td>
                          <td className="p-4">{p.stock === 0 ? <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-1 uppercase">Out of Stock</span> : p.stock < 5 ? <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1 uppercase">Low Alert</span> : <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-1 uppercase">Healthy</span>}</td>
                          <td className="p-4"><button className="bg-[#333] text-white px-3 py-1 text-[10px] hover:bg-white hover:text-black">Update Stock</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminView === 'crm' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">Customer Relations</h2><p className="text-xs text-gray-500 mt-1">Manage user accounts and history</p></div>
                  <div className="bg-black border border-[#333] flex items-center px-3"><Search size={14} className="text-gray-500"/><input type="text" placeholder="Search email..." className="bg-transparent p-2 text-xs text-white outline-none w-48"/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-[#0A0A0A] border border-[#333] p-5">
                      <div className="flex items-center gap-3 border-b border-[#333] pb-3 mb-3"><div className="w-10 h-10 bg-[#111] border border-[#333] flex items-center justify-center font-bold text-white">U{i}</div><div><p className="text-sm font-bold text-white uppercase">USER_00{i}</p><p className="text-[10px] text-gray-500">user{i}@cyber.net</p></div></div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Total Spent:</span><span className="text-[#CCFF00]">₹{(Math.random() * 20000).toFixed(0)}</span></div>
                      <div className="flex justify-between text-xs mb-4"><span className="text-gray-500">Orders:</span><span className="text-white">{Math.floor(Math.random() * 5) + 1}</span></div>
                      <button className="w-full text-center border border-[#333] py-2 text-[10px] uppercase text-gray-400 hover:text-white hover:bg-[#333]">View Full Profile</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminView === 'marketing' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">Marketing & Promos</h2><p className="text-xs text-gray-500 mt-1">Voucher codes and auto-apply rules</p></div>
                  <button className="bg-[#8A2BE2] text-white text-xs font-bold px-4 py-2 uppercase flex items-center gap-2"><Plus size={14}/> Generate Code</button>
                </div>
                <div className="bg-[#0A0A0A] border border-[#333] overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#111] text-gray-400 uppercase">
                      <tr><th className="p-4 border-b border-[#333]">Voucher Code</th><th className="p-4 border-b border-[#333]">Discount</th><th className="p-4 border-b border-[#333]">Usage</th><th className="p-4 border-b border-[#333]">Status</th><th className="p-4 border-b border-[#333]">Action</th></tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr className="border-b border-[#333] hover:bg-[#111] transition-colors"><td className="p-4 font-black text-white text-lg">NEON20</td><td className="p-4 text-[#CCFF00]">20% OFF</td><td className="p-4 text-gray-500">142 / 500</td><td className="p-4"><span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-1 uppercase">Active</span></td><td className="p-4"><button className="text-red-500 uppercase text-[10px] font-bold">Revoke</button></td></tr>
                      <tr className="border-b border-[#333] hover:bg-[#111] transition-colors"><td className="p-4 font-black text-white text-lg">WELCOME</td><td className="p-4 text-[#CCFF00]">₹500 FLAT</td><td className="p-4 text-gray-500">892 / ∞</td><td className="p-4"><span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-1 uppercase">Active</span></td><td className="p-4"><button className="text-red-500 uppercase text-[10px] font-bold">Revoke</button></td></tr>
                      <tr className="border-b border-[#333] hover:bg-[#111] transition-colors"><td className="p-4 font-black text-gray-500 text-lg line-through">CYBERMONDAY</td><td className="p-4 text-gray-500">50% OFF</td><td className="p-4 text-gray-500">500 / 500</td><td className="p-4"><span className="text-[9px] bg-gray-500/10 text-gray-500 border border-gray-500/30 px-2 py-1 uppercase">Expired</span></td><td className="p-4">--</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminView === 'rbac' && (
              <div className="animate-in fade-in max-w-2xl">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">RBAC Security</h2><p className="text-xs text-gray-500 mt-1">Role-Based Access Control & Logs</p></div>
                </div>
                <div className="bg-[#0A0A0A] border border-[#333] p-6 mb-6">
                  <h3 className="text-sm font-bold text-white uppercase mb-4 border-b border-[#333] pb-2">Admin Roles</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-[#111] border border-[#333] p-3"><span className="font-bold text-[#CCFF00]">MASTER ADMIN</span><span className="text-gray-500">Full System Access</span></div>
                    <div className="flex justify-between items-center bg-[#111] border border-[#333] p-3"><span className="font-bold text-white">SUPPORT AGENT</span><span className="text-gray-500">Orders & CRM Only</span></div>
                    <div className="flex justify-between items-center bg-[#111] border border-[#333] p-3"><span className="font-bold text-white">INVENTORY CLERK</span><span className="text-gray-500">Products & Inventory Only</span></div>
                  </div>
                </div>
                <div className="bg-[#0A0A0A] border border-[#333] p-6">
                  <h3 className="text-sm font-bold text-white uppercase mb-4 border-b border-[#333] pb-2 flex items-center justify-between">Audit Logs <span className="text-[10px] font-normal text-red-500 bg-red-500/10 px-2 py-1 border border-red-500/30">IMMUTABLE</span></h3>
                  <div className="space-y-2 text-[10px] font-mono text-gray-400">
                    <p>[SYS] 02:45:11 - MASTER ADMIN updated order #f8a92b status to SHIPPED.</p>
                    <p>[SYS] 01:12:05 - INVENTORY CLERK updated stock for DRK-200.</p>
                    <p className="text-red-500">[SEC] 00:05:32 - Failed login attempt detected from IP 192.168.1.45</p>
                    <p>[SYS] 23:44:19 - SUPPORT AGENT viewed profile USER_004.</p>
                  </div>
                </div>
              </div>
            )}

            {adminView === 'products' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                  <div><h2 className="text-2xl font-black uppercase text-white">Product & Catalog</h2><p className="text-xs text-gray-500 mt-1">Add, edit, or delete store items</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="border border-[#333] border-dashed flex flex-col items-center justify-center p-8 cursor-pointer hover:border-[#CCFF00] hover:text-[#CCFF00] text-gray-500 transition-colors bg-[#0A0A0A]"><Plus size={32} className="mb-2" /><span className="uppercase text-xs font-bold">Inject Product</span></div>
                  {products.map(p => (
                    <div key={p.id} className="bg-[#0A0A0A] border border-[#333] flex flex-col group relative">
                      <img src={p.image} className="h-40 w-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all" />
                      <div className="p-4 flex-1 flex flex-col"><h4 className="font-bold text-white uppercase text-xs">{p.name}</h4><p className="text-[10px] text-gray-500 mb-2">{p.category}</p><p className="text-[#CCFF00] mt-auto text-sm font-bold">₹{p.price}</p></div>
                      <button onClick={()=>setProducts(products.filter(pr => pr.id !== p.id))} className="absolute top-2 right-2 bg-red-500 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  };
  
  const LogOut = ({size}) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

  const renderContent = () => {
    if (selectedProduct) return <ProductDetail />;
    switch(view) {
      case 'home': return <Home />;
      case 'shop': return <Shop />;
      case 'account': return <Account />;
      case 'auth': return <AuthView />;
      case 'checkout': return <CheckoutView />;
      case 'vault': return <Vault />;
      case 'admin': return <AdminPanel />;
      default: return <Home />;
    }
  };

  const renderFooter = () => {
    if (view === 'admin') return null;
    return (
      <footer className={`${theme.bg} border-t ${theme.border} py-12 px-4 mt-20 transition-colors duration-1000`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Join The Underground</h2>
            <p className={`font-mono text-xs mb-6 max-w-sm ${theme.textMuted}`}>No spam. Only restock alerts and secret drops via WhatsApp.</p>
            <div className="flex">
              <input type="text" placeholder="+91 99999 99999" className={`bg-transparent border p-3 font-mono outline-none w-64 ${theme.input}`} />
              <button className={`font-bold px-6 uppercase transition-colors ${theme.btnPrimary}`}>Join</button>
            </div>
          </div>
          <div className={`text-left md:text-right font-mono text-[10px] space-y-2 ${theme.textMuted}`}>
            <p className="text-gray-400 text-xs tracking-[0.2em] uppercase mb-4">Darkside - Embrace the light.</p>
            <p>© 2026 DARKSIDE CLOTHING INDIA.</p>
            <p>DESIGNED FOR THE DYSTOPIA.</p>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className={`${theme.bg} ${theme.text} selection:bg-[#8A2BE2] selection:text-white min-h-screen cursor-none transition-colors duration-1000 ease-in-out`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap');
        body { font-family: 'JetBrains Mono', monospace; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-display { font-family: 'Oswald', sans-serif; letter-spacing: -0.02em; }
        html { scroll-behavior: smooth; }
        @keyframes pan-bg { 0% { transform: scale(1) translate(0px, 0px); } 50% { transform: scale(1.05) translate(-10px, -10px); } 100% { transform: scale(1) translate(0px, 0px); } }
        .animate-pan-bg { animation: pan-bg 20s ease-in-out infinite; }
        @keyframes reveal { 0% { opacity: 0; transform: translateY(30px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-reveal-1 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-reveal-2 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; }
        .animate-reveal-3 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; }
        .animate-reveal-4 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards; }
        @keyframes scan-line { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan-line { animation: scan-line 6s linear infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-25%); } }
        .animate-marquee { animation: marquee 12s linear infinite; width: fit-content; }
        .glitch-hover { position: relative; }
        .glitch-hover:hover::before, .glitch-hover:hover::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; }
        .glitch-hover:hover::before { left: 2px; text-shadow: -1px 0 #CCFF00; animation: glitch-anim-1 2s infinite linear alternate-reverse; }
        .glitch-hover:hover::after { left: -2px; text-shadow: -1px 0 #8A2BE2; animation: glitch-anim-2 3s infinite linear alternate-reverse; }
        @keyframes glitch-anim-1 { 0% { clip-path: inset(20% 0 80% 0); } 20% { clip-path: inset(60% 0 10% 0); } 40% { clip-path: inset(40% 0 50% 0); } 60% { clip-path: inset(80% 0 5% 0); } 80% { clip-path: inset(10% 0 70% 0); } 100% { clip-path: inset(30% 0 20% 0); } }
        @keyframes glitch-anim-2 { 0% { clip-path: inset(10% 0 60% 0); } 20% { clip-path: inset(80% 0 5% 0); } 40% { clip-path: inset(30% 0 20% 0); } 60% { clip-path: inset(70% 0 10% 0); } 80% { clip-path: inset(20% 0 50% 0); } 100% { clip-path: inset(50% 0 30% 0); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${isLight ? '#f3f4f6' : '#050505'}; }
        ::-webkit-scrollbar-thumb { background: ${isLight ? '#d1d5db' : '#222'}; }
        ::-webkit-scrollbar-thumb:hover { background: #8A2BE2; }
      `}</style>

      {/* BLINDING FLASH OVERLAY */}
      <div className={`fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-500 ease-in-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

      {view !== 'admin' && <CustomCursor />}
      <Navbar />
      <main className="relative z-10">{renderContent()}</main>

      {showSizeAI && <SizePredictor />}
      {showVibeMatcher && <VibeMatcher />}

      {/* SLIDE OUT CART */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setIsCartOpen(false)}></div>
          <div className={`w-full max-w-md ${isLight ? 'bg-white' : 'bg-[#050505]'} h-full border-l ${theme.border} flex flex-col relative z-10 transform transition-transform duration-300`}>
            <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
              <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Cart ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className={`${theme.textMuted} hover:${theme.text}`}><X size={24} /></button>
            </div>
            <div className={`p-4 ${theme.card} border-b ${theme.border}`}>
               <p className={`text-xs font-mono mb-2 ${theme.textMuted}`}>{progressToFreeShipping >= 100 ? "UNLOCKED: FREE PAN-INDIA SHIPPING" : `ADD ₹${freeShippingThreshold - cartTotal} MORE FOR FREE DELIVERY`}</p>
               <div className={`w-full h-1 ${isLight ? 'bg-gray-300' : 'bg-gray-800'} rounded-full overflow-hidden`}><div className="h-full bg-[#8A2BE2] transition-all duration-500" style={{ width: `${progressToFreeShipping}%` }}></div></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map((item, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className={`w-20 h-24 border ${theme.border} overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-gray-900'}`}><img src={item.image} className="w-full h-full object-cover grayscale" /></div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div><h4 className={`text-sm font-bold uppercase ${theme.text}`}>{item.name}</h4><p className={`font-mono text-[10px] mt-1 ${theme.textMuted}`}>SIZE: L // QTY: 1</p></div>
                    <div className="flex justify-between items-end"><span className={`font-mono font-bold ${theme.accent}`}>₹{item.price}</span><button onClick={() => removeFromCart(index)} className="text-gray-600 hover:text-red-500 text-xs font-bold uppercase underline">Remove</button></div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className={`text-center font-mono mt-10 ${theme.textMuted}`}>THE CART IS EMPTY.</p>}
            </div>
            <div className={`p-6 ${theme.card} border-t ${theme.border}`}>
              <div className={`flex justify-between font-mono mb-6 ${theme.text}`}><span className="uppercase">Subtotal</span><span className="font-bold text-xl">₹{cartTotal}</span></div>
              {checkoutMsg && <div className={`mb-4 p-3 border font-mono text-xs uppercase text-center animate-in fade-in duration-300 ${isLight ? 'bg-[#8A2BE2]/10 border-[#8A2BE2] text-[#8A2BE2]' : 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]'}`}>{checkoutMsg}</div>}
              <button disabled={cart.length === 0} onClick={() => { if (!user || user.isAnonymous) { setCheckoutMsg("ERROR: SAVED DETAILS REQUIRED. LOGIN OR USE STANDARD CHECKOUT."); return; } setCheckoutMsg("UPI INTENT SECURED. AWAITING PAYMENT GATEWAY..."); setTimeout(() => { setCart([]); saveUserData([], wishlist); setCheckoutMsg(""); setIsCartOpen(false); handleNavigate('account'); }, 3000); }} className={`w-full font-black py-4 uppercase tracking-widest text-lg flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme.btnPrimary}`}>
                <Smartphone size={20} /> FAST PAY VIA UPI
              </button>
              <button disabled={cart.length === 0} onClick={() => { setIsCartOpen(false); setCheckoutMsg(""); handleNavigate('checkout'); }} className={`w-full border font-bold py-3 uppercase tracking-widest text-sm disabled:opacity-50 transition-colors ${theme.border} ${theme.text} hover:bg-gray-200`}>Standard Checkout</button>
            </div>
          </div>
        </div>
      )}

      {renderFooter()}
    </div>
  );
}