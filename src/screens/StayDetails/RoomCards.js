import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import cn from "classnames";
import styles from "./RoomCards.module.sass";
import Icon from "../../components/Icon";
import { useTheme } from "../../components/JUI/Theme";
import { motion, AnimatePresence } from "framer-motion";
import { lockBodyScroll } from "../../utils/scrollLock";
import {
  Wifi, Waves, Sparkles, Dumbbell, Umbrella, Utensils,
  Tv, Coffee, Car, AirVent, CheckCircle, Building, Home, Plus, ChevronLeft,
  Users, Bed, Maximize, Check, ChevronDown, Minus
} from "lucide-react";
import moment from "moment";

/* ---------- HOOKS ----------------------------------------------------- */
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

/* ---------- constants ------------------------------------------------- */
const MEAL_PLAN_LABELS = {
  EP: "EP – Room Only",
  BB: "BB – Bed & Breakfast",
  CP: "CP – Continental Breakfast",
  MAP: "MAP – Half Board (2 Meals)",
  AP: "AP – Full Board (All Meals)",
};

const getMealPlanLabel = (code) => MEAL_PLAN_LABELS[code] || code;

const formatPrice = (raw) => {
  const n = parseFloat(raw);
  if (!n || isNaN(n)) return null;
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const AMENITY_ICONS = {
  wifi: Wifi,
  ac: AirVent,
  air: AirVent,
  parking: Car,
  pool: Waves,
  swimming: Waves,
  breakfast: Coffee,
  food: Utensils,
  tv: Tv,
  television: Tv,
  kitchen: Utensils,
  gym: Dumbbell,
  fitness: Dumbbell,
  spa: Sparkles,
  default: CheckCircle
};

const getAmenityIcon = (name) => {
  const lower = String(name).toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return AMENITY_ICONS.default;
};

const getBillingConfigDiscountRate = (listing) => {
  const discounts =
    listing?.billingConfig?.discounts ||
    listing?.billing_config?.discounts ||
    [];
  if (!Array.isArray(discounts) || discounts.length === 0) return 0;

  const totalRate = discounts.reduce((sum, discount) => {
    const rate = Number(discount?.currentRate ?? discount?.current_rate ?? 0);
    return sum + (Number.isFinite(rate) ? rate : 0);
  }, 0);

  return Math.max(0, Math.min(100, totalRate));
};

const fixImageUrl = (url) => {
  if (!url) return "";
  const u = typeof url === 'string' ? url : (url.url || url.src || url.mediaUrl || url.coverImageUrl || url.coverPhotoUrl || "");
  if (typeof u !== 'string' || !u) return "";
  
  try {
    const urlStr = u.trim();
    if (urlStr.startsWith("http")) {
      const parts = urlStr.split('?');
      // decodeURI on the path will fix %2520 -> %20 and %20 -> space
      // The browser will then correctly encode it for the request
      const fixedPath = decodeURI(parts[0]);
      return fixedPath + (parts.length > 1 ? '?' + parts.slice(1).join('?') : '');
    }
    if (urlStr.startsWith("/")) return decodeURI(urlStr);
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodeURI(urlStr.replaceAll("%2F", "/"))}`;
  } catch (e) {
    return u;
  }
};

const resolveCoverImage = (room) => {
  // Prefer the explicit coverImageUrl first if it exists
  const coverUrl = room.coverImageUrl || room.coverPhotoUrl || room.coverImage;
  if (coverUrl && typeof coverUrl === "string") return fixImageUrl(coverUrl);

  const media = room.media || room.bedGalleryMedia || [];
  const first = media[0];
  if (first) {
    const u = typeof first === "string" ? first : first.url || first.src || first.mediaUrl || first.imageUrl || first.blobName;
    if (u) return fixImageUrl(u);
  }
  return null;
};

const getPriceForPlan = (room, code) => {
  if (room.mealPlanPricing && room.mealPlanPricing[code]) {
    const mp = room.mealPlanPricing[code];
    return mp.b2cPrice || mp.price || null;
  }
  const flat = { BB: "bbPrice", CP: "cpPrice", MAP: "mapPrice", AP: "apPrice", EP: "epPrice" };
  return flat[code] ? room[flat[code]] : room.b2cPrice || room.price || null;
};

/* Extract feature tags from room data */
const getRoomFeatures = (room, listing) => {
  const features = [];
  
  // 1. Prioritize roomAmenities (Enriched objects from backend)
  if (Array.isArray(room.roomAmenities) && room.roomAmenities.length > 0) {
    room.roomAmenities.forEach(ra => {
      const label = ra.displayName || ra.code || ra.name;
      if (label) features.push(label);
    });
  } 
  // 2. Fallback to legacy amenityIds if roomAmenities is missing
  else if (Array.isArray(room.amenityIds) && Array.isArray(listing?.amenities)) {
    room.amenityIds.forEach(id => {
      const matched = listing.amenities.find(a => 
        String(a.id) === String(id) || 
        String(a.amenityId) === String(id) ||
        String(a.selectionId) === String(id)
      );
      const label = matched?.amenityName || matched?.name || matched?.amenity || matched?.title || matched?.displayName;
      if (label) features.push(label);
    });
  }

  // 3. Add other generic amenities/features if present
  if (Array.isArray(room.amenities)) {
    room.amenities.forEach(a => {
      const label = typeof a === "string" ? a : a?.name || a?.amenity || a?.title || a?.displayName;
      if (label) features.push(label);
    });
  }

  if (Array.isArray(room.features)) {
    room.features.forEach(f => {
      const label = typeof f === "string" ? f : f?.name || f?.feature;
      if (label) features.push(label);
    });
  }

  if (Array.isArray(room.tags)) {
    room.tags.forEach(t => {
      const label = typeof t === "string" ? t : t?.name || t?.tag;
      if (label) features.push(label);
    });
  }

  // Final unique list
  return [...new Set(features)].filter(Boolean);
};

/* ---------- Custom Dropdown ------------------------------------------ */
const CustomDropdown = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const selected = options.find((o) => o.value === value) || options[0];
  return (
    <div ref={ref} className={styles.dropdown}>
      <div onClick={() => setOpen((p) => !p)} className={cn(styles.dropdownTrigger, { [styles.open]: open })}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected ? selected.label : "Select…"}</span>
        <span className={cn(styles.dropdownArrow, { [styles.open]: open })}><ChevronDown size={14} /></span>
      </div>
      {open && (
        <div className={styles.dropdownList}>
          {options.map((opt) => (
            <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }} className={cn(styles.dropdownOption, { [styles.selected]: opt.value === value })}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Portal wrapper ------------------------------------------- */
/* Renders children directly into document.body to escape any parent
   overflow:hidden / transform / stacking-context that would clip the modal */
const ModalPortal = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

/* ---------- Full Screen Image ----------------------------------------- */
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

  useEffect(() => {
    return lockBodyScroll();
  }, []);

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
          max-width: 1400px;
          height: 85vh;
          background: ${isDark ? '#0A0A0A' : '#FFFFFF'};
          border-radius: 32px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.25);
          display: flex;
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
          width: clamp(200px, 20vw, 300px);
          display: flex;
          flex-direction: column;
          border-left: 1px solid ${isDark ? '#333' : '#F0F0F0'};
          background: ${isDark ? '#0A0A0A' : '#FAFAFA'};
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
        }
        
        .fs-image {
          object-fit: contain !important;
          width: 100% !important;
          height: 100% !important;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.08));
          position: absolute;
          top: 0;
          left: 0;
          padding: 24px;
          box-sizing: border-box;
        }
        
        .fs-thumbnail-list {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: none;
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
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          opacity: 0.5;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-sizing: border-box;
          transform: scale(0.98);
        }
        
        .fs-thumb:hover {
          opacity: 0.8;
        }
        
        .fs-thumb.active {
          opacity: 1;
          border: 3px solid ${A || '#0097B2'};
          box-shadow: 0 10px 24px ${A ? A + '40' : 'rgba(0,151,178,0.25)'};
          transform: scale(1.02);
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
            padding: 12px;
          }
          .fs-nav-btn {
            width: 40px;
            height: 40px;
            margin-top: -20px;
          }
          .fs-nav-left { left: 12px; }
          .fs-nav-right { right: 12px; }
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

        {/* LEFT PANE - Image Viewer */}
        <div className="fs-left-pane">
          <div className="fs-header">
            {hasNavigation ? (
              <div style={{ background: pillBg, backdropFilter: 'blur(20px)', border: `1px solid ${pillBorder}`, padding: '8px 24px', borderRadius: 100, color: pillText, fontSize: 13, letterSpacing: '0.15em', fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                {currentIndex + 1} <span style={{ opacity: 0.3, margin: '0 6px', color: textMain }}>/</span> <span style={{ color: textMain }}>{items.length}</span>
              </div>
            ) : <div />}

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.08, backgroundColor: btnHoverBg }}
              whileTap={{ scale: 0.92 }}
              style={{ width: 48, height: 48, borderRadius: '50%', background: btnBg, border: `1px solid ${btnBorder}`, color: textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
            >
              <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
            </motion.button>
          </div>

          <div className="fs-image-container">
            <AnimatePresence>
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

        {/* RIGHT PANE - Thumbnails */}
        {hasNavigation && (
          <div className="fs-right-pane">
            <div className="fs-thumbnail-list">
              {items.map((thumbSrc, idx) => (
                <div
                  key={idx}
                  className={`fs-thumb ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => onNavigate(idx)}
                >
                  <img src={thumbSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Thumbnail ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
};;




const RoomCard = ({ room, listing, onRoomSelect, isSelected, roomsCount, onRoomsCountChange, selectedMealPlan }) => {
  const { tokens: { FG, B, A, AL, S, W, M, BG } } = useTheme();
  const { isMobile } = useWindowSize();
  const [showModal, setShowModal] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showDesc, setShowDesc] = useState(false);
  const [isImgHovered, setIsImgHovered] = useState(false);

  const isBedBased = room.isBedConfig || (listing?.inventorySetupType === "Bed-Based" && (!listing?.rooms || listing.rooms.length === 0));

  const allPlans = room.mealPlanPricing ? Object.keys(room.mealPlanPricing) : [];
  if (!allPlans.length) {
    if (room.epPrice) allPlans.push("EP");
    if (room.bbPrice) allPlans.push("BB");
    if (room.cpPrice) allPlans.push("CP");
    if (room.mapPrice) allPlans.push("MAP");
    if (room.apPrice) allPlans.push("AP");
  }

  const [plan, setPlan] = useState(selectedMealPlan || allPlans[0] || null);
  useEffect(() => {
    setPlan(selectedMealPlan || allPlans[0] || null);
  }, [selectedMealPlan, allPlans]);
  
  const rawPrice = plan ? getPriceForPlan(room, plan) : room.b2cPrice || room.price;
  const discountRate = getBillingConfigDiscountRate(listing);
  const discountedRawPrice = rawPrice != null ? Math.max(0, Number(rawPrice) * (1 - discountRate / 100)) : null;
  const displayPrice = formatPrice(rawPrice);
  const discountedDisplayPrice = formatPrice(discountedRawPrice);

  const name = room.roomName || room.roomTypeName || room.name || "Room";
  const capacity = room.maxGuests || (room.maxAdults ? room.maxAdults + (room.maxChildren || 0) : null);
  const description = room.roomDescription || room.description || room.shortDescription;
  const totalRooms = room.totalRooms || room.totalUnits || null;
  const coverImage = resolveCoverImage(room);
  const features = getRoomFeatures(room, listing);

  const allImages = [];
  if (coverImage) allImages.push(coverImage);
  const med = room?.media || room?.listingMedia || room?.images || [];
  med.forEach(m => {
    const u = typeof m === "string" ? m : m.url || m.src || m.imageUrl || m.fileUrl || m.blobName;
    if (u && !allImages.includes(u)) allImages.push(u);
  });
  const totalPhotos = Math.max(1, allImages.length);

  const handlePlanChange = (code) => {
    setPlan(code);
    if (isSelected && onRoomSelect) onRoomSelect(room.roomId ?? room.id, code, "update");
  };

  const handleSelect = () => {
    if (onRoomSelect) onRoomSelect(room.roomId ?? room.id, plan, isSelected ? "toggle" : "select");
  };

  return (
    <motion.div 
      whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}
      transition={{ duration: 0.3 }}
      className={cn(styles.card, { [styles.cardSelected]: isSelected })}
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "stretch",
        background: W,
        border: `1px solid ${isSelected ? A : B}`,
        borderRadius: isMobile ? "24px" : "20px",
        padding: "0",
        position: "relative",
        gap: 0,
        minHeight: "220px",
        overflow: "hidden",
        boxShadow: isSelected ? `0 8px 24px ${A}20` : (isMobile ? "0 4px 20px rgba(0,0,0,0.06)" : "none"),
        boxSizing: "border-box",
        marginBottom: "24px"
      }}
    >
      {/* Left: Image Mosaic */}
      <div 
        onMouseEnter={() => setIsImgHovered(true)}
        onMouseLeave={() => setIsImgHovered(false)}
        onClick={() => setShowModal(true)}
        style={{
          width: isMobile ? "100%" : "280px",
          height: isMobile ? "200px" : "auto",
          flexShrink: 0,
          display: "flex",
          borderRight: isMobile ? "none" : `1px solid ${B}`,
          borderBottom: isMobile ? `1px solid ${B}` : "none",
          background: W,
          position: "relative",
          cursor: "pointer",
          overflow: "hidden"
        }}
      >
        {allImages.length >= 3 ? (
          <>
            <img src={allImages[0]} alt={name} style={{ width: "65%", height: "100%", objectFit: "cover" }} />
            <div style={{ width: "35%", display: "flex", flexDirection: "column", height: "100%" }}>
              <img src={allImages[1]} alt={name} style={{ width: "100%", height: "50%", objectFit: "cover", borderLeft: "2px solid #FFF", borderBottom: "1px solid #FFF" }} />
              <div style={{ width: "100%", height: "50%", position: "relative", overflow: "hidden", borderLeft: "2px solid #FFF", borderTop: "1px solid #FFF" }}>
                <img src={allImages[2]} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {totalPhotos > 3 && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "14px", fontWeight: 700 }}>
                    +{totalPhotos - 3}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <img src={allImages[0] || "/images/content/card-pic-13.jpg"} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}

        {/* Room Count Tag */}
        {totalRooms != null && (
          <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", borderRadius: "100px", background: W, border: `1px solid ${B}`, color: FG, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Bed size={14} /> {totalRooms} {isBedBased ? "BEDS" : "ROOMS"}
          </div>
        )}



        {/* View Gallery Overlay Button */}
        <AnimatePresence>
          {isImgHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}
            >
              <div style={{ padding: "10px 20px", borderRadius: "100px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", color: FG, fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                View Gallery
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Middle: Content details */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: isMobile ? "16px" : "24px 32px", minWidth: 0, justifyContent: "space-between" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "12px" }}>
          <h4 style={{ fontSize: isMobile ? "24px" : "28px", fontWeight: 800, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', color: FG, margin: 0, lineHeight: 1.2 }}>
            {name}
          </h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
            {/* Guest Count prominent display */}
            {capacity != null && !isBedBased && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: FG, fontFamily: '"Inter", sans-serif' }}>
                <Users size={16} color={A} />
                <span>Up to {capacity} Guests</span>
              </div>
            )}
            
            {/* Amenities Row */}
            <div style={{ display: "flex", flexWrap: isMobile ? "nowrap" : "wrap", gap: "8px", overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? "4px" : "0", scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {room.bedType && <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: A, background: "rgba(0, 151, 178, 0.06)", padding: "4px 10px", borderRadius: "100px", border: "1px solid rgba(0, 151, 178, 0.15)", whiteSpace: "nowrap" }}>{room.bedType}</span>}
              {room.roomSize && <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: A, background: "rgba(0, 151, 178, 0.06)", padding: "4px 10px", borderRadius: "100px", border: "1px solid rgba(0, 151, 178, 0.15)", whiteSpace: "nowrap" }}>{room.roomSize} sq ft</span>}
              {features.map((f, i) => (
                <span key={i} style={{ flexShrink: 0, fontSize: "11px", fontWeight: 700, color: A, background: "rgba(0, 151, 178, 0.06)", padding: "4px 10px", borderRadius: "100px", border: "1px solid rgba(0, 151, 178, 0.15)", whiteSpace: "nowrap" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {description && (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
            <AnimatePresence initial={false}>
              {showDesc && (
                <motion.p 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 0.8 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ fontSize: "14px", color: M, lineHeight: 1.6, margin: 0, fontFamily: '"Inter", sans-serif' }}
                >
                  {description}
                </motion.p>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setShowDesc(!showDesc)}
              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: A, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: '"Inter", sans-serif' }}
            >
              {showDesc ? "Less details" : "More details"}
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showDesc ? "rotate(180deg)" : "none" }} />
            </button>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ width: isMobile ? "100%" : "260px", flexShrink: 0, background: isMobile ? W : AL, padding: isMobile ? "0 16px 16px" : "24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: isMobile ? "12px" : "20px", borderTop: isMobile ? "none" : "none" }}>
        
        {allPlans.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "8px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: A }}>
              Meal Plan
            </div>
            {allPlans.length > 1 ? (
              <CustomDropdown
                options={allPlans.map((c) => ({ value: c, label: getMealPlanLabel(c) }))}
                value={plan}
                onChange={handlePlanChange}
              />
            ) : (
              <div style={{ padding: "8px 12px", borderRadius: "8px", background: W, border: `1px solid ${B}`, color: FG, fontSize: "13px", fontWeight: 600 }}>
                {getMealPlanLabel(allPlans[0])}
              </div>
            )}
          </div>
        ) : <div />}

        <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "flex-end" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: M, marginBottom: "4px" }}>
            STARTING FROM
          </span>
          <div style={{ fontSize: "24px", fontWeight: 800, color: FG, fontFamily: '"Inter", sans-serif', lineHeight: 1 }}>
            {displayPrice ? (
              <>
                {discountRate > 0 && discountedDisplayPrice && (
                  <span style={{ fontSize: "14px", color: M, textDecoration: "line-through", marginRight: "8px" }}>
                    {"\u20B9"}{displayPrice}
                  </span>
                )}
                {"\u20B9"}{discountRate > 0 && discountedDisplayPrice ? discountedDisplayPrice : displayPrice}
                <span style={{ fontSize: "12px", fontWeight: 500, color: M }}> / night</span>
              </>
            ) : (
              <span style={{ fontSize: "16px", fontWeight: 600, color: M }}>Price on request</span>
            )}
          </div>
        </div>

        <div style={{ width: "100%", marginTop: isMobile ? "0" : "auto" }}>
          {isSelected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: W, borderRadius: "8px", border: `1px solid ${A}`, padding: "6px 12px", height: "42px", boxSizing: "border-box" }}>
                {!isMobile ? (
                  <>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: FG }}>
                      {roomsCount} {isBedBased ? "Bed" : "Room"}{roomsCount === 1 ? "" : "s"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        type="button"
                        disabled={roomsCount <= 1}
                        onClick={(e) => { e.stopPropagation(); onRoomsCountChange(roomsCount - 1); }}
                        style={{ background: "none", border: "none", cursor: roomsCount <= 1 ? "not-allowed" : "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: roomsCount <= 1 ? M : A, opacity: roomsCount <= 1 ? 0.5 : 1, outline: "none" }}
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        disabled={totalRooms != null && roomsCount >= Number(totalRooms)}
                        onClick={(e) => { e.stopPropagation(); onRoomsCountChange(roomsCount + 1); }}
                        style={{ background: "none", border: "none", cursor: (totalRooms != null && roomsCount >= Number(totalRooms)) ? "not-allowed" : "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: (totalRooms != null && roomsCount >= Number(totalRooms)) ? M : A, opacity: (totalRooms != null && roomsCount >= Number(totalRooms)) ? 0.5 : 1, outline: "none" }}
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={roomsCount <= 1}
                      onClick={(e) => { e.stopPropagation(); onRoomsCountChange(roomsCount - 1); }}
                      style={{ background: "none", border: "none", cursor: roomsCount <= 1 ? "not-allowed" : "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: roomsCount <= 1 ? M : A, opacity: roomsCount <= 1 ? 0.5 : 1, outline: "none" }}
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: FG }}>
                      {roomsCount} {isBedBased ? "Bed" : "Room"}{roomsCount === 1 ? "" : "s"}
                    </span>
                    <button
                      type="button"
                      disabled={totalRooms != null && roomsCount >= Number(totalRooms)}
                      onClick={(e) => { e.stopPropagation(); onRoomsCountChange(roomsCount + 1); }}
                      style={{ background: "none", border: "none", cursor: (totalRooms != null && roomsCount >= Number(totalRooms)) ? "not-allowed" : "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: (totalRooms != null && roomsCount >= Number(totalRooms)) ? M : A, opacity: (totalRooms != null && roomsCount >= Number(totalRooms)) ? 0.5 : 1, outline: "none" }}
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </>
                )}
              </div>
              <button 
                onClick={handleSelect}
                style={{ width: "100%", height: "42px", borderRadius: "8px", background: FG, color: BG, fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Check size={16} /> SELECTED
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSelect}
              style={{ width: "100%", height: "42px", borderRadius: "8px", background: A, color: "#FFF", fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${A}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              SELECT {isBedBased ? "BED" : "ROOM"}
            </button>
          )}
        </div>

      </div>

      <ModalPortal>
        <AnimatePresence>
          {showModal && (
            <FullScreenImage
              src={allImages[galleryIndex]}
              items={allImages}
              currentIndex={galleryIndex}
              onNavigate={setGalleryIndex}
              onClose={() => setShowModal(false)}
            />
          )}
        </AnimatePresence>
      </ModalPortal>
    </motion.div>
  );
};

/* ---------- RoomCards section ---------------------------------------- */
const RoomCards = ({ listing, onRoomSelect, selectedRooms = [], noContainer, onRoomsCountChange }) => {
  let rooms = listing?.rooms || listing?.roomTypes || listing?.room_types || listing?.stay?.rooms || [];

  if (listing?.bedConfigs?.length > 0) {
    const bedRooms = listing.bedConfigs.map((b, idx) => ({
      ...b,
      roomId: b.id || b.bedConfigId || `bed-${idx}`,
      roomName: b.bedType || b.name || "Bed",
      totalRooms: b.bedCount || listing?.bedCount,
      coverImageUrl: b.bedCoverImageUrl || listing?.bedCoverImageUrl,
      media: b.bedGalleryMedia || listing?.bedGalleryMedia || [],
      price: b.b2cPrice || b.price || listing?.b2cPrice,
      maxAdults: 1,
      maxChildren: 0,
      maxExtraAdults: 0,
      description: b.description || b.bedDescription,
      roomAmenities: b.amenities || [],
      isBedConfig: true
    }));
    
    // Append beds to existing rooms
    if (listing?.inventorySetupType === "Bed-Based" && (!listing?.rooms || listing.rooms.length === 0)) {
      rooms = bedRooms;
    } else {
      rooms = [...rooms, ...bedRooms];
    }
  }

  if (!Array.isArray(rooms) || rooms.length === 0) return null;

  const content = (
    <div className={styles.list}>
      {rooms.map((room, idx) => {
        const roomId = String(room.roomId ?? room.id ?? idx);
        const selection = selectedRooms.find(r => r.roomId === roomId);
        return (
          <RoomCard
            key={roomId}
            room={room}
            listing={listing}
            onRoomSelect={onRoomSelect}
            isSelected={!!selection}
            selectedMealPlan={selection?.mealPlan}
            roomsCount={selection?.count || 1}
            onRoomsCountChange={(count) => onRoomsCountChange(roomId, count)}
          />
        );
      })}
    </div>
  );

  if (noContainer) return <div>{content}</div>;

  return (
    <div className={cn("section", styles.section)}>
      <div className="container">{content}</div>
    </div>
  );
};

export default RoomCards;
