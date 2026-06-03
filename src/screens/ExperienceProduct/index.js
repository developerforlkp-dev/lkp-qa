import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams, useHistory } from "react-router-dom";
import moment from "moment";
import cn from "classnames";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowDown, Check, Zap, MapPin, ChevronDown, Clock, User, Users, Camera, Coffee, Phone, Mail, Plus, Minus, Baby, Languages, ShieldCheck, ChevronLeft, Sparkles, Star, Compass, Share2 } from "lucide-react";
import { useTheme } from "../../components/JUI/Theme";
import { Cursor, ProgressBar, Rev, Chars, Mq, SHdr, E, Soul } from "../../components/JUI/UI";
import ShareButton from "../../components/ShareButton";
import { BookingSystem } from "../../components/JUI/BookingSystem";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import {
  getListing,
  getHost,
  getHostContent,
  getLeadDetails,
  getListingReviews,
  getEligibleBookings,
  submitOrderReview,
} from "../../utils/api";
import Rating from "../../components/Rating";
import { buildExperienceUrl, extractExperienceIdFromSlugAndId } from "../../utils/experienceUrl";
import Page from "../../components/Page";
import PhotoView from "../../components/PhotoView";
import RelatedListingsStrip from "../../components/RelatedListingsStrip";
import { lockBodyScroll } from "../../utils/scrollLock";
import useDocumentTitle from "../../hooks/useDocumentTitle";

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
  const { tokens: { A, BG }, theme } = useTheme();
  const scale = useTransform(progress, [0, 1], [1, 1.2]);
  const opacity = useTransform(progress, [0, 0.8], [1, 0]);
  const blur = useTransform(progress, [0, 0.5], [0, 10]);

  const isDark = theme === "dark";
  const imgFilter = isDark
    ? "brightness(0.45) contrast(1.1)"
    : "brightness(0.9) contrast(1.05)";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <motion.div style={{ scale, opacity, filter: `blur(${blur}px)`, width: "100%", height: "100%", position: "relative" }}>
        <img src={src || "/gallery/concert.png"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: imgFilter }} alt="" />
        <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 5, repeat: Infinity }} style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 40%, ${A}44 0%, transparent 60%)` }} />
        <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 7, repeat: Infinity, delay: 2 }} style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 70% 60%, ${A}33 0%, transparent 50%)` }} />
      </motion.div>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${BG}CC 70%, ${BG} 100%)` }} />
    </div>
  );
}

/* ─── HERO SHARE FAB ─────────────────────────── */
function HeroShareFab({ title, text, url }) {
  const [copied, setCopied] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { tokens: { A } } = useTheme();
  const glow = A || "#0097B2";

  const handleShare = async () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 700);
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch (_) { }
  };

  return (
    <motion.button
      className="premium-share-fab"
      onClick={handleShare}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.85, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.86 }}
      style={{
        position: "absolute",
        top: 96,
        right: 60,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: 44,
        maxWidth: hovered ? 200 : 44,
        overflow: "hidden",
        paddingLeft: 13,
        paddingRight: hovered ? 18 : 13,
        background: "rgba(0,151,178,0.13)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: `1.5px solid ${glow}55`,
        borderRadius: 50,
        cursor: "pointer",
        color: "#FFFFFF",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        boxShadow: hovered
          ? `0 0 20px ${glow}55, 0 0 50px ${glow}20, 0 6px 24px rgba(0,0,0,0.4)`
          : `0 0 10px ${glow}30, 0 4px 14px rgba(0,0,0,0.28)`,
        outline: "none",
        userSelect: "none",
        transition: "max-width 0.45s cubic-bezier(0.22,1,0.36,1), padding-right 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, border-color 0.35s ease",
      }}
    >
      {/* Radial ripple on click */}
      <motion.span
        animate={ripple ? { scale: [1, 3.4], opacity: [0.45, 0] } : { scale: 1, opacity: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        style={{ position: "absolute", inset: -2, borderRadius: 60, background: glow, pointerEvents: "none" }}
      />
      {/* Icon — always visible with unique animation */}
      <motion.span
        animate={{
          y: hovered ? 0 : [0, -2, 0, 2, 0],
          rotate: hovered ? 360 : 0,
          scale: hovered ? 1.15 : 1
        }}
        transition={{
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          rotate: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          scale: { duration: 0.3, ease: "easeOut" }
        }}
        style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 18, position: "relative" }}
      >
        <Share2 size={17} strokeWidth={2.2} />
      </motion.span>
      {/* Expandable label */}
      <span style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: hovered ? 140 : 0,
        opacity: hovered ? 1 : 0,
        marginLeft: hovered ? 9 : 0,
        position: "relative",
        transition: "max-width 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease 0.12s, margin-left 0.45s cubic-bezier(0.22,1,0.36,1)",
      }}>
        {copied ? "✓ Copied!" : "Share Journey"}
      </span>
    </motion.button>
  );
}



/* ─── MODAL IMAGE POPUP ────────────────────────── */
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
};

const EarlyBirdTicker = ({ discounts, A, FG, isDark }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!discounts || discounts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % discounts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [discounts]);

  if (!discounts || discounts.length === 0) return null;

  return (
    <div style={{ display: "grid", height: 15, alignItems: "center", overflow: "hidden" }}>
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            gridArea: "1 / 1",
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: FG || "#FFFFFF",
            fontWeight: 800,
            whiteSpace: "nowrap",
            display: "block"
          }}
        >
          <span style={{ opacity: 0.8 }}>Book</span>{" "}
          <span style={{ color: A, fontSize: 11, fontWeight: 900 }}>
            {discounts[index].daysInAdvance} Days
          </span>{" "}
          <span style={{ opacity: 0.8 }}>Advance:</span>{" "}
          <span style={{ color: isDark === false ? "#059669" : "#4ADE80", fontSize: 12, fontWeight: 900, letterSpacing: "0.1em" }}>
            {discounts[index].percentage}% OFF
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

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
  const [unavailablePopupOpen, setUnavailablePopupOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Normalize reviews data for consistent usage
  const normalizedReviews = useMemo(() => {
    if (!reviews) return [];
    if (Array.isArray(reviews)) return reviews;
    // Handle { reviews: [...], summary: {...} }
    if (Array.isArray(reviews?.reviews)) return reviews.reviews;
    // Handle { data: { reviews: [...] } }
    if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
    // Handle { data: [...] }
    if (Array.isArray(reviews?.data)) return reviews.data;
    // Handle { items: [...] }
    if (Array.isArray(reviews?.items)) return reviews.items;
    return [];
  }, [reviews]);



  const [loading, setLoading] = useState(true);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activityPhotoVisible, setActivityPhotoVisible] = useState(false);
  const [activityPhotoSrc, setActivityPhotoSrc] = useState(null);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const unavailableRedirectRef = useRef(false);
  const hostLeadUserId = hostData?.host?.leadUserId || hostData?.leadUserId || listing?.leadUserId || listing?.host?.leadUserId || listing?.hostId || listing?.host?.id;
  const leadIdForProfile = leadData?.leadId || leadData?.id || listing?.leadId || listing?.lead_id || listing?.host?.leadId || null;
  const displayHostName =
    [leadData?.firstName, leadData?.lastName].filter(Boolean).join(" ").trim() ||
    [hostData?.host?.firstName, hostData?.host?.lastName].filter(Boolean).join(" ").trim() ||
    [hostData?.firstName, hostData?.lastName].filter(Boolean).join(" ").trim() ||
    hostData?.host?.displayName ||
    hostData?.displayName ||
    hostData?.host?.name ||
    hostData?.name ||
    "Host";
  const hostPhone =
    leadData?.phoneNumber ||
    leadData?.contactNumber ||
    leadData?.altPhoneNumber ||
    hostData?.host?.phoneNumber ||
    hostData?.phoneNumber ||
    hostData?.host?.phone ||
    hostData?.phone ||
    hostData?.mobile ||
    hostData?.contactNumber ||
    listing?.host?.phoneNumber ||
    listing?.host?.phone ||
    listing?.host?.mobile ||
    listing?.host?.contactNumber ||
    "";
  const hostEmail =
    leadData?.email ||
    leadData?.altEmail ||
    hostData?.host?.email ||
    hostData?.email ||
    hostData?.emailAddress ||
    listing?.host?.email ||
    listing?.host?.emailAddress ||
    "";

  const isListingUnavailable = (payload) => {
    if (!payload || typeof payload !== "object") return true;
    const status = String(payload?.status || payload?.listingStatus || payload?.state || payload?.approvalStatus || "").trim().toUpperCase();
    if (status === "DISABLED" || status === "DRAFT" || status === "INACTIVE" || status === "UNPUBLISHED" || status === "REJECTED") {
      return true;
    }
    if (payload?.isActive === false || payload?.is_active === false) return true;
    return false;
  };

  const showUnavailablePopupAndRedirect = () => {
    setLoading(false);
    unavailableRedirectRef.current = true;
    setUnavailablePopupOpen(true);
  };

  // Dynamic browser tab title
  useDocumentTitle(listing?.title, "Experiences");

  const handleUpdateAddonQuantity = (addon, delta) => {
    const addonId = addon.addonId || addon.id;
    const pricingType = addon.pricingType || (addon.priceType === "per_booking" ? "Group" : "Individual");

    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => (a.addonId || a.id) === addonId);

      if (delta > 0) {
        // Enforcement: If it's a Group item, quantity is ALWAYS 1
        if (pricingType === "Group") {
          // If already selected, do nothing
          if (existing) return prev;

          // Only one Group item type allowed per booking
          const otherGroupItem = prev.find(a =>
            (a.pricingType === "Group" || (a.priceType === "per_booking"))
          );
          if (otherGroupItem) {
            return [...prev.filter(a => (a.addonId || a.id) !== (otherGroupItem.addonId || otherGroupItem.id)), { ...addon, quantity: 1, pricingType }];
          }
          return [...prev, { ...addon, quantity: 1, pricingType }];
        }

        // For Individual items, allow increasing quantity
        if (existing) {
          return prev.map((a) =>
            (a.addonId || a.id) === addonId
              ? { ...a, quantity: (a.quantity || 1) + delta }
              : a
          );
        }
        return [...prev, { ...addon, quantity: 1, pricingType }];
      } else {
        // Removal/Decrease logic
        if (existing) {
          if (existing.quantity > 1) {
            return prev.map((a) =>
              (a.addonId || a.id) === addonId
                ? { ...a, quantity: a.quantity - 1 }
                : a
            );
          }
          return prev.filter((a) => (a.addonId || a.id) !== addonId);
        }
        return prev;
      }
    });
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const data = await getListing(id);
        if (!mounted) return;

        if (isListingUnavailable(data)) {
          showUnavailablePopupAndRedirect();
          return;
        }

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
            getHostContent(hostId).then(resp => {
              if (mounted) {
                setHostData(resp.host || resp);
              }
            }).catch(e => console.warn(e));
          }

          // Fetch dynamic reviews for the listing
          getListingReviews(id).then(resp => {
            if (mounted && resp) {
              console.log(`💬 Fetched reviews for ${id}:`, resp);
              if (resp.reviews) setReviews(resp.reviews);
              else if (Array.isArray(resp)) setReviews(resp);

              if (resp.summary) setReviewSummary(resp.summary);
              setReviewsLoading(false);
            }
          }).catch(e => {
            console.warn("Error fetching reviews:", e);
            if (mounted) setReviewsLoading(false);
          });

          // Fetch eligible bookings for review
          getEligibleBookings().then(resp => {
            if (mounted && Array.isArray(resp)) {
              const forThisListing = resp.filter(b => String(b.listingId) === String(id));
              setEligibleBookings(forThisListing);
            }
          }).catch(e => console.warn("Failed to fetch eligible bookings:", e));

          const leadId = data.leadId || data.lead_id || data.host?.leadId || data.leadUserId;
          if (leadId) {
            getLeadDetails(leadId).then(resp => mounted && setLeadData(resp)).catch(e => console.warn(e));
          }

        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        const errorMessage = String(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          ""
        );
        const statusCode = Number(e?.response?.status);
        const isUnavailable =
          /status\s*:\s*disabled/i.test(errorMessage) ||
          /status\s*:\s*draft/i.test(errorMessage) ||
          /no\s*longer\s*available/i.test(errorMessage) ||
          /listing\s*not\s*found/i.test(errorMessage) ||
          /not\s*found/i.test(errorMessage) ||
          statusCode === 404 ||
          statusCode === 410;
        if (isUnavailable) {
          showUnavailablePopupAndRedirect();
          return;
        }
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [history, id]);

  const handleUnavailablePopupClose = () => {
    setUnavailablePopupOpen(false);
    if (unavailableRedirectRef.current) {
      unavailableRedirectRef.current = false;
      history.replace("/");
    }
  };

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const textY = useTransform(heroProgress, [0, 1], [0, -200]);
  const fade = useTransform(heroProgress, [0, 0.6], [1, 0]);

  if (loading && !listing) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: BG }}><Loader /></div>;
  }

  const description = listing?.description || listing?.aboutListing || "";
  const primaryCategoryId =
    listing?.primaryCategoryId ||
    listing?.primaryCategory?.id ||
    listing?.primaryCategory ||
    listing?.categoryId ||
    listing?.category?.id ||
    listing?.category;
  const currentListingId = listing?.listingId || listing?.id || id;
  const fallbackLocationValues = [
    listing?.locationName,
    listing?.location,
    listing?.city,
    listing?.district,
    listing?.state,
  ].filter(Boolean);
  const fallbackTagValues = Array.isArray(listing?.tags)
    ? listing.tags.map((t) => (typeof t === "string" ? t : t?.name || t?.tag || t?.label || t?.value)).filter(Boolean)
    : [];
  const fallbackSpecialLabelValues = Array.isArray(listing?.specialLabels)
    ? listing.specialLabels.map((s) => (typeof s === "string" ? s : s?.name || s?.label || s?.value)).filter(Boolean)
    : [];

  const displayTags = listing?.tags || [];
  const navigateToHostProfile = () => {
    const profileId = leadIdForProfile || hostLeadUserId;
    if (!profileId) return;
    const query = new URLSearchParams();
    query.set("id", String(profileId));
    if (leadIdForProfile) query.set("leadId", String(leadIdForProfile));
    if (hostLeadUserId) query.set("leadUserId", String(hostLeadUserId));
    history.push(`/host-profile?${query.toString()}`);
  };

  return (
    <Page>
      <main style={{ background: BG }}>
        {/* HERO SECTION */}
        <section ref={heroRef} className="hero-section" style={{ position: "relative", minHeight: "110vh", overflow: "hidden", display: "flex", alignItems: "center", zIndex: 50 }}>
          <ExperienceBg progress={heroProgress} src={formatImageUrl(listing?.coverPhotoUrl)} />
          <div className="hero-container" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 60px", position: "relative", zIndex: 10, width: "100%" }}>
            <motion.div style={{ opacity: fade, y: textY }}>
              <p className="hero-subtitle" style={{ fontSize: 12, letterSpacing: "1em", textTransform: "uppercase", color: A, fontWeight: 800, marginBottom: 40, fontFamily: 'monospace' }}>The Narrative Experience</p>
              <Rev>
                <h1 style={{ fontSize: "clamp(4.5rem, 12vw, 10rem)", fontWeight: 900, lineHeight: 0.85, color: "#FFFFFF", marginBottom: 40, letterSpacing: "-0.04em" }} className="font-display">
                  {listing?.title}
                </h1>
              </Rev>
              <Rev delay={0.2}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }} className="hero-stats">
                  <div style={{ borderLeft: "2px solid #0097B2", paddingLeft: 24 }} className="hero-stat-box">
                    <p style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "#0097B2", marginBottom: 20, fontWeight: 700 }} className="hero-stat-num">01. Atmospherics</p>
                    <p style={{ fontSize: 18, color: "#D4D4D4", lineHeight: 1.6, fontWeight: 400 }} className="hero-stat-desc">{listing?.experienceType || "A multisensory odyssey that blurs the line between perception and possibility."}</p>
                  </div>
                  <div style={{ borderLeft: "2px solid #0097B2", paddingLeft: 24 }} className="hero-stat-box">
                    <p style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: "#0097B2", marginBottom: 20, fontWeight: 700 }} className="hero-stat-num">02. Interaction</p>
                    <p style={{ fontSize: 18, color: "#D4D4D4", lineHeight: 1.6, fontWeight: 400 }} className="hero-stat-desc">{listing?.activityType || "High-fidelity touchpoints that respond to your presence in real-time."}</p>
                  </div>
                </div>
              </Rev>
            </motion.div>
          </div>
          <button
            type="button"
            className="premium-back-button"
            onClick={() => history.goBack()}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <HeroShareFab
            title={listing?.title}
            text={listing?.description || listing?.aboutListing || ""}
            url={window.location.href}
          />
          {listing?.earlyBirdDiscounts?.some(d => d.isActive) && (
            <motion.div
              className="early-bird-wrapper"
              style={{ position: "absolute", bottom: 60, right: 60, opacity: fade }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: theme === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(12px)",
                  padding: "12px 24px",
                  borderRadius: 100,
                  border: `1px solid ${A}33`,
                  boxShadow: `0 10px 30px rgba(0,0,0,0.2), inset 0 0 20px ${A}11`,
                  whiteSpace: "nowrap"
                }}
              >
                <Sparkles color={A} size={14} />
                <EarlyBirdTicker discounts={listing.earlyBirdDiscounts.filter(d => d.isActive).sort((a, b) => b.percentage - a.percentage)} A={A} FG={FG} isDark={theme === "dark"} />
              </motion.div>
            </motion.div>
          )}
        </section>



        {/* GALLERY SECTION */}
        <section className="gallery-section" style={{ background: W, padding: "80px 0 60px", overflow: "hidden", display: "flex", position: "relative" }}>
          {(() => {
            const baseItemsLocal = galleryItems.length > 0 ? galleryItems : ["/images/content/placeholder.jpg"];
            let filledItems = [...baseItemsLocal];
            while (filledItems.length < 8) {
              filledItems = [...filledItems, ...baseItemsLocal];
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
                    onClick={() => {
                      setPhotoIndex(i % (galleryItems.length || 1));
                      setPhotoVisible(true);
                    }}
                    style={{ width: "clamp(300px, 25vw, 450px)", height: 400, borderRadius: 24, overflow: "hidden", flexShrink: 0, border: `1px solid ${B}`, cursor: "pointer" }}
                    className="gallery-item"
                  >
                    <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Gallery" />
                  </motion.div>
                ))}
              </motion.div>
            );
          })()}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setPhotoIndex(0);
              setPhotoVisible(true);
            }}
            style={{
              position: "absolute",
              bottom: "80px",
              right: "40px",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: W,
              color: FG,
              border: `1px solid ${B}`,
              padding: "12px 24px",
              borderRadius: "100px",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
              cursor: "pointer"
            }}
          >
            <Camera size={16} />
            See all photos
          </motion.button>



          <AnimatePresence>
            {photoVisible && (
              <FullScreenImage
                src={galleryItems[photoIndex] || (galleryItems.length > 0 ? galleryItems[0] : "/images/content/placeholder.jpg")}
                items={galleryItems.length > 0 ? galleryItems : ["/images/content/placeholder.jpg"]}
                currentIndex={photoIndex}
                onNavigate={setPhotoIndex}
                onClose={() => setPhotoVisible(false)}
              />
            )}
          </AnimatePresence>
        </section>



        {/* DETAILS SECTION */}
        <section className="details-section" style={{ background: BG, padding: "48px 36px 80px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div className="section-header-wrapper"><SHdr idx="01" label="Story" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }} className="details-grid">
              <Soul delay={0.1} style={{ gridColumn: "span 2", gridRow: "span 2" }}>
                <div className="what-we-do-card" style={{ background: W, border: `1px solid ${B}`, padding: 40, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 20 }}>Your Journey Begins</h2>
                    <p style={{ color: M, fontSize: 14, lineHeight: 1.7 }}>{description}</p>
                  </div>
                </div>
              </Soul>
              <Soul y={40} r={5} style={{ gridColumn: "span 1" }}>
                <div className="overview-card" style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Clock size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>
                    {listing?.duration ? `${listing.duration} ${listing.durationUnit || ""}` : "2.5 Hrs"}
                  </p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Duration</p>
                </div>
              </Soul>
              <Soul y={40} r={-5} style={{ gridColumn: "span 1" }}>
                <div className="overview-card" style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <User size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.minimumAge || "18+"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Min Age</p>
                </div>
              </Soul>
              <Soul y={40} r={5} style={{ gridColumn: "span 1" }}>
                <div className="overview-card" style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Zap size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.difficultyLevel || "Moderate"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Difficulty</p>
                </div>
              </Soul>
              <Soul y={40} r={-5} style={{ gridColumn: "span 1" }}>
                <div className="overview-card" style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Baby size={24} color={A} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: FG, marginBottom: 4 }}>{listing?.allowsInfants || listing?.infantsAllowed ? "Allowed" : "No"}</p>
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: M }}>Infants</p>
                </div>
              </Soul>
              <Soul y={40} r={5} style={{ gridColumn: "span 1" }}>
                <div className="overview-card" style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
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
                <div className="overview-card" style={{ background: S, border: `1px solid ${B}`, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
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


            <div className="section-header-wrapper" style={{ marginTop: 80 }}><SHdr idx="02" label="Flow" /></div>
            <Rev delay={0.4} style={{ marginTop: 16 }}>
              <div style={{ background: W, border: `1px solid ${B}`, padding: "64px", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80 }} className="details-inner">
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: A, marginBottom: 32, fontWeight: 600 }}>Make it Yours</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {(listing?.addons || []).length > 0 ? (listing.addons.map((item, i) => {
                      const addon = item.addon || item;
                      const addonId = addon.addonId || addon.id;
                      const pricingType = addon.pricingType || (addon.priceType === "per_booking" ? "Group" : "Individual");
                      const addonImage = addon.imageUrl || (addon.imageUrls && addon.imageUrls[0]) || addon.image;
                      const isSelected = selectedAddOns.some(a => (a.addonId || a.id) === addonId);

                      return (
                        <motion.div
                          key={i}
                          whileHover={{ x: 10 }}
                          transition={{ duration: 0.3 }}
                          className="addon-item"
                          style={{
                            display: "flex",
                            gap: 24,
                            alignItems: "center",
                            padding: "20px",
                            background: isSelected ? AL : "transparent",
                            borderRadius: 24,
                            border: `1px solid ${isSelected ? A : "transparent"}`,
                            transition: "0.3s"
                          }}
                        >
                          <div className="addon-img" style={{ background: AL, width: 64, height: 64, borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${B}` }}>
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
                          <div className="addon-content" style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="addon-header">
                              <div className="addon-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <p style={{ fontSize: 18, fontWeight: 700, color: FG }}>{addon.title}</p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="addon-actions">
                                <span className="addon-badge" style={{ fontSize: 10, fontWeight: 700, color: pricingType === "Group" ? "#d14343" : A, background: pricingType === "Group" ? "#d1434322" : AL, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>{pricingType}</span>
                                {isSelected ? (
                                  pricingType === "Group" ? (
                                    <button
                                      className="addon-btn addon-btn-remove"
                                      onClick={() => handleUpdateAddonQuantity(addon, -1)}
                                      style={{
                                        background: AL,
                                        color: A,
                                        border: `1px solid ${A}`,
                                        borderRadius: 100,
                                        padding: "0 20px",
                                        height: "36px",
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em"
                                      }}
                                    >
                                      Remove
                                    </button>
                                  ) : (
                                    <div className="addon-counter" style={{ display: "flex", alignItems: "center", gap: 16, background: S, borderRadius: 100, padding: "0 12px", height: "36px", border: `1px solid ${B}` }}>
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
                                  )
                                ) : (
                                  <button
                                    className="addon-btn addon-btn-add"
                                    onClick={() => handleUpdateAddonQuantity(addon, 1)}
                                    style={{
                                      background: S,
                                      color: FG,
                                      border: `1px solid ${B}`,
                                      borderRadius: 100,
                                      padding: "0 20px",
                                      height: "36px",
                                      display: "flex",
                                      alignItems: "center",
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
                            <p className="addon-desc" style={{ fontSize: 14, color: M, lineHeight: 1.6 }}>{addon.briefDescription || addon.description}</p>
                            {addon.price > 0 && (
                              <div className="addon-price" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
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
                  <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: M, marginBottom: 32, fontWeight: 600 }}>How it Unfolds</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 40, position: "relative" }}>
                    <div style={{ position: "absolute", left: 7, top: 10, bottom: 10, width: 1, background: B }} />

                    {(listing?.keyActivities || []).map((it, i) => {
                      const activityImageUrl = getActivityImageUrl(it);
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.4 }}
                          className="activity-item"
                          style={{ display: "flex", gap: 32, alignItems: "flex-start", zIndex: 1, cursor: "default", width: "100%" }}>
                          {/* ── STATIC LAYER: circular node stays fixed, never receives hover transform ── */}
                          <div style={{ width: 15, height: 15, borderRadius: "50%", background: W, border: `3px solid ${A}`, marginTop: 6, flexShrink: 0, position: "relative", zIndex: 2 }} />
                          {/* ── ANIMATED LAYER: only the content card slides on hover ── */}
                          <motion.div
                            whileHover={{ x: 10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ display: "flex", gap: 24, alignItems: "flex-start", flex: 1, willChange: "transform" }}
                          >
                            {activityImageUrl && (
                              <div
                                style={{ width: 120, height: 90, borderRadius: 16, overflow: "hidden", border: `1px solid ${B}`, flexShrink: 0, background: S, cursor: "pointer" }}
                                onClick={() => { setActivityPhotoSrc(activityImageUrl); setActivityPhotoVisible(true); }}
                              >
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
                          </motion.div>
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
        <section className="prep-section" style={{ background: W, padding: "80px 36px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            <div className="section-header-wrapper"><SHdr idx="03" label="Landscape" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }} className="prep-grid">
              <Rev delay={0.1}>
                <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 32 }}>Where it All Happens</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <MapPin size={24} color={A} />
                    <p style={{ fontSize: 18, fontWeight: 700, color: FG }}>{listing?.meetingLocationName || "The Grand Atrium"}</p>
                  </div>
                  <div style={{ background: W, border: `1px solid ${B}`, height: 320, position: "relative", overflow: "hidden", borderRadius: 16 }}>
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
                    <h3 style={{ fontSize: "clamp(2rem,3vw,2.5rem)", fontWeight: 700, color: FG, marginBottom: 24 }}>Where it is</h3>
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

        <ExperiencePolicies listing={listing} />
        <QualityIndexSection qualityIndex={listing?.lkpQualityIndex} />



        {/* HOST SECTION */}
        <section className="host-section" style={{ background: BG, padding: "80px 36px 160px" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }} className="host-grid">
            <Rev delay={0.1} style={{ height: "100%" }}>
              <div className="section-header-wrapper"><SHdr idx="05" label="Peoples" /></div>
              <div style={{ padding: 48, background: W, border: `1px solid ${B}`, height: "calc(100% - 56px)", display: "flex", flexDirection: "column" }}>
                <h3
                  onClick={navigateToHostProfile}
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: FG,
                    marginBottom: 8,
                    cursor: (leadIdForProfile || hostLeadUserId) ? "pointer" : "default",
                    textDecoration: (leadIdForProfile || hostLeadUserId) ? "underline" : "none",
                    textDecorationThickness: "2px",
                    textUnderlineOffset: "5px"
                  }}
                  title={(leadIdForProfile || hostLeadUserId) ? "View host profile" : undefined}
                >
                  {displayHostName}
                </h3>
                <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: A, marginBottom: 24 }}>Host</p>
                <p style={{ fontSize: 13, color: M, lineHeight: 1.8, flex: 1 }}>{hostData?.host?.bio || hostData?.bio || hostData?.about || ""}</p>
                {(hostPhone || hostEmail) && (
                  <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${B}`, paddingTop: 24 }}>
                    {hostPhone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, color: FG, fontSize: 13 }}>
                        <Phone size={14} color={A} /> {hostPhone}
                      </div>
                    ) : null}
                    {hostEmail ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, color: FG, fontSize: 13 }}>
                        <Mail size={14} color={A} /> {hostEmail}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </Rev>
            <Rev delay={0.2} style={{ height: "100%" }}>
              <div className="section-header-wrapper"><SHdr idx="06" label="What Others Are Saying" /></div>
              <div style={{ padding: "40px 32px", background: W, border: `1px solid ${B}`, height: "calc(100% - 56px)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                <ReviewsSection
                  reviews={reviews}
                  summary={reviewSummary}
                  listingId={id}
                  eligibleBookings={eligibleBookings}
                  onReviewSubmitted={() => {
                    getListingReviews(id).then(resp => setReviews(resp)).catch(e => console.warn(e));
                  }}
                />
              </div>
            </Rev>

          </div>
        </section>


        <BookingSystem
          listing={listing}
          selectedAddOns={selectedAddOns}
          onUpdateAddonQuantity={handleUpdateAddonQuantity}
        />

        <RelatedListingsStrip
          businessInterestId={1}
          primaryCategoryId={primaryCategoryId}
          currentListingId={currentListingId}
          fallbackLocationValues={fallbackLocationValues}
          fallbackTagValues={fallbackTagValues}
          fallbackSpecialLabelValues={fallbackSpecialLabelValues}
          title="More Experiences You May Like"
        />
      </main>
      <AnimatePresence>
        {unavailablePopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ y: 16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 8, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                width: "100%",
                maxWidth: 420,
                background: S,
                color: FG,
                border: `1px solid ${B}`,
                borderRadius: 16,
                boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
                padding: 20,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: FG }}>
                Experience Unavailable
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: M }}>
                Experience no longer available.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  type="button"
                  onClick={handleUnavailablePopupClose}
                  style={{
                    border: "none",
                    background: A,
                    color: W,
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Go to Home
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        /* Premium readability and visibility overrides for the Hero Section */
        .hero-section {
          background-color: var(--BG, #080808) !important;
        }

        /* LIGHT THEME SPECIFIC STYLES */
        [data-theme='light'] .hero-section h1.font-display {
          color: #20242C !important;
          -webkit-text-fill-color: #20242C !important;
          text-shadow: none !important;
        }
        [data-theme='light'] .hero-section .hero-subtitle {
          color: #008CA5 !important;
          -webkit-text-fill-color: #008CA5 !important;
          text-shadow: none !important;
        }
        [data-theme='light'] .hero-section .hero-stats .hero-stat-num {
          color: #008CA5 !important;
          -webkit-text-fill-color: #008CA5 !important;
          text-shadow: none !important;
        }
        [data-theme='light'] .hero-section .hero-stats .hero-stat-desc {
          color: #2E2E2E !important;
          -webkit-text-fill-color: #2E2E2E !important;
          text-shadow: none !important;
        }
        [data-theme='light'] .hero-section .hero-stats .hero-stat-box {
          border-left-color: #0097B2 !important;
        }

        /* DARK THEME SPECIFIC STYLES */
        [data-theme='dark'] .hero-section h1.font-display {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          text-shadow: none !important;
        }
        [data-theme='dark'] .hero-section .hero-subtitle {
          color: var(--A, #0097B2) !important;
          -webkit-text-fill-color: var(--A, #0097B2) !important;
          text-shadow: none !important;
        }
        [data-theme='dark'] .hero-section .hero-stats .hero-stat-num {
          color: var(--A, #0097B2) !important;
          -webkit-text-fill-color: var(--A, #0097B2) !important;
          text-shadow: none !important;
        }
        [data-theme='dark'] .hero-section .hero-stats .hero-stat-desc {
          color: #E6E6E3 !important;
          -webkit-text-fill-color: #E6E6E3 !important;
          text-shadow: none !important;
        }
        [data-theme='dark'] .hero-section .hero-stats .hero-stat-box {
          border-left-color: var(--A, #0097B2) !important;
        }

        @media(max-width: 1024px) {
          .hero-container { padding: 0 40px !important; }
          .details-section, .prep-section, .policies-section { padding: 60px 24px !important; }
          .host-section { padding: 60px 24px 140px !important; }
          .details-inner { grid-template-columns: 1fr !important; gap: 48px !important; padding: 40px !important; }
          .pol-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .early-bird-wrapper { bottom: 40px !important; right: 40px !important; }
        }

        @media(max-width: 900px) { 
          main { padding-bottom: calc(120px + env(safe-area-inset-bottom)) !important; }
          .hero-stats { grid-template-columns: 1fr !important; gap: 40px !important; } 
          .gal-grid { grid-template-columns: 1fr 1fr !important; grid-auto-rows: 240px !important; gap: 8px !important; }
          .details-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .details-grid > div:first-child { grid-column: span 2 !important; }
          .prep-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .host-grid { grid-template-columns: 1fr !important; }
          .quality-card { flex-direction: column !important; gap: 40px !important; padding: 60px 32px !important; }
          .quality-score-unit { transform: scale(0.8) translateZ(80px) !important; }
          .gallery-item { height: 300px !important; width: 260px !important; }
        }

        @media(max-width: 600px) {
          .hero-section { min-height: 90vh !important; }
          .hero-container { padding: 0 24px !important; }
          .hero-section h1 { font-size: 3.5rem !important; }
          .details-section, .prep-section, .policies-section { padding: 40px 16px !important; }
          .host-section { padding: 40px 16px 120px !important; }
          .section-header-wrapper > div { margin-bottom: 20px !important; }
          .details-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .details-grid > div:first-child { grid-column: span 2 !important; }
          .what-we-do-card { padding: 24px 20px !important; }
          .what-we-do-card h2 { font-size: 1.8rem !important; }
          .overview-card { padding: 20px 12px !important; }
          .overview-card p:first-of-type { font-size: 16px !important; }
          .details-inner { padding: 24px 16px !important; margin: 24px -16px !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          .activity-item { gap: 12px !important; margin-bottom: 24px !important; }
          .activity-item > div:first-child { 
            width: 10px !important; 
            height: 10px !important; 
            margin-top: 8px !important; 
            border-width: 2px !important;
            display: block !important; 
          }
          .activity-item > div:last-child { 
            flex-direction: row !important; 
            gap: 16px !important; 
            padding: 12px !important; 
            border-radius: 16px !important;
            background: #fff !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.04) !important;
            border: 1px solid #eaeaea !important;
            align-items: center !important;
          }
          .activity-item img { width: 100% !important; height: 100% !important; }
          .activity-item > div:last-child > div:first-child { 
            /* This targets either the image or the text wrapper if image is missing. But usually all have images or none. */
            width: 64px !important; 
            height: 64px !important; 
            border-radius: 10px !important; 
          }
          .activity-item > div:last-child > div:last-child { 
            gap: 2px !important; 
          }
          .activity-item > div:last-child > div:last-child > div:first-child { 
            gap: 4px !important; 
            flex-direction: column !important; 
            align-items: flex-start !important; 
          }
          .activity-item > div:last-child > div:last-child > div:first-child > span:first-child { 
            font-size: 10px !important; 
          }
          .activity-item > div:last-child > div:last-child > div:first-child > span:last-child { 
            font-size: 14px !important; 
            line-height: 1.2 !important; 
          }
          .activity-item > div:last-child > div:last-child > p { 
            font-size: 12px !important; 
            line-height: 1.4 !important; 
            margin-top: 4px !important; 
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
          .prep-grid { gap: 32px !important; }
          .prep-grid h3 { font-size: 1.8rem !important; margin-bottom: 20px !important; }
          .host-grid { gap: 32px !important; }
          .quality-card { padding: 48px 20px !important; border-radius: 32px !important; }
          .quality-score-unit { transform: scale(0.7) translateZ(50px) !important; }
          .quality-card h3 { font-size: 32px !important; }
          .gallery-item { height: 240px !important; width: 200px !important; }
          .early-bird-wrapper { bottom: 20px !important; right: 20px !important; }
          
          /* Global bottom safe area for sticky Reserve button removed from here, applied to main */

          /* Addons mobile */
          .addon-item { 
            align-items: center !important; 
            padding: 16px 12px !important; 
            gap: 16px !important; 
            border-radius: 20px !important;
          }
          .addon-img { 
            width: 76px !important;
            height: 76px !important;
            border-radius: 14px !important;
            aspect-ratio: 1/1 !important;
            flex-shrink: 0 !important;
          }
          .addon-content {
            display: grid !important;
            grid-template-areas: 
              "title title"
              "badge badge"
              "price btn";
            grid-template-columns: 1fr auto !important;
            row-gap: 6px !important;
            column-gap: 8px !important;
            align-items: center !important;
            flex: 1 !important;
          }
          .addon-header { 
            display: contents !important; 
          }
          .addon-title { 
            grid-area: title !important;
            margin-bottom: 2px !important;
          }
          .addon-title p { 
            font-size: 15px !important;
            line-height: 1.2 !important;
            letter-spacing: -0.02em !important;
          }
          .addon-actions { 
            display: contents !important;
          }
          .addon-badge { 
            grid-area: badge !important;
            justify-self: start !important;
            font-size: 9px !important;
            padding: 4px 8px !important;
            border-radius: 100px !important;
            letter-spacing: 0.05em !important;
          }
          .addon-btn, .addon-counter { 
            grid-area: btn !important;
            justify-self: end !important;
            height: 34px !important;
          }
          .addon-btn {
            padding: 0 18px !important;
            font-size: 12px !important;
            border-radius: 100px !important;
          }
          .addon-counter {
             height: 34px !important;
             padding: 0 8px !important;
             gap: 12px !important;
          }
          .addon-counter button {
             padding: 4px !important;
          }
          .addon-counter span {
             font-size: 13px !important;
             min-width: 16px !important;
          }
          .addon-desc { 
            display: none !important; 
          }
          .addon-price { 
            grid-area: price !important;
            margin-top: 0 !important;
            justify-content: flex-start !important;
          }
          .addon-price p:first-child {
            font-size: 14px !important;
            letter-spacing: -0.01em !important;
          }
        }
      `}</style>

      <AnimatePresence>
        {activityPhotoVisible && activityPhotoSrc && (
          <FullScreenImage
            src={activityPhotoSrc}
            onClose={() => setActivityPhotoVisible(false)}
          />
        )}
      </AnimatePresence>
    </Page>
  );
};



function PolicyItem({ req }) {
  const { tokens: { FG, A, M, AL, B, S } } = useTheme();
  const [op, setOp] = useState(false);

  const title = req.setting?.title;
  const description = req.setting?.description;
  const questions = req.questions || [];

  return (
    <motion.div
      layout
      style={{ borderBottom: `1px solid ${B}`, overflow: "hidden" }}
      whileHover={{ backgroundColor: AL }}
    >
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
          textAlign: "left",
          userSelect: "none"
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: op ? A : FG, display: "block", marginBottom: 8, transition: "color 0.3s" }}>{title}</span>
          {description && (
            <p style={{ fontSize: 13, color: M, lineHeight: 1.5, whiteSpace: "pre-line", margin: 0 }}>
              {description}
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: op ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ marginTop: 4, flexShrink: 0, display: "flex", alignItems: "center" }}
        >
          <ChevronDown size={18} color={M} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {op && questions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 16px 24px" }}>
              <div style={{ padding: "20px", background: AL, borderRadius: 16, border: `1px solid ${B}` }}>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, padding: 0, margin: 0 }}>
                  {questions.map((q, j) => {
                    const questionTitle = q.title || q.question?.title;
                    const answerText = q.answer?.valueText || q.valueText;

                    return (
                      <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: FG, lineHeight: 1.4, fontWeight: 500 }}>{questionTitle}</span>
                          {answerText && (
                            <span style={{ fontSize: 14, color: M, lineHeight: 1.4 }}>{answerText}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReviewsItem({ reviews, summary }) {
  const { tokens: { FG, A, M, AL, B, W, AH } } = useTheme();
  const [op, setOp] = useState(false);

  const normalizedReviews = useMemo(() => {
    if (Array.isArray(reviews)) return reviews;
    if (Array.isArray(reviews?.reviews)) return reviews.reviews;
    if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
    if (Array.isArray(reviews?.data)) return reviews.data;
    return [];
  }, [reviews]);
  const avgRating = summary?.averageRating || 0;
  const totalReviews = summary?.totalReviews || reviews.length;
  const ratingDisplay = avgRating > 0 ? avgRating.toFixed(1) : (reviews.length > 0 ? "5.0" : "0.0");

  return (
    <motion.div
      layout
      style={{ borderBottom: `1px solid ${B}`, overflow: "hidden" }}
      whileHover={{ backgroundColor: AL }}
    >
      <div
        onClick={() => setOp(!op)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 16px",
          cursor: "pointer",
          textAlign: "left",
          userSelect: "none"
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: op ? A : FG, transition: "color 0.3s" }}>Reviews</span>
            {avgRating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: AL, padding: "2px 8px", borderRadius: 100 }}>
                <Star size={10} color={A} fill={A} />
                <span style={{ fontSize: 11, fontWeight: 800, color: A }}>{ratingDisplay}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: M, margin: 0 }}>{totalReviews} {totalReviews === 1 ? 'guest' : 'guests'} shared their experience</p>
        </div>
        <motion.div
          animate={{ rotate: op ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center" }}
        >
          <ChevronDown size={18} color={M} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {op && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 16px 24px" }}>
              <div style={{ padding: "24px", background: AL, borderRadius: 16, border: `1px solid ${B}`, display: "flex", flexDirection: "column", gap: 24 }}>
                {normalizedReviews.length > 0 ? (
                  normalizedReviews.slice(0, 3).map((rev, i) => (
                    <div key={i} style={{ borderBottom: i === Math.min(normalizedReviews.length, 3) - 1 ? "none" : `1px solid ${B}`, paddingBottom: i === Math.min(normalizedReviews.length, 3) - 1 ? 0 : 24 }}>
                      <p style={{ fontSize: 14, fontStyle: "italic", color: FG, lineHeight: 1.6, marginBottom: 16 }}>&ldquo;{rev.comment || rev.text}&rdquo;</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, background: A, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: W, fontWeight: 700 }}>
                          {(rev.customerName || rev.author || "G")[0]}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>{rev.customerName || rev.author}</span>
                      </div>
                      {rev?.vendorResponse && (
                        <div style={{ marginTop: 16, padding: "12px 16px", background: AL, borderLeft: `3px solid ${A}`, borderRadius: "0 8px 8px 0" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Response from Host</div>
                          <p style={{ fontSize: 13, color: M, margin: 0, lineHeight: 1.5 }}>{rev.vendorResponse}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 14, color: M, textAlign: "center", margin: 0 }}>No reviews shared for this experience yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function QualityIndexSection({ qualityIndex }) {
  const { tokens: { A, AL, FG, M, B, W, S, BG } } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const sectionRef = useRef(null);

  if (!qualityIndex || !qualityIndex.score) return null;

  const score = qualityIndex.score;
  const displayName = qualityIndex.displayName;
  const description = qualityIndex.description;

  const handleMouseMove = (e) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      style={{
        background: BG,
        padding: "100px 20px",
        position: "relative",
        overflow: "hidden",
        borderTop: `1px solid ${B}`,
        borderBottom: `1px solid ${B}`,
        perspective: 2500,
        isolation: "isolate"
      }}
    >
      {/* ─── OPTIMIZED BACKGROUND ─── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(circle at 20% 30%, ${A}08 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, ${A}05 0%, transparent 50%)
        `,
        zIndex: 0
      }} />

      {/* Simplified Particles (No individual blurs) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.4 }}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: 3, height: 3,
              background: A,
              borderRadius: "50%"
            }}
          />
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

          <motion.div
            style={{
              rotateX: mousePos.y * -20,
              rotateY: mousePos.x * 20,
              transformStyle: "preserve-3d",
              width: "100%",
              display: "flex",
              justifyContent: "center"
            }}
          >
            {/* ─── THE MASTER HOLOGRAPHIC CARD ─── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
              viewport={{ once: true }}
              className="quality-card"
              style={{
                width: "100%", maxWidth: 900,
                background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
                backdropFilter: "blur(25px) saturate(160%)",
                borderRadius: 56,
                padding: "100px 80px",
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                boxShadow: `
                  0 50px 120px rgba(0,0,0,0.2), 
                  inset 0 0 60px rgba(255,255,255,0.05)
                `,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 100,
                position: "relative",
                transformStyle: "preserve-3d",
                overflow: "hidden",
                willChange: "transform",
                WebkitFontSmoothing: "antialiased",
                backfaceVisibility: "hidden",
                transform: "translateZ(1px) rotate(0.0001deg)",
                imageRendering: "-webkit-optimize-contrast"
              }}
            >
              {/* Glass Sheen Effect */}
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
                style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`,
                  transform: "skewX(-20deg)",
                  zIndex: 1,
                  pointerEvents: "none"
                }}
              />

              {/* ─── LEFT: SCORE UNIT ─── */}
              <div className="quality-score-unit" style={{ position: "relative", transform: "translateZ(120px) rotate(0.0001deg)", flexShrink: 0, willChange: "transform", backfaceVisibility: "hidden" }}>
                {/* Holographic Rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.05, 1] }}
                    transition={{
                      rotate: { duration: 20 + i * 10, repeat: Infinity, ease: "linear" },
                      scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    style={{
                      position: "absolute",
                      inset: -(30 + i * 25),
                      border: `1px solid ${A}${i === 0 ? "44" : "11"}`,
                      borderRadius: "50%",
                      opacity: 0.6 - (i * 0.2),
                      willChange: "transform"
                    }}
                  />
                ))}

                <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="260" height="260" viewBox="0 0 260 260" style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 20px ${A}33)` }}>
                    <circle cx="130" cy="130" r="120" fill="none" stroke={`${A}11`} strokeWidth="2" />
                    <motion.circle
                      cx="130" cy="130" r="120" fill="none" stroke={A} strokeWidth="8" strokeLinecap="round"
                      initial={{ strokeDasharray: "0 754" }}
                      whileInView={{ strokeDasharray: `${(score / 10) * 754} 754` }}
                      transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                    />
                  </svg>

                  <div style={{ position: "absolute", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
                      <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        style={{
                          fontSize: 110, fontWeight: 900, color: FG, lineHeight: 1,
                          fontFamily: "var(--font-display)", letterSpacing: "-0.05em",
                          background: `linear-gradient(to bottom, ${FG}, ${M})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent"
                        }}
                      >
                        {score}
                      </motion.span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: A, marginLeft: 4 }}>.0</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: A, textTransform: "uppercase", letterSpacing: "0.3em", opacity: 0.8 }}>Benchmark Score</span>
                  </div>
                </div>

                {/* Technical Micro-Metadata */}
                <div style={{ position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)", width: "max-content", textAlign: "center" }}>
                  <p style={{ fontSize: 9, fontFamily: "monospace", color: M, opacity: 0.6, letterSpacing: "0.1em" }}>
                    CALC_ID: 9x7742 // VAR_SIG: {Math.random().toString(16).slice(2, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* ─── RIGHT: CONTENT ─── */}
              <div style={{ flex: 1, transform: "translateZ(60px)" }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}
                >
                  <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, ${A}, transparent)` }} />
                  <span style={{ fontSize: 11, letterSpacing: "0.5em", textTransform: "uppercase", color: A, fontWeight: 900 }}>Quality Narrative</span>
                </motion.div>

                <h3 className="font-display" style={{ fontSize: 56, fontWeight: 900, color: FG, marginBottom: 24, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {displayName}
                </h3>

                <div style={{ position: "relative", padding: "0 0 0 32px", borderLeft: `3px solid ${A}` }}>
                  <p style={{ fontSize: 20, color: M, fontWeight: 400, lineHeight: 1.6, margin: 0, fontStyle: "italic", opacity: 0.95 }}>
                    &ldquo;{description}&rdquo;
                  </p>
                </div>

                {/* Amazing Elements: Enhanced Badges */}
                <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
                  {[
                    { icon: ShieldCheck, label: "LKP Verified" },
                    { icon: Zap, label: "High Fidelity" },
                    { icon: Sparkles, label: "Curated" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -5, color: A }}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 + (i * 0.15) }}
                      style={{ display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}
                    >
                      <item.icon size={20} color={A} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: FG, textTransform: "uppercase", letterSpacing: "0.15em" }}>{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ─── FLOATING OBJECTS ─── */}

              {/* Premium Quality Seal */}
              <motion.div
                animate={{
                  y: [-20, 20, -20],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", top: 40, right: 40, transform: "translateZ(150px)",
                  background: `rgba(255,255,255,0.05)`, border: `1px solid rgba(255,255,255,0.1)`,
                  padding: "16px 24px", borderRadius: 24,
                  backdropFilter: "blur(20px)", boxShadow: `0 30px 60px rgba(0,0,0,0.2)`,
                  willChange: "transform"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 10px #4ADE80" }} />
                  <span style={{ fontSize: 12, fontWeight: 900, color: FG, letterSpacing: "0.1em" }}>OPTIMAL STATUS</span>
                </div>
              </motion.div>

              {/* Glass Orb */}
              <motion.div
                animate={{
                  y: [20, -20, 20],
                  x: [0, 15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{
                  position: "absolute", bottom: 40, left: -40, transform: "translateZ(180px)",
                  width: 80, height: 80, borderRadius: "50%",
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, ${A}44 100%)`,
                  backdropFilter: "blur(5px)",
                  border: `1px solid rgba(255,255,255,0.2)`,
                  boxShadow: `0 20px 40px rgba(0,0,0,0.3)`,
                  willChange: "transform"
                }}
              />
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Background Decorative Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(${A}15 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        opacity: 0.3,
        maskImage: `radial-gradient(circle at center, black, transparent 80%)`,
        zIndex: 0
      }} />
    </section>
  );
}


function ExperiencePolicies({ listing }) {
  const { tokens: { FG, W, B, A, M } } = useTheme();

  return (
    <section className="policies-section" style={{ background: W, padding: "80px 36px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div className="section-header-wrapper"><SHdr idx="04" label="Essentials" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr", gap: 80, alignItems: "start" }} className="pol-grid">
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Chars
                text="Things To"
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
                text="Keep In"
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
                text="Mind"
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
              {(listing?.cancellationPolicySummary || listing?.cancellationPolicyText || listing?.cancellationPolicy) && (
                <PolicyItem
                  req={{
                    setting: {
                      title: "Cancellation Policy",
                      description: listing.cancellationPolicySummary || listing.cancellationPolicyText || listing.cancellationPolicy
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

function ReviewsSection({ reviews = [], summary, listingId, eligibleBookings = [], onReviewSubmitted }) {
  const { tokens: { A, FG, M, B, W, S, BG, AL } } = useTheme();
  const routerHistory = useHistory();

  const normalizedReviews = useMemo(() => {
    if (Array.isArray(reviews)) return reviews;
    if (Array.isArray(reviews?.reviews)) return reviews.reviews;
    if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
    if (Array.isArray(reviews?.data)) return reviews.data;
    return [];
  }, [reviews]);

  const hasReviews = normalizedReviews.length > 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (eligibleBookings.length === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      const booking = eligibleBookings[0];
      await submitOrderReview(booking.orderId, {
        rating,
        comment,
        listingId
      });
      setComment("");
      setRating(5);
      setShowForm(false);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {eligibleBookings.length > 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: A, color: W, border: "none", padding: "12px 24px", borderRadius: 100,
            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
            alignSelf: "flex-start"
          }}
        >
          Write a Review
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: S, border: `1px solid ${B}`, padding: 24, borderRadius: 20 }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: FG, marginBottom: 8 }}>Share your experience</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: FG, marginBottom: 8, textTransform: "uppercase" }}>Rating</p>
                <Rating rating={rating} onChange={setRating} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: FG, marginBottom: 8, textTransform: "uppercase" }}>Review</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you enjoy most?"
                  required
                  style={{
                    width: "100%", height: 80, background: W, border: `1px solid ${B}`,
                    borderRadius: 12, padding: 12, fontSize: 13, color: FG, resize: "none", outline: "none"
                  }}
                />
              </div>
              {error && <p style={{ color: "#FF4D4D", fontSize: 11 }}>{error}</p>}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" disabled={isSubmitting} style={{ background: A, color: W, border: "none", padding: "10px 20px", borderRadius: 100, fontSize: 11, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>
                  {isSubmitting ? "..." : "Post"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: `1px solid ${B}`, padding: "10px 20px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: FG, textTransform: "uppercase", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {summary && summary.averageRating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8, paddingBottom: 24, borderBottom: `1px solid ${B}` }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: FG, lineHeight: 1 }}>{summary.averageRating.toFixed(1)}</div>
            <div>
              <div style={{ display: "flex", color: "#FFC107", fontSize: 16, marginBottom: 4 }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i}>{i < Math.round(summary.averageRating) ? "★" : "☆"}</span>
                ))}
              </div>
              <p style={{ fontSize: 10, color: M, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Average Guest Rating</p>
            </div>
          </div>
        )}
        {!hasReviews && !showForm ? (
          <div style={{ padding: "40px 0", textAlign: "center", background: `${A}05`, borderRadius: 16, border: `1px dashed ${A}30` }}>
            <Sparkles size={24} style={{ color: A, opacity: 0.5, marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: FG, fontWeight: 700, margin: 0 }}>No testimonials yet.</p>
          </div>
        ) : (
          normalizedReviews.slice(0, 3).map((rev, i) => (
            <Rev key={i} delay={i * 0.1}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: S, border: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 700, color: A }}>
                  {(rev.customerName || rev.author || "G")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: FG, marginBottom: 2 }}>{rev.customerName || rev.author || "Verified Guest"}</h4>
                      <div style={{ display: "flex", gap: 2, color: "#FFC107", fontSize: 10 }}>
                        {[...Array(5)].map((_, si) => (
                          <span key={si}>{si < (rev.rating || 5) ? "★" : "☆"}</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: M, fontWeight: 500 }}>
                      {rev.createdAt ? moment(rev.createdAt).format("MMM YYYY") : "Recently"}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: FG, lineHeight: 1.6, fontStyle: "italic", opacity: 0.9 }}>
                    &ldquo;{rev.comment || rev.text}&rdquo;
                  </p>
                  {rev?.vendorResponse && (
                    <div style={{ marginTop: 12, padding: "12px 16px", background: AL, borderLeft: `3px solid ${A}`, borderRadius: "0 8px 8px 0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: A, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Response from Host</div>
                      <p style={{ fontSize: 13, color: M, margin: 0, lineHeight: 1.5 }}>{rev.vendorResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </Rev>
          ))
        )}

        {normalizedReviews.length > 3 && !showForm && (
          <button
            onClick={() => routerHistory.push(`/reviews/experience/${listingId}`)}
            style={{
              width: "100%", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 12,
              color: A, border: `1px solid ${B}`, background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}
          >
            See More
            <Icon name="arrow-next" size="14" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ExperienceProduct;
