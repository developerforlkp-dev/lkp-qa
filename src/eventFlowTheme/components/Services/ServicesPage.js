import React from 'react';
import { Link } from 'react-router-dom'; // Use react-router-dom for routing

export default function ServicesPage({ services }) {
  return (
    <>
      {/* Services Page Start */}
      <section className="services-page">
            <div className="container">
              <div className="row">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`col-xl-4 col-lg-4 col-md-6 wow fadeInLeft`}
                    data-wow-delay={service.wowDelay}
                  >
                    <div className="services-one__single">
                      <div className="services-one__icon">
                        <span className={service.icon}></span>
                      </div>
                      <h3 className="services-one__title">
                        <Link to={service.link}>{service.title}</Link>
                      </h3>
                      <p className="services-one__text">
                        {service.description}
                      </p>
                      <Link
                        to={service.link}
                        className="services-one__read-more"
                      >
                        Read More <span className="icon-arrow-right"></span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
      {/* Services Page End */}
    </>
  );
}
