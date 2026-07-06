import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./CircleCard.module.sass";

const CircleCard = ({ className, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <Link 
      className={cn(className, styles.card)} 
      to={item.url || "/experience-category"}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={cn(styles.imageWrapper, { [styles.loaded]: imageLoaded })}>
        <img
          srcSet={item.srcSet ? `${item.srcSet} 2x` : undefined}
          src={item.src}
          alt={item.title}
          className={styles.image}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            if (e.target.src !== "") {
              e.target.src = "";
              e.target.srcSet = "";
            }
            setImageLoaded(true);
          }}
        />
        {item.isClosed && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: '#23262f',
              color: '#fcfcfd',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              zIndex: 2,
            }}
          >
            Closed
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{item.title}</div>
        {item.location && (
          <div className={styles.location}>{item.location}</div>
        )}
      </div>
    </Link>
  );
};

export default CircleCard;
