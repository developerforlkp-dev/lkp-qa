import React, { useEffect, useState, useMemo, createContext, useContext, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView, animate, useAnimationFrame } from "framer-motion";
import { 
  MapPin, Clock, Ticket, Star, Calendar, ArrowDown, ExternalLink, Map, Navigation, 
  Phone, Globe, Send, Info, User, Check, XCircle, Briefcase, ChevronRight 
} from "lucide-react";
import cn from "classnames";
import Loader from "../../components/Loader";
import Browse from "../../components/Browse";
import { browse2 } from "../../mocks/browse";
import { getPlaceDetails, getHost } from "../../utils/api";

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
      <div ref={wrapperRef} className="place-details-premium" style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

const E = [0.22, 1, 0.36, 1];

const ScopedStyles = () => (
  <style>{`
    .place-details-premium {
      font-family: var(--font-inter, system-ui, sans-serif);
      overflow-x: hidden;
      cursor: none;
      transition: background 0.6s cubic-bezier(0.22, 1, 0.36, 1), color 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      position: relative;
    }
    .place-details-premium a, .place-details-premium button { cursor: none; }
    @keyframes marquee-l { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @keyframes marquee-r { from{transform:translateX(-50%)} to{transform:translateX(0)} }
    @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1deg)} }
    
    .place-details-premium .font-display { font-family: var(--font-fraunces, Georgia, serif); }
    .place-details-premium .mq-l { display: flex; white-space: nowrap; animation: marquee-l 30s linear infinite; }
    .place-details-premium .mq-r { display: flex; white-space: nowrap; animation: marquee-r 34s linear infinite; }
    
    #cur-dot { position: fixed; width: 6px; height: 6px; background: var(--A); border-radius: 50%; pointer-events: none; z-index: 99999; transform: translate(-50%, -50%); }
    #cur-ring { position: fixed; width: 38px; height: 38px; border: 1.5px solid var(--AL); border-radius: 50%; pointer-events: none; z-index: 99998; transform: translate(-50%, -50%); }
    
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
function PlaceHero({ place, galleryItems }) {
  const { tokens: { A, FG, M, W, B } } = useTheme();
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start start", "end start"] });
  
  const baseX = useMotionValue(0);
  const [drag, setDrag] = useState(false);

  useAnimationFrame((t, delta) => {
    if (!drag) {
      // Increased speed from 0.04 to 0.12 for better visibility
      baseX.set(baseX.get() - delta * 0.12);
    }
  });

  // Split gallery items into two rows
  const row1 = galleryItems.slice(0, Math.ceil(galleryItems.length / 2));
  const row2 = galleryItems.slice(Math.ceil(galleryItems.length / 2));
  
  const itemWidth1 = 440, itemWidth2 = 520, gap = 40;
  // Ensure we have at least one item width for range
  const range1 = Math.max((row1.length || 1) * (itemWidth1 + gap), 1);
  const range2 = Math.max((row2.length || 1) * (itemWidth2 + gap), 1);

  const x1 = useTransform(baseX, (v) => {
    // Standard modulo for seamless loop
    const modX = ((v % range1) - range1) % range1;
    return `${modX}px`;
  });
  
  const x2 = useTransform(baseX, (v) => {
    // Reverse or different speed for row 2
    const modX = ((-v * 0.8 % range2) - range2) % range2;
    return `${modX}px`;
  });

  // Duplicate items enough times to fill large screens (min 12 items)
  const fillCount = 12;
  const items1 = row1.length ? Array(fillCount).fill(row1).flat() : Array(fillCount).fill("https://picsum.photos/seed/p1/400/500");
  const items2 = row2.length ? Array(fillCount).fill(row2).flat() : Array(fillCount).fill("https://picsum.photos/seed/p3/400/500");

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
        <motion.div style={{ x: x1, y: useTransform(scrollYProgress, [0, 0.3], [0, -40]), display: "flex", gap, paddingLeft: gap }}>
          {items1.map((img, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05, rotate: 1, zIndex: 100 }} style={{ flexShrink: 0, width: itemWidth1, height: itemWidth1 * 1.25, borderRadius: 24, overflow: "hidden", border: `1px solid ${B}`, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.1)", transition: "transform 0.4s" }}>
              <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            </motion.div>
          ))}
        </motion.div>

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

        <motion.div style={{ x: x2, y: useTransform(scrollYProgress, [0, 0.3], [0, 40]), display: "flex", gap, paddingLeft: 100 }}>
          {items2.map((img, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05, rotate: -1, zIndex: 100 }} style={{ flexShrink: 0, width: itemWidth2, height: itemWidth2 * 0.75, borderRadius: 24, overflow: "hidden", border: `1px solid ${B}`, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.1)", transition: "transform 0.4s" }}>
              <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        onPan={(e, info) => baseX.set(baseX.get() + info.delta.x)}
        onPanStart={() => setDrag(true)}
        onPanEnd={() => setDrag(false)}
        style={{ position: "absolute", inset: 0, zIndex: 100, cursor: drag ? "grabbing" : "grab" }}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{ position: "absolute", bottom: 40, left: "50%", x: "-50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 60 }}>
        <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: M }}>Discover more</span>
        <ArrowDown size={14} color={A} />
      </motion.div>
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
                     <p style={{ fontSize: 15, fontWeight: 700, color: FG }}>{hostData?.displayName || "Lead Curator"}</p>
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
                   <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: FG, marginBottom: 32 }}>{hostData?.displayName || "Tourism Authority"}</h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <a href={`tel:${hostData?.phone}`} style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", fontSize: 14, color: FG, fontWeight: 600 }}>
                        <Phone size={18} color={A} /> {hostData?.phone || "Contact via App"}
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

/* ─── MAIN COMPONENT ─────────── */
const PlaceDetails = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    const [place, setPlace] = useState(null);
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
                const data = await getPlaceDetails(id);
                if (!mounted) return;

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
                        getHost(hostId).then(h => mounted && setHostData(h || null)).catch(e => console.warn(e));
                    }
                }
                setLoading(false);
            } catch (e) {
                console.error("Failed to load place details", e);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [id]);

    const hostAvatar = useMemo(() => {
        const avatarUrl = hostData?.profilePhotoUrl || place?.host?.profilePhotoUrl;
        return avatarUrl ? formatImageUrl(avatarUrl) : null;
    }, [hostData, place]);

    if (loading && !place) {
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
            
        </ScopedThemeProvider>
    );
};

export default PlaceDetails;
