import React, { useState } from "react";
import cn from "classnames";
import styles from "./Receipt.module.sass";
import Icon from "../Icon";

const Receipt = ({
  className,
  items,
  children,
  priceOld,
  priceActual,
  time,
  stacked,
  onItemClick,
  renderItem, // Custom render function for items
  avatar,
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const defaultAvatar = "/images/content/avatar.jpg";
  const avatarSrc = avatar || "/images/content/avatar.jpg";

  return (
    <div className={cn(className, styles.receipt)}>
      <div className={styles.head}>
        <div className={styles.details}>
          <div className={styles.cost}>
            {priceActual && (
              <>
            <div className={styles.actual}>{priceActual}</div>
            <div className={styles.note}>/{time}</div>
              </>
            )}
          </div>
          <div className={styles.rating}>
            <Icon name="star" size="20" />
            <div className={styles.number}>4.8</div>
            <div className={styles.reviews}>(256 reviews)</div>
          </div>
        </div>
        <div className={styles.avatar}>
          <img 
            src={avatarError ? defaultAvatar : avatarSrc} 
            alt="Avatar"
            onError={() => setAvatarError(true)}
          />
          <div className={styles.check}>
            <Icon name="check" size="12" />
          </div>
        </div>
      </div>
      <div
        className={cn(styles.description, {
          [styles.flex]: items.length > 1 && !stacked,
        })}
      >
        {/* First row: Date and Time slot */}
        {items.length >= 2 && (
          <div className={styles.itemsRow}>
            {items.slice(0, 2).map((x, index) => {
              // Use custom render function if provided
              if (renderItem) {
                const customRender = renderItem(x, index);
                if (customRender) {
                  return <div key={index} className={styles.itemWrapper}>{customRender}</div>;
                }
              }
              
              // Default rendering
              return (
                <div
                  className={styles.item}
                  key={index}
                  onClick={onItemClick ? () => onItemClick(index) : undefined}
                  role={onItemClick ? "button" : undefined}
                >
                  <div className={styles.icon}>
                    <Icon name={x.icon} size="24" />
                  </div>
                  <div className={styles.box}>
                    <div className={styles.category}>{x.category}</div>
                    <div className={styles.subtitle}>{x.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Second row: Guest (and any remaining items) */}
        {items.length >= 3 && (
          <div className={styles.itemsRow}>
            {items.slice(2).map((x, index) => {
              const actualIndex = index + 2;
              // Use custom render function if provided
              if (renderItem) {
                const customRender = renderItem(x, actualIndex);
                if (customRender) {
                  return <div key={actualIndex} className={styles.itemWrapper}>{customRender}</div>;
                }
              }
              
              // Default rendering
              return (
                <div
                  className={styles.item}
                  key={actualIndex}
                  onClick={onItemClick ? () => onItemClick(actualIndex) : undefined}
                  role={onItemClick ? "button" : undefined}
                >
                  <div className={styles.icon}>
                    <Icon name={x.icon} size="24" />
                  </div>
                  <div className={styles.box}>
                    <div className={styles.category}>{x.category}</div>
                    <div className={styles.subtitle}>{x.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Fallback for items that don't match the pattern */}
        {items.length < 2 && items.map((x, index) => {
          // Use custom render function if provided
          if (renderItem) {
            const customRender = renderItem(x, index);
            if (customRender) {
              return <div key={index} className={styles.itemWrapper}>{customRender}</div>;
            }
          }
          
          // Default rendering
          return (
            <div
              className={styles.item}
              key={index}
              onClick={onItemClick ? () => onItemClick(index) : undefined}
              role={onItemClick ? "button" : undefined}
            >
              <div className={styles.icon}>
                <Icon name={x.icon} size="24" />
              </div>
              <div className={styles.box}>
                <div className={styles.category}>{x.category}</div>
                <div className={styles.subtitle}>{x.title}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default Receipt;
