import React, { useState } from "react";

/* ---------- helpers -------------------------------------------------- */
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
  // prefer gallery media first, then dedicated cover field
  const media = room.media || [];
  const firstMedia = media[0];
  if (firstMedia) {
    const u = typeof firstMedia === "string" ? firstMedia : firstMedia.url || firstMedia.src;
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

/* ---------- RoomCard -------------------------------------------------- */
const RoomCard = ({ room }) => {
  const allPlans = room.mealPlanPricing ? Object.keys(room.mealPlanPricing) : [];

  // Add legacy flat-price plans if no mealPlanPricing map
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

  return (
    <div style={styles.card}>
      {/* ---- image ---- */}
      <div style={styles.imgWrap}>
        {coverImage ? (
          <img src={coverImage} alt={name} style={styles.img} />
        ) : (
          <div style={styles.imgPlaceholder}>
            <span style={{ fontSize: 40 }}>🛏</span>
          </div>
        )}
        {totalRooms != null && (
          <span style={styles.badge}>{totalRooms} rooms</span>
        )}
      </div>

      {/* ---- body ---- */}
      <div style={styles.body}>
        <h4 style={styles.roomName}>{name}</h4>

        {capacity != null && (
          <p style={styles.capacity}>👤 Up to {capacity} guest{capacity !== 1 ? "s" : ""}</p>
        )}

        {description ? (
          <p style={styles.desc}>{description}</p>
        ) : (
          <p style={{ ...styles.desc, fontStyle: "italic", opacity: 0.5 }}>No description available</p>
        )}

        {/* ---- meal plan selector ---- */}
        {allPlans.length > 0 && (
          <div style={styles.planBox}>
            <label style={styles.planLabel}>Meal Plan</label>
            {allPlans.length > 1 ? (
              <select
                style={styles.select}
                value={plan || ""}
                onChange={(e) => setPlan(e.target.value)}
              >
                {allPlans.map((c) => (
                  <option key={c} value={c}>{getMealPlanLabel(c)}</option>
                ))}
              </select>
            ) : (
              <span style={styles.singlePlan}>{getMealPlanLabel(allPlans[0])}</span>
            )}
          </div>
        )}

        {/* ---- price + CTA ---- */}
        <div style={styles.foot}>
          <div>
            <span style={styles.priceLabel}>From</span>
            <div style={styles.price}>
              {displayPrice ? (
                <>INR {displayPrice}<span style={styles.perNight}>&nbsp;/ night</span></>
              ) : (
                <span style={{ fontSize: 14, opacity: 0.5 }}>Price on request</span>
              )}
            </div>
          </div>
          <button
            style={styles.btn}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- RoomCards (section) -------------------------------------- */
const RoomCards = ({ listing }) => {
  const rooms =
    listing?.rooms ||
    listing?.roomTypes ||
    listing?.room_types ||
    listing?.stay?.rooms ||
    [];

  if (!Array.isArray(rooms) || rooms.length === 0) return null;

  return (
    <div className="section" style={styles.section}>
      <div className="container">
        <h2 style={styles.sectionTitle}>Available Rooms</h2>
        <div style={styles.grid}>
          {rooms.map((room, idx) => (
            <RoomCard key={room.roomId ?? room.id ?? idx} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- inline styles -------------------------------------------- */
const styles = {
  section: {
    marginTop: -80,
    marginBottom: 64,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sectionTitle: {
    marginBottom: 32,
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 24,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(10px)",
    transition: "box-shadow 0.25s, transform 0.25s",
    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
  },
  imgWrap: {
    position: "relative",
    paddingBottom: "56%",
    background: "#1a1d27",
    overflow: "hidden",
  },
  img: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imgPlaceholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#1a1d27,#2c2f3e)",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: "4px 12px",
    borderRadius: 24,
    background: "#0097B2",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: 24,
  },
  roomName: {
    margin: "0 0 8px",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  capacity: {
    margin: "0 0 8px",
    fontSize: 13,
    opacity: 0.65,
    fontWeight: 500,
  },
  desc: {
    margin: "0 0 16px",
    fontSize: 14,
    lineHeight: 1.6,
    opacity: 0.7,
    flexGrow: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  planBox: {
    marginBottom: 20,
  },
  planLabel: {
    display: "block",
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.55,
  },
  select: {
    width: "100%",
    height: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
  },
  singlePlan: {
    fontSize: 13,
    fontWeight: 500,
    opacity: 0.75,
  },
  foot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  priceLabel: {
    display: "block",
    fontSize: 11,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  price: {
    fontSize: 22,
    fontWeight: 700,
  },
  perNight: {
    fontSize: 13,
    opacity: 0.55,
  },
  btn: {
    height: 40,
    padding: "0 22px",
    borderRadius: 20,
    background: "#0097B2",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    transition: "opacity 0.2s",
    flexShrink: 0,
  },
};

export default RoomCards;
