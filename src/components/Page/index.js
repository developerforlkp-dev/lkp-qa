import React, { useEffect, useState, useRef } from "react";
import { withRouter, useLocation } from "react-router-dom";
import { clearAllBodyScrollLocks } from "body-scroll-lock";
import { motion } from "framer-motion";
import cn from "classnames";
import styles from "./Page.module.sass";
import Header from "../Header";
import { Footer } from "../JUI/Footer";
import { useTheme } from "../JUI/Theme";

const Page = ({
  separatorHeader = true,
  children,
  fooferHide,
  wide,
  notAuthorized,
  hideHeaderOnMobile,
  hideHeader,
  headerLeftContent,
  hideBookings
}) => {
  const { pathname } = useLocation();
  const { tokens: { B, BG }, theme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  const shouldAutoHideHeader = (pathname) => {
    const path = pathname.toLowerCase();
    if (
      path.includes("checkout") ||
      path.includes("complete") ||
      path.includes("payment") ||
      path.includes("booking") ||
      path.includes("settings") ||
      path.includes("profile") ||
      path.includes("support") ||
      path.includes("messages")
    ) {
      return false;
    }
    return true;
  };

  const autoHideEnabled = shouldAutoHideHeader(pathname);
  const homeRoutes = ["/", "/experience", "/experiences", "/events", "/stays", "/food", "/places"];
  const isDetailPage = pathname.startsWith("/experience/") || pathname.startsWith("/event") || pathname.startsWith("/stay-details") || pathname.startsWith("/food-details") || pathname.startsWith("/place-details") || pathname.startsWith("/wishlists");
  const isHomeRoute = homeRoutes.includes(pathname) || isDetailPage;

  useEffect(() => {
    clearAllBodyScrollLocks();
    setHeaderVisible(true);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !autoHideEnabled) return;

    let ticking = false;
    const threshold = 10;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const lastScrollY = lastScrollYRef.current;
          const diff = currentScrollY - lastScrollY;

          if (currentScrollY <= 50) {
            setHeaderVisible(true);
          } else if (Math.abs(diff) > threshold) {
            if (diff > 0) {
              setHeaderVisible(false);
            } else {
              setHeaderVisible(true);
            }
            lastScrollYRef.current = currentScrollY;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [autoHideEnabled]);

  const E = [0.22, 1, 0.36, 1];

  return (
    <div className={styles.page}>
      {/* Header Background Layer (Under the Hero) */}
      {!hideHeader && (
        <div 
          className={cn("slim-header-bg", { "auto-hide": autoHideEnabled && !headerVisible, "is-detail-page": isDetailPage })}
          style={{ 
            position: separatorHeader ? "sticky" : "fixed", top: 0, left: 0, right: 0, 
            height: (scrolled || separatorHeader) ? "70px" : "0px",
            zIndex: 90, 
            background: (scrolled && !isHomeRoute || separatorHeader) ? BG : "transparent", 
            backdropFilter: "none", 
            borderBottom: "none" 
          }}
        />
      )}

      {/* Header Content Layer (Above the Hero) */}
      {!hideHeader && (
        <motion.div
          className={cn("slim-header-wrapper", { "force-dark": !scrolled && !separatorHeader && theme === "light" && !isHomeRoute, "auto-hide": autoHideEnabled && !headerVisible && !isHomeRoute, "is-detail-page": isDetailPage })}
          initial={{ y: -70, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.85, ease: E }}
          style={{ 
            position: separatorHeader ? "sticky" : "fixed", top: 0, left: 0, right: 0, 
            zIndex: 100, 
            background: (scrolled && !isHomeRoute) ? BG : "transparent",
            boxShadow: (scrolled && !isHomeRoute) ? "0px 2px 10px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.4s", 
            marginTop: separatorHeader ? "-70px" : "0", // Account for the background div in sticky mode
          }}
        >
          <Header
            separatorHeader={separatorHeader}
            wide={wide}
            notAuthorized={notAuthorized}
            hideOnMobile={hideHeaderOnMobile}
            isHomepage={isHomeRoute}
            hasScrolled={scrolled}
            leftContent={headerLeftContent}
            hideBookings={hideBookings}
          />
        </motion.div>
      )}
      
      <div className={styles.inner}>
        {children}
      </div>

      {!fooferHide && <Footer />}

      <style>{`
        .slim-header-wrapper > div { padding: 4px 0 !important; }
        .slim-header-wrapper img { width: 140px !important; }
        
        .force-dark [class*="Header_link"], 
        .force-dark [class*="Header_bookingsLink"],
        .force-dark [class*="Header_wishlistLink"],
        .force-dark [class*="Header_themeToggle"] svg,
        .force-dark [class*="Header_user"] svg,
        .force-dark [class*="Header_login"] svg {
          color: #FCFCFD !important;
          fill: #FCFCFD !important;
        }

        @media (max-width: 1023px) {
          .slim-header-bg.auto-hide,
          .slim-header-wrapper.auto-hide {
            transform: translateY(-70px) !important;
          }
          .slim-header-bg,
          .slim-header-wrapper {
            transition: transform 0.3s ease-in-out, height 0.4s, background 0.4s, margin 0.4s !important;
          }
        }
        
        @media (max-width: 768px) {
          .slim-header-bg.is-detail-page {
            height: 60px !important;
          }
          .slim-header-wrapper.is-detail-page {
            margin-top: ${separatorHeader ? "-60px" : "0"} !important;
          }
          .slim-header-wrapper.is-detail-page > div {
            padding: 12px 0 !important;
          }
          .slim-header-wrapper.is-detail-page [class*="Header_container"] {
            padding: 0 16px !important;
          }
          .slim-header-wrapper.is-detail-page img {
            height: 44px !important;
            width: auto !important;
          }
          .slim-header-wrapper.is-detail-page [class*="Header_burger"] {
             transform: none;
             margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default withRouter(Page);
