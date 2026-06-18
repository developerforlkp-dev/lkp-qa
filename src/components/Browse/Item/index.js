import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Item.module.sass";
import Icon from "../../Icon";

const Item = ({ className, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const handleImageError = (e) => {
    // Silently fallback to default image if original fails to load
    if (e.target.src !== "") {
      e.target.src = "";
      e.target.srcSet = "";
    }
    setImageLoaded(true);
  };

  const rating = typeof item.rating === "number" && !Number.isInteger(item.rating)
    ? item.rating.toFixed(1)
    : (item.rating || 0);

  return (
    <Link 
      className={cn(className, styles.item)} 
      to={item.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={cn(styles.preview, { [styles.loaded]: imageLoaded })}>
        <img 
          srcSet={`${item.srcSet} 2x`} 
          src={item.src} 
          alt={item.title || "Nature"}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
        {item.categoryText && (
          <div
            className={cn(
              { "status-black": item.category === "black" },
              styles.category
            )}
          >
            {item.categoryText}
          </div>
        )}
        <div className={styles.overlay}>
          <div className={styles.title}>{item.title}</div>
          <div className={styles.counter}>
            <Icon name="star" size="14" />
            <span className={styles.ratingNumber}>{rating} ({item.counter || 0})</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Item;

