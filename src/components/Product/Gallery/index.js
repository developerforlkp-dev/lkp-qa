import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Gallery.module.sass";
import Icon from "../../Icon";
import PhotoView from "../../PhotoView";

const Gallery = ({ className, items, type, title, options, listingId }) => {
  const [initialSlide, setInitialSlide] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleOpen = (index) => {
    setInitialSlide(index);
    setVisible(true);
  };

  // Determine how many images to show in the grid
  const imageCount = items.length;
  const maxDisplayImages = 6;
  const displayImages = Math.min(imageCount, maxDisplayImages);
  const showMoreButton = imageCount > maxDisplayImages;

  // Get dynamic class based on image count for "experience" type
  const getImageCountClass = () => {
    if (type !== "experience") return "";
    // Only apply custom classes for 1-3 images to prevent empty spaces
    // For 4-6 images, use default layout which works fine
    if (displayImages <= 3) {
      return styles[`count${displayImages}`] || "";
    }
    return "";
  };

  return (
    <>
      <div className={cn(styles.gallery, className)}>
        <div
          className={cn(
            styles.list,
            {
              [styles.experience]: type === "experience",
            },
            {
              [styles.cars]: type === "cars",
            },
            {
              [styles.tour]: type === "tour",
            },
            getImageCountClass()
          )}
        >
          {items.slice(0, displayImages).map((x, index) => {
            return (
              <div
                className={styles.preview}
                key={index}
                onClick={() => handleOpen(index)}
              >
                <div className={styles.view}>
                  <img src={x} alt="Product Details"></img>
                </div>
              </div>
            );
          })}
          {showMoreButton && (
            <Link
              to={{
                pathname: "/full-photo",
                state: { 
                  gallery: items,
                  title: title || "Gallery",
                  options: options || [],
                  listingId,
                }
              }}
              className={cn(styles.preview, styles.morePhotos)}
            >
              <div className={styles.moreImageWrapper}>
                <img src={items[maxDisplayImages]} alt="More photos" />
              </div>
              <div className={styles.moreButton}>
                <Icon name="arrow-next" size="16" />
                <span>More</span>
              </div>
            </Link>
          )}
        </div>
      </div>
      <PhotoView
        title={title || "Gallery"}
        initialSlide={initialSlide}
        visible={visible}
        items={items}
        listingId={listingId}
        options={options}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

export default Gallery;
