import React, { useState } from "react";
import cn from "classnames";
import styles from "./Receipt.module.sass";
import Icon from "../Icon";

// Helper function to format image URLs (from Azure blob storage or full URLs)
const formatImageUrl = (url) => {
  if (!url) return null;
  
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Azure blob storage path (e.g., "leads/3/listings/6/cover-photo/image.jpg")
  if (url.startsWith("leads/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  
  // Relative path
  if (url.startsWith("/")) {
    return url;
  }
  
  // Otherwise assume it's a blob storage path
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
};

const Receipt = ({
  className,
  items,
  children,
  priceOld,
  priceActual,
  time,
  stacked,
  onItemClick,
  renderItem, // Custom render function for items
  avatar,
  hostData,
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const defaultAvatar = "/images/content/avatar.jpg";
  
  // Get avatar from hostData if available, otherwise use avatar prop or default
  const getAvatarSrc = () => {
    if (hostData?.host?.profilePhotoUrl) {
      const formatted = formatImageUrl(hostData.host.profilePhotoUrl);
      return formatted || defaultAvatar;
    }
    return avatar || defaultAvatar;
  };
  
  const avatarSrc = getAvatarSrc();
  const showPlaceholder = !hostData?.host?.profilePhotoUrl && !avatar;
  
  // Get rating and reviews from hostData
  const rating = hostData?.statistics?.averageRating || 0;
  const reviewCount = hostData?.statistics?.totalReviews || 0;
  const ratingDisplay = rating > 0 ? rating.toFixed(1) : "0.0";
  const reviewsText = reviewCount === 1 ? "1 review" : `${reviewCount} reviews`;

  return (
    <div className={cn(className, styles.receipt)}>
      <div className={styles.head}>
        <div className={styles.details}>
          <div className={styles.cost}>
            {priceActual && (
              <>
            <div className={styles.actual}>{priceActual}</div>
            <div className={styles.note}>/{time}</div>
              </>
            )}
          </div>
          <div className={styles.rating}>
            <Icon name="star" size="20" />
            <div className={styles.number}>{ratingDisplay}</div>
            <div className={styles.reviews}>
              ({reviewCount > 0 ? reviewsText : "0 reviews"})
            </div>
          </div>
        </div>
        <div className={styles.avatar}>
          {showPlaceholder ? (
            <div className={styles.avatarPlaceholder}>
              <Icon name="user" size="32" />
            </div>
          ) : (
            <img 
              src={avatarError ? defaultAvatar : avatarSrc} 
              alt={hostData?.host?.firstName || "Avatar"}
              onError={() => setAvatarError(true)}
            />
          )}
          <div className={styles.check}>
            <Icon name="check" size="12" />
          </div>
        </div>
      </div>
      <div
        className={cn(styles.description, {
          [styles.flex]: items.length > 1 && !stacked,
        })}
      >
        {/* First row: Date and Time slot */}
        {items.length >= 2 && (
          <div className={styles.itemsRow}>
            {items.slice(0, 2).map((x, index) => {
              // Use custom render function if provided
              if (renderItem) {
                const customRender = renderItem(x, index);
                if (customRender) {
                  return <div key={index} className={styles.itemWrapper}>{customRender}</div>;
                }
              }
              
              // Default rendering
              return (
                <div
                  className={styles.item}
                  key={index}
                  onClick={onItemClick ? () => onItemClick(index) : undefined}
                  role={onItemClick ? "button" : undefined}
                >
                  <div className={styles.icon}>
                    <Icon name={x.icon} size="24" />
                  </div>
                  <div className={styles.box}>
                    <div className={styles.category}>{x.category}</div>
                    <div className={styles.subtitle}>{x.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Second row: Guest (and any remaining items) */}
        {items.length >= 3 && (
          <div className={styles.itemsRowFull}>
            {items.slice(2).map((x, index) => {
              const actualIndex = index + 2;
              // Use custom render function if provided
              if (renderItem) {
                const customRender = renderItem(x, actualIndex);
                if (customRender) {
                  return <div key={actualIndex} className={styles.itemWrapper}>{customRender}</div>;
                }
              }
              
              // Default rendering
              return (
                <div
                  className={styles.item}
                  key={actualIndex}
                  onClick={onItemClick ? () => onItemClick(actualIndex) : undefined}
                  role={onItemClick ? "button" : undefined}
                >
                  <div className={styles.icon}>
                    <Icon name={x.icon} size="24" />
                  </div>
                  <div className={styles.box}>
                    <div className={styles.category}>{x.category}</div>
                    <div className={styles.subtitle}>{x.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Fallback for items that don't match the pattern */}
        {items.length < 2 && items.map((x, index) => {
          // Use custom render function if provided
          if (renderItem) {
            const customRender = renderItem(x, index);
            if (customRender) {
              return <div key={index} className={styles.itemWrapper}>{customRender}</div>;
            }
          }
          
          // Default rendering
          return (
            <div
              className={styles.item}
              key={index}
              onClick={onItemClick ? () => onItemClick(index) : undefined}
              role={onItemClick ? "button" : undefined}
            >
              <div className={styles.icon}>
                <Icon name={x.icon} size="24" />
              </div>
              <div className={styles.box}>
                <div className={styles.category}>{x.category}</div>
                <div className={styles.subtitle}>{x.title}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default Receipt;
