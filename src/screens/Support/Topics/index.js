import React from "react";
import cn from "classnames";
import styles from "./Topics.module.sass";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import Icon from "../../../components/Icon";
import Item from "./Item";

const topics = [
  {
    title: "Refund timelines",
    content:
      "We realize ideas from simple to complex, everything becomes easy to use and reach the most potential customers.",
    image: "",
  },
  {
    title: "Coronavirus disease",
    content:
      "We realize ideas from simple to complex, everything becomes easy to use and reach the most potential customers.",
    image: "",
  },
  {
    title: "Use a Fleet coupon",
    content:
      "We realize ideas from simple to complex, everything becomes easy to use and reach the most potential customers.",
    image: "",
  },
  {
    title: "Refund timelines",
    content:
      "We realize ideas from simple to complex, everything becomes easy to use and reach the most potential customers.",
    image: "",
  },
  {
    title: "Coronavirus disease",
    content:
      "We realize ideas from simple to complex, everything becomes easy to use and reach the most potential customers.",
    image: "",
  },
  {
    title: "Use a Fleet coupon",
    content:
      "We realize ideas from simple to complex, everything becomes easy to use and reach the most potential customers.",
    image: "",
  },
];

const SlickArrow = ({ currentSlide, slideCount, children, ...props }) => (
  <button {...props}>{children}</button>
);

const Topics = () => {
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
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
    responsive: [
      {
        breakpoint: 1023,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className={cn("section-pd section-bg", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.head}>
          <div className={cn("stage", styles.info)}>
            A creative agency that lead and inspire
          </div>
          <h2 className={cn("h2", styles.title)}>Popular topics</h2>
          <Link className={cn("button", styles.button)} to="/messages">
            Send message
          </Link>
        </div>
        <div className={styles.wrapper}>
          <Slider className="topics-slider" {...settings}>
            {topics.map((x, index) => (
              <Item className={styles.item} item={x} key={index} />
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default Topics;


