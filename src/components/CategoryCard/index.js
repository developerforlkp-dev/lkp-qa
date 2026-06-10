import React from "react";
import cn from "classnames";
import styles from "./CategoryCard.module.sass";

const CategoryCard = ({ item, isActive, onClick, disabled }) => {
  return (
    <div
      className={cn(styles.card, {
        [styles.active]: isActive,
        [styles.disabled]: disabled,
      })}
      onClick={() => {
        if (!disabled && onClick) {
          onClick(item.id);
        }
      }}
    >
      <div className={styles.imageContainer}>
        <div className={styles.imageBlob} />
        <div className={styles.imageWrapper}>
          <img src={item.image} alt={item.label} className={styles.image} />
          {isActive && <div className={styles.activeBorder} />}
        </div>
      </div>
      <div className={styles.title}>{item.label}</div>
      <div className={styles.description}>{item.description}</div>
    </div>
  );
};

export default CategoryCard;
