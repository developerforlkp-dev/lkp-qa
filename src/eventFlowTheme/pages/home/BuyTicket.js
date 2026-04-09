"use client"; // Ensures the component runs on the client side

import { useState } from "react";
import { Link } from 'react-router-dom';
import ticketImg from '../../assets/images/resources/buy-ticket-img.jpg';

export default function BuyTicket() {
  // State for dynamic content
  const [ticketContent] = useState({
    address: "Mirpur 01 Road N 12 Dhaka Bangladesh",
    timing: "10 Am To 10 Pm 20 April 2024",
    title: "Grab Your Seat Now Or You May Regret it Once",
    description:
      "Events bring people together for a shared experience celebration. From weddings and birthdays to conferences, events bring people together for a shared purpose.",
    buttons: [
      { id: 1, text: "Buy Your Ticket", link: "/contact", class: "buy-ticket__btn-1" },
      { id: 2, text: "Contact Us", link: "/contact", class: "buy-ticket__btn-2" },
    ],
  });

  return (
    <>
      {/* Buy Ticket Start */}
      <section className="buy-ticket">
        <div className="container">
          <div className="row">
            <div className="col-xl-6">
              <div
                className="buy-ticket__left wow fadeInLeft"
                data-wow-delay="100ms"
              >
                <ul className="buy-ticket__address list-unstyled">
                  <li>
                    <div className="icon">
                      <span className="icon-clock"></span>
                    </div>
                    <div className="text">
                      <p>{ticketContent.address}</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon">
                      <span className="icon-pin"></span>
                    </div>
                    <div className="text">
                      <p>{ticketContent.timing}</p>
                    </div>
                  </li>
                </ul>
                <h3 className="buy-ticket__title">{ticketContent.title}</h3>
                <p className="buy-ticket__text">{ticketContent.description}</p>
                <div className="buy-ticket__btn-box">
                  {ticketContent.buttons.map((button) => (
                    <Link
                      key={button.id}
                      to={button.link}
                      className={`${button.class} thm-btn`}
                    >
                      {button.text}
                      <span className="icon-arrow-right"></span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-xl-6">
              <div
                className="buy-ticket__right wow fadeInRight"
                data-wow-delay="300ms"
              >
                <div className="buy-ticket__img">
                  <img src={ticketImg} alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Buy Ticket End */}
    </>
  );
}
