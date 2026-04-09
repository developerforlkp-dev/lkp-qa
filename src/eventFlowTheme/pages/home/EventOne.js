"use client"; // Ensures the component runs on the client side

import { useState } from "react";
import { Link } from 'react-router-dom';
import eventImg from '../../assets/images/resources/event-one-img-1.jpg';

export default function EventOne() {
  // State for dynamic content
  const [eventContent] = useState({
    sectionTagline: "About Our Event",
    sectionTitle: "Uniting Creating of the Memories",
    buttonText: "Join The Event",
    buttonLink: "/event-details?id=2",
    points: [
      {
        id: 1,
        iconClass: "icon-air-horn",
        title: "Artists & bands",
        description:
          "Events bring people together for a shared experience celebration. From weddings and birthdays to conferences.",
        link: "/event",
      },
      {
        id: 2,
        iconClass: "icon-party-blower",
        title: "Audience Event Planner",
        description:
          "Events bring people together for a shared experience celebration. From weddings and birthdays to conferences.",
        link: "/event",
      },
    ],
    eventImage: eventImg,
  });

  return (
    <>
      {/* Event One Start */}
      <section id="th-about" className="event-one">
        <div className="container">
          <div
            className="event-one__inner wow fadeInUp"
            data-wow-delay="300ms"
          >
            <div className="event-one__top">
              <div className="section-title text-left">
                <div className="section-title__tagline-box">
                  <span className="section-title__tagline">
                    {eventContent.sectionTagline}
                  </span>
                </div>
                <h2 className="section-title__title">
                  {eventContent.sectionTitle}
                </h2>
              </div>
              <div className="event-one__btn-box">
                <Link to={eventContent.buttonLink} className="event-one__btn thm-btn">
                  {eventContent.buttonText}
                  <span className="icon-arrow-right"></span>
                </Link>
              </div>
            </div>

            <ul className="list-unstyled event-one__points">
              {eventContent.points.map((point) => (
                <li key={point.id}>
                  <div className="icon">
                    <span className={point.iconClass}></span>
                  </div>
                  <div className="content">
                    <h4>
                      <Link to={point.link}>{point.title}</Link>
                    </h4>
                    <p>{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="event-one__img-box">
              <img src={eventContent.eventImage} alt="Event" />
            </div>
          </div>
        </div>
      </section>
      {/* Event One End */}
    </>
  );
}
