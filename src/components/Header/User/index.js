import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import { LogOut } from "lucide-react";
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
          <div className={styles.menu}>
            <NavLink
              className={styles.item}
              to="/bookings"
              onClick={() => setVisible(false)}
            >
              <div className={styles.icon}>
                <Icon name="home" size="20" />
              </div>
              <div className={styles.text}>Bookings</div>
            </NavLink>

            <NavLink
              className={styles.item}
              to="/account-settings"
              onClick={() => setVisible(false)}
            >
              <div className={styles.icon}>
                <Icon name="user" size="20" />
              </div>
              <div className={styles.text}>Account</div>
            </NavLink>

            <NavLink
              className={styles.item}
              to="/support"
              onClick={() => setVisible(false)}
            >
              <div className={styles.icon}>
                <Icon name="info" size="20" />
              </div>
              <div className={styles.text}>Support</div>
            </NavLink>

            <div className={styles.divider} />

            <button
              type="button"
              className={cn(styles.item, styles.logoutItem)}
              onClick={handleLogout}
            >
              <div className={styles.icon}>
                <LogOut size={20} className={styles.logoutIcon} />
              </div>
              <div className={styles.text}>Logout</div>
            </button>
          </div>
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default User;
