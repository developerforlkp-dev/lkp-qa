// Force recompile
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, BookOpen, Quote, Search as LucideSearch } from "lucide-react";
import { motion } from "framer-motion";
import Masonry from "react-masonry-css";
import { posts } from "../../utils/blogData";
import Icon from "../Icon";

// ── Hero ──
export function Hero({ posts = [] }) {
  const [currentMobileImageIndex, setCurrentMobileImageIndex] = useState(0);

  const heroImages = posts && posts.length >= 3 
    ? [posts[0].image, posts[1].image, posts[2].image]
    : [
        "/images/blog/landscape-fallback.webp",
        "/images/blog/landscape-fallback.webp",
        "/images/blog/landscape-fallback.webp"
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMobileImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="hero-mobile-container relative w-full max-w-6xl mx-auto px-6 pt-16 lg:pt-20 pb-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 overflow-hidden lg:overflow-visible">
      <style>{`
        .hero-mobile-container {
          height: 320px;
        }
        .hero-mobile-bg {
          border-radius: 0 0 40px 40px;
          overflow: hidden;
        }
        .hero-text-mobile-white.title {
          color: white !important;
          text-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .hero-text-mobile-white.desc {
          color: #f3f4f6 !important;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .hero-text-mobile-white.label {
          color: white !important;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }
        /* Mobile Specific Overrides */
        @media (max-width: 1023px) {
          .hero-mobile-container {
            padding: 0 !important;
            justify-content: flex-end !important;
            align-items: flex-start !important;
          }
          .hero-text-container {
            flex: none !important;
            padding: 0 24px 32px 24px !important;
            margin: 0 !important;
          }
        }

        .hero-desktop-images {
          display: none;
        }

        @media (min-width: 1024px) {
          .hero-mobile-container {
            height: auto;
          }
          .hero-mobile-bg {
            display: none;
          }
          .hero-text-mobile-white.title {
            color: var(--blog-title-color) !important;
            text-shadow: none;
          }
          .hero-text-mobile-white.desc {
            color: var(--blog-desc-color) !important;
            text-shadow: none;
          }
          .hero-text-mobile-white.label {
            color: var(--blog-title-color) !important;
            text-shadow: none;
          }
          .hero-desktop-images {
            display: flex;
          }
        }
      `}</style>

      {/* Mobile Background Image (Hidden on Desktop) */}
      <div className="absolute inset-0 z-0 hero-mobile-bg lg:hidden">
        {heroImages.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`Background ${idx}`} 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" 
            style={{ opacity: currentMobileImageIndex === idx ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        {/* Navigation Indicators */}
        <div className="absolute bottom-6 right-6 flex gap-2 z-20">
          {heroImages.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentMobileImageIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${currentMobileImageIndex === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Left Content - Typography */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="hero-text-container flex-1 z-10 w-full"
      >
        <div style={{ marginBottom: '16px' }}>
          <p className="hero-text-mobile-white label font-bold tracking-widest text-xs uppercase lg:text-[#00a4c4]">
            Our Blog
          </p>
        </div>
        
        <h1 className="hero-text-mobile-white title text-[42px] md:text-5xl lg:text-[64px] font-extrabold leading-[1.1] mb-5">
          Stories that <br />
          inspire <span className="italic font-light text-cyan-400 lg:text-[#00a4c4]">journeys</span>
        </h1>
        
        <p className="hero-text-mobile-white desc text-base md:text-lg max-w-md mx-auto lg:mx-0 mb-6" style={{ lineHeight: '1.6' }}>
          Travel guides, hidden gems and real stories from around the world.
        </p>
      </motion.div>

      {/* Right Content - Images */}
      <div className="hero-desktop-images flex-1 relative h-[380px] sm:h-[450px] lg:h-[500px] w-full items-center justify-center mt-8 lg:mt-0">

        
        {/* Main Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="absolute top-0 lg:top-10 left-[10%] lg:left-0 w-[80%] lg:w-[60%] h-[55%] lg:h-[80%] z-10 overflow-hidden rounded-[140px_140px_20px_20px] lg:rounded-[140px_40px_140px_40px]"
        >
          <img 
            src={heroImages[0]} 
            alt="Hero blog post 1" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </motion.div>

        {/* Second Image (Circle) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="absolute bottom-4 left-0 lg:left-auto lg:top-0 right-auto lg:right-4 w-[45%] h-[40%] lg:h-[45%] z-20 rounded-full overflow-hidden shadow-xl"
          style={{ border: '6px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
        >
          <img 
            src={heroImages[1]} 
            alt="Hero blog post 2" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </motion.div>

        {/* Third Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="absolute bottom-0 right-[5%] lg:right-0 w-[45%] lg:w-[55%] h-[45%] lg:h-[45%] z-20 overflow-hidden shadow-xl rounded-[60px_60px_40px_40px] lg:rounded-[60px_100px_40px_120px]"
          style={{ border: '6px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
        >
          <img 
            src={heroImages[2]} 
            alt="Hero blog post 3" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </motion.div>
      </div>
    </section>
  );
}


// ── Filters ──
const categories = [
  "All Posts",
  "Experience",
  "Event",
  "Stay",
  "Food",
  "Place"
];

export function Filters({ searchQuery = "", setSearchQuery = () => {}, selectedCategory = "All Posts", setSelectedCategory = () => {} }) {
  return (
    <section 
      className="w-full mx-auto flex flex-col md:flex-row md:items-center justify-between"
      style={{ maxWidth: '1050px', marginTop: '32px', marginBottom: '64px', gap: '24px', paddingLeft: '24px', paddingRight: '24px' }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .search-bar-responsive {
          max-width: 100%;
        }
        .pill-responsive {
          font-size: 13px !important;
          padding: 8px 16px !important;
        }
        @media (min-width: 768px) {
          .search-bar-responsive {
            max-width: 300px;
          }
          .pill-responsive {
            font-size: 15px !important;
            padding: 10px 24px !important;
          }
        }
      `}</style>

      {/* Category Pills */}
      <div className="flex items-center w-full md:w-auto overflow-x-auto hide-scrollbar pb-2 md:pb-0" style={{ gap: '16px', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="pill-responsive rounded-full font-medium transition-colors flex-shrink-0"
              style={{ 
                color: isActive ? '#ffffff' : 'var(--blog-title-color)',
                backgroundColor: isActive ? '#00a4c4' : 'transparent',
                border: isActive ? '1px solid #00a4c4' : '1px solid #e5e7eb'
              }}
            >
              {category}
            </button>
          );
        })}
      </div>


    </section>
  );
}


// ── BlogCard ──
export function BlogCard({
  slug,
  image,
  category,
  title,
  description,
  date,
  readTime,
  imageClassName = "h-56 rounded-3xl",
  badgeIcon
}) {
  return (
    <Link to={`/blog/${slug}`} className="flex flex-col group cursor-pointer" style={{ textDecoration: 'none' }}>
      <article className="flex flex-col h-full">
        <div className={`relative w-full overflow-hidden mb-5 ${imageClassName}`}>
          <img
            src={image}
            alt={title}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          />
          {badgeIcon && (
            <div className="absolute -bottom-4 left-6 text-white p-2.5 rounded-full shadow-lg z-10 border-[3px] border-white" style={{ backgroundColor: '#00a4c4' }}>
              {badgeIcon}
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1" style={{ padding: '0 12px', marginTop: '28px' }}>
          <span className="font-bold tracking-widest uppercase mb-2" style={{ color: '#00a4c4', fontSize: '11px' }}>
            {category}
          </span>
          
          <h3 className="font-bold mb-3 transition-colors" style={{ color: 'var(--blog-title-color)', fontSize: '22px', lineHeight: 1.3 }}>
            {title}
          </h3>
          
          <p className="leading-relaxed mb-6 flex-1" style={{ color: 'var(--blog-desc-color)', fontSize: '13px' }}>
            {description}
          </p>
          
          <div className="flex items-center justify-between mt-auto" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px', marginTop: '24px' }}>
            <div className="flex items-center text-gray-500 font-medium" style={{ gap: '6px', fontSize: '12px' }}>
              <Clock size={14} className="text-gray-400" />
              <span>{date}</span>
              <span className="bg-gray-300 rounded-full mx-1" style={{ width: '4px', height: '4px' }}></span>
              <span>{readTime}</span>
            </div>
            <div className="text-white rounded-full flex items-center justify-center transition-colors shadow-sm" style={{ backgroundColor: '#00a4c4', width: '32px', height: '32px' }}>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── BlogGrid ──
const badgeIcons = {
  5: <BookOpen size={18} />,
};

export function BlogGrid({ posts = [] }) {
  if (!posts || posts.length === 0) {
    return (
      <section className="w-full mx-auto px-6 py-12 text-center" style={{ maxWidth: '1050px' }}>
        <p className="text-gray-500">No posts found.</p>
      </section>
    );
  }

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  return (
    <section className="w-full mx-auto overflow-hidden" style={{ maxWidth: '1280px', paddingBottom: '96px', paddingLeft: '24px', paddingRight: '24px' }}>
      <style>{`
        .blog-masonry-grid {
          display: flex;
          margin-left: -24px;
          width: auto;
        }
        .blog-masonry-grid_column {
          padding-left: 24px;
          background-clip: padding-box;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 700px) {
          .blog-masonry-grid {
            margin-left: 0;
          }
          .blog-masonry-grid_column {
            padding-left: 0;
          }
        }
      `}</style>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="blog-masonry-grid"
        columnClassName="blog-masonry-grid_column"
      >
        {posts.map((post, index) => (
          <React.Fragment key={post.id}>
            {index === 4 && (
              <div style={{ marginBottom: '56px' }}>
                {/* Quote Block */}
                <div className="relative flex items-center justify-center text-center my-6" style={{ padding: '48px 24px' }}>
                  <div className="absolute inset-0 bg-cyan-50 opacity-90 -z-10 transform scale-105" 
                       style={{ borderRadius: '60px 20px 60px 20px' }}></div>
                  <Quote size={32} fill="currentColor" className="absolute text-cyan-200 opacity-60" style={{ top: '16px', left: '16px' }} />
                  <Quote size={32} fill="currentColor" className="absolute text-cyan-200 opacity-60 transform rotate-180" style={{ bottom: '16px', right: '16px' }} />
                  
                  <h3 className="text-xl md:text-[28px] font-bold leading-snug relative z-10" style={{ color: '#001F3F' }}>
                    The world is full of <br />
                    beautiful places — <br />
                    let's go <span className="italic relative inline-block" style={{ color: '#00a4c4' }}>
                      <span className="relative z-10">explore</span>
                      <span className="absolute left-0 bottom-1 w-full h-[12px] opacity-40 z-0" style={{ backgroundImage: "url('/images/brushhh.svg')", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}></span>
                    </span> them.
                  </h3>
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '56px' }}>
              <BlogCard 
                {...post} 
                imageClassName="h-[240px] rounded-[24px]" 
                badgeIcon={badgeIcons[post.id] || null} 
              />
            </div>
          </React.Fragment>
        ))}
      </Masonry>
    </section>
  );

}
