import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";

export function Footer() {
  const { tokens: { A, AH, BG, FG, M, B } } = useTheme();
  const footerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"]
  });

  const scaleX = useTransform(scrollYProgress, [0, 0.9, 1], [0.4, 0.95, 1]);
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ["2em", "-0.02em"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.5, 1]);

  return (
    <footer 
      ref={footerRef}
      style={{ background: FG, color: BG, borderTop: `1px solid ${B}`, overflow: "hidden" }}
    >
      <div style={{ borderBottom: `1px solid ${B}`, padding: "120px 36px 80px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }} className="footer-grid">
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: AH, marginBottom: 24, fontWeight: 700 }}>Stay Synchronized</p>
            <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700, color: BG, lineHeight: 1.1, marginBottom: 32 }}>Join the Collective.</h2>
            <div style={{ display: "flex", width: "100%", maxWidth: 500, position: "relative" }}>
              <input 
                type="email" placeholder="YOUR@EMAIL.LIVE"
                style={{ 
                  flex: 1, background: "transparent", border: `1px solid ${B}`,
                  color: BG, fontSize: 11, letterSpacing: "0.1em", padding: "20px 24px", 
                  outline: "none", fontWeight: 500 
                }}
              />
              <motion.button 
                whileHover={{ background: BG, color: FG }}
                style={{ 
                  background: "transparent", color: BG, border: `1px solid ${B}`, borderLeft: 'none',
                  fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", padding: "0 32px", 
                  cursor: "pointer", fontWeight: 700 
                }}
              >
                Connect
              </motion.button>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>
             <div>
                <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 24 }}>Exploration</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   {["Experience", "Sanctuary", "Culinary", "Chronology"].map(l => (
                     <motion.a key={l} href="#" whileHover={{ x: 5, color: AH }} style={{ fontSize: 13, color: BG, textDecoration: "none", fontWeight: 500 }}>{l}</motion.a>
                   ))}
                </div>
             </div>
             <div>
                <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: M, marginBottom: 24 }}>Socials</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   {["Instagram", "X / Twitter", "Behance", "Email"].map(l => (
                     <motion.a key={l} href="#" whileHover={{ x: 5, color: AH }} style={{ fontSize: 13, color: BG, textDecoration: "none", fontWeight: 500 }}>{l}</motion.a>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "80px 0", textAlign: "center", borderBottom: `1px solid ${B}` }}>
        <motion.h1 
          style={{ 
            fontSize: "clamp(4rem, 15vw, 18rem)", fontWeight: 900, color: BG, margin: 0, lineHeight: 0.8,
            scaleX, letterSpacing, opacity, transformOrigin: "center center"
          }}
        >
          LITTLE KNOWN PLANET
        </motion.h1>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
           <div style={{ width: 12, height: 12, borderRadius: "50%", background: A }} />
           <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: BG }}>A Little Known Planet Production</span>
        </div>
        <p style={{ fontSize: 9, letterSpacing: "0.1em", color: M, textTransform: "uppercase" }}>© 2026 — All Rights Allocated.</p>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 80px !important; }
        }
      `}</style>
    </footer>
  );
}
