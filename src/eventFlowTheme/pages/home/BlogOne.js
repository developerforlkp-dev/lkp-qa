import { Link } from 'react-router-dom';
import BlogImg1 from '../../assets/images/blog/blog-1-1.jpg';
import BlogImg2 from '../../assets/images/blog/blog-1-2.jpg';
import BlogImg3 from '../../assets/images/blog/blog-1-3.jpg';

// Mock data for demonstration purposes
const blogPosts = [
    {
        id: 1,
        title: 'Join the Festivi Celebrate Special Moments',
        image: BlogImg1,
        date: 'October 19, 2022',
        author: 'admin',
        link: '/blog-details',
        animationDelay: '100ms',
        animationClass: 'fadeInLeft'
      },
      {
        id: 2,
        title: 'Embrace the Joyful Spirit Discover a World',
        image: BlogImg2,
        date: 'October 19, 2022',
        author: 'admin',
        link: '/blog-details',
        animationDelay: '200ms',
        animationClass: 'fadeInUp'
      },
      {
        id: 3,
        title: 'Where Moments Come Alive an Celebrate',
        image: BlogImg3,
        date: 'October 19, 2022',
        author: 'admin',
        link: '/blog-details',
        animationDelay: '300ms',
        animationClass: 'fadeInRight'
      }
];

export default function BlogOne() {
  return (
    <section id='th-blog' className="blog-one">
      <div className="container">
        <div className="blog-one__top">
          <div className="section-title text-left">
            <div className="section-title__tagline-box">
              <span className="section-title__tagline">Latest Blog And news</span>
            </div>
            <h2 className="section-title__title">Whats happening near</h2>
          </div>
          <div className="blog-one__btn-box">
            <Link to="/blog" className="blog-one__btn thm-btn">
              View More Blog<span className="icon-arrow-right"></span>
            </Link>
          </div>
        </div>
        <div className="blog-one__bottom">
          <div className="row">
            {blogPosts.map(post => (
              <div
                key={post.id}
                className={`col-xl-4 col-lg-4 col-md-6 wow ${post.animationClass}`}
                data-wow-delay={post.animationDelay}
              >
                <div className="blog-one__single">
                  <div className="blog-one__img">
                    <img
                      src={post.image}
                      alt={post.title}
                    />
                    <div className="blog-one__hover">
                      <Link to={post.link}>
                        <span className="blog-one__hover-icon-1">
                          <span className="blog-one__hover-icon-2"></span>
                        </span>
                      </Link>
                    </div>
                  </div>
                  <div className="blog-one__content">
                    <ul className="blog-one__meta list-unstyled">
                      <li>
                        <span className="icon-user"></span>By {post.author}
                      </li>
                      <li>
                        <span className="icon-calendar"></span>{post.date}
                      </li>
                    </ul>
                    <h3 className="blog-one__title">
                      <Link to={post.link}>
                        {post.title}
                      </Link>
                    </h3>
                    <div className="blog-one__btn-box-two">
                      <Link to={post.link} className="blog-one__btn thm-btn">
                        Read More<span className="icon-arrow-right"></span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
