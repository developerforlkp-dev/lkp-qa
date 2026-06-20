import React, { useEffect, useState, useMemo, createContext, useContext, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useLocation, useHistory, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  Wifi, Waves, Sparkles, Dumbbell, Umbrella, Plane, GlassWater, Utensils,
  Phone, Clock, FileText, MapPin, ChevronDown, CheckCircle, Info, Building,
  ArrowRight, ShieldCheck, Mail, Globe, Map, Navigation, ArrowDown, Car, AirVent,
  Users, DoorOpen, Bed, Bath, Maximize, Calendar, Star, Share2, Heart, ArrowLeft,
  Tv, Coffee, ChevronLeft, ChevronRight, Plus, Minus
} from "lucide-react";
import moment from "moment";
import cn from "classnames";
import Page from "../../components/Page";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import RoomCards from "./RoomCards";
import { getStayDetails, getHost, getHostContent, createStayOrder, getStayReviews, getEligibleBookings, submitOrderReview } from "../../utils/api";
import StayBookingSystem from "./StayBookingSystem";
import { useTheme, THEMES } from "../../components/JUI/Theme";
import Rating from "../../components/Rating";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import ShareButton from "../../components/ShareButton";
import { lockBodyScroll } from "../../utils/scrollLock";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import Favorite from "../../components/Favorite";

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

    /* Redesigned Premium Gallery Layout */
    .premium-hero-grid {
      position: relative;
      height: 100%;
      width: 100%;
      padding: 24px;
      box-sizing: border-box;
    }
    .hero-spotlight {
      position: relative;
      border-radius: 28px;
      overflow: hidden;
      height: 100%;
      width: 100%;
      background: #0B0B0B;
      box-shadow: 0 20px 48px rgba(0,0,0,0.15);
      border: 1px solid var(--B);
    }
    
    /* Overlay Thumbnails and Action Buttons */
    .hero-thumbnail-strip {
      position: absolute;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 45;
      background: rgba(11, 11, 11, 0.45);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      padding: 8px 12px;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .hero-mini-thumb {
      width: 56px;
      height: 42px;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      opacity: 0.6;
    }
    .hero-mini-thumb:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
    .hero-mini-thumb.active {
      opacity: 1;
      border-color: var(--A, #0097B2);
      transform: scale(1.05) translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .hero-mini-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .premium-view-all-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 14px;
      border-radius: 10px;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .premium-view-all-btn:hover {
      background: #fff;
      color: #000;
      border-color: #fff;
      transform: translateY(-2px);
    }


    /* Refactored Sequential Amenities Layout */
    .editorial-narrative-block {
      max-width: 900px;
      margin: 0 auto 40px auto;
      text-align: center;
    }
    .premium-editorial-tag {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--A);
      margin-bottom: 12px;
      display: inline-block;
    }
    .editorial-headline {
      font-family: var(--font-fraunces, Georgia, serif);
      font-size: clamp(2rem, 4.5vw, 2.8rem);
      font-weight: 700;
      line-height: 1.25;
      margin: 0 0 20px 0;
      color: var(--FG);
    }
    .editorial-divider {
      width: 40px;
      height: 1.5px;
      background: var(--B);
      margin: 16px auto 24px auto;
    }
    
    /* Highlights Banner Strip */
    .highlights-banner {
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
      padding: 28px 20px;
      border-top: 1px solid var(--B);
      border-bottom: 1px solid var(--B);
      margin-bottom: 56px;
      background: var(--S);
      border-radius: 16px;
    }
    .highlight-item {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 180px;
      justify-content: center;
    }
    .highlight-item:not(:last-child) {
      border-right: 1px solid var(--B);
    }
    .highlight-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(0, 151, 178, 0.06);
      color: var(--A);
      flex-shrink: 0;
    }
    .highlight-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .highlight-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--M);
      font-weight: 600;
    }
    .highlight-value {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--FG);
      font-family: "Poppins", sans-serif;
    }

    /* Amenities Grid and Tabs Section */
    .amenities-section-container {
      margin-top: 32px;
    }
    .professional-amenities-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    @media (max-width: 1024px) {
      .professional-amenities-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (max-width: 768px) {
      .professional-amenities-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    .professional-amenity-card {
      background: var(--S);
      border: 1px solid var(--B);
      padding: 16px 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      cursor: default;
    }
    .professional-amenity-card:hover {
      background: var(--W);
      border-color: var(--A);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 151, 178, 0.08);
    }
    .professional-amenity-card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(0, 151, 178, 0.05);
      border: 1px solid var(--B);
      color: var(--A);
      flex-shrink: 0;
      transition: all 0.28s ease;
    }
    .professional-amenity-card:hover .professional-amenity-card-icon {
      background: rgba(0, 151, 178, 0.12);
      border-color: var(--A);
      transform: scale(1.05);
    }
    .professional-amenity-card-label {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--FG);
      font-family: "Poppins", sans-serif;
    }
    .amenities-view-toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 24px auto 0 auto;
      background: none;
      border: 1px solid var(--B);
      padding: 10px 24px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 700;
      color: var(--FG);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .amenities-view-toggle-btn:hover {
      border-color: var(--A);
      color: var(--A);
      background: var(--S);
      transform: translateY(-1px);
    }

     @media(max-width:768px){
      .stay-details-premium .desk-only { display: none !important; }
      .pol-contact-grid, .amenities-grid, .location-grid, .reviews-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .property-stay-card { grid-template-columns: 1fr !important; }
      .premium-hero-grid { padding: 12px; }
      .hero-thumbnail-strip { bottom: 16px; right: 16px; padding: 6px 8px; gap: 6px; border-radius: 12px; }
      .hero-mini-thumb { width: 44px; height: 33px; border-radius: 6px; }
      .premium-view-all-btn { padding: 6px 10px; font-size: 10px; border-radius: 8px; }
      .highlight-item:not(:last-child) { border-right: none !important; }
      .highlights-banner { flex-direction: column !important; align-items: stretch !important; border-radius: 12px !important; padding: 16px !important; }
      .highlight-item { justify-content: flex-start !important; padding-bottom: 12px !important; border-bottom: 1px solid var(--B) !important; }
      .highlight-item:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
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

/* ─── EARLY BIRD TICKER ─────────── */
const EarlyBirdTicker = ({ discounts, A, FG, isDark }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!discounts || discounts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % discounts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [discounts]);

  if (!discounts || discounts.length === 0) return null;

  return (
    <div style={{ display: "grid", height: 15, alignItems: "center", overflow: "hidden" }}>
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            gridArea: "1 / 1",
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: FG || "#FFFFFF",
            fontWeight: 800,
            whiteSpace: "nowrap",
            display: "block"
          }}
        >
          <span style={{ opacity: 0.8 }}>Book</span>{" "}
          <span style={{ color: A, fontSize: 11, fontWeight: 900 }}>
            {discounts[index].daysInAdvance} Days
          </span>{" "}
          <span style={{ opacity: 0.8 }}>Advance:</span>{" "}
          <span style={{ color: isDark === false ? "#059669" : "#4ADE80", fontSize: 12, fontWeight: 900, letterSpacing: "0.1em" }}>
            {discounts[index].percentage}% OFF
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/* ─── STAY SECTIONS ─────────── */
function StayHeroCarousel({ stay, galleryItems = [] }) {
  const history = useHistory();
  const { width, isMobile } = useWindowSize();
  const { theme, tokens: { A, BG, FG, M, S, B, W } } = useTheme();
  const stayWishlistId = stay?.stayId ?? stay?.stay_id ?? stay?.id;
  const title = stay?.propertyName || stay?.title || stay?.name || "STAY EXPERIENCE";
  const { heroText } = getStayLocationParts(stay);
  const locationText = heroText || stay?.locationName || stay?.location || stay?.fullAddress || stay?.address || "Location not available";

  const [[page, direction], setPage] = useState([0, 0]);
  const activeIdx = page;
  const [showFsViewer, setShowFsViewer] = useState(false);

  const allImages = useMemo(() => {
    const collected = [];
    const cover = stay?.coverPhotoUrl || stay?.coverImageUrl || stay?.coverPhoto || stay?.coverImage || stay?.imageUrl || "";
    if (cover) collected.push(fixImageUrl(cover));
    
    if (Array.isArray(galleryItems) && galleryItems.length > 0) {
      galleryItems.forEach(img => {
        const url = fixImageUrl(img);
        if (url && !collected.includes(url)) collected.push(url);
      });
    }
    
    if (collected.length === 0) {
      collected.push("/images/content/card-pic-13.jpg");
    }
    return collected;
  }, [galleryItems, stay]);

  const thumbnailItems = useMemo(() => allImages.slice(0, 5), [allImages]);

  useEffect(() => {
    if (showFsViewer || allImages.length <= 1) return;
    const interval = setInterval(() => {
      setPage(prev => [(prev[0] + 1) % allImages.length, 1]);
    }, 4500);
    return () => clearInterval(interval);
  }, [allImages.length, showFsViewer]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setPage(prev => [(prev[0] - 1 + allImages.length) % allImages.length, -1]);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setPage(prev => [(prev[0] + 1) % allImages.length, 1]);
  };

  const handleThumbnailClick = (idx) => {
    if (idx === activeIdx) return;
    const dir = idx > activeIdx ? 1 : -1;
    setPage([idx, dir]);
  };

  const openFullscreen = (idx) => {
    setPage([idx, 0]);
    setShowFsViewer(true);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? "100%" : direction > 0 ? "-100%" : 0,
      opacity: 0,
    }),
  };

  return (
    <section style={{ position: "relative", height: isMobile ? "60vh" : "75vh", background: BG, overflow: "hidden", padding: "0", zIndex: 50 }}>
      <div className="premium-hero-grid">
        
        {/* Main Cover Image View */}
        <div className="hero-spotlight" onClick={() => openFullscreen(activeIdx)} style={{ cursor: "pointer" }}>
          {/* Main Visual */}
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={activeIdx}
              src={allImages[activeIdx] || allImages[0]}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.25 },
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              alt={title}
            />
          </AnimatePresence>

          {/* Dark visual gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)", pointerEvents: "none" }} />

          {/* Left/Right Arrow Overlays */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                style={{
                  position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", zIndex: 30, transition: "all 0.3s ease"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                style={{
                  position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", zIndex: 30, transition: "all 0.3s ease"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-50%) scale(1)"; }}
              >
                <ChevronLeft size={20} style={{ transform: "rotate(180deg)" }} />
              </button>
            </>
          )}

          {/* Thumbnails & View button in right bottom corner */}
          <div className="hero-thumbnail-strip">
            {thumbnailItems.map((imgUrl, idx) => (
              <div
                key={idx}
                className={cn("hero-mini-thumb", { active: activeIdx === idx })}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThumbnailClick(idx);
                }}
              >
                <img src={imgUrl} alt="" />
              </div>
            ))}
            {allImages.length > 0 && (
              <button
                type="button"
                className="premium-view-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openFullscreen(activeIdx);
                }}
              >
                <Plus size={14} />
                <span>View Photos</span>
              </button>
            )}
          </div>

          {/* Redesigned Premium Overlay Details */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: isMobile ? "24px 20px" : "48px 48px",
            background: "linear-gradient(to top, rgba(11, 11, 11, 0.85) 0%, rgba(11, 11, 11, 0.4) 60%, rgba(11, 11, 11, 0) 100%)",
            zIndex: 40,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            height: "60%"
          }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}
            >
              
              {/* Category / Property Type */}
              <div style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                fontSize: isMobile ? "11px" : "14px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontFamily: "Poppins, sans-serif",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)"
              }}>
                {toDisplayString(stay?.propertyType) || "EXCEPTIONAL"}
              </div>

              {/* Stay Name/Title */}
              <h1 className="hero-title" style={{
                fontSize: isMobile ? "clamp(1.8rem, 5.5vw, 2.4rem)" : "3.5rem",
                fontWeight: 800,
                lineHeight: 1.2,
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                margin: "4px 0 8px 0",
                letterSpacing: "-0.015em",
                fontFamily: "Poppins, sans-serif",
                textShadow: "0 4px 24px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
                wordBreak: "break-word"
              }}>
                {title}
              </h1>

              {/* Location */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", WebkitTextFillColor: "#E0E0E0", fontSize: isMobile ? "12px" : "14px", fontWeight: 500 }}>
                <MapPin size={15} color={A || "#0097B2"} style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))" }} />
                <span style={{ textShadow: "0 2px 10px rgba(0, 0, 0, 0.55)", WebkitTextFillColor: "#E0E0E0" }}>{locationText}</span>
              </div>

            </motion.div>
          </div>
        </div>

      </div>

      {/* Floating Badges & Back/Share Controls */}
      {!isMobile && (
        <div style={{ position: "absolute", top: 44, left: 44, zIndex: 60, pointerEvents: "none" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ width: 80, height: 80 }}>
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
              <path id="badgePath" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="transparent" />
              <text style={{ fontSize: 7, fontWeight: 900, fill: A, textTransform: "uppercase", letterSpacing: "2.4px" }}>
                <textPath xlinkHref="#badgePath">Luxury Retreat — Premium Stay —</textPath>
              </text>
            </svg>
          </motion.div>
        </div>
      )}

      {/* Early Bird Overlay */}
      {!isMobile && stay?.earlyBirdDiscounts?.some(d => d.isActive) && (
        <div style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          zIndex: 40,
          background: theme === 'dark' ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          padding: "16px 24px",
          borderRadius: 24,
          border: theme === 'dark' ? "1px solid rgba(255,255,255,0.1)" : `1px solid ${B}`,
          boxShadow: theme === 'dark' ? "0 20px 50px rgba(0,0,0,0.3)" : `0 20px 50px ${M}22`,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <Sparkles size={20} color={A} />
          <EarlyBirdTicker discounts={stay.earlyBirdDiscounts.filter(d => d.isActive).sort((a, b) => b.percentage - a.percentage)} A={A} FG={theme === 'dark' ? "#FFF" : FG} isDark={theme === "dark"} />
        </div>
      )}

      <button
        type="button"
        className="premium-back-button"
        onClick={() => history.goBack()}
        aria-label="Go back"
        style={{ zIndex: 70 }}
      >
        <ChevronLeft size={20} />
      </button>

      <HeroShareFab
        title={title}
        text={stay?.shortDescription || stay?.description || ""}
        url={window.location.href}
      />

      <Favorite
        itemType="stay"
        itemId={stayWishlistId}
        variant="hero"
        showText={false}
        style={{
          position: "absolute",
          top: 96,
          right: 116,
          zIndex: 70,
        }}
      />

      {ReactDOM.createPortal(
        <AnimatePresence>
          {showFsViewer && (
            <FullScreenImage
              src={allImages[activeIdx]}
              items={allImages}
              currentIndex={activeIdx}
              onNavigate={handleThumbnailClick}
              onClose={() => setShowFsViewer(false)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}

function StayAmenities({ stay }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, S, B, W } } = useTheme();
  const [expanded, setExpanded] = useState(false);

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
      return item?.name || item?.amenityName || item?.facilityName || item?.amenity || item?.facility || item?.label || item?.title || item?.value || "";
    }).filter(Boolean);
  };

  const dynamicFacilities = useMemo(() => {
    const list = stay?.facilities || stay?.propertyFacilities || stay?.stayFacilities || stay?.facilityList || stay?.amenities || stay?.propertyAmenities || stay?.stayAmenities || [];
    return extractList(list);
  }, [stay]);

  const short = stay?.shortDescription || "A sanctuary redefined at the water's edge.";
  const description = stay?.detailedDescription || stay?.description || "Experience the pinnacle of hospitality where architecture meets the raw beauty of nature.";

  const descSentences = description.split(/(?<=\.)\s+/);
  const leadParagraph = descSentences.slice(0, 2).join(" ");
  const bodyParagraph = descSentences.slice(2).join(" ");

  const highlights = useMemo(() => {
    return [
      { label: "Accommodation", value: toDisplayString(stay?.propertyType) || "Bespoke Retreat", icon: Building },
      { label: "Max Capacity", value: stay?.maxGuests ? `${stay.maxGuests} Guests` : "Flexible Occupancy", icon: Users },
      { label: "House Rules", value: stay?.coupleFriendly ? "Couple Friendly" : "Standard Rules", icon: ShieldCheck },
      { label: "Pet Policy", value: stay?.petAllowed ? "Pets Welcomed" : "No Pets", icon: Sparkles }
    ];
  }, [stay]);

  return (
    <section style={{ background: W, padding: isMobile ? "32px 24px" : "32px 80px", boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <Soul y={isMobile ? 30 : 60} s={0.03}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            
            {/* 1. Full-Width Highlights Banner (Moved to top) */}
            <Rev className="highlights-banner">
              {highlights.map((h, i) => {
                const IconComp = h.icon;
                return (
                  <div key={i} className="highlight-item">
                    <div className="highlight-icon-box">
                      <IconComp size={18} />
                    </div>
                    <div className="highlight-info">
                      <span className="highlight-label">{h.label}</span>
                      <span className="highlight-value">{h.value}</span>
                    </div>
                  </div>
                );
              })}
            </Rev>

            {/* 2. Full-Width Editorial Narrative (Detailed Description) */}
            <Rev className="editorial-narrative-block">
              <span className="premium-editorial-tag">Overview</span>
              <h2 className="editorial-headline">{short}</h2>
              <div className="editorial-divider" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxW: 800, margin: "0 auto" }}>
                <p style={{ fontSize: "16px", color: FG, lineHeight: 1.75, fontWeight: 500, opacity: 0.95, margin: 0, fontFamily: "Poppins, sans-serif" }}>
                  {leadParagraph}
                </p>
                {bodyParagraph && (
                  <p style={{ fontSize: "14px", color: M, lineHeight: 1.7, margin: 0, fontWeight: 400, opacity: 0.85 }}>
                    {bodyParagraph}
                  </p>
                )}
              </div>
            </Rev>

            {/* 3. Full-Width Amenities Grid Section (Facilities & Services) */}
            <div className="amenities-section-container">
              {dynamicFacilities.length > 0 ? (
                <Rev delay={0.1}>
                  <div className="professional-amenities-grid">
                    {(expanded ? dynamicFacilities : dynamicFacilities.slice(0, 8)).map((label) => {
                      const IconComp = getIcon(label);
                      return (
                        <div key={label} className="professional-amenity-card">
                          <div className="professional-amenity-card-icon">
                            <IconComp size={15} />
                          </div>
                          <span className="professional-amenity-card-label">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {dynamicFacilities.length > 8 && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="amenities-view-toggle-btn"
                    >
                      {expanded ? "View Less" : "View More"}
                    </button>
                  )}
                </Rev>
              ) : (
                <div style={{ padding: "40px", background: S, borderRadius: 16, border: `1px solid ${B}`, textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: M, margin: 0 }}>No dynamic facilities available for this property.</p>
                </div>
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

function PolicyItem({ rule }) {
  const { tokens: { FG, A, M, AL, B, W } } = useTheme();
  const [op, setOp] = useState(false);

  const title = rule.title || "Requirement";
  const description = rule.body;
  const questions = rule.questions || [];

  const getIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cancellation")) {
      return <Clock size={20} color={A} />;
    }
    if (
      lowerTitle.includes("age") ||
      lowerTitle.includes("guest") ||
      lowerTitle.includes("people") ||
      lowerTitle.includes("id required") ||
      lowerTitle.includes("minimum age")
    ) {
      return <Users size={20} color={A} />;
    }
    if (
      lowerTitle.includes("health") ||
      lowerTitle.includes("safety") ||
      lowerTitle.includes("medical") ||
      lowerTitle.includes("rule") ||
      lowerTitle.includes("pet") ||
      lowerTitle.includes("couple")
    ) {
      return <ShieldCheck size={20} color={A} />;
    }
    return <Sparkles size={20} color={A} />;
  };

  return (
    <motion.div
      layout
      style={{
        background: op ? AL : W,
        border: `1px solid ${op ? A : B}`,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "16px",
        transition: "background 0.3s, border-color 0.3s",
        boxShadow: op ? "0 8px 30px rgba(0, 0, 0, 0.04)" : "none",
      }}
      whileHover={{ borderColor: A }}
    >
      <div
        onClick={() => setOp(!op)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          cursor: "pointer",
          textAlign: "left",
          userSelect: "none",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: op ? `${A}22` : AL,
          flexShrink: 0,
          transition: "background 0.3s",
        }}>
          {getIcon()}
        </div>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: FG, display: "block" }}>{title}</span>
        </div>

        <motion.div
          animate={{ rotate: op ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: op ? W : "transparent" }}
        >
          <ChevronDown size={18} color={M} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {op && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 24px 80px" }}>
              {description && (
                <p style={{ fontSize: 13, color: M, lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 16px 0" }}>
                  {description}
                </p>
              )}

              {questions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.map((q, j) => {
                    const questionTitle = q.title || q.question?.title;
                    const answerText = q.answer?.valueText || q.valueText;

                    return (
                      <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "4px 0" }}>
                        <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 8 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: FG, lineHeight: 1.5, fontWeight: 500 }}>{questionTitle}</span>
                          {answerText && (
                            <span style={{ fontSize: 13, color: M, lineHeight: 1.4 }}>{answerText}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PolicyCategoryItem({ category }) {
  const { tokens: { FG, A, M, AL, B, W } } = useTheme();
  const [op, setOp] = useState(false);

  const getIcon = () => {
    const lowerTitle = category.title.toLowerCase();
    if (lowerTitle.includes("cancellation")) {
      return <Clock size={20} color={A} />;
    }
    if (lowerTitle.includes("guest") || lowerTitle.includes("requirements")) {
      return <Users size={20} color={A} />;
    }
    return <ShieldCheck size={20} color={A} />;
  };

  return (
    <motion.div
      layout
      style={{
        background: op ? AL : W,
        border: `1px solid ${op ? A : B}`,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "16px",
        transition: "background 0.3s, border-color 0.3s",
        boxShadow: op ? "0 8px 30px rgba(0, 0, 0, 0.04)" : "none",
      }}
      whileHover={{ borderColor: A }}
    >
      <div
        onClick={() => setOp(!op)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          cursor: "pointer",
          textAlign: "left",
          userSelect: "none",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          background: op ? `${A}22` : AL,
          flexShrink: 0,
          transition: "background 0.3s",
        }}>
          {getIcon()}
        </div>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: FG, display: "block" }}>{category.title}</span>
        </div>

        <motion.div
          animate={{ rotate: op ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: op ? W : "transparent" }}
        >
          <ChevronDown size={18} color={M} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {op && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 24px 80px", display: "flex", flexDirection: "column", gap: 16 }}>
              {category.items.map((item, idx) => (
                <div key={item.id || idx} style={{ borderBottom: idx === category.items.length - 1 ? "none" : `1px solid ${B}`, paddingBottom: idx === category.items.length - 1 ? 0 : 16, paddingTop: idx === 0 ? 0 : 16 }}>
                  {item.title && item.title !== item.body && (
                    <span style={{ fontSize: "14px", fontWeight: 700, color: FG, display: "block", marginBottom: 6 }}>{item.title}</span>
                  )}
                  {item.body && (
                    <p style={{ fontSize: 13, color: M, lineHeight: 1.6, whiteSpace: "pre-line", margin: 0 }}>
                      {item.body}
                    </p>
                  )}
                  {item.questions && item.questions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                      {item.questions.map((q, j) => {
                        const questionTitle = q.title || q.question?.title;
                        const answerText = q.answer?.valueText || q.valueText;
                        return (
                          <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 7 }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 13, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{questionTitle}</span>
                              {answerText && (
                                <span style={{ fontSize: 12, color: M, lineHeight: 1.4 }}>{answerText}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

  function StayPolicies({ stay }) {
  const { tokens: { FG, W, B, A, M, BG }, theme } = useTheme();
  const { isMobile } = useWindowSize();

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

    // Property Rules
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

    // Guest Requirements
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

    // Cancellation Policy
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

    return categories;
  }, [stay]);

  return (
    <section className="policies-section" style={{ background: BG, padding: isMobile ? "32px 24px" : "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "45fr 55fr", gap: isMobile ? 40 : 64, alignItems: "start" }} className="pol-grid">
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 12, fontFamily: "Poppins, sans-serif" }}>
                Things to Keep in Mind
              </h3>
              <p style={{ color: M, fontSize: "15px", lineHeight: "1.8", margin: 0, fontWeight: 400 }}>
                Please review these guidelines, requirements, and policies carefully to ensure a safe, smooth, and enjoyable stay.
              </p>
            </div>
          </Rev>
          <Rev delay={0.2}>
            <div>
              {policies.map((category) => (
                <PolicyCategoryItem key={category.id} category={category} />
              ))}
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

function StayHostQuality({ stay, hostData, hostAvatar }) {
  const history = useHistory();
  const { isMobile } = useWindowSize();
  const { tokens: { A, AL, BG, FG, M, S, B, W }, theme } = useTheme();

  const hostProfileId =
    hostData?.host?.hostId ||
    hostData?.hostId ||
    stay?.hostId ||
    stay?.host?.hostId ||
    stay?.leadUserId ||
    stay?.userId ||
    null;

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

  const frontOffice = stay?.contactInformation?.frontOfficePhone || stay?.frontOfficePhone || stay?.frontOfficeContact;

  return (
    <section className="host-quality-section" style={{ background: W, padding: isMobile ? "32px 24px" : "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "4fr 6fr", gap: isMobile ? 40 : 64 }} className="host-quality-grid">
          
          {/* Host Profile (40%) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
            <Rev delay={0.1}>
              <div 
                style={{
                  background: theme === "dark" 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)"
                    : "linear-gradient(135deg, #FFFFFF 0%, rgba(248, 250, 252, 0.9) 100%)",
                  border: `1px solid ${B}`,
                  borderRadius: "24px",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: theme === "dark"
                    ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                    : "0 20px 40px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 250,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.borderColor = A; 
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = theme === "dark"
                    ? `0 24px 48px ${A}15`
                    : `0 24px 48px rgba(15, 23, 42, 0.08)`;
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.borderColor = B; 
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = theme === "dark"
                    ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                    : "0 20px 40px rgba(15, 23, 42, 0.04)";
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${A} 0%, #8B5CF6 100%)`
                }} />

                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  gap: 16, 
                  width: "100%",
                  padding: "20px 20px 16px 20px",
                  background: theme === "dark" ? "rgba(255, 255, 255, 0.015)" : "rgba(0, 0, 0, 0.01)",
                  borderBottom: `1px solid ${B}`
                }}>
                  
                  {/* Avatar & Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      position: "relative",
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      padding: "2px",
                      background: `linear-gradient(135deg, ${A} 0%, #8B5CF6 100%)`,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: W,
                        overflow: "hidden",
                        padding: "1px"
                      }}>
                        <img
                          src={hostAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(primaryName)}&backgroundColor=0097B2&color=ffffff`}
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                          alt={primaryName}
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(primaryName)}&backgroundColor=0097B2&color=ffffff`; 
                          }}
                        />
                      </div>
                      <div style={{ 
                        position: "absolute", 
                        bottom: -1, 
                        right: -1, 
                        width: 16, 
                        height: 16, 
                        borderRadius: "50%", 
                        background: "#10B981", 
                        border: `1.5px solid ${W}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
                      }}>
                        <ShieldCheck size={9} color={W} style={{ fill: W, fillOpacity: 0.2 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                      <h3
                        onClick={() => { if (hostProfileId) history.push(`/host-profile?id=${hostProfileId}`); }}
                        style={{
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: FG,
                          margin: 0,
                          cursor: hostProfileId ? "pointer" : "default",
                          fontFamily: "Poppins, sans-serif",
                          letterSpacing: "-0.01em",
                          lineHeight: 1.2,
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => { if (hostProfileId) e.currentTarget.style.color = A; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = FG; }}
                        title={hostProfileId ? "View host profile" : undefined}
                      >
                        {primaryName}
                      </h3>
                      <span style={{ 
                        fontSize: "8.5px", 
                        letterSpacing: "0.04em", 
                        textTransform: "uppercase", 
                        color: "#7C3AED", 
                        background: theme === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.08)",
                        border: `1px solid ${theme === "dark" ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.18)"}`,
                        borderRadius: "5px",
                        padding: "1px 6px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center"
                      }}>
                        Superhost
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{
                      background: theme === "dark" ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
                      border: `1px solid ${theme === "dark" ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)"}`,
                      borderRadius: "10px",
                      padding: "6px 10px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 46
                    }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
                        ★ {hostData?.statistics?.averageRating || "4.9"}
                      </span>
                      <span style={{ fontSize: "7px", color: "#B45309", textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 600, marginTop: 2 }}>Rating</span>
                    </div>

                    <div style={{
                      background: theme === "dark" ? "rgba(0, 151, 178, 0.08)" : "rgba(0, 151, 178, 0.05)",
                      border: `1px solid ${theme === "dark" ? "rgba(0, 151, 178, 0.2)" : "rgba(0, 151, 178, 0.12)"}`,
                      borderRadius: "10px",
                      padding: "6px 10px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      minWidth: 46
                    }}>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: A, lineHeight: 1 }}>
                        {hostData?.statistics?.totalEvents || hostData?.listings?.length || 8}
                      </span>
                      <span style={{ fontSize: "7px", color: A, textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 600, marginTop: 2 }}>Events</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div style={{ 
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderLeft: `3px solid ${A}`,
                  margin: "12px 20px"
                }}>
                  <p style={{
                    fontSize: "12.5px",
                    color: M,
                    lineHeight: 1.55,
                    margin: 0,
                    fontWeight: 400,
                    fontStyle: "italic",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical"
                  }}>
                    "{hostData?.host?.bio || hostData?.bio || "Experienced host dedicated to providing memorable, curated journeys and sharing local culture, history, and secrets."}"
                  </p>
                </div>
              </div>
            </Rev>

          </div>

          {/* Quality Index Card (60%) */}
          <Rev delay={0.2} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{
                padding: "24px 32px",
                background: theme === "dark" 
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)"
                  : "linear-gradient(135deg, #FFFFFF 0%, rgba(248, 250, 252, 0.9) 100%)",
                backdropFilter: "blur(25px) saturate(160%)",
                border: `1px solid ${B}`,
                borderRadius: "24px",
                boxShadow: theme === "dark"
                  ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                  : "0 20px 40px rgba(15, 23, 42, 0.04)",
                display: "flex",
                alignItems: "center",
                gap: 32,
                height: "100%",
                minHeight: 250,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.borderColor = A; 
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = theme === "dark"
                  ? `0 24px 48px ${A}15`
                  : `0 24px 48px rgba(15, 23, 42, 0.08)`;
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.borderColor = B; 
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = theme === "dark"
                  ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                  : "0 20px 40px rgba(15, 23, 42, 0.04)";
              }}
              >
                {/* Visual Accent Top Bar */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, #8B5CF6 0%, ${A} 100%)`
                }} />

                {/* Background Ambient Glow under the circle */}
                <div style={{
                  position: "absolute",
                  left: 20,
                  top: 50,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${A}12 0%, rgba(255,255,255,0) 70%)`,
                  pointerEvents: "none"
                }} />

                {/* Left: Score Circle */}
                {(() => {
                  const displayScore = stay?.lkpQualityIndex?.score || 9.2;
                  const scoreInt = Math.floor(displayScore);
                  const scoreDec = (displayScore - scoreInt).toFixed(1).replace("0.", "");

                  return (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.05))" }}>
                        <defs>
                          <linearGradient id="scoreGradStay" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor={A} />
                          </linearGradient>
                          <filter id="glowStay" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        <circle cx="65" cy="65" r="55" fill="none" stroke={`${A}12`} strokeWidth="3" />
                        <motion.circle
                          cx="65" cy="65" r="55" fill="none" stroke="url(#scoreGradStay)" strokeWidth="6" strokeLinecap="round"
                          style={{ filter: "url(#glowStay)" }}
                          initial={{ strokeDasharray: "0 346" }}
                          whileInView={{ strokeDasharray: `${(displayScore / 10) * 346} 346` }}
                          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </svg>
                      <div style={{ position: "absolute", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
                          <span style={{ fontSize: 42, fontWeight: 900, color: FG, letterSpacing: "-0.05em", fontFamily: "Poppins, sans-serif" }}>{scoreInt}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: A, marginLeft: 1 }}>.{scoreDec}</span>
                        </div>
                        <span style={{ fontSize: 8, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.1em" }}>LKP Index</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Right: Narrative Details & Verification Checks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                  <div>
                    <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800, color: "#8B5CF6", display: "block", marginBottom: 4 }}>Quality Index</span>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: FG, margin: 0, fontFamily: "Poppins, sans-serif" }}>Verified Trust Score</h4>
                  </div>
                  
                  <p style={{ fontSize: 12.5, color: M, lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
                    {stay?.lkpQualityIndex?.description || "Consistently delivers outstanding hospitality, verified standards, and top-tier guest experiences."}
                  </p>

                  {/* Verification Criteria Pills */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: A,
                      background: theme === "dark" ? "rgba(0, 151, 178, 0.08)" : "rgba(0, 151, 178, 0.05)",
                      border: `1px solid ${theme === "dark" ? "rgba(0, 151, 178, 0.2)" : "rgba(0, 151, 178, 0.12)"}`,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      ✓ Verified Host
                    </span>

                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#10B981",
                      background: theme === "dark" ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
                      border: `1px solid ${theme === "dark" ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)"}`,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      ✓ Safety Check
                    </span>

                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#D97706",
                      background: theme === "dark" ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
                      border: `1px solid ${theme === "dark" ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)"}`,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4
                    }}>
                      ✓ High Rated
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Rev>


        </div>
      </div>
    </section>
  );
}

function StayAddons({ stay, selectedAddOns, onToggleAddOn, addOnQuantities, onAddOnQuantityChange }) {
  const { isMobile } = useWindowSize();
  const { theme, tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();

  const activeAddons = useMemo(() => {
    return Array.isArray(stay?.addons) 
      ? stay.addons.filter(a => a.isActive || a.status === 'Active') 
      : [];
  }, [stay]);

  if (activeAddons.length === 0) return null;

  return (
    <div style={{ background: BG, padding: isMobile ? "80px 16px 40px" : "140px 36px 80px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="03" label="Enhance Your Stay" />
        
        <Rev delay={0.4} style={{ marginTop: 40 }}>
          <div style={{ background: W, border: `1px solid ${B}`, padding: isMobile ? "32px 20px" : "64px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2.5fr", gap: isMobile ? 32 : 80 }} className="details-inner">
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: A, marginBottom: 16, fontWeight: 600 }}>Make it Yours</p>
              <p style={{ fontSize: 14, color: M, marginBottom: 0, lineHeight: 1.7 }}>
                Elevate your stay with our thoughtfully curated selection of premium amenities and personalized services.
              </p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32 }}>
              {activeAddons.map(addon => {
                const addonId = addon.addonId || addon.assignmentId || addon.id;
                const isSelected = selectedAddOns.includes(addonId);
                const isIndividual = addon.pricingType === "Individual";
                const qty = isIndividual ? (addOnQuantities[addonId] || 1) : 1;
                const price = parseFloat(addon.price || 0);
                const imageUrl = Array.isArray(addon.imageUrls) && addon.imageUrls[0] ? fixImageUrl(addon.imageUrls[0]) : null;
                
                return (
                  <motion.div
                    key={addonId}
                    whileHover={{ x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="addon-item"
                    style={{
                      display: "flex",
                      gap: 24,
                      alignItems: "center",
                      padding: "20px",
                      background: isSelected ? AL : "transparent",
                      borderRadius: 24,
                      border: `1px solid ${isSelected ? A : B}`,
                      transition: "0.3s"
                    }}
                  >
                    <div className="addon-img" style={{ background: AL, width: 64, height: 64, borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${B}` }}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={addon.title || addon.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Plus size={24} color={A} />
                      )}
                    </div>
                    <div className="addon-content" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="addon-header">
                        <div className="addon-title" style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: FG, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{addon.title || addon.name}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="addon-actions">
                          <span className="addon-badge" style={{ fontSize: 10, fontWeight: 700, color: addon.pricingType === "Group" ? "#d14343" : A, background: addon.pricingType === "Group" ? "#d1434322" : AL, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>{addon.pricingType}</span>
                          {isSelected ? (
                            addon.pricingType === "Group" ? (
                              <button
                                className="addon-btn addon-btn-remove"
                                onClick={() => onToggleAddOn(addonId, addon.pricingType)}
                                style={{
                                  background: AL,
                                  color: A,
                                  border: `1px solid ${A}`,
                                  borderRadius: 100,
                                  padding: "0 16px",
                                  height: "32px",
                                  display: "flex",
                                  alignItems: "center",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em"
                                }}
                              >
                                Remove
                              </button>
                            ) : (
                              <div className="addon-counter" style={{ display: "flex", alignItems: "center", gap: 12, background: S, borderRadius: 100, padding: "0 10px", height: "32px", border: `1px solid ${B}` }}>
                                <button
                                  onClick={() => onAddOnQuantityChange(addonId, qty - 1)}
                                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, color: A }}
                                >
                                  <Minus size={12} />
                                </button>
                                <span style={{ fontSize: 12, fontWeight: 700, color: FG, minWidth: 16, textAlign: "center" }}>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => onAddOnQuantityChange(addonId, qty + 1)}
                                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, color: A }}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )
                          ) : (
                            <button
                              className="addon-btn addon-btn-add"
                              onClick={() => onToggleAddOn(addonId, addon.pricingType)}
                              style={{
                                background: S,
                                color: FG,
                                border: `1px solid ${B}`,
                                borderRadius: 100,
                                padding: "0 16px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                              }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                      {(addon.briefDescription || addon.description) && (
                        <p className="addon-desc" style={{ fontSize: 13, color: M, lineHeight: 1.5, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{addon.briefDescription || addon.description}</p>
                      )}
                      {price > 0 && (
                        <div className="addon-price" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: FG }}>+ {addon.currency || "₹"} {price.toFixed(2)}</p>
                          {isSelected && qty > 1 && (
                            <p style={{ fontSize: 11, fontWeight: 500, color: M }}>
                              × {qty} = {addon.currency || "₹"} {(price * qty).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Rev>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────── */
const StayDetails = () => {
  const { width, isMobile } = useWindowSize();
  const { theme, tokens: { BG, FG, W, B, S, M, A } } = useTheme();
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
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [addOnQuantities, setAddOnQuantities] = useState({});

  const handleToggleAddOn = useCallback((addOnId, pricingType) => {
    setSelectedAddOns((prev) => {
      if (prev.includes(addOnId)) {
        return prev.filter((id) => id !== addOnId);
      } else {
        if (pricingType === "Individual") {
          setAddOnQuantities((qPrev) => ({ ...qPrev, [addOnId]: qPrev[addOnId] || 1 }));
        }
        return [...prev, addOnId];
      }
    });
  }, []);

  const handleAddOnQuantityChange = useCallback((addOnId, value) => {
    if (value <= 0) {
      setSelectedAddOns((prev) => prev.filter((id) => id !== addOnId));
    } else {
      setAddOnQuantities((prev) => ({ ...prev, [addOnId]: value }));
      setSelectedAddOns((prev) => prev.includes(addOnId) ? prev : [...prev, addOnId]);
    }
  }, []);

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

  const handleRoomSelect = useCallback((roomId, mealPlan, action = "toggle") => {
    const rid = String(roomId);
    setSelectedRooms(prev => {
      const exists = prev.find(r => r.roomId === rid);
      if (exists) {
        if (action === "update") {
          return prev.map((room) => (
            room.roomId === rid
              ? { ...room, mealPlan: mealPlan || room.mealPlan || "EP" }
              : room
          ));
        }

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
          if (hostId) getHostContent(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));

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

      <div style={{ background: W, padding: isMobile ? "32px 24px" : "32px 80px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SHdr idx="04" label="Accommodations" />
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
        const rawTags = Array.isArray(stay?.tags) && stay.tags.length > 0
          ? stay.tags.map((t) => (typeof t === "string" ? t : t?.name || t?.tag || t?.label || t?.value || "")).filter(Boolean)
          : ["Bespoke Service", "Privacy Guaranteed", "Direct Connection", "Luxury Accommodations", "Stunning Views", "Premium Amenities"];
        
        // Duplicate to ensure infinite seamless scrolling loop
        const loopedTags = [...rawTags, ...rawTags, ...rawTags, ...rawTags];

        const estimatedTagWidth = (tag) => tag.length * 9.5 + 75; // text width + margin + icon + padding
        const tagsDistance = rawTags.reduce((sum, tag) => sum + estimatedTagWidth(tag), 0) * 2; // offset 50% is rawTags * 2
        const tagsDuration = tagsDistance / 60; // constant speed of 60px/s

        return (
          <div style={{
            margin: "24px 0 48px",
            overflow: "hidden",
            position: "relative",
            padding: "20px 0",
            background: theme === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
            borderTop: `1px solid ${B}`,
            borderBottom: `1px solid ${B}`,
          }}>
            {/* Left & Right Edge Fades */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "160px", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "160px", background: `linear-gradient(to left, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: tagsDuration }}
              style={{ display: "flex", alignItems: "center", gap: 32, width: "max-content" }}
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
                      whiteSpace: "nowrap"
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
                    <Sparkles size={14} color="#F59E0B" fill="#F59E0B" style={{ opacity: 0.6 }} />
                  </div>
                );
              })}
            </motion.div>
          </div>
        );
      })()}

      <StayLocation stay={stay} />

      <StayPolicies stay={stay} />

      <StayHostQuality stay={stay} hostData={hostData} hostAvatar={hostAvatar} />

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
        selectedAddOns={selectedAddOns}
        addOnQuantities={addOnQuantities}
        onAddOnQuantityChange={handleAddOnQuantityChange}
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

const FullScreenImage = ({ src, items = [], currentIndex = 0, onNavigate, onClose }) => {
  const { theme, tokens: { BG, A } } = useTheme();
  const isDark = theme === "dark" || (typeof BG === 'string' && BG.toLowerCase().includes('000'));

  const textMain = isDark ? '#FFF' : '#141414';
  const pillBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)';
  const pillText = A || '#0097B2';

  const btnBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)';
  const btnHoverBg = isDark ? 'rgba(255,255,255,0.2)' : '#FFFFFF';

  const hasNavigation = Array.isArray(items) && items.length > 1 && typeof onNavigate === "function";

  useEffect(() => {
    return lockBodyScroll();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 40px)',
      }}
      onClick={onClose}
    >
      <style>{`
        .fs-modal-box {
          width: 100%;
          max-width: 1400px;
          height: 85vh;
          background: ${isDark ? '#0A0A0A' : '#FFFFFF'};
          border-radius: 32px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.25);
          display: flex;
          overflow: hidden;
          position: relative;
          transform: translateZ(0);
          -webkit-mask-image: -webkit-radial-gradient(white, black);
        }
        
        .fs-left-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          background: ${isDark ? '#141414' : '#FFFFFF'};
        }
        
        .fs-right-pane {
          width: clamp(200px, 20vw, 300px);
          display: flex;
          flex-direction: column;
          border-left: 1px solid ${isDark ? '#333' : '#F0F0F0'};
          background: ${isDark ? '#0A0A0A' : '#FAFAFA'};
        }
        
        .fs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
        }
        
        .fs-image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .fs-image {
          object-fit: contain !important;
          width: 100% !important;
          height: 100% !important;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.08));
          position: absolute;
          top: 0;
          left: 0;
          padding: 24px;
          box-sizing: border-box;
        }
        
        .fs-thumbnail-list {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
        }
        
        .fs-nav-btn {
          position: absolute;
          top: 50%;
          margin-top: -24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${btnBg};
          border: 1px solid ${btnBorder};
          color: ${textMain};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          z-index: 10;
        }
        .fs-nav-left {
          left: 24px;
        }
        .fs-nav-right {
          right: 24px;
        }
        
        .fs-thumbnail-list::-webkit-scrollbar {
          display: none;
        }
        
        .fs-thumb {
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-sizing: border-box;
          transform: scale(0.98);
        }
        
        .fs-thumb:hover {
          opacity: 0.8;
        }
        
        .fs-thumb.active {
          opacity: 1;
          border: 3px solid ${A || '#0097B2'};
          box-shadow: 0 10px 24px ${A ? A + '40' : 'rgba(0,151,178,0.25)'};
          transform: scale(1.02);
        }

        @media (max-width: 900px) {
          .fs-modal-box {
            flex-direction: column;
            height: 90vh;
            border-radius: 24px 24px 0 0;
            margin-top: auto;
            align-self: flex-end;
          }
          
          .fs-right-pane {
            width: 100%;
            height: clamp(100px, 15vh, 140px);
            border-left: none;
            border-top: 1px solid ${isDark ? '#333' : '#F0F0F0'};
          }
          
          .fs-thumbnail-list {
            flex-direction: row;
            overflow-y: hidden;
            overflow-x: auto;
            padding: 16px 20px;
            align-items: center;
          }
          
          .fs-thumb {
            width: clamp(80px, 25vw, 140px);
            height: 100%;
            flex-shrink: 0;
          }
          
          .fs-header {
            padding: 16px 20px;
          }
          
          .fs-image-container {
            padding: 0;
          }
          .fs-image {
            padding: 12px;
          }
          .fs-nav-btn {
            width: 40px;
            height: 40px;
            margin-top: -20px;
          }
          .fs-nav-left { left: 12px; }
          .fs-nav-right { right: 12px; }
        }
      `}</style>

      <motion.div
        className="fs-modal-box"
        initial={{ y: 50, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* LEFT PANE - Image Viewer */}
        <div className="fs-left-pane">
          <div className="fs-header">
            {hasNavigation ? (
              <div style={{ background: pillBg, backdropFilter: 'blur(20px)', border: `1px solid ${pillBorder}`, padding: '8px 24px', borderRadius: 100, color: pillText, fontSize: 13, letterSpacing: '0.15em', fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                {currentIndex + 1} <span style={{ opacity: 0.3, margin: '0 6px', color: textMain }}>/</span> <span style={{ color: textMain }}>{items.length}</span>
              </div>
            ) : <div />}

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
              whileTap={{ scale: 0.92 }}
              style={{ width: 48, height: 48, borderRadius: '50%', background: btnBg, border: `1px solid ${btnBorder}`, color: textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
            >
              <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
            </motion.button>
          </div>

          <div className="fs-image-container">
            <AnimatePresence>
              <motion.img
                className="fs-image"
                key={src}
                src={src}
                initial={{ opacity: 0, scale: 0.98, filter: isDark ? 'brightness(0.5)' : 'brightness(1.1)' }}
                animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
                exit={{ opacity: 0, scale: 1.02, filter: isDark ? 'brightness(0.5)' : 'brightness(1.1)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                alt="Viewer"
              />
            </AnimatePresence>

            {hasNavigation && (
              <>
                <motion.button
                  className="fs-nav-btn fs-nav-left"
                  onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex - 1 + items.length) % items.length); }}
                  whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
                  whileTap={{ scale: 0.92 }}
                >
                  <ChevronLeft size={24} />
                </motion.button>
                <motion.button
                  className="fs-nav-btn fs-nav-right"
                  onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex + 1) % items.length); }}
                  whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
                  whileTap={{ scale: 0.92 }}
                >
                  <ChevronLeft size={24} style={{ transform: 'rotate(180deg)' }} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANE - Thumbnails */}
        {hasNavigation && (
          <div className="fs-right-pane">
            <div className="fs-thumbnail-list">
              {items.map((thumbSrc, idx) => (
                <div
                  key={idx}
                  className={`fs-thumb ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => onNavigate(idx)}
                >
                  <img src={thumbSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
};

function PropertyStayCard({ stay }) {
  const { tokens: { FG, M, B, W, S, A, AL } } = useTheme();
  const { isMobile } = useWindowSize();
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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
    "";

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

  const allImages = [];
  const coverP = stay?.coverPhotoUrl || stay?.coverImageUrl || stay?.coverPhoto || stay?.coverImage || stay?.imageUrl;
  if (coverP) allImages.push(coverP);
  const med = stay?.media || stay?.images || stay?.stayMedia || stay?.listingMedia || [];
  med.forEach(m => {
    const u = typeof m === "string" ? m : m.url || m.src || m.imageUrl || m.fileUrl || m.blobName;
    if (u && !allImages.includes(u)) allImages.push(u);
  });
  const totalPhotos = Math.max(1, allImages.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "320px 1fr",
        gap: isMobile ? 16 : 24,
        background: W,
        border: `1px solid ${B}`,
        borderRadius: 12,
        padding: isMobile ? 16 : 20,
        marginBottom: 24,
      }}
      className="property-stay-card"
    >
      <motion.div
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          borderRadius: 10,
          overflow: "hidden",
          background: "linear-gradient(120deg, rgba(230,236,246,0.9), rgba(242,246,252,0.9))",
          minHeight: 200,
          position: "relative",
          cursor: "pointer"
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
            e.currentTarget.src = "";
            setCoverLoaded(true);
          }}
        />
        
        {/* Total Photo Count */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 10,
          background: S, color: FG, padding: "4px 8px", borderRadius: 6,
          fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)", border: `1px solid ${B}66`
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          1 / {totalPhotos}
        </div>

        {/* View Photos Button */}
        <div style={{
          position: "absolute", bottom: 12, left: 12, zIndex: 10
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(true);
            }}
            style={{
              background: S, color: FG, border: `1px solid ${B}66`,
              padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            View Photos
          </button>
        </div>
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
            {amenities.map((amenity, idx) => {
              const IconComp = getAmenityIcon(amenity);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: S,
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
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
          <div style={{ 
            display: isMobile ? "grid" : "flex", 
            gridTemplateColumns: isMobile ? "1fr 1fr" : "unset",
            flexWrap: "wrap", 
            gap: 12,
            width: isMobile ? "100%" : "auto"
          }}>
            <motion.div
              whileHover={{ y: -3, boxShadow: "0 8px 22px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.2 }}
              style={{
                border: `1px solid ${B}99`,
                borderRadius: 10,
                padding: "10px 14px",
                background: S,
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                minWidth: isMobile ? 0 : 150
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
                background: S,
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                minWidth: isMobile ? 0 : 150
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
                background: S,
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                minWidth: isMobile ? 0 : 170,
                gridColumn: isMobile ? "1 / -1" : "auto"
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

        </div>
      </div>

      {ReactDOM.createPortal(
        <AnimatePresence>
          {showModal && (
            <FullScreenImage
              src={allImages[galleryIndex]}
              items={allImages}
              currentIndex={galleryIndex}
              onNavigate={setGalleryIndex}
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
  const { tokens: { A, FG, M, B, W, S, BG, AL }, theme } = useTheme();
  const routerHistory = useHistory();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sliderRef = useRef(null);
  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const cardWidth = 384; // width (360) + gap (24)
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

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

  const hasReviews = normalizedReviews.length > 0;
  const displayReviews = hasReviews ? normalizedReviews : [
    { customerName: "Aarav Sharma", comment: "An absolutely incredible stay. The host was warm, accommodating, and the attention to detail was unmatched.", rating: 5 },
    { customerName: "Priya Patel", comment: "Highly curated interiors, breathtaking views, and wonderful local insights. Can't wait to book this again!", rating: 5 },
    { customerName: "Vikram Malhotra", comment: "Top tier service! The scheduling was seamless and the guides were exceptionally knowledgeable.", rating: 5 }
  ];

  return (
    <section className="testimonials-section" style={{ background: BG, padding: isMobile ? "32px 24px" : "32px 80px", overflow: "hidden" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        
        {/* Header and Scroll Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800, color: "#8B5CF6", display: "block", marginBottom: 4 }}>Guest Reviews</span>
            <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, margin: 0, fontFamily: "Poppins, sans-serif" }}>
              What people say
            </h3>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => scrollSlider("left")}
              style={{
                width: 40, height: 40, borderRadius: "50%", border: `1px solid ${B}`, background: W,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                color: FG, transition: "0.3s", outline: "none"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = FG; }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider("right")}
              style={{
                width: 40, height: 40, borderRadius: "50%", border: `1px solid ${B}`, background: W,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                color: FG, transition: "0.3s", outline: "none"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = FG; }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Reviews Slider */}
        <div
          ref={sliderRef}
          style={{
            position: "relative",
            overflowX: "auto",
            margin: isMobile ? "24px -24px 0" : "24px -80px 0",
            padding: isMobile ? "20px 24px" : "20px 80px",
            display: "flex",
            gap: 24,
            scrollBehavior: "smooth",
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}
          className="no-scrollbar"
        >
          {displayReviews.map((rev, idx) => {
            const name = rev.customerName || rev.author || "Guest";
            const rating = rev.rating || 5;
            const text = rev.comment || rev.text || "";

            return (
              <motion.div
                key={idx}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  width: "360px",
                  background: theme === "dark" 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.55) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${B}`,
                  borderRadius: "24px",
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                  flexShrink: 0,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.boxShadow = `0 20px 40px ${A}0f`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.02)"; }}
              >
                {/* Stylized background quote mark */}
                <span style={{
                  position: "absolute",
                  top: -5,
                  right: 20,
                  fontSize: 90,
                  color: `${A}15`,
                  fontFamily: "Georgia, serif",
                  pointerEvents: "none",
                  lineHeight: 1,
                  userSelect: "none"
                }}>“</span>

                <div style={{ position: "relative", zIndex: 2 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < rating ? "#F59E0B" : "none"} color={i < rating ? "#F59E0B" : M} />
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: FG, lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", fontWeight: 400 }}>
                    &ldquo;{text}&rdquo;
                  </p>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${B}`, paddingTop: 16, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: AL, border: `2px solid ${A}22`, display: "flex", alignItems: "center", justifyContent: "center", color: A, fontSize: 13, fontWeight: 700 }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: FG, display: "block" }}>{name}</span>
                    <span style={{ fontSize: 9, color: M, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Verified Explorer</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit Review Button & Form Container */}
        {eligibleBookings.length > 0 && (
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  background: A, color: W, border: "none", padding: "14px 32px", borderRadius: 100,
                  fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer"
                }}
              >
                Write a Review
              </button>
            )}

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ background: S, border: `1px solid ${B}`, padding: isMobile ? 24 : 40, borderRadius: 24, width: "100%", maxWidth: 640 }}
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
                          borderRadius: 12, padding: 20, fontSize: 15, color: FG, resize: "none", outline: "none"
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
          </div>
        )}

      </div>
    </section>
  );
}

function StayLocation({ stay }) {
  const { isMobile } = useWindowSize();
  const { tokens: { A, BG, FG, M, S, B, W } } = useTheme();
  const { city, district, state } = getStayLocationParts(stay);

  // Coordinates
  const lat = stay?.latitude || stay?.latitude_decimal || stay?.lat || stay?.meetingLatitude || stay?.listingLatitude;
  const lng = stay?.longitude || stay?.longitude_decimal || stay?.lng || stay?.meetingLongitude || stay?.listingLongitude;

  // Fields
  const address = stay?.address || stay?.fullAddress || stay?.location || stay?.meetingAddress || [stay?.city, stay?.state, stay?.country].filter(Boolean).join(", ");
  const landmark = stay?.landmark || stay?.meetingLandmark;
  const country = stay?.country || "India";
  const instructions = stay?.checkInInstructions || stay?.instructions || stay?.meetingInstructions;
  const locationName = stay?.locationName || stay?.meetingLocationName || (address ? address.split(',')[0] : null) || city || stay?.propertyName || stay?.title || stay?.name || "The Property";

  const hasCoords = lat && lng;
  const mapQuery = hasCoords ? `${lat},${lng}` : (address || city);
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=15&output=embed&iwloc=near`;

  return (
    <section className="prep-section" style={{ background: W, padding: isMobile ? "32px 24px" : "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "45fr 55fr", gap: isMobile ? 40 : 64 }} className="prep-grid">
          <Rev delay={0.1} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 32, fontFamily: "Poppins, sans-serif" }}>Where it All Happens</h3>
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{locationName}</span>
                  </div>
                  <iframe
                    title="Property Location Map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={embedUrl}
                  />
                </div>
              </div>
            </div>
          </Rev>
          <Rev delay={0.2} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 32, fontFamily: "Poppins, sans-serif" }}>Where it is</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 280, margin: 0, padding: 0 }}>
                  {address && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Address</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{address}</span>
                    </li>
                  )}

                  {landmark && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Landmark</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{landmark}</span>
                    </li>
                  )}

                  {(district || city) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>District</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{district || city}</span>
                    </li>
                  )}

                  {state && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>State</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{state}</span>
                    </li>
                  )}

                  {country && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Country</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{country}</span>
                    </li>
                  )}

                  {instructions && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Instructions</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{instructions}</span>
                    </li>
                  )}

                  {(!district && !state && !country && !address && !landmark) && (
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

export default StayDetails;


