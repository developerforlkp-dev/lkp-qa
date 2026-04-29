import React, { useRef, useState, useEffect } from "react";
import cn from "classnames";
import styles from "./RoomCards.module.sass";
import Icon from "../../components/Icon";
import { useTheme } from "../../components/JUI/Theme";

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
  const name = room.roomName || room.roomTypeName || room.name || "Room Details";
  const desc = room.roomDescription || room.description || room.shortDescription;
  const capacity = room.maxGuests || (room.maxAdults ? room.maxAdults + (room.maxChildren || 0) : null);
  const totalRooms = room.totalRooms || room.totalUnits || null;
  const features = getRoomFeatures(room, listing);
  const scrollRef = useRef(null);

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

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", width: "100%", maxWidth: 900, maxHeight: "90vh", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 1, boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Gallery Grid */}
        {allImages.length > 0 && (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: allImages.length > 1 ? "1.5fr 1fr" : "1fr", 
            gap: 4, 
            height: 440, 
            background: "#f3f3f1" 
          }}>
            {/* Main Image */}
            <div style={{ position: "relative", overflow: "hidden" }}>
              <img 
                src={allImages[0]} 
                alt="" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
            </div>

            {/* Secondary Images Grid */}
            {allImages.length > 1 && (
              <div style={{ 
                display: "grid", 
                gridTemplateRows: `repeat(${Math.min(allImages.length - 1, 2)}, 1fr)`, 
                gap: 4 
              }}>
                {allImages.slice(1, 3).map((img, i) => (
                  <div key={i} style={{ position: "relative", overflow: "hidden" }}>
                    <img 
                      src={img} 
                      alt="" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                    {i === 1 && allImages.length > 3 && (
                      <div style={{ 
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", 
                        display: "flex", alignItems: "center", justifyContent: "center", 
                        color: "#fff", fontSize: 20, fontWeight: 700 
                      }}>
                        +{allImages.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Details Body */}
        <div style={{ padding: "40px 48px", overflowY: "auto", flex: 1, background: "#FBFBF9" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-fraunces, Georgia, serif)", color: "#0F0F0F" }}>{name}</h2>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
            {capacity != null && <span style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", background: "#E6E6E3", borderRadius: 8, color: "#0F0F0F" }}>Max {capacity} Guests</span>}
            {totalRooms != null && <span style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", background: "#E6E6E3", borderRadius: 8, color: "#0F0F0F" }}>{totalRooms} Units Available</span>}
            {room.extraBedAllowed && <span style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", background: "#E6E6E3", borderRadius: 8, color: "#0F0F0F" }}>Extra Bed Allowed</span>}
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.7, color: "#555", marginBottom: 40 }}>{desc}</p>

          {features.length > 0 && (
            <div ref={scrollRef} style={{ marginBottom: 40 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#0F0F0F" }}>Room Amenities</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0097B2" }} />
                    <span style={{ fontSize: 15, color: "#333", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        {totalRooms != null && <span className={styles.badge}>{totalRooms} UNITS</span>}
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
