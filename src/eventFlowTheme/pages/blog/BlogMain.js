import React from 'react';
import { Link } from 'react-router-dom'; // Use react-router-dom for routing
import BlogImg1 from '../../assets/images/blog/blog-1-1.jpg'
import BlogImg2 from '../../assets/images/blog/blog-1-2.jpg'
import BlogImg3 from '../../assets/images/blog/blog-1-3.jpg'
import BlogImg4 from '../../assets/images/blog/blog-1-4.jpg'
import BlogImg5 from '../../assets/images/blog/blog-1-5.jpg'
import BlogImg6 from '../../assets/images/blog/blog-1-6.jpg'


const BlogMain = () => {
   
      // Move blog data directly into the Home component
  const blogData = [
    {
      id: 1,
      BlogImage: BlogImg1,
      imageAlt: "Blog Image 1",
      detailsUrl: "/blog-details/1",
      author: "admin",
      date: "October 19, 2022",
      title: "Join the Festivities Celebrate Special Moments",
    },
    {
      id: 2,
      BlogImage: BlogImg2,
      imageAlt: "Blog Image 2",
      detailsUrl: "/blog-details/2",
      author: "admin",
      date: "October 19, 2022",
      title: "Embrace the Joyful Spirit Discover a World",
    },
    {
      id: 3,
      BlogImage: BlogImg3,
      imageAlt: "Blog Image 3",
      detailsUrl: "/blog-details/3",
      author: "admin",
      date: "October 19, 2022",
      title: "Where Moments Come Alive and Celebrate",
    },
    {
      id: 4,
      BlogImage: BlogImg4,
      imageAlt: "Blog Image 3",
      detailsUrl: "/blog-details/3",
      author: "admin",
      date: "October 19, 2022",
      title: "Events That Leave a Impression",
    },
    {
      id: 5,
      BlogImage: BlogImg5,
      imageAlt: "Blog Image 3",
      detailsUrl: "/blog-details/3",
      author: "admin",
      date: "October 19, 2022",
      title: "Sparkle & Shine on Celebrations",
    },
    {
      id: 6,
      BlogImage: BlogImg6,
      imageAlt: "Blog Image 3",
      detailsUrl: "/blog-details/3",
      author: "admin",
      date: "October 19, 2022",
      title: "A personal portfolio is a curated collection",
    },
    // Add more blogs here...
  ];

    return (
        <React.Fragment>
            {/* Blog Page Start */}
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
                        <img src={blog.BlogImage} alt={blog.imageAlt} />
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
          {/* Blog Page End */}
        </React.Fragment>
    );
};

export default BlogMain;
