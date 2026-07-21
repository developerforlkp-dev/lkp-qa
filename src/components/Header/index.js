import React, { useState, useEffect } from "react";
import cn from "classnames";
import styles from "./Header.module.sass";
import { Link, NavLink, useHistory } from "react-router-dom";
import Image from "../Image";
import Notification from "./Notification";
import User from "./User";
import Icon from "../Icon";
import Modal from "../Modal";
import Login from "../Login";
import useDarkMode from "use-dark-mode";
import MobileNavDrawer from "./MobileDrawer/MobileNavDrawer";
import { getCustomerWishlistItems } from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";



const items = [
  {
    menu: [
      {
        title: "Bookings",
        icon: "home",
        url: "/bookings",
      },
    ],
  },
];

const Header = ({ separatorHeader, wide, notAuthorized, hideOnMobile, isHomepage, hasScrolled, leftContent, hideBookings, isBlogPage }) => {
  const history = useHistory();
  const [visibleNav, setVisibleNav] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const darkMode = useDarkMode(false);

  // Check if user is authenticated (has JWT token)
  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("jwtToken");
    return !!token;
  };

  // Determine if we should show login button (if notAuthorized prop is true OR user is not authenticated)
  const shouldShowLogin = notAuthorized || !isAuthenticated();

  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (shouldShowLogin) return;

    // Fetch initial count
    getCustomerWishlistItems()
      .then(items => {
        if (Array.isArray(items)) {
          setWishlistCount(items.length);
        }
      })
      .catch(() => { });

    const handleWishlistChange = (e) => {
      if (e.detail?.saved === true) {
        setWishlistCount(prev => prev + 1);
      } else if (e.detail?.saved === false) {
        setWishlistCount(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("lkp:wishlist-changed", handleWishlistChange);
    return () => {
      window.removeEventListener("lkp:wishlist-changed", handleWishlistChange);
    };
  }, [shouldShowLogin]);

  useEffect(() => {
    if (typeof window === "undefined" || !isHomepage) {
      setShowMobileSearch(false);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const searchPillWrap = document.getElementById("mcsh-floating-pill-wrap");
          if (searchPillWrap) {
            // Find absolute position of the pill wrapper
            const pillRect = searchPillWrap.getBoundingClientRect();
            // If the pill has scrolled completely out of view (above viewport)
            if (pillRect.bottom < 0) {
              setShowMobileSearch(true);
            } else {
              setShowMobileSearch(false);
            }
          } else {
            setShowMobileSearch(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger once on mount
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomepage]);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("open-mobile-search"));
  };

  useEffect(() => {
    const handleOpenNav = () => setVisibleNav(true);
    const handleOpenLogin = () => setVisible(true);
    window.addEventListener("open-mobile-nav", handleOpenNav);
    window.addEventListener("open-login-modal", handleOpenLogin);
    return () => {
      window.removeEventListener("open-mobile-nav", handleOpenNav);
      window.removeEventListener("open-login-modal", handleOpenLogin);
    };
  }, []);

  return (
    <>
      <div
        className={cn(
          styles.header,
          { [styles.headerBorder]: separatorHeader },
          { [styles.wide]: wide },
          { [styles.hideOnMobile]: hideOnMobile }
        )}
      >
        <div className={cn("container", styles.container, { [styles.floatingPill]: isHomepage && hasScrolled })}>
          {leftContent ? (
            leftContent
          ) : (
            <>
              {isBlogPage && (
                <button
                  className={styles.mobileBackButton}
                  onClick={() => history.goBack()}
                  aria-label="Go back"
                >
                  <ChevronLeft size={22} className={styles.backIcon} />
                </button>
              )}
              <Link className={cn(styles.logo, { [styles.blogMobileLogo]: isBlogPage })} to="/">
                <Image
                  className={styles.pic}
                  src="/images/littleplanet-logo.svg"
                  srcDark="/images/littleplanet-logo.svg"
                  alt="FleetHome"
                />
              </Link>
            </>
          )}

          {/* Desktop nav wrapper — hidden on mobile */}
          <div className={styles.wrapper} id="header-center-portal">
            {/* Desktop nav links can go here */}
          </div>

          <div className={cn(styles.rightMenu, { [styles.glassmorphic]: isHomepage && !hasScrolled })}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={darkMode.toggle}
              aria-label={darkMode.value ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode.value ? "Light mode" : "Dark mode"}
            >
              <Icon name={darkMode.value ? "sun" : "moon"} size="24" />
            </button>
            <NavLink
              className={cn(styles.link, styles.bookingsLink)}
              to="/blog"
              activeClassName={styles.active}
            >
              Blog
            </NavLink>
            <NavLink
              className={cn(styles.link, styles.wishlistLink)}
              to="/wishlists"
              activeClassName={styles.active}
            >
              Wishlist
              {wishlistCount > 0 && (
                <span className={styles.wishlistBadge}>{wishlistCount > 99 ? "99+" : wishlistCount}</span>
              )}
            </NavLink>
            <Notification className={styles.notification} />
            {shouldShowLogin ? (
              <button className={styles.login} onClick={() => setVisible(true)}>
                <Icon name="user" size="24" />
              </button>
            ) : (
              <User className={styles.user} items={items} />
            )}

            {/* Mobile Search Icon - Appears when floating pill is scrolled past */}
            <AnimatePresence>
              {showMobileSearch && (
                <motion.button
                  className={styles.mobileSearchBtn}
                  onClick={handleOpenSearch}
                  initial={{ opacity: 0, width: 0, scale: 0.8, marginLeft: 0 }}
                  animate={{ opacity: 1, width: "36px", scale: 1, marginLeft: "12px" }}
                  exit={{ opacity: 0, width: 0, scale: 0.8, marginLeft: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  aria-label="Search"
                >
                  <Icon name="search" size="20" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Burger — mobile only, opens the slide-in drawer */}
            <button
              className={cn(styles.burger, { [styles.active]: visibleNav, [styles.blogBurger]: isBlogPage })}
              onClick={() => setVisibleNav(true)}
              aria-label="Open menu"
            ></button>
          </div>
        </div>
      </div>

      {/* Login modal */}
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <Login onClose={() => setVisible(false)} />
      </Modal>

      {/* Mobile nav drawer — slide-in from right, mobile only */}
      <MobileNavDrawer
        visible={visibleNav}
        onClose={() => setVisibleNav(false)}
        shouldShowLogin={shouldShowLogin}
        onLoginClick={() => setVisible(true)}
        darkMode={darkMode}
        isAuthenticated={isAuthenticated()}
        wishlistCount={wishlistCount}
      />
    </>
  );
};

export default Header;
