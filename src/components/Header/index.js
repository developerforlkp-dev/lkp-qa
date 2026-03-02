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



const items = [
  {
    menu: [
      {
        title: "Messages",
        icon: "comment",
        url: "/messages",
      },
      {
        title: "Bookings",
        icon: "home",
        url: "/bookings",
      },
      {
        title: "Wishlists",
        icon: "email",
        url: "/wishlists",
      },
    ],
  },
  {
    menu: [
      {
        title: "List your property",
        icon: "building",
        url: "/list-your-property",
      },
      {
        title: "Host an experience",
        icon: "flag",
        url: "/your-trips",
      },
    ],
  },
];

const Header = ({ separatorHeader, wide, notAuthorized, hideOnMobile }) => {
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
        <div className={cn("container", styles.container)}>
          <Link className={styles.logo} to="/">
            <Image
              className={styles.pic}
              src="/images/littleplanet-logo.svg"
              srcDark="/images/littleplanet-logo.svg"
              alt="FleetHome"
            />
          </Link>
          <div className={cn(styles.wrapper, { [styles.active]: visibleNav })}>
            <NavLink
              className={styles.link}
              to="/support"
              activeClassName={styles.active}
            >
              Support
            </NavLink>

            <NavLink
              className={cn("button-stroke button-small", styles.button)}
              activeClassName={styles.active}
              to="/list-your-property"
            >
              List your property
            </NavLink>
          </div>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={darkMode.toggle}
            aria-label={darkMode.value ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode.value ? "Light mode" : "Dark mode"}
          >
            <Icon name={darkMode.value ? "sun" : "moon"} size="24" />
          </button>
          <Notification className={styles.notification} />
          {shouldShowLogin ? (
            <button className={styles.login} onClick={() => setVisible(true)}>
              <Icon name="user" size="24" />
            </button>
          ) : (
            <User className={styles.user} items={items} />
          )}
          <button
            className={cn(styles.burger, { [styles.active]: visibleNav })}
            onClick={() => setVisibleNav(!visibleNav)}
          ></button>
        </div>
      </div>
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <Login onClose={() => setVisible(false)} />
      </Modal>
    </>
  );
};

export default Header;
