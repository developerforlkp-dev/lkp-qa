import React from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, Share2, Facebook, Twitter, Linkedin, ChevronRight } from "lucide-react";
import { posts } from "../../utils/blogData";
import { motion } from "framer-motion";

export function Layout1ModernMinimalist({ post }) {
  const relatedPosts = posts.filter((p) => post.relatedIds?.includes(p.id));

  return (
    <div className="blog-page-root l1-root" style={{ minHeight: "100vh", paddingTop: "0px", marginTop: "-40px", paddingBottom: "80px", fontFamily: "\"Inter\", sans-serif" }}>
      
      {/* SCOPED CSS STYLES */}
      <style>{`
        
        .l1-root { background-color: #FAFAFA; color: #333; transition: background-color 0.3s, color 0.3s; }
        .dark-mode .l1-root, body.dark-mode .l1-root { background-color: #0a0a0a !important; color: #f1f1f1 !important; }
        .dark-mode .l1-root .blog-title, body.dark-mode .l1-root .blog-title { color: #FFF !important; }
        .dark-mode .l1-root .blog-main-content h3, body.dark-mode .l1-root .blog-main-content h3 { color: #FFF !important; }
        .dark-mode .l1-root .blog-main-content, body.dark-mode .l1-root .blog-main-content { color: #DDD !important; }
        .dark-mode .l1-root .blog-quote, body.dark-mode .l1-root .blog-quote { background-color: #111 !important; border-color: #333 !important; color: #FFF !important; }
        .dark-mode .l1-root .blog-sidebar-widget, body.dark-mode .l1-root .blog-sidebar-widget { background: #111 !important; border: 1px solid #222 !important; box-shadow: none !important; }
        .dark-mode .l1-root .blog-sidebar-title, body.dark-mode .l1-root .blog-sidebar-title { color: #FFF !important; }
        .dark-mode .l1-root .related-title, body.dark-mode .l1-root .related-title { color: #FFF !important; }
        .dark-mode .l1-root .blog-tag, body.dark-mode .l1-root .blog-tag { background: #222 !important; color: #AAA !important; }
        .dark-mode .l1-root .blog-social-link, body.dark-mode .l1-root .blog-social-link { background: #222 !important; color: #AAA !important; }
        .dark-mode .l1-root .blog-body-html *, body.dark-mode .l1-root .blog-body-html * { color: inherit !important; }
        
        .blog-intro-p {
          font-size: 22px;
          color: #001F3F;
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .dark-mode .l1-root .blog-intro-p, body.dark-mode .l1-root .blog-intro-p {
          color: #DDD !important;
        }
        .blog-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          box-sizing: border-box;
        }
        .blog-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 60px;
        }
        .blog-category {
          color: #00A4C4;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .blog-category::before, .blog-category::after {
          content: "";
          display: block;
          width: 30px;
          height: 2px;
          background-color: #00A4C4;
        }
        .blog-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 900;
          color: #001F3F;
          line-height: 1.1;
          margin-bottom: 24px;
          max-width: 900px;
          letter-spacing: -1px;
        }
        .blog-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #666;
          font-size: 15px;
          margin-bottom: 40px;
        }
        .blog-meta-dot {
          width: 4px;
          height: 4px;
          background-color: #CCC;
          border-radius: 50%;
        }
        .blog-hero-image-container {
          width: 100%;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          margin-bottom: 60px;
          aspect-ratio: 16/9;
          position: relative;
        }
        .blog-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .blog-content-wrapper {
          display: grid;
          grid-template-columns: 1fr;
          gap: 60px;
          box-sizing: border-box;
        }
        @media(min-width: 992px) {
          .blog-content-wrapper {
            grid-template-columns: 1fr 300px;
          }
        }
        
        .blog-main-content {
          font-size: 18px;
          line-height: 1.8;
          color: #444;
        }
        .blog-body-html * {
          color: inherit !important;
          background-color: transparent !important;
        }
        .blog-main-content h3 {
          font-size: 28px;
          color: #001F3F;
          margin-top: 50px;
          margin-bottom: 24px;
          font-weight: 700;
        }
        .blog-main-content p {
          margin-bottom: 24px;
        }
        .blog-main-content img {
          border-radius: 16px;
          margin: 40px 0;
          width: 100%;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        
        .blog-quote {
          background-color: #F0FBFC;
          border-left: 6px solid #00A4C4;
          padding: 30px 40px;
          margin: 40px 0;
          border-radius: 0 16px 16px 0;
          font-size: 22px;
          font-style: italic;
          color: #001F3F;
          line-height: 1.5;
        }
        
        .blog-sidebar {
          position: sticky;
          top: 120px;
        }
        .blog-sidebar-widget {
          background: #fff;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          margin-bottom: 30px;
          border: 1px solid #EAEAEA;
        }
        .blog-sidebar-title {
          font-size: 18px;
          font-weight: 700;
          color: #001F3F;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .blog-social-links {
          display: flex;
          gap: 12px;
        }
        .blog-social-link {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #F5F5F5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .blog-social-link:hover {
          background: #00A4C4;
          color: #FFF;
          transform: translateY(-2px);
        }
        
        .blog-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .blog-tag {
          background: #F0F0F0;
          color: #555;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .blog-tag:hover {
          background: #001F3F;
          color: #FFF;
        }
        
        .related-card {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .related-card:last-child {
          margin-bottom: 0;
        }
        .related-card:hover .related-title {
          color: #00A4C4;
        }
        .related-img {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          object-fit: cover;
        }
        .related-info {
          flex: 1;
        }
        .related-title {
          font-size: 15px;
          font-weight: 700;
          color: #001F3F;
          line-height: 1.4;
          margin-bottom: 6px;
          transition: color 0.2s;
        }
        .related-date {
          font-size: 12px;
          color: #888;
        }
      `}</style>

      <div className="blog-container">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="blog-hero"
        >
          <div className="blog-category">
            {post.category || "Article"}
          </div>
          <h1 className="blog-title">
            {post.title}
          </h1>
          <div className="blog-meta">
            <span>{post.date}</span>
            <span className="blog-meta-dot"></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00A4C4', fontWeight: '600' }}>
              <Clock size={16} /> {post.readTime}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="blog-hero-image-container"
        >
          <img src={post.heroImage} alt={post.title} className="blog-hero-image" />
        </motion.div>

        <div className="blog-content-wrapper">
          
          {/* MAIN CONTENT */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="blog-main-content"
          >
            <p className="blog-intro-p">
              {post.description}
            </p>
            
            

            {post.content?.sections?.map((section, idx) => (
              <div key={idx}>
                {section.heading && <h3>{section.heading}</h3>}
                {section.body && <div className="blog-body-html" dangerouslySetInnerHTML={{ __html: section.body }} />}
                {section.paragraph && <p>{section.paragraph}</p>}
                {section.image && <img src={section.image} alt={section.heading || "Blog Image"} />}
                {section.quote && (
                  <div className="blog-quote">
                    "{section.quote}"
                  </div>
                )}
              </div>
            ))}
            
            
            
          </motion.div>

          {/* SIDEBAR */}
          <div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="blog-sidebar"
            >
              
              

              {post.tags && post.tags.length > 0 && (
                <div className="blog-sidebar-widget">
                  <div className="blog-sidebar-title">Tags</div>
                  <div className="blog-tags">
                    {post.tags.map((tag, i) => (
                      <Link to={`/blog?tag=${tag}`} key={i} className="blog-tag">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {relatedPosts && relatedPosts.length > 0 && (
                <div className="blog-sidebar-widget">
                  <div className="blog-sidebar-title">Related Posts</div>
                  <div>
                    {relatedPosts.map((rp, i) => (
                      <Link to={`/blog/${rp.slug}`} key={i} className="related-card">
                        <img src={rp.image} alt={rp.title} className="related-img" />
                        <div className="related-info">
                          <div className="related-title">{rp.title}</div>
                          <div className="related-date">{rp.date}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}


export function Layout2EditorialMagazine({ post }) {
  const relatedPosts = posts.filter((p) => post.relatedIds?.includes(p.id));

  return (
    <div className="blog-page-root l2-root" style={{ minHeight: "100vh", paddingTop: "0px", marginTop: "-40px", paddingBottom: "80px", fontFamily: "\"Inter\", sans-serif" }}>
      
      <style>{`
        
        .l2-root { background-color: #F8FCFD; color: #333; transition: background-color 0.3s, color 0.3s; }
        .dark-mode .l2-root, body.dark-mode .l2-root { background-color: #050505 !important; color: #f1f1f1 !important; }
        .dark-mode .l2-root .l2-hero-card, body.dark-mode .l2-root .l2-hero-card { background: #111 !important; box-shadow: none !important; border: 1px solid #222 !important; }
        .dark-mode .l2-root .l2-title, body.dark-mode .l2-root .l2-title { color: #FFF !important; }
        .dark-mode .l2-root .l2-intro, body.dark-mode .l2-root .l2-intro { color: #00A4C4 !important; }
        .dark-mode .l2-root .l2-text, body.dark-mode .l2-root .l2-text { color: #DDD !important; }
        .dark-mode .l2-root .l2-section-title, body.dark-mode .l2-root .l2-section-title { color: #FFF !important; }
        .dark-mode .l2-root .l2-quote, body.dark-mode .l2-root .l2-quote { border-color: #333 !important; color: #00A4C4 !important; }
        .dark-mode .l2-root span[style*="background: '#FFF'"], body.dark-mode .l2-root span[style*="background: '#FFF'"] { background: #111 !important; border-color: #333 !important; color: #AAA !important; }
        .dark-mode .l2-root div[style*="background: '#FFF'"], body.dark-mode .l2-root div[style*="background: '#FFF'"] { background: #111 !important; border-color: #222 !important; color: #DDD !important; }
        .dark-mode .l2-root .blog-body-html *, body.dark-mode .l2-root .blog-body-html * { color: inherit !important; }
        .l2-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
          box-sizing: border-box;
        }
        .l2-hero-card {
          background: #fff;
          border-radius: 40px;
          padding: 50px;
          box-shadow: 0 20px 60px rgba(0,164,196,0.05);
          display: flex;
          align-items: center;
          gap: 60px;
          margin-bottom: 80px;
        }
        @media(max-width: 1024px) {
          .l2-hero-card {
            flex-direction: column;
            padding: 30px;
            border-radius: 30px;
            gap: 30px;
          }
          .l2-container { padding: 0 20px; }
        }
        .l2-hero-text { flex: 1; }
        .l2-hero-image-wrap {
          flex: 1;
          height: 400px;
          width: 100%;
          border-radius: 30px;
          overflow: hidden;
        }
        .l2-hero-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .l2-category {
          color: #00A4C4;
          font-weight: 800;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-size: 12px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .l2-category::before {
          content: "";
          display: block;
          width: 40px;
          height: 2px;
          background: #00A4C4;
        }
        .l2-title {
          font-size: clamp(32px, 4vw, 54px);
          font-weight: 900;
          color: #001F3F;
          line-height: 1.1;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .l2-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #888;
          font-size: 14px;
          font-weight: 500;
        }
        .l2-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 60px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media(min-width: 1024px) {
          .l2-content-grid {
            grid-template-columns: 300px 1fr;
          }
        }
        .l2-sidebar-title {
          color: #00A4C4;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 13px;
          margin-bottom: 30px;
        }
        .l2-intro {
          font-size: 24px;
          color: #001F3F;
          font-weight: 700;
          line-height: 1.5;
          margin-bottom: 30px;
        }
        .l2-text {
          font-size: 19px;
          line-height: 1.8;
          color: #555;
          margin-bottom: 30px;
        }
        .blog-body-html * {
          color: inherit !important;
          background-color: transparent !important;
        }
        .l2-section-title {
          font-size: 28px;
          color: #001F3F;
          margin: 50px 0 24px 0;
          font-weight: 800;
        }
        .l2-quote {
          font-size: 26px;
          color: #00A4C4;
          font-weight: 700;
          line-height: 1.4;
          padding-left: 30px;
          border-left: 4px solid #001F3F;
          margin: 60px 0;
        }
        .l2-image {
          border-radius: 20px;
          margin: 40px 0;
          width: 100%;
        }
      `}
      </style>

      <div className="l2-container">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="l2-hero-card"
        >
          <div className="l2-hero-text">
            <div className="l2-category">{post.category || "Editorial"}</div>
            <h1 className="l2-title">{post.title}</h1>
            <div className="l2-meta">
              <span>{post.date}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#CCC' }}></span>
              <span style={{ color: '#00A4C4', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} />{post.readTime}</span>
            </div>
          </div>
          <div className="l2-hero-image-wrap">
            <img src={post.heroImage} alt={post.title} />
          </div>
        </motion.div>

        <div className="l2-content-grid">
          <div>
            <div className="l2-sidebar-title">Summary</div>
            <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '40px' }}>
              {post.description}
            </p>
            
            {post.tags && post.tags.length > 0 && (
              <>
                <div className="l2-sidebar-title">Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {post.tags.map((tag, i) => (
                    <span key={i} style={{ background: '#FFF', border: '1px solid #EAEAEA', padding: '6px 16px', borderRadius: '40px', fontSize: '13px', color: '#555', fontWeight: '600' }}>{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div>
            <div className="l2-intro">{post.content?.intro}</div>
            
            {post.content?.sections?.map((section, idx) => (
              <div key={idx}>
                {section.heading && <h3 className="l2-section-title">{section.heading}</h3>}
                {section.body && <div className="l2-text blog-body-html" dangerouslySetInnerHTML={{ __html: section.body }} />}
                {section.paragraph && <p className="l2-text">{section.paragraph}</p>}
                {section.quote && <div className="l2-quote">"{section.quote}"</div>}
                {section.image && <img src={section.image} className="l2-image" alt="section" />}
              </div>
            ))}
            
            
          </div>
        </div>
      </div>
    </div>
  );
}

export function Layout3ImmersiveDark({ post }) {
  return (
    <div className="blog-page-root" style={{ 
      backgroundColor: '#0a0a0a', 
      minHeight: '100vh', 
      fontFamily: '"Inter", sans-serif',
      color: '#FFF'
    }}>
      <style>{`
        .l3-hero {
          position: relative;
          height: 80vh;
          min-height: 600px;
          display: flex;
          align-items: flex-end;
          padding-bottom: 80px;
          overflow: hidden;
        }
        .l3-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .l3-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.5;
        }
        .l3-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, #0a0a0a 0%, transparent 100%);
          z-index: 2;
        }
        .l3-hero-content {
          position: relative;
          z-index: 3;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
          padding: 0 40px;
          box-sizing: border-box;
          text-align: center;
        }
        .l3-title {
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 24px;
        }
        .l3-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: #AAA;
          font-size: 15px;
        }
        .l3-container {
          max-width: 800px;
          margin: -40px auto 0;
          padding: 0 40px 80px;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
        }
        @media(max-width: 768px) {
          .l3-container, .l3-hero-content { padding: 0 20px; }
        }
        .l3-intro {
          font-size: 24px;
          color: #00A4C4;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .l3-text {
          font-size: 20px;
          line-height: 1.8;
          color: #DDD;
          margin-bottom: 30px;
        }
        .blog-body-html * {
          color: inherit !important;
          background-color: transparent !important;
        }
        .l3-heading {
          font-size: 32px;
          color: #FFF;
          font-weight: 800;
          margin: 60px 0 30px 0;
        }
        .l3-quote {
          font-size: 28px;
          line-height: 1.5;
          color: #FFF;
          font-style: italic;
          text-align: center;
          margin: 60px 0;
          padding: 0 40px;
        }
        .l3-image {
          border-radius: 16px;
          width: 100%;
          margin: 40px 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
      `}</style>

      <div className="l3-hero">
        <div className="l3-hero-bg">
          <img src={post.heroImage} alt={post.title} />
        </div>
        <div className="l3-hero-overlay"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="l3-hero-content"
        >
          <div style={{ color: '#00A4C4', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
            {post.category || "Featured"}
          </div>
          <h1 className="l3-title">{post.title}</h1>
          <div className="l3-meta">
            <span>{post.date}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00A4C4' }}><Clock size={16} />{post.readTime}</span>
          </div>
        </motion.div>
      </div>

      <div className="l3-container">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="l3-intro">{post.content?.intro}</div>
          
          {post.content?.sections?.map((section, idx) => (
            <div key={idx}>
              {section.heading && <h3 className="l3-heading">{section.heading}</h3>}
              {section.body && <div className="l3-text blog-body-html" dangerouslySetInnerHTML={{ __html: section.body }} />}
              {section.paragraph && <p className="l3-text">{section.paragraph}</p>}
              {section.quote && <div className="l3-quote">"{section.quote}"</div>}
              {section.image && <img src={section.image} className="l3-image" alt="section" />}
            </div>
          ))}

          
        </motion.div>
      </div>
    </div>
  );
}
