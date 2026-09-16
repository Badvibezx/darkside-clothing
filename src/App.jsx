import React, { useState, useEffect } from 'react';
import darksideLogo from './assets/darkside-logo.png';
import { 
  ShoppingBag, Heart, Search, Menu, X, 
  User, Zap, Crosshair, Smartphone, ChevronRight,
  ShieldCheck, Truck, Fingerprint, Sparkles, Loader2,
  LayoutDashboard, Package, Users, Activity, Plus, Trash2,
  Box, Tag, AlertTriangle, MessageSquare, Lock,
  ArrowLeft, Star, Ruler, ChevronDown, ChevronUp, RefreshCw,
  AlertOctagon, CheckCircle, HelpCircle, Mail, MapPin, Settings as SettingsIcon, LogOut as LogOutIcon
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  RecaptchaVerifier, signInWithPhoneNumber, updateProfile, sendEmailVerification, sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- FIREBASE INITIALIZATION ---
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
const storage = getStorage(app);

// Sanitize appId to ensure legal Firestore path hierarchy
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'darkside-app';
const appId = String(rawAppId).replace(/\//g, '_');

// --- INITIAL DATABASE ---
const INITIAL_PRODUCTS = [
  { id: 1, name: "VOID WALKER CARGO", price: 3499, category: "Bottoms", stock: 12, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", badge: "HIGH DEMAND", fitBlock: "relaxed-cargo" },
  { id: 2, name: "CYBER-DOGMA HOODIE", price: 4299, category: "Outerwear", stock: 4, image: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&q=80&w=800", badge: "FEW LEFT", fitBlock: "oversized-hoodie" },
  { id: 3, name: "ACID WASH TEE V.2", price: 1899, category: "Tops", stock: 45, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800", fitBlock: "oversized-boxy-tee" },
  { id: 4, name: "NEON SYNDICATE JACKET", price: 5999, category: "Outerwear", stock: 2, image: "https://images.unsplash.com/photo-1551028919-ac66e624ec6a?auto=format&fit=crop&q=80&w=800", badge: "NEW DROP", fitBlock: "oversized-jacket" },
  { id: 5, name: "SYSTEM FAILURE BEANIE", price: 999, category: "Hardware", stock: 0, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800", fitBlock: null },
  { id: 6, name: "STEALTH TACTICAL VEST", price: 4599, category: "Outerwear", stock: 8, image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800", fitBlock: "oversized-jacket" },
];

const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';

const callGeminiAPI = async (prompt, schema = null) => {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key missing. Set VITE_GEMINI_API_KEY in production.");
    throw new Error("AI stylist is not configured.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
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

// --- ISOLATED UTILITY COMPONENTS ---
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
      className="hidden md:flex fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[99999] mix-blend-difference transition-transform duration-100 ease-out items-center justify-center"
      style={{ transform: `translate(${mousePos.x - 12}px, ${mousePos.y - 12}px) scale(${isHoveringItem ? 2.5 : 1})`, backgroundColor: isHoveringItem ? 'transparent' : '#A6FF3D', border: isHoveringItem ? '1px solid #A6FF3D' : 'none' }}
    >
      {isHoveringItem && <span className="text-[4px] font-mono text-[#A6FF3D] font-bold">EXPLORE</span>}
    </div>
  );
};

const DEFAULT_SETTINGS = {
  heroHeadline: 'THE SYNDICATE COLLECTION',
  heroSubline: 'Darkside — Embrace the light.',
  heroNotice: 'GOING TO BE LIVE SOON',
  timerEnabled: false,
  timerEndsAt: '',
  timerLabel: 'EXCLUSIVE DROP RELEASING IN',
  marqueeText: '✦ DARKSIDE - EMBRACE THE LIGHT ✦ 100% HEAVYWEIGHT COTTON ✦ FREE SHIPPING PAN-INDIA ✦ CASH ON DELIVERY AVAILABLE ✦ NOT MADE FOR EVERYONE',
  freeShippingThreshold: 5000,
  shippingFee: 150,
  codEnabled: true,
  storeOpen: true,
  storeClosedMessage: 'Restocking. Back shortly.'
};

const CountdownTimer = ({ endsAt, onExpire }) => {
  const calc = () => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (isNaN(diff) || diff <= 0) return null;
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000)
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);

  useEffect(() => {
    setTimeLeft(calc());
    const timer = setInterval(() => {
      const next = calc();
      setTimeLeft(next);
      if (!next) { clearInterval(timer); if (onExpire) onExpire(); }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!timeLeft) return null;

  const units = [
    ...(timeLeft.d > 0 ? [{ label: 'DAYS', value: timeLeft.d }] : []),
    { label: 'HRS', value: timeLeft.h },
    { label: 'MIN', value: timeLeft.m },
    { label: 'SEC', value: timeLeft.s }
  ];

  return (
    <div className="flex justify-center gap-3 md:gap-4 mb-8 font-mono">
      {units.map((t, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-3xl md:text-6xl text-white font-black bg-[#0A0A0A] border border-white/10 p-3 md:p-4 w-16 md:w-24 text-center">{String(t.value).padStart(2, '0')}</span>
          <span className="text-[10px] text-gray-500 mt-2">{t.label}</span>
        </div>
      ))}
    </div>
  );
};

const SizePredictor = ({ appState }) => {
  const { theme, isLight, setShowSizeAI } = appState;
  const [height, setHeight] = useState(''); 
  const [weight, setWeight] = useState(''); 
  const [fit, setFit] = useState('OVERSIZED (STREET)'); 
  const [loading, setLoading] = useState(false); 
  const [result, setResult] = useState('');

  const handleCalculate = async () => {
    if (!height || !weight) return; 
    setLoading(true); 
    setResult('');
    try { 
      setResult(await callGeminiAPI(`Calculate optimal clothing size (S, M, L, XL) for: ${height}cm, ${weight}kg, style: ${fit}. Return ONLY size on line 1, edgy cyberpunk styling tip on line 2.`)); 
    } catch (err) { 
      setResult("SYSTEM ERROR: UNABLE TO CONNECT TO NEURAL NET."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`${isLight ? 'bg-white border-black/20' : 'bg-[#0A0A0A] border-[#A6FF3D]/30'} border w-full max-w-md p-6 relative`}>
        <button onClick={() => setShowSizeAI(false)} className={`absolute top-4 right-4 ${theme.textMuted} hover:${theme.text}`}><X size={20} /></button>
        <div className="flex items-center gap-2 mb-6"><Fingerprint className="text-[#C7CDD1]" /><h3 className={`text-xl font-bold uppercase tracking-wider ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>AI Fit Predictor</h3></div>
        {result ? (
          <div className="space-y-4 font-mono text-sm animate-in fade-in zoom-in duration-500">
             <div className={`p-4 border ${isLight ? 'border-[#C7CDD1] bg-[#C7CDD1]/10 text-[#C7CDD1]' : 'border-[#A6FF3D] bg-[#A6FF3D]/10 text-[#A6FF3D]'}`}><p className="font-bold mb-2 uppercase">ANALYSIS COMPLETE:</p>{result.split('\n').map((line, i) => (<p key={i} className={i === 0 ? "text-2xl font-black mb-2" : `text-xs ${theme.textMuted}`}>{line}</p>))}</div>
             <button onClick={() => setShowSizeAI(false)} className={`w-full font-bold py-3 uppercase transition-colors ${theme.btnPrimary}`}>Acknowledge & Return</button>
          </div>
        ) : (
          <>
            <p className={`font-mono text-xs mb-6 ${theme.textMuted}`}>ENTER BIOMETRICS FOR EXACT SIZING VIA NEURAL NET.</p>
            <div className="space-y-4 font-mono text-sm">
              <div><label className={`block mb-1 ${theme.accent}`}>HEIGHT (CM)</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 175" className={`w-full p-3 outline-none transition-colors ${theme.input}`} /></div>
              <div><label className={`block mb-1 ${theme.accent}`}>WEIGHT (KG)</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" className={`w-full p-3 outline-none transition-colors ${theme.input}`} /></div>
              <div><label className={`block mb-1 ${theme.accent}`}>FIT PREFERENCE</label><select value={fit} onChange={e => setFit(e.target.value)} className={`w-full p-3 outline-none appearance-none cursor-pointer transition-colors ${theme.input}`}><option>OVERSIZED (STREET)</option><option>REGULAR (CLEAN)</option><option>SNUG (AERO)</option></select></div>
              <button onClick={handleCalculate} disabled={loading || !height || !weight} className={`w-full text-black font-bold py-4 mt-4 uppercase disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{loading ? "CALCULATING..." : "PREDICT FIT"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const VibeMatcher = ({ appState }) => {
  const { theme, isLight, setShowVibeMatcher, products, openProduct } = appState;
  const [scenario, setScenario] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [recommendations, setRecommendations] = useState(null);

  const handleMatch = async () => {
    if (!scenario) return; 
    setLoading(true);
    try {
      const catalogContext = products.map(p => `{id: ${p.id}, name: "${p.name}"}`).join(', ');
      const jsonText = await callGeminiAPI(`Scenario: "${scenario}". Pick 2 exact products matching vibe: [${catalogContext}].`, { type: "OBJECT", properties: { items: { type: "ARRAY", items: { type: "INTEGER" } }, reasoning: { type: "STRING" } }, required: ["items", "reasoning"] });
      const data = JSON.parse(jsonText);
      setRecommendations({ products: data.items.map(id => products.find(p => p.id === id)).filter(Boolean), reasoning: data.reasoning });
    } catch (err) { 
      setRecommendations({ error: "NEURAL LINK SEVERED. TRY AGAIN." }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`${isLight ? 'bg-white' : 'bg-[#0A0A0A]'} border border-[#C7CDD1]/50 w-full max-w-2xl p-6 relative`}>
        <button onClick={() => setShowVibeMatcher(false)} className={`absolute top-4 right-4 ${theme.textMuted} hover:${theme.text}`}><X size={20} /></button>
        <div className="flex items-center gap-2 mb-2"><Sparkles className="text-[#C7CDD1]" /><h3 className={`text-2xl font-black uppercase tracking-wider ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>AI Vibe Matcher</h3></div>
        <p className={`font-mono text-xs mb-6 ${theme.textMuted}`}>DESCRIBE YOUR DESTINATION. THE NEURAL NET WILL FORGE YOUR OUTFIT.</p>
        {!recommendations ? (
          <div className="space-y-4 font-mono">
             <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="e.g., Underground techno warehouse rave..." className={`w-full p-4 outline-none h-32 resize-none transition-colors ${theme.input}`} />
             <button onClick={handleMatch} disabled={loading || !scenario} className={`w-full font-bold py-4 uppercase transition-colors disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}{loading ? "SCANNING CATALOG..." : "GENERATE FIT"}
              </button>
          </div>
        ) : recommendations.error ? ( 
          <p className="text-red-500 font-mono text-center py-8">{recommendations.error}</p> 
        ) : (
          <div className="animate-in fade-in duration-500">
             <div className={`p-4 border-l-4 border-[#C7CDD1] bg-[#C7CDD1]/10 mb-6 font-mono text-sm italic ${theme.text}`}>"{recommendations.reasoning}"</div>
             <div className="grid grid-cols-2 gap-4 mb-6">
               {recommendations.products.map((p, idx) => (
                 p ? <div key={p.id || idx} className={`border p-2 flex gap-3 ${theme.border} ${theme.card}`}><img src={p.image} className="w-16 h-20 object-cover grayscale" /><div className="flex flex-col justify-center"><p className={`font-bold text-xs uppercase ${theme.text}`}>{p.name}</p><p className={`font-mono text-xs mt-1 ${theme.accent}`}>₹{p.price}</p><button onClick={() => { setShowVibeMatcher(false); openProduct(p); }} className="text-left text-[#C7CDD1] text-[10px] font-mono uppercase mt-2 hover:underline">View & Select Size</button></div></div> : null
               ))}
             </div>
             <button onClick={() => setRecommendations(null)} className={`w-full border font-bold py-3 uppercase font-mono text-sm transition-colors ${theme.border} ${theme.text} hover:bg-white/10`}>Reset Vibe</button>
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = ({ appState }) => {
  const { view, theme, isLight, handleNavigate, isMobileMenuOpen, setIsMobileMenuOpen, setShopCategory, user, wishlist, setIsCartOpen, cart } = appState;
  if (view === 'admin' || view === 'profile-setup') return null;
  return (
    <nav className={`fixed top-0 w-full z-50 ${isLight ? 'bg-white/90 border-black/10' : 'bg-[#050505]/80 border-white/10'} backdrop-blur-lg border-b transition-colors duration-1000`}>
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Menu className={`md:hidden cursor-pointer ${isLight ? 'text-black hover:text-[#C7CDD1]' : 'text-white hover:text-[#A6FF3D]'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <div onClick={() => handleNavigate('home')} className="cursor-pointer relative z-50 flex items-center group">
            <img src={darksideLogo} alt="Darkside" className="h-14 md:h-16 object-contain group-hover:scale-105 transition-transform" />
            <h1 className={`hidden text-3xl font-black tracking-tighter cursor-pointer uppercase glitch-hover ${isLight ? 'text-black' : 'text-white'}`} style={{ fontFamily: "'Anton', sans-serif" }}>DARK<span className={isLight ? 'text-[#C7CDD1]' : 'text-[#A6FF3D]'}>SIDE</span></h1>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          {['Tees', 'Hoodies', 'Cargos'].map(link => (
            <button key={link} onClick={() => { setShopCategory(link === 'Tees' ? 'Tops' : link === 'Hoodies' ? 'Outerwear' : 'Bottoms'); handleNavigate('shop'); }} className={`text-sm font-mono uppercase tracking-widest transition-colors magnetic ${isLight ? 'text-gray-600 hover:text-black' : 'text-[#E5E5E5] hover:text-[#A6FF3D]'}`}>{link}</button>
          ))}
        </div>
        <div className="flex items-center gap-5 md:gap-6">
          <Search className={`cursor-pointer hidden md:block w-5 h-5 ${theme.text} ${theme.accentHover}`} onClick={() => handleNavigate('shop')} />
          <div className="cursor-pointer" onClick={() => handleNavigate(user && !user.isAnonymous ? 'account' : 'auth')}>
            <User className={`w-5 h-5 ${theme.text} ${theme.accentHover}`} />
          </div>
          <div className="relative cursor-pointer hidden md:block" onClick={() => handleNavigate('vault')}>
            <Heart className={`w-5 h-5 ${theme.text} hover:text-[#C7CDD1]`} />
            {wishlist.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#C7CDD1] text-black text-[10px] font-bold flex items-center justify-center rounded-full">{wishlist.length}</span>}
          </div>
          <div className="relative cursor-pointer" onClick={() => { setIsCartOpen(true); setIsMobileMenuOpen(false); }}>
            <ShoppingBag className={`w-5 h-5 ${theme.text} hover:text-[#C7CDD1]`} />
            {cart.length > 0 && <span className={`absolute -top-2 -right-2 w-4 h-4 ${isLight ? 'bg-black text-white' : 'bg-[#A6FF3D] text-black'} text-[10px] font-bold flex items-center justify-center rounded-full`}>{cart.length}</span>}
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b p-4 flex flex-col gap-4 absolute top-20 left-0 w-full z-40 ${isLight ? 'bg-white border-black/10' : 'bg-[#0A0A0A] border-white/10'}`}>
          {['Home', 'Shop', 'Vault', 'Help & FAQs', user && !user.isAnonymous ? 'Account' : 'Login'].map(link => (
            <button key={link} onClick={() => { 
                if (link === 'Help & FAQs') handleNavigate('help');
                else if (link === 'Login') handleNavigate('auth');
                else { setShopCategory('All Categories'); handleNavigate(link.toLowerCase()); }
            }} className={`text-left font-mono uppercase py-2 border-b ${isLight ? 'text-black border-black/5 hover:text-[#C7CDD1]' : 'text-white border-white/5 hover:text-[#A6FF3D]'}`}>{link}</button>
          ))}
        </div>
      )}
    </nav>
  );
};

const AuthView = ({ appState }) => {
  const { theme, isLight, handleNavigate } = appState;
  const [authMode, setAuthMode] = useState('email'); 
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Clean up Recaptcha instances safely on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (err) {
          console.warn("Recaptcha verifier teardown:", err);
        }
      }
    };
  }, []);
  
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) setPhone(val);
  };

  const navigateAfterAuth = async (userObj) => {
    try {
      const adminDoc = await getDoc(doc(db, 'artifacts', appId, 'admins', userObj.uid));
      if (adminDoc.exists()) {
        handleNavigate('admin');
        return;
      }
    } catch (e) {
      console.warn("Admin validation error:", e);
    }
    if (!userObj.displayName) {
      handleNavigate('profile-setup');
    } else {
      handleNavigate('account');
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return setError("IDENTIFIER FAILED: Must be exactly 10 digits.");
    setError(''); setLoading(true);
    try {
      if (!window.recaptchaVerifier) { 
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' }); 
      }
      const formatPhone = "+91" + phone;
      const confirmationResult = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
    } catch (err) {
      console.error("SMS Error", err);
      if (err.code === 'auth/billing-not-enabled') setError("SMS FAILED: Firebase Blaze Plan required. Add number to 'Testing Numbers' in console.");
      else setError(`SMS FAILED: ${err.message}`);
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("INVALID OTP FORMAT.");
    setError(''); setLoading(true);
    try { 
      const result = await window.confirmationResult.confirm(otp);
      await navigateAfterAuth(result.user);
    } catch (err) { 
      setError("INVALID OTP. ACCESS DENIED."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { 
      if (isSignup) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        try { await sendEmailVerification(result.user); setVerificationNotice(true); } catch (vErr) { console.warn("Verification email failed:", vErr); }
        await navigateAfterAuth(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await navigateAfterAuth(result.user);
      }
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email above first, then tap 'Forgot password?'"); return; }
    setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="pt-32 px-4 max-w-md mx-auto min-h-screen">
      <div className={`${theme.card} border ${theme.border} p-8 relative overflow-hidden`}>
        <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Join The Syndicate</h2>
        <p className={`font-mono text-xs mb-8 ${theme.textMuted}`}>AUTHENTICATE VIA SECURE TERMINAL.</p>
        {verificationNotice && <p className="text-[#A6FF3D] font-mono text-xs mb-4 p-2 bg-[#A6FF3D]/10 border border-[#A6FF3D]/30 flex items-center gap-2"><Mail size={14}/> Verification email sent — check your inbox.</p>}
        {resetSent && <p className="text-[#A6FF3D] font-mono text-xs mb-4 p-2 bg-[#A6FF3D]/10 border border-[#A6FF3D]/30 flex items-center gap-2"><Mail size={14}/> Password reset link sent — check your inbox.</p>}
        {error && <p className="text-red-500 font-mono text-xs mb-4 p-2 bg-red-500/10 border border-red-500/30 flex items-center gap-2"><AlertOctagon size={14}/> {error}</p>}
        <div id="recaptcha-container"></div>
        {authMode === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4 font-mono text-sm animate-in fade-in">
            <div><label className={`block mb-1 font-bold ${theme.accent}`}>EMAIL IDENTIFIER</label><input type="email" value={email} onChange={e=>{setEmail(e.target.value); setResetSent(false);}} required className={`w-full p-3 outline-none ${theme.input}`} /></div>
            <div><label className={`block mb-1 font-bold ${theme.accent}`}>PASSCODE</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} className={`w-full p-3 outline-none ${theme.input}`} /></div>
            {!isSignup && <button type="button" onClick={handleForgotPassword} className={`text-xs hover:underline ${theme.textMuted}`}>Forgot password?</button>}
            <button disabled={loading} type="submit" className={`w-full font-black py-4 mt-2 uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={18} /> : (isSignup ? "Create Identity" : "Initialize Login")}</button>
            <div className="flex justify-between items-center mt-4"><button type="button" onClick={() => setIsSignup(!isSignup)} className={`text-xs hover:underline ${theme.textMuted}`}>{isSignup ? "Have an account?" : "Need an account?"}</button><button type="button" onClick={() => setAuthMode('phone')} className={`text-xs hover:underline ${theme.textMuted} flex items-center gap-1`}><Smartphone size={12}/> Use Phone Instead</button></div>
          </form>
        )}
        {authMode === 'phone' && (
          !otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4 font-mono text-sm animate-in fade-in">
              <div><label className={`block mb-1 font-bold ${theme.accent}`}>PHONE NUMBER (10 DIGITS)</label><div className="flex items-center"><span className={`p-3 border border-r-0 ${isLight ? 'bg-gray-200 border-black/20 text-gray-500' : 'bg-gray-900 border-white/20 text-gray-500'}`}>+91</span><input type="text" value={phone} onChange={handlePhoneChange} placeholder="9999999999" required className={`w-full p-3 outline-none ${theme.input}`} /></div></div>
              <button disabled={loading || phone.length !== 10} type="submit" className={`w-full font-black py-4 mt-4 uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />} GET OTP</button>
              <button type="button" onClick={() => setAuthMode('email')} className={`w-full text-center text-xs mt-4 hover:underline ${theme.textMuted} flex justify-center items-center gap-1`}><Mail size={12}/> Switch to Email Login</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4 font-mono text-sm animate-in fade-in">
              <div className={`p-3 text-xs mb-4 border ${isLight ? 'bg-green-100 border-green-500 text-green-700' : 'bg-green-900/30 border-green-500 text-green-400'}`}>OTP successfully dispatched to +91 {phone}.</div>
              <div><label className={`block mb-1 font-bold ${theme.accent}`}>ENTER 6-DIGIT OTP</label><input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="• • • • • •" required className={`w-full p-3 tracking-[1em] text-center font-bold text-xl outline-none ${theme.input}`} /></div>
              <button disabled={loading || otp.length !== 6} type="submit" className={`w-full font-black py-4 mt-4 uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={18} /> : <Fingerprint size={18} />} VERIFY & ENTER</button>
              <button type="button" onClick={() => setOtpSent(false)} className={`w-full text-center text-xs mt-2 hover:underline ${theme.textMuted}`}>Change Phone Number</button>
            </form>
          )
        )}
      </div>
    </div>
  );
};

const ProfileSetup = ({ appState }) => {
  const { handleNavigate, setUser, theme } = appState;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!auth.currentUser) { setError("Session expired. Please log in again."); return; }
    setLoading(true);
    setError('');
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser(prev => ({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        phoneNumber: auth.currentUser.phoneNumber,
        isAnonymous: auth.currentUser.isAnonymous,
        displayName: name
      }));
      handleNavigate('account');
    } catch (err) { 
      console.error(err); 
      setError(err.message || "Failed to update profile. Please try again.");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#333] p-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white" style={{ fontFamily: "'Anton', sans-serif" }}>Identify Yourself</h2>
        <p className="font-mono text-xs mb-8 text-gray-400">WHAT SHOULD WE CALL YOU?</p>
        {error && <p className="text-red-500 font-mono text-xs mb-4 p-2 bg-red-500/10 border border-red-500/30">{error}</p>}
        <form onSubmit={handleSaveProfile} className="space-y-6 font-mono text-sm">
          <div><label className="block mb-2 font-bold text-[#A6FF3D]">NAME *</label><input type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name..." className="w-full p-4 bg-black border border-[#333] text-white focus:border-[#A6FF3D] outline-none" /></div>
          <button disabled={loading || !name.trim()} type="submit" className="w-full bg-[#A6FF3D] text-black font-black py-4 uppercase tracking-widest disabled:opacity-50 hover:bg-white transition-colors">{loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Continue"}</button>
          <button type="button" onClick={() => handleNavigate('account')} className="w-full text-center text-xs text-gray-500 hover:text-white uppercase tracking-widest">Skip for now</button>
        </form>
      </div>
    </div>
  );
};

const Account = ({ appState }) => {
  const { theme, isLight, user, setUser, handleNavigate, wishlist } = appState;
  const [activeTab, setActiveTab] = useState('menu');
  const [myOrders, setMyOrders] = useState([]);
  const [addrForm, setAddrForm] = useState({ address: '', city: '', state: '', pin: '' });
  const [savedAddr, setSavedAddr] = useState(null);
  const [updateName, setUpdateName] = useState(user?.displayName || '');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [givenFeedback, setGivenFeedback] = useState({});

  useEffect(() => {
    let unsubOrders;
    if (user && !user.isAnonymous) {
      unsubOrders = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), where('userId', '==', user.uid)), (snap) => {
         const userOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
         setMyOrders(userOrders);
      }, (err) => console.error("Account orders fetch error:", err));

      getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'fitFeedback'), where('userId', '==', user.uid))).then(snap => {
         const given = {};
         snap.docs.forEach(d => { given[d.id] = true; });
         setGivenFeedback(given);
      }).catch(err => console.error(err));
    }
    if (user) {
      getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state')).then(docSnap => {
         if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.savedAddress) { setSavedAddr(data.savedAddress); setAddrForm(data.savedAddress); }
            if (data.heightCm) setHeightCm(data.heightCm);
            if (data.weightKg) setWeightKg(data.weightKg);
         }
      }).catch(err => console.error(err));
    }
    return () => { if (unsubOrders) unsubOrders(); };
  }, [user, activeTab]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), { savedAddress: addrForm }, { merge: true }); 
      setSavedAddr(addrForm); 
      alert("Coordinates Saved."); 
    } catch (err) { 
      alert("Failed to save address."); 
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!updateName) return;
    if (!auth.currentUser) { alert("Session expired. Please log in again."); return; }
    try {
      await updateProfile(auth.currentUser, { displayName: updateName });
      setUser(prev => ({ ...prev, displayName: updateName }));
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), { heightCm: heightCm || null, weightKg: weightKg || null }, { merge: true });
      alert("Profile Update Complete."); 
      setActiveTab('menu');
    } catch(err) { 
      alert("Update Failed: " + (err.message || "unknown error")); 
    }
  };

  const handleFitFeedback = async (order, item, fit) => {
    const feedbackId = `${order.id}_${item.cartItemId || item.id}`;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'fitFeedback', feedbackId), {
        userId: user.uid, productId: item.id, productName: item.name, fitBlock: item.fitBlock || null, size: item.selectedSize || null,
        fit, heightCm: heightCm || null, weightKg: weightKg || null, createdAt: new Date().toISOString()
      });
      setGivenFeedback(prev => ({ ...prev, [feedbackId]: true }));
    } catch (err) { 
      console.error(err); 
      alert("Couldn't save your feedback, please try again."); 
    }
  };

  const handleLogout = () => { signOut(auth).then(() => handleNavigate('home')); };

  if (activeTab === 'menu') {
    return (
      <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen pb-20 font-mono">
        <h2 className={`text-4xl font-black uppercase tracking-tighter mb-8 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Account</h2>
        
        <div className={`${theme.card} border ${theme.border} p-6 flex items-center gap-6 mb-8 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[#A6FF3D]/40 shadow-[0_0_15px_#A6FF3D] animate-scan-line pointer-events-none z-10"></div>
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-black text-3xl md:text-4xl ${isLight ? 'bg-black text-white' : 'bg-[#A6FF3D] text-black'}`}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
          </div>
          <div>
            <h3 className={`text-xl md:text-2xl font-bold uppercase ${theme.text}`}>{user?.displayName || 'OPERATIVE'}</h3>
            <p className={`text-xs md:text-sm mt-1 ${theme.textMuted}`}>{user?.email || user?.phoneNumber}</p>
            <p className="inline-block mt-3 text-[#C7CDD1] text-[10px] md:text-xs font-bold bg-[#C7CDD1]/10 px-3 py-1 rounded-full border border-[#C7CDD1]/30">
              {user?.isAnonymous ? 'GUEST TIER' : 'INSIDER TIER'}
            </p>
          </div>
        </div>

        {user?.email && user?.emailVerified === false && (
          <div className="mb-6 p-4 border border-[#D4B876]/40 bg-[#D4B876]/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="text-xs text-[#D4B876] flex items-center gap-2"><AlertTriangle size={14} className="shrink-0" /> Your email isn't verified yet.</p>
            <button onClick={async () => {
                try { await sendEmailVerification(auth.currentUser); alert("Verification email sent."); }
                catch (e) { alert("Couldn't send right now. Try again in a minute."); }
              }} className="text-[10px] font-bold uppercase tracking-widest underline text-[#D4B876] hover:text-white text-left md:text-right">
              Resend verification email
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'orders', icon: Package, label: 'My Orders',
              value: myOrders.length === 0 ? 'No orders yet' : `${myOrders.length} order${myOrders.length > 1 ? 's' : ''}`,
              sub: myOrders.length > 0 ? `Latest: ${myOrders[0].status}` : 'Track and review past drops' },
            { id: 'addresses', icon: MapPin, label: 'Saved Address',
              value: savedAddr ? `${savedAddr.city}, ${savedAddr.state}` : 'None saved',
              sub: savedAddr ? `PIN ${savedAddr.pin}` : 'Add one for faster checkout' },
            { id: 'settings', icon: SettingsIcon, label: 'Profile Details',
              value: user?.displayName || 'Unnamed',
              sub: heightCm && weightKg ? `${heightCm}cm · ${weightKg}kg` : 'Add height & weight for size help' },
            { id: 'vault', icon: Heart, label: 'The Vault',
              value: wishlist.length === 0 ? 'Empty' : `${wishlist.length} saved`,
              sub: 'Pieces you bookmarked' },
          ].map(tile => (
            <button key={tile.id}
              onClick={() => tile.id === 'vault' ? handleNavigate('vault') : setActiveTab(tile.id)}
              className={`${theme.card} border ${theme.border} p-5 text-left hover:border-[#A6FF3D] hover:shadow-[0_0_20px_rgba(166,255,61,0.08)] transition-all group flex items-center justify-between gap-4`}>
              <div className="flex items-start gap-4 min-w-0">
                <tile.icon className="text-[#A6FF3D] shrink-0 mt-0.5" size={20} />
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-widest mb-1 ${theme.textMuted}`}>{tile.label}</p>
                  <p className={`font-bold truncate ${theme.text}`}>{tile.value}</p>
                  <p className={`text-[11px] mt-1 truncate ${theme.textMuted}`}>{tile.sub}</p>
                </div>
              </div>
              <ChevronRight size={16} className={`shrink-0 ${theme.textMuted} group-hover:text-[#A6FF3D] group-hover:translate-x-1 transition-all`} />
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className={`w-full mt-4 border ${theme.border} p-4 text-center text-red-500 text-xs font-bold uppercase tracking-widest hover:border-red-500 hover:bg-red-500/5 transition-colors flex items-center justify-center gap-2`}>
          <LogOutIcon size={14} /> Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen pb-20 font-mono">
      <button onClick={() => setActiveTab('menu')} className={`${theme.textMuted} hover:${theme.text} text-xs mb-8 flex items-center gap-2 uppercase tracking-widest transition-colors`}>
         <ArrowLeft size={16} /> Back to Account Menu
      </button>

      <div className={`${theme.card} border ${theme.border} p-6 md:p-10 min-h-[500px]`}>
        {activeTab === 'orders' && (
          <div className="animate-in fade-in">
             <h3 className={`font-black text-2xl uppercase tracking-tighter mb-8 border-b ${theme.border} pb-4 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Transmissions & Orders</h3>
             {myOrders.length === 0 ? (
                <div className="text-center py-20"><p className={`text-sm ${theme.textMuted}`}>NO TRANSMISSION HISTORY DETECTED.</p><button onClick={() => handleNavigate('shop')} className={`mt-6 font-bold px-8 py-3 uppercase tracking-widest transition-colors ${theme.btnPrimary}`}>Enter Shop</button></div>
             ) : (
                <div className="space-y-6">
                   {myOrders.map(order => (
                      <div key={order.id} className={`border ${theme.border} p-4 md:p-6 flex flex-col gap-4 bg-${isLight ? 'white' : 'black'}`}>
                         <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div>
                               <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2 py-1 text-[10px] font-bold uppercase ${order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' : order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-600 border border-green-500/30' : 'bg-[#C7CDD1]/20 text-[#C7CDD1] border border-[#C7CDD1]/30'}`}>{order.status}</span>
                                  <span className={`text-xs ${theme.textMuted}`}>{new Date(order.createdAt).toLocaleDateString()}</span>
                               </div>
                               <p className={`text-xs mb-1 ${theme.textMuted}`}>ORDER ID: <span className={theme.text}>#{order.id.slice(0,10)}</span></p>
                               <p className={`font-bold text-lg ${theme.accent}`}>₹{order.total}</p>
                            </div>
                            <div className="flex -space-x-4">
                               {order.items.slice(0,3).map((item, idx) => (<img key={idx} src={item.image} className={`w-12 h-16 object-cover border-2 ${theme.card} rounded-sm grayscale hover:grayscale-0 transition-all`} title={item.name}/>))}
                               {order.items.length > 3 && <div className={`w-12 h-16 flex items-center justify-center border-2 ${theme.card} bg-gray-800 text-white text-xs font-bold`}>+{order.items.length - 3}</div>}
                            </div>
                         </div>
                         {order.status === 'DELIVERED' && order.items.filter(item => !givenFeedback[`${order.id}_${item.cartItemId || item.id}`]).length > 0 && (
                            <div className={`border-t pt-4 ${theme.border}`}>
                               <p className={`text-[10px] uppercase font-bold mb-3 ${theme.textMuted}`}>How did the fit feel? Helps us refine sizing.</p>
                               {order.items.filter(item => !givenFeedback[`${order.id}_${item.cartItemId || item.id}`]).map((item, idx) => (
                                  <div key={idx} className="flex flex-wrap items-center gap-3 mb-2 text-xs">
                                     <span className={theme.text}>{item.name} (Size {item.selectedSize || 'N/A'})</span>
                                     <div className="flex gap-2">
                                        {['Too Tight', 'True to Size', 'Loose'].map(f => (
                                           <button key={f} onClick={() => handleFitFeedback(order, item, f)} className={`px-3 py-1.5 border text-[10px] font-bold uppercase transition-colors ${isLight ? 'border-black/20 hover:border-black' : 'border-white/20 hover:border-[#A6FF3D] hover:text-[#A6FF3D]'}`}>{f}</button>
                                        ))}
                                     </div>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             )}
          </div>
        )}
        
        {activeTab === 'addresses' && (
          <div className="animate-in fade-in max-w-xl mx-auto">
             <h3 className={`font-black text-2xl uppercase tracking-tighter mb-8 border-b ${theme.border} pb-4 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Default Coordinates</h3>
             {savedAddr && (
                <div className={`p-5 mb-8 border-l-4 border-[#C7CDD1] bg-[#C7CDD1]/10 text-sm ${theme.text}`}>
                   <p className="font-bold text-[#C7CDD1] mb-2 uppercase flex items-center gap-2"><CheckCircle size={16}/> Active Coordinates</p>
                   <p>{savedAddr.address}</p>
                   <p>{savedAddr.city}, {savedAddr.state} - {savedAddr.pin}</p>
                </div>
             )}
             <form onSubmit={handleSaveAddress} className="space-y-4 text-sm">
                <div><label className={`block mb-1 font-bold ${theme.accent}`}>STREET ADDRESS</label><input required value={addrForm.address} onChange={e=>setAddrForm({...addrForm, address: e.target.value})} className={`w-full p-4 outline-none ${theme.input}`} /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className={`block mb-1 font-bold ${theme.accent}`}>CITY</label><input required value={addrForm.city} onChange={e=>setAddrForm({...addrForm, city: e.target.value})} className={`w-full p-4 outline-none ${theme.input}`} /></div><div><label className={`block mb-1 font-bold ${theme.accent}`}>STATE</label><input required value={addrForm.state} onChange={e=>setAddrForm({...addrForm, state: e.target.value})} className={`w-full p-4 outline-none ${theme.input}`} /></div></div>
                <div><label className={`block mb-1 font-bold ${theme.accent}`}>PINCODE</label><input required value={addrForm.pin} onChange={e=>setAddrForm({...addrForm, pin: e.target.value.replace(/\D/g, '').slice(0,6)})} className={`w-full p-4 outline-none ${theme.input}`} /></div>
                <button type="submit" className={`w-full font-bold py-4 uppercase tracking-widest mt-4 ${theme.btnPrimary}`}>Update Coordinates</button>
             </form>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="animate-in fade-in max-w-xl mx-auto">
             <h3 className={`font-black text-2xl uppercase tracking-tighter mb-8 border-b ${theme.border} pb-4 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Profile Details</h3>
             <form onSubmit={handleUpdateProfile} className="space-y-6 text-sm">
                <div><label className={`block mb-2 font-bold ${theme.accent}`}>NAME</label><input required value={updateName} onChange={e=>setUpdateName(e.target.value)} className={`w-full p-4 outline-none ${theme.input}`} /></div>
                {(user?.phoneNumber || user?.email) && (
                   <div>
                      <label className={`block mb-2 font-bold ${theme.accent}`}>{user?.phoneNumber ? 'PHONE NUMBER' : 'EMAIL'}</label>
                      <div className={`w-full p-4 opacity-60 ${theme.input}`}>{user?.phoneNumber || user?.email}</div>
                   </div>
                )}
                <div>
                   <label className={`block mb-2 font-bold ${theme.accent}`}>HEIGHT & WEIGHT <span className={`font-normal normal-case ${theme.textMuted}`}>(optional — used to predict your size)</span></label>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" min="0" value={heightCm} onChange={e=>setHeightCm(e.target.value)} placeholder="Height (cm)" className={`w-full p-4 outline-none ${theme.input}`} />
                      <input type="number" min="0" value={weightKg} onChange={e=>setWeightKg(e.target.value)} placeholder="Weight (kg)" className={`w-full p-4 outline-none ${theme.input}`} />
                   </div>
                </div>
                <button type="submit" className={`w-full font-bold py-4 uppercase tracking-widest ${theme.btnPrimary}`}>Save Profile Changes</button>
             </form>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckoutView = ({ appState }) => {
  const { theme, isLight, user, cart, cartTotal, freeShippingThreshold, shippingFee, setCart, saveUserData, wishlist, handleNavigate, settings } = appState;
  const [formData, setFormData] = useState({ name: '', address: '', city: '', state: '', pin: '', phone: '' });
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fetchingCity, setFetchingCity] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [orderError, setOrderError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState(null);

  useEffect(() => {
    if (user) {
       setFormData(prev => ({ 
         ...prev, 
         name: user.displayName || '', 
         phone: user.phoneNumber ? user.phoneNumber.replace('+91', '') : '' 
       }));
       getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state')).then(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({ ...prev, ...(data.savedAddress || {}), phone: prev.phone || data.phone || '' }));
          }
       }).catch(e => console.error(e));
    }
  }, [user]);

  const handlePhoneChange = (e) => { 
    const val = e.target.value.replace(/\D/g, '').slice(0, 10); 
    setFormData(prev => ({ ...prev, phone: val })); 
    setFieldErrors(prev => ({ ...prev, phone: null })); 
  };

  const handlePinChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pin: val }));
    setFieldErrors(prev => ({ ...prev, pin: null }));
    if (val.length === 6) {
      setFetchingCity(true);
      try { 
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`); 
        const data = await res.json(); 
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.[0]) { 
          const po = data[0].PostOffice[0]; 
          setFormData(prev => ({ ...prev, city: po.District || prev.city, state: po.State || prev.state })); 
        } 
      } catch (e) { 
        console.warn("Postal API unavailable; fallback to manual input enabled:", e); 
      } finally { 
        setFetchingCity(false); 
      }
    }
  };

  const orderTotal = cartTotal > freeShippingThreshold ? cartTotal : cartTotal + shippingFee;

  const handlePlaceOrder = async (e) => { 
    e.preventDefault(); 
    if (!user || user.isAnonymous) { setOrderError("Please sign in before placing an order."); return; }
    if (user.email && user.emailVerified === false) { setOrderError("Please verify your email before placing an order — check your inbox, or resend from your Account page."); return; }
    if (settings.storeOpen === false) { setOrderError(settings.storeClosedMessage || "The store is closed right now."); return; }
    const errors = {};
    if (formData.phone.length !== 10) errors.phone = "Phone must be exactly 10 digits.";
    if (formData.pin.length !== 6) errors.pin = "Pincode must be exactly 6 digits.";
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.address.trim()) errors.address = "Address is required.";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({}); setOrderError('');
    setProcessing(true); 
    try {
      // The server recalculates price, discount and shipping from the database.
      // Nothing the browser sends about money is trusted.
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, selectedSize: i.selectedSize, name: i.name })),
          shippingInfo: formData,
          paymentMode,
          promoCode: appliedPromo || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place the order.");

      setConfirmedTotal(data.total);

      // Remember this address + phone for next time - no separate manual save needed.
      try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), {
          savedAddress: { address: formData.address, city: formData.city, state: formData.state, pin: formData.pin },
          phone: formData.phone
        }, { merge: true });
      } catch (saveErr) { console.warn("Couldn't save address for next time:", saveErr); }

      setCart([]); 
      saveUserData([], wishlist); 
      setProcessing(false); 
      setShowSuccessModal(true); 
    } catch (err) { 
      console.error("Order failed", err); 
      setOrderError(err.message || "Something went wrong. Please try again.");
      setProcessing(false); 
    }
  };

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center p-4">
        <div className="bg-[#0A0A0A] border border-[#A6FF3D]/40 shadow-[0_0_40px_rgba(166,255,61,0.1)] w-full max-w-lg p-8 relative flex flex-col items-center text-center animate-in">
          <div className="w-20 h-20 rounded-full bg-[#A6FF3D]/10 flex items-center justify-center mb-6"><CheckCircle size={40} className="text-[#A6FF3D]" /></div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2" style={{ fontFamily: "'Anton', sans-serif" }}>Order Secured</h2>
          <p className="font-mono text-sm text-[#A6FF3D] mb-2 tracking-widest">TRANSMISSION SUCCESSFUL</p>
          {confirmedTotal !== null && <p className="font-mono text-xs text-gray-400 mb-6">Charged: <span className="text-white font-bold">₹{confirmedTotal}</span></p>}
          <div className="bg-[#D4B876]/10 border border-[#D4B876]/30 p-5 mb-8 text-left"><h3 className="text-[#D4B876] font-bold uppercase text-sm mb-2 flex items-center gap-2"><Lock size={16}/> Mandatory Protocol</h3><p className="font-mono text-xs text-gray-300 leading-relaxed">To protect transit security, you <span className="text-white font-bold underline">MUST</span> record a continuous unboxing video when your drop arrives. <br/><br/>Claims for damaged or missing pieces require unedited raw video evidence.</p></div>
          <button onClick={() => { setShowSuccessModal(false); handleNavigate('account'); }} className="w-full bg-white text-black font-black py-4 uppercase tracking-widest hover:bg-[#A6FF3D] transition-colors">I Acknowledge & Understand</button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) return (
    <div className="pt-32 px-4 max-w-4xl mx-auto min-h-screen text-center animate-in"><h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Secure Checkout</h2><p className={`font-mono text-sm mb-6 ${theme.textMuted}`}>YOUR CART IS EMPTY.</p><button onClick={() => handleNavigate('shop')} className={`font-bold px-8 py-3 uppercase tracking-widest transition-colors ${theme.btnPrimary}`}>Back to Catalog</button></div>
  );

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen pb-20">
      <div className="flex items-center justify-between mb-8 opacity-0 animate-reveal-1">
        <h2 className={`text-4xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Secure Checkout</h2>
        <button onClick={() => handleNavigate('shop')} className={`hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-widest ${theme.textMuted} hover:${theme.text} transition-colors`}><ArrowLeft size={14} /> Edit Cart</button>
      </div>
      <div className="flex items-center gap-3 mb-10 font-mono text-xs uppercase tracking-widest opacity-0 animate-reveal-1">
        <span className="flex items-center gap-2 text-[#A6FF3D]"><span className="w-6 h-6 rounded-full bg-[#A6FF3D] text-black flex items-center justify-center font-bold">1</span> Cart</span>
        <div className="w-8 h-px bg-[#A6FF3D]"></div>
        <span className="flex items-center gap-2 text-[#A6FF3D]"><span className="w-6 h-6 rounded-full bg-[#A6FF3D] text-black flex items-center justify-center font-bold">2</span> Details</span>
        <div className={`w-8 h-px ${theme.border}`}></div>
        <span className={`flex items-center gap-2 ${theme.textMuted}`}><span className={`w-6 h-6 rounded-full border ${theme.border} flex items-center justify-center font-bold`}>3</span> Confirmed</span>
      </div>
      <div className="grid md:grid-cols-2 gap-12">
        <div className={`${theme.card} border ${theme.border} p-6 h-fit md:sticky md:top-28 order-1 md:order-2 opacity-0 animate-reveal-2 relative overflow-hidden`}>
           <div className="absolute top-0 left-0 w-full h-[2px] bg-[#A6FF3D]/40 shadow-[0_0_15px_#A6FF3D] animate-scan-line pointer-events-none z-10"></div>
           <h3 className={`font-bold uppercase mb-6 border-b ${theme.border} pb-4 ${theme.text}`}>Order Summary</h3>
           <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
             {cart.map((item, idx) => (
               <div key={item.cartItemId || idx} className="flex gap-4"><img src={item.image} className={`w-16 h-20 object-cover grayscale border ${theme.border}`} /><div className="flex-1 flex flex-col justify-center"><p className={`text-xs font-bold uppercase ${theme.text}`}>{item.name}</p><p className={`font-mono text-[10px] ${theme.textMuted}`}>SIZE: {item.selectedSize || 'N/A'} · QTY: 1</p><p className={`font-mono text-xs mt-1 ${theme.accent}`}>₹{item.price}</p></div></div>
             ))}
           </div>
           <div className={`border-t ${theme.border} pt-4 space-y-2 font-mono text-sm`}>
             <div className={`flex justify-between ${theme.textMuted}`}><span>SUBTOTAL</span><span>₹{cartTotal}</span></div>
             <div className={`flex justify-between ${theme.textMuted}`}><span>SHIPPING</span><span>{cartTotal > freeShippingThreshold ? 'FREE' : `₹${shippingFee}`}</span></div>
             <div className={`flex justify-between font-bold text-lg pt-4 border-t ${theme.border} mt-2 ${theme.text}`}><span>TOTAL</span><span className={theme.accent}>₹{orderTotal}</span></div>
           </div>
        </div>
        <form onSubmit={handlePlaceOrder} className="space-y-8 order-2 md:order-1">
          <div className={`${theme.card} border ${theme.border} p-6 opacity-0 animate-reveal-2`}>
            <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>1. Shipping Coordinates</h3>
            <div className="space-y-4 font-mono text-sm">
              <div><input required placeholder="FULL NAME" value={formData.name} onChange={e=>{setFormData({...formData, name: e.target.value}); setFieldErrors(prev=>({...prev, name: null}));}} className={`w-full p-3 outline-none ${theme.input} ${fieldErrors.name ? 'border-red-500' : ''}`} />{fieldErrors.name && <p className="text-red-500 text-[10px] mt-1 uppercase">{fieldErrors.name}</p>}</div>
              <div><input required placeholder="PHONE NUMBER (10 DIGITS)" value={formData.phone} onChange={handlePhoneChange} className={`w-full p-3 outline-none ${theme.input} ${fieldErrors.phone ? 'border-red-500' : ''}`} />{fieldErrors.phone && <p className="text-red-500 text-[10px] mt-1 uppercase">{fieldErrors.phone}</p>}</div>
              <div><input required placeholder="STREET ADDRESS & HOUSE NO." value={formData.address} onChange={e=>{setFormData({...formData, address: e.target.value}); setFieldErrors(prev=>({...prev, address: null}));}} className={`w-full p-3 outline-none ${theme.input} ${fieldErrors.address ? 'border-red-500' : ''}`} />{fieldErrors.address && <p className="text-red-500 text-[10px] mt-1 uppercase">{fieldErrors.address}</p>}</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 relative"><input required placeholder="PINCODE" value={formData.pin} onChange={handlePinChange} className={`w-full p-3 outline-none ${theme.input} ${fieldErrors.pin ? 'border-red-500' : ''}`} />{fetchingCity && <Loader2 size={14} className={`absolute right-3 top-4 animate-spin ${theme.accent}`} />}{fieldErrors.pin && <p className="text-red-500 text-[10px] mt-1 uppercase">{fieldErrors.pin}</p>}</div>
                <input required placeholder="CITY" value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className={`col-span-1 w-full p-3 outline-none ${theme.input}`} />
                <input required placeholder="STATE" value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} className={`col-span-1 w-full p-3 outline-none ${theme.input}`} />
              </div>
            </div>
          </div>
          <div className={`${theme.card} border ${theme.border} p-6 opacity-0 animate-reveal-3`}>
            <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>2. Discount Code</h3>
            <div className="flex gap-2 font-mono text-sm">
              <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())} placeholder="ENTER CODE (OPTIONAL)" className={`flex-1 p-3 outline-none ${theme.input}`} />
              <button type="button" onClick={() => setAppliedPromo(promoInput.trim())} className={`px-6 font-bold uppercase text-xs ${theme.btnPrimary}`}>Apply</button>
            </div>
            {appliedPromo && <p className="text-[#A6FF3D] text-[10px] font-mono mt-3 uppercase flex items-center gap-2"><CheckCircle size={12}/> {appliedPromo} will be checked when you place the order.</p>}
          </div>
          <div className={`${theme.card} border ${theme.border} p-6 opacity-0 animate-reveal-3`}>
            <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>3. Payment Protocol</h3>
            <div className="space-y-3 font-mono text-sm">
              {['UPI', 'CREDIT/DEBIT CARD', ...(settings.codEnabled !== false ? ['CASH ON DELIVERY'] : [])].map(mode => (
                <label key={mode} className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${paymentMode === mode ? `border-[#A6FF3D] bg-[#A6FF3D]/10 shadow-[0_0_15px_rgba(166,255,61,0.1)]` : `${theme.border} hover:border-gray-500`}`}><input type="radio" name="payment" value={mode} checked={paymentMode === mode} onChange={(e) => setPaymentMode(e.target.value)} className="accent-[#A6FF3D]" /><span className={`uppercase font-bold ${theme.text}`}>{mode}</span></label>
              ))}
            </div>
          </div>
          {orderError && <p className="text-red-500 font-mono text-xs p-4 bg-red-500/10 border border-red-500/30 flex items-center gap-2"><AlertOctagon size={14} className="shrink-0"/> {orderError}</p>}
          <button disabled={processing} type="submit" className={`w-full font-black py-5 uppercase tracking-widest text-lg disabled:opacity-50 flex justify-center items-center transition-all relative overflow-hidden group opacity-0 animate-reveal-4 ${theme.btnPrimary} hover:shadow-[0_0_25px_rgba(166,255,61,0.35)]`}>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
            <span className="relative z-10">{processing ? <Loader2 className="animate-spin" size={24} /> : `PLACE ORDER • ₹${orderTotal}`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const HelpCenter = ({ appState }) => {
  const { theme, user } = appState;
  const [ticketMsg, setTicketMsg] = useState(''); 
  const [ticketSent, setTicketSent] = useState(false); 
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: "Where is my order?", a: "Once dispatched, you will receive a tracking ID. Pan-India deliveries arrive within 48-72 hours." }, 
    { q: "Do you offer returns?", a: "Yes, within 7 days. A raw, unedited unboxing video is strictly mandatory." }, 
    { q: "What does 'Heavyweight Cotton' mean?", a: "We run custom 240GSM to 400GSM cotton. It yields structured drapes that do not lose form." }, 
    { q: "Do you restock sold-out items?", a: "Drops are limited editions. Sign up for alerts to stay notified." }
  ];

  const handleSubmitTicket = async (e) => { 
    e.preventDefault(); 
    if (!ticketMsg.trim()) return; 
    try { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets'), { 
        userId: user?.uid || null, 
        userEmail: user?.displayName || (user?.email ? user.email.replace('@cyber.net', '') : 'Anonymous'), 
        message: ticketMsg, 
        status: 'OPEN', 
        createdAt: new Date().toISOString(), 
        reply: null 
      }); 
      setTicketSent(true); 
      setTicketMsg(''); 
    } catch (err) { 
      console.error(err); 
      alert("Failed to transmit."); 
    } 
  };

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen pb-20">
      <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Help & Transmissions</h2>
      <p className={`font-mono text-sm mb-12 ${theme.textMuted}`}>KNOWLEDGE BASE AND DIRECT COMM PROTOCOLS.</p>
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <h3 className={`font-bold uppercase tracking-widest text-sm mb-6 ${theme.text} flex items-center gap-2`}><HelpCircle size={16}/> Frequency Asked</h3>
          <div className="space-y-4">{faqs.map((faq, i) => (<div key={i} className={`border ${theme.border} ${theme.card}`}><button onClick={() => setOpenFaq(openFaq === i ? null : i)} className={`w-full text-left p-4 font-mono font-bold text-sm uppercase flex justify-between items-center ${theme.text}`}>{faq.q} {openFaq === i ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>{openFaq === i && <div className={`p-4 pt-0 text-sm font-mono leading-relaxed ${theme.textMuted}`}>{faq.a}</div>}</div>))}</div>
        </div>
        <div className={`${theme.card} border ${theme.border} p-6`}>
          <h3 className={`font-bold uppercase tracking-widest text-sm mb-6 ${theme.text} flex items-center gap-2`}><MessageSquare size={16}/> Direct Transmission</h3>
          {ticketSent ? (
            <div className="text-center py-8 animate-in fade-in"><CheckCircle size={48} className={`mx-auto mb-4 ${theme.accent}`} /><p className={`font-bold uppercase ${theme.text}`}>Message Received</p><p className={`font-mono text-xs mt-2 ${theme.textMuted}`}>Our operatives will review your transmission shortly.</p><button onClick={()=>setTicketSent(false)} className="mt-6 text-xs font-mono uppercase underline text-gray-500">Send Another</button></div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4 font-mono text-sm"><p className={`text-xs ${theme.textMuted} mb-4`}>Submit a direct request to the admin terminal. Replies will be routed to your account.</p><textarea required value={ticketMsg} onChange={e=>setTicketMsg(e.target.value)} placeholder="Describe your issue or inquiry..." className={`w-full p-4 outline-none h-32 resize-none ${theme.input}`}></textarea><button type="submit" className={`w-full font-black py-4 uppercase tracking-widest transition-colors ${theme.btnPrimary}`}>Transmit Message</button></form>
          )}
        </div>
      </div>
    </div>
  );
};

const TermsPage = ({ appState }) => {
  const { theme } = appState;
  const sections = [
    { title: "1. Who You're Buying From", body: "Darkside Clothing is operated as an independent, India-based apparel brand. [Add your registered business name and address here once finalized — required for consumer protection compliance in India]. For any queries, use the Help & Transmissions page or the contact details in Section 15." },
    { title: "2. Eligibility", body: "You must be at least 18 years old, or place orders with the involvement of a parent or guardian, to transact on this site. By placing an order, you confirm the information you provide is accurate and that you have the legal capacity to enter into this agreement." },
    { title: "3. Acceptance of Terms", body: "By accessing or placing an order on Darkside Clothing, you agree to be bound by these Terms & Conditions. If you do not agree, please refrain from using this site." },
    { title: "4. Products, Pricing & Errors", body: "All prices are listed in INR and may change without prior notice. Occasionally a product may be mispriced or its description may contain an error despite our best efforts. If this happens, we reserve the right to cancel the affected order and issue a full refund, even after payment has been confirmed. We may also limit the quantity of any item a single customer or address can order." },
    { title: "5. Order Acceptance & Cancellation", body: "Placing an order is an offer to buy, not a guaranteed sale. We reserve the right to refuse or cancel any order at our discretion — for example due to stock errors, suspected fraud, or a pricing mistake — before it ships. If we cancel your order, any payment collected will be refunded in full." },
    { title: "6. Sizing & Fit", body: "Sizing guidance (including AI-assisted predictions and verified-buyer fit data) is provided to help you choose, but exact fit can vary by individual. We are not liable for minor fit variations within normal manufacturing tolerances." },
    { title: "7. Shipping", body: "We aim to dispatch orders within the timeframes stated on the site (typically 48-72 hours pan-India), but delays may occur due to logistics partners, weather, or circumstances beyond our control." },
    { title: "8. Returns, Exchange & Unboxing Requirement", body: "Returns and exchanges are accepted within 7 days of delivery, subject to the process shown in your account. To process any claim for damaged, defective, or missing items, a clear, continuous, unedited unboxing video showing the sealed package being opened is required. Claims without this evidence may not be honored." },
    { title: "9. Refunds", body: "Approved refunds are issued either to your original payment method or as Darkside Wallet credit, depending on what you select during the return process. Processing times vary by bank/payment provider once we initiate the refund on our end." },
    { title: "10. Payments & Promo Codes", body: "We accept UPI, credit/debit cards, and Cash on Delivery where available. All transactions are processed securely; we do not store your full payment card details. Promo codes are single-use per account unless stated otherwise, cannot be combined unless explicitly allowed, have no cash value, and may be revoked at any time in cases of suspected abuse." },
    { title: "11. Intellectual Property", body: "All designs, graphics, logos, product names, and site content are the property of Darkside Clothing and may not be reproduced, copied, or used commercially without prior written permission." },
    { title: "12. Account & Conduct", body: "You are responsible for maintaining the confidentiality of your account credentials. Any misuse of promo codes, fraudulent orders, reselling of limited drops in a manner that violates these terms, or abusive conduct toward our team may result in account suspension and order cancellation." },
    { title: "13. Limitation of Liability", body: "To the extent permitted by law, Darkside Clothing is not liable for indirect, incidental, or consequential damages arising from use of this site or its products. Our total liability for any claim is limited to the amount you paid for the order in question." },
    { title: "14. Force Majeure", body: "We are not responsible for delays or failures in performance resulting from events beyond our reasonable control, including but not limited to natural disasters, courier or logistics disruptions, internet or payment gateway outages, or government action." },
    { title: "15. Grievance Officer & Contact", body: "In accordance with applicable Indian consumer protection regulations, complaints or concerns can be directed to our Grievance Officer: [Add name], reachable at [Add email/phone]. We aim to acknowledge complaints within 48 hours." },
    { title: "16. Governing Law", body: "These terms are governed by the laws of India. Any disputes arising from your use of this site will be subject to the exclusive jurisdiction of the courts of Delhi, India." },
    { title: "17. Changes to These Terms", body: "We may update these Terms & Conditions from time to time. Continued use of the site after changes constitutes acceptance of the revised terms." }
  ];
  return (
    <div className="pt-24 px-4 max-w-3xl mx-auto min-h-screen pb-20">
      <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Terms & Conditions</h2>
      <p className={`font-mono text-xs mb-4 ${theme.textMuted}`}>LAST UPDATED: 2026. PLEASE READ CAREFULLY BEFORE PLACING AN ORDER.</p>
      <div className="mb-10 p-4 border border-[#D4B876]/40 bg-[#D4B876]/10 text-xs font-mono text-gray-300 leading-relaxed">
        This is a starting template covering common early-stage gaps, not a substitute for legal advice. The bracketed placeholders (business name, address, grievance officer) need real details filled in, and a qualified professional should review this before you're at meaningful order volume — especially around Indian consumer protection and GST obligations.
      </div>
      <div className="space-y-8 font-mono text-sm">
        {sections.map((s, i) => (
          <div key={i}>
            <h3 className={`font-bold uppercase mb-2 ${theme.accent}`}>{s.title}</h3>
            <p className={`leading-relaxed ${theme.textMuted}`}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductDetail = ({ appState }) => {
  const { theme, isLight, selectedProduct, setShowSizeAI, addToCart, toggleWishlist, wishlist } = appState;
  const [activeTab, setActiveTab] = useState('desc');
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [fitStats, setFitStats] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [sizePopKey, setSizePopKey] = useState(0);
  const [wishlistPop, setWishlistPop] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const galleryImages = [selectedProduct.image, selectedProduct.image, selectedProduct.image];
  const isWishlisted = !!wishlist.find(i => i.id === selectedProduct.id);

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    addToCart(selectedProduct, selectedSize);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  };

  const handleSelectSize = (s) => {
    setSelectedSize(s);
    setSizeError(false);
    setSizePopKey(k => k + 1);
  };

  const handleToggleWishlist = () => {
    toggleWishlist(selectedProduct);
    setWishlistPop(true);
    setTimeout(() => setWishlistPop(false), 400);
  };

  useEffect(() => {
    setActiveImage(0);
    if (!selectedProduct || !selectedProduct.fitBlock) { setFitStats(null); return; }
    getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'fitFeedback'), where('fitBlock', '==', selectedProduct.fitBlock)))
      .then(snap => {
        if (snap.empty) { setFitStats(null); return; }
        const counts = { 'Too Tight': 0, 'True to Size': 0, 'Loose': 0 };
        snap.docs.forEach(d => { const f = d.data().fit; if (counts[f] !== undefined) counts[f]++; });
        const total = snap.size;
        setFitStats({ total, trueToSizePct: Math.round((counts['True to Size'] / total) * 100), counts });
      }).catch(err => console.error(err));
  }, [selectedProduct]);

  return (
    <div className="pt-24 pb-32 md:pb-12 px-4 max-w-7xl mx-auto min-h-screen">
       <div className={`font-mono text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2 ${theme.textMuted}`}>
          <button onClick={() => window.history.back()} className={`hover:${theme.text} flex items-center gap-1 transition-colors`}><ArrowLeft size={12} /> Catalog</button>
          <ChevronRight size={10} />
          <span className={theme.text}>{selectedProduct.category}</span>
       </div>
       <div className="grid md:grid-cols-2 gap-12 items-start">
         <div className="space-y-3 md:sticky md:top-24 animate-in">
           <div className={`aspect-[4/5] ${theme.card} border ${theme.border} relative overflow-hidden group w-full transition-shadow duration-500 hover:shadow-[0_0_30px_rgba(166,255,61,0.12)]`}>
              <img key={activeImage} src={galleryImages[activeImage]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-fade-swap" alt={selectedProduct.name} />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-[#A6FF3D]/40 shadow-[0_0_15px_#A6FF3D] animate-scan-line pointer-events-none z-10"></div>
              {selectedProduct.badge && <div className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1 uppercase tracking-widest animate-pulse ${isLight ? 'bg-black text-white' : 'bg-[#A6FF3D] text-black'}`}>{selectedProduct.badge}</div>}
              {selectedProduct.stock > 0 && selectedProduct.stock <= 5 && <div className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 uppercase tracking-widest bg-red-500 text-white flex items-center gap-1 animate-pulse"><AlertTriangle size={11} /> {selectedProduct.stock} left</div>}
           </div>
           <div className="grid grid-cols-3 gap-3 hidden md:grid">{galleryImages.map((img, i) => (<button key={i} onClick={() => setActiveImage(i)} className={`aspect-square ${theme.card} border overflow-hidden transition-colors ${activeImage === i ? (isLight ? 'border-black' : 'border-[#A6FF3D]') : `${theme.border} hover:border-gray-400`}`}><img src={img} className={`w-full h-full object-cover transition-opacity ${activeImage === i ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} /></button>))}</div>
         </div>
         <div className="flex flex-col animate-in" style={{ animationDelay: '0.08s' }}>
           <div className={`mb-6 border-b ${theme.border} pb-6`}>
              <div className="flex items-center gap-2 mb-3"><div className="flex text-[#C7CDD1] drop-shadow-sm">{[1,2,3,4,5].map(star => <Star key={star} size={14} fill="currentColor" />)}</div><span className={`text-xs font-mono ${theme.textMuted}`}>(128 Reviews)</span></div>
              <h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>{selectedProduct.name}</h1>
              <p className="text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A6FF3D] to-[#C7CDD1]">₹{selectedProduct.price}</p>
           </div>
           <div className="mb-8">
              <div className="flex justify-between items-center mb-4"><span className={`font-bold uppercase tracking-widest text-sm ${theme.text}`}>Select Size</span><button onClick={() => setShowSizeAI(true)} className="text-[#C7CDD1] flex items-center gap-2 font-mono text-xs hover:underline cursor-pointer"><Ruler size={14} /> Size Guide</button></div>
              <div className="grid grid-cols-4 gap-4">{SIZE_KEYS.map(s => {
                const sizeStock = selectedProduct.sizes ? (selectedProduct.sizes[s] ?? 0) : null;
                const soldOut = sizeStock !== null && sizeStock <= 0;
                return (
                <button key={s} onClick={() => !soldOut && handleSelectSize(s)} disabled={soldOut} title={soldOut ? 'Sold out' : undefined} className={`relative h-14 border font-mono text-lg transition-colors ${soldOut ? 'border-white/10 text-gray-700 cursor-not-allowed' : selectedSize === s ? `${sizePopKey > 0 ? 'animate-size-pop' : ''} ${isLight ? 'border-black bg-black text-white' : 'border-[#A6FF3D] bg-[#A6FF3D]/10 text-[#A6FF3D]'}` : (isLight ? 'border-black/20 text-black hover:border-black hover:bg-black/5' : 'border-white/20 text-white hover:border-[#A6FF3D] hover:text-[#A6FF3D]')}`}>
                  {s}
                  {soldOut && <span className="absolute inset-0 flex items-center justify-center"><span className="w-full h-px bg-white/20 rotate-[-20deg]"></span></span>}
                  {!soldOut && sizeStock !== null && sizeStock <= 3 && <span className="absolute -top-2 -right-1 text-[8px] bg-red-500 text-white px-1 font-bold">{sizeStock}</span>}
                </button>
                );
              })}</div>
              {sizeError && <p className="text-red-500 text-xs font-mono mt-3 uppercase animate-in">Please select a size to continue.</p>}
              {fitStats && fitStats.total >= 3 && (
                <p className={`text-xs font-mono mt-4 flex items-center gap-2 ${theme.textMuted}`}><ShieldCheck size={14} className="text-[#D4B876] shrink-0" /> {fitStats.trueToSizePct}% of {fitStats.total} verified buyers say this cut runs true to size</p>
              )}
           </div>
           <div className="hidden md:flex gap-4 mb-10">
              <button onClick={handleAddToCart} className={`flex-1 font-black py-5 uppercase tracking-[0.2em] text-sm transition-all ${theme.btnPrimary} relative overflow-hidden group hover:shadow-[0_0_25px_rgba(166,255,61,0.35)] ${addedFeedback ? 'animate-cart-success' : ''}`}>
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
                 <span className="relative z-10 flex items-center justify-center gap-2">{addedFeedback ? (<><CheckCircle size={18} /> Added to Cart</>) : (<><ShoppingBag size={18} /> Add To Cart</>)}</span>
              </button>
              <button onClick={handleToggleWishlist} className={`w-16 flex items-center justify-center border transition-colors ${isLight ? 'border-black/20 text-black hover:border-black' : 'border-white/20 text-white hover:border-[#C7CDD1]'}`}><Heart className={wishlistPop ? 'animate-wishlist-pop' : ''} fill={isWishlisted ? (isLight ? "#000" : "#C7CDD1") : "none"} /></button>
           </div>
           <div className="space-y-4">
              <div className={`border ${theme.border} ${theme.card}`}><button onClick={() => setActiveTab(activeTab === 'desc' ? '' : 'desc')} className="w-full flex justify-between items-center p-4 font-bold uppercase tracking-widest text-sm">Product Details {activeTab === 'desc' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>{activeTab === 'desc' && <div className={`p-4 pt-0 text-sm font-mono leading-relaxed animate-in ${theme.textMuted}`}>{selectedProduct.description || "Forged for the urban dystopia. This piece features advanced construction and heavyweight structural fabric."}<ul className="mt-4 space-y-2 text-xs"><li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#C7CDD1] rounded-full"></div> 100% Premium Heavyweight Cotton</li><li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#C7CDD1] rounded-full"></div> Oversized drop-shoulder fit</li></ul></div>}</div>
              <div className={`border ${theme.border} ${theme.card}`}><button onClick={() => setActiveTab(activeTab === 'ship' ? '' : 'ship')} className="w-full flex justify-between items-center p-4 font-bold uppercase tracking-widest text-sm">Shipping & Returns {activeTab === 'ship' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>{activeTab === 'ship' && <div className={`p-4 pt-0 text-xs font-mono space-y-3 animate-in ${theme.textMuted}`}><p className="flex items-center gap-2"><Truck size={14} className={theme.accent} /> Express Pan-India delivery within 48-72 hours.</p><p className="flex items-center gap-2"><RefreshCw size={14} className="text-[#C7CDD1]" /> 7-day returns. Mandatory unboxing video required.</p></div>}</div>
           </div>
         </div>
       </div>
       <div className={`fixed bottom-0 left-0 right-0 p-4 ${isLight ? 'bg-white/90 border-black/10' : 'bg-black/90 border-white/10'} backdrop-blur-md border-t md:hidden z-40 animate-slide-up-bar`}>
          <div className="flex gap-2">
             <button onClick={handleToggleWishlist} className={`w-14 flex items-center justify-center border transition-colors ${isLight ? 'border-black/20 text-black hover:border-black' : 'border-white/20 text-white hover:border-[#C7CDD1]'}`}><Heart className={wishlistPop ? 'animate-wishlist-pop' : ''} fill={isWishlisted ? (isLight ? "#000" : "#C7CDD1") : "none"} /></button>
             <button onClick={handleAddToCart} className={`flex-1 font-black py-4 uppercase tracking-widest flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(166,255,61,0.25)] ${theme.btnPrimary} ${addedFeedback ? 'animate-cart-success' : ''}`}>{addedFeedback ? (<><CheckCircle size={18} /> Added</>) : (<><ShoppingBag size={18} /> ₹{selectedProduct.price}</>)}</button>
          </div>
       </div>
    </div>
  );
};

const Shop = ({ appState }) => {
  const { theme, isLight, shopCategory, setShopCategory, products, setShowVibeMatcher, openProduct, categories } = appState;
  const [sortBy, setSortBy] = useState('recommended');
  let filteredProducts = shopCategory === 'All Categories' ? products : products.filter(p => p.category === shopCategory);
  if (sortBy === 'price-low') filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-high') filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);

  return (
    <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div><h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>{shopCategory === 'All Categories' ? 'The Collection' : shopCategory}</h2><p className={`font-mono text-xs mt-1 md:mt-2 uppercase tracking-widest ${theme.textMuted}`}>[{filteredProducts.length} Items Detected]</p></div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4"><button onClick={() => setShowVibeMatcher(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-[#C7CDD1]/10 text-[#C7CDD1] border border-[#C7CDD1]/30 px-4 py-2.5 font-mono text-xs uppercase hover:bg-[#C7CDD1] hover:text-black transition-all"><Sparkles size={14} /> AI Vibe Check</button><div className={`flex items-center border ${theme.border} px-3 py-2.5 flex-1 md:flex-none bg-transparent`}><span className={`text-[10px] uppercase font-bold mr-2 ${theme.textMuted}`}>Sort:</span><select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`bg-transparent font-mono text-xs uppercase outline-none cursor-pointer ${theme.text} w-full`}><option value="recommended" className="bg-black text-white">Recommended</option><option value="price-high" className="bg-black text-white">Price: High to Low</option><option value="price-low" className="bg-black text-white">Price: Low to High</option></select></div></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['All Categories', ...categories].map(cat => (<button key={cat} onClick={() => setShopCategory(cat)} className={`whitespace-nowrap px-6 py-2.5 font-mono text-xs font-bold uppercase border transition-colors ${shopCategory === cat ? (isLight ? 'bg-black text-white border-black' : 'bg-[#A6FF3D] text-black border-[#A6FF3D]') : `border-${isLight?'black/10':'white/10'} ${theme.textMuted} hover:${theme.text} hover:border-${isLight?'black':'white'}`}`}>{cat}</button>))}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {filteredProducts.map(product => {
        const soldOut = product.sizes && SIZE_KEYS.every(s => (product.sizes[s] || 0) <= 0);
        return (
        <div key={product.id} className="group cursor-pointer flex flex-col" onClick={() => openProduct(product)}>
          <div className={`relative aspect-[3/4] ${theme.card} overflow-hidden border ${isLight ? 'border-black/5 group-hover:border-black/50' : 'border-white/5 group-hover:border-[#A6FF3D]/50'} transition-colors mb-3`}><img src={product.image} alt={product.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${soldOut ? 'grayscale opacity-50' : ''}`} />{soldOut ? <div className="absolute top-2 left-2 md:top-4 md:left-4 text-[8px] md:text-[10px] font-bold px-2 py-1 uppercase bg-black text-white border border-white/30">Sold Out</div> : product.badge && <div className={`absolute top-2 left-2 md:top-4 md:left-4 text-[8px] md:text-[10px] font-bold px-2 py-1 uppercase mix-blend-screen ${isLight ? 'bg-black text-white' : 'bg-white text-black'}`}>{product.badge}</div>}<div className="absolute inset-0 bg-[#C7CDD1] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity hidden md:block"></div></div>
          <div className="flex flex-col flex-1"><h3 className={`font-bold uppercase tracking-tight text-[11px] md:text-sm mb-1 line-clamp-1 transition-colors ${theme.text} group-hover:text-[#C7CDD1]`}>{product.name}</h3><p className={`font-mono text-[9px] md:text-xs mb-2 ${theme.textMuted}`}>{product.category}</p><span className={`font-mono text-xs md:text-sm mt-auto ${isLight ? 'text-black font-extrabold' : 'text-[#E5E5E5] font-bold'}`}>₹{product.price}</span></div>
        </div>
        );
      })}
      </div>
    </div>
  );
};

const SIZE_KEYS = ['S', 'M', 'L', 'XL'];

const ProductForm = ({ existing, categories, promos, onClose }) => {
  const blank = {
    name: '', description: '', category: categories[0] || 'Tops',
    price: '', compareAtPrice: '', fitBlock: '', badge: '', image: '',
    sizes: { S: 0, M: 0, L: 0, XL: 0 },
    promoScope: 'all', promoCodes: []
  };
  const [form, setForm] = useState(existing ? { ...blank, ...existing, sizes: { ...blank.sizes, ...(existing.sizes || {}) } } : blank);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr("That file isn't an image."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("Image is over 5MB. Compress it first."); return; }
    setErr(''); setUploading(true);
    try {
      const path = `products/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const sref = storageRef(storage, path);
      await uploadBytes(sref, file);
      set('image', await getDownloadURL(sref));
    } catch (e2) {
      console.error(e2);
      setErr("Upload failed. Check that Firebase Storage is enabled.");
    } finally { setUploading(false); }
  };

  const totalStock = SIZE_KEYS.reduce((s, k) => s + (parseInt(form.sizes[k], 10) || 0), 0);

  const handleSave = async () => {
    if (!form.name.trim()) { setErr("Name is required."); return; }
    if (!form.price || parseInt(form.price, 10) <= 0) { setErr("Enter a valid price."); return; }
    if (!form.image) { setErr("Upload a product image."); return; }
    setErr(''); setSaving(true);
    const payload = {
      name: form.name.toUpperCase().trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseInt(form.price, 10),
      compareAtPrice: form.compareAtPrice ? parseInt(form.compareAtPrice, 10) : null,
      fitBlock: form.fitBlock.trim() || null,
      badge: form.badge.trim() || null,
      image: form.image,
      sizes: SIZE_KEYS.reduce((acc, k) => ({ ...acc, [k]: parseInt(form.sizes[k], 10) || 0 }), {}),
      promoScope: form.promoScope,
      promoCodes: form.promoScope === 'selected' ? form.promoCodes : [],
      updatedAt: new Date().toISOString()
    };
    try {
      if (existing?.id) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', existing.id), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), { ...payload, createdAt: new Date().toISOString() });
      }
      onClose();
    } catch (e2) {
      console.error(e2);
      setErr("Save failed. Check your Firestore rules allow admin writes to products.");
      setSaving(false);
    }
  };

  const field = "w-full p-3 bg-black border border-[#333] text-white text-xs outline-none focus:border-[#A6FF3D]";
  const label = "block text-[10px] uppercase tracking-widest text-gray-500 mb-2";

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm overflow-y-auto p-4 font-mono">
      <div className="max-w-3xl mx-auto bg-[#0A0A0A] border border-[#333] my-8">
        <div className="flex justify-between items-center p-5 border-b border-[#333] sticky top-0 bg-[#0A0A0A] z-10">
          <h3 className="text-lg font-black uppercase text-white">{existing ? 'Edit Product' : 'New Product'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          {err && <p className="text-red-500 text-xs p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2"><AlertOctagon size={14} /> {err}</p>}

          <div>
            <label className={label}>Product Image</label>
            <div className="flex gap-4 items-start">
              <div className="w-28 h-36 border border-[#333] bg-black flex items-center justify-center shrink-0 overflow-hidden">
                {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <Box size={20} className="text-gray-700" />}
              </div>
              <div className="flex-1">
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${uploading ? 'bg-[#333] text-gray-500' : 'bg-[#A6FF3D] text-black hover:bg-white'}`}>
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {uploading ? 'Uploading…' : form.image ? 'Replace Image' : 'Choose From Device'}
                  <input type="file" accept="image/*" onChange={handleImagePick} disabled={uploading} className="hidden" />
                </label>
                <p className="text-[10px] text-gray-600 mt-2">JPG or PNG, up to 5MB. Uploads straight from your phone or computer.</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div><label className={label}>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ACID WASH TEE V.2" className={field} /></div>
            <div><label className={label}>Category</label><select value={form.category} onChange={e => set('category', e.target.value)} className={field}>{categories.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}</select></div>
          </div>

          <div><label className={label}>Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="240GSM heavyweight cotton, oversized boxy fit, puff print front." className={`${field} resize-none`} /></div>

          <div className="grid md:grid-cols-3 gap-4">
            <div><label className={label}>Selling Price (₹)</label><input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1899" className={field} /></div>
            <div><label className={label}>Compare-at Price (₹)</label><input type="number" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="Optional" className={field} /><p className="text-[9px] text-gray-600 mt-1">Shown struck through</p></div>
            <div><label className={label}>Badge</label><input value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="NEW DROP" className={field} /></div>
          </div>

          <div>
            <label className={label}>Stock Per Size</label>
            <div className="grid grid-cols-4 gap-3">
              {SIZE_KEYS.map(s => (
                <div key={s}>
                  <p className="text-center text-xs text-white font-bold mb-1">{s}</p>
                  <input type="number" min="0" value={form.sizes[s]} onChange={e => set('sizes', { ...form.sizes, [s]: e.target.value })} className={`${field} text-center`} />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-2">Total: <span className="text-[#A6FF3D] font-bold">{totalStock}</span> pcs. A size set to 0 shows as sold out and can't be ordered.</p>
          </div>

          <div><label className={label}>Fit Block</label><input value={form.fitBlock} onChange={e => set('fitBlock', e.target.value)} placeholder="oversized-boxy-tee" className={field} /><p className="text-[9px] text-gray-600 mt-1">Same cut = same block, so fit feedback carries across drops.</p></div>

          <div>
            <label className={label}>Discount Codes</label>
            <div className="space-y-2">
              {[['all', 'All codes work on this product'], ['none', 'No codes — full price only'], ['selected', 'Only specific codes']].map(([val, text]) => (
                <label key={val} className={`flex items-center gap-3 p-3 border cursor-pointer text-xs ${form.promoScope === val ? 'border-[#A6FF3D] bg-[#A6FF3D]/10 text-[#A6FF3D]' : 'border-[#333] text-gray-400 hover:border-gray-500'}`}>
                  <input type="radio" checked={form.promoScope === val} onChange={() => set('promoScope', val)} className="accent-[#A6FF3D]" />{text}
                </label>
              ))}
            </div>
            {form.promoScope === 'selected' && (
              <div className="mt-3 p-3 border border-[#333] bg-black">
                {promos.length === 0 ? <p className="text-[10px] text-gray-600">No codes created yet — add them in Marketing &amp; Promos first.</p> : (
                  <div className="grid grid-cols-2 gap-2">
                    {promos.map(p => (
                      <label key={p.code} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={form.promoCodes.includes(p.code)} onChange={e => set('promoCodes', e.target.checked ? [...form.promoCodes, p.code] : form.promoCodes.filter(c => c !== p.code))} className="accent-[#A6FF3D]" />
                        <span className="font-bold text-white">{p.code}</span><span className="text-gray-500">{p.discount}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[#333] flex gap-3 sticky bottom-0 bg-[#0A0A0A]">
          <button onClick={onClose} className="px-6 py-3 border border-[#333] text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white">Cancel</button>
          <button onClick={handleSave} disabled={saving || uploading} className="flex-1 bg-[#A6FF3D] text-black py-3 text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}{existing ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ appState }) => {
  const { handleNavigate, user, products, categories, setCategories, catalogIsLive, settings } = appState;
  const [adminView, setAdminView] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(null);
  const [promos, setPromos] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => { setDraft(settings); }, [settings]);

  const adminField = "w-full p-3 bg-black border border-[#333] text-white text-xs outline-none focus:border-[#A6FF3D]";
  const adminLabel = "block text-[10px] uppercase tracking-widest text-gray-500 mb-2";

  const handleSaveSettings = async () => {
    setSavingSettings(true); setSettingsSaved(false);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'site'), {
        ...draft,
        freeShippingThreshold: parseInt(draft.freeShippingThreshold, 10) || 0,
        shippingFee: parseInt(draft.shippingFee, 10) || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 4000);
    } catch (e) {
      console.error(e);
      alert("Couldn't save settings. Check Firestore rules allow admin writes to settings.");
    } finally { setSavingSettings(false); }
  };

  useEffect(() => {
    if (!isVerifiedAdmin) return;
    const unsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'promos'),
      (snap) => setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Promo load failed:", err)
    );
    return () => unsub();
  }, [isVerifiedAdmin]);
  const [crmSearch, setCrmSearch] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!user) { setIsVerifiedAdmin(false); handleNavigate('home'); return; }
      try {
        const adminDoc = await getDoc(doc(db, 'artifacts', appId, 'admins', user.uid));
        if (adminDoc.exists()) { 
          setIsVerifiedAdmin(true); 
        } else { 
          setIsVerifiedAdmin(false); 
          handleNavigate('home'); 
        }
      } catch (e) {
        console.error("Admin verification failed:", e);
        setIsVerifiedAdmin(false); 
        handleNavigate('home');
      }
    };
    verify();
  }, [user]);

  useEffect(() => {
    if (!isVerifiedAdmin) return;
    let unsubOrders, unsubTickets;
    const authenticateAndFetch = async () => {
      try {
        unsubOrders = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'orders')), (snap) => {
          const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
          setOrders(loaded);
        }, (err) => console.error("Admin orders error:", err));
        
        unsubTickets = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'tickets')), (snap) => {
          const loadedT = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
          setTickets(loadedT);
        }, (err) => console.error("Admin tickets error:", err)); 
      } catch (authErr) { 
        console.error("Admin Auth Error", authErr); 
      }
    };
    authenticateAndFetch();
    return () => { if (unsubOrders) unsubOrders(); if (unsubTickets) unsubTickets(); };
  }, [user, isVerifiedAdmin]);

  const handleReplyTicket = async (ticketId) => { 
    const reply = prompt("Enter your reply to the user. This will mark the ticket as resolved."); 
    if (reply) { 
      try { 
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tickets', ticketId), { status: 'RESOLVED', reply: reply }); 
      } catch (e) {
        console.error(e);
      } 
    } 
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
     try {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus });
     } catch (e) {
       console.error("Failed to update status on DB, updating locally.", e);
       setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
     }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', String(prodId)));
    } catch (e) {
      console.error(e);
      alert("Delete failed. If this is a placeholder product it isn't in the database yet.");
    }
  };

  const handleSeedCatalog = async () => {
    if (!window.confirm("Import the 6 placeholder products into your live catalog? You can edit or delete them after.")) return;
    setSeeding(true);
    try {
      for (const p of INITIAL_PRODUCTS) {
        const { id, stock, ...rest } = p;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), {
          ...rest,
          description: '',
          compareAtPrice: null,
          sizes: { S: stock, M: stock, L: stock, XL: stock },
          promoScope: 'all',
          promoCodes: [],
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) { console.error(e); alert("Import failed — check Firestore rules."); }
    finally { setSeeding(false); }
  };

  const handleAddCategory = () => {
     const newCat = prompt("Enter new category name:");
     if (newCat && !categories.includes(newCat)) {
        setCategories([...categories, newCat]);
     }
  };

  const handleAddPromo = async () => {
    const code = prompt("Promo code (e.g. CYBER50):");
    if (!code) return;
    const discount = prompt("Discount label (e.g. 20% OFF):", "10% OFF");
    if (!discount) return;
    const limit = prompt("Max total uses:", "100");
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'promos', code.toUpperCase().trim()), {
        code: code.toUpperCase().trim(),
        discount,
        maxUses: parseInt(limit, 10) || 100,
        uses: 0,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    } catch (e) { console.error(e); alert("Couldn't save promo code."); }
  };

  const handleRevokePromo = async (codeToRevoke) => {
    if (!window.confirm(`Revoke promo code ${codeToRevoke}?`)) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'promos', codeToRevoke), { status: 'Revoked' });
    } catch (e) { console.error(e); alert("Couldn't revoke code."); }
  };

  const crmUsersMap = {};
  orders.forEach(o => {
    if (!crmUsersMap[o.userEmail]) {
      crmUsersMap[o.userEmail] = { email: o.userEmail, totalSpent: 0, orderCount: 0 };
    }
    crmUsersMap[o.userEmail].totalSpent += o.total;
    crmUsersMap[o.userEmail].orderCount += 1;
  });
  const crmUsers = Object.values(crmUsersMap).filter(u => u.email.toLowerCase().includes(crmSearch.toLowerCase()));

  const DronaTabs = [
    { id: 'settings', icon: SettingsIcon, label: 'Site Settings' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics Dashboard' }, 
    { id: 'orders', icon: Package, label: 'Fulfillment Tracking' }, 
    { id: 'products', icon: Box, label: 'Product & Catalog' }, 
    { id: 'crm', icon: Users, label: 'Customer Relations' }, 
    { id: 'marketing', icon: Tag, label: 'Marketing & Promos' },
    { id: 'tickets', icon: MessageSquare, label: 'Support Inbox' }
  ];
  
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (isVerifiedAdmin !== true) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex items-center justify-center font-mono">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col md:flex-row cursor-default font-mono selection:bg-[#A6FF3D] selection:text-black">
      {showProductForm && (
        <ProductForm
          existing={editingProduct}
          categories={categories}
          promos={promos.filter(p => p.status === 'Active')}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
        />
      )}
      <div className="w-full md:w-72 bg-[#0A0A0A] border-r border-[#333] flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-[#333] flex items-center justify-between bg-black"><div><h1 className="text-2xl font-black uppercase text-[#A6FF3D]" style={{ fontFamily: "'Anton', sans-serif" }}>SYS.ADMIN</h1><p className="text-[10px] text-[#C7CDD1] mt-1">SECURE TERMINAL</p></div><button onClick={() => handleNavigate('home')} className="text-gray-500 hover:text-white p-2 border border-[#333] bg-[#0A0A0A]"><X size={14} /></button></div>
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">{DronaTabs.map(item => (<button key={item.id} onClick={() => setAdminView(item.id)} className={`w-full flex items-center justify-between px-4 py-3 uppercase text-xs font-bold border transition-colors ${adminView === item.id ? 'bg-[#A6FF3D]/10 border-[#A6FF3D] text-[#A6FF3D]' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5 hover:border-[#333]'}`}><div className="flex items-center gap-3"><item.icon size={14} /> {item.label}</div>{item.id === 'tickets' && tickets.filter(t=>t.status==='OPEN').length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">{tickets.filter(t=>t.status==='OPEN').length}</span>}</button>))}</div>
        <div className="p-4 border-t border-[#333] bg-black"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-[#C7CDD1] flex items-center justify-center font-bold text-black text-xs">AD</div><div><p className="text-xs font-bold text-white">MASTER ADMIN</p><p className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> ONLINE</p></div></div></div>
      </div>
      <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
        <div className="max-w-6xl mx-auto">
          
          {adminView === 'settings' && (
            <div className="animate-in fade-in max-w-3xl">
              <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Site Settings</h2>
                  <p className="text-xs text-gray-500 mt-1">Changes go live instantly — no redeploy</p>
                </div>
              </div>

              {settingsSaved && <p className="mb-6 text-[#A6FF3D] text-xs p-3 bg-[#A6FF3D]/10 border border-[#A6FF3D]/30 flex items-center gap-2"><CheckCircle size={14}/> Saved. Refresh your storefront to see it.</p>}

              <div className="space-y-8">
                <div className="bg-[#0A0A0A] border border-[#333] p-5">
                  <h3 className="text-[#A6FF3D] font-bold uppercase text-xs mb-4 pb-3 border-b border-[#333]">Homepage Text</h3>
                  <div className="space-y-4">
                    <div><label className={adminLabel}>Big Headline</label><input value={draft.heroHeadline} onChange={e=>setDraft({...draft, heroHeadline: e.target.value})} className={adminField} /><p className="text-[9px] text-gray-600 mt-1">Last word gets the green gradient automatically.</p></div>
                    <div><label className={adminLabel}>Sub-line</label><input value={draft.heroSubline} onChange={e=>setDraft({...draft, heroSubline: e.target.value})} className={adminField} /></div>
                    <div><label className={adminLabel}>Notice Badge</label><input value={draft.heroNotice} onChange={e=>setDraft({...draft, heroNotice: e.target.value})} placeholder="GOING TO BE LIVE SOON" className={adminField} /><p className="text-[9px] text-gray-600 mt-1">Shown when the countdown is off. Leave blank to hide it.</p></div>
                    <div><label className={adminLabel}>Scrolling Marquee</label><textarea rows={2} value={draft.marqueeText} onChange={e=>setDraft({...draft, marqueeText: e.target.value})} className={`${adminField} resize-none`} /></div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-[#333] p-5">
                  <h3 className="text-[#A6FF3D] font-bold uppercase text-xs mb-4 pb-3 border-b border-[#333]">Drop Countdown</h3>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input type="checkbox" checked={draft.timerEnabled} onChange={e=>setDraft({...draft, timerEnabled: e.target.checked})} className="accent-[#A6FF3D] w-4 h-4" />
                    <span className="text-xs text-white font-bold uppercase">Show countdown instead of the notice badge</span>
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className={adminLabel}>Counts Down To</label><input type="datetime-local" value={draft.timerEndsAt} onChange={e=>setDraft({...draft, timerEndsAt: e.target.value})} className={adminField} /></div>
                    <div><label className={adminLabel}>Label Above Timer</label><input value={draft.timerLabel} onChange={e=>setDraft({...draft, timerLabel: e.target.value})} className={adminField} /></div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3">
                    {draft.timerEnabled && draft.timerEndsAt
                      ? (new Date(draft.timerEndsAt).getTime() > Date.now()
                          ? `Live now — counting down, then your notice text comes back automatically.`
                          : `That date is in the past, so the notice text shows instead.`)
                      : 'Off — showing the notice badge.'}
                  </p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#333] p-5">
                  <h3 className="text-[#A6FF3D] font-bold uppercase text-xs mb-4 pb-3 border-b border-[#333]">Shipping &amp; Payment</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className={adminLabel}>Free Shipping Above (₹)</label><input type="number" value={draft.freeShippingThreshold} onChange={e=>setDraft({...draft, freeShippingThreshold: e.target.value})} className={adminField} /></div>
                    <div><label className={adminLabel}>Shipping Fee (₹)</label><input type="number" value={draft.shippingFee} onChange={e=>setDraft({...draft, shippingFee: e.target.value})} className={adminField} /></div>
                  </div>
                  <label className="flex items-center gap-3 mt-4 cursor-pointer">
                    <input type="checkbox" checked={draft.codEnabled} onChange={e=>setDraft({...draft, codEnabled: e.target.checked})} className="accent-[#A6FF3D] w-4 h-4" />
                    <span className="text-xs text-white font-bold uppercase">Offer Cash on Delivery</span>
                  </label>
                </div>

                <div className="bg-[#0A0A0A] border border-[#333] p-5">
                  <h3 className="text-[#A6FF3D] font-bold uppercase text-xs mb-4 pb-3 border-b border-[#333]">Store Status</h3>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input type="checkbox" checked={draft.storeOpen} onChange={e=>setDraft({...draft, storeOpen: e.target.checked})} className="accent-[#A6FF3D] w-4 h-4" />
                    <span className="text-xs text-white font-bold uppercase">Store open — accepting orders</span>
                  </label>
                  <div><label className={adminLabel}>Message When Closed</label><input value={draft.storeClosedMessage} onChange={e=>setDraft({...draft, storeClosedMessage: e.target.value})} className={adminField} /></div>
                  <p className="text-[9px] text-gray-600 mt-2">Turning this off blocks checkout but keeps the site browsable — useful between drops.</p>
                </div>

                <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full bg-[#A6FF3D] text-black py-4 text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Save Settings
                </button>
              </div>
            </div>
          )}

          {adminView === 'dashboard' && (
            <div className="animate-in fade-in"><div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4"><div><h2 className="text-2xl font-black uppercase text-white">Analytics Dashboard</h2><p className="text-xs text-gray-500 mt-1">Live metrics overview</p></div><button onClick={() => window.print()} className="bg-[#A6FF3D] text-black text-xs font-bold px-4 py-2 uppercase hover:bg-white transition-colors">Export PDF Report</button></div><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Gross Revenue</p><p className="text-3xl text-[#A6FF3D]">₹{totalRevenue}</p></div><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Order Volume</p><p className="text-3xl text-white">{orders.length}</p></div><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Open Tickets</p><p className="text-3xl text-red-500">{tickets.filter(t=>t.status==='OPEN').length}</p></div><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Avg. Order Value</p><p className="text-3xl text-white">₹{orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0}</p></div></div></div>
          )}
          
          {adminView === 'tickets' && (
            <div className="animate-in fade-in"><div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4"><div><h2 className="text-2xl font-black uppercase text-white">Support Inbox</h2><p className="text-xs text-gray-500 mt-1">Resolve incoming messages</p></div></div><div className="space-y-4">{tickets.map(t => (<div key={t.id} className="bg-[#0A0A0A] border border-[#333] p-6"><div className="flex justify-between items-start mb-4"><div><span className="text-white font-bold">{t.userEmail}</span><span className="text-gray-500 text-[10px] ml-4">{new Date(t.createdAt).toLocaleString()}</span></div><span className={`text-[10px] font-bold px-2 py-1 uppercase ${t.status==='OPEN' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{t.status}</span></div><p className="text-sm text-gray-300 mb-4 pb-4 border-b border-[#333]">"{t.message}"</p>{t.status === 'OPEN' ? (<button onClick={()=>handleReplyTicket(t.id)} className="text-[#C7CDD1] text-xs font-bold uppercase hover:underline flex items-center gap-2"><MessageSquare size={14}/> Reply & Resolve</button>) : (<div className="text-xs text-gray-500"><span className="text-[#A6FF3D] font-bold">ADMIN REPLY:</span> {t.reply}</div>)}</div>))}{tickets.length === 0 && <p className="text-center text-gray-500 py-8">NO INCOMING MESSAGES.</p>}</div></div>
          )}
          
          {adminView === 'orders' && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-black uppercase text-white mb-8 border-b border-[#333] pb-4">Fulfillment Tracking</h2>
              <div className="bg-[#0A0A0A] border border-[#333] overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#111] text-gray-400 uppercase">
                    <tr><th className="p-4 border-b border-[#333]"></th><th className="p-4 border-b border-[#333]">ID</th><th className="p-4 border-b border-[#333]">Customer</th><th className="p-4 border-b border-[#333]">Value</th><th className="p-4 border-b border-[#333]">Date</th><th className="p-4 border-b border-[#333]">Status Action</th></tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {orders.map(o=>(
                      <React.Fragment key={o.id}>
                      <tr className="border-b border-[#333] hover:bg-[#111] cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>
                        <td className="p-4">{expandedOrderId === o.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                        <td className="p-4">#{o.id.slice(0,8)}</td>
                        <td className="p-4">{o.userEmail}</td>
                        <td className="p-4 text-[#A6FF3D]">₹{o.total}</td>
                        <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                           <select 
                             value={o.status} 
                             onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)} 
                             className={`bg-black border p-2 text-[10px] font-bold outline-none cursor-pointer ${o.status === 'PENDING' ? 'text-yellow-500 border-yellow-500/30' : o.status === 'DELIVERED' ? 'text-green-500 border-green-500/30' : 'text-[#C7CDD1] border-[#C7CDD1]/30'}`}
                           >
                              <option value="PENDING">MARK PENDING</option>
                              <option value="SHIPPED">MARK SHIPPED</option>
                              <option value="DELIVERED">MARK DELIVERED</option>
                           </select>
                        </td>
                      </tr>
                      {expandedOrderId === o.id && (
                        <tr className="border-b border-[#333] bg-[#0A0A0A]">
                          <td colSpan="6" className="p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-[#A6FF3D] font-bold uppercase mb-2 text-[10px]">Ship To</p>
                                {o.shippingInfo ? (
                                  <div className="text-gray-300 leading-relaxed">
                                    <p>{o.shippingInfo.name}</p>
                                    <p>{o.shippingInfo.address}</p>
                                    <p>{o.shippingInfo.city}, {o.shippingInfo.state} - {o.shippingInfo.pin}</p>
                                    <p>Phone: {o.shippingInfo.phone}</p>
                                    <p className="mt-1 text-[#C7CDD1]">Payment: {o.paymentMode}</p>
                                  </div>
                                ) : <p className="text-gray-500">No shipping info on file.</p>}
                              </div>
                              <div>
                                <p className="text-[#A6FF3D] font-bold uppercase mb-2 text-[10px]">Items</p>
                                <div className="space-y-2">
                                  {(o.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-300">
                                      <img src={item.image} className="w-10 h-12 object-cover grayscale" />
                                      <span>{item.name} — SIZE: {item.selectedSize || 'N/A'} — ₹{item.price}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">NO ORDERS DETECTED.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {adminView === 'products' && (
            <div className="animate-in fade-in">
              <div className="flex flex-wrap gap-4 justify-between items-end mb-8 border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Product Catalog</h2>
                  <p className="text-xs text-gray-500 mt-1">{catalogIsLive ? `${products.length} live product${products.length !== 1 ? 's' : ''}` : 'Showing placeholders — nothing published yet'}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddCategory} className="bg-[#111] border border-[#333] text-white px-4 py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
                    + Category
                  </button>
                  <button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="bg-[#A6FF3D] text-black px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 hover:bg-white transition-colors">
                    <Plus size={14}/> New Product
                  </button>
                </div>
              </div>

              {!catalogIsLive && (
                <div className="mb-6 p-5 border border-[#D4B876]/40 bg-[#D4B876]/10 flex flex-wrap gap-4 justify-between items-center">
                  <div>
                    <p className="text-[#D4B876] font-bold text-sm uppercase mb-1">Catalog is not live yet</p>
                    <p className="text-xs text-gray-400">The products below are demo placeholders and can't be edited or sold. Publish a real product, or import these to start from.</p>
                  </div>
                  <button onClick={handleSeedCatalog} disabled={seeding} className="bg-[#D4B876] text-black px-4 py-2 text-xs font-bold uppercase hover:bg-white disabled:opacity-50 flex items-center gap-2">
                    {seeding ? <Loader2 size={13} className="animate-spin" /> : <Box size={13} />} Import Placeholders
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(p=>{
                  const sizes = p.sizes || {};
                  const total = SIZE_KEYS.reduce((s,k) => s + (sizes[k] || 0), 0);
                  return (
                  <div key={p.id} className="bg-[#0A0A0A] border border-[#333] flex flex-col group relative">
                    <img src={p.image} className="w-full h-40 object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all"/>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-xs text-white font-bold truncate uppercase">{p.name}</p>
                      <p className="text-[10px] text-gray-500 mb-3">{p.category}</p>
                      <div className="flex gap-1 mb-3">
                        {SIZE_KEYS.map(s => (
                          <span key={s} className={`flex-1 text-center text-[9px] py-1 border ${(sizes[s]||0) === 0 ? 'border-[#333] text-gray-700' : (sizes[s]||0) <= 3 ? 'border-red-500/40 text-red-500' : 'border-[#333] text-gray-400'}`}>{s}:{sizes[s] ?? '–'}</span>
                        ))}
                      </div>
                      <div className="flex justify-between items-end mt-auto">
                        <span className="text-[#A6FF3D] text-xs font-bold">₹{p.price}</span>
                        <span className={`text-[9px] ${total === 0 ? 'text-red-500' : 'text-gray-500'}`}>{catalogIsLive ? `${total} pcs` : 'demo'}</span>
                      </div>
                    </div>
                    {catalogIsLive && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="bg-[#A6FF3D] text-black p-2 hover:bg-white rounded-sm" title="Edit"><SettingsIcon size={12}/></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="bg-red-500 text-white p-2 hover:bg-red-600 rounded-sm" title="Delete"><Trash2 size={12}/></button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {adminView === 'crm' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Customer Relations</h2>
                  <p className="text-xs text-gray-500 mt-1">Derived from orders</p>
                </div>
                <div className="bg-black border border-[#333] flex items-center px-3">
                  <Search size={14} className="text-gray-500"/>
                  <input type="text" placeholder="Search email..." value={crmSearch} onChange={(e) => setCrmSearch(e.target.value)} className="bg-transparent p-2 text-xs text-white outline-none w-48"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crmUsers.map((u, i) => (
                  <div key={i} className="bg-[#0A0A0A] border border-[#333] p-5">
                    <div className="flex items-center gap-3 border-b border-[#333] pb-3 mb-3">
                      <div className="w-10 h-10 bg-[#111] border border-[#333] flex items-center justify-center font-bold text-white uppercase">{u.email.charAt(0)}</div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate w-full">{u.email}</p>
                        <p className="text-[10px] text-gray-500 mt-1">LIFETIME VALUE</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Total Spent:</span><span className="text-[#A6FF3D] font-bold">₹{u.totalSpent}</span></div>
                    <div className="flex justify-between text-xs mb-4"><span className="text-gray-500">Total Orders:</span><span className="text-white font-bold">{u.orderCount}</span></div>
                  </div>
                ))}
                {crmUsers.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">NO CUSTOMER DATA MATCHED IN RECORDS.</p>}
              </div>
            </div>
          )}

          {adminView === 'marketing' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Marketing & Promos</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage active voucher codes</p>
                </div>
                <button onClick={handleAddPromo} className="bg-[#C7CDD1] text-black text-xs font-bold px-4 py-2 uppercase flex items-center gap-2 hover:bg-white transition-colors">
                  <Plus size={14}/> Generate Promo
                </button>
              </div>
              <div className="bg-[#0A0A0A] border border-[#333] overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#111] text-gray-400 uppercase">
                    <tr><th className="p-4 border-b border-[#333]">Voucher Code</th><th className="p-4 border-b border-[#333]">Discount</th><th className="p-4 border-b border-[#333]">Usage Limit</th><th className="p-4 border-b border-[#333]">Status</th><th className="p-4 border-b border-[#333]">Action</th></tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {promos.map((promo, i) => (
                      <tr key={i} className="border-b border-[#333] hover:bg-[#111] transition-colors">
                        <td className={`p-4 font-black text-lg ${promo.status === 'Active' ? 'text-white' : 'text-gray-500 line-through'}`}>{promo.code}</td>
                        <td className={`p-4 font-bold ${promo.status === 'Active' ? 'text-[#A6FF3D]' : 'text-gray-500'}`}>{promo.discount}</td>
                        <td className="p-4 text-gray-500">{promo.usage}</td>
                        <td className="p-4">
                          {promo.status === 'Active' ? <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-1 uppercase font-bold">Active</span> :
                           <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-1 uppercase font-bold">Revoked</span>}
                        </td>
                        <td className="p-4">
                           {promo.status === 'Active' ? (
                             <button onClick={() => handleRevokePromo(promo.code)} className="text-red-500 uppercase text-[10px] font-bold hover:underline">Revoke Code</button>
                           ) : <span className="text-gray-600">--</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const Vault = ({ appState }) => {
  const { theme, wishlist, openProduct } = appState;
  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen text-center">
      <h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>The Vault</h2>
      {wishlist.length === 0 ? ( <p className={`font-mono ${theme.textMuted}`}>YOUR VAULT IS EMPTY.</p> ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-left">
            {wishlist.map(w => (
              <div key={w.id} className={`${theme.card} border ${theme.border} p-4`}><img src={w.image} className="w-full aspect-square object-cover mb-2 grayscale" /><p className={`text-xs font-bold uppercase truncate ${theme.text}`}>{w.name}</p><p className={`font-mono text-xs ${theme.accent}`}>₹{w.price}</p><button onClick={() => openProduct(w)} className={`w-full mt-2 text-[10px] font-bold py-2 uppercase transition-colors ${theme.btnPrimary}`}>Select Size & Add</button></div>
            ))}
          </div>
      )}
    </div>
  );
};

const Home = ({ appState }) => {
  const { enterVault, settings } = appState;
  const [timerDone, setTimerDone] = useState(false);

  // Timer shows only if switched on, given a future date, and not yet elapsed.
  const timerActive = settings.timerEnabled
    && !!settings.timerEndsAt
    && !timerDone
    && new Date(settings.timerEndsAt).getTime() > Date.now();

  useEffect(() => { setTimerDone(false); }, [settings.timerEndsAt, settings.timerEnabled]);

  // Headline: last word gets the gradient/glitch treatment.
  const words = (settings.heroHeadline || '').trim().split(' ');
  const headTail = words.length > 1 ? words.pop() : '';
  const headLead = words.join(' ');

  return (
    <>
      <div className="relative min-h-screen pt-24 pb-12 flex flex-col items-center justify-center overflow-hidden bg-[#050505] border-b border-white/10 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-luminosity animate-pan-bg"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#A6FF3D]/40 shadow-[0_0_15px_#A6FF3D] animate-scan-line pointer-events-none z-10"></div>
        <div className="absolute top-32 left-8 text-[#A6FF3D] font-mono text-[10px] tracking-widest opacity-40 hidden md:block animate-pulse">[ SYS.COORD : 28.6139° N, 77.2090° E ]<br/>INITIATING_PROTOCOL_V.9</div>
        <div className="absolute bottom-16 right-8 flex items-center gap-4 hidden md:flex opacity-40"><div className="text-right text-gray-500 font-mono text-[10px] tracking-widest">TARGET ACQUIRED<br/>AWAITING DIRECTIVE</div><Crosshair size={32} className="text-[#C7CDD1] animate-spin-slow" /></div>
        <div className="relative z-10 text-center px-4 w-full max-w-4xl flex flex-col items-center mt-8">
          <div className="opacity-0 animate-reveal-1 mb-8"><img src={darksideLogo} alt="The Darkside" className="h-24 md:h-32 lg:h-40 object-contain drop-shadow-[0_0_30px_rgba(166,255,61,0.15)]" /></div>

          {timerActive ? (
            <>
              <div className="mb-6 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-1 text-xs font-mono font-bold tracking-widest animate-pulse opacity-0 animate-reveal-2"><Zap size={14} /> {settings.timerLabel}</div>
              <div className="opacity-0 animate-reveal-3">
                <CountdownTimer endsAt={settings.timerEndsAt} onExpire={() => setTimerDone(true)} />
              </div>
            </>
          ) : settings.heroNotice ? (
            <div className="mb-8 inline-flex items-center gap-2 border border-[#A6FF3D]/50 bg-[#A6FF3D]/10 text-[#A6FF3D] px-6 py-2 text-xs md:text-sm font-mono font-bold tracking-[0.2em] opacity-0 animate-reveal-2">
              <Zap size={14} /> {settings.heroNotice}
            </div>
          ) : null}

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-2 font-display opacity-0 animate-reveal-4">{headLead} {headTail && <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A6FF3D] to-[#C7CDD1] glitch-hover" data-text={headTail}>{headTail}</span>}</h1>
          <p className="text-gray-400 font-mono tracking-[0.2em] uppercase text-sm mb-8 opacity-0 animate-reveal-4">{settings.heroSubline}</p>
          <div className="opacity-0 animate-reveal-4 mt-4 mb-8">
            <button onClick={enterVault} className="bg-white text-black px-12 py-5 font-bold uppercase tracking-widest transition-all relative overflow-hidden group/btn border border-white hover:border-[#A6FF3D] hover:shadow-[0_0_20px_rgba(166,255,61,0.3)]">
              <div className="absolute inset-0 bg-[#A6FF3D] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
              <span className="relative z-10 flex items-center justify-center gap-3 group-hover/btn:text-black">Enter The Vault <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></span>
            </button>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#A6FF3D] py-3 overflow-hidden border-y border-black relative z-20 shadow-[0_0_20px_rgba(166,255,61,0.2)]">
        <div className="animate-marquee whitespace-nowrap text-black font-bold font-mono text-sm tracking-widest flex items-center">
          {[...Array(4)].map((_, i) => (<span key={i} className="mx-4">{settings.marqueeText} </span>))}
        </div>
      </div>
    </>
  );
};

const Footer = ({ appState }) => {
  const { view, theme, handleNavigate } = appState;
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  if (view === 'admin' || view === 'profile-setup') return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setJoining(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'newsletter', email.toLowerCase().trim()), {
        email: email.toLowerCase().trim(),
        joinedAt: new Date().toISOString()
      });
      setJoined(true);
    } catch (e2) {
      console.error(e2);
      setJoined(true); // don't block the user over a marketing-list write failure
    } finally { setJoining(false); }
  };

  return (
    <footer className={`${theme.bg} border-t ${theme.border} py-12 px-4 mt-20 transition-colors duration-1000`}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Join The Underground</h2>
          <p className={`font-mono text-xs mb-6 max-w-sm ${theme.textMuted}`}>No spam. Only restock alerts and secret drops.</p>
          {joined ? (
            <div className={`font-bold font-mono text-sm uppercase ${theme.accent} flex items-center gap-2`}><CheckCircle size={16}/> Frequency Logged. Welcome.</div>
          ) : (
            <form onSubmit={handleJoin} className="flex">
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Identifier..." className={`bg-transparent border p-3 font-mono outline-none w-64 ${theme.input}`} />
              <button type="submit" disabled={joining} className={`font-bold px-6 uppercase transition-colors disabled:opacity-50 ${theme.btnPrimary}`}>{joining ? <Loader2 size={14} className="animate-spin" /> : 'Join'}</button>
            </form>
          )}
        </div>
        <div className={`text-left md:text-right font-mono text-[10px] space-y-2 ${theme.textMuted}`}>
          <p className="text-gray-400 text-xs tracking-[0.2em] uppercase mb-4">Darkside - Embrace the light.</p>
          <p>© 2026 DARKSIDE CLOTHING INDIA.</p>
          <div className="flex gap-4 md:justify-end mt-4 pt-4 border-t border-gray-500/20">
             <button onClick={()=>handleNavigate('help')} className="hover:text-white uppercase tracking-widest">Help & FAQs</button>
             <button onClick={()=>handleNavigate('terms')} className="hover:text-white uppercase tracking-widest">Terms & Conditions</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const AppContent = ({ appState }) => {
  const { view, selectedProduct } = appState;
  if (selectedProduct) return <ProductDetail appState={appState} />;
  switch(view) {
    case 'home': return <Home appState={appState} />;
    case 'shop': return <Shop appState={appState} />;
    case 'account': return <Account appState={appState} />;
    case 'profile-setup': return <ProfileSetup appState={appState} />;
    case 'auth': return <AuthView appState={appState} />;
    case 'checkout': return <CheckoutView appState={appState} />;
    case 'vault': return <Vault appState={appState} />;
    case 'help': return <HelpCenter appState={appState} />;
    case 'terms': return <TermsPage appState={appState} />;
    case 'admin': return <AdminPanel appState={appState} />;
    default: return <Home appState={appState} />;
  }
};

export default function App() {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [catalogIsLive, setCatalogIsLive] = useState(false);

  // Everything here is editable from Admin > Site Settings, no redeploy needed.
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'site'),
      (snap) => { if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() }); },
      (err) => console.error("Settings load failed:", err)
    );
    return () => unsub();
  }, []);

  // Products now live in Firestore so stock, sizes and pricing survive refreshes.
  // Until the collection has anything in it, the placeholder catalog is shown.
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'products'),
      (snap) => {
        if (snap.empty) { setCatalogIsLive(false); setProducts(INITIAL_PRODUCTS); return; }
        setCatalogIsLive(true);
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Catalog load failed:", err)
    );
    return () => unsub();
  }, []);
  const [categories, setCategories] = useState(['Outerwear', 'Tops', 'Bottoms', 'Hardware']);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSizeAI, setShowSizeAI] = useState(false);
  const [showVibeMatcher, setShowVibeMatcher] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState('All Categories');
  const [user, setUser] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const isLight = false;

  const theme = {
    bg: isLight ? 'bg-white' : 'bg-[#050505]',
    text: isLight ? 'text-black' : 'text-white',
    textMuted: isLight ? 'text-gray-600' : 'text-gray-400',
    border: isLight ? 'border-black/10' : 'border-white/10',
    card: isLight ? 'bg-gray-100' : 'bg-[#0A0A0A]',
    input: isLight ? 'bg-white border-black/20 text-black focus:border-[#C7CDD1]' : 'bg-black border-white/20 text-white focus:border-[#A6FF3D]',
    btnPrimary: isLight ? 'bg-black text-white hover:bg-[#C7CDD1] hover:text-black' : 'bg-[#A6FF3D] text-black hover:bg-white',
    accent: isLight ? 'text-[#C7CDD1]' : 'text-[#A6FF3D]',
    accentHover: isLight ? 'hover:text-[#C7CDD1]' : 'hover:text-[#A6FF3D]',
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const freeShippingThreshold = settings.freeShippingThreshold ?? 5000;
  const shippingFee = settings.shippingFee ?? 150;
  const progressToFreeShipping = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  useEffect(() => {
    if (isCartOpen || showSizeAI || showVibeMatcher || isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isCartOpen, showSizeAI, showVibeMatcher, isMobileMenuOpen]);

  useEffect(() => {
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
        setIsMobileMenuOpen(false);
      } else { 
        setView('home'); 
        setSelectedProduct(null); 
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  useEffect(() => {
    // Only create a guest session when nobody is signed in.
    // Calling signInAnonymously unconditionally REPLACES an existing email/phone
    // session with a brand new anonymous one - that logs real users out on refresh.
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Guest session failed:", e);
        }
        return; // this listener re-fires with the new guest user
      }
      setUser(u);
      if (u) {
        try {
          const docSnap = await getDoc(doc(db, 'artifacts', appId, 'users', u.uid, 'userdata', 'state'));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.cart) setCart(data.cart);
            if (data.wishlist) setWishlist(data.wishlist);
          }
        } catch (err) { 
          console.error("User state fetch error:", err); 
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (newView) => {
    setView(newView); 
    setSelectedProduct(null); 
    setIsMobileMenuOpen(false); 
    window.scrollTo(0, 0);
    window.history.pushState({ view: newView, product: null }, '', '#' + newView);
  };

  const openProduct = (product) => {
    setSelectedProduct(product); 
    window.scrollTo(0, 0);
    window.history.pushState({ view: view, product: product.id }, '', '#product-' + product.id);
  };

  const saveUserData = async (newCart, newWishlist) => {
    if (!user) return;
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), { cart: newCart, wishlist: newWishlist }, { merge: true }); 
    } catch(e) {
      console.error("Sync error:", e);
    }
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
    setWishlist(newWishlist); 
    saveUserData(cart, newWishlist);
  };
  
  const addToCart = (product, size) => { 
    const newCart = [...cart, { ...product, selectedSize: size, cartItemId: `${product.id}-${size}-${Date.now()}` }]; 
    setCart(newCart); 
    setIsCartOpen(true); 
    saveUserData(newCart, wishlist); 
  };
  
  const removeFromCart = (index) => { 
    const newCart = cart.filter((_, i) => i !== index); 
    setCart(newCart); 
    saveUserData(newCart, wishlist); 
  };

  const appState = {
    view, setView, cart, setCart, wishlist, setWishlist, products, setProducts,
    categories, setCategories, catalogIsLive, settings,
    isCartOpen, setIsCartOpen, showSizeAI, setShowSizeAI, showVibeMatcher, setShowVibeMatcher,
    selectedProduct, setSelectedProduct, isMobileMenuOpen, setIsMobileMenuOpen,
    shopCategory, setShopCategory, user, setUser, isFlashing, setIsFlashing,
    isLight, theme, cartTotal, freeShippingThreshold, shippingFee, progressToFreeShipping,
    handleNavigate, openProduct, enterVault, toggleWishlist, addToCart, removeFromCart, saveUserData
  };

  return (
    <div className={`${theme.bg} ${theme.text} selection:bg-[#C7CDD1] selection:text-black min-h-screen cursor-none transition-colors duration-1000 ease-in-out`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
        body { font-family: 'JetBrains Mono', monospace; } .font-mono { font-family: 'JetBrains Mono', monospace; } .font-display { font-family: 'Anton', sans-serif; letter-spacing: -0.01em; }
        html { scroll-behavior: smooth; }
        @keyframes pan-bg { 0% { transform: scale(1) translate(0px, 0px); } 50% { transform: scale(1.05) translate(-10px, -10px); } 100% { transform: scale(1) translate(0px, 0px); } } .animate-pan-bg { animation: pan-bg 20s ease-in-out infinite; }
        @keyframes reveal { 0% { opacity: 0; transform: translateY(30px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-reveal-1 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .animate-reveal-2 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; } .animate-reveal-3 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; } .animate-reveal-4 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards; }
        @keyframes scan-line { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } } .animate-scan-line { animation: scan-line 6s linear infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        @keyframes fadeZoomIn { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-in { animation: fadeZoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes sizePop { 0% { transform: scale(1); } 40% { transform: scale(1.08); } 100% { transform: scale(1); } }
        .animate-size-pop { animation: sizePop 0.25s ease-out; }
        @keyframes wishlistPop { 0% { transform: scale(1); } 35% { transform: scale(1.35); } 60% { transform: scale(0.92); } 100% { transform: scale(1); } }
        .animate-wishlist-pop { animation: wishlistPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes slideUpBar { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-bar { animation: slideUpBar 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes cartSuccess { 0% { transform: scale(1); } 50% { transform: scale(1.04); } 100% { transform: scale(1); } }
        .animate-cart-success { animation: cartSuccess 0.3s ease-out; }
        @keyframes fadeSwap { from { opacity: 0.4; } to { opacity: 1; } }
        .animate-fade-swap { animation: fadeSwap 0.3s ease-out; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-25%); } } .animate-marquee { animation: marquee 12s linear infinite; width: fit-content; }
        .glitch-hover { position: relative; } .glitch-hover:hover::before, .glitch-hover:hover::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; } .glitch-hover:hover::before { left: 2px; text-shadow: -1px 0 #A6FF3D; animation: glitch-anim-1 2s infinite linear alternate-reverse; } .glitch-hover:hover::after { left: -2px; text-shadow: -1px 0 #C7CDD1; animation: glitch-anim-2 3s infinite linear alternate-reverse; }
        @keyframes glitch-anim-1 { 0% { clip-path: inset(20% 0 80% 0); } 20% { clip-path: inset(60% 0 10% 0); } 40% { clip-path: inset(40% 0 50% 0); } 60% { clip-path: inset(80% 0 5% 0); } 80% { clip-path: inset(10% 0 70% 0); } 100% { clip-path: inset(30% 0 20% 0); } } @keyframes glitch-anim-2 { 0% { clip-path: inset(10% 0 60% 0); } 20% { clip-path: inset(80% 0 5% 0); } 40% { clip-path: inset(30% 0 20% 0); } 60% { clip-path: inset(70% 0 10% 0); } 80% { clip-path: inset(20% 0 50% 0); } 100% { clip-path: inset(50% 0 30% 0); } }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #050505; } ::-webkit-scrollbar-thumb { background: #222; } ::-webkit-scrollbar-thumb:hover { background: #C7CDD1; }
        .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className={`fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-500 ease-in-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

      {view !== 'admin' && view !== 'profile-setup' && <CustomCursor />}
      
      <Navbar appState={appState} />
      
      <main className="relative z-10">
        <AppContent appState={appState} />
      </main>

      {showSizeAI && <SizePredictor appState={appState} />}
      {showVibeMatcher && <VibeMatcher appState={appState} />}

      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setIsCartOpen(false)}></div>
          <div className={`w-full max-w-md ${isLight ? 'bg-white' : 'bg-[#050505]'} h-full border-l ${theme.border} flex flex-col relative z-10 transform transition-transform duration-300`}>
            <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}><h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Anton', sans-serif" }}>Cart ({cart.length})</h2><button onClick={() => setIsCartOpen(false)} className={`${theme.textMuted} hover:${theme.text}`}><X size={24} /></button></div>
            <div className={`p-4 ${theme.card} border-b ${theme.border}`}><p className={`text-xs font-mono mb-2 ${theme.textMuted}`}>{progressToFreeShipping >= 100 ? "UNLOCKED: FREE PAN-INDIA SHIPPING" : `ADD ₹${freeShippingThreshold - cartTotal} MORE FOR FREE DELIVERY`}</p><div className={`w-full h-1 ${isLight ? 'bg-gray-300' : 'bg-gray-800'} rounded-full overflow-hidden`}><div className="h-full bg-[#C7CDD1] transition-all duration-500" style={{ width: `${progressToFreeShipping}%` }}></div></div></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map((item, index) => (
                <div key={item.cartItemId || index} className="flex gap-4 group">
                  <div className={`w-20 h-24 border ${theme.border} overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-gray-900'}`}><img src={item.image} className="w-full h-full object-cover grayscale" /></div>
                  <div className="flex-1 flex flex-col justify-between py-1"><div><h4 className={`text-sm font-bold uppercase ${theme.text}`}>{item.name}</h4><p className={`font-mono text-[10px] mt-1 ${theme.textMuted}`}>SIZE: {item.selectedSize || 'N/A'} // QTY: 1</p></div><div className="flex justify-between items-end"><span className={`font-mono font-bold ${theme.accent}`}>₹{item.price}</span><button onClick={() => removeFromCart(index)} className="text-gray-600 hover:text-red-500 text-xs font-bold uppercase underline">Remove</button></div></div>
                </div>
              ))}
              {cart.length === 0 && <p className={`text-center font-mono mt-10 ${theme.textMuted}`}>THE CART IS EMPTY.</p>}
            </div>
            <div className={`p-6 ${theme.card} border-t ${theme.border}`}>
              <div className={`flex justify-between font-mono mb-6 ${theme.text}`}><span className="uppercase">Subtotal</span><span className="font-bold text-xl">₹{cartTotal}</span></div>
              <button disabled={cart.length === 0} onClick={() => { setIsCartOpen(false); handleNavigate('checkout'); }} className={`w-full font-black py-5 uppercase tracking-widest text-lg disabled:opacity-50 transition-colors ${theme.btnPrimary}`}>Standard Checkout</button>
            </div>
          </div>
        </div>
      )}

      <Footer appState={appState} />
    </div>
  );
}
