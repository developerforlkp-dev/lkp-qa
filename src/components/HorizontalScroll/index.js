import React, { useState, useRef, useEffect } from "react";
import cn from "classnames";
import styles from "./HorizontalScroll.module.sass";
import Icon from "../Icon";

/**
 * Reusable Horizontal Scroll Component with Arrow Controls
 * Provides consistent horizontal scrolling behavior across all homepage sections
 */
const HorizontalScroll = ({ 
  children, 
  className, 
  gap = 24,
  itemWidth = null // If provided, will use this for scroll calculation
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftPosition = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollLeft: currentScrollLeft, scrollWidth, clientWidth } = container;
      const hasScrollableContent = scrollWidth > clientWidth;
      setShowLeftArrow(hasScrollableContent && currentScrollLeft > 10);
      setShowRightArrow(hasScrollableContent && currentScrollLeft < scrollWidth - clientWidth - 10);
    };

    // Initial check
    checkScrollPosition();
    
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(checkScrollPosition, 100);
    
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    // Mouse wheel horizontal scroll (works with Shift key or horizontal scroll)
    const handleWheel = (e) => {
      if (e.shiftKey || e.deltaX !== 0) {
        e.preventDefault();
        const scrollAmount = e.shiftKey ? e.deltaY : e.deltaX;
        container.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      } else if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        return;
      } else if (e.deltaX !== 0) {
        e.preventDefault();
        container.scrollBy({
          left: e.deltaX,
          behavior: "smooth",
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    // Mouse drag handlers
    const handleMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - container.offsetLeft;
      scrollLeftPosition.current = container.scrollLeft;
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      container.style.cursor = "grab";
      container.style.userSelect = "";
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      container.style.cursor = "grab";
      container.style.userSelect = "";
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX.current) * 2;
      container.scrollLeft = scrollLeftPosition.current - walk;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const scrollLeft = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const container = scrollContainerRef.current;
    if (container) {
      const firstItem = container.firstElementChild;
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        const scrollGap = gap || 24;
        container.scrollBy({
          left: -(itemWidth + scrollGap),
          behavior: "smooth",
        });
      } else {
        // Fallback: scroll by container width
        container.scrollBy({
          left: -container.clientWidth * 0.8,
          behavior: "smooth",
        });
      }
    }
  };

  const scrollRight = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const container = scrollContainerRef.current;
    if (container) {
      const firstItem = container.firstElementChild;
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        const scrollGap = gap || 24;
        container.scrollBy({
          left: itemWidth + scrollGap,
          behavior: "smooth",
        });
      } else {
        // Fallback: scroll by container width
        container.scrollBy({
          left: container.clientWidth * 0.8,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div
      className={cn(styles.scrollContainer, className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={styles.scrollWrapper}
        ref={scrollContainerRef}
        style={{ gap: `${gap}px` }}
      >
        {children}
      </div>
      {showLeftArrow && (
        <button
          type="button"
          className={cn(styles.arrowButton, styles.arrowLeft, {
            [styles.arrowVisible]: isHovered,
          })}
          onClick={scrollLeft}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Scroll left"
        >
          <Icon name="arrow-prev" size="20" />
        </button>
      )}
      {showRightArrow && (
        <button
          type="button"
          className={cn(styles.arrowButton, styles.arrowRight, {
            [styles.arrowVisible]: isHovered,
          })}
          onClick={scrollRight}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Scroll right"
        >
          <Icon name="arrow-next" size="20" />
        </button>
      )}
    </div>
  );
};

export default HorizontalScroll;

