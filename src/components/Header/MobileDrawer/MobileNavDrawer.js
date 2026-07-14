import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import { NavLink } from "react-router-dom";
import { Heart } from "lucide-react";
import cn from "classnames";
import Image from "../../Image";
import Icon from "../../Icon";
import styles from "./MobileNavDrawer.module.sass";

const MobileNavDrawer = ({
  visible,
  onClose,
  shouldShowLogin,
  onLoginClick,
  darkMode,
  isAuthenticated,
  wishlistCount,
}) => {
  const scrollRef = useRef(null);

  // ESC key to close
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleKeyDown]);

  // Lock body scroll while open
  useEffect(() => {
    const el = scrollRef.current;
    if (visible && el) {
      disableBodyScroll(el, { reserveScrollBarGap: true });
    }
    return () => {
      if (el) enableBodyScroll(el);
    };
  }, [visible]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("email");
    onClose();
    window.location.href = "/";
  };

  return createPortal(
    <>
      {/* Dark overlay */}
      <div
        className={cn(styles.overlay, { [styles.overlayVisible]: visible })}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in drawer from right */}
      <div
        ref={scrollRef}
        className={cn(styles.drawer, { [styles.drawerOpen]: visible })}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* ── Drawer Header ── */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerLogo}>
            <Image
              className={styles.logoPic}
              src="/images/littleplanet-logo.svg"
              srcDark="/images/littleplanet-logo.svg"
              alt="Little Known Planet"
            />
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <Icon name="close" size="16" />
          </button>
        </div>

        {/* ── Divider ── */}
        <div className={styles.divider} />

        {/* ── Scrollable Body: Nav + Account ── */}
        <div className={styles.drawerBody}>
          {/* Nav Links */}
          <nav className={styles.nav}>
            {isAuthenticated && (
              <NavLink
                className={styles.navLink}
                to="/bookings"
                activeClassName={styles.navLinkActive}
                onClick={onClose}
              >
                <span className={styles.navIcon}>
                  <Icon name="home" size="20" />
                </span>
                <span className={styles.navLabel}>Bookings</span>
              </NavLink>
            )}
            <NavLink
              className={styles.navLink}
              to="/wishlists"
              activeClassName={styles.navLinkActive}
              onClick={onClose}
            >
              <span className={styles.navIcon}>
                <Heart size={20} className={styles.strokeIcon} />
              </span>
              <span className={styles.navLabel}>Wishlists</span>
              {wishlistCount > 0 && (
                <span className={styles.wishlistBadge}>{wishlistCount > 99 ? "99+" : wishlistCount}</span>
              )}
            </NavLink>
          </nav>

          {/* Account Section (authenticated users) */}
          {isAuthenticated && (
            <>
              <div className={styles.sectionDivider}>
                <span className={styles.sectionLabel}>Account</span>
              </div>
              <div className={styles.accountSection}>
                <NavLink
                  className={styles.navLink}
                  to="/account-settings"
                  activeClassName={styles.navLinkActive}
                  onClick={onClose}
                >
                  <span className={styles.navIcon}>
                    <Icon name="user" size="20" />
                  </span>
                  <span className={styles.navLabel}>Account</span>
                </NavLink>

                {/* Log out */}
                <button
                  className={cn(styles.navLink, styles.logoutBtn)}
                  onClick={handleLogout}
                >
                  <span className={cn(styles.navIcon, styles.logoutIcon)}>
                    <Icon name="arrow-right" size="20" />
                  </span>
                  <span className={styles.navLabel}>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.drawerFooter}>
          {/* Dark mode toggle */}
          <button
            className={styles.themeRow}
            onClick={darkMode.toggle}
            aria-label={darkMode.value ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className={styles.themeLabel}>
              {darkMode.value ? "Light mode" : "Dark mode"}
            </span>
            <span className={styles.themeIcon}>
              <Icon name={darkMode.value ? "sun" : "moon"} size="20" />
            </span>
          </button>

          {/* Sign in — unauthenticated only */}
          {shouldShowLogin && (
            <button
              className={styles.loginBtn}
              onClick={() => {
                onClose();
                onLoginClick();
              }}
            >
              <Icon name="user" size="18" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default MobileNavDrawer;
