import React from 'react';
import { Link } from 'react-router-dom';
// Import images
import ctaTwoBg from '../../../assets/images/backgrounds/cta-two-bg.jpg';
import ctaTwoImg from '../../../assets/images/resources/cta-two-img-1.png';


const CtaThree = () => {
  return (
    <section className="cta-two cta-four">
      <div className="container">
        <div className="cta-two__inner">
          <div
            className="cta-two__bg"
            style={{ backgroundImage: `url(${ctaTwoBg})` }}
          ></div>
          <div className="cta-two__img-and-content">
            <div className="cta-two__img">
              <img src={ctaTwoImg} alt="" />
            </div>
            <div className="cta-two__content">
              <h3 className="cta-two__title">One Shingle at a Time</h3>
              <p className="cta-two__text">
                Roof service involves the installation, maintenance, and repair of roofs for residential and commercial buildings. The contractors
              </p>
              <div className="cta-two__btn-box">
                <Link to="contact.html" className="cta-two__btn thm-btn-two">
                  Contact Us<span className="icon-dubble-arrow-right"></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaThree;
