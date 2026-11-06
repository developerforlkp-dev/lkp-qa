import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, ExternalLink, AlertCircle } from "lucide-react";
import { getPublicReelMedia } from "../../utils/api";

/**
 * Helper to extract Instagram reel/post ID from various URL formats or raw ID.
 */
export const extractInstagramReelId = (urlOrId) => {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  const match = str.match(/(?:instagram\.com\/(?:reel|reels|p)\/|reel\/)([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[A-Za-z0-9_-]+$/.test(str) && !str.startsWith("http")) {
    return str;
  }
  return null;
};

/**
 * Individual Reel Video Card with IntersectionObserver auto-play / pause,
 * fallback to Instagram embed, and click-through to original reel.
 */
function ReelCard({ reelUrl, isDark = false, accentColor = "#0097B2" }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const reelId = extractInstagramReelId(reelUrl);
  const originalReelHref = reelId
    ? `https://www.instagram.com/reel/${reelId}/`
    : (String(reelUrl).startsWith("http") ? reelUrl : `https://www.instagram.com/reel/${reelUrl}/`);

  // Fetch the media URL when the preview/component mounts (media URLs can be temporary)
  useEffect(() => {
    let isCancelled = false;
    if (!reelId) {
      setHasError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasError(false);

    getPublicReelMedia(reelId)
      .then((res) => {
        if (isCancelled) return;
        const resolvedVideoUrl =
          res?.videoUrl ||
          res?.video_url ||
          res?.url ||
          (typeof res === "string" && res.startsWith("http") ? res : null);

        if (resolvedVideoUrl) {
          setVideoUrl(resolvedVideoUrl);
          setHasError(false);
        } else {
          setHasError(true);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn(`[ExperienceReelsCarousel] Failed to fetch reel media for ${reelId}:`, err);
        setHasError(true);
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [reelId]);

  // Autoplay when visible, pause when scrolled out of view
  useEffect(() => {
    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl || hasError || !videoUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            videoEl.play().catch(() => {
              // Browser autoplay policy might require user interaction, safe to swallow
            });
          } else {
            videoEl.pause();
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
      }
    );

    observer.observe(containerEl);

    return () => {
      observer.disconnect();
    };
  }, [videoUrl, hasError]);

  const handleCardClick = () => {
    if (originalReelHref) {
      window.open(originalReelHref, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="experience-reel-card"
      style={{
        position: "relative",
        flex: "0 0 260px",
        width: 260,
        height: 460,
        borderRadius: 24,
        overflow: "hidden",
        background: isDark ? "#111827" : "#0f172a",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: isDark
          ? "0 10px 30px rgba(0,0,0,0.5)"
          : "0 10px 30px rgba(0,0,0,0.12)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: isDark ? "#1E293B" : "#1e293b",
            color: "#94a3b8",
            gap: 12,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `3px solid rgba(255,255,255,0.2)`,
              borderTopColor: accentColor,
              animation: "spin 1s linear infinite",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 500 }}>Loading Reel...</span>
        </div>
      )}

      {/* Main HTML5 Video */}
      {!loading && !hasError && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Fallback Instagram Embed */}
      {!loading && (hasError || !videoUrl) && reelId && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: isDark ? "#0f172a" : "#1e293b",
          }}
        >
          <iframe
            src={`https://www.instagram.com/reel/${reelId}/embed/`}
            title={`Instagram Reel ${reelId}`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              pointerEvents: "none",
            }}
            scrolling="no"
            allowTransparency="true"
          />
        </div>
      )}

      {/* Overlays: Instagram badge & gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* Top right external link hint */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: "50%",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          zIndex: 4,
          transition: "background 0.2s ease",
        }}
      >
        <ExternalLink size={16} />
      </div>

      {/* Bottom info pill */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#fff",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Play size={14} fill="#fff" />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Watch on Instagram
        </span>
      </div>
    </div>
  );
}

/**
 * ExperienceReelsCarousel Component
 * Placed just above the "More Experiences You May Like" section.
 * Renders only when valid reelUrls are provided.
 */
export default function ExperienceReelsCarousel({
  reelUrls = [],
  title = "Experience Reels",
  subtitle = "Watch real moments & highlights from this experience",
  theme = "light",
  tokens = {},
}) {
  const scrollRailRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Normalize reelUrls into an array of strings
  const items = React.useMemo(() => {
    let list = [];
    if (Array.isArray(reelUrls)) {
      list = reelUrls;
    } else if (typeof reelUrls === "string" && reelUrls.trim()) {
      try {
        const parsed = JSON.parse(reelUrls);
        if (Array.isArray(parsed)) list = parsed;
        else list = [reelUrls];
      } catch (_) {
        list = reelUrls.split(",").map((s) => s.trim());
      }
    }
    return list
      .map((item) => (typeof item === "string" ? item.trim() : item?.url || String(item)))
      .filter((url) => Boolean(url && url.length > 0));
  }, [reelUrls]);

  const isDark = theme === "dark";
  const FG = tokens?.FG || (isDark ? "#ffffff" : "#171717");
  const BG = tokens?.BG || (isDark ? "#0A1118" : "#F8FAFC");
  const M = tokens?.M || (isDark ? "#94a3b8" : "#64748b");
  const A = tokens?.A || "#0097B2";
  const B = tokens?.B || (isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0");
  const W = tokens?.W || (isDark ? "#111827" : "#ffffff");

  const checkScrollability = () => {
    const el = scrollRailRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [items]);

  const handleScroll = (direction) => {
    const el = scrollRailRef.current;
    if (!el) return;
    const amount = direction === "left" ? -300 : 300;
    el.scrollBy({ left: amount, behavior: "smooth" });
    setTimeout(checkScrollability, 300);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      className="experience-reels-section"
      style={{
        padding: "48px 0 32px",
        background: theme === "dark" ? BG : W,
        position: "relative",
      }}
    >
      <div
        style={{
          width: "calc(100% - 80px)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
        className="experience-reels-inner"
      >
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .experience-reels-rail {
            display: flex;
            gap: 20px;
            overflow-x: auto;
            scroll-behavior: smooth;
            padding-bottom: 12px;
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .experience-reels-rail::-webkit-scrollbar {
            display: none;
          }
          .experience-reel-card:hover {
            transform: translateY(-4px);
          }
          .experience-reels-eyebrow {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            display: block;
            margin-bottom: 12px;
            font-family: "Inter", sans-serif;
          }
          .experience-reels-title {
            font-size: clamp(2.5rem, 4vw, 3.5rem);
            font-weight: 700;
            line-height: 1.1;
            font-family: "Cormorant Garamond", "Playfair Display", serif;
            letter-spacing: -0.02em;
            margin: 0;
          }
          .experience-reels-subtitle {
            font-size: 16px;
            line-height: 1.6;
            margin: 12px 0 0 0;
            font-weight: 400;
            font-family: "Inter", sans-serif;
            max-width: 600px;
          }
          @media (max-width: 768px) {
            .experience-reels-inner {
              width: 100% !important;
              padding: 0 20px !important;
            }
            .experience-reels-header {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 16px !important;
            }
            .experience-reels-eyebrow {
              font-size: 11px !important;
              margin-bottom: 8px !important;
            }
            .experience-reels-title {
              font-size: clamp(1.6rem, 7vw, 2.2rem) !important;
            }
            .experience-reels-subtitle {
              font-size: 14px !important;
              line-height: 1.5 !important;
              margin-top: 8px !important;
            }
          }
        `}</style>

        {/* Section Header */}
        <div
          className="experience-reels-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 28,
          }}
        >
          <div>
            <span className="experience-reels-eyebrow" style={{ color: A }}>
              Visual Highlights
            </span>
            <h3 className="experience-reels-title" style={{ color: FG }}>
              {title}
            </h3>
            {subtitle && (
              <p className="experience-reels-subtitle" style={{ color: M }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Arrows */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: `1px solid ${B}`,
                background: isDark ? "#1E293B" : "#F8FAFC",
                color: FG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canScrollLeft ? "pointer" : "not-allowed",
                opacity: canScrollLeft ? 1 : 0.4,
                transition: "all 0.2s ease",
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: `1px solid ${B}`,
                background: isDark ? "#1E293B" : "#F8FAFC",
                color: FG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canScrollRight ? "pointer" : "not-allowed",
                opacity: canScrollRight ? 1 : 0.4,
                transition: "all 0.2s ease",
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Rail */}
        <div
          ref={scrollRailRef}
          onScroll={checkScrollability}
          className="experience-reels-rail"
        >
          {items.map((url, index) => (
            <ReelCard
              key={`${url}-${index}`}
              reelUrl={url}
              isDark={isDark}
              accentColor={A}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
