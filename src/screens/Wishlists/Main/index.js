import React, { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Main.module.sass";
import Control from "../../../components/Control";
import Card from "../../../components/Card";
import { getCustomerWishlistItems, normalizePublicImageUrl } from "../../../utils/api";
import { buildExperienceUrl } from "../../../utils/experienceUrl";
import { primeWishlistCache } from "../../../hooks/useWishlist";

const breadcrumbs = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Wishlists",
  },
];

const WISHLIST_EVENT_NAME = "lkp:wishlist-changed";

const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("jwtToken");
  return Boolean(token && token !== "undefined" && token !== "null" && token !== "NaN");
};

const getWishlistItemUrl = (itemType, itemId, title) => {
  if (itemType === "event") return `/event?id=${itemId}`;
  if (itemType === "stay") return `/stay-details?id=${itemId}`;
  return buildExperienceUrl(title || "experience", itemId);
};

const getWishlistLocation = (location) => {
  if (!location) return null;
  if (location.label) return location.label;
  return [location.city, location.state, location.country].filter(Boolean).join(", ") || null;
};

const transformWishlistItemToCard = (item) => {
  const imageUrl =
    normalizePublicImageUrl(item?.display?.imageUrl) ||
    normalizePublicImageUrl(item?.display?.imageBlobName) ||
    "/images/content/card-pic-13.jpg";
  const title = item?.display?.title || "Saved item";
  const pricingLabel = item?.display?.pricing?.label || null;

  return {
    id: `wishlist-${item?.itemType}-${item?.itemId}`,
    listingId: item?.itemId,
    title,
    src: imageUrl,
    srcSet: imageUrl,
    url: getWishlistItemUrl(item?.itemType, item?.itemId, title),
    location: getWishlistLocation(item?.display?.location),
    briefDescription: item?.display?.subtitle || null,
    hasPrice: Boolean(pricingLabel),
    cost: pricingLabel,
    priceActual: pricingLabel,
    rating: 0,
    reviews: 0,
    hideRating: true,
    options: [],
    wishlistItemType: item?.itemType,
    wishlistItemId: item?.itemId,
    wishlistSaved: true,
  };
};

const Main = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadWishlist = async () => {
      if (!isAuthenticated()) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");
        const wishlistItems = await getCustomerWishlistItems();
        primeWishlistCache(wishlistItems);
        if (mounted) {
          setItems(wishlistItems);
        }
      } catch (err) {
        if (mounted) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            setItems([]);
          } else {
            setError("We couldn't load your wishlist right now.");
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadWishlist();

    const handleWishlistChange = (event) => {
      const detail = event?.detail || {};
      if (!detail?.itemType || detail?.itemId == null) return;

      setItems((currentItems) => {
        if (detail.saved === false) {
          return currentItems.filter(
            (item) => !(item?.itemType === detail.itemType && String(item?.itemId) === String(detail.itemId))
          );
        }
        return currentItems;
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener(WISHLIST_EVENT_NAME, handleWishlistChange);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(WISHLIST_EVENT_NAME, handleWishlistChange);
      }
    };
  }, [reloadTick]);

  const cardItems = useMemo(
    () => items.map(transformWishlistItemToCard),
    [items]
  );

  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          breadcrumbs={breadcrumbs}
        />

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "16px", color: "var(--n4)" }}>Loading your wishlist...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "80px 0", maxWidth: "420px", margin: "0 auto" }}>
            <h1 className={cn("h2", styles.title)} style={{ marginBottom: "16px" }}>Wishlist Unavailable</h1>
            <p style={{ marginBottom: "32px", fontSize: "16px", color: "var(--n4)", lineHeight: "1.5" }}>
              {error}
            </p>
            <button
              type="button"
              className={cn("button", styles.button)}
              onClick={() => setReloadTick((value) => value + 1)}
            >
              Try Again
            </button>
          </div>
        ) : cardItems.length > 0 ? (
          <>
            <div className={styles.head}>
              <div className={styles.wrap}>
                <h1 className={cn("h2", styles.title)}>Your Wishlist</h1>
                <div className={styles.counter}>
                  {cardItems.length} saved {cardItems.length === 1 ? "item" : "items"}
                </div>
              </div>
            </div>
            <div className={styles.list}>
              {cardItems.map((item) => (
                <Card className={styles.card} item={item} key={item.id} />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyWrapper} style={{ textAlign: "center", padding: "120px 0", maxWidth: "540px", margin: "0 auto" }}>
            <div style={{ fontSize: "12px", marginBottom: "16px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0097B2" }}>
              YOUR COLLECTION
            </div>
            <h1 className={cn("h2", styles.title)} style={{ 
              marginBottom: "24px", 
              fontFamily: '"Cormorant Garamond", "Playfair Display", serif',
              fontSize: "52px",
              lineHeight: "1.1"
            }}>
              {isAuthenticated() ? (
                <>Curate your perfect <span style={{ fontStyle: "italic", color: "#0097B2" }}>escape</span></>
              ) : (
                <>Sign in to save <span style={{ fontStyle: "italic", color: "#0097B2" }}>memories</span></>
              )}
            </h1>
            <p style={{ marginBottom: "40px", fontSize: "18px", color: "var(--n4)", lineHeight: "1.6" }}>
              {isAuthenticated()
                ? "Your wishlist is currently empty. Discover the most extraordinary moments waiting to be lived and start building your dream itinerary."
                : "Save experiences, events, and stays to your wishlist to build your dream itinerary."}
            </p>
            <Link to="/" className={cn("button", styles.button)} style={{ minWidth: "220px", borderRadius: "32px" }}>
              Explore All
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;
