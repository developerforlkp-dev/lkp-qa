import React from 'react';
import { Link } from 'react-router-dom'; // Use react-router-dom for routing.

const BlogPage = ({ blogData }) => {
  return (
<>
<section className="blog-page">
            <div className="container">
              <div className="row">
                {blogData.map((blog, index) => (
                  <div
                    key={blog.id}
                    className={`col-xl-4 col-lg-4 col-md-6 wow fadeIn${
                      index % 3 === 0
                        ? "Left"
                        : index % 3 === 1
                        ? "Up"
                        : "Right"
                    }`}
                    data-wow-delay={`${(index + 1) * 100}ms`}
                  >
                    <div className="blog-one__single">
                      <div className="blog-one__img">
                        <img src={blog.imageSrc} alt={blog.imageAlt} />
                        <div className="blog-one__hover">
                          <Link to={blog.detailsUrl}>
                            <div className="blog-one__hover-icon-1">
                              <span className="blog-one__hover-icon-2"></span>
                            </div>
                          </Link>
                        </div>
                      </div>
                      <div className="blog-one__content">
                        <ul className="blog-one__meta list-unstyled">
                          <li>
                            <Link to="#">
                              <span className="icon-user"></span> By{" "}
                              {blog.author}
                            </Link>
                          </li>
                          <li>
                            <Link to="#">
                              <span className="icon-calendar"></span>{" "}
                              {blog.date}
                            </Link>
                          </li>
                        </ul>
                        <h3 className="blog-one__title">
                          <Link to={blog.detailsUrl}>{blog.title}</Link>
                        </h3>
                        <div className="blog-one__btn-box-two">
                          <Link
                            to={blog.detailsUrl}
                            className="blog-one__btn-2 thm-btn"
                          >
                            Read More
                            <span className="icon-arrow-right"></span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
</>
          

  );
};

export default BlogPage;
