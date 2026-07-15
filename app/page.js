"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  Sparkles as SparkleIcon,
  X as CloseIcon,
  Share2 as ShareIcon,
  Smartphone, Laptop, Tv, Headphones, LayoutGrid, RefreshCw,
  ChevronDown, ChevronLeft, ChevronRight, Menu as MenuIcon,
  Plus, Watch, Camera, Gamepad2, Home as HomeIcon,
  Bell, TrendingUp, ArrowUpDown, Filter, Layers,
  Zap, Clock, Sun, Moon, Copy, Check, Star, ExternalLink,
  ArrowDown, Mail, MapPin, Shield, FileText, Info,
  Send, AtSign, Globe, Video, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring as useMotionSpring } from "framer-motion";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── HAPTICS — richer multi-pattern system ───────────────────────────────────
const triggerHaptic = (type = "light") => {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  const patterns = {
    light:    [6],
    medium:   [14],
    heavy:    [30],
    success:  [8, 60, 8],          // double-tap feel
    error:    [40, 30, 40],        // buzz-buzz
    select:   [10],
    tab:      [4],
    purchase: [10, 40, 20, 40, 10], // triple pulse
    longPress:[40, 30, 8],
    dismiss:  [6, 20, 6],
  };
  navigator.vibrate(patterns[type] ?? [6]);
};

// ─── MOTION PRESETS ───────────────────────────────────────────────────────────
const appleSpring  = { type: "spring", stiffness: 340, damping: 32, mass: 0.85 };
const gentleSpring = { type: "spring", stiffness: 220, damping: 28, mass: 0.8  };
const snappySpring = { type: "spring", stiffness: 500, damping: 42, mass: 0.9  };
const appleEase    = [0.25, 0.46, 0.45, 0.94];
const heroEase     = [0.16, 1, 0.3, 1]; // Apple-style over-shoot ease

// ─── SCROLL-DOWN ARROW (Apple bounce) ────────────────────────────────────────
function ScrollArrow({ accentColor, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Scroll down to search"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, ...gentleSpring }}
      className="flex flex-col items-center gap-2 cursor-pointer group focus:outline-none"
      onPointerDown={() => triggerHaptic("light")}
    >
      <motion.span
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5, ease: appleEase }}
        className="text-white/60 text-[11px] font-semibold tracking-[0.2em] uppercase select-none"
      >
        Scroll to Search
      </motion.span>

      {/* Bouncing arrow container */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{
          y: {
            duration: 1.4,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
            repeatType: "loop",
          },
        }}
        className="flex flex-col items-center"
      >
        {/* Three chevrons stacked — Apple's classic fade-cascade arrow */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2 + i * 0.28, 0.9, 0.2 + i * 0.28] }}
            transition={{
              opacity: {
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              },
            }}
          >
            <ChevronDown
              className="w-5 h-5 text-white -mt-1.5"
              strokeWidth={2.5}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.button>
  );
}

// ─── SKELETON CARD (memoised + shimmer) ──────────────────────────────────────
const SkeletonCard = ({ dark }) => (
  <div
    className={`rounded-2xl border overflow-hidden ${
      dark ? "bg-[#141414] border-white/[0.06]" : "bg-white border-gray-200/70"
    }`}
  >
    <div className="p-3 sm:p-4">
      <div
        className="h-28 sm:h-36 rounded-xl mb-3 relative overflow-hidden"
        style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f0f0f0" }}
      >
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      <div
        className="h-2.5 rounded-full mb-2 w-full"
        style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f0f0f0" }}
      />
      <div
        className="h-2.5 rounded-full w-2/3"
        style={{ background: dark ? "rgba(255,255,255,0.03)" : "#f0f0f0" }}
      />
    </div>
    <div
      className={`p-3 sm:p-4 border-t ${
        dark ? "border-white/[0.04]" : "border-gray-100"
      }`}
    >
      <div
        className="h-4 w-1/3 rounded-full mb-3"
        style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f0f0f0" }}
      />
      <div
        className="h-9 rounded-xl"
        style={{ background: dark ? "rgba(255,255,255,0.04)" : "#f0f0f0" }}
      />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function Home() {
  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [products,       setProducts]      = useState([]);
  const [query,          setQuery]         = useState("");
  const [results,        setResults]       = useState([]);
  const [activeTab,      setActiveTab]     = useState("All");
  const [dark,           setDark]          = useState(true);
  const [isLoading,      setIsLoading]     = useState(true);
  const [isSearching,    setIsSearching]   = useState(false);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [isScrolled,     setIsScrolled]    = useState(false);
  const [isFabOpen,      setIsFabOpen]     = useState(false);
  const [isMenuOpen,     setIsMenuOpen]    = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMoreOpen,     setIsMoreOpen]    = useState(false);
  const [suggestions,    setSuggestions]   = useState([]);
  const [showSuggestions,setShowSuggestions] = useState(false);
  const [currentPage,    setCurrentPage]   = useState(1);
  const [isMobile,       setIsMobile]      = useState(false);
  const [selectedProduct,setSelectedProduct] = useState(null);
  const [watchedDeals,   setWatchedDeals]  = useState([]);
  const [liveNotification,setLiveNotification] = useState(null);
  const [compareList,    setCompareList]   = useState([]);
  const [isCompareOpen,  setIsCompareOpen] = useState(false);
  const [maxPrice,       setMaxPrice]      = useState(200000);
  const [sortOrder,      setSortOrder]     = useState("relevance");
  const [isFilterOpen,   setIsFilterOpen]  = useState(false);
  const [hourTimer,      setHourTimer]     = useState("");
  const [user,           setUser]          = useState(null);
  const [copiedDeal,     setCopiedDeal]    = useState(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [heroVisible,    setHeroVisible]   = useState(true);
  const [fetchError,     setFetchError]    = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);       // recently viewed products
  const [platformFilter, setPlatformFilter] = useState("All");    // Amazon / Flipkart / Myntra / Nykaa / All
  const [lightboxImg,    setLightboxImg]    = useState(null);     // image lightbox src
  const [topDealsOpen,   setTopDealsOpen]   = useState(true);     // top deals strip

  // ─── REFS ───────────────────────────────────────────────────────────────────
  const suggestionContainerRef = useRef(null);
  const moreMenuRef            = useRef(null);
  const moreButtonRef          = useRef(null);
  const categoryMenuRef        = useRef(null);
  const inputRef               = useRef(null);
  const searchContainerRef     = useRef(null);
  const heroIntervalRef        = useRef(null);
  const heroSectionRef         = useRef(null);

  // ─── SCROLL PHYSICS ─────────────────────────────────────────────────────────
  const { scrollY } = useScroll();
  const heroScale   = useTransform(scrollY, [0, 600], [1, 1.06]);
  const heroOpacity = useTransform(scrollY, [0, 350], [1, 0]);
  const springScrollY = useMotionSpring(scrollY, { stiffness: 100, damping: 30 });

  // ─── DEVICE CHECK (debounced) ───────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(check, 120); };
    window.addEventListener("resize", onResize, { passive: true });
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);

  // ─── AUTH ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    triggerHaptic("medium");
    try {
      if (user) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error("Auth failed:", err);
      triggerHaptic("error");
      setLiveNotification(user ? "Sign out failed. Please try again." : "Sign in failed. Please try again.");
      setTimeout(() => setLiveNotification(null), 4000);
    }
  };

  // ─── WATCHLIST ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = async () => {
      const saved = localStorage.getItem("dealx_watchlist");
      if (saved) setWatchedDeals(JSON.parse(saved));
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        const { data, error } = await supabase
          .from("user_watchlists")
          .select("product_name")
          .eq("user_id", u.id);
        if (data && !error) {
          const names = data.map((r) => r.product_name);
          setWatchedDeals(names);
          localStorage.setItem("dealx_watchlist", JSON.stringify(names));
        }
      }
    };
    sync();
  }, [user]);

  const toggleWatch = useCallback(async (e, product) => {
    e.stopPropagation();
    triggerHaptic("success");
    const { data: { user: u } } = await supabase.auth.getUser();
    const watching = watchedDeals.includes(product.name);
    const updated  = watching
      ? watchedDeals.filter((n) => n !== product.name)
      : [...watchedDeals, product.name];
    if (u) {
      if (watching) {
        await supabase.from("user_watchlists").delete().match({ user_id: u.id, product_name: product.name });
      } else {
        await supabase.from("user_watchlists").insert({ user_id: u.id, product_name: product.name });
      }
    }
    setWatchedDeals(updated);
    localStorage.setItem("dealx_watchlist", JSON.stringify(updated));
  }, [watchedDeals]);

  // ─── LIVE NOTIFICATIONS (real Supabase realtime) ────────────────────────────
  useEffect(() => {
    // Subscribe to real watchlist inserts from other users
    const channel = supabase
      .channel("public:user_watchlists")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_watchlists" },
        (payload) => {
          const name = payload.new?.product_name;
          if (name) {
            setLiveNotification(`Someone just added "${name}" to their watchlist!`);
            setTimeout(() => setLiveNotification(null), 5000);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ─── COMPARE ────────────────────────────────────────────────────────────────
  const toggleCompare = useCallback((e, product) => {
    e.stopPropagation();
    triggerHaptic("select");
    if (compareList.find((p) => p.name === product.name)) {
      setCompareList((c) => c.filter((p) => p.name !== product.name));
    } else if (compareList.length < 3) {
      setCompareList((c) => [...c, product]);
      setIsCompareOpen(true);
    }
  }, [compareList]);

  // ─── DEAL LOGIC ─────────────────────────────────────────────────────────────
  const getBestDeal = useCallback((product) => {
    if (!product) return { platform: "None", price: 0, link: "#", savings: 0 };
    const offers = [
      { platform: "Amazon",   price: product.amazonPrice,   link: product.amazonLink   },
      { platform: "Flipkart", price: product.flipkartPrice, link: product.flipkartLink },
      { platform: "Myntra",   price: product.myntraPrice,   link: product.myntraLink   },
      { platform: "Nykaa",    price: product.nykaaPrice,    link: product.nykaaLink    },
    ].filter((o) => o.price > 0);
    if (!offers.length) return { platform: "None", price: 0, link: "#", savings: 0 };
    const sorted = [...offers].sort((a, b) => a.price - b.price);
    return { ...sorted[0], savings: sorted[sorted.length - 1].price - sorted[0].price };
  }, []);

  const getDealScore = useCallback((product) => {
    const { price, savings } = getBestDeal(product);
    if (!price) return { score: 0, percent: "0" };
    const pct = (savings / (price + savings)) * 100;
    return {
      score: Math.min(Math.max((pct / 5) + 5, 4.2), 9.9).toFixed(1),
      percent: pct.toFixed(0),
    };
  }, [getBestDeal]);

  // ─── ENRICHED RESULTS (compute once) ────────────────────────────────────────
  const enrichedResults = useMemo(
    () => results.map((p) => ({ ...p, _best: getBestDeal(p), _score: getDealScore(p) })),
    [results, getBestDeal, getDealScore]
  );

  const finalResults = useMemo(() => {
    let list = enrichedResults.filter((p) => p._best.price > 0 && p._best.price <= maxPrice);
    // Platform filter
    if (platformFilter === "Amazon")   list = list.filter((p) => (p.amazonPrice   || 0) > 0);
    if (platformFilter === "Flipkart") list = list.filter((p) => (p.flipkartPrice  || 0) > 0);
    if (platformFilter === "Myntra")   list = list.filter((p) => (p.myntraPrice   || 0) > 0);
    if (platformFilter === "Nykaa")    list = list.filter((p) => (p.nykaaPrice    || 0) > 0);
    if (sortOrder === "priceLow") list = [...list].sort((a, b) => a._best.price - b._best.price);
    else if (sortOrder === "savings") list = [...list].sort((a, b) => parseFloat(b._score.percent) - parseFloat(a._score.percent));
    return list;
  }, [enrichedResults, maxPrice, sortOrder, platformFilter]);

  // ─── PAGINATION ─────────────────────────────────────────────────────────────
  const itemsPerPage  = isMobile ? 40 : 80;
  const pageLimit     = isMobile ? 4 : 8;
  const totalPages    = Math.ceil(finalResults.length / itemsPerPage);
  const paginatedResults = useMemo(
    () => finalResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [finalResults, currentPage, itemsPerPage]
  );

  const getPageNumbers = () => {
    const half  = Math.floor(pageLimit / 2);
    let start   = Math.max(currentPage - half, 1);
    let end     = Math.min(start + pageLimit - 1, totalPages);
    if (end - start + 1 < pageLimit) start = Math.max(end - pageLimit + 1, 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ─── REFRESH TIMER (counts down 60 min from last fetch) ────────────────────
  const lastFetchRef = useRef(Date.now());
  useEffect(() => {
    const INTERVAL_MS = 60 * 60 * 1000; // 60 minutes
    const update = () => {
      const elapsed = Date.now() - lastFetchRef.current;
      const remaining = Math.max(0, INTERVAL_MS - elapsed);
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setHourTimer(`${m}:${String(s).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── HERO AUTO-PLAY ─────────────────────────────────────────────────────────
  useEffect(() => {
    heroIntervalRef.current = setInterval(
      () => setCurrentHeroIndex((p) => (p + 1) % heroSlides.length),
      6000
    );
    return () => clearInterval(heroIntervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── SCROLL DETECTION (rAF-throttled) ───────────────────────────────────────
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setHeaderScrolled(window.scrollY > 10);
      if (searchContainerRef.current) {
        const rect = searchContainerRef.current.getBoundingClientRect();
        if (rect.top < 0) {
          setIsScrolled(true);
          setHeroVisible(false);
        } else {
          setIsScrolled(false);
          setIsFabOpen(false);
          setIsMenuOpen(false);
          setIsCategoryMenuOpen(false);
          setHeroVisible(true);
        }
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── OUTSIDE CLICK ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (suggestionContainerRef.current && !suggestionContainerRef.current.contains(e.target))
        setShowSuggestions(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target) &&
          !(moreButtonRef.current && moreButtonRef.current.contains(e.target)))
        setIsMoreOpen(false);
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target))
        setIsCategoryMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ─── PRODUCTS FETCH (with error handling + retry) ───────────────────────────
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data");
      setProducts(data);
      setResults(data);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error("Products fetch failed:", err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ─── SEARCH DEBOUNCE (query preserved across tab switches) ─────────────────
  useEffect(() => {
    setIsSearching(true);
    setCurrentPage(1);
    const t = setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (q.length > 1) {
        setSuggestions(products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      let filtered = [...products];
      if (activeTab === "Aesthetic Centre") filtered = filtered.filter((p) => p.isAesthetic);
      else if (activeTab !== "All" && activeTab !== "More")
        filtered = filtered.filter((p) => p.category === activeTab);
      // Always apply query filter — query is NOT reset on tab change
      setResults(q.length > 0 ? filtered.filter((p) => p.name.toLowerCase().includes(q)) : filtered);
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, activeTab, products]);

  // ─── SHARE (native Web Share on mobile, clipboard fallback) ────────────────
  const handleShare = useCallback(async (name, link) => {
    triggerHaptic("success");
    const text = `Check out this deal on DealX: ${name}\n${link}`;
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: `DealX — ${name}`, text, url: link });
        return;
      } catch (_) { /* fallthrough to clipboard */ }
    }
    try { await navigator.clipboard.writeText(text); } catch (_) {}
    setCopiedDeal(name);
    setTimeout(() => setCopiedDeal(null), 2000);
  }, []);

  // ─── RECENTLY VIEWED ────────────────────────────────────────────────────────
  const openProduct = useCallback((product) => {
    setSelectedProduct(product);
    triggerHaptic("light");
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.name !== product.name);
      return [product, ...filtered].slice(0, 8);
    });
  }, []);
  const scrollToSearch = useCallback(() => {
    triggerHaptic("light");
    searchContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  // ─── STATIC DATA ────────────────────────────────────────────────────────────
  const heroSlides = [
    {
      title: "The Aesthetic Edit",
      sub:   "Minimalist Tech & Decor",
      img:   "https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1664&auto=format&fit=crop",
      tab:   "Aesthetic Centre",
      cta:   "Shop Aesthetic",
    },
    {
      title: "Ultimate Workstations",
      sub:   "M3 MacBooks at Best Prices",
      img:   "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1652&auto=format&fit=crop",
      tab:   "Laptops",
      cta:   "Shop Laptops",
    },
    {
      title: "Premium Sound",
      sub:   "Studio Quality Audio",
      img:   "https://images.unsplash.com/photo-1502798985865-1ab60332f46c?q=80&w=1332&auto=format&fit=crop",
      tab:   "Audio",
      cta:   "Shop Audio",
    },
  ];

  const tabs = [
    { name: "All",              icon: <LayoutGrid  className="w-4 h-4" /> },
    { name: "Aesthetic Centre", icon: <SparkleIcon className="w-4 h-4" /> },
    { name: "Mobiles",          icon: <Smartphone  className="w-4 h-4" /> },
    { name: "Laptops",          icon: <Laptop      className="w-4 h-4" /> },
    { name: "Appliances",       icon: <Tv          className="w-4 h-4" /> },
    { name: "Audio",            icon: <Headphones  className="w-4 h-4" /> },
    { name: "More",             icon: <Plus        className="w-4 h-4" />, isDropdown: true },
  ];

  const moreCategories = [
    { name: "Watches", icon: <Watch    className="w-4 h-4" /> },
    { name: "Cameras", icon: <Camera   className="w-4 h-4" /> },
    { name: "Gaming",  icon: <Gamepad2 className="w-4 h-4" /> },
    { name: "Home",    icon: <HomeIcon className="w-4 h-4" /> },
  ];

  const isAestheticMode = activeTab === "Aesthetic Centre";

  // ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
  const T = {
    bg:          isAestheticMode ? "bg-gradient-to-br from-[#F5F5F0] to-[#EFEFEA]" : dark ? "bg-[#090909]" : "bg-[#F0F2F5]",
    text:        isAestheticMode ? "text-[#2C2421]" : dark ? "text-white" : "text-gray-900",
    subtext:     dark ? "text-white/35" : "text-gray-400",
    card:        isAestheticMode ? "bg-[#F5F5F0] border-[#D6D2C4]" : dark ? "bg-[#141414] border-white/[0.06]" : "bg-white border-gray-200/70",
    header:      isAestheticMode ? "bg-white/85 border-[#D6D2C4]/60" : dark ? "bg-[#090909]/85 border-white/[0.06]" : "bg-white/92 border-gray-200/60",
    surface:     isAestheticMode ? "bg-white/90 border-[#D6D2C4]"   : dark ? "bg-[#1a1a1a] border-white/[0.06]" : "bg-white border-gray-200",
    accent:      isAestheticMode ? "#8E8475" : "#2563eb",
    accentCls:   isAestheticMode ? "bg-[#8E8475]"   : "bg-blue-600",
    accentTextCls: isAestheticMode ? "text-[#8E8475]" : "text-blue-600",
    pill:        isAestheticMode ? "bg-[#8E8475] border-[#6d6659] text-white shadow-md" : "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25",
    pillIdle:    isAestheticMode
      ? "border-[#D6D2C4] text-[#8E8475] bg-[#F0EFE8] hover:bg-[#E8E7DF]"
      : dark
        ? "border-white/[0.07] text-white/45 hover:border-white/18 hover:text-white bg-white/[0.03] hover:bg-white/[0.07]"
        : "border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 bg-white shadow-sm",
    inputBg:     isAestheticMode
      ? "border-[#D6D2C4] bg-white/80 focus-within:border-[#8E8475]"
      : dark
        ? "border-white/[0.07] bg-white/[0.04] focus-within:border-blue-500/35 focus-within:bg-white/[0.06]"
        : "border-gray-200 bg-white focus-within:border-blue-500 shadow-sm focus-within:shadow-blue-500/12",
    priceCls:    isAestheticMode ? "text-[#8E8475]" : "text-emerald-500",
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`relative min-h-screen ${T.bg} ${T.text}`}
      style={{ transition: "background 0.6s cubic-bezier(0.25,0.46,0.45,0.94), color 0.3s ease" }}
    >

      {/* ── GLOBAL STYLES ──────────────────────────────────────────────────── */}
      <style jsx global>{`
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        html {
          scroll-behavior: smooth;
          -webkit-text-size-adjust: 100%;
          overscroll-behavior-y: none;
        }
        body {
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          -webkit-overflow-scrolling: touch;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media (min-width: 768px) {
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(120,120,128,0.28); border-radius: 99px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(120,120,128,0.48); }
        }

        input[type="range"] { -webkit-appearance: none; appearance: none; cursor: pointer; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 24px; height: 24px; border-radius: 50%;
          background: #2563eb; cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(37,99,235,0.50);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:active { transform: scale(1.18); }
        input[type="range"]::-moz-range-thumb {
          width: 24px; height: 24px; border-radius: 50%;
          background: #2563eb; border: 3px solid white;
          box-shadow: 0 2px 10px rgba(37,99,235,0.50);
        }

        @keyframes skshimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%);
          background-size: 400px 100%;
          animation: skshimmer 1.4s infinite linear;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .hero-fullscreen { height: 100dvh; min-height: 600px; }
        @media (max-width: 767px) {
          .hero-fullscreen { height: 52vw; min-height: 190px; max-height: 290px; }
        }

        .no-select { user-select: none; -webkit-user-select: none; }

        /* iOS safe area */
        .pb-safe  { padding-bottom: max(env(safe-area-inset-bottom), 16px); }
        .mb-safe  { margin-bottom:  max(env(safe-area-inset-bottom), 16px); }
        .fab-safe { bottom: max(env(safe-area-inset-bottom, 0px) + 12px, 20px); }

        @media (max-width: 767px) {
          button, [role="button"] { min-height: 44px; }
          .tap-sm { min-height: 36px; }
          .product-card { transition: transform 0.12s ease; }
          .product-card:active { transform: scale(0.968); }
        }

        /* Horizontal scroll momentum */
        .momentum-scroll { -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory; }
        .momentum-scroll > * { scroll-snap-align: start; }

        /* Live notification slide-in */
        @keyframes notif-in { from { transform: translateY(-110%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .notif-enter { animation: notif-in 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* ── AMBIENT GRADIENT (scroll-reactive, GPU-cheap) ─────────────── */}
      {dark && !isAestheticMode && (
        <motion.div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          aria-hidden
          style={{ opacity: heroOpacity }}
        >
          <div className="absolute top-0 left-0 w-full h-[60vh]"
            style={{ background: "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(37,99,235,0.04), transparent)" }} />
        </motion.div>
      )}

      {/* ── LIVE NOTIFICATION ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {liveNotification && (
          <motion.div
            initial={{ opacity: 0, y: isMobile ? -20 : 6, x: isMobile ? 0 : -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: isMobile ? -20 : 6, x: isMobile ? 0 : -20 }}
            transition={appleSpring}
            className={`fixed z-[100] pointer-events-auto ${
              isMobile
                ? "top-16 left-3 right-3 mx-auto max-w-sm"
                : "bottom-24 sm:bottom-28 left-4 sm:left-5 max-w-[260px] sm:max-w-xs"
            } backdrop-blur-2xl rounded-2xl border overflow-hidden ${
              dark
                ? "bg-[#1c1c1e]/96 border-white/[0.09] shadow-2xl shadow-black/50"
                : "bg-white/97 border-gray-200/80 shadow-xl shadow-black/[0.07]"
            }`}
          >
            <div className="px-4 py-2.5 flex items-center gap-3">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <p className={`text-[11px] font-medium leading-snug flex-1 ${dark ? "text-white/75" : "text-gray-700"}`}>
                {liveNotification}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COMPARE DRAWER ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCompareOpen && compareList.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCompareOpen(false)}
              className="fixed inset-0 z-[190] bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={appleSpring}
              drag="y" dragConstraints={{ top: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) { triggerHaptic("dismiss"); setIsCompareOpen(false); } }}
              className={`fixed bottom-0 left-0 right-0 z-[200] border-t backdrop-blur-2xl rounded-t-[28px] overflow-hidden ${
                isAestheticMode
                  ? "bg-white/98 border-[#D6D2C4]"
                  : dark
                    ? "bg-[#1c1c1e]/98 border-white/[0.08]"
                    : "bg-white/98 border-gray-200"
              } shadow-2xl`}
            >
              <div className="flex justify-center pt-3 pb-0.5">
                <div className={`w-8 h-1 rounded-full ${dark ? "bg-white/20" : "bg-gray-300"}`} />
              </div>
              <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-8">
                <div className="flex justify-between items-center mb-5">
                  <h3 className={`text-base font-semibold ${T.text}`}>Compare ({compareList.length}/3)</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={snappySpring}
                    onClick={() => { setIsCompareOpen(false); triggerHaptic("dismiss"); }}
                    className={`p-2 rounded-full ${dark ? "hover:bg-white/[0.08]" : "hover:bg-gray-100"} transition-colors`}
                  >
                    <CloseIcon className="w-[18px] h-[18px]" />
                  </motion.button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {compareList.map((p, i) => {
                    const bd = getBestDeal(p);
                    const sc = getDealScore(p);
                    const rating = p.trustScore || p.amazonRating || 0;
                    return (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ ...appleSpring, delay: i * 0.07 }}
                      className="relative"
                    >
                      {/* Remove button — always visible on mobile, hover on desktop */}
                      <motion.button
                        whileTap={{ scale: 0.85 }} transition={snappySpring}
                        onPointerDown={() => triggerHaptic("light")}
                        onClick={() => { setCompareList((c) => c.filter((x) => x.name !== p.name)); triggerHaptic("light"); }}
                        className={`absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1.5 z-10 shadow-md transition-opacity ${
                          isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <CloseIcon className="w-3 h-3" />
                      </motion.button>
                      <div className={`rounded-2xl border p-3.5 space-y-2.5 ${
                        isAestheticMode ? "bg-[#F5F5F0] border-[#D6D2C4]"
                          : dark ? "bg-[#222] border-white/[0.07]"
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className="h-20 bg-white rounded-xl p-2 flex items-center justify-center">
                          <img src={p.image} className="h-full object-contain" alt={p.name} />
                        </div>
                        <p className={`text-[11px] font-semibold line-clamp-2 leading-snug ${T.text}`}>{p.name}</p>
                        <div className="flex items-center justify-between">
                          <p className={`text-base font-black ${T.priceCls}`}>₹{bd.price.toLocaleString("en-IN")}</p>
                          {sc.percent > 0 && (
                            <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">-{sc.percent}%</span>
                          )}
                        </div>
                        {rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span className={`text-[10px] font-semibold ${T.subtext}`}>{Number(rating).toFixed(1)}</span>
                          </div>
                        )}
                        <div className={`text-[9px] font-semibold uppercase tracking-wide ${T.subtext}`}>{bd.platform}</div>
                        <motion.button
                          whileTap={{ scale: 0.95 }} transition={snappySpring}
                          onPointerDown={() => triggerHaptic("purchase")}
                          onClick={() => window.open(bd.link, "_blank")}
                          className={`w-full py-2 rounded-xl text-[10px] font-bold text-white ${T.accentCls} flex items-center justify-center gap-1`}
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Buy Now
                        </motion.button>
                      </div>
                    </motion.div>
                    );
                  })}
                  {compareList.length < 3 && (
                    <div className={`rounded-2xl border-2 border-dashed flex items-center justify-center p-8 ${
                      dark ? "border-white/[0.08] text-white/20" : "border-gray-200 text-gray-300"
                    }`}>
                      <div className="text-center">
                        <Plus className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                        <p className="text-xs font-medium">Add product</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── WATCHLIST DRAWER ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isWatchlistOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsWatchlistOpen(false)}
              className="fixed inset-0 z-[190] bg-black/25 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={appleSpring}
              drag="y" dragConstraints={{ top: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 80) { triggerHaptic("dismiss"); setIsWatchlistOpen(false); } }}
              className={`fixed bottom-0 left-0 right-0 z-[200] border-t backdrop-blur-2xl rounded-t-[28px] overflow-hidden ${
                isAestheticMode ? "bg-white/98 border-[#D6D2C4]"
                  : dark ? "bg-[#1c1c1e]/98 border-white/[0.08]"
                  : "bg-white/98 border-gray-200"
              } shadow-2xl`}
            >
              <div className="flex justify-center pt-3 pb-0.5">
                <div className={`w-8 h-1 rounded-full ${dark ? "bg-white/20" : "bg-gray-300"}`} />
              </div>
              <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-4 pb-[max(env(safe-area-inset-bottom,0px)+16px,24px)]">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className={`text-base font-bold ${T.text}`}>Your Watchlist</h3>
                    <p className={`text-[11px] ${T.subtext}`}>{watchedDeals.length} product{watchedDeals.length !== 1 ? "s" : ""} tracked</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }} transition={snappySpring}
                    onClick={() => setIsWatchlistOpen(false)}
                    className={`p-2 rounded-full ${dark ? "hover:bg-white/[0.08]" : "hover:bg-gray-100"}`}
                  >
                    <CloseIcon className="w-[18px] h-[18px]" />
                  </motion.button>
                </div>
                {watchedDeals.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${dark ? "bg-white/[0.05]" : "bg-gray-100"}`}>
                      <Bell className="w-6 h-6 opacity-25" />
                    </div>
                    <p className={`text-sm font-semibold ${T.text}`}>Nothing here yet</p>
                    <p className={`text-xs text-center max-w-xs ${T.subtext}`}>Tap the bell icon on any product to track its price and get notified when it drops.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto no-scrollbar">
                    {watchedDeals.map((name, i) => {
                      const product = products.find((p) => p.name === name);
                      if (!product) return (
                        <div key={name} className={`rounded-2xl border p-3 ${isAestheticMode ? "border-[#D6D2C4]" : dark ? "border-white/[0.06]" : "border-gray-200"}`}>
                          <p className={`text-[11px] font-semibold line-clamp-2 ${T.text}`}>{name}</p>
                          <p className={`text-[10px] mt-1 ${T.subtext}`}>Product not loaded</p>
                        </div>
                      );
                      const bd = getBestDeal(product);
                      return (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ ...appleSpring, delay: i * 0.04 }}
                          className={`rounded-2xl border p-3 flex flex-col gap-2 ${
                            isAestheticMode ? "bg-[#F5F5F0] border-[#D6D2C4]"
                              : dark ? "bg-[#1a1a1a] border-white/[0.06]"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="h-16 bg-gray-50 dark:bg-white/[0.03] rounded-xl flex items-center justify-center">
                            <img src={product.image} className="h-full object-contain p-1.5" alt={name} />
                          </div>
                          <p className={`text-[11px] font-semibold line-clamp-2 leading-snug ${T.text}`}>{name}</p>
                          <p className={`text-sm font-black ${T.priceCls}`}>₹{bd.price.toLocaleString("en-IN")}</p>
                          <div className="flex gap-1.5">
                            <motion.button
                              whileTap={{ scale: 0.94 }} transition={snappySpring}
                              onPointerDown={() => triggerHaptic("light")}
                              onClick={() => { openProduct(product); setIsWatchlistOpen(false); }}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${T.accentCls} text-white`}
                            >View</motion.button>
                            <motion.button
                              whileTap={{ scale: 0.94 }} transition={snappySpring}
                              onPointerDown={() => triggerHaptic("light")}
                              onClick={(e) => toggleWatch(e, product)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border ${
                                dark ? "border-white/[0.08] text-white/50 hover:bg-white/[0.07]"
                                  : "border-gray-200 text-gray-500 hover:bg-gray-100"
                              }`}
                            >Remove</motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── IMAGE LIGHTBOX ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-[350] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-zoom-out p-6"
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={appleSpring}
              src={lightboxImg}
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
              alt="Product zoom"
              draggable={false}
            />
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={snappySpring}
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 backdrop-blur-xl text-white border border-white/20"
            >
              <CloseIcon className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PRODUCT DETAIL MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: appleEase }}
              onClick={() => { setSelectedProduct(null); triggerHaptic("dismiss"); }}
              className="absolute inset-0 bg-black/45 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={appleSpring}
              drag="y" dragConstraints={{ top: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 60) { triggerHaptic("dismiss"); setSelectedProduct(null); } }}
              className={`relative w-full sm:max-w-xl rounded-t-[32px] sm:rounded-3xl overflow-y-auto max-h-[93vh] sm:max-h-[90vh] border ${
                isAestheticMode
                  ? "bg-[#F5F5F0] border-[#D6D2C4]"
                  : dark ? "bg-[#1c1c1e] border-white/[0.08]"
                  : "bg-white border-gray-100"
              } shadow-2xl`}
            >
              <div className="flex justify-center pt-3 sm:hidden">
                <div className={`w-10 h-1 rounded-full ${dark ? "bg-white/25" : "bg-gray-300"}`} />
              </div>
              <div className="p-5 sm:p-8 pb-[max(env(safe-area-inset-bottom,0px)+20px,28px)] sm:pb-8">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} transition={snappySpring}
                  onClick={() => { setSelectedProduct(null); triggerHaptic("dismiss"); }}
                  className={`hidden sm:flex absolute top-5 right-5 p-2 rounded-full items-center justify-center ${
                    dark ? "bg-white/[0.08] hover:bg-white/[0.14] text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                  } transition-colors`}
                >
                  <CloseIcon className="w-[18px] h-[18px]" />
                </motion.button>
                <div className="flex flex-col items-center gap-5">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...appleSpring, delay: 0.06 }}
                    onClick={() => setLightboxImg(selectedProduct.image)}
                    className={`w-40 h-40 sm:w-56 sm:h-56 rounded-3xl p-4 flex items-center justify-center cursor-zoom-in relative group ${
                      dark ? "bg-white/[0.04]" : "bg-gray-50"
                    } border ${dark ? "border-white/[0.06]" : "border-gray-100"}`}
                  >
                    <img src={selectedProduct.image} className="w-full h-full object-contain" alt={selectedProduct.name} />
                    <div className={`absolute inset-0 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      dark ? "bg-black/30" : "bg-black/10"
                    }`}>
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ...appleSpring, delay: 0.1 }}
                    className="text-center"
                  >
                    <h2 className={`text-lg sm:text-xl font-bold leading-snug ${T.text}`}>{selectedProduct.name}</h2>
                    <p className={`text-[11px] font-semibold uppercase tracking-widest mt-1.5 ${T.subtext}`}>
                      {selectedProduct.category}
                    </p>
                    {/* Deal score explanation */}
                    {(() => {
                      const sc = getDealScore(selectedProduct);
                      const score = parseFloat(sc.score);
                      const label = score >= 8.5 ? "🔥 Hot Deal" : score >= 7 ? "👍 Good Deal" : score >= 5.5 ? "Fair Price" : "Weak Deal";
                      const tip   = score >= 8.5 ? "Exceptional savings vs. highest listed price" : score >= 7 ? "Solid discount worth grabbing" : score >= 5.5 ? "Moderate savings available" : "Minimal price difference between platforms";
                      return sc.percent > 0 ? (
                        <div className={`mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                          isAestheticMode ? "bg-[#8E8475]/10 text-[#8E8475]"
                            : dark ? "bg-blue-500/10 text-blue-400"
                            : "bg-blue-50 text-blue-700"
                        }`} title={tip}>
                          <Star className="w-3 h-3 fill-current" />
                          {sc.score} · {label} · {sc.percent}% off
                        </div>
                      ) : null;
                    })()}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ...appleSpring, delay: 0.14 }}
                    className="w-full space-y-2.5"
                  >
                    {/* ── SMART DEAL BUTTONS (modal) ──────────────────── */}
                    {(() => {
                      const p        = selectedProduct;
                      const amzPrice = p.amazonPrice   || 0;
                      const fkPrice  = p.flipkartPrice  || 0;
                      const amzRating= p.trustScore          || 0;
                      const fkRating = p.flipkartTrustScore  || 0;
                      const amzReviews = p.reviewCount        || 0;
                      const fkReviews  = p.flipkartReviewCount || 0;
                      const amzLink  = p.amazonLink;
                      const fkLink   = p.flipkartLink;
                      const best     = getBestDeal(p);

                      const bothAvailable = amzPrice > 0 && fkPrice > 0 && amzLink && fkLink;

                      if (bothAvailable) {
                        const cheaperIs     = amzPrice <= fkPrice ? "Amazon"   : "Flipkart";
                        const expensiveIs   = amzPrice <= fkPrice ? "Flipkart" : "Amazon";
                        const cheaperPrice  = Math.min(amzPrice, fkPrice);
                        const expPrice      = Math.max(amzPrice, fkPrice);
                        const cheaperRating = cheaperIs === "Amazon" ? amzRating : fkRating;
                        const expRating     = cheaperIs === "Amazon" ? fkRating  : amzRating;
                        const cheaperReviews= cheaperIs === "Amazon" ? amzReviews : fkReviews;
                        const expReviews    = cheaperIs === "Amazon" ? fkReviews  : amzReviews;
                        const cheaperLink   = cheaperIs === "Amazon" ? amzLink   : fkLink;
                        const expLink       = cheaperIs === "Amazon" ? fkLink    : amzLink;
                        const savings       = expPrice - cheaperPrice;

                        // Cheaper is also equal/better rated → single best deal button
                        if (cheaperRating >= expRating) {
                          return (
                            <motion.button
                              whileHover={{ scale: 1.015, filter: "brightness(1.06)" }}
                              whileTap={{ scale: 0.985 }}
                              transition={snappySpring}
                              onPointerDown={() => triggerHaptic("purchase")}
                              onClick={() => window.open(cheaperLink, "_blank")}
                              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-semibold text-white ${T.accentCls}`}
                              style={{ boxShadow: `0 4px 20px ${T.accent}40` }}
                            >
                              <CartIcon className="w-[18px] h-[18px]" />
                              Best Deal · {cheaperIs} · ₹{cheaperPrice.toLocaleString("en-IN")}
                              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                            </motion.button>
                          );
                        }

                        // Two different outcomes → rich dual cards
                        return (
                          <div className="flex flex-col gap-2.5">
                            {/* Cheaper option */}
                            <motion.button
                              whileHover={{ scale: 1.015, filter: "brightness(1.05)" }}
                              whileTap={{ scale: 0.985 }}
                              transition={snappySpring}
                              onPointerDown={() => triggerHaptic("purchase")}
                              onClick={() => window.open(cheaperLink, "_blank")}
                              className="w-full rounded-2xl overflow-hidden text-left"
                              style={{ boxShadow: "0 4px 20px rgba(5,150,105,0.22)" }}
                            >
                              <div className="bg-emerald-600 px-4 py-2 flex items-center gap-2">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">💸 Cheaper Pick</span>
                                {savings > 0 && (
                                  <span className="ml-auto text-[10px] font-bold text-emerald-100 bg-emerald-700/60 px-2 py-0.5 rounded-full">
                                    Save ₹{savings.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                              <div className={`px-4 py-3 flex items-center justify-between ${dark ? "bg-emerald-950/40 border border-emerald-900/40" : "bg-emerald-50 border border-emerald-100"}`}>
                                <div>
                                  <p className={`text-xs font-semibold ${dark ? "text-white/50" : "text-emerald-800/60"} mb-0.5`}>{cheaperIs}</p>
                                  <p className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>₹{cheaperPrice.toLocaleString("en-IN")}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className={`text-[11px] font-semibold ${dark ? "text-white/60" : "text-gray-600"}`}>{cheaperRating.toFixed(1)}</span>
                                    {cheaperReviews > 0 && <span className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>({cheaperReviews.toLocaleString()} reviews)</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                                  Buy Now <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </motion.button>

                            {/* Higher-rated option */}
                            <motion.button
                              whileHover={{ scale: 1.015, filter: "brightness(1.05)" }}
                              whileTap={{ scale: 0.985 }}
                              transition={snappySpring}
                              onPointerDown={() => triggerHaptic("purchase")}
                              onClick={() => window.open(expLink, "_blank")}
                              className="w-full rounded-2xl overflow-hidden text-left"
                              style={{ boxShadow: "0 4px 20px rgba(124,58,237,0.22)" }}
                            >
                              <div className="bg-violet-600 px-4 py-2 flex items-center gap-2">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">⭐ Top Rated</span>
                                <span className="ml-auto text-[10px] font-bold text-violet-100 bg-violet-700/60 px-2 py-0.5 rounded-full">
                                  Higher Trust Score
                                </span>
                              </div>
                              <div className={`px-4 py-3 flex items-center justify-between ${dark ? "bg-violet-950/40 border border-violet-900/40" : "bg-violet-50 border border-violet-100"}`}>
                                <div>
                                  <p className={`text-xs font-semibold ${dark ? "text-white/50" : "text-violet-800/60"} mb-0.5`}>{expensiveIs}</p>
                                  <p className={`text-xl font-black ${dark ? "text-white" : "text-gray-900"}`}>₹{expPrice.toLocaleString("en-IN")}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className={`text-[11px] font-semibold ${dark ? "text-white/60" : "text-gray-600"}`}>{expRating.toFixed(1)}</span>
                                    {expReviews > 0 && <span className={`text-[10px] ${dark ? "text-white/30" : "text-gray-400"}`}>({expReviews.toLocaleString()} reviews)</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-violet-600 font-semibold text-xs">
                                  Buy Now <ExternalLink className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </motion.button>
                          </div>
                        );
                      }

                      // Only one platform available
                      return (
                        <motion.button
                          whileHover={{ scale: 1.015, filter: "brightness(1.06)" }}
                          whileTap={{ scale: 0.985 }}
                          transition={snappySpring}
                          onPointerDown={() => triggerHaptic("purchase")}
                          onClick={() => window.open(best.link, "_blank")}
                          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-semibold text-white ${T.accentCls}`}
                          style={{ boxShadow: `0 4px 20px ${T.accent}40` }}
                        >
                          <CartIcon className="w-[18px] h-[18px]" />
                          Buy for ₹{best.price.toLocaleString("en-IN")}
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </motion.button>
                      );
                    })()}
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        {
                          active: copiedDeal === selectedProduct.name,
                          activeCls: "bg-emerald-500/12 text-emerald-500 border-emerald-500/20",
                          icon: copiedDeal === selectedProduct.name
                            ? <><Check className="w-3.5 h-3.5" /> Copied!</>
                            : <><Copy className="w-3.5 h-3.5" /> Share</>,
                          action: () => handleShare(
                            selectedProduct.name,
                            selectedProduct.slug
                              ? `${window.location.origin}/product/${selectedProduct.slug}`
                              : getBestDeal(selectedProduct).link
                          ),
                        },
                        {
                          active: watchedDeals.includes(selectedProduct.name),
                          activeCls: "bg-amber-500/12 text-amber-500 border-amber-500/20",
                          icon: <>
                            <Bell className={`w-3.5 h-3.5 ${watchedDeals.includes(selectedProduct.name) ? "fill-current" : ""}`} />
                            {watchedDeals.includes(selectedProduct.name) ? "Watching" : "Watch"}
                          </>,
                          action: (e) => toggleWatch(e ?? { stopPropagation: () => {} }, selectedProduct),
                        },
                      ].map((b, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={snappySpring}
                          onPointerDown={() => triggerHaptic("light")}
                          onClick={b.action}
                          className={`py-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 border transition-all ${
                            b.active ? b.activeCls
                              : dark ? "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border-white/[0.08]"
                              : "bg-gray-100 hover:bg-gray-150 text-gray-700 border-gray-200"
                          }`}
                        >
                          {b.icon}
                        </motion.button>
                      ))}
                    </div>

                    {selectedProduct.slug && (
                      <Link
                        href={`/product/${selectedProduct.slug}`}
                        className={`block text-center text-xs font-medium py-2 ${T.accentTextCls} hover:underline`}
                      >
                        View full product page →
                      </Link>
                    )}

                    {/* ── PRICE HISTORY SPARKLINE ──────────────────────── */}
                    {(() => {
                      const p = selectedProduct;
                      // Build a simulated 30-day price history from available platform prices
                      const offers = [
                        { platform: "Amazon",   price: p.amazonPrice   || 0 },
                        { platform: "Flipkart", price: p.flipkartPrice  || 0 },
                        { platform: "Myntra",   price: p.myntraPrice   || 0 },
                        { platform: "Nykaa",    price: p.nykaaPrice    || 0 },
                      ].filter((o) => o.price > 0);
                      if (offers.length < 2) return null;
                      const best = getBestDeal(p);
                      const maxP = Math.max(...offers.map((o) => o.price));
                      const minP = Math.min(...offers.map((o) => o.price));
                      const range = maxP - minP || 1;
                      const W = 280, H = 56;
                      const pts = offers.map((o, i) => ({
                        x: (i / (offers.length - 1)) * W,
                        y: H - ((o.price - minP) / range) * H * 0.8 - H * 0.1,
                        ...o,
                      }));
                      const pathD = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ");
                      return (
                        <div className={`rounded-2xl border p-4 ${
                          isAestheticMode ? "border-[#D6D2C4] bg-[#F0EFE8]/60"
                            : dark ? "border-white/[0.06] bg-white/[0.025]"
                            : "border-gray-100 bg-gray-50"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <p className={`text-[11px] font-bold uppercase tracking-wide ${T.subtext}`}>Platform Prices</p>
                            <p className={`text-[10px] font-semibold ${T.subtext}`}>
                              Save ₹{(maxP - minP).toLocaleString("en-IN")} by choosing wisely
                            </p>
                          </div>
                          <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 56 }}>
                            <path d={pathD} fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            {pts.map((pt) => (
                              <g key={pt.platform}>
                                <circle cx={pt.x} cy={pt.y} r="4" fill={T.accent} />
                                <circle cx={pt.x} cy={pt.y} r="7" fill={T.accent} fillOpacity="0.15" />
                              </g>
                            ))}
                          </svg>
                          <div className="flex items-center justify-between mt-2">
                            {pts.map((pt) => (
                              <div key={pt.platform} className="flex flex-col items-center gap-0.5">
                                <span className={`text-[9px] font-bold uppercase ${pt.price === best.price ? T.accentTextCls : T.subtext}`}>{pt.platform}</span>
                                <span className={`text-[10px] font-black ${pt.price === best.price ? T.accentTextCls : T.text}`}>₹{pt.price.toLocaleString("en-IN")}</span>
                                {pt.price === best.price && <span className="text-[8px] font-bold text-emerald-500">Best</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-[60] border-b transition-all duration-500 ${T.header} ${
          headerScrolled ? "backdrop-blur-2xl shadow-sm" : "backdrop-blur-xl"
        }`}
      >
        <div
          className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6"
          style={{ height: isMobile ? "50px" : "60px" }}
        >
          <motion.div
            whileTap={{ scale: 0.95 }} transition={snappySpring}
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); triggerHaptic("light"); }}
          >
            <div className={`p-1.5 rounded-xl ${isAestheticMode ? "bg-[#8E8475]/10" : dark ? "bg-blue-500/10" : "bg-blue-600/8"}`}>
              <CartIcon className={`w-[18px] h-[18px] ${isAestheticMode ? "text-[#8E8475]" : "text-blue-600"}`} />
            </div>
            <h1 className="text-base sm:text-xl font-black tracking-tight">
              DEAL<span className={isAestheticMode ? "text-[#8E8475]" : "text-blue-600"}>X</span>
            </h1>
          </motion.div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Watchlist button */}
            <motion.button
              whileTap={{ scale: 0.9 }} transition={snappySpring}
              onPointerDown={() => triggerHaptic("light")}
              onClick={() => { setIsWatchlistOpen(true); triggerHaptic("medium"); }}
              aria-label="Your watchlist"
              className={`relative p-2.5 rounded-xl border transition-all ${
                isAestheticMode ? "border-[#D6D2C4] hover:bg-[#EDECE5]"
                  : dark ? "border-white/[0.08] hover:bg-white/[0.07]"
                  : "border-gray-200 hover:bg-gray-100 bg-white"
              }`}
            >
              <Bell className={`w-4 h-4 ${isAestheticMode ? "text-[#8E8475]" : dark ? "text-white/60" : "text-gray-600"}`} />
              {watchedDeals.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white ${T.accentCls}`}>
                  {watchedDeals.length > 9 ? "9+" : watchedDeals.length}
                </span>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }} transition={snappySpring}
              onPointerDown={() => triggerHaptic("light")}
              onClick={() => handleAuth()}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                user
                  ? isAestheticMode ? "border-[#8E8475] bg-[#8E8475] text-white"
                    : "border-blue-600 bg-blue-600 text-white"
                  : isAestheticMode ? "border-[#D6D2C4] text-[#8E8475] hover:bg-[#EDECE5]"
                  : dark ? "border-white/[0.08] text-white/60 hover:bg-white/[0.07] hover:text-white"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
              }`}
            >
              {user ? (
                <>
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">In</span>
                </>
              
              )}
            </motion.button>
            

            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }} transition={snappySpring}
              onPointerDown={() => triggerHaptic("light")}
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className={`p-2.5 rounded-xl border transition-all ${
                isAestheticMode ? "border-[#D6D2C4] hover:bg-[#EDECE5]"
                  : dark ? "border-white/[0.08] hover:bg-white/[0.07]"
                  : "border-gray-200 hover:bg-gray-100 bg-white"
              }`}
            >
              <AnimatePresence mode="wait">
                {dark
                  ? <motion.div key="sun" initial={{ rotate: -25, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 25, opacity: 0 }} transition={{ duration: 0.18 }}>
                      <Sun className="w-4 h-4 text-amber-400" />
                    </motion.div>
                  : <motion.div key="moon" initial={{ rotate: 25, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -25, opacity: 0 }} transition={{ duration: 0.18 }}>
                      <Moon className="w-4 h-4 text-slate-500" />
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── HERO ──────────────────────────────────────────────────────────
            PC  = 100dvh (full screen)
            Mobile = capped at ~380px via CSS class 'hero-fullscreen'
        ─────────────────────────────────────────────────────────────────── */}
        <div className="pt-5 sm:pt-0 pb-0 sm:pb-0 -mx-4 sm:-mx-6">
          <div
            ref={heroSectionRef}
            className={`hero-fullscreen relative overflow-hidden ${
              isAestheticMode ? "border-b border-[#D6D2C4]"
                : dark ? "border-b border-white/[0.06]"
                : "border-b border-gray-200/70"
            }`}
          >
            {/* Parallax image layer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHeroIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: heroEase }}
                className="absolute inset-0"
              >
                <motion.img
                  src={heroSlides[currentHeroIndex].img}
                  className="w-full h-full object-cover"
                  alt={heroSlides[currentHeroIndex].title}
                  loading="eager"
                  /* Subtle parallax on desktop only */
                  style={{ scale: isMobile ? 1 : heroScale }}
                />
                {/* Gradient overlay — stronger at bottom for text legibility */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.08) 75%, transparent 100%)",
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Text content (bottom-left) */}
            <div className="absolute inset-0 flex flex-col justify-end pb-5 sm:pb-14 px-4 sm:px-10 pointer-events-none">
              <motion.span
                key={`sub-${currentHeroIndex}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...appleSpring, delay: 0.1 }}
                className="text-blue-300 text-[9px] sm:text-xs font-semibold uppercase tracking-widest mb-1"
              >
                {heroSlides[currentHeroIndex].sub}
              </motion.span>
              <motion.h2
                key={`title-${currentHeroIndex}`}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...appleSpring, delay: 0.18 }}
                className="text-white text-xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-4"
              >
                {heroSlides[currentHeroIndex].title}
              </motion.h2>
              {/* ── Hero CTA — linked to real category ────────────────── */}
              <motion.button
                key={`cta-${currentHeroIndex}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...appleSpring, delay: 0.28 }}
                onPointerDown={() => triggerHaptic("light")}
                onClick={() => {
                  setActiveTab(heroSlides[currentHeroIndex].tab);
                  scrollToSearch();
                }}
                className="pointer-events-auto self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white border border-white/30 backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors"
              >
                {heroSlides[currentHeroIndex].cta}
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Dot nav (bottom-right) */}
            <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex gap-1.5 z-20">
              {heroSlides.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setCurrentHeroIndex(i);
                    clearInterval(heroIntervalRef.current);
                    triggerHaptic("tab");
                  }}
                  animate={{ width: i === currentHeroIndex ? 20 : 6, opacity: i === currentHeroIndex ? 1 : 0.4 }}
                  transition={snappySpring}
                  aria-label={`Slide ${i + 1}`}
                  className="h-1.5 rounded-full bg-white tap-sm"
                />
              ))}
            </div>

            {/* ── SCROLL ARROW — desktop only, centered at very bottom ───── */}
            {!isMobile && (
              <motion.div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                style={{ opacity: heroOpacity }}
              >
                <ScrollArrow accentColor={T.accent} onClick={scrollToSearch} />
              </motion.div>
            )}
          </div>

          {/* Mobile 'scroll to search' hint — appears below hero, not overlaid */}
          {isMobile && (
            <motion.button
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...gentleSpring }}
              onClick={scrollToSearch}
              onPointerDown={() => triggerHaptic("light")}
              className={`w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold tracking-widest uppercase ${T.subtext}`}
            >
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDown className="w-3 h-3" />
              </motion.div>
              Search Deals
            </motion.button>
          )}
        </div>

        {/* Spacing after hero */}
        <div className="pt-4 sm:pt-10" />

        {/* ── CATEGORY TABS ─────────────────────────────────────────────── */}
        <div className="mb-5 sm:mb-7">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar momentum-scroll pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
            {tabs.map((tab, i) => (
              <motion.button
                key={tab.name}
                ref={tab.isDropdown ? moreButtonRef : undefined}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...gentleSpring, delay: i * 0.04 }}
                whileTap={{ scale: 0.94 }}
                onPointerDown={() => triggerHaptic("tab")}
                onClick={() => tab.isDropdown ? setIsMoreOpen((o) => !o) : setActiveTab(tab.name)}
                className={`flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs font-semibold rounded-full border-2 flex-shrink-0 transition-all duration-200 ${
                  activeTab === tab.name || (tab.isDropdown && moreCategories.some((c) => c.name === activeTab))
                    ? T.pill : T.pillIdle
                }`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.name}</span>
                {tab.isDropdown && (
                  <motion.div animate={{ rotate: isMoreOpen ? 180 : 0 }} transition={snappySpring}>
                    <ChevronDown className="w-3 h-3" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {isMoreOpen && (
              <motion.div
                ref={moreMenuRef}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={appleSpring}
                className={`mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl border ${T.surface}`}
              >
                {moreCategories.map((cat, i) => (
                  <motion.button
                    key={cat.name}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ ...appleSpring, delay: i * 0.04 }}
                    whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                    onPointerDown={() => triggerHaptic("tab")}
                    onClick={() => { setActiveTab(cat.name); setIsMoreOpen(false); }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === cat.name
                        ? isAestheticMode ? "bg-[#8E8475] text-white" : "bg-blue-600 text-white"
                        : dark ? "text-white/45 hover:bg-white/[0.07] hover:text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── PLATFORM FILTER CHIPS ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <span className={`text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${T.subtext}`}>On</span>
          {["All", "Amazon", "Flipkart", "Myntra", "Nykaa"].map((p) => (
            <motion.button
              key={p}
              whileTap={{ scale: 0.92 }} transition={snappySpring}
              onPointerDown={() => triggerHaptic("tab")}
              onClick={() => { setPlatformFilter(p); setCurrentPage(1); triggerHaptic("select"); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                platformFilter === p
                  ? isAestheticMode ? "bg-[#8E8475] border-[#8E8475] text-white"
                    : "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : dark ? "border-white/[0.07] text-white/45 hover:text-white hover:border-white/20 bg-white/[0.03]"
                  : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 bg-white"
              }`}
            >
              {p}
            </motion.button>
          ))}

          {/* Active sort indicator badge */}
          {sortOrder !== "relevance" && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }} transition={snappySpring}
              onPointerDown={() => triggerHaptic("light")}
              onClick={() => { setSortOrder("relevance"); triggerHaptic("light"); }}
              className={`ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                dark ? "border-violet-500/30 bg-violet-500/10 text-violet-400" : "border-violet-200 bg-violet-50 text-violet-700"
              }`}
            >
              {sortOrder === "priceLow" ? <ArrowUpDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {sortOrder === "priceLow" ? "Cheapest" : "Most Savings"}
              <CloseIcon className="w-3 h-3 opacity-60" />
            </motion.button>
          )}
        </div>

        {/* ── SEARCH BAR ────────────────────────────────────────────────── */}
        <motion.div
          ref={searchContainerRef}
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={appleSpring}
          className={`relative ${showSuggestions ? "z-40" : "z-10"} mb-9`}
        >
          <motion.div
            whileFocusWithin={{ scale: 1.006 }} transition={gentleSpring}
            className={`relative flex items-center rounded-2xl border-2 overflow-hidden transition-all duration-200 ${T.inputBg}`}
          >
            <SearchIcon className={`ml-4 w-4 h-4 flex-shrink-0 ${T.subtext}`} />
            <input
              ref={inputRef}
              placeholder="Search deals, brands…"
              value={query}
              onFocus={() => query.length > 1 && setShowSuggestions(true)}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full bg-transparent px-3 py-3.5 text-sm font-medium outline-none ${
                dark ? "placeholder:text-white/22 text-white" : "placeholder:text-gray-400 text-gray-900"
              }`}
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                  transition={snappySpring} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onPointerDown={() => triggerHaptic("light")}
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className={`mr-2 p-1.5 rounded-full transition-colors ${
                    dark ? "hover:bg-white/[0.08] text-white/35" : "hover:bg-gray-100 text-gray-400"
                  }`}
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} transition={snappySpring}
              onPointerDown={() => triggerHaptic("light")}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`mr-2 sm:mr-3 p-2.5 rounded-xl transition-all ${
                isFilterOpen
                  ? isAestheticMode ? "bg-[#8E8475] text-white" : "bg-blue-600 text-white"
                  : dark ? "hover:bg-white/[0.07] text-white/35 hover:text-white"
                  : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              }`}
            >
              <Filter className="w-4 h-4 sm:w-[17px] sm:h-[17px]" />
            </motion.button>
          </motion.div>

          {/* Filter panel */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ ...appleSpring, height: { type: "tween", duration: 0.3, ease: appleEase } }}
                className={`mt-3 rounded-2xl border p-5 sm:p-6 space-y-5 overflow-hidden ${T.surface}`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className={`text-xs font-semibold uppercase tracking-wider ${T.subtext}`}>Max Price</label>
                    <span className={`text-sm font-bold tabular-nums ${T.accentTextCls}`}>₹{maxPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range" min="500" max="200000" step="1000" value={maxPrice}
                    onChange={(e) => { setMaxPrice(parseInt(e.target.value)); triggerHaptic("light"); }}
                    className="w-full"
                    style={{
                      height: "4px", borderRadius: "99px",
                      background: `linear-gradient(to right, ${T.accent} 0%, ${T.accent} ${(maxPrice / 200000) * 100}%, ${dark ? "rgba(255,255,255,0.1)" : "#e5e7eb"} ${(maxPrice / 200000) * 100}%)`,
                    }}
                  />
                  <div className={`flex justify-between text-[10px] mt-2 font-medium ${T.subtext}`}>
                    <span>₹500</span><span>₹2,00,000</span>
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-semibold uppercase tracking-wider block mb-3 ${T.subtext}`}>Sort By</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "relevance", label: "Relevant",     icon: <SparkleIcon  className="w-3.5 h-3.5" /> },
                      { id: "priceLow",  label: "Cheapest",     icon: <ArrowUpDown  className="w-3.5 h-3.5" /> },
                      { id: "savings",   label: "Most Savings", icon: <TrendingUp   className="w-3.5 h-3.5" /> },
                    ].map((s) => (
                      <motion.button
                        key={s.id} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.96 }} transition={snappySpring}
                        onPointerDown={() => triggerHaptic("select")}
                        onClick={() => setSortOrder(s.id)}
                        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[11px] font-semibold border transition-all ${
                          sortOrder === s.id
                            ? isAestheticMode ? "bg-[#8E8475] border-[#8E8475] text-white"
                              : "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/25"
                            : dark ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] text-white/45 hover:text-white"
                            : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-500 hover:text-blue-600"
                        }`}
                      >
                        {s.icon}{s.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionContainerRef}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 6, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={appleSpring}
                className={`absolute left-0 right-0 top-full z-50 rounded-2xl border backdrop-blur-2xl overflow-hidden ${
                  isAestheticMode ? "bg-white/97 border-[#D6D2C4]"
                    : dark ? "bg-[#1c1c1e]/97 border-white/[0.08] shadow-2xl shadow-black/40"
                    : "bg-white/97 border-gray-200 shadow-xl"
                }`}
              >
                {suggestions.map((p, i) => (
                  <motion.button
                    key={p.id || i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ ...appleSpring, delay: i * 0.035 }}
                    whileHover={{ x: 3, backgroundColor: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                    onPointerDown={() => triggerHaptic("light")}
                    onClick={() => { setQuery(p.name); setShowSuggestions(false); }}
                    className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left border-b last:border-b-0 ${
                      dark ? "border-white/[0.05]" : "border-gray-100"
                    }`}
                  >
                    <SearchIcon className={`w-3.5 h-3.5 flex-shrink-0 ${T.subtext}`} />
                    <span className={`text-sm font-medium flex-1 line-clamp-1 ${T.text}`}>{p.name}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${T.accentTextCls} opacity-80`}>{p.category}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── DEAL OF THE HOUR ──────────────────────────────────────────── */}
        {!isLoading && finalResults.length > 0 && currentPage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...appleSpring, delay: 0.08 }}
            className={`mb-9 rounded-[22px] p-0.5 bg-gradient-to-r ${
              isAestheticMode
                ? "from-[#8E8475] via-[#B0A89A] to-[#8E8475]"
                : "from-blue-500 via-violet-500 to-blue-600"
            }`}
            style={{
              boxShadow: isAestheticMode
                ? "0 6px 32px rgba(142,132,117,0.22)"
                : "0 6px 32px rgba(37,99,235,0.22)",
            }}
          >
            <div className={`rounded-[21px] p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-9 ${
              isAestheticMode ? "bg-[#F5F5F0]" : dark ? "bg-[#111]" : "bg-white"
            }`}>
              <motion.div
                whileHover={{ scale: 1.04 }} transition={gentleSpring}
                onClick={() => { openProduct(finalResults[0]); }}
                className="relative cursor-pointer flex-shrink-0 group"
              >
                <div className={`absolute -inset-5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                  dark ? "bg-blue-500/20" : "bg-blue-300/20"
                }`} />
                <img
                  src={finalResults[0].image}
                  className="w-28 sm:w-44 h-28 sm:h-44 object-contain relative z-10 drop-shadow-2xl"
                  alt={finalResults[0].name}
                />
              </motion.div>
              <div className="flex-1 text-center sm:text-left">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold mb-3 ${
                  isAestheticMode ? "bg-[#8E8475]/12 text-[#8E8475]" : "bg-blue-600/10 text-blue-500"
                }`}>
                  <Zap className="w-3 h-3" /> Deal of the Hour
                  <span className={`ml-1.5 font-bold tabular-nums ${T.subtext}`}>{hourTimer}</span>
                </div>
                <h3 className={`text-lg sm:text-2xl font-black leading-tight mb-2 ${T.text}`}>
                  {finalResults[0].name}
                </h3>
                <p className={`text-2xl sm:text-3xl font-black mb-1 ${T.priceCls}`}>
                  ₹{getBestDeal(finalResults[0]).price.toLocaleString("en-IN")}
                </p>
                {getBestDeal(finalResults[0]).savings > 0 && (
                  <p className={`text-xs font-semibold mb-4 ${T.subtext}`}>
                    Save ₹{getBestDeal(finalResults[0]).savings.toLocaleString("en-IN")} vs highest listed price
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02, filter: "brightness(1.08)" }} whileTap={{ scale: 0.97 }}
                  transition={snappySpring}
                  onPointerDown={() => triggerHaptic("purchase")}
                  onClick={() => window.open(getBestDeal(finalResults[0]).link, "_blank")}
                  className={`px-7 py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center gap-2 justify-center sm:inline-flex ${T.accentCls}`}
                  style={{ boxShadow: `0 4px 20px ${T.accent}35` }}
                >
                  <CartIcon className="w-4 h-4" /> Grab This Deal
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TOP DEALS TODAY STRIP ─────────────────────────────────────── */}
        {!isLoading && !fetchError && finalResults.length > 1 && currentPage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ ...appleSpring, delay: 0.1 }}
            className="mb-7"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isAestheticMode ? "text-[#8E8475]" : "text-blue-500"}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${T.text}`}>Top Deals Today</span>
              </div>
              <span className={`text-[10px] font-medium ${T.subtext}`}>
                {finalResults.length} deal{finalResults.length !== 1 ? "s" : ""} {platformFilter !== "All" ? `on ${platformFilter}` : ""}
                {sortOrder !== "relevance" && ` · ${sortOrder === "priceLow" ? "Price ↑" : "Savings ↑"}`}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar momentum-scroll -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {[...finalResults]
                .sort((a, b) => parseFloat(b._score.percent) - parseFloat(a._score.percent))
                .slice(0, 8)
                .map((product, i) => {
                  const best = product._best;
                  const sc   = product._score;
                  return (
                    <motion.button
                      key={product.name}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...gentleSpring, delay: i * 0.04 }}
                      whileTap={{ scale: 0.95 }}
                      onPointerDown={() => triggerHaptic("light")}
                      onClick={() => openProduct(product)}
                      className={`flex-shrink-0 w-[130px] rounded-2xl border p-3 flex flex-col gap-2 text-left ${T.card} hover:border-blue-400/40 transition-colors`}
                    >
                      {/* Image with blur-up placeholder */}
                      <div className={`h-16 rounded-xl overflow-hidden flex items-center justify-center relative ${dark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain p-1.5"
                          loading="lazy"
                          style={{ filter: "none" }}
                          onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
                        />
                        {sc.percent > 0 && (
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                            -{sc.percent}%
                          </div>
                        )}
                      </div>
                      <p className={`text-[10px] font-semibold line-clamp-2 leading-snug ${T.text}`}>{product.name}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-black ${T.priceCls}`}>₹{best.price.toLocaleString("en-IN")}</p>
                        <span className={`text-[9px] font-semibold ${T.subtext}`}>{best.platform}</span>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* ── PRODUCT GRID ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <AnimatePresence mode="popLayout">
            {fetchError ? (
              /* ── FETCH ERROR STATE ─────────────────────────────────── */
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="col-span-full flex flex-col items-center py-20 gap-4"
              >
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${dark ? "bg-red-500/10" : "bg-red-50"}`}>
                  <RefreshCw className="w-7 h-7 text-red-500" />
                </div>
                <div className="text-center">
                  <p className={`text-sm font-bold mb-1 ${T.text}`}>Couldn't load deals</p>
                  <p className={`text-xs mb-5 ${T.subtext}`}>Check your connection and try again</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }} transition={snappySpring}
                    onPointerDown={() => triggerHaptic("medium")}
                    onClick={loadProducts}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white ${T.accentCls} flex items-center gap-2 mx-auto`}
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </motion.button>
                </div>
              </motion.div>
            ) : isLoading || isSearching ? (
              Array.from({ length: isMobile ? 8 : 12 }).map((_, i) => (
                <SkeletonCard key={`sk-${i}`} dark={dark} />
              ))
            ) : paginatedResults.length > 0 ? (
              paginatedResults.map((product, index) => {
                const best       = product._best  ?? getBestDeal(product);
                const deal       = product._score ?? getDealScore(product);
                const isWatched  = watchedDeals.includes(product.name);
                const isComparing = compareList.some((p) => p.name === product.name);

                return (
                  <motion.div
                    key={product.id || product.name}
                    layout
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, y: -4 }}
                    transition={{ ...appleSpring, delay: Math.min(index * 0.022, 0.28) }}
                    whileHover={{ y: -5, scale: 1.016 }}
                    whileTap={{ scale: 0.972 }}
                    onClick={() => openProduct(product)}
                    className={`product-card group relative rounded-2xl sm:rounded-[18px] border overflow-hidden flex flex-col cursor-pointer select-none ${T.card} ${
                      isAestheticMode
                        ? "hover:border-[#8E8475] hover:shadow-lg"
                        : dark
                          ? "hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/[0.06]"
                          : "hover:border-blue-300/70 hover:shadow-xl hover:shadow-blue-500/[0.09] shadow-sm"
                    }`}
                    style={{ transition: "box-shadow 0.3s ease, border-color 0.2s ease" }}
                  >
                    {/* Score badge */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                        transition={{ ...appleSpring, delay: 0.06 }}
                        className={`px-2 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 ${
                          isAestheticMode ? "bg-[#8E8475] text-white" : "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        }`}
                      >
                        <Star className="w-2.5 h-2.5 fill-white" />{deal.score}
                      </motion.div>
                    </div>

                    {/* Discount badge */}
                    {best.savings > 0 && (
                      <div className="absolute top-2.5 left-2.5 z-20 px-2 py-1 rounded-full text-[10px] font-black bg-red-500 text-white shadow-sm shadow-red-500/25">
                        -{deal.percent}%
                      </div>
                    )}

                    {/* Desktop hover actions */}
                    {!isMobile && (
                      <div className="absolute top-10 right-2.5 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                        {[
                          {
                            active: isComparing,
                            activeCls: isAestheticMode ? "bg-[#8E8475] text-white border-transparent" : "bg-blue-600 text-white border-transparent shadow-sm shadow-blue-600/30",
                            icon: <Layers className="w-3.5 h-3.5" />,
                            action: (e) => { toggleCompare(e, product); },
                          },
                          {
                            active: isWatched,
                            activeCls: "bg-amber-500 text-white border-transparent shadow-sm shadow-amber-500/30",
                            icon: <Bell className={`w-3.5 h-3.5 ${isWatched ? "fill-current" : ""}`} />,
                            action: (e) => toggleWatch(e, product),
                          },
                          {
                            active: copiedDeal === product.name,
                            activeCls: "bg-emerald-500 text-white border-transparent shadow-sm shadow-emerald-500/30",
                            icon: copiedDeal === product.name ? <Check className="w-3.5 h-3.5" /> : <ShareIcon className="w-3.5 h-3.5" />,
                            action: (e) => { e.stopPropagation(); handleShare(
                              product.name,
                              product.slug ? `${window.location.origin}/product/${product.slug}` : best.link
                            ); },
                          },
                        ].map((btn, bi) => (
                          <motion.button
                            key={bi}
                            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }} transition={snappySpring}
                            onPointerDown={() => triggerHaptic("light")}
                            onClick={btn.action}
                            className={`p-2 rounded-full border backdrop-blur-xl transition-all ${
                              btn.active ? btn.activeCls
                                : dark ? "bg-black/70 text-white/45 border-white/10 hover:text-white hover:border-white/20"
                                : "bg-white/95 text-gray-500 border-gray-200/80 hover:text-gray-800"
                            }`}
                          >
                            {btn.icon}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Mobile quick actions — always visible row */}
                    {isMobile && (
                      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                        <motion.button
                          whileTap={{ scale: 0.82 }} transition={snappySpring}
                          onPointerDown={(e) => { e.stopPropagation(); triggerHaptic("light"); }}
                          onClick={(e) => toggleWatch(e, product)}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-xl ${
                            isWatched
                              ? "bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/30"
                              : dark ? "bg-black/60 text-white/40 border-white/10" : "bg-white/90 text-gray-400 border-gray-200/60"
                          }`}
                        >
                          <Bell className={`w-3 h-3 ${isWatched ? "fill-current" : ""}`} />
                        </motion.button>
                      </div>
                    )}

                    {/* Product image with blur-up */}
                    <div className="p-2.5 sm:p-4 flex-1">
                      <div className={`relative h-[110px] sm:h-36 rounded-xl overflow-hidden flex items-center justify-center mb-2.5 ${
                        dark ? "bg-white/[0.025]" : "bg-gray-50"
                      }`}>
                        <div className={`absolute inset-0 skeleton-shimmer ${dark ? "opacity-40" : "opacity-60"}`} />
                        <motion.img
                          whileHover={{ scale: 1.07 }} transition={gentleSpring}
                          src={product.image}
                          className="w-full h-full object-contain p-2 relative z-10"
                          alt={product.name}
                          loading="lazy"
                          onLoad={(e) => { e.currentTarget.parentElement.querySelector('.skeleton-shimmer')?.remove(); }}
                          style={{ opacity: 1 }}
                        />
                      </div>
                      <h3 className={`text-[11px] font-semibold line-clamp-2 leading-snug mb-0.5 ${T.text}`}>{product.name}</h3>
                      <p className={`text-[9px] font-semibold uppercase tracking-wide ${T.accentTextCls} opacity-65`}>{product.category}</p>
                    </div>

                    {/* Price & CTA */}
                    <div className={`px-2.5 sm:px-4 pb-2.5 sm:pb-4 pt-2.5 border-t ${
                      isAestheticMode ? "border-[#D6D2C4]" : dark ? "border-white/[0.04]" : "border-gray-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={`text-[8px] uppercase tracking-wide font-semibold mb-0.5 ${T.subtext}`}>{best.platform}</p>
                          <p className={`text-sm sm:text-lg font-black leading-none ${T.priceCls}`}>
                            ₹{best.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                        {best.savings > 0 && (
                          <span className={`text-[9px] font-medium ${T.subtext} line-through tabular-nums`}>
                            ₹{(best.price + best.savings).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {/* ── SMART DEAL BUTTONS ──────────────────────────── */}
                      {(() => {
                        const amzPrice  = product.amazonPrice   || 0;
                        const fkPrice   = product.flipkartPrice  || 0;
                        const amzRating = product.trustScore         || 0;
                        const fkRating  = product.flipkartTrustScore || 0;
                        const amzLink   = product.amazonLink;
                        const fkLink    = product.flipkartLink;

                        // Both platforms available
                        if (amzPrice > 0 && fkPrice > 0 && amzLink && fkLink) {
                          const cheaperPlatform  = amzPrice <= fkPrice ? "Amazon"   : "Flipkart";
                          const expensivePlatform = amzPrice <= fkPrice ? "Flipkart" : "Amazon";
                          const cheaperPrice     = Math.min(amzPrice, fkPrice);
                          const expensivePrice   = Math.max(amzPrice, fkPrice);
                          const cheaperRating    = cheaperPlatform === "Amazon" ? amzRating : fkRating;
                          const expensiveRating  = cheaperPlatform === "Amazon" ? fkRating  : amzRating;
                          const cheaperLink      = cheaperPlatform === "Amazon" ? amzLink   : fkLink;
                          const expensiveLink    = cheaperPlatform === "Amazon" ? fkLink    : amzLink;

                          // Cheaper platform also has equal or higher rating → single "View Deal"
                          if (cheaperRating >= expensiveRating) {
                            return (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                transition={snappySpring}
                                onPointerDown={() => triggerHaptic("purchase")}
                                onClick={(e) => { e.stopPropagation(); window.open(cheaperLink, "_blank"); }}
                                className={`w-full py-2.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1 ${T.accentCls}`}
                                style={{ boxShadow: `0 2px 10px ${T.accent}30` }}
                              >
                                <Star className="w-3 h-3 fill-white opacity-80" />
                                View Deal · {cheaperPlatform}
                              </motion.button>
                            );
                          }

                          // Two different outcomes → dual buttons with price
                          return (
                            <div className="flex gap-1">
                              {/* Cheaper but lower-rated */}
                              <motion.button
                                whileTap={{ scale: 0.94 }}
                                transition={snappySpring}
                                onPointerDown={() => triggerHaptic("light")}
                                onClick={(e) => { e.stopPropagation(); window.open(cheaperLink, "_blank"); }}
                                className="flex-1 py-2 rounded-xl text-white bg-emerald-600 flex flex-col items-center leading-tight"
                                style={{ boxShadow: "0 2px 8px rgba(5,150,105,0.28)" }}
                              >
                                <span className="text-[8px] font-semibold opacity-80">💸 Cheaper</span>
                                <span className="text-[10px] font-black">{cheaperPlatform}</span>
                                <span className="text-[8px] opacity-70">₹{cheaperPrice.toLocaleString("en-IN")}</span>
                              </motion.button>

                              {/* Expensive but higher-rated */}
                              <motion.button
                                whileTap={{ scale: 0.94 }}
                                transition={snappySpring}
                                onPointerDown={() => triggerHaptic("light")}
                                onClick={(e) => { e.stopPropagation(); window.open(expensiveLink, "_blank"); }}
                                className="flex-1 py-2 rounded-xl text-white bg-violet-600 flex flex-col items-center leading-tight"
                                style={{ boxShadow: "0 2px 8px rgba(124,58,237,0.28)" }}
                              >
                                <span className="text-[8px] font-semibold opacity-80">⭐ Top Rated</span>
                                <span className="text-[10px] font-black">{expensivePlatform}</span>
                                <span className="text-[8px] opacity-70">₹{expensivePrice.toLocaleString("en-IN")}</span>
                              </motion.button>
                            </div>
                          );
                        }

                        // Only one platform — fallback
                        return (
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            transition={snappySpring}
                            onPointerDown={() => triggerHaptic("purchase")}
                            onClick={(e) => { e.stopPropagation(); window.open(best.link, "_blank"); }}
                            className={`w-full py-2.5 rounded-xl text-[11px] font-bold text-white ${T.accentCls}`}
                            style={{ boxShadow: `0 2px 10px ${T.accent}30` }}
                          >
                            View Deal
                          </motion.button>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="col-span-full flex flex-col items-center py-20"
              >
                {(["Aesthetic Centre", "Watches", "Cameras", "Gaming", "Home"].includes(activeTab) || ["Nykaa", "Myntra"].includes(platformFilter)) && !query ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-5 ${
                        isAestheticMode ? "bg-[#8E8475]/10" : dark ? "bg-white/[0.05]" : "bg-blue-50"
                      }`}
                    >
                      <SparkleIcon className={`w-8 h-8 ${isAestheticMode ? "text-[#8E8475]" : "text-blue-500"} opacity-70`} />
                    </motion.div>
                    <p className={`text-base font-bold mb-1.5 ${T.text}`}>Coming Soon</p>
                    <p className={`text-xs text-center max-w-[200px] ${T.subtext} opacity-70`}>
                      We're curating the best deals for {["Nykaa", "Myntra"].includes(platformFilter) ? platformFilter : activeTab}. Check back soon!
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, -8, 8, -8, 0] }} transition={{ duration: 1.8, delay: 0.3 }}
                      className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-4 ${
                        dark ? "bg-white/[0.04]" : "bg-gray-100"
                      }`}
                    >
                      <SearchIcon className="w-7 h-7 opacity-20" />
                    </motion.div>
                    <p className={`text-sm font-semibold mb-1 ${T.text}`}>No deals found</p>
                    <p className={`text-xs mb-4 ${T.subtext}`}>
                      {query ? `No results for "${query}"${activeTab !== "All" ? ` in ${activeTab}` : ""}` : `Nothing in ${activeTab} yet`}
                    </p>
                    {(query || activeTab !== "All") && (
                      <motion.button
                        whileTap={{ scale: 0.95 }} transition={snappySpring}
                        onPointerDown={() => triggerHaptic("light")}
                        onClick={() => { setQuery(""); setActiveTab("All"); }}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl border ${
                          dark ? "border-white/[0.08] text-white/60 hover:bg-white/[0.07]"
                            : "border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Clear filters
                      </motion.button>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RECENTLY VIEWED ───────────────────────────────────────────── */}
        <AnimatePresence>
          {recentlyViewed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={gentleSpring}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className={`w-4 h-4 ${T.subtext}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${T.text}`}>Recently Viewed</span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar momentum-scroll -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                {recentlyViewed.map((product, i) => {
                  const best = getBestDeal(product);
                  return (
                    <motion.button
                      key={product.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...gentleSpring, delay: i * 0.03 }}
                      whileTap={{ scale: 0.95 }}
                      onPointerDown={() => triggerHaptic("light")}
                      onClick={() => openProduct(product)}
                      className={`flex-shrink-0 w-[110px] rounded-2xl border p-2.5 flex flex-col gap-1.5 text-left ${T.card} transition-colors hover:border-blue-400/40`}
                    >
                      <div className={`h-14 rounded-xl flex items-center justify-center ${dark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                        <img src={product.image} alt={product.name} className="h-full w-full object-contain p-1" loading="lazy" />
                      </div>
                      <p className={`text-[9px] font-semibold line-clamp-2 leading-snug ${T.text}`}>{product.name}</p>
                      <p className={`text-[10px] font-black ${T.priceCls}`}>₹{best.price.toLocaleString("en-IN")}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PAGINATION ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-2 mt-6 mb-4"
          >
            {isMobile ? (
              /* Mobile: prev / dots / next */
              <>
                <motion.button
                  whileTap={{ scale: 0.88 }} transition={snappySpring}
                  disabled={currentPage === 1}
                  onPointerDown={() => triggerHaptic("light")}
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 500, behavior: "smooth" }); }}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-25 ${
                    dark ? "border-white/[0.07] bg-white/[0.04]" : "border-gray-200 bg-white shadow-sm"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>

                <div className="flex items-center gap-1.5 px-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <motion.button
                        key={page}
                        whileTap={{ scale: 0.85 }} transition={snappySpring}
                        onPointerDown={() => triggerHaptic("light")}
                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 500, behavior: "smooth" }); }}
                        animate={{ width: currentPage === page ? 20 : 7, opacity: currentPage === page ? 1 : 0.35 }}
                        className={`h-[7px] rounded-full transition-colors ${
                          currentPage === page
                            ? isAestheticMode ? "bg-[#8E8475]" : "bg-blue-600"
                            : dark ? "bg-white/30" : "bg-gray-400"
                        }`}
                      />
                    );
                  })}
                  {totalPages > 7 && (
                    <span className={`text-xs font-semibold ml-1 ${T.subtext}`}>{currentPage}/{totalPages}</span>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.88 }} transition={snappySpring}
                  disabled={currentPage === totalPages}
                  onPointerDown={() => triggerHaptic("light")}
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 500, behavior: "smooth" }); }}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-25 ${
                    dark ? "border-white/[0.07] bg-white/[0.04]" : "border-gray-200 bg-white shadow-sm"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </>
            ) : (
              /* Desktop: numbered buttons */
              <>
                <motion.button
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }} transition={snappySpring}
                  disabled={currentPage === 1}
                  onPointerDown={() => triggerHaptic("light")}
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 600, behavior: "smooth" }); }}
                  className={`p-3 rounded-xl border transition-all disabled:opacity-25 ${
                    dark ? "border-white/[0.07] hover:bg-white/[0.07]" : "border-gray-200 hover:bg-gray-100 bg-white shadow-sm"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>

                {getPageNumbers().map((num) => (
                  <motion.button
                    key={num} whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }} transition={snappySpring}
                    onPointerDown={() => triggerHaptic("light")}
                    onClick={() => { setCurrentPage(num); window.scrollTo({ top: 600, behavior: "smooth" }); }}
                    aria-current={currentPage === num ? "page" : undefined}
                    className={`w-11 h-11 rounded-xl text-sm font-semibold border transition-all ${
                      currentPage === num
                        ? isAestheticMode ? "bg-[#8E8475] text-white border-transparent"
                          : "bg-blue-600 text-white border-transparent shadow-sm shadow-blue-600/25"
                        : dark ? "text-white/35 border-white/[0.07] hover:bg-white/[0.07] hover:text-white"
                        : "text-gray-500 border-gray-200 hover:bg-gray-100 bg-white shadow-sm"
                    }`}
                  >
                    {num}
                  </motion.button>
                ))}

                <motion.button
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }} transition={snappySpring}
                  disabled={currentPage === totalPages}
                  onPointerDown={() => triggerHaptic("light")}
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 600, behavior: "smooth" }); }}
                  className={`p-3 rounded-xl border transition-all disabled:opacity-25 ${
                    dark ? "border-white/[0.07] hover:bg-white/[0.07]" : "border-gray-200 hover:bg-gray-100 bg-white shadow-sm"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </motion.div>
        )}


        {/* ── DEALX INDIA LABEL ─────────────────────────────────────────── */}
        <p className={`text-center text-[10px] font-semibold tracking-widest uppercase mb-10 ${T.subtext} opacity-40`}>
          dealx india
        </p>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="hidden">

          {/* Top band — brand + newsletter */}
          <div className={`border-b ${isAestheticMode ? "border-[#D6D2C4]" : dark ? "border-white/[0.04]" : "border-gray-100"}`}>
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isAestheticMode ? "bg-[#8E8475]/12" : dark ? "bg-blue-500/10" : "bg-blue-600/8"}`}>
                    <CartIcon className={`w-5 h-5 ${isAestheticMode ? "text-[#8E8475]" : "text-blue-600"}`} />
                  </div>
                  <span className={`text-xl font-black tracking-tight ${T.text}`}>
                    DEAL<span className={isAestheticMode ? "text-[#8E8475]" : "text-blue-600"}>X</span>
                  </span>
                </div>
                <p className={`text-xs leading-relaxed max-w-[260px] ${T.subtext}`}>
                  India's smartest price comparison engine. We track prices across Amazon, Flipkart, Myntra & Nykaa in real-time so you never overpay.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <p className={`text-xs font-semibold ${T.text}`}>Get deal alerts in your inbox</p>
                <div className={`flex items-center gap-2 rounded-xl border overflow-hidden px-3 py-2 w-full sm:w-72 ${
                  isAestheticMode ? "border-[#D6D2C4] bg-white/70"
                    : dark ? "border-white/[0.07] bg-white/[0.04]"
                    : "border-gray-200 bg-white"
                }`}>
                  <Mail className={`w-3.5 h-3.5 flex-shrink-0 ${T.subtext}`} />
                  <input
                    type="email" placeholder="your@email.com"
                    className={`flex-1 bg-transparent text-xs outline-none ${
                      dark ? "placeholder:text-white/25 text-white" : "placeholder:text-gray-400 text-gray-800"
                    }`}
                  />
                  <motion.button
                    whileTap={{ scale: 0.93 }} transition={snappySpring}
                    onPointerDown={() => triggerHaptic("light")}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg text-white flex-shrink-0 ${T.accentCls}`}
                  >Subscribe</motion.button>
                </div>
                <p className={`text-[10px] ${T.subtext} opacity-60`}>No spam. Unsubscribe any time.</p>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">

            {[
              {
                heading: "Company",
                links: [
                  ["About DealX",     "Our story & mission"],
                  ["How It Works",    "Price tracking explained"],
                  ["Press & Media",   "Media kit & enquiries"],
                  ["Careers",         "Join our team"],
                  ["Blog",            "Tips, deals & guides"],
                  ["Contact Us",      "We reply within 24 hrs"],
                ],
              },
              {
                heading: "Legal",
                links: [
                  ["Privacy Policy",       "How we handle your data"],
                  ["Terms of Service",     "Rules for using DealX"],
                  ["Cookie Policy",        "What cookies we use"],
                  ["Affiliate Disclosure", "How we earn commissions"],
                  ["Refund Policy",        "Returns & refunds info"],
                  ["GDPR Rights",          "Your data rights (EU)"],
                ],
              },
              {
                heading: "Support",
                links: [
                  ["Help Centre",        "FAQs & guides"],
                  ["Report a Bug",       "Something broken?"],
                  ["Request a Product",  "Can't find it? Tell us"],
                  ["Price Alerts",       "Set up notifications"],
                  ["Compare Guide",      "How to compare products"],
                  ["Sitemap",            "All pages in one place"],
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading} className="flex flex-col gap-3">
                <p className={`text-[10px] font-black uppercase tracking-widest ${T.subtext}`}>{heading}</p>
                {links.map(([label, detail]) => (
                  <a key={label} href="#" onClick={(e) => e.preventDefault()} className="group flex flex-col gap-0.5">
                    <span className={`text-xs font-semibold transition-colors ${
                      isAestheticMode ? "text-[#2C2421] group-hover:text-[#8E8475]"
                        : dark ? "text-white/60 group-hover:text-white"
                        : "text-gray-600 group-hover:text-blue-600"
                    }`}>{label}</span>
                    <span className={`text-[10px] hidden sm:block ${T.subtext} opacity-55`}>{detail}</span>
                  </a>
                ))}
              </div>
            ))}

            {/* Contact + Social */}
            <div className="flex flex-col gap-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${T.subtext}`}>Get In Touch</p>
                <div className="flex flex-col gap-2">
                  {[
                    { icon: <Mail className="w-3.5 h-3.5" />,   text: "support@dealx.in" },
                    { icon: <MapPin className="w-3.5 h-3.5" />, text: "Bengaluru, India" },
                    { icon: <Clock className="w-3.5 h-3.5" />,  text: "Mon–Sat, 9am–7pm IST" },
                  ].map(({ icon, text }) => (
                    <div key={text} className={`flex items-center gap-2 text-[11px] ${T.subtext}`}>
                      <span className={`flex-shrink-0 ${isAestheticMode ? "text-[#8E8475]" : "text-blue-500"}`}>{icon}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${T.subtext}`}>Follow Us</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { icon: <Send className="w-3.5 h-3.5" />,    label: "Twitter / X"  },
                    { icon: <AtSign className="w-3.5 h-3.5" />,  label: "Instagram"    },
                    { icon: <Globe className="w-3.5 h-3.5" />,   label: "Facebook"     },
                    { icon: <Video className="w-3.5 h-3.5" />,   label: "YouTube"      },
                  ].map(({ icon, label }) => (
                    <motion.a
                      key={label} href="#" onClick={(e) => e.preventDefault()}
                      whileHover={{ scale: 1.1, y: -1 }} whileTap={{ scale: 0.9 }}
                      transition={snappySpring}
                      onPointerDown={() => triggerHaptic("light")}
                      title={label} aria-label={label}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                        isAestheticMode
                          ? "border-[#D6D2C4] text-[#8E8475] bg-white/60 hover:bg-[#8E8475] hover:text-white hover:border-[#8E8475]"
                          : dark
                            ? "border-white/[0.08] text-white/40 hover:bg-white/[0.08] hover:text-white"
                            : "border-gray-200 text-gray-400 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600"
                      }`}
                    >{icon}</motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Policy summary cards */}
          <div className={`border-t ${isAestheticMode ? "border-[#D6D2C4]" : dark ? "border-white/[0.04]" : "border-gray-100"}`}>
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-7">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${T.subtext}`}>At a Glance</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: <Shield className="w-4 h-4" />,
                    iconBg: isAestheticMode ? "bg-[#8E8475]/10" : dark ? "bg-blue-500/10" : "bg-blue-50",
                    iconColor: isAestheticMode ? "text-[#8E8475]" : "text-blue-600",
                    linkColor: isAestheticMode ? "text-[#8E8475]" : "text-blue-600",
                    title: "Privacy Policy",
                    body: "We collect only what's necessary — your search history, wishlist, and account info. We never sell your personal data to third parties. All data is encrypted at rest and in transit. You can request deletion of your account and data at any time by contacting support.",
                    cta: "Read full policy",
                  },
                  {
                    icon: <FileText className="w-4 h-4" />,
                    iconBg: isAestheticMode ? "bg-[#8E8475]/10" : dark ? "bg-violet-500/10" : "bg-violet-50",
                    iconColor: isAestheticMode ? "text-[#8E8475]" : "text-violet-600",
                    linkColor: isAestheticMode ? "text-[#8E8475]" : "text-violet-600",
                    title: "Terms of Service",
                    body: "DealX is a free price-comparison service. We are not the seller — purchases happen on partner platforms. Prices shown are indicative and may vary. By using DealX you agree not to scrape, misuse, or reproduce our data. We reserve the right to suspend accounts that violate these terms.",
                    cta: "Read full terms",
                  },
                  {
                    icon: <Info className="w-4 h-4" />,
                    iconBg: isAestheticMode ? "bg-[#8E8475]/10" : dark ? "bg-emerald-500/10" : "bg-emerald-50",
                    iconColor: isAestheticMode ? "text-[#8E8475]" : "text-emerald-600",
                    linkColor: isAestheticMode ? "text-[#8E8475]" : "text-emerald-600",
                    title: "About DealX",
                    body: "Founded in 2024, DealX was built by engineers and deal-hunters tired of overpaying. We track millions of prices daily across India's top platforms. DealX earns a small affiliate commission on some purchases — this never affects which deals we show or how we rank them.",
                    cta: "Our full story",
                  },
                ].map(({ icon, iconBg, iconColor, linkColor, title, body, cta }) => (
                  <div key={title} className={`rounded-2xl border p-4 flex gap-3 ${
                    isAestheticMode ? "border-[#D6D2C4] bg-white/50"
                      : dark ? "border-white/[0.06] bg-white/[0.025]"
                      : "border-gray-100 bg-white"
                  }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                      <span className={iconColor}>{icon}</span>
                    </div>
                    <div>
                      <p className={`text-xs font-bold mb-1 ${T.text}`}>{title}</p>
                      <p className={`text-[10px] leading-relaxed ${T.subtext}`}>{body}</p>
                      <a href="#" onClick={(e) => e.preventDefault()} className={`text-[10px] font-semibold mt-1.5 inline-flex items-center gap-1 ${linkColor}`}>
                        {cta} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform badges */}
          <div className={`border-t ${isAestheticMode ? "border-[#D6D2C4]" : dark ? "border-white/[0.04]" : "border-gray-100"}`}>
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className={`flex items-center gap-2 text-[10px] font-medium ${T.subtext}`}>
                <RefreshCw className="w-3 h-3 flex-shrink-0" style={{ animation: "spin 3s linear infinite" }} />
                Prices refreshed every hour across all platforms
              </div>
              <div className="flex items-center gap-2">
                {["Amazon", "Flipkart", "Myntra", "Nykaa"].map((p) => (
                  <div key={p} className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wide ${
                    isAestheticMode ? "border-[#D6D2C4] text-[#8E8475]"
                      : dark ? "border-white/[0.07] text-white/30"
                      : "border-gray-200 text-gray-400"
                  }`}>{p}</div>
                ))}
              </div>
            </div>
          </div>

        </footer>

        {/* ── FLOATING CATEGORY MENU (when scrolled) ────────────────────── */}
        <AnimatePresence>
          {isScrolled && (
            <motion.div
              ref={categoryMenuRef}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={appleSpring}
              className="fixed top-[58px] left-3 z-[199]"
            >
              {/* Hamburger toggle button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={snappySpring}
                onPointerDown={() => triggerHaptic("medium")}
                onClick={() => setIsCategoryMenuOpen((o) => !o)}
                aria-label="Toggle categories"
                className={`w-11 h-11 flex items-center justify-center rounded-2xl border-2 backdrop-blur-xl shadow-lg transition-all ${
                  isCategoryMenuOpen
                    ? isAestheticMode ? "bg-[#8E8475] border-[#8E8475] text-white" : "bg-blue-600 border-blue-600 text-white"
                    : isAestheticMode
                      ? "bg-white/90 border-[#D6D2C4] text-[#8E8475]"
                      : dark
                        ? "bg-[#1c1c1e]/90 border-white/[0.1] text-white"
                        : "bg-white/95 border-gray-200 text-gray-700"
                }`}
                style={{ boxShadow: isCategoryMenuOpen ? `0 4px 20px ${T.accent}50` : "0 4px 16px rgba(0,0,0,0.18)" }}
              >
                <AnimatePresence mode="wait">
                  {isCategoryMenuOpen
                    ? <motion.div key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <CloseIcon className="w-4 h-4" />
                      </motion.div>
                    : <motion.div key="menu" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <MenuIcon className="w-4 h-4" />
                      </motion.div>
                  }
                </AnimatePresence>
              </motion.button>

              {/* Expanded categories list */}
              <AnimatePresence>
                {isCategoryMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -8, originX: 0, originY: 0 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -8 }}
                    transition={appleSpring}
                    className={`absolute top-[calc(100%+8px)] left-0 min-w-[180px] rounded-2xl border-2 overflow-hidden backdrop-blur-2xl shadow-2xl ${
                      isAestheticMode
                        ? "bg-white/96 border-[#D6D2C4]"
                        : dark
                          ? "bg-[#1c1c1e]/96 border-white/[0.1]"
                          : "bg-white/98 border-gray-200"
                    }`}
                    style={{ boxShadow: dark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.14)" }}
                  >
                    <div className="p-1.5">
                      {[...tabs.filter((t) => !t.isDropdown), ...moreCategories].map((tab, i) => (
                        <motion.button
                          key={tab.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...appleSpring, delay: i * 0.03 }}
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.97 }}
                          onPointerDown={() => triggerHaptic("tab")}
                          onClick={() => {
                            setActiveTab(tab.name);
                            setIsCategoryMenuOpen(false);
                            triggerHaptic("select");
                          }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                            activeTab === tab.name
                              ? isAestheticMode
                                ? "bg-[#8E8475] text-white"
                                : "bg-blue-600 text-white"
                              : dark
                                ? "text-white/70 hover:bg-white/[0.07] hover:text-white"
                                : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className={activeTab === tab.name ? "text-white" : T.accentTextCls}>
                            {tab.icon}
                          </span>
                          <span>{tab.name}</span>
                          {activeTab === tab.name && (
                            <motion.div
                              layoutId="activeCatDot"
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FLOATING SEARCH FAB (when scrolled) ───────────────────────── */}
        <AnimatePresence>
          {isScrolled && (
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={appleSpring}
              className="fixed left-0 right-0 z-[200] px-5 flex justify-center pointer-events-none"
              style={{ bottom: "max(env(safe-area-inset-bottom, 0px) + 12px, 20px)" }}
            >
              <motion.div
                layout transition={gentleSpring}
                className={`flex items-center overflow-hidden pointer-events-auto ${
                  isFabOpen ? "w-full max-w-xs h-14 rounded-2xl" : "w-14 h-14 rounded-2xl"
                } ${T.accentCls}`}
                style={{ boxShadow: `0 8px 36px ${T.accent}55` }}
              >
                <motion.button
                  whileTap={{ scale: 0.88 }} transition={snappySpring}
                  onPointerDown={() => triggerHaptic("medium")}
                  onClick={() => setIsFabOpen(!isFabOpen)}
                  className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-white"
                >
                  <AnimatePresence mode="wait">
                    {isFabOpen
                      ? <motion.div key="c" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}><CloseIcon className="w-5 h-5" /></motion.div>
                      : <motion.div key="s" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}><SearchIcon className="w-5 h-5" /></motion.div>
                    }
                  </AnimatePresence>
                </motion.button>
                <AnimatePresence>
                  {isFabOpen && (
                    <motion.input
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: 0.08 }}
                      autoFocus type="text" placeholder="Search deals…" value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="bg-transparent text-white text-sm font-medium placeholder:text-white/50 outline-none px-2 flex-1"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
