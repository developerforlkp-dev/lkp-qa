import React, { useEffect, useState } from "react";
import { Hero, Filters, BlogGrid as Grid } from "../../components/Blog/BlogComponents";
import { getBlogs } from "../../utils/api";
import { mapApiBlogToComponentFormat } from "../../utils/blogData";
import { blogTailwindCss } from "../../styles/blogTailwindString";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Posts");

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
    const fetchBlogs = async () => {
      try {
        const rawBlogs = await getBlogs();
        const mappedBlogs = rawBlogs.map(mapApiBlogToComponentFormat);
        setPosts(mappedBlogs);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Compute filtered posts
  const filteredPosts = posts.filter(post => {
    // 1. Category Filter
    const matchesCategory = selectedCategory === "All Posts" || post.category === selectedCategory;
    
    // 2. Search Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (post.title && post.title.toLowerCase().includes(query)) ||
      (post.description && post.description.toLowerCase().includes(query)) ||
      (post.category && post.category.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="blog-page-root">
      <main className="flex min-h-screen flex-col items-center pt-2">
        <Hero posts={posts} />
        <Filters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        {loading ? (
          <div className="py-20 flex justify-center w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand)]"></div>
          </div>
        ) : (
          <Grid posts={filteredPosts} />
        )}
      </main>
      <style>{`
        .blog-page-root {
          overflow-x: clip;
          --color-brand: #00A4C4;
          --color-brand-dark: #001F3F;
          --blog-title-color: #001F3F;
          --blog-desc-color: #4b5563;
          --blog-quote-color: #001F3F;
        }
        
        /* Global Dark Mode Triggers */
        html.dark .blog-page-root,
        body.dark .blog-page-root,
        [data-theme="dark"] .blog-page-root,
        .dark-mode .blog-page-root {
          --blog-title-color: #ffffff;
          --blog-desc-color: #d1d5db;
          --blog-quote-color: #ffffff;
        }

        .blog-page-root img {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
}

