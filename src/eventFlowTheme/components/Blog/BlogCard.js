// src/components/BlogCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const BlogCard = ({ image, title, date, author, link }) => {
  return (
    <div className="blog-one__single">
      <div className="blog-one__img-box">
        <div className="blog-one__img">
          <img src={image} alt={title} />
        </div>
      </div>
      <div className="blog-one__content">
        <ul className="blog-one__meta list-unstyled">
          <li>
            <Link to="#"><span className="icon-user"></span>By {author}</Link>
          </li>
          <li>
            <Link to="#"><span className="icon-callender"></span>{date}</Link>
          </li>
        </ul>
        <h3 className="blog-one__title"><Link to={link}>{title}</Link></h3>
        <div className="blog-one__btn-box">
          <Link to={link} className="blog-one__btn thm-btn-two">
            Read more<span className="icon-dubble-arrow-right"></span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
