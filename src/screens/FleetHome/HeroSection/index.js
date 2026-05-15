import React, { useRef, useState, useEffect } from "react";
import HeroSectionAnimation from "./HeroSectionAnimation";
import { getHomepageHero } from "../../../utils/api";
import styles from "./HeroSection.module.sass";

// Helper function to format image URLs (from Azure blob storage or full URLs)
const formatImageUrl = (url) => {
  if (!url) return null;
  
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Azure blob storage path (e.g., "leads/3/listings/6/cover-photo/image.jpg")
  if (url.startsWith("leads/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  
  // Relative path - prepend base URL if needed
  if (url.startsWith("/")) {
    return url;
  }
  
  return url;
};

const HeroSection = () => {
  const containerRef = useRef(null);
  const [heroData, setHeroData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getHomepageHero();
        
        // Map API fields and sort by sortOrder
        const mappedData = (Array.isArray(data) ? data : [])
          .map((item) => ({
            title: item.title || "",
            description: item.description || "",
            buttonText: item.buttonText || "",
            buttonLink: item.buttonLink || "",
            image: formatImageUrl(item.image) || "",
            sortOrder: item.sortOrder !== undefined ? item.sortOrder : 999,
          }))
          .filter((item) => item.title && item.image) // Only include items with required fields
          .sort((a, b) => a.sortOrder - b.sortOrder); // Sort by sortOrder
        
        setHeroData(mappedData);
        setHeroReady(false);
      } catch (err) {
        console.error("Error loading hero data:", err);
        setError(err.message || "Failed to load hero content");
      } finally {
        setLoading(false);
      }
    };

    loadHeroData();
  }, []);

  if (loading) {
    return (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.loadingOverlay} />
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading hero content: {error}</p>
        </div>
      </div>
    );
  }

  if (!heroData || heroData.length === 0) {
    return (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.emptyContainer}>
          <p>No hero content available</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.heroStage}>
        <HeroSectionAnimation
          containerRef={containerRef}
          destinations={heroData}
          onReady={() => setHeroReady(true)}
        />
      </div>
      <div
        className={`${styles.loadingOverlay} ${
          heroReady ? styles.loadingOverlayHidden : ""
        }`}
      />
    </div>
  );
};

export default HeroSection;

