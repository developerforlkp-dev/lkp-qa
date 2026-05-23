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
  Tv, Coffee, Car, AirVent, CheckCircle, Building, Home
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
    return decodeURI(urlStr);
  } catch (e) {
    return u;
  }
};

const resolveCoverImage = (room) => {
  // Prefer the explicit coverImageUrl first if it exists
  const coverUrl = room.coverImageUrl || room.coverPhotoUrl || room.coverImage;
  if (coverUrl && typeof coverUrl === "string") return fixImageUrl(coverUrl);

  const media = room.media || [];
  const first = media[0];
  if (first) {
    const u = typeof first === "string" ? first : first.url || first.src;
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
        <span className={cn(styles.dropdownArrow, { [styles.open]: open })}>▼</span>
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

/* ---------- Room Modal ---------------------------------------------- */
const RoomModal = ({ room, listing, isSelected, handleSelect, onClose }) => {
  const { isMobile } = useWindowSize();
  const { tokens: { A, FG, M, B, W, S, BG, AL } } = useTheme();
  const name = room.roomName || room.roomTypeName || room.name || "Room Details";
  const desc = room.roomDescription || room.description || room.shortDescription;
  const capacity = room.maxGuests || (room.maxAdults ? room.maxAdults + (room.maxChildren || 0) : null);
  const totalRooms = room.totalRooms || room.totalUnits || null;
  const features = getRoomFeatures(room, listing);
  const scrollRef = useRef(null);
  const galleryRef = useRef(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Extra Details
  const bedInfo = room.bedType || room.bedTypeName || room.beddingType || (room.noOfBeds ? `${room.noOfBeds} Bed(s)` : null);
  const bedSize = room.bedSize;
  const inclusions = room.inclusions || room.roomInclusions || room.room_inclusions || [];
  const summaryText = listing?.cancellationPolicySummary || 
                      listing?.privacyAndPolicy?.cancellationPolicySummary || 
                      listing?.listing?.cancellationPolicySummary || 
                      listing?.stay?.cancellationPolicySummary ||
                      listing?.generatedPolicySummary || 
                      listing?.policySummary || 
                      listing?.cancellation_policy_summary;

  const templateText = listing?.cancellationPolicyTemplate || 
                       listing?.privacyAndPolicy?.cancellationPolicyTemplate || 
                       listing?.listing?.cancellationPolicyTemplate || 
                       listing?.stay?.cancellationPolicyTemplate ||
                       listing?.cancellationPolicy || 
                       listing?.cancellationPolicyText;

  const cancellationPolicy = room.cancellationPolicy || 
                             room.cancellationTerms || 
                             (summaryText && summaryText.trim().length > 5 && !summaryText.toLowerCase().includes("no cancellation policy summary") ? summaryText : null) ||
                             (templateText && templateText.trim().length > 0 && !templateText.toLowerCase().includes("no cancellation policy rules") ? templateText : null);

  useEffect(() => {
    if (listing?.scrollToAmenities && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [listing]);
  
  // Compile all images safely
  const media = room.media || [];
  const allImages = [];
  const coverImage = resolveCoverImage(room);
  if (coverImage) allImages.push(coverImage);
  media.forEach(m => {
    const u = fixImageUrl(typeof m === "string" ? m : m.url || m.src);
    if (u && !allImages.includes(u)) allImages.push(u);
  });

  const scrollGallery = (dir) => {
    if (!galleryRef.current) return;
    const nextIdx = dir === 'next' 
      ? (galleryIndex + 1) % allImages.length 
      : (galleryIndex - 1 + allImages.length) % allImages.length;
    
    setGalleryIndex(nextIdx);
    const itemWidth = galleryRef.current.offsetWidth;
    galleryRef.current.scrollTo({
      left: nextIdx * itemWidth,
      behavior: 'smooth'
    });
  };

  const handleGalleryScroll = () => {
    if (!galleryRef.current) return;
    const scrollLeft = galleryRef.current.scrollLeft;
    const itemWidth = galleryRef.current.offsetWidth;
    if (itemWidth > 0) {
      const idx = Math.round(scrollLeft / itemWidth);
      if (idx !== galleryIndex && idx >= 0 && idx < allImages.length) {
        setGalleryIndex(idx);
      }
    }
  };

  const seasonalPeriods = listing?.seasonalPeriods || [];

  useEffect(() => {
    return lockBodyScroll();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime12h = (value, fallback = "") => {
    if (!value) return fallback;
    const raw = String(value).trim();
    const parsed = moment(raw, ["HH:mm:ss", "HH:mm", "h:mm A", "h:mmA"], true);
    if (!parsed.isValid()) return raw;
    return parsed.format("h:mm A");
  };

  const checkInRaw = listing?.checkInTime || listing?.checkinTime || listing?.check_in_time || "14:00";
  const checkOutRaw = listing?.checkOutTime || listing?.checkoutTime || listing?.check_out_time || "11:00";
  const checkInText = formatTime12h(checkInRaw, "2:00 PM");
  const checkOutText = formatTime12h(checkOutRaw, "11:00 AM");

  // Calculate pricing for the grid
  const allPlans = room.mealPlanPricing ? Object.keys(room.mealPlanPricing) : [];
  if (!allPlans.length) {
    if (room.epPrice) allPlans.push("EP");
    if (room.bbPrice) allPlans.push("BB");
    if (room.cpPrice) allPlans.push("CP");
    if (room.mapPrice) allPlans.push("MAP");
    if (room.apPrice) allPlans.push("AP");
  }
  const defaultPlan = allPlans[0] || null;
  const rawPrice = defaultPlan ? getPriceForPlan(room, defaultPlan) : room.b2cPrice || room.price;
  const discountRate = getBillingConfigDiscountRate(listing);
  const discountedRawPrice = rawPrice != null ? Math.max(0, Number(rawPrice) * (1 - discountRate / 100)) : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 24, overflow: "hidden", overflowX: "hidden", overscrollBehavior: "contain" }}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }} 
        onClick={onClose} 
      />
      
      {/* Scrollbar CSS Injection */}
      <style>{`
        .modal-scrollable-content::-webkit-scrollbar { width: 6px; }
        .modal-scrollable-content::-webkit-scrollbar-thumb { background: ${B}; border-radius: 10px; }
        .modal-scrollable-content { scrollbar-width: thin; scrollbar-color: ${B} transparent; }
        .gallery-scroll-track::-webkit-scrollbar { display: none; }
        .gallery-scroll-track { -ms-overflow-style: none; scrollbar-width: none; }
        .gallery-nav-button:hover { opacity: 1 !important; background: rgba(255,255,255,0.24) !important; }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, y: isMobile ? "100%" : 40, scale: isMobile ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isMobile ? "100%" : 40, scale: isMobile ? 1 : 0.97 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          position: "relative", background: W, width: "100%", maxWidth: 1100, 
          maxHeight: isMobile ? "100vh" : "90vh", 
          marginTop: isMobile ? "auto" : 0,
          borderRadius: isMobile ? "24px 24px 0 0" : 24, overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 1, 
          boxShadow: "0 40px 120px rgba(0,0,0,0.5)", border: `1px solid ${B}` 
        }}
      >
        {/* iOS style top handle indicator for mobile sheets */}
        {isMobile && (
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 44, height: 5, borderRadius: 100, background: "rgba(0,0,0,0.15)", zIndex: 30 }} />
        )}
        
        {/* Close Button */}
        <button onClick={onClose} style={{ 
          position: "absolute", top: isMobile ? 20 : 24, right: isMobile ? 20 : 24, width: 40, height: 40, borderRadius: "50%", 
          background: S, border: `1px solid ${B}`, display: "flex", alignItems: "center", 
          justifyContent: "center", cursor: "pointer", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", 
          transition: "all 0.3s ease", color: FG
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Scrollable Content Container */}
        <div className="modal-scrollable-content" style={{ overflowY: "auto", flex: 1, boxSizing: "border-box", padding: isMobile ? "40px 20px" : "48px 48px" }}>
          
          {/* Top Hero Section */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 32 : 40, marginBottom: 40, alignItems: "start" }}>
            
            {/* LEFT SIDE: Large Featured Image */}
            <div style={{ 
              height: isMobile ? 260 : 440, overflow: "hidden", borderRadius: 20,
              background: "#0F0F0F", position: "relative", display: "flex", flexShrink: 0,
              border: `1px solid ${B}`
            }}>
              {allImages.length > 0 ? (
                <>
                  <div ref={galleryRef} onScroll={handleGalleryScroll} className="gallery-scroll-track" style={{ display: "flex", width: "100%", height: "100%", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                    {allImages.map((img, i) => (
                      <div key={i} style={{ minWidth: "100%", height: "100%", scrollSnapAlign: "start", position: "relative" }}>
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: galleryIndex === i ? 1 : 0.8, transition: "opacity 0.6s ease" }} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Gradient Overlay for Readability */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%)",
                    pointerEvents: "none", zIndex: 10
                  }} />

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button className="gallery-nav-button" onClick={() => scrollGallery('prev')} style={{ 
                        position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", 
                        width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", 
                        backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", 
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#fff", zIndex: 15, transition: "all 0.3s", opacity: 0.72, fontSize: 22, fontWeight: 300, lineHeight: 1
                      }}>
                        &lt;
                      </button>
                      <button className="gallery-nav-button" onClick={() => scrollGallery('next')} style={{ 
                        position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", 
                        width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", 
                        backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", 
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#fff", zIndex: 15, transition: "all 0.3s", opacity: 0.72, fontSize: 22, fontWeight: 300, lineHeight: 1
                      }}>
                        &gt;
                      </button>
                    </>
                  )}

                  <div style={{ 
                    position: "absolute", bottom: 20, right: 20, background: "rgba(0,0,0,0.6)", 
                    backdropFilter: "blur(8px)", color: "#fff", padding: "6px 14px", borderRadius: 100, 
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", zIndex: 15, 
                    border: "1px solid rgba(255,255,255,0.15)" 
                  }}>
                    {galleryIndex + 1} <span style={{ opacity: 0.5, margin: "0 2px" }}>/</span> {allImages.length}
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: S }}>
                  <Building size="48" color={A} />
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Quick Info & Title */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <span style={{
                  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                  color: A, fontWeight: 800, marginBottom: 8, display: "block"
                }}>
                  Room Accommodation
                </span>

                <h2 style={{ 
                  fontSize: isMobile ? 32 : 40, fontWeight: 800, marginBottom: 12, 
                  fontFamily: "var(--font-fraunces, Georgia, serif)", color: FG, 
                  lineHeight: 1.1, letterSpacing: "-0.02em", wordBreak: "break-word" 
                }}>{name}</h2>
                
                <p style={{ fontSize: 14, lineHeight: 1.6, color: M, fontWeight: 550, margin: 0, opacity: 0.9 }}>
                  {desc ? (desc.length > 160 ? desc.substring(0, 160) + "..." : desc) : "Curated comfort and premium amenities."}
                </p>
              </div>

              {/* 2x2 Quick Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Capacity */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Capacity</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>{capacity != null ? `${capacity} Guests` : "Standard Capacity"}</span>
                </div>

                {/* Price */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Nightly Price</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG, display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 4 }}>
                    {rawPrice != null ? (
                      <>
                        {discountRate > 0 && (
                          <span style={{ fontSize: 11, color: M, textDecoration: "line-through", fontWeight: 500 }}>
                            ₹{Number(rawPrice).toLocaleString("en-IN")}
                          </span>
                        )}
                        <span>₹{Number(discountRate > 0 ? discountedRawPrice : rawPrice).toLocaleString("en-IN")}</span>
                      </>
                    ) : (
                      "On Request"
                    )}
                  </span>
                </div>

                {/* Check-in */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-in</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>After {checkInText}</span>
                </div>

                {/* Check-out */}
                <div style={{ padding: "12px 16px", background: S, borderRadius: 14, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-out</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>Before {checkOutText}</span>
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                {handleSelect && (
                  <button
                    onClick={() => {
                      handleSelect();
                      onClose();
                    }}
                    style={{
                      background: isSelected ? S : A,
                      color: isSelected ? FG : "#fff",
                      border: isSelected ? `1px solid ${B}` : "none",
                      padding: "14px 28px", borderRadius: 12, fontSize: 14, fontWeight: 800,
                      cursor: "pointer", boxShadow: isSelected ? "none" : `0 10px 25px ${A}2a`,
                      transition: "all 0.3s ease",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    {isSelected ? "✓ Selected" : "Select Room"}
                  </button>
                )}

                <button
                  onClick={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    background: "transparent", border: `1px solid ${B}`, color: FG,
                    padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.3s ease",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  View Full Details
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </div>
            </div>

          </div>

          {/* Divider & Full Narrative/Details */}
          <div ref={scrollRef} style={{ borderTop: `1px solid ${B}`, paddingTop: 40, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: isMobile ? 32 : 40 }}>
            
            {/* Left Column: Narrative */}
            <div>
              <h3 style={{ 
                fontSize: 11, fontWeight: 800, textTransform: "uppercase", 
                letterSpacing: "0.2em", color: M, marginBottom: 16 
              }}>
                Room Narrative
              </h3>
              <p style={{ 
                fontSize: 15, lineHeight: 1.8, color: FG, 
                fontWeight: 450, opacity: 0.9, whiteSpace: "pre-line", margin: 0 
              }}>
                {desc}
              </p>
              
              {/* Bed Specs (Accommodation Specs) */}
              {(bedInfo || bedSize) && (
                <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${B}` }}>
                  <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 20 }}>Accommodation Specs</h3>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 40 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", marginBottom: 6 }}>Configuration</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: FG }}>{bedInfo || "Standard Configuration"}</p>
                    </div>
                    {bedSize && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", marginBottom: 6 }}>Dimension</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: FG }}>{bedSize}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Amenities, Inclusions, Policy */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              
              {/* Amenities */}
              {features.length > 0 && (
                <div>
                  <h3 style={{ 
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase", 
                    letterSpacing: "0.2em", color: M, marginBottom: 20 
                  }}>
                    Amenities & Features
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
                    {features.map((f, i) => {
                      const IconComp = getAmenityIcon(f);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <IconComp size={15} color={A} />
                          <span style={{ fontSize: 13, color: FG, fontWeight: 600 }}>{f}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              {Array.isArray(inclusions) && inclusions.length > 0 && (
                <div>
                  <h3 style={{ 
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase", 
                    letterSpacing: "0.2em", color: M, marginBottom: 16 
                  }}>
                    Stay Inclusions
                  </h3>
                  <div style={{ padding: 20, background: S, borderRadius: 16, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 12 }}>
                    {inclusions.map((inc, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: FG, fontWeight: 600 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {typeof inc === 'string' ? inc : (inc.name || inc.label || inc.title)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal Availability */}
              {seasonalPeriods.length > 0 && (
                <div>
                  <h3 style={{ 
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase", 
                    letterSpacing: "0.2em", color: A, marginBottom: 16 
                  }}>
                    Seasonal Availability
                  </h3>
                  <div style={{ padding: 20, background: AL, borderRadius: 16, border: `1px solid ${A}`, display: "flex", flexDirection: "column", gap: 12 }}>
                    {seasonalPeriods.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, fontSize: 13, color: FG, fontWeight: 600 }}>
                        <span style={{ flex: 1 }}>{p.seasonName || p.name || p.label || `Season ${i + 1}`}</span>
                        <span style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap" }}>{formatDate(p.startDate)} – {formatDate(p.endDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              {typeof cancellationPolicy === 'string' && cancellationPolicy.trim() !== "" && cancellationPolicy !== "No cancellation policy rules defined." && (
                <div>
                  <h3 style={{ 
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase", 
                    letterSpacing: "0.2em", color: M, marginBottom: 16 
                  }}>
                    Cancellation Guidelines
                  </h3>
                  <div style={{ padding: 20, background: S, borderRadius: 16, border: `1px solid ${B}` }}>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: FG, fontWeight: 500, opacity: 0.85, margin: 0 }}>
                      {cancellationPolicy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};;




/* ---------- RoomCard (Horizontal Layout) ------------------------------ */
const RoomCard = ({ room, listing, onRoomSelect, isSelected, roomsCount, onRoomsCountChange }) => {
  const { tokens: { FG, B, A, AL } } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const allPlans = room.mealPlanPricing ? Object.keys(room.mealPlanPricing) : [];
  if (!allPlans.length) {
    if (room.epPrice) allPlans.push("EP");
    if (room.bbPrice) allPlans.push("BB");
    if (room.cpPrice) allPlans.push("CP");
    if (room.mapPrice) allPlans.push("MAP");
    if (room.apPrice) allPlans.push("AP");
  }

  const [plan, setPlan] = useState(allPlans[0] || null);
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
  const VISIBLE_TAGS = 3;
  const visibleFeatures = features.slice(0, VISIBLE_TAGS);
  const extraCount = features.length - VISIBLE_TAGS;

  const handlePlanChange = (code) => {
    setPlan(code);
    if (isSelected && onRoomSelect) onRoomSelect(room.roomId ?? room.id, code);
  };

  const handleSelect = () => {
    if (onRoomSelect) onRoomSelect(room.roomId ?? room.id, plan);
  };

  return (
    <div className={cn(styles.card, { [styles.cardSelected]: isSelected })}>
      {/* Left: Image */}
      <div className={styles.imgWrap}>
        {coverImage
          ? <img src={coverImage} alt={name} className={styles.img} />
          : <div className={styles.imgPlaceholder}><Icon name="home" size="48" /></div>
        }
        {totalRooms != null && <span className={styles.badge}>{totalRooms} ROOMS</span>}
        {isSelected && <span className={styles.selectedBadge}>✓ Selected</span>}
      </div>

      {/* Right: Content */}
      <div className={styles.body}>
        {/* Top row: name + price */}
        <div className={styles.topRow}>
          <h4 className={styles.roomName}>{name}</h4>
          <div className={styles.priceBlock}>
            <span className={styles.priceLabel}>STARTING FROM</span>
            <div className={styles.amount}>
              {displayPrice
                ? (
                  <>
                    {discountRate > 0 && discountedDisplayPrice && (
                      <span style={{ fontSize: 16, color: "#8b94aa", textDecoration: "line-through", marginRight: 8 }}>
                        {"\u20B9"}{displayPrice}
                      </span>
                    )}
                    {"\u20B9"}{discountRate > 0 && discountedDisplayPrice ? discountedDisplayPrice : displayPrice}
                    <span className={styles.perNight}> / night</span>
                  </>
                )
                : <span className={styles.priceOnRequest}>Price on request</span>
              }
            </div>
          </div>
        </div>

        {/* Guest capacity */}
        {capacity != null && (
          <p className={styles.capacity}>
            Max {capacity} Guest{capacity !== 1 ? "s" : ""}
            {room.maxAdults > 0 && <> · {room.maxAdults} adults{room.maxChildren > 0 ? `, ${room.maxChildren} children` : ""}</>}
          </p>
        )}

        {/* Description */}
        {description && <p className={styles.desc}>{description}</p>}

        {/* Meal plan selector */}
        {allPlans.length > 0 && (
          <div className={styles.planSection}>
            <div className={styles.planLabel}>Meal Plan</div>
            {allPlans.length > 1
              ? <CustomDropdown options={allPlans.map(c => ({ value: c, label: getMealPlanLabel(c) }))} value={plan} onChange={handlePlanChange} />
              : <div className={styles.singlePlan}>{getMealPlanLabel(allPlans[0])}</div>
            }
          </div>
        )}

        {/* Feature tags */}
        {features.length > 0 && (
          <div className={styles.tagsRow}>
            {visibleFeatures.map((f, i) => <span key={i} className={styles.tag}>{f}</span>)}
            {extraCount > 0 && <span className={styles.tagMore}>+ {extraCount} more</span>}
          </div>
        )}

        {/* CTA */}
        <div className={styles.foot} style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowModal({ scrollToAmenities: false }); }}
              style={{ 
                background: AL, border: `1px solid ${A}`, color: A,
                padding: "0 24px", height: 44, borderRadius: 12, fontSize: 13, fontWeight: 700, 
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.3s ease",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              View Details
            </button>
          </div>

          {isSelected ? (
            <div className={styles.counterRow} style={{ flex: 1, justifyContent: "flex-end", gap: 12 }}>
              <div className={styles.counterWrap}>
                <button className={styles.counterBtn} onClick={() => onRoomsCountChange(Math.max(1, roomsCount - 1))} disabled={roomsCount <= 1}>
                  <Icon name="minus" size="16" />
                </button>
                <span className={styles.countValue}>{roomsCount}</span>
                <button className={styles.counterBtn} onClick={() => onRoomsCountChange(Math.min(Number(totalRooms || 99), roomsCount + 1))} disabled={roomsCount >= Number(totalRooms || 99)}>
                  <Icon name="plus" size="16" />
                </button>
              </div>
              <button className={cn(styles.bookBtn, styles.selectedBtn)} onClick={handleSelect}>✓ Selected</button>
            </div>
          ) : (
            <button className={styles.bookBtn} onClick={handleSelect} style={{ flex: 1, maxWidth: 160 }}>SELECT ROOM</button>
          )}
        </div>
      </div>
      
      <ModalPortal>
        <AnimatePresence>
          {showModal && (
            <RoomModal 
              room={room} 
              listing={{ ...listing, scrollToAmenities: showModal?.scrollToAmenities }} 
              isSelected={isSelected}
              handleSelect={handleSelect}
              onClose={() => setShowModal(false)} 
            />
          )}
        </AnimatePresence>
      </ModalPortal>
    </div>
  );
};

/* ---------- RoomCards section ---------------------------------------- */
const RoomCards = ({ listing, onRoomSelect, selectedRooms = [], noContainer, onRoomsCountChange }) => {
  const rooms = listing?.rooms || listing?.roomTypes || listing?.room_types || listing?.stay?.rooms || [];
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
