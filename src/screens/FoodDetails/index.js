import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import useDarkMode from "use-dark-mode";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import { 
  Utensils, Star, Clock, MapPin, ChefHat, Award, Leaf, Globe, 
  Coffee, Info, ChevronRight, Phone, Instagram, Check, ArrowRight, ArrowDown 
} from "lucide-react";
import cn from "classnames";
import Loader from "../../components/Loader";
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
    .food-details-premium {
      font-family: var(--font-inter, system-ui, sans-serif);
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

    [class*="Header_headerBorder"] {
      box-shadow: none !important;
    }

    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    @keyframes spin-badge { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    
    .food-details-premium .font-display { font-family: var(--font-fraunces, Georgia, serif); }
    .food-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .food-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    .food-details-premium .float-anim { animation: float 6s ease-in-out infinite; }
    
    #cur-dot { position: fixed; width: 6px; height: 6px; background: var(--A); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%, -50%); }
    #cur-ring { position: fixed; width: 38px; height: 38px; border: 1.5px solid var(--AL); border-radius: 50%; pointer-events: none; z-index: 99998; transform: translate(-50%, -50%); }
    
    .dish-scroll::-webkit-scrollbar { display: none; }
    @media(max-width:768px){
      .food-details-premium .desk-only { display: none !important; }
      .chef-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      [class*="Header_header"] { position: absolute !important; }
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
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} style={{ flex: 1, height: 1, background: B, transformOrigin: "left" }} />
    </Rev>
  );
}

/* ─── CULINARY SECTIONS ─────────── */
function CulinaryHero({ food, galleryItems }) {
  const { tokens: { A, FG, M, BG, W } } = useTheme();
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start start", "end start"] });
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const yIng1 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const yIng2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const title = food?.menuName || food?.title || "PURE CRAFT";
  const coverImg = food?.coverImageUrl || (galleryItems.length > 0 ? galleryItems[0] : "https://picsum.photos/seed/culinary/1200/800");
  const philosophy = food?.description?.split('.')[0] + "." || "Where the alchemy of tradition meets the precision of the future.";

  return (
    <section ref={r} style={{ position: "relative", minHeight: "100vh", background: BG, overflow: "hidden" }}>
      <motion.div style={{ y: yHero, position: "absolute", inset: 0, zIndex: 1, opacity: 0.6 }}>
        <img src={coverImg} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4) saturate(1.2)" }} alt={title} />
      </motion.div>

      {/* Top Gradient for Header Blending */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)", zIndex: 2, pointerEvents: "none" }} />

      {/* Floating Ingredients Layer */}
      {galleryItems.length > 1 && (
        <motion.div style={{ y: yIng1, position: "absolute", top: "25%", left: "5%", width: 340, height: 340, zIndex: 2, pointerEvents: "none", filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.5))" }} className="desk-only float-anim">
          <img src={galleryItems[1]} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4, filter: "brightness(0.8) contrast(1.1)" }} alt="" />
        </motion.div>
      )}
      {galleryItems.length > 2 && (
        <motion.div style={{ y: yIng2, position: "absolute", bottom: "10%", right: "8%", width: 380, height: 380, zIndex: 2, pointerEvents: "none", filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.5))" }} className="desk-only float-anim">
          <img src={galleryItems[2]} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4, filter: "brightness(0.7) contrast(1.2) rotate(2deg)" }} alt="" />
        </motion.div>
      )}

      <div style={{ position: "relative", zIndex: 10, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", paddingTop: 80 }}>
        <motion.div style={{ opacity, y: yText }}>
           <p style={{ fontSize: 11, letterSpacing: "0.6em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 32 }}>Epicurean Odyssey — {toDisplayString(food?.category) || "Cuisine"}</p>
           <h1 className="font-display" style={{ fontSize: "clamp(3.5rem, 8vw, 7.5rem)", fontWeight: 800, color: FG, lineHeight: 1.1, letterSpacing: "0.15em", margin: 0, textTransform: "uppercase" }}>
             {title.split(' ')[0]} <br/><span style={{ color: "transparent", WebkitTextStroke: `1px ${FG}` }}>{title.split(' ').slice(1).join(' ') || "CRAFT"}</span>
           </h1>
           <div style={{ marginTop: 64, maxWidth: 600, padding: "0 20px" }}>
              <p style={{ fontSize: 18, color: M, lineHeight: 1.6, fontWeight: 400, fontStyle: "italic" }}>
                "{philosophy}"
              </p>
           </div>
        </motion.div>
      </div>

      <div style={{ position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: M, fontWeight: 600 }}>Explore the Menu</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ width: 1, height: 60, background: `linear-gradient(to bottom, ${A}, transparent)` }} />
      </div>

      {/* Vignette Overlay */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none" }} />
    </section>
  );
}

function ChefSection({ food, hostData, hostAvatar }) {
  const { tokens: { A, FG, M, W, B, S, BG } } = useTheme();
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]);

  return (
    <section ref={r} style={{ background: BG, padding: "180px 0", overflow: "hidden", position: "relative", borderTop: `1px solid ${B}` }}>
      <motion.div style={{ x, position: "absolute", top: "40%", left: 0, whiteSpace: "nowrap", opacity: 0.05, pointerEvents: "none" }}>
        <h2 className="font-display" style={{ fontSize: "25vw", color: FG, fontWeight: 900 }}>GASTRONOMY</h2>
      </motion.div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 36px", position: "relative", zIndex: 2 }}>
         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }} className="chef-grid">
            <Soul r={-5} s={0.1}>
               <div style={{ background: S, borderRadius: 40, height: 650, overflow: "hidden", border: `1px solid ${B}` }}>
                 <img src={hostAvatar || "https://picsum.photos/seed/chef/600/800"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }} alt="The Culinary Craft" />
               </div>
            </Soul>
            
            <div>
               <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 32 }}>Curator of Taste</p>
               <h2 className="font-display" style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 44 }}>
                 {(() => {
                    const short = food?.shortDescription || "";
                    if (!short) return <>Engineering <br/><span style={{ color: A }}>Sensory Architecture.</span></>;
                    const words = short.trim().split(" ");
                    const mid = Math.ceil(words.length / 2);
                    return (
                      <>
                        {words.slice(0, mid).join(" ")} <br/>
                        <span style={{ color: A }}>{words.slice(mid).join(" ") || "Experience."}</span>
                      </>
                    );
                 })()}
               </h2>
               <p style={{ fontSize: 16, color: M, lineHeight: 1.85, marginBottom: 48, maxWidth: 500 }}>
                 &ldquo;{food?.detailedDescription || food?.description || "We don't just serve food; we orchestrate biological responses. In our kitchen, heritage secrets meet high-pressure laboratory physics."}&rdquo;
               </p>
               
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                  {[
                    { label: "Dietary Options", value: food?.dietaryOptions || (food?.isVeg ? "VEG" : food?.isNonVeg ? "Non-Veg" : "VEG & Non-Veg") },
                    { label: "Alcohol Served", value: food?.alcoholServed === true || food?.isAlcoholServed === true ? "Yes" : "No" },
                    { label: "Family Friendly", value: food?.isFamilyFriendly === true || food?.familyFriendly === true ? "Yes" : "No" },
                    { label: "Serve mode", value: food?.serveMode || food?.serviceMode || "Dine-In" }
                  ].map(it => (
                    <div key={it.label}>
                       <p style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: A, marginBottom: 8, fontWeight: 700 }}>{it.label}</p>
                       <p style={{ fontSize: 13, fontWeight: 600, color: FG }}>{it.value}</p>
                    </div>
                  ))}
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
                        <p style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 8 }}>{toDisplayString(food?.cuisineType) || "Signature"}</p>
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

function LocationSection({ food }) {
  const { tokens: { A, FG, M, BG, W, B, S } } = useTheme();

  return (
    <section style={{ background: W, padding: "130px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="03" label="Location & Access" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }} className="chef-grid">
           <Rev delay={0.1}>
             <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 32 }}>Restaurant Location</h3>
             <div style={{ background: S, border: `1px solid ${B}`, padding: 40, display: "flex", flexDirection: "column", gap: 16 }}>
               <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                 <MapPin size={20} color={A} />
                 <div>
                   <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>{food?.meetingLocationName || "Culinary Venue"}</p>
                   <p style={{ fontSize: 13, color: M, marginTop: 4 }}>{food?.meetingAddress || food?.address || "The exact location coordinates and access instructions will be shared upon booking confirmation."}</p>
                 </div>
               </div>
               <div style={{ background: W, border: `1px solid ${B}`, height: 250, marginTop: 16, position: "relative", overflow: "hidden" }}>
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
           </Rev>
           <Rev delay={0.2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                <div>
                  <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 24 }}>Location Details</h3>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16, padding: 0 }}>
                    {[
                      { label: "Address", val: food?.meetingAddress || food?.address },
                      { label: "District", val: food?.meetingDistrict || food?.district },
                      { label: "State", val: food?.meetingState || food?.state || food?.city },
                      { label: "Landmark", val: food?.nearestLandmark || food?.meetingLandmark || food?.landmark || "Near City Center" },
                      { label: "Directions", val: food?.meetingInstructions || food?.directions }
                    ].filter(x => x.val).map((item, i) => (
                      <li key={i} style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 16 }}>
                         <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 100, flexShrink: 0, fontWeight: 600 }}>{item.label}</span>
                         <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.6 }}>{item.val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
           </Rev>
        </div>
      </div>
    </section>
  );
}

function ReservationNoir({ food, hostData }) {
  const { tokens: { A, FG, M, BG, S, B, AL } } = useTheme();

  return (
    <section style={{ background: BG, padding: "150px 36px", borderTop: `1px solid ${B}` }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
         <Soul y={100}>
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 40, padding: 64, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 64 }} className="res-grid">
               <div>
                  <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 24 }}>Contact & Additional Info</p>
                  <h3 className="font-display" style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 700, color: FG, marginBottom: 28 }}>Transcending the <br/><span style={{ color: A }}>Standard Meal.</span></h3>
                  <p style={{ fontSize: 15, color: M, lineHeight: 1.8, maxWidth: 450, marginBottom: 48 }}>
                     {food?.chefOwnerStory || food?.chefStory || food?.ownerStory || food?.story || food?.host?.about || "Our culinary philosophy is rooted in the belief that a meal is more than just sustenance; it is a narrative of heritage, innovation, and biological response."}
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, rowGap: 32 }}>
                     <div>
                        <p style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 12 }}>Managed By</p>
                        <p style={{ fontSize: 14, color: FG, fontWeight: 600 }}>{hostData?.displayName || food?.host?.displayName || "Owner"}</p>
                     </div>
                     <div>
                        <p style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 12 }}>Contact Phone</p>
                        <p style={{ fontSize: 14, color: FG, fontWeight: 700 }}>{hostData?.phone || food?.host?.phone || "9876543675"}</p>
                     </div>
                     <div>
                        <p style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 12 }}>Website or Social Link</p>
                        <a href={food?.website || "https://adithyan-portfolio.pages.dev/"} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: A, fontWeight: 600, textDecoration: "none" }}>
                           {food?.instagram || food?.host?.instagram || "@culinary_craft"}
                        </a>
                     </div>
                     <div>
                        <p style={{ fontSize: 8, letterSpacing: "0.3em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 12 }}>Instagram Handle</p>
                        <p style={{ fontSize: 14, color: FG, fontWeight: 600 }}>{food?.instagram || food?.host?.instagram || "@culinary_craft"}</p>
                     </div>
                  </div>
               </div>
               
               <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ background: AL, borderRadius: 28, padding: 40, border: `1px solid ${B}` }}>
                     <p style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: M, marginBottom: 20 }}>Official Partnership</p>
                     <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {["Molecular Dining", "Sonic Pairings", "Heritage Archives", "Avant Delivery"].map(t => (
                          <div key={t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                             <div style={{ width: 5, height: 5, borderRadius: "50%", background: A }} />
                             <span style={{ fontSize: 13, color: FG, fontWeight: 500 }}>{t}</span>
                          </div>
                        ))}
                     </div>
                     <motion.button whileHover={{ scale: 1.02 }} style={{ width: "100%", marginTop: 32, background: A, color: "#fff", border: "none", borderRadius: 10, padding: "16px", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer" }}>
                        Check Availability
                     </motion.button>
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
            <ScopedStyles />
            <ProgressBar />
            <Cursor />
            
            <CulinaryHero food={food} galleryItems={galleryItems} />
            
            {(() => {
                const curated = Array.isArray(food?.curatedContent) 
                    ? food.curatedContent.map(c => typeof c === 'string' ? c : (c?.name || c?.title || c?.value)).filter(Boolean)
                    : [];
                const tags = Array.isArray(food?.tags)
                    ? food.tags.map(t => typeof t === 'string' ? t : (t?.name || t?.tag || t?.label || t?.value)).filter(Boolean)
                    : [];
                const items = curated.length > 0 ? curated : tags.length > 0 ? tags : ["Avant Cuisine", "Molecular Art", "Sonic Plating", "Epicurean Odyssey"];
                return <Mq items={items} size="sm" bg="var(--S)" accent />;
            })()}
            
            <ChefSection food={food} hostData={hostData} hostAvatar={hostAvatar} />
            
            <Mq items={["Heritage Taste", "Liquid Alchemy", "Curated Palette", "Biological Response"]} bg="var(--S)" />
            
            <DishGallery galleryItems={galleryItems} food={food} />
            
            <Mq items={["Bespoke Reservations", "Finite Tables", "Infinite Experience"]} size="sm" bg="var(--S)" accent />
            
            <LocationSection food={food} />

            <ReservationNoir food={food} hostData={hostData} />
            
            <Footer />
            
        </ScopedThemeProvider>
    );
};

export default FoodDetails;
