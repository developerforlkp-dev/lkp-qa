import React from "react";
import cn from "classnames";
import styles from "./Product.module.sass";
import Icon from "../Icon";
import Actions from "../Actions";
import Gallery from "./Gallery";

const Product = ({
  classSection,
  title,
  options,
  gallery,
  listingId,
  type,
  rating,
  reviews,
  hostAvatar,
  mapLocation,
}) => {
  // Format rating to 1 decimal place if provided
  const displayRating = rating !== null && rating !== undefined 
    ? parseFloat(rating).toFixed(1) 
    : null;
  
  // Format reviews count
  const displayReviews = reviews !== null && reviews !== undefined && reviews > 0
    ? `(${reviews} ${reviews === 1 ? 'review' : 'reviews'})`
    : null;

  return (
    <div className={cn(classSection, styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.head}>
          <div className={styles.box}>
            <h1 className={cn("h2", styles.title)}>{title}</h1>
            <div className={styles.line}>
              {hostAvatar && (
                <div className={styles.avatar}>
                  <img src={hostAvatar} alt="Host" onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    if (!e.target.src.includes("/images/content/avatar-1.jpg")) {
                      e.target.src = "/images/content/avatar-1.jpg";
                      e.target.onerror = null;
                    }
                  }} />
                </div>
              )}
              {(displayRating !== null || displayReviews !== null) && (
                <div className={styles.rating}>
                  {displayRating !== null && (
                    <>
                      <Icon name="star" size="20" />
                      <div className={styles.number}>{displayRating}</div>
                    </>
                  )}
                  {displayReviews && (
                    <div className={styles.reviews}>{displayReviews}</div>
                  )}
                </div>
              )}
              <div className={styles.options}>
                {options.map((x, index) => (
                  <div className={styles.option} key={index}>
                    <Icon name={x.icon} size="20" />
                    {x.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Actions className={styles.actions} mapLocation={mapLocation} />
        </div>
        {gallery && (
          <Gallery 
            className={styles.gallery} 
            items={gallery} 
            listingId={listingId}
            type={type}
            title={title}
            options={options}
          />
        )}
      </div>
    </div>
  );
};

export default Product;
