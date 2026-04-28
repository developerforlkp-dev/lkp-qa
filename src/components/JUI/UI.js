import React, { useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useMotionValue, useInView, useTransform, animate } from "framer-motion";
import { useTheme } from "./Theme";

export const E = [0.22, 1, 0.36, 1];

/* ─── CURSOR ─────────────────────────────────────── */
export function Cursor() {
  const { tokens: { A } } = useTheme();
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
      <motion.div id="cur-dot" style={{ left: x, top: y, position: 'fixed', pointerEvents: 'none', zIndex: 9999, width: 8, height: 8, background: A, borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
      <motion.div id="cur-ring" style={{ left: sx, top: sy, position: 'fixed', pointerEvents: 'none', zIndex: 9998, width: 40, height: 40, border: `1px solid ${A}`, borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
    </>
  );
}

/* ─── SCROLL PROGRESS ────────────────────────────── */
export function ProgressBar() {
  const { tokens: { A } } = useTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 2, background: A, zIndex: 9996 }} />
  );
}

/* ─── REVEAL ─────────────────────────────────────── */
export function Rev({ children, delay = 0, style = {} }) {
  const r = useRef(null);
  const v = useInView(r, { once: true, margin: "-60px" });
  return (
    <motion.div ref={r} initial={{ opacity: 0, y: 44 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: E, delay }} style={style}>
      {children}
    </motion.div>
  );
}

/* ─── CHAR SPLIT ─────────────────────────────────── */
export function Chars({ text, cls = "", style = {}, delay = 0 }) {
  const r = useRef(null);
  const v = useInView(r, { once: true, margin: "-40px" });
  return (
    <div ref={r} className={cls} style={style}>
      {text.split("").map((c, i) => (
        <motion.span key={i} initial={{ y: "105%", opacity: 0 }} animate={v ? { y: 0, opacity: 1 } : {}} transition={{ duration: 0.7, ease: E, delay: delay + i * 0.028 }} style={{ display: "inline-block", whiteSpace: c === " " ? "pre" : "normal" }}>
          {c}
        </motion.span>
      ))}
    </div>
  );
}

/* ─── COUNTER ────────────────────────────────────── */
export function Count({ to, suffix = "" }) {
  const r = useRef(null);
  const v = useInView(r, { once: true });
  useEffect(() => {
    if (!v || !r.current) return;
    const c = animate(0, to, { duration: 2, ease: "easeOut", onUpdate: n => { if (r.current) r.current.textContent = Math.round(n) + suffix } });
    return () => c.stop();
  }, [v, to, suffix]);
  return <span ref={r}>0{suffix}</span>;
}

/* ─── SPIN SVG BADGE ─────────────────────────────── */
export function SpinBadge() {
  const { tokens: { A } } = useTheme();
  const t = "SOLSTICE · EDITION 01 · JUNE 2026 · MUMBAI · ";
  return (
    <div style={{ position: "relative", width: 130, height: 130 }}>
      <svg viewBox="0 0 130 130" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: 'spin 20s linear infinite' }}>
        <defs><path id="cp" d="M65,65 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" /></defs>
        <text fill={A} fontSize="8.5" fontFamily="Inter,sans-serif" letterSpacing="3.8" fontWeight="500">
          <textPath href="#cp">{t}</textPath>
        </text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 8, height: 8, borderRadius: "50%", background: A }} />
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── IMAGE RING ─────────────────────────────────── */
export function ImageRing() {
  const { tokens: { B } } = useTheme();
  const imgs = ["abstract.png", "art.png", "concert.png", "crowd.png", "dancer.png", "venue.png"];
  const R = 150; 

  return (
    <div style={{ position: "relative", width: 440, height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      >
        {imgs.map((img, i) => {
          const ang = (i / imgs.length) * Math.PI * 2;
          const x = (Math.cos(ang) * R).toFixed(3);
          const y = (Math.sin(ang) * R).toFixed(3);
          return (
            <div key={img} style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                style={{ width: 84, height: 110, borderRadius: 16, border: `1px solid ${B}`, overflow: "hidden", background: "#000", boxShadow: "0 12px 40px -10px rgba(0,0,0,0.3)" }}
              >
                <img src={`/gallery/${img}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
              </motion.div>
            </div>
          );
        })}
      </motion.div>
      <div style={{ position: "relative", zIndex: 10 }}>
        <SpinBadge />
      </div>
    </div>
  );
}

/* ─── MARQUEE ────────────────────────────────────── */
export function Mq({ items, dir = "l", size = "sm", bg, accent = false }) {
  const { tokens: { A, BG, M, B } } = useTheme();
  const bgColor = bg ?? BG;
  const sep = "  ·  ";
  const chunk = items.join(sep) + sep;
  const repeated = chunk + chunk;
  const fsMap = { sm: "0.65rem", lg: "clamp(2.2rem,5vw,4rem)", xl: "clamp(3.5rem,9vw,7.5rem)" };
  const fs = fsMap[size];
  const col = accent ? A : M;
  const padV = size === "xl" ? "28px 0" : size === "lg" ? "20px 0" : "11px 0";
  
  return (
    <div style={{ overflow: "hidden", background: bgColor, borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}`, padding: padV }}>
      <div style={{ 
        display: 'flex', 
        width: 'max-content',
        animation: `${dir === 'l' ? 'marquee-l' : 'marquee-r'} 40s linear infinite` 
      }}>
        {[0, 1].map(i => (
          <span key={i} style={{ 
            fontSize: fs, 
            fontWeight: size !== "sm" ? 700 : 500, 
            color: col, 
            whiteSpace: "nowrap", 
            letterSpacing: size === "sm" ? "0.28em" : "-0.01em", 
            textTransform: size === "sm" ? "uppercase" : "none", 
            paddingRight: size === "sm" ? 32 : 56,
            fontFamily: size !== "sm" ? 'inherit' : 'monospace'
          }}>
            {repeated}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes marquee-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

/* ─── SECTION HEADER ─────────────────────────────── */
export function SHdr({ idx, label }) {
  const { tokens: { A, B } } = useTheme();
  return (
    <Rev style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 52 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.35em", fontWeight: 600, textTransform: "uppercase", color: A, whiteSpace: "nowrap" }}>{idx} — {label}</span>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} style={{ flex: 1, height: 1, background: B, transformOrigin: "left" }} />
    </Rev>
  );
}

/* ─── SOUL (2-WAY SCROLL) ────────────────────────── */
export function Soul({ children, y = 80, s = 0.05, r = 0, delay = 0, style = {} }) {
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
