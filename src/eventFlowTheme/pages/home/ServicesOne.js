"use client"; // Ensures the component runs on the client side

import { Link } from 'react-router-dom';
import { useState } from "react";

export default function ServicesOne() {
  // State for dynamic data (e.g., dynamic images, text, links)
  const [servicesContent] = useState({
    sectionTagline: "event benefits",
    sectionTitle: "Why should you join our event",
    services: [
      {
        id: 1,
        title: "Eventful Ventures",
        description: "Events bring people together for a shared experience and from weddings.",
        icon: "icon-camera",
        link: "/event-prodigy",
      },
      {
        id: 2,
        title: "Stellar Events Co",
        description: "Events bring people together for a shared experience and from weddings.",
        icon: "icon-skewer",
        link: "/stellar-events-co",
      },
      {
        id: 3,
        title: "Elite Event Management",
        description: "Events bring people together for a shared experience and from weddings.",
        icon: "icon-dinner-table",
        link: "/elite-event-management",
      },
    ],
  });

  return (
    <>
      {/* Services One Start */}
      <section id="th-service" className="services-one">
        <div className="container">
          <div className="section-title text-center">
            <div className="section-title__tagline-box">
              <span className="section-title__tagline">{servicesContent.sectionTagline}</span>
            </div>
            <h2 className="section-title__title">{servicesContent.sectionTitle}</h2>
          </div>
          <div className="row">
            {servicesContent.services.map((service) => (
              <div key={service.id} className="col-xl-4 col-lg-4 wow fadeInLeft" data-wow-delay="100ms">
                <div className="services-one__single">
                  <div className="services-one__icon">
                    <span className={service.icon}></span>
                  </div>
                  <h3 className="services-one__title">
                    <Link to={service.link}>{service.title}</Link>
                  </h3>
                  <p className="services-one__text">{service.description}</p>
                  <Link to={service.link} className="services-one__read-more">
                    Read More <span className="icon-arrow-right"></span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Services One End */}
    </>
  );
}
