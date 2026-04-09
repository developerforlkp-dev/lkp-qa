"use client";
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import { useState } from "react";
import ServiceDetailsImg1 from '../../assets/images/services/service-details-img-1.jpg'
import ServiceDetailsImg2 from '../../assets/images/services/service-details-img-box-img-1.jpg'
import ServiceDetailsImg3 from '../../assets/images/services/service-details-img-box-img-2.jpg'
import ServiceBg from '../../assets/images/backgrounds/service-details-get-touch-bg.jpg'
const serviceCategories = [
  { name: "Event Prodigy", link: "/event-prodigy", count: 2},
  { name: "Stellar Events Co", link: "/stellar-events-co", count: 4 },
  { name: "Elite Event Management", link: "/elite-event-management", count: 1  },
  { name: "Infinite Occasions", link: "/infinite-occasions", count: 6 },
  { name: "Dream Event Planners", link: "/dream-event-planners", count: 3 , active: true},
];

const serviceDetails = {
  title: "Where Every Event Shines Bright",
  description:
    "Lorem Ipsum is simply dummy text of the printing Lorem Ipsum is simply dummy text of the printing .Lorem Ipsum is simply dummy text of the printing.Lorem Ipsum is simply dummy text of the printing",
  images: [
    ServiceDetailsImg1,
    ServiceDetailsImg2,
    ServiceDetailsImg3,
  ],
  additionalText: ["Experience the Magic of Events"],
  description2: [
    "Lorem Ipsum is simply dummy text of the printing Lorem Ipsum is simply dummy text of the printing .Lorem Ipsum is simply dummy text of the printing.Lorem Ipsum is simply dummy text of the printing",
  ],
  description3: [
    "Real estate is a lucrative industry that involves the buying selling and renting properties It encompasses residential commercial and industrial designsin properties. Real estate agents play a crucial Lorem Ipsum is simply dummy text of the printing Lorem Ipsum is simply dummy text of the printing .Lorem Ipsum is simply",
  ],
  servicecard: [
    {
      question: "What types of events do you specialize in?",
      answer:
        "Events are special occasions where people gather together to celebrate",
    },
    {
      question: "How far in advance should I book an event?",
      answer:
        "Events are special occasions where people gather together to celebrate",
    },
    {
      question: "Do you provide event planning services?",
      answer:
        "Events are special occasions where people gather together to celebrate",
    },
  ],
  faq: [
    {
      question: "What types of events do you specialize in?",
      answer:
        "It is a long established fact that a reader will be distracted by the readable content of a page looking at its a layout. The point of using Lorem Ipsum is that it has a more-or-less norIt is a long established fact that a reader will be distracted by the readable content of a page looking at its a layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of a letter as opposed to a using 'Content here,",
    },
    {
      question: "How far in advance should I book an event?",
      answer:
        "It is a long established fact that a reader will be distracted by the readable content of a page looking at its a layout. The point of using Lorem Ipsum is that it has a more-or-less norIt is a long established fact that a reader will be distracted by the readable content of a page looking at its a layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of a letter as opposed to a using 'Content here,",
    },
    {
      question: "Do you provide event planning services?",
      answer:
        "It is a long established fact that a reader will be distracted by the readable content of a page looking at its a layout. The point of using Lorem Ipsum is that it has a more-or-less norIt is a long established fact that a reader will be distracted by the readable content of a page looking at its a layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of a letter as opposed to a using 'Content here,",
    },
  ],
};

export default function Home() {
  const [isActive, setIsActive] = useState({ status: false, key: 1 });

  const handleToggle = (key) => {
    setIsActive({
      status: isActive.key === key ? false : true,
      key: isActive.key === key ? null : key,
    });
  };

  return (


        <div>
          {/* Service Details Start */}
          <section className="service-details">
            <div className="container">
              <div className="service-details__top">
                <div className="row">
                  <div className="col-xl-4 col-lg-5">
                    <div className="service-details__top-left">
                      <div className="service-details__all-category">
                        <h3 className="service-details__category-title">
                          Category
                        </h3>
                        <ul className="service-details__all-category-list list-unstyled">
                          {serviceCategories.map((category, index) => (
                            <li
                              key={index}
                              className={category.active ? "active" : ""}
                            >
                              <Link to={category.link}>
                                <i className="icon-double-angle"></i>
                                {category.name}
                                <span>({category.count})</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="service-details__get-touch">
                        <div
                          className="service-details__get-touch-bg"
                          style={{ backgroundImage: `url(${ServiceBg})` }}
                        ></div>
                        <div className="service-details__get-touch-inner">
                          <h3 className="service-details__get-touch-title">
                            GET TOUCH
                          </h3>
                          <p className="service-details__get-touch-sub-title">
                            For fast service
                          </p>
                          <div className="service-details__get-touch-icon">
                            <span className="icon-call"></span>
                          </div>
                          <h4 className="service-details__get-touch-number">
                            <Link to="tel:888123456765">(+888) 123 456 765</Link>
                          </h4>
                        </div>
                      </div>
                      <div className="service-details__download-box">
                        <ul className="service-details__download-list list-unstyled">
                          <li>
                            <Link to="#">
                              Information<span className="icon-download"></span>
                            </Link>
                          </li>
                          <li>
                            <Link to="#">
                              Terms & Conditions
                              <span className="icon-download"></span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-8 col-lg-7">
                    <div className="service-details__top-right">
                      <div className="service-details__img-1">
                        <img
                          src={serviceDetails.images[0]}
                          alt="Service Detail"
                        />
                      </div>
                      <h3 className="service-details__title-1">
                        {serviceDetails.title}
                      </h3>
                      <p className="service-details__text-1">
                        {serviceDetails.description}
                      </p>
                      <div className="service-details__img-box">
                        <div className="row">
                          <div className="col-xl-6">
                            <div className="service-details__img-box-img">
                              <img
                                src={serviceDetails.images[1]}
                                alt="Service Detail"
                              />
                            </div>
                          </div>
                          <div className="col-xl-6">
                            <div className="service-details__img-box-img">
                              <img
                                src={serviceDetails.images[2]}
                                alt="Service Detail"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {serviceDetails.additionalText.map((text, index) => (
                        <div key={index}>
                          <h3 className="service-details__title-2">{text}</h3>
                          <p className="service-details__text-2">
                            {serviceDetails.description2}
                          </p>
                          <p className="service-details__text-3">
                            {serviceDetails.description3}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="service-details__bottom">
                <div className="row">
                  {/* Services Details */}
                  {serviceDetails.servicecard.map((item, index) => (
                    <div key={index} className="col-xl-4 col-lg-4">
                      <div className="service-details__single">
                        <div className="service-details__icon">
                          <span className="icon-theater"></span>
                        </div>
                        <h3 className="service-details__title">
                          <Link to="#">{item.question}</Link>
                        </h3>
                        <p className="service-details__text">{item.answer}</p>
                        <Link to="#" className="service-details__btn">
                          Read More <span className="icon-arrow-right"></span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="service-details__text-4">
                  {serviceDetails.additionalText[1]}
                </p>
                <div className="service-details__faq-box">
                  <h3 className="service-details__faq-title">
                    Creating Memories One Event at a Time
                  </h3>
                  <div
                    className="accrodion-grp faq-one-accrodion"
                    data-grp-name="faq-one-accrodion-1"
                  >
                    {serviceDetails.faq.map((faq, index) => (
                      <div
                        className={`accrodion ${index === 0 ? "active" : ""}`}
                        key={index}
                      >
                        <div
                          className="accrodion-title"
                          onClick={() => handleToggle(index)}
                        >
                          <h4>{faq.question}</h4>
                          <div className="faq-one-accrodion__count"></div>
                        </div>
                        {isActive.key === index && (
                          <div className="accrodion-content">
                            <div className="inner">
                              <p>{faq.answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Service Details End */}
        </div>

  );
}
