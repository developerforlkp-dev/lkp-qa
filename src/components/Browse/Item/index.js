import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Item.module.sass";
import Icon from "../../Icon";

const Item = ({ className, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const defaultImage = "/images/content/card-pic-13.jpg";
  const finalSrc = imageError ? defaultImage : item.src;
  const finalSrcSet = imageError ? undefined : `${item.srcSet} 2x`;

  const handleImageError = (e) => {
    e.target.onerror = null;
    if (!imageError) {
      setImageError(true);
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
      target={window.innerWidth <= 768 ? "_self" : "_blank"}
      rel="noopener noreferrer"
    >
      <div className={cn(styles.preview, { [styles.loaded]: imageLoaded })}>
        <img 
          srcSet={finalSrcSet} 
          src={finalSrc} 
          alt={item.title || "Nature"}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
        {item.categoryText && !item.isClosed && (
          <div
            className={cn(
              { "status-black": item.category === "black" },
              styles.category
            )}
          >
            {item.categoryText}
          </div>
        )}
        {item.isClosed && (
          <div
            className={cn(styles.category)}
            style={{ backgroundColor: '#23262f', color: '#fcfcfd' }}
          >
            Closed
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

