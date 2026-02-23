import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Heart, Search, Menu, X, 
  User, Zap, Crosshair, Smartphone, ChevronRight,
  ShieldCheck, Truck, Fingerprint, Sparkles, Loader2
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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

// Sanitizing appId to prevent Firebase segment errors due to slashes in environment IDs
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'darkside-app';
const appId = rawAppId.replace(/\//g, '_');

// --- MOCK DATABASE ---
const PRODUCTS = [
  { id: 1, name: "VOID WALKER CARGO", price: 3499, category: "Bottoms", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", badge: "HIGH DEMAND", description: "Tactical multi-pocket cargo pants with distressed wash. Perfect for utility and urban exploration." },
  { id: 2, name: "CYBER-DOGMA HOODIE", price: 4299, category: "Outerwear", image: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&q=80&w=800", badge: "FEW LEFT", description: "Heavyweight 400GSM cotton fleece hoodie with an oversized fit and structural hood." },
  { id: 3, name: "ACID WASH TEE V.2", price: 1899, category: "Tops", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800", description: "Drop-shoulder boxy tee with a toxic acid wash finish. Breathable 240GSM cotton." },
  { id: 4, name: "NEON SYNDICATE JACKET", price: 5999, category: "Outerwear", image: "https://images.unsplash.com/photo-1551028919-ac66e624ec6a?auto=format&fit=crop&q=80&w=800", badge: "NEW DROP", description: "Cropped nylon bomber jacket with bright orange inner lining and metallic hardware." },
  { id: 5, name: "SYSTEM FAILURE BEANIE", price: 999, category: "Hardware", image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800", description: "Ribbed knit skull cap with a distressed metal logo plate." },
  { id: 6, name: "STEALTH TACTICAL VEST", price: 4599, category: "Outerwear", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800", description: "Military-grade chest rig and vest combo. Adjustable straps, perfect for layering." },
];

// --- ISOLATED COMPONENTS ---
const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const isClickable = e.target.closest('button, a, input, select, [role="button"], .cursor-pointer, .magnetic');
      setIsHovering(!!isClickable);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[100] mix-blend-difference transition-transform duration-100 ease-out hidden md:flex items-center justify-center"
      style={{ 
        transform: `translate(${mousePos.x - 12}px, ${mousePos.y - 12}px) scale(${isHovering ? 2.5 : 1})`,
        backgroundColor: isHovering ? 'transparent' : '#CCFF00',
        border: isHovering ? '1px solid #CCFF00' : 'none'
      }}
    >
      {isHovering && <span className="text-[4px] font-mono text-[#CCFF00] font-bold">EXPLORE</span>}
    </div>
  );
};

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 24, m: 0, s: 0 });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else if (m > 0) { m--; s = 59; }
        else if (h > 0) { h--; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-4 mb-8 font-mono">
      {[
        { label: 'HRS', value: timeLeft.h },
        { label: 'MIN', value: timeLeft.m },
        { label: 'SEC', value: timeLeft.s }
      ].map((t, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-4xl md:text-6xl text-white font-black bg-[#0A0A0A] border border-white/10 p-4 w-20 md:w-24 text-center">
            {String(t.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-gray-500 mt-2">{t.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState('All Categories');
  const [user, setUser] = useState(null);
  const [checkoutMsg, setCheckoutMsg] = useState('');

  // Firebase Auth & Data Sync
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
          // Document references must have an even number of segments
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
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'userdata', 'state'), {
        cart: newCart,
        wishlist: newWishlist
      }, { merge: true });
    } catch(e) { console.error("Error saving to DB", e); }
  };

  const handleNavigate = (newView) => {
    setView(newView);
    setSelectedProduct(null);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const toggleWishlist = (product) => {
    let newWishlist;
    if (wishlist.find(item => item.id === product.id)) {
      newWishlist = wishlist.filter(item => item.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }
    setWishlist(newWishlist);
    saveUserData(cart, newWishlist);
  };

  const addToCart = (product) => {
    const newCart = [...cart, product];
    setCart(newCart);
    setIsCartOpen(true);
    saveUserData(newCart, wishlist);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    saveUserData(newCart, wishlist);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const freeShippingThreshold = 5000;
  const progressToFreeShipping = Math.min((cartTotal / freeShippingThreshold) * 100, 100);

  // --- SUB-COMPONENTS ---
  const Navbar = () => (
    <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <Menu className="md:hidden text-white hover:text-[#CCFF00] cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          
          <div onClick={() => handleNavigate('home')} className="cursor-pointer relative z-50 flex items-center group">
            <img 
              src="/451404688_834030975111165_2058569119566201452_n.jpg" 
              alt="Darkside" 
              className="h-14 md:h-16 mix-blend-screen object-contain group-hover:scale-105 transition-transform" 
              style={{ filter: 'contrast(1.4) brightness(1.1)' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/400x150/050505/CCFF00?text=THE+DARKSIDE";
                e.target.style.filter = "none";
                e.target.style.mixBlendMode = "normal";
              }}
            />
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          {['Tees', 'Hoodies', 'Cargos'].map(link => (
            <button 
              key={link}
              onClick={() => {
                setShopCategory(link === 'Tees' ? 'Tops' : link === 'Hoodies' ? 'Outerwear' : 'Bottoms');
                handleNavigate('shop');
              }}
              className="text-[#E5E5E5] text-sm font-mono hover:text-[#CCFF00] uppercase tracking-widest transition-colors magnetic"
            >
              {link}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Search className="text-white hover:text-[#CCFF00] cursor-pointer hidden md:block w-5 h-5 magnetic" onClick={() => handleNavigate('shop')} />
          <User onClick={() => handleNavigate(user && !user.isAnonymous ? 'account' : 'auth')} className="text-white hover:text-[#CCFF00] cursor-pointer w-5 h-5 magnetic" />
          <div className="relative cursor-pointer magnetic" onClick={() => handleNavigate('vault')}>
            <Heart className="text-white hover:text-[#8A2BE2] w-5 h-5" />
            {wishlist.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#8A2BE2] text-white text-[10px] font-bold flex items-center justify-center rounded-full">{wishlist.length}</span>}
          </div>
          <div className="relative cursor-pointer magnetic" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag className="text-white hover:text-[#CCFF00] w-5 h-5" />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#CCFF00] text-black text-[10px] font-bold flex items-center justify-center rounded-full">{cart.length}</span>}
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-white/10 p-4 flex flex-col gap-4 absolute top-20 left-0 w-full z-40">
          {['Home', 'Shop', 'Vault', user && !user.isAnonymous ? 'Account' : 'Login'].map(link => (
            <button 
              key={link} 
              onClick={() => {
                setShopCategory('All Categories');
                handleNavigate(link === 'Login' ? 'auth' : link.toLowerCase());
              }} 
              className="text-left text-white font-mono uppercase hover:text-[#CCFF00] py-2 border-b border-white/5"
            >
              {link}
            </button>
          ))}
        </div>
      )}
    </nav>
  );

  const Home = () => (
    <>
      <div className="relative min-h-screen pt-24 pb-12 flex flex-col items-center justify-center overflow-hidden bg-[#050505] border-b border-white/10 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-luminosity animate-pan-bg"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#CCFF00]/40 shadow-[0_0_15px_#CCFF00] animate-scan-line pointer-events-none z-10"></div>

        <div className="absolute top-32 left-8 text-[#CCFF00] font-mono text-[10px] tracking-widest opacity-40 hidden md:block animate-pulse">
          [ SYS.COORD : 28.6139° N, 77.2090° E ]<br/>INITIATING_PROTOCOL_V.9
        </div>
        <div className="absolute bottom-16 right-8 flex items-center gap-4 hidden md:flex opacity-40">
          <div className="text-right text-gray-500 font-mono text-[10px] tracking-widest">TARGET ACQUIRED<br/>AWAITING DIRECTIVE</div>
          <Crosshair size={32} className="text-[#8A2BE2] animate-spin-slow" />
        </div>

        <div className="relative z-10 text-center px-4 w-full max-w-4xl flex flex-col items-center mt-8">
          <div className="opacity-0 animate-reveal-1 mb-8">
             <img 
               src="/451404688_834030975111165_2058569119566201452_n.jpg" 
               alt="The Darkside"
               className="h-24 md:h-32 lg:h-40 mix-blend-screen object-contain drop-shadow-[0_0_30px_rgba(204,255,0,0.15)]"
               style={{ filter: 'contrast(1.5) brightness(1.2)' }}
               onError={(e) => {
                 e.target.onerror = null;
                 e.target.src = "https://placehold.co/600x400/050505/CCFF00?text=THE+DARKSIDE";
                 e.target.style.filter = "none";
                 e.target.style.mixBlendMode = "normal";
               }}
             />
          </div>

          <div className="mb-6 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-1 text-xs font-mono font-bold tracking-widest animate-pulse opacity-0 animate-reveal-2">
            <Zap size={14} /> EXCLUSIVE DROP RELEASING IN
          </div>
          
          <div className="opacity-0 animate-reveal-3">
            <CountdownTimer />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter mb-8 font-display opacity-0 animate-reveal-4">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#8A2BE2] glitch-hover" data-text="SYNDICATE">SYNDICATE</span> COLLECTION
          </h1>
          
          <div className="opacity-0 animate-reveal-4 mt-4 mb-8">
            <button onClick={() => handleNavigate('shop')} className="bg-white text-black px-12 py-5 font-bold uppercase tracking-widest transition-all relative overflow-hidden group/btn border border-white hover:border-[#CCFF00] hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] magnetic">
              <div className="absolute inset-0 bg-[#CCFF00] translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
              <span className="relative z-10 flex items-center justify-center gap-3 group-hover/btn:text-black">
                Enter The Vault <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#CCFF00] py-3 overflow-hidden border-y border-black relative z-20 shadow-[0_0_20px_rgba(204,255,0,0.2)]">
        <div className="animate-marquee whitespace-nowrap text-black font-bold font-mono text-sm tracking-widest flex items-center">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="mx-4">
              ✦ 100% HEAVYWEIGHT COTTON ✦ FREE SHIPPING PAN-INDIA ✦ CASH ON DELIVERY AVAILABLE ✦ NO REFUNDS FOR THE WEAK 
            </span>
          ))}
        </div>
      </div>
    </>
  );

  const Shop = () => {
    const filteredProducts = shopCategory === 'All Categories' ? PRODUCTS : PRODUCTS.filter(p => p.category === shopCategory);
    return (
      <div className="pt-24 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-white/10 pb-4 gap-4">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: "'Impact', sans-serif" }}>Catalog</h2>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select value={shopCategory} onChange={(e) => setShopCategory(e.target.value)} className="flex-1 md:flex-none bg-transparent text-gray-400 border border-white/20 p-2 font-mono text-xs uppercase outline-none cursor-pointer magnetic">
              <option>All Categories</option>
              <option>Outerwear</option>
              <option>Tops</option>
              <option>Bottoms</option>
              <option>Hardware</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <div key={product.id} className="group cursor-pointer magnetic" onClick={() => setSelectedProduct(product)}>
            <div className="relative aspect-[3/4] bg-[#0A0A0A] overflow-hidden border border-white/5 group-hover:border-[#CCFF00]/50 transition-colors mb-4">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              {product.badge && (
                <div className="absolute top-4 left-4 bg-white text-black text-[10px] font-bold px-2 py-1 uppercase mix-blend-screen">{product.badge}</div>
              )}
              <div className="absolute inset-0 bg-[#8A2BE2] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-1 group-hover:text-[#CCFF00] transition-colors">{product.name}</h3>
                <p className="text-gray-500 font-mono text-xs">{product.category}</p>
              </div>
              <span className="text-[#E5E5E5] font-mono font-bold">₹{product.price}</span>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  };

  const ProductDetail = () => (
    <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
       <button onClick={() => setSelectedProduct(null)} className="text-gray-500 hover:text-white font-mono text-sm mb-8 flex items-center gap-2 uppercase magnetic">
         <X size={16} /> Back to Catalog
       </button>
       <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-[#0A0A0A] border border-white/10 relative overflow-hidden group">
            <img src={selectedProduct.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={selectedProduct.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
               <p className="text-[#CCFF00] font-mono text-xs">RAW MATERIALS // PREMIUM HEAVYWEIGHT FABRIC</p>
            </div>
          </div>
          
          <div className="flex flex-col justify-center">
            {selectedProduct.badge && (
              <span className="bg-[#CCFF00] text-black text-[10px] font-bold px-2 py-1 uppercase w-max mb-4">{selectedProduct.badge}</span>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4" style={{ fontFamily: "'Impact', sans-serif" }}>{selectedProduct.name}</h1>
            <p className="text-3xl font-mono text-[#E5E5E5] mb-8">₹{selectedProduct.price}</p>
            
            <div className="border-t border-white/10 py-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-bold uppercase tracking-widest text-sm">Select Size</span>
              </div>
              <div className="flex gap-4">
                {['S', 'M', 'L', 'XL'].map(s => (
                  <button key={s} className="w-12 h-12 border border-white/20 text-white hover:border-[#CCFF00] hover:text-[#CCFF00] font-mono transition-colors focus:border-[#CCFF00] focus:bg-[#CCFF00]/10 magnetic">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button onClick={() => addToCart(selectedProduct)} className="flex-1 bg-[#CCFF00] text-black font-bold py-5 uppercase tracking-widest hover:bg-white transition-colors relative overflow-hidden group magnetic">
                <span className="relative z-10">Add To Cart</span>
              </button>
              <button onClick={() => toggleWishlist(selectedProduct)} className="w-16 flex items-center justify-center border border-white/20 text-white hover:border-[#8A2BE2] hover:text-[#8A2BE2] transition-colors magnetic">
                <Heart fill={wishlist.find(i => i.id === selectedProduct.id) ? "#8A2BE2" : "none"} />
              </button>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 p-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-400 font-mono text-[10px]">
                <ShieldCheck size={16} className="text-[#CCFF00]" /> 100% SECURE CHECKOUT
              </div>
              <div className="flex items-center gap-3 text-gray-400 font-mono text-[10px]">
                <Truck size={16} className="text-[#CCFF00]" /> 48H METRO DELIVERY
              </div>
            </div>
          </div>
       </div>
    </div>
  );

  const Account = () => {
    const handleLogout = async () => {
      await signOut(auth);
      await signInAnonymously(auth);
      handleNavigate('home');
    };
    
    return (
      <div className="pt-24 px-4 max-w-4xl mx-auto min-h-screen">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-8" style={{ fontFamily: "'Impact', sans-serif" }}>Command Center</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-4">
            <div className="bg-[#0A0A0A] border border-white/10 p-6">
              <div className="w-16 h-16 bg-[#CCFF00] rounded-full flex items-center justify-center text-black font-black text-2xl mb-4">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
              </div>
              <h3 className="text-white font-bold uppercase truncate">{user?.email || 'Anonymous GUEST'}</h3>
              <p className="text-[#8A2BE2] font-mono text-xs mt-1">TIER: {user?.isAnonymous ? 'GUEST' : 'UNDERGROUND INSIDER'}</p>
            </div>
            <div className="bg-[#0A0A0A] border border-white/10 p-6 space-y-3 font-mono text-sm">
              <button className="w-full text-left text-[#CCFF00] uppercase hover:underline magnetic">Order History</button>
              <button className="w-full text-left text-gray-400 uppercase hover:text-white magnetic">Saved Addresses</button>
              <button onClick={handleLogout} className="w-full text-left text-red-500 uppercase hover:text-red-400 mt-4 pt-4 border-t border-white/10 magnetic">Logout</button>
            </div>
          </div>
          <div className="col-span-2 bg-[#0A0A0A] border border-white/10 p-6">
            <h3 className="text-white font-bold uppercase mb-6 border-b border-white/10 pb-4">Recent Orders</h3>
            <div className="text-center py-12">
              <p className="text-gray-500 font-mono text-sm">NO ORDERS IN THE SYSTEM YET.</p>
              <button onClick={() => handleNavigate('shop')} className="mt-4 text-[#CCFF00] font-mono text-xs uppercase hover:underline magnetic">Enter Shop</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AuthView = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        if (isSignup) { await createUserWithEmailAndPassword(auth, email, password); } 
        else { await signInWithEmailAndPassword(auth, email, password); }
        handleNavigate('account');
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    };

    return (
      <div className="pt-24 px-4 max-w-md mx-auto min-h-screen">
        <div className="bg-[#0A0A0A] border border-white/10 p-8">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2" style={{ fontFamily: "'Impact', sans-serif" }}>{isSignup ? "Join The Syndicate" : "System Login"}</h2>
          <p className="text-gray-500 font-mono text-xs mb-8">AUTHENTICATE TO ACCESS YOUR VAULT AND SECURE ORDERS.</p>
          {error && <p className="text-red-500 font-mono text-xs mb-4 p-2 bg-red-500/10 border border-red-500/30">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-sm">
            <div>
              <label className="text-[#CCFF00] block mb-1">EMAIL IDENTIFIER</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none" />
            </div>
            <div>
              <label className="text-[#CCFF00] block mb-1">PASSCODE</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-[#CCFF00] text-black font-bold py-4 mt-4 hover:bg-white transition-colors uppercase disabled:opacity-50 flex justify-center items-center magnetic">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignup ? "Create Identity" : "Initialize")}
            </button>
          </form>
          <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-6 text-gray-400 text-xs font-mono uppercase hover:text-white magnetic">
            {isSignup ? "Already registered? Login here." : "No identity? Create one here."}
          </button>
        </div>
      </div>
    );
  };

  const CheckoutView = () => {
    const [formData, setFormData] = useState({ name: '', address: '', city: '', pin: '', phone: '' });
    const [paymentMode, setPaymentMode] = useState('UPI');
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handlePlaceOrder = (e) => {
      e.preventDefault();
      setProcessing(true);
      setTimeout(() => {
        setCart([]);
        saveUserData([], wishlist);
        setProcessing(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          handleNavigate('account');
        }, 3000);
      }, 2000);
    };

    if (cart.length === 0 && !showSuccess) {
      return (
        <div className="pt-32 px-4 max-w-4xl mx-auto min-h-screen text-center">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4" style={{ fontFamily: "'Impact', sans-serif" }}>Secure Checkout</h2>
          <p className="text-gray-500 font-mono text-sm mb-6">YOUR CART IS EMPTY. RETURN TO THE VOID.</p>
          <button onClick={() => handleNavigate('shop')} className="bg-[#CCFF00] text-black font-bold px-8 py-3 uppercase hover:bg-white transition-colors tracking-widest magnetic">Back to Catalog</button>
        </div>
      );
    }

    return (
      <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen pb-20">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-8" style={{ fontFamily: "'Impact', sans-serif" }}>Secure Checkout</h2>
        
        {showSuccess ? (
          <div className="bg-[#0A0A0A] border border-[#CCFF00] p-12 text-center animate-in zoom-in fade-in duration-500">
             <Sparkles className="mx-auto text-[#CCFF00] mb-6" size={64} />
             <h3 className="text-3xl font-black text-white uppercase mb-2">ORDER SECURED</h3>
             <p className="text-gray-400 font-mono">TRANSACTION LOGGED TO THE NEURAL NET. REDIRECTING...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="bg-[#0A0A0A] border border-white/10 p-6">
                <h3 className="text-[#CCFF00] font-mono font-bold uppercase mb-4 border-b border-white/10 pb-2">1. Shipping Coordinates</h3>
                <div className="space-y-4 font-mono text-sm">
                  <input required placeholder="FULL NAME" className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none transition-colors" onChange={e=>setFormData({...formData, name: e.target.value})} />
                  <input required placeholder="STREET ADDRESS" className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none transition-colors" onChange={e=>setFormData({...formData, address: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="CITY" className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none transition-colors" onChange={e=>setFormData({...formData, city: e.target.value})} />
                    <input required placeholder="PINCODE" className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none transition-colors" onChange={e=>setFormData({...formData, pin: e.target.value})} />
                  </div>
                  <input required placeholder="PHONE NUMBER (+91)" className="w-full bg-black border border-white/20 p-3 text-white focus:border-[#CCFF00] outline-none transition-colors" onChange={e=>setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="bg-[#0A0A0A] border border-white/10 p-6">
                <h3 className="text-[#CCFF00] font-mono font-bold uppercase mb-4 border-b border-white/10 pb-2">2. Payment Protocol</h3>
                <div className="space-y-3 font-mono text-sm">
                  {['UPI', 'CREDIT/DEBIT CARD', 'CASH ON DELIVERY'].map(mode => (
                    <label key={mode} className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${paymentMode === mode ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-white/20 hover:border-white/50'}`}>
                      <input type="radio" name="payment" value={mode} checked={paymentMode === mode} onChange={(e) => setPaymentMode(e.target.value)} className="accent-[#CCFF00]" />
                      <span className="text-white uppercase">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button disabled={processing} type="submit" className="w-full bg-[#CCFF00] text-black font-black py-5 uppercase tracking-widest text-lg hover:bg-white transition-colors disabled:opacity-50 flex justify-center items-center magnetic">
                {processing ? <Loader2 className="animate-spin" size={24} /> : `PLACE ORDER • ₹${cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150}`}
              </button>
            </form>
            <div className="bg-[#0A0A0A] border border-white/10 p-6 h-fit sticky top-28">
              <h3 className="text-white font-bold uppercase mb-6 border-b border-white/10 pb-4">Order Summary</h3>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <img src={item.image} className="w-16 h-20 object-cover grayscale border border-white/10" />
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-white text-xs font-bold uppercase">{item.name}</p>
                      <p className="text-gray-500 font-mono text-[10px]">QTY: 1</p>
                      <p className="text-[#CCFF00] font-mono text-xs mt-1">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 space-y-2 font-mono text-sm">
                <div className="flex justify-between text-gray-400"><span>SUBTOTAL</span><span>₹{cartTotal}</span></div>
                <div className="flex justify-between text-gray-400"><span>SHIPPING</span><span>{cartTotal > freeShippingThreshold ? 'FREE' : '₹150'}</span></div>
                <div className="flex justify-between text-white font-bold text-lg pt-4 border-t border-white/10 mt-2">
                  <span>TOTAL</span><span className="text-[#CCFF00]">₹{cartTotal > freeShippingThreshold ? cartTotal : cartTotal + 150}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (selectedProduct) return <ProductDetail />;
    switch(view) {
      case 'home': return <Home />;
      case 'shop': return <Shop />;
      case 'account': return <Account />;
      case 'auth': return <AuthView />;
      case 'checkout': return <CheckoutView />;
      case 'vault': return (
        <div className="pt-24 px-4 max-w-7xl mx-auto min-h-screen text-center">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4" style={{ fontFamily: "'Impact', sans-serif" }}>The Vault</h2>
          {wishlist.length === 0 ? (
            <p className="text-gray-500 font-mono">YOUR VAULT IS EMPTY.</p>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-left">
               {wishlist.map(w => (
                 <div key={w.id} className="bg-[#0A0A0A] border border-white/10 p-4">
                   <img src={w.image} className="w-full aspect-square object-cover mb-2 grayscale" />
                   <p className="text-white text-xs font-bold uppercase truncate">{w.name}</p>
                   <p className="text-[#CCFF00] font-mono text-xs">₹{w.price}</p>
                   <button onClick={() => addToCart(w)} className="w-full mt-2 bg-white text-black text-[10px] font-bold py-2 uppercase hover:bg-[#CCFF00] magnetic">Move to Cart</button>
                 </div>
               ))}
             </div>
          )}
        </div>
      );
      default: return <Home />;
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-[#E5E5E5] selection:bg-[#CCFF00] selection:text-black cursor-none">
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
        .glitch-hover:hover::before, .glitch-hover:hover::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #050505; }
        .glitch-hover:hover::before { left: 2px; text-shadow: -1px 0 #CCFF00; animation: glitch-anim-1 2s infinite linear alternate-reverse; }
        .glitch-hover:hover::after { left: -2px; text-shadow: -1px 0 #8A2BE2; animation: glitch-anim-2 3s infinite linear alternate-reverse; }
        @keyframes glitch-anim-1 { 0% { clip-path: inset(20% 0 80% 0); } 20% { clip-path: inset(60% 0 10% 0); } 40% { clip-path: inset(40% 0 50% 0); } 60% { clip-path: inset(80% 0 5% 0); } 80% { clip-path: inset(10% 0 70% 0); } 100% { clip-path: inset(30% 0 20% 0); } }
        @keyframes glitch-anim-2 { 0% { clip-path: inset(10% 0 60% 0); } 20% { clip-path: inset(80% 0 5% 0); } 40% { clip-path: inset(30% 0 20% 0); } 60% { clip-path: inset(70% 0 10% 0); } 80% { clip-path: inset(20% 0 50% 0); } 100% { clip-path: inset(50% 0 30% 0); } }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #050505; } ::-webkit-scrollbar-thumb { background: #222; } ::-webkit-scrollbar-thumb:hover { background: #CCFF00; }
      `}</style>

      <CustomCursor />
      <Navbar />
      <main className="relative z-10">{renderContent()}</main>

      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={() => setIsCartOpen(false)}></div>
          <div className="w-full max-w-md bg-[#050505] h-full border-l border-white/10 flex flex-col relative z-10 transform transition-transform duration-300">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter" style={{ fontFamily: "'Impact', sans-serif" }}>Cart ({cart.length})</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-white magnetic"><X size={24} /></button>
            </div>
            <div className="p-4 bg-[#0A0A0A] border-b border-white/10">
               <p className="text-xs font-mono text-gray-400 mb-2">{progressToFreeShipping >= 100 ? "UNLOCKED: FREE PAN-INDIA SHIPPING" : `ADD ₹${freeShippingThreshold - cartTotal} MORE FOR FREE DELIVERY`}</p>
               <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-[#CCFF00] transition-all duration-500" style={{ width: `${progressToFreeShipping}%` }}></div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map((item, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="w-20 h-24 bg-gray-900 border border-white/10 overflow-hidden"><img src={item.image} className="w-full h-full object-cover grayscale" /></div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div><h4 className="text-white text-sm font-bold uppercase">{item.name}</h4><p className="text-gray-500 font-mono text-[10px] mt-1">SIZE: L // QTY: 1</p></div>
                    <div className="flex justify-between items-end">
                      <span className="text-[#CCFF00] font-mono font-bold">₹{item.price}</span>
                      <button onClick={() => removeFromCart(index)} className="text-gray-600 hover:text-red-500 text-xs font-bold uppercase underline magnetic">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center text-gray-500 font-mono mt-10">THE CART IS EMPTY.</p>}
            </div>
            <div className="p-6 bg-[#0A0A0A] border-t border-white/10">
              <div className="flex justify-between text-white font-mono mb-6"><span className="uppercase">Subtotal</span><span className="font-bold text-xl">₹{cartTotal}</span></div>
              {checkoutMsg && <div className="mb-4 p-3 bg-[#CCFF00]/10 border border-[#CCFF00] text-[#CCFF00] font-mono text-xs uppercase text-center animate-in fade-in duration-300">{checkoutMsg}</div>}
              <button 
                disabled={cart.length === 0}
                onClick={() => {
                  if (!user || user.isAnonymous) { setCheckoutMsg("ERROR: SAVED DETAILS REQUIRED."); return; }
                  setCheckoutMsg("UPI INTENT SECURED. AWAITING PAYMENT GATEWAY...");
                  setTimeout(() => { setCart([]); saveUserData([], wishlist); setCheckoutMsg(""); setIsCartOpen(false); handleNavigate('account'); }, 3000);
                }}
                className="w-full bg-[#CCFF00] text-black font-black py-4 uppercase tracking-widest text-lg flex items-center justify-center gap-2 mb-3 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed magnetic"
              ><Smartphone size={20} /> FAST PAY VIA UPI</button>
              <button 
                disabled={cart.length === 0} 
                onClick={() => { setIsCartOpen(false); setCheckoutMsg(""); handleNavigate('checkout'); }}
                className="w-full border border-white/20 text-white font-bold py-3 uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed magnetic"
              >Standard Checkout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}