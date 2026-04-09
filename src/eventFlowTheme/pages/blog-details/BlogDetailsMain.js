import React from 'react';
import { Link } from 'react-router-dom'; // Use react-router-dom for routing
import BlogDetailsImg1 from '../../assets/images/blog/blog-details-img-1.jpg';
import BlogDetailsImg2 from '../../assets/images/blog/blog-details-img-box-img-1.jpg';
import BlogDetailsImg3 from '../../assets/images/blog/blog-details-img-box-img-2.jpg';



const BlogDetailsMain = () => {

    const categories = [
        { name: "Event Prodigy", count: 2, link: "/blog-details" },
        { name: "Stellar Events Co", count: 4, link: "/blog-details" },
        {
          name: "Elite Event Management",
          count: 1,
          link: "/blog-details",
          active: true,
        },
        { name: "Infinite Occasions", count: 6, link: "/blog-details" },
        { name: "Dream Event Planners", count: 3, link: "/blog-details" },
      ];
    
      const recentPosts = [
        {
          date: "Jan 10, 2024",
          title: "Unforgettable Mome Celebrate Unforgettable Events",
          link: "/blog-details",
        },
        {
          date: "Jun 20, 2024",
          title: "Aliquam an eros justo, posuere lobortis, viverra laoreet",
          link: "/blog-details",
        },
        {
          date: "Jan 15, 2024",
          title: "Aliquam eros justo, posuere loborti viverra laoreet",
          link: "/blog-details",
        },
      ];
    
      const tags = [
        "All Project",
        "Prodigy",
        "Stellar Events",
        "Occasions",
        "Spectacular",
        "Moments",
      ];

    return (
        <React.Fragment>
            {/* Blog Details Start */}
            <section className="blog-details">
          <div className="container">
            <div className="row">
              <div className="col-xl-8 col-lg-7">
                <div className="blog-details__left">
                  <div className="blog-details__img-1">
                    <img
                      src= {BlogDetailsImg1}
                      alt=""
                    />
                    <div className="blog-details__date">
                      <p>22 Jan</p>
                    </div>
                  </div>
                  <div className="blog-details__content">
                    <h3 className="blog-details__title-1">
                      Celebrate Life Celebrate with Us
                    </h3>
                    <p className="blog-details__text-1">
                      Real estate is a lucrative industry that involves the
                      buying, selling, and renting properties. It encompasses
                      residential, commercial, and industrial designs in
                      properties. Real estate agents play a crucial role.
                    </p>
                    <p className="blog-details__text-2">
                      Real estate is a lucrative industry that involves the
                      buying, selling, and renting properties. It encompasses
                      residential, commercial, and industrial properties.
                    </p>
                    <div className="blog-details__quote-box">
                      <div className="blog-details__quote-icon">
                        <span className="icon-quote"></span>
                      </div>
                      <h3 className="blog-details__quote-box-client-name">
                        Mark Wood
                      </h3>
                      <p className="blog-details__quote-box-sub-title">CEO</p>
                      <p className="blog-details__quote-box-text">
                        Real estate is a lucrative industry that involves the
                        buying, selling, and renting properties. Real estate
                        agents play a crucial role in facilitating transactions.
                      </p>
                    </div>
                    <h3 className="blog-details__title-2">
                      Your Event Our Expertise
                    </h3>
                    <p className="blog-details__text-3">
                      Aliquam eros justo, posuere lobortis viverra laoreet matti
                      ullamcorper design posuere viverra.
                    </p>
                    <div className="blog-details__points-box">
                      <ul className="blog-details__points list-unstyled">
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
                      <ul className="blog-details__points list-unstyled">
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
                    </div>
                    <p className="blog-details__text-4">
                      A personal portfolio is a collection of work samples,
                      projects, and achievements that showcase individual skills
                      and expertise in a particular field.
                    </p>
                    <div className="blog-details__img-box">
                      <div className="row">
                        <div className="col-xl-6">
                          <div className="blog-details__img-box-img-1">
                            <img
                              src= {BlogDetailsImg2}
                              alt=""
                            />
                          </div>
                        </div>
                        <div className="col-xl-6">
                          <div className="blog-details__img-box-img-1">
                            <img
                              src= {BlogDetailsImg3}
                              alt=""
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="blog-details__prev-and-next">
                      <div className="blog-details__prev-box">
                        <Link to="#" className="blog-details__prev-arrow">
                          <span className="icon-arrow-left"></span>
                        </Link>
                        <Link to="#" className="blog-details__prev">
                          Previous
                          <br /> post
                        </Link>
                      </div>
                      <div className="blog-details__next-box">
                        <Link to="#" className="blog-details__next">
                          Next
                          <br /> post
                        </Link>
                        <Link to="#" className="blog-details__next-arrow">
                          <span className="icon-arrow-right"></span>
                        </Link>
                      </div>
                    </div>
                    <div className="blog-details__keyword-and-social">
                      <div className="blog-details__keyword-box">
                        <span>Keyword:</span>
                        <div className="blog-details__keyword">
                          <Link to="#">Event Prodigy</Link>
                          <Link to="#">Event Management</Link>
                        </div>
                      </div>
                      <div className="blog-details__social">
                        <Link to="#">
                          <span className="icon-facebook"></span>
                        </Link>
                        <Link to="#">
                          <span className="icon-fi"></span>
                        </Link>
                        <Link to="#">
                          <span className="icon-instagram"></span>
                        </Link>
                      </div>
                    </div>
                    <div className="blog-details__comment-box">
                      <h3 className="blog-details__comment-title">1 Comment</h3>
                      <p className="blog-details__comment-date">
                        April 16, 2024
                      </p>
                      <h4 className="blog-details__comment-client-name">
                        Stanio Laito
                      </h4>
                      <p className="blog-details__comment-text">
                        Ished fact that a reader will be distracted by the
                        readable content of a page.
                      </p>
                      <div className="blog-details__comment-btn-box">
                        <Link
                          to="#"
                          className="blog-details__comment-btn thm-btn"
                        >
                          reply
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="comment-one">
                    <h3 className="comment-one__title">Leave a comment</h3>
                    <p className="comment-one__text">
                      By using this form you agree with the storage and handling
                      of your data.
                    </p>
                    <form
                      className="contact-form-validated comment-one__form"
                      action="/assets/inc/sendemail.php"
                      method="post"
                      noValidate
                    >
                      <div className="row">
                        <div className="col-xl-12">
                          <div className="comment-one__input-box">
                            <input
                              type="text"
                              name="name"
                              placeholder="Name"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xl-12">
                          <div className="comment-one__input-box">
                            <input
                              type="email"
                              name="email"
                              placeholder="Email"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xl-12">
                          <div className="comment-one__input-box text-message-box">
                            <textarea
                              name="message"
                              placeholder="Message here.."
                              required
                            ></textarea>
                          </div>
                          <div className="comment-one__btn-box">
                            <button
                              type="submit"
                              className="thm-btn comment-one__btn"
                            >
                              Send Message
                              <span className="icon-arrow-right"></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                    <div className="result"></div>
                  </div>
                </div>
              </div>
              {/* Sidebar */}
              <div className="col-xl-4 col-lg-5">
                <div className="sidebar">
                  {/* Search */}
                  <div className="sidebar__single sidebar__search">
                    <h3 className="sidebar__title">Search</h3>
                    <form className="sidebar__search-form">
                      <input type="search" placeholder="Search...." />
                      <button type="submit">
                        <i className="icon-loupe"></i>
                      </button>
                    </form>
                  </div>

                  {/* Categories */}
                  <div className="sidebar__single sidebar__all-category">
                    <h3 className="sidebar__title">Category</h3>
                    <ul className="sidebar__all-category-list list-unstyled">
                      {categories.map((category, index) => (
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

                  {/* Recent Posts */}
                  <div className="sidebar__single sidebar__post">
                    <h3 className="sidebar__title">Recent Post</h3>
                    <ul className="sidebar__post-list list-unstyled">
                      {recentPosts.map((post, index) => (
                        <li key={index}>
                          <div className="sidebar__post-content">
                            <p className="sidebar__post-date">
                              <span className="icon-calendar"></span>
                              {post.date}
                            </p>
                            <h3>
                              <Link to={post.link}>{post.title}</Link>
                            </h3>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  <div className="sidebar__single sidebar__tags">
                    <h3 className="sidebar__title">Tags</h3>
                    <div className="sidebar__tags-list">
                      {tags.map((tag, index) => (
                        <Link to="#" key={index}>
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
                    {/* Blog Details End */}
        </React.Fragment>
    );
};

export default BlogDetailsMain;
