import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Share2,
  Phone,
  Mail,
  Star,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Compass,
  Check,
  User,
  Layers,
  Heart
} from "lucide-react";
import { useTheme } from "../../components/JUI/Theme";
import { buildExperienceUrl } from "../../utils/experienceUrl";

const categoryTabs = [
  { key: "experiences", title: "Experiences", icon: Compass },
  { key: "events", title: "Events", icon: Sparkles },
  { key: "stays", title: "Stays", icon: Layers },
  { key: "places", title: "Places", icon: MapPin },
  { key: "foodMenus", title: "Food", icon: Tag },
];

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("data:")) return url;
  if (url.includes("/") && !url.startsWith("/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  if (url.startsWith("/")) return url;
  return null;
};

const hasRenderableCover = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.includes("data:image/gif;base64") || url.includes("R0lGODlhAQABA")) return false;
  if (url.startsWith("/")) return true;
  if (url.startsWith("data:")) return true;
  if (!(url.startsWith("http://") || url.startsWith("https://"))) return false;
  if (!url.includes("lkpleadstoragedev.blob.core.windows.net")) return true;
  return url.includes("sig=") && url.includes("sv=");
};

const getIdByType = (listing, type) => {
  const commonId = listing?.itemId ?? listing?.id ?? listing?._id;
  if (type === "events") return listing?.eventId ?? listing?.event_id ?? commonId;
  if (type === "stays") return listing?.stayId ?? listing?.stay_id ?? commonId;
  if (type === "places") return listing?.placeId ?? listing?.place_id ?? commonId;
  if (type === "foodMenus") return listing?.foodMenuId ?? listing?.food_menu_id ?? commonId;
  return listing?.experienceId ?? listing?.listingId ?? listing?.listing_id ?? commonId;
};

const getTitleByType = (listing, type) => {
  if (type === "stays") return listing?.propertyName || listing?.title || "Stay";
  if (type === "places") return listing?.placeName || listing?.title || "Place";
  if (type === "foodMenus") return listing?.menuName || listing?.title || "Food Menu";
  return listing?.title || "Listing";
};

const getPriceByType = (listing) => (
  listing?.individualPrice ?? listing?.startingPrice ?? listing?.price ?? 0
);

const getUrlByType = (listing, type) => {
  const id = getIdByType(listing, type);
  if (!id && id !== 0) return "/listings";
  if (type === "events") return `/event?id=${id}`;
  if (type === "stays") return `/stay-details?id=${id}`;
  if (type === "places") return `/place-details?id=${id}`;
  if (type === "foodMenus") return `/food-details?id=${id}`;
  return buildExperienceUrl(getTitleByType(listing, type), id);
};


export default function MobileHostProfileView({
  host,
  hostData,
  hostName = "Host",
  joinedDate = "2024",
  hostPhone = "",
  hostEmail = "",
  businessInterests = [],
  tabListings = {},
}) {
  const { tokens: { A, FG, M, B, W, BG, S, AL }, theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTabKey, setActiveTabKey] = useState(() => {
    const firstNonEmpty = categoryTabs.find(
      (t) => Array.isArray(tabListings?.[t.key]) && tabListings[t.key].length > 0
    );
    return firstNonEmpty ? firstNonEmpty.key : "experiences";
  });

  const [copiedShare, setCopiedShare] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Total count of listings across all categories
  const totalListingsCount = useMemo(() => {
    return Object.values(tabListings || {}).reduce((acc, list) => {
      return acc + (Array.isArray(list) ? list.length : 0);
    }, 0);
  }, [tabListings]);

  // Formatted interests array
  const formattedInterests = useMemo(() => {
    if (!Array.isArray(businessInterests)) return [];
    return businessInterests
      .map((item) => (typeof item === "string" ? item : item?.name || item?.businessInterestName || item?.code || ""))
      .filter(Boolean);
  }, [businessInterests]);

  const hostBio = typeof host?.bio === "string" && host.bio.trim()
    ? host.bio.trim()
    : typeof host?.description === "string" && host.description.trim()
      ? host.description.trim()
      : "";

  const isBioLong = hostBio.length > 150;
  const displayedBio = isBioLong && !bioExpanded ? `${hostBio.slice(0, 150)}...` : hostBio;

  const handleShare = async () => {
    const shareData = {
      title: `${hostName} - Host Profile`,
      text: `Check out ${hostName}'s profile and listings on Little Known Planet.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // ignore
    }
  };

  const activeRawListings = Array.isArray(tabListings?.[activeTabKey])
    ? tabListings[activeTabKey]
    : [];

  const avatarUrl =
    host?.profilePhotoUrl ||
    host?.profileImageUrl ||
    hostData?.profilePhotoUrl ||
    hostData?.profileImageUrl ||
    host?.avatar;

  return (
    <div
      style={{
        width: "100%",
        padding: "16px 14px 48px",
        boxSizing: "border-box",
        background: BG,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* ── 1. HERO PROFILE CARD ── */}
      <div
        style={{
          position: "relative",
          borderRadius: 24,
          padding: "24px 18px",
          overflow: "hidden",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 151, 178, 0.15)"}`,
          background: isDark
            ? "linear-gradient(135deg, rgba(0, 151, 178, 0.2) 0%, rgba(17, 24, 39, 0.85) 50%, rgba(10, 10, 10, 0.98) 100%)"
            : "linear-gradient(135deg, rgba(0, 151, 178, 0.08) 0%, rgba(224, 242, 254, 0.45) 45%, #FFFFFF 100%)",
          boxShadow: isDark
            ? "0 12px 32px rgba(0, 0, 0, 0.4)"
            : "0 12px 28px rgba(0, 151, 178, 0.08)",
        }}
      >
        {/* Soft Background Ambient Light Spots */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(0, 151, 178, 0.15)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Top Row: Avatar + Name + Share */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Avatar with Verified Ring */}
            <div
              style={{
                position: "relative",
                width: 80,
                height: 80,
                flexShrink: 0,
                borderRadius: "50%",
                padding: 3,
                background: "linear-gradient(135deg, #0097B2, #38BDF8)",
                boxShadow: "0 8px 20px rgba(0, 151, 178, 0.25)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: isDark ? "#1E293B" : "#F1F5F9",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={hostName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hostName)}&backgroundColor=0097B2&color=ffffff`;
                    }}
                  />
                ) : (
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hostName)}&backgroundColor=0097B2&color=ffffff`}
                    alt={hostName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>

              {/* Verified check badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#0097B2",
                  border: `2px solid ${isDark ? "#0A0A0A" : "#FFFFFF"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0, 151, 178, 0.4)",
                }}
              >
                <Check size={14} strokeWidth={3} />
              </div>
            </div>

            {/* Name + Badges */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: A,
                  }}
                >
                  Verified Host
                </span>
                <ShieldCheck size={13} color={A} />
              </div>

              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  margin: 0,
                  color: FG,
                  letterSpacing: "-0.02em",
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {hostName}
              </h1>

              {host?.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: M, fontSize: 12 }}>
                  <MapPin size={12} color={A} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {host.location}
                  </span>
                </div>
              )}
            </div>

            {/* Share Button Icon */}
            <button
              type="button"
              onClick={handleShare}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: isDark ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF",
                border: `1px solid ${B}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: copiedShare ? "#10B981" : FG,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                flexShrink: 0,
                transition: "all 0.2s ease",
              }}
              title="Share profile"
              aria-label="Share profile"
            >
              {copiedShare ? <Check size={18} /> : <Share2 size={18} />}
            </button>
          </div>

          {/* Stat Badges Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
              marginTop: 4,
            }}
          >
            <div
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.7)",
                border: `1px solid ${B}`,
                borderRadius: 14,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, color: FG, lineHeight: 1.2 }}>
                {totalListingsCount}
              </span>
              <span style={{ fontSize: 10, color: M, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                Listings
              </span>
            </div>

            <div
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.7)",
                border: `1px solid ${B}`,
                borderRadius: 14,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={13} color={A} />
                <span style={{ fontSize: 13, fontWeight: 700, color: FG, lineHeight: 1.2 }}>
                  {joinedDate ? joinedDate.split(",")[1]?.trim() || joinedDate.split(" ")[2] || "2024" : "2024"}
                </span>
              </div>
              <span style={{ fontSize: 10, color: M, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                Joined
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. ABOUT HOST SECTION ── */}
      <div
        style={{
          borderRadius: 20,
          background: W,
          border: `1px solid ${B}`,
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: AL,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: A,
            }}
          >
            <User size={16} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: FG }}>
            About the Host
          </h2>
        </div>

        {hostBio ? (
          <div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: FG,
                margin: 0,
                fontWeight: 400,
                opacity: 0.9,
              }}
            >
              {displayedBio}
            </p>
            {isBioLong && (
              <button
                type="button"
                onClick={() => setBioExpanded(!bioExpanded)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "6px 0 0 0",
                  color: A,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                {bioExpanded ? "Show less" : "Read more"}
                {bioExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: M, margin: 0, lineHeight: 1.5 }}>
            Passionate host curating authentic local journeys and unique stays on Little Known Planet.
          </p>
        )}

        {/* Info Chips: Location & Interests */}
        {(host?.location || formattedInterests.length > 0) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              paddingTop: 8,
              borderTop: `1px solid ${B}`,
            }}
          >
            {host?.location && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 100,
                  background: S,
                  fontSize: 12,
                  fontWeight: 600,
                  color: FG,
                }}
              >
                <MapPin size={13} color={A} />
                <span>Lives in {host.location}</span>
              </div>
            )}

            {formattedInterests.map((interest, idx) => (
              <div
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 100,
                  background: AL,
                  fontSize: 12,
                  fontWeight: 600,
                  color: A,
                }}
              >
                <Sparkles size={12} color={A} />
                <span>{interest}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. LISTINGS SECTION ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Section Heading */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: FG }}>
              {hostName}'s Listings
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: A,
                background: AL,
                padding: "2px 8px",
                borderRadius: 100,
              }}
            >
              {totalListingsCount}
            </span>
          </div>
        </div>

        {/* Scrollable Category Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
          }}
        >
          {categoryTabs.map((tab) => {
            const count = Array.isArray(tabListings?.[tab.key]) ? tabListings[tab.key].length : 0;
            const isActive = tab.key === activeTabKey;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTabKey(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  border: isActive ? `1px solid ${A}` : `1px solid ${B}`,
                  background: isActive ? A : W,
                  color: isActive ? "#FFFFFF" : FG,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  boxShadow: isActive ? "0 4px 12px rgba(0, 151, 178, 0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <TabIcon size={14} color={isActive ? "#FFFFFF" : M} />
                <span>{tab.title}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    opacity: isActive ? 0.9 : 0.6,
                  }}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Listing Cards Grid - 2 per row on mobile */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {activeRawListings.length > 0 ? (
            activeRawListings.map((rawListing, index) => {
              const rawId = getIdByType(rawListing, activeTabKey);
              const cardId = rawId !== undefined && rawId !== null ? rawId : index;
              const title = getTitleByType(rawListing, activeTabKey);
              const linkUrl = getUrlByType(rawListing, activeTabKey);
              const price = Number(getPriceByType(rawListing)) || 0;
              const priceFormatted = price > 0 ? `₹${price.toLocaleString("en-IN")}` : null;
              const ratingVal = Number(rawListing?.averageRating ?? rawListing?.rating ?? 0);

              const rawCover =
                rawListing?.coverImageUrl ||
                rawListing?.coverPhotoUrl ||
                rawListing?.cover_image_url ||
                rawListing?.cover_photo_url ||
                rawListing?.imageUrl ||
                rawListing?.image ||
                rawListing?.thumbnailUrl ||
                rawListing?.photoUrl ||
                (Array.isArray(rawListing?.images) && rawListing.images[0]) ||
                (Array.isArray(rawListing?.photos) && rawListing.photos[0]);

              const formattedCover = formatImageUrl(rawCover);
              const coverUrl = hasRenderableCover(formattedCover) ? formattedCover : null;

              const locationText = [rawListing?.location, rawListing?.state, rawListing?.country]
                .filter(Boolean)
                .join(", ") || rawListing?.meetingLocationName || rawListing?.city;

              const isClosed =
                String(rawListing?.badge || "").trim().toLowerCase() === "closed" ||
                rawListing?.isClosed === true ||
                String(rawListing?.status || "").trim().toLowerCase() === "closed";

              return (
                <Link
                  key={`${activeTabKey}-${cardId}`}
                  to={linkUrl}
                  style={{
                    textDecoration: "none",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: W,
                    border: `1px solid ${B}`,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: isDark
                      ? "0 4px 16px rgba(0,0,0,0.3)"
                      : "0 4px 14px rgba(0,0,0,0.04)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {/* Card Image Banner */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "72%", // aspect ratio for 2-column cards
                      overflow: "hidden",
                      background: S,
                    }}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={title}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}

                    {/* Category Tag Top Left */}
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        padding: "3px 7px",
                        borderRadius: 100,
                        background: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        color: "#FFFFFF",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {activeTabKey === "experiences"
                        ? "Experience"
                        : activeTabKey === "events"
                          ? "Event"
                          : activeTabKey === "stays"
                            ? "Stay"
                            : activeTabKey === "places"
                              ? "Place"
                              : "Food"}
                    </div>

                    {/* Closed Badge if closed */}
                    {isClosed && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          padding: "3px 7px",
                          borderRadius: 100,
                          background: "rgba(239, 68, 68, 0.9)",
                          color: "#FFFFFF",
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Closed
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div
                    style={{
                      padding: "10px 10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      flex: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      {/* Title */}
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: FG,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          letterSpacing: "-0.01em",
                          minHeight: 34,
                        }}
                      >
                        {title}
                      </h3>

                      {/* Location */}
                      {locationText && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                            color: M,
                            marginTop: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <MapPin size={11} color={A} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {locationText}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      {/* Divider */}
                      <div style={{ height: 1, background: B, margin: "6px 0 6px" }} />

                      {/* Bottom Row: Rating & Price */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 4,
                        }}
                      >
                        {/* Rating */}
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={11} fill="#F59E0B" color="#F59E0B" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: FG }}>
                            {ratingVal > 0 ? ratingVal.toFixed(1) : "New"}
                          </span>
                        </div>

                        {/* Price */}
                        {priceFormatted ? (
                          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: A,
                                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                              }}
                            >
                              {priceFormatted}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, color: M, fontWeight: 500 }}>
                            Explore
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                borderRadius: 18,
                background: W,
                border: `1px dashed ${B}`,
                padding: "36px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 8,
              }}
            >
              <Compass size={28} color={M} />
              <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>
                No {activeTabKey} listed yet
              </span>
              <span style={{ fontSize: 12, color: M }}>
                Check back soon or explore other categories above.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
