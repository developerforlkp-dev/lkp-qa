import React from 'react';

const CTAOne = (props) => {
  const {
    title,
    subtitle,
    shapeImageUrl,
    mainImageUrl,
    linkUrl,
    linkText,
    className
  } = props;

  return (
    // CTA One Start
    <section className={className || "cta-one"}>
      <div className="container">
        <div className="cta-one__inner">
          <div className="cta-one__shape-1">
            <img src={shapeImageUrl} alt="Shape" />
          </div>
          <div className="cta-one__img-one">
            <img src={mainImageUrl} alt="Main" />
          </div>
          <div className="cta-one__content">
            <div className="cta-one__icon">
              <span className="icon-box-2"></span>
            </div>
            <h3 className="cta-one__title">
              {title}<br />{subtitle}
            </h3>
          </div>
          <div className="cta-one__btn-box">
            <a href={linkUrl} className="cta-one__btn thm-btn-two">
              {linkText} <span className="icon-dubble-arrow-right"></span>
            </a>
          </div>
        </div>
      </div>
    </section>
    // CTA One End
  );
};

export default CTAOne;
