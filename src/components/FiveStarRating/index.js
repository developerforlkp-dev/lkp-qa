import React from "react";
import cn from "classnames";
import styles from "./FiveStarRating.module.sass";

const FiveStarRating = ({ rating, size = 14, className }) => {
  const numericRating = Math.min(5, Math.max(0, parseFloat(rating) || 0));
  
  // Star SVG path from design system
  const starPath = "M9.69 1.529l1.442 2.838 3.238.457c1.517.214 2.211 2.086 1.041 3.192l-2.326 2.198.547 3.098c.28 1.587-1.404 2.653-2.73 1.977L8 13.809l-2.903 1.481c-1.328.678-3.011-.391-2.731-1.976l.547-3.098L.588 8.017C-.582 6.91.114 5.038 1.628 4.824l3.239-.457L6.31 1.529c.697-1.371 2.683-1.372 3.38 0z";

  const renderStar = (index) => {
    // Determine the fill level for the current star
    // Fully filled if numericRating >= index + 1
    // Unfilled if numericRating <= index
    // Partially filled if index < numericRating < index + 1
    let fillLevel = 0;
    if (numericRating >= index + 1) {
      fillLevel = 1;
    } else if (numericRating > index) {
      fillLevel = numericRating - index;
    }

    return (
      <div 
        key={index} 
        className={styles.starWrapper} 
        style={{ width: size, height: size }}
      >
        {/* Background Empty Star */}
        <svg
          className={cn(styles.starSvg, styles.starBg)}
          viewBox="0 0 16 16"
        >
          <path fill="currentColor" d={starPath} />
        </svg>

        {/* Foreground Filled Star (with overflow hidden clipping for decimal rendering) */}
        {fillLevel > 0 && (
          <div 
            className={styles.starFillContainer}
            style={{ width: `${fillLevel * 100}%` }}
          >
            <svg
              className={cn(styles.starSvg, styles.starFill)}
              viewBox="0 0 16 16"
              style={{ width: size, height: size }}
            >
              <path fill="currentColor" d={starPath} />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(styles.ratingContainer, className)}>
      {[0, 1, 2, 3, 4].map((index) => renderStar(index))}
    </div>
  );
};

export default FiveStarRating;
