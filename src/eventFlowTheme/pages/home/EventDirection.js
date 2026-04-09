"use client"; // Ensures the component runs on the client side

import { useState } from "react";
import CountUp from "react-countup";
import directionIcon from '../../assets/images/icon/event-direction-chat-icon.png';

export default function EventDirection() {
  // State for dynamic content
  const [eventContent] = useState({
    tagline: "Our Event Direction",
    title: "Creating Memories <br> One Event Time",
    text: "Events bring people together for a shared experience and celebration. <br> From weddings and birthdays to conferences.",
    phone: "3075550133",
    callText: "Call Us",
    callNumber: "(307) 555-0133",
    iconSrc: directionIcon,
  });

  return (
    <>
      {/* Event Direction Start */}
      <section className="event-direction">
        <div className="container">
          <div className="event-direction__inner">
            <div className="row">
              <div className="col-xl-7 wow fadeInLeft" data-wow-delay="100ms">
                <div className="event-direction__left">
                  <div className="section-title text-left">
                    <div className="section-title__tagline-box">
                      <span className="section-title__tagline">{eventContent.tagline}</span>
                    </div>
                    <h2 className="section-title__title" dangerouslySetInnerHTML={{ __html: eventContent.title }}></h2>
                  </div>
                  <p className="event-direction__text" dangerouslySetInnerHTML={{ __html: eventContent.text }}></p>
                  <div className="event-direction__call">
                    <div className="event-direction__call-icon">
                      <img src={eventContent.iconSrc} alt="Call Icon" />
                    </div>
                    <div className="event-direction__call-content">
                      <p>{eventContent.callText}</p>
                      <h4><a href={`tel:${eventContent.phone}`}>{eventContent.callNumber}</a></h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-5 wow fadeInRight" data-wow-delay="300ms">
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
      {/* Event Direction End */}
    </>
  );
}
