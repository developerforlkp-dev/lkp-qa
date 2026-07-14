import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import useDarkMode from "use-dark-mode";
import { useLocation, Link, useHistory } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  MapPin, Clock, Ticket, Star, Calendar, ArrowDown, ExternalLink, Map, Navigation,
  Phone, Globe, Send, Info, User, Check, XCircle, Briefcase, ChevronRight, ChevronLeft, Share2, Camera, Heart, X
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
import DetailPageNavPortal from "../../components/DetailPageNavPortal";
import Favorite from "../../components/Favorite";
import Icon from "../../components/Icon";
import FullScreenImage from "../../components/FullScreenImage";

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

const formatImageUrlGlobal = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const [pathPart, queryPart] = url.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/").replace(/\\/g, "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const getItineraryImageUrl = (activity) => {
  const firstImage = Array.isArray(activity?.images) ? activity.images[0] : null;
  if (!firstImage) return null;
  const rawUrl = typeof firstImage === "string" ? firstImage : firstImage.url || firstImage.fileUrl || firstImage.imageUrl;
  if (!rawUrl) return null;
  return formatImageUrlGlobal(rawUrl);
};

const getItineraryImages = (activity) => {
  const imgs = Array.isArray(activity?.images) ? activity.images : [];
  const urls = Array.isArray(activity?.imageUrls) ? activity.imageUrls : [];
  let rawUrls = [];
  if (imgs.length > 0) {
    rawUrls = imgs.map(img => typeof img === "string" ? img : (img.url || img.fileUrl || img.imageUrl));
  } else if (urls.length > 0) {
    rawUrls = urls.map(url => typeof url === "string" ? url : (url.url || url.fileUrl || url.imageUrl));
  }
  if (rawUrls.length === 0) {
    const single = getItineraryImageUrl(activity);
    return single ? [single] : [];
  }
  return rawUrls.map(u => formatImageUrlGlobal(u)).filter(Boolean);
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
    
    .itinerary-image-wrapper:hover .gallery-pill {
      opacity: 1 !important;
    }
    .itinerary-image-wrapper:hover .itinerary-img {
      transform: scale(1.05) !important;
    }

    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
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
    
    .place-details-premium .ticket-container {
      display: flex;
      flex-direction: row;
      width: 100%;
      border-radius: 28px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .place-details-premium .ticket-container:hover {
      transform: translateY(-4px);
    }
    .place-details-premium .ticket-main {
      flex: 1;
      padding: 48px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 36px;
      z-index: 2;
      position: relative;
    }
    .place-details-premium .ticket-stub {
      width: 28%;
      min-width: 320px;
      padding: 48px 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      position: relative;
      z-index: 2;
    }
    .place-details-premium .ticket-separator {
      width: 2px;
      position: relative;
      height: auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      z-index: 5;
    }
    .place-details-premium .ticket-notch-top,
    .place-details-premium .ticket-notch-bottom {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      position: absolute;
      z-index: 10;
      box-sizing: border-box;
    }
    .place-details-premium .ticket-notch-top {
      top: -13px;
      left: -13px;
    }
    .place-details-premium .ticket-notch-bottom {
      bottom: -13px;
      left: -13px;
    }
    .place-details-premium .ticket-notch-left,
    .place-details-premium .ticket-notch-right {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      box-sizing: border-box;
    }
    .place-details-premium .ticket-notch-left {
      left: -13px;
    }
    .place-details-premium .ticket-notch-right {
      right: -13px;
    }
    @media(max-width: 1024px) {
      .place-details-premium .ticket-container {
        flex-direction: column;
      }
      .place-details-premium .ticket-main,
      .place-details-premium .ticket-stub {
        width: 100%;
        padding: 32px 24px;
      }
      .place-details-premium .ticket-separator {
        width: 100%;
        height: 2px;
        border-left: none;
      }
      .place-details-premium .ticket-notch-top {
        left: auto;
        right: -13px;
        top: -13px;
      }
      .place-details-premium .ticket-notch-bottom {
        left: -13px;
        bottom: auto;
        top: -13px;
      }
      .place-details-premium .ticket-notch-left,
      .place-details-premium .ticket-notch-right {
        top: auto;
        transform: none;
      }
      .place-details-premium .ticket-notch-left {
        bottom: -13px;
        left: -13px;
      }
      .place-details-premium .ticket-notch-right {
        bottom: -13px;
        right: -13px;
      }
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
  const v = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y, scale: 1 - s }} animate={v ? { opacity: 1, y: 0, scale: 1 } : {}} transition={{ duration: 0.9, ease: E, delay }} style={style}>
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



/* ─── PLACE SECTIONS ─────────── */
function PlaceHero({ place, galleryItems, id }) {
  const { theme, tokens: { A, FG, M, W, B, S } } = useTheme();
  const r = useRef(null);
  const sliderRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start start", "end start"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const scale = useTransform(smoothProgress, [0, 0.5], [1, 1.3]);
  const rotate = useTransform(smoothProgress, [0, 0.5], [0, 3]);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showArrows, setShowArrows] = useState(false);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const arrowTimeoutRef = useRef(null);

  const handleMouseMove = () => {
    setShowArrows(true);
    if (arrowTimeoutRef.current) clearTimeout(arrowTimeoutRef.current);
    arrowTimeoutRef.current = setTimeout(() => {
      setShowArrows(false);
    }, 1500);
  };

  // Take unique gallery items
  const baseItems = useMemo(() => {
    if (!galleryItems || galleryItems.length === 0) {
      return ["https://picsum.photos/seed/place/800/1000"];
    }
    return galleryItems;
  }, [galleryItems]);

  // Duplicate items multiple times to ensure seamless looping without getting stuck
  const scrolledItems = useMemo(() => {
    if (baseItems.length === 0) return [];
    const repeats = Math.max(4, Math.ceil(15 / baseItems.length));
    const items = [];
    for (let i = 0; i < repeats; i++) {
      items.push(...baseItems);
    }
    return items;
  }, [baseItems]);

  const placeName = place?.placeName || place?.title || "COASTAL GEM";

  const fullDescription = place?.description || "Experience the local heritage, vibrant culture, and breathtaking landscapes of this select destination.";
  const isDescriptionLong = fullDescription.length > 160;
  const displayDescription = isDescriptionLong && !isExpanded
    ? `${fullDescription.slice(0, 160)}...`
    : fullDescription;

  // Continuous smooth auto-scrolling loop (pauses completely when hovered or interacting)
  useEffect(() => {
    const el = sliderRef.current;
    if (!el || lightboxOpen || isSliderHovered || showArrows) return;

    let frameId;
    const speed = 0.8; // Smooth scrolling speed in pixels/frame

    const step = () => {
      if (baseItems.length === 0) return;
      const repeats = Math.max(4, Math.ceil(15 / baseItems.length));
      const oneSetWidth = el.scrollWidth / repeats;

      // Seamlessly wrap scroll position back once we pass one full set
      if (el.scrollLeft >= oneSetWidth) {
        el.scrollLeft = el.scrollLeft - oneSetWidth;
      } else {
        el.scrollLeft += speed;
      }
      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [lightboxOpen, isSliderHovered, showArrows, baseItems]);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const openLightbox = (index) => {
    setActiveIdx(index);
    setLightboxOpen(true);
  };

  const nextImg = () => {
    setActiveIdx((prev) => (prev + 1) % baseItems.length);
  };

  const prevImg = () => {
    setActiveIdx((prev) => (prev - 1 + baseItems.length) % baseItems.length);
  };

  const [shareCopied, setShareCopied] = useState(false);
  const [shareHovered, setShareHovered] = useState(false);
  const [shareRipple, setShareRipple] = useState(false);
  const glow = A || "#0097B2";

  const handleShare = async () => {
    setShareRipple(true);
    setTimeout(() => setShareRipple(false), 700);
    try {
      if (navigator.share) {
        await navigator.share({ title: place?.placeName || "Place", text: place?.description || "", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2400);
      }
    } catch (_) { }
  };

  return (
    <section ref={r} style={{ position: "relative", height: "70vh", background: W, overflow: "hidden", display: "flex", alignItems: "center", padding: "20px 0 40px", boxSizing: "border-box" }}>



      <div style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        padding: "0 80px",
        gap: 60,
        position: "relative",
        zIndex: 10,
        boxSizing: "border-box",
        alignItems: "center"
      }}>

        <div style={{
          width: "30%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          textAlign: "left",
          paddingTop: "60px",
          boxSizing: "border-box"
        }}>
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: E }}
          >
            <p className="font-mono" style={{
              fontSize: 11,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: A,
              fontWeight: 800,
              marginBottom: 16
            }}>
              {toDisplayString(place?.category) || "DESTINATION"}
            </p>
            <h1 className="font-display" style={{
              fontSize: "clamp(2.5rem, 4vw, 4.2rem)",
              fontWeight: 800,
              color: FG,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "0 0 20px 0",
              textTransform: "uppercase"
            }}>
              {placeName}
            </h1>
            {/* Description removed and placed below hero section */}
            <div style={{ marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10 }}>
              {[place?.city, place?.placeType].filter(Boolean).map(tag => (
                <span
                  key={toDisplayString(tag)}
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: FG,
                    border: `1px solid ${B}`,
                    padding: "8px 18px",
                    borderRadius: 30,
                    background: W,
                    fontWeight: 600,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.02)"
                  }}
                >
                  {toDisplayString(tag)}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32 }}>

              <Favorite itemType="place" itemId={id}>
                {({ saved, pending, onClick }) => {
                  const isDark = theme === "dark";
                  const textColor = isDark ? FG : (A || "#0097B2");
                  return (
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); onClick(e); }}
                      whileTap={{ scale: 0.86 }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: isDark ? "#141414" : "#FFFFFF",
                        border: `1.5px solid ${isDark ? `${A}66` : `${A}4D`}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 6px 18px rgba(15,15,15,0.12)",
                        cursor: "pointer",
                        pointerEvents: "auto",
                        position: "relative",
                        zIndex: 200,
                        outline: "none"
                      }}
                    >
                      <style>{`
                        .desktop-save-icon-${id} svg {
                          fill: ${saved ? (A || "#0097B2") : textColor};
                          transition: fill 0.3s ease;
                        }
                      `}</style>
                      <div className={`desktop-save-icon-${id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={saved ? "heart-fill" : "heart"} size={20} />
                      </div>
                    </motion.button>
                  );
                }}
              </Favorite>

              <motion.button
                onClick={handleShare}
                onHoverStart={() => setShareHovered(true)}
                onHoverEnd={() => setShareHovered(false)}
                whileTap={{ scale: 0.86 }}
                style={{
                  height: 44,
                  borderRadius: 22,
                  background: theme === "dark" ? "#141414" : "#FFFFFF",
                  border: `1.5px solid ${shareHovered ? glow : (theme === "dark" ? `${glow}66` : `${glow}4D`)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  boxShadow: shareHovered
                    ? `0 0 18px ${glow}33, 0 8px 28px rgba(15,15,15,0.14)`
                    : "0 6px 18px rgba(15,15,15,0.12)",
                  cursor: "pointer",
                  maxWidth: shareHovered ? 160 : 44,
                  overflow: "hidden",
                  paddingLeft: 12,
                  paddingRight: shareHovered ? 16 : 12,
                  transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), padding-right 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
                  position: "relative",
                  zIndex: 200,
                  outline: "none"
                }}
              >
                <motion.span
                  animate={{ scale: [1, 3.4], opacity: [0.45, 0] }}
                  transition={{ duration: 0, opacity: 0 }}
                  style={{ position: "absolute", inset: -2, borderRadius: 60, background: glow, pointerEvents: "none", opacity: shareRipple ? 0.45 : 0, scale: shareRipple ? 3.4 : 1 }}
                />
                <motion.span
                  animate={{
                    y: shareHovered ? 0 : [0, -2, 0, 2, 0],
                    rotate: shareHovered ? 360 : 0,
                    scale: shareHovered ? 1.15 : 1
                  }}
                  transition={{
                    y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                    rotate: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 0.3, ease: "easeOut" }
                  }}
                  style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, position: "relative", color: glow }}
                >
                  <Share2 size={20} color={glow} />
                </motion.span>
                <span style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  maxWidth: shareHovered ? 130 : 0,
                  opacity: shareHovered ? 1 : 0,
                  marginLeft: shareHovered ? 8 : 0,
                  transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease 0.1s, margin-left 0.4s cubic-bezier(0.22,1,0.36,1)",
                  color: glow,
                  fontFamily: '"Inter", sans-serif',
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  {shareCopied ? "Copied!" : "Share"}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsSliderHovered(true)}
          onMouseLeave={() => {
            setIsSliderHovered(false);
            setShowArrows(false);
          }}
          style={{
            width: "70%",
            height: "100%",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            alignItems: "center"
          }}
        >
          {/* Navigation Left Arrow */}
          <AnimatePresence>
            {showArrows && (
              <motion.button
                key="left-arrow"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollSlider("left")}
                style={{
                  position: "absolute",
                  left: 16,
                  zIndex: 20,
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${B}`,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: FG,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "background-color 0.2s"
                }}
              >
                <ChevronLeft size={20} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Navigation Right Arrow */}
          <AnimatePresence>
            {showArrows && (
              <motion.button
                key="right-arrow"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollSlider("right")}
                style={{
                  position: "absolute",
                  right: 16,
                  zIndex: 20,
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${B}`,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: FG,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  transition: "background-color 0.2s"
                }}
              >
                <ChevronRight size={20} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Images Slider Container */}
          <div
            ref={sliderRef}
            className="no-scrollbar"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              height: "100%",
              width: "100%",
              overflowX: "auto",
              scrollBehavior: "smooth",
              padding: "0 8px"
            }}
          >
            {scrolledItems.map((img, i) => {
              const uniqueKey = `${img}-${i}`;
              const isHovered = hoveredImage === uniqueKey;
              const isAnyHovered = hoveredImage !== null;

              return (
                <div
                  key={uniqueKey}
                  onMouseEnter={() => setHoveredImage(uniqueKey)}
                  onMouseLeave={() => setHoveredImage(null)}
                  onClick={() => openLightbox(i % baseItems.length)}
                  style={{
                    position: "relative",
                    height: "100%",
                    width: isHovered ? 480 : 160,
                    borderRadius: 24,
                    overflow: "hidden",
                    border: `1px solid ${B}`,
                    boxShadow: isHovered
                      ? "0 40px 80px -20px rgba(0,0,0,0.2)"
                      : "0 20px 40px -15px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "width 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                  }}
                >
                  <motion.img
                    src={img}
                    animate={{
                      scale: isHovered ? 1.06 : 1,
                      filter: isAnyHovered && !isHovered ? "brightness(0.7) grayscale(0.1)" : "brightness(1) grayscale(0)"
                    }}
                    transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                    alt=""
                  />

                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.4) 100%)",
                    opacity: isHovered ? 1 : 0.3,
                    transition: "opacity 0.4s",
                    pointerEvents: "none"
                  }} />
                </div>
              );
            })}
          </div>

          {/* View All Badge - ExperienceProduct style */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openLightbox(0)}
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              background: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: 24,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: '"Inter", sans-serif',
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              cursor: "pointer",
              zIndex: 10,
              transition: "all 0.3s ease"
            }}
          >
            <Camera size={16} />
            See all photos
          </motion.button>
        </div>

      </div>

      {/* Desktop Lightbox Modal */}
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
              padding: "24px 36px",
              boxSizing: "border-box"
            }}
          >
            {/* Top Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#FFF", width: "100%" }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                {activeIdx + 1} / {baseItems.length}
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
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Main Image */}
            <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button
                onClick={prevImg}
                style={{
                  position: "absolute",
                  left: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  cursor: "pointer",
                  zIndex: 10,
                  outline: "none"
                }}
              >
                <ChevronLeft size={28} />
              </button>

              <motion.img
                key={activeIdx}
                src={baseItems[activeIdx]}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                style={{ maxWidth: "85%", maxHeight: "75vh", objectFit: "contain", borderRadius: 16 }}
                alt=""
              />

              <button
                onClick={nextImg}
                style={{
                  position: "absolute",
                  right: 16,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  cursor: "pointer",
                  zIndex: 10,
                  outline: "none"
                }}
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Indicator dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {baseItems.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: idx === activeIdx ? A : "rgba(255,255,255,0.3)",
                    transition: "all 0.3s",
                    cursor: "pointer"
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to discover removed */}
    </section>
  );
}

function PlaceDescription({ place }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  const { isMobile } = useWindowSize();
  const description = place?.description || "Experience the local heritage, vibrant culture, and breathtaking landscapes of this select destination.";

  const facts = [
    { label: "Timings", val: place?.timings || place?.openingHours || "06:00 - 20:00", icon: Clock },
    { label: "Entry Fee", val: place?.entryFee || "Free Entry", icon: Ticket },
    { label: "Best Time", val: place?.bestTimeToVisit || "Year Round", icon: Star },
    { label: "Rating", val: `${place?.rating || place?.averageRating || "4.8"} Rating`, icon: Check },
  ];

  if (isMobile) {
    return (
      <section className="place-description-section" style={{ background: W, padding: "32px 16px", borderBottom: `1px solid ${B}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Quick Facts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {facts.map((f, i) => {
              const IconComp = f.icon;
              return (
                <div key={f.label} style={{
                  background: S,
                  border: `1px solid ${B}`,
                  borderRadius: 16,
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <IconComp size={14} color={A} />
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: M, fontWeight: 700 }}>{f.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: FG }}>{f.val}</span>
                </div>
              );
            })}
          </div>

          {/* Description Text */}
          <p style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: FG,
            margin: 0,
            fontWeight: 450,
            fontFamily: "Poppins, sans-serif"
          }}>
            {description}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="place-description-section" style={{ background: W, padding: "60px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>

        {/* Horizontal facts row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          background: S,
          borderRadius: 24,
          padding: "24px 40px",
          border: `1px solid ${B}`
        }}>
          {facts.map((f, i) => {
            const IconComp = f.icon;
            return (
              <div key={f.label} style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                borderRight: i < 3 ? `1px solid ${B}` : "none",
                paddingRight: i < 3 ? 20 : 0
              }}>
                <div style={{ background: W, padding: 10, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${B}` }}>
                  <IconComp size={18} color={A} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: M, fontWeight: 700, marginBottom: 2 }}>{f.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: FG }}>{f.val}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Two-column Editorial text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.25em", color: A, fontWeight: 800 }}>About this place</span>
          <div style={{
            columnCount: 2,
            columnGap: 60,
            fontSize: 16,
            lineHeight: 1.9,
            color: FG,
            fontFamily: "Poppins, sans-serif",
            fontWeight: 400
          }}>
            {description}
          </div>
        </div>

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
  const [photoVisible, setPhotoVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const scrollRef = useRef(null);

  const steps = place?.itinerary || [];
  if (steps.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section style={{ background: S, padding: "48px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, margin: 0, fontFamily: "Poppins, sans-serif" }}>Curated Experience Plan</h3>
          {steps.length > 3 && (
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={scrollLeft} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${B}`, background: W, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: FG }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={scrollRight} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${B}`, background: W, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: FG }}>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
        <div style={{ position: "relative", margin: "0 -80px", padding: "0 80px" }}>
          <div 
            ref={scrollRef}
            className="hide-scrollbar"
            style={{ 
              display: "flex", 
              gap: 32, 
              overflowX: "auto", 
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth"
            }}
          >
            {steps.map((s, i) => (
              <div key={i} style={{ flex: "0 0 calc(33.333% - 21.33px)", minWidth: 300, scrollSnapAlign: "start" }}>
                <Soul delay={i * 0.15} y={80} r={i % 2 === 0 ? 3 : -3}>
                  <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.4 }} style={{ background: W, border: `1px solid ${B}`, borderRadius: 32, padding: "32px 32px 48px", height: "100%", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <span className="font-display" style={{ position: "absolute", top: -10, right: 10, fontSize: "clamp(5rem, 8vw, 10rem)", fontWeight: 800, color: A, opacity: 0.04, pointerEvents: "none" }}>{i + 1}</span>
                    {getItineraryImageUrl(s) && (
                      <div 
                        className="itinerary-image-wrapper"
                        style={{ margin: "-32px -32px 24px -32px", height: 200, overflow: "hidden", cursor: "pointer", position: "relative" }}
                        onClick={() => {
                          const imgs = getItineraryImages(s);
                          setSelectedImages(imgs);
                          setPhotoIndex(0);
                          setPhotoVisible(true);
                        }}
                      >
                        <img className="itinerary-img" src={getItineraryImageUrl(s)} alt={s.title || s.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }} />
                        <div className="gallery-pill" style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 8, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)", opacity: 0, transition: "opacity 0.3s ease" }}>
                          <Camera size={12} /> GALLERY
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginTop: getItineraryImageUrl(s) ? 0 : 24 }}>
                      <div style={{ width: 8, height: 8, background: A }} />
                      <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700 }}>Step {i + 1}</p>
                    </div>
                    <h3 className="font-display" style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 20 }}>{s.title || s.name}</h3>
                    <p style={{ fontSize: 14, color: M, lineHeight: 1.85 }}>{s.desc || s.description || s.briefDescription}</p>
                  </motion.div>
                </Soul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {photoVisible && (
          <FullScreenImage
            src={selectedImages[photoIndex] || "/images/content/placeholder.jpg"}
            items={selectedImages.length > 0 ? selectedImages : ["/images/content/placeholder.jpg"]}
            currentIndex={photoIndex}
            onNavigate={setPhotoIndex}
            onClose={() => setPhotoVisible(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function VisitorInformation({ place }) {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  const { isMobile } = useWindowSize();

  const formattedTown = place?.nearestTown?.split('/')[0]?.trim() || "MUNNAR";
  const formattedAirport = place?.nearestAirport ? place.nearestAirport.split('(')[0].replace("International Airport", "").trim().toUpperCase() : "COCHIN";
  const formattedRailway = place?.nearestRailway ? place.nearestRailway.split('(')[0].replace("Railway Station", "").trim() : "ALUVA";

  const suitabilityTags = useMemo(() => {
    const raw = place?.suitableFor;
    if (!raw) return ["Couples", "Families", "Solo"];
    if (Array.isArray(raw)) return raw.map(item => toDisplayString(item));
    if (typeof raw === "string") return raw.split(',').map(t => t.trim());
    const disp = toDisplayString(raw);
    return disp ? disp.split(',').map(t => t.trim()) : ["Couples", "Families", "Solo"];
  }, [place?.suitableFor]);

  // Ticket notch decoration styles helper
  const ticketNotchStyle = (side) => ({
    width: 20,
    height: 20,
    background: W,
    border: `1px solid ${B}`,
    borderRadius: "50%",
    position: "absolute",
    top: "70%",
    transform: "translateY(-50%)",
    [side]: -11,
    zIndex: 4,
    boxSizing: "border-box"
  });

  return (
    <section style={{ background: W, padding: isMobile ? "40px 16px" : "48px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <h3 style={{
          fontSize: isMobile ? 24 : "clamp(1.8rem, 2.5vw, 2.2rem)",
          fontWeight: 700,
          color: FG,
          marginBottom: 32,
          fontFamily: "Poppins, sans-serif"
        }}>Visitor Guide</h3>

        <Soul y={30}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
            gap: 32,
            width: "100%",
            boxSizing: "border-box"
          }}>
            {/* Card 1: Official & Administrative Permit */}
            <motion.div
              whileHover={{ y: -8, boxShadow: "0 30px 60px rgba(0,0,0,0.06)" }}
              transition={{ duration: 0.4 }}
              style={{
                background: W,
                border: `1px solid ${B}`,
                borderRadius: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 480,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
              }}
            >
              {/* Ticket Top Barber Stripe */}
              <div style={{ height: 5, background: `repeating-linear-gradient(45deg, ${A}, ${A} 8px, ${B} 8px, ${B} 16px)`, width: "100%" }} />

              {/* Ticket Notches */}
              <div style={ticketNotchStyle("left")} />
              <div style={ticketNotchStyle("right")} />

              {/* Watermark Suitcase Clipart */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 110, height: 110, opacity: 0.04, position: "absolute", top: "45%", right: 10, transform: "translateY(-50%)", pointerEvents: "none", color: A }}>
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>

              {/* Card content top */}
              <div style={{ padding: "32px 28px 20px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.08)`, display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, color: M, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Pass Category</span>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: FG, margin: 0 }}>Permit & Admin</h4>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Managed By</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: FG, margin: 0 }}>{place?.managedBy || "Government Tourism Dept."}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Support Hotline</span>
                      <a href={`tel:${place?.phone || "+914842567890"}`} style={{ fontSize: 14, fontWeight: 750, color: A, textDecoration: "none" }}>
                        {place?.phone || "+91 484 256 7890"}
                      </a>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 2 }}>Suitability</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        {suitabilityTags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: FG, background: S, padding: "2px 8px", borderRadius: 30 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: `2px dashed ${B}`, width: "100%", height: 0 }} />

              {/* Card content bottom (Detached Stamp Stub) */}
              <div style={{ padding: "20px 28px 28px 28px", height: "30%", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "space-between", background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.02)` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, color: M, textTransform: "uppercase", letterSpacing: "0.05em" }}>Log Status</span>
                  <span style={{ fontWeight: 800, color: FG, fontSize: 12 }}>VERIFIED PERMIT</span>
                </div>

                {/* Stamp Clipart */}
                <div style={{
                  border: `2px double ${A}`,
                  color: A,
                  fontFamily: "monospace",
                  fontSize: 7,
                  fontWeight: 900,
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(-8deg)",
                  background: W,
                  boxShadow: `0 4px 10px rgba(0, 0, 0, 0.02)`
                }}>
                  <div>OFFICIAL</div>
                  <div style={{ fontSize: 8, fontWeight: 950 }}>PERMIT</div>
                  <div>OK</div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Transit & Connectors */}
            <motion.div
              whileHover={{ y: -8, boxShadow: "0 30px 60px rgba(0,0,0,0.06)" }}
              transition={{ duration: 0.4 }}
              style={{
                background: W,
                border: `1px solid ${B}`,
                borderRadius: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 480,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
              }}
            >
              {/* Ticket Top Barber Stripe */}
              <div style={{ height: 5, background: `repeating-linear-gradient(45deg, ${A}, ${A} 8px, ${B} 8px, ${B} 16px)`, width: "100%" }} />

              {/* Ticket Notches */}
              <div style={ticketNotchStyle("left")} />
              <div style={ticketNotchStyle("right")} />

              {/* Watermark Plane Clipart */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 110, height: 110, opacity: 0.04, position: "absolute", top: "45%", right: 10, transform: "translateY(-50%)", pointerEvents: "none", color: A }}>
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
              </svg>

              {/* Card content top */}
              <div style={{ padding: "32px 28px 20px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.08)`, display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M16.2 7.8l-2 2.6-2.6 2-2.6 2 2-2.6 2.6-2 2.6-2z" /></svg>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, color: M, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Transit Ticket</span>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: FG, margin: 0 }}>Access & Terminals</h4>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ color: A, marginTop: 2 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      </div>
                      <div>
                        <span style={{ fontSize: 9, color: M, display: "block" }}>Nearest Town</span>
                        <span style={{ fontWeight: 700, color: FG, fontSize: 13 }}>{formattedTown}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ color: A, marginTop: 2 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="3" width="16" height="18" rx="2" /><rect x="8" y="7" width="8" height="4" /><circle cx="10" cy="16" r="1" /><circle cx="14" cy="16" r="1" /></svg>
                      </div>
                      <div>
                        <span style={{ fontSize: 9, color: M, display: "block" }}>Railway Terminal</span>
                        <span style={{ fontWeight: 700, color: FG, fontSize: 13 }}>{formattedRailway} Station</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ color: A, marginTop: 2 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" /></svg>
                      </div>
                      <div>
                        <span style={{ fontSize: 9, color: M, display: "block" }}>Airport Terminal</span>
                        <span style={{ fontWeight: 700, color: FG, fontSize: 13 }}>{formattedAirport} Airport</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: `2px dashed ${B}`, width: "100%", height: 0 }} />

              {/* Card content bottom (Detached Stamp Stub) */}
              <div style={{ padding: "20px 28px 28px 28px", height: "30%", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "space-between", background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.02)` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, color: M, display: "block" }}>Vehicle Access</span>
                  <span style={{ fontWeight: 700, color: FG, fontSize: 12 }}>{place?.accessByVehicle || "All Vehicles"}</span>
                </div>

                {/* Stamp Clipart */}
                <div style={{
                  border: `1.5px dashed ${A}`,
                  color: A,
                  fontFamily: "monospace",
                  fontSize: 7,
                  fontWeight: 900,
                  width: 76,
                  height: 38,
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(6deg)",
                  opacity: 0.8,
                  background: W,
                  boxShadow: `0 4px 10px rgba(0, 0, 0, 0.02)`
                }}>
                  <div style={{ fontSize: 5 }}>TRANSIT OK</div>
                  <div style={{ fontSize: 7, fontWeight: 950 }}>APPROVED</div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Admission & Specifications */}
            <motion.div
              whileHover={{ y: -8, boxShadow: "0 30px 60px rgba(0,0,0,0.06)" }}
              transition={{ duration: 0.4 }}
              style={{
                background: W,
                border: `1px solid ${B}`,
                borderRadius: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 480,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
              }}
            >
              {/* Ticket Top Barber Stripe */}
              <div style={{ height: 5, background: `repeating-linear-gradient(45deg, ${A}, ${A} 8px, ${B} 8px, ${B} 16px)`, width: "100%" }} />

              {/* Ticket Notches */}
              <div style={ticketNotchStyle("left")} />
              <div style={ticketNotchStyle("right")} />

              {/* Watermark Compass Clipart */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 110, height: 110, opacity: 0.04, position: "absolute", top: "45%", right: 10, transform: "translateY(-50%)", pointerEvents: "none", color: A }}>
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>

              {/* Card content top */}
              <div style={{ padding: "32px 28px 20px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.08)`, display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, color: M, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Entry Permits</span>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: FG, margin: 0 }}>Rules & Specifications</h4>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: `1px solid ${B}` }}>
                      <span style={{ fontSize: 12, color: M }}>Permit Category</span>
                      <span style={{ fontWeight: 700, color: FG, fontSize: 12 }}>{place?.entryFee || "Paid Entry"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: `1px solid ${B}` }}>
                      <span style={{ fontSize: 12, color: M }}>Parking Place</span>
                      <span style={{ fontWeight: 700, color: FG, fontSize: 12 }}>{place?.parking || "Available"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: `1px solid ${B}` }}>
                      <span style={{ fontSize: 12, color: M }}>Wheelchair</span>
                      <span style={{ fontWeight: 700, color: FG, fontSize: 12 }}>{place?.wheelchair || "Accessible"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: `1px solid ${B}` }}>
                      <span style={{ fontSize: 12, color: M }}>Age Restriction</span>
                      <span style={{ fontWeight: 700, color: FG, fontSize: 12 }}>{place?.minAge || "All Ages"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: `2px dashed ${B}`, width: "100%", height: 0 }} />

              {/* Card content bottom (Detached Stamp Stub) */}
              <div style={{ padding: "20px 28px 28px 28px", height: "30%", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "space-between", background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.02)` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 9, color: M, display: "block" }}>Best Visit Season</span>
                  <span style={{ fontWeight: 700, color: FG, fontSize: 12 }}>{place?.bestTimeToVisit || "Year Round"}</span>
                </div>

                {/* Stamp Clipart */}
                <div style={{
                  border: `2px double ${A}`,
                  color: A,
                  fontFamily: "monospace",
                  fontSize: 7,
                  fontWeight: 900,
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(10deg)",
                  background: W,
                  boxShadow: `0 4px 10px rgba(0, 0, 0, 0.02)`
                }}>
                  <div>RULES</div>
                  <div style={{ fontSize: 8, fontWeight: 950 }}>PASSED</div>
                  <div>DEPT</div>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Operating Hours & Official Stamp Detached Stub */}
            <motion.div
              whileHover={{ y: -8, boxShadow: "0 30px 60px rgba(0,0,0,0.06)" }}
              transition={{ duration: 0.4 }}
              style={{
                background: W,
                border: `1px solid ${B}`,
                borderRadius: 24,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 480,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
              }}
            >
              {/* Ticket Top Barber Stripe */}
              <div style={{ height: 5, background: `repeating-linear-gradient(45deg, ${A}, ${A} 8px, ${B} 8px, ${B} 16px)`, width: "100%" }} />

              {/* Ticket Notches */}
              <div style={ticketNotchStyle("left")} />
              <div style={ticketNotchStyle("right")} />

              {/* Watermark Hourglass Clipart */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 110, height: 110, opacity: 0.04, position: "absolute", top: "45%", right: 10, transform: "translateY(-50%)", pointerEvents: "none", color: A }}>
                <path d="M5 2h14v2H5V2zM5 22h14v-2H5v2zM19 4l-7 7-7-7M5 20l7-7 7 7" />
              </svg>

              {/* Card content top */}
              <div style={{ padding: "32px 28px 20px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.08)`, display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, color: M, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>Coupon validity</span>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: FG, margin: 0 }}>Permit Timings</h4>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: M }}>Opening Hour</span>
                      <span style={{ fontWeight: 800, color: FG, fontSize: 14, fontFamily: "var(--font-fraunces), Georgia, serif" }}>{place?.openingTime || "08:30 AM"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: M }}>Closing Hour</span>
                      <span style={{ fontWeight: 800, color: FG, fontSize: 14, fontFamily: "var(--font-fraunces), Georgia, serif" }}>{place?.closeTime || "04:30 PM"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: M }}>Closed On</span>
                      <span style={{ fontWeight: 850, color: A, fontSize: 13, textTransform: "uppercase" }}>{place?.closedDays || "None"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: `2px dashed ${B}`, width: "100%", height: 0 }} />

              {/* Card content bottom (Detached Stamp Stub) */}
              <div style={{ padding: "20px 28px 28px 28px", height: "30%", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "space-between", background: `rgba(${A === "#0097B2" ? "0, 151, 178" : "17, 17, 17"}, 0.02)` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{
                    width: 90,
                    height: 24,
                    background: FG,
                    opacity: 0.1,
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, ${FG} 1px, ${FG} 3px, transparent 3px, transparent 4px, ${FG} 4px, ${FG} 5px)`
                  }} />
                  <span className="font-mono" style={{ fontSize: 7, color: M }}>LKP-{place?.id || "99812"}</span>
                </div>

                {/* Stamp Clipart */}
                <div style={{
                  border: `2px solid ${A}`,
                  color: A,
                  fontFamily: "monospace",
                  fontSize: 7,
                  fontWeight: 900,
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(-10deg)",
                  background: W,
                  boxShadow: `0 4px 10px rgba(0, 0, 0, 0.02)`
                }}>
                  <div style={{ fontSize: 5, borderBottom: `1px solid ${A}`, paddingBottom: 1 }}>PASSED</div>
                  <div style={{ fontSize: 7, fontWeight: 950 }}>GATEWAY</div>
                  <div style={{ fontSize: 5 }}>TOURISM</div>
                </div>
              </div>
            </motion.div>
          </div>
        </Soul>
      </div>
    </section>
  );
}

function GoodToKnow({ place }) {
  const { tokens: { A, B, FG, M, W, S, AL } } = useTheme();

  const warningBg = A === "#0097B2" ? "#fff5f5" : "rgba(239, 68, 68, 0.05)";
  const warningBorder = A === "#0097B2" ? "#fee2e2" : "rgba(239, 68, 68, 0.2)";
  const warningText = A === "#0097B2" ? "#b91c1c" : "#fca5a5";
  const warningHeader = A === "#0097B2" ? "#991b1b" : "#f87171";

  const carryItems = ["Comfortable Shoes", "Water Bottle", "Camera", "Sun Protection"];
  const avoidItems = ["Littering", "Unsafe Climbing", "Disrespecting Local Privacy"];

  const feedbackBg = A === "#0097B2" ? "#f8f8f8" : S;

  return (
    <section style={{ background: S, padding: "48px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
        <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, fontFamily: "Poppins, sans-serif" }}>Good To Know</h3>

        {/* Row 1: Good to Know Title & Two side-by-side cards */}
        <Rev>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 32,
            marginTop: 8
          }}>

            {/* What to Carry - Premium Luggage Tag design */}
            <div style={{ position: "relative" }}>

              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,151,178,0.12)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  background: W,
                  border: `1px solid ${B}`,
                  borderRadius: 24,
                  padding: "24px 24px 20px 24px",
                  position: "relative",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.01)",
                  height: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 9, color: M, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800 }}>Luggage Check</span>
                      <h4 style={{ fontSize: 17, fontWeight: 800, color: FG, margin: "2px 0 0 0", fontFamily: "Poppins, sans-serif" }}>What to Carry</h4>
                    </div>
                    <div style={{ background: AL, padding: 8, borderRadius: 10 }}>
                      <Briefcase size={16} color={A} />
                    </div>
                  </div>

                  {/* Flight Label Details */}
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px dashed ${B}`, paddingBottom: 6, marginBottom: 12, fontSize: 8, fontFamily: "monospace", color: M, letterSpacing: "0.05em" }}>
                    <div>DEP: LKP-GATEWAY</div>
                    <div>CLASS: FIRST</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {carryItems.map(item => (
                      <div
                        key={item}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          background: `${S}80`,
                          borderRadius: 10
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: W, border: `1px solid ${B}`, flexShrink: 0 }}>
                          <Check size={8} color={A} strokeWidth={3} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: FG }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Baggage Barcode Illustration */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 20 }}>
                  <div style={{ display: "flex", gap: 2, alignItems: "center", height: 16, opacity: 0.8 }}>
                    {[2, 4, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                      <div key={idx} style={{ width: w, height: "100%", background: FG, opacity: idx % 3 === 0 ? 0.3 : 0.8 }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 8, fontFamily: "monospace", color: M, letterSpacing: "0.2em" }}>*LKP-{place?.id || "CURATOR"}*</span>
                </div>
              </motion.div>
            </div>

            {/* Things to Avoid - Customs Restricted Goods Slip design */}
            <div style={{ position: "relative" }}>
              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(239,68,68,0.15)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                  background: warningBg,
                  border: `1.5px solid ${warningBorder}`,
                  borderRadius: 24,
                  padding: "28px 24px 20px 24px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.01)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  height: "100%"
                }}
              >
                {/* Warning Barber Stripe border top */}
                <div style={{
                  height: 4,
                  background: `repeating-linear-gradient(-45deg, #ef4444, #ef4444 6px, transparent 6px, transparent 12px)`,
                  width: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0
                }} />

                {/* Rotated Restricted Stamp Overlay */}
                <div style={{
                  border: `3px double #ef4444`,
                  color: "#ef4444",
                  fontFamily: "monospace",
                  fontSize: 8,
                  fontWeight: 900,
                  padding: "4px 8px",
                  borderRadius: 2,
                  position: "absolute",
                  top: 10,
                  right: 14,
                  transform: "rotate(-12deg) scale(1)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: warningBg,
                  boxShadow: "0 0 10px rgba(239,68,68,0.05)",
                  zIndex: 5
                }}>
                  RESTRICTED
                </div>

                <div>
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 9, color: warningText, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>Customs Declaration</span>
                    <h4 style={{ fontSize: 17, fontWeight: 800, color: warningHeader, margin: "2px 0 0 0", fontFamily: "Poppins, sans-serif" }}>Things to Avoid</h4>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {avoidItems.map(item => (
                      <div
                        key={item}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          background: "rgba(239, 68, 68, 0.03)",
                          borderRadius: 10,
                          border: `1px dashed ${warningBorder}`
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: W, flexShrink: 0 }}>
                          <XCircle size={10} color="#ef4444" />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: warningText }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Barber Stripe to frame it */}
                <div style={{
                  height: 4,
                  background: `repeating-linear-gradient(-45deg, #ef4444, #ef4444 6px, transparent 6px, transparent 12px)`,
                  width: "100%",
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  opacity: 0.7
                }} />
              </motion.div>
            </div>

          </div>
        </Rev>
      </div>
    </section>
  );
}

function CommunityFeedback() {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  return (
    <section className="community-feedback-section" style={{ background: S, padding: "48px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Rev delay={0.1}>
          <div style={{ background: W, border: `1px solid ${B}`, borderRadius: 32, padding: 48 }}>
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

function LocationSection({ place }) {
  const { tokens: { A, B, FG, M, W, S }, theme } = useTheme();
  const { isMobile } = useWindowSize();
  const latitude = place?.latitude;
  const longitude = place?.longitude;
  const address = place?.address || place?.meetingAddress;
  const landmark = place?.landmark || place?.meetingLandmark;
  const city = place?.city || place?.nearestTown;
  const district = place?.district || place?.meetingDistrict;
  const state = place?.state || place?.region || place?.meetingState;
  const country = place?.country || place?.meetingCountry;
  const instructions = place?.instructions || place?.meetingInstructions;

  return (
    <section className="location-section" style={{ background: W, padding: isMobile ? "40px 16px" : "48px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "45fr 55fr", gap: isMobile ? 32 : 64 }} className="prep-grid">
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{place?.placeName || "Location"}</span>
                  </div>
                  {latitude && longitude ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=14&output=embed`}
                      allowFullScreen
                      title="Location Map"
                    />
                  ) : (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(place?.placeName || "")}&hl=en&z=14&output=embed`}
                      allowFullScreen
                      title="Location Map"
                    />
                  )}
                </div>
              </div>
            </div>
          </Rev>
          <Rev delay={0.2} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 32, fontFamily: "Poppins, sans-serif" }}>Where it is</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16, margin: 0, padding: 0 }}>
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

                  {city && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>City/Town</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{city}</span>
                    </li>
                  )}

                  {district && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>District</span>
                      <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{district}</span>
                    </li>
                  )}

                  {state && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>State/Region</span>
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

                  {(!address && !city && !state && !landmark && !district && !country && !instructions) && (
                    <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 16 }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Region</span>
                      <span style={{ fontSize: 14, color: M, fontWeight: 500 }}>Specific regional details are available on the map.</span>
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

/* ─── MOBILE COMPONENTS ─────────── */

function MobileHero({ place, galleryItems, id }) {
  const { theme, tokens } = useTheme();
  const { A, FG, M, BG, W, B } = tokens;
  const history = useHistory();
  const placeName = place?.placeName || place?.title || "COASTAL GEM";

  const [shareCopied, setShareCopied] = useState(false);
  const [shareHovered, setShareHovered] = useState(false);
  const [shareRipple, setShareRipple] = useState(false);
  const glow = A || "#0097B2";

  const handleShare = async () => {
    setShareRipple(true);
    setTimeout(() => setShareRipple(false), 700);
    try {
      if (navigator.share) {
        await navigator.share({ title: place?.placeName || "Place", text: place?.description || "", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2400);
      }
    } catch (_) { }
  };

  const images = galleryItems && galleryItems.length ? galleryItems : ["https://picsum.photos/seed/destination/800/1000"];

  return (
    <section style={{ background: BG, paddingTop: 0, position: "relative", overflow: "hidden" }}>
      {/* Mobile Top Controls */}
      <div style={{ position: "absolute", top: 24, left: 20, right: 20, display: "flex", justifyContent: "space-between", zIndex: 200, pointerEvents: "none" }}>
        <button onClick={(e) => { e.stopPropagation(); history.goBack(); }} style={{ pointerEvents: "auto", width: 44, height: 44, borderRadius: "50%", background: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", outline: "none", cursor: "pointer" }}>
          <ChevronLeft size={22} color={theme === "dark" ? "#FFFFFF" : "#111111"} />
        </button>
        <div style={{ display: "flex", gap: 12, pointerEvents: "auto" }}>
          <Favorite itemType="place" itemId={id}>
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
                await navigator.share({ title: place?.placeName || place?.title || "", text: place?.description || "", url: window.location.href });
              } else {
                await navigator.clipboard.writeText(window.location.href);
              }
            } catch (_) {}
          }} style={{ width: 44, height: 44, borderRadius: "50%", background: theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", outline: "none", cursor: "pointer" }}>
            <Share2 size={20} color={theme === "dark" ? "#FFFFFF" : "#111111"} />
          </button>
        </div>
      </div>

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
              height: "70vh",
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
                <X size={22} />
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
  const [photoVisible, setPhotoVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const steps = place?.itinerary || [];
  if (steps.length === 0) return null;

  return (
    <section style={{ background: S, padding: "40px 16px" }}>
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
          <div key={i} style={{ display: "flex", gap: 16, position: "relative", zIndex: 1, alignItems: "flex-start" }}>
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
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              marginTop: getItineraryImageUrl(s) ? 16 : 0
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
              boxShadow: "0 4px 12px rgba(0,0,0,0.01)",
              overflow: "hidden"
            }}>
              {getItineraryImageUrl(s) && (
                <div 
                  style={{ margin: "-16px -14px 16px -14px", height: 160, overflow: "hidden", cursor: "pointer", position: "relative" }}
                  onClick={() => {
                    const imgs = getItineraryImages(s);
                    setSelectedImages(imgs);
                    setPhotoIndex(0);
                    setPhotoVisible(true);
                  }}
                >
                  <img src={getItineraryImageUrl(s)} alt={s.title || s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 8, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)" }}>
                    <Camera size={12} /> GALLERY
                  </div>
                </div>
              )}
              <h4 style={{ fontSize: 14, fontWeight: 700, color: FG, marginBottom: 6, margin: "0 0 6px 0" }}>{s.title || s.name}</h4>
              <p style={{ fontSize: 11, color: M, lineHeight: 1.6, margin: 0 }}>{s.desc || s.description || s.briefDescription}</p>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {photoVisible && (
          <FullScreenImage
            src={selectedImages[photoIndex] || "/images/content/placeholder.jpg"}
            items={selectedImages.length > 0 ? selectedImages : ["/images/content/placeholder.jpg"]}
            currentIndex={photoIndex}
            onNavigate={setPhotoIndex}
            onClose={() => setPhotoVisible(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function MobileGoodToKnow({ place }) {
  const { tokens: { A, B, FG, M, W, S, AL } } = useTheme();

  const warningBg = A === "#0097B2" ? "#fff5f5" : "rgba(239, 68, 68, 0.05)";
  const warningBorder = A === "#0097B2" ? "#fee2e2" : "rgba(239, 68, 68, 0.2)";
  const warningText = A === "#0097B2" ? "#b91c1c" : "#fca5a5";
  const warningHeader = A === "#0097B2" ? "#991b1b" : "#f87171";

  const carryItems = ["Comfortable Shoes", "Water Bottle", "Camera", "Sun Protection"];
  const avoidItems = ["Littering", "Unsafe Climbing", "Disrespecting Local Privacy"];

  return (
    <section style={{ background: S, padding: "40px 16px", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
      <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 6 }}>
        SAFETY & GUIDANCE
      </p>
      <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Good To Know
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 32, marginBottom: 32 }}>

        {/* What to Carry - Mobile Luggage Tag */}
        <div style={{ position: "relative" }}>

          <div style={{
            background: W,
            border: `1px solid ${B}`,
            borderRadius: 24,
            padding: "20px 20px 20px 20px",
            position: "relative",
            boxShadow: "0 4px 20px rgba(0,0,0,0.01)"
          }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: FG, margin: 0 }}>
                <Briefcase size={16} color={A} /> What to Carry
              </h4>
              <span style={{ fontSize: 8, color: M, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>Luggage Check</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {carryItems.map(item => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: `1px dashed ${B}`
                  }}
                >
                  <Check size={14} color={A} strokeWidth={3} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: FG }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Baggage Barcode */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 18, opacity: 0.7 }}>
              <div style={{
                width: 110,
                height: 20,
                color: FG,
                opacity: 0.15,
                backgroundImage: `repeating-linear-gradient(90deg, currentColor, currentColor 1px, transparent 1px, transparent 3px, currentColor 3px, currentColor 4px, transparent 4px, transparent 6px)`
              }} />
              <span style={{ fontSize: 8, fontFamily: "monospace", color: M, letterSpacing: "0.1em" }}>*BAG-LKP-${place?.id || "PACK"}*</span>
            </div>
          </div>
        </div>

        {/* Things to Avoid - Mobile Customs Declaration Slip */}
        <div style={{
          background: warningBg,
          border: `1.5px solid ${warningBorder}`,
          borderRadius: 24,
          padding: "24px 20px 20px 20px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.01)"
        }}>
          {/* Warning Barber Stripe border top */}
          <div style={{
            height: 5,
            background: `repeating-linear-gradient(-45deg, #ef4444, #ef4444 5px, transparent 5px, transparent 10px)`,
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0
          }} />

          {/* Rotated Restricted Stamp Overlay */}
          <div style={{
            border: `1.5px dashed ${warningHeader}`,
            color: warningHeader,
            fontFamily: "monospace",
            fontSize: 7,
            fontWeight: 900,
            padding: "2px 6px",
            borderRadius: 3,
            position: "absolute",
            top: 14,
            right: 14,
            transform: "rotate(-10deg)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            opacity: 0.8
          }}>
            Restricted
          </div>

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: warningHeader, margin: 0 }}>
              <XCircle size={16} color="#ef4444" /> Things to Avoid
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {avoidItems.map(item => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: `1px dashed ${warningBorder}`
                }}
              >
                <XCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: warningText }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

function MobileCommunityFeedback() {
  const { tokens: { A, B, FG, M, W, S } } = useTheme();
  return (
    <section style={{ background: S, padding: "40px 16px", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
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

function PremiumMarquee({ items, isMobile, fallbackItems }) {
  const { theme, tokens } = useTheme();
  const { A, B, BG, FG, M } = tokens;
  
  const rawTags = Array.isArray(items) && items.length > 0
    ? items.map((t) => (typeof t === "string" ? t : t?.name || t?.title || t?.tag || t?.label || t?.value || "")).filter(Boolean)
    : (typeof items === "string" ? items.split(",").map(s=>s.trim()).filter(Boolean) : fallbackItems);
    
  const marqueeItems = rawTags.length > 0 ? rawTags : fallbackItems;
  const loopedTags = Array(12).fill(marqueeItems).flat();
  const estimatedTagWidth = (tag) => tag.length * 9.5 + 75;
  const tagsDistance = marqueeItems.reduce((sum, tag) => sum + estimatedTagWidth(tag), 0) * 6;
  const tagsDuration = Math.max(tagsDistance / 60, 10);

  return (
    <div style={{
      margin: "0",
      overflow: "hidden",
      position: "relative",
      padding: "20px 0",
      background: theme === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
      borderTop: `1px solid ${B}`,
      borderBottom: `1px solid ${B}`,
    }}>
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
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 40, marginRight: 40 }}>
              <span
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: isEven ? 700 : 400,
                  color: isEven ? FG : M,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  opacity: isEven ? 1 : 0.75
                }}
              >
                {tag}
              </span>
              <Star size={14} color={A || "#0097B2"} fill={A || "#0097B2"} style={{ opacity: 0.6 }} />
            </div>
          );
        })}
      </motion.div>
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
      <MobileHero place={place} galleryItems={galleryItems} id={currentListingId} />

      {/* Place Description */}
      <PlaceDescription place={place} />
      <PremiumMarquee items={place?.tags} isMobile={true} fallbackItems={["Authentic Experience", "Local Heritage", "Curated Journey", "Memorable Moments"]} />

      {/* 4. Gallery with Lightbox */}
      <MobileGallery galleryItems={galleryItems} />

      {/* 5. Highlights & Itinerary */}
      <MobileItinerary place={place} />

      {/* Visitor Information */}
      <VisitorInformation place={place} />

      {/* 6. Good to Know */}
      <MobileGoodToKnow place={place} />

      {/* Location Map Section */}
      <PremiumMarquee items={place?.whatsSpecial} isMobile={true} fallbackItems={["Signature Offerings", "Exclusive Moments", "Bespoke Journey"]} />
      <LocationSection place={place} />

      {/* Community Feedback */}
      <MobileCommunityFeedback />

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

  if (!place && !unavailablePopupOpen) {
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
      {!isMobile && <DetailPageNavPortal activeCategory="places" />}

      <PlaceHero place={place} galleryItems={galleryItems} id={currentListingId} />

      <PlaceDescription place={place} />
      <PremiumMarquee items={place?.tags} isMobile={false} fallbackItems={["Authentic Experience", "Local Heritage", "Curated Journey", "Memorable Moments"]} />

      <Itinerary place={place} />

      <VisitorInformation place={place} />

      <GoodToKnow place={place} />

      <PremiumMarquee items={place?.whatsSpecial} isMobile={false} fallbackItems={["Signature Offerings", "Exclusive Moments", "Bespoke Journey"]} />
      <LocationSection place={place} />

      <CommunityFeedback />

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
