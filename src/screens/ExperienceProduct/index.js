import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams, useHistory } from "react-router-dom";
import cn from "classnames";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowDown, Check, Zap, MapPin, ChevronDown, Clock, User, Camera, Coffee, Phone, Info, Plus, Minus, Baby, Languages, ShieldCheck, ChevronLeft } from "lucide-react";
import { useTheme } from "../../components/JUI/Theme";
import { Cursor, ProgressBar, Rev, Chars, Mq, SHdr, E, Soul } from "../../components/JUI/UI";
import { BookingSystem } from "../../components/JUI/BookingSystem";
import Loader from "../../components/Loader";
import {
  getListing,
  getHost,
  getLeadDetails,
} from "../../utils/api";
import { buildExperienceUrl, extractExperienceIdFromSlugAndId } from "../../utils/experienceUrl";
import Page from "../../components/Page";
import ProductNavbar from "../../components/ProductNavbar";

const formatImageUrl = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  const [pathPart, queryPart] = raw.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/").replace(/\\/g, "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const getActivityImageUrl = (activity) => {
  const firstImage = Array.isArray(activity?.images) ? activity.images[0] : null;
  if (!firstImage) return null;

  const rawUrl = typeof firstImage === "string"
    ? firstImage
    : firstImage.url || firstImage.fileUrl || firstImage.imageUrl;

  return formatImageUrl(rawUrl);
};

/* ─── KINETIC BACKGROUND ────────────────────────── */
function ExperienceBg({ progress, src }) {
  const { tokens: { A, BG } } = useTheme();
  const scale = useTransform(progress, [0, 1], [1, 1.2]);
  const opacity = useTransform(progress, [0, 0.8], [0.6, 0]);
  const blur = useTransform(progress, [0, 0.5], [0, 10]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <motion.div style={{ scale, opacity, filter: `blur(${blur}px)`, width: "100%", height: "100%", position: "relative" }}>
        <img src={src || "/gallery/concert.png"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5) contrast(1.1)" }} alt="" />
        <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity }} style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 40%, ${A}44 0%, transparent 60%)` }} />
        <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 7, repeat: Infinity, delay: 2 }} style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 70% 60%, ${A}33 0%, transparent 50%)` }} />
      </motion.div>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 60%, #080808 100%)` }} />
    </div>
  );
}



const ExperienceProduct = () => {
  const location = useLocation();
  const history = useHistory();
  const { slugAndId } = useParams();
  const params = new URLSearchParams(location.search);
  const idFromPath = extractExperienceIdFromSlugAndId(slugAndId);
  const idParam = params.get("id");
  const id = idFromPath || idParam || "1";

  const { tokens: { A, FG, M, B, W, BG, S, AL, AH }, theme } = useTheme();
  const [listing, setListing] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleUpdateAddonQuantity = (addon, delta) => {
    const addonId = addon.addonId || addon.id;
    setSelectedAddOns((prev) => {
      const existingIndex = prev.findIndex(a => (a.addonId || a.id) === addonId);
      if (existingIndex > -1) {
        const newQuantity = (prev[existingIndex].quantity || 1) + delta;
        if (newQuantity <= 0) {
          return prev.filter((_, i) => i !== existingIndex);
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity };
        return updated;
      } else if (delta > 0) {
        return [...prev, { ...addon, quantity: 1 }];
      }
      return prev;
    });
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const data = await getListing(id);
        if (!mounted) return;

        if (data) {
          setListing(data);
          const galleryImages = [];
          if (data.coverPhotoUrl) {
            const formattedUrl = formatImageUrl(data.coverPhotoUrl);
            if (formattedUrl) galleryImages.push(formattedUrl);
          }
          if (Array.isArray(data.listingMedia)) {
            for (const media of data.listingMedia) {
              const imageUrl = formatImageUrl(media.url || media.fileUrl);
              if (imageUrl) galleryImages.push(imageUrl);
            }
          }
          setGalleryItems(galleryImages);

          const canonicalUrl = buildExperienceUrl(data.title || "experience", data.listingId || data.id || id);
          if (location.pathname !== canonicalUrl) history.replace(canonicalUrl);

          const hostId = data.hostId || data.host?.id || data.host?.hostId || data.leadUserId || data.host?.leadUserId;
          if (hostId) {
            getHost(hostId).then(resp => {
              if (mounted) {
                setHostData(resp.host || resp);
                const allReviews = [
                  ...(data.reviews || []),
                  ...(data.recentReviews || []),
                  ...(resp.recentReviews || []),
                  ...(resp.reviews || [])
                ];
                // Remove duplicates if any (by id)
                const uniqueReviews = Array.from(new Map(allReviews.map(r => [r.id || r.reviewId || r.comment, r])).values());
                setReviews(uniqueReviews);
              }
            }).catch(e => console.warn(e));
          }

          const leadId = data.leadId || data.lead_id || data.host?.leadId || data.leadUserId;
          if (leadId) {
            getLeadDetails(leadId).then(resp => mounted && setLeadData(resp)).catch(e => console.warn(e));
          }
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const textY = useTransform(heroProgress, [0, 1], [0, -200]);
  const fade = useTransform(heroProgress, [0, 0.6], [1, 0]);

  if (loading && !listing) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG }}><Loader /></div>;
  }

  const description = listing?.description || listing?.aboutListing || "";
  const summary = listing?.summary || listing?.listingSummary || "";
  const displayTags = listing?.tags || [];

  return (
    <Page>
      <main style={{ background: BG }}>
        {/* HERO SECTION */}
        <section ref={heroRef} style={{ position: "relative", minHeight: "110vh", overflow: "hidden", display: "flex", alignItems: "center", zIndex: 50 }}>
          <ExperienceBg progress={heroProgress} src={formatImageUrl(listing?.coverPhotoUrl)} />
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 60px", position: "relative", zIndex: 10, width: "100%" }}>
            <ProductNavbar top={100} left={60} />
            <motion.div style={{ opacity: fade, y: textY }}>
              <p style={{ fontSize: 12, letterSpacing: "1em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 40, fontFamily: 'monospace' }}>The Narrative Experience</p>
              <Rev>
                <h1 style={{ fontSize: "clamp(4.5rem, 12vw, 10rem)", fontWeight: 900, lineHeight: 0.85, color: "#FFFFFF", marginBottom: 40, letterSpacing: "-0.04em" }} className="font-display">
                  {listing?.title}
                </h1>
              </Rev>
              <Rev delay={0.2}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }} className="hero-stats">
                  <div style={{ borderLeft: "2px solid #0097B2", paddingLeft: 24 }}>
                    <p style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "#0097B2", marginBottom: 20, fontWeight: 700 }}>01. Atmospherics</p>
                    <p style={{ fontSize: 18, color: "#D4D4D4", lineHeight: 1.6, fontWeight: 400 }}>{listing?.experienceType || "A multisensory odyssey that blurs the line between perception and possibility."}</p>
                  </div>
                  <div style={{ borderLeft: "2px solid #0097B2", paddingLeft: 24 }}>
                    <p style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "#0097B2", marginBottom: 20, fontWeight: 700 }}>02. Interaction</p>
                    <p style={{ fontSize: 18, color: "#D4D4D4", lineHeight: 1.6, fontWeight: 400 }}>{listing?.activityType || "High-fidelity touchpoints that respond to your presence in real-time."}</p>
                  </div>
                </div>
              </Rev>
            </motion.div>
          </div>
          <motion.div style={{ position: "absolute", bottom: 60, left: 60, display: "flex", alignItems: "center", gap: 20, opacity: fade }}>
            <motion.div animate={{ height: [40, 80, 40] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ width: 1, background: "#FFFFFF" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C8C88", fontWeight: 600 }}>Scroll to explore</span>
          </motion.div>
        </section>



        {/* GALLERY SECTION */}
        <section style={{ background: W, padding: "80px 0 60px", overflow: "hidden", display: "flex" }}>
          {(() => {
            const baseItems = galleryItems.length > 0 ? galleryItems : ["/images/content/placeholder.jpg"];
            let filledItems = [...baseItems];
            while (filledItems.length < 8) {
              filledItems = [...filledItems, ...baseItems];
            }
            const doubledItems = [...filledItems, ...filledItems];

            return (
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
                style={{ display: "flex", gap: 16, width: "max-content", paddingLeft: 16 }}
              >
                {doubledItems.map((img, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 0.98 }}
                    style={{ width: "clamp(300px, 25vw, 450px)", height: 400, borderRadius: 24, overflow: "hidden", flexShrink: 0, border: `1px solid ${B}` }}
                  >
                    <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Gallery" />
                  </motion.div>
                ))}
              </motion.div>
            );
          })()}
        </section>



        {/* DETAILS SECTION */}
        <section style={{ background: BG, padding: "48px 36px 80px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <SHdr idx="01" label="Overview" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }} className="details-grid">
              <Soul delay={0.1} style={{ gridColumn: "span 2", gridRow: "span 2" }}>
                <div style={{ background: W, border: `1px solid ${B}`, padding: 40, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: A, marginBottom: 12, fontWeight: 600 }}>What We Do</p>
                    <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 20 }}>A Guided Journey</h2>
                    <p style={{ color: M, fontSize: 14, lineHeight: 1.7 }}>{description}</p>
                  </div>
                </div>
              </Soul>
              <Soul y={40} r={5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Clock size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>
                    {listing?.duration ? `${listing.duration} ${listing.durationUnit || ""}` : "2.5 Hrs"}
                  </p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Duration</p>
                </div>
              </Soul>
              <Soul y={40} r={-5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <User size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.minimumAge || "18+"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Min Age</p>
                </div>
              </Soul>
              <Soul y={40} r={5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Zap size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.difficultyLevel || "Moderate"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Difficulty</p>
                </div>
              </Soul>
              <Soul y={40} r={-5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Baby size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.allowsInfants || listing?.infantsAllowed ? "Allowed" : "No"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Infants</p>
                </div>
              </Soul>
              <Soul y={40} r={5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Languages size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: FG, marginBottom: 4 }}>
                    {Array.isArray(listing?.languagesOffered) && listing.languagesOffered.length > 0
                      ? listing.languagesOffered.join(", ")
                      : (listing?.languages || "English")}
                  </p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Languages</p>
                </div>
              </Soul>
              <Soul y={40} r={-5} style={{ gridColumn: "span 1" }}>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <ShieldCheck size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>
                    {listing?.privateOptionAvailable ? "Available" : "Not Available"}
                  </p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Private Option</p>
                </div>
              </Soul>
            </div>

            <div style={{ margin: "40px -36px" }}>
              <Mq items={listing?.tags || displayTags} bg={BG} />
            </div>

            <Rev delay={0.4} style={{ marginTop: 16 }}>
              <div style={{ background: W, border: `1px solid ${B}`, padding: "64px", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80 }} className="details-inner">
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: A, marginBottom: 32, fontWeight: 600 }}>Included Add-ons</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {(listing?.addons || []).length > 0 ? (listing.addons.map((item, i) => {
                      const addon = item.addon || item;
                      const addonId = addon.addonId || addon.id;
                      const addonImage = addon.imageUrl || (addon.imageUrls && addon.imageUrls[0]) || addon.image;
                      const isSelected = selectedAddOns.some(a => (a.addonId || a.id) === addonId);

                      return (
                        <motion.div
                          key={i}
                          whileHover={{ x: 10 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            display: "flex",
                            gap: 24,
                            alignItems: "flex-start",
                            padding: "20px",
                            background: isSelected ? AL : "transparent",
                            borderRadius: 24,
                            border: `1px solid ${isSelected ? A : "transparent"}`,
                            transition: "0.3s"
                          }}
                        >
                          <div style={{ background: AL, width: 64, height: 64, borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${B}` }}>
                            {addonImage ? (
                              <img
                                src={formatImageUrl(addonImage)}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                alt={addon.title}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/images/content/placeholder.jpg";
                                }}
                              />
                            ) : (
                              <Plus size={24} color={A} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <p style={{ fontSize: 18, fontWeight: 700, color: FG, marginBottom: 8 }}>{addon.title}</p>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                {isSelected ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 16, background: S, borderRadius: 100, padding: "4px 8px", border: `1px solid ${B}` }}>
                                    <button
                                      onClick={() => handleUpdateAddonQuantity(addon, -1)}
                                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, color: A }}
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: FG, minWidth: 20, textAlign: "center" }}>
                                      {selectedAddOns.find(a => (a.addonId || a.id) === addonId)?.quantity || 1}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateAddonQuantity(addon, 1)}
                                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, color: A }}
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateAddonQuantity(addon, 1)}
                                    style={{
                                      background: S,
                                      color: FG,
                                      border: `1px solid ${B}`,
                                      borderRadius: 100,
                                      padding: "6px 20px",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em"
                                    }}
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: 14, color: M, lineHeight: 1.6 }}>{addon.briefDescription || addon.description}</p>
                            {addon.price > 0 && (
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: A }}>+ ₹{addon.price}</p>
                                {isSelected && (selectedAddOns.find(a => (a.addonId || a.id) === addonId)?.quantity || 1) > 1 && (
                                  <p style={{ fontSize: 12, fontWeight: 500, color: M }}>
                                    × {selectedAddOns.find(a => (a.addonId || a.id) === addonId).quantity} = ₹{(addon.price * selectedAddOns.find(a => (a.addonId || a.id) === addonId).quantity).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })) : (
                      <p style={{ color: M, fontSize: 14 }}>No special add-ons included for this experience.</p>
                    )}
                  </div>
                  {selectedAddOns.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: 40, padding: "24px 32px", background: AL, borderRadius: 24, border: `1px solid ${A}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: A, fontWeight: 700, marginBottom: 4 }}>Add-ons Summary</p>
                        <p style={{ fontSize: 13, color: M, fontWeight: 500 }}>{selectedAddOns.reduce((sum, a) => sum + (a.quantity || 1), 0)} items selected</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: M, fontWeight: 700, marginBottom: 4 }}>Subtotal</p>
                        <p style={{ fontSize: 24, fontWeight: 900, color: FG }}>₹{selectedAddOns.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0).toFixed(2)}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: M, marginBottom: 32, fontWeight: 600 }}>The Narrative Flow</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 40, position: "relative" }}>
                    <div style={{ position: "absolute", left: 7, top: 10, bottom: 10, width: 1, background: B }} />

                    {(listing?.keyActivities || []).map((it, i) => {
                      const activityImageUrl = getActivityImageUrl(it);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.4 }}
                          whileHover={{ x: 10 }}
                          style={{ display: "flex", gap: 32, alignItems: "flex-start", zIndex: 1, cursor: "default", width: "100%" }}>
                          <div style={{ width: 15, height: 15, borderRadius: "50%", background: W, border: `3px solid ${A}`, marginTop: 6, flexShrink: 0 }} />
                          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flex: 1 }}>
                            {activityImageUrl && (
                              <div style={{ width: 120, height: 90, borderRadius: 16, overflow: "hidden", border: `1px solid ${B}`, flexShrink: 0, background: S }}>
                                <img
                                  src={activityImageUrl}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  alt={it.name}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/content/photo-1.1.jpg";
                                  }}
                                />
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: A, fontFamily: "monospace", textTransform: "uppercase" }}>Activity {i + 1}</span>
                                <span className="font-display" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 700, color: FG }}>{it.name}</span>
                              </div>
                              <p style={{ fontSize: 13, color: "#000", marginTop: 8, lineHeight: 1.6, maxWidth: 480, fontWeight: 500 }}>
                                {it.description}
                              </p>
                              {it.pilot && (
                                <div style={{ fontSize: 11, color: M, marginTop: 4, opacity: 0.9 }}>
                                  {it.pilot}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {(!listing?.keyActivities || listing.keyActivities.length === 0) && (
                      <p style={{ color: M, fontSize: 14, marginLeft: 48 }}>Itinerary details are being finalized for this experience.</p>
                    )}
                  </div>
                </div>
              </div>
            </Rev>
          </div>
        </section>



        {/* PREPARATION SECTION */}
        <section style={{ background: W, padding: "80px 36px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <SHdr idx="02" label="Preparation" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }} className="prep-grid">
              <Rev delay={0.1}>
                <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 32 }}>Meeting Point</h3>
                <div style={{ background: S, border: `1px solid ${B}`, padding: 40, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <MapPin size={20} color={A} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>{listing?.meetingLocationName || "The Grand Atrium"}</p>
                      <p style={{ fontSize: 13, color: M, marginTop: 4 }}>{listing?.meetingAddress || "Arrive via Gate 3 (Private Entrance). Our concierge will meet you at the inner courtyard."}</p>
                    </div>
                  </div>
                  <div style={{ background: W, border: `1px solid ${B}`, height: 200, marginTop: 16, position: "relative", overflow: "hidden" }}>
                    {listing?.meetingLatitude && listing?.meetingLongitude ? (
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${listing.meetingLatitude},${listing.meetingLongitude}&hl=en&z=14&output=embed`}
                        allowFullScreen
                        title="Meeting Location"
                      />
                    ) : (
                      <>
                        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${A}18 1px,transparent 1px),linear-gradient(90deg,${A}18 1px,transparent 1px)`, backgroundSize: "20px 20px" }} />
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, background: A, borderRadius: "50%" }}>
                          <motion.div animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", inset: "-6px", border: `2px solid ${A}`, borderRadius: "50%" }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Rev>
              <Rev delay={0.2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
                  <div>
                    <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 24 }}>Location Details</h3>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16, padding: 0 }}>
                      {[
                        { label: "Address", val: listing?.meetingAddress },
                        { label: "District", val: listing?.meetingDistrict },
                        { label: "State", val: listing?.meetingState },
                        { label: "Country", val: listing?.meetingCountry },
                        { label: "Landmark", val: listing?.meetingLandmark },
                        { label: "Instructions", val: listing?.meetingInstructions }
                      ].filter(x => x.val).map((item, i) => (
                        <li key={i} style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 16 }}>
                          <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 100, flexShrink: 0, fontWeight: 600 }}>{item.label}</span>
                          <span style={{ fontSize: 14, color: FG, fontWeight: 500, lineHeight: 1.6 }}>{item.val}</span>
                        </li>
                      ))}
                      {(!listing?.meetingDistrict && !listing?.meetingState && !listing?.meetingCountry) && (
                        <li style={{ display: "flex", gap: 16, alignItems: "baseline", borderBottom: `1px solid ${B}`, paddingBottom: 16 }}>
                          <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 100, flexShrink: 0, fontWeight: 600 }}>Region</span>
                          <span style={{ fontSize: 14, color: M, fontWeight: 500 }}>Specific regional details will be provided upon booking confirmation.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </Rev>
            </div>
          </div>
        </section>

        <Mq items={[listing?.category, listing?.subCategory].filter(Boolean).length > 0 ? [listing.category, listing.subCategory].filter(Boolean) : ["Nature", "Adventure"]} size="sm" bg={BG} />

        <ExperiencePolicies listing={listing} reviews={reviews} />

        {/* HOST & REVIEWS SECTION */}
        <section style={{ background: BG, padding: "80px 36px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="host-grid">
            <Rev delay={0.1} style={{ height: "100%" }}>
              <SHdr idx="04" label="The Host" />
              <div style={{ padding: 48, background: W, border: `1px solid ${B}`, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "2rem", fontWeight: 700, color: FG, marginBottom: 8 }}>{hostData?.firstName} {hostData?.lastName || ""}</h3>
                <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: A, marginBottom: 24 }}>Host</p>
                <p style={{ fontSize: 13, color: M, lineHeight: 1.8, flex: 1 }}>{hostData?.about || "An expert guide who will personally lead the Experience group through the unseen veins of the venue, offering context and narrative to every installation."}</p>
                {leadData && (
                  <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${B}`, paddingTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: FG, fontSize: 13 }}><Phone size={14} color={A} /> {leadData.contactNumber}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: FG, fontSize: 13 }}><Info size={14} color={A} /> {leadData.email}</div>
                  </div>
                )}
              </div>
            </Rev>
            <Rev delay={0.2} style={{ height: "100%" }}>
              <SHdr idx="05" label="Testimonials" />
              <div style={{ padding: 48, background: W, border: `1px solid ${B}`, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" }}>
                {reviews.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {reviews.slice(0, 2).map((rev, i) => (
                      <div key={i} style={{ borderBottom: i === 0 && reviews.length > 1 ? `1px solid ${B}` : "none", paddingBottom: i === 0 && reviews.length > 1 ? 24 : 0 }}>
                        <p style={{ fontSize: 13, fontStyle: "italic", color: FG, lineHeight: 1.6, marginBottom: 12 }}>
                          &ldquo;{rev.comment || rev.content || rev.reviewText || rev.text || "Wonderful experience!"}&rdquo;
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: A }}>{rev.customerName || rev.author || "Guest"}</span>
                          {rev.rating && <span style={{ fontSize: 10, color: M }}>• {rev.rating} ★</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: M }}>No testimonials shared yet.</p>
                )}
              </div>
            </Rev>
          </div>
        </section>

        <BookingSystem listing={listing} selectedAddOns={selectedAddOns} />
      </main>
      <style>{`
        @media(max-width: 900px) { 
          .hero-stats { grid-template-columns: 1fr !important; gap: 40px !important; } 
          .gal-grid { grid-template-columns: 1fr 1fr !important; grid-auto-rows: 240px !important; gap: 8px !important; }
          .details-grid { grid-template-columns: 1fr !important; }
          .details-grid > div { grid-column: span 1 !important; }
          .prep-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .host-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Page>
  );
};

function PolicyItem({ req }) {
  const { tokens: { FG, A, M, AL, B } } = useTheme();
  const [op, setOp] = useState(false);

  const title = req.setting?.title;
  const description = req.setting?.description;
  const questions = req.questions || [];

  return (
    <motion.div style={{ borderBottom: `1px solid ${B}` }} whileHover={{ backgroundColor: AL }}>
      <div
        onClick={() => setOp(!op)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "24px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: op ? A : FG, display: "block", marginBottom: 8 }}>{title}</span>
          {description && (
            <p style={{ fontSize: 13, color: M, lineHeight: 1.5, whiteSpace: "pre-line", margin: 0 }}>
              {description}
            </p>
          )}
        </div>
        <ChevronDown size={18} color={M} style={{ transform: op ? 'rotate(180deg)' : 'none', transition: '0.3s', marginTop: 4, flexShrink: 0 }} />
      </div>

      <AnimatePresence>
        {op && questions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ padding: "0 16px 24px", overflow: "hidden" }}
          >
            <div style={{ padding: "20px", background: AL, borderRadius: 16, border: `1px solid ${B}` }}>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, padding: 0, margin: 0 }}>
                {questions.map((q, j) => (
                  <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
                    <span style={{ fontSize: 14, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{q.question?.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReviewsItem({ reviews }) {
  const { tokens: { FG, A, M, AL, B, W } } = useTheme();
  const [op, setOp] = useState(false);

  return (
    <motion.div style={{ borderBottom: `1px solid ${B}` }} whileHover={{ backgroundColor: AL }}>
      <div
        onClick={() => setOp(!op)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 16px",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: op ? A : FG, display: "block", marginBottom: 4 }}>Reviews</span>
          <p style={{ fontSize: 13, color: M, margin: 0 }}>{reviews.length} guests shared their experience</p>
        </div>
        <ChevronDown size={18} color={M} style={{ transform: op ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
      </div>

      <AnimatePresence>
        {op && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ padding: "0 16px 24px", overflow: "hidden" }}
          >
            <div style={{ padding: "24px", background: AL, borderRadius: 16, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 24 }}>
              {reviews.length > 0 ? (
                reviews.slice(0, 3).map((rev, i) => (
                  <div key={i} style={{ borderBottom: i === Math.min(reviews.length, 3) - 1 ? "none" : `1px solid ${B}`, paddingBottom: i === Math.min(reviews.length, 3) - 1 ? 0 : 24 }}>
                    <p style={{ fontSize: 14, fontStyle: "italic", color: FG, lineHeight: 1.6, marginBottom: 16 }}>&ldquo;{rev.comment || rev.text}&rdquo;</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, background: A, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: W, fontWeight: 700 }}>
                        {(rev.customerName || rev.author || "G")[0]}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>{rev.customerName || rev.author}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 14, color: M, textAlign: "center", margin: 0 }}>No reviews shared for this experience yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExperiencePolicies({ listing, reviews }) {
  const { tokens: { FG, W, B, A, M } } = useTheme();

  return (
    <section style={{ background: W, padding: "80px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SHdr idx="03" label="Rules & Policies" />
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr", gap: 80 }} className="pol-grid">
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Chars
                text="Know Before"
                cls="font-display"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                  fontWeight: 700,
                  lineHeight: 0.95,
                  color: FG,
                  letterSpacing: "-0.02em"
                }}
              />
              <Chars
                text="You Go."
                cls="font-display"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                  fontWeight: 700,
                  lineHeight: 0.95,
                  color: FG,
                  letterSpacing: "-0.02em"
                }}
              />
            </div>
          </Rev>
          <Rev delay={0.2}>
            <div style={{ borderTop: `1px solid ${B}` }}>
              {listing?.guestRequirements?.length > 0 ? (
                listing.guestRequirements.map((req, i) => (
                  <PolicyItem key={`req-${i}`} req={req} />
                ))
              ) : (
                <p style={{ color: M, fontSize: 14, padding: "40px 0" }}>No specific requirements listed for this experience.</p>
              )}
              {(listing?.cancellationPolicyText || listing?.cancellationPolicy) && (
                <PolicyItem
                  req={{
                    setting: {
                      title: "Cancellation Policy",
                      description: listing.cancellationPolicyText || listing.cancellationPolicy
                    }
                  }}
                />
              )}
            </div>
          </Rev>
        </div>
      </div>
    </section>
  );
}

export default ExperienceProduct;
