import React, { useRef, useState, useEffect } from "react";
import cn from "classnames";
import styles from "./RoomCards.module.sass";
import Icon from "../../components/Icon";
import { useTheme } from "../../components/JUI/Theme";

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

/* ---------- Room Modal ---------------------------------------------- */
const RoomModal = ({ room, listing, onClose }) => {
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
  const cancellationPolicy = room.cancellationPolicy || room.cancellationTerms || listing?.privacyAndPolicy?.cancellationPolicyTemplate || listing?.cancellationPolicy;

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

  const seasonalPeriods = listing?.seasonalPeriods || [];

  useEffect(() => {
    // Background scroll lock
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }} onClick={onClose} />
      
      {/* Scrollbar CSS Injection */}
      <style>{`
        .modal-body-content::-webkit-scrollbar { display: none; }
        .modal-body-content { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div style={{ 
        position: "relative", background: W, width: "100%", maxWidth: 1100, maxHeight: isMobile ? "100vh" : "94vh", 
        borderRadius: isMobile ? 0 : 32, overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 1, 
        boxShadow: "0 40px 120px rgba(0,0,0,0.5)", border: `1px solid ${B}` 
      }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ 
          position: "absolute", top: isMobile ? 16 : 24, right: isMobile ? 16 : 24, width: 44, height: 44, borderRadius: "50%", 
          background: S, border: `1px solid ${B}`, display: "flex", alignItems: "center", 
          justifyContent: "center", cursor: "pointer", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", 
          transition: "all 0.3s ease", color: FG
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Hero Gallery Section */}
        <div style={{ height: 520, overflow: "hidden", background: "#0F0F0F", position: "relative", display: "flex" }}>
          {allImages.length > 0 ? (
            <>
              <div ref={galleryRef} style={{ display: "flex", width: "100%", height: "100%", overflowX: "hidden", scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {allImages.map((img, i) => (
                  <div key={i} style={{ minWidth: "100%", height: "100%", scrollSnapAlign: "start", position: "relative" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: galleryIndex === i ? 1 : 0.8, transition: "opacity 0.6s ease" }} />
                  </div>
                ))}
              </div>
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button onClick={() => scrollGallery('prev')} style={{ 
                    position: "absolute", left: isMobile ? 16 : 32, top: "50%", transform: "translateY(-50%)", 
                    width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", 
                    backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", 
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
                    color: "#fff", zIndex: 15, transition: "all 0.3s" 
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <button onClick={() => scrollGallery('next')} style={{ 
                    position: "absolute", right: isMobile ? 16 : 32, top: "50%", transform: "translateY(-50%)", 
                    width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", 
                    backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", 
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
                    color: "#fff", zIndex: 15, transition: "all 0.3s" 
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                </>
              )}

              <div style={{ 
                position: "absolute", bottom: 32, right: 32, background: "rgba(0,0,0,0.5)", 
                backdropFilter: "blur(8px)", color: "#fff", padding: "8px 18px", borderRadius: 100, 
                fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", zIndex: 15, 
                border: "1px solid rgba(255,255,255,0.1)" 
              }}>
                {galleryIndex + 1} <span style={{ opacity: 0.5, margin: "0 4px" }}>/</span> {allImages.length}
              </div>
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f1" }}>
              <Icon name="home" size="64" />
            </div>
          )}
        </div>

        {/* Details Body */}
        <div className="modal-body-content" style={{ padding: isMobile ? "40px 24px" : "60px 80px", overflowY: "auto", flex: 1, background: W }}>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: isMobile ? 48 : 100 }}>
            
            {/* Left Col: Core Details */}
            <div>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ 
                  fontSize: isMobile ? 32 : 52, fontWeight: 800, marginBottom: 24, 
                  fontFamily: "var(--font-fraunces, Georgia, serif)", color: FG, 
                  lineHeight: 1.1, letterSpacing: "-0.02em" 
                }}>{name}</h2>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                  {capacity != null && <span style={{ fontSize: 11, fontWeight: 800, padding: "8px 16px", background: S, borderRadius: 8, color: M, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${B}` }}>Capacity: {capacity} Guests</span>}
                  {totalRooms != null && <span style={{ fontSize: 11, fontWeight: 800, padding: "8px 16px", background: S, borderRadius: 8, color: M, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${B}` }}>{totalRooms} Rooms Available</span>}
                  {room.extraBedAllowed && <span style={{ fontSize: 11, fontWeight: 800, padding: "8px 16px", background: AL, borderRadius: 8, color: A, textTransform: "uppercase", letterSpacing: "0.1em", border: `1px solid ${A}` }}>Extra Bed Policy Applied</span>}
                </div>

                <div style={{ borderTop: `1px solid ${B}`, paddingTop: 24 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 16 }}>Room Narrative</h3>
                  <p style={{ fontSize: 18, lineHeight: 1.8, color: FG, fontWeight: 450, opacity: 0.9 }}>{desc}</p>
                </div>
              </div>

              {/* Bed Details Section */}
              {(bedInfo || bedSize) && (
                <div style={{ paddingTop: 32, borderTop: `1px solid ${B}` }}>
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 20 }}>Accommodation Specs</h3>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 40 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: M, textTransform: "uppercase", marginBottom: 6 }}>Configuration</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: FG }}>{bedInfo || "Standard Configuration"}</p>
                    </div>
                    {bedSize && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: M, textTransform: "uppercase", marginBottom: 6 }}>Dimension</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: FG }}>{bedSize}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Amenities, Inclusions, Policy */}
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              
              {/* Amenities */}
              {features.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 24 }}>Amenities & Features</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                    {features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: A, flexShrink: 0 }} />
                        <span style={{ fontSize: 15, color: FG, fontWeight: 600 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclusions */}
              {Array.isArray(inclusions) && inclusions.length > 0 && (
                <div style={{ padding: 28, background: S, borderRadius: 24, border: `1px solid ${B}` }}>
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 20 }}>Stay Inclusions</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {inclusions.map((inc, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: FG, fontWeight: 600 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        {typeof inc === 'string' ? inc : (inc.name || inc.label || inc.title)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal Periods */}
              {seasonalPeriods.length > 0 && (
                <div style={{ padding: 28, background: AL, borderRadius: 24, border: `1px solid ${A}` }}>
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: A, marginBottom: 20 }}>Seasonal Availability</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {seasonalPeriods.map((p, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, fontSize: 14, color: FG, fontWeight: 600 }}>
                        <span style={{ flex: 1 }}>{p.seasonName || p.name || p.label || `Season ${i + 1}`}</span>
                        <span style={{ fontSize: 12, opacity: 0.8, whiteSpace: "nowrap" }}>{formatDate(p.startDate)} – {formatDate(p.endDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              {cancellationPolicy && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 16 }}>Cancellation Guidelines</h3>
                  <div style={{ padding: 24, background: S, borderRadius: 24, border: `1px solid ${B}` }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: FG, fontWeight: 500, opacity: 0.85 }}>
                      {typeof cancellationPolicy === 'string' ? cancellationPolicy : "Standard cancellation terms apply."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




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
  const displayPrice = formatPrice(rawPrice);

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
                ? <>₹{displayPrice}<span className={styles.perNight}> / night</span></>
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
      
      {showModal && <RoomModal room={room} listing={{ ...listing, scrollToAmenities: showModal?.scrollToAmenities }} onClose={() => setShowModal(false)} />}
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
