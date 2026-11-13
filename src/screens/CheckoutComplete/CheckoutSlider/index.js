import React from "react";
import cn from "classnames";
import styles from "./CheckoutSlider.module.sass";
import Slider from "react-slick";
import Icon from "../../../components/Icon";

const CheckoutSlider = ({ className, gallery }) => {
  const settings = {
    infinite: gallery.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,
    pauseOnFocus: false,
    initialSlide: 0,
  };

  return (
    <div className={cn(className, styles.slider)}>
      <div className={styles.wrapper}>
        <Slider className="checkout-slider" {...settings} key={gallery.length}>
          {gallery.map((x, index) => (
            <div className={styles.preview} key={index}>
              <img
                srcSet={x.srcSet ? `${x.srcSet} 2x` : undefined}
                src={x.src}
                alt="Nature"
                onError={(event) => {
                  if (window.matchMedia("(max-width: 767px)").matches) {
                    event.currentTarget.style.display = "none";
                  }
                }}
              />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default CheckoutSlider;
