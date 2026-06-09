import React, { useState, useRef, useEffect } from "react";
import cn from "classnames";
import styles from "./Itinerary.module.sass";
import Icon from "../Icon";
import Modal from "../Modal";

const defaultItems = [
  {
    title: "Wine Tasting Tour",
    description: "Explore the finest vineyards in Queenstown with a guided tour of local wineries, sampling premium New Zealand wines and learning about the region's wine-making heritage.",
    fullDescription: "Explore the finest vineyards in Queenstown with a guided tour of local wineries, sampling premium New Zealand wines and learning about the region's wine-making heritage.",
    image: "",
    duration: "4 hours",
    highlights: ["Wine tastings", "Vineyard tours", "Local cheese pairings"],
  },
  {
    title: "Milford Sound Cruise",
    description: "Experience the breathtaking beauty of Milford Sound on a scenic cruise through pristine fjords, surrounded by towering mountains and cascading waterfalls.",
    fullDescription: "Experience the breathtaking beauty of Milford Sound on a scenic cruise through pristine fjords, surrounded by towering mountains and cascading waterfalls.",
    image: "",
    duration: "Full day",
    highlights: ["Scenic cruise", "Wildlife spotting", "Mountain views"],
  },
  {
    title: "Bungee Jumping Adventure",
    description: "Take the ultimate leap of faith with New Zealand's original bungee jump experience, featuring stunning views and an adrenaline rush you'll never forget.",
    fullDescription: "Take the ultimate leap of faith with New Zealand's original bungee jump experience, featuring stunning views and an adrenaline rush you'll never forget.",
    image: "",
    duration: "2 hours",
    highlights: ["Bungee jumping", "Safety briefing", "Certificate included"],
  },
  {
    title: "Hiking & Nature Walk",
    description: "Discover Queenstown's natural beauty on a guided hiking tour through scenic trails, offering panoramic views of lakes and mountains.",
    fullDescription: "Discover Queenstown's natural beauty on a guided hiking tour through scenic trails, offering panoramic views of lakes and mountains.",
    image: "",
    duration: "3-4 hours",
    highlights: ["Scenic trails", "Panoramic views", "Nature photography"],
  },
  {
    title: "Spa & Wellness Experience",
    description: "Relax and rejuvenate with a luxurious spa treatment, featuring massages, facials, and access to premium wellness facilities.",
    fullDescription: "Relax and rejuvenate with a luxurious spa treatment, featuring massages, facials, and access to premium wellness facilities.",
    image: "",
    duration: "2-3 hours",
    highlights: ["Massage therapy", "Facial treatments", "Wellness facilities"],
  },
  {
    title: "Skiing & Snowboarding",
    description: "Hit the slopes at world-class ski resorts near Queenstown, with options for all skill levels and stunning alpine scenery.",
    fullDescription: "Hit the slopes at world-class ski resorts near Queenstown, with options for all skill levels and stunning alpine scenery.",
    image: "",
    duration: "Full day",
    highlights: ["Ski equipment", "Lift passes", "Instructor available"],
  },
  {
    title: "Kayaking Adventure",
    description: "Paddle through crystal-clear waters on a kayaking tour, exploring hidden coves and enjoying the tranquility of Queenstown's lakes.",
    fullDescription: "Paddle through crystal-clear waters on a kayaking tour, exploring hidden coves and enjoying the tranquility of Queenstown's lakes.",
    image: "",
    duration: "3 hours",
    highlights: ["Kayak rental", "Safety equipment", "Guided tour"],
  },
  {
    title: "Helicopter Scenic Flight",
    description: "Soar above Queenstown's stunning landscapes on a helicopter flight, capturing aerial views of mountains, lakes, and valleys.",
    fullDescription: "Soar above Queenstown's stunning landscapes on a helicopter flight, capturing aerial views of mountains, lakes, and valleys.",
    image: "",
    duration: "30-60 minutes",
    highlights: ["Aerial views", "Photo opportunities", "Pilot commentary"],
  },
];

const Itinerary = ({ classSection, listing }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
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
      const cardWidth = 280;
      const gap = 16;
      container.scrollBy({
        left: -(cardWidth + gap),
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 280;
      const gap = 16;
      container.scrollBy({
        left: cardWidth + gap,
        behavior: "smooth",
      });
    }
  };

  const handleCardClick = (item, index, e) => {
    // Prevent card click when dragging
    if (isDragging.current) {
      e.preventDefault();
      return;
    }
    setSelectedActivity(item);
    setSelectedActivityIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedActivity(null);
    setSelectedActivityIndex(null);
  };

  const handleNext = () => {
    if (selectedActivityIndex !== null && selectedActivityIndex < dataItems.length - 1 && !isTransitioning) {
      const direction = 'next';
      setTransitionDirection(direction);
      setIsTransitioning(true);
      
      // Slide out current content
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const nextIndex = selectedActivityIndex + 1;
            setSelectedActivity(dataItems[nextIndex]);
            setSelectedActivityIndex(nextIndex);
            
            // Allow DOM to update, then slide in new content
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsTransitioning(false);
                // Clear direction after animation completes
                setTimeout(() => {
                  setTransitionDirection(null);
                }, 350);
              });
            });
          }, 300);
        });
      });
    }
  };

  const handlePrevious = () => {
    if (selectedActivityIndex !== null && selectedActivityIndex > 0 && !isTransitioning) {
      const direction = 'prev';
      setTransitionDirection(direction);
      setIsTransitioning(true);
      
      // Slide out current content
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const prevIndex = selectedActivityIndex - 1;
            setSelectedActivity(dataItems[prevIndex]);
            setSelectedActivityIndex(prevIndex);
            
            // Allow DOM to update, then slide in new content
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setIsTransitioning(false);
                // Clear direction after animation completes
                setTimeout(() => {
                  setTransitionDirection(null);
                }, 350);
              });
            });
          }, 300);
        });
      });
    }
  };

  // Map listing keyActivities to items if provided
  const dataItems = Array.isArray(listing?.keyActivities) && listing.keyActivities.length
    ? listing.keyActivities.map((act) => ({
        title: act.name || "Activity",
        description: act.description || act.pilot || "",
        fullDescription: act.description || act.pilot || "",
        image: (() => {
          const firstImg = Array.isArray(act.images) && act.images.length ? act.images[0] : null;
          if (!firstImg) return "";
          if (firstImg.url) return firstImg.url;
          if (firstImg.imageUrl) {
            return firstImg.imageUrl.startsWith("http")
              ? firstImg.imageUrl
              : `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${firstImg.imageUrl}`;
          }
          return "";
        })(),
        duration: "",
        highlights: [],
      }))
    : defaultItems;

  const canGoNext = selectedActivityIndex !== null && selectedActivityIndex < dataItems.length - 1;
  const canGoPrevious = selectedActivityIndex !== null && selectedActivityIndex > 0;

  return (
    <div className={cn("section", classSection, styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.inner}>
          <div className={styles.head}>
            <div className={styles.title}>What you'll do</div>
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
              {dataItems.map((x, index) => (
                <div
                  key={index}
                  className={styles.item}
                  onClick={(e) => handleCardClick(x, index, e)}
                >
                  <div className={styles.preview}>
                    <img src={x.image} alt={x.title} />
                  </div>
                  <div className={styles.body}>
                    <div className={styles.subtitle}>{x.title}</div>
                  </div>
                </div>
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
                <Icon name="arrow-prev" size="20" />
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
                <Icon name="arrow-next" size="20" />
              </button>
            )}
          </div>
        </div>
      </div>
      <Modal
        visible={!!selectedActivity}
        onClose={handleCloseModal}
        outerClassName={styles.modalOuter}
      >
        {selectedActivity && (
          <div className={styles.modalContent}>
            <div className={cn(styles.modalImage, {
              [styles.slideOutLeft]: isTransitioning && transitionDirection === 'next',
              [styles.slideOutRight]: isTransitioning && transitionDirection === 'prev',
              [styles.slideInRight]: !isTransitioning && transitionDirection === 'next',
              [styles.slideInLeft]: !isTransitioning && transitionDirection === 'prev',
            })}>
              <img
                src={selectedActivity.image}
                alt={selectedActivity.title}
              />
            </div>
            <div className={styles.modalText}>
              <div className={cn(styles.modalTextContent, {
                [styles.fadeOut]: isTransitioning,
                [styles.fadeIn]: !isTransitioning && transitionDirection,
              })}>
                <h2 className={styles.modalTitle}>{selectedActivity.title}</h2>
                <div className={styles.modalDescription}>
                  {selectedActivity.description}
                </div>
              </div>
              <div className={styles.modalNavigation}>
                {canGoPrevious && (
                  <button
                    className={cn("button-stroke", styles.navButton, styles.navButtonPrev)}
                    onClick={handlePrevious}
                    disabled={isTransitioning}
                  >
                    <Icon name="arrow-prev" size="16" />
                    <span>Previous</span>
                  </button>
                )}
                {canGoNext && (
                  <button
                    className={cn("button", styles.navButton, styles.navButtonNext)}
                    onClick={handleNext}
                    disabled={isTransitioning}
                  >
                    <span>Next</span>
                    <Icon name="arrow-next" size="16" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Itinerary;

