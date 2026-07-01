import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, BookOpen, Quote, Search as LucideSearch } from "lucide-react";
import { motion } from "framer-motion";
import Masonry from "react-masonry-css";
import { posts } from "../../utils/blogData";
import Icon from "../Icon";

// ── Hero ──
export function Hero({ posts = [] }) {
  const heroImages = posts && posts.length >= 3 
    ? [posts[0].image, posts[1].image, posts[2].image]
    : [
        "/images/blog/landscape-fallback.webp",
        "/images/blog/landscape-fallback.webp",
        "/images/blog/landscape-fallback.webp"
      ];

  return (
    <section className="hero-mobile-container relative w-full max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 overflow-hidden lg:overflow-visible">
      <style>{`
        .hero-mobile-container {
          min-height: 85vh;
        }
        .hero-mobile-bg {
          border-radius: 0 0 40px 40px;
          overflow: hidden;
        }
        .hero-gradient {
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.1) 100%);
        }
        .hero-text-mobile-white {
          color: white !important;
          text-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .hero-text-container {
          padding-left: 24px;
          padding-right: 24px;
          margin-top: auto;
          padding-top: 8rem;
          padding-bottom: 2rem;
          text-align: center;
        }
        .hero-button-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .hero-desktop-images {
          display: none;
        }
        .hero-pill-mobile {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: white !important;
          padding: 6px 16px;
          border-radius: 9999px;
          display: inline-block;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        @media (min-width: 1024px) {
          .hero-mobile-container {
            min-height: auto;
          }
          .hero-mobile-bg {
            display: none;
          }
          .hero-text-container {
            padding-left: 0;
            padding-right: 0;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: 0;
            text-align: left;
          }
          .hero-button-wrapper {
            justify-content: flex-start;
          }
          .hero-desktop-images {
            display: flex;
          }
          .hero-text-mobile-white.title {
            color: var(--blog-title-color) !important;
            text-shadow: none;
          }
          .hero-text-mobile-white.desc {
            color: var(--blog-desc-color) !important;
            text-shadow: none;
          }
          .hero-pill-mobile {
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border: none;
            color: #00a4c4 !important;
            padding: 0;
            display: block;
            box-shadow: none;
          }
        }
      `}</style>

      {/* Mobile Background Image & Overlay (Hidden on Desktop) */}
      <div className="absolute inset-0 z-0 hero-mobile-bg">
        <img src={heroImages[0]} alt="Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      {/* Left Content - Typography */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hero-text-container flex-1 z-10 w-full"
      >
        <div style={{ marginBottom: '32px' }}>
          <p className="hero-pill-mobile font-semibold tracking-widest text-sm uppercase">
            Our Blog
          </p>
        </div>
        
        <h1 className="hero-text-mobile-white title text-4xl md:text-6xl lg:text-[80px] font-bold leading-[1.1] mb-6">
          Stories that <br className="hidden md:block" />
          inspire
        </h1>
        
        <p className="hero-text-mobile-white desc text-lg md:text-xl max-w-md mx-auto lg:mx-0 mb-8" style={{ marginTop: '40px', marginBottom: '48px' }}>
          A space to share ideas, experiences, and moments that matter. Discover the beauty in everyday details.
        </p>
        
        <div className="hero-button-wrapper">
          <button className="group flex items-center gap-4 text-white px-8 py-4 rounded-full font-semibold transition-colors shadow-md" style={{ backgroundColor: '#00a4c4' }}>
            Explore All Posts
            <span className="bg-white rounded-full p-1.5 group-hover:translate-x-1 transition-transform" style={{ color: '#00a4c4' }}>
              <ArrowRight size={20} />
            </span>
          </button>
        </div>
      </motion.div>

      {/* Right Content - Images */}
      <div className="hero-desktop-images flex-1 relative h-[380px] sm:h-[500px] lg:h-[600px] w-full items-center justify-center mt-8 lg:mt-0">
        {/* Floating Decorative Elements */}
        <div className="absolute top-10 left-10 flex gap-2 rotate-12 opacity-40">
          <div className="w-4 h-8 bg-cyan-200 rounded-full"></div>
          <div className="w-4 h-8 bg-cyan-200 rounded-full mt-4"></div>
          <div className="w-4 h-8 bg-cyan-200 rounded-full mt-2"></div>
        </div>
        
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
          className="absolute bottom-4 left-0 lg:left-auto lg:top-0 right-auto lg:right-4 w-[45%] h-[40%] lg:h-[45%] z-20 rounded-full overflow-hidden border-[4px] lg:border-[6px] border-white shadow-xl"
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
          className="absolute bottom-0 right-[5%] lg:right-0 w-[45%] lg:w-[55%] h-[45%] lg:h-[45%] z-20 overflow-hidden border-[4px] lg:border-[6px] border-white shadow-xl rounded-[60px_60px_40px_40px] lg:rounded-[60px_100px_40px_120px]"
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
  "Stay"
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

      {/* Search Bar */}
      <div 
        className="search-bar-responsive flex items-center rounded-full shadow-sm transition-all w-full"
        style={{ padding: '4px 4px 4px 20px', border: '1px solid #e5e7eb', backgroundColor: 'transparent' }}
      >
        <input 
          type="text" 
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none flex-1 font-medium placeholder:text-gray-400"
          style={{ fontSize: '15px', color: 'var(--blog-title-color)' }}
        />
        <button 
          className="text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2 shadow-sm hover:opacity-90"
          style={{ width: '40px', height: '40px', backgroundColor: '#00a4c4' }}
        >
          <Icon name="search" size={18} className="fill-current" />
        </button>
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
