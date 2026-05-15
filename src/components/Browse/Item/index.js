import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Item.module.sass";
import Icon from "../../Icon";

const Item = ({ className, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const handleImageError = (e) => {
    // Silently fallback to default image if original fails to load
    if (e.target.src !== "/images/content/card-pic-13.jpg") {
      e.target.src = "/images/content/card-pic-13.jpg";
      e.target.srcSet = "/images/content/card-pic-13.jpg";
    }
    setImageLoaded(true);
  };

  return (
    <Link className={cn(className, styles.item)} to={item.url}>
      <div className={cn(styles.preview, { [styles.loaded]: imageLoaded })}>
        <img 
          srcSet={`${item.srcSet} 2x`} 
          src={item.src} 
          alt={item.title || "Nature"}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
        />
        <div
          className={cn(
            { "status-black": item.category === "black" },
            styles.category
          )}
        >
          {item.categoryText}
        </div>
      </div>
      <div className={styles.title}>{item.title}</div>
      <div className={styles.counter}>
        <Icon name="home" size="16" />
        {item.counter}
      </div>
    </Link>
  );
};

export default Item;
