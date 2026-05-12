import React from "react";
import cn from "classnames";
import styles from "./CheckoutSlider.module.sass";
import Slider from "react-slick";
import Icon from "../../../components/Icon";

const SlickArrow = ({ currentSlide, slideCount, children, ...props }) => (
  <button {...props}>{children}</button>
);

const CheckoutSlider = ({ className, gallery }) => {
  const settings = {
    infinite: gallery.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: gallery.length > 1,
    nextArrow: (
      <SlickArrow>
        <Icon name="arrow-next" size="14" />
      </SlickArrow>
    ),
    prevArrow: (
      <SlickArrow>
        <Icon name="arrow-prev" size="14" />
      </SlickArrow>
    ),
  };

  return (
    <div className={cn(className, styles.slider)}>
      <div className={styles.wrapper}>
        <Slider className="checkout-slider" {...settings}>
          {gallery.map((x, index) => (
            <div className={styles.preview} key={index}>
              <img srcSet={`${x.srcSet} 2x`} src={x.src} alt="Nature" />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default CheckoutSlider;
