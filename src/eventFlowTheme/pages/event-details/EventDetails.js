import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from "react";
import { Link, useLocation, useHistory } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate } from "framer-motion";
import { ArrowDown, ArrowRight, MapPin, Phone, Globe, Check, Zap, ChevronDown, Moon, Sun, Plus, Minus, Calendar, Clock, Users, ChevronLeft, ChevronRight, Share2, Sparkles, ShieldCheck, Mail, Star } from "lucide-react";
import { X, Plus as PlusIcon } from "lucide-react";
import { BookingSystem } from "../../../components/JUI/BookingSystem";
import { Footer } from "../../../components/JUI/Footer";
import { getEventDetails, getEventAddons, getEventReviews, getHost, getHostContent } from "../../../utils/api";
import { buildExperienceUrl } from "../../../utils/experienceUrl";
import { useTheme } from "../../../components/JUI/Theme";
import Loader from "../../../components/Loader";
import RelatedListingsStrip from "../../../components/RelatedListingsStrip";
import { lockBodyScroll } from "../../../utils/scrollLock";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  return url;
};

const formatHostName = (hostPayload) => {
  const host = hostPayload?.host || hostPayload;
  const fullName = [host?.firstName, host?.lastName].filter(Boolean).join(" ").trim();
  return host?.displayName || host?.name || fullName || host?.businessName || "";
};

const getHostListingTitle = (listing) => (
  listing?.title || listing?.name || listing?.propertyName || listing?.menuName || listing?.placeName || "Listing"
);

const getHostListingUrl = (listing) => {
  const interest = String(listing?.businessInterestCode || listing?.businessInterest || listing?.type || "").toUpperCase();
  const eventId = listing?.eventId ?? listing?.event_id;
  const stayId = listing?.stayId ?? listing?.stay_id;
  const foodId = listing?.foodMenuId ?? listing?.foodId ?? listing?.menuId;
  const placeId = listing?.placeId;
  const listingId = listing?.listingId ?? listing?.listing_id ?? listing?.id ?? listing?._id;

  if (eventId != null || interest === "EVENT") return `/event-details?id=${eventId ?? listingId}`;
  if (stayId != null || interest === "STAY") return `/stay-details?id=${stayId ?? listingId}`;
  if (foodId != null || interest === "FOOD") return `/food-details?id=${foodId ?? listingId}`;
  if (placeId != null || interest === "PLACE") return `/place-details?id=${placeId ?? listingId}`;

  return buildExperienceUrl(getHostListingTitle(listing), listingId);
};

/* ─── THEME WRAPPER ─────────── */
function ScopedThemeProvider({ children }) {
  const { tokens: { BG, FG } } = useTheme();
  return (
    <div className="event-details-premium" style={{ minHeight: "100vh", background: BG, color: FG }}>
      {children}
    </div>
  );
}

/* ─── MODAL IMAGE POPUP ────────────────────────── */
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

const E = [0.22, 1, 0.36, 1];

/* ─── STYLES ─────────────────────────────────────── */
const ScopedStyles = () => (
  <style>{`
    .event-details-premium {
      font-family: 'DM Sans', sans-serif;
      overflow-x: hidden;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    @keyframes spin-badge { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes live-pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.8); opacity: 0; } }
    .event-details-premium .live-pulse { animation: live-pulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite; }
    
    .event-details-premium .font-display { font-family: 'Poppins', sans-serif; }
    .event-details-premium .font-mono { font-family: 'Courier New', Courier, monospace; }
    .event-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .event-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    .event-details-premium .float-anim { animation: float 6s ease-in-out infinite; }
    .event-details-premium .shimmer-cta {
      background: linear-gradient(90deg, var(--A) 0%, var(--AH) 40%, var(--A) 60%, var(--A) 100%);
      background-size: 200% 100%;
      animation: shimmer 2.5s linear infinite;
      color: var(--W);
      font-weight: 700;
      border: none;
      box-shadow: 0 4px 15px -5px var(--AL);
    }
    .event-details-premium .spin { animation: spin-badge 18s linear infinite; }
    .event-details-premium .hero-tag-pill:hover {
      background-color: var(--A) !important;
      border-color: var(--A) !important;
      color: var(--W) !important;
      z-index: 2;
    }
    @media (min-width: 769px) {
      .event-details-premium .event-hero-share {
        position: absolute !important;
        top: 96px !important;
        right: 60px !important;
        z-index: 10002 !important;
        pointer-events: auto !important;
        isolation: isolate;
      }
    }
    .event-details-premium .host-presented-label {
      color: #0097B2 !important;
      -webkit-text-fill-color: #0097B2 !important;
    }

    @keyframes spin-ring { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes counter-spin-ring { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
    .rotating-ring { animation: spin-ring 60s linear infinite; }
    .counter-rotating-card { animation: counter-spin-ring 60s linear infinite; }
    .image-ring-container:hover .rotating-ring,
    .image-ring-container:hover .counter-rotating-card {
      animation-play-state: paused !important;
    }


    
    .gallery-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; align-items: start; height: 850px; overflow: hidden; border-radius: 40px; }
    .artist-row { display: grid; grid-template-columns: 80px 1fr 240px; gap: 12px; padding: 12px 24px 12px 0; border-bottom: 1px solid var(--B); align-items: center; cursor: default; transition: padding 0.3s, background 0.3s; }
    .artist-image-tile { width: 240px; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden; background: var(--S); border: 1px solid var(--B); transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
    .artist-image-tile img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(0.3); transition: filter 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1); }
    .artist-row:hover .artist-image-tile img { filter: grayscale(0); transform: scale(1.05); }
    
    .hero-ring-wrapper {
      position: absolute;
      top: 45%;
      right: -80px;
      transform: translateY(-50%);
      z-index: 2;
    }

    @media(max-width:1024px){
      .gallery-grid{flex-wrap: wrap; justify-content: center !important;}
    }
    @media(max-width:768px){
      /* Base Mobile Viewport Enforcement */
      .event-details-premium {
        width: 100vw !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        overflow-x: hidden !important;
      }
      .event-details-premium *, .event-details-premium *::before, .event-details-premium *::after {
        box-sizing: border-box !important;
      }
      .event-details-premium section:not(.hero-section-wrapper) {
        padding: clamp(50px, 12vw, 100px) clamp(16px, 4vw, 36px) !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
      }

      /* Layout & Grid Overrides */
      .event-details-premium .desk-only{display:none!important}
      .event-details-premium .grid-2, .event-details-premium .grid-3 {
        grid-template-columns: 1fr !important;
        gap: 32px !important;
      }
      .event-details-premium .grid-3-2 {
        grid-template-columns: 1fr !important;
        gap: 32px !important;
      }
      .event-details-premium .grid-3-2 > div > div {
        padding: clamp(20px, 5vw, 52px) !important;
        min-height: auto !important;
      }

      /* Fluid Typography */
      .event-details-premium .font-display, .event-details-premium h1, .event-details-premium h3 {
        max-width: 100% !important;
        word-break: break-word !important;
        white-space: normal !important;
      }

      /* Gallery Section Optimization */
      .gallery-grid {
        height: 500px !important;
        gap: 12px !important;
        overflow: hidden !important;
        display: flex !important;
        flex-wrap: nowrap !important;
        justify-content: center !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .gallery-grid > div {
        width: calc(50% - 6px) !important;
        flex-shrink: 1 !important;
      }
      .gallery-grid > div:nth-child(n+3) {
        display: none !important;
      }

      /* Artists Row Optimization */
      .artist-row{grid-template-columns:60px 1fr!important}
      .artist-row>:nth-child(3),.artist-row>:nth-child(4){display:none!important}

      /* Tickets / Booking Card Mobile Spacing */
      #tickets > div > div:first-of-type {
        padding: clamp(16px, 5vw, 40px) !important;
        gap: 24px !important;
      }
      #tickets > div > div:first-of-type > div {
        gap: 20px !important;
      }
      #tickets .grid-2 > div {
        padding: clamp(20px, 5vw, 44px) !important;
      }
      #tickets div[style*="gap: 64"] {
        gap: 16px !important;
        flex-wrap: wrap !important;
      }
      #tickets div[style*="gap: 64"] > div {
        min-width: 120px !important;
        flex: 1 1 auto !important;
      }

      /* Premium Event Hero Mobile Optimizations (Strictly Unmodified) */
      .hero-section-wrapper {
        min-height: auto !important;
        height: auto !important;
        padding-bottom: 280px !important;
      }
      .hero-ring-wrapper {
        position: absolute !important;
        bottom: -100px !important;
        right: -130px !important;
        top: auto !important;
        transform: scale(clamp(0.45, 55vw / 100, 0.65)) !important;
        transform-origin: bottom right !important;
        display: block !important;
        z-index: 1 !important;
        pointer-events: none !important;
      }
    }
  `}</style>
);

/* ─── UTILS ──────────────────────────────────────── */
const stripPinAndCountry = (str) => {
  if (!str || typeof str !== "string") return "";
  let clean = str.replace(/,\s*India/gi, "").replace(/\bIndia\b/gi, "");
  clean = clean.replace(/\b\d{6}\b/g, "").replace(/\b\d{3}\s*\d{3}\b/g, "");
  clean = clean.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
  clean = clean.replace(/^,|,$/g, "").trim();
  return clean;
};

const formatTime12h = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return timeStr;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return timeStr;

  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
};


function ProgressBar() {
  const { tokens: { A } } = useTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: A, zIndex: 9996 }} />
  );
}

function HeroShareFab({ title, text, url, style = {} }) {
  const [copied, setCopied] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { theme, tokens: { A, FG } } = useTheme();
  const glow = A || "#0097B2";
  const isDark = theme === "dark";
  const surface = isDark ? "rgba(8,8,8,0.72)" : "rgba(255,255,255,0.92)";
  const surfaceHover = isDark ? "rgba(0,151,178,0.22)" : "rgba(0,151,178,0.12)";
  const textColor = isDark ? FG : A;
  const borderColor = hovered ? glow : (isDark ? `${glow}66` : `${glow}4D`);
  const shadow = hovered
    ? isDark
      ? `0 0 20px ${glow}55, 0 0 50px ${glow}20, 0 8px 28px rgba(0,0,0,0.5)`
      : `0 0 18px ${glow}33, 0 8px 28px rgba(15,15,15,0.14)`
    : isDark
      ? `0 0 10px ${glow}30, 0 4px 14px rgba(0,0,0,0.34)`
      : "0 6px 18px rgba(15,15,15,0.12)";

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    setRipple(true);
    setTimeout(() => setRipple(false), 700);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch (_) { }
  };

  return (
    <motion.button
      type="button"
      aria-label={`Share: ${title || "this event"}`}
      className="premium-share-fab"
      onClick={handleShare}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.85, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.86 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: 44,
        maxWidth: hovered ? 200 : 44,
        overflow: "hidden",
        paddingLeft: 13,
        paddingRight: hovered ? 18 : 13,
        background: hovered ? surfaceHover : surface,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1.5px solid ${borderColor}`,
        borderRadius: 50,
        cursor: "pointer",
        color: textColor,
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        boxShadow: shadow,
        outline: "none",
        userSelect: "none",
        transition: "max-width 0.45s cubic-bezier(0.22,1,0.36,1), padding-right 0.45s cubic-bezier(0.22,1,0.36,1), background 0.35s ease, color 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease",
        ...style
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
        {copied ? "Copied!" : "Share Event"}
      </span>
    </motion.button>
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

function Count({ to, suffix = "" }) {
  const r = useRef(null);
  const v = useInView(r, { once: true });
  useEffect(() => {
    if (!v || !r.current) return;
    const c = animate(0, to, { duration: 2, ease: "easeOut", onUpdate: n => { if (r.current) r.current.textContent = Math.round(n) + suffix } });
    return () => c.stop();
  }, [v, to, suffix]);
  return <span ref={r}>0{suffix}</span>;
}

function parseDurationMinutes(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const text = String(value).trim().toLowerCase();
  const numeric = Number(text.replace(/[^0-9.]/g, ""));
  if (/^\d+(\.\d+)?\s*(m|min|mins|minute|minutes)?$/.test(text)) {
    return Number.isFinite(numeric) ? numeric : 0;
  }

  let total = 0;
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/);
  if (hourMatch) total += Number(hourMatch[1]) * 60;
  if (minuteMatch) total += Number(minuteMatch[1]);

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!total && timeMatch) total = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);

  return Number.isFinite(total) ? total : 0;
}

function formatDurationMinutes(totalMinutes) {
  const roundedMinutes = Math.round(Number(totalMinutes) || 0);
  if (roundedMinutes <= 0) return "To be announced";

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours}hr`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  return parts.join(" ");
}

function SpinBadge({ event }) {
  const { tokens: { A, FG, M }, theme } = useTheme();
  const ticketTypes = Array.isArray(event?.ticketTypes) ? event.ticketTypes : [];
  const guestCount = ticketTypes.reduce((sum, ticket) => {
    const totalTickets = Number(ticket?.totalTickets ?? ticket?.totalTicket ?? 0);
    return sum + (Number.isFinite(totalTickets) ? totalTickets : 0);
  }, 0);
  const participantCount = event?.participantCount ?? (guestCount > 0 ? guestCount : 0);
  
  return (
    <div style={{ 
      position: "relative", 
      width: 140, 
      height: 140, 
      borderRadius: "50%", 
      background: theme === "dark" ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)", 
      border: `2px solid ${A}33`,
      boxShadow: "0 10px 30px rgba(0,0,0,0.15), inset 0 0 20px rgba(0,151,178,0.1)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <motion.div 
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }} 
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
        style={{ 
          position: "absolute", 
          inset: -6, 
          borderRadius: "50%", 
          border: `1.5px solid ${A}20`,
          pointerEvents: "none"
        }} 
      />
      <span className="font-display" style={{ fontSize: "28px", fontWeight: 800, color: A, lineHeight: 1 }}>
        {participantCount}
      </span>
      <span style={{ fontSize: "8px", letterSpacing: "0.15em", fontWeight: 700, color: FG, marginTop: 4, textTransform: "uppercase" }}>
        Participants
      </span>
      <span style={{ fontSize: "7px", letterSpacing: "0.08em", fontWeight: 600, color: M, marginTop: 2, textTransform: "uppercase" }}>
        Attending
      </span>
    </div>
  );
}



function ImageRing({ event }) {
  const { tokens: { B } } = useTheme();

  // Use actual event media for the ring
  const media = Array.isArray(event?.media) ? event.media : [];
  const ringImages = media.length > 0
    ? [...media].slice(0, 6).map(m => m.url)
    : ["abstract", "art", "concert", "crowd", "dancer", "venue"];

  const R = 150;
  return (
    <div className="image-ring-container" style={{ position: "relative", width: 440, height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="rotating-ring" style={{ position: "absolute", width: "100%", height: "100%" }}>
        {ringImages.map((src, i) => {
          const ang = (i / ringImages.length) * Math.PI * 2;
          const x = (Math.cos(ang) * R).toFixed(3);
          const y = (Math.sin(ang) * R).toFixed(3);

          // If we are using placeholders, construct the URL
          const finalSrc = src.startsWith('http') ? src : `https://picsum.photos/seed/${src}/200/300`;

          return (
            <div 
              key={i} 
              style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, zIndex: 5 }}
            >
              <div className="counter-rotating-card">
                <motion.div 
                  whileHover={{ scale: 1.6, zIndex: 100 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ width: 84, height: 110, borderRadius: 16, border: `1px solid ${B}`, overflow: "hidden", backgroundColor: "#000", boxShadow: "0 12px 40px -10px rgba(0,0,0,0.3)", cursor: "pointer" }}
                >
                  <img src={finalSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", width: 140, height: 140 }}>
        <SpinBadge event={event} />
      </div>
    </div>
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
          <span key={i} className={size !== "sm" ? "font-display" : ""} style={{ fontSize: fs, fontWeight: size !== "sm" ? 700 : 500, color: col, whiteSpace: "nowrap", letterSpacing: size === "sm" ? "0.28em" : "-0.01em", paddingRight: size === "sm" ? 32 : 56 }}>
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
    <Rev style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.35em", fontWeight: 600, textTransform: "uppercase", color: A, whiteSpace: "nowrap" }}>{idx ? `${idx} — ` : ""}{label}</span>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} style={{ flex: 1, height: 1, background: B, transformOrigin: "left" }} />
    </Rev>
  );
}

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
    <div style={{ display: "grid", height: 20, alignItems: "center", overflow: "hidden" }}>
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            gridArea: "1 / 1",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#FFFFFF",
            fontWeight: 700,
            whiteSpace: "nowrap",
            display: "block"
          }}
        >
          <span style={{ opacity: 0.7 }}>Book</span>{" "}
          <span style={{ color: "#38BDF8", fontWeight: 800 }}>
            {discounts[index].daysInAdvance} Days
          </span>{" "}
          <span style={{ opacity: 0.7 }}>Advance:</span>{" "}
          <span style={{ color: "#4ADE80", fontWeight: 800 }}>
            {discounts[index].percentage}% OFF
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const HighlightCard = ({ children, A, B, FG, M, W, theme }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -6, scale: 1.02, boxShadow: theme === "dark" ? `0 20px 40px -15px ${A}30` : `0 20px 40px -15px rgba(15, 23, 42, 0.12)` }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ 
        background: hovered
          ? (theme === "dark" ? "rgba(255,255,255,0.06)" : "#FFFFFF")
          : (theme === "dark" ? "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 100%)" : "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.9) 100%)"), 
        border: `1px solid ${hovered ? A : B}`, 
        borderRadius: "24px", 
        padding: "24px 28px", 
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        gap: 20,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.3s, background-color 0.3s, box-shadow 0.3s"
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", background: `linear-gradient(90deg, ${A}55, ${hovered ? A : A + "aa"})`, transition: "all 0.3s" }} />
      {children(hovered)}
    </motion.div>
  );
};

const SpecCard = ({ label, value, sub, index, A, B, FG, M, W, theme, isCount }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4, boxShadow: `0 10px 25px rgba(0, 0, 0, 0.02)` }}
      style={{
        border: `1px solid ${hovered ? A : B}`,
        borderRadius: "20px",
        height: "128px",
        boxSizing: "border-box",
        backgroundColor: hovered
          ? (theme === "dark" ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF")
          : W,
        transition: "all 0.3s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "16px",
        overflow: "hidden"
      }}
    >
      <p style={{
        fontSize: "15px",
        fontWeight: 700,
        color: hovered ? A : FG,
        marginBottom: 4,
        fontFamily: "Poppins, sans-serif",
        transition: "color 0.3s",
        margin: "0 0 4px 0"
      }}>
        {isCount ? <Count to={value} /> : value}
      </p>
      <p style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: M,
        margin: 0,
        fontWeight: 600,
        transition: "color 0.3s"
      }}>
        {label}
      </p>
      {sub && (
        <p style={{
          fontSize: "9px",
          color: M,
          marginTop: 4,
          marginBottom: 0,
          fontWeight: 500,
          opacity: 0.8
        }}>
          {sub}
        </p>
      )}
    </motion.div>
  );
};

/* ─── SECTIONS ───────────────────────────────────── */
function Hero({ event }) {
  const { theme, tokens: { A, W, M, FG, B, S, AL } } = useTheme();
  const history = useHistory();
  const title = event?.title || "SOLSTICE";
  const date = event?.startDate ? event.startDate.split('-').reverse().join('.') : "21.06.26";
  const venueStr = event?.venueFullAddress || "Mumbai";
  const getVenueParts = () => {
    let cleanStr = stripPinAndCountry(venueStr);
    const parts = cleanStr.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length <= 1) return { main: cleanStr, sub: "Kerala" };
    return {
      main: parts[0],
      sub: parts.slice(1).join(', ')
    };
  };
  const { main: venueMain, sub: venueSub } = getVenueParts();
  const getCategoryDisplayName = (category, fallbackName) => {
    let name = "";
    if (category && typeof category === "object") {
      name = category.displayName || category.display_name || category.name || "";
    } else {
      name = category || fallbackName || "";
    }
    if (name === "Others") {
      return event?.categoryOtherDescription && event.categoryOtherDescription.trim() !== ""
        ? event.categoryOtherDescription
        : "Others";
    }
    return name;
  };
  const titlePart1 = title;
  const splitTitle = (str) => {
    if (str.includes("SOLSTICE")) return ["SOL", "STICE"];
    const words = str.split(" ");
    if (words.length === 1) {
      const half = Math.ceil(str.length / 2);
      return [str.slice(0, half), str.slice(half)];
    }
    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
  };
  const [titlePart1_dummy, titlePart2_dummy] = splitTitle(title);
  const heroTags = [
    getCategoryDisplayName(event?.primaryCategory, event?.primaryCategoryName || event?.category),
    getCategoryDisplayName(event?.subCategory, event?.subCategoryName),
  ].map((tag) => String(tag || "").trim()).filter(Boolean);

  const ticketTypes = Array.isArray(event?.ticketTypes) ? event.ticketTypes : [];
  const slots = event?.slots || event?.eventSlots || event?.timeSlots || ticketTypes.flatMap(ticket => (
    ticket?.applicableSlots || ticket?.slots || ticket?.eventSlots || []
  ));
  const totalSlotDuration = Array.isArray(slots)
    ? slots.reduce((sum, slot) => {
      const durationValue = slot?.duration ?? slot?.durationMinutes ?? slot?.durationInMinutes ?? slot?.duration_minutes ?? slot?.schedule?.duration;
      return sum + parseDurationMinutes(durationValue);
    }, 0)
    : 0;
  const durationStr = formatDurationMinutes(totalSlotDuration);

  // Helper function to format time
  const displayTime = slots[0]?.startTime ? slots[0].startTime : (event?.startTime || "4:00 PM");

  const getParsedDateParts = () => {
    if (!event?.startDate) return { day: "21", month: "JUN" };
    try {
      const d = new Date(event.startDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      return { day, month };
    } catch (err) {
      return { day: "08", month: "JUN" };
    }
  };
  const { day: dateDay, month: dateMonth } = getParsedDateParts();

  return (
    <section className="hero-section" style={{
      position: "relative",
      minHeight: "520px",
      width: "calc(100% - 80px)",
      maxWidth: "1600px",
      margin: "12px auto 0",
      borderRadius: "32px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      zIndex: 50,
      background: W,
      boxShadow: "0 10px 40px rgba(0,0,0,0.03)"
    }}>
      {/* Background Orbs & Grid */}
      <motion.div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "-15%", left: "30%", width: 900, height: 900, borderRadius: "50%", background: `radial-gradient(circle, ${A}15 0%, transparent 60%)` }} />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }} style={{ position: "absolute", bottom: "-10%", right: "10%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${A}10 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}06 1px, transparent 1px), linear-gradient(90deg, ${A}06 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${W} 100%)` }} />
      </motion.div>

      {/* Controls: Back & Share */}
      <button
        type="button"
        className="premium-back-button"
        onClick={() => history.goBack()}
        aria-label="Go back"
      >
        <ChevronLeft size={20} />
      </button>
      {/* Early Bird Ticker (Top Right Corner) */}
      {event?.earlyBirdDiscounts?.some(d => d.isActive) && (
        <div style={{
          position: "absolute",
          top: 32,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "10px 20px",
          borderRadius: "100px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
          color: "#FFFFFF",
          zIndex: 200
        }}>
          <Sparkles size={14} color="#F59E0B" fill="#F59E0B" style={{ flexShrink: 0 }} />
          <EarlyBirdTicker discounts={event.earlyBirdDiscounts.filter(d => d.isActive).sort((a, b) => b.percentage - a.percentage)} A={A} FG={FG} isDark={theme === "dark"} />
        </div>
      )}

      {/* Share Button (Bottom Right Corner) */}
      <div style={{
        position: "absolute",
        bottom: 32,
        right: 40,
        zIndex: 200
      }}>
        <HeroShareFab
          title={title}
          text={`Check out ${title} on Little Known Planet`}
          url={window.location.href}
          style={{
            position: "relative",
            top: "auto",
            right: "auto",
            margin: 0,
            zIndex: 200
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", padding: "32px 40px" }}>
        
        {/* Asymmetric Split Layout Container */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 64, alignItems: "center" }} className="grid-2">
          
          {/* Left Column: General Info & Redesigned Card Details */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            

            {/* Event Name Heading */}
            <div style={{ overflow: "hidden", marginBottom: 12 }}>
              <motion.h1 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                transition={{ duration: 1, ease: E }} 
                className="font-display" 
                style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, lineHeight: 1.1, color: FG, margin: 0, letterSpacing: "-0.02em" }}
              >
                {title}
              </motion.h1>
            </div>


            {/* REDESIGNED: Premium Editorial Highlights Panel (When & Where Split Cards) */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              width: "100%",
              marginBottom: 40
            }} className="grid-2">
              {/* WHEN Card */}
              <HighlightCard A={A} B={B} FG={FG} M={M} W={W} theme={theme}>
                {(hovered) => (
                  <>
                    {/* Custom Designer Calendar Slip Badge */}
                    <div style={{ 
                      background: theme === "dark" ? "rgba(15, 23, 42, 0.7)" : "#FFFFFF", 
                      borderRadius: "16px", 
                      width: "58px", 
                      height: "62px", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      overflow: "hidden", 
                      boxShadow: hovered ? `0 8px 25px ${A}30` : `0 8px 20px ${A}15`,
                      border: `1px solid ${hovered ? A : B}`,
                      flexShrink: 0,
                      transition: "all 0.3s"
                    }}>
                      <span style={{ 
                        fontSize: "8px", 
                        fontWeight: 900, 
                        background: hovered ? `linear-gradient(90deg, ${A}, ${A})` : `linear-gradient(90deg, ${A}dd, ${A})`, 
                        color: W,
                        width: "100%", 
                        textAlign: "center", 
                        padding: "5px 0 4px", 
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        transition: "all 0.3s"
                      }}>
                        {dateMonth}
                      </span>
                      <span style={{ 
                        fontSize: "22px", 
                        fontWeight: 850, 
                        lineHeight: 1.1, 
                        marginTop: 4, 
                        color: hovered ? A : FG,
                        fontFamily: "var(--font-fraunces, Georgia, serif)",
                        transition: "color 0.3s"
                      }}>
                        {dateDay}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800, color: A }}>WHEN</span>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: hovered ? A : FG, display: "flex", alignItems: "center", gap: 6, letterSpacing: "-0.01em", transition: "color 0.3s" }}>
                        {displayTime}
                      </span>
                      <span style={{ fontSize: "11px", color: M, fontWeight: 555 }}>
                        {date}
                      </span>
                    </div>
                  </>
                )}
              </HighlightCard>

              {/* WHERE Card */}
              <HighlightCard A={A} B={B} FG={FG} M={M} W={W} theme={theme}>
                {(hovered) => (
                  <>
                    {/* Location Icon Container */}
                    <div style={{ 
                      background: hovered ? `${A}24` : `${A}12`, 
                      color: A, 
                      borderRadius: "16px", 
                      width: "58px", 
                      height: "62px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      border: hovered ? `1.5px solid ${A}48` : `1.5px solid ${A}24`,
                      boxShadow: hovered ? `0 8px 25px ${A}15` : `0 8px 20px ${A}08`,
                      flexShrink: 0,
                      transition: "all 0.3s"
                    }}>
                      <MapPin size={24} strokeWidth={2.2} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800, color: A }}>WHERE</span>
                      <span style={{ 
                        fontSize: "16px", 
                        fontWeight: 800, 
                        color: hovered ? A : FG, 
                        whiteSpace: "nowrap", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        letterSpacing: "-0.01em",
                        transition: "color 0.3s"
                      }} title={venueMain}>
                        {venueMain}
                      </span>
                      <span style={{ fontSize: "11px", color: M, lineHeight: 1.4, fontWeight: 555, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {venueSub}
                      </span>
                    </div>
                  </>
                )}
              </HighlightCard>
            </div>

          </div>

          {/* Right Column: Visual Component Ring + Live Attendee Widget */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {/* Soft Glow Ambient Backdrop */}
            <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: `${A}10`, filter: "blur(50px)", zIndex: 0 }} />
            
            <div style={{ position: "relative", zIndex: 1 }} className="float-anim">
              <ImageRing event={event} />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

function About({ event }) {
  const { theme, tokens: { A, BG, FG, M, W, B, S } } = useTheme();

  const desc = event?.description || "SOLSTICE is not merely an event — it is a threshold. A gathering of the most luminous minds in music, art, and culture, converging for a single evening at the intersection of the timeless and the radically new.";

  // Dynamic stats using labels and sub-labels from the reference design
  // Tags section - prioritize backend tags or use reference defaults
  const tags = Array.isArray(event?.tags) ? event.tags :
    typeof event?.tags === 'string' ? event.tags.split(',').map(t => t.trim()) :
      ["Experience", "Premium", "Event"];
  const mqItems = tags.map(tag => String(tag || "").trim()).filter(Boolean);

  const ticketTypes = Array.isArray(event?.ticketTypes) ? event.ticketTypes : [];
  const guestCount = ticketTypes.reduce((sum, ticket) => {
    const totalTickets = Number(ticket?.totalTickets ?? ticket?.totalTicket ?? 0);
    return sum + (Number.isFinite(totalTickets) ? totalTickets : 0);
  }, 0);
  const slots = event?.slots || event?.eventSlots || event?.timeSlots || ticketTypes.flatMap(ticket => (
    ticket?.applicableSlots || ticket?.slots || ticket?.eventSlots || []
  ));
  const totalSlotDuration = Array.isArray(slots)
    ? slots.reduce((sum, slot) => {
      const durationValue = slot?.duration ?? slot?.durationMinutes ?? slot?.durationInMinutes ?? slot?.duration_minutes ?? slot?.schedule?.duration;
      return sum + parseDurationMinutes(durationValue);
    }, 0)
    : 0;
  const getEventTypeName = () => {
    const rawType = event?.eventType || event?.category || "Event";
    if (rawType === "Others") {
      return event?.categoryOtherDescription && event.categoryOtherDescription.trim() !== ""
        ? event.categoryOtherDescription
        : "Others";
    }
    return rawType;
  };
  const eventType = getEventTypeName();
  const duration = formatDurationMinutes(totalSlotDuration);
  const ageLimit = event?.minimumAge != null ? `${event.minimumAge}+` : (event?.ageLimit || "All ages");

  const categoryName = event?.primaryCategoryName || event?.category || "Festival";
  const statsList = [
    { value: eventType, l: "Event Type", sub: "Program format" },
    { value: ageLimit, l: "Age Limit", sub: "Entry guidance" },
    { value: guestCount, l: "Guest Count", sub: "Total ticket capacity", isCount: true },
    { value: categoryName, l: "Category", sub: "Genre & theme" },
  ];

  return (
    <>
      <section id="about" style={{ background: BG, padding: "32px 80px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 72, alignItems: "start" }} className="grid-2">
            <div style={{ borderLeft: `3px solid ${A}44`, paddingLeft: 32, position: "relative" }}>
              <div style={{ position: "absolute", left: -3, top: 0, width: 3, height: 40, background: A }} />
              <Chars text="Where the ancient" cls="font-display" style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.1, color: FG, overflow: "hidden" }} />
              <Chars text="meets the avant-garde." cls="font-display" delay={0.12} style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.1, color: A, fontStyle: "italic", overflow: "hidden" }} />
              <Rev delay={0.25}>
                <p style={{ color: M, fontSize: 15, lineHeight: 1.7, marginTop: 24, marginBottom: 36, fontWeight: 400 }}>{desc}</p>

                {/* Tags Section */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {tags.map((t, i) => (
                    <motion.span key={t} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      whileHover={{ color: "#FFF", backgroundColor: A, borderColor: A, scale: 1.05 }}
                      style={{ fontSize: 10, fontWeight: 600, color: M, backgroundColor: W, border: `1px solid ${B}`, borderRadius: "100px", padding: "6px 16px", cursor: "default", transition: "all 0.2s" }}>
                      {t}
                    </motion.span>
                  ))}
                </div>
              </Rev>
            </div>
            <Rev delay={0.2}>
              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                {statsList.map((s, i) => (
                  <SpecCard
                    key={s.l}
                    label={s.l}
                    value={s.value}
                    sub={s.sub}
                    index={i}
                    A={A}
                    B={B}
                    FG={FG}
                    M={M}
                    W={W}
                    theme={theme}
                    isCount={s.isCount}
                  />
                ))}
              </div>
            </Rev>
          </div>
        </div>
      </section>
      {(() => {
        const rawTags = mqItems.length > 0 ? mqItems : ["Experience", "Premium", "Event", "Curated", "Editorial"];
        // Duplicate to ensure infinite seamless scrolling loop
        const loopedTags = [...rawTags, ...rawTags, ...rawTags, ...rawTags];

        const estimatedTagWidth = (tag) => tag.length * 9.5 + 75; // text width + margin + icon + padding
        const tagsDistance = rawTags.reduce((sum, tag) => sum + estimatedTagWidth(tag), 0) * 2; // offset 50%
        const tagsDuration = tagsDistance / 60; // constant speed of 60px/s

        return (
          <div style={{
            margin: "48px 0 0",
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
    </>
  );
}

function GalleryColumn({ images, direction, speed = 28, onImageClick }) {
  const { tokens: { B } } = useTheme();
  const items = [...images, ...images, ...images];
  return (
    <div style={{ overflow: "hidden", height: "100%", position: "relative" }}>
      <motion.div animate={{ y: direction === "up" ? ["0%", "-33.33%"] : ["-33.33%", "0%"] }} transition={{ duration: speed, ease: "linear", repeat: Infinity }} style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", paddingBottom: 16 }}>
        {items.map((img, i) => (
          <motion.div
            key={i}
            onClick={() => onImageClick && onImageClick(img.src)}
            whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
            style={{ position: "relative", overflow: "hidden", borderRadius: 28, border: `1px solid ${B}`, width: "100%", height: img.h, flexShrink: 0, cursor: "pointer", transition: "filter 0.3s ease" }}
          >
            <img src={img.src} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.9) contrast(1.1)" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)`, display: "flex", alignItems: "flex-end", padding: 24 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#FFF", fontWeight: 600 }}>{img.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function Gallery({ event }) {
  const { tokens: { BG, FG, AH, W, B, A }, theme } = useTheme();
  const [photoViewVisible, setPhotoViewVisible] = useState(false);
  const [photoViewIndex, setPhotoViewIndex] = useState(0);
  const [gridVisible, setGridVisible] = useState(false);

  const eventTitle = event?.title || "SOLSTICE Ed.01";
  const tags = Array.isArray(event?.tags) ? event.tags :
    typeof event?.tags === 'string' ? event.tags.split(',').map(t => t.trim()) :
      [];
  const galleryMqItems = [eventTitle, ...tags].map(item => String(item || "").trim()).filter(Boolean);

  // Use actual event media from backend if available
  const eventMedia = Array.isArray(event?.media) ? event.media : [];

  // Distribute media into 5 columns
  const chunkMedia = (media, columnsCount) => {
    const cols = Array.from({ length: columnsCount }, () => []);
    if (media.length === 0) return null;

    media.forEach((item, index) => {
      cols[index % columnsCount].push({
        src: item.url || item.mediaUrl || item.src,
        label: item.title || item.label || "",
        h: item.height || [420, 560, 320, 520, 380][index % 5] || 400
      });
    });
    return cols;
  };

  const dynamicCols = chunkMedia(eventMedia, 4);

  // Fallback to reference images if no media is provided
  const GALLERY_COLS = useMemo(() => dynamicCols || [
    [{ src: "https://picsum.photos/seed/a1/300/400", label: "Live", h: 420 }, { src: "https://picsum.photos/seed/a2/300/500", label: "Audience", h: 560 }, { src: "https://picsum.photos/seed/a3/300/300", label: "Art", h: 320 }],
    [{ src: "https://picsum.photos/seed/b1/300/500", label: "Painting", h: 520 }, { src: "https://picsum.photos/seed/b2/300/400", label: "Venue", h: 380 }, { src: "https://picsum.photos/seed/b3/300/400", label: "Movement", h: 400 }],
    [{ src: "https://picsum.photos/seed/c1/300/400", label: "Guests", h: 380 }, { src: "https://picsum.photos/seed/c2/300/600", label: "Sonic", h: 540 }, { src: "https://picsum.photos/seed/c3/300/400", label: "Canvas", h: 420 }],
    [{ src: "https://picsum.photos/seed/d1/300/500", label: "Heritage", h: 480 }, { src: "https://picsum.photos/seed/d2/300/400", label: "Expression", h: 420 }, { src: "https://picsum.photos/seed/d3/300/300", label: "Energy", h: 360 }],
  ], [dynamicCols]);

  const allImageUrls = useMemo(() => {
    return GALLERY_COLS.flat().map(img => img.src);
  }, [GALLERY_COLS]);

  const handleImageClick = (src) => {
    const index = allImageUrls.indexOf(src);
    setPhotoViewIndex(index !== -1 ? index : 0);
    setPhotoViewVisible(true);
  };

  return (
    <section id="gallery" style={{ backgroundColor: BG, padding: "24px 80px 32px", overflow: "hidden" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0" }}>

        <Chars text="See the Vibe" cls="font-display" style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.1, color: FG, marginBottom: 64, overflow: "hidden", letterSpacing: "-0.02em", paddingBottom: "0.15em" }} />

        <div className="gallery-grid" style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          height: 510,
          overflow: "hidden"
        }}>
          <div style={{ width: "calc((100% - 48px) / 4)", flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[0]} direction="up" speed={28} onImageClick={handleImageClick} /></div>
          <div style={{ width: "calc((100% - 48px) / 4)", flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[1]} direction="down" speed={36} onImageClick={handleImageClick} /></div>
          <div style={{ width: "calc((100% - 48px) / 4)", flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[2]} direction="up" speed={32} onImageClick={handleImageClick} /></div>
          <div style={{ width: "calc((100% - 48px) / 4)", flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[3]} direction="down" speed={40} onImageClick={handleImageClick} /></div>
        </div>
      </div>

      <AnimatePresence>
        {photoViewVisible && (
          <FullScreenImage
            src={allImageUrls[photoViewIndex]}
            items={allImageUrls}
            currentIndex={photoViewIndex}
            onNavigate={setPhotoViewIndex}
            onClose={() => setPhotoViewVisible(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Artists({ event }) {
  const { tokens: { A, AL, FG, M, B, W } } = useTheme();
  const [hov, setHov] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Use actual artists from backend if available
  const eventArtists = Array.isArray(event?.artists) ? event.artists :
    Array.isArray(event?.lineup) ? event.lineup : [];

  const ARTISTS = eventArtists.length > 0 ? eventArtists.map((a, i) => ({
    id: a.id || `artist-${i}`,
    name: a.name || a.artistName || "Guest Artist",
    origin: a.origin || a.location || "INTL",
    bio: a.bio || a.description || "Performing live at Solstice.",
    image: formatImageUrl(a.photoUrl || a.imageUrl || a.profileImage || a.avatar || a.photo || a.artistImage) || `https://picsum.photos/seed/artist-${a.name || i}/600/450`
  })) : [
    { id: 1, name: "Aroha Ngata", origin: "NZL", bio: "A pioneer of immersive soundscapes blurring the boundary between music and architecture.", tags: ["Electronic", "Ambient", "Installation"], image: "https://picsum.photos/seed/aroha/600/450" },
    { id: 2, name: "Ravi Khanna", origin: "IND", bio: "Tabla maestro meets modular synthesizer — live sets that are meditations in controlled chaos.", tags: ["Classical", "Electronic", "Tabla"], image: "https://picsum.photos/seed/ravi/600/450" },
    { id: 3, name: "Lena Solberg", origin: "NOR", bio: "Creates monumental paintings in real-time, her canvas as large as the wall behind her.", tags: ["Live Art", "Abstract", "Performance"], image: "https://picsum.photos/seed/lena/600/450" },
  ];

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <section id="artists" style={{ background: W, padding: "32px 80px", position: "relative" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <Chars text="The Artists" cls="font-display" style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, lineHeight: 1.1, color: FG, marginBottom: 72, overflow: "hidden", letterSpacing: "-0.02em", paddingBottom: "0.15em" }} />
          <div style={{ borderTop: `1px solid ${B}` }}>
            {ARTISTS.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: E }}
                onHoverStart={() => setHov(a.id)}
                onHoverEnd={() => setHov(null)}
                onMouseMove={handleMouseMove}
                whileHover={{ paddingLeft: 8, backgroundColor: AL }}
                className="artist-row"
              >
                <div>
                  <motion.p animate={{ color: hov === a.id ? A : B }} style={{ fontFamily: "monospace", fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</motion.p>
                </div>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                    <motion.h3 animate={{ color: hov === a.id ? A : FG }} className="font-display" style={{ fontSize: "clamp(1.5rem,2.8vw,2.5rem)", fontWeight: 700, lineHeight: 1 }}>{a.name}</motion.h3>
                  </div>
                  <p style={{ fontSize: 12, color: M, lineHeight: 1.65, maxWidth: 480 }}>{a.bio}</p>
                </div>
                <div className="artist-image-tile">
                  {a.image ? (
                    <img src={a.image} alt={a.name} loading="lazy" />
                  ) : (
                    <div className="font-display" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: M, fontSize: 34, fontWeight: 700 }}>
                      {a.name?.charAt(0) || "A"}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Photo Preview */}
        <AnimatePresence>
          {hov !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: mousePos.y - 120,
                left: mousePos.x + 30,
                width: 320,
                height: 180,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                border: `1px solid ${B}`,
                zIndex: 99999,
                pointerEvents: "none"
              }}
            >
              <img
                src={ARTISTS.find(a => a.id === hov)?.image}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt="Artist Preview"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}

function Venue({ event, hostName }) {
  const { tokens: { A, BG, FG, M, S, B, W } } = useTheme();
  const displayHostName = hostName || event?.host?.displayName || event?.host?.name || event?.host?.firstName || event?.organizerName;
  const tags = Array.isArray(event?.tags) ? event.tags :
    typeof event?.tags === 'string' ? event.tags.split(',').map(t => t.trim()) :
      ["Experience", "Premium", "Event"];
  const venueLat = Number(event?.venueLatitude);
  const venueLng = Number(event?.venueLongitude);
  const hasVenueCoords = Number.isFinite(venueLat) && Number.isFinite(venueLng);
  const mapQuery = hasVenueCoords ? `${venueLat},${venueLng}` : (event?.venueFullAddress || event?.venueName || "");
  const mapSrc = mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed` : "";

  const venueAddress = stripPinAndCountry(event?.venueFullAddress) || event?.venueFullAddress;
  const venueLandmark = event?.landmark || event?.venueLandmark;
  const venueDistrict = event?.district || event?.venueDistrict;
  const venueState = event?.state || event?.venueState;
  const venueCountry = event?.country || event?.venueCountry;
  const venueInstructions = event?.checkInInstructions || event?.cancellationPolicySummary || event?.venueInstructions;

  return (
    <>
      <Mq items={tags} dir="r" size="sm" bg={S} accent />
      <section id="venue" style={{ background: BG, padding: "32px 80px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "45fr 55fr", gap: 64 }} className="prep-grid">
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
                      <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{event?.venueName || "The Venue"}</span>
                    </div>
                    {mapSrc ? (
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={mapSrc}
                        allowFullScreen
                        title="Venue Location"
                      />
                    ) : (
                      <>
                        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}18 1px,transparent 1px),linear-gradient(90deg,${A}18 1px,transparent 1px)`, backgroundSize: "20px 20px" }} />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: A, borderRadius: "50%" }}>
                          <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", inset: "-6px", border: `2px solid ${A}`, borderRadius: "50%" }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Rev>
            <Rev delay={0.2} style={{ height: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 32, fontFamily: "Poppins, sans-serif" }}>Where it is</h3>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 280, margin: 0, padding: 0 }}>
                    {venueAddress && (
                      <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Address</span>
                        <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{venueAddress}</span>
                      </li>
                    )}

                    {venueLandmark && (
                      <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Landmark</span>
                        <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{venueLandmark}</span>
                      </li>
                    )}

                    {venueDistrict && (
                      <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>District</span>
                        <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{venueDistrict}</span>
                      </li>
                    )}

                    {venueState && (
                      <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>State</span>
                        <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{venueState}</span>
                      </li>
                    )}

                    {venueCountry && (
                      <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Country</span>
                        <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{venueCountry}</span>
                      </li>
                    )}

                    {venueInstructions && (
                      <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 120, flexShrink: 0, fontWeight: 600 }}>Instructions</span>
                        <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.4 }}>{venueInstructions}</span>
                      </li>
                    )}
                    {(!venueDistrict && !venueState && !venueCountry && !venueAddress && !venueLandmark) && (
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
    </>
  );
}

function PolicyItem({ req }) {
  const { tokens: { FG, A, M, AL, B, W } } = useTheme();
  const [op, setOp] = useState(false);

  const title = req.setting?.title || req.title || "Requirement";
  const description = req.setting?.description || req.description;
  const questions = req.questions || [];

  const getIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cancellation")) {
      return <Clock size={20} color={A} />;
    }
    if (lowerTitle.includes("age") || lowerTitle.includes("guest") || lowerTitle.includes("people") || lowerTitle.includes("infant") || lowerTitle.includes("id proof")) {
      return <Users size={20} color={A} />;
    }
    if (lowerTitle.includes("health") || lowerTitle.includes("safety") || lowerTitle.includes("medical") || lowerTitle.includes("dress")) {
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
        boxShadow: op ? "0 8px 30px rgba(0, 0, 0, 0.04)" : "none"
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
          userSelect: "none"
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
          transition: "background 0.3s"
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
                    const questionTitle = q.title || q.question?.title || q.question;
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

function Rules({ event }) {
  const { tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();

  const checkInInstructions = event?.checkInInstructions || event?.checkinInstructions;
  const cancellationPolicy = event?.cancellationPolicySummary || event?.cancellationPolicy || event?.cancellationPolicyText;
  
  const guestRequirements = Array.isArray(event?.guestRequirements) ? event.guestRequirements : [];

  const displayRequirements = [...guestRequirements].map(req => ({
    setting: {
      title: req.setting?.title || req.title || "Requirement",
      description: req.setting?.description || req.description
    },
    questions: req.questions || []
  }));

  if (checkInInstructions) {
    displayRequirements.push({
      setting: {
        title: "Check-in Instructions",
        description: checkInInstructions
      }
    });
  }

  if (event?.minimumAge != null && event.minimumAge !== "") {
    displayRequirements.push({
      setting: {
        title: "Minimum Age Requirement",
        description: `Minimum age for entry is ${event.minimumAge} years old.`
      }
    });
  }

  if (event?.dressCode && event.dressCode.trim() !== "") {
    displayRequirements.push({
      setting: {
        title: "Dress Code",
        description: event.dressCode.trim()
      }
    });
  }

  if (event?.idProofRequired) {
    displayRequirements.push({
      setting: {
        title: "ID Proof Required",
        description: "Valid government-issued physical ID card required for verification at check-in."
      }
    });
  }

  if (cancellationPolicy) {
    displayRequirements.push({
      setting: {
        title: "Cancellation Policy",
        description: cancellationPolicy
      }
    });
  }

  return (
    <section id="rules" style={{ background: BG, padding: "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "45fr 55fr", gap: 64, alignItems: "start" }} className="pol-grid">
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, marginBottom: 12, fontFamily: "Poppins, sans-serif" }}>
                Things to Keep in Mind
              </h3>
              <p style={{ color: M, fontSize: "15px", lineHeight: "1.8", margin: 0, fontWeight: 400 }}>
                Please review these guidelines and requirements carefully to ensure a safe, smooth, and enjoyable experience for everyone.
              </p>
            </div>
          </Rev>
          <Rev delay={0.2}>
            <div>
              {displayRequirements.length > 0 ? (
                displayRequirements.map((req, i) => (
                  <PolicyItem key={`req-${i}`} req={req} />
                ))
              ) : (
                <p style={{ color: M, fontSize: 14, padding: "40px 0" }}>No specific guidelines listed for this event.</p>
              )}
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

function HostDetails({ event, hostName }) {
  const { tokens: { A, AL, BG, FG, M, S, B, W }, theme } = useTheme();
  const history = useHistory();
  const displayHostName = hostName || event?.host?.displayName || event?.host?.name || event?.host?.firstName || event?.organizerName;
  const hostProfile = event?.hostProfile;
  const host = hostProfile?.host || hostProfile || event?.host || {};
  const hostLeadUserId =
    host?.leadUserId ||
    hostProfile?.leadUserId ||
    event?.leadUserId ||
    event?.host?.leadUserId ||
    event?.hostId;
  const hostDescription = host?.bio || host?.description || host?.about || host?.summary || event?.organizerDescription || "Curators of memorable experiences, thoughtful gatherings, and community-led moments.";
  const hostSubtitle = host?.tagline || host?.businessName || host?.companyName || host?.role || "Event host";
  const hostPhone = host?.phone || host?.phoneNumber || event?.host?.phone || event?.host?.phoneNumber || "";
  const hostEmail = host?.email || event?.host?.email || "";

  const navigateToHostProfile = () => {
    if (!hostLeadUserId) return;
    history.push(`/host-profile?id=${hostLeadUserId}`);
  };

  return (
    <section className="host-quality-section" style={{ background: W, padding: "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "4fr 6fr", gap: 64 }} className="host-quality-grid">
          
          {/* Host Profile (40%) */}
          <Rev delay={0.1} style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div 
                style={{
                  background: theme === "dark" 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)"
                    : "linear-gradient(135deg, #FFFFFF 0%, rgba(248, 250, 252, 0.9) 100%)",
                  border: `1px solid ${B}`,
                  borderRadius: "24px",
                  height: "100%",
                  minHeight: 250,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: theme === "dark"
                    ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                    : "0 20px 40px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
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
                  background: `linear-gradient(90deg, ${A} 0%, #8B5CF6 100%)`
                }} />

                {/* Top Section: Avatar, Name & Metrics (With subtle tint background) */}
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
                    {/* Profile Avatar with Custom Ring */}
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
                          src={formatImageUrl(hostProfile?.profileImageUrl || hostProfile?.host?.profileImageUrl || host?.profileImageUrl || host?.avatar || host?.host?.avatar) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayHostName)}&backgroundColor=0097B2&color=ffffff`}
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                          alt={displayHostName}
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayHostName)}&backgroundColor=0097B2&color=ffffff`; 
                          }}
                        />
                      </div>
                      {/* Floating Verified Check badge */}
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

                    {/* Name and Superhost Badge */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                      <h3
                        onClick={navigateToHostProfile}
                        style={{
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: FG,
                          margin: 0,
                          cursor: hostLeadUserId ? "pointer" : "default",
                          fontFamily: "Poppins, sans-serif",
                          letterSpacing: "-0.01em",
                          lineHeight: 1.2,
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => { if (hostLeadUserId) e.currentTarget.style.color = A; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = FG; }}
                        title={hostLeadUserId ? "View host profile" : undefined}
                      >
                        {displayHostName}
                      </h3>
                      
                      {/* Superhost Badge under the name */}
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

                  {/* Redesigned Metrics Section - Only 2 Cards */}
                  <div style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "center"
                  }}>
                    {/* Rating Pill */}
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
                        ★ {hostProfile?.statistics?.averageRating || "4.9"}
                      </span>
                      <span style={{ fontSize: "7px", color: "#B45309", textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 600, marginTop: 2 }}>Rating</span>
                    </div>

                    {/* Events Pill */}
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
                        {hostProfile?.statistics?.totalEvents || hostProfile?.listings?.length || 8}
                      </span>
                      <span style={{ fontSize: "7px", color: A, textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 600, marginTop: 2 }}>Events</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Quote-styled Bio */}
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
                    "{hostDescription}"
                  </p>
                </div>
              </div>
            </div>
          </Rev>

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
                  const displayScore = event?.lkpQualityIndex?.score || 9.2;
                  const scoreInt = Math.floor(displayScore);
                  const scoreDec = (displayScore - scoreInt).toFixed(1).replace("0.", "");

                  return (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.05))" }}>
                        <defs>
                          <linearGradient id="scoreGradEvent" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor={A} />
                          </linearGradient>
                          <filter id="glowEvent" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        <circle cx="65" cy="65" r="55" fill="none" stroke={`${A}12`} strokeWidth="3" />
                        <motion.circle
                          cx="65" cy="65" r="55" fill="none" stroke="url(#scoreGradEvent)" strokeWidth="6" strokeLinecap="round"
                          style={{ filter: "url(#glowEvent)" }}
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
                    This score is based on direct host verification, quality checks on equipment & safety, and past attendee ratings.
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

function EventReviews({ reviews = [] }) {
  const { tokens: { A, FG, M, B, W, S, BG, AL }, theme } = useTheme();
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const cardWidth = 384; // width (360) + gap (24)
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const normalizedReviews = useMemo(() => {
    if (Array.isArray(reviews)) return reviews;
    if (Array.isArray(reviews?.reviews)) return reviews.reviews;
    if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
    if (Array.isArray(reviews?.data)) return reviews.data;
    return [];
  }, [reviews]);

  const hasReviews = normalizedReviews.length > 0;
  const displayReviews = hasReviews ? normalizedReviews : [
    { customerName: "Aarav Sharma", comment: "An absolutely incredible experience. The host was warm, accommodating, and the attention to detail was unmatched.", rating: 5 },
    { customerName: "Priya Patel", comment: "Highly curated trails, breathtaking views, and wonderful local insights. Can't wait to book this again!", rating: 5 },
    { customerName: "Vikram Malhotra", comment: "Top tier service! The scheduling was seamless and the guides were exceptionally knowledgeable.", rating: 5 }
  ];

  return (
    <section className="testimonials-section" style={{ background: BG, padding: "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <h3 style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 700, color: FG, margin: 0, fontFamily: "Poppins, sans-serif" }}>
            What people say
          </h3>
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

        <div
          ref={sliderRef}
          style={{
            position: "relative",
            overflowX: "auto",
            margin: "24px -80px 0",
            padding: "20px 80px",
            display: "flex",
            gap: 24,
            scrollBehavior: "smooth",
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}
          className="no-scrollbar"
        >
          {displayReviews.map((rev, idx) => {
            const name = rev.customerName || rev.reviewerName || rev.author || "Guest";
            const rating = rev.rating || 5;
            const text = rev.comment || rev.text || rev.reviewText || "";
            const vendorResponse = rev.vendorResponse || rev.hostResponse || rev.reply || "";

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
                  <p style={{ fontSize: 13, color: FG, lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: vendorResponse ? 3 : 4, WebkitBoxOrient: "vertical", fontWeight: 400 }}>
                    &ldquo;{text}&rdquo;
                  </p>
                  {vendorResponse && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${B}`, opacity: 0.96 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                        Response from Host
                      </div>
                      <p style={{ fontSize: 12.5, color: FG, margin: 0, lineHeight: 1.6 }}>
                        {vendorResponse}
                      </p>
                    </div>
                  )}
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
      </div>
    </section>
  );
}

function EventBookingPopup({ event }) {
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const handleUpdateAddonQuantity = (addon, delta) => {
    const addonId = addon.addonId || addon.id;
    const pricingType = addon.pricingType || (addon.priceType === "per_booking" ? "Group" : "Individual");

    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => (a.addonId || a.id) === addonId);
      if (existing) {
        if (delta < 0) {
          if (existing.quantity > 1) {
            return prev.map((a) =>
              (a.addonId || a.id) === addonId
                ? { ...a, quantity: a.quantity - 1 }
                : a
            );
          } else {
            return prev.filter((a) => (a.addonId || a.id) !== addonId);
          }
        } else {
          return prev.map((a) =>
            (a.addonId || a.id) === addonId
              ? { ...a, quantity: a.quantity + 1 }
              : a
          );
        }
      } else {
        if (delta > 0) {
          if (pricingType === "Group") {
            const otherGroupItem = prev.find((a) => a.pricingType === "Group" && (a.addonId || a.id) !== addonId);
            if (otherGroupItem) {
              return [...prev.filter(a => (a.addonId || a.id) !== (otherGroupItem.addonId || otherGroupItem.id)), { ...addon, quantity: 1, pricingType }];
            }
          }
          return [...prev, { ...addon, quantity: 1, pricingType }];
        }
      }
      return prev;
    });
  };

  const ticketTypes = (Array.isArray(event?.ticketTypes) ? event.ticketTypes :
    Array.isArray(event?.ticketTiers) ? event.ticketTiers :
      Array.isArray(event?.tickets) ? event.tickets : []).map((ticket, index) => ({
        ...ticket,
        id: ticket.id ?? ticket.ticketTypeId ?? ticket.typeId ?? `ticket-${index}`,
        name: ticket.name || ticket.ticketTypeName || ticket.typeName || ticket.title || ticket.ticketName || `Ticket ${index + 1}`,
        price: ticket.price ?? ticket.ticketTypePrice ?? ticket.typePrice ?? ticket.ticketPrice ?? ticket.individualPrice ?? ticket.amount ?? ticket.basePrice ?? 0,
        totalTickets: ticket.totalTickets ?? ticket.totalTicket ?? ticket.total_tickets ?? ticket.total_ticket,
        maxPerBooking: ticket.maxPerBooking ?? ticket.max_per_booking ?? ticket.maxTicketsPerBooking ?? ticket.max_tickets_per_booking,
        groupPricingTiers: Array.isArray(ticket.groupPricingTiers) ? ticket.groupPricingTiers :
          Array.isArray(ticket.group_pricing_tiers) ? ticket.group_pricing_tiers :
            Array.isArray(ticket.groupBookingPricing) ? ticket.groupBookingPricing :
              Array.isArray(ticket.group_booking_pricing) ? ticket.group_booking_pricing : [],
        ticketSaleStartDate: ticket.ticketSaleStartDate || ticket.ticket_sale_start_date || ticket.saleStartDate || event?.ticketSaleStartDate || event?.ticket_sale_start_date || event?.saleStartDate,
        ticketSaleEndDate: ticket.ticketSaleEndDate || ticket.ticket_sale_end_date || ticket.saleEndDate || event?.ticketSaleEndDate || event?.ticket_sale_end_date || event?.saleEndDate || event?.bookingCutoffTime,
        applicableSlots: Array.isArray(ticket.applicableSlots) ? ticket.applicableSlots :
          Array.isArray(ticket.applicable_slots) ? ticket.applicable_slots :
            Array.isArray(ticket.eventSlots) ? ticket.eventSlots :
              Array.isArray(ticket.event_slots) ? ticket.event_slots :
                Array.isArray(ticket.allowedSlots) ? ticket.allowedSlots :
                  Array.isArray(ticket.allowed_slots) ? ticket.allowed_slots :
                    Array.isArray(ticket.slotIds) ? ticket.slotIds :
                      Array.isArray(ticket.slot_ids) ? ticket.slot_ids :
                        Array.isArray(ticket.slots) ? ticket.slots : []
      }));
  const firstTicket = ticketTypes[0] || {};
  const ticketPrice = firstTicket.price ?? firstTicket.amount ?? firstTicket.basePrice ?? firstTicket.b2cPrice ?? event?.ticketPrice ?? event?.price ?? 0;
  const rawSlots = event?.eventSlots || event?.slots || event?.timeSlots || ticketTypes.flatMap(ticket => ticket.applicableSlots || []);
  const timeSlots = rawSlots.length > 0 ? rawSlots.map((slot, i) => ({
    ...slot,
    id: slot.id ?? slot.slotId ?? slot.eventSlotId ?? slot.event_slot_id ?? `slot-${i}`,
    eventSlotId: slot.eventSlotId ?? slot.event_slot_id ?? slot.slotId ?? slot.slot_id ?? slot.id,
    slotName: slot.slotName || slot.name || slot.startTime || `Slot ${i + 1}`,
    startTime: slot.startTime || slot.time || slot.slotName || event?.startTime || "",
    endTime: slot.endTime || event?.endTime || "",
    pricePerPerson: slot.pricePerPerson ?? slot.price ?? ticketPrice
  })) : [{
    id: "event-default-slot",
    slotName: event?.startTime || "Event Slot",
    startTime: event?.startTime || "",
    endTime: event?.endTime || "",
    pricePerPerson: ticketPrice
  }];
  const listing = {
    ...event,
    listingId: event?.listingId || event?.id || event?.eventId,
    eventId: event?.eventId || event?.id || event?.listingId,
    title: event?.title || "Event",
    name: event?.title || "Event",
    coverPhotoUrl: event?.media?.[0]?.url || event?.coverPhotoUrl || event?.imageUrl || "",
    basePrice: ticketPrice,
    price: ticketPrice,
    b2cPrice: ticketPrice,
    ticketSaleStartDate: event?.ticketSaleStartDate || event?.ticket_sale_start_date || event?.saleStartDate,
    ticketSaleEndDate: event?.ticketSaleEndDate || event?.ticket_sale_end_date || event?.saleEndDate || event?.bookingCutoffTime,
    pricing: {
      ...(event?.pricing || {}),
      basePrice: ticketPrice
    },
    addons: Array.isArray(event?.addons) ? event.addons : (Array.isArray(event?.addOns) ? event.addOns : []),
    ticketTypes,
    eventSlots: timeSlots,
    slots: timeSlots,
    timeSlots,
    host: event?.hostProfile?.host || event?.host || {}
  };

  return <BookingSystem listing={listing} type="event" selectedAddOns={selectedAddOns} onUpdateAddonQuantity={handleUpdateAddonQuantity} triggerLabel="Reserve Ticket" reserveLabel="Reserve Ticket" />;
}

function Tickets({ event }) {
  const { tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();
  const history = useHistory();

  // Selection State
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0 });

  // Compute available dates from event data
  const availableDates = React.useMemo(() => {
    const dates = new Set();
    // Normalize dates to YYYY-MM-DD
    const norm = (d) => {
      try { return new Date(d).toISOString().split('T')[0]; } catch (e) { return null; }
    };

    // If there is a range (startDate to endDate), include all dates in between
    if (event?.startDate && event?.endDate) {
      let current = new Date(event.startDate);
      const last = new Date(event.endDate);
      // Safety break to prevent infinite loops (max 365 days)
      let count = 0;
      while (current <= last && count < 365) {
        const d = norm(current);
        if (d) dates.add(d);
        current.setDate(current.getDate() + 1);
        count++;
      }
    } else if (event?.startDate) {
      const d = norm(event.startDate);
      if (d) dates.add(d);
    }

    if (Array.isArray(event?.availability)) {
      event.availability.forEach(a => {
        const d = norm(a.date);
        if (d) dates.add(d);
      });
    }

    const eventSlots = event?.timeSlots || event?.slots || [];
    eventSlots.forEach(s => {
      const d1 = norm(s.startDate || s.date);
      if (d1) dates.add(d1);
    });

    return Array.from(dates).sort();
  }, [event?.startDate, event?.endDate, event?.availability, event?.timeSlots, event?.slots]);

  // Calendar logic
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(availableDates[0] || Date.now()));

  const calendarDays = React.useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateStr: dStr, isAvailable: availableDates.includes(dStr) });
    }
    return days;
  }, [viewDate, availableDates]);

  // Set default date if not set
  useEffect(() => {
    if (!bookingDate && availableDates.length > 0) {
      setBookingDate(availableDates[0]);
    }
  }, [availableDates, bookingDate]);

  // Use actual ticket tiers from backend if available
  const eventTiers = Array.isArray(event?.ticketTiers) ? event.ticketTiers :
    Array.isArray(event?.tickets) ? event.tickets : [];

  const slots = event?.timeSlots || event?.slots || [];

  const TIERS = eventTiers.length > 0 ? eventTiers.map((t, i) => {
    const baseP = t.price ?? t.amount ?? t.basePrice ?? t.b2cPrice ?? 0;
    const taxP = t.tax ?? t.taxAmount ?? t.tax_amount ?? t.taxes ?? 0;
    const discP = t.discount ?? t.discountAmount ?? t.discount_amount ?? 0;
    const strikeP = t.strikePrice ?? t.originalPrice ?? t.strike_price ?? null;

    return {
      id: t.id || i,
      name: t.name || t.ticketName || "Ticket",
      priceValue: baseP,
      price: typeof baseP === 'number' ? `₹${baseP.toLocaleString()}` : (baseP || "₹0"),
      strikePrice: strikeP ? (typeof strikeP === 'number' ? `₹${strikeP.toLocaleString()}` : strikeP) : null,
      desc: t.description || t.desc || t.ticketDescription || "Event Access",
      tax: taxP,
      discount: discP,
      featured: t.featured || (eventTiers.length > 1 && i === 1) || (eventTiers.length === 1)
    };
  }) : [
    { id: "general", name: "General", priceValue: 2500, price: "₹2,500", strikePrice: null, desc: "Full access to all stages and exhibitions.", tax: 0, discount: 0, featured: false },
    { id: "collector", name: "Collector", priceValue: 5500, price: "₹5,500", strikePrice: "₹7,000", desc: "Collector's Edition", tax: 0, discount: 0, featured: true },
  ];

  const handlePurchase = (tier) => {
    // Construct booking data for the checkout page
    const totalGuests = guests.adults + guests.children;
    const bookingData = {
      eventId: event?.id || "1",
      listingId: event?.id || "1",
      listingTitle: event?.title || "Event Booking",
      listingImage: event?.media?.[0]?.url || "/images/content/photo-1.1.jpg",
      pricing: {
        basePrice: tier.priceValue * totalGuests,
        tax: tier.tax * totalGuests,
        discount: tier.discount * totalGuests,
        total: (tier.priceValue + tier.tax - tier.discount) * totalGuests,
        currency: "INR",
        pricePerPerson: tier.priceValue,
        adultsCount: guests.adults,
        childrenCount: guests.children,
        guestCount: totalGuests
      },
      selectedDate: bookingDate,
      bookingSummary: {
        date: bookingDate,
        time: slots.find(s => String(s.id || s.slotId) === String(selectedSlot))?.startTime || event?.startTime || "10:00:00",
        guestCount: totalGuests,
        adults: guests.adults,
        children: guests.children
      },
      selectedTier: tier,
      selectedSlot: selectedSlot
    };

    // Save to localStorage as a fallback for the checkout component
    localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

    history.push({
      pathname: "/experience-checkout",
      state: { bookingData }
    });
  };

  const Counter = ({ label, value, onInc, onDec, min = 0 }) => (
    <div style={{ flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, color: M, marginBottom: 12, textTransform: "uppercase" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDec}
          disabled={value <= min}
          style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: W, cursor: value <= min ? "not-allowed" : "pointer", opacity: value <= min ? 0.3 : 1 }}
        >
          <Minus size={14} color={FG} />
        </motion.button>
        <span style={{ fontSize: 18, fontWeight: 700, color: FG, minWidth: 20, textAlign: "center" }}>{value}</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onInc}
          style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: W }}
        >
          <Plus size={14} color={FG} />
        </motion.button>
      </div>
    </div>
  );

  return (
    <section id="tickets" style={{ background: BG, padding: "32px 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="05" label="Booking" />


        {/* Booking Selection Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ backgroundColor: W, padding: "40px", border: `1px solid ${B}`, marginBottom: 64, display: "flex", flexDirection: "column", gap: 48 }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 64 }}>
            {/* Calendar Selector (Popup Style) */}
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Calendar size={14} color={A} />
                <p style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, color: M, textTransform: "uppercase" }}>Pick-up Date</p>
              </div>

              <div
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                  padding: "16px 20px",
                  border: `1px solid ${B}`,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: W
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 500, color: FG }}>
                  {bookingDate ? new Date(bookingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Select a date"}
                </p>
                <ChevronDown size={16} color={M} style={{ transform: showCalendar ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
              </div>

              {/* Calendar Popup */}
              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      zIndex: 100,
                      backgroundColor: W,
                      border: `1px solid ${B}`,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                      padding: 24,
                      width: 320,
                      marginTop: 8
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: FG }}>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1))); }} style={{ border: "none", background: "none", cursor: "pointer" }}><ChevronDown size={14} style={{ transform: "rotate(90deg)" }} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1))); }} style={{ border: "none", background: "none", cursor: "pointer" }}><ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} /></button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={`${d}-${i}`} style={{ fontSize: 10, fontWeight: 700, color: M, textAlign: "center", paddingBottom: 8 }}>{d}</div>
                      ))}
                      {calendarDays.map((d, i) => (
                        <div key={i} style={{ textAlign: "center" }}>
                          {d ? (
                            <button
                              disabled={!d.isAvailable}
                              onClick={(e) => { e.stopPropagation(); setBookingDate(d.dateStr); setShowCalendar(false); }}
                              style={{
                                width: "100%",
                                aspectRatio: "1/1",
                                border: "none",
                                borderRadius: "50%",
                                fontSize: 12,
                                fontWeight: 600,
                                backgroundColor: bookingDate === d.dateStr ? A : "transparent",
                                color: bookingDate === d.dateStr ? W : (d.isAvailable ? FG : `${M}30`),
                                cursor: d.isAvailable ? "pointer" : "default",
                                transition: "all 0.2s"
                              }}
                            >
                              {d.day}
                            </button>
                          ) : <div />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Slot Selector - Checkbox style buttons */}
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Clock size={14} color={A} />
                <p style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, color: M, textTransform: "uppercase" }}>Select Slot</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                {slots.length > 0 ? slots.map(s => {
                  const isSelected = String(selectedSlot) === String(s.id || s.slotId);
                  return (
                    <motion.button
                      key={s.id || s.slotId}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSlot(s.id || s.slotId)}
                      style={{
                        padding: "16px",
                        border: `1px solid ${isSelected ? A : B}`,
                        backgroundColor: isSelected ? `${A}08` : W,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.3s"
                      }}
                    >
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? A : FG }}>{formatTime12h(s.slotName || s.startTime)}</p>
                        {s.endTime && <p style={{ fontSize: 10, color: M, marginTop: 2 }}>Ends {formatTime12h(s.endTime)}</p>}
                      </div>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `1.5px solid ${isSelected ? A : B}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected ? A : "transparent"
                      }}>
                        {isSelected && <Check size={10} color={W} strokeWidth={4} />}
                      </div>
                    </motion.button>
                  );
                }) : (
                  <p style={{ fontSize: 13, color: M }}>No slots available for this date</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ height: "1px", backgroundColor: B }} />

          {/* Guest Detailer */}
          <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Users size={14} color={A} />
                <p style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 700, color: M, textTransform: "uppercase" }}>Guests</p>
              </div>
              <div style={{ display: "flex", gap: 64 }}>
                <Counter
                  label="Adults"
                  value={guests.adults}
                  onInc={() => setGuests(p => ({ ...p, adults: p.adults + 1 }))}
                  onDec={() => setGuests(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                  min={1}
                />
                <Counter
                  label="Children"
                  value={guests.children}
                  onInc={() => setGuests(p => ({ ...p, children: p.children + 1 }))}
                  onDec={() => setGuests(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(TIERS.length, 3)}, 1fr)`,
          gap: 1,
          backgroundColor: B
        }} className="grid-2">
          {TIERS.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.85, delay: 0.1 + i * 0.12, ease: E }} whileHover={{ y: -8 }} style={{ position: "relative", backgroundColor: t.featured ? AL : W, padding: 44, display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: A, fontWeight: 600, marginBottom: 14 }}>{t.name}</p>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <p className="font-display" style={{ fontSize: "clamp(2.2rem,4vw,3rem)", fontWeight: 700, color: A, lineHeight: 1 }}>{t.price}</p>
                  {t.strikePrice && (
                    <span style={{ fontSize: 16, color: M, textDecoration: "line-through", fontWeight: 500 }}>{t.strikePrice}</span>
                  )}
                </div>
                {(t.tax > 0 || t.discount > 0) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
                    {t.tax > 0 && (
                      <span style={{ fontSize: 10, color: M, background: `${B}40`, padding: "2px 8px", borderRadius: 4 }}>+ ₹{t.tax} TAX</span>
                    )}
                    {t.discount > 0 && (
                      <span style={{ fontSize: 10, color: W, background: "#e74c3c", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>- ₹{t.discount} OFF</span>
                    )}
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, color: M, lineHeight: 1.75, marginBottom: 28, flex: 1 }}>{t.desc}</p>

              <motion.button onClick={() => handlePurchase(t)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className={t.featured ? "shimmer-cta" : ""} style={{ width: "100%", padding: "14px 0", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, border: t.featured ? "none" : `1px solid ${B}`, backgroundColor: t.featured ? A : "transparent", color: t.featured ? W : FG }}>
                Purchase — {t.name}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ───────────────────────────────────────── */
export default function EventDetails() {
  const location = useLocation();
  const history = useHistory();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('id') || '3';
  const { tokens: { BG, FG } } = useTheme();

  const [event, setEvent] = useState(null);
  const [hostName, setHostName] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const primaryCategoryId = event?.primaryCategoryId || event?.primaryCategory?.id || event?.categoryId || event?.category?.id;
  const currentListingId = event?.eventId || event?.id || eventId;

  // Dynamic browser tab title
  useDocumentTitle(event?.title, "Events");

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getEventDetails(eventId);
        console.log("DEBUG: Event Details Data:", data);
        let eventAddons = [];
        try {
          eventAddons = await getEventAddons(eventId);
        } catch (addonErr) {
          console.error("Failed to load event addons:", addonErr);
        }
        let fetchedHostName = "";
        let hostProfile = null;

        if (data?.leadUserId) {
          try {
            const hostData = await getHostContent(data.leadUserId);
            fetchedHostName = formatHostName(hostData);
            hostProfile = hostData;
          } catch (hostErr) {
            console.error("Failed to load event host:", hostErr);
          }
        }

        // Fetch event-only reviews (non-blocking)
        getEventReviews(eventId).then(rev => {
          if (mounted) setReviews(rev ?? []);
        }).catch(() => {
          if (mounted) setReviews([]);
        });

        if (mounted) { setEvent({ ...data, hostProfile, addons: eventAddons }); setHostName(fetchedHostName); setError(null); }
      } catch (err) {
        if (mounted) setError("Failed to load event details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (eventId) fetchDetails();
    return () => { mounted = false; };
  }, [eventId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 text-center text-danger" style={{ minHeight: "100vh", background: BG, color: FG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {error}
      </div>
    );
  }

  return (
    <ScopedThemeProvider>
      <ScopedStyles />
      <ProgressBar />
      <Hero event={event} />
      <About event={event} />
      <Gallery event={event} />
      <Artists event={event} />
      <Venue event={event} hostName={hostName} />
      <Rules event={event} />
      <HostDetails event={event} hostName={hostName} />
      <EventReviews reviews={reviews} />
      <EventBookingPopup event={event} />
      <RelatedListingsStrip
        businessInterestId={2}
        primaryCategoryId={primaryCategoryId}
        currentListingId={currentListingId}
        title="More Events You Might Like"
      />
      <Footer />
    </ScopedThemeProvider>
  );
}

