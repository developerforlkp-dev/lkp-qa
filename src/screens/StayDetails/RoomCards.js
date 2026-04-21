import React, { useRef, useState, useEffect } from "react";
import cn from "classnames";
import styles from "./RoomCards.module.sass";
import Icon from "../../components/Icon";

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

const resolveCoverImage = (room) => {
  const media = room.media || [];
  const first = media[0];
  if (first) {
    const u = typeof first === "string" ? first : first.url || first.src;
    if (u) return u;
  }
  return room.coverImageUrl || room.coverPhotoUrl || room.coverImage || null;
};

const getPriceForPlan = (room, code) => {
  if (room.mealPlanPricing && room.mealPlanPricing[code]) {
    const mp = room.mealPlanPricing[code];
    return mp.b2cPrice || mp.price || null;
  }
  const flat = { BB: "bbPrice", CP: "cpPrice", MAP: "mapPrice", AP: "apPrice", EP: "epPrice" };
  return flat[code] ? room[flat[code]] : room.b2cPrice || room.price || null;
};

/* ---------- Custom Dropdown ------------------------------------------ */
const CustomDropdown = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className={styles.dropdown}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((p) => !p)}
        className={cn(styles.dropdownTrigger, { [styles.open]: open })}
      >
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.label : "Select…"}
        </span>
        <span className={cn(styles.dropdownArrow, { [styles.open]: open })}>▼</span>
      </div>

      {/* Dropdown list */}
      {open && (
        <div className={styles.dropdownList}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(styles.dropdownOption, { [styles.selected]: opt.value === value })}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- RoomCard -------------------------------------------------- */
const RoomCard = ({ room, onRoomSelect, isSelected, roomsCount, onRoomsCountChange }) => {
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

  const handlePlanChange = (code) => {
    setPlan(code);
    // Immediately update booking card if this room is already selected
    if (isSelected && onRoomSelect) {
      onRoomSelect(room.roomId ?? room.id, code);
    }
  };

  const handleSelect = () => {
    if (onRoomSelect) onRoomSelect(room.roomId ?? room.id, plan);
  };

  return (
    <div className={cn(styles.card, { [styles.cardSelected]: isSelected })}>
      {/* Image */}
      <div className={styles.imgWrap}>
        {coverImage
          ? <img src={coverImage} alt={name} className={styles.img} />
          : <div className={styles.imgPlaceholder}><Icon name="home" size="40" /></div>
        }
        {totalRooms != null && <span className={styles.badge}>{totalRooms} rooms</span>}
        {isSelected && <span className={styles.selectedBadge}>Selected</span>}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h4 className={styles.roomName}>{name}</h4>
        {capacity != null && (
          <div className={styles.capacity}>
            <Icon name="user" size="14" />
            <span>Up to {capacity} guest{capacity !== 1 ? "s" : ""}
              {room.maxAdults > 0 && <> · {room.maxAdults} adults{room.maxChildren > 0 ? `, ${room.maxChildren} children` : ""}</>}
            </span>
          </div>
        )}
        {description && <p className={styles.desc}>{description}</p>}

        {/* Meal plan */}
        {allPlans.length > 0 && (
          <div className={styles.planSection}>
            <div className={styles.planLabel}>Meal Plan</div>
            {allPlans.length > 1 ? (
              <CustomDropdown
                options={allPlans.map((c) => ({ value: c, label: getMealPlanLabel(c) }))}
                value={plan}
                onChange={handlePlanChange}
              />
            ) : (
              <div className={styles.singlePlan}>
                {getMealPlanLabel(allPlans[0])}
              </div>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className={styles.foot}>
          <div className={styles.price}>
            <span className={styles.priceLabel}>From</span>
            <div className={styles.amount}>
              {displayPrice
                ? <>INR {displayPrice}<span className={styles.perNight}>&nbsp;/ night</span></>
                : <span style={{ opacity: 0.5 }}>Price on request</span>
              }
            </div>
          </div>
          {isSelected ? (
            <div className={styles.counterWrap}>
              <button 
                className={styles.counterBtn} 
                onClick={() => onRoomsCountChange(Math.max(1, roomsCount - 1))}
                disabled={roomsCount <= 1}
              >
                <Icon name="minus" size="16" />
              </button>
              <span className={styles.countValue}>{roomsCount}</span>
              <button 
                className={styles.counterBtn} 
                onClick={() => onRoomsCountChange(Math.min(Number(totalRooms || 99), roomsCount + 1))}
                disabled={roomsCount >= Number(totalRooms || 99)}
              >
                <Icon name="plus" size="16" />
              </button>
            </div>
          ) : (
            <button
              className={cn(styles.bookBtn, { [styles.selected]: isSelected })}
              onClick={handleSelect}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- RoomCards section ---------------------------------------- */
const RoomCards = ({ listing, onRoomSelect, selectedRoomId, noContainer, roomsCount, onRoomsCountChange }) => {
  const rooms =
    listing?.rooms ||
    listing?.roomTypes ||
    listing?.room_types ||
    listing?.stay?.rooms ||
    [];

  if (!Array.isArray(rooms) || rooms.length === 0) return null;

  const content = (
    <>
      <h2 className={styles.title}>Available Rooms</h2>
      <div className={styles.list}>
        {rooms.map((room, idx) => {
          const roomId = String(room.roomId ?? room.id ?? idx);
          return (
            <RoomCard
              key={roomId}
              room={room}
              onRoomSelect={onRoomSelect}
              isSelected={selectedRoomId === roomId}
              roomsCount={roomsCount}
              onRoomsCountChange={onRoomsCountChange}
            />
          );
        })}
      </div>
    </>
  );

  if (noContainer) {
    return <div style={{ marginTop: '32px', marginBottom: '48px' }}>{content}</div>;
  }

  return (
    <div className={cn("section", styles.section)}>
      <div className="container">
        {content}
      </div>
    </div>
  );
};

export default RoomCards;
