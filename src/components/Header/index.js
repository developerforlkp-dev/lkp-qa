import React, { useState } from "react";
import cn from "classnames";
import styles from "./Header.module.sass";
import { Link, NavLink } from "react-router-dom";
import Image from "../Image";
import Notification from "./Notification";
import User from "./User";
import Icon from "../Icon";
import Modal from "../Modal";
import Login from "../Login";
import useDarkMode from "use-dark-mode";
import MobileNavDrawer from "./MobileDrawer/MobileNavDrawer";



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

const Header = ({ separatorHeader, wide, notAuthorized, hideOnMobile, isHomepage, hasScrolled }) => {
  const [visibleNav, setVisibleNav] = useState(false);
  const [visible, setVisible] = useState(false);
  const darkMode = useDarkMode(false);

  // Check if user is authenticated (has JWT token)
  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("jwtToken");
    return !!token;
  };

  // Determine if we should show login button (if notAuthorized prop is true OR user is not authenticated)
  const shouldShowLogin = notAuthorized || !isAuthenticated();

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
          <Link className={styles.logo} to="/">
            <Image
              className={styles.pic}
              src="/images/littleplanet-logo.svg"
              srcDark="/images/littleplanet-logo.svg"
              alt="FleetHome"
            />
          </Link>

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
            {!shouldShowLogin && (
              <NavLink
                className={cn(styles.link, styles.bookingsLink)}
                to="/bookings"
                activeClassName={styles.active}
              >
                Bookings
              </NavLink>
            )}
            <NavLink
              className={cn(styles.link, styles.wishlistLink)}
              to="/wishlist"
              activeClassName={styles.active}
            >
              Wishlist
            </NavLink>
            <Notification className={styles.notification} />
            {shouldShowLogin ? (
              <button className={styles.login} onClick={() => setVisible(true)}>
                <Icon name="user" size="24" />
              </button>
            ) : (
              <User className={styles.user} items={items} />
            )}

            {/* Burger — mobile only, opens the slide-in drawer */}
            <button
              className={cn(styles.burger, { [styles.active]: visibleNav })}
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
      />
    </>
  );
};

export default Header;
