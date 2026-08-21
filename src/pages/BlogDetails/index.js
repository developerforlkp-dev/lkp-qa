import React, { useEffect, useState } from "react";
// Force HMR re-render
import { useParams, useHistory } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { mapApiBlogToComponentFormat } from "../../utils/blogData";
import { getBlogBySlug } from "../../utils/api";
import {
  Layout1ModernMinimalist,
  Layout2EditorialMagazine,
  Layout3ImmersiveDark
} from "../../components/Blog/BlogLayouts";
import { blogTailwindCss } from "../../styles/blogTailwindString";

export default function BlogDetails() {
  const { slug } = useParams();
  const history = useHistory();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Instantly inject the CSS string without any network requests or SCSS compiler bugs
  useEffect(() => {
    let style = document.getElementById('blog-tailwind-style-inline');
    if (!style) {
      style = document.createElement('style');
      style.id = 'blog-tailwind-style-inline';
      style.innerHTML = blogTailwindCss;
      document.head.appendChild(style);
    }
    return () => {
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const rawBlog = await getBlogBySlug(slug);
        //console.log("🔥 Raw blog data from backend:", rawBlog);
        if (!rawBlog) {
          history.push("/blog");
        } else {
          setPost(mapApiBlogToComponentFormat(rawBlog));
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        history.push("/blog");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug, history]);

  if (loading) {
    return (
      <div className="blog-page-root min-h-screen pt-[0px] mt-[0px] md:mt-[-40px] pb-[80px]" style={{ fontFamily: '"Inter", sans-serif', backgroundColor: '#FAFAFA' }}>
        <div className="max-w-[1100px] mx-auto px-6 box-border animate-pulse pt-20 md:pt-32">
          <div className="flex flex-col items-center mb-[60px]">
             <div className="bg-gray-200 h-4 w-24 mb-5 rounded"></div>
             <div className="bg-gray-200 h-[40px] md:h-[60px] w-3/4 max-w-[800px] mb-4 rounded"></div>
             <div className="bg-gray-200 h-[40px] md:h-[60px] w-1/2 max-w-[600px] mb-8 rounded"></div>
             <div className="flex items-center gap-4 mb-10">
               <div className="bg-gray-200 h-4 w-24 rounded"></div>
               <div className="bg-gray-200 h-4 w-24 rounded"></div>
             </div>
          </div>
          
          <div className="w-full aspect-video md:aspect-[16/9] bg-gray-200 rounded-[24px] mb-[60px]"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-[60px]">
             <div>
                <div className="bg-gray-200 h-5 w-full mb-4 rounded"></div>
                <div className="bg-gray-200 h-5 w-full mb-4 rounded"></div>
                <div className="bg-gray-200 h-5 w-3/4 mb-10 rounded"></div>
                
                <div className="bg-gray-200 h-8 w-1/2 mb-6 rounded mt-10"></div>
                <div className="bg-gray-200 h-4 w-full mb-3 rounded"></div>
                <div className="bg-gray-200 h-4 w-full mb-3 rounded"></div>
                <div className="bg-gray-200 h-4 w-5/6 mb-8 rounded"></div>

                <div className="bg-gray-200 h-8 w-1/3 mb-6 rounded mt-10"></div>
                <div className="bg-gray-200 h-4 w-full mb-3 rounded"></div>
                <div className="bg-gray-200 h-4 w-3/4 mb-3 rounded"></div>
             </div>
             <div className="hidden lg:block">
                <div className="bg-white rounded-[16px] p-[30px] border border-gray-100 shadow-sm h-64 w-full mb-8">
                  <div className="bg-gray-200 h-5 w-24 mb-6 rounded"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-gray-200 h-8 w-20 rounded-full"></div>
                    <div className="bg-gray-200 h-8 w-24 rounded-full"></div>
                    <div className="bg-gray-200 h-8 w-16 rounded-full"></div>
                    <div className="bg-gray-200 h-8 w-28 rounded-full"></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const variant = post.layoutId || ((String(post.id).charCodeAt(0) % 3) + 1);

  let LayoutComponent;
  switch (variant) {
    case 1:
      LayoutComponent = Layout1ModernMinimalist;
      break;
    case 2:
      LayoutComponent = Layout2EditorialMagazine;
      break;
    case 3:
    default:
      LayoutComponent = Layout3ImmersiveDark;
      break;
  }

  //console.log("Currently rendering Blog Layout Variant:", variant);

  return (
    <div className="blog-page-root relative">
      <div className="blog-back-btn-wrapper">
         <button 
           onClick={() => history.push('/blog')} 
           className="blog-back-btn"
         >
            <ArrowLeft size={18} className="blog-back-icon" />
            <span className="blog-back-text">Back</span>
         </button>
      </div>

      <LayoutComponent post={post} />
      <style>{`
        .blog-back-btn-wrapper {
          position: fixed;
          top: 100px;
          left: 40px;
          z-index: 9999;
          display: flex;
        }
        @media (max-width: 1023px) {
          .blog-back-btn-wrapper {
            display: none !important;
          }
        }
        @media (min-width: 1440px) {
          .blog-back-btn-wrapper {
            left: 80px;
          }
        }
        .blog-back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          height: 48px;
          border-radius: 24px;
          background-color: var(--blog-bg, #ffffff);
          color: #00A4C4 !important;
          border: 1px solid var(--blog-border-color, #e5e7eb);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          backdrop-filter: blur(8px);
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .blog-back-text {
          color: #00A4C4 !important;
          transition: color 0.3s ease;
        }
        .blog-back-btn:hover {
          background-color: var(--color-brand, #00A4C4);
          color: #ffffff !important;
          border-color: var(--color-brand, #00A4C4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 164, 196, 0.3);
        }
        .blog-back-btn:hover .blog-back-text,
        .blog-back-btn:hover .blog-back-icon {
          color: #ffffff !important;
        }
        .blog-back-icon {
          transition: transform 0.3s ease, color 0.3s ease;
        }
        .blog-back-btn:hover .blog-back-icon {
          transform: translateX(-4px);
        }

        .blog-page-root {
          overflow-x: clip;
          --color-brand: #00A4C4;
          --color-brand-dark: #001F3F;
          --blog-title-color: #001F3F;
          --blog-desc-color: #4b5563;
          --blog-bg: #ffffff;
          --blog-card-bg: #ffffff;
          --blog-border-color: #e5e7eb;
          --blog-body-color: #6b7280;
          --blog-muted-color: #9ca3af;
        }
        .blog-page-root *, .blog-page-root ::before, .blog-page-root ::after {
          box-sizing: border-box;
        }
        
        .blog-back-btn {
          background-color: var(--blog-bg);
          color: var(--blog-title-color);
          border: 1px solid var(--blog-border-color);
        }
        .blog-back-btn:hover {
          background-color: var(--color-brand);
          color: #ffffff;
          border-color: var(--color-brand);
        }

        html.dark .blog-page-root,
        body.dark .blog-page-root,
        [data-theme="dark"] .blog-page-root,
        .dark-mode .blog-page-root {
          --blog-title-color: #ffffff;
          --blog-desc-color: #d1d5db;
          --blog-bg: #111111;
          --blog-card-bg: #1a1a1a;
          --blog-border-color: #333333;
          --blog-body-color: #a0a0a0;
          --blog-muted-color: #666666;
        }
        .blog-page-root img {
          max-width: 100%;
        }

        .blog-inline-image {
          width: 100%;
          height: auto;
          border-radius: 20px;
          margin: 40px 0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          object-fit: cover;
          max-height: 600px;
        }

        .blog-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin: 50px 0;
        }

        .blog-gallery-grid .blog-inline-image {
          margin: 0 !important;
          height: 300px;
          width: 100%;
        }

        @media (max-width: 640px) {
          .blog-gallery-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .blog-gallery-grid .blog-inline-image {
            height: 240px;
          }
        }
      `}</style>
    </div>
  );
}

