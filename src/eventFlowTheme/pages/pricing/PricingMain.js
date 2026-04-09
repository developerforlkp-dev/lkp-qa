"use client";
import { useState } from "react";
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import PricingImg1 from '../../assets/images/shapes/pricing-one-shape-1.png'
export default function Home() {
  const [activeTab, setActiveTab] = useState("monthly");

  const pricingPlans = {
    monthly: [
      {
        price: 19,
        planName: "Basic Plan",
        features: [
          "Mistakes To Avoid",
          "Your Startup",
          "Knew About Fonts",
          "Winning Metric for Your Startup",
        ],
      },
      {
        price: 29,
        planName: "Hard Plan",
        features: [
          "Mistakes To Avoid",
          "Your Startup",
          "Knew About Fonts",
          "Winning Metric for Your Startup",
        ],
      },
      {
        price: 20,
        planName: "Easy Plan",
        features: [
          "Mistakes To Avoid",
          "Your Startup",
          "Knew About Fonts",
          "Winning Metric for Your Startup",
        ],
      },
    ],
    yearly: [
      {
        price: 30,
        planName: "Basic Plan",
        features: [
          "Mistakes To Avoid",
          "Your Startup",
          "Knew About Fonts",
          "Winning Metric for Your Startup",
        ],
      },
      {
        price: 80,
        planName: "Hard Plan",
        features: [
          "Mistakes To Avoid",
          "Your Startup",
          "Knew About Fonts",
          "Winning Metric for Your Startup",
        ],
      },
      {
        price: 50,
        planName: "Easy Plan",
        features: [
          "Mistakes To Avoid",
          "Your Startup",
          "Knew About Fonts",
          "Winning Metric for Your Startup",
        ],
      },
    ],
  };
  const tickets = [
    {
      id: 1,
      title: "Day Pass",
      price: "$35.99",
      features: [
        "Conference Tickets",
        "Free Lunch And Coffee",
        "Certificate",
        "Easy Access",
        "Free Contacts",
      ],
    },
    {
      id: 2,
      title: "Full Pass",
      price: "$99.99",
      features: [
        "Conference Tickets",
        "Free Lunch And Coffee",
        "Certificate",
        "Easy Access",
        "Free Contacts",
      ],
    },
    {
      id: 3,
      title: "Group Pass",
      price: "$119.99",
      features: [
        "Conference Tickets",
        "Free Lunch And Coffee",
        "Certificate",
        "Easy Access",
        "Free Contacts",
      ],
    },
  ];

  return (

        <div>
          <section className="ticket-one ticket-two">
            <div className="container">
              <div className="section-title text-center">
                <div className="section-title__tagline-box">
                  <span className="section-title__tagline">GET TICKET</span>
                </div>
                <h2 className="section-title__title">Choose a Ticket</h2>
              </div>
              <div className="row">
                {tickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className={`col-xl-4 col-lg-4 wow fadeIn${
                      index % 2 === 0 ? "Left" : "Right"
                    }`}
                    data-wow-delay={`${index * 100}ms`}
                  >
                    <div className="ticket-one__single">
                      <div className="ticket-one__title-box">
                        <div className="ticket-one__title-icon">
                          <i className="fas fa-ticket-alt"></i>
                        </div>
                        <h5 className="ticket-one__title">{ticket.title}</h5>
                      </div>
                      <div className="ticket-one__price-box">
                        <h3>{ticket.price}</h3>
                      </div>
                      <ul className="list-unstyled ticket-one__points">
                        {ticket.features.map((feature, idx) => (
                          <li key={idx}>
                            <div className="icon">
                              <i className="fas fa-check"></i>
                            </div>
                            <div className="text">
                              <p>{feature}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="ticket-one__btn-box">
                        <Link to="/pricing" className="ticket-one__btn thm-btn">
                          Buy Ticket<span className="icon-arrow-right"></span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/*Pricing One Start*/}
          <section className="pricing-one pricing-two">
            <div className="container">
              <div className="pricing-one__inner">
                <div className="section-title text-left">
                  <div className="section-title__tagline-box">
                    <span className="section-title__tagline">Pricing</span>
                  </div>
                  <h2 className="section-title__title section-title__title--two">
                    Building Relationships <br /> Driving Results
                  </h2>
                </div>
                <div className="pricing-one__main-tab-box tabs-box">
                  <ul className="tab-buttons list-unstyled">
                    <li
                      onClick={() => setActiveTab("monthly")}
                      className={`tab-btn ${
                        activeTab === "monthly" ? "active-btn" : ""
                      }`}
                    >
                      <span>Monthly</span>
                    </li>
                    <li
                      onClick={() => setActiveTab("yearly")}
                      className={`tab-btn ${
                        activeTab === "yearly" ? "active-btn" : ""
                      }`}
                    >
                      <span>Yearly</span>
                    </li>
                  </ul>
                  <div className="tabs-content">
                    {Object.entries(pricingPlans).map(([key, plans]) => (
                      <div
                        key={key}
                        className={`tab ${
                          activeTab === key ? "active-tab" : ""
                        }`}
                        id={key}
                      >
                        <div className="pricing-one__tab-content-box">
                          <div className="row">
                            {plans.map((plan, index) => (
                              <div
                                key={index}
                                className="col-xl-4 col-lg-4 col-md-6"
                              >
                                <div className="pricing-one__single">
                                  <div className="pricing-one__single-inner">
                                    <div className="pricing-one__price-box">
                                      <div
                                        className="pricing-one__shape-1"
                                        style={{
                                          backgroundImage:
                                          `url(${PricingImg1})`
                                        }}
                                      ></div>
                                      <h3 className="pricing-one__price">
                                        ${plan.price} <span>/mo</span>
                                      </h3>
                                      <p className="pricing-one__pack-name">
                                        {plan.planName}
                                      </p>
                                    </div>
                                    <ul className="list-unstyled pricing-one__points">
                                      {plan.features.map((feature, index) => (
                                        <li key={index}>
                                          <div className="icon">
                                            <span className="icon-double-angle"></span>
                                          </div>
                                          <div className="text">
                                            <p>{feature}</p>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="pricing-one__btn-box">
                                      <Link
                                        to="/pricing"
                                        className="pricing-one__btn thm-btn"
                                      >
                                        Purchase now
                                        <span className="icon-arrow-right"></span>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/*Pricing One End*/}

        </div>
  );
}
