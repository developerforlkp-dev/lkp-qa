"use client";
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.
import GalleryDetailsImg1 from '../../assets/images/gallery/gallery-details-img-1.jpg'
import GalleryDetailsImg2 from '../../assets/images/gallery/gallery-details-img-box-img-1.jpg'
import GalleryDetailsImg3 from '../../assets/images/gallery/gallery-details-img-box-img-2.jpg'
import GalleryDetailsImg4 from '../../assets/images/gallery/gallery-details-img-box-img-3.jpg'
export default function Home() {
  return (

          <section className="gallery-details">
            <div className="container">
              <div className="gallery-details__top">
                <div className="row">
                  <div className="col-xl-8 col-lg-7">
                    <div className="gallery-details__top-img">
                      <img
                        src= {GalleryDetailsImg1}
                        alt=""
                      />
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-5">
                    <div className="gallery-details__top-right">
                      <div className="gallery-details__information">
                        <div className="gallery-details__information-title">
                          <h3>Project Information</h3>
                        </div>
                        <ul className="gallery-details__information-list list-unstyled">
                          <li>
                            <p>Event Management</p>
                          </li>
                          <li>
                            <p>Starline Shimlasi</p>
                          </li>
                          <li>
                            <p>1 April 2024</p>
                          </li>
                          <li>
                            <p>28 September 2025</p>
                          </li>
                          <li>
                            <div className="gallery-details__information-rating">
                              <span className="icon-star"></span>
                              <span className="icon-star"></span>
                              <span className="icon-star"></span>
                              <span className="icon-star"></span>
                              <span className="icon-star last-icon"></span>
                            </div>
                          </li>
                        </ul>
                        <div className="gallery-details__information-social">
                          <Link to="#">
                            <span className="icon-instagram"></span>
                          </Link>
                          <Link to="#">
                            <span className="icon-facebook"></span>
                          </Link>
                          <Link to="#">
                            <span className="icon-fi"></span>
                          </Link>
                          <Link to="#">
                            <span className="icon-linkedin-in"></span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="gallery-details__content">
                <h3 className="gallery-details__title-1">
                  Celebrate in Style Celebrate with Class
                </h3>
                <p className="gallery-details__text-1">
                  Web designing in a powerful way of just not an only
                  profession, however, in a passion for our Company. We have to
                  a tendency to believe the idea that smart looking of any
                  website in on visitors. Web designing in a powerful way of
                  just not an only profession.
                </p>
                <div className="gallery-details__points-box">
                  <ul className="gallery-details__points list-unstyled">
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
                  <ul className="gallery-details__points list-unstyled">
                    <li>
                      <div className="icon">
                        <span className="icon-double-angle"></span>
                      </div>
                      <p>Where Events Come to Life</p>
                    </li>
                    <li>
                      <div className="icon">
                        <span className="icon-double-angle"></span>
                      </div>
                      <p>Making Your Event Dreams Come True</p>
                    </li>
                  </ul>
                  <ul className="gallery-details__points list-unstyled">
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
                      <p>
                        Purpose of an event is to create memorable experiences
                      </p>
                    </li>
                  </ul>
                </div>
                <h3 className="gallery-details__title-2">
                  Celebrate Life Celebrate with Us
                </h3>
                <p className="gallery-details__text-2">
                  Web designing in a powerful way of just not an only
                  profession, however, in a passion for our Company. We have to
                  a tendency to believe the idea that smart looking of any
                  website in on visitors.
                </p>
              </div>
              <div className="gallery-details__img-box">
                <div className="row">
                  <div className="col-xl-4 col-lg-4">
                    <div className="gallery-details__img-box-img">
                      <img
                        src={GalleryDetailsImg2}
                        alt=""
                      />
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-4">
                    <div className="gallery-details__img-box-img">
                      <img
                        src={GalleryDetailsImg3}
                        alt=""
                      />
                    </div>
                  </div>
                  <div className="col-xl-4 col-lg-4">
                    <div className="gallery-details__img-box-img">
                      <img
                        src={GalleryDetailsImg4}
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>


  );
}
