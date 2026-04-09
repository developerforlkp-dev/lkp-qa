"use client";
import React from "react"; // Add useState here
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import TeamDetailsImg1 from '../../assets/images/team/team-details-client-img.jpg'
import TeamDetailsImg2 from '../../assets/images/shapes/team-details-client-shape-1.png'

const member = {
  name: "Mike Hussey",
  role: "Lead Speaker",
  img: TeamDetailsImg1,
  biography:
    "We’re inviting the top creatives in the tech industry from all over the world to come learn, grow, scrape their knees, try new things, to be vulnerable, epic adventures oday most people get on average 4 to 6 hours of exercise every day, and make sure that everything they put in their mouths is not filled with sugars",
  personalInfo:
    "We’re inviting the top creatives in the tech industry from all over the world to come learn, grow, scrape their knees, try new things, to be vulnerable, epic adventures oday most people get on average 4 to 6 hours of exercise every day, and make sure.",
  dateOfBirth: "May 10, 1980",
  address: "PO Box 16122 Collins Street West Victoria 8007 New York",
  social: {
    facebook: "#",
    twitter: "#",
    pinterest: "#",
  },
};
const services = [
  {
    title: "Eventful Ventures",
    description:
      "Events bring people together for a shared experience and from weddings.",
    icon: "icon-camera",
    detailsLink: "/service-details",
    readMoreLink: "#",
  },
  {
    title: "Stellar Events Co",
    description:
      "Events bring people together for a shared experience and from weddings.",
    icon: "icon-skewer",
    detailsLink: "/service-details",
    readMoreLink: "#",
  },
  {
    title: "Elite Event Management",
    description:
      "Events bring people together for a shared experience and from weddings.",
    icon: "icon-dinner-table",
    detailsLink: "/service-details",
    readMoreLink: "#",
  },
];
export default function Home() {
  return (

        <div>
          {/*Team Details Info Start*/}
          <section className="team-details">
            <div className="container">
              <div className="row">
                <div className="col-xl-4 col-lg-5">
                  <div className="team-details__left">
                    <div className="team-details__client-shape-1">
                      <img
                        src= {TeamDetailsImg2}
                        alt=""
                      />
                    </div>
                    <div className="team-details__img-box">
                      <div className="team-details__client-img">
                        <img src={member.img} alt={member.name} />
                      </div>
                      <div className="team-details__img-content">
                        <h3 className="team-details__client-name">
                          {member.name}
                        </h3>
                        <p className="team-details__sub-title">{member.role}</p>
                        <div className="team-details__social">
                          <ul className="team-details__social-list list-unstyled">
                            <li>
                              <Link
                                className="share-facebook"
                                to={member.social.facebook}
                              >
                                <i className="fab fa-facebook-f"></i>
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="share-twitter"
                                to={member.social.twitter}
                              >
                                <i className="fab fa-twitter"></i>
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="share-pinterest"
                                to={member.social.pinterest}
                              >
                                <i className="fab fa-pinterest-p"></i>
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-8 col-lg-7">
                  <div className="team-details__right">
                    <h3 className="team-details__title-1">Biography</h3>
                    <p className="team-details__text-1">{member.biography}</p>
                    <div className="team-details__speaker-info-box">
                      <div className="row">
                        <div className="col-md-7">
                          <div className="team-details__speaker-info">
                            <h3 className="team-details__speaker-title">
                              Personal Information
                            </h3>
                            <p>{member.personalInfo}</p>
                          </div>
                        </div>
                        <div className="col-md-5">
                          <div className="team-details__speaker-info-list">
                            <ul className="list-unstyled">
                              <li>
                                <p className="title">Date Of Birth:</p>
                                <span>{member.dateOfBirth}</span>
                              </li>
                              <li>
                                  <p className="title">Mobile Number:</p>
                                  <Link to="tel:001232347684">001 2323 47684</Link>
                              </li>
                              <li>
                                <p className="title">Address:</p>
                                <span>{member.address}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/*Team Details Info End*/}

          <section className="services-one services-three">
            <div className="container">
              <div className="section-title text-center">
                <div className="section-title__tagline-box">
                  <span className="section-title__tagline">event benefits</span>
                </div>
                <h2 className="section-title__title">
                  Why should you join <br /> our event
                </h2>
              </div>
              <div className="row">
                {services.map((service, index) => (
                  <div key={index} className="col-xl-4 col-lg-4">
                    <div className="services-one__single">
                      <div className="services-one__icon">
                        <span className={service.icon}></span>
                      </div>
                      <h3 className="services-one__title">
                        <Link to={service.detailsLink}>{service.title}</Link>
                      </h3>
                      <p className="services-one__text">
                        {service.description}
                      </p>
                      <Link
                        to={service.readMoreLink}
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
        </div>
  );
}
