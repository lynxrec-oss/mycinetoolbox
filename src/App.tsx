import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Play, 
  Mail, 
  Send, 
  Menu, 
  X, 
  ChevronRight, 
  Camera, 
  Compass, 
  Laptop, 
  Wrench, 
  Coffee, 
  Youtube 
} from 'lucide-react';
import CartDrawer from './CartDrawer';
import VideoModal from './VideoModal';
import BlogPage from './BlogPage';
import BlogPostPage from './BlogPostPage';
import ContactPage from './ContactPage';
import YoutubeOptimizerPage from './YoutubeOptimizerPage';
import OpportunityEnginePage from './OpportunityEnginePage';
import SavedCampaignsPage from './SavedCampaignsPage';
import AnalyticsPage from './AnalyticsPage';
import IndexingPortalPage from './IndexingPortalPage';
import PrivacyPage from './PrivacyPage';
import AboutPage from './AboutPage';
import FaqPage from './FaqPage';
import { fetchLatestVideos, FALLBACK_VIDEOS, type YouTubeVideo } from './youtubeApi';

// --- Types ---
interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
}

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  description: string;
  badge?: string;
}

// --- Data ---
const PRODUCTS: Product[] = [
  {
    id: 'lut-pack',
    title: 'Detroit Night LUT Pack',
    price: 49,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC6gcirNJ_-na0n2LF1dS5QNaMPo9wwgPo1yaOZdUNlAHBCRRLbU-NxEhtyJOlugVoXamOd9LyMqK8bqmN3ICBT6r4lkWrYrbwBU3JzufJugpvpM9_d4CqGQcXNB2MuC6uwFxHtC-GVWxJHQJw1NAeIwxI3GcktRilm9N7wk-tS7ZPB0uHzs2z5Bz5GlBHoChF2fgWfDvkKNKXLKnsZi6oNuMjqwcPuPwkYdzUxj1iicUuaeKoE7pG5AMjAxaKyUTt92G48TFsmK0',
    description: '12 LUTs designed for low-light urban environments with high dynamic range.'
  },
  {
    id: 'powergrade',
    title: 'Dehancer PowerGrade',
    price: 75,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsz3utkZxpHRIQ0t-NYMeqZxkCI4xgExc5PX1WvnoJElpZKrg5y1pHZMCbBFUs8Ya-xO1fBt9cffxvCSt_rgaYIoaGTNa45ydGbpcCE9whvurxG27j0wVjmXOp_n6p5G3yi9FZESxTcILbgvUaSPlwDMWQj6k6wz3prGj_keaa1nhe_akn9z8rH0DucC03xQfzMvdQOmuHKqGMzPoPiov2ALqssQM0t4tXJKuvUWXAgh2NaPKAGxU5RnXW4vykqsxO0JedChjQ9Mk',
    description: 'A complete DaVinci Resolve PowerGrade for achieving the ultimate film print look.'
  },
  {
    id: 'starter-bundle',
    title: 'Cinematic Starter LUT Bundle',
    price: 29,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB45YGE6QmdgqBIXRIrH8yrniBS6XlcWGD7THUoo8cR3eQB0A-5nr_wHxyW8lqGV2bM9e-BsI8TWYSlEnx2lz50ntDz3BS9ZZhzBFiOvJPuLhqL9PGl-1QApyNXbWnmxhdgKWawDmIWJTDmvZsqzfLFEcH62skOjZfpWzO3oYa2iY9itsSYWnE1BPimzquCfuy0xYh3Kc1xgtCe0sp1rfwA9R5A1sgD4pLllxxobBEekLBSx0wqkX2YIkQXdzDp0cdWTiQ5vYodcO8',
    description: 'The essential toolkit for any filmmaker starting their color journey.'
  }
];

const VIDEOS: Video[] = [
  {
    id: 'film-look',
    title: 'Cinematic Film Look DaVinci Resolve (Simplified Dehancer Workflow)',
    youtubeId: 'KXsOoeyBQsM',
    thumbnail: 'https://img.youtube.com/vi/KXsOoeyBQsM/hqdefault.jpg',
    description: 'Testing a simple 3-node workflow using Dehancer inside DaVinci Resolve to create a cinematic film look.',
    badge: 'LATEST'
  },
  {
    id: 'nisi-test',
    title: 'Testing NISI’s 14mm Lens for the First Time',
    youtubeId: 'jfWoHdjvfEI',
    thumbnail: 'https://img.youtube.com/vi/jfWoHdjvfEI/hqdefault.jpg',
    description: 'Testing the NiSi Athena 14mm T2.4 lens on the Blackmagic Pyxis 6K in North Rosedale Park, Detroit.',
    badge: 'NEW'
  },
  {
    id: 'pyxis-review',
    title: 'Exploring The Blackmagic Pyxis 6k: A Cinematographer’s In-depth Analysis Of The Features',
    youtubeId: 'e4cBhDcwldI',
    thumbnail: 'https://img.youtube.com/vi/e4cBhDcwldI/hqdefault.jpg',
    description: 'An in-depth look and technical analysis of the new Blackmagic Pyxis 6K cinema camera features.',
  },
  {
    id: 'olympus-review',
    title: 'Is The Olympus 12-40mm Pro Lens Worth It?',
    youtubeId: 'V7P-Ec6MYM4',
    thumbnail: 'https://img.youtube.com/vi/V7P-Ec6MYM4/hqdefault.jpg',
    description: 'Testing the sharpness, build quality, and usability of the Olympus 12-40mm Pro lens in narrative setups.',
  },
  {
    id: 'solidpod-review',
    title: 'Solidpod Cfast to msata ssd digital storage unit',
    youtubeId: '6yEoR5cDjzw',
    thumbnail: 'https://img.youtube.com/vi/6yEoR5cDjzw/hqdefault.jpg',
    description: 'Testing the SolidPod Cfast-to-SSD storage adapter for high bitrate RAW cinema camera recording.',
  },
  {
    id: 'smallrig-cage',
    title: 'BMPCC 4k Small Rig Camera Cage Review',
    youtubeId: 'QoB6G5fc37E',
    thumbnail: 'https://img.youtube.com/vi/QoB6G5fc37E/hqdefault.jpg',
    description: 'Building and reviewing the SmallRig cage setup for the Blackmagic Pocket Cinema Camera 4K.',
  }
];

function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<Array<{ id: string; title: string; price: number; quantity: number; image: string }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Video Modal State
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState('');
  const [activeVideoTitle, setActiveVideoTitle] = useState('');

  // Form Submission States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // YouTube Videos State
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLatestVideos(6)
      .then((data) => {
        if (active) {
          setVideos(data);
          setIsLoadingVideos(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch YouTube videos:', err);
        if (active) {
          setVideos(FALLBACK_VIDEOS);
          setIsLoadingVideos(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Scroll detection for Navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { id: product.id, title: product.title, price: product.price, quantity: 1, image: product.image }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prevItems) => 
      prevItems.map((item) => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handlePlayVideo = (youtubeId: string, title: string) => {
    setActiveVideoId(youtubeId);
    setActiveVideoTitle(title);
    setIsVideoOpen(true);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSuccess(false);
    }, 4000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSuccess(false);
    }, 4000);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen text-on-surface font-body relative bg-background">
      <div className="film-grain"></div>

      {/* --- TopNavBar --- */}
      <nav className={`fixed top-0 w-full z-40 flex justify-between items-center px-6 md:px-16 h-20 transition-all duration-300 ${
        isScrolled ? 'bg-[#0f1415]/95 backdrop-blur-md border-b border-[#3c4949]/30' : 'bg-transparent'
      }`}>
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <img 
            src="/logo.png" 
            alt="My Cine Toolbox Logo" 
            className="h-12 md:h-14 w-auto object-contain" 
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          <a className="font-mono text-label-md text-primary uppercase border-b-2 border-primary pb-1" href="#home">Home</a>
          <Link to="/about" className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase">About</Link>
          <a className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase" href="#videos">Videos</a>
          <Link to="/blog" className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase">Blog</Link>
          <a className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase" href="#toolbox">Toolbox</a>
          <a className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase" href="#shop">Shop</a>
          <Link to="/contact" className="font-mono text-label-md text-on-surface-variant hover:text-primary transition-colors uppercase">Contact</Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="text-primary hover:text-primary-container transition-colors relative cursor-pointer p-1"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-secondary text-[#321200] text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <Link 
            to="/admin" 
            className="w-10 h-10 rounded-full overflow-hidden bg-[#252b2b] border-2 border-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            title="Access Admin Dashboard"
          >
            <img 
              alt="Aaron Stowers Portrait" 
              className="w-full h-full object-cover" 
              src="/aaron-avatar.jpg"
            />
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-primary hover:text-primary-container transition-colors cursor-pointer p-1"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-body md:hidden">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-surface border-l border-outline-variant/50 flex flex-col p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <span className="font-display text-headline-md text-primary tracking-wider uppercase">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              <a onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm" href="#home">Home</a>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm">About</Link>
              <a onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm" href="#videos">Videos</a>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm">Blog</Link>
              <a onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm" href="#toolbox">Toolbox</a>
              <a onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm" href="#shop">Shop</a>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="font-mono text-label-md text-on-surface hover:text-primary transition-colors uppercase text-sm">Contact</Link>
            </div>
          </div>
        </div>
      )}

      {/* --- Hero Section --- */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-6 pt-20 overflow-hidden" id="home">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Cinematic Backdrop" 
            className="w-full h-full object-cover opacity-40" 
            src="/hero-bg.png"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f1415]/0 via-[#0f1415]/60 to-[#0f1415]"></div>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-4xl">
          <h2 className="font-mono text-label-sm text-primary tracking-[0.2em] uppercase">Gear. Tech. Tutorials. Filmmaking.</h2>
          <h1 className="font-display text-display-lg md:text-[96px] text-on-surface uppercase leading-none">
            Tools. Workflow.<br/>
            <span className="text-primary">Cinematic Results.</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-10">
            <a 
              href="https://www.youtube.com/@mycinetoolbox1979" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 bg-primary text-on-primary font-mono text-label-md uppercase tracking-wider hover:bg-primary-container transition-all flex items-center justify-center gap-2"
            >
              <Youtube size={16} /> Watch on YouTube
            </a>
            <a 
              href="#toolbox" 
              className="px-8 py-4 border border-secondary text-secondary font-mono text-label-md uppercase tracking-wider hover:bg-secondary/10 transition-all"
            >
              Browse the Toolbox
            </a>
          </div>
          
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-2">
              <Camera className="text-primary text-3xl" size={28} />
              <span className="font-mono text-label-sm uppercase opacity-70">Gear Reviews</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Wrench className="text-primary text-3xl" size={28} />
              <span className="font-mono text-label-sm uppercase opacity-70">Workflows</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Laptop className="text-primary text-3xl" size={28} />
              <span className="font-mono text-label-sm uppercase opacity-70">Color Grading</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Compass className="text-primary text-3xl" size={28} />
              <span className="font-mono text-label-sm uppercase opacity-70">Creativity</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- About Section --- */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="teal-divider mb-24"></div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative group">
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-primary"></div>
            <img 
              alt="Aaron Stowers on Set" 
              className="w-full border border-[#3c4949] transition-all duration-500 group-hover:scale-[1.01]" 
              src="/aaron-on-set.jpg"
            />
          </div>
          <div className="bg-surface-container-low p-10 border-l-4 border-primary">
            <h2 className="font-display text-headline-lg mb-6 uppercase">Aaron Stowers</h2>
            <p className="font-body text-body-lg text-on-surface-variant mb-8 leading-relaxed">
              Based in the industrial heart of Detroit, I am a cinematographer and technical workflow specialist dedicated to the craft of visual storytelling. Through "My Cine Toolbox," I bridge the gap between high-end technical specs and emotional cinematic results. My mission is to help filmmakers master their gear so they can focus on the art.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="https://www.youtube.com/@mycinetoolbox1979" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-primary text-on-primary px-6 py-3 font-mono text-label-md uppercase tracking-wide flex items-center gap-2 hover:bg-primary-container transition-all"
              >
                <Youtube size={16} /> Subscribe
              </a>
              <a 
                href="https://paypal.me/astowers433?locale.x=en_US&country.x=US"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-outline text-on-surface px-6 py-3 font-mono text-label-md uppercase tracking-wide flex items-center gap-2 hover:border-primary transition-colors cursor-pointer"
              >
                <Coffee size={16} /> Buy Me a Coffee
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- Featured Videos Section --- */}
      <section className="py-24 bg-surface-container-lowest" id="videos">
        <div className="px-6 md:px-16 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display text-headline-lg uppercase">Featured Videos</h2>
              <p className="font-mono text-label-md text-primary mt-2">Latest from the Lab</p>
            </div>
            <a 
              href="https://www.youtube.com/@mycinetoolbox1979"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-label-md text-on-surface-variant hover:text-primary uppercase tracking-widest border-b border-transparent hover:border-primary pb-1 transition-all cursor-pointer"
            >
              View Channel
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingVideos ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div 
                  key={index}
                  className="bg-surface-container p-4 border border-outline-variant/30 animate-pulse flex flex-col h-full"
                >
                  <div className="aspect-video bg-[#090f10]/50 border border-[#3c4949]/10 mb-4" />
                  <div className="h-6 bg-outline-variant/20 mb-2 w-3/4" />
                  <div className="h-4 bg-outline-variant/10 mb-1 w-full" />
                  <div className="h-4 bg-outline-variant/10 mb-4 w-5/6" />
                  <div className="mt-auto pt-3 border-t border-outline-variant/10 flex justify-between">
                    <div className="h-3 bg-outline-variant/10 w-16" />
                    <div className="h-3 bg-outline-variant/10 w-16" />
                  </div>
                </div>
              ))
            ) : (
              videos.map((video) => (
                <div 
                  key={video.id} 
                  className="group bg-surface-container p-4 border border-outline-variant/30 hover-glow cursor-pointer transition-all flex flex-col h-full"
                  onClick={() => handlePlayVideo(video.id, video.title)}
                >
                  <div className="aspect-video overflow-hidden mb-4 relative bg-[#090f10] border border-[#3c4949]/20">
                    <img 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={video.thumbnail}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full border border-primary flex items-center justify-center bg-[#0f1415]/80 text-primary">
                        <Play size={16} className="ml-0.5" />
                      </div>
                    </div>
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/85 px-1.5 py-0.5 text-[10px] font-mono text-white tracking-wider">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h3 className="font-display text-headline-md mb-2 leading-tight uppercase group-hover:text-primary transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="font-body text-body-md text-on-surface-variant text-sm line-clamp-2 leading-relaxed mb-4 flex-grow">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-outline-variant/20 font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                      <span>{video.views}</span>
                      {video.publishedAt && <span>{video.publishedAt}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- The Toolbox Section --- */}
      <section className="py-24 px-6 md:px-16 max-w-7xl mx-auto" id="toolbox">
        <div className="mb-16">
          <h2 className="font-display text-display-lg text-primary tracking-tight uppercase">The Toolbox</h2>
          <div className="h-[2px] w-24 bg-secondary mt-2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container p-8 border border-outline-variant/30 hover:border-primary/50 transition-all flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                <Camera size={24} />
              </div>
              <h4 className="font-display text-headline-md mb-4 uppercase">Cameras</h4>
              <p className="font-body text-body-md text-on-surface-variant mb-8 text-sm leading-relaxed">
                Testing dynamic range, color science, and real-world ergonomics. Focus on Blackmagic and RED.
              </p>
            </div>
            <a 
              href="https://www.youtube.com/@mycinetoolbox1979"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center border border-secondary text-secondary font-mono text-label-sm uppercase hover:bg-secondary hover:text-white transition-all"
            >
              View Reviews
            </a>
          </div>

          <div className="bg-surface-container p-8 border border-outline-variant/30 hover:border-primary/50 transition-all flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                <Compass size={24} />
              </div>
              <h4 className="font-display text-headline-md mb-4 uppercase">Lenses</h4>
              <p className="font-body text-body-md text-on-surface-variant mb-8 text-sm leading-relaxed">
                Character, flare, and sharpness. Finding the right vintage or modern glass for the narrative.
              </p>
            </div>
            <a 
              href="https://www.youtube.com/@mycinetoolbox1979"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center border border-secondary text-secondary font-mono text-label-sm uppercase hover:bg-secondary hover:text-white transition-all"
            >
              View Reviews
            </a>
          </div>

          <div className="bg-surface-container p-8 border border-outline-variant/30 hover:border-primary/50 transition-all flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                <Laptop size={24} />
              </div>
              <h4 className="font-display text-headline-md mb-4 uppercase">Software</h4>
              <p className="font-body text-body-md text-on-surface-variant mb-8 text-sm leading-relaxed">
                DaVinci Resolve workflows, color grading plugins, and post-production compression codecs.
              </p>
            </div>
            <a 
              href="https://www.youtube.com/@mycinetoolbox1979"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center border border-secondary text-secondary font-mono text-label-sm uppercase hover:bg-secondary hover:text-white transition-all"
            >
              View Reviews
            </a>
          </div>

          <div className="bg-surface-container p-8 border border-outline-variant/30 hover:border-primary/50 transition-all flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                <Wrench size={24} />
              </div>
              <h4 className="font-display text-headline-md mb-4 uppercase">Accessories</h4>
              <p className="font-body text-body-md text-on-surface-variant mb-8 text-sm leading-relaxed">
                Monitor brackets, follow focus systems, power distribution, and the small things that save the shoot.
              </p>
            </div>
            <a 
              href="https://www.youtube.com/@mycinetoolbox1979"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 text-center border border-secondary text-secondary font-mono text-label-sm uppercase hover:bg-secondary hover:text-white transition-all"
            >
              View Reviews
            </a>
          </div>
        </div>
      </section>

      {/* --- Shop Section --- */}
      <section className="py-24 bg-surface-container-lowest" id="shop">
        <div className="px-6 md:px-16 max-w-7xl mx-auto text-center mb-16">
          <h2 className="font-display text-display-lg mb-4 uppercase">Level Up Your Color Grade</h2>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Professional workflow LUTs developed for Detroit night shoots and cinematic daylight narrative projects.
          </p>
        </div>
        
        <div className="px-6 md:px-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
            <div 
              key={product.id} 
              className="relative bg-surface p-6 border border-outline-variant/30 group flex flex-col justify-between"
            >
              <div className="absolute top-4 right-4 bg-secondary-container px-3 py-1 font-mono text-label-md text-white font-bold">
                ${product.price}
              </div>
              <div>
                <div className="aspect-square bg-black mb-6 overflow-hidden border border-[#3c4949]/30">
                  <img 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src={product.image}
                  />
                </div>
                <h3 className="font-display text-headline-md mb-2 uppercase group-hover:text-primary transition-colors">{product.title}</h3>
                <p className="font-body text-body-md text-on-surface-variant mb-8 text-sm leading-relaxed">{product.description}</p>
              </div>
              <button 
                disabled
                className="w-full bg-[#1e1a11] text-[#99907c] border border-[#4d4635]/50 py-4 font-display text-headline-md tracking-widest uppercase cursor-not-allowed font-semibold"
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* --- Portfolio Section --- */}
      <section className="py-24 max-w-7xl mx-auto px-6 md:px-16">
        <div className="mb-16">
          <h2 className="font-display text-headline-lg uppercase text-center">Portfolio &amp; Reel</h2>
          <div className="teal-divider mt-4"></div>
        </div>

        {/* Video Reel — HTML5 Local Video */}
        <div className="w-full aspect-video bg-[#090f10] mb-12 relative border border-[#3c4949]/30 overflow-hidden group">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/nisi-25mm.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls
          />
          {/* Dark gradient so the title overlay is always readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1415]/80 via-transparent to-transparent pointer-events-none" />
          {/* Title overlay — visible unless user is hovering (to avoid controls overlap) */}
          <div className="absolute bottom-8 left-8 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
            <p className="font-mono text-label-md text-primary tracking-widest uppercase mb-1 font-semibold">Cinematography Reel</p>
            <h3 className="font-display text-headline-lg md:text-[56px] text-white uppercase leading-none">Aaron Stowers</h3>
          </div>
        </div>

        {/* Photography Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="aspect-[3/4] overflow-hidden border border-[#3c4949]/20">
            <img 
              alt="Detroit Architecture Sunset" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 cursor-crosshair" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxHiqKm7od-kdou2H97ipdkZ5MrgDblxli1r3jSpSwrVuEo4tFrsAz7YTsbAxXO1D978On_glD6NVL2LUCvNqPDhNDCC1s4eQmmafm7HH1I67O6HzR5Dmq9KpKB3J9eQt6CAFmyjSTOXl-Ge5ly3V0jiAMK6vFBC4459CjGHOMky8mgzD_LtPCexEKGzJPzgvD2Wf-tIv-scXlCLphCI5AdD5xihmp1TistTskPBpOucnVeqEYjuQTu6dCDcpLYu0kuiltMhnFyi4"
            />
          </div>
          <div className="aspect-[3/4] overflow-hidden border border-[#3c4949]/20 mt-8">
            <img 
              alt="Detroit Theater Interior" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 cursor-crosshair" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGaiYVUroOjxjCGOpFVll3Q2mTBo7PHA0WD6szmLkj4cwtMo1cJHUZfSjTCz1jNIru1s0AbE20O0m7nDgBHVGDTrexzk1jbuqHqQy9H_TuU3BXwqDY0lX5EqtAUuhlPnIoQ9v2HP650g1TmCDRU0U2-mFr2LMns7YWW849tM70MHAoJ-vd4-I-BZ0ttVXpzUdQtx_b2BP30WUI2DRcxJDTiJXRxeIUBoG75BNCXX4NLtGN_HspAe2yd7M4h8G3fwC-K8KAweXWjMQ"
            />
          </div>
          <div className="aspect-[3/4] overflow-hidden border border-[#3c4949]/20">
            <img 
              alt="Industrial Detroit Factory" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 cursor-crosshair" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOz6YJqBhH4-reAsUkkl-P-xONmsJIa2CvMpEpqStCBiiGXp1Kr6WrN4tTwffJLsIH3d17WndyBJLQKHYagxXOZ8l7cEPGudHUZu3DczPTs1aJn4kV5iiRO0V355a_i3RDSnEEqbma2YHz2CJlmOXEBxkXGfcr13tjDbagZsXmNC8WwNpiJplHobIQVWAEDxG9_x6VktTVQpetwxBhGVJ57Q8RhAQeRaG5wlbWNqPu6ELzFxXjtYuN66JpV1s37MNXxmNujSwJgLc"
            />
          </div>
          <div className="aspect-[3/4] overflow-hidden border border-[#3c4949]/20 mt-8">
            <img 
              alt="Vintage Projector Machinery" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 cursor-crosshair" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj1Hpy6F-ldAiKXDTwnChpZuUBq38cJCXvix9T_oZDC46NVNUrPdt8e9Yn7NljmB1aRtLZxg8X2oaUMB6o1UtVQVleU7Q6Dxp9ouS52enCmiH8MJMJpAUzDRJRGm1JAHuhyU71Zo020kPCkvANyGMCHmLdGqyvzQen8-HS5Gd8FRT5Rs0STSiWkH079olsO__ZfmV6SvN5LKKMlB7hVjx1W13boGgOCBH3aevsCBCCXIac972lFuQXMuIc-mMsnzqlOx5C2br086A"
            />
          </div>
        </div>
      </section>

      {/* --- Newsletter & Contact Section --- */}
      <section className="py-24 bg-surface-container-low border-t border-[#3c4949]/30" id="contact">
        <div className="px-6 md:px-16 max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          {/* Newsletter Form */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="font-display text-display-lg mb-6 uppercase">Stay in the Loop</h2>
              <p className="font-body text-body-lg text-on-surface-variant mb-10 leading-relaxed">
                Join the growing list of filmmakers. Get technical tips, gear updates, and color science breakdowns delivered straight to your inbox.
              </p>
            </div>
            
            {newsletterSuccess ? (
              <div className="bg-primary/10 border border-primary/20 p-4 font-mono text-xs text-primary">
                ✓ Welcome to the Cine Toolbox.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-4">
                <input 
                  required
                  type="email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="YOUR EMAIL ADDRESS" 
                  className="bg-transparent border-b border-primary py-4 font-mono text-label-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-secondary transition-colors uppercase rounded-none"
                />
                <button 
                  type="submit"
                  className="bg-primary text-on-primary py-4 px-8 font-mono text-label-md uppercase tracking-widest self-start hover:bg-primary-container transition-colors cursor-pointer"
                >
                  Join the Toolbox
                </button>
              </form>
            )}
          </div>

          {/* Contact Inquiry Form */}
          <div>
            <h2 className="font-display text-headline-lg mb-8 uppercase">Direct Inquiry</h2>
            {contactSuccess ? (
              <div className="bg-primary/10 border border-primary/20 p-6 font-mono text-xs text-primary h-full flex items-center justify-center">
                ✓ Message sent successfully. I will get back to you shortly.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <input 
                    required
                    type="text" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="NAME" 
                    className="w-full bg-transparent border-b border-outline py-3 font-mono text-label-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary transition-colors uppercase rounded-none"
                  />
                  <input 
                    required
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="EMAIL" 
                    className="w-full bg-transparent border-b border-outline py-3 font-mono text-label-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary transition-colors uppercase rounded-none"
                  />
                </div>
                <textarea 
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="MESSAGE / PROJECT DETAILS" 
                  className="w-full bg-transparent border-b border-outline py-3 font-mono text-label-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary transition-colors uppercase resize-none rounded-none"
                ></textarea>
                <button 
                  type="submit"
                  className="w-full bg-secondary text-[#321200] py-4 font-mono text-label-md uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  Send Message <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="w-full py-12 px-6 md:px-16 border-t border-[#3c4949]/20 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <div className="font-display text-headline-md text-on-surface mb-2 uppercase">Aaron Stowers</div>
            <div className="font-mono text-label-sm text-on-surface-variant tracking-widest uppercase">Cinematography &amp; Education</div>
          </div>
          
          <div className="flex gap-8">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors font-mono text-label-sm uppercase">Instagram</a>
            <a href="https://www.youtube.com/@mycinetoolbox1979" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors font-mono text-label-sm uppercase cursor-pointer">YouTube</a>
            <a href="https://www.facebook.com/profile.php?id=100063927638487" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors font-mono text-label-sm uppercase">Facebook</a>
            <a href="https://vimeo.com" target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary transition-colors font-mono text-label-sm uppercase">Vimeo</a>
          </div>
          
          <div className="text-center md:text-right">
            <div className="flex flex-col md:items-end gap-1">
              <p className="font-mono text-label-sm text-on-surface-variant">@mycinetoolbox</p>
              <div className="flex gap-4">
                <Link to="/faq" className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider mt-1 cursor-pointer">FAQ</Link>
                <Link to="/privacy" className="font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider mt-1 cursor-pointer">Privacy Policy</Link>
              </div>
              <p className="font-mono text-[10px] text-outline mt-2 uppercase tracking-tighter">© 2026 AARON STOWERS CINEMATOGRAPHY. ALL RIGHTS RESERVED.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* YouTube Video Player Modal */}
      <VideoModal 
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        youtubeId={activeVideoId}
        title={activeVideoTitle}
      />
    </div>
  );
}

export default function App() {
  // Grammarly Opt-Out & Privacy Protection observer
  useEffect(() => {
    const disableGrammarlyForElement = (el: HTMLElement) => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.hasAttribute('contenteditable')) {
        el.setAttribute('data-gramm', 'false');
        el.setAttribute('data-gramm_editor', 'false');
        el.setAttribute('data-enable-grammarly', 'false');
        el.setAttribute('spellcheck', 'false');
      }
    };

    // Run initially for existing elements
    document.querySelectorAll('input, textarea, [contenteditable]').forEach((el) => {
      disableGrammarlyForElement(el as HTMLElement);
    });

    // Observe future dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            disableGrammarlyForElement(node);
            node.querySelectorAll('input, textarea, [contenteditable]').forEach((el) => {
              disableGrammarlyForElement(el as HTMLElement);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin" element={<YoutubeOptimizerPage />} />
      <Route path="/admin/youtube-seo" element={<YoutubeOptimizerPage />} />
      <Route path="/admin/opportunities" element={<OpportunityEnginePage />} />
      <Route path="/admin/campaigns" element={<SavedCampaignsPage />} />
      <Route path="/admin/analytics" element={<AnalyticsPage />} />
      <Route path="/admin/indexing" element={<IndexingPortalPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/faq" element={<FaqPage />} />
    </Routes>
  );
}
