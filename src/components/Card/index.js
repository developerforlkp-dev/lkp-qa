import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Card.module.sass";
import Icon from "../Icon";

const Item = ({ className, item, row, car }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  // Use default image if item.src is an Azure blob URL without SAS token
  // SAS token URLs (with sig= and sv= query params) should work
  const defaultImage = "/images/content/card-pic-13.jpg";
  const hasSasToken = item.src && item.src.includes("lkpleadstoragedev.blob.core.windows.net") && 
                      item.src.includes("sig=") && item.src.includes("sv=");
  const imageSrc = item.src && item.src.includes("lkpleadstoragedev.blob.core.windows.net") && !hasSasToken
    ? defaultImage 
    : (item.src || defaultImage);
  const imageSrcSet = imageSrc; // Use same logic for srcSet

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
          alt={item.title || "Nature"}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            // Silently fallback to default image if original fails to load
            // Prevent infinite loop by checking if already on fallback
            if (!e.target.src.includes("/images/content/card-pic-13.jpg")) {
              e.target.src = defaultImage;
              e.target.srcSet = defaultImage;
              e.target.onerror = null; // Prevent further error handling
            }
            setImageLoaded(true);
          }}
        />
        {item.categoryText && (
          <div
            className={cn(
              "category",
              { "category-blue": item.category === "blue" },
              styles.category
            )}
          >
            {item.categoryText}
          </div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.line}>
          <div className={styles.title}>{item.title}</div>
          {item.hasPrice && item.priceActual && (
            <div className={styles.price}>
              <div className={styles.old}>{item.priceOld}</div>
              <div className={styles.actual}>{item.priceActual}</div>
            </div>
          )}
        </div>
        <div className={styles.options}>
          {item.options.map((x, index) => (
            <div className={styles.option} key={index}>
              <Icon name={x.icon} size="16" />
              {x.title}
            </div>
          ))}
        </div>
        <div className={styles.foot}>
          {item.comment && (
            <div className={styles.comment}>
              <div className={styles.avatar}>
                <img src={item.avatar} alt="Avatar" />
              </div>
              <div className={styles.text}>{item.comment}</div>
            </div>
          )}
          <div className={styles.flex}>
            {item.hasPrice && item.cost && (
              <div className={styles.cost}>{item.cost}</div>
            )}
            <div className={styles.rating}>
              <Icon name="star" size="12" />
              <span className={styles.number}>{item.rating}</span>
              <span className={styles.review}>({item.reviews} reviews)</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Item;
