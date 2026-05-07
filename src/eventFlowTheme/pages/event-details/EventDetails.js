import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from "react";
import { Link, useLocation, useHistory } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate } from "framer-motion";
import ProductNavbar from "../../../components/ProductNavbar";
import { ArrowDown, ArrowRight, MapPin, Phone, Globe, Check, Zap, ChevronDown, Moon, Sun, Plus, Minus, Calendar, Clock, Users, ChevronLeft } from "lucide-react";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import { X, Plus as PlusIcon } from "lucide-react";
import { BookingSystem } from "../../../components/JUI/BookingSystem";
import { Footer } from "../../../components/JUI/Footer";
import { getEventDetails, getHost, getListingReviews } from "../../../utils/api";
import { buildExperienceUrl } from "../../../utils/experienceUrl";

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
function useTheme() { return useContext(ThemeContext); }

function ScopedThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
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

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, tokens: THEMES[theme] }}>
      <div ref={wrapperRef} className="event-details-premium" style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/* ─── GRID GALLERY MODAL ────────────────────────── */
const GridGallery = ({ items, onClose, onSelect, title, A }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const target = modalRef.current;
    if (target) disableBodyScroll(target);
    return () => {
      if (target) enableBodyScroll(target);
      else enableBodyScroll(document.body);
    };
  }, []);

  return (
    <motion.div
      ref={modalRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div style={{
        padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 60px)',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'clamp(40px, 8vw, 80px)'
          }}
        >
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.8em', textTransform: 'uppercase', color: A, fontWeight: 800, marginBottom: 20 }}>Visual Anthology</p>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, color: '#141414', lineHeight: 0.9, letterSpacing: '-0.04em' }} className="font-display">
              {title}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#F4F4F4',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.3s',
              flexShrink: 0,
              marginLeft: 20
            }}
          >
            <X size={32} color="#000" />
          </motion.button>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
          gap: 'clamp(16px, 3vw, 32px)',
          gridAutoRows: 'clamp(250px, 40vh, 400px)'
        }}>
          {items.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => onSelect(i)}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#F4F4F4',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
              }}
            >
              <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: A, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlusIcon size={16} color="#FFF" />
                  </div>
                  <span style={{ color: '#FFF', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Expand View</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── MODAL IMAGE POPUP ────────────────────────── */
const FullScreenImage = ({ src, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const target = modalRef.current;
    if (target) disableBodyScroll(target);
    return () => {
      if (target) enableBodyScroll(target);
      else enableBodyScroll(document.body);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={modalRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5vh 5vw'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '1200px',
          maxHeight: '80vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'zoom-out',
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 50px 100px rgba(0,0,0,0.6)',
          background: '#000'
        }}
      >
        <img
          src={src}
          onClick={onClose}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover'
          }}
          alt="Popup"
        />
        <div style={{ position: 'absolute', bottom: 30, right: 30, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: 100, pointerEvents: 'none' }}>
           <p style={{ color: '#FFF', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Click to close</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const E = [0.22, 1, 0.36, 1];

/* ─── STYLES ─────────────────────────────────────── */
const ScopedStyles = () => (
  <style>{`
    .event-details-premium {
      font-family: var(--font-inter, system-ui, sans-serif);
      overflow-x: hidden;
      cursor: none;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    .event-details-premium a, .event-details-premium button { cursor: none; }
    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    @keyframes spin-badge { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    
    .event-details-premium .font-display { font-family: var(--font-fraunces, Georgia, serif); }
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
    .event-details-premium .host-presented-label {
      color: #0097B2 !important;
      -webkit-text-fill-color: #0097B2 !important;
    }
    .event-details-premium .venue-map-frame {
      filter: grayscale(1) contrast(1.05);
      transition: filter 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .event-details-premium .venue-map-wrap:hover .venue-map-frame {
      filter: grayscale(0) contrast(1);
    }
    
    #cur-dot { position: fixed; width: 6px; height: 6px; background: var(--A); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%, -50%); transition: background 0.3s; }
    #cur-ring { position: fixed; width: 38px; height: 38px; border: 1.5px solid var(--AL); border-radius: 50%; pointer-events: none; z-index: 99998; transform: translate(-50%, -50%); transition: width 0.3s, height 0.3s, border-color 0.3s; }
    
    .gallery-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; align-items: start; height: 850px; overflow: hidden; border-radius: 40px; }
    .artist-row { display: grid; grid-template-columns: 80px 1fr 150px 90px; gap: 24px; padding: 26px 0; border-bottom: 1px solid var(--B); align-items: center; cursor: default; transition: padding 0.3s, background 0.3s; }
    .artist-image-tile { width: 150px; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: var(--S); border: 1px solid var(--B); }
    .artist-image-tile img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(1); transition: filter 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1); }
    .artist-row:hover .artist-image-tile img { filter: grayscale(0); transform: scale(1.04); }
    
    @media(max-width:1024px){
      .gallery-grid{flex-wrap: wrap; justify-content: center !important;}
    }
    @media(max-width:768px){
      .event-details-premium .desk-only{display:none!important}
      .event-details-premium .grid-2, .event-details-premium .grid-3{grid-template-columns:1fr!important}
      .event-details-premium .grid-3-2{grid-template-columns:1fr!important}
      .gallery-grid{height:600px!important}
      .artist-row{grid-template-columns:60px 1fr!important}
      .artist-row>:nth-child(3),.artist-row>:nth-child(4){display:none!important}
    }
  `}</style>
);

/* ─── UTILS ──────────────────────────────────────── */
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
function Cursor() {
  const { tokens: { A, AL } } = useTheme();
  const x = useMotionValue(-200), y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });
  useEffect(() => {
    const fn = (e) => { x.set(e.clientX); y.set(e.clientY) };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);
  return (
    <>
      <motion.div id="cur-dot" style={{ left: x, top: y, background: A }} />
      <motion.div id="cur-ring" style={{ left: sx, top: sy, borderColor: AL }} />
    </>
  );
}

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
  const { tokens: { A } } = useTheme();
  const title = event?.title || "SOLSTICE";
  const dateStr = event?.startDate ? event.startDate.split('-').reverse().join('.') : "21.06.26";
  const timeStr = event?.startTime || "6:00 PM IST";
  const t = `${title.toUpperCase()} · ${dateStr} · ${timeStr.toUpperCase()} · `;
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg viewBox="0 0 140 140" className="spin" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs><path id="cp" d="M70,70 m-55,0 a55,55 0 1,1 110,0 a55,55 0 1,1 -110,0" /></defs>
        <text fill={A} fontSize="8" fontFamily="Inter,sans-serif" letterSpacing="3.5" fontWeight="600">
          <textPath href="#cp">{t}</textPath>
        </text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: A }} />
      </div>
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
    <div style={{ position: "relative", width: 440, height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", width: "100%", height: "100%" }}>
        {ringImages.map((src, i) => {
          const ang = (i / ringImages.length) * Math.PI * 2;
          const x = (Math.cos(ang) * R).toFixed(3);
          const y = (Math.sin(ang) * R).toFixed(3);
          
          // If we are using placeholders, construct the URL
          const finalSrc = src.startsWith('http') ? src : `https://picsum.photos/seed/${src}/200/300`;
          
          return (
            <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} style={{ width: 84, height: 110, borderRadius: 16, border: `1px solid ${B}`, overflow: "hidden", backgroundColor: "#000", boxShadow: "0 12px 40px -10px rgba(0,0,0,0.3)" }}>
                <img src={finalSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              </motion.div>
            </div>
          );
        })}
      </motion.div>
      <div style={{ position: "relative", zIndex: 10 }}>
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
    <Rev style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.35em", fontWeight: 600, textTransform: "uppercase", color: A, whiteSpace: "nowrap" }}>{idx ? `${idx} — ` : ""}{label}</span>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} style={{ flex: 1, height: 1, background: B, transformOrigin: "left" }} />
    </Rev>
  );
}

/* ─── SECTIONS ───────────────────────────────────── */
function Hero({ event }) {
  const { tokens: { A, W, M, FG } } = useTheme();
  const history = useHistory();
  const title = event?.title || "SOLSTICE";
  const date = event?.startDate ? event.startDate.split('-').reverse().join('.') : "21.06.26";
  const venueStr = event?.venueFullAddress || "Mumbai";
  const getCategoryDisplayName = (category, fallbackName) => {
    if (category && typeof category === "object") {
      return category.displayName || category.display_name || category.name || "";
    }
    return category || fallbackName || "";
  };
  const splitTitle = (str) => {
    if (!str) return ["", ""];
    if (str.includes("SOLSTICE")) return ["SOL", "STICE"];
    const words = str.split(" ");
    if (words.length === 1) {
      const half = Math.ceil(str.length / 2);
      return [str.slice(0, half), str.slice(half)];
    }
    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
  };
  const [titlePart1, titlePart2] = splitTitle(title);
  const heroTags = [
    getCategoryDisplayName(event?.primaryCategory, event?.primaryCategoryName || event?.category),
    getCategoryDisplayName(event?.subCategory, event?.subCategoryName),
  ].map((tag) => String(tag || "").trim()).filter(Boolean);

  return (
    <section style={{ position: "relative", minHeight: "100vh", background: W, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
      <motion.div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${A}12 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}08 1px, transparent 1px), linear-gradient(90deg, ${A}08 1px, transparent 1px)`, backgroundSize: "80px 80px" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${W} 100%)` }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.6, ease: E }} style={{ position: "absolute", top: "45%", right: "-80px", transform: "translateY(-50%)", zIndex: 2 }} className="desk-only">
        <div className="float-anim"><ImageRing event={event} /></div>
      </motion.div>

      <ProductNavbar top={100} left={60} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} style={{ position: "relative", zIndex: 2, maxWidth: 1320, margin: "0 auto", padding: "64px 36px 0", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
          
          {heroTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {heroTags.map((t, i) => (
                <motion.span key={t} className="hero-tag-pill" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55 + i * 0.07 }} whileHover={{ scale: 1.04, transition: { duration: 0.35, ease: E } }} style={{ position: "relative", display: "inline-flex", alignItems: "center", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 600, color: A, border: `1px solid ${A}40`, padding: "5px 14px", cursor: "default", transformOrigin: "center", willChange: "transform", transition: "background-color 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                  {t}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1320, margin: "0 auto", padding: "0 36px", width: "100%" }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }} className="font-mono" style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: M, marginBottom: 12 }}>
          <span style={{ color: A }}>▸</span> Edition 01 — {date} — {venueStr.split(',')[0]}
        </motion.p>
        <div style={{ overflow: "hidden", paddingBottom: "0.2em" }}>
          <motion.h1 initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.2, ease: E, delay: 0.65 }} className="font-display" style={{ fontSize: "clamp(3rem, 10vw, 8.5rem)", fontWeight: 700, lineHeight: 1.1, color: FG, margin: 0, letterSpacing: "-0.03em" }}>
            {titlePart1}
          </motion.h1>
        </div>
        <div style={{ overflow: "hidden", paddingBottom: "0.2em", marginTop: "-0.2em" }}>
          <motion.h1 initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.2, ease: E, delay: 0.79 }} className="font-display" style={{ fontSize: "clamp(3rem, 10vw, 8.5rem)", fontWeight: 700, lineHeight: 1.1, color: W, WebkitTextFillColor: W, WebkitTextStroke: `2px ${A}`, margin: 0, letterSpacing: "-0.03em" }}>
            {titlePart2}
          </motion.h1>
        </div>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.15, ease: E }} style={{ marginTop: 44, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <p style={{ maxWidth: 400, color: M, fontSize: 14, lineHeight: 1.8 }}>
            An immersive experience bringing together visionary minds for one unforgettable event.
          </p>
          <motion.a href="#about" whileHover={{ x: 6 }} style={{ display: "flex", alignItems: "center", gap: 8, color: A, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, textDecoration: "none" }}>
            Explore <ArrowDown size={13} />
          </motion.a>
        </motion.div>
      </div>

    </section>
  );
}

function About({ event }) {
  const { tokens: { A, BG, FG, M, W, B, S } } = useTheme();
  
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
  const eventType = event?.eventType || event?.category || "Event";
  const duration = formatDurationMinutes(totalSlotDuration);
  const ageLimit = event?.minimumAge != null ? `${event.minimumAge}+` : (event?.ageLimit || "All ages");

  const statsList = [
    { value: eventType, l: "Event Type", sub: "Program format" },
    { value: duration, l: "Duration", sub: "Scheduled window" },
    { value: ageLimit, l: "Age Limit", sub: "Entry guidance" },
    { value: guestCount, l: "Guest Count", sub: "Total ticket capacity", isCount: true },
  ];

  return (
    <>
      <section id="about" style={{ background: BG, padding: "130px 36px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SHdr idx="01" label="Story" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "start" }} className="grid-2">
            <div>
              <Chars text="Where the ancient" cls="font-display" style={{ fontSize: "clamp(2.2rem,4vw,3.6rem)", fontWeight: 700, lineHeight: 1.1, color: FG, overflow: "hidden" }} />
              <Chars text="meets the avant-garde." cls="font-display" delay={0.12} style={{ fontSize: "clamp(2.2rem,4vw,3.6rem)", fontWeight: 700, lineHeight: 1.1, color: A, fontStyle: "italic", overflow: "hidden" }} />
              <Rev delay={0.25}>
                <p style={{ color: M, fontSize: 14, lineHeight: 1.85, maxWidth: 480, marginTop: 28, marginBottom: 36 }}>{desc}</p>
                
                {/* Tags Section */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {tags.map((t, i) => (
                    <motion.span key={t} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      whileHover={{ color: W, backgroundColor: A, borderColor: A, scale: 1.05 }}
                      style={{ fontSize: 10, fontWeight: 500, color: M, backgroundColor: W, border: `1px solid ${B}`, padding: "6px 12px", cursor: "default" }}>
                      {t}
                    </motion.span>
                  ))}
                </div>
              </Rev>
            </div>
            <Rev delay={0.2}>
              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {statsList.map((s, i) => (
                  <motion.div key={s.l} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.1 }} whileHover={{ y: -4, borderColor: `${A}60`, backgroundColor: W }} style={{ border: `1px solid ${B}`, padding: "28px 28px", backgroundColor: BG, transition: "all 0.3s", cursor: "default", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: FG, marginBottom: 14 }}>{s.l}</p>
                    <p className="font-display" style={{ fontSize: "clamp(2rem,3.2vw,3rem)", fontWeight: 700, color: A, lineHeight: 1.05, marginBottom: 10, whiteSpace: "nowrap", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.isCount ? <Count to={s.value} /> : s.value}
                    </p>
                    <p style={{ fontSize: 11, color: M, lineHeight: 1.5 }}>{s.sub}</p>
                  </motion.div>
                ))}
              </div>
            </Rev>
          </div>
        </div>
      </section>
      <Mq items={mqItems.length > 0 ? mqItems : ["Experience", "Premium", "Event"]} dir="r" size="sm" bg={S} />
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

  const dynamicCols = chunkMedia(eventMedia, 5);
  
  // Fallback to reference images if no media is provided
  const GALLERY_COLS = useMemo(() => dynamicCols || [
    [{ src: "https://picsum.photos/seed/a1/300/400", label: "Live", h: 420 }, { src: "https://picsum.photos/seed/a2/300/500", label: "Audience", h: 560 }, { src: "https://picsum.photos/seed/a3/300/300", label: "Art", h: 320 }],
    [{ src: "https://picsum.photos/seed/b1/300/500", label: "Painting", h: 520 }, { src: "https://picsum.photos/seed/b2/300/400", label: "Venue", h: 380 }, { src: "https://picsum.photos/seed/b3/300/400", label: "Movement", h: 400 }],
    [{ src: "https://picsum.photos/seed/c1/300/400", label: "Guests", h: 380 }, { src: "https://picsum.photos/seed/c2/300/600", label: "Sonic", h: 540 }, { src: "https://picsum.photos/seed/c3/300/400", label: "Canvas", h: 420 }],
    [{ src: "https://picsum.photos/seed/d1/300/500", label: "Heritage", h: 480 }, { src: "https://picsum.photos/seed/d2/300/400", label: "Expression", h: 420 }, { src: "https://picsum.photos/seed/d3/300/300", label: "Energy", h: 360 }],
    [{ src: "https://picsum.photos/seed/e1/300/400", label: "Exhibitions", h: 360 }, { src: "https://picsum.photos/seed/e2/300/500", label: "Visuals", h: 500 }, { src: "https://picsum.photos/seed/e3/300/400", label: "Sound", h: 460 }],
  ], [dynamicCols]);

  const allImageUrls = useMemo(() => {
    return GALLERY_COLS.flat().map(img => img.src);
  }, [GALLERY_COLS]);

  const handleImageClick = (src) => {
    setGridVisible(true);
  };

  return (
    <>
      <Mq items={galleryMqItems.length > 0 ? galleryMqItems : ["SOLSTICE Ed.01", "Moments", "Curated Visuals"]} dir="l" size="sm" bg={BG} accent />
      <section id="gallery" style={{ backgroundColor: FG, padding: "120px 0", overflow: "hidden" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0 36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.35em", fontWeight: 600, textTransform: "uppercase", color: AH, whiteSpace: "nowrap" }}>02 — Visuals</span>
            <div style={{ flex: 1, height: 1, backgroundColor: theme === 'light' ? "#333" : "#2a2a2a" }} />
          </div>
          
          <Chars text="See the Vibe" cls="font-display" style={{ fontSize: "clamp(2rem,5vw,4.5rem)", fontWeight: 700, lineHeight: 1.1, color: BG, marginBottom: 64, overflow: "hidden", letterSpacing: "-0.02em", paddingBottom: "0.15em" }} />
          
          <div className="gallery-grid" style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: 16, 
            height: 850, 
            overflow: "hidden" 
          }}>
            <div style={{ width: 280, flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[0]} direction="up" speed={28} onImageClick={handleImageClick} /></div>
            <div style={{ width: 280, flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[1]} direction="down" speed={36} onImageClick={handleImageClick} /></div>
            <div style={{ width: 280, flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[2]} direction="up" speed={32} onImageClick={handleImageClick} /></div>
            <div style={{ width: 280, flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[3]} direction="down" speed={40} onImageClick={handleImageClick} /></div>
            <div style={{ width: 280, flexShrink: 0 }}><GalleryColumn images={GALLERY_COLS[4]} direction="up" speed={30} onImageClick={handleImageClick} /></div>
          </div>
        </div>
        
        <AnimatePresence>
          {gridVisible && !photoViewVisible && (
            <GridGallery
              items={allImageUrls}
              onClose={() => setGridVisible(false)}
              onSelect={(index) => {
                setPhotoViewIndex(index);
                setPhotoViewVisible(true);
              }}
              title={eventTitle}
              A={A}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {photoViewVisible && (
            <FullScreenImage
              src={allImageUrls[photoViewIndex]}
              onClose={() => setPhotoViewVisible(false)}
            />
          )}
        </AnimatePresence>
      </section>
    </>
  );
}

function Artists({ event }) {
  const { tokens: { A, AL, FG, M, B, W } } = useTheme();
  const [hov, setHov] = useState(null);

  // Use actual artists from backend if available
  const eventArtists = Array.isArray(event?.artists) ? event.artists : 
                      Array.isArray(event?.lineup) ? event.lineup : [];
  
  const ARTISTS = eventArtists.length > 0 ? eventArtists.map((a, i) => ({
    id: a.id || i,
    name: a.name || a.artistName || "Guest Artist",
    origin: a.origin || a.location || "INTL",
    bio: a.bio || a.description || "Performing live at Solstice.",
    image: formatImageUrl(a.photoUrl || a.imageUrl || a.profileImage || a.avatar || a.photo || a.artistImage)
  })) : [
    { id: 1, name: "Aroha Ngata", origin: "NZL", bio: "A pioneer of immersive soundscapes blurring the boundary between music and architecture.", tags: ["Electronic", "Ambient", "Installation"], image: "" },
    { id: 2, name: "Ravi Khanna", origin: "IND", bio: "Tabla maestro meets modular synthesizer — live sets that are meditations in controlled chaos.", tags: ["Classical", "Electronic", "Tabla"], image: "" },
    { id: 3, name: "Lena Solberg", origin: "NOR", bio: "Creates monumental paintings in real-time, her canvas as large as the wall behind her.", tags: ["Live Art", "Abstract", "Performance"], image: "" },
  ];
  return (
    <>
      <section id="artists" style={{ background: W, padding: "130px 36px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SHdr idx="03" label="Lineup" />
          <Chars text="The Artists" cls="font-display" style={{ fontSize: "clamp(2rem,5vw,4.5rem)", fontWeight: 700, lineHeight: 1.1, color: FG, marginBottom: 72, overflow: "hidden", letterSpacing: "-0.02em", paddingBottom: "0.15em" }} />
          <div style={{ borderTop: `1px solid ${B}` }}>
            {ARTISTS.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.07, ease: E }} onHoverStart={() => setHov(a.id)} onHoverEnd={() => setHov(null)} whileHover={{ paddingLeft: 20, backgroundColor: AL }} className="artist-row">
                <div>
                  <motion.p animate={{ color: hov === a.id ? A : B }} style={{ fontFamily: "monospace", fontSize: 10 }}>{String(i + 1).padStart(2, "0")}</motion.p>
                </div>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
                    <motion.h3 animate={{ color: hov === a.id ? A : FG }} className="font-display" style={{ fontSize: "clamp(1.5rem,2.8vw,2.5rem)", fontWeight: 700, lineHeight: 1 }}>{a.name}</motion.h3>
                    <span className="font-mono" style={{ fontSize: 9, color: M, letterSpacing: "0.2em" }}>{a.origin}</span>
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
                <motion.div animate={{ x: hov === a.id ? 4 : 0, opacity: hov === a.id ? 1 : 0.2 }} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <ArrowRight size={16} color={A} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
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

  return (
    <>
      <Mq items={tags} dir="r" size="sm" bg={S} accent />
      <section id="venue" style={{ background: BG, padding: "130px 36px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SHdr idx="04" label="Landscape" />
          <Chars text="Where It's Happening" cls="font-display" style={{ fontSize: "clamp(1.8rem,4.5vw,4.2rem)", fontWeight: 700, lineHeight: 1.1, color: FG, marginBottom: 72, overflow: "hidden", letterSpacing: "-0.02em", paddingBottom: "0.15em" }} />
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 1, background: B }} className="grid-3-2">
            <Rev delay={0.1}>
              <div style={{ background: W, padding: 52 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
                  <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                    <MapPin size={18} color={A} style={{ flexShrink: 0, marginTop: 4 }} />
                  </motion.div>
                  <div>
                    <h3 className="font-display" style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 4 }}>
                      {event?.venueFullAddress?.split(',')[0] || "The Venue"}
                    </h3>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: M, lineHeight: 1.85, marginBottom: 32, maxWidth: 540 }}>
                  {event?.venueDescription || event?.description?.slice(0, 200) || "Join us at this premier location for an unforgettable experience."}
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {event?.venueName && (
                    <p style={{ fontSize: 12, color: M }}><span style={{ color: FG, fontWeight: 600 }}>Venue Name: </span>{event?.venueName}</p>
                  )}
                  <p style={{ fontSize: 12, color: M }}><span style={{ color: FG, fontWeight: 600 }}>Address: </span>{event?.venueFullAddress || "Venue details to be updated"}</p>
                  {event?.district && (
                    <p style={{ fontSize: 12, color: M }}><span style={{ color: FG, fontWeight: 600 }}>District: </span>{event?.district}</p>
                  )}
                  {event?.state && (
                    <p style={{ fontSize: 12, color: M }}><span style={{ color: FG, fontWeight: 600 }}>State: </span>{event?.state}</p>
                  )}
                  {displayHostName && (
                    <p style={{ fontSize: 12, color: M }}><span style={{ color: FG, fontWeight: 600 }}>Host name: </span>{displayHostName}</p>
                  )}
                </div>

                <div style={{ marginTop: 40 }}>
                  <motion.a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.venueFullAddress || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 8 }}
                    style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: A, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    Get Directions <ArrowRight size={14} />
                  </motion.a>
                </div>
              </div>
            </Rev>
            <Rev delay={0.2}>
              <div style={{ background: S, padding: 52, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 400 }}>
                <div>
                  <p style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: M, marginBottom: 24, fontWeight: 500 }}>Location</p>
                  <div className="venue-map-wrap" style={{ position: "relative", width: "100%", paddingBottom: "85%", background: W, overflow: "hidden", border: `1px solid ${B}` }}>
                    {mapSrc ? (
                      <iframe
                        className="venue-map-frame"
                        title="Venue location map"
                        src={mapSrc}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                      />
                    ) : (
                      <>
                        <motion.div animate={{ backgroundPosition: ["0px 0px", "28px 28px"] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}18 1px,transparent 1px),linear-gradient(90deg,${A}18 1px,transparent 1px)`, backgroundSize: "28px 28px" }} />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                          <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", inset: "-8px", borderRadius: "50%", border: `1.5px solid ${A}`, transform: "translate(-50%,-50%)", top: "50%", left: "50%" }} />
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: A, position: "relative", zIndex: 1 }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Rev>
          </div>
        </div>
      </section>
    </>
  );
}

function Rules({ event }) {
  const { tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();
  
  const checkInInstructions = event?.checkInInstructions || event?.checkinInstructions || event?.checkInInstruction || "Check-in instructions will be shared before the event.";
  const cancellationPolicy = event?.cancellationPolicySummary || event?.cancellationPolicy || event?.cancellationPolicyText || "Cancellation policy will be shared before booking.";
  const guestRequirementQuestions = useMemo(() => {
    const guestRequirements = Array.isArray(event?.guestRequirements) ? event.guestRequirements : [];
    return guestRequirements.flatMap((requirement, requirementIndex) => {
    const questions = Array.isArray(requirement?.questions) ? requirement.questions : [];
    return questions.map((question, questionIndex) => ({
      id: question?.questionId || `${requirement?.settingId || requirementIndex}-${questionIndex}`,
      title: question?.title || question?.question || `Question ${questionIndex + 1}`,
      body: question?.helpText || question?.description || requirement?.description || "Please provide this information during booking.",
      required: Boolean(question?.required),
      fieldType: question?.fieldType || question?.type || "",
      defaultValueBool: Boolean(question?.defaultValueBool ?? question?.default_value_bool ?? question?.defaultValue ?? question?.default_value),
    }));
    });
  }, [event?.guestRequirements]);
  const [booleanValues, setBooleanValues] = useState({});

  useEffect(() => {
    const nextValues = {};
    guestRequirementQuestions.forEach((question) => {
      if (String(question.fieldType || "").toLowerCase() === "boolean") {
        nextValues[question.id] = question.defaultValueBool;
      }
    });
    setBooleanValues(nextValues);
  }, [guestRequirementQuestions]);
  
  const displayRules = [
    { id: 1, title: "Check-in Instructions", body: checkInInstructions },
    { id: 2, title: "Cancellation Policy", body: cancellationPolicy },
  ];
  const dropdownRow = (item, index) => {
    const isBooleanField = String(item.fieldType || "").toLowerCase() === "boolean";
    const toggleValue = Boolean(booleanValues[item.id]);

    return (
    <details key={item.id} style={{ borderBottom: `1px solid ${B}`, padding: "0 16px" }}>
      <summary style={{ listStyle: "none", cursor: "pointer", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span className="font-mono" style={{ fontSize: 10, color: A }}>{String(index + 1).padStart(2, "0")}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>{item.title}</span>
        </span>
        <ChevronDown size={16} color={M} />
      </summary>
      <div style={{ padding: "0 0 20px 48px" }}>
        <p style={{ fontSize: 13, color: M, lineHeight: 1.85, margin: 0 }}>{item.body}</p>
        {isBooleanField && (
          <button
            type="button"
            onClick={() => setBooleanValues((current) => ({ ...current, [item.id]: !toggleValue }))}
            aria-pressed={toggleValue}
            style={{
              marginTop: 16,
              width: 52,
              height: 28,
              borderRadius: 999,
              border: `1px solid ${toggleValue ? A : B}`,
              background: toggleValue ? A : S,
              cursor: "pointer",
              padding: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: toggleValue ? "flex-end" : "flex-start",
              transition: "0.2s ease",
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: W, boxShadow: "0 2px 8px rgba(0,0,0,0.18)", display: "block" }} />
          </button>
        )}
      </div>
    </details>
    );
  };

  return (
    <section id="rules" style={{ background: W, padding: "130px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <style>{`
          #rules details summary::-webkit-details-marker {
            display: none;
          }
          #rules details[open] summary svg {
            transform: rotate(180deg);
          }
          #rules details summary svg {
            transition: transform 0.25s ease;
          }
        `}</style>
        <SHdr idx="05" label="Essentials" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 80, alignItems: "start" }} className="grid-2">
          <Rev delay={0.1}>
            <Chars text="Things To" cls="font-display" style={{ fontSize: "clamp(3.5rem,8vw,7rem)", fontWeight: 700, lineHeight: 0.88, color: FG, overflow: "hidden", letterSpacing: "-0.02em" }} />
            <Chars text="Keep in Mind" delay={0.08} cls="font-display" style={{ fontSize: "clamp(3.5rem,8vw,7rem)", fontWeight: 700, lineHeight: 0.88, color: "transparent", WebkitTextStroke: `2px ${A}`, overflow: "hidden", letterSpacing: "-0.02em" }} />
          </Rev>
          <Rev delay={0.2}>
            <div>
              <h3 style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: A, fontWeight: 800, margin: "0 0 18px" }}>
                Things To keep in Mind
              </h3>
              <div style={{ borderTop: `1px solid ${B}` }}>
                {displayRules.map((rule, index) => dropdownRow(rule, index))}
              </div>

              <h3 style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: A, fontWeight: 800, margin: "44px 0 18px" }}>
                Guest Requirements
              </h3>
              <div style={{ borderTop: `1px solid ${B}` }}>
                {guestRequirementQuestions.length > 0 ? (
                  guestRequirementQuestions.map((question, index) => dropdownRow(question, index))
                ) : (
                  <div style={{ borderBottom: `1px solid ${B}`, padding: "20px 16px", fontSize: 13, color: M }}>
                    No guest requirements have been added for this event.
                  </div>
                )}
              </div>
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

function HostDetails({ event, hostName, reviews = [] }) {
  const { tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();
  const history = useHistory();
  const displayHostName = hostName || event?.host?.displayName || event?.host?.name || event?.host?.firstName || event?.organizerName;
  const hostProfile = event?.hostProfile;
  const host = hostProfile?.host || hostProfile || event?.host || {};
  const hostDescription = host?.description || host?.bio || host?.about || host?.summary || event?.organizerDescription || "Curators of memorable experiences, thoughtful gatherings, and community-led moments.";
  const hostSubtitle = host?.tagline || host?.businessName || host?.companyName || host?.role || "Event host";

  // Normalise reviews – API may return { ratingSummary, reviews:[...] } or a plain array
  const normalizedReviews = Array.isArray(reviews)
    ? reviews
    : Array.isArray(reviews?.reviews)
    ? reviews.reviews
    : [];
  const ratingSummary = !Array.isArray(reviews) && reviews?.ratingSummary ? reviews.ratingSummary : null;
  const displayReviews = normalizedReviews.slice(0, 2);
  const hasMore = normalizedReviews.length > 2;

  const formatReviewDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const diffDays = Math.floor((Date.now() - date) / 86400000);
      if (diffDays < 1) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "Recently"; }
  };

  return (
    <section id="host" style={{ background: BG, padding: "0 36px 130px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="06" label="People" />
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 1, background: B }} className="grid-3-2">
          {/* Left: Meet Your Host */}
          <Rev delay={0.1}>
            <div style={{ background: W, padding: 52, minHeight: 300 }}>
              <p className="host-presented-label" style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#0097B2", WebkitTextFillColor: "#0097B2", marginBottom: 36, fontWeight: 700 }}>Meet Your Host</p>
              <h3 className="font-display" style={{ fontSize: "clamp(2.4rem,5vw,4.2rem)", fontWeight: 700, color: FG, lineHeight: 1, marginBottom: 22 }}>
                {displayHostName || "Event Host"}
              </h3>
              <p style={{ color: M, fontSize: 14, fontStyle: "italic", lineHeight: 1.7, marginBottom: 28 }}>{hostSubtitle}</p>
              <p style={{ color: M, fontSize: 14, lineHeight: 1.85, maxWidth: 620 }}>{hostDescription}</p>
            </div>
          </Rev>
          {/* Right: Reviews (replaces More From This Host) */}
          <Rev delay={0.18}>
            <div style={{ background: S, padding: 52, minHeight: 300 }}>
              {/* Section label */}
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: M, marginBottom: 28, fontWeight: 500 }}>
                Guest Reviews
              </p>

              {/* ── Rating summary – Matching brand teal ── */}
              <div style={{ marginBottom: 28, padding: "16px 20px", border: `1.5px solid ${A}22`, background: AL, borderRadius: 6 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: A, fontFamily: "Georgia, serif", lineHeight: 1 }}>
                    {ratingSummary ? Number(ratingSummary.averageRating).toFixed(1) : "0.0"}
                  </span>
                  <span style={{ fontSize: 11, color: "#FFC107", letterSpacing: 2 }}>
                    {[...Array(5)].map((_, si) => (
                      <span key={si} style={{ color: si < Math.round(ratingSummary?.averageRating || 0) ? "#FFC107" : `${A}30` }}>★</span>
                    ))}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: A, fontWeight: 600, margin: 0 }}>
                  {ratingSummary?.totalReviews ?? 0} {(ratingSummary?.totalReviews ?? 0) === 1 ? "review" : "reviews"} total
                </p>
                {/* Rating distribution */}
                {Array.isArray(ratingSummary?.ratingDistribution) && ratingSummary.ratingDistribution.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    {ratingSummary.ratingDistribution.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "#FFC107", fontWeight: 600, width: 16 }}>{item.rating ?? item.stars ?? (5 - i)}★</span>
                        <div style={{ flex: 1, height: 4, background: `${A}20`, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: A, width: `${Math.min(100, ((item.count ?? 0) / Math.max(1, ratingSummary.totalReviews)) * 100)}%` }} />
                        </div>
                        <span style={{ fontSize: 10, color: A, minWidth: 18, textAlign: "right" }}>{item.count ?? 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Review list ── */}
              {displayReviews.length === 0 ? (
                <p style={{ fontSize: 13, color: M }}>No reviews yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {displayReviews.map((rev, i) => {
                    const author = rev.customerName || rev.author || "Guest";
                    const comment = rev.comment || rev.content || rev.reviewText || "";
                    const reviewRating = Number(rev.rating || rev.ratingScore || 0);
                    const time = formatReviewDate(rev.createdAt || rev.reviewDate || rev.time);
                    return (
                      <div
                        key={i}
                        style={{
                          padding: "18px 0",
                          borderBottom: i < displayReviews.length - 1 ? `1px solid ${B}` : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: comment ? 10 : 0 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: A, color: W, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {author[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: FG, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, letterSpacing: 1 }}>
                                {[...Array(5)].map((_, si) => (
                                  <span key={si} style={{ color: si < reviewRating ? "#FFC107" : "#D1D5DB" }}>★</span>
                                ))}
                              </span>
                              <span style={{ fontSize: 11, color: M }}>{time}</span>
                            </div>
                          </div>
                        </div>
                        {comment && (
                          <p style={{ fontSize: 13, color: M, lineHeight: 1.65, margin: 0, paddingLeft: 46 }}>{comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {hasMore && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => history.push("/reviews")}
                  style={{ marginTop: 24, width: "100%", padding: "11px 0", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, border: `1px solid ${B}`, backgroundColor: "transparent", color: FG, cursor: "pointer" }}
                >
                  See More Reviews
                </motion.button>
              )}
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

function EventBookingPopup({ event }) {
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
    ticketTypes,
    eventSlots: timeSlots,
    slots: timeSlots,
    timeSlots,
    host: event?.hostProfile?.host || event?.host || {}
  };

  return <BookingSystem listing={listing} type="event" triggerLabel="Reserve Ticket" reserveLabel="Reserve Ticket" />;
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
      try { return new Date(d).toISOString().split('T')[0]; } catch(e) { return null; }
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
    <section id="tickets" style={{ background: BG, padding: "130px 36px" }}>
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
                      {['S','M','T','W','T','F','S'].map((d, i) => (
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
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('id') || '3';

  const [event, setEvent] = useState(null);
  const [hostName, setHostName] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getEventDetails(eventId);
        console.log("DEBUG: Event Details Data:", data);
        let fetchedHostName = "";
        let hostProfile = null;

        if (data?.leadUserId) {
          try {
            const hostData = await getHost(data.leadUserId);
            fetchedHostName = formatHostName(hostData);
            hostProfile = hostData;
          } catch (hostErr) {
            console.error("Failed to load event host:", hostErr);
          }
        }

        // Fetch listing reviews (non-blocking)
        getListingReviews(eventId).then(rev => {
          if (mounted) setReviews(rev ?? []);
        }).catch(() => {
          if (mounted) setReviews([]);
        });

        if (mounted) { setEvent({ ...data, hostProfile }); setHostName(fetchedHostName); setError(null); }
      } catch (err) {
        if (mounted) setError("Failed to load event details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (eventId) fetchDetails();
    return () => { mounted = false; };
  }, [eventId]);

  if (loading) return <div className="p-5 text-center" style={{ minHeight: "100vh", background: "#f3f3f1", color: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading event details...</div>;
  if (error) return <div className="p-5 text-center text-danger" style={{ minHeight: "100vh", background: "#f3f3f1", display: "flex", alignItems: "center", justifyContent: "center" }}>{error}</div>;

  return (
    <ScopedThemeProvider>
      <ScopedStyles />
      <Cursor />
      <ProgressBar />
      <Hero event={event} />
      <About event={event} />
      <Gallery event={event} />
      <Artists event={event} />
      <Venue event={event} hostName={hostName} />
      <Rules event={event} />
      <HostDetails event={event} hostName={hostName} reviews={reviews} />
      <EventBookingPopup event={event} />
      <Footer />
    </ScopedThemeProvider>
  );
}

