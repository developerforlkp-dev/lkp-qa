import React, { useMemo, useState, useRef, useEffect } from "react";
import cn from "classnames";
import styles from "./Favorite.module.sass";
import Icon from "../Icon";
import Modal from "../Modal";
import Login from "../Login";
import useWishlist from "../../hooks/useWishlist";

const hasValidToken = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("jwtToken");
  return Boolean(token && token !== "undefined" && token !== "null" && token !== "NaN");
};

const Favorite = ({
  className,
  style,
  itemType,
  itemId,
  initialSaved = false,
  labelSave = "Save",
  labelSaved = "Saved",
  variant = "pill",
  showText = true,
  onToggle,
  children,
}) => {
  const [loginVisible, setLoginVisible] = useState(false);
  const [pendingAfterLogin, setPendingAfterLogin] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const {
    saved,
    loading,
    pending,
    supported,
    refreshSaved,
    toggleSaved,
  } = useWishlist({
    itemType,
    itemId,
    initialSaved,
  });

  const buttonText = useMemo(() => {
    if (pending) return saved ? "Removing..." : "Saving...";
    return saved ? labelSaved : labelSave;
  }, [labelSave, labelSaved, pending, saved]);

  if (!supported) {
    return null;
  }

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const result = await toggleSaved();
      if (result?.requiresAuth) {
        if (isMounted.current) {
          setPendingAfterLogin(true);
          setLoginVisible(true);
        }
        return;
      }
      if (typeof onToggle === "function" && typeof result?.saved === "boolean") {
        onToggle(result.saved);
      }
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        if (isMounted.current) {
          setPendingAfterLogin(true);
          setLoginVisible(true);
        }
      }
    }
  };

  const handleLoginClose = async () => {
    if (isMounted.current) setLoginVisible(false);
    const loggedIn = hasValidToken();
    await refreshSaved(true).catch(() => {});
    if (pendingAfterLogin && loggedIn) {
      if (isMounted.current) setPendingAfterLogin(false);
      try {
        const result = await toggleSaved();
        if (typeof onToggle === "function" && typeof result?.saved === "boolean") {
          onToggle(result.saved);
        }
      } catch (_) {}
      return;
    }
    if (isMounted.current) setPendingAfterLogin(false);
  };

  return (
    <>
      {typeof children === "function" ? (
        children({ saved, loading, pending, onClick: handleClick, buttonText })
      ) : (
        <button
          className={cn(
            styles.button,
          {
            [styles.active]: saved,
            [styles.iconOnly]: variant === "icon",
            [styles.hero]: variant === "hero",
            [styles.loading]: loading || pending,
          },
          className
        )}
        style={style}
        onClick={handleClick}
        type="button"
        aria-pressed={saved}
        aria-label={buttonText}
        disabled={loading || pending}
      >
        <div className={styles.inner}>
          <Icon name={saved ? "heart-fill" : "heart"} size={variant === "hero" ? "16" : "12"} />
          {showText && variant !== "icon" && (
            <span className={styles.text}>{buttonText}</span>
          )}
        </div>
      </button>
      )}

      <Modal visible={loginVisible} onClose={handleLoginClose}>
        <Login onClose={handleLoginClose} />
      </Modal>
    </>
  );
};

export default Favorite;
