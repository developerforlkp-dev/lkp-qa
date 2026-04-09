import React from "react";
import IconSlide from '../../assets/images/icon/sliding-text-icon-1.png';

const SlidingTextOne = () => {
  const slidingTextItems = [
    { title: "ApexGuard Roofing", hoverText: "ApexGuard Roofing" },
    { title: "Crestview Roof", hoverText: "Crestview Roof", border: true },
    { title: "Elite Roof Care", hoverText: "Elite Roof Care" },
    { title: "Summit Shield", hoverText: "Summit Shield", border: true },
    { title: "AltitudeRoof Experts", hoverText: "AltitudeRoof Experts" },
  ];

  return (
    <section className="sliding-text-one">
      <div className="sliding-text-one__wrap">
        <ul className="sliding-text__list list-unstyled marquee_mode">
          {slidingTextItems.map((item, index) => (
            <li key={index}>
              <h2
                data-hover={item.hoverText}
                className={`sliding-text__title ${item.border ? "sliding-text__title-bdr" : ""}`}
              >
                {item.title}
                <img src={IconSlide} alt="" />
              </h2>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SlidingTextOne;
