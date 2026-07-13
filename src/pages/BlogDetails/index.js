import React, { useEffect, useState } from "react";
// Force HMR re-render
import { useParams, useHistory } from "react-router-dom";
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
        console.log("🔥 Raw blog data from backend:", rawBlog);
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
      <div className="blog-page-root min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand)]"></div>
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

  console.log("Currently rendering Blog Layout Variant:", variant);

  return (
    <div className="blog-page-root">
      <LayoutComponent post={post} />
      <style>{`
        .blog-page-root {
          overflow-x: clip;
          --color-brand: #00A4C4;
          --color-brand-dark: #001F3F;
          --blog-title-color: #001F3F;
          --blog-desc-color: #4b5563;
          --blog-bg: #ffffff;
          --blog-card-bg: #ffffff;
          --blog-border-color: #f0f0f0;
          --blog-body-color: #6b7280;
          --blog-muted-color: #9ca3af;
        }
        .blog-page-root *, .blog-page-root ::before, .blog-page-root ::after {
          box-sizing: border-box;
        }
        html.dark .blog-page-root,
        body.dark .blog-page-root,
        [data-theme="dark"] .blog-page-root,
        .dark-mode .blog-page-root {
          --blog-title-color: #ffffff;
          --blog-desc-color: #d1d5db;
          --blog-bg: #0a0a0a;
          --blog-card-bg: #1a1a1a;
          --blog-border-color: #2a2a2a;
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

