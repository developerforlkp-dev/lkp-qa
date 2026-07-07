import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Card.module.sass";
import Icon from "../Icon";
import Favorite from "../Favorite";

const getWishlistConfig = (item) => {
  const explicitType = String(item?.wishlistItemType || item?.itemType || "").trim().toLowerCase();
  const explicitId = item?.wishlistItemId ?? item?.itemId ?? item?.listingId ?? item?.eventId ?? item?.stayId;

  if (explicitType && explicitId != null && explicitId !== "") {
    return {
      itemType: explicitType,
      itemId: explicitId,
      initialSaved: Boolean(item?.wishlistSaved),
    };
  }

  const url = String(item?.url || "").toLowerCase();
  if (explicitId != null && explicitId !== "") {
    if (url.includes("/event")) {
      return { itemType: "event", itemId: explicitId, initialSaved: Boolean(item?.wishlistSaved) };
    }
    if (url.includes("/stay-details")) {
      return { itemType: "stay", itemId: explicitId, initialSaved: Boolean(item?.wishlistSaved) };
    }
    return { itemType: "listing", itemId: explicitId, initialSaved: Boolean(item?.wishlistSaved) };
  }

  return null;
};

const Item = ({ className, item, row, car, hidePrice, hideWishlist }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const wishlistConfig = getWishlistConfig(item);
  
  const defaultImage = "/images/content/card-pic-13.jpg";
  const hasSasToken = item.src && item.src.includes("lkpleadstoragedev.blob.core.windows.net") && 
                      item.src.includes("sig=") && item.src.includes("sv=");
  const imageSrc = item.src && item.src.includes("lkpleadstoragedev.blob.core.windows.net") && !hasSasToken
    ? defaultImage 
    : (item.src || defaultImage);
  const imageSrcSet = imageSrc;

  const shouldHidePrice = hidePrice;

  const isClosedEvent = (() => {
    // Check if the API explicitly sent isClosed
    if (item.isClosed === true) return true;

    // Only apply to events
    const isEvent = wishlistConfig?.itemType === "event" || (item.url && item.url.includes("/event"));
    if (!isEvent) return false;

    const now = new Date();
    
    // Explicit status check
    if (item.status && String(item.status).toLowerCase() === "closed") return true;
    
    // Check various end dates to see if booking/ticketing is closed
    if (item.bookingCutoffTime && new Date(item.bookingCutoffTime) < now) return true;
    if (item.bookingEndDate && new Date(item.bookingEndDate) < now) return true;
    if (item.endDate && new Date(item.endDate) < now) return true;

    return false;
  })();

  return (
    <Link
      className={cn(
        className,
        styles.card,
        { [styles.row]: row },
        { [styles.car]: car }
      )}
      to={item.url}
      target={window.innerWidth <= 768 ? "_self" : "_blank"}
      rel="noopener noreferrer"
    >
      <div className={cn(styles.preview, { [styles.loaded]: imageLoaded })}>
        <img 
          srcSet={imageSrcSet !== defaultImage ? `${imageSrcSet} 2x` : defaultImage}
          src={imageSrc} 
          alt={item.title || "Listing"}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            if (!e.target.src.includes("card-pic-13.jpg")) {
              e.target.src = defaultImage;
              e.target.srcSet = defaultImage;
              e.target.onerror = null;
            }
            setImageLoaded(true);
          }}
        />
        {isClosedEvent && (
          <div className={styles.closedBadge}>
            <div className={styles.closedDot} />
            CLOSED
          </div>
        )}
        {wishlistConfig && !hideWishlist && (
          <Favorite
            className={styles.favorite}
            itemType={wishlistConfig.itemType}
            itemId={wishlistConfig.itemId}
            initialSaved={wishlistConfig.initialSaved}
            variant="icon"
          />
        )}
      </div>
      <div className={styles.body}>
        {item.categoryText && (
          <div
            className={cn(
              styles.category,
              { [styles.orange]: item.badgeColor === "orange" },
              { [styles.teal]: item.badgeColor === "teal" }
            )}
          >
            {item.categoryText}
          </div>
        )}
        {item.dateBadge && (
          <div className={styles.dateBadge}>
            <span className={styles.day}>{item.dateBadge.day}</span>
            <span className={styles.month}>{item.dateBadge.month}</span>
          </div>
        )}
        <div className={styles.line}>
          <div className={styles.title}>{item.title}</div>
          {item.location && (
            <div className={styles.locationRow}>
              <Icon name="location" />
              {item.location}
            </div>
          )}
        </div>
        
        {/* We can still render options if passed, though mockup doesn't show them */}
        {item.options && item.options.length > 0 && (
          <div className={styles.options}>
            {item.options.map((x, index) => (
              <div className={styles.option} key={index}>
                <Icon name={x.icon} size="16" />
                {x.title}
              </div>
            ))}
          </div>
        )}

        <div className={styles.foot}>
          <div className={styles.flex}>
            {!item.hideRating && (
              <div className={styles.rating}>
                <div className={styles.ratingTop}>
                  <Icon name="star" />
                  <span className={styles.number}>
                    {typeof item.rating === "number" && !Number.isInteger(item.rating)
                      ? item.rating.toFixed(1)
                      : (item.rating || 0)}
                  </span>
                </div>
                <span className={styles.review}>
                  ({item.reviews || 0})
                </span>
              </div>
            )}

            {!shouldHidePrice && item.hasPrice && item.cost && (
              <div className={styles.price}>
                {item.priceOld && <div className={styles.old}>{item.priceOld}</div>}
                <div className={styles.cost}>
                  {item.cost}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Item;

