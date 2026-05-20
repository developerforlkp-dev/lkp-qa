import React, { useRef, useState, useEffect, useCallback } from "react";
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

// Module-level cache for hero banner data to prevent redundant API fetches and flickers on tab switches
let cachedHeroData = null;

const HeroSection = () => {
  const containerRef = useRef(null);
  const [heroData, setHeroData] = useState(cachedHeroData || []);
  const [loading, setLoading] = useState(!cachedHeroData);
  const [heroReady, setHeroReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        if (!cachedHeroData) {
          setLoading(true);
        }
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

        cachedHeroData = mappedData;
        setHeroData(mappedData);
      } catch (err) {
        console.error("Error loading hero data:", err);
        if (!cachedHeroData) {
          setError(err.message || "Failed to load hero content");
        }
      } finally {
        setLoading(false);
      }
    };

    loadHeroData();
  }, []);

  // Preload ONLY the critical first banner asset for high priority browser fetching
  useEffect(() => {
    if (heroData && heroData.length > 0 && heroData[0].image) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = heroData[0].image;
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [heroData]);

  // Stabilize the onReady callback to prevent child component re-evaluation
  const handleReady = useCallback(() => {
    setHeroReady(true);
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
          onReady={handleReady}
        />
      </div>
      <div
        className={`${styles.loadingOverlay} ${heroReady ? styles.loadingOverlayHidden : ""
          }`}
      />
    </div>
  );
};

export default HeroSection;

