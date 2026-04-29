import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import useDarkMode from "use-dark-mode";
import { useLocation, Link, useHistory } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import {
  Utensils, Star, Clock, MapPin, ChefHat, Award, Leaf, Globe,
  Coffee, Info, ChevronRight, ChevronDown, Phone, Instagram, Check, ArrowRight, ArrowDown,
  Calendar, Zap, CheckCircle, ChevronLeft
} from "lucide-react";
import cn from "classnames";
import Loader from "../../components/Loader";
import ProductNavbar from "../../components/ProductNavbar";
import { Footer } from "../../components/JUI/Footer";
import { getFoodDetails, getHost } from "../../utils/api";

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

const ScopedStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Italianno&family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
    
    .food-details-premium {
      font-family: 'Inter', system-ui, sans-serif;
      overflow-x: hidden;
      cursor: none;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    .food-details-premium a, .food-details-premium button { cursor: none; }
    
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
    
    #cur-dot { position: fixed; width: 6px; height: 6px; background: var(--A); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%, -50%); }
    #cur-ring { position: fixed; width: 38px; height: 38px; border: 1.5px solid var(--AL); border-radius: 50%; pointer-events: none; z-index: 99998; transform: translate(-50%, -50%); }
    
    .hero-img-curve {
      clip-path: circle(85% at 85% 50%);
    }

    @media(max-width:768px){
      .food-details-premium .desk-only { display: none !important; }
      .chef-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .hero-grid { grid-template-columns: 1fr !important; }
      .hero-img-curve { clip-path: none !important; border-radius: 40px; margin-top: 40px; }
    }
  `}</style>
);

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
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "0 24px", borderRight: hideBorder ? "none" : `1px solid ${tokens.B}`, height: "100%" }}>
      <div style={{ color: tokens.A }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: 9, textTransform: "uppercase", color: tokens.M, fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em" }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 800, color: tokens.FG, marginBottom: 2 }}>{value}</p>
        {subvalue && <p style={{ fontSize: 9, color: tokens.M }}>{subvalue}</p>}
      </div>
    </div>
  );
}

/* ─── CULINARY SECTIONS ─────────── */
function CulinaryHero({ food, galleryItems }) {
  const { tokens } = useTheme();
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

  return (
    <section style={{ background: BG, height: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", paddingTop: 80 }}>
      {/* Header Blending Gradient */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 160, background: `linear-gradient(to bottom, ${BG}, transparent)`, zIndex: 5, pointerEvents: "none" }} />
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 60px", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", width: "100%" }}>
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <div>
                <h1 className="font-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4.2rem)", fontWeight: 800, color: FG, lineHeight: 1, margin: 0, textTransform: "capitalize" }}>
                  {title}
                </h1>
                <h2 className="font-cursive" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", color: A, marginTop: -5, marginBottom: 16, fontWeight: 400 }}>
                  {food?.shortDescription || "Authentic Taste Experience"}
                </h2>
                <p style={{ fontSize: 14, color: M, lineHeight: 1.6, maxWidth: 450, margin: 0 }}>
                  {food?.detailedDescription || food?.description || "Experience the perfect harmony of flavors, crafted with passion."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "16px 0", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
                <InfoBadge icon={Utensils} label={cuisine} sublabel="Cuisine" tokens={tokens} />
                <InfoBadge icon={Globe} label={source} sublabel="Source" tokens={tokens} />
                <InfoBadge icon={Zap} label={serveMode} sublabel="Service" tokens={tokens} />
                <InfoBadge icon={Leaf} label={dietary} sublabel="Dietary" tokens={tokens} />
              </div>

              <div style={{ background: W, borderRadius: 20, padding: "16px 0", border: `1px solid ${B}`, display: "flex", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
                <div style={{ flex: 1 }}><HeroStat icon={Coffee} label="Average Cost" value={`₹${food?.averageCostForOne || "450"}`} subvalue="For One" tokens={tokens} /></div>
                <div style={{ flex: 1 }}><HeroStat icon={Clock} label="Open Today" value={`${food?.openingTime || "11:00 AM"} - ${food?.closingTime || "08:30 PM"}`} tokens={tokens} /></div>
                <div style={{ flex: 1.5 }}><HeroStat icon={Calendar} label="Open Days" value={openDays} tokens={tokens} hideBorder /></div>
              </div>
            </div>
          </Rev>

          <Rev delay={0.3} style={{ position: "relative" }}>
            <div className="hero-img-curve" style={{ width: "100%", aspectRatio: "4/5", maxHeight: "75vh", position: "relative", overflow: "hidden", borderRadius: "30px 30px 200px 30px" }}>
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
                <div style={{ width: 85, height: 85, borderRadius: "50%", background: W, boxShadow: "0 15px 35px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8 }}>
                  <div style={{ color: A, marginBottom: 2 }}><Star size={20} /></div>
                  <p style={{ fontSize: 8, fontWeight: 800, color: FG, margin: 0, textTransform: "uppercase" }}>Family Friendly</p>
                </div>
              </div>
            )}

            {(food?.isParkingAvailable || food?.parkingAvailable) && (
              <div style={{ position: "absolute", bottom: "15%", right: "-5%", zIndex: 10, animationDelay: "1s" }} className="float-anim">
                <div style={{ width: 85, height: 85, borderRadius: "50%", background: A, boxShadow: `0 15px 35px ${AL}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8, color: "#fff" }}>
                  <div style={{ marginBottom: 2 }}><MapPin size={22} /></div>
                  <p style={{ fontSize: 8, fontWeight: 800, margin: 0, textTransform: "uppercase" }}>Parking Available</p>
                </div>
              </div>
            )}

            <div className="font-cursive" style={{ position: "absolute", bottom: "10%", left: "-5%", color: FG, fontSize: 32, transform: "rotate(-12deg)", opacity: 0.8, zIndex: 10 }}>
              Signature <br /> {title.split(' ')[0]}
            </div>

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
    </section>
  );
}

function ChefSection({ food, hostData, hostAvatar, galleryItems }) {
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
    <section ref={r} style={{ background: BG, padding: "180px 0", overflow: "hidden", position: "relative", borderTop: `1px solid ${B}` }}>
      <motion.div style={{ x, position: "absolute", top: "40%", left: 0, whiteSpace: "nowrap", opacity: 0.05, pointerEvents: "none" }}>
        <h2 className="font-display" style={{ fontSize: "25vw", color: FG, fontWeight: 900 }}>GASTRONOMY</h2>
      </motion.div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 36px", position: "relative", zIndex: 2 }}>
        <SHdr idx="01" label="Culinary Visionary" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 100, alignItems: "center" }} className="chef-grid">
          <Soul r={-5} s={0.1}>
            <div style={{ background: S, borderRadius: 40, height: 650, overflow: "hidden", border: `1px solid ${B}`, position: "relative" }}>
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

              <div style={{ position: "absolute", top: 40, right: 40, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", padding: "12px 20px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ color: "#FFF", fontSize: 10, fontWeight: 700, margin: 0, letterSpacing: "0.1em" }}>EXPERT CURATOR</p>
              </div>
            </div>
          </Soul>

          <div>
            <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 32 }}>Behind the Craft</p>
            <h2 className="font-display" style={{ fontSize: "clamp(3rem, 5vw, 4.2rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 44 }}>
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

            <div style={{ position: "relative", marginBottom: 48 }}>
              <div style={{ position: "absolute", top: -20, left: -20, fontSize: 80, color: A, opacity: 0.1, fontFamily: "serif" }}>&ldquo;</div>
              <p style={{ fontSize: 17, color: FG, lineHeight: 1.85, fontWeight: 500, fontStyle: "italic", marginBottom: 32 }}>
                {chefStory}
              </p>
              <div style={{ width: 60, height: 2, background: A, marginBottom: 32 }} />
            </div>

            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ background: AL, padding: "24px 32px", borderRadius: 20, border: `1px solid ${B}` }}>
                <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 700 }}>Profile Role</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>Executive Chef & Owner</p>
              </div>
              <div style={{ background: AL, padding: "24px 32px", borderRadius: 20, border: `1px solid ${B}` }}>
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
  const { tokens: { A, FG, M, BG, S, B } } = useTheme();

  return (
    <section style={{ background: BG, padding: "150px 0", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 36px", marginBottom: 64 }}>
        <SHdr idx="02" label="Culinary Expressions" />
      </div>

      <div style={{ display: "flex", gap: 32, overflowX: "auto", padding: "0 5vw 64px", scrollbarWidth: "none" }} className="dish-scroll">
        {galleryItems.map((img, i) => (
          <Soul key={i} delay={i * 0.1} y={40} r={3} style={{ flexShrink: 0, width: "clamp(280px, 35vw, 450px)" }}>
            <motion.div whileHover={{ scale: 1.02 }} style={{ background: S, border: `1px solid ${B}`, borderRadius: 28, overflow: "hidden" }}>
              <div style={{ height: 480, overflow: "hidden", position: "relative" }}>
                <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }} alt="" />
                <div style={{ position: "absolute", bottom: 28, left: 28, right: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <p style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 8 }}>{Array.isArray(food?.cuisineTypeNames) ? food.cuisineTypeNames.join(", ") : (food?.cuisineTypeNames || toDisplayString(food?.cuisineType) || "Signature")}</p>
                    <h4 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: FG }}>{food?.menuName || "Culinary Craft"}</h4>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: A }}>{food?.price || ""}</span>
                </div>
              </div>
              <div style={{ padding: 32 }}>
                <p style={{ fontSize: 12, color: M, lineHeight: 1.7 }}>
                  {food?.detailedDescription || food?.description || "Experience the finest ingredients curated for this exclusive event."}
                </p>
              </div>
            </motion.div>
          </Soul>
        ))}
      </div>
    </section>
  );
}

function AvailabilitySection({ food }) {
  const { tokens: { A, FG, M, BG, W, B, S, AL } } = useTheme();

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const activeDays = Array.isArray(food?.openingDays) ? food.openingDays : days;

  return (
    <section style={{ background: BG, padding: "180px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="03" label="Availability & Pricing" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.8fr", gap: 64, marginTop: 64 }} className="chef-grid">
          <Rev delay={0.1}>
            <div style={{ background: S, border: `1px solid ${B}`, padding: "56px", borderRadius: 44, display: "flex", flexDirection: "column", height: "100%" }}>
              <h3 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, color: FG, marginBottom: 56, lineHeight: 1.1 }}>Operating <br /><span style={{ color: A }}>Architecture.</span></h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 48, flex: 1, justifyContent: "center" }}>
                <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: AL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock size={28} color={A} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 800 }}>Service Hours</p>
                    <p style={{ fontSize: "2.2rem", fontWeight: 700, color: FG, letterSpacing: "-0.02em" }}>{food?.openingTime || food?.startTime || "07:32"} — {food?.closingTime || food?.endTime || "17:55"}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: AL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Calendar size={28} color={A} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 12, fontWeight: 800 }}>Opening Days</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {days.map(d => {
                        const isActive = activeDays.some(ad => ad.toLowerCase().includes(d.toLowerCase()));
                        return (
                          <div key={d} style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: isActive ? A : W,
                            color: isActive ? "#FFF" : M,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 800,
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

                <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: AL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={28} color={A} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 8, fontWeight: 800 }}>Serve Mode</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: FG }}>{Array.isArray(food?.serveModeNames) ? food.serveModeNames.join(" & ") : (food?.serveModeNames || food?.serveMode || food?.serviceMode || "Dine-In")}</p>
                  </div>
                </div>
              </div>
            </div>
          </Rev>

          <Rev delay={0.2}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
              <div style={{ background: W, border: `1px solid ${B}`, padding: "40px", borderRadius: 40, display: "flex", flexDirection: "column", gap: 40 }}>
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

              <div style={{ background: W, border: `1px solid ${B}`, padding: "40px", borderRadius: 40, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Advanced Booking</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={food?.advancedBookingRequired ? A : M} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: FG }}>{food?.advancedBookingRequired ? "Required" : "Not Required"}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Seasonal</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={food?.seasonalAvailability ? A : M} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: FG }}>{food?.seasonalAvailability ? "Yes" : "No"}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M, marginBottom: 16, fontWeight: 800 }}>Alcohol</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={20} color={food?.alcoholServed ? A : M} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: FG }}>{food?.alcoholServed ? "Served" : "None"}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: S, border: `1px solid ${B}`, padding: "40px", borderRadius: 40, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 32 }}>Pricing Architecture</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 20, marginBottom: 20 }}>
                  <span style={{ fontSize: 14, color: M, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Tier Strategy</span>
                  <span className="font-display" style={{ fontSize: "1.8rem", fontWeight: 700, color: FG, letterSpacing: "-0.02em" }}>{food?.priceRange || "Budget"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, color: M, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Avg. Investment</span>
                  <span style={{ fontSize: "3rem", fontWeight: 800, color: A, letterSpacing: "-0.04em" }}>₹{food?.averageCostForOne || food?.price || "450"}</span>
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
  const { tokens: { A, AL, FG, M, BG, W, B, S } } = useTheme();

  return (
    <section style={{ background: W, padding: "130px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="04" label="Location & Access" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, marginTop: 64 }} className="chef-grid">
          <Rev delay={0.1}>
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <h3 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, color: FG, marginBottom: 56, lineHeight: 1.1 }}>Restaurant <br /><span style={{ color: A }}>Location.</span></h3>
              <div style={{ background: S, border: `1px solid ${B}`, padding: 40, borderRadius: 40, display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
                <div style={{ background: W, border: `1px solid ${B}`, height: 320, marginTop: 12, borderRadius: 28, position: "relative", overflow: "hidden" }}>
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
              <h3 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, color: FG, marginBottom: 56, lineHeight: 1.1 }}>Location <br /><span style={{ color: A }}>Details.</span></h3>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 0, padding: 0 }}>
                  {[
                    { label: "Address", val: food?.meetingAddress || food?.address },
                    { label: "District", val: food?.meetingDistrict || food?.district },
                    { label: "State", val: food?.meetingState || food?.state || food?.city },
                    { label: "Landmark", val: food?.nearestLandmark || food?.meetingLandmark || food?.landmark || "Near City Center" },
                    { label: "Directions", val: food?.meetingInstructions || food?.directions }
                  ].filter(x => x.val).map((item, i) => (
                    <li key={i} style={{ display: "flex", gap: 32, alignItems: "baseline", borderBottom: `1px solid ${B}`, padding: "24px 0" }}>
                      <span style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: A, width: 130, flexShrink: 0, fontWeight: 800 }}>{item.label}</span>
                      <span style={{ fontSize: 20, color: FG, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.01em" }}>{item.val}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 40 }}>
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
  const { A, FG, M, B } = tokens;
  const title = item?.title || "Requirement";
  const desc = item?.description || "No description provided.";

  return (
    <div style={{ borderBottom: `1px solid ${B}`, paddingBottom: 24 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 20 }}
      >
        <p style={{ fontSize: 16, fontWeight: 700, color: FG, margin: 0, textTransform: "capitalize" }}>{title}</p>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={20} color={A} />
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
            <p style={{ fontSize: 15, color: M, lineHeight: 1.6, marginTop: 16, margin: 0 }}>{desc}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReservationNoir({ food, hostData }) {
  const { tokens } = useTheme();
  const { A, FG, M, BG, S, B, AL } = tokens;

  return (
    <section style={{ background: BG, padding: "150px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Soul y={100}>
          <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 40, padding: "80px 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }} className="res-grid">
            {/* Left Column: Contact Details */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 24 }}>Inquiries</p>
              <h3 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 700, color: FG, marginBottom: 16 }}>Contact & <br /><span style={{ color: A }}>Additional Info.</span></h3>
              <p style={{ fontSize: 15, color: M, lineHeight: 1.6, marginBottom: 56 }}>
                Contact details and dietary information
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, rowGap: 40 }}>
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
            <div style={{ background: AL, borderRadius: 32, padding: 48, border: `1px solid ${B}` }}>
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
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const hostAvatar = useMemo(() => {
    const avatarUrl = hostData?.profilePhotoUrl || food?.host?.profilePhotoUrl;
    return avatarUrl ? formatImageUrl(avatarUrl) : null;
  }, [hostData, food]);

  if (loading && !food) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader />
      </div>
    );
  }

  return (
    <ScopedThemeProvider>
      <ProgressBar />
      <Cursor />
      <ProductNavbar top={100} left={60} />
      <ScopedStyles />

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

      <Footer />

    </ScopedThemeProvider>
  );
};

export default FoodDetails;
