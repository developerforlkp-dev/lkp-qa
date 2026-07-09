import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./DestinationCard.module.sass";

const DestinationCard = ({ className, item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const defaultImage = "/images/content/card-pic-13.jpg";
  const finalSrc = imageError ? defaultImage : item.src;
  const finalSrcSet = imageError ? undefined : (item.srcSet ? `${item.srcSet} 2x` : undefined);
  return (
    <Link 
      className={cn(className, styles.card)} 
      to={item.url || "/experience-category"}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={cn(styles.imageWrapper, { [styles.loaded]: imageLoaded })}>
        <img
          srcSet={finalSrcSet}
          src={finalSrc}
          alt={item.title}
          className={styles.image}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.onerror = null;
            if (!imageError) {
              setImageError(true);
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

export default DestinationCard;


