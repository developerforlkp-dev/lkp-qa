import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import useDarkMode from "use-dark-mode";
import { useLocation, Link, useHistory } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  Utensils, Star, Clock, MapPin, ChefHat, Award, Leaf, Globe,
  Coffee, Info, ChevronRight, ChevronDown, Phone, Instagram, Check, ArrowRight, ArrowDown,
  Calendar, Zap, CheckCircle, ChevronLeft, UtensilsCrossed, Share2, Search, Sparkles,
  Users, DollarSign, GlassWater, CloudSun, Tag, Heart
} from "lucide-react";
import cn from "classnames";
import Loader from "../../components/Loader";
import { Footer } from "../../components/JUI/Footer";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import { getFoodDetails, getHost, getHostContent } from "../../utils/api";
import ShareButton from "../../components/ShareButton";
import Favorite from "../../components/Favorite";
import Icon from "../../components/Icon";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import DetailPageNavPortal from "../../components/DetailPageNavPortal";

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

    .food-details-premium h1.hero-title {
      color: #FFFFFF !important;
      -webkit-text-fill-color: #FFFFFF !important;
      text-shadow: none !important;
      -webkit-text-stroke: none !important;
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

    .bento-grid-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(3, 1fr);
      height: calc(100vh - 180px);
      gap: 12px;
      width: 100%;
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 20px;
      box-sizing: border-box;
    }
    .bento-card {
      position: relative;
      border-radius: 24px;
      overflow: visible !important;
      perspective: 1000px;
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
    }
    .bento-card::-webkit-scrollbar {
      display: none; /* Hide scrollbars in Chrome/Safari */
    }
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
      transform-style: preserve-3d;
    }
    .bento-card:hover .flip-card-inner {
      transform: rotateY(180deg);
    }
    .flip-card-front, .flip-card-back {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      border-radius: 24px;
      overflow: auto;
      scrollbar-width: none;
      border: 1px solid var(--B);
      background: var(--S);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 24px;
    }
    .flip-card-front::-webkit-scrollbar, .flip-card-back::-webkit-scrollbar {
      display: none;
    }
    .flip-card-front.image-card, .flip-card-back.image-card {
      overflow: hidden;
      padding: 0;
    }
    .flip-card-front.image-card img, .flip-card-back.image-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .flip-card-front.text-overlay, .flip-card-back.text-overlay {
      justify-content: flex-end;
      color: #fff;
    }
    .flip-card-front.text-overlay .overlay-content, .flip-card-back.text-overlay .overlay-content {
      position: relative;
      z-index: 2;
    }
    .flip-card-front.text-overlay .gradient-overlay, .flip-card-back.text-overlay .gradient-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%);
      z-index: 1;
    }
    .flip-card-back {
      transform: rotateY(180deg);
    }
    
    /* Bento Card Spans */
    .bento-span-2-2 {
      grid-column: span 2;
      grid-row: span 2;
    }
    .bento-span-2-1 {
      grid-column: span 2;
      grid-row: span 1;
    }
    .bento-span-1-2 {
      grid-column: span 1;
      grid-row: span 2;
    }
    .bento-span-1-1 {
      grid-column: span 1;
      grid-row: span 1;
    }
    
    /* Custom colored card backgrounds matching project theme colors */
    .bento-card.colored-accent-1 {
      background: var(--AL);
      color: var(--FG);
      border-color: var(--B);
    }
    .bento-card.colored-accent-1 h3 {
      color: var(--A);
    }
    .bento-card.colored-accent-2 {
      background: var(--A);
      color: #FFFFFF;
      border-color: var(--A);
    }
    .bento-card.colored-accent-2 h3, .bento-card.colored-accent-2 p {
      color: #FFFFFF !important;
    }
    .bento-card.colored-accent-3 {
      background: var(--S);
      color: var(--FG);
      border-color: var(--B);
    }
    .bento-card.colored-accent-3 h3 {
      color: var(--A);
    }
    .bento-card.colored-accent-1 h3, .bento-card.colored-accent-2 h3, .bento-card.colored-accent-3 h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .bento-card.colored-accent-1 p, .bento-card.colored-accent-2 p, .bento-card.colored-accent-3 p {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.6;
      opacity: 0.9;
    }
    
    /* Responsive tweaks */
    @media(max-width: 1024px) {
      .bento-grid-container {
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: minmax(160px, auto);
      }
      .bento-span-2-2 {
        grid-column: span 2;
        grid-row: span 2;
      }
      .bento-span-1-2 {
        grid-column: span 1;
        grid-row: span 2;
      }
      .narrative-section, .prep-section, .reservation-section-wrapper {
        padding: 32px 40px !important;
      }
    }
    @media(max-width: 768px) {
      .bento-grid-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 0 16px;
      }
      .bento-card {
        grid-column: auto !important;
        grid-row: auto !important;
        height: auto !important;
        min-height: 140px;
        padding: 24px;
      }
      .bento-card.image-card {
        height: 240px !important;
      }
      .bento-card.bento-span-2-2.image-card {
        height: 280px !important;
      }
    }


    /* ─── PREMIUM MOBILE RESPONSIVE OVERRIDES ─── */
    @media(max-width:768px){
      .food-details-premium .desk-only { display: none !important; }
      
      /* Section Paddings */
      .hero-section-wrapper {
        height: auto !important;
        min-height: 100vh;
        padding: 120px 24px 60px !important;
        display: flex !important;
        align-items: center !important;
      }
      .narrative-section, .prep-section, .reservation-section-wrapper {
        padding: 32px 24px !important;
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
function HeroShareFab({ title, text, url, label = "Share Taste" }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { theme, tokens: { A, FG } } = useTheme();
  const glow = A || "#0097B2";
  const isDark = theme === "dark";
  const surface = isDark ? "#141414" : "#FFFFFF";
  const surfaceHover = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? FG : A;
  const borderColor = hovered ? glow : (isDark ? `${glow}66` : `${glow}4D`);
  const shadow = hovered
    ? isDark
      ? `0 0 20px ${glow}55, 0 0 50px ${glow}20, 0 8px 28px rgba(0,0,0,0.5)`
      : `0 0 18px ${glow}33, 0 8px 28px rgba(15,15,15,0.14)`
    : isDark
      ? `0 0 10px ${glow}30, 0 4px 14px rgba(0,0,0,0.34)`
      : "0 6px 18px rgba(15,15,15,0.12)";

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch (_) { }
  };

  return (
    <motion.button
      onClick={handleShare}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.86 }}
      style={{
        height: 44,
        borderRadius: 22,
        background: hovered ? surfaceHover : surface,
        border: `1.5px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        boxShadow: shadow,
        cursor: "pointer",
        maxWidth: hovered ? 160 : 44,
        overflow: "hidden",
        paddingLeft: 12,
        paddingRight: hovered ? 16 : 12,
        transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), padding-right 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, background 0.35s ease, border-color 0.35s ease",
        pointerEvents: "auto",
        position: "relative",
        zIndex: 200,
        outline: "none"
      }}
    >
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
        style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, position: "relative" }}
      >
        <Share2 size={20} color={textColor} />
      </motion.span>
      <span style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: hovered ? 130 : 0,
        opacity: hovered ? 1 : 0,
        marginLeft: hovered ? 8 : 0,
        position: "relative",
        transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease 0.1s, margin-left 0.4s cubic-bezier(0.22,1,0.36,1)",
        color: textColor,
        fontFamily: '"Inter", sans-serif',
        fontSize: 13,
        fontWeight: 600
      }}>
        {copied ? "Copied!" : label}
      </span>
    </motion.button>
  );
}

/* ─── CULINARY SECTIONS ─────────── */
function CulinaryHero({ food, galleryItems }) {
  const history = useHistory();
  const { isMobile } = useWindowSize();
  const { theme, tokens } = useTheme();
  const { A, FG, M, BG, W, B, AL } = tokens;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = food?.id || food?.foodId || food?._id || searchParams.get("id");

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
      <section className="hero-section-wrapper-mobile" style={{ background: BG, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", paddingBottom: "40px" }}>
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
          </div>
          {(food?.isParkingAvailable || food?.parkingAvailable) && (
            <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0, 151, 178, 0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 20, border: `1px solid ${A}33`, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
              <MapPin size={12} color="#fff" />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Parking Available</span>
            </div>
          )}
        </div>

        {/* Mobile Top Controls */}
        <div style={{ position: "absolute", top: 90, left: 20, right: 20, display: "flex", justifyContent: "space-between", zIndex: 200, pointerEvents: "none" }}>
          <button onClick={(e) => { e.stopPropagation(); history.goBack(); }} style={{ pointerEvents: "auto", width: 44, height: 44, borderRadius: "50%", background: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", outline: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} color={theme === "dark" ? "#FFFFFF" : "#111111"} />
          </button>
          <div style={{ display: "flex", gap: 12, pointerEvents: "auto" }}>
            <Favorite itemType="food" itemId={id}>
              {({ saved, onClick }) => (
                <button onClick={(e) => { e.stopPropagation(); onClick(e); }} style={{ width: 44, height: 44, borderRadius: "50%", background: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", outline: "none", cursor: "pointer" }}>
                  <style>{`
                    .mobile-save-icon-alt-${id} svg {
                      fill: ${saved ? (A || "#0097B2") : (theme === "dark" ? "#FFFFFF" : "#111111")};
                      transition: fill 0.3s ease;
                    }
                  `}</style>
                  <div className={`mobile-save-icon-alt-${id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={saved ? "heart-fill" : "heart"} size={20} />
                  </div>
                </button>
              )}
            </Favorite>
            <button onClick={async (e) => { 
              e.stopPropagation(); 
              try {
                if (navigator.share) {
                  await navigator.share({ title: food?.menuName || food?.title || "", text: food?.detailedDescription || food?.shortDescription || food?.description || "", url: window.location.href });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                }
              } catch (_) {}
            }} style={{ width: 44, height: 44, borderRadius: "50%", background: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", outline: "none", cursor: "pointer" }}>
              <Share2 size={20} color={theme === "dark" ? "#FFFFFF" : "#111111"} />
            </button>
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
          <h1 style={{
            fontSize: "clamp(2rem, 8vw, 2.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: FG,
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
            fontFamily: '"Cormorant Garamond", "Playfair Display", serif',
            textTransform: "capitalize"
          }}>
            {title}
          </h1>
          <div style={{
            fontSize: "14px",
            color: "#0097B2",
            margin: "0 0 16px 0",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontFamily: '"Inter", sans-serif'
          }}>
            {food?.shortDescription || "Authentic Taste Experience"}
          </div>
        </div>


      </section>
    );
  }

  return (
    <section className="hero-section-wrapper" style={{ background: BG, height: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", padding: "120px 0 60px", boxSizing: "border-box" }}>
      {/* Hero Back Button */}
      <button
        type="button"
        className="premium-back-button"
        onClick={() => history.goBack()}
        aria-label="Go back"
        style={{ zIndex: 10 }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Share Button absolute overlays */}
      <div style={{ position: "absolute", top: isMobile ? 90 : 96, right: isMobile ? 20 : 60, zIndex: 200, display: "flex", alignItems: "center", gap: 12 }}>
        <Favorite itemType="food" itemId={id}>
          {({ saved, pending, onClick }) => {
            return (
              <motion.button
                onClick={(e) => { e.stopPropagation(); onClick(e); }}
                whileHover="hover"
                initial="initial"
                whileTap={{ scale: 0.86 }}
                style={{
                  height: 44,
                  borderRadius: 22,
                  background: theme === "dark" ? "#141414" : "#FFFFFF",
                  border: `1.5px solid ${theme === "dark" ? `${A}66` : `${A}4D`}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  boxShadow: "0 6px 18px rgba(15,15,15,0.12)",
                  cursor: "pointer",
                  maxWidth: 44, // Initial width
                  overflow: "hidden",
                  paddingLeft: 12,
                  paddingRight: 12,
                  transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), padding-right 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, background 0.35s ease, border-color 0.35s ease",
                  pointerEvents: "auto",
                  position: "relative",
                  zIndex: 200,
                  outline: "none"
                }}
                variants={{
                  hover: {
                    maxWidth: 160,
                    paddingRight: 16,
                    borderColor: A,
                    boxShadow: `0 0 18px ${A}33, 0 8px 28px rgba(15,15,15,0.14)`,
                  }
                }}
              >
                <motion.span
                  variants={{
                    hover: { y: 0, rotate: 360, scale: 1.15 },
                    initial: { y: 0, rotate: 0, scale: 1 }
                  }}
                  transition={{ rotate: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 0.3 } }}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, position: "relative" }}
                >
                  <Heart size={20} color="#0097B2" fill={saved ? "#0097B2" : "none"} />
                </motion.span>
                <motion.span
                  variants={{
                    hover: { maxWidth: 130, opacity: 1, marginLeft: 8 },
                    initial: { maxWidth: 0, opacity: 0, marginLeft: 0 }
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    position: "relative",
                    color: theme === "dark" ? FG : A,
                    fontFamily: '"Inter", sans-serif',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  {pending ? (saved ? "Removing..." : "Saving...") : (saved ? "Saved" : "Save")}
                </motion.span>
              </motion.button>
            );
          }}
        </Favorite>
        <HeroShareFab
          title={food?.menuName || food?.title || ""}
          text={food?.detailedDescription || food?.shortDescription || food?.description || ""}
          url={window.location.href}
        />
      </div>

      {/* Header Blending Gradient */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: `linear-gradient(to bottom, ${BG}, transparent)`, zIndex: 5, pointerEvents: "none" }} />
      
      <div className="bento-grid-container" style={{ position: "relative", zIndex: 6 }}>
        {/* Card 1: Signature Dish Main Card (2x2) */}
        <div className="bento-card bento-span-2-2">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <AnimatePresence mode="wait">
                <motion.img
                  key={idx}
                  src={items[idx]}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  alt={title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                />
              </AnimatePresence>
              
              {/* Linear dark gradient overlay for white text visibility */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0.85) 100%)",
                zIndex: 1,
                pointerEvents: "none"
              }} />

              {/* Category in top left */}
              <div style={{
                position: "absolute",
                top: 24,
                left: 24,
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontFamily: '"Inter", sans-serif',
                zIndex: 2
              }}>
                {category}
              </div>

              {/* Title & Cuisine in bottom left */}
              <div style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                right: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 2
              }}>
                <Rev>
                  <h1 className="hero-title" style={{
                    fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    margin: 0,
                    letterSpacing: "-0.02em",
                    fontFamily: '"Cormorant Garamond", "Playfair Display", serif'
                  }}>
                    {title}
                  </h1>
                </Rev>
                <Rev delay={0.15}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", fontSize: "14px", fontWeight: 500 }}>
                    <Globe size={15} color={A || "#0097B2"} />
                    <span>{source}</span>
                  </div>
                </Rev>
              </div>
            </div>
            <div className="flip-card-back image-card">
              <img src={items[(idx + 1) % items.length] || items[0]} alt="Signature alternative view" />
              
              {/* Linear dark gradient overlay for white text visibility */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0.85) 100%)",
                zIndex: 1,
                pointerEvents: "none"
              }} />

              {/* Category in top left */}
              <div style={{
                position: "absolute",
                top: 24,
                left: 24,
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontFamily: '"Inter", sans-serif',
                zIndex: 2
              }}>
                {category}
              </div>

              {/* Title & Cuisine in bottom left */}
              <div style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                right: 24,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 2
              }}>
                <Rev>
                  <h1 className="hero-title" style={{
                    fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    margin: 0,
                    letterSpacing: "-0.02em",
                    fontFamily: '"Cormorant Garamond", "Playfair Display", serif'
                  }}>
                    {title}
                  </h1>
                </Rev>
                <Rev delay={0.15}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", fontSize: "14px", fontWeight: 500 }}>
                    <Globe size={15} color={A || "#0097B2"} />
                    <span>{source}</span>
                  </div>
                </Rev>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Cuisine Explore (1x1) */}
        <div className="bento-card bento-span-1-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[1] || items[0]} alt="Explore cuisine view" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[2] || items[0]} alt="Cuisine layout detail" />
            </div>
          </div>
        </div>

        {/* Card 3: Cost & Dietary (1x1) */}
        <div className="bento-card bento-span-1-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[2] || items[0]} alt="Cost and dietary preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[3] || items[0]} alt="Dietary view details" />
            </div>
          </div>
        </div>

        {/* Card 4: Horizontal Story Card (2x1) */}
        <div className="bento-card bento-span-2-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[3] || items[0]} alt="Story behind the dish" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[4] || items[0]} alt="Gourmet detail" />
            </div>
          </div>
        </div>

        {/* Card 5: Gallery Image 4 (1x1) */}
        <div className="bento-card bento-span-1-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[4] || items[0]} alt="Culinary composition" />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[5] || items[0]} alt="Preparation detail" />
            </div>
          </div>
        </div>

        {/* Card 6: Operating Hours & Days (1x1) */}
        <div className="bento-card bento-span-1-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[5] || items[1] || items[0]} alt="Operating hours backdrop" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[6] || items[0]} alt="Seating environment details" />
            </div>
          </div>
        </div>

        {/* Card 7: Gallery Image 5 (1x1) */}
        <div className="bento-card bento-span-1-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[6] || items[2] || items[0]} alt="Gourmet detail" />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[7] || items[0]} alt="Close-up crop presentation" />
            </div>
          </div>
        </div>

        {/* Card 8: Service & Origin (1x1) */}
        <div className="bento-card bento-span-1-1">
          <div className="flip-card-inner">
            <div className="flip-card-front image-card">
              <img src={items[7] || items[3] || items[0]} alt="Service option details" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="flip-card-back image-card">
              <img src={items[0]} alt="Origin representation backdrop" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Background Patterns */}
      <div style={{ position: "absolute", top: "8%", left: "1%", opacity: 0.08, zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 6px)", gap: 12 }}>
          {Array(25).fill(0).map((_, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: FG }} />)}
        </div>
      </div>
    </section>
  );
}

function CulinaryNarrative({ food, hostData, hostAvatar }) {
  const { isMobile } = useWindowSize();
  const { tokens } = useTheme();
  const { A, FG, M, BG, S, B, AL } = tokens;

  const chefName = hostData?.host?.firstName 
    ? `${hostData.host.firstName} ${hostData.host.lastName || ''}`.trim() 
    : (hostData?.host?.displayName || hostData?.displayName || food?.host?.displayName || "Master Chef");

  const chefStory = hostData?.host?.bio || hostData?.bio || food?.chefOwnerStory || food?.chefStory || food?.ownerStory || food?.story || food?.host?.about || "Our culinary philosophy is rooted in heritage and innovation.";

  return (
    <section className="narrative-section" style={{ background: BG, padding: isMobile ? "32px 24px" : "32px 80px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Short Description as Heading */}
        <div style={{ textAlign: "center", maxWidth: 900, margin: "0 auto 60px auto" }}>
          <span style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 800, display: "block", marginBottom: 16 }}>The Philosophy</span>
          <h2 className="font-cursive" style={{ fontSize: isMobile ? "36px" : "54px", color: FG, lineHeight: 1.2, margin: 0, fontStyle: "italic" }}>
            "{food?.shortDescription || "A curated preview of the palate notes."}"
          </h2>
          <div style={{ width: 60, height: 2, background: A, margin: "24px auto 0 auto" }} />
        </div>

        {/* 2-Column Grid: Detailed Description & Chef's Story */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: isMobile ? "32px" : "48px",
          alignItems: "stretch"
        }}>
          
          {/* Detailed Description: The Alchemy */}
          <Rev delay={0.1} style={{ display: "flex" }}>
            <motion.div
              whileHover={{
                scale: 1.015,
                borderColor: A,
                boxShadow: `0 20px 48px ${AL}`
              }}
              transition={{ duration: 0.35, ease: E }}
              style={{
                background: AL,
                border: `1.5px solid ${A}33`,
                borderRadius: 28,
                padding: 36,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: `0 12px 30px ${AL}`,
                cursor: "pointer",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease"
              }}
            >
              <div>
                <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 800 }}>The Alchemy</span>
                <h4 className="font-display" style={{ fontSize: 22, color: FG, marginTop: 12, marginBottom: 20 }}>Detailed Description</h4>
                <p style={{ fontSize: 14.5, color: FG, lineHeight: 1.85, margin: 0, opacity: 0.9 }}>
                  {food?.detailedDescription || food?.description || "Experience the perfect harmony of seasonal ingredients, local spices, and refined culinary design."}
                </p>
              </div>
              <Sparkles size={20} color={A} style={{ opacity: 0.3, marginTop: 24 }} />
            </motion.div>
          </Rev>

          {/* Chef's Story: The Creator */}
          <Rev delay={0.2} style={{ display: "flex" }}>
            <motion.div
              whileHover={{
                scale: 1.015,
                borderColor: A,
                boxShadow: `0 20px 48px ${AL}`
              }}
              transition={{ duration: 0.35, ease: E }}
              style={{
                background: S,
                border: `1.5px solid ${B}`,
                borderRadius: 28,
                padding: 36,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                cursor: "pointer",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease"
              }}
            >
              <div style={{ position: "absolute", top: 16, right: 32, fontSize: 80, color: A, opacity: 0.12, fontFamily: "serif" }}>&ldquo;</div>
              <div>
                <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 800 }}>The Creator</span>
                <h4 className="font-display" style={{ fontSize: 22, color: FG, marginTop: 12, marginBottom: 20 }}>Chef's Story</h4>
                <p style={{ fontSize: 13.5, color: M, lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>
                  {chefStory}
                </p>
              </div>
              <div style={{ marginTop: 24, borderTop: `1px solid ${B}`, paddingTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
                {hostAvatar && (
                  <img src={hostAvatar} alt={chefName} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${A}` }} />
                )}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: FG, display: "block" }}>{chefName}</span>
                  <span className="font-cursive" style={{ fontSize: 18, color: A, display: "block", marginTop: 2 }}>- Chef Owner</span>
                </div>
              </div>
            </motion.div>
          </Rev>

        </div>
      </div>
    </section>
  );
}


function LocationSection({ food }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, B, W } } = useTheme();

  return (
    <section className="prep-section" style={{ background: W, padding: isMobile ? "32px 24px" : "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "45fr 55fr", gap: isMobile ? 32 : 64 }} className="prep-grid">
          <Rev delay={0.1} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 32, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>Where it All Happens</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ background: W, border: `1px solid ${B}`, height: 280, position: "relative", overflow: "hidden", borderRadius: 16 }}>
                  <div style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    zIndex: 10,
                    background: W,
                    padding: "10px 16px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${B}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    pointerEvents: "none"
                  }}>
                    <MapPin size={16} color={A} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{food?.meetingLocationName || "The Grand Atrium"}</span>
                  </div>
                  {(() => {
                    const lat = food?.meetingLatitude || food?.latitude;
                    const lng = food?.meetingLongitude || food?.longitude;
                    const address = food?.meetingAddress || food?.address;
                    const srcUrl = (lat && lng)
                      ? `https://maps.google.com/maps?ll=${lat},${lng}&hl=en&z=14&output=embed`
                      : (address ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=en&z=14&output=embed` : null);

                    return (
                      <>
                        {srcUrl ? (
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={srcUrl}
                            allowFullScreen
                            title="Meeting Location"
                          />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}18 1px,transparent 1px),linear-gradient(90deg,${A}18 1px,transparent 1px)`, backgroundSize: "20px 20px" }} />
                        )}
                        {/* Radar pulse animation overlaid on top of the map background */}
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: A, borderRadius: "50%", pointerEvents: "none", zIndex: 5 }}>
                          <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", inset: "-6px", border: `2px solid ${A}`, borderRadius: "50%" }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </Rev>
          <Rev delay={0.2} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 32, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>Where it is</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 280, margin: 0, padding: 0 }}>
                  {(food?.meetingAddress || food?.address) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Address</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{food.meetingAddress || food.address}</span>
                    </li>
                  )}

                  {(food?.meetingLandmark || food?.nearestLandmark || food?.landmark) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Landmark</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{food.meetingLandmark || food.nearestLandmark || food.landmark}</span>
                    </li>
                  )}

                  {(food?.meetingDistrict || food?.district) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>District</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{food.meetingDistrict || food.district}</span>
                    </li>
                  )}

                  {(food?.meetingState || food?.state || food?.city) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>State</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{food.meetingState || food.state || food.city}</span>
                    </li>
                  )}

                  {(food?.meetingCountry || food?.country) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Country</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{food.meetingCountry || food.country}</span>
                    </li>
                  )}

                  {(food?.meetingInstructions || food?.directions) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Instructions</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{food.meetingInstructions || food.directions}</span>
                    </li>
                  )}
                  {(!food?.meetingDistrict && !food?.meetingState && !food?.meetingCountry && !food?.meetingAddress && !food?.meetingLandmark && !food?.address && !food?.nearestLandmark && !food?.landmark) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 16 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Region</span>
                      <span style={{ fontSize: 14, color: M, fontWeight: 500 }}>Specific regional details will be provided upon booking confirmation.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}




function ReservationNoir({ food, hostData, hostAvatar }) {
  const { isMobile } = useWindowSize();
  const { tokens, theme } = useTheme();
  const { A, FG, M, W, B, S, AL } = tokens;

  const chefName = hostData?.host?.firstName
    ? `${hostData.host.firstName} ${hostData.host.lastName || ''}`.trim()
    : (hostData?.host?.displayName || hostData?.displayName || food?.host?.displayName || "Owner");

  const phoneNum = hostData?.host?.phone || hostData?.host?.phoneNumber || hostData?.phone || food?.host?.phone;

  const websiteUrl = food?.website;
  const instaHandle = food?.instagramHandle || food?.instagram || food?.host?.instagram;

  return (
    <section id="reservation-inquiries" className="reservation-section-wrapper" style={{ background: tokens.BG, padding: isMobile ? "32px 24px" : "32px 80px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Soul y={80}>
          <div style={{
            background: S,
            border: `1px solid ${B}`,
            borderRadius: 36,
            padding: isMobile ? "32px 20px" : "48px 56px",
            boxShadow: theme === "dark" ? "0 20px 48px rgba(0, 0, 0, 0.3)" : "0 20px 48px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 36 : 56, alignItems: "center", justifyContent: "space-between" }}>
              {/* Profile details */}
              <div style={{ display: "flex", gap: 24, alignItems: "center", flex: 1, flexDirection: isMobile ? "column" : "row", textAlign: isMobile ? "center" : "left" }}>
                <div style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: `3px solid ${A}`,
                  boxShadow: `0 8px 24px ${AL}`,
                  overflow: "hidden",
                  flexShrink: 0
                }}>
                  <img
                    src={hostAvatar || "https://picsum.photos/seed/host/200/200"}
                    alt={chefName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, display: "block", marginBottom: 6 }}>Managed By</span>
                  <h3 className="font-display" style={{ fontSize: "24px", fontWeight: 700, color: FG, margin: "0 0 6px 0" }}>{chefName}</h3>
                  <p style={{ fontSize: 13, color: M, margin: "0 0 16px 0", lineHeight: 1.5 }}>
                    Connect directly to request custom menu options, dietary modifications, or private culinary experiences.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, borderTop: `1px solid ${B}`, paddingTop: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: FG }}>
                      <ChefHat size={14} color={A} />
                      <span style={{ color: M, fontWeight: 600 }}>Manager:</span>
                      <span>{chefName}</span>
                    </div>
                    {phoneNum && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: FG }}>
                        <Phone size={14} color={A} />
                        <span style={{ color: M, fontWeight: 600 }}>Phone:</span>
                        <span>{phoneNum}</span>
                      </div>
                    )}
                    {websiteUrl && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: FG }}>
                        <Globe size={14} color={A} />
                        <span style={{ color: M, fontWeight: 600 }}>Website:</span>
                        <a href={websiteUrl} target="_blank" rel="noreferrer" style={{ color: A, textDecoration: "none" }}>{websiteUrl}</a>
                      </div>
                    )}
                    {instaHandle && instaHandle !== "@culinary_craft" && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: FG }}>
                        <Instagram size={14} color={A} />
                        <span style={{ color: M, fontWeight: 600 }}>Instagram:</span>
                        <a href={`https://instagram.com/${instaHandle.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ color: A, textDecoration: "none" }}>{instaHandle}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minWidth: isMobile ? "100%" : "300px",
                flexShrink: 0
              }}>
                {phoneNum && (
                  <motion.a
                    whileHover={{ scale: 1.02, borderColor: A }}
                    whileTap={{ scale: 0.98 }}
                    href={`tel:${phoneNum}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 20px",
                      borderRadius: 14,
                      border: `1.5px solid ${B}`,
                      background: AL,
                      color: FG,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "border-color 0.25s ease"
                    }}
                  >
                    <Phone size={18} color={A} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 9, letterSpacing: "0.05em", textTransform: "uppercase", color: M, fontWeight: 700, lineHeight: 1 }}>Call Host</span>
                      <span style={{ marginTop: 2 }}>{phoneNum}</span>
                    </div>
                  </motion.a>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  {websiteUrl && (
                    <motion.a
                      whileHover={{ scale: 1.02, backgroundColor: A, color: "#fff", borderColor: A }}
                      whileTap={{ scale: 0.98 }}
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "12px",
                        borderRadius: 12,
                        border: `1.5px solid ${A}`,
                        color: A,
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        textAlign: "center",
                        transition: "all 0.25s ease"
                      }}
                    >
                      <Globe size={15} /> Website
                    </motion.a>
                  )}

                  {instaHandle && instaHandle !== "@culinary_craft" && (
                    <motion.a
                      whileHover={{ scale: 1.02, backgroundColor: A, color: "#fff", borderColor: A }}
                      whileTap={{ scale: 0.98 }}
                      href={`https://instagram.com/${instaHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "12px",
                        borderRadius: 12,
                        border: `1.5px solid ${A}`,
                        color: A,
                        textDecoration: "none",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        textAlign: "center",
                        transition: "all 0.25s ease"
                      }}
                    >
                      <Instagram size={15} /> Instagram
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Soul>
      </div>
    </section>
  );
}

/* ─── METADATA DETAILS CARD ─────────── */
function FoodMetadataCard({ food }) {
  const { tokens, theme } = useTheme();
  const { isMobile } = useWindowSize();
  
  const cuisine = Array.isArray(food?.cuisineTypeNames) ? food.cuisineTypeNames.join(", ") : (food?.cuisineTypeNames || food?.cuisineType?.displayName || "Gourmet");
  const category = toDisplayString(food?.category) || "Main Course";
  const dietary = Array.isArray(food?.dietaryOptionNames) ? food.dietaryOptionNames.join(", ") : (food?.dietaryOptionNames || (food?.isVeg ? "Vegetarian" : "Non-Vegetarian"));
  const serveModeNames = food?.serveModeNames || food?.serviceModeNames || [];
  const serveMode = Array.isArray(serveModeNames) && serveModeNames.length > 0
    ? serveModeNames.join(", ")
    : (food?.serviceMode || food?.serveMode || "Dine-In");

  const openDays = useMemo(() => {
    const dayMap = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7 };
    const rawDays = Array.isArray(food?.openingDays) ? [...food.openingDays].sort((a, b) => (dayMap[a] || 0) - (dayMap[b] || 0)) : [];

    if (rawDays.length === 0) return "Daily Service";
    if (rawDays.length === 7) return "Everyday";

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

  const getPriceTier = (priceRange) => {
    const pr = String(priceRange || "").toLowerCase();
    if (pr.includes("budget") || pr.includes("low") || pr.includes("cheap")) return 1;
    if (pr.includes("premium") || pr.includes("high") || pr.includes("luxury") || pr.includes("expensive")) return 3;
    return 2; // Gourmet / Medium Default
  };

  const tier = getPriceTier(food?.priceRange);
  const priceTierLabel = tier === 1 ? "Budget Friendly" : tier === 3 ? "Premium Dining" : "Gourmet Standard";

  return (
    <div style={{ maxWidth: 1320, margin: isMobile ? "24px auto 16px" : "36px auto 20px", padding: isMobile ? "0 24px" : "0 80px" }}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          scale: 1.002,
          borderColor: tokens.A,
          boxShadow: `0 20px 40px ${tokens.AL}`
        }}
        style={{
          background: tokens.S,
          border: `1px solid ${tokens.B}`,
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease"
        }}
      >
        {/* Left Side: Main Ticket Body (3x2 horizontal grid flow) */}
        <div style={{ flex: 1.9, padding: isMobile ? "20px 16px" : "28px 36px", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "20px 24px" }}>
            
            {/* Card 1: Category */}
            <motion.div
              whileHover={{ scale: 1.02, borderColor: tokens.A, boxShadow: `0 8px 16px ${tokens.AL}` }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                borderRadius: "14px",
                border: `1px solid ${tokens.B}`,
                background: theme === "dark" ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.005)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A, flexShrink: 0 }}>
                <ChefHat size={18} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Category</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: tokens.FG, lineHeight: 1.2 }}>{category}</span>
              </div>
            </motion.div>

            {/* Card 2: Cuisine */}
            <motion.div
              whileHover={{ scale: 1.02, borderColor: tokens.A, boxShadow: `0 8px 16px ${tokens.AL}` }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                borderRadius: "14px",
                border: `1px solid ${tokens.B}`,
                background: theme === "dark" ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.005)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A, flexShrink: 0 }}>
                <Utensils size={18} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Cuisine</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: tokens.FG, lineHeight: 1.2 }}>{cuisine}</span>
              </div>
            </motion.div>

            {/* Card 3: Dietary Options */}
            <motion.div
              whileHover={{ scale: 1.02, borderColor: tokens.A, boxShadow: `0 8px 16px ${tokens.AL}` }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                borderRadius: "14px",
                border: `1px solid ${tokens.B}`,
                background: theme === "dark" ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.005)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A, flexShrink: 0 }}>
                <Leaf size={18} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Dietary Options</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: tokens.FG, lineHeight: 1.2 }}>{dietary}</span>
              </div>
            </motion.div>

            {/* Card 4: Service Mode */}
            <motion.div
              whileHover={{ scale: 1.02, borderColor: tokens.A, boxShadow: `0 8px 16px ${tokens.AL}` }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                borderRadius: "14px",
                border: `1px solid ${tokens.B}`,
                background: theme === "dark" ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.005)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A, flexShrink: 0 }}>
                <Zap size={18} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Service Mode</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: tokens.FG, lineHeight: 1.2 }}>{serveMode}</span>
              </div>
            </motion.div>

            {/* Card 5: Alcohol Served */}
            <motion.div
              whileHover={{ scale: 1.02, borderColor: tokens.A, boxShadow: `0 8px 16px ${tokens.AL}` }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                borderRadius: "14px",
                border: `1px solid ${tokens.B}`,
                background: theme === "dark" ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.005)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A, flexShrink: 0 }}>
                <GlassWater size={18} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Alcohol Served</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: tokens.FG, lineHeight: 1.2 }}>{food?.alcoholServed || food?.isAlcoholServed ? "Alcohol Served" : "No Alcohol"}</span>
              </div>
            </motion.div>

            {/* Card 6: Parking Available */}
            <motion.div
              whileHover={{ scale: 1.02, borderColor: tokens.A, boxShadow: `0 8px 16px ${tokens.AL}` }}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                borderRadius: "14px",
                border: `1px solid ${tokens.B}`,
                background: theme === "dark" ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.005)",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "10px", background: tokens.AL, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A, flexShrink: 0 }}>
                <MapPin size={18} />
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Parking Slot</span>
                <span style={{ fontWeight: 700, fontSize: "14px", color: tokens.FG, lineHeight: 1.2 }}>{food?.isParkingAvailable || food?.parkingAvailable ? "Parking Available" : "Street Parking"}</span>
              </div>
            </motion.div>

          </div>

          {/* Barcode / Ticket Bottom Accent */}
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", borderTop: `1px solid ${tokens.M}`, paddingTop: "14px", marginTop: "auto" }}>
            <div style={{ display: "flex", gap: "2.5px", height: "16px", opacity: 0.45, alignItems: "center" }}>
              {[2, 1, 3, 1, 1, 4, 2, 1, 2, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1].map((w, i) => (
                <div key={i} style={{ width: w, height: "100%", background: tokens.FG }} />
              ))}
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div style={{
          width: isMobile ? "100%" : "1px",
          height: isMobile ? "1px" : "auto",
          borderLeft: isMobile ? "none" : `2px dashed ${tokens.M}`,
          borderTop: isMobile ? `2px dashed ${tokens.M}` : "none",
          position: "relative",
          margin: isMobile ? "0" : "20px 0",
          zIndex: 5
        }}>
          {/* Top/Left Cutout */}
          <div style={{
            position: "absolute",
            top: isMobile ? -12 : -32,
            left: isMobile ? -12 : -13,
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: tokens.BG,
            borderBottom: isMobile ? "none" : `1px solid ${tokens.B}`,
            borderRight: isMobile ? `1px solid ${tokens.B}` : "none",
            zIndex: 10
          }} />
          {/* Bottom/Right Cutout */}
          <div style={{
            position: "absolute",
            top: isMobile ? -12 : "auto",
            bottom: isMobile ? "auto" : -32,
            right: isMobile ? -12 : "auto",
            left: isMobile ? "auto" : -13,
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: tokens.BG,
            borderTop: isMobile ? "none" : `1px solid ${tokens.B}`,
            borderLeft: isMobile ? `1px solid ${tokens.B}` : "none",
            zIndex: 10
          }} />
        </div>

        {/* Right Side: Access Stub */}
        <div style={{
          flex: 1.1,
          padding: isMobile ? "24px 16px" : "28px 32px",
          background: theme === "dark" ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.012)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "24px",
          borderTop: "none"
        }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", color: tokens.A, letterSpacing: "0.15em" }}>Access Stub</span>
            
            {/* Pricing Group */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: tokens.M, textTransform: "uppercase", letterSpacing: "0.05em" }}>Price Range</span>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[1, 2, 3].map((tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: tIdx <= tier ? tokens.A : tokens.M + "33"
                      }}
                    >
                      ₹
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: tokens.FG }}>{priceTierLabel}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: tokens.M, textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg Cost / One</span>
                <span style={{ fontSize: "24px", fontWeight: 800, color: tokens.A, letterSpacing: "-0.02em" }}>
                  {food?.averageCostForOne ? `₹${food.averageCostForOne}` : "₹450"}
                </span>
              </div>
            </div>

            {/* Divider between Pricing and Schedule */}
            <div style={{ height: "1px", borderTop: `1px solid ${tokens.B}`, margin: "20px 0" }} />

            {/* Scheduling Group */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Days */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Calendar size={16} color={tokens.A} style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Service Days</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: tokens.FG, lineHeight: 1.2 }}>{openDays}</span>
                </div>
              </div>

              {/* Hours */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Clock size={16} color={tokens.A} style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: tokens.M, letterSpacing: "0.05em", lineHeight: 1.1 }}>Hours of Service</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: tokens.FG, lineHeight: 1.2 }}>
                    {food?.openingTime || "11:00 AM"} - {food?.closingTime || "08:30 PM"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────── */
const FoodDetails = () => {
  const { theme, tokens } = useTheme();
  const { A, FG, M, BG, W, B, AL } = tokens;

  const { isMobile } = useWindowSize();
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
            getHostContent(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));
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
      {!isMobile && <DetailPageNavPortal activeCategory="food" />}

      <CulinaryHero food={food} galleryItems={galleryItems} />

      <CulinaryNarrative food={food} hostData={hostData} hostAvatar={hostAvatar} />

      {/* TAGS MARQUEE SECTION */}
      {(() => {
        const rawTags = Array.isArray(food?.tags) && food?.tags.length > 0
          ? food.tags.map((t) => (typeof t === "string" ? t : t?.name || t?.tag || t?.label || t?.value || "")).filter(Boolean)
          : typeof food?.tags === "string" && food?.tags.trim() !== ""
            ? food.tags.split(",").map((s) => s.trim()).filter(Boolean)
            : ["Culinary Art", "Taste", "Philosophy", "Epicurean", "Experience", "Gastronomy"];
        
        // Duplicate to ensure infinite seamless scrolling loop
        const loopedTags = [...rawTags, ...rawTags, ...rawTags, ...rawTags, ...rawTags, ...rawTags];

        const estimatedTagWidth = (tag) => tag.length * 9.5 + 75; // text width + margin + icon + padding
        const tagsDistance = rawTags.reduce((sum, tag) => sum + estimatedTagWidth(tag), 0) * 3; // offset 50% is half of the clones
        const tagsDuration = tagsDistance / 60; // constant speed of 60px/s

        return (
          <div style={{
            margin: isMobile ? "0 -24px" : "0 -80px",
            overflow: "hidden",
            position: "relative",
            padding: "20px 0",
            background: theme === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
            borderTop: `1px solid ${B}`,
            borderBottom: `1px solid ${B}`,
          }}>
            {/* Left & Right Edge Fades */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: isMobile ? "60px" : "160px", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: isMobile ? "60px" : "160px", background: `linear-gradient(to left, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: tagsDuration }}
              style={{ display: "flex", alignItems: "center", width: "max-content" }}
            >
              {loopedTags.map((tag, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "24px",
                      whiteSpace: "nowrap",
                      marginRight: "32px"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: isEven ? 700 : 300,
                        color: isEven ? FG : M,
                        fontFamily: "Poppins, sans-serif",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        opacity: isEven ? 1 : 0.75
                      }}
                    >
                      {tag}
                    </span>
                    <Sparkles size={14} color="#08B5D6" fill="#08B5D6" style={{ opacity: 0.6 }} />
                  </div>
                );
              })}
            </motion.div>
          </div>
        );
      })()}

      <FoodMetadataCard food={food} />

      {(() => {
        const sigRaw = food?.whatsSpecial || "";
        const dishes = Array.isArray(sigRaw) 
          ? sigRaw 
          : (typeof sigRaw === "string" ? sigRaw.split(",") : []);
        const items = dishes.map(d => typeof d === "string" ? d.trim() : d?.name || d?.title || "").filter(Boolean);
        const marqueeItems = items.length > 0 ? items : ["Heritage Taste", "Liquid Alchemy", "Curated Palette", "Biological Response"];
        
        const loopedDishes = Array(12).fill(marqueeItems).flat();
        const estimatedDishWidth = (dish) => dish.length * 9.5 + 75;
        const dishesDistance = marqueeItems.reduce((sum, dish) => sum + estimatedDishWidth(dish), 0) * 6;
        const dishesDuration = dishesDistance / 60;

        return (
          <div style={{
            margin: isMobile ? "0 -24px" : "0 -80px",
            overflow: "hidden",
            position: "relative",
            padding: "20px 0",
            background: theme === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
            borderTop: `1px solid ${B}`,
            borderBottom: `1px solid ${B}`,
          }}>
            {/* Left & Right Edge Fades */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: isMobile ? "60px" : "160px", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: isMobile ? "60px" : "160px", background: `linear-gradient(to left, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: dishesDuration }}
              style={{ display: "flex", alignItems: "center", gap: 32, width: "max-content" }}
            >
              {loopedDishes.map((dish, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "24px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: isEven ? 700 : 300,
                        color: isEven ? FG : M,
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        opacity: isEven ? 1 : 0.75
                      }}
                    >
                      {dish}
                    </span>
                    <Sparkles size={14} color={A || "#0097B2"} fill={A || "#0097B2"} style={{ opacity: 0.6 }} />
                  </div>
                );
              })}
            </motion.div>
          </div>
        );
      })()}

      <LocationSection food={food} />

      <ReservationNoir food={food} hostData={hostData} hostAvatar={hostAvatar} />

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
