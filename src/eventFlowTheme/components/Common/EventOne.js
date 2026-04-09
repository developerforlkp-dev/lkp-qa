

import { Link } from 'react-router-dom';

const EventOne = ({ tagline, title, buttonText, points, imageUrl }) => {
  return (
    <section className="event-one event-three">
      <div className="container">
        <div className="event-one__inner wow fadeInUp" data-wow-delay="300ms">
          <div className="event-one__top">
            <div className="section-title text-left">
              <div className="section-title__tagline-box">
                <span className="section-title__tagline">{tagline}</span>
              </div>
              <h2 className="section-title__title">{title}</h2>
            </div>
            <div className="event-one__btn-box">
              <Link to="/event-details" className="event-one__btn thm-btn">
                  {buttonText} <span className="icon-arrow-right"></span>
              </Link>
            </div>
          </div>
          <ul className="list-unstyled event-one__points">
            {points.map((point, index) => (
              <li key={index}>
                <div className="icon">
                  <span className={point.icon}></span>
                </div>
                <div className="content">
                  <h4>
                    <Link to="/event">
                      {point.heading}
                    </Link>
                  </h4>
                  <p>{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="event-one__img-box">
            <img src={imageUrl} alt="Event" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventOne;