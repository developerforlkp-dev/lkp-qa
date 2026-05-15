import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Destination.module.sass";

const Destination = ({ className, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <Link className={cn(className, styles.destination)} to={item.url}>
      <div className={cn(styles.preview, { [styles.loaded]: imageLoaded })}>
        <img
          srcSet={`${item.srcSet} 2x`}
          src={item.src}
          alt="City"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            if (e.target.src !== "/images/content/card-pic-13.jpg") {
              e.target.src = "/images/content/card-pic-13.jpg";
              e.target.srcSet = "/images/content/card-pic-13.jpg";
            }
            setImageLoaded(true);
          }}
        />
        {item.categoryText && (
          <div
            className={cn("status", styles.category, {
              "status-black": item.category === "black",
            })}
          >
            {item.categoryText}
          </div>
        )}
      </div>
      <div className={styles.title}>{item.title}</div>
      <div className={styles.content}>{item.content}</div>
    </Link>
  );
};

export default Destination;
