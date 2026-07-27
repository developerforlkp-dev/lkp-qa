import React, { useState } from "react";
import { Sun, Camera, Utensils, Map, Moon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../components/JUI/Theme";
import FullScreenImage from "../../components/FullScreenImage";

const getIcon = (title = "", time = "") => {
  const t = (title + " " + time).toLowerCase();
  if (t.includes("lunch") || t.includes("dinner") || t.includes("food") || t.includes("eat") || t.includes("meal") || t.includes("breakfast")) return <Utensils size={18} />;
  if (t.includes("boat") || t.includes("ride") || t.includes("tour") || t.includes("photo") || t.includes("cruise")) return <Camera size={18} />;
  if (t.includes("explore") || t.includes("gem") || t.includes("visit") || t.includes("walk")) return <Map size={18} />;
  if (t.includes("evening") || t.includes("night") || t.includes("relax")) return <Moon size={18} />;
  if (t.includes("welcome") || t.includes("morning") || t.includes("arrival") || t.includes("am")) return <Sun size={18} />;
  return <Clock size={18} />;
};

const formatImageUrlGlobal = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const [pathPart, queryPart] = url.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/").replace(/\\/g, "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const getItineraryImageUrl = (activity) => {
  if (activity?.image) return formatImageUrlGlobal(activity.image);
  const firstImage = Array.isArray(activity?.images) ? activity.images[0] : null;
  if (!firstImage) return null;
  const rawUrl = typeof firstImage === "string" ? firstImage : firstImage.url || firstImage.fileUrl || firstImage.imageUrl;
  if (!rawUrl) return null;
  return formatImageUrlGlobal(rawUrl);
};

const getItineraryImages = (activity) => {
  const imgs = Array.isArray(activity?.images) ? activity.images : [];
  const urls = Array.isArray(activity?.imageUrls) ? activity.imageUrls : [];
  let rawUrls = [];
  if (imgs.length > 0) {
    rawUrls = imgs.map(img => typeof img === "string" ? img : (img.url || img.fileUrl || img.imageUrl));
  } else if (urls.length > 0) {
    rawUrls = urls.map(url => typeof url === "string" ? url : (url.url || url.fileUrl || url.imageUrl));
  }
  if (rawUrls.length === 0) {
    const single = getItineraryImageUrl(activity);
    return single ? [single] : [];
  }
  return rawUrls.map(u => formatImageUrlGlobal(u)).filter(Boolean);
};

const StayItinerary = ({ itinerary }) => {
  const { tokens } = useTheme();
  
  const [photoVisible, setPhotoVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!itinerary || !itinerary.length) return null;

  return (
    <section style={{ padding: "80px 24px", background: tokens.W, overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: 64, textAlign: "left" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: tokens.A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 16, fontFamily: '"Inter", sans-serif' }}>
            Your Journey
          </span>
          <h2 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: tokens.FG, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', margin: "0 0 16px 0", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Itinerary Highlights
          </h2>
          <p style={{ fontSize: 16, color: tokens.M, fontFamily: '"Inter", sans-serif', maxWidth: 400, margin: 0, lineHeight: 1.6 }}>
            A thoughtfully planned experience to make the most of your stay.
          </p>
        </div>

        {/* Timeline Items */}
        <div style={{ position: "relative" }} className="itinerary-timeline-container">
          {itinerary.map((item, index) => {
            const isEven = index % 2 === 0;
            const isLast = index === itinerary.length - 1;
            const imgUrl = getItineraryImageUrl(item);
            const imgs = getItineraryImages(item);

            return (
              <div key={index} className="stay-itinerary-item" style={{ display: "flex", alignItems: "center", marginBottom: isLast ? 0 : 80, position: "relative", flexDirection: isEven ? "row" : "row-reverse" }}>
                
                {/* SVG Curve to next item (Desktop only) */}
                {!isLast && (
                  <svg className="stay-itinerary-svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", top: 24, left: 0, width: "100%", height: "calc(100% + 80px)", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
                    <path
                      d={isEven ? "M 55.33 0 C 55.33 50, 44.67 50, 44.67 100" : "M 44.67 0 C 44.67 50, 55.33 50, 55.33 100"}
                      fill="none"
                      stroke={tokens.A}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      vectorEffect="non-scaling-stroke"
                      opacity={0.6}
                    />
                  </svg>
                )}

                {/* Image Column */}
                <div className="stay-itinerary-image-col" style={{ flex: 1, display: "flex", justifyContent: isEven ? "flex-end" : "flex-start", padding: isEven ? "0 40px 0 0" : "0 0 0 40px", zIndex: 1 }}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ width: "100%", maxWidth: 400, height: 240, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
                    <div 
                      className="itinerary-image-wrapper"
                      style={{ width: "100%", height: "100%", position: "relative", cursor: imgs.length > 0 ? "pointer" : "default" }}
                      onClick={() => {
                        if (imgs.length > 0) {
                          setSelectedImages(imgs);
                          setPhotoIndex(0);
                          setPhotoVisible(true);
                        }
                      }}
                    >
                      <img className="itinerary-img" src={imgUrl || "https://via.placeholder.com/400x300?text=Experience"} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} />
                      
                      {imgs.length > 0 && (
                        <div className="gallery-pill" style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: 12, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)", opacity: 0, transition: "opacity 0.3s ease, transform 0.3s ease", transform: "translateY(10px)" }}>
                          <Camera size={14} /> VIEW ALL ({imgs.length})
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Text Column */}
                <div className="stay-itinerary-text-col" style={{ flex: 1, padding: isEven ? "0 0 0 40px" : "0 40px 0 0", display: "flex", flexDirection: "column", alignItems: isEven ? "flex-start" : "flex-end", textAlign: isEven ? "left" : "right", zIndex: 1 }}>
                  <motion.div initial={{ opacity: 0, x: isEven ? 20 : -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: isEven ? "flex-start" : "flex-end" }}>
                    
                    {/* Icon & Time */}
                    <div className="stay-itinerary-icon-row" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexDirection: isEven ? "row" : "row-reverse" }}>
                      <div className="stay-itinerary-icon-circle" style={{ width: 48, height: 48, borderRadius: "50%", background: `${tokens.A}15`, display: "flex", alignItems: "center", justifyContent: "center", color: tokens.A }}>
                        {getIcon(item.title, item.time)}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: tokens.A, fontFamily: '"Inter", sans-serif' }}>{item.time}</span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="stay-itinerary-title" style={{ fontSize: 24, fontWeight: 700, color: tokens.FG, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', margin: "0 0 12px 0", lineHeight: 1.2 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 15, color: tokens.M, fontFamily: '"Inter", sans-serif', lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
                      {item.description}
                    </p>
                  </motion.div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {photoVisible && (
          <FullScreenImage
            src={selectedImages[photoIndex] || "https://via.placeholder.com/800x600?text=Image"}
            items={selectedImages.length > 0 ? selectedImages : ["https://via.placeholder.com/800x600?text=Image"]}
            currentIndex={photoIndex}
            onNavigate={setPhotoIndex}
            onClose={() => setPhotoVisible(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .itinerary-image-wrapper:hover .itinerary-img {
          transform: scale(1.05) !important;
        }
        .itinerary-image-wrapper:hover .gallery-pill {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        @media (max-width: 768px) {
          .stay-itinerary-item { 
            flex-direction: column-reverse !important; 
            margin-bottom: 40px !important; 
            padding-left: 32px !important;
            border-left: 2px dashed ${tokens.A}66;
            align-items: flex-start !important;
          }
          .stay-itinerary-item:last-child {
            border-left-color: transparent;
          }
          .stay-itinerary-image-col { 
            padding: 0 !important; 
            margin-top: 20px; 
            margin-bottom: 12px;
            justify-content: flex-start !important; 
            width: 100%;
          }
          .stay-itinerary-text-col { 
            padding: 0 !important; 
            align-items: flex-start !important; 
            text-align: left !important; 
            width: 100%;
          }
          .stay-itinerary-text-col > div {
            align-items: flex-start !important;
          }
          .stay-itinerary-icon-row { 
            flex-direction: row !important; 
            position: absolute;
            left: -25px;
            top: -4px;
            margin-bottom: 0 !important;
          }
          .stay-itinerary-icon-circle {
            background: ${tokens.W} !important;
            border: 2px solid ${tokens.A};
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .stay-itinerary-title {
            margin-top: 44px !important;
          }
          .stay-itinerary-svg { 
            display: none; 
          }
          .stay-itinerary-image-col > div { 
            max-width: 100% !important;
            height: 220px !important; 
          }
        }
      `}</style>
    </section>
  );
};

export default StayItinerary;
