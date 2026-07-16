import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft } from "lucide-react";
import { useTheme } from "../JUI/Theme";
import { lockBodyScroll } from "../../utils/scrollLock";

const FullScreenImage = ({ src, items = [], currentIndex = 0, onNavigate, onClose }) => {
  const { theme, tokens: { BG, A } } = useTheme();
  const isDark = theme === "dark" || (typeof BG === 'string' && BG.toLowerCase().includes('000'));

  const textMain = isDark ? '#FFF' : '#141414';
  const pillBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)';
  const pillText = A || '#0097B2';

  const btnBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)';
  const btnHoverBg = isDark ? 'rgba(255,255,255,0.2)' : '#FFFFFF';

  const hasNavigation = Array.isArray(items) && items.length > 1 && typeof onNavigate === "function";

  const thumbContainerRef = useRef(null);
  const activeThumbRef = useRef(null);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [showAllThumbs, setShowAllThumbs] = useState(false);

  useEffect(() => {
    return lockBodyScroll();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getVisibleThumbCount = () => {
    if (windowWidth >= 1440) return 8;
    if (windowWidth >= 1280) return 6;
    if (windowWidth >= 1024) return 5;
    return items.length; // Mobile/Tablet
  };

  const isDesktop = windowWidth >= 1024;
  const maxVisible = getVisibleThumbCount();

  useEffect(() => {
    if (isDesktop && !showAllThumbs && currentIndex >= maxVisible - 1) {
      setShowAllThumbs(true);
    }
  }, [currentIndex, isDesktop, showAllThumbs, maxVisible]);

  useEffect(() => {
    // Only auto-scroll in mobile/legacy mode where showAllThumbs is effectively true
    if (!isDesktop || showAllThumbs) {
      if (activeThumbRef.current && thumbContainerRef.current) {
        activeThumbRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex, isDesktop, showAllThumbs]);

  const visibleItems = isDesktop && !showAllThumbs && items.length > maxVisible 
    ? items.slice(0, maxVisible) 
    : items;
  
  const remainingCount = items.length - maxVisible;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 40px)',
      }}
      onClick={onClose}
    >
      <style>{`
        .fs-modal-box {
          width: 100%;
          max-width: 1100px;
          height: 85vh;
          background: ${isDark ? '#0A0A0A' : '#FFFFFF'};
          border: 1px solid ${isDark ? '#333' : '#E0E0E0'};
          border-radius: 32px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          transform: translateZ(0);
          -webkit-mask-image: -webkit-radial-gradient(white, black);
        }
        
        .fs-left-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          background: ${isDark ? '#141414' : '#FFFFFF'};
        }
        
        .fs-right-pane {
          width: 100%;
          height: 140px;
          display: flex;
          flex-direction: row;
          border-top: 1px solid ${isDark ? '#333' : '#F0F0F0'};
          background: ${isDark ? '#0A0A0A' : '#FAFAFA'};
          align-items: center;
          padding: 0 24px;
        }
        
        .fs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
        }
        
        .fs-image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .fs-image-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(30px) brightness(${isDark ? '0.3' : '0.8'});
          transform: scale(1.1);
          z-index: 0;
        }
        
        .fs-image {
          object-fit: contain !important;
          width: 100% !important;
          height: 100% !important;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
          position: absolute;
          top: 0;
          left: 0;
          padding: 24px;
          box-sizing: border-box;
          border-radius: 40px;
          z-index: 1;
        }
        
        .fs-thumbnail-list {
          display: flex;
          flex-direction: row;
          gap: 12px;
          overflow-x: auto;
          width: 100%;
          scrollbar-width: none;
          justify-content: ${items.length < maxVisible ? 'center' : 'flex-start'};
        }
        
        .fs-nav-btn {
          position: absolute;
          top: 50%;
          margin-top: -24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${btnBg};
          border: 1px solid ${btnBorder};
          color: ${textMain};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          z-index: 10;
          transition: all 0.3s ease;
        }
        .fs-nav-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
        .fs-nav-left {
          left: 24px;
        }
        .fs-nav-right {
          right: 24px;
        }
        
        .fs-thumbnail-list::-webkit-scrollbar {
          display: none;
        }
        
        .fs-thumb {
          width: calc((100% - (12px * (var(--visible-thumbs) - 1))) / var(--visible-thumbs));
          max-width: 180px;
          height: 90px;
          flex-shrink: 0;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-sizing: border-box;
          transform: scale(1);
          position: relative;
        }
        
        .fs-thumb:hover {
          opacity: 0.9;
          transform: scale(1.05);
        }
        
        .fs-thumb.active {
          opacity: 1;
          border: 2px solid ${A || '#0097B2'};
          box-shadow: 0 4px 12px ${A ? A + '40' : 'rgba(0,151,178,0.25)'};
          transform: scale(1.02);
        }

        .fs-thumb-more {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          backdrop-filter: blur(2px);
        }

        @media (max-width: 1023px) {
          .fs-modal-box {
            max-width: 1400px;
            flex-direction: row;
            height: 75vh;
          }
          .fs-right-pane {
            width: clamp(160px, 18vw, 240px);
            height: auto;
            flex-direction: column;
            border-top: none;
            border-left: 1px solid ${isDark ? '#333' : '#F0F0F0'};
            padding: 0;
          }
          .fs-image {
            object-fit: contain !important;
            border-radius: 32px 0 0 32px;
            padding: 0;
          }
          .fs-image-bg {
            display: none;
          }
          .fs-thumbnail-list {
            flex-direction: column;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 16px;
            gap: 12px;
            justify-content: flex-start;
          }
          .fs-thumb {
            width: 100%;
            max-width: none;
            height: auto;
            aspect-ratio: 4/3;
            transform: scale(0.98);
          }
          .fs-thumb:hover {
             transform: scale(0.98);
             opacity: 0.8;
          }
          .fs-thumb.active {
             border: 2px solid ${A || '#0097B2'};
             transform: scale(1.02);
             box-shadow: 0 10px 24px ${A ? A + '40' : 'rgba(0,151,178,0.25)'};
          }
        }

        @media (max-width: 900px) {
          .fs-modal-box {
            flex-direction: column;
            height: 90vh;
            border-radius: 24px 24px 0 0;
            margin-top: auto;
            align-self: flex-end;
          }
          
          .fs-right-pane {
            width: 100%;
            height: clamp(100px, 15vh, 140px);
            border-left: none;
            border-top: 1px solid ${isDark ? '#333' : '#F0F0F0'};
          }
          
          .fs-thumbnail-list {
            flex-direction: row;
            overflow-y: hidden;
            overflow-x: auto;
            padding: 16px 20px;
            align-items: center;
          }
          
          .fs-thumb {
            width: clamp(80px, 25vw, 140px);
            height: 100%;
            flex-shrink: 0;
          }
          
          .fs-header {
            padding: 16px 20px;
          }
          
          .fs-image-container {
            padding: 0;
          }
          .fs-image {
            padding: 12px !important;
            object-fit: contain !important;
          }
          .fs-nav-btn {
            width: 40px;
            height: 40px;
            margin-top: -20px;
          }
          .fs-nav-left { left: 12px; }
          .fs-nav-right { right: 12px; }
          .fs-close-btn {
            top: 16px !important;
            right: 16px !important;
            width: 40px !important;
            height: 40px !important;
          }
          .fs-count-pill {
            top: 16px !important;
            left: 16px !important;
            padding: 6px 16px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      <motion.div
        className="fs-modal-box"
        initial={{ y: 50, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          className="fs-close-btn"
          onClick={onClose}
          whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
          whileTap={{ scale: 0.92 }}
          style={{ position: 'absolute', top: 24, right: 24, zIndex: 100, width: 48, height: 48, borderRadius: '50%', background: btnBg, border: `1px solid ${btnBorder}`, color: textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
        >
          <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
        </motion.button>

        {/* LEFT PANE - Image Viewer */}
        <div className="fs-left-pane">
          <div className="fs-image-container">
            <div className="fs-count-pill" style={{ position: 'absolute', top: 24, left: 24, zIndex: 100, background: pillBg, backdropFilter: 'blur(20px)', border: `1px solid ${pillBorder}`, padding: '8px 24px', borderRadius: 100, color: pillText, fontSize: 13, letterSpacing: '0.15em', fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
              {currentIndex + 1} <span style={{ opacity: 0.3, margin: '0 6px', color: textMain }}>/</span> <span style={{ color: textMain }}>{Math.max(1, items.length)}</span>
            </div>
            <AnimatePresence>
              {/* Blurred background layer for aesthetic fill */}
              <motion.img
                className="fs-image-bg"
                key={`bg-${src}`}
                src={src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                alt=""
              />
              <motion.img
                className="fs-image"
                key={src}
                src={src}
                initial={{ opacity: 0, scale: 0.98, filter: isDark ? 'brightness(0.5)' : 'brightness(1.1)' }}
                animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
                exit={{ opacity: 0, scale: 1.02, filter: isDark ? 'brightness(0.5)' : 'brightness(1.1)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                alt="Viewer"
              />
            </AnimatePresence>

            {hasNavigation && (
              <>
                <motion.button
                  className="fs-nav-btn fs-nav-left"
                  onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex - 1 + items.length) % items.length); }}
                  whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
                  whileTap={{ scale: 0.92 }}
                >
                  <ChevronLeft size={24} />
                </motion.button>
                <motion.button
                  className="fs-nav-btn fs-nav-right"
                  onClick={(e) => { e.stopPropagation(); onNavigate((currentIndex + 1) % items.length); }}
                  whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
                  whileTap={{ scale: 0.92 }}
                >
                  <ChevronLeft size={24} style={{ transform: 'rotate(180deg)' }} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANE (or BOTTOM PANE on Desktop) - Thumbnails */}
        {hasNavigation && (
          <div className="fs-right-pane">
            <div className="fs-thumbnail-list" ref={thumbContainerRef} style={{ '--visible-thumbs': maxVisible }}>
              {visibleItems.map((thumbSrc, idx) => {
                const isLastAndMore = isDesktop && !showAllThumbs && items.length > maxVisible && idx === maxVisible - 1;
                return (
                  <div
                    key={idx}
                    ref={idx === currentIndex ? activeThumbRef : null}
                    className={`fs-thumb ${idx === currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      if (isLastAndMore) {
                        setShowAllThumbs(true);
                        onNavigate(idx);
                      } else {
                        onNavigate(idx);
                      }
                    }}
                  >
                    <img src={thumbSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Thumbnail ${idx + 1}`} />
                    {isLastAndMore && (
                      <div className="fs-thumb-more">
                        +{remainingCount + 1}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
};

export default FullScreenImage;
