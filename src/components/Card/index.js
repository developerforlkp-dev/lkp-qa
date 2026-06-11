import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Card.module.sass";
import Icon from "../Icon";

const Item = ({ className, item, row, car, hidePrice }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const defaultImage = "/images/content/card-pic-13.jpg";
  const hasSasToken = item.src && item.src.includes("lkpleadstoragedev.blob.core.windows.net") && 
                      item.src.includes("sig=") && item.src.includes("sv=");
  const imageSrc = item.src && item.src.includes("lkpleadstoragedev.blob.core.windows.net") && !hasSasToken
    ? defaultImage 
    : (item.src || defaultImage);
  const imageSrcSet = imageSrc;

  const shouldHidePrice = hidePrice;

  return (
    <Link
      className={cn(
        className,
        styles.card,
        { [styles.row]: row },
        { [styles.car]: car }
      )}
      to={item.url}
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
      </div>
      <div className={styles.body}>
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

