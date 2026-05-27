import React, { useEffect, useState, useMemo, createContext, useContext, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useLocation, useHistory, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  Wifi, Waves, Sparkles, Dumbbell, Umbrella, Plane, GlassWater, Utensils,
  Phone, Clock, FileText, MapPin, ChevronDown, CheckCircle, Info, Building,
  ArrowRight, ShieldCheck, Mail, Globe, Map, Navigation, ArrowDown, Car, AirVent,
  Users, DoorOpen, Bed, Bath, Maximize, Calendar, Star, Share2, Heart, ArrowLeft,
  Tv, Coffee, ChevronLeft
} from "lucide-react";
import moment from "moment";
import cn from "classnames";
import Page from "../../components/Page";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import RoomCards from "./RoomCards";
import { getStayDetails, getHost, createStayOrder, getStayReviews, getEligibleBookings, submitOrderReview } from "../../utils/api";
import StayBookingSystem from "./StayBookingSystem";
import { useTheme, THEMES } from "../../components/JUI/Theme";
import { Footer } from "../../components/JUI/Footer";
import Rating from "../../components/Rating";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import ShareButton from "../../components/ShareButton";
import { lockBodyScroll } from "../../utils/scrollLock";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const fixImageUrl = (url) => {
  if (!url) return "";
  let u = typeof url === 'string' ? url : (url.url || url.src || url.mediaUrl || url.coverImageUrl || url.coverPhotoUrl || "");
  if (!u || typeof u !== 'string') return "";
  return u.replace(/%25/g, '%');
};

const getStayLocationParts = (stay) => {
  const location = stay?.location || stay?.locationName || stay?.fullAddress || "";
  const city = stay?.city || stay?.locationCity || stay?.town || "";
  const cityArea = stay?.cityArea || "";
  const district = stay?.district || stay?.meetingDistrict || "";
  const state = stay?.state || stay?.province || stay?.region || "";
  const uniqueValues = [location, cityArea, city, district, state]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);

  return {
    location,
    cityArea,
    city,
    district,
    state,
    heroText:
      [cityArea, district, state]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
        .join(", ") ||
      [cityArea, state]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
        .join(", ") ||
      [city, state]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
        .join(", ") ||
      uniqueValues.slice(-2).join(", "),
  };
};

const E = [0.22, 1, 0.36, 1];


function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
  });

  useEffect(() => {
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
    .stay-details-premium {
      font-family: var(--font-inter, system-ui, sans-serif);
      overflow-x: hidden;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    
    .stay-details-premium .font-display { font-family: var(--font-fraunces, Georgia, serif); }
    .stay-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .stay-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    
    .shimmer-cta {
      position: relative;
      overflow: hidden;
      background: var(--FG);
      color: var(--BG);
      font-weight: 700;
      border-radius: 12px;
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .shimmer-cta::after {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
      transform: rotate(45deg);
      animation: shimmer 3s infinite linear;
    }
    @keyframes shimmer { from { transform: translate(-50%,-50%) rotate(45deg); } to { transform: translate(50%,50%) rotate(45deg); } }
    @keyframes propertyCoverShimmer {
      0% { transform: translateX(-120%); }
      100% { transform: translateX(120%); }
    }
    @keyframes propertyCoverFloat {
      0%, 100% { transform: scale(1) translateY(0px); }
      50% { transform: scale(1.015) translateY(-2px); }
    }

    @media(max-width:768px){
      .stay-details-premium .desk-only { display: none !important; }
      .pol-contact-grid, .amenities-grid, .location-grid, .reviews-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .property-stay-card { grid-template-columns: 1fr !important; }
    }
    
    @media(max-width:480px){
      .stay-details-premium .section-padding { padding: 60px 20px !important; }
    }
  `}</style>
);

/* ─── UTILS ─────────── */
const toDisplayString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.displayName || value.name || value.title || value.code || "";
  }
  return String(value);
};

/* ─── UI COMPONENTS ─────────── */
// Cursor component removed

function ProgressBar() {
  const { tokens: { A } } = useTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: A, zIndex: 9996 }} />
  );
}

function Rev({ children, delay = 0, style = {}, className = "" }) {
  const r = useRef(null);
  const v = useInView(r, { once: true, margin: "-60px" });
  return (
    <motion.div ref={r} initial={{ opacity: 0, y: 44 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: E, delay }} style={style} className={className}>
      {children}
    </motion.div>
  );
}

function Chars({ text, cls = "", style = {}, delay = 0 }) {
  const r = useRef(null);
  const v = useInView(r, { once: true, margin: "-40px" });
  let charIdx = 0;
  return (
    <div ref={r} className={cls} style={style}>
      {text?.split(" ").map((word, wIdx, arr) => (
        <span key={wIdx} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {word.split("").map((c, i) => {
            const currentIdx = charIdx++;
            return (
              <motion.span key={i} initial={{ y: "105%", opacity: 0 }} animate={v ? { y: 0, opacity: 1 } : {}} transition={{ duration: 0.7, ease: E, delay: delay + currentIdx * 0.028 }} style={{ display: "inline-block" }}>
                {c}
              </motion.span>
            );
          })}
          {wIdx < arr.length - 1 && (
            <motion.span initial={{ y: "105%", opacity: 0 }} animate={v ? { y: 0, opacity: 1 } : {}} transition={{ duration: 0.7, ease: E, delay: delay + (charIdx++) * 0.028 }} style={{ display: "inline-block", whiteSpace: "pre" }}>
              {" "}
            </motion.span>
          )}
        </span>
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
  const singleSet = items.join(sep) + sep;

  const trackRef = useRef(null);
  const x = useMotionValue(0);
  const [setW, setSetW] = useState(0);

  // Measure the width of one full set
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        const child = trackRef.current.firstElementChild;
        if (child) {
          // One "set" = the rendered width of items.length children
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
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} style={{ flex: 1, height: 1, background: B, transformOrigin: "left" }} />
    </Rev>
  );
}

/* ─── HERO SHARE FAB ─────────────────────────── */
function HeroShareFab({ title, text, url }) {
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
    } catch (_) { }
  };

  return (
    <motion.button
      className="premium-share-fab"
      onClick={handleShare}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.85, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.86 }}
      style={{
        position: "absolute",
        top: 96,
        right: 60,
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
        {copied ? "✓ Copied!" : "Share Escape"}
      </span>
    </motion.button>
  );
}

/* ─── STAY SECTIONS ─────────── */
function StayHeroCarousel({ stay, galleryItems = [] }) {
  const history = useHistory();
  const { width, isMobile } = useWindowSize();
  const { theme, tokens: { A, BG, FG, M, S, B, W } } = useTheme();
  const title = stay?.propertyName || stay?.title || "STAY EXPERIENCE";
  const items = galleryItems.slice(0, 5);
  const { heroText } = getStayLocationParts(stay);

  // Infinite Loop Logic for images only
  const x = useMotionValue(0);
  const speed = isMobile ? 0.015 : 0.03;

  useAnimationFrame((t, delta) => {
    const moveBy = (delta || 16) * speed;
    x.set(x.get() - moveBy);
  });

  const BentoGridImages = () => (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "repeat(3, 300px)"
        : "minmax(500px, 1.2fr) minmax(300px, 0.8fr) minmax(400px, 1fr)",
      gridTemplateRows: "1fr 1fr",
      gap: isMobile ? 12 : 24,
      height: "100%",
      width: isMobile ? "fit-content" : "100vw",
      padding: "0 12px",
      flexShrink: 0
    }}>
      <div style={{ gridArea: isMobile ? "1 / 1 / 3 / 2" : "1 / 1 / 3 / 2", borderRadius: isMobile ? 16 : 24, overflow: "hidden", border: `1px solid ${B}`, position: "relative" }}>
        <img src={fixImageUrl(items[0] || stay?.coverPhotoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)" }} />
      </div>
      <div style={{ borderRadius: isMobile ? 16 : 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[1])} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      </div>
      <div style={{ borderRadius: isMobile ? 16 : 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[2])} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      </div>
      <div style={{ gridArea: isMobile ? "1 / 3 / 3 / 4" : "1 / 3 / 3 / 4", borderRadius: isMobile ? 16 : 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[3] || items[0])} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      </div>
    </div>
  );

  const wrappedX = useTransform(x, (v) => {
    const W = isMobile ? 900 : window.innerWidth;
    return `${v % W}px`;
  });

  return (
    <section style={{ position: "relative", height: isMobile ? "70vh" : "85vh", background: BG, overflow: "hidden", padding: "0", zIndex: 50 }}>
      {/* Looping Image Track */}
      <motion.div style={{ x: wrappedX, display: "flex", height: "100%", width: "fit-content" }}>
        <BentoGridImages />
        <BentoGridImages />
        <BentoGridImages />
      </motion.div>

      {/* Static Fixed Text Overlay */}
      <div style={{
        position: "absolute",
        bottom: isMobile ? 20 : 80,
        left: isMobile ? 20 : 80,
        right: isMobile ? 20 : "auto",
        zIndex: 40,
        pointerEvents: "none"
      }}>
        <Rev delay={0.2}>
          <div style={{
            background: theme === 'dark' ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            padding: isMobile ? "20px 20px" : "40px 60px",
            borderRadius: isMobile ? 20 : 32,
            border: theme === 'dark' ? "1px solid rgba(255,255,255,0.1)" : `1px solid ${B}`,
            boxShadow: theme === 'dark' ? "0 20px 50px rgba(0,0,0,0.3)" : `0 20px 50px ${M}22`,
            boxSizing: "border-box",
            width: "100%"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isMobile ? 8 : 16 }}>
              <div style={{ width: isMobile ? 24 : 40, height: 1, background: A }} />
              <span style={{ fontSize: isMobile ? 8 : 10, letterSpacing: "0.4em", textTransform: "uppercase", color: A, fontWeight: 800 }}>{toDisplayString(stay?.propertyType) || "EXCEPTIONAL"}</span>
            </div>
            <h1 className="font-display" style={{ fontSize: isMobile ? "clamp(1.5rem, 6.5vw, 2rem)" : "clamp(2rem, 5vw, 5rem)", fontWeight: 800, color: theme === 'dark' ? "#FFF" : FG, lineHeight: 0.9, letterSpacing: "-0.03em", wordBreak: "break-word" }}>{title.toUpperCase()}</h1>
            <div style={{ marginTop: isMobile ? 12 : 24, display: "flex", alignItems: "center", gap: 8, color: theme === 'dark' ? "#FFF" : FG }}>
              <MapPin size={isMobile ? 14 : 18} />
              <span style={{ fontSize: isMobile ? 12 : 16, fontWeight: 700, letterSpacing: "0.1em" }}>{heroText || "Location not available"}</span>
            </div>
          </div>
        </Rev>
      </div>

      {/* Static Overlays: Luxury Badge */}
      {!isMobile && (
        <div style={{ position: "absolute", top: 60, left: 60, zIndex: 30, pointerEvents: "none" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ width: 90, height: 90 }}>
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
              <path id="badgePath" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="transparent" />
              <text style={{ fontSize: 7.5, fontWeight: 800, fill: A, textTransform: "uppercase", letterSpacing: "2.5px" }}>
                <textPath xlinkHref="#badgePath">Luxury Retreat — Premium Stay —</textPath>
              </text>
            </svg>
          </motion.div>
        </div>
      )}

      <button
        type="button"
        className="premium-back-button"
        onClick={() => history.goBack()}
        aria-label="Go back"
      >
        <ChevronLeft size={20} />
      </button>

      <HeroShareFab
        title={title}
        text={stay?.shortDescription || stay?.description || ""}
        url={window.location.href}
      />

    </section>
  );
}

function StayAmenities({ stay }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, S, B, W } } = useTheme();

  const iconMap = {
    "wifi": Wifi, "internet": Wifi, "broadband": Wifi,
    "pool": Waves, "swimming": Waves, "plunge": Waves, "jacuzzi": Waves, "hot tub": Waves,
    "spa": Sparkles, "wellness": Sparkles, "sauna": Sparkles, "massage": Sparkles,
    "gym": Dumbbell, "fitness": Dumbbell, "workout": Dumbbell,
    "beach": Umbrella, "sun": Umbrella, "cabana": Umbrella,
    "shuttle": Plane, "airport": Plane, "transfer": Plane, "transport": Plane,
    "bar": GlassWater, "drink": GlassWater, "cocktail": GlassWater, "lounge": GlassWater,
    "restaurant": Utensils, "dining": Utensils, "food": Utensils, "breakfast": Utensils,
    "parking": Car, "valet": Car, "garage": Car,
    "ac": AirVent, "air": AirVent, "cooling": AirVent, "climate": AirVent,
    "building": Building, "reception": Building, "concierge": Building, "front": Building,
    "map": Map, "tour": Map, "excursion": Map,
  };

  const getIcon = (label) => {
    const lower = (label || "").toLowerCase();
    for (const key of Object.keys(iconMap)) {
      if (lower.includes(key)) return iconMap[key];
    }
    return CheckCircle;
  };

  const extractList = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return arr.map(item => {
      if (typeof item === "string") return item;
      // Search for any common text-bearing key in the object
      return item?.name || item?.amenityName || item?.facilityName || item?.amenity || item?.facility || item?.label || item?.title || item?.value || "";
    }).filter(Boolean);
  };

  const dynamicAmenities = useMemo(() => {
    const list = stay?.amenities || stay?.propertyAmenities || stay?.stayAmenities || stay?.amenityList || [];
    return extractList(list);
  }, [stay]);

  const dynamicFacilities = useMemo(() => {
    const list = stay?.facilities || stay?.propertyFacilities || stay?.stayFacilities || stay?.facilityList || [];
    return extractList(list);
  }, [stay]);

  return (
    <section style={{ background: W, padding: isMobile ? "80px 16px" : "140px 36px", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="02" label="Facilities & Services" />
        <Soul y={isMobile ? 40 : 100} s={0.08}>
          <div className="amenities-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 40 : 80 }}>
            {/* Left Column: Descriptions */}
            <Rev>
              {(() => {
                const short = stay?.shortDescription || "";
                const baseTitleCls = "font-display";
                const baseTitleStyle = { fontSize: isMobile ? "clamp(1.6rem, 7vw, 2.2rem)" : "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, paddingBottom: "0.1em", marginBottom: 12, display: "block", overflow: "hidden", wordBreak: "break-word" };

                if (!short) return (
                  <>
                    <Chars text="A sanctuary redefined" cls={baseTitleCls} style={baseTitleStyle} />
                    <Chars text="at the water's edge." delay={0.12} cls={baseTitleCls} style={{ ...baseTitleStyle, color: A }} />
                  </>
                );
                const words = short.trim().split(" ");
                const mid = Math.ceil(words.length / 2);
                const line1 = words.slice(0, mid).join(" ");
                const line2 = words.slice(mid).join(" ");
                return (
                  <>
                    <Chars text={line1} cls={baseTitleCls} style={baseTitleStyle} />
                    {line2 && <Chars text={line2} delay={0.12} cls={baseTitleCls} style={{ ...baseTitleStyle, color: A }} />}
                  </>
                );
              })()}
              <p style={{ fontSize: 16, color: M, lineHeight: 1.85, marginTop: 24 }}>
                {stay?.detailedDescription || stay?.description || "Experience the pinnacle of hospitality where architecture meets the raw beauty of nature."}
              </p>
            </Rev>

            {/* Right Column: Amenities & Facilities */}
            <div>
              {dynamicFacilities.length > 0 && (
                <Rev delay={0.2}>
                  <div style={{ paddingBottom: 16, borderBottom: `1px solid ${B}`, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                    <Building size={18} color={A} />
                    <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: FG, fontWeight: 700 }}>Facilities & Services</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "24px 32px" }}>
                    {dynamicFacilities.map((label, i) => {
                      const IconComp = getIcon(label);
                      return (
                        <motion.div key={i} whileHover={{ x: 6 }} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: S, border: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <IconComp size={16} color={A} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>{label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </Rev>
              )}
            </div>
          </div>
        </Soul>
      </div>
    </section>
  );
}

function ImgParallax({ src, alt }) {
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  return (
    <div ref={r} style={{ width: "100%", height: "124%", position: "absolute", top: "-12%", left: 0 }}>
      <motion.img src={src} style={{ y, width: "100%", height: "100%", objectFit: "cover" }} alt={alt} />
    </div>
  );
}

function PolicyItem({ rule, A, FG, M, B, S }) {
  const [op, setOp] = useState(false);
  const hasQuestions = Array.isArray(rule.questions) && rule.questions.length > 0;

  return (
    <motion.div key={rule.id} style={{ borderBottom: `1px solid ${B}` }}>
      <button onClick={() => setOp(!op)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "30px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <FileText size={20} color={op ? A : M} />
          <motion.span animate={{ color: op ? A : FG }} style={{ fontSize: 16, fontWeight: 700 }}>{rule.title}</motion.span>
        </div>
        <motion.div animate={{ rotate: op ? 180 : 0 }} transition={{ duration: 0.4 }}>
          <ChevronDown size={18} color={M} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {op && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: E }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 40px 64px", maxWidth: 640 }}>
              {hasQuestions ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rule.questions.map((q, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 14, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{q.title || q.question?.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: M, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{rule.body}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StayPoliciesAndContact({ stay, hostData, hostAvatar }) {
  const history = useHistory();
  const { isMobile } = useWindowSize();
  const { tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();
  const hostProfileId =
    hostData?.host?.hostId ||
    hostData?.hostId ||
    stay?.hostId ||
    stay?.host?.hostId ||
    stay?.leadUserId ||
    stay?.userId ||
    null;
  const policies = useMemo(() => {
    const categories = [];

    const extractText = (r) => {
      if (!r) return "";
      if (typeof r === 'string') return r;
      const val = r.propertyRule || r.policyRule || r.rule || r.text || r.content || r.description || r.value || r.title || r.name;
      if (val && typeof val === 'string') return val;
      const firstStringVal = Object.values(r).find(v => typeof v === 'string');
      return firstStringVal || "";
    };

    const findArrayWithKey = (obj, targetKey, targetName) => {
      if (!obj || typeof obj !== 'object') return null;
      if (Array.isArray(obj) && obj.length > 0) {
        if (typeof obj[0] === 'string' && targetName && targetName.test(obj[0])) return obj;
        if (typeof obj[0] === 'object' && obj[0] !== null) {
          if (targetKey in obj[0] || 'rule' in obj[0] || 'policyRule' in obj[0] || 'propertyRule' in obj[0]) return obj;
        }
      }
      const commonNames = ['propertyRules', 'propertyRule', 'rules', 'propertyRulesDefaultTemplate', 'cancellationPolicyRules', 'cancellationRules', 'cancellationPolicy'];
      for (const key of commonNames) {
        if (obj[key] && Array.isArray(obj[key]) && obj[key].length > 0) return obj[key];
      }
      for (const key in obj) {
        const result = findArrayWithKey(obj[key], targetKey, targetName);
        if (result) return result;
      }
      return null;
    };

    // 1. Property Rules
    const propItems = [];
    if (stay?.privacyAndPolicy?.propertyRulesTemplate && stay.privacyAndPolicy.propertyRulesTemplate !== "No property rules defined.") {
      const lines = stay.privacyAndPolicy.propertyRulesTemplate.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, i) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 60) {
          propItems.push({ id: `prop-${i}`, title: line.substring(0, colonIdx).trim(), body: line.substring(colonIdx + 1).trim() });
        } else {
          if (line.toLowerCase() !== "check-in and check-out" && line.toLowerCase() !== "property rules") {
            propItems.push({ id: `prop-${i}`, title: line, body: line });
          }
        }
      });
    } else {
      const rawPropRules = stay?.propertyRulesDefaultTemplate || stay?.propertyRules || stay?.propertyRule || findArrayWithKey(stay, 'propertyRule');
      if (Array.isArray(rawPropRules) && rawPropRules.length > 0) {
        rawPropRules.forEach((r, i) => propItems.push({ id: `prop-${i}`, title: `Rule ${i + 1}`, body: extractText(r) }));
      } else if (stay?.houseRules) {
        propItems.push({ id: `prop-0`, title: "General Rules", body: stay.houseRules });
      } else if (stay?.checkInTime || stay?.checkOutTime) {
        propItems.push({ id: `prop-0`, title: "Check-in / Check-out", body: `Check-in from ${stay.checkInTime || "2:00 PM"}. Check-out by ${stay.checkOutTime || "11:00 AM"}.` });
      } else {
        propItems.push({ id: `prop-0`, title: "General Rules", body: "Check-in from 2:00 PM. Check-out by 11:00 AM." });
      }
    }
    if (stay?.ageRestriction != null && stay.ageRestriction !== "") {
      propItems.push({ id: "age_restriction", title: "Minimum Age", body: `${stay.ageRestriction}+` });
    }
    propItems.push({ id: "id_required", title: "ID Required at Check-in", body: stay?.idRequiredAtCheckIn ? "Yes" : "No" });
    propItems.push({ id: "pets_allowed", title: "Pets Allowed", body: stay?.petAllowed ? "Yes" : "No" });
    propItems.push({ id: "couple_friendly", title: "Couple Friendly", body: stay?.coupleFriendly ? "Yes" : "No" });

    if (propItems.length > 0) {
      categories.push({ id: 'cat-prop', title: "Property Rules", items: propItems });
    }

    // 2. Guest Requirements
    const guestItems = [];
    if (Array.isArray(stay?.guestRequirements) && stay.guestRequirements.length > 0) {
      stay.guestRequirements.forEach((req, i) => {
        const title = req.setting?.title || req.description || `Requirement ${i + 1}`;
        let body = "";
        if (Array.isArray(req.questions)) {
          body = req.questions.map(q => `• ${q.title || q.question?.title}`).join("\n");
        }
        guestItems.push({ id: `guest-${i}`, title, body: body || title, questions: req.questions });
      });
    }
    if (guestItems.length > 0) {
      categories.push({ id: 'cat-guest', title: "Guest Requirements", items: guestItems });
    }

    // 3. Cancellation Policy
    const cancelItems = [];
    const summaryText = stay?.cancellationPolicySummary ||
      stay?.privacyAndPolicy?.cancellationPolicySummary ||
      stay?.listing?.cancellationPolicySummary ||
      stay?.stay?.cancellationPolicySummary ||
      stay?.generatedPolicySummary ||
      stay?.policySummary ||
      stay?.cancellation_policy_summary;

    const templateText = stay?.cancellationPolicyTemplate ||
      stay?.privacyAndPolicy?.cancellationPolicyTemplate ||
      stay?.listing?.cancellationPolicyTemplate ||
      stay?.stay?.cancellationPolicyTemplate ||
      stay?.cancellationPolicy ||
      stay?.cancellationPolicyText;

    if (summaryText && summaryText.trim().length > 5 && !summaryText.toLowerCase().includes("no cancellation policy summary")) {
      cancelItems.push({ id: 'cancel-1', title: "Cancellation Terms", body: summaryText });
    } else if (templateText && templateText.trim().length > 0 && !templateText.toLowerCase().includes("no cancellation policy rules")) {
      cancelItems.push({ id: 'cancel-1', title: "Cancellation Terms", body: templateText });
    } else {
      const rawCancelRules = stay?.cancellationPolicyRules || stay?.cancellationPolicyRule || stay?.cancellationRules || findArrayWithKey(stay, 'policyRule');
      if (Array.isArray(rawCancelRules) && rawCancelRules.length > 0) {
        rawCancelRules.forEach((r, i) => cancelItems.push({ id: `cancel-${i}`, title: `Rule ${i + 1}`, body: extractText(r) }));
      } else if (stay?.cancellationPolicy || stay?.cancellationPolicyText) {
        cancelItems.push({ id: 'cancel-1', title: "Terms", body: stay.cancellationPolicy || stay.cancellationPolicyText });
      }
    }
    if (cancelItems.length > 0) {
      categories.push({ id: 'cat-cancel', title: "Cancellation Policy", items: cancelItems });
    }

    const privacy = stay?.privacyPolicy || stay?.privacyPolicyRules || stay?.privacyRules;
    if (privacy) {
      categories.push({ id: 'cat-priv', title: "Privacy Policy", items: [{ id: 'priv-1', title: "Details", body: privacy }] });
    }

    return categories;
  }, [stay]);

  const getPhone = () => {
    const p = hostData?.host?.phone || hostData?.host?.phoneNumber || hostData?.host?.mobileNumber || hostData?.host?.businessContact || hostData?.phone || hostData?.phoneNumber || hostData?.mobileNumber || hostData?.businessContact || stay?.host?.phone || stay?.contactNumber || stay?.phone || stay?.contactPhone || stay?.businessContact;
    return typeof p === "string" && p.trim() ? p.trim() : "Contact via Portal";
  };

  const getEmail = () => {
    const e = hostData?.host?.email || hostData?.host?.emailAddress || hostData?.host?.businessEmail || hostData?.email || hostData?.emailAddress || hostData?.businessEmail || stay?.host?.email || stay?.contactEmail || stay?.email || stay?.emailAddress || stay?.businessEmail;
    return typeof e === "string" && e.trim() ? e.trim() : "reservations@property.com";
  };

  const phone = getPhone();
  const email = getEmail();

  const hostFirstName = hostData?.firstName || hostData?.host?.firstName || stay?.host?.firstName || "";
  const hostLastName = hostData?.lastName || hostData?.host?.lastName || stay?.host?.lastName || "";
  const combinedHostName = (hostFirstName || hostLastName) ? `${hostFirstName} ${hostLastName}`.trim() : "";

  const primaryName = stay?.contactInformation?.primaryContactName || stay?.primaryContactName || stay?.primaryContact?.name || combinedHostName || hostData?.name || hostData?.businessName || hostData?.host?.displayName || stay?.host?.name || "Adithyan";
  const primaryPhoneNum = stay?.contactInformation?.primaryPhone || stay?.primaryPhone || stay?.primaryContactNumber || stay?.primaryContact?.phone || phone;
  const primaryEmailAddress = stay?.contactInformation?.primaryEmail || stay?.primaryEmail || stay?.primaryContactEmail || stay?.primaryContact?.email || email;

  const salesName = stay?.contactInformation?.salesContactName || stay?.salesContactName || stay?.salesContact?.name || stay?.salesName;
  const salesPhoneNum = stay?.contactInformation?.salesPhone || stay?.salesPhone || stay?.salesContactNumber || stay?.salesContact?.phone;
  const salesEmailAddress = stay?.contactInformation?.salesEmail || stay?.salesEmail || stay?.salesContactEmail || stay?.salesContact?.email;

  const frontOffice = stay?.contactInformation?.frontOfficePhone || stay?.frontOfficePhone || stay?.frontOfficeContact;

  return (
    <section style={{ background: BG, padding: isMobile ? "80px 16px" : "140px 36px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>

        <SHdr idx="05" label="Guidelines & Contact" />

        <div className="pol-contact-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr", gap: isMobile ? 60 : 100, alignItems: "start", marginTop: 40 }}>

          {/* Left Column: Host Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 32 : 40 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 24 }}>Property Host</p>
              <Rev>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24, marginBottom: 32 }}>
                  <div style={{ width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, borderRadius: "50%", overflow: "hidden", border: `1px solid ${B}`, background: S }}>
                    {hostAvatar ? (
                      <img src={hostAvatar} alt={primaryName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: M }}>
                        {primaryName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      className="font-display"
                      onClick={() => {
                        if (hostProfileId) history.push(`/host-profile?id=${hostProfileId}`);
                      }}
                      style={{
                        fontSize: isMobile ? 24 : 32,
                        fontWeight: 700,
                        color: FG,
                        marginBottom: 4,
                        wordBreak: "break-word",
                        lineHeight: 1.2,
                        cursor: hostProfileId ? "pointer" : "default",
                      }}
                    >
                      {primaryName}
                    </h3>
                    <p style={{ fontSize: 14, color: M }}>Property Representative</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: isMobile ? "24px" : "32px", background: W, border: `1px solid ${B}`, borderRadius: 2 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.1em" }}>Phone</span>
                    <a href={`tel:${primaryPhoneNum}`} style={{ fontSize: 16, fontWeight: 600, color: FG, textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                      <Phone size={16} color={A} />
                      {primaryPhoneNum}
                    </a>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</span>
                    <a href={`mailto:${primaryEmailAddress}`} style={{ fontSize: 16, fontWeight: 600, color: FG, textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                      <Mail size={16} color={A} />
                      {primaryEmailAddress}
                    </a>
                  </div>
                </div>
              </Rev>
            </div>

            {frontOffice && (
              <Rev delay={0.1}>
                <div style={{ padding: isMobile ? "24px" : "32px", background: S, border: `1px solid ${B}`, borderRadius: 2 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Front Office</p>
                  <a href={`tel:${frontOffice}`} style={{ fontSize: 16, fontWeight: 600, color: FG, textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                    <Building size={16} color={A} />
                    {frontOffice}
                  </a>
                </div>
              </Rev>
            )}
          </div>

          {/* Right Column: Rules Categories & Accordions */}
          <div>
            <Rev delay={0.2}>
              {policies.map((category) => (
                <div key={category.id} style={{ marginBottom: 48 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 24, letterSpacing: "-0.01em" }}>{category.title}</h3>
                  <div style={{ borderTop: `1px solid ${B}` }}>
                    {category.items.map((rule) => (
                      <PolicyItem key={rule.id} rule={rule} A={A} FG={FG} M={M} B={B} S={S} />
                    ))}
                  </div>
                </div>
              ))}
            </Rev>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── MAIN COMPONENT ─────────── */
const StayDetails = () => {
  const { width, isMobile } = useWindowSize();
  const { tokens: { BG, FG, W, B, S, M } } = useTheme();
  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const [stay, setStay] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailablePopupOpen, setUnavailablePopupOpen] = useState(false);
  const unavailableRedirectRef = useRef(false);

  // Dynamic browser tab title
  useDocumentTitle(stay?.propertyName || stay?.title, "Stays");

  // Booking State
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [selectedRooms, setSelectedRooms] = useState([]); // Array of {roomId, mealPlan, count}
  const [bookingLoading, setBookingLoading] = useState(false);

  const isStayUnavailable = (payload) => {
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
    if (typeof url !== "string") url = url?.url ?? url?.src ?? url?.imageUrl;
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/")) return url;
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodeURI(url.replaceAll("%2F", "/"))}`;
  };

  const handleRoomSelect = useCallback((roomId, mealPlan) => {
    const rid = String(roomId);
    setSelectedRooms(prev => {
      const exists = prev.find(r => r.roomId === rid);
      if (exists) {
        const filtered = prev.filter(r => r.roomId !== rid);
        if (filtered.length === 0) {
          const stayRoomsCatalog = stay?.rooms || stay?.roomTypes || stay?.room_types || [];
          if (stayRoomsCatalog.length > 0) {
            const firstRoom = stayRoomsCatalog[0];
            const firstRoomId = String(firstRoom.roomId ?? firstRoom.id ?? firstRoom.roomTypeId ?? firstRoom.room_type_id);
            return [{ roomId: firstRoomId, mealPlan: "EP", count: 1 }];
          }
        }
        return filtered;
      }
      return [...prev, { roomId: rid, mealPlan: mealPlan || "EP", count: 1 }];
    });
  }, [stay]);

  const handleRoomCountChange = useCallback((roomId, count) => {
    const rid = String(roomId);
    setSelectedRooms(prev => prev.map(r =>
      r.roomId === rid ? { ...r, count: Math.max(1, count) } : r
    ));
  }, []);

  // Rehydrate booking selection state if returning from successful authentication redirect
  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem("frontendPendingBookingState");
      if (storedRaw) {
        const stored = JSON.parse(storedRaw);
        const token = localStorage.getItem("jwtToken");
        const isLoggedIn = !!token && token !== "undefined" && token !== "null";

        if (stored?.listingId === String(id) && stored?.type === "stay" && isLoggedIn) {
          console.log("🔄 Restoring stay persistent booking state after auth redirect:", stored);
          if (stored.checkInDate) {
            const pCheckIn = moment(stored.checkInDate);
            if (pCheckIn.isValid()) setCheckInDate(pCheckIn);
          }
          if (stored.checkOutDate) {
            const pCheckOut = moment(stored.checkOutDate);
            if (pCheckOut.isValid()) setCheckOutDate(pCheckOut);
          }
          if (stored.guests) setGuests(stored.guests);
          if (Array.isArray(stored.selectedRooms)) {
            setSelectedRooms(stored.selectedRooms);
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore stay state:", e);
    }
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await getStayDetails(id);
        if (!mounted) return;
        if (isStayUnavailable(data)) {
          showUnavailablePopupAndRedirect();
          return;
        }

        if (data) {
          setStay(data);
          // DEBUG: Log full stay payload to identify exact field names for rules/policies
          console.log("🏨 STAY FULL PAYLOAD:", JSON.stringify(data, null, 2));
          const galleryImages = [];
          const cover = data.coverPhotoUrl || data.coverImageUrl || data.coverPhoto || data.coverImage || data.cover;
          if (cover) galleryImages.push(fixImageUrl(cover));

          const collect = (arr) => {
            if (Array.isArray(arr)) arr.forEach(m => {
              const u = typeof m === "string" ? m : m?.url ?? m?.src ?? m?.imageUrl;
              if (u) galleryImages.push(fixImageUrl(u));
            });
          };
          collect(data.media); collect(data.images); collect(data.stayMedia);

          const seen = new Set();
          setGalleryItems(galleryImages.filter(u => u && !seen.has(u) && seen.add(u)));

          const hostId = data.hostId || data.host?.hostId || data.leadUserId || data.userId;
          if (hostId) getHost(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));

          // Fetch reviews using stay-specific API
          getStayReviews(id).then(resp => {
            if (mounted) setReviews(resp || []);
          }).catch(e => console.warn("❌ Error in StayDetails reviews:", e));

          // Fetch eligible bookings for review
          getEligibleBookings().then(data => {
            if (mounted) {
              const list = Array.isArray(data) ? data : [];
              const filtered = list.filter(b => {
                const bStayId = b.stayId || (b.stayOrderRooms && b.stayOrderRooms[0]?.stayId);
                return String(bStayId) === String(id);
              });
              setEligibleBookings(filtered);
              console.log(`✅ Stay review eligibility: ${filtered.length} eligible bookings found`);
            }
          }).catch(e => console.warn("❌ Error fetching stay eligibility:", e));
        }
        setLoading(false);
      } catch (e) {
        console.error("Failed to load stay details", e);
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
            style={{ width: "100%", maxWidth: 420, background: S, color: FG, border: `1px solid ${B}`, borderRadius: 16, boxShadow: "0 24px 64px rgba(0,0,0,0.28)", padding: 20 }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: FG }}>Stay Unavailable</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: M }}>Stay no longer available.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" onClick={handleUnavailablePopupClose} style={{ border: "none", background: "#0097B2", color: W, borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Go to Home
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const hostAvatar = useMemo(() => {
    const avatarUrl = hostData?.host?.profilePhotoUrl || hostData?.host?.profilePhoto || stay?.host?.profilePhotoUrl || stay?.host?.profilePhoto;
    return avatarUrl ? fixImageUrl(avatarUrl) : null;
  }, [hostData, stay]);

  const hasRoomInventory = useMemo(() => {
    const rooms = stay?.rooms || stay?.roomTypes || stay?.room_types || stay?.stay?.rooms || [];
    return Array.isArray(rooms) && rooms.length > 0;
  }, [stay]);

  const isPropertyBasedStay = useMemo(() => {
    const scope = String(
      stay?.bookingScope ||
      stay?.booking_scope ||
      stay?.scope ||
      ""
    ).toUpperCase();
    return scope.includes("PROPERTY") || !hasRoomInventory;
  }, [stay, hasRoomInventory]);

  const primaryCategoryId = stay?.primaryCategoryId || stay?.primaryCategory?.id || stay?.categoryId || stay?.category?.id;
  const currentListingId = stay?.stayId || stay?.id || id;

  if (loading && !stay && !unavailablePopupOpen) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader />
      </div>
    );
  }

  if (unavailablePopupOpen) {
    return (
      <div className="stay-details-premium" style={{ minHeight: "100vh", background: BG, color: FG }}>
        <ScopedStyles />
        {unavailablePopup}
      </div>
    );
  }



  return (
    <div className="stay-details-premium" style={{ minHeight: "100vh", background: BG, color: FG }}>
      <ScopedStyles />
      {unavailablePopup}


      <StayHeroCarousel stay={stay} galleryItems={galleryItems} />

      <StayAmenities stay={stay} />

      <div style={{ background: W, padding: "80px 36px 140px", borderTop: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SHdr idx="03" label="Accommodations" />
          <p style={{ fontSize: 16, color: M, marginBottom: 56, maxWidth: 600, lineHeight: 1.7 }}>
            Choose from our curated selection of rooms and suites. Each space is thoughtfully designed for an unparalleled stay experience.
          </p>
          {isPropertyBasedStay && (
            <PropertyStayCard stay={stay} />
          )}
          <RoomCards
            listing={stay}
            onRoomSelect={handleRoomSelect}
            selectedRooms={selectedRooms}
            onRoomsCountChange={handleRoomCountChange}
            noContainer
          />
        </div>
      </div>

      {(() => {
        const tags = Array.isArray(stay?.tags)
          ? stay.tags.map(t => typeof t === 'string' ? t : (t?.name || t?.tag || t?.label || t?.value)).filter(Boolean)
          : [];
        const items = tags.length > 0 ? tags : ["Bespoke Service", "Privacy Guaranteed", "Direct Connection"];
        return <Mq items={items} size="sm" bg={S} accent />;
      })()}

      <StayLocation stay={stay} />

      <StayPoliciesAndContact stay={stay} hostData={hostData} hostAvatar={hostAvatar} />

      <StayReviews
        reviews={reviews}
        stayId={id}
        eligibleBookings={eligibleBookings}
        onReviewSubmitted={async () => {
          const resp = await getStayReviews(id);
          setReviews(resp || []);
          // Refresh eligibility
          const eligible = await getEligibleBookings();
          const list = Array.isArray(eligible) ? eligible : [];
          setEligibleBookings(list.filter(b => {
            const bStayId = b.stayId || (b.stayOrderRooms && b.stayOrderRooms[0]?.stayId);
            return String(bStayId) === String(id);
          }));
        }}
      />

      <StayBookingSystem
        stay={stay}
        checkInDate={checkInDate}
        setCheckInDate={setCheckInDate}
        checkOutDate={checkOutDate}
        setCheckOutDate={setCheckOutDate}
        guests={guests}
        setGuests={setGuests}
        selectedRooms={selectedRooms}
        setSelectedRooms={setSelectedRooms}
        onRoomsCountChange={handleRoomCountChange}
      />

      <RelatedListingsStrip
        businessInterestId={3}
        primaryCategoryId={primaryCategoryId}
        currentListingId={currentListingId}
        title="More Stays You May Like"
      />

    </div>
  );
};

const extractList = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr.map(item => {
    if (typeof item === "string") return item;
    return item?.name || item?.amenityName || item?.facilityName || item?.amenity || item?.facility || item?.label || item?.title || item?.value || "";
  }).filter(Boolean);
};

const AMENITY_ICONS = {
  wifi: Wifi,
  ac: AirVent,
  air: AirVent,
  parking: Car,
  pool: Waves,
  swimming: Waves,
  breakfast: Coffee,
  food: Utensils,
  tv: Tv,
  television: Tv,
  kitchen: Utensils,
  gym: Dumbbell,
  fitness: Dumbbell,
  spa: Sparkles,
  default: CheckCircle
};

const getAmenityIcon = (name) => {
  const lower = String(name).toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return AMENITY_ICONS.default;
};

function PropertyModal({ stay, onClose }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, B, W, S, BG, AL } } = useTheme();
  const detailsRef = useRef(null);

  const name = stay.propertyName || stay.title || stay.name || "Property Details";
  const desc = stay.detailedDescription || stay.description || stay.shortDescription;

  const capacity = stay.maxGuests || stay.guests?.adults || stay.maxAdults || null;

  const list = stay.amenities || stay.propertyAmenities || stay.stayAmenities || stay.amenityList || [];
  const amenities = extractList(list);

  const formatTime12h = (value, fallback = "") => {
    if (!value) return fallback;
    const raw = String(value).trim();
    const parsed = moment(raw, ["HH:mm:ss", "HH:mm", "h:mm A", "h:mmA"], true);
    if (!parsed.isValid()) return raw;
    return parsed.format("h:mm A");
  };

  const checkInRaw = stay.checkInTime || stay.checkinTime || stay.check_in_time || "14:00";
  const checkOutRaw = stay.checkOutTime || stay.checkoutTime || stay.check_out_time || "11:00";
  const checkInText = formatTime12h(checkInRaw, "2:00 PM");
  const checkOutText = formatTime12h(checkOutRaw, "11:00 AM");

  const cancellationPolicy = stay.cancellationPolicy || stay.cancellationPolicySummary || stay.cancellationPolicyText;

  const toAmount = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const toDateOnly = (value) => {
    if (!value) return null;
    const m = moment(value, ["YYYY-MM-DD", moment.ISO_8601], true);
    return m.isValid() ? m.startOf("day") : null;
  };

  const basePrice =
    toAmount(stay.fullPropertyB2cPrice) ??
    toAmount(stay.fullPropertyb2cPrice) ??
    toAmount(stay.full_property_b2c_price) ??
    toAmount(stay.b2cPrice) ??
    toAmount(stay.pricePerNight) ??
    toAmount(stay.startingPrice) ??
    toAmount(stay.price);
  const seasonalPeriods = Array.isArray(stay.seasonalPricing)
    ? stay.seasonalPricing
    : (Array.isArray(stay.seasonalPricings) ? stay.seasonalPricings : []);
  const today = moment().startOf("day");
  const activeSeason = seasonalPeriods.find((period) => {
    const start = toDateOnly(period?.startDate || period?.start_date);
    const end = toDateOnly(period?.endDate || period?.end_date);
    if (!start || !end) return false;
    return today.isSameOrAfter(start) && today.isSameOrBefore(end);
  });
  const seasonalB2CPrice =
    activeSeason?.b2cPrice ??
    activeSeason?.b2cprice ??
    activeSeason?.pricePerNight ??
    activeSeason?.price ??
    null;
  const priceValue = seasonalB2CPrice ?? basePrice;

  const billingConfigDiscounts =
    stay.billingConfig?.discounts ||
    stay.billing_config?.discounts ||
    [];
  const discountRate = Array.isArray(billingConfigDiscounts)
    ? Math.max(
      0,
      Math.min(
        100,
        billingConfigDiscounts.reduce((sum, discount) => {
          const rate = Number(discount?.currentRate ?? discount?.current_rate ?? 0);
          return sum + (Number.isFinite(rate) ? rate : 0);
        }, 0)
      )
    )
    : 0;
  const discountedPriceValue =
    priceValue != null ? Math.max(0, Number(priceValue) * (1 - discountRate / 100)) : null;

  const allImages = [];
  const coverPhoto = stay.coverPhotoUrl || stay.coverImageUrl || stay.coverPhoto || stay.coverImage || stay.imageUrl;
  if (coverPhoto) allImages.push(coverPhoto);
  const media = stay.media || stay.images || stay.stayMedia || [];
  media.forEach(m => {
    const u = typeof m === "string" ? m : m.url || m.src || m.imageUrl;
    if (u && !allImages.includes(u)) allImages.push(u);
  });

  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryRef = useRef(null);

  const scrollGallery = (dir) => {
    if (!galleryRef.current) return;
    const nextIdx = dir === 'next'
      ? (galleryIndex + 1) % allImages.length
      : (galleryIndex - 1 + allImages.length) % allImages.length;

    setGalleryIndex(nextIdx);
    const itemWidth = galleryRef.current.offsetWidth;
    galleryRef.current.scrollTo({
      left: nextIdx * itemWidth,
      behavior: 'smooth'
    });
  };

  const handleGalleryScroll = () => {
    if (!galleryRef.current) return;
    const scrollLeft = galleryRef.current.scrollLeft;
    const itemWidth = galleryRef.current.offsetWidth;
    if (itemWidth > 0) {
      const idx = Math.round(scrollLeft / itemWidth);
      if (idx !== galleryIndex && idx >= 0 && idx < allImages.length) {
        setGalleryIndex(idx);
      }
    }
  };

  const scrollToDetails = () => {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    return lockBodyScroll();
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 24, overflow: "hidden", overflowX: "hidden", overscrollBehavior: "contain" }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
        onClick={onClose}
      />

      <style>{`
        .modal-scrollable-content::-webkit-scrollbar { width: 6px; }
        .modal-scrollable-content::-webkit-scrollbar-thumb { background: ${B}; border-radius: 10px; }
        .modal-scrollable-content { scrollbar-width: thin; scrollbar-color: ${B} transparent; }
        .gallery-scroll-track::-webkit-scrollbar { display: none; }
        .gallery-scroll-track { -ms-overflow-style: none; scrollbar-width: none; }
        .gallery-nav-button:hover { opacity: 1 !important; background: rgba(255,255,255,0.24) !important; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: isMobile ? "100%" : 40, scale: isMobile ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isMobile ? "100%" : 40, scale: isMobile ? 1 : 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative", background: W, width: "100%", maxWidth: 1100,
          maxHeight: isMobile ? "100vh" : "90vh",
          marginTop: isMobile ? "auto" : 0,
          borderRadius: isMobile ? "24px 24px 0 0" : 24, overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 1,
          boxShadow: "0 40px 120px rgba(0,0,0,0.5)", border: `1px solid ${B}`
        }}
      >
        {isMobile && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 44, height: 5, borderRadius: 100, background: "rgba(0,0,0,0.15)", zIndex: 30 }} />
        )}

        <button onClick={onClose} style={{
          position: "absolute", top: isMobile ? 20 : 24, right: isMobile ? 20 : 24, width: 40, height: 40, borderRadius: "50%",
          background: S, border: `1px solid ${B}`, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease", color: FG
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Scrollable Content Container */}
        <div className="modal-scrollable-content" style={{ overflowY: "auto", flex: 1, boxSizing: "border-box", padding: isMobile ? "40px 20px" : "48px 48px" }}>

          {/* Top Hero Section */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 32 : 40, marginBottom: 40, alignItems: "start" }}>

            {/* LEFT SIDE: Large Featured Image */}
            <div style={{
              height: isMobile ? 260 : 440, overflow: "hidden", borderRadius: 20,
              background: "#0F0F0F", position: "relative", display: "flex", flexShrink: 0,
              border: `1px solid ${B}`
            }}>
              {allImages.length > 0 ? (
                <>
                  <div ref={galleryRef} onScroll={handleGalleryScroll} className="gallery-scroll-track" style={{ display: "flex", width: "100%", height: "100%", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    {allImages.map((img, i) => (
                      <div key={i} style={{ minWidth: "100%", height: "100%", scrollSnapAlign: "start", position: "relative" }}>
                        <img src={fixImageUrl(img)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: galleryIndex === i ? 1 : 0.8, transition: "opacity 0.6s ease" }} />
                      </div>
                    ))}
                  </div>

                  {/* Gradient Overlay for Readability */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%)",
                    pointerEvents: "none", zIndex: 10
                  }} />

                  {allImages.length > 1 && (
                    <>
                      <button className="gallery-nav-button" onClick={() => scrollGallery('prev')} style={{
                        position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                        width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", zIndex: 15, transition: "all 0.3s", opacity: 0.72, fontSize: 22, fontWeight: 300, lineHeight: 1
                      }}>
                        &lt;
                      </button>
                      <button className="gallery-nav-button" onClick={() => scrollGallery('next')} style={{
                        position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                        width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", zIndex: 15, transition: "all 0.3s", opacity: 0.72, fontSize: 22, fontWeight: 300, lineHeight: 1
                      }}>
                        &gt;
                      </button>
                    </>
                  )}

                  <div style={{
                    position: "absolute", bottom: 20, right: 20, background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)", color: "#fff", padding: "6px 14px", borderRadius: 100,
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", zIndex: 15,
                    border: "1px solid rgba(255,255,255,0.15)"
                  }}>
                    {galleryIndex + 1} <span style={{ opacity: 0.5, margin: "0 2px" }}>/</span> {allImages.length}
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: S }}>
                  <Building size="48" color={A} />
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Quick Info & Title */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <span style={{
                  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                  color: A, fontWeight: 800, marginBottom: 8, display: "block"
                }}>
                  {toDisplayString(stay.propertyType) || "Property Stay"}
                </span>

                <h2 style={{
                  fontSize: isMobile ? 32 : 40, fontWeight: 800, marginBottom: 12,
                  fontFamily: "var(--font-fraunces, Georgia, serif)", color: FG,
                  lineHeight: 1.1, letterSpacing: "-0.02em", wordBreak: "break-word"
                }}>{name}</h2>

                <p style={{ fontSize: 14, lineHeight: 1.6, color: M, fontWeight: 550, margin: 0, opacity: 0.9 }}>
                  {stay.shortDescription || "Entire-property booking with curated comfort and premium amenities."}
                </p>
              </div>

              {/* 2x2 Quick Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Capacity */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Capacity</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{capacity != null ? `${capacity} Guests` : "Full Property"}</span>
                </div>

                {/* Price */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Nightly Price</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 4 }}>
                    {priceValue != null ? (
                      <>
                        {discountRate > 0 && (
                          <span style={{ fontSize: 11, color: M, textDecoration: "line-through", fontWeight: 500 }}>
                            ₹{Number(priceValue).toLocaleString("en-IN")}
                          </span>
                        )}
                        <span>₹{Number(discountRate > 0 ? discountedPriceValue : priceValue).toLocaleString("en-IN")}</span>
                      </>
                    ) : (
                      "On Request"
                    )}
                  </span>
                </div>

                {/* Check-in */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-in</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>After {checkInText}</span>
                </div>

                {/* Check-out */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-out</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>Before {checkOutText}</span>
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => {
                    onClose();
                    const btn = document.querySelector(".stay-booking-trigger");
                    if (btn) {
                      setTimeout(() => {
                        const target = btn;
                        if (target && typeof target.click === 'function') {
                          target.click();
                        }
                      }, 120);
                    }
                  }}
                  style={{
                    background: A, color: "#fff", border: "none",
                    padding: "14px 28px", borderRadius: 12, fontSize: 14, fontWeight: 800,
                    cursor: "pointer", boxShadow: `0 10px 25px ${A}2a`,
                    transition: "all 0.3s ease",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  Reserve Stay
                </button>

                <button
                  onClick={scrollToDetails}
                  style={{
                    background: "transparent", border: `1px solid ${B}`, color: FG,
                    padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.3s ease",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  View Full Details
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </div>
            </div>

          </div>

          {/* Divider & Full Narrative/Details */}
          <div ref={detailsRef} style={{ borderTop: `1px solid ${B}`, paddingTop: 40, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 32 : 40 }}>

            {/* Narrative */}
            <div>
              <h3 style={{
                fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.2em", color: M, marginBottom: 16
              }}>
                Property Narrative
              </h3>
              <p style={{
                fontSize: 15, lineHeight: 1.8, color: FG,
                fontWeight: 450, opacity: 0.9, whiteSpace: "pre-line", margin: 0
              }}>
                {desc}
              </p>
            </div>

            {/* Side features */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {amenities.length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.2em", color: M, marginBottom: 20
                  }}>
                    Amenities & Features
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                    {amenities.map((f, i) => {
                      const IconComp = getAmenityIcon(f);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <IconComp size={15} color={A} />
                          <span style={{ fontSize: 13, color: FG, fontWeight: 600 }}>{f}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {cancellationPolicy && (
                <div>
                  <h3 style={{
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.2em", color: M, marginBottom: 16
                  }}>
                    Cancellation Guidelines
                  </h3>
                  <div style={{ padding: 20, background: S, borderRadius: 16, border: `1px solid ${B}` }}>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: FG, fontWeight: 500, opacity: 0.85, margin: 0 }}>
                      {cancellationPolicy}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}

function PropertyStayCard({ stay }) {
  const { tokens: { FG, M, B, W, S, A, AL } } = useTheme();
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const toDateOnly = (value) => {
    if (!value) return null;
    const m = moment(value, ["YYYY-MM-DD", moment.ISO_8601], true);
    return m.isValid() ? m.startOf("day") : null;
  };
  const formatTime12h = (value, fallback = "") => {
    if (!value) return fallback;
    const raw = String(value).trim();
    const parsed = moment(raw, ["HH:mm:ss", "HH:mm", "h:mm A", "h:mmA"], true);
    if (!parsed.isValid()) return raw;
    return parsed.format("h:mm A");
  };

  const coverPhoto =
    stay?.coverPhotoUrl ||
    stay?.coverImageUrl ||
    stay?.coverPhoto ||
    stay?.coverImage ||
    stay?.imageUrl ||
    (Array.isArray(stay?.listingMedia) && stay.listingMedia[0]
      ? (stay.listingMedia[0].url || stay.listingMedia[0].blobName || stay.listingMedia[0].fileUrl)
      : null) ||
    "/images/content/card-pic-13.jpg";

  const checkInRaw = stay?.checkInTime || stay?.checkinTime || stay?.check_in_time || "14:00";
  const checkOutRaw = stay?.checkOutTime || stay?.checkoutTime || stay?.check_out_time || "11:00";
  const checkInText = formatTime12h(checkInRaw, "2:00 PM");
  const checkOutText = formatTime12h(checkOutRaw, "11:00 AM");

  const toAmount = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const basePrice =
    toAmount(stay?.fullPropertyB2cPrice) ??
    toAmount(stay?.fullPropertyb2cPrice) ??
    toAmount(stay?.full_property_b2c_price) ??
    toAmount(stay?.b2cPrice) ??
    toAmount(stay?.pricePerNight) ??
    toAmount(stay?.startingPrice) ??
    toAmount(stay?.price);
  const seasonalPeriods = Array.isArray(stay?.seasonalPricing)
    ? stay.seasonalPricing
    : (Array.isArray(stay?.seasonalPricings) ? stay.seasonalPricings : []);
  const today = moment().startOf("day");
  const activeSeason = seasonalPeriods.find((period) => {
    const start = toDateOnly(period?.startDate || period?.start_date);
    const end = toDateOnly(period?.endDate || period?.end_date);
    if (!start || !end) return false;
    return today.isSameOrAfter(start) && today.isSameOrBefore(end);
  });
  const seasonalB2CPrice =
    activeSeason?.b2cPrice ??
    activeSeason?.b2cprice ??
    activeSeason?.pricePerNight ??
    activeSeason?.price ??
    null;
  const priceValue = seasonalB2CPrice ?? basePrice;
  const billingConfigDiscounts =
    stay?.billingConfig?.discounts ||
    stay?.billing_config?.discounts ||
    [];
  const discountRate = Array.isArray(billingConfigDiscounts)
    ? Math.max(
      0,
      Math.min(
        100,
        billingConfigDiscounts.reduce((sum, discount) => {
          const rate = Number(discount?.currentRate ?? discount?.current_rate ?? 0);
          return sum + (Number.isFinite(rate) ? rate : 0);
        }, 0)
      )
    )
    : 0;
  const discountedPriceValue =
    priceValue != null ? Math.max(0, Number(priceValue) * (1 - discountRate / 100)) : null;
  const showSeasonal = seasonalB2CPrice != null;
  const propertyName = stay?.propertyName || stay?.title || stay?.name || "Property Stay";

  const list = stay?.amenities || stay?.propertyAmenities || stay?.stayAmenities || stay?.amenityList || [];
  const amenities = extractList(list);
  const visibleAmenities = amenities.slice(0, 4);
  const extraCount = amenities.length - 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 24,
        background: W,
        border: `1px solid ${B}`,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
      className="property-stay-card"
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 10,
          overflow: "hidden",
          background: "linear-gradient(120deg, rgba(230,236,246,0.9), rgba(242,246,252,0.9))",
          minHeight: 200,
          position: "relative"
        }}
        onHoverStart={() => setIsHoveringCover(true)}
        onHoverEnd={() => setIsHoveringCover(false)}
      >
        {!coverLoaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(100deg, rgba(255,255,255,0) 20%, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 80%)",
              transform: "translateX(-120%)",
              animation: "propertyCoverShimmer 1.4s infinite",
              zIndex: 2
            }}
          />
        )}
        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(8,18,36,0.04) 0%, rgba(8,18,36,0.2) 100%)",
            opacity: coverLoaded ? 1 : 0.2,
            zIndex: 1,
            pointerEvents: "none"
          }}
          animate={{ opacity: coverLoaded ? 1 : 0.2 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.img
          src={fixImageUrl(coverPhoto)}
          alt={propertyName}
          initial={{ opacity: 0, scale: 1.06, filter: "blur(8px)" }}
          animate={{
            opacity: coverLoaded ? 1 : 0,
            scale: coverLoaded ? (isHoveringCover ? 1.04 : 1.015) : 1.08,
            filter: coverLoaded ? "blur(0px)" : "blur(8px)"
          }}
          transition={{ duration: coverLoaded ? 0.75 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            height: "100%",
            minHeight: 200,
            objectFit: "cover",
            display: "block",
            animation: coverLoaded ? "propertyCoverFloat 7s ease-in-out infinite" : "none"
          }}
          onLoad={() => setCoverLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = "/images/content/card-pic-13.jpg";
            setCoverLoaded(true);
          }}
        />
      </motion.div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: A, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Property Stay
          </p>
          <h3 style={{ fontSize: 28, lineHeight: 1.2, color: FG, marginBottom: 8 }}>{propertyName}</h3>
          <p style={{ fontSize: 14, color: M, lineHeight: 1.6, marginBottom: 0 }}>
            Entire-property booking with curated comfort and premium amenities.
          </p>
        </div>

        {amenities.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0" }}>
            {visibleAmenities.map((amenity, idx) => {
              const IconComp = getAmenityIcon(amenity);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255, 255, 255, 0.4)",
                    border: `1px solid ${B}66`,
                    borderRadius: 20,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: FG,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                    backdropFilter: "blur(4px)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <IconComp size={12} color={A} />
                  <span>{amenity}</span>
                </div>
              );
            })}
            {extraCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: S,
                  border: `1px solid ${B}66`,
                  borderRadius: 20,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: M,
                  backdropFilter: "blur(4px)"
                }}
              >
                + {extraCount} more
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <motion.div
              whileHover={{ y: -3, boxShadow: "0 8px 22px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.2 }}
              style={{
                border: `1px solid ${B}99`,
                borderRadius: 10,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                minWidth: 150
              }}
            >
              <div style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Check-in</div>
              <div style={{ fontSize: 14, color: FG, fontWeight: 700, marginTop: 4 }}>{checkInText}</div>
            </motion.div>
            <motion.div
              whileHover={{ y: -3, boxShadow: "0 8px 22px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.2 }}
              style={{
                border: `1px solid ${B}99`,
                borderRadius: 10,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                minWidth: 150
              }}
            >
              <div style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Check-out</div>
              <div style={{ fontSize: 14, color: FG, fontWeight: 700, marginTop: 4 }}>{checkOutText}</div>
            </motion.div>
            <motion.div
              whileHover={{ y: -3, boxShadow: "0 8px 22px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.2 }}
              style={{
                border: `1px solid ${B}99`,
                borderRadius: 10,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                minWidth: 170
              }}
            >
              <div style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Price</div>
              {priceValue != null ? (
                <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  {discountRate > 0 && (
                    <span style={{ fontSize: 13, color: M, textDecoration: "line-through", opacity: 0.8 }}>
                      {"\u20B9"}{Number(priceValue).toLocaleString("en-IN")}
                    </span>
                  )}
                  <span style={{ fontSize: 16, color: FG, fontWeight: 800 }}>
                    {"\u20B9"}{Number(discountRate > 0 ? discountedPriceValue : priceValue).toLocaleString("en-IN")} / night
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 16, color: FG, fontWeight: 800, marginTop: 4 }}>Price on request</div>
              )}
              {showSeasonal && (
                <div style={{ marginTop: 4, fontSize: 10, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Seasonal B2C Price
                </div>
              )}
            </motion.div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: AL, border: `1px solid ${A}`, color: A,
              padding: "12px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.3s ease",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            View Details
          </button>
        </div>
      </div>

      {ReactDOM.createPortal(
        <AnimatePresence>
          {showModal && (
            <PropertyModal
              stay={stay}
              onClose={() => setShowModal(false)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}

function StayReviews({ reviews = [], stayId, eligibleBookings = [], onReviewSubmitted }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, B, W, S, BG } } = useTheme();
  const routerHistory = useHistory();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (eligibleBookings.length === 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      const booking = eligibleBookings[0];
      await submitOrderReview(booking.orderId, {
        rating,
        comment: comment.trim(),
        stayId
      });
      setComment("");
      setRating(5);
      setShowForm(false);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedReviews = useMemo(() => {
    if (!reviews) return [];
    if (Array.isArray(reviews)) return reviews;
    if (Array.isArray(reviews?.reviews)) return reviews.reviews;
    if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
    if (Array.isArray(reviews?.data)) return reviews.data;
    if (Array.isArray(reviews?.items)) return reviews.items;
    return [];
  }, [reviews]);

  const ratingSummary = useMemo(() => {
    if (!reviews || Array.isArray(reviews)) return null;
    const s = reviews.ratingSummary || reviews.summary || reviews.data?.ratingSummary || reviews.data?.summary || null;
    if (!s) return null;

    // Normalize ratingDistribution if it's an object
    if (s.ratingDistribution && typeof s.ratingDistribution === "object" && !Array.isArray(s.ratingDistribution)) {
      const distArray = Object.entries(s.ratingDistribution).map(([rating, count]) => ({
        rating: Number(rating),
        count: Number(count)
      }));
      return { ...s, ratingDistribution: distArray };
    }
    return s;
  }, [reviews]);

  const avgRating = ratingSummary?.averageRating || 0;
  const totalReviews = ratingSummary?.totalReviews || normalizedReviews.length;
  const hasReviews = normalizedReviews.length > 0;

  return (
    <section style={{ background: W, padding: isMobile ? "80px 24px" : "120px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", gap: 24, marginBottom: 52 }}>
          <SHdr idx="06" label="GUEST REVIEWS" />
          {eligibleBookings.length > 0 && (
            <button
              onClick={() => {
                const el = document.getElementById("review-form-anchor");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                setShowForm(true);
              }}
              style={{
                background: A, color: W, border: "none", padding: "14px 32px", borderRadius: 100,
                fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer"
              }}
            >
              Write a Review
            </button>
          )}
        </div>

        <div className="reviews-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr", gap: isMobile ? 60 : 100, marginTop: 40 }}>
          {/* Left: Summary */}
          <div>
            <Rev>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: isMobile ? 60 : 80, fontWeight: 900, color: FG, lineHeight: 1, letterSpacing: "-0.05em" }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : (hasReviews ? "4.8" : "0.0")}
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: A }}>★</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: FG, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {totalReviews} {totalReviews === 1 ? "Guest Review" : "Guest Reviews"}
              </p>
              <p style={{ fontSize: 13, color: M, lineHeight: 1.6, maxWidth: 300 }}>
                Average rating based on recent stays. Our guests consistently highlight the exceptional service and attention to detail.
              </p>
            </Rev>
          </div>

          {/* Right: Review List */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 32 : 48 }}>
            <div id="review-form-anchor" />
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ background: S, border: `1px solid ${B}`, padding: isMobile ? 24 : 40, borderRadius: 4, marginBottom: 40 }}
                >
                  <h3 className="font-display" style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: FG, marginBottom: 8 }}>Share your stay</h3>
                  <p style={{ fontSize: 14, color: M, marginBottom: 32 }}>How was your time at the property? Your feedback is valuable.</p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: A, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Rating</p>
                      <Rating rating={rating} onChange={setRating} />
                    </div>

                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: A, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Comments</p>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us about the service, the rooms, or the location..."
                        required
                        style={{
                          width: "100%", height: 120, background: W, border: `1px solid ${B}`,
                          borderRadius: 2, padding: 20, fontSize: 15, color: FG, resize: "none", outline: "none"
                        }}
                      />
                    </div>

                    {error && <p style={{ color: "#FF4D4D", fontSize: 13, fontWeight: 600 }}>{error}</p>}

                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, marginTop: 12 }}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          background: A, color: W, border: "none", padding: "16px 40px", borderRadius: 100,
                          fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", cursor: isSubmitting ? "not-allowed" : "pointer",
                          opacity: isSubmitting ? 0.7 : 1
                        }}
                      >
                        {isSubmitting ? "Posting..." : "Post Review"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        style={{ background: "none", border: `1px solid ${B}`, padding: "16px 40px", borderRadius: 100, fontSize: 12, fontWeight: 700, color: FG, textTransform: "uppercase", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {!hasReviews && !showForm ? (
              <div style={{ padding: "40px 0" }}>
                <p style={{ fontSize: 16, color: M, fontStyle: "italic" }}>
                  No reviews have been submitted for this stay yet. Be the first to share your thoughts after your visit.
                </p>
              </div>
            ) : (
              normalizedReviews.slice(0, 2).map((rev, i) => (
                <Rev key={i} delay={i * 0.1}>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 32, alignItems: "flex-start" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: S, border: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontWeight: 700, color: A }}>
                      {(rev.customerName || rev.author || "G")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <h4 style={{ fontSize: 18, fontWeight: 700, color: FG, marginBottom: 4 }}>{rev.customerName || rev.author || "Verified Guest"}</h4>
                          <div style={{ display: "flex", gap: 4, color: "#FFC107", fontSize: 12 }}>
                            {[...Array(5)].map((_, si) => (
                              <span key={si}>{si < (rev.rating || 5) ? "★" : "☆"}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: M, fontWeight: 500 }}>
                          {rev.createdAt ? moment(rev.createdAt).format("MMM YYYY") : "Recently"}
                        </span>
                      </div>
                      <p style={{ fontSize: 15, color: FG, lineHeight: 1.8, fontStyle: "italic", opacity: 0.9 }}>
                        &ldquo;{rev.comment || rev.text || "An absolutely wonderful stay. Everything was perfectly arranged and the host was incredibly helpful throughout our visit."}&rdquo;
                      </p>
                    </div>
                  </div>
                </Rev>
              ))
            )}

            {normalizedReviews.length > 2 && (
              <Rev delay={0.4}>
                <button
                  onClick={() => routerHistory.push(`/reviews/stay/${stayId}`)}
                  style={{
                    background: "none",
                    border: `1px solid ${B}`,
                    padding: "16px 40px",
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                    color: FG,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    cursor: "pointer",
                    transition: "0.3s",
                    width: isMobile ? "100%" : "auto"
                  }}
                >
                  See More
                </button>
              </Rev>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StayLocation({ stay }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, BG, FG, M, S, B, W } } = useTheme();
  const { city, district, state } = getStayLocationParts(stay);

  // Robustly extract coordinates
  const lat = stay?.latitude || stay?.latitude_decimal || stay?.lat || stay?.meetingLatitude || stay?.listingLatitude;
  const lng = stay?.longitude || stay?.longitude_decimal || stay?.lng || stay?.meetingLongitude || stay?.listingLongitude;

  // Robustly extract the full address from various possible backend fields
  const address = stay?.address || stay?.fullAddress || stay?.location || stay?.meetingAddress || [stay?.city, stay?.state, stay?.country].filter(Boolean).join(", ");
  const country = stay?.country || "N/A";

  // Build the query: Prefer coordinates for pinpoint accuracy, fallback to address
  const hasCoords = lat && lng;
  const mapQuery = hasCoords ? `${lat},${lng}` : (address || city);
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=15&output=embed&iwloc=near`;

  if (!address && !stay?.city && !hasCoords) return null;

  const detailRows = [
    { label: "ADDRESS", value: address },
    { label: "CITY", value: city },
    { label: "DISTRICT", value: district || city || "N/A" },
    { label: "STATE", value: state || "N/A" },
    { label: "COUNTRY", value: country },
  ].filter((row) => row.value);

  return (
    <section style={{ background: W, padding: isMobile ? "80px 24px" : "120px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="02" label="PREPARATION" />

        <div className="location-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(400px, 1fr))", gap: isMobile ? 60 : 100, marginTop: 40 }}>
          {/* Left Column: Location Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
            <h2 className="font-display" style={{ fontSize: isMobile ? 32 : 48, fontWeight: 700, color: FG }}>Location</h2>
            <div style={{ background: S, borderRadius: 2, overflow: "hidden", border: `1px solid ${B}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              {/* Card Header Area */}
              <div style={{ padding: isMobile ? "20px" : "24px 32px", background: BG, borderBottom: `1px solid ${B}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <MapPin size={20} color={A} style={{ marginTop: 4 }} />
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: FG, marginBottom: 4 }}>{city}</p>
                    <p style={{ fontSize: 13, color: M, lineHeight: 1.5 }}>{address}</p>
                  </div>
                </div>
              </div>
              {/* Map Area */}
              <div style={{ height: isMobile ? 300 : 400, position: "relative" }}>
                <iframe
                  title="Property Location Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={embedUrl}
                ></iframe>
              </div>
            </div>
          </div>

          {/* Right Column: Location Details Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 24 : 32 }}>
            <h2 className="font-display" style={{ fontSize: isMobile ? 32 : 48, fontWeight: 700, color: FG }}>Location Details</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {detailRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "100px 1fr" : "140px 1fr", gap: isMobile ? 16 : 32, padding: isMobile ? "20px 0" : "28px 0", borderBottom: `1px solid ${B}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: A, textTransform: "uppercase" }}>{row.label}</span>
                  <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: FG, lineHeight: 1.5 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StayDetails;

