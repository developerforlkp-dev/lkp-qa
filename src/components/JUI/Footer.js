import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";

export function Footer() {
  const { tokens: { A, AH }, theme } = useTheme();
  const footerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"]
  });

  const scaleX = useTransform(scrollYProgress, [0, 0.4, 1], [0.85, 0.95, 1]);
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ["0.5em", "-0.02em"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 1, 1]);

  return (
    <footer 
      ref={footerRef}
      className="cinematic-footer"
      style={{ 
        background: "#080808", 
        color: "#FFFFFF", 
        borderTop: "1px solid #222", 
        overflow: "hidden",
        position: "relative",
        zIndex: 10
      }}
    >
      <div style={{ borderBottom: "1px solid #222", padding: "120px 36px 80px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }} className="footer-grid">
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#8C8C88", marginBottom: 24, fontWeight: 700 }}>Stay Synchronized</p>
            <h2 className="font-display" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1, marginBottom: 32 }}>Join the Collective.</h2>
            <div style={{ display: "flex", width: "100%", maxWidth: 500, position: "relative" }}>
              <input 
                type="email" placeholder="YOUR@EMAIL.LIVE"
                style={{ 
                  flex: 1, background: "transparent", border: "1px solid #333",
                  color: "#FFFFFF", fontSize: 11, letterSpacing: "0.1em", padding: "20px 24px", 
                  outline: "none", fontWeight: 500 
                }}
              />
              <motion.button 
                whileHover={{ background: "#FFFFFF", color: "#000000" }}
                style={{ 
                  background: "transparent", color: "#FFFFFF", border: "1px solid #333", borderLeft: 'none',
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
                <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8C8C88", marginBottom: 24 }}>Exploration</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   {["Experience", "Sanctuary", "Culinary", "Chronology"].map(l => (
                     <motion.a key={l} href="#" whileHover={{ x: 5, color: "#0097B2" }} style={{ fontSize: 13, color: "#EBEBE6", textDecoration: "none", fontWeight: 500 }}>{l}</motion.a>
                   ))}
                </div>
             </div>
             <div>
                <p style={{ fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8C8C88", marginBottom: 24 }}>Socials</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                   {["Instagram", "X / Twitter", "Behance", "Email"].map(l => (
                     <motion.a key={l} href="#" whileHover={{ x: 5, color: "#0097B2" }} style={{ fontSize: 13, color: "#EBEBE6", textDecoration: "none", fontWeight: 500 }}>{l}</motion.a>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "80px 0", textAlign: "center", borderBottom: "1px solid #222" }}>
        <motion.h1 
          className="font-display"
          style={{ 
            fontSize: "clamp(4rem, 15vw, 18rem)", fontWeight: 900, color: "#FFFFFF", margin: 0, lineHeight: 0.8,
            scaleX, letterSpacing, opacity, transformOrigin: "center center"
          }}
        >
          LITTLE KNOWN PLANET
        </motion.h1>
      </div>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "40px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
           <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#0097B2" }} />
           <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, color: "#FFFFFF" }}>A Little Known Planet Production</span>
        </div>
        <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "#8C8C88", textTransform: "uppercase" }}>© 2026 — All Rights Allocated.</p>
      </div>

      <style>{`
        body .cinematic-footer h1, 
        body .cinematic-footer h2, 
        body .cinematic-footer h3,
        body .cinematic-footer a,
        body .cinematic-footer button,
        body .cinematic-footer input {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        body .cinematic-footer p, 
        body .cinematic-footer span,
        body .cinematic-footer label {
          color: #8C8C88 !important;
          -webkit-text-fill-color: #8C8C88 !important;
        }
        @media (max-width: 1024px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 80px !important; }
        }
      `}</style>
    </footer>
  );
}
