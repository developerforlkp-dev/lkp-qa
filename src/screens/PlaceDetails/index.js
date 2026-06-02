import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import useDarkMode from "use-dark-mode";
import { useLocation, Link, useHistory } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  MapPin, Clock, Ticket, Star, Calendar, ArrowDown, ExternalLink, Map, Navigation,
  Phone, Globe, Send, Info, User, Check, XCircle, Briefcase, ChevronRight, ChevronLeft, Share2
} from "lucide-react";
import cn from "classnames";
import Loader from "../../components/Loader";
import Browse from "../../components/Browse";
import { browse2 } from "../../mocks/browse";
import { Footer } from "../../components/JUI/Footer";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import { getPlaceDetails, getHost, getHostContent } from "../../utils/api";
import ShareButton from "../../components/ShareButton";
import useDocumentTitle from "../../hooks/useDocumentTitle";

/* ─── RESPONSIVE HOOK ─────────── */
function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
    isMobile: typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

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
      <div ref={wrapperRef} className="place-details-premium" style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

const E = [0.22, 1, 0.36, 1];

const ScopedStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Italianno&family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');

    .place-details-premium {
      font-family: 'Inter', var(--font-inter), system-ui, sans-serif;
      overflow-x: hidden;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    
    @keyframes marquee-hero-l {
      0% { transform: translate3d(0, 0, 0); }
      100% { transform: translate3d(-50%, 0, 0); }
    }
    @keyframes marquee-hero-r {
      0% { transform: translate3d(-50%, 0, 0); }
      100% { transform: translate3d(0, 0, 0); }
    }
    
    .place-details-premium .font-display { font-family: 'Fraunces', var(--font-fraunces), Georgia, serif; }
    .place-details-premium .font-cursive { font-family: 'Italianno', cursive; }
    .place-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .place-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    
    .place-details-premium .marquee-hero-track-l {
      display: flex;
      gap: 40px;
      width: max-content;
      animation: marquee-hero-l 90s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .place-details-premium .marquee-hero-track-r {
      display: flex;
      gap: 40px;
      width: max-content;
      animation: marquee-hero-r 100s linear infinite;
      will-change: transform;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    .place-details-premium .no-scrollbar::-webkit-scrollbar {
      display: none !important;
    }
    .place-details-premium .no-scrollbar {
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
    }
    
    @media(max-width:768px){
      .place-details-premium .desk-only { display: none !important; }
      .about-grid, .log-grid, .info-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    }
  `}</style>
);

/* ─── UTILS ─────────── */
const toDisplayString = (value) => {
  if (!value) return "";
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
  const chunk = items.join(sep) + sep;
  const repeated = chunk + chunk;
  const fsMap = { sm: "0.65rem", lg: "clamp(2.2rem,5vw,4rem)", xl: "clamp(3.5rem,9vw,7.5rem)" };
  const fs = fsMap[size];
  const col = accent ? A : M;
  const cls = dir === "l" ? "mq-l" : "mq-r";
  const padV = size === "xl" ? "28px 0" : size === "lg" ? "20px 0" : "11px 0";
  return (
    <div style={{ overflow: "hidden", background: bgColor, borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}`, padding: padV }}>
      <div className={cls}>
        {[0, 1].map(i => (
          <span key={i} className={size !== "sm" ? "font-display" : ""} style={{ fontSize: fs, fontWeight: size !== "sm" ? 700 : 500, color: col, whiteSpace: "nowrap", letterSpacing: size === "sm" ? "0.28em" : "-0.01em", textTransform: size === "sm" ? "uppercase" : "none", paddingRight: size === "sm" ? 32 : 56 }}>
            {repeated}
          </span>
        ))}
      </div>
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
    } catch (_) {}
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
        {copied ? "✓ Copied!" : "Share Location"}
      </span>
    </motion.button>
  );
}

/* ─── PLACE SECTIONS ─────────── */
function PlaceHero({ place, galleryItems }) {
  const { tokens: { A, FG, M, W, B } } = useTheme();
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start start", "end start"] });

  // Split gallery items into two rows
  const row1 = galleryItems.slice(0, Math.ceil(galleryItems.length / 2));
  const row2 = galleryItems.slice(Math.ceil(galleryItems.length / 2));

  const itemWidth1 = 440, itemWidth2 = 520, gap = 40;

  // Build a true infinite loop by repeating rowItems to exceed viewport width, and then doubling it
  const buildMarqueeRow = (rowItems) => {
    if (!rowItems || rowItems.length === 0) return [];
    const repeatCount = Math.ceil(8 / rowItems.length);
    const baseSet = Array(repeatCount).fill(rowItems).flat();
    return [...baseSet, ...baseSet];
  };

  const trackItems1 = useMemo(() => buildMarqueeRow(row1), [row1]);
  const trackItems2 = useMemo(() => buildMarqueeRow(row2), [row2]);

  const placeName = place?.placeName || place?.title || "COASTAL GEM";

  return (
    <section ref={r} style={{ position: "relative", minHeight: "100vh", background: W, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", opacity: 0.03, overflow: "hidden" }}>
        <motion.h1
          className="font-display"
          style={{
            scale: useTransform(scrollYProgress, [0, 0.5], [1, 1.5]),
            rotate: useTransform(scrollYProgress, [0, 0.5], [0, 5]),
            fontSize: "45vw",
            fontWeight: 900,
            color: FG,
            whiteSpace: "nowrap"
          }}
        >
          {placeName.split(' ')[0].toUpperCase()}
        </motion.h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap, position: "relative", zIndex: 10 }}>
        {/* Row 1 - moves right to left (0 to -50%) */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 0.3], [0, -40]), display: "flex", width: "100vw", overflow: "hidden" }}>
          <div className="marquee-hero-track-l" style={{ paddingLeft: gap }}>
            {trackItems1.map((img, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05, rotate: 1, zIndex: 100 }} style={{ flexShrink: 0, width: itemWidth1, height: itemWidth1 * 1.25, borderRadius: 24, overflow: "hidden", border: `1px solid ${B}`, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.1)", transition: "transform 0.4s" }}>
                <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Floating Destination Card in center */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 50, pointerEvents: "none" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: E }} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(40px)", padding: "50px 80px", borderRadius: 40, border: `1px solid ${B}`, textAlign: "center", boxShadow: "0 60px 120px -20px rgba(0,0,0,0.15)" }}>
            <p className="font-mono" style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 16 }}>{toDisplayString(place?.category) || "DESTINATION"}</p>
            <Chars text={placeName.toUpperCase()} cls="font-display" style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)", fontWeight: 700, color: FG, lineHeight: 1, letterSpacing: "-0.04em", margin: 0 }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, pointerEvents: "auto" }}>
              {[place?.city, place?.placeType, "Discovery"].filter(Boolean).map(tag => (
                <motion.span key={toDisplayString(tag)} whileHover={{ background: A, color: W, borderColor: A }} style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: M, border: `1px solid ${B}`, padding: "8px 20px", borderRadius: 40, background: W, transition: "all 0.3s" }}>{toDisplayString(tag)}</motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Row 2 - moves left to right (-50% to 0) */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 0.3], [0, 40]), display: "flex", width: "100vw", overflow: "hidden" }}>
          <div className="marquee-hero-track-r" style={{ paddingLeft: 100 }}>
            {trackItems2.map((img, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05, rotate: -1, zIndex: 100 }} style={{ flexShrink: 0, width: itemWidth2, height: itemWidth2 * 0.75, borderRadius: 24, overflow: "hidden", border: `1px solid ${B}`, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.1)", transition: "transform 0.4s" }}>
                <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{ position: "absolute", bottom: 40, left: "50%", x: "-50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 60 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M }}>Discover more</span>
        <ArrowDown size={14} color={A} />
      </motion.div>
      <HeroShareFab
        title={placeName}
        text={place?.description || ""}
        url={window.location.href}
      />
    </section>
  );
}

function QuickFacts({ place }) {
  const { tokens: { A, B, FG, M, S, W } } = useTheme();
  const facts = [
    { label: "Timings", val: place?.timings || place?.openingHours || "06:00 - 20:00", icon: Clock },
    { label: "Entry Fee", val: place?.entryFee || "Free Entry", icon: Ticket },
    { label: "Best Time", val: place?.bestTimeToVisit || "Year Round", icon: Star },
    { label: "Rating", val: `${place?.rating || place?.averageRating || "4.8"} User Rating`, icon: Check },
  ];

  return (
    <section style={{ background: S, borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}`, padding: "60px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Soul y={50} s={0.02}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>
            {facts.map((f, i) => (
              <Rev key={f.label} delay={i * 0.1}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ background: W, width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${B}` }}>
                    <f.icon size={20} color={A} />
                  </div>
                  <div>
                    <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: M, marginBottom: 4 }}>{f.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>{f.val}</p>
                  </div>
                </div>
              </Rev>
            ))}
          </div>
        </Soul>
      </div>
    </section>
  );
}

function DestAbout({ place, hostData, hostAvatar }) {
  const { tokens: { A, FG, M, B, W } } = useTheme();
  return (
    <section style={{ background: W, padding: "140px 36px 120px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Soul y={100} s={0.05}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 100 }} className="about-grid">
            <Rev>
              <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 24 }}>About the Destination</p>
              <h2 className="font-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 32 }}>
                {place?.placeName || "Experience the local heritage."}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {[toDisplayString(place?.category), place?.city, "Historical", "Vibrant"].filter(Boolean).map(tag => (
                  <div key={tag} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#f8f8f8", borderRadius: 12, border: `1px solid ${B}` }}>
                    <User size={12} color={A} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: FG }}>{tag}</span>
                  </div>
                ))}
              </div>
            </Rev>
            <Rev delay={0.2}>
              <p style={{ fontSize: 17, lineHeight: 1.85, color: M, marginBottom: 32 }}>
                {place?.description || "Discover the hidden gems and vibrant culture of this unique location. From historical landmarks to modern attractions, there is something for everyone."}
              </p>
              <div style={{ marginTop: 48, borderTop: `1px solid ${B}`, paddingTop: 40, display: "flex", gap: 64 }}>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 8 }}>Location</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: FG }}>{place?.city || "Discovery Town"}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 8 }}>Curator</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={hostAvatar || "https://picsum.photos/seed/host/40/40"} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} alt="" />
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: FG, margin: 0 }}>
                        {hostData?.host?.firstName ? `${hostData.host.firstName} ${hostData.host.lastName || ''}`.trim() : (hostData?.host?.displayName || hostData?.displayName || "Lead Curator")}
                      </p>
                      {(hostData?.host?.bio || hostData?.bio) && (
                        <p style={{ fontSize: 12, color: M, marginTop: 4, fontStyle: "italic", margin: "4px 0 0 0" }}>{hostData?.host?.bio || hostData?.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Rev>
          </div>
        </Soul>
      </div>
    </section>
  );
}

function Logistics({ place, hostData }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  return (
    <section style={{ background: S, padding: "140px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 100 }} className="log-grid">
          <Rev>
            <SHdr idx="03" label="Location & Access" />
            <div style={{ background: W, border: `1px solid ${B}`, borderRadius: 32, padding: 56 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
                <div>
                  <h4 style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 12 }}>Address</h4>
                  <p style={{ fontSize: 16, color: FG, fontWeight: 600, maxWidth: 350, lineHeight: 1.6 }}>{place?.address || "Explore the local maps for the exact navigation details."}</p>
                </div>
                <motion.a whileHover={{ scale: 1.1 }} href={`https://www.google.com/maps/search/?api=1&query=${place?.placeName}`} target="_blank" style={{ background: A, width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                  <Navigation size={22} color={W} />
                </motion.a>
              </div>
              <div style={{ borderTop: `1px solid ${B}`, paddingTop: 40 }}>
                <h4 style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M, marginBottom: 24 }}>Getting There</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { l: "Nearest Station", d: "3 km" },
                    { l: "City Center", d: place?.distance || "5 km" },
                    { l: "International Airport", d: "25 km" },
                  ].map(loc => (
                    <div key={loc.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: M }}>{loc.l}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: FG }}>{loc.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Rev>

          <Rev delay={0.2}>
            <SHdr idx="04" label="Contact & Guide" />
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div style={{ padding: 48, border: `1px solid ${B}`, borderRadius: 32, background: W }}>
                <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: M, marginBottom: 24 }}>Official Inquiries</p>
                <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: FG, marginBottom: 32 }}>{hostData?.host?.displayName || hostData?.displayName || "Tourism Authority"}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <a href={`tel:${hostData?.host?.phone || hostData?.host?.phoneNumber || hostData?.phone}`} style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", fontSize: 14, color: FG, fontWeight: 600 }}>
                    <Phone size={18} color={A} /> {hostData?.host?.phone || hostData?.host?.phoneNumber || hostData?.phone || "Contact via App"}
                  </a>
                  <a href="#" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", fontSize: 14, color: FG, fontWeight: 600 }}>
                    <Globe size={18} color={A} /> {place?.website || "Official Portal"}
                  </a>
                </div>
              </div>

              <div style={{ padding: 48, border: `1px solid ${B}`, borderRadius: 32, background: A, color: W }}>
                <h4 style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>Prime Visit</h4>
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Peak Season</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>October to March is ideal for exploring the open-air heritage and coastal views.</p>
              </div>
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

function Itinerary({ place }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  const steps = [
    { title: "Discovery Phase", desc: "Explore the primary landmarks and architectural wonders of this unique location." },
    { title: "Local Immersion", desc: "Engage with the local culture and hidden gems that define the heart of the area." },
    { title: "Sunset Perspective", desc: "End your journey with breathtaking panoramic views as the day transitions to night." }
  ];
  return (
    <section style={{ background: S, padding: "120px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="01" label="Highlights & Itinerary" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
          {steps.map((s, i) => (
            <Soul key={i} delay={i * 0.15} y={80} r={i % 2 === 0 ? 3 : -3}>
              <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.4 }} style={{ background: W, border: `1px solid ${B}`, borderRadius: 32, padding: "56px 48px", height: "100%", position: "relative", overflow: "hidden" }}>
                <span className="font-display" style={{ position: "absolute", top: -10, right: 10, fontSize: "clamp(5rem, 8vw, 10rem)", fontWeight: 800, color: A, opacity: 0.04, pointerEvents: "none" }}>{i + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 8, height: 8, background: A }} />
                  <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700 }}>Step {i + 1}</p>
                </div>
                <h3 className="font-display" style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 20 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: M, lineHeight: 1.85 }}>{s.desc}</p>
              </motion.div>
            </Soul>
          ))}
        </div>
      </div>
    </section>
  );
}

function GoodToKnow({ place }) {
  const { tokens: { A, B, FG, M, W, AL } } = useTheme();
  return (
    <section style={{ background: W, padding: "120px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 100 }} className="info-grid">
        <Rev>
          <SHdr idx="02" label="Good To Know" />
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            <div>
              <h4 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 700, color: FG, marginBottom: 20 }}>
                <Briefcase size={16} color={A} /> What to Carry
              </h4>
              <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {["Comfortable Shoes", "Water Bottle", "Camera", "Sun Protection"].map(item => (
                  <li key={item} style={{ fontSize: 13, color: M, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: A }} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: "#fff5f5", border: "1px solid #fee2e2", padding: 32, borderRadius: 20 }}>
              <h4 style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 16 }}>
                <XCircle size={16} color="#ef4444" /> Things to Avoid
              </h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Littering", "Unsafe Climbing", "Disrespecting Local Privacy"].map(item => (
                  <li key={item} style={{ fontSize: 12, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8 }}>
                    <XCircle size={10} /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Rev>

        <Rev delay={0.2}>
          <div style={{ background: "#f8f8f8", border: `1px solid ${B}`, borderRadius: 32, padding: 48 }}>
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: FG, marginBottom: 12 }}>Community Feedback</h3>
            <p style={{ fontSize: 12, color: M, marginBottom: 24 }}>Share your recent experience or suggest updates for this location.</p>
            <textarea
              placeholder="Share your thoughts..."
              style={{ width: "100%", height: 120, background: W, border: `1px solid ${B}`, borderRadius: 12, padding: 16, fontSize: 13, marginBottom: 20, outline: "none" }}
            />
            <motion.button whileHover={{ scale: 1.02 }}
              style={{ width: "100%", padding: 16, background: A, color: W, border: "none", borderRadius: 10, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Submit Updates
            </motion.button>
          </div>
        </Rev>
      </div>
    </section>
  );
}

/* ─── MOBILE COMPONENTS ─────────── */

function MobileHero({ place, galleryItems }) {
  const { theme, tokens } = useTheme();
  const { A, FG, M, BG, W, B } = tokens;
  const history = useHistory();
  const placeName = place?.placeName || place?.title || "COASTAL GEM";

  const images = galleryItems && galleryItems.length ? galleryItems : ["https://picsum.photos/seed/destination/800/1000"];

  return (
    <section style={{ background: BG, paddingTop: 90, position: "relative", overflow: "hidden" }}>
      {/* Hero Back Button */}
      <button
        type="button"
        className="premium-back-button"
        onClick={() => history.goBack()}
        aria-label="Go back"
      >
        <ChevronLeft size={20} />
      </button>
      {/* Hero Share Button */}
      <HeroShareFab
        title={placeName}
        text={place?.description || ""}
        url={window.location.href}
      />

      {/* Layered Image Stack / Peeking Slider */}
      <div style={{
        display: "flex",
        gap: 16,
        overflowX: "auto",
        padding: "16px 24px",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch"
      }} className="no-scrollbar">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: E }}
            style={{
              flexShrink: 0,
              width: "calc(100vw - 64px)", // leaves space on left/right for peeking next/prev images
              height: "45vh",
              borderRadius: 28,
              overflow: "hidden",
              border: `1.5px solid ${B}`,
              boxShadow: theme === "dark" ? "0 20px 40px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.08)",
              scrollSnapAlign: "center",
              position: "relative"
            }}
          >
            {/* Soft Ambient Zoom Effect */}
            <motion.img
              src={img}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt=""
            />
            {/* Subtle bottom shadow overlay inside card */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4) 100%)",
              pointerEvents: "none"
            }} />
          </motion.div>
        ))}
      </div>

      {/* Overlapping Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: E, delay: 0.2 }}
        style={{
          marginTop: "-48px",
          marginLeft: 24,
          marginRight: 24,
          marginBottom: 32,
          padding: "24px 20px",
          borderRadius: 24,
          background: theme === "dark" ? "rgba(10, 10, 10, 0.78)" : "rgba(255, 255, 255, 0.84)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1.5px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          boxShadow: theme === "dark" ? "0 25px 50px rgba(0,0,0,0.4)" : "0 25px 50px rgba(0,0,0,0.06)",
          zIndex: 10,
          position: "relative"
        }}
      >
        <p className="font-mono" style={{
          fontSize: 9,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          color: A,
          fontWeight: 800,
          margin: "0 0 8px 0"
        }}>
          {toDisplayString(place?.category) || "DESTINATION"}
        </p>

        <h1 className="font-display" style={{
          fontSize: 22,
          fontWeight: 700,
          color: FG,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          margin: "0 0 14px 0"
        }}>
          {placeName.toUpperCase()}
        </h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[place?.city, place?.placeType].filter(Boolean).map(tag => (
            <span key={toDisplayString(tag)} style={{
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: FG,
              border: `1px solid ${A}33`,
              padding: "5px 12px",
              borderRadius: 16,
              background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              fontWeight: 600
            }}>
              {toDisplayString(tag)}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function MobileQuickFacts({ place }) {
  const { tokens: { A, B, FG, M, S, W } } = useTheme();
  const facts = [
    { label: "Timings", val: place?.timings || place?.openingHours || "06:00 - 20:00", icon: Clock },
    { label: "Entry Fee", val: place?.entryFee || "Free Entry", icon: Ticket },
    { label: "Best Time", val: place?.bestTimeToVisit || "Year Round", icon: Star },
    { label: "Rating", val: `${place?.rating || place?.averageRating || "4.8"} Rating`, icon: Star },
  ];

  return (
    <section style={{ background: S, borderBottom: `1px solid ${B}`, padding: "24px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {facts.map((f, i) => (
          <div key={f.label} style={{
            background: W,
            border: `1.5px solid ${B}`,
            borderRadius: 20,
            padding: "14px 12px",
            boxShadow: "0 8px 20px rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
            <div style={{
              background: `${A}12`,
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <f.icon size={14} color={A} fill={f.icon === Star ? A : "none"} />
            </div>
            <div>
              <p style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: M, margin: "0 0 2px 0" }}>{f.label}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: FG, margin: 0 }}>{f.val}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileAbout({ place, hostData, hostAvatar }) {
  const { tokens: { A, FG, M, B, W } } = useTheme();
  return (
    <section style={{ background: W, padding: "40px 16px" }}>
      <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 10 }}>
        About the Destination
      </p>
      
      <h2 className="font-display" style={{
        fontSize: 26,
        fontWeight: 700,
        color: FG,
        lineHeight: 1.2,
        marginBottom: 16
      }}>
        {place?.placeName || "Experience the local heritage."}
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {[toDisplayString(place?.category), place?.city, "Historical", "Vibrant"].filter(Boolean).map(tag => (
          <div key={tag} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#f8f8f8",
            borderRadius: 10,
            border: `1px solid ${B}`
          }}>
            <User size={10} color={A} />
            <span style={{ fontSize: 10, fontWeight: 600, color: FG }}>{tag}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.7, color: M, marginBottom: 24, margin: "0 0 24px 0" }}>
        {place?.description || "Discover the hidden gems and vibrant culture of this unique location. From historical landmarks to modern attractions, there is something for everyone."}
      </p>

      {/* Curator & Location Card */}
      <div style={{
        borderTop: `1px solid ${B}`,
        paddingTop: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: M, marginBottom: 4 }}>Location</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: FG, margin: 0 }}>{place?.city || "Discovery Town"}</p>
          </div>
          <div>
            <p style={{ fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", color: M, marginBottom: 4, textAlign: "right" }}>Curator</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={hostAvatar || "https://picsum.photos/seed/host/40/40"} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} alt="" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: FG, margin: 0 }}>
                  {hostData?.host?.firstName ? `${hostData.host.firstName} ${hostData.host.lastName || ''}`.trim() : (hostData?.host?.displayName || hostData?.displayName || "Lead Curator")}
                </p>
                {(hostData?.host?.bio || hostData?.bio) && (
                  <p style={{ fontSize: 11, color: M, margin: "4px 0 0 0", fontStyle: "italic" }}>{hostData?.host?.bio || hostData?.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileGallery({ galleryItems }) {
  const { tokens: { B, S, W, A } } = useTheme();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  if (!galleryItems || galleryItems.length === 0) return null;

  const openLightbox = (index) => {
    setActiveIdx(index);
    setLightboxOpen(true);
  };

  const nextImg = () => {
    setActiveIdx((prev) => (prev + 1) % galleryItems.length);
  };

  const prevImg = () => {
    setActiveIdx((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  return (
    <section style={{ background: S, padding: "36px 0" }}>
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 4 }}>
          Gallery
        </p>
        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Visual Journeys
        </h3>
      </div>

      {/* Horizontal Scroll Image Cards */}
      <div style={{
        display: "flex",
        gap: 14,
        overflowX: "auto",
        padding: "0 16px 8px 16px",
        scrollSnapType: "x mandatory"
      }} className="no-scrollbar">
        {galleryItems.map((img, i) => (
          <div
            key={i}
            onClick={() => openLightbox(i)}
            style={{
              flexShrink: 0,
              width: 240,
              height: 160,
              borderRadius: 20,
              overflow: "hidden",
              border: `1.5px solid ${B}`,
              boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
              scrollSnapAlign: "start",
              cursor: "pointer"
            }}
          >
            <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.95)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              zIndex: 10000,
              padding: "24px 16px"
            }}
          >
            {/* Top Bar */}
            <div style={{ display: "flex", justifycontent: "space-between", alignItems: "center", color: "#FFF" }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                {activeIdx + 1} / {galleryItems.length}
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  cursor: "pointer"
                }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Main Image */}
            <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button
                onClick={prevImg}
                style={{
                  position: "absolute",
                  left: 8,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  cursor: "pointer",
                  zIndex: 10
                }}
              >
                <ChevronLeft size={24} />
              </button>

              <motion.img
                key={activeIdx}
                src={galleryItems[activeIdx]}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 12 }}
                alt=""
              />

              <button
                onClick={nextImg}
                style={{
                  position: "absolute",
                  right: 8,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  cursor: "pointer",
                  zIndex: 10
                }}
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Bottom Bar Indicator */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 8
            }}>
              {galleryItems.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: idx === activeIdx ? A : "rgba(255,255,255,0.3)",
                    transition: "all 0.3s"
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function MobileItinerary({ place }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  const steps = [
    { title: "Discovery Phase", desc: "Explore the primary landmarks and architectural wonders of this unique location." },
    { title: "Local Immersion", desc: "Engage with the local culture and hidden gems that define the heart of the area." },
    { title: "Sunset Perspective", desc: "End your journey with breathtaking panoramic views as the day transitions to night." }
  ];

  return (
    <section style={{ background: W, padding: "40px 16px" }}>
      <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 6 }}>
        HIGHLIGHTS & ITINERARY
      </p>
      <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Curated Experience Plan
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
        {/* Vertical Line */}
        <div style={{
          position: "absolute",
          left: 17,
          top: 8,
          bottom: 8,
          width: 2,
          background: `linear-gradient(to bottom, ${A}, ${B})`
        }} />

        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
            {/* Step Marker */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: W,
              border: `2px solid ${A}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
              color: A,
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
            }}>
              {i + 1}
            </div>

            {/* Content */}
            <div style={{
              background: S,
              border: `1.5px solid ${B}`,
              borderRadius: 20,
              padding: "16px 14px",
              flex: 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: FG, marginBottom: 6, margin: "0 0 6px 0" }}>{s.title}</h4>
              <p style={{ fontSize: 11, color: M, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileGoodToKnow({ place }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  return (
    <section style={{ background: S, padding: "40px 16px", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
      <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 6 }}>
        SAFETY & GUIDANCE
      </p>
      <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Good To Know
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
        {/* What to Carry */}
        <div style={{ background: W, padding: 18, borderRadius: 20, border: `1.5px solid ${B}` }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: FG, marginBottom: 12, margin: "0 0 12px 0" }}>
            <Briefcase size={14} color={A} /> What to Carry
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["Comfortable Shoes", "Water Bottle", "Camera", "Sun Protection"].map(item => (
              <span key={item} style={{
                fontSize: 10,
                color: M,
                background: S,
                padding: "5px 10px",
                borderRadius: 10,
                border: `1px solid ${B}`,
                fontWeight: 500
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Things to Avoid */}
        <div style={{ background: "#fff5f5", border: "1.5px solid #fee2e2", padding: 18, borderRadius: 20 }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#991b1b", marginBottom: 10, margin: "0 0 10px 0" }}>
            <XCircle size={14} color="#ef4444" /> Things to Avoid
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {["Littering", "Unsafe Climbing", "Disrespecting Local Privacy"].map(item => (
              <li key={item} style={{ fontSize: 11, color: "#b91c1c", display: "flex", alignItems: "center", gap: 8, fontWeight: 500 }}>
                <XCircle size={10} color="#ef4444" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Community Feedback */}
      <div style={{ background: W, border: `1.5px solid ${B}`, borderRadius: 20, padding: 20 }}>
        <h4 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: FG, marginBottom: 4, margin: "0 0 4px 0" }}>Community Feedback</h4>
        <p style={{ fontSize: 11, color: M, marginBottom: 16, margin: "0 0 16px 0" }}>Share your recent experience or suggest updates for this location.</p>
        <textarea
          placeholder="Share your thoughts..."
          style={{
            width: "100%",
            height: 90,
            background: S,
            border: `1.5px solid ${B}`,
            borderRadius: 12,
            padding: 10,
            fontSize: 12,
            marginBottom: 14,
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%",
            padding: 12,
            background: A,
            color: "#FFF",
            border: "none",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          Submit Updates
        </motion.button>
      </div>
    </section>
  );
}

function MobileLogistics({ place, hostData }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();

  return (
    <section style={{ background: W, padding: "40px 16px" }} id="logistics-section">
      <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 6 }}>
        LOCATION & LOGISTICS
      </p>
      <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Access & Assistance
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Address Card */}
        <div style={{ background: S, border: `1.5px solid ${B}`, borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div>
              <h4 style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: M, marginBottom: 4, margin: "0 0 4px 0" }}>Address</h4>
              <p style={{ fontSize: 12, color: FG, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                {place?.address || "Explore the local maps for the exact navigation details."}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${place?.placeName}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: A,
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0, 151, 178, 0.2)"
              }}
            >
              <Navigation size={15} color="#FFF" />
            </a>
          </div>

          <div style={{ borderTop: `1.5px solid ${B}`, paddingTop: 14 }}>
            <h4 style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: M, marginBottom: 10, margin: "0 0 10px 0" }}>Getting There</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { l: "Nearest Station", d: "3 km" },
                { l: "City Center", d: place?.distance || "5 km" },
                { l: "Airport", d: "25 km" },
              ].map(loc => (
                <div key={loc.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: M }}>{loc.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>{loc.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Curator Card */}
        <div style={{ padding: 18, border: `1.5px solid ${B}`, borderRadius: 20, background: S }}>
          <p style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: M, marginBottom: 12, margin: "0 0 12px 0" }}>Official Inquiries</p>
          <h4 className="font-display" style={{ fontSize: 16, fontWeight: 700, color: FG, marginBottom: 16, margin: "0 0 16px 0" }}>
            {hostData?.host?.displayName || hostData?.displayName || "Tourism Authority"}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href={`tel:${hostData?.host?.phone || hostData?.host?.phoneNumber || hostData?.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 12, color: FG, fontWeight: 600 }}>
              <Phone size={14} color={A} /> {hostData?.host?.phone || hostData?.host?.phoneNumber || hostData?.phone || "Contact via App"}
            </a>
            <a href={place?.website || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 12, color: FG, fontWeight: 600 }}>
              <Globe size={14} color={A} /> {place?.website ? "Official Website" : "Official Portal"}
            </a>
          </div>
        </div>

        {/* Peak Season Info */}
        <div style={{ padding: 18, border: `1.5px solid ${B}`, borderRadius: 20, background: A, color: "#FFF", boxShadow: "0 8px 20px rgba(0, 151, 178, 0.12)" }}>
          <h4 style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 8, margin: "0 0 8px 0" }}>Prime Visit</h4>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "#FFF", margin: "0 0 4px 0" }}>Peak Season</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: 0 }}>
            October to March is ideal for exploring the open-air heritage and coastal views.
          </p>
        </div>
      </div>
    </section>
  );
}

function MobileCTA({ place }) {
  const { tokens: { A, B, FG, W } } = useTheme();

  const handleInquire = () => {
    const el = document.getElementById("logistics-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{
      position: "sticky",
      bottom: 0,
      left: 0,
      right: 0,
      background: W,
      borderTop: `1.5px solid ${B}`,
      padding: "10px 16px 16px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 999
    }}>
      <div>
        <p style={{ fontSize: 9, color: "#777", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Destination</p>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: FG, margin: 0 }}>
          {place?.placeName || place?.title || "Explore"}
        </h4>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleInquire}
        style={{
          background: A,
          color: "#FFF",
          border: "none",
          padding: "10px 16px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.05em",
          cursor: "pointer"
        }}
      >
        Inquire & Plan
      </motion.button>
    </div>
  );
}

function MobilePlaceDetails({
  place,
  galleryItems,
  hostData,
  hostAvatar,
  primaryCategoryId,
  currentListingId,
  unavailablePopup
}) {
  return (
    <>
      {unavailablePopup}
      
      {/* 1. Hero Image with floating content */}
      <MobileHero place={place} galleryItems={galleryItems} />

      {/* 2. Quick Info Chips */}
      <MobileQuickFacts place={place} />

      {/* 3. About Place */}
      <MobileAbout place={place} hostData={hostData} hostAvatar={hostAvatar} />

      {/* 4. Gallery with Lightbox */}
      <MobileGallery galleryItems={galleryItems} />

      {/* 5. Highlights & Itinerary */}
      <MobileItinerary place={place} />

      {/* 6. Good to Know */}
      <MobileGoodToKnow place={place} />

      {/* 7. Logistics */}
      <MobileLogistics place={place} hostData={hostData} />

      {/* 8. Booking / CTA */}
      <MobileCTA place={place} />

      {/* 9. Related Listings Strip */}
      <div style={{ padding: "0 16px" }}>
        <RelatedListingsStrip
          businessInterestId={4}
          primaryCategoryId={primaryCategoryId}
          currentListingId={currentListingId}
          title="More Places To Explore"
        />
      </div>

      {/* 10. Footer */}
      <Footer />
    </>
  );
}

/* ─── MAIN COMPONENT ─────────── */
const PlaceDetails = () => {
  const { isMobile } = useWindowSize();
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const [place, setPlace] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailablePopupOpen, setUnavailablePopupOpen] = useState(false);
  const unavailableRedirectRef = useRef(false);

  // Dynamic browser tab title
  useDocumentTitle(place?.placeName || place?.title, "Places");

  const isPlaceUnavailable = (payload) => {
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
        const data = await getPlaceDetails(id);
        if (!mounted) return;
        if (isPlaceUnavailable(data)) {
          showUnavailablePopupAndRedirect();
          return;
        }

        if (data) {
          const normalizedData = {
            ...data,
            description: data.placeDescription || data.description,
          };
          setPlace(normalizedData);

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
          setGalleryItems(galleryImages.length ? galleryImages : ["https://picsum.photos/seed/place/800/600"]);

          const hostId = data.hostId || data.host?.hostId || data.leadUserId;
          if (hostId) {
            getHostContent(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));
          }
        }
        setLoading(false);
      } catch (e) {
        console.error("Failed to load place details", e);
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
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--FG)" }}>Place Unavailable</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--M)" }}>Place no longer available.</div>
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
    const avatarUrl = hostData?.host?.profilePhotoUrl || hostData?.profilePhotoUrl || place?.host?.profilePhotoUrl;
    return avatarUrl ? formatImageUrl(avatarUrl) : null;
  }, [hostData, place]);

  const primaryCategoryId = place?.primaryCategoryId || place?.primaryCategory?.id || place?.categoryId || place?.category?.id;
  const currentListingId = place?.placeId || place?.id || id;

  if (loading && !place && !unavailablePopupOpen) {
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

  if (isMobile) {
    return (
      <ScopedThemeProvider>
        <ScopedStyles />
        <ProgressBar />
        <MobilePlaceDetails
          place={place}
          galleryItems={galleryItems}
          hostData={hostData}
          hostAvatar={hostAvatar}
          primaryCategoryId={primaryCategoryId}
          currentListingId={currentListingId}
          unavailablePopup={unavailablePopup}
        />
      </ScopedThemeProvider>
    );
  }

  return (
    <ScopedThemeProvider>
      <ScopedStyles />
      <ProgressBar />
      {unavailablePopup}

      <PlaceHero place={place} galleryItems={galleryItems} />

      <Mq items={["Discovery", "Heritage", "Landscape", "Perspective"]} size="sm" bg={THEMES.light.S} accent />

      <QuickFacts place={place} />

      <Mq items={["Coastal Gem", "Urban Heart", "Historical Echo"]} bg={THEMES.light.S} />

      <DestAbout place={place} hostData={hostData} hostAvatar={hostAvatar} />

      <Mq items={["Journey Blueprint", "Daily Rhythm", "The Itinerary"]} size="sm" bg={THEMES.light.S} accent />

      <Itinerary place={place} />

      <Mq items={["Community Pulse", "Visitor Wisdom", "Safety Net"]} bg={THEMES.light.S} />

      <GoodToKnow place={place} />

      <Mq items={["Location Access", "Arrival Logic", "Journey Blueprint"]} size="sm" bg={THEMES.light.S} accent />

      <Logistics place={place} hostData={hostData} />

      <RelatedListingsStrip
        businessInterestId={4}
        primaryCategoryId={primaryCategoryId}
        currentListingId={currentListingId}
        title="More Places To Explore"
      />

      <Footer />

    </ScopedThemeProvider>
  );
};

export default PlaceDetails;
