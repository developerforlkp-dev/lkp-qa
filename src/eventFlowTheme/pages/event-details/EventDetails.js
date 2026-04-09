"use client";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';
import { getEventDetails } from "../../../utils/api";
import EventDetailsImgPlaceholder from '../../assets/images/resources/event-details-img-1.jpg';

const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return url;
  // Handle relative paths or specific backend storage patterns if needed
  return url;
};

export default function Home() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('id') || '3'; // Default to 3 if no ID passed, or handle differently

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("year-1");

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getEventDetails(eventId);
        if (mounted) {
          setEvent(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to fetch event details:", err);
          setError("Failed to load event details.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (eventId) {
      fetchDetails();
    }
  }, [eventId]);

  const tabs = [
    {
      id: "year-1",
      year: event?.startDate?.split('-')?.[0] || new Date().getFullYear().toString(),
      content: (
        <div className="event-details__tab-content-box">
          <ul className="event-details__meta list-unstyled">
            <li>
              <p>
                <span className="icon-clock"></span>
                {event?.venueFullAddress || "Mirpur 01 Road N 12 Dhaka Bangladesh"}
              </p>
            </li>
            <li>
              <p>
                <span className="icon-pin"></span>
                {event?.startDate ? `${event.startDate} ${event.startTime || ''}` : "10 AM To 10 PM 20 April 2019"}
              </p>
            </li>
          </ul>
          <h3 className="event-details__title-1">
            {event?.title || "UI/UX Designer Meet Up"}
          </h3>
          <p className="event-details__text-1">
            {event?.description || "Events are special occasions where people gather together to celebrate..."}
          </p>
          <div className="event-details__points-box">
            <ul className="event-details__points list-unstyled">
              <li>
                <div className="icon">
                  <span className="icon-double-angle"></span>
                </div>
                <p>Creating Memories, One Event at a Time</p>
              </li>
              <li>
                <div className="icon">
                  <span className="icon-double-angle"></span>
                </div>
                <p>Celebrate in Style, Celebrate with Class</p>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  if (loading) return <div className="p-5 text-center">Loading event details...</div>;
  if (error) return <div className="p-5 text-center text-danger">{error}</div>;

  return (
    <>
        <section className="event-details">
          <div className="container">
            <div className="row">
              <div className="col-xl-8 col-lg-7">
                <div className="event-details__left">
                  <div className="event-details__img">
                    <img
                      src={formatImageUrl(event?.coverImageUrl) || EventDetailsImgPlaceholder}
                      alt={event?.title || ""}
                    />
                  </div>
                  <div className="event-details__main-tab-box tabs-box">
                    <ul className="tab-buttons clearfix list-unstyled">
                      {tabs.map((tab) => (
                        <li
                          key={tab.id}
                          className="tab-btn active-btn"
                        >
                          <p>{tab.year}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="tabs-content">
                      {tabs.map((tab) => (
                        <div
                          key={tab.id}
                          className="tab active-tab"
                          id={tab.id}
                        >
                          {tab.content}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-5">
                <div className="event-details__right">
                  <div className="event-details__speakers">
                    <h3 className="event-details__speakers-title">Details</h3>
                    <p className="event-details__speakers-sub-title">
                      {event?.category || "Category"}
                    </p>
                    <p className="event-details__speakers-text">
                      {event?.title}
                    </p>
                  </div>
                  <div className="event-details__ticket">
                    <h3 className="event-details__ticket-title">
                      Book Your Ticket
                    </h3>
                    <p className="event-details__ticket-sub-title">
                      Contact Us
                    </p>
                    <div className="event-details__ticket-icon">
                      <span className="icon-call"></span>
                    </div>
                    <h3 className="event-details__ticket-number">
                      <Link to="tel:0173456765">0173 456 765</Link>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}
