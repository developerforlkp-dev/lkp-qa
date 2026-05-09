import React from "react";
import cn from "classnames";
import styles from "./CheckoutSlider.module.sass";

const CheckoutSlider = ({ className, gallery }) => {
  const image = gallery && gallery.length > 0 ? gallery[0] : null;

  if (!image) return null;

  return (
    <div className={cn(className, styles.slider)}>
      <div className={styles.preview}>
        <img 
          srcSet={image.srcSet ? `${image.srcSet} 2x` : undefined} 
          src={image.src} 
          alt="Experience" 
        />
      </div>
    </div>
  );
};

export default CheckoutSlider;
