import React from 'react';
import { Link } from 'react-router-dom';

const ContactMain = () => {
    

    return (
        <React.Fragment>
            {/*Contact One Start*/}
          <section className="contact-one">
            <div className="container">
              <div className="contact-one__inner">
                <h3 className="contact-one__title">Write here below?</h3>
                <p className="contact-one__text">
                  For your car we will do everything advice, repairs and they
                  can maintenance. We are the some preferred choice
                </p>
                <form
                  className="contact-form-validated contact-one__form"
                  action="assets/inc/sendemail.php"
                  method="post"
                  noValidate
                >
                  <div className="row">
                    <div className="col-xl-6 col-lg-6">
                      <div className="contact-one__input-box">
                        <input
                          type="text"
                          name="name"
                          placeholder="Your Name"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6">
                      <div className="contact-one__input-box">
                        <input
                          type="email"
                          name="email"
                          placeholder="Your Email"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6">
                      <div className="contact-one__input-box">
                        <input
                          type="text"
                          name="phone"
                          placeholder="Phone Number"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6">
                      <div className="contact-one__input-box">
                        <div className="select-box">
                          <select className="selectmenu wide" defaultValue="Choose Option">
                            <option value="Choose Option">Choose Option</option>
                            <option value="Type Of Service 01">Type Of Service 01</option>
                            <option value="Type Of Service 02">Type Of Service 02</option>
                            <option value="Type Of Service 03">Type Of Service 03</option>
                            <option value="Type Of Service 04">Type Of Service 04</option>
                            <option value="Type Of Service 05">Type Of Service 05</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-12">
                      <div className="contact-one__input-box text-message-box">
                        <textarea
                          name="message"
                          placeholder="Your Message"
                        ></textarea>
                      </div>
                      <div className="contact-one__btn-box">
                        <button
                          type="submit"
                          className="thm-btn contact-one__btn"
                        >
                          Submit Now<span className="icon-arrow-right"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="result"></div>
              </div>
            </div>
          </section>
          {/*Contact One End*/}

          {/*Contact Two Start*/}
          <section className="contact-two">
            <div className="container">
              <div className="row">
                {/* Contact Two Single Start */}
                <div className="col-xl-4 col-lg-4">
                  <div className="contact-two__single">
                    <div className="contact-two__icon">
                      <span className="icon-pin"></span>
                    </div>
                    <h3 className="contact-two__title">Location</h3>
                    <p className="contact-two__text">
                      2972 Westheimer Rd. Santa Ana, <br />
                      Illinois 85486
                    </p>
                  </div>
                </div>
                {/* Contact Two Single End */}

                {/* Contact Two Single Start */}
                <div className="col-xl-4 col-lg-4">
                  <div className="contact-two__single">
                    <div className="contact-two__icon">
                      <span className="icon-paper-plan"></span>
                    </div>
                    <h3 className="contact-two__title">E-mail</h3>
                    <p className="contact-two__text">
                      <Link to="mailto:tim.jennings@example.com">
                        tim.jennings@example.com
                      </Link>
                    </p>
                    <p className="contact-two__text">
                      <a href="mailto:debra.holt@example.com">
                        debra.holt@example.com
                      </a>
                    </p>
                  </div>
                </div>
                {/* Contact Two Single End */}

                {/* Contact Two Single Start */}
                <div className="col-xl-4 col-lg-4">
                  <div className="contact-two__single">
                    <div className="contact-two__icon">
                      <span className="icon-call"></span>
                    </div>
                    <h3 className="contact-two__title">Contact</h3>
                    <p className="contact-two__text">
                      <a href="tel:019457896332">019457896332</a>,{" "}
                      <a href="tel:017485962546">017485962546</a>
                    </p>
                    <p className="contact-two__text">
                      <a href="tel:016457896333">016457896333</a>
                    </p>
                  </div>
                </div>
                {/* Contact Two Single End */}
              </div>
            </div>
          </section>
          {/*Contact Two End*/}
        </React.Fragment>
    );
};

export default ContactMain;
