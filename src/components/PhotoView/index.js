import React, { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import OutsideClickHandler from "react-outside-click-handler";
import cn from "classnames";
import styles from "./PhotoView.module.sass";
import Icon from "../Icon";
import Share from "../Share";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { lockBodyScroll } from "../../utils/scrollLock";

const SlickArrow = ({ currentSlide, slideCount, children, ...props }) => (
  <button {...props}>{children}</button>
);

const PhotoView = ({ title, initialSlide, visible, items, onClose, listingId, options, variant }) => {
  const [current, setCurrent] = useState(initialSlide);
  const [direction, setDirection] = useState("next");
  const [transitionStep, setTransitionStep] = useState(0);
  const isMinimal = variant === "minimal";

  const escFunction = useCallback(
    (e) => {
      if (e.keyCode === 27) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);
    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, [escFunction]);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    return lockBodyScroll();
  }, [visible]);

  useEffect(() => {
    setCurrent(initialSlide);
  }, [initialSlide]);

  const hasMultipleItems = items?.length > 1;

  const settings = {
    initialSlide: initialSlide,
    infinite: true,
    speed: 620,
    cssEase: "cubic-bezier(0.22, 1, 0.36, 1)",
    fade: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: hasMultipleItems,
    beforeChange: (oldIndex, nextIndex) => {
      const isForward =
        nextIndex > oldIndex || (oldIndex === items.length - 1 && nextIndex === 0);
      setDirection(isForward ? "next" : "prev");
      setTransitionStep((step) => step + 1);
    },
    nextArrow: (
      <SlickArrow>
        <span aria-hidden="true">&gt;</span>
      </SlickArrow>
    ),
    prevArrow: (
      <SlickArrow>
        <span aria-hidden="true">&lt;</span>
      </SlickArrow>
    ),
  };

  const handleAfterChange = (e) => {
    setCurrent(e);
  };

  if (!visible || !items || items.length === 0) {
    return null;
  }

  return createPortal(
    <div className={cn(styles.modal, { [styles.minimalModal]: isMinimal })} ref={scrollRef} onClick={isMinimal ? onClose : undefined}>
      <div className={styles.outer}>
        <OutsideClickHandler onOutsideClick={onClose}>
          <div className={cn(styles.container, { [styles.minimalContainer]: isMinimal })} onClick={isMinimal ? (e) => e.stopPropagation() : undefined}>
            <div className={styles.control}>
              {!isMinimal && (
                <Link
                  to={{
                    pathname: "/full-photo",
                    state: {
                      gallery: items,
                      title,
                      listingId,
                      options: options || [],
                    },
                  }}
                  className={cn("button-stroke button-small", styles.button)}
                  onClick={onClose}
                >
                  <Icon name="image" size="16" />
                  <span>Show all photos</span>
                </Link>
              )}
              <div className={cn(styles.counter, { [styles.minimalCounter]: isMinimal })}>
                {current + 1}/{items.length}
              </div>
              <div className={styles.btns}>
                {!isMinimal && <Share className={styles.share} darkButton />}
                <button
                  className={cn(
                    "button-circle-stroke button-small",
                    styles.button,
                    { [styles.minimalClose]: isMinimal }
                  )}
                  onClick={onClose}
                >
                  <Icon name="close" size="24" />
                </button>
              </div>
            </div>
            <div className={cn(styles.wrapper, { [styles.minimalWrapper]: isMinimal })}>
              <Slider
                className={cn("photo-slider", styles.slider, {
                  [styles.prev]: direction === "prev",
                  [styles.next]: direction === "next",
                  [styles.motionA]: transitionStep % 2 === 0,
                  [styles.motionB]: transitionStep % 2 === 1,
                  [styles.minimalSlider]: isMinimal
                })}
                afterChange={handleAfterChange}
                {...settings}
              >
                {items.map((x, index) => (
                  <div className={styles.slide} key={index} onClick={isMinimal ? onClose : undefined}>
                    <div className={styles.preview}>
                      <img className={cn(styles.image, { [styles.minimalImage]: isMinimal })} src={x} alt="Gallery" onClick={isMinimal ? (e) => e.stopPropagation() : undefined} />
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
            {!isMinimal && <div className={styles.title}>{title}</div>}
          </div>
        </OutsideClickHandler>
      </div>
    </div>,
    document.body
  );
};

export default PhotoView;
