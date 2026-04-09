"use client";
import React from "react"; // Add useState here
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import TestimonialsImg1 from '../../assets/images/testimonial/testimonial-one-client-1-1.jpg'
import TestimonialsImg2 from '../../assets/images/testimonial/testimonial-one-client-1-2.jpg'
import TestimonialsImg3 from '../../assets/images/testimonial/testimonial-one-client-1-3.jpg'
import TestimonialsImg4 from '../../assets/images/testimonial/testimonial-one-client-1-4.jpg'
import TestimonialsImg5 from '../../assets/images/testimonial/testimonial-one-client-1-5.jpg'
import TestimonialsImg6 from '../../assets/images/testimonial/testimonial-one-client-1-6.jpg'
const testimonials = [
  {
    clientName: "Jonathon Doe",
    role: "Officer",
    clientImage: TestimonialsImg1,
    text: "Events are special occasions where people gather together to celebrate, commemorate, or participate in a specific purpose or theme.",
    rating: 4,
  },
  {
    clientName: "Jonathon Cample",
    role: "Designer",
    clientImage: TestimonialsImg2,
    text: "Events are special occasions where people gather together to celebrate, commemorate, or participate in a specific purpose or theme.",
    rating: 4,
  },
  {
    clientName: "Jonathon Trot",
    role: "Officer",
    clientImage: TestimonialsImg3,
    text: "Events are special occasions where people gather together to celebrate, commemorate, or participate in a specific purpose or theme.",
    rating: 4,
  },
  {
    clientName: "Jonathon Smith",
    role: "Designer",
    clientImage: TestimonialsImg4,
    text: "Events are special occasions where people gather together to celebrate, commemorate, or participate in a specific purpose or theme.",
    rating: 4,
  },
  {
    clientName: "Abral Sing",
    role: "Designer",
    clientImage: TestimonialsImg5,
    text: "Events are special occasions where people gather together to celebrate, commemorate, or participate in a specific purpose or theme.",
    rating: 4,
  },
  {
    clientName: "Hasil Khan",
    role: "Designer",
    clientImage: TestimonialsImg6,
    text: "Events are special occasions where people gather together to celebrate, commemorate, or participate in a specific purpose or theme.",
    rating: 4,
  },
];
export default function Home() {
  return (

        <div>
          {/*Testimonials Page Start*/}
          <section className="testimonial-page">
            <div className="container">
              <div className="row">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="col-xl-6 col-lg-6 col-md-6">
                    <div className="testimonial-one__single">
                      <div className="testimonial-one__client-info-and-review">
                        <div className="testimonial-one__client-info">
                          <div className="testimonial-one__client-img">
                            <img
                              src={testimonial.clientImage}
                              alt={testimonial.clientName}
                            />
                          </div>
                          <div className="testimonial-one__client-content">
                            <h4 className="testimonial-one__client-name">
                              <Link to="#">
                                {testimonial.clientName}
                              </Link>
                            </h4>
                            <p className="testimonial-one__sub-title">
                              {testimonial.role}
                            </p>
                          </div>
                        </div>
                        <div className="testimonial-one__review">
                          {Array.from(
                            { length: testimonial.rating },
                            (_, i) => (
                              <span key={i} className="icon-star"></span>
                            )
                          )}
                          {Array.from(
                            { length: 5 - testimonial.rating },
                            (_, i) => (
                              <span
                                key={i + testimonial.rating}
                                className="icon-star clr-start"
                              ></span>
                            )
                          )}
                        </div>
                      </div>
                      <p className="testimonial-one__text">
                        {testimonial.text}
                      </p>
                      <div className="testimonial-one__quote">
                        <span className="icon-quote"></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/*Testimonials Page End*/}

        </div>
  );
}
