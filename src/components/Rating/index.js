import React from "react";
// import cn from "classnames";
import styles from "./Rating.module.sass";
import Rating from "react-rating";

const Form = ({ className, initialRating, rating, onChange, readonly }) => {
  // Use controlled rating if provided, otherwise use initialRating
  const ratingValue = rating !== undefined ? rating : initialRating;
  
  return (
    <Rating
      className={className}
      initialRating={ratingValue}
      onChange={onChange}
      readonly={readonly}
      emptySymbol={
        <img
          src=""
          className={styles.star}
          alt=""
        />
      }
      fullSymbol={
        <img
          src=""
          className={styles.star}
          alt=""
        />
      }
    />
  );
};

export default Form;

