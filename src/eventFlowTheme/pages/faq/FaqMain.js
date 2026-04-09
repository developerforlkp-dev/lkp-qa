'use client';
import React from 'react';
import { useState } from 'react';
// import { Link } from 'react-router-dom'; // Use react-router-dom for routing
// import teamDetailsImg from '../../assets/images/team/team-details-img-1.jpg';


const FaqMain = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
      setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <React.Fragment>
          {/*FAQ One Start*/}
          <section className="faq-page">
            <div className="container">
              <div className="row">
                <div className="col-xl-6 col-lg-6">
                  <div className="faq-page__left">
                    <div
                      className="accrodion-grp faq-one-accrodion"
                      data-grp-name="faq-one-accrodion-1"
                    >
                      {[
                        {
                          question: "What is construction?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                        {
                          question: "How long does a project typically take?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                        {
                          question:
                            "What are the different types of construction projects?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                        {
                          question:
                            "What is the role of a construction manager?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                      ].map((item, index) => (
                        <div
                          className={`accrodion ${
                            activeIndex === index ? "active" : ""
                          }`}
                          key={index}
                        >
                          <div
                            className="accrodion-title"
                            onClick={() => toggleAccordion(index)}
                          >
                            <h4>{item.question}</h4>
                            <div className="faq-one-accrodion__count"></div>
                          </div>
                          {activeIndex === index && (
                            <div className="accrodion-content">
                              <div className="inner">
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-xl-6 col-lg-6">
                  <div className="faq-page__right">
                    <div
                      className="accrodion-grp faq-one-accrodion"
                      data-grp-name="faq-one-accrodion-2"
                    >
                      {[
                        {
                          question: "What is construction?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                        {
                          question: "How long does a project typically take?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                        {
                          question:
                            "What are the different types of construction projects?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                        {
                          question:
                            "What is the role of a construction manager?",
                          answer:
                            "Et purus duis sollicitudin dignissim ha. Egest nulla quis venenatis cras sed eu massa eu faucibus. Urna fusce aenea tortor pretium Et purus duis sollicitudin dignissim habitant",
                        },
                      ].map((item, index) => (
                        <div
                          className={`accrodion ${
                            activeIndex === index + 4 ? "active" : ""
                          }`}
                          key={index + 4}
                        >
                          <div
                            className="accrodion-title"
                            onClick={() => toggleAccordion(index + 4)}
                          >
                            <h4>{item.question}</h4>
                            <div className="faq-one-accrodion__count"></div>
                          </div>
                          {activeIndex === index + 4 && (
                            <div className="accrodion-content">
                              <div className="inner">
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/*FAQ One End*/}
        </React.Fragment>
    );
};

export default FaqMain;
