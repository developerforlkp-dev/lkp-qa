import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./User.module.sass";
import Icon from "../../Icon";

const User = ({ className, items }) => {
  const [visible, setVisible] = useState(false);
  const [avatar, setAvatar] = useState("");

  const loadAvatar = () => {
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo.avatar) {
          setAvatar(userInfo.avatar);
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    loadAvatar();
    window.addEventListener("user-info-changed", loadAvatar);
    return () => window.removeEventListener("user-info-changed", loadAvatar);
  }, []);

  // Logout function that clears all user data and redirects to landing page
  const handleLogout = (e) => {
    e.preventDefault();
    
    // Clear all authentication-related data from localStorage
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("email");
    
    // Close the menu
    setVisible(false);
    
    // Redirect to landing page (home) and reload to update the header state
    window.location.href = "/";
  };

  return (
    <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
      <div className={cn(styles.user, className, { [styles.active]: visible })}>
        <button className={styles.head} onClick={() => setVisible(!visible)}>
          {avatar ? (
            <img src={avatar} alt="User Avatar" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', aspectRatio: '1/1' }} />
          ) : (
            <Icon name="user" size="24" />
          )}
        </button>
        <div className={styles.body}>
          <div className={styles.group}>
            {items.map((item, index) => (
              <div className={styles.menu} key={index}>
                {item.menu.map((x, index) => (
                  <NavLink
                    className={styles.item}
                    activeClassName={styles.active}
                    to={x.url}
                    onClick={() => setVisible(!visible)}
                    key={index}
                  >
                    <div className={styles.icon}>
                      <Icon name={x.icon} size="24" />
                    </div>
                    <div className={styles.text}>{x.title}</div>
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.btns}>
            <NavLink
              className={cn("button button-small", styles.button)}
              activeClassName={styles.active}
              to="/account-settings"
              onClick={() => setVisible(!visible)}
            >
              Account
            </NavLink>
            <button 
              className={cn("button-stroke button-small", styles.button)}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default User;
