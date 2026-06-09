import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";
import { Instagram, Facebook, Youtube, Linkedin, Globe } from "lucide-react";

const WhatsAppIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.56 0 .24 5.32.24 11.84c0 2.08.54 4.12 1.58 5.92L0 24l6.41-1.68a11.78 11.78 0 0 0 5.67 1.45h.01c6.52 0 11.84-5.32 11.84-11.84 0-3.16-1.23-6.13-3.41-8.45ZM12.09 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.8 1 1.01-3.71-.23-.38a9.86 9.86 0 0 1-1.52-5.28C2.15 6.41 6.66 1.9 12.09 1.9c2.63 0 5.1 1.02 6.95 2.88a9.78 9.78 0 0 1 2.9 6.96c0 5.43-4.42 9.86-9.85 9.86Zm5.41-7.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5a9.1 9.1 0 0 1-1.68-2.08c-.18-.3-.02-.47.14-.62.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.23-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
  </svg>
);

const PinterestIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/>
  </svg>
);

export function Footer() {
  const { tokens: { A, AH }, theme } = useTheme();
  const footerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"]
  });

  const scaleX = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 0.97, 1]);
  const brandLetterSpacing = useTransform(scrollYProgress, [0, 1], ["0.45em", "0.25em"]);
  const taglineLetterSpacing = useTransform(scrollYProgress, [0, 1], ["0.6em", "0.4em"]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 1], [0, 0.8, 1]);
  const leftX = useTransform(scrollYProgress, [0, 1], [-100, 0]);
  const rightX = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const centerY = useTransform(scrollYProgress, [0, 1], [25, 0]);

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


      <div style={{ padding: "50px 20px 45px 20px", textAlign: "center", borderBottom: "1px solid #222", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <motion.div
          style={{ opacity, display: "flex", alignItems: "center", justifyContent: "center" }}
          animate={{ 
            y: [0, -6, 0],
            scale: [1, 1.08, 1],
            filter: [
              "drop-shadow(0 0 2px rgba(0,151,178,0.2))",
              "drop-shadow(0 0 10px rgba(0,151,178,0.5))",
              "drop-shadow(0 0 2px rgba(0,151,178,0.2))"
            ]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Globe size={28} color="#0097B2" strokeWidth={1.5} />
        </motion.div>
        <div>
          <motion.h2 
            className="font-display"
            style={{ 
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)", 
              fontWeight: 800, 
              color: "#FFFFFF", 
              margin: "0 0 10px 0", 
              lineHeight: 1.2,
              letterSpacing: brandLetterSpacing,
              opacity,
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "center",
              gap: "0.3em",
              flexWrap: "wrap"
            }}
          >
            <motion.span style={{ x: leftX, display: "inline-block" }}>LITTLE</motion.span>
            <motion.span style={{ y: centerY, display: "inline-block" }}>KNOWN</motion.span>
            <motion.span style={{ x: rightX, display: "inline-block" }}>PLANET</motion.span>
          </motion.h2>
          <motion.p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#8C8C88",
              marginTop: "10px",
              marginBottom: 0,
              letterSpacing: taglineLetterSpacing,
              textTransform: "uppercase",
              opacity
            }}
          >
            Curating Extraordinary Journeys
          </motion.p>
        </div>
      </div>

      <div className="bottom-footer-bar">
        <div className="bottom-footer-inner">
          <div className="bottom-footer-links">
            <Link to="/privacy-policy" className="bottom-footer-link">Privacy</Link>
            <span className="bottom-footer-dot">•</span>
            <Link to="/terms-of-service" className="bottom-footer-link">Terms & Conditions</Link>
            <span className="bottom-footer-dot">•</span>
            <span className="bottom-footer-text">Call Us: +91 8104 954 254</span>
          </div>
          
          <div className="bottom-footer-socials">
            <a href="#" className="social-icon-link"><WhatsAppIcon size={18} /></a>
            <a href="#" className="social-icon-link"><Instagram size={18} strokeWidth={2} /></a>
            <a href="#" className="social-icon-link"><PinterestIcon size={18} /></a>
            <a href="#" className="social-icon-link"><Facebook size={18} strokeWidth={2} /></a>
            <a href="#" className="social-icon-link"><Youtube size={18} strokeWidth={2} /></a>
            <a href="#" className="social-icon-link"><Linkedin size={18} strokeWidth={2} /></a>
          </div>
        </div>
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
        .bottom-footer-bar {
          background: #111111;
          border-top: 1px solid #222222;
          padding: 16px 36px;
        }
        .bottom-footer-inner {
          max-width: 1320px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }
        .bottom-footer-links {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .bottom-footer-link, .bottom-footer-text {
          font-size: 13px;
          font-weight: 500;
          color: #E0E0E0 !important;
          text-decoration: none;
          transition: color 0.2s ease;
          letter-spacing: 0.02em;
        }
        .bottom-footer-link:hover {
          color: #FFFFFF !important;
        }
        .bottom-footer-dot {
          color: #555555 !important;
          font-size: 12px;
        }
        .bottom-footer-socials {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .social-icon-link {
          color: #E0E0E0 !important;
          transition: transform 0.2s ease, color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .social-icon-link:hover {
          color: #FFFFFF !important;
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .bottom-footer-bar {
            padding: 24px 20px;
          }
          .bottom-footer-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
          .bottom-footer-socials {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
