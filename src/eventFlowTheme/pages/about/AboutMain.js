import React from 'react';
import { Link } from 'react-router-dom'; // Use react-router-dom for routing
import CountUp from "react-countup";
import BrandSlider1 from '../../components/Slider/BrandSlider1';
import bayticket from '../../assets/images/resources/buy-ticket-img.jpg';
import eventImg from '../../assets/images/resources/event-one-img-1.jpg';
import starIocn1 from '../../assets/images/icon/star-icon.png';
import EventOne from '../../components/Common/EventOne'; // Import the EventOne component
// Example usage of the component with dynamic content
const points = [
    {
      icon: "icon-air-horn",
      heading: "Artists & bands",
      description:
        "Events bring people together for a shared experience celebration. From weddings and birthdays to conferences.",
    },
    {
      icon: "icon-party-blower",
      heading: "Audience Event Planner",
      description:
        "Events bring people together for a shared experience celebration. From weddings and birthdays to conferences.",
    },
  ];


const AboutMain = () => {
    
    return (
        <React.Fragment>

        <EventOne
            tagline="About Our Event"
            title="Uniting Creating of the Memories"
            buttonText="Join The Event"
            points={points}
            imageUrl={eventImg}
          />

        {/* Sliding Text Start */}
          <section className="sliding-text-one">
            <div className="sliding-text-one__wrap">
              <ul className="sliding-text__list marquee_mode">
                <li>
                  <h2
                    data-hover="Magic of Events"
                    className="sliding-text__title"
                  >
                    Magic of Events
                    <img
                      src={starIocn1}
                      alt="Star Icon"
                    />
                  </h2>
                </li>
                <li>
                  <h2
                    data-hover="Celebrate Life"
                    className="sliding-text__title"
                  >
                    Celebrate Life
                    <img
                      src={starIocn1}
                      alt="Star Icon"
                    />
                  </h2>
                </li>
                <li>
                  <h2
                    data-hover="Magic of Events"
                    className="sliding-text__title"
                  >
                    Magic of Events
                    <img
                      src={starIocn1}
                      alt="Star Icon"
                    />
                  </h2>
                </li>
                <li>
                  <h2
                    data-hover="Celebrate Life"
                    className="sliding-text__title"
                  >
                    Celebrate Life
                    <img
                      src={starIocn1}
                      alt="Star Icon"
                    />
                  </h2>
                </li>
                <li>
                  <h2
                    data-hover="Magic of Events"
                    className="sliding-text__title"
                  >
                    Magic of Events
                    <img
                      src={starIocn1}
                      alt="Star Icon"
                    />
                  </h2>
                </li>
                <li>
                  <h2
                    data-hover="Celebrate Life"
                    className="sliding-text__title"
                  >
                    Celebrate Life
                    <img
                      src={starIocn1}
                      alt="Star Icon"
                    />
                  </h2>
                </li>
              </ul>
            </div>
          </section>
        {/* Sliding Text End */}

        <section className="buy-ticket">
            <div className="container">
              <div className="row">
                <div className="col-xl-6">
                  <div
                    className="buy-ticket__left wow fadeInLeft"
                    data-wow-delay="100ms"
                  >
                    <ul className="buy-ticket__address list-unstyled">
                      <li>
                        <div className="icon">
                          <span className="icon-clock"></span>
                        </div>
                        <div className="text">
                          <p>Mirpur 01 Road N 12 Dhaka Bangladesh</p>
                        </div>
                      </li>
                      <li>
                        <div className="icon">
                          <span className="icon-pin"></span>
                        </div>
                        <div className="text">
                          <p>10 Am To 10 Pm 20 April 2024</p>
                        </div>
                      </li>
                    </ul>
                    <h3 className="buy-ticket__title">
                      Grab Your Seat Wow Or You May Regret it Once
                    </h3>
                    <p className="buy-ticket__text">
                      Events bring people together for a shared experien
                      celebration a From weddings and <br />
                      birthdays to conferences Events bring people together for
                      a shared
                    </p>
                    <div className="buy-ticket__btn-box">
                      <Link to="/contact" className="buy-ticket__btn-1 thm-btn">
                        Buy Your Ticket
                        <span className="icon-arrow-right"></span>
                      </Link>
                      <Link to="/contact" className="buy-ticket__btn-2 thm-btn">
                        Contact Us<span className="icon-arrow-right"></span>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-xl-6">
                  <div
                    className="buy-ticket__right wow fadeInRight"
                    data-wow-delay="300ms"
                  >
                    <div className="buy-ticket__img">
                      <img
                        src={bayticket}
                        alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/*Brand One Start*/}
          <section className="brand-one">
            <div className="container">
              <BrandSlider1 />
            </div>
          </section>
        {/*Brand One End*/}

        <section className="event-direction event-direction-two">
            <div className="container">
            <div className="event-direction__inner">
                <div className="row">
                <div
                    className="col-xl-7 wow fadeInLeft"
                    data-wow-delay="100ms"
                >
                    <div className="event-direction__left">
                    <div className="section-title text-left">
                        <div className="section-title__tagline-box">
                        <span className="section-title__tagline">
                            Our Event Direction
                        </span>
                        </div>
                        <h2 className="section-title__title">
                        Creating Memories <br /> One Event Time
                        </h2>
                    </div>
                    <p className="event-direction__text">
                        Events bring people together for a shared experien
                        celebration a <br />
                        From weddings and birthdays to conferences
                    </p>
                    <div className="event-direction__call">
                        <div className="event-direction__call-icon">
                        <img
                            src="/assets/images/icon/event-direction-chat-icon.png"
                            alt=""
                        />
                        </div>
                        <div className="event-direction__call-content">
                        <p>Call Us</p>
                        <h4>
                            <a href="tel:3075550133">(307) 555-0133</a>
                        </h4>
                        </div>
                    </div>
                    </div>
                </div>
                <div
                    className="col-xl-5 wow fadeInRight"
                    data-wow-delay="300ms"
                >
                    <div className="event-direction__right">
                    <ul className="event-direction__counter list-unstyled">
                        <li>
                        <div className="event-direction__counter-single">
                            <div className="event-direction__counter-box">
                            <h3 className="odometer">
                                <CountUp start={0} end={100} duration={2} />
                            </h3>
                            <span className="event-direction__counter-plus">
                                +
                            </span>
                            </div>
                            <p className="event-direction__counter-text">
                            Our Event Artists
                            </p>
                        </div>
                        </li>
                        <li>
                        <div className="event-direction__counter-single">
                            <div className="event-direction__counter-box">
                            <h3 className="odometer">
                                <CountUp start={0} end={101} duration={2} />
                            </h3>
                            <span className="event-direction__counter-plus">
                                +
                            </span>
                            </div>
                            <p className="event-direction__counter-text">
                            Hours Of Music
                            </p>
                        </div>
                        </li>
                        <li>
                        <div className="event-direction__counter-single">
                            <div className="event-direction__counter-box">
                            <h3 className="odometer">
                                <CountUp start={0} end={10} duration={2} />
                            </h3>
                            <span className="event-direction__counter-plus">
                                +
                            </span>
                            </div>
                            <p className="event-direction__counter-text">
                            Event Stages
                            </p>
                        </div>
                        </li>
                        <li>
                        <div className="event-direction__counter-single">
                            <div className="event-direction__counter-box">
                            <h3 className="odometer">
                                <CountUp start={0} end={20} duration={2} />
                            </h3>
                            <span className="event-direction__counter-plus">
                                +
                            </span>
                            </div>
                            <p className="event-direction__counter-text">
                            Music Brands
                            </p>
                        </div>
                        </li>
                    </ul>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
        </React.Fragment>
    );
};

export default AboutMain;
