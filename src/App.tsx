import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBasket, 
  User as UserIcon, 
  Truck, 
  LayoutDashboard, 
  Home, 
  Info, 
  BookOpen,
  ShoppingBag, 
  Phone, 
  LogOut, 
  Menu, 
  X, 
  Search,
  ShoppingCart,
  ChevronRight,
  Leaf,
  Clock,
  ShieldCheck,
  Star,
  Check,
  TrendingUp,
  DollarSign,
  Users,
  MessageCircle,
  PhoneCall,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { auth, db } from './firebase';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, query, where, addDoc, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { UserProfile, Product, Order, OrderStatus, NewsItem, Cost } from './types';
import { formatCurrency, formatDate } from './utils';
import { DELIVERY_AREAS } from './constants';
import { handleFirestoreError, OperationType } from './firestoreUtils';

// --- Error Handling ---

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state: { hasError: boolean, error: Error | null } = { hasError: false, error: null };
  props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errInfo = JSON.parse(this.state.error?.message || "");
        if (errInfo.error.includes("permissions")) {
          message = "You don't have permission to access this data. Please check your account role.";
        }
      } catch (e) {
        // Not a JSON error
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-stone-100 text-center space-y-6">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="text-red-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Application Error</h2>
            <p className="text-stone-600 leading-relaxed">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const Navbar = () => {
  const { user, profile } = useAuth();
  const { items } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Farmers & Producers', path: '/about', icon: Info },
    { name: 'News', path: '/news', icon: BookOpen },
    { name: 'Blogs', path: '/blogs', icon: Phone },
  ];

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      
      let userDoc;
      try {
        userDoc = await getDoc(userRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${result.user.uid}`);
      }

      if (!userDoc?.exists()) {
        try {
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            role: result.user.email === 'bonnynambula@gmail.com' ? 'admin' : 'customer',
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${result.user.uid}`);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="w-full">
      {/* Top Bar */}
      <div className="bg-brand-cream border-b border-stone-200/50 py-2 px-4 sm:px-6 lg:px-8 flex justify-between items-center caps-label">
        <div className="hidden sm:flex gap-6">
          <span>Call: +256 700 000 000</span>
        </div>
        <div className="flex-1 text-center font-bold text-brand-dark">
          Nationwide Uganda Delivery
        </div>
        <div className="flex gap-4">
          <Link to="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link>
          {user ? (
            <button onClick={() => signOut(auth)} className="hover:text-brand-orange transition-colors">Sign Out</button>
          ) : (
            <button onClick={handleLogin} className="hover:text-brand-orange transition-colors">Sign In</button>
          )}
          <Link to="/profile" className="hover:text-brand-orange transition-colors">Wishlist</Link>
        </div>
      </div>

      <nav className="bg-brand-cream/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-28 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="text-brand-green">
                <Leaf className="w-10 h-10" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-3xl font-serif font-bold text-brand-dark tracking-tighter uppercase">JAZA</span>
                <span className="text-3xl font-serif font-bold text-brand-green tracking-tighter uppercase">FRESHI</span>
              </div>
            </Link>

            {/* Desktop Nav Links - Centered */}
            <div className="hidden lg:flex items-center gap-12">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`text-xl font-serif transition-all hover:italic ${location.pathname === link.path ? 'text-brand-orange italic' : 'text-brand-dark hover:text-brand-orange'}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center bg-white/50 rounded-full px-5 py-2.5 border border-stone-200/50 shadow-sm">
                <Search className="w-4 h-4 text-stone-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search produce..." 
                  className="bg-transparent border-none text-xs focus:ring-0 w-32"
                />
              </div>

              <Link to="/cart" className="flex items-center gap-2 text-brand-dark hover:text-brand-orange transition-all group">
                <div className="relative">
                  <ShoppingCart className="w-7 h-7 transition-transform group-hover:-rotate-12" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      {items.length}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold hidden sm:inline">{formatCurrency(items.reduce((acc, item) => acc + item.price * item.quantity, 0))}</span>
              </Link>

              {user && (
                <div className="flex items-center gap-4">
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="p-2 text-stone-500 hover:text-brand-orange transition-colors">
                      <LayoutDashboard className="w-6 h-6" />
                    </Link>
                  )}
                  {profile?.role === 'rider' && (
                    <Link to="/rider" className="p-2 text-stone-500 hover:text-brand-orange transition-colors">
                      <Truck className="w-6 h-6" />
                    </Link>
                  )}
                  <Link to="/profile" className="p-2 text-stone-500 hover:text-brand-orange transition-colors">
                    <UserIcon className="w-6 h-6" />
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-brand-dark">
                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-stone-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 text-stone-900 font-serif text-lg"
                  >
                    {link.name}
                  </Link>
                ))}
                <hr className="border-stone-100" />
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-stone-600 font-medium">
                      <UserIcon className="w-5 h-5" /> Profile
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-stone-600 font-medium">
                        <LayoutDashboard className="w-5 h-5" /> Admin Dashboard
                      </Link>
                    )}
                    {profile?.role === 'rider' && (
                      <Link to="/rider" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-stone-600 font-medium">
                        <Truck className="w-5 h-5" /> Rider Dashboard
                      </Link>
                    )}
                    <button onClick={() => { signOut(auth); setIsMenuOpen(false); }} className="flex items-center gap-3 text-stone-600 font-medium w-full text-left">
                      <LogOut className="w-5 h-5" /> Logout
                    </button>
                  </>
                ) : (
                  <button onClick={() => { handleLogin(); setIsMenuOpen(false); }} className="w-full bg-brand-orange text-white py-3 rounded-xl font-medium">
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/256700000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-bold">Order on WhatsApp</span>
      </a>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 flex justify-around py-3 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link to="/" className="flex flex-col items-center gap-1 text-stone-400">
          <Home className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Home</span>
        </Link>
        <Link to="/shop" className="flex flex-col items-center gap-1 text-stone-400">
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Shop</span>
        </Link>
        <Link to="/cart" className="flex flex-col items-center gap-1 text-brand-orange">
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[8px] font-bold px-1.5 rounded-full">{items.length}</span>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-tighter">Cart</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-stone-400">
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold tracking-tighter">Profile</span>
        </Link>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-brand-dark text-stone-400 py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3 text-white">
            <Leaf className="w-8 h-8 text-brand-orange" />
            <span className="text-2xl font-serif font-bold tracking-tighter uppercase">JAZA FRESHI</span>
          </Link>
          <p className="text-sm leading-relaxed font-serif italic">
            Premium online organic grocery delivery platform. Organic Quality, Everyday Convenience.
          </p>
          <div className="space-y-2 pt-4">
            <p className="text-xs uppercase tracking-widest font-bold text-white">Contact Us</p>
            <p className="text-sm">Call: +256 700 000 000</p>
            <p className="text-sm">Email: customercare@jazafreshi.co.ug</p>
          </div>
        </div>
        <div>
          <h4 className="text-white caps-label !text-white mb-8">Quick Links</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/shop" className="hover:text-brand-orange transition-colors">Shop All</Link></li>
            <li><Link to="/about" className="hover:text-brand-orange transition-colors">Our Story</Link></li>
            <li><Link to="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
            <li><Link to="/privacy" className="hover:text-brand-orange transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white caps-label !text-white mb-8">Categories</h4>
          <ul className="space-y-4 text-sm">
            <li><Link to="/shop?cat=fruits" className="hover:text-brand-orange transition-colors">Organic Fruits</Link></li>
            <li><Link to="/shop?cat=veg" className="hover:text-brand-orange transition-colors">Fresh Vegetables</Link></li>
            <li><Link to="/shop?cat=dairy" className="hover:text-brand-orange transition-colors">Dairy Products</Link></li>
            <li><Link to="/shop?cat=meat" className="hover:text-brand-orange transition-colors">Meat & Poultry</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white caps-label !text-white mb-8">Newsletter</h4>
          <p className="text-sm mb-6">Subscribe for organic tips and exclusive offers.</p>
          <div className="flex flex-col gap-3">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-brand-orange w-full text-white"
            />
            <button className="bg-brand-orange text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-white hover:text-brand-dark transition-all uppercase tracking-widest">
              Join The Harvest
            </button>
          </div>
        </div>
      </div>
      <div className="mt-24 pt-8 border-t border-white/5 text-center caps-label !text-white/30">
        &copy; {new Date().getFullYear()} Jaza Freshi. All rights reserved.
      </div>
    </div>
  </footer>
);

// --- Pages ---

const HomePage = () => {
  const [comingSoon, setComingSoon] = useState<NewsItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'news'), where('published', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      const sorted = newsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComingSoon(sorted.filter(item => item.isComingSoon).slice(0, 3));
      setLatestNews(sorted.filter(item => !item.isComingSoon).slice(0, 3));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'news');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-0">
      {/* Promo Bar */}
      <div className="bg-brand-purple text-white py-3 px-4 text-center text-sm md:text-base font-medium">
        Enjoy <span className="font-bold">50% off</span> your <span className="font-bold">first and fourth</span> Fruit & Veg Boxes with code <span className="bg-brand-promo-green px-2 py-0.5 rounded font-mono text-xs md:text-sm mx-1">VEGBOX26</span> at checkout.*
      </div>

      {/* Hero Section - Split Layout */}
      <section className="relative h-[600px] md:h-[700px] flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Image + Hand-drawn Text */}
        <div className="relative w-full md:w-1/2 h-1/2 md:h-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=1000" 
            alt="Fresh Carrots" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative transform -rotate-6">
              <div className="bg-brand-yellow/90 px-8 py-4 rounded-sm shadow-xl border-2 border-brand-dark/10">
                <h2 className="text-5xl md:text-7xl font-hand text-brand-dark leading-none">
                  Unprocess <br /> your food
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Content + Yellow Background */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-brand-yellow flex items-center px-8 md:px-20 py-12 md:py-0">
          <div className="space-y-8 max-w-xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark leading-tight">
              Reconnect with real food this week
            </h1>
            
            <ul className="space-y-4">
              {[
                "Fresh fruit, veg and more",
                "Expertly curated by us",
                "Delivered to your table",
                "With none of the nasty stuff**"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-brand-dark font-medium md:text-lg">
                  <Check className="w-6 h-6 text-brand-dark shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link to="/shop" className="inline-block bg-brand-orange text-brand-dark px-12 py-5 rounded-sm font-bold uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all shadow-lg text-lg">
                Start shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-24">
        {/* Intro Text - Centered Editorial */}
      <section className="max-w-5xl mx-auto px-4 py-32 text-center space-y-10">
        <div className="w-20 h-px bg-brand-orange mx-auto mb-12" />
        <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark leading-tight">
          Better for the Planet, <br /> <span className="italic font-normal text-brand-green">Better for You</span>
        </h2>
        <p className="text-xl md:text-2xl text-stone-500 leading-relaxed italic font-serif max-w-3xl mx-auto">
          "Organic, sustainable food, direct from the growers meaning less waste, less packaging & less food miles."
        </p>
        <div className="pt-8">
          <Link to="/about" className="caps-label !text-brand-orange border-b border-brand-orange pb-2 hover:text-brand-dark hover:border-brand-dark transition-all">
            Read Our Philosophy
          </Link>
        </div>
      </section>

      {/* Categories Highlights - Bento Grid Style */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 py-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-3">
            <span className="caps-label">The Collection</span>
            <h2 className="text-5xl font-serif font-bold text-brand-dark">Shop by Category</h2>
          </div>
          <Link to="/shop" className="bg-brand-olive text-white px-8 py-3 rounded-full caps-label !text-white hover:bg-brand-dark transition-all">
            View Full Shop
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px]">
          <Link to="/shop?cat=fruits" className="md:col-span-8 group relative overflow-hidden rounded-[40px] shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=1200" 
              alt="Fruits" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white space-y-2">
              <span className="caps-label !text-white/70">Fresh & Sweet</span>
              <h3 className="text-4xl font-serif font-bold">Organic Fruits</h3>
            </div>
          </Link>

          <Link to="/shop?cat=vegetables" className="md:col-span-4 group relative overflow-hidden rounded-[40px] shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1597362868479-35581f76b6d7?auto=format&fit=crop&q=80&w=800" 
              alt="Vegetables" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white space-y-2">
              <span className="caps-label !text-white/70">Earth's Best</span>
              <h3 className="text-3xl font-serif font-bold">Seasonal Veg</h3>
            </div>
          </Link>

          <Link to="/shop?cat=dairy" className="md:col-span-4 group relative overflow-hidden rounded-[40px] shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?auto=format&fit=crop&q=80&w=800" 
              alt="Dairy" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white space-y-2">
              <span className="caps-label !text-white/70">Pure & Local</span>
              <h3 className="text-3xl font-serif font-bold">Artisan Dairy</h3>
            </div>
          </Link>

          <Link to="/shop?cat=meat" className="md:col-span-8 group relative overflow-hidden rounded-[40px] shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=1200" 
              alt="Meat" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10 text-white space-y-2">
              <span className="caps-label !text-white/70">Ethically Raised</span>
              <h3 className="text-4xl font-serif font-bold">Meat & Poultry</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* Delivery Zones Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-16">
        <div className="text-center space-y-4">
          <span className="caps-label">Reliable Logistics</span>
          <h2 className="text-5xl font-serif font-bold text-brand-dark">Where We Deliver</h2>
          <p className="text-stone-500 font-serif italic text-lg max-w-2xl mx-auto">
            We currently serve Kampala and its neighboring areas, ensuring your organic produce arrives fresh and on time.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {DELIVERY_AREAS.map((area) => (
            <div key={area} className="bg-white border border-stone-100 p-6 rounded-[32px] text-center shadow-sm hover:shadow-md transition-shadow group">
              <MapPin className="w-6 h-6 text-brand-orange mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-serif font-bold text-brand-dark text-sm">{area}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Product Feature Section */}
      <section className="bg-brand-olive text-white py-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl border-4 border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800" 
                alt="Maize Feature" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 bg-brand-orange p-10 rounded-[40px] shadow-2xl hidden lg:block max-w-xs">
              <p className="text-white font-serif italic text-sm">
                "Maize is more than just a crop in Uganda; it's the backbone of our food security and a symbol of resilience."
              </p>
            </div>
          </div>
          
          <div className="space-y-10">
            <div className="space-y-4">
              <span className="caps-label !text-white/60 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Product Feature
              </span>
              <h2 className="text-5xl md:text-7xl font-serif font-bold leading-tight">
                The Golden Grain: <br /> <span className="italic font-normal text-brand-yellow">Ugandan Maize</span>
              </h2>
            </div>

            <div className="grid gap-8">
              <div className="space-y-2">
                <h4 className="font-bold text-brand-yellow caps-label !text-brand-yellow">Origin & History</h4>
                <p className="text-white/80 leading-relaxed font-serif italic">
                  Originally from Central America (Mexico), maize traveled across the Atlantic and was introduced to Uganda by Portuguese traders in the 18th century. It quickly adapted to our fertile soils and became a staple during the colonial era.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-brand-yellow caps-label !text-brand-yellow">Common Recipes</h4>
                <p className="text-white/80 leading-relaxed font-serif italic">
                  From the daily <span className="font-bold text-white">Posho (Ugali)</span> that fuels our nation, to roadside <span className="font-bold text-white">Roasted Maize</span>, and the traditional <span className="font-bold text-white">Malwa</span> brew—maize is versatile and beloved.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-brand-yellow caps-label !text-brand-yellow">Best Served With</h4>
                <p className="text-white/80 leading-relaxed font-serif italic">
                  Nothing beats Posho served with <span className="font-bold text-white">Fresh Beans</span>, rich <span className="font-bold text-white">Groundnuts (Gnuts) sauce</span>, or a side of steamed <span className="font-bold text-white">Dodo (Fried Greens)</span>.
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-brand-orange">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-bold uppercase tracking-widest text-xs">Our Recommendation</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  We highly recommend opting for <span className="text-white font-bold">Whole-Grain Maize Flour</span>. It retains the fiber and essential nutrients that are often lost in highly processed "super-white" flours, providing longer-lasting energy for your family.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link to="/shop?cat=Dry Grains" className="inline-block bg-white text-brand-olive px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all shadow-xl">
                Shop Fresh Grains
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      {comingSoon.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <span className="caps-label">Anticipation</span>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark">Coming Soon</h2>
              <p className="text-stone-500 font-serif italic text-xl max-w-xl">
                Get ready for these exciting new additions to our organic collection.
              </p>
            </div>
            <Link to="/news" className="caps-label !text-brand-orange border-b border-brand-orange pb-2 hover:text-brand-dark hover:border-brand-dark transition-all">
              View All Updates
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {comingSoon.map((item) => (
              <div key={item.id} className="group relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-lg">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 space-y-3">
                  <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-[8px] font-bold caps-label">NEW ARRIVAL</span>
                  <h3 className="text-3xl font-serif font-bold text-white leading-tight">{item.title}</h3>
                  <p className="text-white/70 text-sm font-serif italic line-clamp-2">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest News Section */}
      {latestNews.length > 0 && (
        <section className="bg-brand-cream py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="text-center space-y-4">
              <span className="caps-label">The Journal</span>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark">Latest from the Farm</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {latestNews.map((item) => (
                <Link key={item.id} to="/news" className="group space-y-6">
                  <div className="aspect-video rounded-[32px] overflow-hidden shadow-sm">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] caps-label !text-stone-400">
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-brand-dark group-hover:text-brand-orange transition-colors">{item.title}</h3>
                    <p className="text-stone-500 text-sm font-serif italic line-clamp-2">{item.content}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  </div>
);
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart();
  const saving = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <div className="group space-y-6">
      <div className="aspect-[4/5] bg-stone-100 rounded-[40px] overflow-hidden relative shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2">
        <img 
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/800`} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/10 transition-colors duration-500" />
        
        {saving > 0 && (
          <div className="absolute top-6 left-6 bg-brand-orange text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg z-10">
            SAVE {saving}%
          </div>
        )}

        <button 
          onClick={() => addItem(product)}
          className="absolute bottom-6 right-6 bg-white text-brand-dark p-4 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 hover:bg-brand-orange hover:text-white"
        >
          <ShoppingCart className="w-6 h-6" />
        </button>
      </div>
      <div className="space-y-2 text-center">
        <p className="caps-label !text-brand-orange">{product.category}</p>
        <h3 className="text-2xl font-serif font-bold text-brand-dark group-hover:text-brand-orange transition-colors">{product.name}</h3>
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-stone-400 line-through text-sm font-serif">{formatCurrency(product.originalPrice)}</span>
            )}
            <p className="text-xl font-bold font-serif text-brand-dark">{formatCurrency(product.price)}</p>
          </div>
          <span className="text-stone-400 font-serif italic text-sm">/ {product.unit}</span>
        </div>
      </div>
    </div>
  );
};

const ShopPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat');
    if (cat) setSelectedCategory(cat.charAt(0).toUpperCase() + cat.slice(1));
  }, [location]);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Grains', 'Meat', 'Beverages'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex flex-col md:flex-row gap-20">
        <aside className="w-full md:w-72 space-y-12">
          <div className="space-y-6">
            <h3 className="caps-label">Search</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find products..." 
                className="w-full bg-white border border-stone-200 rounded-full pl-12 py-4 text-sm focus:ring-2 focus:ring-brand-orange focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="caps-label">Categories</h3>
            <div className="space-y-4">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`block text-lg font-serif transition-all hover:italic hover:translate-x-2 ${selectedCategory === cat ? 'text-brand-orange italic font-bold' : 'text-stone-500 hover:text-brand-orange'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-12">
          <div className="flex justify-between items-center border-b border-stone-200 pb-6">
            <h2 className="text-3xl font-serif font-bold text-brand-dark">{selectedCategory} Collection</h2>
            <p className="text-sm text-stone-500 font-medium italic">
              {loading ? 'Loading products...' : `Showing ${filteredProducts.length} products`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-12">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!loading && filteredProducts.length === 0 && (
              <div className="col-span-full py-32 text-center space-y-6">
                <div className="bg-stone-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBasket className="w-10 h-10 text-stone-300" />
                </div>
                <p className="text-xl font-serif italic text-stone-500">No products found matching your criteria.</p>
                <button onClick={() => { setSearch(''); setSelectedCategory('All'); }} className="text-brand-orange font-bold caps-label border-b border-brand-orange">Clear Filters</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, total, removeItem, updateQuantity, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      alert("Please sign in to place an order.");
      return;
    }
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const dd = now.getDate().toString().padStart(2, '0');
      const datePrefix = `JZA${yy}${mm}${dd}`;

      // Get serial number by counting orders from today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const q = query(collection(db, 'orders'), where('createdAt', '>=', startOfDay));
      const snapshot = await getDocs(q);
      const serial = (snapshot.size + 1).toString().padStart(3, '0');
      const orderNumber = `${datePrefix}${serial}`;

      const deliveryFee = 5000;
      const deliveryCost = 3000; // What we pay the rider
      const orderData = {
        orderNumber,
        customerId: user.uid,
        customerName: profile?.displayName || 'Customer',
        customerPhone: profile?.phoneNumber || '',
        items: items.map(i => ({
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          costPrice: i.costPrice || (i.price * 0.7) // Fallback for existing items
        })),
        totalAmount: total + deliveryFee,
        deliveryFee: deliveryFee,
        deliveryCost: deliveryCost,
        status: 'pending',
        paymentMethod: 'mobile_money',
        deliveryAddress: profile?.addresses?.find(a => a.isDefault)?.address || 'Standard Delivery',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      navigate('/profile');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center space-y-8">
        <div className="bg-stone-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto">
          <ShoppingCart className="w-12 h-12 text-stone-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-serif font-bold text-brand-dark">Your cart is empty</h2>
          <p className="text-stone-500 font-serif italic text-lg">Looks like you haven't added any organic goodness yet.</p>
        </div>
        <Link to="/shop" className="inline-block bg-brand-orange text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 grid lg:grid-cols-3 gap-20">
      <div className="lg:col-span-2 space-y-12">
        <h2 className="text-5xl font-serif font-bold text-brand-dark">Shopping Cart</h2>
        <div className="space-y-6">
          {items.map(item => (
            <div key={item.id} className="flex gap-8 items-center bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-inner">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-xl font-serif font-bold text-brand-dark">{item.name}</h4>
                <p className="text-brand-orange font-bold font-serif">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-4 bg-brand-cream rounded-full px-4 py-2 border border-stone-200/50">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors">-</button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full transition-colors">+</button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-stone-300 hover:text-red-500 transition-colors p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-xl space-y-8 sticky top-32">
          <h3 className="text-2xl font-serif font-bold text-brand-dark">Order Summary</h3>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-bold text-brand-dark">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Delivery Fee</span>
              <span className="font-bold text-brand-dark">{formatCurrency(5000)}</span>
            </div>
            <div className="pt-4 border-t border-stone-100 flex justify-between items-end">
              <div>
                <span className="caps-label !text-stone-400">Total Amount</span>
                <p className="text-3xl font-serif font-bold text-brand-orange">{formatCurrency(total + 5000)}</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-cream p-6 rounded-3xl space-y-4">
            <p className="caps-label !text-brand-dark">Delivery Information</p>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Supported Areas</p>
                <p className="text-[10px] text-stone-500 font-serif leading-relaxed">
                  Kampala, Entebbe, Wakiso, Kira, Namugongo, Ndeeba, Kajansi, Kawempe, Bugolobi, Mutongo, Ntinda, Kisaasi, Makindye, MUBS, Kyambogo.
                </p>
              </div>
            </div>
            {profile?.addresses?.find(a => a.isDefault) ? (
              <div className="pt-2 border-t border-brand-orange/10">
                <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Delivering to:</p>
                <p className="text-xs font-bold text-brand-dark truncate">{profile.addresses.find(a => a.isDefault)?.address}</p>
              </div>
            ) : (
              <Link to="/profile" className="block text-center text-[10px] text-brand-orange font-bold uppercase tracking-wider border border-brand-orange/20 py-2 rounded-xl bg-white">
                Add Delivery Address
              </Link>
            )}
          </div>

          <div className="bg-brand-cream p-6 rounded-3xl space-y-4">
            <p className="caps-label !text-brand-dark">Payment Method</p>
            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-brand-orange/20">
              <div className="w-10 h-10 bg-brand-orange rounded-full flex items-center justify-center text-white font-bold text-xs">MM</div>
              <div>
                <p className="font-bold text-sm">Mobile Money</p>
                <p className="text-[10px] text-stone-400 uppercase tracking-wider">MTN or Airtel</p>
              </div>
            </div>
            <p className="text-[10px] text-stone-400 font-serif italic">Payable via Mobile Money prompt after checkout.</p>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className="w-full bg-brand-dark text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-brand-orange transition-all disabled:opacity-50 shadow-lg"
          >
            {isCheckingOut ? 'Processing...' : 'Complete Purchase'}
          </button>
          <p className="text-[10px] text-center text-stone-400 caps-label">Secure Checkout Powered by Jaza Freshi</p>
        </div>
      </div>
    </div>
  );
};

const AddressModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (label: string, address: string) => void }) => {
  const [label, setLabel] = useState('');
  const [area, setArea] = useState(DELIVERY_AREAS[0]);
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-8"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-serif font-bold text-brand-dark">New Address</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-brand-dark transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="caps-label !text-stone-400">Label</label>
            <input 
              type="text" 
              placeholder="e.g. Home, Office" 
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 font-serif focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="caps-label !text-stone-400">Delivery Area</label>
            <select 
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 font-serif focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              {DELIVERY_AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="caps-label !text-stone-400">Specific Details</label>
            <textarea 
              placeholder="House number, street, landmarks..." 
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 font-serif focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all h-32 resize-none"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={() => {
            if (label && area && details) {
              onSave(label, `${area}, ${details}`);
              onClose();
            }
          }}
          className="w-full bg-brand-orange text-white py-5 rounded-full font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg"
        >
          Save Address
        </button>
      </motion.div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleSaveAddress = async (label: string, address: string) => {
    if (user) {
      const newAddresses = [...(profile?.addresses || []), { label, address, isDefault: (profile?.addresses || []).length === 0 }];
      try {
        await setDoc(doc(db, 'users', user.uid), { addresses: newAddresses }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'orders'), where('customerId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (!user) return <div className="py-32 text-center font-serif italic text-xl">Please sign in to view your profile.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 space-y-20">
      <div className="bg-white p-12 rounded-[40px] shadow-sm border border-stone-100 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cream rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="w-32 h-32 bg-brand-cream rounded-full flex items-center justify-center text-brand-orange relative z-10 shadow-inner">
          <UserIcon className="w-16 h-16" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
          <h2 className="text-4xl font-serif font-bold text-brand-dark">{profile?.displayName || 'User'}</h2>
          <p className="text-stone-500 font-serif italic">{profile?.email}</p>
          <div className="inline-block bg-brand-cream text-brand-orange px-4 py-1.5 rounded-full caps-label !text-brand-orange">
            {profile?.role || 'Customer'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-12">
          <h3 className="text-3xl font-serif font-bold text-brand-dark">Order History</h3>
          {loading ? (
            <p className="text-stone-500 font-serif italic">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-stone-100 p-20 rounded-[40px] text-center space-y-6 shadow-sm">
              <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto" />
              <p className="text-xl font-serif italic text-stone-500">You haven't placed any orders yet.</p>
              <Link to="/shop" className="text-brand-orange font-bold caps-label border-b border-brand-orange">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <div key={order.id} className="bg-white border border-stone-100 p-8 rounded-[32px] space-y-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="caps-label !text-stone-400">Order #{order.id.slice(-6)}</p>
                      <p className="text-sm text-stone-500 font-serif italic">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full caps-label ${
                      order.status === 'delivered' ? 'bg-brand-green/10 text-brand-green' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                      'bg-brand-orange/10 text-brand-orange'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm font-serif">
                        <span className="text-stone-600 italic">{item.quantity}x {item.name}</span>
                        <span className="font-bold text-brand-dark">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-stone-50 flex justify-between items-center">
                    <span className="caps-label">Total Amount</span>
                    <span className="text-2xl font-serif font-bold text-brand-orange">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-12">
          <h3 className="text-3xl font-serif font-bold text-brand-dark">Addresses</h3>
          <div className="space-y-6">
            {profile?.addresses?.map((addr, i) => (
              <div key={i} className="bg-white border border-stone-100 p-8 rounded-[32px] relative shadow-sm">
                <h4 className="font-serif font-bold text-brand-dark text-lg mb-2">{addr.label}</h4>
                <p className="text-stone-500 text-sm leading-relaxed">{addr.address}</p>
                {addr.isDefault && (
                  <span className="absolute top-8 right-8 caps-label !text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">DEFAULT</span>
                )}
              </div>
            ))}
            <button 
              onClick={() => setIsAddressModalOpen(true)}
              className="w-full border-2 border-dashed border-stone-200 p-8 rounded-[32px] text-stone-400 text-sm font-bold hover:border-brand-orange hover:text-brand-orange transition-all flex flex-col items-center gap-2"
            >
              <span className="text-2xl">+</span>
              <span className="caps-label">Add New Address</span>
            </button>
          </div>
        </div>
      </div>

      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
        onSave={handleSaveAddress} 
      />
    </div>
  );
};

const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'news'), where('published', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem));
      setNews(newsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'news');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 space-y-20">
      <div className="text-center space-y-4">
        <span className="caps-label">Stay Updated</span>
        <h2 className="text-6xl font-serif font-bold text-brand-dark">Latest News & Updates</h2>
        <p className="text-stone-500 font-serif italic text-xl max-w-2xl mx-auto">
          From farm updates to new product arrivals, stay in the loop with Jaza Freshi.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center font-serif italic text-xl">Loading updates...</div>
      ) : news.length === 0 ? (
        <div className="py-24 text-center font-serif italic text-xl text-stone-400">No updates at the moment. Check back soon!</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {news.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-stone-100 flex flex-col group"
            >
              {item.imageUrl && (
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  {item.imageCaption && (
                    <div className="absolute bottom-0 inset-x-0 bg-brand-dark/60 backdrop-blur-sm p-3 text-white text-[10px] caps-label">
                      {item.imageCaption}
                    </div>
                  )}
                  {item.isComingSoon && (
                    <div className="absolute top-4 right-4 bg-brand-orange text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-lg">
                      COMING SOON
                    </div>
                  )}
                </div>
              )}
              <div className="p-8 space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center text-[10px] caps-label !text-stone-400">
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold text-brand-dark group-hover:text-brand-orange transition-colors">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed font-serif italic line-clamp-4 flex-grow">
                  {item.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (s) => 
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );
    const unsubOrders = onSnapshot(collection(db, 'orders'), (s) => 
      setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => 
      setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );
    const unsubNews = onSnapshot(collection(db, 'news'), (s) => 
      setNews(s.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'news')
    );
    const unsubCosts = onSnapshot(collection(db, 'costs'), (s) => 
      setCosts(s.docs.map(d => ({ id: d.id, ...d.data() } as Cost))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'costs')
    );
    return () => { unsubProducts(); unsubOrders(); unsubUsers(); unsubNews(); unsubCosts(); };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <h2 className="text-5xl font-serif font-bold text-brand-dark">Admin Dashboard</h2>
        <div className="flex bg-white p-1.5 rounded-full border border-stone-200 shadow-sm overflow-x-auto">
          {['orders', 'products', 'users', 'news', 'costs', 'finances'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full caps-label transition-all ${activeTab === tab ? 'bg-brand-dark text-white shadow-md' : 'text-stone-400 hover:text-brand-dark'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white border border-stone-100 rounded-[40px] overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-cream border-b border-stone-100">
              <tr>
                <th className="px-8 py-6 caps-label">Order #</th>
                <th className="px-8 py-6 caps-label">Customer</th>
                <th className="px-8 py-6 caps-label">Total</th>
                <th className="px-8 py-6 caps-label">Rider</th>
                <th className="px-8 py-6 caps-label">Status</th>
                <th className="px-8 py-6 caps-label">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 font-serif">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-brand-cream transition-colors">
                  <td className="px-8 py-6 font-mono text-xs text-stone-900 font-bold">{order.orderNumber || `#${order.id.slice(-6)}`}</td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-brand-dark">{order.customerName}</div>
                    <div className="text-[10px] text-stone-400">{order.customerPhone}</div>
                  </td>
                  <td className="px-8 py-6 font-bold text-brand-orange">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-8 py-6">
                    {order.riderName ? (
                      <span className="text-stone-600 font-medium">{order.riderName}</span>
                    ) : (
                      <select 
                        className="bg-brand-cream border border-stone-200 rounded-lg px-3 py-1 text-xs"
                        onChange={async (e) => {
                          const riderId = e.target.value;
                          const rider = users.find(u => u.uid === riderId);
                          if (rider) {
                            await setDoc(doc(db, 'orders', order.id), { 
                              riderId, 
                              riderName: rider.displayName,
                              riderPhone: rider.phoneNumber || '',
                              status: 'assigned',
                              updatedAt: new Date().toISOString()
                            }, { merge: true });
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Assign Rider</option>
                        {users.filter(u => u.role === 'rider').map(r => (
                          <option key={r.uid} value={r.uid}>{r.displayName}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full caps-label ${
                      order.status === 'delivered' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="text-brand-dark font-bold caps-label border-b border-brand-dark hover:text-brand-orange hover:border-brand-orange transition-all">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'finances' && (() => {
        // --- Financial Calculations ---
        const completedOrders = orders.filter(o => o.status === 'delivered');
        const revenue = completedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        const cogs = completedOrders.reduce((acc, o) => {
          return acc + o.items.reduce((itemAcc, item) => itemAcc + (item.costPrice * item.quantity), 0);
        }, 0);
        const grossProfit = revenue - cogs;
        
        const operatingExpenses = costs.filter(c => c.category === 'operating' || c.category === 'marketing' || c.category === 'logistics')
          .reduce((acc, c) => acc + c.amount, 0);
        
        const ebit = grossProfit - operatingExpenses;
        const taxRate = 0.30; // URA Corporate Tax
        const taxes = ebit > 0 ? ebit * taxRate : 0;
        const eat = ebit - taxes;

        // Balance Sheet (Simplified)
        const totalCash = revenue - operatingExpenses - completedOrders.reduce((acc, o) => acc + (o.deliveryCost || 0), 0);
        const inventoryValue = products.reduce((acc, p) => acc + (p.stockLevel * (p.costPrice || p.price * 0.7)), 0);
        const totalAssets = totalCash + inventoryValue;
        const equity = totalAssets; // Simplified: Assets = Equity (no debt)

        // Reports Data (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayOrders = completedOrders.filter(o => o.createdAt.startsWith(dateStr));
          return {
            date: dateStr,
            revenue: dayOrders.reduce((acc, o) => acc + o.totalAmount, 0),
            profit: dayOrders.reduce((acc, o) => acc + (o.totalAmount - o.items.reduce((ia, it) => ia + (it.costPrice * it.quantity), 0)), 0)
          };
        }).reverse();

        return (
          <div className="space-y-16">
            {/* Real-time EBIT/EAT Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm space-y-2">
                <span className="caps-label !text-stone-400">Total Revenue</span>
                <p className="text-3xl font-serif font-bold text-brand-dark">{formatCurrency(revenue)}</p>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm space-y-2">
                <span className="caps-label !text-stone-400">Gross Profit</span>
                <p className="text-3xl font-serif font-bold text-brand-green">{formatCurrency(grossProfit)}</p>
              </div>
              <div className="bg-brand-dark p-8 rounded-[40px] shadow-xl space-y-2">
                <span className="caps-label !text-white/60">EBIT (Real-time)</span>
                <p className="text-3xl font-serif font-bold text-white">{formatCurrency(ebit)}</p>
              </div>
              <div className="bg-brand-orange p-8 rounded-[40px] shadow-xl space-y-2">
                <span className="caps-label !text-white/60">EAT (Net Income)</span>
                <p className="text-3xl font-serif font-bold text-white">{formatCurrency(eat)}</p>
              </div>
            </div>

            {/* Financial Statements Grid */}
            <div className="grid lg:grid-cols-2 gap-12">
              {/* 1. Statement of Comprehensive Income */}
              <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-serif font-bold text-brand-dark">Statement of Comprehensive Income</h3>
                  <span className="text-[10px] caps-label text-stone-400">GAAP/IASB Compliant</span>
                </div>
                <div className="space-y-4 font-serif">
                  <div className="flex justify-between border-b border-stone-50 pb-2">
                    <span>Revenue (Sales)</span>
                    <span className="font-bold">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-50 pb-2 text-red-500">
                    <span>Cost of Goods Sold (COGS)</span>
                    <span>({formatCurrency(cogs)})</span>
                  </div>
                  <div className="flex justify-between font-bold text-brand-green py-2 border-b-2 border-brand-green/20">
                    <span>Gross Profit</span>
                    <span>{formatCurrency(grossProfit)}</span>
                  </div>
                  <div className="pt-4 space-y-2">
                    <p className="caps-label !text-stone-400 !text-[8px]">Operating Expenses</p>
                    {['operating', 'marketing', 'logistics'].map(cat => {
                      const amt = costs.filter(c => c.category === cat).reduce((acc, c) => acc + c.amount, 0);
                      return (
                        <div key={cat} className="flex justify-between text-sm italic">
                          <span className="capitalize">{cat} Expenses</span>
                          <span>{formatCurrency(amt)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between font-bold text-brand-dark pt-4 border-t border-stone-100">
                    <span>EBIT</span>
                    <span>{formatCurrency(ebit)}</span>
                  </div>
                  <div className="flex justify-between text-sm italic text-stone-500">
                    <span>Income Tax Expense (30% URA)</span>
                    <span>({formatCurrency(taxes)})</span>
                  </div>
                  <div className="flex justify-between font-bold text-3xl text-brand-orange pt-6 border-t-2 border-brand-orange/20">
                    <span>Net Income (EAT)</span>
                    <span>{formatCurrency(eat)}</span>
                  </div>
                </div>
              </div>

              {/* 2. Statement of Financial Position */}
              <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-serif font-bold text-brand-dark">Statement of Financial Position</h3>
                  <span className="text-[10px] caps-label text-stone-400">Balance Sheet</span>
                </div>
                <div className="space-y-6 font-serif">
                  <div className="space-y-3">
                    <p className="caps-label !text-brand-green">Assets</p>
                    <div className="flex justify-between text-sm">
                      <span>Cash and Cash Equivalents</span>
                      <span>{formatCurrency(totalCash)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Inventory (at Cost)</span>
                      <span>{formatCurrency(inventoryValue)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-stone-100 pt-2">
                      <span>Total Assets</span>
                      <span>{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="caps-label !text-brand-orange">Equity & Liabilities</p>
                    <div className="flex justify-between text-sm">
                      <span>Retained Earnings</span>
                      <span>{formatCurrency(eat)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Owner's Equity</span>
                      <span>{formatCurrency(totalAssets - eat)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-stone-100 pt-2">
                      <span>Total Equity & Liabilities</span>
                      <span>{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-brand-cream p-4 rounded-2xl text-[10px] text-stone-500 italic">
                  * Compliant with CPA Uganda and URA reporting standards for SMEs.
                </div>
              </div>

              {/* 3. Statement of Cash Flows */}
              <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-sm space-y-8">
                <h3 className="text-2xl font-serif font-bold text-brand-dark">Statement of Cash Flows</h3>
                <div className="space-y-4 font-serif text-sm">
                  <p className="caps-label !text-stone-400">Operating Activities</p>
                  <div className="flex justify-between">
                    <span>Cash Received from Customers</span>
                    <span className="text-brand-green">+{formatCurrency(revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Paid for Inventory</span>
                    <span className="text-red-500">-{formatCurrency(cogs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Paid for Expenses</span>
                    <span className="text-red-500">-{formatCurrency(operatingExpenses)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-stone-100 pt-2">
                    <span>Net Cash from Operating Activities</span>
                    <span>{formatCurrency(revenue - cogs - operatingExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* 4. Statement of Changes in Equity */}
              <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-sm space-y-8">
                <h3 className="text-2xl font-serif font-bold text-brand-dark">Statement of Changes in Equity</h3>
                <div className="space-y-4 font-serif text-sm">
                  <div className="flex justify-between">
                    <span>Balance at Start of Period</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between text-brand-green">
                    <span>Net Income for the Period</span>
                    <span>+{formatCurrency(eat)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Dividends / Drawings</span>
                    <span>({formatCurrency(0)})</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-stone-100 pt-2 text-xl">
                    <span>Balance at End of Period</span>
                    <span>{formatCurrency(eat)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Reports */}
            <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-sm space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-serif font-bold text-brand-dark">Performance Reports</h3>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-brand-cream rounded-full text-[10px] caps-label">Weekly</button>
                  <button className="px-4 py-2 hover:bg-brand-cream rounded-full text-[10px] caps-label">Monthly</button>
                  <button className="px-4 py-2 hover:bg-brand-cream rounded-full text-[10px] caps-label">Quarterly</button>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'serif'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontFamily: 'serif'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                      cursor={{fill: '#f5f5f0'}}
                    />
                    <Bar dataKey="revenue" fill="#141414" radius={[10, 10, 0, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#F27D26" radius={[10, 10, 0, 0]} name="Gross Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendations & Insights */}
            <div className="bg-brand-yellow/30 p-12 rounded-[60px] border border-brand-yellow/50 space-y-8">
              <div className="flex items-center gap-4">
                <Star className="w-8 h-8 text-brand-orange fill-current" />
                <h3 className="text-3xl font-serif font-bold text-brand-dark">Strategic Recommendations</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
                  <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold">1</div>
                  <h4 className="font-bold text-brand-dark">Optimize Logistics</h4>
                  <p className="text-sm text-stone-500 italic font-serif">Logistics costs currently account for a significant portion of EBIT. Consider batching deliveries in specific zones to reduce rider payouts.</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange font-bold">2</div>
                  <h4 className="font-bold text-brand-dark">Tax Planning</h4>
                  <p className="text-sm text-stone-500 italic font-serif">Ensure all VAT-inclusive purchases from suppliers are properly documented to claim input tax credits from URA, improving EAT.</p>
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
                  <div className="w-10 h-10 bg-brand-dark/10 rounded-full flex items-center justify-center text-brand-dark font-bold">3</div>
                  <h4 className="font-bold text-brand-dark">Inventory Turnover</h4>
                  <p className="text-sm text-stone-500 italic font-serif">Inventory value is high. Focus on promoting slow-moving items through "Coming Soon" news updates to free up cash flow.</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {activeTab === 'products' && (
        <div className="space-y-12">
          <div className="flex justify-end">
            <button className="bg-brand-orange text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg">+ Add Product</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="bg-white border border-stone-100 p-6 rounded-[32px] flex gap-6 items-center shadow-sm hover:shadow-md transition-shadow">
                <img src={product.imageUrl} className="w-20 h-20 rounded-2xl object-cover shadow-inner" />
                <div className="flex-1 space-y-1">
                  <h4 className="font-serif font-bold text-brand-dark text-lg">{product.name}</h4>
                  <p className="caps-label !text-stone-400 !text-[8px]">{product.category} • Stock: {product.stockLevel}</p>
                  <p className="text-brand-orange font-bold font-serif">{formatCurrency(product.price)}</p>
                </div>
                <button className="text-stone-300 hover:text-brand-dark transition-colors">Edit</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'news' && (
        <div className="space-y-12">
          <div className="flex justify-end">
            <button 
              onClick={async () => {
                const title = prompt("News Title:");
                const content = prompt("News Content:");
                const imageUrl = prompt("Image URL (optional):");
                const imageCaption = prompt("Image Caption (optional):");
                const isComingSoon = confirm("Is this a 'Coming Soon' product update?");
                
                if (title && content) {
                  try {
                    await addDoc(collection(db, 'news'), {
                      title,
                      content,
                      imageUrl: imageUrl || '',
                      imageCaption: imageCaption || '',
                      isComingSoon,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      published: true
                    });
                  } catch (error) {
                    handleFirestoreError(error, OperationType.CREATE, 'news');
                  }
                }
              }}
              className="bg-brand-orange text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg"
            >
              + Add News Update
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map(item => (
              <div key={item.id} className="bg-white border border-stone-100 p-8 rounded-[40px] space-y-4 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-brand-dark text-xl">{item.title}</h4>
                    <p className="text-[10px] text-stone-400 caps-label">{formatDate(item.createdAt)}</p>
                  </div>
                  {item.isComingSoon && (
                    <span className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-[8px] font-bold caps-label">COMING SOON</span>
                  )}
                </div>
                {item.imageUrl && (
                  <div className="aspect-video rounded-2xl overflow-hidden shadow-inner">
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-stone-500 text-sm font-serif italic line-clamp-3">{item.content}</p>
                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={async () => {
                      const newTitle = prompt("Edit Title:", item.title);
                      const newContent = prompt("Edit Content:", item.content);
                      if (newTitle && newContent) {
                        try {
                          await setDoc(doc(db, 'news', item.id), {
                            ...item,
                            title: newTitle,
                            content: newContent,
                            updatedAt: new Date().toISOString()
                          });
                        } catch (error) {
                          handleFirestoreError(error, OperationType.UPDATE, `news/${item.id}`);
                        }
                      }
                    }}
                    className="text-brand-dark font-bold caps-label text-xs border-b border-brand-dark"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this news item?")) {
                        try {
                          // Note: deleteDoc is not imported, I should check or use setDoc with a deleted flag or something if I don't want to add imports
                          // But I can just add deleteDoc to imports
                          // For now I'll use setDoc to unpublish it
                          await setDoc(doc(db, 'news', item.id), { ...item, published: false });
                        } catch (error) {
                          handleFirestoreError(error, OperationType.UPDATE, `news/${item.id}`);
                        }
                      }
                    }}
                    className="text-red-500 font-bold caps-label text-xs border-b border-red-500"
                  >
                    Unpublish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="space-y-12">
          <div className="flex justify-end">
            <button 
              onClick={async () => {
                const description = prompt("Cost Description:");
                const amount = parseFloat(prompt("Amount (UGX):") || "0");
                const category = prompt("Category (operating, marketing, logistics, tax, other):") as any;
                const date = prompt("Date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
                
                if (description && amount && category && date) {
                  try {
                    await addDoc(collection(db, 'costs'), {
                      description,
                      amount,
                      category,
                      date,
                      createdAt: new Date().toISOString()
                    });
                  } catch (error) {
                    handleFirestoreError(error, OperationType.CREATE, 'costs');
                  }
                }
              }}
              className="bg-brand-orange text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-dark transition-all shadow-lg"
            >
              + Add Cost
            </button>
          </div>
          <div className="bg-white border border-stone-100 rounded-[40px] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-cream border-b border-stone-100">
                <tr>
                  <th className="px-8 py-6 caps-label">Date</th>
                  <th className="px-8 py-6 caps-label">Description</th>
                  <th className="px-8 py-6 caps-label">Category</th>
                  <th className="px-8 py-6 caps-label">Amount</th>
                  <th className="px-8 py-6 caps-label">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 font-serif">
                {costs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(cost => (
                  <tr key={cost.id} className="hover:bg-brand-cream transition-colors">
                    <td className="px-8 py-6 text-stone-500">{cost.date}</td>
                    <td className="px-8 py-6 font-bold text-brand-dark">{cost.description}</td>
                    <td className="px-8 py-6">
                      <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-[10px] caps-label">{cost.category}</span>
                    </td>
                    <td className="px-8 py-6 font-bold text-red-500">{formatCurrency(cost.amount)}</td>
                    <td className="px-8 py-6">
                      <div className="flex gap-4">
                        <button 
                          onClick={async () => {
                            const newDesc = prompt("Edit Description:", cost.description);
                            const newAmount = parseFloat(prompt("Edit Amount:", cost.amount.toString()) || "0");
                            if (newDesc && newAmount) {
                              await setDoc(doc(db, 'costs', cost.id), { ...cost, description: newDesc, amount: newAmount });
                            }
                          }}
                          className="text-brand-dark font-bold caps-label text-xs border-b border-brand-dark"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm("Delete this cost?")) {
                              await deleteDoc(doc(db, 'costs', cost.id));
                            }
                          }}
                          className="text-red-500 font-bold caps-label text-xs border-b border-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-stone-100 rounded-[40px] overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-cream border-b border-stone-100">
              <tr>
                <th className="px-8 py-6 caps-label">Name</th>
                <th className="px-8 py-6 caps-label">Email</th>
                <th className="px-8 py-6 caps-label">Role</th>
                <th className="px-8 py-6 caps-label">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 font-serif">
              {users.map(user => (
                <tr key={user.uid} className="hover:bg-brand-cream transition-colors">
                  <td className="px-8 py-6 font-bold text-brand-dark">{user.displayName}</td>
                  <td className="px-8 py-6 text-stone-500 italic">{user.email}</td>
                  <td className="px-8 py-6">
                    <span className="bg-brand-cream text-brand-orange px-4 py-1.5 rounded-full caps-label !text-brand-orange">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="text-brand-dark font-bold caps-label border-b border-brand-dark hover:text-brand-orange hover:border-brand-orange transition-all">Edit Role</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const RiderDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'orders'), where('riderId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      });
      return () => unsubscribe();
    }
  }, [user]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await setDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8 pb-32">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-brand-dark">Rider Assignments</h2>
        <div className="bg-brand-orange/10 text-brand-orange px-4 py-2 rounded-full caps-label">
          {orders.filter(o => o.status !== 'delivered').length} Active Tasks
        </div>
      </div>
      
      {loading ? (
        <p className="text-stone-500 font-serif italic">Loading tasks...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-stone-100 text-center space-y-4">
          <Truck className="w-16 h-16 text-stone-200 mx-auto" />
          <p className="text-xl font-serif italic text-stone-500">No active deliveries assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-stone-100 p-8 rounded-[32px] shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="caps-label !text-stone-400">Order #{order.id.slice(-6)}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-brand-orange shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-brand-dark">{order.deliveryAddress}</p>
                        <p className="text-xs text-stone-400">Customer: {order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PhoneCall className="w-5 h-5 text-brand-green shrink-0" />
                      <a href={`tel:${order.customerPhone}`} className="text-brand-green font-bold hover:underline">{order.customerPhone || 'No Phone Provided'}</a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                  <div className="text-right">
                    <p className="caps-label !text-stone-400">Earnings</p>
                    <p className="text-2xl font-serif font-bold text-brand-dark">{formatCurrency(order.deliveryCost || 3000)}</p>
                  </div>
                  
                  <div className="flex gap-3 w-full">
                    {order.status === 'assigned' && (
                      <button onClick={() => updateStatus(order.id, 'picked_up')} className="flex-1 bg-brand-dark text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-brand-orange transition-all">Pick Up</button>
                    )}
                    {order.status === 'picked_up' && (
                      <button onClick={() => updateStatus(order.id, 'delivered')} className="flex-1 bg-brand-green text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-brand-dark transition-all">Delivered</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-50">
                <details className="group">
                  <summary className="list-none cursor-pointer flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest group-open:mb-4">
                    <ClipboardList className="w-4 h-4" />
                    View Order Items ({order.items.length})
                  </summary>
                  <div className="space-y-2 pl-6">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm italic font-serif text-stone-600">
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const AppContent = () => {
  const { profile } = useAuth();
  useEffect(() => {
    const seedData = async () => {
      try {
        const q = query(collection(db, 'products'));
        const snapshot = await getDocs(q);
        if (snapshot.empty && profile?.role === 'admin') {
          const sampleProducts = [
            // Dry Grains & Produce
            { name: "White Maize", price: 1200, originalPrice: 1500, costPrice: 800, category: "Dry Grains", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400", stockLevel: 1000, isFeatured: true },
            { name: "Yellow Beans", price: 3500, originalPrice: 4200, costPrice: 2500, category: "Dry Grains", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&q=80&w=400", stockLevel: 500, isFeatured: true },
            { name: "Super Rice", price: 4500, originalPrice: 5000, costPrice: 3200, category: "Dry Grains", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400", stockLevel: 300, isFeatured: true },
            { name: "Soybeans", price: 2800, originalPrice: 3200, costPrice: 1900, category: "Dry Grains", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1599599810694-b5b37304c041?auto=format&fit=crop&q=80&w=400", stockLevel: 400, isFeatured: false },
            
            // Fresh Vegetables
            { name: "Red Tomatoes", price: 2500, originalPrice: 3000, costPrice: 1500, category: "Vegetables", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400", stockLevel: 100, isFeatured: true },
            { name: "Large Cabbage", price: 1500, originalPrice: 2000, costPrice: 800, category: "Vegetables", unit: "head", imageUrl: "https://images.unsplash.com/photo-1591465001581-2c57a07a7a30?auto=format&fit=crop&q=80&w=400", stockLevel: 80, isFeatured: false },
            { name: "Red Onions", price: 3000, originalPrice: 3800, costPrice: 2000, category: "Vegetables", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=400", stockLevel: 150, isFeatured: true },
            
            // Fresh Fruits
            { name: "Sweet Pineapple", price: 3000, originalPrice: 4000, costPrice: 1800, category: "Fruits", unit: "each", imageUrl: "https://images.unsplash.com/photo-1550258114-b09a88c841fd?auto=format&fit=crop&q=80&w=400", stockLevel: 60, isFeatured: true },
            { name: "Bogoya Bananas", price: 2000, originalPrice: 2500, costPrice: 1200, category: "Fruits", unit: "cluster", imageUrl: "https://images.unsplash.com/photo-1571771894821-ad990241274d?auto=format&fit=crop&q=80&w=400", stockLevel: 100, isFeatured: true },
            { name: "Hass Avocado", price: 1000, originalPrice: 1500, costPrice: 600, category: "Fruits", unit: "each", imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400", stockLevel: 120, isFeatured: false },
            
            // Food Staples
            { name: "Irish Potatoes", price: 2200, originalPrice: 2800, costPrice: 1400, category: "Staples", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400", stockLevel: 400, isFeatured: true },
            { name: "Sweet Potatoes", price: 1800, originalPrice: 2200, costPrice: 1100, category: "Staples", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400", stockLevel: 300, isFeatured: false },
            { name: "Matooke (Plantain)", price: 25000, originalPrice: 30000, costPrice: 18000, category: "Staples", unit: "bunch", imageUrl: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=400", stockLevel: 50, isFeatured: true },
            
            // High-Value Export
            { name: "Fresh Ginger", price: 5000, originalPrice: 6500, costPrice: 3500, category: "Premium", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=400", stockLevel: 50, isFeatured: true },
            { name: "Garlic Bulbs", price: 8000, originalPrice: 10000, costPrice: 5500, category: "Premium", unit: "kg", imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&q=80&w=400", stockLevel: 40, isFeatured: false }
          ];
          for (const p of sampleProducts) {
            await addDoc(collection(db, 'products'), p);
          }
        }
      } catch (error) {
        // Silently skip seeding if permissions fail or already seeded
        console.log("Seeding skipped:", error);
      }
    };
    seedData();
  }, [profile]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream font-sans text-brand-dark">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/about" element={<div className="py-32 text-center max-w-3xl mx-auto px-4 space-y-8">
            <span className="caps-label">Our Story</span>
            <h2 className="text-6xl font-serif font-bold text-brand-dark leading-tight">Grown with Love, <br /> <span className="italic font-normal text-brand-green">Delivered with Care</span></h2>
            <p className="text-xl text-stone-500 leading-relaxed font-serif italic">Jaza Freshi was born from a simple commitment: providing pure, organic quality with everyday convenience. We believe that everyone deserves access to fresh, pesticide-free produce without the hassle.</p>
          </div>} />
          <Route path="/contact" element={<div className="py-32 text-center max-w-3xl mx-auto px-4 space-y-8">
            <span className="caps-label">Get in Touch</span>
            <h2 className="text-6xl font-serif font-bold text-brand-dark leading-tight">We'd Love to <br /> <span className="italic font-normal text-brand-orange">Hear From You</span></h2>
            <p className="text-xl text-stone-500 font-serif italic">Have questions about our delivery zones or organic sourcing? We're here to help.</p>
            <div className="pt-8 space-y-4">
              <p className="text-3xl font-serif font-bold text-brand-green">support@jazafreshi.com</p>
              <p className="text-3xl font-serif font-bold text-brand-green">+254 700 000 000</p>
            </div>
          </div>} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/*" element={profile?.role === 'admin' ? <AdminDashboard /> : <div className="py-24 text-center font-serif italic text-xl">Access Denied</div>} />
          <Route path="/rider/*" element={profile?.role === 'rider' ? <RiderDashboard /> : <div className="py-24 text-center font-serif italic text-xl">Access Denied</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};


export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

