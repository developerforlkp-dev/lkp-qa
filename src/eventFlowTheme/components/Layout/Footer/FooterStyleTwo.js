import React from 'react';
import { Link } from 'react-router-dom'; // Import the Link component from React Router

// Import images
import footerLogo from '../../../assets/images/resources/site-footer-logo-2.png'; // Replace with your actual path

const FooterTwo = () => {
    const events = [
        {
          date: "11 April 2024 At 10 Pm In Dhaka",
          title: "Ui/ux Designer Meetup",
          link: "/contact",
        },
        {
          date: "12 April 2024 At 11 Pm In Dhaka",
          title: "Web Development Workshop",
          link: "/contact",
        },
      ];
    
      const contactDetails = {
        email: "nafiz125@gmail.com",
        address: "3891 Ranchview Dr. Richardson",
        phone: ["01245789321", "012457895146"],
      };
    return (
        <>
      {/* Site Footer Start */}
      <footer className="site-footer-two">
        <div className="site-footer-two__top">
          <div className="container">
            <div className="site-footer-two__top-inner">
              <Link to="#" className="site-footer-two__top-content">
                Get Your <span>Ticket Now</span>{" "}
                <i className="icon-arrow-up"></i>
              </Link>
            </div>
          </div>
        </div>
        <div className="site-footer-two__middle">
          <div className="container">
            <div className="site-footer-two__middle-inner">
              <div className="row">
                <div
                  className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                  data-wow-delay="100ms"
                >
                  <div className="footer-widget__column footer-widget-two__about">
                    <div className="site-footer-two__logo">
                      <Link to="/">
                        <img
                          src={footerLogo}
                          alt=""
                        />
                      </Link>
                    </div>
                    <p className="footer-widget-two__about-text">
                      It is a long established fact that a <br /> reader will be
                      distracted
                    </p>
                    <div className="site-footer-two__social">
                      <Link to="#">
                        <i className="icon-facebook"></i>
                      </Link>
                      <Link to="#">
                        <i className="icon-fi"></i>
                      </Link>
                      <Link to="#">
                        <i className="icon-instagram"></i>
                      </Link>
                      <Link to="#">
                        <i className="icon-pinterest"></i>
                      </Link>
                    </div>
                  </div>
                </div>
                <div
                  className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                  data-wow-delay="200ms"
                >
                  <div className="footer-widget__column footer-widget__events">
                    <div className="footer-widget__title-box">
                      <h3 className="footer-widget__title">Upcoming Events</h3>
                    </div>
                    <ul className="footer-widget__events-list list-unstyled">
                      {events.map((event, index) => (
                        <li key={index}>
                          <p>{event.date}</p>
                          <h5>{event.title}</h5>
                          <Link to={event.link}>
                            Get a Ticket{" "}
                            <span className="icon-arrow-right"></span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div
                  className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                  data-wow-delay="300ms"
                >
                  <div className="footer-widget__column footer-widget__contact">
                    <div className="footer-widget__title-box">
                      <h3 className="footer-widget__title">Contact</h3>
                    </div>
                    <div className="footer-widget__contact-inner">
                      <ul className="footer-widget__contact-list list-unstyled">
                        <li>
                          <div className="icon">
                            <span className="icon-envelop"></span>
                          </div>
                          <div className="text">
                            <p>
                              <a href={`mailto:${contactDetails.email}`}>
                                {contactDetails.email}
                              </a>
                            </p>
                          </div>
                        </li>
                        <li>
                          <div className="icon">
                            <span className="icon-pin"></span>
                          </div>
                          <div className="text">
                            <p>{contactDetails.address}</p>
                          </div>
                        </li>
                        <li>
                          <div className="icon">
                            <span className="icon-call"></span>
                          </div>
                          <div className="text">
                            <p>
                              <a href={`tel:${contactDetails.phone[0]}`}>
                                {contactDetails.phone.join(", ")}
                              </a>
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div
                  className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp"
                  data-wow-delay="400ms"
                >
                  <div className="footer-widget__column footer-widget-two__newsletter">
                    <div className="footer-widget__title-box">
                      <h3 className="footer-widget__title">Newsletter</h3>
                    </div>
                    <p className="footer-widget-two__newsletter-text">
                      It is a long established fact that a <br /> reader will be
                      distracted
                    </p>
                    <form
                      className="footer-widget-two__newsletter-form mc-form"
                      data-url="MC_FORM_URL"
                      noValidate="noValidate"
                    >
                      <div className="footer-widget-two__newsletter-form-input-box">
                        <input
                          type="email"
                          placeholder="Email address.."
                          name="EMAIL"
                        />
                        <button
                          type="submit"
                          className="footer-widget-two__newsletter-btn"
                        >
                          <span className="icon-paper-plan"></span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="site-footer-two__bottom">
          <div className="container">
            <div className="site-footer-two__bottom-inner">
              <p className="site-footer-two__bottom-text">
                © EventFlow 2024 | All Rights Reserved
              </p>
              <ul className="list-unstyled site-footer-two__bottom-menu">
                <li>
                  <Link to="/about">Terms & Conditions</Link>
                </li>
                <li>
                  <Link to="/about">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/about">Contact Us</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* Site Footer End */}
    </>
    );
};

export default FooterTwo;