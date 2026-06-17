import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCustomerWishlistStatus,
  isSupportedWishlistItemType,
  removeCustomerWishlistItem,
  saveCustomerWishlistItem,
} from "../utils/api";

const WISHLIST_EVENT_NAME = "lkp:wishlist-changed";
const wishlistCache = new Map();

const hasValidToken = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("jwtToken");
  return Boolean(token && token !== "undefined" && token !== "null" && token !== "NaN");
};

export const buildWishlistKey = (itemType, itemId) => {
  const normalizedType = String(itemType || "").trim().toLowerCase();
  return normalizedType && itemId != null && itemId !== ""
    ? `${normalizedType}:${String(itemId)}`
    : null;
};

export const primeWishlistCache = (items = []) => {
  items.forEach((item) => {
    const key = buildWishlistKey(item?.itemType, item?.itemId);
    if (key) {
      wishlistCache.set(key, true);
    }
  });
};

export const clearWishlistCache = () => {
  wishlistCache.clear();
};

export const dispatchWishlistChange = (detail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT_NAME, { detail }));
};

export default function useWishlist({ itemType, itemId, initialSaved = false }) {
  const normalizedType = String(itemType || "").trim().toLowerCase();
  const key = useMemo(
    () => buildWishlistKey(normalizedType, itemId),
    [normalizedType, itemId]
  );
  const supported = isSupportedWishlistItemType(normalizedType) && key;
  const [saved, setSaved] = useState(Boolean(initialSaved));
  const [loading, setLoading] = useState(Boolean(supported && hasValidToken() && !wishlistCache.has(key)));
  const [pending, setPending] = useState(false);

  const syncSaved = useCallback(async (force = false) => {
    if (!supported) {
      setSaved(false);
      setLoading(false);
      return false;
    }

    if (!hasValidToken()) {
      wishlistCache.delete(key);
      setSaved(false);
      setLoading(false);
      return false;
    }

    if (!force && wishlistCache.has(key)) {
      const cached = Boolean(wishlistCache.get(key));
      setSaved(cached);
      setLoading(false);
      return cached;
    }

    setLoading(true);
    try {
      const response = await getCustomerWishlistStatus(normalizedType, itemId);
      const nextSaved = Boolean(response?.saved);
      wishlistCache.set(key, nextSaved);
      setSaved(nextSaved);
      return nextSaved;
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        wishlistCache.delete(key);
        setSaved(false);
        return false;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [itemId, key, normalizedType, supported]);

  useEffect(() => {
    if (supported) {
      setSaved(Boolean(initialSaved));
      syncSaved();
    } else {
      setSaved(false);
      setLoading(false);
    }
  }, [initialSaved, supported, syncSaved]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleWishlistChange = (event) => {
      const detail = event?.detail || {};
      if (!key) return;
      if (detail.key === key || (detail.itemType === normalizedType && String(detail.itemId) === String(itemId))) {
        if (typeof detail.saved === "boolean") {
          wishlistCache.set(key, detail.saved);
          setSaved(detail.saved);
          setLoading(false);
        }
      }
    };

    const handleFocus = () => {
      syncSaved(true).catch(() => {});
    };

    window.addEventListener(WISHLIST_EVENT_NAME, handleWishlistChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener(WISHLIST_EVENT_NAME, handleWishlistChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [itemId, key, normalizedType, syncSaved]);

  const toggleSaved = useCallback(async () => {
    if (!supported) {
      return { saved: false, ignored: true };
    }

    if (!hasValidToken()) {
      return { requiresAuth: true };
    }

    setPending(true);
    try {
      const nextSaved = !saved;
      if (saved) {
        await removeCustomerWishlistItem(normalizedType, itemId);
      } else {
        await saveCustomerWishlistItem(normalizedType, itemId);
      }

      wishlistCache.set(key, nextSaved);
      setSaved(nextSaved);
      dispatchWishlistChange({
        key,
        itemType: normalizedType,
        itemId,
        saved: nextSaved,
      });
      return { saved: nextSaved };
    } finally {
      setPending(false);
    }
  }, [itemId, key, normalizedType, saved, supported]);

  return {
    saved,
    loading,
    pending,
    supported: Boolean(supported),
    refreshSaved: syncSaved,
    toggleSaved,
  };
}
