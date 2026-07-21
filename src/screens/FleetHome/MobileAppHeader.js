import React, { useState, useEffect } from "react";
import cn from "classnames";
import { useHistory } from "react-router-dom";
import { Search, Heart, Menu, User } from "lucide-react";
import { getCustomerWishlistItems } from "../../utils/api";
import styles from "./MobileAppHeader.module.sass";

// Triggering hot reload for logo styles

const MobileAppHeader = ({
  onSearchClick,
  isStickyNav,
}) => {
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const history = useHistory();

  useEffect(() => {
    // Check if authenticated
    const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    setIsAuthenticated(true);

    getCustomerWishlistItems()
      .then(items => {
        if (Array.isArray(items)) {
          setWishlistCount(items.length);
        }
      })
      .catch(() => {});

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
            <Search size={18} className={styles.searchIcon} />
            <div className={styles.searchText}>
              <div className={styles.searchTitle}>Search by...</div>
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
          {isStickyNav && (
            <button 
              className={styles.iconButton}
              onClick={() => history.push("/wishlists")}
              aria-label="Wishlists"
              style={{ position: 'relative' }}
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className={styles.wishlistBadge}>
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </button>
          )}
          <button 
            className={styles.iconButton}
            onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-nav"))}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAppHeader;
