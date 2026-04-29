import React from "react";
import { useHistory } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../JUI/Theme";

const ProductNavbar = ({ top = 20, left = 30, theme: propTheme, isFixed = true }) => {
  const history = useHistory();
  const { tokens: { A, FG, BG }, theme: themeMode } = useTheme();
  
  // Use propTheme if provided, otherwise fallback to current theme mode
  const currentTheme = propTheme || themeMode;
  const isLight = currentTheme === "light";

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => history.goBack()}
      style={{
        position: isFixed ? "fixed" : "absolute",
        top: top,
        left: left,
        background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 15, 15, 0.95)",
        border: `1px solid ${A || "#0097B2"}`,
        borderRadius: "0px", // Perfectly square
        height: 32,
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        color: A || "#0097B2",
        zIndex: 10001,
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s ease",
      }}
      whileHover={{ 
        scale: 1.05, 
        background: A || "#0097B2",
        color: "#FFFFFF",
      }}
      whileTap={{ scale: 0.95 }}
    >
      <ChevronLeft size={14} strokeWidth={3} />
      <span style={{ 
        fontSize: 10, 
        fontWeight: 800, 
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        fontFamily: "'Inter', sans-serif"
      }}>
        back
      </span>
    </motion.button>
  );
};

export default ProductNavbar;
