import React, { useState, useRef, useEffect } from "react";
import cn from "classnames";
import styles from "./Browse.module.sass";
import Item from "./Item";
import Icon from "../Icon";

const Browse = ({
  classSection,
  headSmall,
  classTitle,
  title,
  info,
  items,
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
      setShowLeftArrow(currentScrollLeft > 10);
      setShowRightArrow(currentScrollLeft < scrollWidth - clientWidth - 10);
    };

    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);

    // Mouse wheel horizontal scroll (works with Shift key or horizontal scroll)
    const handleWheel = (e) => {
      // Support horizontal scrolling with Shift key or trackpad horizontal scroll
      if (e.shiftKey || e.deltaX !== 0) {
        e.preventDefault();
        const scrollAmount = e.shiftKey ? e.deltaY : e.deltaX;
        container.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      } else if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // Allow vertical scrolling to work normally
        return;
      } else if (e.deltaX !== 0) {
        // Horizontal trackpad scroll
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
      const walk = (x - startX.current) * 2; // Scroll speed multiplier
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

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const firstItem = container.firstElementChild;
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        const gap = 16;
        container.scrollBy({
          left: -(itemWidth + gap),
          behavior: "smooth",
        });
      }
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const firstItem = container.firstElementChild;
      if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        const gap = 16;
        container.scrollBy({
          left: itemWidth + gap,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <div className={cn(classSection, styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.inner}>
          <div className={cn(styles.head, { [styles.headSmall]: headSmall })}>
            {classTitle === "h2" && (
              <h2 className={cn(classTitle, styles.title)}>{title}</h2>
            )}
            {classTitle === "h4" && (
              <h4 className={cn(classTitle, styles.title)}>{title}</h4>
            )}
            {info && <div className={cn("info", styles.info)}>{info}</div>}
          </div>
          <div
            className={styles.scrollContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={styles.scrollWrapper}
              ref={scrollContainerRef}
            >
              {items.map((x, index) => (
                <Item className={styles.item} item={x} key={index} />
              ))}
            </div>
            {showLeftArrow && (
              <button
                className={cn(styles.arrowButton, styles.arrowLeft, {
                  [styles.arrowVisible]: isHovered,
                })}
                onClick={scrollLeft}
                aria-label="Scroll left"
              >
                <Icon name="arrow-prev" size="16" />
              </button>
            )}
            {showRightArrow && (
              <button
                className={cn(styles.arrowButton, styles.arrowRight, {
                  [styles.arrowVisible]: isHovered,
                })}
                onClick={scrollRight}
                aria-label="Scroll right"
              >
                <Icon name="arrow-next" size="16" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
