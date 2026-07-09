import React, { useState, useRef, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronDown, Clock, User, Zap, Baby, Languages,
  ShieldCheck, MapPin, Phone, Mail, Star, Sparkles, Share2, Info, Compass, Heart
} from "lucide-react";
import { useTheme } from "../../components/JUI/Theme";
import PhotoView from "../../components/PhotoView";
import FullScreenImage from "../../components/FullScreenImage";
import Favorite from "../../components/Favorite";
import Icon from "../../components/Icon";
import { BookingSystem } from "../../components/JUI/BookingSystem";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import "./MobileExperienceView.css";

/* ── helpers (copied from parent to avoid coupling) ── */
const fmt = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  const [p, q] = raw.split("?");
  const n = String(p).replaceAll("%2F", "/").replace(/\\/g, "/");
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodeURI(n)}${q ? `?${q}` : ""}`;
};

const actImg = (a) => {
  const first = Array.isArray(a?.images) ? a.images[0] : null;
  if (first) return fmt(typeof first === "string" ? first : first.url || first.fileUrl || first.imageUrl);
  return fmt(a?.imageUrl || a?.fileUrl || a?.image);
};

const actImages = (a) => {
  if (Array.isArray(a?.images) && a.images.length > 0) {
    return a.images.map(i => fmt(typeof i === "string" ? i : i.url || i.fileUrl || i.imageUrl)).filter(Boolean);
  }
  return [actImg(a)].filter(Boolean);
};

/* ── Accordion component (pure CSS) ── */
function Accordion({ title, icon, children, borderColor, bgColor, fgColor, mColor, accentColor }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mob-tip-card" style={{ borderColor }}>
      <button className="mob-tip-header" onClick={() => setOpen(!open)} style={{ color: fgColor }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        <ChevronDown size={16} className={`mob-tip-chevron${open ? " open" : ""}`} style={{ color: mColor }} />
      </button>
      <div className={`mob-tip-body${open ? " open" : ""}`}>
        <div style={{ color: mColor }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Early Bird Ticker ── */
const EarlyBirdTicker = ({ discounts, A, FG, isDark }) => {
  const [index, setIndex] = useState(0);

  React.useEffect(() => {
    if (!discounts || discounts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % discounts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [discounts]);

  if (!discounts || discounts.length === 0) return null;

  return (
    <div style={{ display: "grid", height: 20, alignItems: "center", overflow: "hidden" }}>
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            gridArea: "1 / 1",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isDark ? "#FFFFFF" : "#000000",
            fontWeight: 700,
            whiteSpace: "nowrap",
            display: "block"
          }}
        >
          <span style={{ opacity: 0.7 }}>Book</span>{" "}
          <span style={{ color: isDark ? "#38BDF8" : "#0284C7", fontWeight: 800 }}>
            {discounts[index].daysInAdvance} Days
          </span>{" "}
          <span style={{ opacity: 0.7 }}>Advance:</span>{" "}
          <span style={{ color: isDark ? "#4ADE80" : "#16A34A", fontWeight: 800 }}>
            {discounts[index].percentage}% OFF
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN MOBILE VIEW
   ════════════════════════════════════════════════════════════ */
export default function MobileExperienceView({
  listing, hostData, leadData, galleryItems,
  selectedAddOns, handleUpdateAddonQuantity,
  reviews, reviewSummary, eligibleBookings,
  history, id, formatImageUrl: parentFmt,
  description, primaryCategoryId, currentListingId,
  fallbackLocationValues, fallbackTagValues, fallbackSpecialLabelValues,
  displayHostName, hostPhone, hostEmail,
  displayTags, navigateToHostProfile,
  normalizedReviews,
}) {
  const { tokens: { A, FG, M, B, W, BG, S, AL, AH }, theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialDateStr = queryParams.get("date");
  const initialGuestsStr = queryParams.get("guests");
  const initialAdultsStr = queryParams.get("adults");
  const initialChildrenStr = queryParams.get("children");
  const initialGuests = initialAdultsStr || initialChildrenStr 
    ? { adults: Number(initialAdultsStr) || 0, children: Number(initialChildrenStr) || 0 }
    : (initialGuestsStr ? Number(initialGuestsStr) : null);

  /* ── local state ── */
  const [descExpanded, setDescExpanded] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activityPhotoVisible, setActivityPhotoVisible] = useState(false);
  const [activityPhotoIndex, setActivityPhotoIndex] = useState(0);
  const [selectedActivityImages, setSelectedActivityImages] = useState([]);
  const [addonPhotoVisible, setAddonPhotoVisible] = useState(false);
  const [selectedAddonImages, setSelectedAddonImages] = useState([]);
  const [addonPhotoIndex, setAddonPhotoIndex] = useState(0);
  const galleryRef = useRef(null);

  /* ── gallery scroll handler ── */
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsFooterVisible(entry.isIntersecting);
      });
    }, { threshold: 0.01 });

    const interval = setInterval(() => {
      const footer = document.getElementById("main-footer");
      if (footer) {
        observer.observe(footer);
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  const handleGalleryScroll = useCallback(() => {
    if (!galleryRef.current) return;
    const el = galleryRef.current;
    const itemWidth = el.querySelector(".mob-gallery-item")?.offsetWidth || 280;
    const idx = Math.round(el.scrollLeft / (itemWidth + 12));
    setGalleryIndex(idx);
  }, []);

  /* ── share handler ── */
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: listing?.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (_) { }
  };

  /* ── pricing ── */
  const basePrice = listing?.price || listing?.basePrice || listing?.startingPrice || 0;

  /* ── tags ── */
  const rawTags = useMemo(() => {
    if (Array.isArray(listing?.tags) && listing.tags.length > 0)
      return listing.tags.map(t => (typeof t === "string" ? t : t?.name || t?.tag || "")).filter(Boolean);
    if (Array.isArray(displayTags) && displayTags.length > 0)
      return displayTags.map(t => (typeof t === "string" ? t : t?.name || t?.tag || "")).filter(Boolean);
    return [];
  }, [listing?.tags, displayTags]);

  /* ── gallery items ── */
  const imgs = galleryItems.length > 0 ? galleryItems : [fmt(listing?.coverPhotoUrl)].filter(Boolean);

  /* ── activities ── */
  const activities = listing?.keyActivities || listing?.activities || [];

  /* ── addons ── */
  const addons = useMemo(() => {
    const rawCategories = listing?.addOnCategories || listing?.addonCategories || [];
    if (rawCategories.length > 0) return rawCategories.flatMap(c => c.addOns || c.addons || []);
    return listing?.addOns || listing?.addons || [];
  }, [listing]);

  /* ── reviews ── */
  const revs = normalizedReviews || [];

  return (
    <div className="mob-exp" style={{ background: BG, minHeight: "100vh", paddingBottom: 0 }}>

      {/* ╔═══════════════════════════════════╗
          ║         HERO SECTION              ║
          ╚═══════════════════════════════════╝ */}
      <div className="mob-hero">
        <img
          className="mob-hero-img"
          src={fmt(listing?.coverPhotoUrl) || "/images/content/placeholder.jpg"}
          alt={listing?.title || "Experience"}
          style={{ filter: isDark ? "brightness(0.7)" : "brightness(0.85)" }}
        />
        <div className="mob-hero-gradient" />

        {/* Top controls */}
        <div style={{ position: "absolute", top: 24, left: 20, right: 20, display: "flex", justifyContent: "space-between", zIndex: 10 }}>
          <button onClick={() => history.goBack()} style={{ width: 44, height: 44, borderRadius: "50%", background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <ChevronLeft size={22} color={isDark ? "#FFFFFF" : "#111111"} />
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <Favorite itemType="listing" itemId={id}>
              {({ saved, onClick }) => (
                <button onClick={onClick} style={{ width: 44, height: 44, borderRadius: "50%", background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", flexShrink: 0 }}>
                <style>{`
                  .exp-save-icon-${id} svg {
                    fill: ${saved ? "#0097B2" : (isDark ? "#FFFFFF" : "#111111")};
                    transition: fill 0.3s ease;
                  }
                `}</style>
                <div className={`exp-save-icon-${id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={saved ? "heart-fill" : "heart"} size={20} />
                </div>
              </button>
              )}
            </Favorite>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }} style={{ width: 44, height: 44, borderRadius: "50%", background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${A}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              <Share2 size={20} color={isDark ? "#FFFFFF" : "#111111"} />
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mob-hero-bottom">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {listing?.earlyBirdDiscounts?.some(d => d.isActive) && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: isDark ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.9)",
                  padding: "4px 12px",
                  borderRadius: "100px",
                  marginBottom: 10,
                  backdropFilter: "blur(4px)"
                }}>
                  <Sparkles size={12} color="#F59E0B" fill="#F59E0B" style={{ flexShrink: 0 }} />
                  <EarlyBirdTicker discounts={listing.earlyBirdDiscounts.filter(d => d.isActive).sort((a, b) => b.percentage - a.percentage)} A={A} FG={FG} isDark={isDark} />
                </div>
              )}
              {listing?.category && (
                <span className="mob-hero-tag" style={{ background: `${A}CC` }}>
                  {typeof listing.category === "string" ? listing.category : listing.category?.name || "Experience"}
                </span>
              )}
              <h1 className="mob-hero-title" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", background: "none", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                {(() => {
                  const titleStr = listing?.title || "Experience";
                  const words = titleStr.trim().split(" ");
                  if (words.length > 1) {
                    const lastWord = words.pop();
                    return (
                      <>
                        {words.join(" ")}{" "}
                        <span style={{ color: A || "#08B5D6", fontStyle: "italic", WebkitTextFillColor: A || "#08B5D6" }}>
                          {lastWord}
                        </span>
                      </>
                    );
                  }
                  return titleStr;
                })()}
              </h1>
              <div className="mob-hero-loc" style={{ color: "#E0E0E0", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                <MapPin size={14} color={A || "#08B5D6"} fill="none" style={{ flexShrink: 0 }} />
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
                  {listing?.locationName || fallbackLocationValues?.[0] || "Location TBD"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ╔═══════════════════════════════════╗
          ║         GALLERY SECTION           ║
          ╚═══════════════════════════════════╝ */}
      {imgs.length > 0 && (
        <div className="mob-gallery" style={{ background: BG, paddingTop: 16 }}>
          <div className="mob-gallery-scroll" ref={galleryRef} onScroll={handleGalleryScroll}>
            {imgs.map((src, i) => (
              <div key={i} className="mob-gallery-item" onClick={() => { setPhotoIndex(i); setPhotoVisible(true); }}>
                <img src={src} alt={`Gallery ${i + 1}`} loading="lazy" />
              </div>
            ))}
          </div>
          {imgs.length > 1 && (
            <div className="mob-gallery-dots">
              {imgs.slice(0, Math.min(imgs.length, 8)).map((_, i) => (
                <div key={i} className={`mob-gallery-dot${galleryIndex === i ? " active" : ""}`}
                  style={{ background: galleryIndex === i ? A : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)") }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║       QUICK FACTS STRIP           ║
          ╚═══════════════════════════════════╝ */}
      <div className="mob-facts" style={{ background: BG }}>
        {[
          { icon: <Clock size={15} color={A} />, label: listing?.duration ? `${listing.duration} ${listing.durationUnit || "Hrs"}` : "2.5 Hrs" },
          { icon: <User size={15} color={A} />, label: `Min Age: ${listing?.minimumAge || "12"}` },
          { icon: <Zap size={15} color={A} />, label: listing?.difficultyLevel || "Moderate" },
          { icon: <Baby size={15} color={A} />, label: listing?.allowsInfants || listing?.infantsAllowed ? "Infants OK" : "No Infants" },
          { icon: <Languages size={15} color={A} />, label: (() => { const l = Array.isArray(listing?.languagesOffered) && listing.languagesOffered.length > 0 ? listing.languagesOffered : ["English"]; return l.slice(0, 2).join(", "); })() },
          { icon: <ShieldCheck size={15} color={A} />, label: listing?.privateOptionAvailable ? "Private Tour" : "Group Tour" },
        ].map((fact, i) => (
          <div key={i} className="mob-fact-pill" style={{ background: isDark ? "#1A1A1A" : "#F5F7FA", color: FG, border: `1px solid ${B}` }}>
            {fact.icon}
            <span>{fact.label}</span>
          </div>
        ))}
      </div>



      {/* ╔═══════════════════════════════════╗
          ║       DESCRIPTION SECTION         ║
          ╚═══════════════════════════════════╝ */}
      {description && (
        <div className="mob-section" style={{ background: BG }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>The Experience</span>
          <h2 className="mob-section-title" style={{ color: FG }}>Your Journey Begins</h2>
          <div className="mob-narrative" style={{ maxHeight: descExpanded ? "2000px" : "100px" }}>
            <p className="mob-section-desc" style={{ color: M }}>{description}</p>
            {!descExpanded && (
              <div className="mob-narrative-fade" style={{ background: `linear-gradient(to top, ${BG}, transparent)` }} />
            )}
          </div>
          <button className="mob-readmore" onClick={() => setDescExpanded(!descExpanded)} style={{ color: A }}>
            {descExpanded ? "Read Less" : "Read More"}
            <span style={{ fontSize: 16, lineHeight: 1 }}>&rarr;</span>
          </button>
        </div>
      )}



      <div className="mob-divider" style={{ background: B }} />

      {/* ╔═══════════════════════════════════╗
          ║       MARQUEE (Tags)              ║
          ╚═══════════════════════════════════╝ */}
      {rawTags.length > 0 && (
        <div className="mob-marquee" style={{ borderColor: B, background: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.005)" }}>
          <div className="mob-marquee-track" style={{ "--marquee-duration": `${Math.max(rawTags.length * 3, 12)}s` }}>
            {[...rawTags, ...rawTags, ...rawTags, ...rawTags].map((tag, i) => (
              <div key={i} className="mob-marquee-item">
                <span className="mob-marquee-text" style={{ fontWeight: i % 2 === 0 ? 700 : 300, color: i % 2 === 0 ? FG : M, opacity: i % 2 === 0 ? 1 : 0.75 }}>
                  {tag}
                </span>
                <Sparkles size={11} color={A} fill={A} style={{ opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║       TIMELINE / HOW IT UNFOLDS   ║
          ╚═══════════════════════════════════╝ */}
      {activities.length > 0 && (
        <div className="mob-section" style={{ background: BG }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>The Experience Journey</span>
          <h2 className="mob-section-title" style={{ color: FG }}>How It Unfolds</h2>
          <p className="mob-section-desc" style={{ color: M, marginBottom: 24 }}>
            {activities.length} carefully curated experience{activities.length > 1 ? "s" : ""} await you.
          </p>

          <div className="mob-timeline">
            <div style={{ position: "absolute", left: 7, top: 12, bottom: 12, width: 2, background: `${A}30`, borderRadius: 2 }} />
            {activities.map((act, i) => {
              const imgUrl = actImg(act);
              const isExpanded = expandedActivities[i];
              const actDesc = act.description || act.pilot || act.briefDescription || act.about || "";
              return (
                <div key={i} className="mob-tl-item" style={{ animationDelay: `${i * 0.1}s`, padding: "12px 0" }}>
                  <div className="mob-tl-dot" style={{ borderColor: A, background: BG }} />
                  <div className="mob-tl-content">
                    <div className="mob-tl-card" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
                      {imgUrl && (
                        <img
                          className="mob-tl-img"
                          src={imgUrl}
                          alt={act.name || act.title}
                          loading="lazy"
                          onClick={() => {
                            const imgs = actImages(act);
                            setSelectedActivityImages(imgs);
                            setActivityPhotoIndex(0);
                            setActivityPhotoVisible(true);
                          }}
                        />
                      )}
                      <div className="mob-tl-body">
                        <div className="mob-tl-meta" style={{ color: A, fontWeight: 700, fontSize: 14 }}>
                          <Compass size={14} />
                          <span>{act.name || act.title || `Activity ${i + 1}`}</span>
                        </div>
                        {actDesc && (
                          <>
                            <p className="mob-tl-desc" style={{ color: M, WebkitLineClamp: isExpanded ? "unset" : 2 }}>{actDesc}</p>
                            {actDesc.length > 120 && (
                              <button onClick={() => setExpandedActivities(p => ({ ...p, [i]: !p[i] }))}
                                style={{ background: "none", border: "none", color: A, fontSize: 12, fontWeight: 700, padding: "8px 0 0", cursor: "pointer", outline: "none" }}>
                                {isExpanded ? "Show Less" : "Read More"}
                              </button>
                            )}
                          </>
                        )}
                        {act.duration && (
                          <div className="mob-tl-meta" style={{ color: M, marginTop: 8 }}>
                            <Clock size={12} />
                            <span>{act.duration} {act.durationUnit || "min"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {i < activities.length - 1 && (
                      <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", marginTop: 16, borderRadius: 1 }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║          ADD-ONS SECTION           ║
          ╚═══════════════════════════════════╝ */}
      {addons.length > 0 && (
        <div className="mob-section" style={{ background: BG }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>Enhance Your Experience</span>
          <h2 className="mob-section-title" style={{ color: FG }}>Make it Yours</h2>
          <p className="mob-section-desc" style={{ color: M, marginBottom: 20 }}>
            Curated add-ons to make your experience even more special.
          </p>

          <div className="mob-addons-list">
            {addons.map((addonItem, i) => {
              const addon = addonItem.addon || addonItem;
              const addonId = addon.addonId || addon.id;
              const selected = selectedAddOns.find(a => (a.addonId || a.id) === addonId || (a.addon?.addonId || a.addon?.id) === addonId);
              const addonImg = fmt(addon.imageUrl || (addon.imageUrls && addon.imageUrls[0]) || addon.image);
              const price = addon.price || addon.addonPrice || addon.amount || 0;
              const addonName = addon.title || addon.name || addon.addonName || `Add-on ${i + 1}`;
              const isGroupAddon = addon.pricingType === "Group" || addon.priceType === "per_booking";

              return (
                <div key={i} className="mob-addon-card" style={{ borderColor: selected ? A : B, background: isDark ? "#111" : W }}>
                  {addonImg && (
                    <img
                      className="mob-addon-img"
                      src={addonImg}
                      alt={addonName}
                      loading="lazy"
                      onClick={() => {
                        const imgs = addon.imageUrls?.length > 0 ? addon.imageUrls.map(fmt) : [addonImg];
                        setSelectedAddonImages(imgs);
                        setAddonPhotoIndex(0);
                        setAddonPhotoVisible(true);
                      }}
                    />
                  )}
                  <div className="mob-addon-info">
                    <p className="mob-addon-name" style={{ color: FG }}>{addonName}</p>
                    <p className="mob-addon-price" style={{ color: A }}>
                      ₹{Number(price).toLocaleString()}
                      <span className="mob-addon-unit" style={{ color: M }}>
                        /{isGroupAddon ? "group" : "person"}
                      </span>
                    </p>
                  </div>
                  {selected ? (
                    isGroupAddon ? (
                      <button className="mob-addon-btn" onClick={() => handleUpdateAddonQuantity(addonItem, -1)}
                        style={{ borderColor: "#E53935", background: "transparent", color: "#E53935", minWidth: 72 }}>
                        Remove
                      </button>
                    ) : (
                      <div className="mob-addon-counter">
                        <button onClick={() => handleUpdateAddonQuantity(addonItem, -1)}
                          style={{ borderColor: A, background: "transparent", color: A }}>−</button>
                        <span style={{ color: FG }}>{selected.quantity || 1}</span>
                        <button onClick={() => handleUpdateAddonQuantity(addonItem, 1)}
                          style={{ borderColor: A, background: "transparent", color: A }}>+</button>
                      </div>
                    )
                  ) : (
                    <button className="mob-addon-btn"
                      onClick={() => handleUpdateAddonQuantity(addonItem, 1)}
                      style={{ borderColor: A, background: "transparent", color: A, minWidth: 72 }}>
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {selectedAddOns.length > 0 && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: AL, borderRadius: 12, border: `1px solid ${A}30`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: A, fontWeight: 600, marginBottom: 2 }}>Add-ons</p>
                <p style={{ fontSize: 12, color: M, fontWeight: 500, margin: 0 }}>{selectedAddOns.reduce((s, a) => s + (a.quantity || 1), 0)} selected</p>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: A, margin: 0 }}>₹{selectedAddOns.reduce((s, a) => {
                const addonData = a.addon || a;
                const aPrice = addonData.price || addonData.addonPrice || addonData.amount || 0;
                return s + ((parseFloat(aPrice) || 0) * (a.quantity || 1));
              }, 0).toFixed(0)}</p>
            </div>
          )}
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║     LOCATION & DETAILS            ║
          ╚═══════════════════════════════════╝ */}
      <div className="mob-section" style={{ background: isDark ? BG : W }}>
        <span className="mob-section-eyebrow" style={{ color: A }}>Location & Details</span>
        <h2 className="mob-section-title" style={{ color: FG }}>Where it All Happens</h2>

        {/* Map embed */}
        {(listing?.meetingLatitude && listing?.meetingLongitude) && (
          <div className="mob-map-container" style={{ border: `1px solid ${B}` }}>
            <iframe
              title="Location"
              src={`https://maps.google.com/maps?q=${listing.meetingLatitude},${listing.meetingLongitude}&z=14&output=embed`}
              loading="lazy"
              allowFullScreen
            />
          </div>
        )}

        {/* Detail rows */}
        <div className="mob-detail-rows">
          {listing?.meetingAddress && (
            <div className="mob-detail-row" style={{ borderColor: B }}>
              <div className="mob-detail-icon" style={{ background: isDark ? "#1E293B" : "#F0F9FA" }}>
                <MapPin size={18} color={A} />
              </div>
              <div>
                <p className="mob-detail-label" style={{ color: A }}>Address</p>
                <p className="mob-detail-value" style={{ color: FG }}>{listing.meetingAddress}</p>
              </div>
            </div>
          )}
          {listing?.meetingDistrict && (
            <div className="mob-detail-row" style={{ borderColor: B }}>
              <div className="mob-detail-icon" style={{ background: isDark ? "#1E293B" : "#F0F9FA" }}>
                <MapPin size={18} color={A} />
              </div>
              <div>
                <p className="mob-detail-label" style={{ color: A }}>District</p>
                <p className="mob-detail-value" style={{ color: FG }}>{listing.meetingDistrict}</p>
              </div>
            </div>
          )}
          {listing?.meetingState && (
            <div className="mob-detail-row" style={{ borderColor: B }}>
              <div className="mob-detail-icon" style={{ background: isDark ? "#1E293B" : "#F0F9FA" }}>
                <MapPin size={18} color={A} />
              </div>
              <div>
                <p className="mob-detail-label" style={{ color: A }}>State</p>
                <p className="mob-detail-value" style={{ color: FG }}>{listing.meetingState}</p>
              </div>
            </div>
          )}
          {listing?.meetingCountry && (
            <div className="mob-detail-row" style={{ borderColor: B }}>
              <div className="mob-detail-icon" style={{ background: isDark ? "#1E293B" : "#F0F9FA" }}>
                <MapPin size={18} color={A} />
              </div>
              <div>
                <p className="mob-detail-label" style={{ color: A }}>Country</p>
                <p className="mob-detail-value" style={{ color: FG }}>{listing.meetingCountry}</p>
              </div>
            </div>
          )}
          {listing?.meetingInstructions && (
            <div className="mob-detail-row" style={{ borderColor: B }}>
              <div className="mob-detail-icon" style={{ background: isDark ? "#1E293B" : "#F0F9FA" }}>
                <Info size={18} color={A} />
              </div>
              <div>
                <p className="mob-detail-label" style={{ color: A }}>Instructions</p>
                <p className="mob-detail-value" style={{ color: FG }}>{listing.meetingInstructions}</p>
              </div>
            </div>
          )}
        </div>

        {/* Things to Keep in Mind */}
        {(listing?.thingsToKeepInMind?.length > 0 || listing?.whatToBring?.length > 0 || listing?.notSuitableFor?.length > 0) && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: FG, marginBottom: 12, fontFamily: '"Inter", sans-serif' }}>Things to Keep in Mind</h3>
            <div className="mob-tips-list">
              {listing?.thingsToKeepInMind?.map((tip, i) => (
                <Accordion key={`tip-${i}`} title={typeof tip === "string" ? tip : tip.title || `Tip ${i + 1}`}
                  icon={<Info size={16} color={A} />} borderColor={B} fgColor={FG} mColor={M} accentColor={A}>
                  <p>{typeof tip === "string" ? tip : tip.description || ""}</p>
                </Accordion>
              ))}
              {listing?.whatToBring?.map((item, i) => (
                <Accordion key={`bring-${i}`} title={typeof item === "string" ? item : item.title || item.name || `Item ${i + 1}`}
                  icon={<ShieldCheck size={16} color={A} />} borderColor={B} fgColor={FG} mColor={M} accentColor={A}>
                  <p>{typeof item === "string" ? item : item.description || ""}</p>
                </Accordion>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ╔═══════════════════════════════════╗
          ║        HOST SECTION               ║
          ╚═══════════════════════════════════╝ */}
      {listing && (
        <div className="mob-section" style={{ background: BG }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>Your Host</span>
          <h2 className="mob-section-title" style={{ color: FG }}>Meet the Expert</h2>

          <div className="mob-host-card" style={{ borderColor: B, background: isDark ? "#111" : W }}>
            <div className="mob-host-avatar" style={{ background: `linear-gradient(135deg, ${A}20, ${A}08)`, color: A, border: `2px solid ${A}40` }}>
              <img
                src={fmt(leadData?.profileImageUrl || hostData?.profileImageUrl || hostData?.host?.profileImageUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayHostName)}&backgroundColor=0097B2&color=ffffff`}
                alt={displayHostName}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayHostName)}&backgroundColor=0097B2&color=ffffff`; }}
              />
            </div>
            <h3 className="mob-host-name" style={{ color: FG }}>{displayHostName}</h3>
            <p className="mob-host-label" style={{ color: A }}>Experience Host</p>

            {(hostPhone || hostEmail) && (
              <div className="mob-host-contact">
                {hostPhone && (
                  <a href={`tel:${hostPhone}`} className="mob-host-contact-btn" style={{ borderColor: B, color: FG, background: "transparent", textDecoration: "none" }}>
                    <Phone size={14} /> Call
                  </a>
                )}
                {hostEmail && (
                  <a href={`mailto:${hostEmail}`} className="mob-host-contact-btn" style={{ borderColor: B, color: FG, background: "transparent", textDecoration: "none" }}>
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
            )}

            <button onClick={navigateToHostProfile}
              style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 100, border: `1.5px solid ${A}`, background: "transparent", color: A, fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none" }}>
              View Full Profile
            </button>
          </div>
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║        POLICIES SECTION           ║
          ╚═══════════════════════════════════╝ */}
      {(listing?.guestRequirements?.length > 0 || listing?.cancellationPolicySummary || listing?.cancellationPolicyText) && (
        <div className="mob-section" style={{ background: isDark ? BG : W }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>Essential Guidelines</span>
          <h2 className="mob-section-title" style={{ color: FG }}>Things to Keep in Mind</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {listing?.guestRequirements?.map((req, i) => {
              const title = req.setting?.title || "Requirement";
              const desc = req.setting?.description || "";
              return (
                <Accordion key={`pol-${i}`} title={title}
                  icon={<ShieldCheck size={16} color={A} />} borderColor={B} fgColor={FG} mColor={M} accentColor={A}>
                  {desc && <p>{desc}</p>}
                  {req.questions?.map((q, qi) => {
                    const questionTitle = q.title || q.question?.title;
                    const answerText = q.answer?.valueText || q.valueText;
                    return (
                      <div key={qi} style={{ marginTop: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: FG, marginBottom: 4 }}>{questionTitle}</p>
                        {answerText && (
                          <span style={{ display: "inline-block", fontSize: 12, padding: "4px 10px", borderRadius: 100, background: AL, color: A, fontWeight: 600, marginRight: 6, marginBottom: 4 }}>
                            {answerText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </Accordion>
              );
            })}
            {(listing?.cancellationPolicySummary || listing?.cancellationPolicyText || listing?.cancellationPolicy) && (
              <Accordion title="Cancellation Policy"
                icon={<Info size={16} color={A} />} borderColor={B} fgColor={FG} mColor={M} accentColor={A}>
                <p>{listing.cancellationPolicySummary || listing.cancellationPolicyText || listing.cancellationPolicy}</p>
              </Accordion>
            )}
          </div>
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║         REVIEWS SECTION           ║
          ╚═══════════════════════════════════╝ */}
      {revs.length > 0 && (
        <div className="mob-section" style={{ background: BG }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>Guest Reviews</span>
          <h2 className="mob-section-title" style={{ color: FG }}>What People Say</h2>

          {reviewSummary?.averageRating && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "14px 16px", borderRadius: 12, border: `1px solid ${B}`, background: isDark ? "#111" : W }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: A }}>{Number(reviewSummary.averageRating).toFixed(1)}</span>
              <div>
                <div style={{ display: "flex", gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} color={i < Math.round(reviewSummary.averageRating) ? "#F59E0B" : "#CBD5E1"} fill={i < Math.round(reviewSummary.averageRating) ? "#F59E0B" : "transparent"} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: M, fontWeight: 600, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {reviewSummary.totalReviews || revs.length} reviews
                </p>
              </div>
            </div>
          )}

          <div className="mob-reviews-list">
            {revs.slice(0, 3).map((rev, i) => (
              <div key={i} className="mob-review-card" style={{ borderColor: B, background: isDark ? "#111" : W }}>
                <div className="mob-review-header">
                  <div className="mob-review-avatar" style={{ background: S, border: `1px solid ${B}`, color: A }}>
                    {(rev.customerName || rev.author || "G")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="mob-review-name" style={{ color: FG }}>{rev.customerName || rev.author || "Verified Guest"}</p>
                    <div className="mob-review-stars" style={{ display: "flex", gap: 2, marginTop: 4 }}>
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} size={10} color={si < (rev.rating || 5) ? "#F59E0B" : "#CBD5E1"} fill={si < (rev.rating || 5) ? "#F59E0B" : "transparent"} />
                      ))}
                    </div>
                  </div>
                  <span className="mob-review-date" style={{ color: M }}>
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently"}
                  </span>
                </div>
                <p className="mob-review-text" style={{ color: FG }}>
                  &ldquo;{rev.comment || rev.text}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {revs.length > 3 && (
            <button onClick={() => history.push(`/reviews/experience/${currentListingId}`)}
              style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${B}`, background: "transparent", color: A, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, outline: "none" }}>
              See All Reviews
            </button>
          )}
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║      RELATED EXPERIENCES          ║
          ╚═══════════════════════════════════╝ */}
      <div className="mob-related" style={{ background: isDark ? BG : W }}>
        <div className="mob-related-header" style={{ paddingBottom: 8 }}>
          <span className="mob-section-eyebrow" style={{ color: A }}>Discover More</span>
        </div>
        <RelatedListingsStrip
          businessInterestId={1}
          primaryCategoryId={primaryCategoryId}
          currentListingId={currentListingId}
          fallbackLocationValues={fallbackLocationValues}
          fallbackTagValues={fallbackTagValues}
          fallbackSpecialLabelValues={fallbackSpecialLabelValues}
          title="You May Also Like"
          sectionStyle={{ padding: "0 0 0 20px", background: "transparent" }}
          titleStyle={{ fontSize: "clamp(1.6rem, 7vw, 2.2rem)", fontWeight: 700, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', color: FG, margin: 0, letterSpacing: "-0.02em" }}
        />
      </div>

      {/* ╔═══════════════════════════════════╗
          ║        BOOKING SYSTEM             ║
          ╚═══════════════════════════════════╝ */}
      <BookingSystem
        listing={listing}
        selectedAddOns={selectedAddOns}
        onUpdateAddonQuantity={handleUpdateAddonQuantity}
        hideTrigger={true}
        externalOpen={bookingOpen}
        onExternalOpenChange={setBookingOpen}
        initialDate={initialDateStr}
        initialGuests={initialGuests}
      />

      {/* Spacer for sticky CTA */}
      <div className="mob-cta-spacer" />

      {/* ╔═══════════════════════════════════╗
          ║       STICKY BOTTOM CTA           ║
          ╚═══════════════════════════════════╝ */}
      {!bookingOpen && !isFooterVisible && (
        <div className="mob-sticky-cta" style={{
          background: "transparent",
          borderColor: "transparent",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          pointerEvents: "none"
        }}>
          <button className="mob-cta-btn" style={{ background: A, boxShadow: `0 8px 30px ${A}60`, width: "100%", pointerEvents: "auto" }}
            onClick={() => setBookingOpen(true)}>
            Reserve Now
          </button>
        </div>
      )}

      {/* ╔═══════════════════════════════════╗
          ║       FULLSCREEN PHOTO VIEWER     ║
          ╚═══════════════════════════════════╝ */}
      <AnimatePresence>
        {photoVisible && imgs.length > 0 && (
          <FullScreenImage
            src={imgs[photoIndex]}
            items={imgs}
            currentIndex={photoIndex}
            onNavigate={setPhotoIndex}
            onClose={() => setPhotoVisible(false)}
          />
        )}
        {activityPhotoVisible && selectedActivityImages.length > 0 && (
          <FullScreenImage
            src={selectedActivityImages[activityPhotoIndex]}
            items={selectedActivityImages}
            currentIndex={activityPhotoIndex}
            onNavigate={setActivityPhotoIndex}
            onClose={() => setActivityPhotoVisible(false)}
          />
        )}
        {addonPhotoVisible && selectedAddonImages.length > 0 && (
          <FullScreenImage
            src={selectedAddonImages[addonPhotoIndex]}
            items={selectedAddonImages}
            currentIndex={addonPhotoIndex}
            onNavigate={setAddonPhotoIndex}
            onClose={() => setAddonPhotoVisible(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
