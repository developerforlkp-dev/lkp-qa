import React from "react";
import styles from "./Rating.module.sass";
import Rating from "react-rating";

const Form = ({ className, initialRating, rating, onChange, readonly }) => {
  // Use controlled rating if provided, otherwise use initialRating
  const ratingValue = rating !== undefined ? rating : initialRating;

  const renderStar = (starClassName) => (
    <span className={`${styles.star} ${starClassName}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    </span>
  );
  
  return (
    <Rating
      className={className}
      initialRating={ratingValue}
      onChange={onChange}
      readonly={readonly}
      emptySymbol={renderStar(styles.starEmpty)}
      fullSymbol={renderStar(styles.starFull)}
    />
  );
};

export default Form;

