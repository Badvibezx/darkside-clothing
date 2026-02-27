import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Heart, Search, Menu, X, 
  User, Zap, Crosshair, Smartphone, ChevronRight,
  ShieldCheck, Truck, Fingerprint, Sparkles, Loader2,
  LayoutDashboard, Package, Users, Activity, Plus, Trash2,
  Box, Tag, AlertTriangle, MessageSquare, Lock,
  ArrowLeft, Star, Ruler, ChevronDown, ChevronUp, RefreshCw,
  AlertOctagon, CheckCircle, HelpCircle, Mail, MapPin, Settings as SettingsIcon, LogOut as LogOutIcon, ChevronRight as ChevronRightIcon
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  RecaptchaVerifier, signInWithPhoneNumber, updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, updateDoc } from 'firebase/firestore';

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

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1618609377866-63640b615822?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=150&q=80"
];

const callGeminiAPI = async (prompt, schema = null) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "You are a rogue, cyberpunk AI stylist for DARKSIDE CLOTHING INDIA. Speak with an edgy, dystopian tone." }] } };
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

// --- ISOLATED COMPONENTS FOR STABILITY ---
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
      style={{ transform: `translate(${mousePos.x - 12}px, ${mousePos.y - 12}px) scale(${isHoveringItem ? 2.5 : 1})`, backgroundColor: isHoveringItem ? 'transparent' : '#CCFF00', border: isHoveringItem ? '1px solid #CCFF00' : 'none' }}
    >
      {isHoveringItem && <span className="text-[4px] font-mono text-[#CCFF00] font-bold">EXPLORE</span>}
    </div>
  );
};

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 24, m: 0, s: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => { let { h, m, s } = prev; if (s > 0) s--; else if (m > 0) { m--; s = 59; } else if (h > 0) { h--; m = 59; s = 59; } return { h, m, s }; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex justify-center gap-4 mb-8 font-mono">
      {[{ label: 'HRS', value: timeLeft.h }, { label: 'MIN', value: timeLeft.m }, { label: 'SEC', value: timeLeft.s }].map((t, i) => (
        <div key={i} className="flex flex-col items-center"><span className="text-4xl md:text-6xl text-white font-black bg-[#0A0A0A] border border-white/10 p-4 w-20 md:w-24 text-center">{String(t.value).padStart(2, '0')}</span><span className="text-[10px] text-gray-500 mt-2">{t.label}</span></div>
      ))}
    </div>
  );
};

const SizePredictor = ({ appState }) => {
  const { theme, isLight, setShowSizeAI } = appState;
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
              <button onClick={handleCalculate} disabled={loading || !height || !weight} className={`w-full text-black font-bold py-4 mt-4 uppercase disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{loading ? "CALCULATING..." : "✨ PREDICT FIT"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const VibeMatcher = ({ appState }) => {
  const { theme, isLight, setShowVibeMatcher, products, addToCart } = appState;
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
               {recommendations.products.map((p, idx) => (
                 p ? <div key={p.id || idx} className={`border p-2 flex gap-3 ${theme.border} ${theme.card}`}><img src={p.image} className="w-16 h-20 object-cover grayscale" /><div className="flex flex-col justify-center"><p className={`font-bold text-xs uppercase ${theme.text}`}>{p.name}</p><p className={`font-mono text-xs mt-1 ${theme.accent}`}>₹{p.price}</p><button onClick={() => addToCart(p)} className="text-left text-[#8A2BE2] text-[10px] font-mono uppercase mt-2 hover:underline">+ Add to Cart</button></div></div> : null
               ))}
             </div>
             <button onClick={() => setRecommendations(null)} className={`w-full border font-bold py-3 uppercase font-mono text-sm transition-colors ${theme.border} ${theme.text} hover:bg-gray-200`}>Reset Vibe</button>
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
        <div className="flex items-center gap-5 md:gap-6">
          <Search className={`cursor-pointer hidden md:block w-5 h-5 ${theme.text} ${theme.accentHover}`} onClick={() => handleNavigate('shop')} />
          <div className="cursor-pointer" onClick={() => handleNavigate(user && !user.isAnonymous ? 'account' : 'auth')}>
            {user && user.photoURL ? ( <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full border border-gray-500 object-cover" /> ) : ( <User className={`w-5 h-5 ${theme.text} ${theme.accentHover}`} /> )}
          </div>
          <div className="relative cursor-pointer hidden md:block" onClick={() => handleNavigate('vault')}>
            <Heart className={`w-5 h-5 ${theme.text} hover:text-[#8A2BE2]`} />
            {wishlist.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#8A2BE2] text-white text-[10px] font-bold flex items-center justify-center rounded-full">{wishlist.length}</span>}
          </div>
          <div className="relative cursor-pointer" onClick={() => { setIsCartOpen(true); setIsMobileMenuOpen(false); }}>
            <ShoppingBag className={`w-5 h-5 ${theme.text} hover:text-[#8A2BE2]`} />
            {cart.length > 0 && <span className={`absolute -top-2 -right-2 w-4 h-4 ${isLight ? 'bg-black text-white' : 'bg-[#CCFF00] text-black'} text-[10px] font-bold flex items-center justify-center rounded-full`}>{cart.length}</span>}
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b p-4 flex flex-col gap-4 absolute top-20 left-0 w-full z-40 ${isLight ? 'bg-white border-black/10' : 'bg-[#0A0A0A] border-white/10'}`}>
          {['Home', 'Shop', 'Vault', 'Help & FAQs', user && !user.isAnonymous ? 'Account' : 'Login'].map(link => (
            <button key={link} onClick={() => { 
                if(link === 'Help & FAQs') handleNavigate('help');
                else if(link === 'Login') handleNavigate('auth');
                else { setShopCategory('All Categories'); handleNavigate(link.toLowerCase()); }
            }} className={`text-left font-mono uppercase py-2 border-b ${isLight ? 'text-black border-black/5 hover:text-[#8A2BE2]' : 'text-white border-white/5 hover:text-[#CCFF00]'}`}>{link}</button>
          ))}
        </div>
      )}
    </nav>
  );
};

const AuthView = ({ appState }) => {
  const { theme, isLight, handleNavigate } = appState;
  const [authMode, setAuthMode] = useState('phone'); 
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);
  
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) setPhone(val);
  };

  const navigateAfterAuth = (userObj) => {
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
      if (!window.recaptchaVerifier) { window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' }); }
      const formatPhone = "+91" + phone;
      const confirmationResult = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
    } catch (err) {
      console.error("SMS Error", err);
      if (err.code === 'auth/billing-not-enabled') setError("SMS FAILED: Firebase Billing (Blaze Plan) is required. Add your number to 'Testing Numbers' in Firebase Console to bypass.");
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
      navigateAfterAuth(result.user);
    } catch (err) { setError("INVALID OTP. ACCESS DENIED."); } finally { setLoading(false); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (email === 'admin@darkside.com' && password === 'darkside') {
       setTimeout(() => { setLoading(false); handleNavigate('admin'); }, 800);
       return;
    }
    try { 
      const result = isSignup ? await createUserWithEmailAndPassword(auth, email, password) : await signInWithEmailAndPassword(auth, email, password); 
      navigateAfterAuth(result.user);
    } catch (err) { setError(err.message); } finally { setLoading(false); } 
  };

  return (
    <div className="pt-32 px-4 max-w-md mx-auto min-h-screen">
      <div className={`${theme.card} border ${theme.border} p-8 relative overflow-hidden`}>
        <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Join The Syndicate</h2>
        <p className={`font-mono text-xs mb-8 ${theme.textMuted}`}>AUTHENTICATE VIA SECURE TERMINAL.</p>
        {error && <p className="text-red-500 font-mono text-xs mb-4 p-2 bg-red-500/10 border border-red-500/30 flex items-center gap-2"><AlertOctagon size={14}/> {error}</p>}
        <div id="recaptcha-container"></div>
        {authMode === 'phone' && (
          !otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4 font-mono text-sm">
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
        {authMode === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4 font-mono text-sm animate-in fade-in">
            <div><label className={`block mb-1 font-bold ${theme.accent}`}>EMAIL IDENTIFIER</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className={`w-full p-3 outline-none ${theme.input}`} /></div>
            <div><label className={`block mb-1 font-bold ${theme.accent}`}>PASSCODE</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className={`w-full p-3 outline-none ${theme.input}`} /></div>
            <button disabled={loading} type="submit" className={`w-full font-black py-4 mt-4 uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2 ${theme.btnPrimary}`}>{loading ? <Loader2 className="animate-spin" size={18} /> : (isSignup ? "Create Identity" : "Initialize Login")}</button>
            <div className="flex justify-between items-center mt-4"><button type="button" onClick={() => setIsSignup(!isSignup)} className={`text-xs hover:underline ${theme.textMuted}`}>{isSignup ? "Have an account?" : "Need an account?"}</button><button type="button" onClick={() => setAuthMode('phone')} className={`text-xs hover:underline ${theme.textMuted} flex items-center gap-1`}><Smartphone size={12}/> Use Phone</button></div>
          </form>
        )}
      </div>
    </div>
  );
};

const ProfileSetup = ({ appState }) => {
  const { handleNavigate, setUser } = appState;
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name, photoURL: avatarUrl });
      setUser({...auth.currentUser, displayName: name, photoURL: avatarUrl});
      handleNavigate('account');
    } catch (err) { console.error(err); alert("Failed to update profile."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#333] p-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white" style={{ fontFamily: "'Impact', sans-serif" }}>Identify Yourself</h2>
        <p className="font-mono text-xs mb-8 text-gray-400">COMPLETE YOUR PROFILE PROJECTION TO CONTINUE.</p>
        <form onSubmit={handleSaveProfile} className="space-y-6 font-mono text-sm">
          <div><label className="block mb-2 font-bold text-[#CCFF00]">OPERATIVE NAME *</label><input type="text" required value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your display name..." className="w-full p-4 bg-black border border-[#333] text-white focus:border-[#CCFF00] outline-none" /></div>
          <div>
             <label className="block mb-2 font-bold text-[#CCFF00]">AVATAR PROJECTION (OPTIONAL)</label>
             <div className="grid grid-cols-4 gap-2 mb-4">
               {AVATAR_PRESETS.map((url, i) => (<div key={i} onClick={() => setAvatarUrl(url)} className={`cursor-pointer aspect-square border-2 overflow-hidden ${avatarUrl === url ? 'border-[#CCFF00]' : 'border-transparent opacity-50 hover:opacity-100'}`}><img src={url} alt={`preset-${i}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" /></div>))}
             </div>
             <input type="url" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="Or paste a custom image URL..." className="w-full p-3 bg-black border border-[#333] text-white text-xs focus:border-[#CCFF00] outline-none" />
          </div>
          <button disabled={loading || !name.trim()} type="submit" className="w-full bg-[#CCFF00] text-black font-black py-4 uppercase tracking-widest disabled:opacity-50 hover:bg-white transition-colors">{loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Save & Enter Nexus"}</button>
          <button type="button" onClick={() => handleNavigate('account')} className="w-full text-center text-xs text-gray-500 hover:text-white uppercase tracking-widest">Skip for now</button>
        </form>
      </div>
    </div>
  );
};

// --- REDESIGNED MYNTRA-STYLE ACCOUNT PAGE ---
const Account = ({ appState }) => {
  const { theme, isLight, user, setUser, handleNavigate } = appState;
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders', 'addresses', 'settings'
  const [myOrders, setMyOrders] = useState([]);
  const [addrForm, setAddrForm] = useState({ address: '', city: '', state: '', pin: '' });
  const [savedAddr, setSavedAddr] = useState(null);
  const [updateName, setUpdateName] = useState(user?.displayName || '');
  const [updateAvatar, setUpdateAvatar] = useState(user?.photoURL || '');

  useEffect(() => {
    let unsubOrders;
    if (user && activeTab === 'orders') {
      unsubOrders = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'orders')), (snap) => {
         const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         const userOrders = allOrders.filter(o => o.userId === user.uid).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
         setMyOrders(userOrders);
      }, (err) => console.error("Account orders fetch error:", err));
    }
    if (user) {
      getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state')).then(docSnap => {
         if (docSnap.exists() && docSnap.data().savedAddress) { setSavedAddr(docSnap.data().savedAddress); setAddrForm(docSnap.data().savedAddress); }
      }).catch(err => console.error(err));
    }
    return () => { if(unsubOrders) unsubOrders(); };
  }, [user, activeTab]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), { savedAddress: addrForm }, { merge: true }); setSavedAddr(addrForm); alert("Coordinates Saved."); } catch (err) { alert("Failed to save address."); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if(!updateName) return;
    try { await updateProfile(auth.currentUser, { displayName: updateName, photoURL: updateAvatar }); setUser({...auth.currentUser, displayName: updateName, photoURL: updateAvatar}); alert("Profile Update Complete."); setActiveTab('menu'); } catch(err) { alert("Update Failed."); }
  };

  const handleLogout = () => { signOut(auth).then(()=>handleNavigate('home')); };

  // Menu View (Myntra Style Grid)
  if (activeTab === 'menu') {
    return (
      <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen pb-20 font-mono">
        <h2 className={`text-4xl font-black uppercase tracking-tighter mb-8 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Account</h2>
        
        {/* Profile Overview Card */}
        <div className={`${theme.card} border ${theme.border} p-6 flex items-center gap-6 mb-8`}>
          {user?.photoURL ? (
             <img src={user.photoURL} alt="Profile" className={`w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 ${theme.border}`} />
          ) : (
             <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-black text-3xl md:text-4xl ${isLight ? 'bg-black text-white' : 'bg-[#CCFF00] text-black'}`}>
               {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'A')}
             </div>
          )}
          <div>
            <h3 className={`text-xl md:text-2xl font-bold uppercase ${theme.text}`}>{user?.displayName || 'OPERATIVE'}</h3>
            <p className={`text-xs md:text-sm mt-1 ${theme.textMuted}`}>{user?.email || user?.phoneNumber}</p>
            <p className="inline-block mt-3 text-[#8A2BE2] text-[10px] md:text-xs font-bold bg-[#8A2BE2]/10 px-3 py-1 rounded-full border border-[#8A2BE2]/30">
              {user?.isAnonymous ? 'GUEST TIER' : 'INSIDER TIER'}
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={()=>setActiveTab('orders')} className={`${theme.card} border ${theme.border} p-6 text-left hover:border-[#8A2BE2] transition-colors group flex flex-col justify-between h-32`}>
             <div className="flex items-center gap-3 mb-2"><Package className={theme.text} size={24} /> <span className={`font-bold uppercase ${theme.text}`}>Orders</span></div>
             <p className={`text-xs ${theme.textMuted} group-hover:${theme.text}`}>Check your transmission history and fulfillment status.</p>
          </button>
          
          <button onClick={()=>setActiveTab('addresses')} className={`${theme.card} border ${theme.border} p-6 text-left hover:border-[#8A2BE2] transition-colors group flex flex-col justify-between h-32`}>
             <div className="flex items-center gap-3 mb-2"><MapPin className={theme.text} size={24} /> <span className={`font-bold uppercase ${theme.text}`}>Addresses</span></div>
             <p className={`text-xs ${theme.textMuted} group-hover:${theme.text}`}>Save drop coordinates for seamless rapid checkout.</p>
          </button>
          
          <button onClick={()=>setActiveTab('settings')} className={`${theme.card} border ${theme.border} p-6 text-left hover:border-[#8A2BE2] transition-colors group flex flex-col justify-between h-32`}>
             <div className="flex items-center gap-3 mb-2"><SettingsIcon className={theme.text} size={24} /> <span className={`font-bold uppercase ${theme.text}`}>Profile Details</span></div>
             <p className={`text-xs ${theme.textMuted} group-hover:${theme.text}`}>Modify your identity, operative name, and avatar.</p>
          </button>

          <button onClick={handleLogout} className={`${theme.card} border ${theme.border} p-6 text-left hover:border-red-500 hover:bg-red-500/5 transition-colors group flex flex-col justify-between h-32 md:col-span-2 lg:col-span-3`}>
             <div className="flex items-center gap-3 mb-2 text-red-500"><LogOutIcon size={24} /> <span className="font-bold uppercase">Logout</span></div>
             <p className="text-xs text-red-500/70 group-hover:text-red-500">Disconnect from the neural net and exit terminal.</p>
          </button>
        </div>
      </div>
    );
  }

  // Sub-Views (Orders, Addresses, Settings)
  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen pb-20 font-mono">
      <button onClick={() => setActiveTab('menu')} className={`${theme.textMuted} hover:${theme.text} text-xs mb-8 flex items-center gap-2 uppercase tracking-widest transition-colors`}>
         <ArrowLeft size={16} /> Back to Account Menu
      </button>

      <div className={`${theme.card} border ${theme.border} p-6 md:p-10 min-h-[500px]`}>
        {activeTab === 'orders' && (
          <div className="animate-in fade-in">
             <h3 className={`font-black text-2xl uppercase tracking-tighter mb-8 border-b ${theme.border} pb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Transmissions & Orders</h3>
             {myOrders.length === 0 ? (
                <div className="text-center py-20"><p className={`text-sm ${theme.textMuted}`}>NO TRANSMISSION HISTORY DETECTED.</p><button onClick={() => handleNavigate('shop')} className={`mt-6 font-bold px-8 py-3 uppercase tracking-widest transition-colors ${theme.btnPrimary}`}>Enter Shop</button></div>
             ) : (
                <div className="space-y-6">
                   {myOrders.map(order => (
                      <div key={order.id} className={`border ${theme.border} p-4 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-${isLight ? 'white' : 'black'}`}>
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <span className={`px-2 py-1 text-[10px] font-bold uppercase ${order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' : order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-600 border border-green-500/30' : 'bg-[#8A2BE2]/20 text-[#8A2BE2] border border-[#8A2BE2]/30'}`}>{order.status}</span>
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
                   ))}
                </div>
             )}
          </div>
        )}
        
        {activeTab === 'addresses' && (
          <div className="animate-in fade-in max-w-xl mx-auto">
             <h3 className={`font-black text-2xl uppercase tracking-tighter mb-8 border-b ${theme.border} pb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Default Coordinates</h3>
             {savedAddr && (
                <div className={`p-5 mb-8 border-l-4 border-[#8A2BE2] bg-[#8A2BE2]/10 text-sm ${theme.text}`}>
                   <p className="font-bold text-[#8A2BE2] mb-2 uppercase flex items-center gap-2"><CheckCircle size={16}/> Active Coordinates</p>
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
             <h3 className={`font-black text-2xl uppercase tracking-tighter mb-8 border-b ${theme.border} pb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Profile Details</h3>
             <form onSubmit={handleUpdateProfile} className="space-y-6 text-sm">
                <div><label className={`block mb-2 font-bold ${theme.accent}`}>OPERATIVE NAME</label><input required value={updateName} onChange={e=>setUpdateName(e.target.value)} className={`w-full p-4 outline-none ${theme.input}`} /></div>
                <div>
                   <label className={`block mb-2 font-bold ${theme.accent}`}>AVATAR PROJECTION URL</label>
                   <div className="flex gap-4 mb-4">
                      {updateAvatar ? <img src={updateAvatar} className={`w-16 h-16 rounded-full object-cover border ${theme.border}`} /> : <div className={`w-16 h-16 rounded-full flex items-center justify-center ${theme.border} border border-dashed text-gray-500`}>N/A</div>}
                      <div className="flex-1"><input value={updateAvatar} onChange={e=>setUpdateAvatar(e.target.value)} placeholder="Paste new image URL..." className={`w-full p-4 outline-none ${theme.input}`} /></div>
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
  const { theme, isLight, user, cart, cartTotal, freeShippingThreshold, setCart, saveUserData, wishlist, handleNavigate } = appState;
  const [formData, setFormData] = useState({ name: '', address: '', city: '', state: '', pin: '', phone: '' });
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fetchingCity, setFetchingCity] = useState(false);

  useEffect(() => {
    if (user) {
       setFormData(prev => ({ ...prev, name: user.displayName || '', phone: user.phoneNumber ? user.phoneNumber.replace('+91', '') : '' }));
       getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state')).then(docSnap => {
          if (docSnap.exists() && docSnap.data().savedAddress) { setFormData(prev => ({ ...prev, ...docSnap.data().savedAddress })); }
       }).catch(e => console.error(e));
    }
  }, [user]);

  const handlePhoneChange = (e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setFormData({...formData, phone: val}); };
  const handlePinChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({...prev, pin: val}));
    if (val.length === 6) {
      setFetchingCity(true);
      try { const res = await fetch(`https://api.postalpincode.in/pincode/${val}`); const data = await res.json(); if (data && data[0].Status === 'Success') { const po = data[0].PostOffice[0]; setFormData(prev => ({...prev, city: po.District, state: po.State})); } } catch (e) { console.error(e); } finally { setFetchingCity(false); }
    }
  };

  const handlePlaceOrder = async (e) => { 
    e.preventDefault(); 
    if(!user) { alert("AUTHENTICATION REQUIRED."); return; }
    if(formData.phone.length !== 10) { alert("PHONE MUST BE 10 DIGITS."); return; }
    if(formData.pin.length !== 6) { alert("PINCODE MUST BE 6 DIGITS."); return; }
    setProcessing(true); 
    try {
      const orderTotal = cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150;
      const displayUser = user.displayName || (user.email ? user.email.replace('@cyber.net', '') : 'Guest');
      const orderData = { userId: user.uid, userEmail: displayUser, items: cart, total: orderTotal, shippingInfo: formData, paymentMode: paymentMode, status: 'PENDING', createdAt: new Date().toISOString() };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), orderData);
      setCart([]); saveUserData([], wishlist); setProcessing(false); setShowSuccessModal(true); 
    } catch (err) { console.error("Order sync failed", err); alert("TRANSMISSION FAILED. PLEASE TRY AGAIN."); setProcessing(false); }
  };

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center p-4">
        <div className="bg-[#0A0A0A] border border-red-500/50 w-full max-w-lg p-8 relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6"><AlertOctagon size={40} className="text-red-500 animate-pulse" /></div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2" style={{ fontFamily: "'Impact', sans-serif" }}>Order Secured</h2>
          <p className="font-mono text-sm text-[#CCFF00] mb-6 tracking-widest">TRANSMISSION SUCCESSFUL</p>
          <div className="bg-red-500/10 border border-red-500/30 p-5 mb-8 text-left"><h3 className="text-red-500 font-bold uppercase text-sm mb-2 flex items-center gap-2"><Lock size={16}/> Mandatory Protocol</h3><p className="font-mono text-xs text-gray-300 leading-relaxed">To combat tampering in the supply chain, you <span className="text-white font-bold underline">MUST</span> record a clear, continuous unboxing video when your package arrives. <br/><br/>No claims for missing or damaged items will be processed without unedited video evidence showing the sealed package being opened.</p></div>
          <button onClick={() => { setShowSuccessModal(false); handleNavigate('account'); }} className="w-full bg-white text-black font-black py-4 uppercase tracking-widest hover:bg-[#CCFF00] transition-colors">I Acknowledge & Understand</button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) return (
    <div className="pt-32 px-4 max-w-4xl mx-auto min-h-screen text-center"><h2 className={`text-4xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Secure Checkout</h2><p className={`font-mono text-sm mb-6 ${theme.textMuted}`}>YOUR CART IS EMPTY. RETURN TO THE VOID.</p><button onClick={() => handleNavigate('shop')} className={`font-bold px-8 py-3 uppercase tracking-widest transition-colors ${theme.btnPrimary}`}>Back to Catalog</button></div>
  );

  return (
    <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen pb-20">
      <h2 className={`text-4xl font-black uppercase tracking-tighter mb-8 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Secure Checkout</h2>
      <div className="grid md:grid-cols-2 gap-12">
        <form onSubmit={handlePlaceOrder} className="space-y-8">
          <div className={`${theme.card} border ${theme.border} p-6`}>
            <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>1. Shipping Coordinates</h3>
            <div className="space-y-4 font-mono text-sm">
              <input required placeholder="FULL NAME" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className={`w-full p-3 outline-none ${theme.input}`} />
              <input required placeholder="PHONE NUMBER (10 DIGITS)" value={formData.phone} onChange={handlePhoneChange} className={`w-full p-3 outline-none ${theme.input}`} />
              <input required placeholder="STREET ADDRESS & HOUSE NO." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className={`w-full p-3 outline-none ${theme.input}`} />
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 relative"><input required placeholder="PINCODE" value={formData.pin} onChange={handlePinChange} className={`w-full p-3 outline-none ${theme.input}`} />{fetchingCity && <Loader2 size={14} className={`absolute right-3 top-4 animate-spin ${theme.accent}`} />}</div>
                <input required placeholder="CITY" value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className={`col-span-1 w-full p-3 outline-none ${theme.input}`} />
                <input required placeholder="STATE" value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} className={`col-span-1 w-full p-3 outline-none ${theme.input}`} />
              </div>
            </div>
          </div>
          <div className={`${theme.card} border ${theme.border} p-6`}>
            <h3 className={`font-mono font-bold uppercase mb-4 border-b ${theme.border} pb-2 ${theme.accent}`}>2. Payment Protocol</h3>
            <div className="space-y-3 font-mono text-sm">
              {['UPI', 'CREDIT/DEBIT CARD', 'CASH ON DELIVERY'].map(mode => (
                <label key={mode} className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${paymentMode === mode ? `border-[#8A2BE2] bg-[#8A2BE2]/10` : `${theme.border} hover:border-black/30`}`}><input type="radio" name="payment" value={mode} checked={paymentMode === mode} onChange={(e) => setPaymentMode(e.target.value)} className="accent-[#8A2BE2]" /><span className={`uppercase font-bold ${theme.text}`}>{mode}</span></label>
              ))}
            </div>
          </div>
          <button disabled={processing} type="submit" className={`w-full font-black py-5 uppercase tracking-widest text-lg disabled:opacity-50 flex justify-center items-center transition-colors ${theme.btnPrimary}`}>
            {processing ? <Loader2 className="animate-spin" size={24} /> : `PLACE ORDER • ₹${cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150}`}
          </button>
        </form>
        <div className={`${theme.card} border ${theme.border} p-6 h-fit sticky top-28`}>
           <h3 className={`font-bold uppercase mb-6 border-b ${theme.border} pb-4 ${theme.text}`}>Order Summary</h3>
           <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
             {cart.map((item, idx) => (
               <div key={idx} className="flex gap-4"><img src={item.image} className={`w-16 h-20 object-cover grayscale border ${theme.border}`} /><div className="flex-1 flex flex-col justify-center"><p className={`text-xs font-bold uppercase ${theme.text}`}>{item.name}</p><p className={`font-mono text-[10px] ${theme.textMuted}`}>QTY: 1</p><p className={`font-mono text-xs mt-1 ${theme.accent}`}>₹{item.price}</p></div></div>
             ))}
           </div>
           <div className={`border-t ${theme.border} pt-4 space-y-2 font-mono text-sm`}>
             <div className={`flex justify-between ${theme.textMuted}`}><span>SUBTOTAL</span><span>₹{cartTotal}</span></div>
             <div className={`flex justify-between ${theme.textMuted}`}><span>SHIPPING</span><span>{cartTotal > freeShippingThreshold ? 'FREE' : '₹150'}</span></div>
             <div className={`flex justify-between font-bold text-lg pt-4 border-t ${theme.border} mt-2 ${theme.text}`}><span>TOTAL</span><span className={theme.accent}>₹{cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150}</span></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const HelpCenter = ({ appState }) => {
  const { theme, isLight, user } = appState;
  const [ticketMsg, setTicketMsg] = useState(''); const [ticketSent, setTicketSent] = useState(false); const [openFaq, setOpenFaq] = useState(null);
  const faqs = [{ q: "Where is my order?", a: "Once processed, you will receive a tracking link. Pan-India delivery takes 48-72 hours." }, { q: "Do you offer returns?", a: "Yes, within 7 days. HOWEVER, an unedited unboxing video is strictly mandatory." }, { q: "What does 'Heavyweight Cotton' mean?", a: "We use 240GSM to 400GSM cotton. It is thicker, more durable, and drapes better." }, { q: "Do you restock sold-out items?", a: "Rarely. Join the WhatsApp underground list to get notified." }];
  const handleSubmitTicket = async (e) => { e.preventDefault(); if(!ticketMsg.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tickets'), { userEmail: user?.displayName || (user?.email ? user.email.replace('@cyber.net', '') : 'Anonymous'), message: ticketMsg, status: 'OPEN', createdAt: new Date().toISOString(), reply: null }); setTicketSent(true); setTicketMsg(''); } catch (err) { console.error(err); alert("Failed to transmit."); } };

  return (
    <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen pb-20">
      <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Help & Transmissions</h2>
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

const ProductDetail = ({ appState }) => {
  const { theme, isLight, selectedProduct, setShowSizeAI, addToCart, toggleWishlist, wishlist } = appState;
  const [activeTab, setActiveTab] = useState('desc');
  return (
    <div className="pt-24 pb-32 md:pb-12 px-4 max-w-7xl mx-auto min-h-screen">
       <button onClick={() => window.history.back()} className={`${theme.textMuted} hover:${theme.text} font-mono text-xs mb-8 flex items-center gap-2 uppercase tracking-widest transition-colors`}><ArrowLeft size={16} /> Back to Catalog</button>
       <div className="grid md:grid-cols-2 gap-12 items-start">
         <div className="space-y-4 md:sticky md:top-24">
           <div className={`aspect-[4/5] ${theme.card} border ${theme.border} relative overflow-hidden group w-full`}><img src={selectedProduct.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={selectedProduct.name} />{selectedProduct.badge && <div className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1 uppercase tracking-widest ${isLight ? 'bg-black text-white' : 'bg-[#CCFF00] text-black'}`}>{selectedProduct.badge}</div>}</div>
           <div className="grid grid-cols-3 gap-4 hidden md:grid">{[1,2,3].map(i => (<div key={i} className={`aspect-square ${theme.card} border ${theme.border} cursor-pointer hover:border-gray-400 overflow-hidden`}><img src={selectedProduct.image} className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity" /></div>))}</div>
         </div>
         <div className="flex flex-col">
           <div className="mb-6 border-b border-gray-200 pb-6"><div className="flex items-center gap-2 mb-3"><div className="flex text-[#8A2BE2] drop-shadow-sm">{[1,2,3,4,5].map(star => <Star key={star} size={14} fill="currentColor" />)}</div><span className={`text-xs font-mono ${theme.textMuted}`}>(128 Reviews)</span></div><h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>{selectedProduct.name}</h1><p className={`text-3xl font-mono ${isLight ? 'text-black font-extrabold' : 'text-[#E5E5E5]'}`}>₹{selectedProduct.price}</p></div>
           <div className="mb-8"><div className="flex justify-between items-center mb-4"><span className={`font-bold uppercase tracking-widest text-sm ${theme.text}`}>Select Size</span><button onClick={() => setShowSizeAI(true)} className="text-[#8A2BE2] flex items-center gap-2 font-mono text-xs hover:underline cursor-pointer"><Ruler size={14} /> Size Guide</button></div><div className="grid grid-cols-4 gap-4">{['S', 'M', 'L', 'XL'].map(s => <button key={s} className={`h-14 border font-mono text-lg transition-colors ${isLight ? 'border-black/20 text-black hover:border-black hover:bg-black/5 focus:border-black focus:bg-black focus:text-white' : 'border-white/20 text-white hover:border-[#CCFF00] hover:text-[#CCFF00] focus:border-[#CCFF00] focus:bg-[#CCFF00]/10'}`}>{s}</button>)}</div></div>
           <div className="hidden md:flex gap-4 mb-10"><button onClick={() => addToCart(selectedProduct)} className={`flex-1 font-black py-5 uppercase tracking-[0.2em] text-sm transition-colors ${theme.btnPrimary} relative overflow-hidden group`}><div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div><span className="relative z-10 flex items-center justify-center gap-2"><ShoppingBag size={18} /> Add To Cart</span></button><button onClick={() => toggleWishlist(selectedProduct)} className={`w-16 flex items-center justify-center border transition-colors ${isLight ? 'border-black/20 text-black hover:border-black' : 'border-white/20 text-white hover:border-[#8A2BE2]'}`}><Heart fill={wishlist.find(i => i.id === selectedProduct.id) ? (isLight ? "#000" : "#8A2BE2") : "none"} /></button></div>
           <div className="space-y-4">
              <div className={`border ${theme.border} ${theme.card}`}><button onClick={() => setActiveTab(activeTab === 'desc' ? '' : 'desc')} className="w-full flex justify-between items-center p-4 font-bold uppercase tracking-widest text-sm">Product Details {activeTab === 'desc' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>{activeTab === 'desc' && <div className={`p-4 pt-0 text-sm font-mono leading-relaxed ${theme.textMuted}`}>{selectedProduct.description || "Forged for the urban dystopia. This piece features advanced construction and proprietary fabric blends."}<ul className="mt-4 space-y-2 text-xs"><li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#8A2BE2] rounded-full"></div> 100% Premium Heavyweight Cotton</li><li className="flex items-center gap-2"><div className="w-1 h-1 bg-[#8A2BE2] rounded-full"></div> Oversized drop-shoulder fit</li></ul></div>}</div>
              <div className={`border ${theme.border} ${theme.card}`}><button onClick={() => setActiveTab(activeTab === 'ship' ? '' : 'ship')} className="w-full flex justify-between items-center p-4 font-bold uppercase tracking-widest text-sm">Shipping & Returns {activeTab === 'ship' ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>{activeTab === 'ship' && <div className={`p-4 pt-0 text-xs font-mono space-y-3 ${theme.textMuted}`}><p className="flex items-center gap-2"><Truck size={14} className={theme.accent} /> Express Pan-India delivery within 48-72 hours.</p><p className="flex items-center gap-2"><RefreshCw size={14} className="text-[#8A2BE2]" /> 7-day returns. Mandatory unboxing video required.</p></div>}</div>
           </div>
         </div>
       </div>
       <div className={`fixed bottom-0 left-0 right-0 p-4 ${isLight ? 'bg-white/90 border-black/10' : 'bg-black/90 border-white/10'} backdrop-blur-md border-t md:hidden z-40 transform transition-transform`}><div className="flex gap-2"><button onClick={() => toggleWishlist(selectedProduct)} className={`w-14 flex items-center justify-center border transition-colors ${isLight ? 'border-black/20 text-black hover:border-black' : 'border-white/20 text-white hover:border-[#8A2BE2]'}`}><Heart fill={wishlist.find(i => i.id === selectedProduct.id) ? (isLight ? "#000" : "#8A2BE2") : "none"} /></button><button onClick={() => addToCart(selectedProduct)} className={`flex-1 font-black py-4 uppercase tracking-widest flex justify-center items-center gap-2 ${theme.btnPrimary}`}><ShoppingBag size={18} /> ₹{selectedProduct.price}</button></div></div>
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
          <div><h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>{shopCategory === 'All Categories' ? 'The Collection' : shopCategory}</h2><p className={`font-mono text-xs mt-1 md:mt-2 uppercase tracking-widest ${theme.textMuted}`}>[{filteredProducts.length} Items Detected]</p></div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4"><button onClick={() => setShowVibeMatcher(true)} className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-[#8A2BE2]/10 text-[#8A2BE2] border border-[#8A2BE2]/30 px-4 py-2.5 font-mono text-xs uppercase hover:bg-[#8A2BE2] hover:text-white transition-all"><Sparkles size={14} /> AI Vibe Check</button><div className={`flex items-center border ${theme.border} px-3 py-2.5 flex-1 md:flex-none bg-transparent`}><span className={`text-[10px] uppercase font-bold mr-2 ${theme.textMuted}`}>Sort:</span><select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`bg-transparent font-mono text-xs uppercase outline-none cursor-pointer ${theme.text} w-full`}><option value="recommended" className="bg-black text-white">Recommended</option><option value="price-high" className="bg-black text-white">Price: High to Low</option><option value="price-low" className="bg-black text-white">Price: Low to High</option></select></div></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{['All Categories', ...categories].map(cat => (<button key={cat} onClick={() => setShopCategory(cat)} className={`whitespace-nowrap px-6 py-2.5 font-mono text-xs font-bold uppercase border transition-colors ${shopCategory === cat ? (isLight ? 'bg-black text-white border-black' : 'bg-[#CCFF00] text-black border-[#CCFF00]') : `border-${isLight?'black/10':'white/10'} ${theme.textMuted} hover:${theme.text} hover:border-${isLight?'black':'white'}`}`}>{cat}</button>))}</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {filteredProducts.map(product => (
        <div key={product.id} className="group cursor-pointer flex flex-col" onClick={() => openProduct(product)}>
          <div className={`relative aspect-[3/4] ${theme.card} overflow-hidden border ${isLight ? 'border-black/5 group-hover:border-black/50' : 'border-white/5 group-hover:border-[#CCFF00]/50'} transition-colors mb-3`}><img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />{product.badge && <div className={`absolute top-2 left-2 md:top-4 md:left-4 text-[8px] md:text-[10px] font-bold px-2 py-1 uppercase mix-blend-screen ${isLight ? 'bg-black text-white' : 'bg-white text-black'}`}>{product.badge}</div>}<div className="absolute inset-0 bg-[#8A2BE2] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity hidden md:block"></div></div>
          <div className="flex flex-col flex-1"><h3 className={`font-bold uppercase tracking-tight text-[11px] md:text-sm mb-1 line-clamp-1 transition-colors ${theme.text} group-hover:text-[#8A2BE2]`}>{product.name}</h3><p className={`font-mono text-[9px] md:text-xs mb-2 ${theme.textMuted}`}>{product.category}</p><span className={`font-mono text-xs md:text-sm mt-auto ${isLight ? 'text-black font-extrabold' : 'text-[#E5E5E5] font-bold'}`}>₹{product.price}</span></div>
        </div>
      ))}
      </div>
    </div>
  );
};

const AdminPanel = ({ appState }) => {
  const { handleNavigate, user, products, setProducts, categories, setCategories } = appState;
  const [adminView, setAdminView] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  
  // Marketing States
  const [promos, setPromos] = useState([{ code: 'NEON20', discount: '20% OFF', usage: '142 / 500', status: 'Active' }]);
  
  // CRM States
  const [crmSearch, setCrmSearch] = useState('');
  
  useEffect(() => {
    let unsubOrders, unsubTickets;
    const authenticateAndFetch = async () => {
      try {
        if (!user) await signInAnonymously(auth);
        unsubOrders = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'orders')), (snap) => {
          const loaded = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
          setOrders(loaded);
        }, (err) => console.error("Admin orders error:", err));
        unsubTickets = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'tickets')), (snap) => {
          const loadedT = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
          setTickets(loadedT);
        }, (err) => console.error("Admin tickets error:", err)); 
      } catch (authErr) { console.error("Admin Auth Error", authErr); }
    }
    authenticateAndFetch();
    return () => { if(unsubOrders) unsubOrders(); if(unsubTickets) unsubTickets(); };
  }, [user]);

  const handleReplyTicket = async (ticketId) => { const reply = prompt("Enter your reply to the user. This will mark the ticket as resolved."); if(reply) { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tickets', ticketId), { status: 'RESOLVED', reply: reply }); } catch(e){} } };

  // --- RESTORED ADMIN FUNCTIONALITIES ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
     try {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderId), { status: newStatus });
     } catch (e) {
       console.error("Failed to update status on DB, updating locally.", e);
       setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
     }
  };

  const handleAddProduct = () => {
    const name = prompt("Enter new product name:");
    if (!name) return;
    const price = prompt("Enter price (INR):", "2999");
    const category = prompt(`Enter category (${categories.join('/')}):`, categories[0] || "Tops");
    const image = prompt("Paste Image URL:", "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800");
    
    const newProduct = {
       id: Date.now(),
       name: name.toUpperCase(),
       price: parseInt(price) || 2999,
       category: category || categories[0],
       stock: 10,
       image: image || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
       badge: "NEW DROP"
    };
    setProducts([newProduct, ...products]);
  };

  const handleDeleteProduct = (prodId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter(p => p.id !== prodId));
    }
  };

  const handleAddCategory = () => {
     const newCat = prompt("Enter new category name:");
     if (newCat && !categories.includes(newCat)) {
        setCategories([...categories, newCat]);
     }
  };

  // Marketing Actions
  const handleAddPromo = () => {
    const code = prompt("Enter New Promo Code (e.g. CYBER50):");
    if (!code) return;
    const discount = prompt("Enter Discount details (e.g. 50% OFF):", "10% OFF");
    setPromos([{ code: code.toUpperCase(), discount, usage: '0 / 100', status: 'Active' }, ...promos]);
  };

  const handleRevokePromo = (codeToRevoke) => {
    if (window.confirm(`Revoke promo code ${codeToRevoke}?`)) {
      setPromos(promos.map(p => p.code === codeToRevoke ? { ...p, status: 'Revoked' } : p));
    }
  };

  // Derive CRM Users from Orders
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
    { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics Dashboard' }, 
    { id: 'orders', icon: Package, label: 'Fulfillment Tracking' }, 
    { id: 'products', icon: Box, label: 'Product & Catalog' }, 
    { id: 'crm', icon: Users, label: 'Customer Relations' }, 
    { id: 'marketing', icon: Tag, label: 'Marketing & Promos' },
    { id: 'tickets', icon: MessageSquare, label: 'Support Inbox' }
  ];
  
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col md:flex-row cursor-default font-mono selection:bg-[#CCFF00] selection:text-black">
      <div className="w-full md:w-72 bg-[#0A0A0A] border-r border-[#333] flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-[#333] flex items-center justify-between bg-black"><div><h1 className="text-2xl font-black uppercase text-[#CCFF00]" style={{ fontFamily: "'Impact', sans-serif" }}>SYS.ADMIN</h1><p className="text-[10px] text-[#8A2BE2] mt-1">DRONA_HQ SECURE PROTOCOL</p></div><button onClick={() => handleNavigate('home')} className="text-gray-500 hover:text-white p-2 border border-[#333] bg-[#0A0A0A]"><X size={14} /></button></div>
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">{DronaTabs.map(item => (<button key={item.id} onClick={() => setAdminView(item.id)} className={`w-full flex items-center justify-between px-4 py-3 uppercase text-xs font-bold border transition-colors ${adminView === item.id ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5 hover:border-[#333]'}`}><div className="flex items-center gap-3"><item.icon size={14} /> {item.label}</div>{item.id === 'tickets' && tickets.filter(t=>t.status==='OPEN').length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">{tickets.filter(t=>t.status==='OPEN').length}</span>}</button>))}</div>
        <div className="p-4 border-t border-[#333] bg-black"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded bg-[#8A2BE2] flex items-center justify-center font-bold text-white text-xs">AD</div><div><p className="text-xs font-bold text-white">MASTER ADMIN</p><p className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span> ONLINE</p></div></div></div>
      </div>
      <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat">
        <div className="max-w-6xl mx-auto">
          
          {adminView === 'dashboard' && (
            <div className="animate-in fade-in"><div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4"><div><h2 className="text-2xl font-black uppercase text-white">Analytics Dashboard</h2><p className="text-xs text-gray-500 mt-1">Real-time visualization of key metrics</p></div><button onClick={() => window.print()} className="bg-[#CCFF00] text-black text-xs font-bold px-4 py-2 uppercase hover:bg-white transition-colors">Export PDF Report</button></div><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Gross Revenue</p><p className="text-3xl text-[#CCFF00]">₹{totalRevenue}</p></div><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Order Volume</p><p className="text-3xl text-white">{orders.length}</p></div><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Open Tickets</p><p className="text-3xl text-red-500">{tickets.filter(t=>t.status==='OPEN').length}</p></div><div className="bg-[#0A0A0A] border border-[#333] p-5"><p className="text-[10px] text-gray-500 mb-2 uppercase">Cart Abandonment</p><p className="text-3xl text-white">64%</p></div></div></div>
          )}
          
          {adminView === 'tickets' && (
            <div className="animate-in fade-in"><div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4"><div><h2 className="text-2xl font-black uppercase text-white">Support Inbox</h2><p className="text-xs text-gray-500 mt-1">Resolve incoming transmissions</p></div></div><div className="space-y-4">{tickets.map(t => (<div key={t.id} className="bg-[#0A0A0A] border border-[#333] p-6"><div className="flex justify-between items-start mb-4"><div><span className="text-white font-bold">{t.userEmail}</span><span className="text-gray-500 text-[10px] ml-4">{new Date(t.createdAt).toLocaleString()}</span></div><span className={`text-[10px] font-bold px-2 py-1 uppercase ${t.status==='OPEN' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{t.status}</span></div><p className="text-sm text-gray-300 mb-4 pb-4 border-b border-[#333]">"{t.message}"</p>{t.status === 'OPEN' ? (<button onClick={()=>handleReplyTicket(t.id)} className="text-[#8A2BE2] text-xs font-bold uppercase hover:underline flex items-center gap-2"><MessageSquare size={14}/> Reply & Resolve</button>) : (<div className="text-xs text-gray-500"><span className="text-[#CCFF00] font-bold">ADMIN REPLY:</span> {t.reply}</div>)}</div>))}{tickets.length === 0 && <p className="text-center text-gray-500 py-8">NO INCOMING TRANSMISSIONS.</p>}</div></div>
          )}
          
          {adminView === 'orders' && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-black uppercase text-white mb-8 border-b border-[#333] pb-4">Fulfillment Tracking</h2>
              <div className="bg-[#0A0A0A] border border-[#333] overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#111] text-gray-400 uppercase">
                    <tr><th className="p-4 border-b border-[#333]">ID</th><th className="p-4 border-b border-[#333]">Customer</th><th className="p-4 border-b border-[#333]">Value</th><th className="p-4 border-b border-[#333]">Date</th><th className="p-4 border-b border-[#333]">Status Action</th></tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {orders.map(o=>(
                      <tr key={o.id} className="border-b border-[#333] hover:bg-[#111]">
                        <td className="p-4">#{o.id.slice(0,8)}</td>
                        <td className="p-4">{o.userEmail}</td>
                        <td className="p-4 text-[#CCFF00]">₹{o.total}</td>
                        <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                           <select 
                             value={o.status} 
                             onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)} 
                             className={`bg-black border p-2 text-[10px] font-bold outline-none cursor-pointer ${o.status === 'PENDING' ? 'text-yellow-500 border-yellow-500/30' : o.status === 'DELIVERED' ? 'text-green-500 border-green-500/30' : 'text-[#8A2BE2] border-[#8A2BE2]/30'}`}
                           >
                              <option value="PENDING">MARK PENDING</option>
                              <option value="SHIPPED">MARK SHIPPED</option>
                              <option value="DELIVERED">MARK DELIVERED</option>
                           </select>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">NO ORDERS DETECTED.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {adminView === 'products' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                <h2 className="text-2xl font-black uppercase text-white">Product Catalog</h2>
                <div className="flex gap-4">
                  <button onClick={handleAddCategory} className="bg-[#111] border border-[#333] text-white px-4 py-2 text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
                    + Add Category
                  </button>
                  <button onClick={handleAddProduct} className="bg-[#8A2BE2] text-white px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 hover:bg-purple-600 transition-colors">
                    <Plus size={14}/> Inject Product
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(p=>(
                  <div key={p.id} className="bg-[#0A0A0A] border border-[#333] flex flex-col group relative">
                    <img src={p.image} className="w-full h-40 object-cover mb-2 grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all"/>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-xs text-white font-bold truncate uppercase">{p.name}</p>
                      <p className="text-[10px] text-gray-500 mb-2">{p.category}</p>
                      <p className="text-[#CCFF00] text-xs font-bold mt-auto">₹{p.price}</p>
                    </div>
                    <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-sm">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW: CRM TAB RESTORED */}
          {adminView === 'crm' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Customer Relations</h2>
                  <p className="text-xs text-gray-500 mt-1">Derived from transmission history</p>
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
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Total Spent:</span><span className="text-[#CCFF00] font-bold">₹{u.totalSpent}</span></div>
                    <div className="flex justify-between text-xs mb-4"><span className="text-gray-500">Total Orders:</span><span className="text-white font-bold">{u.orderCount}</span></div>
                  </div>
                ))}
                {crmUsers.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">NO CUSTOMER DATA MATCHED IN SECURE RECORDS.</p>}
              </div>
            </div>
          )}

          {/* NEW: MARKETING & PROMOS RESTORED */}
          {adminView === 'marketing' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white">Marketing & Promos</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage active voucher codes</p>
                </div>
                <button onClick={handleAddPromo} className="bg-[#8A2BE2] text-white text-xs font-bold px-4 py-2 uppercase flex items-center gap-2 hover:bg-purple-600 transition-colors">
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
                        <td className={`p-4 font-bold ${promo.status === 'Active' ? 'text-[#CCFF00]' : 'text-gray-500'}`}>{promo.discount}</td>
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
  const { theme, wishlist, addToCart } = appState;
  return (
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
};

const Home = ({ appState }) => {
  const { enterVault } = appState;
  return (
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
};

const Footer = ({ appState }) => {
  const { view, theme, handleNavigate } = appState;
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  if (view === 'admin' || view === 'profile-setup') return null;
  return (
    <footer className={`${theme.bg} border-t ${theme.border} py-12 px-4 mt-20 transition-colors duration-1000`}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Join The Underground</h2>
          <p className={`font-mono text-xs mb-6 max-w-sm ${theme.textMuted}`}>No spam. Only restock alerts and secret drops.</p>
          {joined ? (
            <div className={`font-bold font-mono text-sm uppercase ${theme.accent} flex items-center gap-2`}><CheckCircle size={16}/> Frequency Logged. Welcome.</div>
          ) : (
            <form onSubmit={(e)=>{e.preventDefault(); if(email) setJoined(true);}} className="flex">
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Identifier..." className={`bg-transparent border p-3 font-mono outline-none w-64 ${theme.input}`} />
              <button type="submit" className={`font-bold px-6 uppercase transition-colors ${theme.btnPrimary}`}>Join</button>
            </form>
          )}
        </div>
        <div className={`text-left md:text-right font-mono text-[10px] space-y-2 ${theme.textMuted}`}>
          <p className="text-gray-400 text-xs tracking-[0.2em] uppercase mb-4">Darkside - Embrace the light.</p>
          <p>© 2026 DARKSIDE CLOTHING INDIA.</p>
          <div className="flex gap-4 md:justify-end mt-4 pt-4 border-t border-gray-500/20">
             <button onClick={()=>handleNavigate('help')} className="hover:text-white uppercase tracking-widest">Help & FAQs</button>
             <button className="hover:text-white uppercase tracking-widest">Terms & Conditions</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- RENDER CONTENT CONTROLLER ---
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
    case 'admin': return <AdminPanel appState={appState} />;
    default: return <Home appState={appState} />;
  }
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState(['Outerwear', 'Tops', 'Bottoms', 'Hardware']); // DYNAMIC CATEGORIES
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSizeAI, setShowSizeAI] = useState(false);
  const [showVibeMatcher, setShowVibeMatcher] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState('All Categories');
  const [user, setUser] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const isLight = view !== 'home' && view !== 'admin' && view !== 'profile-setup';
  
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const freeShippingThreshold = 5000;
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
        } else { setSelectedProduct(null); }
        setIsCartOpen(false); setShowSizeAI(false); setShowVibeMatcher(false); setIsMobileMenuOpen(false);
      } else { setView('home'); setSelectedProduct(null); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

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

  const handleNavigate = (newView) => {
    setView(newView); setSelectedProduct(null); setIsMobileMenuOpen(false); window.scrollTo(0, 0);
    window.history.pushState({ view: newView, product: null }, '', '#' + newView);
  };

  const openProduct = (product) => {
    setSelectedProduct(product); window.scrollTo(0, 0);
    window.history.pushState({ view: view, product: product.id }, '', '#product-' + product.id);
  };

  const saveUserData = async (newCart, newWishlist) => {
    if (!user) return;
    try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'userdata', 'state'), { cart: newCart, wishlist: newWishlist }, { merge: true }); } catch(e) {}
  };

  const enterVault = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 50, 200]);
    setIsFlashing(true);
    setTimeout(() => { handleNavigate('shop'); setTimeout(() => { setIsFlashing(false); }, 100); }, 500);
  };

  const toggleWishlist = (product) => {
    let newWishlist = wishlist.find(item => item.id === product.id) ? wishlist.filter(item => item.id !== product.id) : [...wishlist, product];
    setWishlist(newWishlist); saveUserData(cart, newWishlist);
  };
  
  const addToCart = (product) => { const newCart = [...cart, product]; setCart(newCart); setIsCartOpen(true); saveUserData(newCart, wishlist); };
  const removeFromCart = (index) => { const newCart = cart.filter((_, i) => i !== index); setCart(newCart); saveUserData(newCart, wishlist); };

  const appState = {
    view, setView, cart, setCart, wishlist, setWishlist, products, setProducts,
    categories, setCategories, // <-- Added categories here
    isCartOpen, setIsCartOpen, showSizeAI, setShowSizeAI, showVibeMatcher, setShowVibeMatcher,
    selectedProduct, setSelectedProduct, isMobileMenuOpen, setIsMobileMenuOpen,
    shopCategory, setShopCategory, user, setUser, isFlashing, setIsFlashing,
    isLight, theme, cartTotal, freeShippingThreshold, progressToFreeShipping,
    handleNavigate, openProduct, enterVault, toggleWishlist, addToCart, removeFromCart, saveUserData
  };

  return (
    <div className={`${theme.bg} ${theme.text} selection:bg-[#8A2BE2] selection:text-white min-h-screen cursor-none transition-colors duration-1000 ease-in-out`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&display=swap');
        body { font-family: 'JetBrains Mono', monospace; } .font-mono { font-family: 'JetBrains Mono', monospace; } .font-display { font-family: 'Oswald', sans-serif; letter-spacing: -0.02em; }
        html { scroll-behavior: smooth; }
        @keyframes pan-bg { 0% { transform: scale(1) translate(0px, 0px); } 50% { transform: scale(1.05) translate(-10px, -10px); } 100% { transform: scale(1) translate(0px, 0px); } } .animate-pan-bg { animation: pan-bg 20s ease-in-out infinite; }
        @keyframes reveal { 0% { opacity: 0; transform: translateY(30px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-reveal-1 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .animate-reveal-2 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; } .animate-reveal-3 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; } .animate-reveal-4 { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards; }
        @keyframes scan-line { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } } .animate-scan-line { animation: scan-line 6s linear infinite; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-25%); } } .animate-marquee { animation: marquee 12s linear infinite; width: fit-content; }
        .glitch-hover { position: relative; } .glitch-hover:hover::before, .glitch-hover:hover::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; } .glitch-hover:hover::before { left: 2px; text-shadow: -1px 0 #CCFF00; animation: glitch-anim-1 2s infinite linear alternate-reverse; } .glitch-hover:hover::after { left: -2px; text-shadow: -1px 0 #8A2BE2; animation: glitch-anim-2 3s infinite linear alternate-reverse; }
        @keyframes glitch-anim-1 { 0% { clip-path: inset(20% 0 80% 0); } 20% { clip-path: inset(60% 0 10% 0); } 40% { clip-path: inset(40% 0 50% 0); } 60% { clip-path: inset(80% 0 5% 0); } 80% { clip-path: inset(10% 0 70% 0); } 100% { clip-path: inset(30% 0 20% 0); } } @keyframes glitch-anim-2 { 0% { clip-path: inset(10% 0 60% 0); } 20% { clip-path: inset(80% 0 5% 0); } 40% { clip-path: inset(30% 0 20% 0); } 60% { clip-path: inset(70% 0 10% 0); } 80% { clip-path: inset(20% 0 50% 0); } 100% { clip-path: inset(50% 0 30% 0); } }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: ${isLight ? '#f3f4f6' : '#050505'}; } ::-webkit-scrollbar-thumb { background: ${isLight ? '#d1d5db' : '#222'}; } ::-webkit-scrollbar-thumb:hover { background: #8A2BE2; }
        .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* BLINDING FLASH OVERLAY */}
      <div className={`fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-500 ease-in-out ${isFlashing ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

      {view !== 'admin' && view !== 'profile-setup' && <CustomCursor />}
      
      <Navbar appState={appState} />
      
      <main className="relative z-10">
        <AppContent appState={appState} />
      </main>

      {showSizeAI && <SizePredictor appState={appState} />}
      {showVibeMatcher && <VibeMatcher appState={appState} />}

      {/* SLIDE OUT CART */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setIsCartOpen(false)}></div>
          <div className={`w-full max-w-md ${isLight ? 'bg-white' : 'bg-[#050505]'} h-full border-l ${theme.border} flex flex-col relative z-10 transform transition-transform duration-300`}>
            <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}><h2 className={`text-2xl font-black uppercase tracking-tighter ${theme.text}`} style={{ fontFamily: "'Impact', sans-serif" }}>Cart ({cart.length})</h2><button onClick={() => setIsCartOpen(false)} className={`${theme.textMuted} hover:${theme.text}`}><X size={24} /></button></div>
            <div className={`p-4 ${theme.card} border-b ${theme.border}`}><p className={`text-xs font-mono mb-2 ${theme.textMuted}`}>{progressToFreeShipping >= 100 ? "UNLOCKED: FREE PAN-INDIA SHIPPING" : `ADD ₹${freeShippingThreshold - cartTotal} MORE FOR FREE DELIVERY`}</p><div className={`w-full h-1 ${isLight ? 'bg-gray-300' : 'bg-gray-800'} rounded-full overflow-hidden`}><div className="h-full bg-[#8A2BE2] transition-all duration-500" style={{ width: `${progressToFreeShipping}%` }}></div></div></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map((item, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className={`w-20 h-24 border ${theme.border} overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-gray-900'}`}><img src={item.image} className="w-full h-full object-cover grayscale" /></div>
                  <div className="flex-1 flex flex-col justify-between py-1"><div><h4 className={`text-sm font-bold uppercase ${theme.text}`}>{item.name}</h4><p className={`font-mono text-[10px] mt-1 ${theme.textMuted}`}>SIZE: L // QTY: 1</p></div><div className="flex justify-between items-end"><span className={`font-mono font-bold ${theme.accent}`}>₹{item.price}</span><button onClick={() => removeFromCart(index)} className="text-gray-600 hover:text-red-500 text-xs font-bold uppercase underline">Remove</button></div></div>
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