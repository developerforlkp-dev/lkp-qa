import React, { useState, useEffect } from "react";
import cn from "classnames";
import { Search, Menu, User } from "lucide-react";
import styles from "./MobileAppHeader.module.sass";

// Triggering hot reload for logo styles

const MobileAppHeader = ({
  onSearchClick,
  isStickyNav,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if authenticated
    const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);
  }, []);

  return (
    <div className={cn(styles.container, { [styles.solidBackground]: isStickyNav })}>
      <div className={styles.headerTop}>
        <img 
          src="/images/littleplanet-logo.svg" 
          alt="Little Planet" 
          className={styles.logo} 
        />
        {isStickyNav && (
          <div className={styles.searchBar} onClick={onSearchClick}>
            <Search size={20} className={styles.searchIcon} />
            <div className={styles.searchText}>
              <div className={styles.searchTitle}>Search</div>
            </div>
          </div>
        )}
        
        <div className={styles.actions}>
          {!isAuthenticated && (
            <button 
              className={styles.iconButton}
              onClick={() => window.dispatchEvent(new CustomEvent("open-login-modal"))}
              aria-label="Login"
            >
              <User size={20} />
            </button>
          )}
          <button 
            className={styles.iconButton}
            onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAppHeader;
