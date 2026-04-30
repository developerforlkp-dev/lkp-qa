import React, { useEffect, useState, useMemo, createContext, useContext, useRef, useCallback } from "react";
import { useLocation, useHistory, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  Wifi, Waves, Sparkles, Dumbbell, Umbrella, Plane, GlassWater, Utensils,
  Phone, Clock, FileText, MapPin, ChevronDown, CheckCircle, Info, Building,
  ArrowRight, ShieldCheck, Mail, Globe, Map, Navigation, ArrowDown, Car, AirVent,
  Users, DoorOpen, Bed, Bath, Maximize, Calendar, Star, Share2, Heart, ArrowLeft
} from "lucide-react";
import moment from "moment";
import cn from "classnames";
import Page from "../../components/Page";
import ProductNavbar from "../../components/ProductNavbar";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import RoomCards from "./RoomCards";
import { getStayDetails, getHost, createStayOrder } from "../../utils/api";
import StayBookingSystem from "./StayBookingSystem";
import { useTheme, THEMES } from "../../components/JUI/Theme";
import { Footer } from "../../components/JUI/Footer";

const fixImageUrl = (url) => {
  if (!url) return "";
  let u = typeof url === 'string' ? url : (url.url || url.src || url.mediaUrl || url.coverImageUrl || url.coverPhotoUrl || "");
  if (!u || typeof u !== 'string') return "";
  return u.replace(/%25/g, '%');
};

const E = [0.22, 1, 0.36, 1];

const ScopedStyles = () => (
  <style>{`
    .stay-details-premium {
      font-family: var(--font-inter, system-ui, sans-serif);
      overflow-x: hidden;
      cursor: none;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    .stay-details-premium a, .stay-details-premium button { cursor: none; }
    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    
    .stay-details-premium .font-display { font-family: var(--font-fraunces, Georgia, serif); }
    .stay-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .stay-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    
    #cur-dot { position: fixed; width: 6px; height: 6px; background: var(--A); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%, -50%); }
    #cur-ring { position: fixed; width: 38px; height: 38px; border: 1.5px solid var(--AL); border-radius: 50%; pointer-events: none; z-index: 99998; transform: translate(-50%, -50%); }
    
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

    @media(max-width:768px){
      .stay-details-premium .desk-only { display: none !important; }
      .pol-contact-grid, .amenities-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
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

/* ─── STAY SECTIONS ─────────── */
function StayHeroCarousel({ stay, galleryItems = [] }) {
  const { tokens: { A, BG, FG, M, S, B, W } } = useTheme();
  const title = stay?.propertyName || stay?.title || "STAY EXPERIENCE";
  const items = galleryItems.slice(0, 5);

  // Infinite Loop Logic for images only
  const x = useMotionValue(0);
  const speed = 0.03;

  useAnimationFrame((t, delta) => {
    const moveBy = (delta || 16) * speed;
    x.set(x.get() - moveBy);
  });

  const BentoGridImages = () => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(500px, 1.2fr) minmax(300px, 0.8fr) minmax(400px, 1fr)",
      gridTemplateRows: "1fr 1fr",
      gap: 24,
      height: "100%",
      width: "100vw",
      padding: "0 12px",
      flexShrink: 0
    }}>
      <div style={{ gridArea: "1 / 1 / 3 / 2", borderRadius: 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[0] || stay?.coverPhotoUrl)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      </div>
      <div style={{ borderRadius: 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[1])} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      </div>
      <div style={{ borderRadius: 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[2])} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      </div>
      <div style={{ gridArea: "1 / 3 / 3 / 4", borderRadius: 24, overflow: "hidden", border: `1px solid ${B}` }}>
        <img src={fixImageUrl(items[3] || items[0])} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      </div>
    </div>
  );

  const wrappedX = useTransform(x, (v) => {
    const W = window.innerWidth;
    return `${v % W}px`;
  });

  return (
    <section style={{ position: "relative", height: "85vh", background: BG, overflow: "hidden", padding: "0", zIndex: 50 }}>
      {/* Looping Image Track */}
      <motion.div style={{ x: wrappedX, display: "flex", height: "100%", width: "fit-content" }}>
        <BentoGridImages />
        <BentoGridImages />
        <BentoGridImages />
      </motion.div>

      {/* Static Fixed Text Overlay */}
      <div style={{ position: "absolute", bottom: 80, left: 80, zIndex: 40, pointerEvents: "none" }}>
        <Rev delay={0.2}>
          <div style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", padding: "40px 60px", borderRadius: 32, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 1, background: A }} />
              <span style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: A, fontWeight: 800 }}>{toDisplayString(stay?.propertyType) || "EXCEPTIONAL"}</span>
            </div>
            <h1 className="font-display" style={{ fontSize: "clamp(2rem, 5vw, 5rem)", fontWeight: 800, color: "#FFF", lineHeight: 0.9, letterSpacing: "-0.03em" }}>{title.toUpperCase()}</h1>
            <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, color: "#FFF" }}>
              <MapPin size={18} />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.1em" }}>{stay?.city}, {stay?.state}</span>
            </div>
          </div>
        </Rev>
      </div>

      {/* Static Overlays: Luxury Badge */}
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
    </section>
  );
}

function StayAmenities({ stay }) {
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
    <section style={{ background: W, padding: "140px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="02" label="Facilities & Services" />
        <Soul y={100} s={0.08}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
            {/* Left Column: Descriptions */}
            <Rev>
              {(() => {
                const short = stay?.shortDescription || "";
                if (!short) return (
                  <>
                    <Chars text="A sanctuary redefined" cls="font-display" style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, paddingBottom: "0.1em", marginBottom: 12, display: "block", overflow: "hidden" }} />
                    <Chars text="at the water's edge." delay={0.12} cls="font-display" style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: 700, color: A, lineHeight: 1.1, paddingBottom: "0.1em", marginBottom: 32, display: "block", overflow: "hidden" }} />
                  </>
                );
                const words = short.trim().split(" ");
                const mid = Math.ceil(words.length / 2);
                const line1 = words.slice(0, mid).join(" ");
                const line2 = words.slice(mid).join(" ");
                return (
                  <>
                    <Chars text={line1} cls="font-display" style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, paddingBottom: "0.1em", marginBottom: 12, display: "block", overflow: "hidden" }} />
                    {line2 && <Chars text={line2} delay={0.12} cls="font-display" style={{ fontSize: "clamp(2.5rem, 5.5vw, 5rem)", fontWeight: 700, color: A, lineHeight: 1.1, paddingBottom: "0.1em", marginBottom: 32, display: "block", overflow: "hidden" }} />}
                  </>
                );
              })()}
              <p style={{ fontSize: 16, color: M, lineHeight: 1.85 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 32px" }}>
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

function RequirementField({ question, A, FG, M, B, S }) {
  const [value, setValue] = useState(""); 
  const fieldType = question.fieldType || question.question?.fieldType;
  const title = question.title || question.question?.title;

  if (fieldType === 'boolean') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px dashed ${B}` }}>
        <span style={{ fontSize: 14, color: FG, fontWeight: 500 }}>{title}</span>
        <div 
          onClick={() => setValue(!value)}
          style={{ 
            width: 44, height: 24, borderRadius: 12, background: value ? A : B, 
            position: 'relative', cursor: 'pointer', transition: '0.3s' 
          }}
        >
          <motion.div 
            animate={{ x: value ? 22 : 2 }}
            style={{ 
              width: 20, height: 20, borderRadius: '50%', background: '#FFF', 
              position: 'absolute', top: 2 
            }} 
          />
        </div>
      </div>
    );
  }

  if (fieldType === 'text_single') {
    return (
      <div style={{ padding: '16px 0', borderBottom: `1px dashed ${B}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{title}</p>
        <input 
          type="text" 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your answer here..."
          style={{ 
            width: '100%', padding: '14px 20px', borderRadius: 12, 
            border: `1px solid ${B}`, background: S, color: FG, outline: 'none',
            fontSize: 14, fontWeight: 500
          }}
        />
      </div>
    );
  }

  if (fieldType === 'text_multi') {
    return (
      <div style={{ padding: '16px 0', borderBottom: `1px dashed ${B}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{title}</p>
        <textarea 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter detailed information..."
          rows={3}
          style={{ 
            width: '100%', padding: '14px 20px', borderRadius: 12, 
            border: `1px solid ${B}`, background: S, color: FG, outline: 'none',
            resize: 'vertical', fontSize: 14, fontWeight: 500, lineHeight: 1.6
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: '12px 0' }}>
      <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
      <span style={{ fontSize: 14, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{title}</span>
    </div>
  );
}

function PolicyItem({ rule, A, FG, M, B, S }) {
  const [op, setOp] = useState(false);
  const hasQuestions = Array.isArray(rule.questions) && rule.questions.length > 0;

  return (
    <motion.div key={rule.id} style={{ borderBottom: `1px solid ${B}` }}>
      <button onClick={() => setOp(!op)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "30px 20px", background: "none", border: "none", cursor: "none", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <FileText size={20} color={op ? A : M} />
          <motion.span animate={{ color: op ? A : FG }} style={{ fontSize: 16, fontWeight: 700 }}>{rule.title}</motion.span>
        </div>
        <motion.div animate={{ rotate: op ? 180 : 0 }} transition={{ duration: 0.4 }}>
          <ChevronDown size={18} color={M} />
        </motion.div>
      </button>
      <AnimatePresence>
        {op && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: E }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 20px 40px 64px", maxWidth: 640 }}>
              {hasQuestions ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {rule.questions.map((q, i) => (
                    <RequirementField key={i} question={q} A={A} FG={FG} M={M} B={B} S={S} />
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
  const { tokens: { A, AL, BG, FG, M, S, B, W } } = useTheme();
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
    if (stay?.privacyAndPolicy?.cancellationPolicyTemplate && stay.privacyAndPolicy.cancellationPolicyTemplate !== "No cancellation policy rules defined.") {
      cancelItems.push({ id: 'cancel-1', title: "Cancellation Terms", body: stay.privacyAndPolicy.cancellationPolicyTemplate });
    } else {
      const rawCancelRules = stay?.cancellationPolicyRules || stay?.cancellationPolicyRule || stay?.cancellationRules || findArrayWithKey(stay, 'policyRule');
      if (Array.isArray(rawCancelRules) && rawCancelRules.length > 0) {
        rawCancelRules.forEach((r, i) => cancelItems.push({ id: `cancel-${i}`, title: `Rule ${i + 1}`, body: extractText(r) }));
      } else if (stay?.generatedPolicySummary || stay?.policySummary) {
        cancelItems.push({ id: 'cancel-1', title: "Summary", body: stay?.generatedPolicySummary || stay?.policySummary });
      } else if (stay?.cancellationPolicy || stay?.cancellationPolicyText) {
        cancelItems.push({ id: 'cancel-1', title: "Terms", body: stay.cancellationPolicy || stay.cancellationPolicyText });
      } else {
        cancelItems.push({ id: 'cancel-1', title: "Terms", body: "Cancellations made within 7 days of arrival are subject to a 100% penalty." });
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

  const primaryName = stay?.contactInformation?.primaryContactName || stay?.primaryContactName || stay?.primaryContact?.name || (hostData?.firstName ? `${hostData.firstName} ${hostData.lastName || ""}`.trim() : hostData?.name || hostData?.businessName || hostData?.host?.displayName || stay?.host?.name || stay?.host?.firstName || "Adithyan");
  const primaryPhoneNum = stay?.contactInformation?.primaryPhone || stay?.primaryPhone || stay?.primaryContactNumber || stay?.primaryContact?.phone || phone;
  const primaryEmailAddress = stay?.contactInformation?.primaryEmail || stay?.primaryEmail || stay?.primaryContactEmail || stay?.primaryContact?.email || email;

  const salesName = stay?.contactInformation?.salesContactName || stay?.salesContactName || stay?.salesContact?.name || stay?.salesName;
  const salesPhoneNum = stay?.contactInformation?.salesPhone || stay?.salesPhone || stay?.salesContactNumber || stay?.salesContact?.phone;
  const salesEmailAddress = stay?.contactInformation?.salesEmail || stay?.salesEmail || stay?.salesContactEmail || stay?.salesContact?.email;

  const frontOffice = stay?.contactInformation?.frontOfficePhone || stay?.frontOfficePhone || stay?.frontOfficeContact;

  return (
    <section style={{ background: BG, padding: "140px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>

        <SHdr idx="05" label="Guidelines & Contact" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 100, alignItems: "start", marginTop: 40 }}>

          {/* Left Column: Host Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 24 }}>Property Host</p>
              <Rev>
                <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `1px solid ${B}`, background: S }}>
                    {hostAvatar ? (
                      <img src={hostAvatar} alt={primaryName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: M }}>
                        {primaryName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display" style={{ fontSize: 32, fontWeight: 700, color: FG, marginBottom: 4 }}>{primaryName}</h3>
                    <p style={{ fontSize: 14, color: M }}>Property Representative</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "32px", background: W, border: `1px solid ${B}`, borderRadius: 2 }}>
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
                <div style={{ padding: "32px", background: S, border: `1px solid ${B}`, borderRadius: 2 }}>
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
  const { tokens: { BG, FG, W, B, S, M } } = useTheme();
  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const [stay, setStay] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking State
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [selectedRooms, setSelectedRooms] = useState([]); // Array of {roomId, mealPlan, count}
  const [bookingLoading, setBookingLoading] = useState(false);

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
      if (exists) return prev.filter(r => r.roomId !== rid);
      return [...prev, { roomId: rid, mealPlan: mealPlan || "EP", count: 1 }];
    });
  }, []);

  const handleRoomCountChange = useCallback((roomId, count) => {
    const rid = String(roomId);
    setSelectedRooms(prev => prev.map(r => 
      r.roomId === rid ? { ...r, count: Math.max(1, count) } : r
    ));
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await getStayDetails(id);
        if (!mounted) return;

        if (data) {
          setStay(data);
          // DEBUG: Log full stay payload to identify exact field names for rules/policies
          console.log("🏨 STAY FULL PAYLOAD:", JSON.stringify(data, null, 2));
          const galleryImages = [];
          const cover = data.coverPhotoUrl || data.coverImageUrl || data.coverPhoto || data.coverImage || data.cover;
          if (cover) galleryImages.push(formatImageUrl(cover));

          const collect = (arr) => {
            if (Array.isArray(arr)) arr.forEach(m => {
              const u = typeof m === "string" ? m : m?.url ?? m?.src ?? m?.imageUrl;
              if (u) galleryImages.push(formatImageUrl(u));
            });
          };
          collect(data.media); collect(data.images); collect(data.stayMedia);

          const seen = new Set();
          setGalleryItems(galleryImages.filter(u => u && !seen.has(u) && seen.add(u)));

          const hostId = data.hostId || data.host?.hostId || data.leadUserId || data.userId;
          if (hostId) getHost(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));
        }
        setLoading(false);
      } catch (e) {
        console.error("Failed to load stay details", e);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const hostAvatar = useMemo(() => {
    const avatarUrl = hostData?.host?.profilePhotoUrl || hostData?.host?.profilePhoto || stay?.host?.profilePhotoUrl || stay?.host?.profilePhoto;
    return avatarUrl ? formatImageUrl(avatarUrl) : null;
  }, [hostData, stay]);

  if (loading && !stay) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader />
      </div>
    );
  }



  return (
    <div className="stay-details-premium" style={{ minHeight: "100vh", background: BG, color: FG }}>
      <ScopedStyles />

      <ProductNavbar top={100} left={60} />

      <StayHeroCarousel stay={stay} galleryItems={galleryItems} />

      <StayAmenities stay={stay} />

      <div style={{ background: W, padding: "80px 36px 140px", borderTop: `1px solid ${B}` }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <SHdr idx="03" label="Accommodations" />
          <p style={{ fontSize: 16, color: M, marginBottom: 56, maxWidth: 600, lineHeight: 1.7 }}>
            Choose from our curated selection of rooms and suites. Each space is thoughtfully designed for an unparalleled stay experience.
          </p>
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

      <StayBookingSystem
        stay={stay}
        checkInDate={checkInDate}
        setCheckInDate={setCheckInDate}
        checkOutDate={checkOutDate}
        setCheckOutDate={setCheckOutDate}
        guests={guests}
        setGuests={setGuests}
        selectedRooms={selectedRooms}
        onRoomsCountChange={handleRoomCountChange}
      />


    </div>
  );
};

function StayLocation({ stay }) {
  const { tokens: { A, BG, FG, M, S, B, W } } = useTheme();

  // Robustly extract coordinates
  const lat = stay?.latitude || stay?.latitude_decimal || stay?.lat || stay?.meetingLatitude || stay?.listingLatitude;
  const lng = stay?.longitude || stay?.longitude_decimal || stay?.lng || stay?.meetingLongitude || stay?.listingLongitude;

  // Robustly extract the full address from various possible backend fields
  const address = stay?.address || stay?.fullAddress || stay?.location || stay?.meetingAddress || [stay?.city, stay?.state, stay?.country].filter(Boolean).join(", ");
  const city = stay?.city || stay?.district || "Destination";
  const state = stay?.state || stay?.province || "N/A";
  const country = stay?.country || "N/A";

  // Build the query: Prefer coordinates for pinpoint accuracy, fallback to address
  const hasCoords = lat && lng;
  const mapQuery = hasCoords ? `${lat},${lng}` : (address || city);
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=15&output=embed&iwloc=near`;

  if (!address && !stay?.city && !hasCoords) return null;

  const detailRows = [
    { label: "ADDRESS", value: address },
    { label: "DISTRICT", value: city },
    { label: "STATE", value: state },
    { label: "COUNTRY", value: country },
  ];

  return (
    <section style={{ background: W, padding: "120px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="02" label="PREPARATION" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 100, marginTop: 40 }}>
          {/* Left Column: Location Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <h2 className="font-display" style={{ fontSize: 48, fontWeight: 700, color: FG }}>Location</h2>
            <div style={{ background: S, borderRadius: 2, overflow: "hidden", border: `1px solid ${B}`, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              {/* Card Header Area */}
              <div style={{ padding: "24px 32px", background: BG, borderBottom: `1px solid ${B}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <MapPin size={20} color={A} style={{ marginTop: 4 }} />
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: FG, marginBottom: 4 }}>{city}</p>
                    <p style={{ fontSize: 13, color: M, lineHeight: 1.5 }}>{address}</p>
                  </div>
                </div>
              </div>
              {/* Map Area */}
              <div style={{ height: 400, position: "relative" }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <h2 className="font-display" style={{ fontSize: 48, fontWeight: 700, color: FG }}>Location Details</h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {detailRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 32, padding: "28px 0", borderBottom: `1px solid ${B}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: A, textTransform: "uppercase" }}>{row.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: FG, lineHeight: 1.5 }}>{row.value}</span>
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
