import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, ExternalLink, Instagram, Facebook, Youtube } from "lucide-react";
import { getPublicReelMedia } from "../../utils/api";

/**
 * Helper to extract Instagram reel/post ID from various URL formats or raw ID.
 */
export const extractInstagramReelId = (urlOrId) => {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  const match =
    str.match(/(?:instagram\.com\/(?:[^/?#]+\/)?(?:reel|reels|p)\/|reel\/)([A-Za-z0-9_-]+)/i) ||
    str.match(/(?:instagram\.com\/(?:reel|reels|p)\/)([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[A-Za-z0-9_-]+$/.test(str) && !str.startsWith("http")) {
    return str;
  }
  return null;
};

const socialPlatforms = {
  instagram: { name: "Instagram", icon: Instagram },
  facebook: { name: "Facebook", icon: Facebook },
  youtube: { name: "YouTube", icon: Youtube },
};

function normalizeReelLink(item) {
  const value = (typeof item === "string" ? item : item?.url || item?.link || item?.href);
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  const type = typeof item?.type === "string" ? item.type.trim().toLowerCase() : "";
  const isKnownType = Object.prototype.hasOwnProperty.call(socialPlatforms, type);
  const rawReelId = (!type || type === "instagram") && /^[A-Za-z0-9_-]+$/.test(url)
    ? extractInstagramReelId(url)
    : null;

  if (rawReelId) {
    const href = `https://www.instagram.com/reel/${rawReelId}/`;
    return { href, embedUrl: `${href}embed/`, reelId: rawReelId, platform: "instagram" };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const host = parsed.hostname.toLowerCase();
  const isInstagram = host === "instagram.com" || host.endsWith(".instagram.com");
  const isFacebook = host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch";
  const isYouTube = host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
  const platform = isKnownType ? type : isInstagram ? "instagram" : isFacebook ? "facebook" : isYouTube ? "youtube" : "";
  const post = isInstagram && platform === "instagram"
    ? parsed.pathname.match(/^\/(?:[^/]+\/)?(reel|reels|p)\/([A-Za-z0-9_-]+)\/?$/i)
    : null;
  const reelId = post?.[2];
  const postPath = post?.[1].toLowerCase() === "p" ? "p" : "reel";
  const embedUrl = reelId ? `https://www.instagram.com/${postPath}/${reelId}/embed/` : null;

  return { href: parsed.href, embedUrl, reelId, platform };
}

function ReelCard({ item, isDark = false, accentColor = "#0097B2" }) {
  const { href, embedUrl, reelId, platform } = item;
  const social = socialPlatforms[platform];
  const PlatformIcon = social?.icon || ExternalLink;
  const label = social ? `${reelId ? "Watch" : "Open"} on ${social.name}` : "Open link";
  const [videoUrl, setVideoUrl] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(reelId));
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch the media URL when the preview/component mounts (media URLs can be temporary)
  useEffect(() => {
    if (!reelId) return;
    let isCancelled = false;

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
        const resolvedPosterUrl =
          res?.posterUrl ||
          res?.poster_url ||
          res?.thumbnailUrl ||
          res?.thumbnail_url ||
          null;

        if (resolvedVideoUrl) {
          setVideoUrl(resolvedVideoUrl);
          if (resolvedPosterUrl) setPosterUrl(resolvedPosterUrl);
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

  return (
    <a
      ref={containerRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="experience-reel-card"
      style={{
        position: "relative",
        flex: "0 0 260px",
        width: 260,
        height: 460,
        borderRadius: 24,
        overflow: "hidden",
        background: reelId
          ? (isDark ? "#111827" : "#0f172a")
          : (isDark ? "#1e293b" : "#eaf4f7"),
        textDecoration: "none",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: isDark
          ? "0 10px 30px rgba(0,0,0,0.5)"
          : "0 10px 30px rgba(0,0,0,0.12)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {!reelId && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: isDark ? "#f8fafc" : "#0f172a",
            fontWeight: 600,
          }}
        >
          <PlatformIcon size={40} aria-hidden="true" />
          {label}
        </span>
      )}
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
          poster={posterUrl || undefined}
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
            src={embedUrl}
            title={`Instagram preview ${reelId}`}
            tabIndex={-1}
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

      {reelId && <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />}

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
      {reelId && <div
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
          {label}
        </span>
      </div>}
    </a>
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
    const uniqueItems = new Map();
    for (const entry of list) {
      const item = normalizeReelLink(entry);
      if (!item) continue;
      const key = item.reelId || item.href;
      if (!uniqueItems.has(key)) uniqueItems.set(key, item);
    }
    return Array.from(uniqueItems.values());
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
          {items.map((item) => (
            <ReelCard
              key={item.reelId || item.href}
              item={item}
              isDark={isDark}
              accentColor={A}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
