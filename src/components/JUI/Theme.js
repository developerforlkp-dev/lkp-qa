import React, { createContext, useContext, useEffect, useState } from "react";
import useDarkMode from "use-dark-mode";

/* ─── TOKENS (Light mode + Premium Teal) ─────────── */
export const THEMES = {
  light: {
    A: "#0097B2",    // Corporate Teal
    AH: "#008CA5",
    AL: "rgba(0, 151, 178, 0.08)",
    BG: "#FBFBF9",   // Crisp Silk
    FG: "#0F0F0F",   // Deepest Ink
    M: "#7A7A77",    // Slate Muted
    S: "#F3F3F1",    // Soft Bone
    B: "#E6E6E3",    // Subtle Stone
    W: "#FFFFFF",
    E: "#D32F2F",    // Error Red
    EL: "rgba(211, 47, 47, 0.03)" // Subtle Error Tint
  },
  dark: {
    A: "#0097B2",    // Corporate Teal
    AH: "#0AADCA",
    AL: "rgba(0, 151, 178, 0.15)",
    BG: "#080808",   // Absolute Obsidian
    FG: "#EBEBE6",    // Silk Dust
    M: "#8C8C88",    // Warm Charcoal
    S: "#111111",    // Shadow Depth
    B: "#1F1F1F",    // Graphite Border
    W: "#000000",
    E: "#FF5252",    // Error Red (Vibrant)
    EL: "rgba(255, 82, 82, 0.08)" // Subtle Error Tint
  }
};

export const ThemeContext = createContext({ 
  theme: "light", 
  toggleTheme: () => {}, 
  tokens: THEMES.light 
});

export function useTheme() { 
  return useContext(ThemeContext); 
}

export function ThemeProvider({ children }) {
  const darkMode = useDarkMode(false);
  const theme = darkMode.value ? "dark" : "light";
  
  useEffect(() => {
    const root = document.documentElement;
    const tokens = THEMES[theme];
    
    // Inject tokens as CSS variables
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    document.body.style.background = tokens.BG;
    document.body.style.color = tokens.FG;
    root.setAttribute('data-theme', theme);
  }, [theme]);
  
  const toggleTheme = () => darkMode.toggle();
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, tokens: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}
