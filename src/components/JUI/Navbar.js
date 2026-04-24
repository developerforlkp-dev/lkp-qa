import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "./Theme";
import { E } from "./UI";

export function Navbar() {
  const { tokens: { A, BG, FG, M, S, B, W }, theme, toggleTheme } = useTheme();
  const [sc, setSc] = useState(false);
  const [op, setOp] = useState(false);
  
  const nav = [
    { label: "Home", href: "/" },
    { label: "Experience", href: "/experience-product" },
    { label: "Stay", href: "/stays" },
    { label: "Food", href: "/food-details" },
    { label: "Place", href: "/place-details" },
    { label: "Bookings", href: "/bookings" }
  ];

  useEffect(() => {
    const h = () => setSc(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -72, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.85, ease: E }}
        style={{ 
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, 
          transition: "all 0.4s", 
          background: sc ? (theme === 'light' ? "rgba(251,251,249,0.92)" : "rgba(8,8,8,0.92)") : "transparent", 
          backdropFilter: sc ? "blur(20px)" : "none", 
          borderBottom: sc ? `1px solid ${B}` : "1px solid transparent" 
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 36px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ fontSize: 19, fontWeight: 700, color: FG, textDecoration: "none", letterSpacing: "-0.01em", fontFamily: 'inherit' }}>
            <motion.span whileHover={{ color: A }}>SOLSTICE</motion.span>
          </Link>

          <nav style={{ display: "flex", gap: 32 }} className="desk-only">
            {nav.map((l, i) => (
              <motion.div key={l.label}
                initial={{ opacity: 0, y: -8 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.12 + i * 0.06 }}>
                <Link to={l.href}
                  style={{ 
                    fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", 
                    color: M, textDecoration: "none", fontWeight: 500, display: 'block' 
                  }}>
                  <motion.span whileHover={{ color: A, y: -1 }} style={{ display: 'inline-block' }}>{l.label}</motion.span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={toggleTheme} style={{ background: S, border: `1px solid ${B}`, borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: FG, cursor: "pointer", transition: "all 0.3s" }}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link to="/bookings"
              className="shimmer-cta"
              style={{ 
                fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", 
                padding: "9px 22px", textDecoration: "none", display: "inline-block", 
                borderRadius: 4, background: A, color: '#fff', fontWeight: 700 
              }}>
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>My Bookings</motion.span>
            </Link>
            <button onClick={() => setOp(!op)} style={{ background: "none", border: "none", color: FG, cursor: "pointer", padding: 4, display: 'none' }} className="mob-toggle">
              {op ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {op && (
          <motion.div 
            initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 52px) 34px)" }} 
            animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 52px) 34px)" }} 
            exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 52px) 34px)" }} 
            transition={{ duration: 0.5, ease: E }}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: W, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}
          >
            {nav.map((l, i) => (
              <Link key={l.label} to={l.href} onClick={() => setOp(false)}
                style={{ fontSize: "2.4rem", fontWeight: 700, color: FG, textDecoration: "none" }}>
                <motion.span initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ color: A, x: 12 }}>
                  {l.label}
                </motion.span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @media (max-width: 900px) {
          .desk-only { display: none !important; }
          .mob-toggle { display: block !important; }
        }
        .shimmer-cta {
          position: relative;
          overflow: hidden;
        }
        .shimmer-cta::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: rotate(45deg);
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
      `}</style>
    </>
  );
}
