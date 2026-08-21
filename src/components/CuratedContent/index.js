import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../JUI/Theme";
import FullScreenImage from "../FullScreenImage";
import { Sparkles, Camera } from "lucide-react";

const formatImageUrlGlobal = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const [pathPart, queryPart] = url.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/").replace(/\\/g, "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const ExpandableText = ({ text, tokens, bodyFontFamily }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const limit = 120;
  if (text.length <= limit) {
    return <p style={{ fontSize: 15, color: tokens.M, fontFamily: bodyFontFamily, lineHeight: 1.6, margin: 0, position: "relative", zIndex: 1 }}>{text}</p>;
  }

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <p style={{ fontSize: 15, color: tokens.M, fontFamily: bodyFontFamily, lineHeight: 1.6, margin: 0 }}>
        {expanded ? text : `${text.substring(0, limit)}...`}
      </p>
      <button 
        onClick={() => setExpanded(!expanded)} 
        style={{ background: "transparent", border: "none", color: tokens.A, padding: 0, marginTop: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: bodyFontFamily }}
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </div>
  );
};

const CuratedContent = ({ 
  curatedContent, 
  headlineFontFamily = '"Cormorant Garamond", "Playfair Display", serif',
  bodyFontFamily = '"Inter", sans-serif',
  padding = "100px 0",
  maxWidth = "1200px",
  width = "calc(100% - 80px)",
}) => {
  const { tokens } = useTheme();
  const [photoVisible, setPhotoVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [isExpanded, setIsExpanded] = useState(false);

  if (!curatedContent || curatedContent.length === 0) return null;

  const displayCount = isExpanded ? curatedContent.length : 6;
  const visibleContent = curatedContent.slice(0, displayCount);
  const hasMore = curatedContent.length > 6;

  return (
    <section className="curated-section" style={{ padding, background: tokens.BG, overflow: "hidden" }}>
      <div className="curated-main-wrapper" style={{ width, maxWidth, margin: "0 auto", position: "relative" }}>
        
        {/* Header Section */}
        <div className="curated-header-wrapper" style={{ marginBottom: 64, textAlign: "left" }}>
          <span className="curated-eyebrow" style={{ fontSize: "12px", fontWeight: 700, color: tokens.A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "16px", fontFamily: bodyFontFamily }}>
            Curated For You
          </span>
          <h2 className="curated-title" style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: tokens.FG, margin: 0, lineHeight: 1.1, fontFamily: headlineFontFamily, letterSpacing: "-0.02em" }}>
            The Essential Collection
          </h2>
          <p className="curated-desc" style={{ color: tokens.M, fontSize: "16px", lineHeight: "1.7", margin: "16px 0 0 0", fontFamily: bodyFontFamily, maxWidth: 600 }}>
            Exclusive moments and handpicked gems designed to elevate your journey.
          </p>
        </div>

        {/* Collage Layout Container */}
        <div className="curated-collage-container" style={{ display: "flex", flexDirection: "column", gap: 100 }}>
          {visibleContent.map((item, index) => {
            const isEven = index % 2 === 0;
            const isLast = index === visibleContent.length - 1;
            const imgUrl = item.imageUrl ? formatImageUrlGlobal(item.imageUrl) : "https://via.placeholder.com/800x600?text=Highlight";

            return (
              <div key={index} className="collage-row" style={{ display: "flex", flexDirection: isEven ? "row" : "row-reverse", alignItems: "center", position: "relative" }}>
                
                {/* SVG Curve to next item (Desktop only) */}
                {!isLast && (
                  <svg className="curated-svg" width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: "calc(100% + 100px)", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
                    <path
                      d={isEven ? "M 790 0 C 790 60, 210 40, 210 100" : "M 210 0 C 210 60, 790 40, 790 100"}
                      fill="none"
                      stroke={tokens.A}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      vectorEffect="non-scaling-stroke"
                      opacity={0.6}
                    />
                  </svg>
                )}

                {/* Background Glow */}
                <div style={{ position: "absolute", width: "40%", height: "80%", background: tokens.A, opacity: 0.1, filter: "blur(80px)", borderRadius: "50%", top: "10%", left: isEven ? "10%" : "auto", right: isEven ? "auto" : "10%", zIndex: 0, pointerEvents: "none" }} />

                {/* Large Image Block */}
                <div className="collage-image-col" style={{ flex: "0 0 65%", width: "65%", zIndex: 1, position: "relative" }}>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    whileInView={{ opacity: 1, scale: 1 }} 
                    viewport={{ once: true, margin: "-100px" }} 
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: "100%", paddingBottom: "60%", position: "relative", borderRadius: isEven ? "32px 80px 32px 32px" : "80px 32px 32px 32px", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.12)", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedImages([imgUrl]);
                      setPhotoIndex(0);
                      setPhotoVisible(true);
                    }}
                    className="collage-image-wrapper"
                  >
                    <img src={imgUrl} alt={item.text} className="collage-img" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)" }} />
                    
                    <div className="collage-pill" style={{ position: "absolute", top: 24, left: isEven ? 24 : "auto", right: isEven ? "auto" : 24, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", padding: "8px 14px", borderRadius: 100, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, opacity: 0, transition: "all 0.4s ease", transform: "translateY(-10px)", border: "1px solid rgba(255,255,255,0.4)" }}>
                      <Camera size={14} /> EXPAND
                    </div>
                  </motion.div>
                </div>

                {/* Floating Glassmorphic Text Block */}
                <div className="collage-text-col" style={{ flex: "0 0 42%", width: "42%", zIndex: 2, marginLeft: isEven ? "-7%" : 0, marginRight: isEven ? 0 : "-7%", marginTop: "10%" }}>
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, margin: "-100px" }} 
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ background: `rgba(255, 255, 255, 0.85)`, backdropFilter: "blur(20px)", padding: "36px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.5)", position: "relative", overflow: "hidden" }}
                    className="collage-text-card"
                  >
                    {/* Watermark Number */}
                    <div style={{ position: "absolute", top: -16, right: -8, fontSize: 110, fontWeight: 800, color: tokens.A, opacity: 0.05, fontFamily: headlineFontFamily, lineHeight: 1, pointerEvents: "none" }}>
                      {(index + 1).toString().padStart(2, '0')}
                    </div>

                    <h3 style={{ fontSize: "clamp(1.5rem, 2vw, 2rem)", fontWeight: 700, color: tokens.FG, fontFamily: headlineFontFamily, margin: "0 0 12px 0", lineHeight: 1.2, position: "relative", zIndex: 1 }}>
                      {item.text || "Highlight"}
                    </h3>
                    <div style={{ width: 32, height: 2, background: tokens.A, marginBottom: 16, position: "relative", zIndex: 1 }} />
                    <ExpandableText text={item.description || item.desc} tokens={tokens} bodyFontFamily={bodyFontFamily} />
                  </motion.div>
                </div>

              </div>
            );
          })}
        </div>

        {hasMore && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: "transparent",
                border: `2px solid ${tokens.A}`,
                color: tokens.A,
                padding: "14px 32px",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: bodyFontFamily,
                cursor: "pointer",
                transition: "all 0.3s ease",
                letterSpacing: "0.05em"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = tokens.A; e.currentTarget.style.color = "#fff"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tokens.A; }}
            >
              {isExpanded ? "Show Less" : `View All ${curatedContent.length} Highlights`}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {photoVisible && (
          <FullScreenImage
            src={selectedImages[photoIndex] || "https://via.placeholder.com/800x600?text=Image"}
            items={selectedImages}
            currentIndex={photoIndex}
            onNavigate={setPhotoIndex}
            onClose={() => setPhotoVisible(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        /* Dynamic Theme Overrides for the Glass Card based on dark mode */
        :root[data-theme='dark'] .collage-text-card {
          background: rgba(20, 20, 20, 0.7) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .collage-text-card {
          border-left: 4px solid transparent !important;
          box-shadow: 0 15px 40px ${tokens.A}35 !important;
          transition: border-left-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease !important;
        }
        
        .collage-text-card:hover {
          border-left-color: ${tokens.A} !important;
          box-shadow: 0 20px 50px ${tokens.A}65 !important;
        }

        .collage-image-wrapper:hover .collage-img {
          transform: scale(1.05) !important;
        }
        .collage-image-wrapper:hover .collage-pill {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        @media (max-width: 992px) {
          .curated-svg { display: none; }
          .curated-header-wrapper {
            margin-bottom: 24px !important;
          }
          .curated-eyebrow {
            font-size: 11px !important;
            margin-bottom: 10px !important;
          }
          .curated-title {
            font-size: clamp(1.6rem, 7vw, 2.2rem) !important;
            margin-bottom: 16px !important;
          }
          .curated-desc {
            font-size: 14px !important;
            margin-top: 0 !important;
            margin-bottom: 20px !important;
          }
          .curated-collage-container {
            gap: 80px !important;
          }
          .collage-row { 
            flex-direction: column !important; 
          }
          .collage-image-col { 
            width: 100% !important; 
            flex: 0 0 100% !important;
          }
          .collage-image-wrapper {
            border-radius: 32px !important;
            padding-bottom: 75% !important;
          }
          .collage-text-col { 
            width: 92% !important; 
            flex: 0 0 100% !important;
            margin: -60px auto 0 auto !important; 
          }
          .collage-text-card {
            padding: 32px !important;
            border-radius: 24px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default CuratedContent;
