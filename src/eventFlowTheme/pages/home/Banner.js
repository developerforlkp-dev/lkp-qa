import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import BannerImg from "../../assets/images/resources/main-slider-img-1-1.jpg";
import BannerShape1 from "../../assets/images/shapes/main-slider-shape-1.png";
import BannerShape2 from "../../assets/images/shapes/main-slider-shape-2.png";
import BannerShape3 from "../../assets/images/shapes/main-slider-star-1.png";
import BannerShape4 from "../../assets/images/shapes/main-slider-star-2.png";
import BannerShape5 from "../../assets/images/shapes/main-slider-star-3.png";
import { getEventDetails } from '../../../utils/api';

const swiperOptions = {
  modules: [Autoplay, Pagination, Navigation],
  slidesPerView: 1,
  loop: false,
  autoplay: false,
  effect: 'fade'
};

export default function Banner() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('id') || '3';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventDetails(eventId);
        console.log("Fetched event for banner:", data);
        setEvent(data);
      } catch (error) {
        console.error("Failed to fetch event for banner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Helper function to format image URLs
  const formatImageUrl = (url) => {
    if (!url) return BannerImg;
    if (url.startsWith("http")) return url;
    if (url.startsWith("leads/")) {
      return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }
    return url;
  };

  return (
    <>
      <style>{`
        /* Responsive optimization for Event Hero Section Graphics/Ring */
        @media (min-width: 1200px) {
          .main-slider__graphics-wrapper {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 1;
          }
          .main-slider__graphics-wrapper > * {
            pointer-events: auto;
          }
        }

        @media (max-width: 1199px) {
          .main-slider {
            overflow: hidden !important;
          }
          .main-slider .container {
            position: relative;
            z-index: 10 !important;
          }
          .main-slider__graphics-wrapper {
            position: absolute !important;
            bottom: 0 !important;
            right: 0 !important;
            width: 1400px !important;
            height: 800px !important;
            transform-origin: bottom right !important;
            z-index: 1 !important;
            pointer-events: none !important;
            transform: scale(clamp(0.22, 33vw / 100, 0.55)) !important;
          }
          
          /* Force display of ring/gallery elements to prevent cutoff/hiding on mobile */
          .main-slider__graphics-wrapper .main-slider__img,
          .main-slider__graphics-wrapper .main-slider__shpae-1,
          .main-slider__graphics-wrapper .main-slider__shpae-2,
          .main-slider__graphics-wrapper .main-slider__start-1,
          .main-slider__graphics-wrapper .main-slider__start-2,
          .main-slider__graphics-wrapper .main-slider__start-3 {
            display: block !important;
            visibility: visible !important;
          }

          /* Ensure smooth entrance animation completion overrides any hidden opacities */
          .main-slider .swiper-slide-active .main-slider__graphics-wrapper .main-slider__img {
            opacity: 1 !important;
          }
          .main-slider .swiper-slide-active .main-slider__graphics-wrapper .main-slider__shpae-1,
          .main-slider .swiper-slide-active .main-slider__graphics-wrapper .main-slider__shpae-2 {
            opacity: 1 !important;
          }
          .main-slider__graphics-wrapper .main-slider__shpae-2 {
            opacity: 0.15 !important;
          }
        }

        /* Specific extra tuning for small mobile sizes to ensure content readability and layout balance */
        @media (max-width: 767px) {
          .main-slider__content {
            background: rgba(4, 0, 10, 0.4);
            backdrop-filter: blur(2px);
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 40px;
          }
          .main-slider__title {
            font-size: clamp(24px, 7vw, 32px) !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>
      {/* banner-one */}
      <section id='th-home' className="main-slider mb-5">
        <Swiper {...swiperOptions} className="swiper-container thm-swiper__slider">
          <div className="swiper-wrapper">
            <SwiperSlide className="swiper-slide">
              <div className="main-slider__graphics-wrapper">
                <div className="main-slider__img">
                  <img src={formatImageUrl(event?.coverImageUrl)} alt="" />
                </div>
                <div className="main-slider__shpae-1">
                  <img src={BannerShape1} alt="" />
                </div>
                <div className="main-slider__shpae-2">
                  <img src={BannerShape2} alt="" />
                </div>
                <div className="main-slider__start-1">
                  <img src={BannerShape3} alt="" />
                </div>
                <div className="main-slider__start-2 zoominout">
                  <img src={BannerShape4} alt="" />
                </div>
                <div className="main-slider__start-3">
                  <img src={BannerShape5} alt="" />
                </div>
              </div>
              <div className="container">
                <div className="row">
                  <div className="col-xl-12">
                    <div className="main-slider__content">
                      <p className="main-slider__sub-title">{event?.category || "Music Festival"}</p>
                      <h2 className="main-slider__title">
                        <Link to={`/event-details?id=${eventId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {event?.title ? (() => {
                            const words = event.title.split(' ');
                            const mid = Math.ceil(words.length / 2);
                            const line1 = words.slice(0, mid).join(' ');
                            const line2 = words.slice(mid).join(' ');
                            return (
                              <>
                                {line1}
                                {line2 && <span>{line2}</span>}
                              </>
                            );
                          })() : (
                            <>
                              Discover a World <span>of Celebration</span>
                            </>
                          )}
                        </Link>
                      </h2>
                      <p className="main-slider__text main-slider__text--wrap">
                        {event?.description || (
                          <>
                            As an AI language model, I don't have personal opinions or points of view.
                            However, I <br /> can tell you that design is a multifaceted field that encompasses various elements.
                          </>
                        )}
                      </p>
                      <ul className="list-unstyled main-slider__address">
                        <li>
                          <div className="icon">
                            <span className="icon-pin"></span>
                          </div>
                          <div className="text">
                            <p>{event?.venueFullAddress || event?.location || "Mirpur 01 Road N 12 Dhaka Bangladesh"}</p>
                          </div>
                        </li>
                        <li>
                          <div className="icon">
                            <span className="icon-clock"></span>
                          </div>
                          <div className="text">
                            <p>{event?.startDate ? `${event.startDate} ${event.startTime || ''}` : "10 Am To 10 Pm 20 April 2024"}</p>
                          </div>
                        </li>
                      </ul>
                      <div className="main-slider__btn-box">
                        <Link to={`/event-details?id=${eventId}`} className="main-slider__btn thm-btn">
                          Purchase Ticket
                          <span className="icon-arrow-right"></span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </div>
        </Swiper>
      </section>
      {/* banner-one */}
    </>

  );
}
