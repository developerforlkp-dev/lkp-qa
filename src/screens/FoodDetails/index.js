import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import useDarkMode from "use-dark-mode";
import { useLocation, Link, useHistory } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  Utensils, Star, Clock, MapPin, ChefHat, Award, Leaf, Globe,
  Coffee, Info, ChevronRight, ChevronDown, Phone, Instagram, Check, ArrowRight, ArrowDown,
  Calendar, Zap, CheckCircle, ChevronLeft, UtensilsCrossed, Share2, Search
} from "lucide-react";
import cn from "classnames";
import Loader from "../../components/Loader";
import { Footer } from "../../components/JUI/Footer";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import { getFoodDetails, getHost } from "../../utils/api";
import ShareButton from "../../components/ShareButton";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const toDisplayString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.displayName || value.name || value.title || value.code || "";
  }
  return String(value);
};

/* ─── TOKENS & THEME ─────────── */
const THEMES = {
  light: {
    A: "#0097B2", AH: "#008CA5", AL: "rgba(0, 151, 178, 0.08)",
    BG: "#FBFBF9", FG: "#0F0F0F", M: "#7A7A77",
    S: "#F3F3F1", B: "#E6E6E3", W: "#FFFFFF"
  },
  dark: {
    A: "#0097B2", AH: "#0AADCA", AL: "rgba(0, 151, 178, 0.15)",
    BG: "#080808", FG: "#EBEBE6", M: "#8C8C88",
    S: "#111111", B: "#1F1F1F", W: "#000000"
  }
};

const ThemeContext = createContext({ theme: "light", toggleTheme: () => { }, tokens: THEMES.light });
const useTheme = () => useContext(ThemeContext);

function ScopedThemeProvider({ children }) {
  const darkMode = useDarkMode(false);
  const theme = darkMode.value ? "dark" : "light";
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (wrapperRef.current) {
      const tokens = THEMES[theme];
      Object.entries(tokens).forEach(([key, value]) => {
        wrapperRef.current.style.setProperty(`--${key}`, value);
      });
      wrapperRef.current.style.background = tokens.BG;
      wrapperRef.current.style.color = tokens.FG;
    }
  }, [theme]);

  const toggleTheme = () => darkMode.toggle();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, tokens: THEMES[theme] }}>
      <div ref={wrapperRef} className="food-details-premium" style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

const E = [0.22, 1, 0.36, 1];

function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
    isMobile: typeof window !== "undefined" ? window.innerWidth <= 768 : false,
    isTablet: typeof window !== "undefined" ? (window.innerWidth > 768 && window.innerWidth <= 1024) : false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}


const ScopedStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Italianno&family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
    
    .food-details-premium {
      font-family: 'Inter', system-ui, sans-serif;
      overflow-x: hidden;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    
    /* Header Blending */
    [class*="Header_header"] {
      position: absolute !important;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      z-index: 1000 !important;
      transition: all 0.4s ease;
    }

    .font-cursive { font-family: 'Italianno', cursive; }
    .font-display { font-family: 'Fraunces', Georgia, serif; }

    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    @keyframes spin-badge { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    
    .food-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .food-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    .food-details-premium .float-anim { animation: float 6s ease-in-out infinite; }

    .hero-img-curve {
      clip-path: circle(85% at 85% 50%);
    }

    /* ─── PREMIUM MOBILE RESPONSIVE OVERRIDES ─── */
    @media(max-width:768px){
      .food-details-premium .desk-only { display: none !important; }
      
      /* Section Paddings */
      .hero-section-wrapper {
        height: auto !important;
        min-height: 100vh;
        padding: 120px 20px 60px !important;
        display: flex !important;
        align-items: center !important;
      }
      .chef-section-wrapper {
        padding: 80px 20px !important;
      }
      .dish-gallery-wrapper {
        padding: 60px 0 !important;
      }
      .availability-section-wrapper {
        padding: 80px 20px !important;
      }
      .location-section-wrapper {
        padding: 80px 20px !important;
      }
      .reservation-section-wrapper {
        padding: 80px 20px !important;
      }

      /* Grid & Layout Adjustments */
      .hero-grid {
        grid-template-columns: 1fr !important;
        gap: 32px !important;
      }
      .chef-grid {
        grid-template-columns: 1fr !important;
        gap: 40px !important;
      }
      .res-grid {
        grid-template-columns: 1fr !important;
        gap: 48px !important;
        padding: 40px 24px !important;
        border-radius: 28px !important;
      }

      /* Hero Specifics */
      .hero-img-curve {
        clip-path: none !important;
        border-radius: 28px !important;
        margin-top: 16px;
        aspect-ratio: 4/3 !important;
        max-height: 45vh !important;
      }
      .info-badges-grid {
        grid-template-columns: 1fr 1fr !important;
        gap: 16px !important;
      }
      .hero-stats-card {
        flex-direction: column !important;
        padding: 12px !important;
        border-radius: 20px !important;
        gap: 0 !important;
      }
      .hero-stat-item {
        border-right: none !important;
        border-bottom: 1px solid var(--B) !important;
        padding: 16px 12px !important;
        height: auto !important;
        width: 100% !important;
        box-sizing: border-box;
      }
      .hero-stat-item:last-child {
        border-bottom: none !important;
        padding-bottom: 12px !important;
      }

      /* Share Button Mobile Positioning */
      .hero-share-fab-mobile {
        top: 90px !important;
        right: 20px !important;
      }

      /* Chef Section Specifics */
      .chef-image-wrapper {
        height: 380px !important;
        border-radius: 28px !important;
      }
      .chef-boxes-wrapper {
        flex-direction: column !important;
        gap: 16px !important;
      }
      .chef-box-item {
        padding: 18px 24px !important;
        border-radius: 16px !important;
      }

      /* Availability Section Specifics */
      .availability-operating-card {
        padding: 28px !important;
        border-radius: 28px !important;
      }
      .availability-hours-text {
        font-size: 1.65rem !important;
      }
      .availability-specs-container {
        grid-template-columns: 1fr !important;
        gap: 20px !important;
        padding: 28px !important;
        border-radius: 28px !important;
      }
      
      /* Location Section Specifics */
      .location-list-item {
        flex-direction: column !important;
        gap: 8px !important;
        padding: 20px 0 !important;
        align-items: flex-start !important;
      }
      .location-label {
        width: auto !important;
      }
      .location-value {
        font-size: 16px !important;
      }
      
      /* Reservation Section Specifics */
      .res-contact-grid {
        grid-template-columns: 1fr !important;
        gap: 24px !important;
      }
      .res-accordion-wrapper {
        padding: 28px !important;
        border-radius: 28px !important;
      }

      /* Dish Gallery Filters & Redesigned Cards */
      .dish-filter-container {
        padding: 0 20px 24px !important;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .dish-search-wrapper {
        position: relative;
        width: 100%;
      }
      .dish-search-input {
        width: 100%;
        padding: 14px 16px 14px 44px;
        font-size: 14px;
        font-family: inherit;
        border-radius: 12px;
        border: 1px solid var(--B);
        background: var(--S);
        color: var(--FG);
        outline: none;
        transition: border-color 0.3s ease;
      }
      .dish-search-input:focus {
        border-color: var(--A);
      }
      .dish-search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--M);
        pointer-events: none;
      }
      .dish-chips-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
      }
      .dish-chips-row::-webkit-scrollbar {
        display: none;
      }
      .dish-chip {
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 20px;
        border: 1px solid var(--B);
        background: var(--W);
        color: var(--M);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .dish-chip.active {
        background: var(--A);
        color: #FFFFFF;
        border-color: var(--A);
        box-shadow: 0 4px 12px var(--AL);
      }
      .dish-card-img-wrapper {
        height: 240px !important;
      }
      .dish-card-body {
        padding: 20px !important;
      }
      .dish-card-overlay {
        bottom: 16px !important;
        left: 16px !important;
        right: 16px !important;
      }
      .dish-card-cta {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 12px;
        margin-top: 16px;
        border: none;
        border-radius: 10px;
        background: var(--A);
        color: #FFFFFF;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .dish-card-cta:active {
        transform: scale(0.97);
      }
    }
  `}</style>
);

/* ─── UI COMPONENTS ─────────── */

function ProgressBar() {
  const { tokens: { A } } = useTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: A, zIndex: 9996 }} />
  );
}

function Rev({ children, delay = 0, style = {} }) {
  const r = useRef(null);
  const v = useInView(r, { once: true, margin: "-60px" });
  return (
    <motion.div ref={r} initial={{ opacity: 0, y: 44 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: E, delay }} style={style}>
      {children}
    </motion.div>
  );
}

function Chars({ text, cls = "", style = {}, delay = 0 }) {
  const r = useRef(null);
  const v = useInView(r, { once: true, margin: "-40px" });
  return (
    <div ref={r} className={cls} style={style}>
      {text?.split("").map((c, i) => (
        <motion.span key={i} initial={{ y: "105%", opacity: 0 }} animate={v ? { y: 0, opacity: 1 } : {}} transition={{ duration: 0.7, ease: E, delay: delay + i * 0.028 }} style={{ display: "inline-block", whiteSpace: c === " " ? "pre" : "normal" }}>
          {c}
        </motion.span>
      ))}
    </div>
  );
}

function Soul({ children, y = 80, s = 0.05, r = 0, delay = 0, style = {} }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const moveY = useTransform(scrollYProgress, [0, 0.5, 1], [y, 0, -y]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1 - s, 1, 1 - s]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  return (
    <motion.div ref={ref} style={{ ...style, y: moveY, scale, opacity }} transition={{ ease: E, delay }}>
      {children}
    </motion.div>
  );
}

function Mq({ items, dir = "l", size = "sm", bg, accent = false }) {
  const { tokens: { A, BG, M, B } } = useTheme();
  const bgColor = bg ?? BG;
  const sep = "  ·  ";
  const fsMap = { sm: "0.65rem", lg: "clamp(2.2rem,5vw,4rem)", xl: "clamp(3.5rem,9vw,7.5rem)" };
  const fs = fsMap[size];
  const col = accent ? A : M;
  const padV = size === "xl" ? "28px 0" : size === "lg" ? "20px 0" : "11px 0";
  const speed = size === "sm" ? 0.04 : 0.06;

  // Duplicate items enough to always overflow
  const CLONES = 8;
  const allItems = Array(CLONES).fill(items).flat();

  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const [setW, setSetW] = useState(0);

  // Measure the width of one full set
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        const child = trackRef.current.firstElementChild;
        if (child) {
          const allChildren = Array.from(trackRef.current.children);
          const oneSetCount = items.length;
          const width = allChildren.slice(0, oneSetCount).reduce((sum, el) => sum + el.offsetWidth, 0);
          if (width > 0) setSetW(width);
        }
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [items]);

  useAnimationFrame((_, delta) => {
    if (setW <= 0) return;
    const move = (delta || 16) * speed;
    const current = x.get();
    if (dir === "l") {
      const next = current - move;
      x.set(next <= -setW ? next + setW : next);
    } else {
      const next = current + move;
      x.set(next >= 0 ? next - setW : next);
    }
  });

  return (
    <div style={{ overflow: "hidden", background: bgColor, borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}`, padding: padV }}>
      <motion.div ref={trackRef} style={{ x, display: "flex", whiteSpace: "nowrap", willChange: "transform" }}>
        {allItems.map((item, i) => (
          <span
            key={i}
            className={size !== "sm" ? "font-display" : ""}
            style={{
              fontSize: fs,
              fontWeight: size !== "sm" ? 700 : 500,
              color: col,
              whiteSpace: "nowrap",
              letterSpacing: size === "sm" ? "0.28em" : "-0.01em",
              textTransform: size === "sm" ? "uppercase" : "none",
              paddingRight: size === "sm" ? 32 : 56,
              flexShrink: 0,
            }}
          >
            {item}{sep}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function SHdr({ idx, label }) {
  const { tokens: { A, B } } = useTheme();
  return (
    <Rev style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.35em", fontWeight: 600, textTransform: "uppercase", color: A, whiteSpace: "nowrap" }}>{idx} — {label}</span>
    </Rev>
  );
}

/* ─── UI COMPONENTS ─────────── */
function InfoBadge({ icon: Icon, label, sublabel, color, tokens }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A }}>
        <Icon size={20} />
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: tokens.FG, textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 11, color: tokens.M, margin: 0 }}>{sublabel}</p>
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, subvalue, tokens, hideBorder }) {
  const { isMobile } = useWindowSize();
  return (
    <div className="hero-stat-item" style={{
      display: "flex",
      gap: 16,
      alignItems: "center",
      padding: isMobile ? "16px 12px" : "0 24px",
      borderRight: (isMobile || hideBorder) ? "none" : `1px solid ${tokens.B}`,
      borderBottom: isMobile && !hideBorder ? `1px solid ${tokens.B}` : "none",
      height: "100%",
      width: "100%",
      boxSizing: "border-box"
    }}>
      <div style={{ color: tokens.A, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: 9, textTransform: "uppercase", color: tokens.M, fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 800, color: tokens.FG, marginBottom: 2, margin: 0 }}>{value}</p>
        {subvalue && <p style={{ fontSize: 9, color: tokens.M, margin: 0 }}>{subvalue}</p>}
      </div>
    </div>
  );
}

/* ─── HERO SHARE FAB ─────────────────────────── */
function HeroShareFab({ title, text, url }) {
  const { isMobile } = useWindowSize();
  const [copied, setCopied] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { tokens: { A } } = useTheme();
  const glow = A || "#0097B2";

  const handleShare = async () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 700);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch (_) {}
  };

  return (
    <motion.button
      onClick={handleShare}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.85, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.86 }}
      style={{
        position: "absolute",
        top: isMobile ? 90 : 96,
        right: isMobile ? 20 : 60,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: 44,
        maxWidth: hovered ? 200 : 44,
        overflow: "hidden",
        paddingLeft: 13,
        paddingRight: hovered ? 18 : 13,
        background: "rgba(0,151,178,0.13)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1.5px solid ${glow}55`,
        borderRadius: 50,
        cursor: "pointer",
        color: "#FFFFFF",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        boxShadow: hovered
          ? `0 0 20px ${glow}55, 0 0 50px ${glow}20, 0 6px 24px rgba(0,0,0,0.4)`
          : `0 0 10px ${glow}30, 0 4px 14px rgba(0,0,0,0.28)`,
        outline: "none",
        userSelect: "none",
        transition: "max-width 0.45s cubic-bezier(0.22,1,0.36,1), padding-right 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
      }}
    >
      <motion.span
        animate={ripple ? { scale: [1, 3.4], opacity: [0.45, 0] } : { scale: 1, opacity: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        style={{ position: "absolute", inset: -2, borderRadius: 60, background: glow, pointerEvents: "none" }}
      />
      <motion.span
        animate={{
          y: hovered ? 0 : [0, -2, 0, 2, 0],
          rotate: hovered ? 360 : 0,
          scale: hovered ? 1.15 : 1
        }}
        transition={{
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          rotate: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.3, ease: "easeOut" }
        }}
        style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18, position: "relative" }}
      >
        <Share2 size={17} strokeWidth={2.2} />
      </motion.span>
      <span style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: hovered ? 140 : 0,
        opacity: hovered ? 1 : 0,
        marginLeft: hovered ? 9 : 0,
        position: "relative",
        transition: "max-width 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease 0.12s, margin-left 0.45s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {copied ? "✓ Copied!" : "Share Taste"}
      </span>
    </motion.button>
  );
}

/* ─── CULINARY SECTIONS ─────────── */
function CulinaryHero({ food, galleryItems }) {
  const { isMobile } = useWindowSize();
  const { theme, tokens } = useTheme();
  const { A, FG, M, BG, W, B, AL } = tokens;

  const [idx, setIdx] = useState(0);
  const items = galleryItems?.length ? galleryItems : ["https://picsum.photos/seed/culinary/1200/800"];

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const title = food?.menuName || food?.title || "Signature Dish";
  const cuisine = Array.isArray(food?.cuisineTypeNames) ? food.cuisineTypeNames.join(", ") : (food?.cuisineTypeNames || food?.cuisineType?.displayName || "Gourmet");
  const category = toDisplayString(food?.category) || "Main Course";
  const dietary = Array.isArray(food?.dietaryOptionNames) ? food.dietaryOptionNames.join(", ") : (food?.dietaryOptionNames || (food?.isVeg ? "Veg" : "Non-Veg"));
  const serveModeNames = food?.serveModeNames || food?.serviceModeNames || [];
  const serveMode = Array.isArray(serveModeNames) && serveModeNames.length > 0
    ? serveModeNames.join(", ")
    : (food?.serviceMode || food?.serveMode || "Dine-In");
  const source = food?.sourceType?.displayName || food?.sourceType?.code || food?.sourceType || "Home-Made";

  const openDays = useMemo(() => {
    const dayMap = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
    const rawDays = Array.isArray(food?.openingDays) ? [...food.openingDays].sort((a, b) => (dayMap[a] || 0) - (dayMap[b] || 0)) : [];

    if (rawDays.length === 0) return "Daily Service";
    if (rawDays.length === 7) return "Everyday";

    // Check if consecutive
    const indices = rawDays.map(d => dayMap[d] || 0).filter(i => i > 0);
    let isConsecutive = true;
    for (let i = 0; i < indices.length - 1; i++) {
      if (indices[i + 1] !== indices[i] + 1) {
        isConsecutive = false;
        break;
      }
    }

    if (isConsecutive && rawDays.length >= 3) {
      return `${rawDays[0]} - ${rawDays[rawDays.length - 1]}`;
    }

    return rawDays.join(", ");
  }, [food?.openingDays]);

  if (isMobile) {
    return (
      <section className="hero-section-wrapper-mobile" style={{ background: BG, minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", paddingBottom: "40px" }}>
        {/* Full-width screen bleed image slider at the top */}
        <div className="hero-mobile-image-container" style={{ width: "100%", height: "55vh", position: "relative", overflow: "hidden", borderRadius: "0 0 36px 36px" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={idx}
              src={items[idx]}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              alt={title}
            />
          </AnimatePresence>
          {/* Subtle dark gradient overlay at the bottom of the image container to transition into the page background */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: `linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.65))` }} />
          
          {/* Reposition floating badges (e.g., Family Friendly, Parking Available) as compact overlays */}
          <div style={{ position: "absolute", top: 100, left: 16, zIndex: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {(food?.isFamilyFriendly || food?.familyFriendly) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255, 255, 255, 0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 20, border: `1px solid ${B}`, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                <Star size={12} color={A} fill={A} style={{ display: "block" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "0.05em" }}>Family Friendly</span>
              </div>
            )}
            {(food?.isParkingAvailable || food?.parkingAvailable) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0, 151, 178, 0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 20, border: `1px solid ${A}33`, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                <MapPin size={12} color="#fff" />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Parking Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Content Card */}
        <div className="hero-mobile-floating-card" style={{
          marginTop: "-64px",
          marginLeft: "16px",
          marginRight: "16px",
          padding: "24px 20px",
          borderRadius: "28px",
          background: theme === "dark" ? "rgba(10, 10, 10, 0.78)" : "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${B}`,
          boxShadow: theme === "dark" ? "0 20px 48px rgba(0, 0, 0, 0.35)" : "0 20px 48px rgba(0, 0, 0, 0.08)",
          zIndex: 15,
          position: "relative"
        }}>
          <h1 className="font-display" style={{
            fontSize: "24px",
            fontWeight: 800,
            color: FG,
            lineHeight: 1.2,
            margin: "0 0 6px 0",
            textTransform: "capitalize"
          }}>
            {title}
          </h1>
          <h2 className="font-cursive" style={{
            fontSize: "24px",
            color: A,
            margin: "0 0 12px 0",
            fontWeight: 400
          }}>
            {food?.shortDescription || "Authentic Taste Experience"}
          </h2>
          <p style={{
            fontSize: "13px",
            color: M,
            lineHeight: 1.5,
            margin: 0
          }}>
            {food?.detailedDescription || food?.description || "Experience the perfect harmony of flavors, crafted with passion."}
          </p>
        </div>

        {/* Details & Badges Section */}
        <div style={{ padding: "0 16px", marginTop: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="info-badges-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            padding: "16px 0",
            borderTop: `1px solid ${B}`,
            borderBottom: `1px solid ${B}`
          }}>
            <InfoBadge icon={Utensils} label={cuisine} sublabel="Cuisine" tokens={tokens} />
            <InfoBadge icon={Globe} label={source} sublabel="Source" tokens={tokens} />
            <InfoBadge icon={Zap} label={serveMode} sublabel="Service" tokens={tokens} />
            <InfoBadge icon={Leaf} label={dietary} sublabel="Dietary" tokens={tokens} />
          </div>

          <div className="hero-stats-card" style={{
            background: W,
            borderRadius: "20px",
            padding: "16px",
            border: `1px solid ${B}`,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            gap: 0
          }}>
            <HeroStat icon={Coffee} label="Average Cost" value={`₹${food?.averageCostForOne || "450"}`} subvalue="For One" tokens={tokens} />
            <HeroStat icon={Clock} label="Open Today" value={`${food?.openingTime || "11:00 AM"} - ${food?.closingTime || "08:30 PM"}`} tokens={tokens} />
            <HeroStat icon={Calendar} label="Open Days" value={openDays} tokens={tokens} hideBorder />
          </div>
        </div>

        {/* Share Button absolute overlays */}
        <HeroShareFab
          title={food?.menuName || food?.title || ""}
          text={food?.detailedDescription || food?.shortDescription || food?.description || ""}
          url={window.location.href}
        />
      </section>
    );
  }

  return (
    <section className="hero-section-wrapper" style={{ background: BG, height: isMobile ? "auto" : "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", paddingTop: isMobile ? 120 : 80 }}>
      {/* Header Blending Gradient */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: `linear-gradient(to bottom, ${BG}, transparent)`, zIndex: 5, pointerEvents: "none" }} />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: isMobile ? "0 20px" : "0 60px", width: "100%", height: isMobile ? "auto" : "100%", display: "flex", alignItems: "center" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 60, alignItems: "center", width: "100%" }}>
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <div>
                <h1 className="font-display" style={{ fontSize: isMobile ? "clamp(2rem, 7vw, 3rem)" : "clamp(2.5rem, 5vw, 4.2rem)", fontWeight: 800, color: FG, lineHeight: 1.1, margin: 0, textTransform: "capitalize" }}>
                  {title}
                </h1>
                <h2 className="font-cursive" style={{ fontSize: isMobile ? "clamp(1.6rem, 5vw, 2.2rem)" : "clamp(1.8rem, 3vw, 2.8rem)", color: A, marginTop: -5, marginBottom: 16, fontWeight: 400 }}>
                  {food?.shortDescription || "Authentic Taste Experience"}
                </h2>
                <p style={{ fontSize: 14, color: M, lineHeight: 1.6, maxWidth: 450, margin: 0 }}>
                  {food?.detailedDescription || food?.description || "Experience the perfect harmony of flavors, crafted with passion."}
                </p>
              </div>

              <div className="info-badges-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: isMobile ? 16 : 20, padding: "16px 0", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
                <InfoBadge icon={Utensils} label={cuisine} sublabel="Cuisine" tokens={tokens} />
                <InfoBadge icon={Globe} label={source} sublabel="Source" tokens={tokens} />
                <InfoBadge icon={Zap} label={serveMode} sublabel="Service" tokens={tokens} />
                <InfoBadge icon={Leaf} label={dietary} sublabel="Dietary" tokens={tokens} />
              </div>

              <div className="hero-stats-card" style={{ background: W, borderRadius: 20, padding: isMobile ? "12px" : "16px 0", border: `1px solid ${B}`, display: "flex", flexDirection: isMobile ? "column" : "row", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                <div style={{ flex: 1 }}><HeroStat icon={Coffee} label="Average Cost" value={`₹${food?.averageCostForOne || "450"}`} subvalue="For One" tokens={tokens} /></div>
                <div style={{ flex: 1 }}><HeroStat icon={Clock} label="Open Today" value={`${food?.openingTime || "11:00 AM"} - ${food?.closingTime || "08:30 PM"}`} tokens={tokens} /></div>
                <div style={{ flex: isMobile ? 1 : 1.5 }}><HeroStat icon={Calendar} label="Open Days" value={openDays} tokens={tokens} hideBorder /></div>
              </div>

            </div>
          </Rev>

          <Rev delay={0.3} style={{ position: "relative" }}>
            <div className="hero-img-curve" style={{ width: "100%", aspectRatio: isMobile ? "4/3" : "4/5", maxHeight: isMobile ? "45vh" : "75vh", position: "relative", overflow: "hidden", borderRadius: isMobile ? "24px" : "30px 30px 200px 30px" }}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={idx}
                  src={items[idx]}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                  alt={title}
                />
              </AnimatePresence>
            </div>

            {/* Badges moved outside overflow: hidden for visibility */}
            {(food?.isFamilyFriendly || food?.familyFriendly) && (
              <div style={{ position: "absolute", top: "5%", right: "2%", zIndex: 10 }} className="float-anim">
                <div style={{ width: isMobile ? 70 : 85, height: isMobile ? 70 : 85, borderRadius: "50%", background: W, boxShadow: "0 15px 35px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8 }}>
                  <div style={{ color: A, marginBottom: 2 }}><Star size={isMobile ? 16 : 20} /></div>
                  <p style={{ fontSize: isMobile ? 7 : 8, fontWeight: 800, color: FG, margin: 0, textTransform: "uppercase" }}>Family Friendly</p>
                </div>
              </div>
            )}

            {(food?.isParkingAvailable || food?.parkingAvailable) && (
              <div style={{ position: "absolute", bottom: "15%", right: isMobile ? "-2%" : "-5%", zIndex: 10, animationDelay: "1s" }} className="float-anim">
                <div style={{ width: isMobile ? 70 : 85, height: isMobile ? 70 : 85, borderRadius: "50%", background: A, boxShadow: `0 15px 35px ${AL}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8, color: "#fff" }}>
                  <div style={{ marginBottom: 2 }}><MapPin size={isMobile ? 18 : 22} /></div>
                  <p style={{ fontSize: isMobile ? 7 : 8, fontWeight: 800, margin: 0, textTransform: "uppercase" }}>Parking Available</p>
                </div>
              </div>
            )}

            {!isMobile && (
              <div className="font-cursive" style={{ position: "absolute", bottom: "10%", left: "-5%", color: FG, fontSize: 32, transform: "rotate(-12deg)", opacity: 0.8, zIndex: 10 }}>
                Signature <br /> {title.split(' ')[0]}
              </div>
            )}

            {/* Curved shapes background */}
            <div style={{ position: "absolute", top: "-5%", right: "-5%", width: "110%", height: "110%", background: "radial-gradient(circle, var(--AL) 0%, transparent 70%)", zIndex: -1, borderRadius: "50%" }} />
          </Rev>
        </div>
      </div>

      {/* Decorative Background Patterns */}
      <div style={{ position: "absolute", top: "8%", left: "1%", opacity: 0.08, zIndex: -1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 6px)", gap: 12 }}>
          {Array(25).fill(0).map((_, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: FG }} />)}
        </div>
      </div>
      <HeroShareFab
        title={food?.menuName || food?.title || ""}
        text={food?.detailedDescription || food?.shortDescription || food?.description || ""}
        url={window.location.href}
      />
    </section>
  );
}

function ChefSection({ food, hostData, hostAvatar, galleryItems }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, W, B, S, BG, AL } } = useTheme();
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]);

  const [idx, setIdx] = useState(0);
  const items = galleryItems?.length ? galleryItems : [hostAvatar || "https://picsum.photos/seed/chef/600/800"];

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIdx(prev => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const chefName = hostData?.displayName || food?.host?.displayName || "Master Chef";
  const chefStory = food?.chefOwnerStory || food?.chefStory || food?.ownerStory || food?.story || food?.host?.about || "Our culinary philosophy is rooted in the belief that a meal is more than just sustenance; it is a narrative of heritage, innovation, and biological response.";

  return (
    <section ref={r} className="chef-section-wrapper" style={{ background: BG, padding: isMobile ? "80px 0" : "180px 0", overflow: "hidden", position: "relative", borderTop: `1px solid ${B}` }}>
      <motion.div style={{ x, position: "absolute", top: "40%", left: 0, whiteSpace: "nowrap", opacity: 0.05, pointerEvents: "none" }}>
        <h2 className="font-display" style={{ fontSize: "25vw", color: FG, fontWeight: 900 }}>GASTRONOMY</h2>
      </motion.div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "0 20px" : "0 36px", position: "relative", zIndex: 2 }}>
        <SHdr idx="01" label="Culinary Visionary" />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.1fr", gap: isMobile ? 40 : 100, alignItems: "center" }} className="chef-grid">
          <Soul r={-5} s={0.1}>
            <div className="chef-image-wrapper" style={{ background: S, borderRadius: 40, height: isMobile ? 380 : 650, overflow: "hidden", border: `1px solid ${B}`, position: "relative" }}>
              <motion.div
                animate={{ x: `-${idx * 100}%` }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", width: "100%", height: "100%", willChange: "transform" }}
              >
                {items.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    style={{ width: "100%", height: "100%", objectFit: "cover", flexShrink: 0, filter: "brightness(0.9)" }}
                    alt={chefName}
                  />
                ))}
              </motion.div>

              {items.length > 1 && (
                <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
                  {items.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === idx ? 32 : 8,
                        height: 4,
                        borderRadius: 2,
                        background: i === idx ? A : "#FFF",
                        opacity: i === idx ? 1 : 0.4,
                        transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)"
                      }}
                    />
                  ))}
                </div>
              )}

              <div style={{ position: "absolute", top: isMobile ? 20 : 40, right: isMobile ? 20 : 40, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", padding: "12px 20px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ color: "#FFF", fontSize: 10, fontWeight: 700, margin: 0, letterSpacing: "0.1em" }}>EXPERT CURATOR</p>
              </div>
            </div>
          </Soul>

          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: isMobile ? 16 : 32 }}>Behind the Craft</p>
            <h2 className="font-display" style={{ fontSize: isMobile ? "clamp(2rem, 7vw, 3rem)" : "clamp(3rem, 5vw, 4.2rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: isMobile ? 24 : 44 }}>
              {(() => {
                const words = chefName.trim().split(" ");
                const mid = Math.ceil(words.length / 2);
                return (
                  <>
                    {words.slice(0, mid).join(" ")} <br />
                    <span style={{ color: A }}>{words.slice(mid).join(" ") || "Experience."}</span>
                  </>
                );
              })()}
            </h2>

            <div style={{ position: "relative", marginBottom: isMobile ? 32 : 48 }}>
              <div style={{ position: "absolute", top: -20, left: -20, fontSize: 80, color: A, opacity: 0.1, fontFamily: "serif" }}>&ldquo;</div>
              <p style={{ fontSize: 17, color: FG, lineHeight: 1.85, fontWeight: 500, fontStyle: "italic", marginBottom: isMobile ? 24 : 32 }}>
                {chefStory}
              </p>
              <div style={{ width: 60, height: 2, background: A, marginBottom: isMobile ? 24 : 32 }} />
            </div>

            <div className="chef-boxes-wrapper" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 24, alignItems: "stretch" }}>
              <div className="chef-box-item" style={{ background: AL, padding: isMobile ? "18px 24px" : "24px 32px", borderRadius: 20, border: `1px solid ${B}`, flex: 1 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 700 }}>Profile Role</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>Executive Chef & Owner</p>
              </div>
              <div className="chef-box-item" style={{ background: AL, padding: isMobile ? "18px 24px" : "24px 32px", borderRadius: 20, border: `1px solid ${B}`, flex: 1 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 700 }}>Experience</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>12+ Years Culinary Arts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DishGallery({ galleryItems, food }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, BG, S, B, AL } } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Veg", "Non-Veg", "Desserts", "Drinks"];
  const cuisine = Array.isArray(food?.cuisineTypeNames) ? food.cuisineTypeNames.join(", ") : (food?.cuisineTypeNames || toDisplayString(food?.cuisineType) || "Signature");

  const dishes = useMemo(() => {
    if (!galleryItems || galleryItems.length === 0) return [];
    const cats = ["Veg", "Non-Veg", "Desserts", "Drinks"];
    return galleryItems.map((img, i) => {
      const category = cats[i % cats.length];
      const isVeg = category === "Veg" || category === "Desserts" || category === "Drinks";
      
      const dishTitles = [
        "Chef's Signature Platter",
        "Gourmet Spiced Selection",
        "Artisanal Sweet Craft",
        "Handcrafted Elixir Pair",
        "Savoury Herb Plate",
        "Botanical Medley Salad"
      ];
      const title = dishTitles[i % dishTitles.length];
      const priceVal = food?.price || (food?.averageCostForOne ? `₹${Math.round(food.averageCostForOne * (0.8 + i * 0.15))}` : "");
      
      return {
        id: i,
        image: img,
        title: i === 0 ? (food?.menuName || title) : title,
        category,
        isVeg,
        price: priceVal || `₹${350 + i * 75}`,
        description: i === 0 ? (food?.detailedDescription || food?.shortDescription || "Curated taste experience featuring organic ingredients and custom seasonings.") : "Crafted with local farm-fresh selections, seasonal spices, and modern culinary design.",
        rating: (4.4 + (i % 3) * 0.2).toFixed(1),
        reviews: 12 + i * 4,
        tags: i === 0 ? ["Must Try", "Signature"] : i % 2 === 0 ? ["House Special"] : ["Trending"]
      };
    });
  }, [galleryItems, food]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      let matchesCategory = true;
      if (activeCategory === "Veg") {
        matchesCategory = dish.isVeg;
      } else if (activeCategory === "Non-Veg") {
        matchesCategory = !dish.isVeg;
      } else if (activeCategory !== "All") {
        matchesCategory = dish.category === activeCategory;
      }
      
      const matchesSearch = dish.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            dish.description.toLowerCase().includes(searchQuery.toLowerCase());
                             
      return matchesCategory && matchesSearch;
    });
  }, [dishes, activeCategory, searchQuery]);

  return (
    <section className="dish-gallery-wrapper" style={{ background: BG, padding: isMobile ? "60px 0" : "150px 0", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: isMobile ? "0 20px" : "0 36px", marginBottom: isMobile ? 32 : 64 }}>
        <SHdr idx="02" label="Culinary Expressions" />
      </div>

      {isMobile && (
        <div className="dish-filter-container">
          <div className="dish-search-wrapper">
            <Search size={18} className="dish-search-icon" />
            <input
              type="text"
              className="dish-search-input"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="dish-chips-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={cn("dish-chip", { active: activeCategory === cat })}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: isMobile ? 20 : 32, overflowX: "auto", padding: isMobile ? "0 20px 24px" : "0 5vw 64px", scrollbarWidth: "none" }} className="dish-scroll">
        {filteredDishes.map((dish, i) => (
          <Soul key={dish.id} delay={i * 0.1} y={40} r={3} style={{ flexShrink: 0, width: isMobile ? "290px" : "clamp(280px, 35vw, 450px)" }}>
            <motion.div whileHover={{ scale: 1.02 }} style={{ background: S, border: `1px solid ${B}`, borderRadius: isMobile ? 20 : 28, overflow: "hidden" }}>
              <div className="dish-card-img-wrapper" style={{ height: isMobile ? 200 : 480, overflow: "hidden", position: "relative" }}>
                <img src={dish.image} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }} alt={dish.title} />
                <div className="dish-card-overlay" style={{ position: "absolute", bottom: isMobile ? 16 : 28, left: isMobile ? 16 : 28, right: isMobile ? 16 : 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <p style={{ fontSize: isMobile ? 7 : 8, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 8 }}>{isMobile ? `${dish.category} • ${cuisine}` : cuisine}</p>
                    <h4 className="font-display" style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: FG, margin: 0 }}>{dish.title}</h4>
                  </div>
                  <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: A, whiteSpace: "nowrap" }}>{dish.price}</span>
                </div>
              </div>
              <div className="dish-card-body" style={{ padding: isMobile ? 16 : 32 }}>
                {isMobile && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={13} fill={A} color={A} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>{dish.rating}</span>
                      <span style={{ fontSize: 11, color: M }}>({dish.reviews})</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {dish.tags.map(t => (
                        <span key={t} style={{ fontSize: 9, fontWeight: 700, background: AL, color: A, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <p style={{ fontSize: 12, color: M, lineHeight: 1.7, margin: 0 }}>
                  {dish.description}
                </p>

                {isMobile && (
                  <button
                    className="dish-card-cta"
                    onClick={() => {
                      const contactSection = document.getElementById("reservation-inquiries");
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Inquire Now
                  </button>
                )}
              </div>
            </motion.div>
          </Soul>
        ))}
      </div>
    </section>
  );
}

function AvailabilitySection({ food }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, BG, W, B, S, AL } } = useTheme();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const activeDays = Array.isArray(food?.openingDays) ? food.openingDays : days;

  return (
    <section className="availability-section-wrapper" style={{ background: BG, padding: isMobile ? "80px 16px" : "180px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="03" label="Availability & Pricing" />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 0.8fr", gap: isMobile ? 32 : 64, marginTop: isMobile ? 32 : 64 }} className="chef-grid">
          <Rev delay={0.1}>
            <div className="availability-operating-card" style={{ background: S, border: `1px solid ${B}`, padding: isMobile ? "28px" : "56px", borderRadius: isMobile ? 28 : 44, display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 className="font-display" style={{ fontSize: isMobile ? "clamp(1.8rem, 6vw, 2.4rem)" : "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, color: FG, marginBottom: isMobile ? 32 : 56, lineHeight: 1.1 }}>Operating <br /><span style={{ color: A }}>Architecture.</span></h3>

              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 32 : 48, flex: 1, justifyContent: "center" }}>
                <div className="availability-detail-item" style={{ display: "flex", gap: isMobile ? 16 : 32, alignItems: "center" }}>
                  <div style={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, borderRadius: isMobile ? 14 : 20, background: AL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Clock size={isMobile ? 20 : 28} color={A} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 800, margin: 0 }}>Service Hours</p>
                    <p className="availability-hours-text" style={{ fontSize: isMobile ? "1.45rem" : "2.2rem", fontWeight: 700, color: FG, letterSpacing: "-0.02em", margin: 0 }}>{food?.openingTime || food?.startTime || "07:32"} — {food?.closingTime || food?.endTime || "17:55"}</p>
                  </div>
                </div>

                <div className="availability-detail-item" style={{ display: "flex", gap: isMobile ? 16 : 32, alignItems: "flex-start" }}>
                  <div style={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, borderRadius: isMobile ? 14 : 20, background: AL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={isMobile ? 20 : 28} color={A} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 12, fontWeight: 800, margin: 0 }}>Opening Days</p>
                    <div style={{ display: "flex", gap: isMobile ? 6 : 12, flexWrap: "wrap", marginTop: 8 }}>
                      {days.map(d => {
                        const isActive = activeDays.some(ad => ad.toLowerCase().includes(d.toLowerCase()));
                        return (
                          <div key={d} style={{
                            width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, borderRadius: isMobile ? 10 : 14,
                            background: isActive ? A : W,
                            color: isActive ? "#FFF" : M,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: isMobile ? 11 : 13, fontWeight: 800,
                            border: `1px solid ${isActive ? A : B}`,
                            transition: "all 0.4s ease"
                          }}>
                            {d[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="availability-detail-item" style={{ display: "flex", gap: isMobile ? 16 : 32, alignItems: "center" }}>
                  <div style={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, borderRadius: isMobile ? 14 : 20, background: AL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={isMobile ? 20 : 28} color={A} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 800, margin: 0 }}>Serve Mode</p>
                    <p style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: FG, margin: 0 }}>{Array.isArray(food?.serveModeNames) ? food.serveModeNames.join(" & ") : (food?.serveModeNames || food?.serveMode || food?.serviceMode || "Dine-In")}</p>
                  </div>
                </div>
              </div>
            </div>
          </Rev>

          <Rev delay={0.2}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
              <div style={{ background: W, border: `1px solid ${B}`, padding: isMobile ? "24px" : "40px", borderRadius: isMobile ? 28 : 40, display: "flex", flexDirection: "column", gap: isMobile ? 28 : 40 }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Dietary Specification</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {(() => {
                      const dietary = Array.isArray(food?.dietaryOptionNames) ? food.dietaryOptionNames : (food?.dietaryOptionNames || food?.dietaryOptions || (food?.isVeg ? ["Vegetarian"] : food?.isNonVeg ? ["Non-Vegetarian"] : ["Vegetarian & Non-Vegetarian"]));
                      const items = Array.isArray(dietary) ? dietary : [dietary];
                      return items.map((opt, i) => (
                        <div key={i} style={{ padding: "10px 20px", borderRadius: 12, background: AL, border: `1px solid ${B}`, display: "flex", alignItems: "center", gap: 10 }}>
                          <Leaf size={14} color={A} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{opt}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {food?.signatureDishes && (
                  <div>
                    <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Signature Recommendations</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {(Array.isArray(food.signatureDishes) ? food.signatureDishes : food.signatureDishes.split(",")).map((dish, i) => (
                        <div key={i} style={{ padding: "10px 20px", borderRadius: 12, background: A, color: "#fff", display: "flex", alignItems: "center", gap: 10, boxShadow: `0 8px 20px ${AL}` }}>
                          <Star size={14} fill="#fff" />
                          <span style={{ fontSize: 13, fontWeight: 800 }}>{dish.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="availability-specs-container" style={{ background: W, border: `1px solid ${B}`, padding: isMobile ? "24px" : "40px", borderRadius: isMobile ? 28 : 40, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 24 : 32 }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Advanced Booking</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={food?.advancedBookingRequired ? A : M} />
                    <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: FG }}>{food?.advancedBookingRequired ? "Required" : "Not Required"}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Seasonal</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={food?.seasonalAvailability ? A : M} />
                    <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: FG }}>{food?.seasonalAvailability ? "Yes" : "No"}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Alcohol</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={food?.alcoholServed ? A : M} />
                    <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: FG }}>{food?.alcoholServed ? "Served" : "None"}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: S, border: `1px solid ${B}`, padding: isMobile ? "28px" : "40px", borderRadius: isMobile ? 28 : 40, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 32 }}>Pricing Architecture</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 20, marginBottom: 20 }}>
                  <span style={{ fontSize: 14, color: M, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tier Strategy</span>
                  <span className="font-display" style={{ fontSize: isMobile ? "1.5rem" : "1.8rem", fontWeight: 700, color: FG, letterSpacing: "-0.02em" }}>{food?.priceRange || "Budget"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, color: M, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Avg. Investment</span>
                  <span style={{ fontSize: isMobile ? "2.2rem" : "3rem", fontWeight: 800, color: A, letterSpacing: "-0.04em" }}>₹{food?.averageCostForOne || food?.price || "450"}</span>
                </div>
              </div>
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

function LocationSection({ food }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, AL, FG, M, BG, W, B, S } } = useTheme();

  return (
    <section className="location-section-wrapper" style={{ background: W, padding: isMobile ? "80px 16px" : "130px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="04" label="Location & Access" />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 64, marginTop: isMobile ? 32 : 64 }} className="chef-grid">
          <Rev delay={0.1}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <h3 className="font-display" style={{ fontSize: isMobile ? "clamp(1.8rem, 6vw, 2.4rem)" : "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, color: FG, marginBottom: isMobile ? 24 : 56, lineHeight: 1.1 }}>Restaurant <br /><span style={{ color: A }}>Location.</span></h3>
              <div style={{ background: S, border: `1px solid ${B}`, padding: isMobile ? "16px" : "40px", borderRadius: isMobile ? 24 : 40, display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
                <div style={{ background: W, border: `1px solid ${B}`, height: isMobile ? 260 : 320, marginTop: 12, borderRadius: isMobile ? 20 : 28, position: "relative", overflow: "hidden" }}>
                  {(() => {
                    const lat = food?.meetingLatitude || food?.latitude;
                    const lng = food?.meetingLongitude || food?.longitude;
                    const address = food?.meetingAddress || food?.address;
                    const query = (lat && lng) ? `${lat},${lng}` : (address ? encodeURIComponent(address) : null);

                    if (query) {
                      return (
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${query}&hl=en&z=14&output=embed`}
                          allowFullScreen
                          title="Meeting Location"
                        />
                      );
                    }
                    return (
                      <>
                        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}18 1px,transparent 1px),linear-gradient(90deg,${A}18 1px,transparent 1px)`, backgroundSize: "20px 20px" }} />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: A, borderRadius: "50%" }}>
                          <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", inset: "-6px", border: `2px solid ${A}`, borderRadius: "50%" }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </Rev>

          <Rev delay={0.2}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <h3 className="font-display" style={{ fontSize: isMobile ? "clamp(1.8rem, 6vw, 2.4rem)" : "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, color: FG, marginBottom: isMobile ? 24 : 56, lineHeight: 1.1 }}>Location <br /><span style={{ color: A }}>Details.</span></h3>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 0, padding: 0 }}>
                  {[
                    { label: "Address", val: food?.meetingAddress || food?.address },
                    { label: "District", val: food?.meetingDistrict || food?.district },
                    { label: "State", val: food?.meetingState || food?.state || food?.city },
                    { label: "Landmark", val: food?.nearestLandmark || food?.meetingLandmark || food?.landmark || "Near City Center" },
                    { label: "Directions", val: food?.meetingInstructions || food?.directions }
                  ].filter(x => x.val).map((item, i) => (
                    <li key={i} className="location-list-item" style={{ display: "flex", gap: isMobile ? 8 : 32, alignItems: isMobile ? "flex-start" : "baseline", flexDirection: isMobile ? "column" : "row", borderBottom: `1px solid ${B}`, padding: isMobile ? "16px 0" : "24px 0" }}>
                      <span className="location-label" style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: A, width: isMobile ? "auto" : 130, flexShrink: 0, fontWeight: 800 }}>{item.label}</span>
                      <span className="location-value" style={{ fontSize: isMobile ? 16 : 20, color: FG, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.01em" }}>{item.val}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: isMobile ? 32 : 40 }}>
                  <motion.a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${(food?.meetingLatitude && food?.meetingLongitude) ? `${food.meetingLatitude},${food.meetingLongitude}` : encodeURIComponent(food?.meetingAddress || food?.address || "Restaurant")}`}
                    target="_blank"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 12,
                      background: A,
                      color: "#FFF",
                      padding: "16px 36px",
                      borderRadius: 14,
                      textDecoration: "none",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      boxShadow: `0 15px 30px ${AL}`
                    }}
                  >
                    Get Directions <ArrowRight size={18} />
                  </motion.a>
                </div>
              </div>
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}



function ReqItem({ item, tokens }) {
  const [open, setOpen] = useState(false);
  const { A, FG, M, B, AL, S } = tokens;
  const title = item?.setting?.title || item?.title || "Requirement";
  const desc = item?.setting?.description || item?.description;
  const questions = item?.questions || [];

  return (
    <div style={{ borderBottom: `1px solid ${B}`, paddingBottom: 24 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", gap: 20 }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: open ? A : FG, margin: 0, textTransform: "capitalize", marginBottom: 4 }}>{title}</p>
          {desc && !open && <p style={{ fontSize: 13, color: M, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%" }}>{desc}</p>}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} style={{ marginTop: 4 }}>
          <ChevronDown size={20} color={M} />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 16 }}>
              {desc && <p style={{ fontSize: 15, color: M, lineHeight: 1.6, marginBottom: 24, whiteSpace: "pre-line" }}>{desc}</p>}
              
              {questions.length > 0 && (
                <div style={{ padding: "20px", background: AL, borderRadius: 20, border: `1px solid ${B}` }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {questions.map((q, j) => (
                      <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0" }}>
                        <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
                        <span style={{ fontSize: 14, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{q.title || q.question?.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReservationNoir({ food, hostData }) {
  const { isMobile } = useWindowSize();
  const { tokens } = useTheme();
  const { A, FG, M, BG, S, B, AL } = tokens;

  return (
    <section id="reservation-inquiries" className="reservation-section-wrapper" style={{ background: BG, padding: isMobile ? "80px 16px" : "150px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Soul y={100}>
          <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 40, padding: isMobile ? "40px 20px" : "80px 64px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 80 }} className="res-grid">
            {/* Left Column: Contact Details */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 24 }}>Inquiries</p>
              <h3 className="font-display" style={{ fontSize: isMobile ? "clamp(1.8rem, 6vw, 2.6rem)" : "clamp(2rem, 4vw, 3.2rem)", fontWeight: 700, color: FG, marginBottom: 16 }}>Contact & <br /><span style={{ color: A }}>Additional Info.</span></h3>
              <p style={{ fontSize: 15, color: M, lineHeight: 1.6, marginBottom: isMobile ? 32 : 56 }}>
                Contact details and dietary information
              </p>

              <div className="res-contact-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 40, rowGap: isMobile ? 24 : 40 }}>
                <div>
                  <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 12 }}>Managed By</p>
                  <p style={{ fontSize: 15, color: FG, fontWeight: 600 }}>{hostData?.displayName || food?.host?.displayName || "Owner"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 12 }}>Contact Phone</p>
                  <p style={{ fontSize: 15, color: FG, fontWeight: 700 }}>{hostData?.phone || food?.host?.phone || "1234567890"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 16 }}>Website or Social Link</p>
                  <motion.a
                    whileHover={{ scale: 1.05, background: A, color: "#fff" }}
                    href={food?.website || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      color: A,
                      fontWeight: 700,
                      textDecoration: "none",
                      border: `1.5px solid ${A}`,
                      padding: "8px 16px",
                      borderRadius: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Visit Website
                  </motion.a>
                </div>
                <div>
                  <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 16 }}>Instagram Handle</p>
                  {(() => {
                    const insta = food?.instagramHandle || food?.instagram || food?.host?.instagram;
                    if (!insta || insta === "@culinary_craft") return <p style={{ fontSize: 15, color: FG, fontWeight: 600, margin: 0 }}>-</p>;
                    return (
                      <motion.a
                        whileHover={{ scale: 1.05, background: A, color: "#fff" }}
                        href={`https://instagram.com/${insta.replace("@", "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          fontSize: 10,
                          color: A,
                          fontWeight: 700,
                          textDecoration: "none",
                          border: `1.5px solid ${A}`,
                          padding: "8px 16px",
                          borderRadius: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Visit Instagram
                      </motion.a>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Column: Guest Requirements Accordion */}
            <div className="res-accordion-wrapper" style={{ background: AL, borderRadius: 32, padding: isMobile ? 24 : 48, border: `1px solid ${B}` }}>
              <p style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 32 }}>Guest Requirements</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {food?.guestRequirements?.length > 0 ? (
                  food.guestRequirements.map((req, i) => (
                    <ReqItem key={i} item={req} tokens={tokens} />
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ fontSize: 15, color: M, fontStyle: "italic" }}>No specific guest requirements have been listed for this experience.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Soul>
      </div>
    </section>
  );
}

/* ─── MAIN COMPONENT ─────────── */
const FoodDetails = () => {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const [food, setFood] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailablePopupOpen, setUnavailablePopupOpen] = useState(false);
  const unavailableRedirectRef = useRef(false);

  // Dynamic browser tab title
  useDocumentTitle(food?.menuName || food?.title, "Food");

  const isFoodUnavailable = (payload) => {
    if (!payload || typeof payload !== "object") return true;
    const status = String(
      payload?.status ||
      payload?.listingStatus ||
      payload?.state ||
      payload?.approvalStatus ||
      payload?.publishStatus ||
      ""
    ).trim().toUpperCase();
    if (["DISABLED", "DRAFT", "INACTIVE", "UNPUBLISHED", "REJECTED"].includes(status)) return true;
    if (payload?.isActive === false || payload?.is_active === false) return true;
    return false;
  };

  const showUnavailablePopupAndRedirect = () => {
    setLoading(false);
    unavailableRedirectRef.current = true;
    setUnavailablePopupOpen(true);
  };

  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("leads/")) {
      return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }
    if (url.startsWith("/")) return url;
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await getFoodDetails(id);
        if (!mounted) return;
        if (isFoodUnavailable(data)) {
          showUnavailablePopupAndRedirect();
          return;
        }

        if (data) {
          const normalizedData = {
            ...data,
            description: data.detailedDescription || data.shortDescription || data.description,
          };
          setFood(normalizedData);

          const galleryImages = [];
          if (data.coverImageUrl) galleryImages.push(formatImageUrl(data.coverImageUrl));
          if (Array.isArray(data.media)) {
            data.media.forEach(m => {
              if (m.url && m.url !== data.coverImageUrl) galleryImages.push(formatImageUrl(m.url));
            });
          } else if (Array.isArray(data.images)) {
            data.images.forEach(img => {
              const url = typeof img === 'string' ? img : (img.url || img.imageUrl);
              if (url && url !== data.coverImageUrl) galleryImages.push(formatImageUrl(url));
            });
          }
          setGalleryItems(galleryImages.length ? galleryImages : ["https://picsum.photos/seed/food/800/600"]);

          const hostId = data.hostId || data.host?.hostId || data.leadUserId;
          if (hostId) {
            getHost(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));
          }
        }
        setLoading(false);
      } catch (e) {
        console.error("Failed to load food details", e);
        const statusCode = Number(e?.response?.status);
        const message = String(e?.response?.data?.message || e?.response?.data?.error || e?.message || "");
        const isUnavailable =
          /status\s*:\s*disabled/i.test(message) ||
          /status\s*:\s*draft/i.test(message) ||
          /no\s*longer\s*available/i.test(message) ||
          /not\s*found/i.test(message) ||
          statusCode === 404 ||
          statusCode === 410;
        if (isUnavailable) {
          showUnavailablePopupAndRedirect();
          return;
        }
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleUnavailablePopupClose = () => {
    setUnavailablePopupOpen(false);
    if (unavailableRedirectRef.current) {
      unavailableRedirectRef.current = false;
      history.replace("/");
    }
  };

  const unavailablePopup = (
    <AnimatePresence>
      {unavailablePopupOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: "100%", maxWidth: 420, background: "var(--S)", color: "var(--FG)", border: "1px solid var(--B)", borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--FG)" }}>Food Unavailable</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--M)" }}>Food no longer available.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" onClick={handleUnavailablePopupClose} style={{ border: "none", background: "var(--A)", color: "#FFFFFF", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Go to Home
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const hostAvatar = useMemo(() => {
    const avatarUrl = hostData?.profilePhotoUrl || food?.host?.profilePhotoUrl;
    return avatarUrl ? formatImageUrl(avatarUrl) : null;
  }, [hostData, food]);

  const primaryCategoryId = food?.primaryCategoryId || food?.primaryCategory?.id || food?.categoryId || food?.category?.id;
  const currentListingId = food?.foodMenuId || food?.foodId || food?.id || id;

  if (loading && !food && !unavailablePopupOpen) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader />
      </div>
    );
  }

  if (unavailablePopupOpen) {
    return (
      <ScopedThemeProvider>
        <ScopedStyles />
        {unavailablePopup}
      </ScopedThemeProvider>
    );
  }

  return (
    <ScopedThemeProvider>
      <ProgressBar />
      <ScopedStyles />
      {unavailablePopup}

      <CulinaryHero food={food} galleryItems={galleryItems} />

      {(() => {
        const tagsRaw = food?.tagNames || food?.tags || [];
        const tags = Array.isArray(tagsRaw)
          ? tagsRaw.map(t => typeof t === 'string' ? t : (t?.name || t?.tag || t?.label || t?.value)).filter(Boolean)
          : [];
        const curated = Array.isArray(food?.curatedContent)
          ? food.curatedContent.map(c => typeof c === 'string' ? c : (c?.name || c?.title || c?.value)).filter(Boolean)
          : [];
        const items = curated.length > 0 ? curated : tags.length > 0 ? tags : ["Avant Cuisine", "Molecular Art", "Sonic Plating", "Epicurean Odyssey"];
        return <Mq items={items} size="sm" bg="var(--S)" accent />;
      })()}

      <ChefSection food={food} hostData={hostData} hostAvatar={hostAvatar} galleryItems={galleryItems} />

      {(() => {
        const tagsRaw = food?.tagNames || food?.tags || [];
        const tags = Array.isArray(tagsRaw)
          ? tagsRaw.map(t => typeof t === 'string' ? t : (t?.name || t?.tag || t?.label || t?.value)).filter(Boolean)
          : [];
        const items = tags.length > 0 ? tags : ["Heritage Taste", "Liquid Alchemy", "Curated Palette", "Biological Response"];
        return <Mq items={items} bg="var(--S)" />;
      })()}

      <DishGallery galleryItems={galleryItems} food={food} />

      <Mq items={["Bespoke Reservations", "Finite Tables", "Infinite Experience"]} size="sm" bg="var(--S)" accent />

      <AvailabilitySection food={food} />

      <LocationSection food={food} />

      <ReservationNoir food={food} hostData={hostData} />

      <RelatedListingsStrip
        businessInterestId={5}
        primaryCategoryId={primaryCategoryId}
        currentListingId={currentListingId}
        title="More Food Experiences"
      />

      <Footer />

    </ScopedThemeProvider>
  );
};

export default FoodDetails;
