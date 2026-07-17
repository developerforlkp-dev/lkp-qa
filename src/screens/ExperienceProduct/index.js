import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useParams, useHistory, Link } from "react-router-dom";
import moment from "moment";
import cn from "classnames";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowDown, Check, Zap, MapPin, ChevronDown, Clock, User, Users, Camera, Coffee, Phone, Mail, Plus, Minus, Baby, Languages, ShieldCheck, ChevronLeft, ChevronRight, Sparkles, Star, Compass, Share2, Building, Map, Globe, Info } from "lucide-react";
import PolicyCategoryItem from "../../components/PolicyCategoryItem";
import { useTheme } from "../../components/JUI/Theme";
import { Cursor, ProgressBar, Rev, Chars, Mq, SHdr, E, Soul } from "../../components/JUI/UI";
import ShareButton from "../../components/ShareButton";
import { BookingSystem } from "../../components/JUI/BookingSystem";
import LoadingSkeleton from "../../components/LoadingSkeleton";
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
import FullScreenImage from "../../components/FullScreenImage";
import { lockBodyScroll } from "../../utils/scrollLock";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import Favorite from "../../components/Favorite";
import DetailPageNavPortal from "../../components/DetailPageNavPortal";
import useIsMobile from "../../hooks/useIsMobile";
import MobileExperienceView from "./MobileExperienceView";

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

const getActivityImages = (activity) => {
  const imgs = Array.isArray(activity?.images) ? activity.images : [];
  const urls = Array.isArray(activity?.imageUrls) ? activity.imageUrls : [];
  let rawUrls = [];
  if (imgs.length > 0) {
    rawUrls = imgs.map(img => typeof img === "string" ? img : (img.url || img.fileUrl || img.imageUrl));
  } else if (urls.length > 0) {
    rawUrls = urls.map(url => typeof url === "string" ? url : (url.url || url.fileUrl || url.imageUrl));
  }
  if (rawUrls.length === 0) {
    const single = getActivityImageUrl(activity);
    return single ? [single] : [];
  }
  return rawUrls.map(u => formatImageUrl(u)).filter(Boolean);
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
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 40%, #000000CC 70%, #000000 100%)` }} />
    </div>
  );
}

/* ─── HERO SHARE FAB ─────────────────────────── */
function HeroShareFab({ title, text, url, label = "Share Journey" }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { theme, tokens: { A, FG } } = useTheme();
  const glow = A || "#0097B2";
  const isDark = theme === "dark";
  const surface = isDark ? "#141414" : "#FFFFFF";
  const surfaceHover = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? FG : A;
  const borderColor = hovered ? glow : (isDark ? `${glow}66` : `${glow}4D`);
  const shadow = hovered
    ? isDark
      ? `0 0 20px ${glow}55, 0 0 50px ${glow}20, 0 8px 28px rgba(0,0,0,0.5)`
      : `0 0 18px ${glow}33, 0 8px 28px rgba(15,15,15,0.14)`
    : isDark
      ? `0 0 10px ${glow}30, 0 4px 14px rgba(0,0,0,0.34)`
      : "0 6px 18px rgba(15,15,15,0.12)";

  const handleShare = async (e) => {
    e.stopPropagation();
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
      onClick={handleShare}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.86 }}
      style={{
        height: 44,
        borderRadius: 22,
        background: hovered ? surfaceHover : surface,
        border: `1.5px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        boxShadow: shadow,
        cursor: "pointer",
        maxWidth: hovered ? 160 : 44,
        overflow: "hidden",
        paddingLeft: 12,
        paddingRight: hovered ? 16 : 12,
        transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), padding-right 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease, background 0.35s ease, border-color 0.35s ease",
        pointerEvents: "auto",
        position: "relative",
        zIndex: 200,
        outline: "none"
      }}
    >
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
        style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 20, position: "relative" }}
      >
        <Share2 size={20} color={textColor} />
      </motion.span>
      <span style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: hovered ? 130 : 0,
        opacity: hovered ? 1 : 0,
        marginLeft: hovered ? 8 : 0,
        position: "relative",
        transition: "max-width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease 0.1s, margin-left 0.4s cubic-bezier(0.22,1,0.36,1)",
        color: textColor,
        fontFamily: '"Inter", sans-serif',
        fontSize: 13,
        fontWeight: 600
      }}>
        {copied ? "Copied!" : label}
      </span>
    </motion.button>
  );
}

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
            fontSize: 11,
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

const ExperienceProduct = () => {
  const location = useLocation();
  const history = useHistory();
  const { slugAndId } = useParams();
  const params = new URLSearchParams(location.search);
  const idFromPath = extractExperienceIdFromSlugAndId(slugAndId);
  const idParam = params.get("id");
  const id = idFromPath || idParam || "1";

  const initialDateStr = params.get("date");
  const initialGuestsStr = params.get("guests");
  const initialAdultsStr = params.get("adults");
  const initialChildrenStr = params.get("children");
  const initialGuests = initialAdultsStr || initialChildrenStr
    ? { adults: Number(initialAdultsStr) || 0, children: Number(initialChildrenStr) || 0 }
    : (initialGuestsStr ? Number(initialGuestsStr) : null);

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
  const [expandedActivities, setExpandedActivities] = useState({});

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

  const sliderRef = useRef(null);
  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const cardWidth = 384; // width (360) + gap (24)
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const addonsSliderRef = useRef(null);
  const scrollAddonsSlider = (direction) => {
    if (!addonsSliderRef.current) return;
    const container = addonsSliderRef.current;
    const scrollAmount = direction === "left" ? -container.clientWidth : container.clientWidth;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };



  const [loading, setLoading] = useState(true);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [activityPhotoVisible, setActivityPhotoVisible] = useState(false);
  const [activityPhotoIndex, setActivityPhotoIndex] = useState(0);
  const [selectedActivityImages, setSelectedActivityImages] = useState([]);
  const [flowTab, setFlowTab] = useState("itinerary");
  const [narrativeExpanded, setNarrativeExpanded] = useState(false);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [langPopoverOpen, setLangPopoverOpen] = useState(false);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [currentAddonIndex, setCurrentAddonIndex] = useState(2);
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

  const handleUpdateAddonQuantity = (rawAddon, delta) => {
    const addonData = rawAddon.addon || rawAddon;
    const addonId = addonData.addonId || addonData.id;
    const pricingType = addonData.pricingType || (addonData.priceType === "per_booking" ? "Group" : "Individual");

    setSelectedAddOns((prev) => {
      const existing = prev.find((a) => {
        const aData = a.addon || a;
        return (aData.addonId || aData.id) === addonId;
      });

      if (delta > 0) {
        // Enforcement: If it's a Group item, quantity is ALWAYS 1
        if (pricingType === "Group") {
          // If already selected, do nothing
          if (existing) return prev;

          // Only one Group item type allowed per booking
          const otherGroupItem = prev.find(a => {
            const aData = a.addon || a;
            return aData.pricingType === "Group" || aData.priceType === "per_booking";
          });

          if (otherGroupItem) {
            const otherData = otherGroupItem.addon || otherGroupItem;
            return [...prev.filter(a => {
              const aData = a.addon || a;
              return (aData.addonId || aData.id) !== (otherData.addonId || otherData.id);
            }), { ...rawAddon, quantity: 1, pricingType }];
          }
          return [...prev, { ...rawAddon, quantity: 1, pricingType }];
        }

        // For Individual items, allow increasing quantity
        if (existing) {
          return prev.map((a) => {
            const aData = a.addon || a;
            return (aData.addonId || aData.id) === addonId
              ? { ...a, quantity: (a.quantity || 1) + delta }
              : a;
          });
        }
        return [...prev, { ...rawAddon, quantity: 1, pricingType }];
      } else {
        // Removal/Decrease logic
        if (existing) {
          if (existing.quantity > 1) {
            return prev.map((a) => {
              const aData = a.addon || a;
              return (aData.addonId || aData.id) === addonId
                ? { ...a, quantity: a.quantity - 1 }
                : a;
            });
          }
          return prev.filter((a) => {
            const aData = a.addon || a;
            return (aData.addonId || aData.id) !== addonId;
          });
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
              //console.log(`💬 Fetched reviews for ${id}:`, resp);
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
  const isMobile = useIsMobile();

  if (loading && !listing) {
    return (
      <div style={{ minHeight: '100vh', background: BG }}>
        <LoadingSkeleton variant="experience" />
      </div>
    );
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
  const cityOrDistrict = listing?.meetingCity || listing?.city || listing?.meetingDistrict || listing?.district;
  const state = listing?.meetingState || listing?.state;
  const combinedLocation = [cityOrDistrict, state].filter(Boolean).join(", ");

  const fallbackLocationValues = [
    listing?.locationName,
    listing?.location,
    combinedLocation,
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

  /* ── Mobile View ── */
  if (isMobile) {
    return (
      <Page hideBookings>
        <MobileExperienceView
          listing={listing}
          hostData={hostData}
          leadData={leadData}
          galleryItems={galleryItems}
          selectedAddOns={selectedAddOns}
          handleUpdateAddonQuantity={handleUpdateAddonQuantity}
          reviews={reviews}
          reviewSummary={reviewSummary}
          eligibleBookings={eligibleBookings}
          history={history}
          id={id}
          formatImageUrl={formatImageUrl}
          description={description}
          primaryCategoryId={primaryCategoryId}
          currentListingId={currentListingId}
          fallbackLocationValues={fallbackLocationValues}
          fallbackTagValues={fallbackTagValues}
          fallbackSpecialLabelValues={fallbackSpecialLabelValues}
          displayHostName={displayHostName}
          hostPhone={hostPhone}
          hostEmail={hostEmail}
          displayTags={displayTags}
          navigateToHostProfile={navigateToHostProfile}
          normalizedReviews={normalizedReviews}
        />
      </Page>
    );
  }

  return (
    <Page hideBookings>
      <DetailPageNavPortal heroRef={heroRef} activeCategory="experience" />
      <main style={{ background: BG }}>
        {/* HERO SECTION */}
        <section ref={heroRef} className="hero-section" style={{
          position: "relative",
          height: "50vh",
          minHeight: "400px",
          width: "calc(100% - 80px)",
          maxWidth: "1600px",
          margin: "0 auto",
          borderRadius: "32px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          zIndex: 50
        }}>
          <ExperienceBg progress={heroProgress} src={formatImageUrl(listing?.coverPhotoUrl)} />
          <div className="hero-container" style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "32px 40px",
            position: "relative",
            zIndex: 10,
            width: "100%"
          }}>
            {/* Top Row */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", width: "100%" }}>

              {/* Early Bird Ticker */}
              {listing?.earlyBirdDiscounts?.some(d => d.isActive) && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: theme === "dark" ? "#000000" : "#FFFFFF",
                  padding: "10px 20px",
                  borderRadius: "100px",
                  border: `1px solid ${B}`,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  zIndex: 200
                }}>
                  <Sparkles size={14} color="#F59E0B" fill="#F59E0B" style={{ flexShrink: 0 }} />
                  <EarlyBirdTicker discounts={listing.earlyBirdDiscounts.filter(d => d.isActive).sort((a, b) => b.percentage - a.percentage)} A={A} FG={FG} isDark={theme === "dark"} />
                </div>
              )}
            </div>

            {/* Bottom Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%", marginTop: "auto", gap: 24 }}>
              <motion.div style={{ opacity: fade, y: textY, display: "flex", flexDirection: "column", gap: 10 }}>
                <Rev>
                  {(() => {
                    const titleText = listing?.title || "";
                    const words = titleText.trim().split(/\s+/);
                    let displayTitle;

                    // Match the homepage accent word logic (last word is italic and cyan)
                    if (words.length >= 2) {
                      const lastWord = words.pop();
                      displayTitle = (
                        <>
                          {words.join(' ')}{' '}
                          <span style={{
                            fontStyle: "italic",
                            fontWeight: 500,
                            background: "linear-gradient(135deg, #08B5D6, #45D8F2)",
                            backgroundSize: "200% 200%",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}>
                            {lastWord}
                          </span>
                        </>
                      );
                    } else {
                      displayTitle = titleText;
                    }

                    return (
                      <h1 className="hero-title" style={{
                        fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                        fontWeight: 700,
                        lineHeight: 1.1,
                        color: "#FFFFFF",
                        margin: 0,
                        letterSpacing: "-0.01em",
                        fontFamily: '"Cormorant Garamond", "Playfair Display", serif'
                      }}>
                        {displayTitle}
                      </h1>
                    );
                  })()}
                </Rev>
                <Rev delay={0.15}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", fontSize: 16, fontWeight: 400, fontFamily: '"Inter", sans-serif' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="transparent" stroke={A || "#0097B2"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ fill: "transparent" }}>
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="transparent" />
                      <circle cx="12" cy="10" r="3" fill="transparent" />
                    </svg>
                    <span>{listing?.locationName || fallbackLocationValues[0] || "Location TBD"}</span>
                  </div>
                </Rev>
              </motion.div>

              <Rev delay={0.2} style={{ flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Favorite itemType="listing" itemId={id}>
                    {({ saved, onClick }) => {
                      const isDark = theme === "dark";
                      const surface = isDark ? "#141414" : "#FFFFFF";
                      const surfaceHover = isDark ? "#1A1A1A" : "#FFFFFF";
                      const borderColor = isDark ? `${A || "#0097B2"}66` : `${A || "#0097B2"}4D`;
                      const textColor = isDark ? FG : (A || "#0097B2");
                      const shadow = isDark
                        ? `0 0 10px ${A || "#0097B2"}30, 0 4px 14px rgba(0,0,0,0.34)`
                        : "0 6px 18px rgba(15,15,15,0.12)";

                      return (
                        <motion.button
                          whileHover={{ scale: 1.05, background: surfaceHover }}
                          whileTap={{ scale: 0.86 }}
                          onClick={(e) => { e.stopPropagation(); onClick(e); }}
                          style={{ width: 44, height: 44, borderRadius: "50%", background: surface, border: `1.5px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: shadow, cursor: "pointer", position: "relative", zIndex: 200, transition: "background 0.35s ease, border-color 0.35s ease" }}
                        >
                          <style>{`
                            .mobile-save-icon-${id} svg {
                              fill: ${saved ? (A || "#0097B2") : textColor};
                              transition: fill 0.3s ease;
                            }
                            .mobile-save-icon-${id} svg path,
                            .mobile-save-icon-${id} svg circle {
                              stroke: ${saved ? (A || "#0097B2") : textColor} !important;
                              transition: stroke 0.3s ease;
                            }
                          `}</style>
                          <div className={`mobile-save-icon-${id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: textColor }}>
                            <Icon name={saved ? "heart-fill" : "heart"} size={20} />
                          </div>
                        </motion.button>
                      );
                    }}
                  </Favorite>
                  <HeroShareFab title={listing?.title} text={listing?.description || listing?.aboutListing || ""} url={window.location.href} label="Share Journey" />
                </div>
              </Rev>
            </div>
          </div>
          <button
            type="button"
            className="premium-back-button"
            onClick={() => history.goBack()}
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
        </section>



        {/* GALLERY SECTION */}
        <section className="gallery-section" style={{ background: W, padding: "24px 0 32px", overflow: "hidden" }}>
          <div style={{ width: "calc(100% - 80px)", maxWidth: "1600px", margin: "0 auto", position: "relative", overflow: "hidden" }}>
            {/* Left and Right Fade Overlays */}
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "60px",
              background: `linear-gradient(to right, ${W} 10%, transparent 100%)`,
              pointerEvents: "none",
              zIndex: 5
            }} />
            <div style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: "60px",
              background: `linear-gradient(to left, ${W} 10%, transparent 100%)`,
              pointerEvents: "none",
              zIndex: 5
            }} />

            {(() => {
              const baseItemsLocal = galleryItems.length > 0 ? galleryItems : ["/images/content/placeholder.jpg"];
              let filledItems = [...baseItemsLocal];
              while (filledItems.length < 8) {
                filledItems = [...filledItems, ...baseItemsLocal];
              }
              const doubledItems = [...filledItems, ...filledItems];

              const galleryDistance = filledItems.length * 316; // 300px width + 16px gap
              const galleryDuration = galleryDistance / 35; // constant speed of 35px/s

              return (
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ repeat: Infinity, ease: "linear", duration: galleryDuration }}
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
                      style={{ width: 300, height: 200, borderRadius: 24, overflow: "hidden", flexShrink: 0, border: `1px solid ${B}`, cursor: "pointer" }}
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
                bottom: 24,
                right: 24,
                background: "rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 24,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: '"Inter", sans-serif',
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                cursor: "pointer",
                zIndex: 10,
                transition: "all 0.3s ease"
              }}
            >
              <Camera size={16} />
              See all photos
            </motion.button>
          </div>

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
        <section className="details-section" style={{ background: BG, padding: "64px 0" }}>
          <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "24px",
              alignItems: "flex-start"
            }} className="details-grid-container">

              {/* Narrative Block (Left-hand section) */}
              <div className="narrative-card" style={{
                padding: "36px 48px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: W,
                borderRadius: "24px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)",
                border: `1px solid ${B}`,
                boxSizing: "border-box",
                height: narrativeExpanded ? "auto" : "100%",
              }}>
                <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "16px", fontFamily: '"Inter", sans-serif' }}>
                      The Experience
                    </span>
                    <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: "24px", fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>
                      Your Journey Begins
                    </h3>
                    <div style={{ position: "relative", maxHeight: narrativeExpanded ? "none" : "80px", overflow: "hidden" }}>
                      <p style={{ color: M, fontSize: "16px", lineHeight: "1.7", margin: 0, fontWeight: 400, fontFamily: '"Inter", sans-serif' }}>
                        {description}
                      </p>
                      {!narrativeExpanded && (
                        <div style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "40px",
                          background: `linear-gradient(to top, ${W}, transparent)`
                        }} />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setNarrativeExpanded(!narrativeExpanded)}
                    style={{
                      background: "none",
                      border: "none",
                      color: A,
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "16px 0 0 0",
                      fontFamily: '"Inter", sans-serif',
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      alignSelf: "flex-start",
                      outline: "none"
                    }}
                  >
                    {narrativeExpanded ? "Read Less" : "Read More"}
                    <span style={{ fontSize: "18px", lineHeight: 1 }}>&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Overview Cards (6-block flat facts grid) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gridAutoRows: "1fr", gap: "16px" }} className="facts-grid">

                {/* Fact 1: Duration */}
                <div className="fact-card" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", textAlign: "left", borderRadius: "16px", border: `1px solid ${B}`, background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF', height: "100%", boxSizing: "border-box" }}>
                  <Clock size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 700, color: FG, marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    {listing?.duration ? `${listing.duration} ${listing.durationUnit || ""}` : "2.5 Hrs"}
                  </p>
                  <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Duration</p>
                </div>

                {/* Fact 2: Min Age */}
                <div className="fact-card" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", textAlign: "left", borderRadius: "16px", border: `1px solid ${B}`, background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF', height: "100%", boxSizing: "border-box" }}>
                  <User size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 700, color: FG, marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>{listing?.minimumAge || "12"}</p>
                  <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Min Age</p>
                </div>

                {/* Fact 3: Difficulty */}
                <div className="fact-card" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", textAlign: "left", borderRadius: "16px", border: `1px solid ${B}`, background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF', height: "100%", boxSizing: "border-box" }}>
                  <Zap size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 700, color: FG, marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>{listing?.difficultyLevel || "Moderate"}</p>
                  <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Difficulty</p>
                </div>

                {/* Fact 4: Infant Allowance */}
                <div className="fact-card" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", textAlign: "left", borderRadius: "16px", border: `1px solid ${B}`, background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF', height: "100%", boxSizing: "border-box" }}>
                  <Baby size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 700, color: FG, marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>{listing?.allowsInfants || listing?.infantsAllowed ? "Allowed" : "No"}</p>
                  <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Infants</p>
                </div>

                {/* Fact 5: Languages */}
                <div className="fact-card" style={{ position: "relative", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", textAlign: "left", borderRadius: "16px", border: `1px solid ${B}`, background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF', height: "100%", boxSizing: "border-box" }}>
                  <Languages size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                  {(() => {
                    const list = Array.isArray(listing?.languagesOffered) && listing.languagesOffered.length > 0
                      ? listing.languagesOffered
                      : (typeof listing?.languages === "string" ? listing.languages.split(",").map(s => s.trim()) : ["English"]);

                    const displayStr = list.slice(0, 2).join(", ");
                    const hasMore = list.length > 2;

                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-start", width: "100%", marginBottom: 6 }}>
                          <span style={{ fontSize: "16px", fontWeight: 700, color: FG, fontFamily: '"Inter", sans-serif', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {displayStr}
                          </span>
                          {hasMore && (
                            <div style={{ position: "relative", display: "inline-flex" }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setLangPopoverOpen(!langPopoverOpen); }}
                                style={{
                                  background: W,
                                  color: A,
                                  border: `1px solid ${A}`,
                                  borderRadius: "50%",
                                  width: "18px",
                                  height: "18px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0,
                                  flexShrink: 0,
                                  outline: "none"
                                }}
                              >
                                +
                              </button>
                              {langPopoverOpen && (
                                <div style={{
                                  position: "absolute",
                                  bottom: "calc(100% + 14px)",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  background: W,
                                  border: `1px solid ${B}`,
                                  borderRadius: "16px",
                                  padding: "16px",
                                  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
                                  zIndex: 100,
                                  minWidth: "220px",
                                  textAlign: "left"
                                }}>
                                  <p style={{ fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase", color: M, margin: "0 0 12px 0", fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>All Languages</p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {list.map((lang, idx) => (
                                      <span key={idx} style={{ background: "transparent", color: A, padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, fontFamily: '"Inter", sans-serif', textTransform: "capitalize" }}>
                                        {lang.trim().toLowerCase()}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: 0,
                                    height: 0,
                                    borderLeft: "8px solid transparent",
                                    borderRight: "8px solid transparent",
                                    borderTop: `8px solid ${B}`
                                  }} />
                                  <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%) translateY(-1px)",
                                    width: 0,
                                    height: 0,
                                    borderLeft: "8px solid transparent",
                                    borderRight: "8px solid transparent",
                                    borderTop: `8px solid ${W}`
                                  }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                  <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Languages</p>
                </div>

                {/* Fact 6: Private Tour / Group Size */}
                <div className="fact-card" style={{ padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", textAlign: "left", borderRadius: "16px", border: `1px solid ${B}`, background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF', height: "100%", boxSizing: "border-box" }}>
                  {listing?.privateOptionAvailable ? (
                    <>
                      <ShieldCheck size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                      <p style={{ fontSize: "16px", fontWeight: 700, color: FG, marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                        Yes
                      </p>
                      <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Private Tour</p>
                    </>
                  ) : (
                    <>
                      <Users size={24} color={A} fill="transparent" style={{ marginBottom: "16px" }} />
                      <p style={{ fontSize: "16px", fontWeight: 700, color: FG, marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                        {listing?.maxGroupSize ? `Max ${listing.maxGroupSize}` : "Max 15"}
                      </p>
                      <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: M, margin: 0, fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>Max Guests</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Editorial Typographic Marquee */}
        {(() => {
          const rawTags = Array.isArray(listing?.tags) && listing.tags.length > 0
            ? listing.tags.map((t) => (typeof t === "string" ? t : t?.name || t?.tag || t?.label || t?.value || "")).filter(Boolean)
            : (Array.isArray(displayTags) && displayTags.length > 0
              ? displayTags.map((t) => (typeof t === "string" ? t : t?.name || t?.tag || t?.label || t?.value || "")).filter(Boolean)
              : ["Valparai Trekking", "Nature & Wildlife", "Mountain Adventure", "Western Ghats Trails", "Scenic Tea Estates", "Eco Tourism India"]);

          // Duplicate to ensure infinite seamless scrolling loop
          const loopedTags = [...rawTags, ...rawTags, ...rawTags, ...rawTags];

          const estimatedTagWidth = (tag) => tag.length * 9.5 + 75; // text width + margin + icon + padding
          const tagsDistance = rawTags.reduce((sum, tag) => sum + estimatedTagWidth(tag), 0) * 2; // offset 50% is rawTags * 2
          const tagsDuration = tagsDistance / 60; // constant speed of 60px/s

          return (
            <div style={{
              width: "100%",
              overflow: "hidden",
              position: "relative",
              padding: "20px 0",
              background: theme === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
              borderTop: `1px solid ${B}`,
              borderBottom: `1px solid ${B}`,
            }}>
              {/* Left & Right Edge Fades */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "160px", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "160px", background: `linear-gradient(to left, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />

              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: tagsDuration }}
                style={{ display: "flex", alignItems: "center", width: "max-content" }}
              >
                {loopedTags.map((tag, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        whiteSpace: "nowrap",
                        marginRight: "32px"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: isEven ? 700 : 300,
                          color: isEven ? FG : M,
                          fontFamily: '"Inter", sans-serif',
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          opacity: isEven ? 1 : 0.75
                        }}
                      >
                        {tag}
                      </span>
                      <Sparkles size={14} color="#08B5D6" fill="#08B5D6" style={{ opacity: 0.6 }} />
                    </div>
                  );
                })}
              </motion.div>
            </div>
          );
        })()}


        {/* TIMELINE SECTION */}
        <section className="timeline-section" style={{ background: BG, padding: "64px 0" }}>
          <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
            <Rev delay={0.4}>
              <div style={{ display: "flex", flexDirection: "column" }}>

                {/* Header Area */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "16px", fontFamily: '"Inter", sans-serif' }}>
                      The Experience Journey
                    </span>
                    <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: "24px", fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>
                      How It Unfolds
                    </h3>
                    <p style={{ color: M, fontSize: "16px", lineHeight: "1.7", margin: 0, fontWeight: 400, fontFamily: '"Inter", sans-serif', maxWidth: 600 }}>
                      A thoughtfully curated journey that brings you closer to the natural beauty and rich experiences of this destination.
                    </p>
                  </div>
                </div>

                {/* Activities List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(listing?.keyActivities || []).map((it, i) => {
                    const activityImageUrl = getActivityImageUrl(it);
                    return (
                      <motion.div
                        key={i}
                        className="activity-item"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        whileHover={{ y: -4, boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)" }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        style={{
                          display: "flex",
                          background: W,
                          borderRadius: "24px",
                          overflow: "hidden",
                          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)",
                          border: `1px solid ${B}`,
                          height: expandedActivities[i] ? "auto" : "180px",
                          transition: "height 0.3s ease"
                        }}
                      >
                        {activityImageUrl && (
                          <div
                            style={{
                              width: "220px",
                              alignSelf: "stretch",
                              flexShrink: 0,
                              cursor: "pointer",
                              position: "relative",
                              overflow: "hidden"
                            }}
                            onMouseOver={(e) => {
                              const overlay = e.currentTarget.querySelector('.gallery-overlay');
                              if (overlay) overlay.style.opacity = "1";
                            }}
                            onMouseOut={(e) => {
                              const overlay = e.currentTarget.querySelector('.gallery-overlay');
                              if (overlay) overlay.style.opacity = "0";
                            }}
                            onClick={() => {
                              const imgs = getActivityImages(it);
                              setSelectedActivityImages(imgs);
                              setActivityPhotoIndex(0);
                              setActivityPhotoVisible(true);
                            }}
                          >
                            <img
                              src={activityImageUrl}
                              style={{ width: "100%", height: "100%", minHeight: "180px", objectFit: "cover", transition: "transform 0.3s ease" }}
                              alt={it.name}
                            />
                            <div
                              className="gallery-overlay"
                              style={{
                                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.3s ease",
                                display: "flex", justifyContent: "center", alignItems: "center", pointerEvents: "none"
                              }}
                            >
                              <div style={{ background: theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)", padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <Camera size={16} color={A} />
                                <span style={{ color: A, fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>View Gallery</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div style={{ flex: 1, padding: "24px 32px", display: "flex", alignItems: "center", position: "relative" }}>

                          <div style={{ display: "flex", width: "100%", alignItems: "center" }}>

                            {/* Text Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "11px", fontWeight: 600, color: A, marginBottom: "8px", fontFamily: '"Inter", sans-serif', letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "normal", wordWrap: "break-word" }}>
                                {it.title || it.name || "Activity"}
                              </div>
                              {(it.description || it.pilot || it.briefDescription) && (
                                <div>
                                  <p style={{
                                    color: M,
                                    fontSize: 16,
                                    lineHeight: "1.6",
                                    margin: 0,
                                    fontWeight: 400,
                                    fontFamily: '"Inter", sans-serif',
                                    maxWidth: "600px",
                                    whiteSpace: "normal",
                                    wordWrap: "break-word",
                                    display: "-webkit-box",
                                    WebkitLineClamp: expandedActivities[i] ? "none" : 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    transition: "all 0.3s ease"
                                  }}>
                                    {it.description || it.pilot || it.briefDescription}
                                  </p>
                                  {String(it.description || it.pilot || it.briefDescription).length > 180 && (
                                    <button
                                      onClick={() => setExpandedActivities(prev => ({ ...prev, [i]: !prev[i] }))}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px 0 0 0",
                                        color: A,
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        fontFamily: '"Inter", sans-serif',
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        outline: "none"
                                      }}
                                    >
                                      {expandedActivities[i] ? "Read Less" : "Read More"} <span style={{ fontSize: "14px", marginLeft: "4px" }}>&rarr;</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {(!listing?.keyActivities || listing.keyActivities.length === 0) && (
                    <p style={{ color: M, fontSize: 14 }}>Itinerary details are being finalized for this experience.</p>
                  )}
                </div>



              </div>
            </Rev>
          </div>
        </section>


        {/* ADDONS SECTION */}
        <section className="addons-section" style={{ background: BG, padding: "64px 0" }}>
          <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: A, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: '"Inter", sans-serif', marginBottom: "16px" }}>
                  Enhance Your Experience
                </span>
                <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, margin: 0, lineHeight: 1.1, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>
                  Make it Yours
                </h3>
                <p style={{ color: M, fontSize: "16px", lineHeight: "1.7", margin: "16px 0 0 0", fontFamily: '"Inter", sans-serif' }}>
                  Curated add-ons to make your experience even more special.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => scrollAddonsSlider("left")}
                    style={{
                      width: 40, height: 40, borderRadius: "50%", border: `1px solid ${B}`, background: W,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      color: M, transition: "0.3s", outline: "none"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M; }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollAddonsSlider("right")}
                    style={{
                      width: 40, height: 40, borderRadius: "50%", border: `1px solid ${B}`, background: W,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      color: M, transition: "0.3s", outline: "none"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = M; }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div style={{ fontSize: "12px", fontFamily: '"Inter", sans-serif', fontWeight: 600, paddingRight: 4 }}>
                  <span style={{ color: A }}>{Math.min(currentAddonIndex, Math.max(1, (listing?.addons || []).length))}</span> <span style={{ color: M }}>/ {Math.max(1, (listing?.addons || []).length)}</span>
                </div>
              </div>
            </div>

            {(() => {
              const addonsList = listing?.addons || [];
              const showScroll = addonsList.length > 2;

              return (
                <div
                  ref={addonsSliderRef}
                  className={showScroll ? "no-scrollbar" : ""}
                  onScroll={(e) => {
                    if (!showScroll) return;
                    const container = e.target;
                    const stepSize = (container.clientWidth + 20) / 2;
                    let newIndex = Math.round(container.scrollLeft / stepSize) + 2;

                    // If we have hit the far right boundary, show the maximum number
                    if (Math.abs(container.scrollLeft + container.clientWidth - container.scrollWidth) <= 5) {
                      newIndex = addonsList.length;
                    } else {
                      newIndex = Math.min(addonsList.length, newIndex);
                    }

                    if (newIndex !== currentAddonIndex) {
                      setCurrentAddonIndex(newIndex);
                    }
                  }}
                  style={showScroll ? {
                    display: "flex",
                    gap: "20px",
                    overflowX: "auto",
                    overflowY: "hidden",
                    paddingBottom: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                    scrollBehavior: "smooth",
                    scrollSnapType: "x mandatory"
                  } : {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "20px"
                  }}
                >
                  {addonsList.length > 0 ? (addonsList.map((item, i) => {
                    const addon = item.addon || item;
                    const addonId = addon.addonId || addon.id;
                    const pricingType = addon.pricingType || (addon.priceType === "per_booking" ? "Group" : "Individual");
                    const addonImage = addon.imageUrl || (addon.imageUrls && addon.imageUrls[0]) || addon.image;
                    const isSelected = selectedAddOns.some(a => (a.addonId || a.id) === addonId);

                    return (
                      <motion.div
                        key={i}
                        className="addon-item"
                        whileHover={{ y: -2, borderColor: A, boxShadow: "0 8px 20px rgba(0,0,0,0.03)" }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          minHeight: "115px",
                          height: "auto",
                          width: showScroll ? "calc((100% - 20px) / 2)" : "100%",
                          flexShrink: 0,
                          background: W,
                          borderRadius: "16px",
                          border: `1px solid ${isSelected ? A : "transparent"}`,
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                          transition: "box-shadow 0.3s, border-color 0.3s",
                          overflow: "hidden",
                          boxSizing: "border-box",
                          scrollSnapAlign: "start"
                        }}
                      >
                        {/* Left side: ONLY image */}
                        <div style={{ width: "160px", height: "100%", flexShrink: 0, overflow: "hidden", background: W, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {addonImage ? (
                            <img
                              src={formatImageUrl(addonImage)}
                              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                              alt={addon.title}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/images/content/placeholder.jpg";
                              }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", background: AL }}>
                              <Plus size={24} color={A} />
                            </div>
                          )}
                        </div>

                        {/* Right side: Content info columns */}
                        <div style={{ flex: 1, minWidth: 0, padding: "16px", display: "flex", flexDirection: "row", justifyContent: "space-between", boxSizing: "border-box" }}>

                          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "6px", flex: 1, minWidth: 0, paddingRight: "16px" }}>
                            <div style={{ border: `1px solid ${pricingType === "Group" ? "#EF4444" : "#00B4D8"}`, borderRadius: "4px", padding: "2px 6px", color: pricingType === "Group" ? "#EF4444" : "#00B4D8", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", width: "fit-content", letterSpacing: "0.05em" }}>
                              {pricingType}
                            </div>
                            <h4 style={{ fontSize: 16, fontWeight: 400, color: FG, margin: "4px 0 0 0", fontFamily: '"Inter", sans-serif', display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal" }}>
                              {addon.title}
                            </h4>
                            <p style={{ fontSize: "12px", color: M, margin: 0, fontFamily: '"Inter", sans-serif', display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.5" }}>
                              {addon.briefDescription || addon.description}
                            </p>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", minWidth: "90px" }}>
                            <div style={{ fontSize: "16px", fontWeight: 800, color: FG, fontFamily: '"Inter", sans-serif', marginBottom: "12px" }}>
                              ₹{Number(addon.price || 0).toFixed(2)}
                            </div>

                            <div className="addon-actions" style={{ flexShrink: 0 }}>
                              {isSelected ? (
                                pricingType === "Group" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateAddonQuantity(addon, -1)}
                                    style={{
                                      background: `${A}15`,
                                      color: A,
                                      border: `1px solid ${A}50`,
                                      borderRadius: 100,
                                      padding: "6px 16px",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      textTransform: "uppercase",
                                      transition: "all 0.2s",
                                      outline: "none"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = A; e.currentTarget.style.color = W; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = `${A}15`; e.currentTarget.style.color = A; }}
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <div className="addon-counter" style={{ display: "flex", alignItems: "center", gap: 10, background: W, borderRadius: 100, padding: "4px 8px", border: `1px solid ${A}` }}>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAddonQuantity(addon, -1)}
                                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, color: A, outline: "none" }}
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>
                                      {selectedAddOns.find(a => (a.addonId || a.id) === addonId)?.quantity || 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAddonQuantity(addon, 1)}
                                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 2, color: A, outline: "none" }}
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAddonQuantity(addon, 1)}
                                  style={{
                                    background: "#007B8F",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "100px",
                                    padding: "6px 20px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    fontFamily: '"Inter", sans-serif',
                                    cursor: "pointer",
                                    outline: "none"
                                  }}
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })) : (
                    <p style={{ color: M, fontSize: 14 }}>No special add-ons included for this experience.</p>
                  )}
                </div>
              );
            })()}

            {selectedAddOns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 24, padding: "16px 20px", background: AL, borderRadius: 12, border: `1px solid ${A}30`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: A, fontWeight: 600, marginBottom: 2 }}>Add-ons Summary</p>
                  <p style={{ fontSize: 12, color: M, fontWeight: 500, margin: 0 }}>{selectedAddOns.reduce((sum, a) => sum + (a.quantity || 1), 0)} items selected</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: M, fontWeight: 600, marginBottom: 2 }}>Subtotal</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: A, margin: 0 }}>₹{selectedAddOns.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0).toFixed(2)}</p>
                </div>
              </motion.div>
            )}
          </div>
        </section>
        {/* PREPARATION SECTION */}
        <section className="prep-section" style={{ background: theme === 'dark' ? BG : W, padding: "64px 0" }}>
          <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>

            {/* Header Area */}
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "16px", fontFamily: '"Inter", sans-serif' }}>Location & Details</span>
              <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: "24px", fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>Where it All Happens</h3>
              <p style={{ color: M, fontSize: "16px", lineHeight: "1.7", margin: 0, fontWeight: 400, fontFamily: '"Inter", sans-serif', maxWidth: 600 }}>Find your way to the experience and get all the essential details for a smooth journey.</p>
            </div>

            {/* Main Card Container */}
            <div style={{
              background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF',
              borderRadius: 24,
              border: `1px solid ${B}`,
              padding: 16,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 24 : 32,
              boxShadow: theme === 'dark' ? "none" : "0 8px 32px rgba(0,0,0,0.04)"
            }} className="prep-grid">

              {/* LEFT: Map */}
              <Rev delay={0.1} style={{ height: "100%" }}>
                <div style={{ height: "100%", minHeight: 320, position: "relative", overflow: "hidden", borderRadius: 16, border: `1px solid ${B}` }}>
                  <div style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    zIndex: 10,
                    background: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                    padding: "8px 16px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${B}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    pointerEvents: "none"
                  }}>
                    <MapPin size={16} color={A} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: FG, fontFamily: '"Inter", sans-serif' }}>{listing?.meetingLocationName || "The Grand Atrium"}</span>
                  </div>
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
              </Rev>

              {/* RIGHT: Details List */}
              <Rev delay={0.2} style={{ height: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "16px 16px 16px 0" }}>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", margin: 0, padding: 0 }}>
                    {listing?.meetingAddress && (
                      <li style={{ display: "flex", gap: 24, alignItems: "center", borderBottom: `1px solid ${B}`, padding: "12px 0", borderTop: `1px solid ${B}` }}>
                        <div style={{ width: 40, height: 40, borderRadius: "8px", background: theme === 'dark' ? '#1E293B' : '#F0F9FA', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <MapPin size={20} color={A} fill="transparent" />
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 110, flexShrink: 0, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>Address</span>
                          <span style={{ fontSize: 16, color: FG, fontWeight: 400, lineHeight: 1.4, fontFamily: '"Inter", sans-serif' }}>{listing.meetingAddress}</span>
                        </div>
                      </li>
                    )}

                    {listing?.meetingDistrict && (
                      <li style={{ display: "flex", gap: 24, alignItems: "center", borderBottom: `1px solid ${B}`, padding: "12px 0" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "8px", background: theme === 'dark' ? '#1E293B' : '#F0F9FA', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Building size={20} color={A} fill="transparent" />
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 110, flexShrink: 0, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>District</span>
                          <span style={{ fontSize: 16, color: FG, fontWeight: 400, lineHeight: 1.4, fontFamily: '"Inter", sans-serif' }}>{listing.meetingDistrict}</span>
                        </div>
                      </li>
                    )}

                    {listing?.meetingState && (
                      <li style={{ display: "flex", gap: 24, alignItems: "center", borderBottom: `1px solid ${B}`, padding: "12px 0" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "8px", background: theme === 'dark' ? '#1E293B' : '#F0F9FA', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Map size={20} color={A} fill="transparent" />
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 110, flexShrink: 0, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>State</span>
                          <span style={{ fontSize: 16, color: FG, fontWeight: 400, lineHeight: 1.4, fontFamily: '"Inter", sans-serif' }}>{listing.meetingState}</span>
                        </div>
                      </li>
                    )}

                    {listing?.meetingCountry && (
                      <li style={{ display: "flex", gap: 24, alignItems: "center", borderBottom: `1px solid ${B}`, padding: "12px 0" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "8px", background: theme === 'dark' ? '#1E293B' : '#F0F9FA', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Globe size={20} color={A} fill="transparent" />
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 110, flexShrink: 0, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>Country</span>
                          <span style={{ fontSize: 16, color: FG, fontWeight: 400, lineHeight: 1.4, fontFamily: '"Inter", sans-serif' }}>{listing.meetingCountry}</span>
                        </div>
                      </li>
                    )}

                    {listing?.meetingInstructions && (
                      <li style={{ display: "flex", gap: 24, alignItems: "center", borderBottom: `1px solid ${B}`, padding: "12px 0" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "8px", background: theme === 'dark' ? '#1E293B' : '#F0F9FA', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Info size={20} color={A} fill="transparent" />
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 110, flexShrink: 0, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>Instructions</span>
                          <span style={{ fontSize: 16, color: FG, fontWeight: 400, lineHeight: 1.4, fontFamily: '"Inter", sans-serif' }}>{listing.meetingInstructions}</span>
                        </div>
                      </li>
                    )}

                    {(!listing?.meetingDistrict && !listing?.meetingState && !listing?.meetingCountry && !listing?.meetingAddress) && (
                      <li style={{ display: "flex", gap: 24, alignItems: "center", borderBottom: `1px solid ${B}`, padding: "12px 0", borderTop: `1px solid ${B}` }}>
                        <div style={{ width: 40, height: 40, borderRadius: "8px", background: theme === 'dark' ? '#1E293B' : '#F0F9FA', display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Info size={20} color={A} fill="transparent" />
                        </div>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <span style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: A, width: 110, flexShrink: 0, fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>Region</span>
                          <span style={{ fontSize: 16, color: M, fontWeight: 400, lineHeight: 1.4, fontFamily: '"Inter", sans-serif' }}>Specific regional details will be provided upon booking confirmation.</span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </Rev>
            </div>
          </div>
        </section>

        {(() => {
          const getCatName = (c) => {
            if (!c) return "";
            if (typeof c === "string") return c;
            return c.name || c.title || "";
          };
          let rawCats = Array.isArray(listing?.whatsSpecial) && listing?.whatsSpecial.length > 0
            ? listing.whatsSpecial.map(getCatName).filter(Boolean)
            : typeof listing?.whatsSpecial === "string" && listing?.whatsSpecial.trim() !== ""
              ? listing.whatsSpecial.split(",").map(s => s.trim()).filter(Boolean)
              : [listing?.category, listing?.subCategory].filter(Boolean).map(getCatName).filter(Boolean);
          const displayCats = rawCats.length > 0 ? rawCats : ["Nature", "Adventure"];
          const loopedCats = Array(12).fill(displayCats).flat();

          const estimatedCatWidth = (cat) => cat.length * 9.5 + 75; // text width + gap + icon + margin
          const catsDistance = displayCats.reduce((sum, cat) => sum + estimatedCatWidth(cat), 0) * 6; // offset 50% is displayCats * 6
          const catsDuration = catsDistance / 60; // constant speed of 60px/s

          return (
            <div style={{
              width: "100%",
              overflow: "hidden",
              position: "relative",
              padding: "20px 0",
              background: theme === "dark" ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)",
              borderTop: `1px solid ${B}`,
              borderBottom: `1px solid ${B}`,
            }}>
              {/* Left & Right Edge Fades */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "160px", background: `linear-gradient(to right, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "160px", background: `linear-gradient(to left, ${BG} 0%, transparent 100%)`, zIndex: 10, pointerEvents: "none" }} />

              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: catsDuration }}
                style={{ display: "flex", alignItems: "center", width: "max-content" }}
              >
                {loopedCats.map((cat, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        whiteSpace: "nowrap",
                        marginRight: "32px"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: isEven ? 700 : 300,
                          color: isEven ? FG : M,
                          fontFamily: '"Inter", sans-serif',
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          opacity: isEven ? 1 : 0.75
                        }}
                      >
                        {cat}
                      </span>
                      <Sparkles size={14} color={A} fill={A} style={{ opacity: 0.6 }} />
                    </div>
                  );
                })}
              </motion.div>
            </div>
          );
        })()}

        <ExperiencePolicies listing={listing} />

        {/* HOST & QUALITY ROW (40% / 60%) */}
        {listing && (
          <section className="host-quality-section" style={{ background: theme === 'dark' ? BG : W, padding: "64px 0" }}>
            <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "4fr 6fr", gap: 64 }} className="host-quality-grid">

                {/* Host Profile (40%) */}
                <Rev delay={0.1} style={{ height: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div
                      style={{
                        background: theme === "dark"
                          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)"
                          : "linear-gradient(135deg, #FFFFFF 0%, rgba(248, 250, 252, 0.9) 100%)",
                        border: `1px solid ${B}`,
                        borderRadius: "24px",
                        height: "100%",
                        minHeight: 250,
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: theme === "dark"
                          ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                          : "0 20px 40px rgba(15, 23, 42, 0.04)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = A;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = theme === "dark"
                          ? `0 24px 48px ${A}15`
                          : `0 24px 48px rgba(15, 23, 42, 0.08)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = B;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = theme === "dark"
                          ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                          : "0 20px 40px rgba(15, 23, 42, 0.04)";
                      }}
                    >
                      {/* Visual Accent Top Bar */}
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, ${A} 0%, #8B5CF6 100%)`
                      }} />

                      {/* Top Section: Avatar, Name & Metrics (With subtle tint background) */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        width: "100%",
                        padding: "20px 20px 16px 20px",
                        background: theme === "dark" ? "rgba(255, 255, 255, 0.015)" : "rgba(0, 0, 0, 0.01)",
                        borderBottom: `1px solid ${B}`
                      }}>

                        {/* Avatar & Info */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Profile Avatar with Custom Ring */}
                          <div style={{
                            position: "relative",
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            padding: "2px",
                            background: `linear-gradient(135deg, ${A} 0%, #8B5CF6 100%)`,
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                            flexShrink: 0
                          }}>
                            <div style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              background: W,
                              overflow: "hidden",
                              padding: "1px"
                            }}>
                              <img
                                src={formatImageUrl(leadData?.profileImageUrl || hostData?.profileImageUrl || hostData?.host?.profileImageUrl || hostData?.avatar || hostData?.host?.avatar) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayHostName)}&backgroundColor=0097B2&color=ffffff`}
                                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                alt={displayHostName}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayHostName)}&backgroundColor=0097B2&color=ffffff`;
                                }}
                              />
                            </div>
                            {/* Floating Verified Check badge */}
                            <div style={{
                              position: "absolute",
                              bottom: -1,
                              right: -1,
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: "#10B981",
                              border: `1.5px solid ${W}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
                            }}>
                              <ShieldCheck size={9} color={W} style={{ fill: W, fillOpacity: 0.2 }} />
                            </div>
                          </div>

                          {/* Name and Superhost Badge */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                            <h3
                              onClick={navigateToHostProfile}
                              style={{
                                fontSize: "14.5px",
                                fontWeight: 700,
                                color: FG,
                                margin: 0,
                                cursor: (leadIdForProfile || hostLeadUserId) ? "pointer" : "default",
                                fontFamily: '"Inter", sans-serif',
                                letterSpacing: "-0.01em",
                                lineHeight: 1.2,
                                transition: "color 0.2s"
                              }}
                              onMouseEnter={(e) => { if (leadIdForProfile || hostLeadUserId) e.currentTarget.style.color = A; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = FG; }}
                              title={(leadIdForProfile || hostLeadUserId) ? "View host profile" : undefined}
                            >
                              {displayHostName}
                            </h3>

                            {/* Superhost Badge under the name */}
                            <span style={{
                              fontSize: "8.5px",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: "#7C3AED",
                              background: theme === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.08)",
                              border: `1px solid ${theme === "dark" ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.18)"}`,
                              borderRadius: "5px",
                              padding: "1px 6px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center"
                            }}>
                              Superhost
                            </span>
                          </div>
                        </div>

                        {/* Redesigned Metrics Section - Only 2 Cards */}
                        <div style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center"
                        }}>
                          {/* Rating Pill */}
                          <div style={{
                            background: theme === "dark" ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
                            border: `1px solid ${theme === "dark" ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)"}`,
                            borderRadius: "10px",
                            padding: "6px 10px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: 46
                          }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
                              ★ {hostData?.statistics?.averageRating || "4.9"}
                            </span>
                            <span style={{ fontSize: "7px", color: "#B45309", textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 600, marginTop: 2 }}>Rating</span>
                          </div>

                          {/* Events Pill */}
                          <div style={{
                            background: theme === "dark" ? "rgba(0, 151, 178, 0.08)" : "rgba(0, 151, 178, 0.05)",
                            border: `1px solid ${theme === "dark" ? "rgba(0, 151, 178, 0.2)" : "rgba(0, 151, 178, 0.12)"}`,
                            borderRadius: "10px",
                            padding: "6px 10px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: 46
                          }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: A, lineHeight: 1 }}>
                              {hostData?.statistics?.totalEvents || hostData?.listings?.length || 8}
                            </span>
                            <span style={{ fontSize: "7px", color: A, textTransform: "uppercase", letterSpacing: "0.02em", fontWeight: 600, marginTop: 2 }}>Events</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section: Quote-styled Bio */}
                      <div style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        padding: "16px 20px",
                        borderLeft: `3px solid ${A}`,
                        margin: "12px 20px"
                      }}>
                        <p style={{
                          fontSize: "12.5px",
                          color: M,
                          lineHeight: 1.55,
                          margin: 0,
                          fontWeight: 400,
                          fontStyle: "italic",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical"
                        }}>
                          "{hostData?.host?.bio || hostData?.bio || hostData?.about || "Experienced host dedicated to providing memorable, curated journeys and sharing local culture, history, and secrets."}"
                        </p>
                      </div>
                    </div>
                  </div>
                </Rev>

                {/* Quality Index Card (60%) */}
                <Rev delay={0.2} style={{ height: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{
                      padding: "24px 32px",
                      background: theme === "dark"
                        ? "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)"
                        : "linear-gradient(135deg, #FFFFFF 0%, rgba(248, 250, 252, 0.9) 100%)",
                      backdropFilter: "blur(25px) saturate(160%)",
                      border: `1px solid ${B}`,
                      borderRadius: "24px",
                      boxShadow: theme === "dark"
                        ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                        : "0 20px 40px rgba(15, 23, 42, 0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: 32,
                      height: "100%",
                      minHeight: 250,
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = A;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = theme === "dark"
                          ? `0 24px 48px ${A}15`
                          : `0 24px 48px rgba(15, 23, 42, 0.08)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = B;
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = theme === "dark"
                          ? "0 20px 40px rgba(0, 0, 0, 0.3)"
                          : "0 20px 40px rgba(15, 23, 42, 0.04)";
                      }}
                    >
                      {listing?.lkpQualityIndex ? (
                        <>
                          {/* Visual Accent Top Bar */}
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: `linear-gradient(90deg, #8B5CF6 0%, ${A} 100%)`
                          }} />

                          {/* Background Ambient Glow under the circle */}
                          <div style={{
                            position: "absolute",
                            left: 20,
                            top: 50,
                            width: 140,
                            height: 140,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${A}12 0%, rgba(255,255,255,0) 70%)`,
                            pointerEvents: "none"
                          }} />

                          {/* Left: Score Circle */}
                          {(() => {
                            const displayScore = listing.lkpQualityIndex.score || 9.2;
                            const scoreInt = Math.floor(displayScore);
                            const scoreDec = (displayScore - scoreInt).toFixed(1).replace("0.", "");

                            return (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                                <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.05))" }}>
                                  <defs>
                                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#8B5CF6" />
                                      <stop offset="100%" stopColor={A} />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                      <feGaussianBlur stdDeviation="6" result="blur" />
                                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                  </defs>
                                  <circle cx="65" cy="65" r="55" fill="none" stroke={`${A}12`} strokeWidth="3" />
                                  <motion.circle
                                    cx="65" cy="65" r="55" fill="none" stroke="url(#scoreGrad)" strokeWidth="6" strokeLinecap="round"
                                    style={{ filter: "url(#glow)" }}
                                    initial={{ strokeDasharray: "0 346" }}
                                    whileInView={{ strokeDasharray: `${(displayScore / 10) * 346} 346` }}
                                    transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                                  />
                                </svg>
                                <div style={{ position: "absolute", textAlign: "center" }}>
                                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
                                    <span style={{ fontSize: 42, fontWeight: 900, color: FG, letterSpacing: "-0.05em", fontFamily: '"Inter", sans-serif' }}>{scoreInt}</span>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: A, marginLeft: 1 }}>.{scoreDec}</span>
                                  </div>
                                  <span style={{ fontSize: 8, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.1em" }}>LKP Index</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Right: Narrative Details & Verification Checks */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                            <div>
                              <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 800, color: "#8B5CF6", display: "block", marginBottom: 4 }}>Quality Index</span>
                              <h4 style={{ fontSize: 18, fontWeight: 600, color: FG, margin: 0, fontFamily: '"Inter", sans-serif' }}>Verified Trust Score</h4>
                            </div>

                            <p style={{ fontSize: 12.5, color: M, lineHeight: 1.6, margin: 0, fontWeight: 400 }}>
                              {listing.lkpQualityIndex.description || "Consistently delivers outstanding hospitality, verified standards, and top-tier guest experiences."}
                            </p>

                            {/* Verification Criteria Pills */}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                              <span style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: A,
                                background: theme === "dark" ? "rgba(0, 151, 178, 0.08)" : "rgba(0, 151, 178, 0.05)",
                                border: `1px solid ${theme === "dark" ? "rgba(0, 151, 178, 0.2)" : "rgba(0, 151, 178, 0.12)"}`,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4
                              }}>
                                ✓ Verified Host
                              </span>

                              <span style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "#10B981",
                                background: theme === "dark" ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
                                border: `1px solid ${theme === "dark" ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.12)"}`,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4
                              }}>
                                ✓ Safety Check
                              </span>

                              <span style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: "#D97706",
                                background: theme === "dark" ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
                                border: `1px solid ${theme === "dark" ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.12)"}`,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4
                              }}>
                                ✓ High Rated
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: theme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
                            color: "#10B981",
                            padding: "6px 16px",
                            borderRadius: "20px",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            marginBottom: 16
                          }}>
                            Newly Added
                          </span>
                          <h4 style={{ fontSize: 20, fontWeight: 700, color: FG, margin: "0 0 8px 0", fontFamily: '"Inter", sans-serif' }}>Welcome to LKP</h4>
                          <p style={{ fontSize: 13, color: M, margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
                            This listing is new to our platform. It is currently building its verified trust score based on guest experiences.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Rev>

              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS / REVIEWS SLIDER SECTION */}
        {(() => {
          const normalizedReviews = (() => {
            if (Array.isArray(reviews)) return reviews;
            if (Array.isArray(reviews?.reviews)) return reviews.reviews;
            if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
            if (Array.isArray(reviews?.data)) return reviews.data;
            return [];
          })();

          if (normalizedReviews.length === 0 && eligibleBookings.length === 0) return null;

          return (
            <section className="testimonials-section" style={{ background: BG, padding: "64px 0" }}>
              <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
                {normalizedReviews.length > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "16px", fontFamily: '"Inter", sans-serif' }}>
                          Guest Reviews
                        </span>
                        <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, margin: 0, lineHeight: 1.1, fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>
                          What People Say
                        </h3>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => scrollSlider("left")}
                          style={{
                            width: 40, height: 40, borderRadius: "50%", border: `1px solid ${B}`, background: W,
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                            color: FG, transition: "0.3s", outline: "none"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = FG; }}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollSlider("right")}
                          style={{
                            width: 40, height: 40, borderRadius: "50%", border: `1px solid ${B}`, background: W,
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                            color: FG, transition: "0.3s", outline: "none"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.color = A; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = FG; }}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={sliderRef}
                      style={{
                        position: "relative",
                        overflowX: "auto",
                        margin: "24px -80px 0",
                        padding: "20px 80px",
                        display: "flex",
                        gap: 24,
                        scrollBehavior: "smooth",
                        msOverflowStyle: "none",
                        scrollbarWidth: "none"
                      }}
                      className="no-scrollbar"
                    >
                      {normalizedReviews.map((rev, idx) => {
                        const name = rev.customerName || rev.author || "Guest";
                        const rating = rev.rating || 5;
                        const text = rev.comment || rev.text || "";
                        const vendorResponse = rev.vendorResponse || rev.hostResponse || rev.reply || "";

                        return (
                          <motion.div
                            key={idx}
                            whileHover={{ y: -8, scale: 1.02 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{
                              width: "360px",
                              background: theme === "dark"
                                ? "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)"
                                : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.55) 100%)",
                              backdropFilter: "blur(20px)",
                              WebkitBackdropFilter: "blur(20px)",
                              border: `1px solid ${B}`,
                              borderRadius: "24px",
                              padding: "28px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: 16,
                              flexShrink: 0,
                              position: "relative",
                              overflow: "hidden",
                              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = A; e.currentTarget.style.boxShadow = `0 20px 40px ${A}0f`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = B; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.02)"; }}
                          >
                            {/* Stylized background quote mark */}
                            <span style={{
                              position: "absolute",
                              top: -5,
                              right: 20,
                              fontSize: 90,
                              color: `${A}15`,
                              fontFamily: "Georgia, serif",
                              pointerEvents: "none",
                              lineHeight: 1,
                              userSelect: "none"
                            }}>“</span>

                            <div style={{ position: "relative", zIndex: 2 }}>
                              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={14} style={{ fill: i < rating ? "#F59E0B" : "transparent" }} color={i < rating ? "#F59E0B" : M} />
                                ))}
                              </div>
                              <p style={{ fontSize: 13, color: FG, lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: vendorResponse ? 3 : 4, WebkitBoxOrient: "vertical", fontWeight: 400 }}>
                                &ldquo;{text}&rdquo;
                              </p>
                              {vendorResponse && (
                                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${B}`, opacity: 0.96 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                                    Response from Host
                                  </div>
                                  <p style={{ fontSize: 12.5, color: FG, margin: 0, lineHeight: 1.6 }}>
                                    {vendorResponse}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${B}`, paddingTop: 16, position: "relative", zIndex: 2 }}>
                              <div style={{ width: 34, height: 34, borderRadius: "50%", background: AL, border: `2px solid ${A}22`, display: "flex", alignItems: "center", justifyContent: "center", color: A, fontSize: 13, fontWeight: 700 }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: FG, display: "block" }}>{name}</span>
                                <span style={{ fontSize: 9, color: M, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Verified Explorer</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Submitting Reviews Container */}
                {eligibleBookings.length > 0 && (
                  <div style={{ marginTop: normalizedReviews.length > 0 ? 48 : 0, display: "flex", justifyContent: "center" }}>
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
                )}
              </div>
            </section>
          );
        })()}


        <BookingSystem
          listing={listing}
          selectedAddOns={selectedAddOns}
          onUpdateAddonQuantity={handleUpdateAddonQuantity}
          initialDate={initialDateStr}
          initialGuests={initialGuests}
        />

        <div className="related-listings-wrapper" style={{ padding: "64px 0", background: theme === 'dark' ? BG : W }}>
          <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
            <RelatedListingsStrip
              businessInterestId={1}
              primaryCategoryId={primaryCategoryId}
              currentListingId={currentListingId}
              fallbackLocationValues={fallbackLocationValues}
              fallbackTagValues={fallbackTagValues}
              fallbackSpecialLabelValues={fallbackSpecialLabelValues}
              title="More Experiences You May Like"
              sectionStyle={{ padding: "0px", background: "transparent" }}
              titleStyle={{
                fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                fontFamily: '"Cormorant Garamond", "Playfair Display", serif',
                letterSpacing: "-0.02em",
                color: FG
              }}
            />
          </div>
        </div>
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
      <AnimatePresence>
        {activityPhotoVisible && (
          <FullScreenImage
            src={selectedActivityImages[activityPhotoIndex] || "/images/content/placeholder.jpg"}
            items={selectedActivityImages.length > 0 ? selectedActivityImages : ["/images/content/placeholder.jpg"]}
            currentIndex={activityPhotoIndex}
            onNavigate={setActivityPhotoIndex}
            onClose={() => setActivityPhotoVisible(false)}
          />
        )}
      </AnimatePresence>
      <style>{`
        .activity-item p, .activity-item p * {
          color: ${FG} !important;
          font-weight: 400 !important;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }

        @media(max-width: 900px) {
          .addon-item {
            width: 320px !important;
          }
        }
        @media(max-width: 600px) {
          .addon-item {
            width: 280px !important;
          }
        }
        
        /* Premium readability and visibility overrides for the Hero Section */
        .hero-section {
          background-color: var(--BG, #080808) !important;
        }

        .hero-section h1.hero-title {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          text-shadow: none !important;
          -webkit-text-stroke: none !important;
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
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
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
          -webkit-text-stroke: 1px #FFFFFF !important;
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
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          text-shadow: none !important;
        }
        [data-theme='dark'] .hero-section .hero-stats .hero-stat-box {
          border-left-color: var(--A, #0097B2) !important;
        }

        @media(max-width: 1024px) {
          .hero-section { min-height: 80vh !important; }
          .details-section, .timeline-section, .prep-section, .policies-section, .host-quality-section, .testimonials-section, .addons-section, .related-listings-wrapper { padding: 32px 40px !important; }
          .gallery-section { padding: 24px 40px 32px !important; }
          .details-inner-split { grid-template-columns: 1fr !important; gap: 32px !important; }
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
          .host-grid, .host-quality-grid { grid-template-columns: 1fr !important; }
          .quality-card { flex-direction: column !important; gap: 40px !important; padding: 60px 32px !important; }
          .quality-score-unit { transform: scale(0.8) translateZ(80px) !important; }
          .gallery-item { height: 180px !important; width: 270px !important; }
        }

        @media(max-width: 600px) {
          .hero-section { min-height: 90vh !important; }
          .hero-container { padding: 0 24px !important; }
          .hero-section h1 { font-size: 3.5rem !important; }
          .details-section, .timeline-section, .prep-section, .policies-section, .host-quality-section, .testimonials-section, .addons-section, .related-listings-wrapper { padding: 32px 24px !important; }
          .gallery-section { padding: 24px 24px 32px !important; }
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
          .gallery-item { height: 130px !important; width: 195px !important; }
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


    </Page>
  );
};



function PolicyItem({ req }) {
  const { theme, tokens: { FG, A, M, AL, B, W } } = useTheme();
  const [op, setOp] = useState(false);

  const title = req.setting?.title || "Requirement";
  const description = req.setting?.description;
  const questions = req.questions || [];

  const getIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cancellation")) {
      return <Clock size={20} color={A} />;
    }
    if (lowerTitle.includes("age") || lowerTitle.includes("guest") || lowerTitle.includes("people")) {
      return <Users size={20} color={A} />;
    }
    if (lowerTitle.includes("health") || lowerTitle.includes("safety") || lowerTitle.includes("medical")) {
      return <ShieldCheck size={20} color={A} />;
    }
    return <Sparkles size={20} color={A} />;
  };

  return (
    <motion.div
      layout
      style={{
        background: theme === 'dark' ? '#0A0A0A' : '#FFFFFF',
        border: `1px solid ${B}`,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "16px",
        transition: "all 0.3s",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
      }}
      whileHover={{ borderColor: A, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
    >
      <div
        onClick={() => setOp(!op)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 24px",
          cursor: "pointer",
          textAlign: "left",
          userSelect: "none"
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 8,
          background: theme === 'dark' ? '#1E293B' : '#F0F9FA',
          flexShrink: 0
        }}>
          {getIcon()}
        </div>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: FG, display: "block", fontFamily: '"Inter", sans-serif' }}>{title}</span>
        </div>

        <motion.div
          animate={{ rotate: op ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: op ? W : "transparent" }}
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
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 24px 80px" }}>
              {description && (
                <p style={{ fontSize: 13, color: M, lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 16px 0" }}>
                  {description}
                </p>
              )}

              {questions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions.map((q, j) => {
                    const questionTitle = q.title || q.question?.title;
                    const answerText = q.answer?.valueText || q.valueText;

                    return (
                      <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "4px 0" }}>
                        <div style={{ width: 6, height: 6, background: A, borderRadius: "50%", flexShrink: 0, marginTop: 8 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: FG, lineHeight: 1.5, fontWeight: 500 }}>{questionTitle}</span>
                          {answerText && (
                            <span style={{ fontSize: 13, color: M, lineHeight: 1.4 }}>{answerText}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
  const { theme, tokens: { FG, W, B, A, M, BG } } = useTheme();

  const policies = useMemo(() => {
    const expItems = [];
    const guestItems = [];
    const cancelItems = [];

    if (Array.isArray(listing?.guestRequirements)) {
      listing.guestRequirements.forEach((req, i) => {
        const title = req.setting?.title || "Requirement";
        const body = req.setting?.description || null;
        const item = { id: i, title, body, questions: req.questions };

        if (title.toLowerCase().includes("rule") || title.toLowerCase().includes("guideline") || title.toLowerCase().includes("experience")) {
          expItems.push(item);
        } else {
          guestItems.push(item);
        }
      });
    }

    if (listing?.cancellationPolicySummary || listing?.cancellationPolicyText || listing?.cancellationPolicy) {
      cancelItems.push({
        id: 'cancel',
        title: null,
        body: listing.cancellationPolicySummary || listing.cancellationPolicyText || listing.cancellationPolicy
      });
    }

    const categories = [];
    if (expItems.length > 0) {
      categories.push({ id: 'cat-exp', title: "Experience Rules", items: expItems });
    }
    if (guestItems.length > 0) {
      categories.push({ id: 'cat-guest', title: "Guest Requirements", items: guestItems });
    }
    if (cancelItems.length > 0) {
      categories.push({ id: 'cat-cancel', title: "Cancellation Policy", items: cancelItems });
    }

    return categories;
  }, [listing]);

  return (
    <section className="policies-section" style={{ background: theme === 'dark' ? BG : W, padding: "64px 0" }}>
      <div style={{ width: "calc(100% - 80px)", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="pol-grid">
          <Rev delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: A, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: "12px", fontFamily: '"Inter", sans-serif' }}>
                Essential Guidelines
              </span>
              <h3 style={{ fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: "16px", fontFamily: '"Cormorant Garamond", "Playfair Display", serif', letterSpacing: "-0.02em" }}>
                Things to Keep in Mind
              </h3>
              <p style={{ color: M, fontSize: "16px", lineHeight: "1.6", margin: 0, fontWeight: 400, fontFamily: '"Inter", sans-serif', maxWidth: 600 }}>
                Please review these guidelines and requirements carefully to ensure a safe, smooth, and enjoyable experience for everyone.
              </p>
            </div>
          </Rev>
          <Rev delay={0.2}>
            <div>
              {policies.length > 0 ? (
                policies.map((category) => (
                  <PolicyCategoryItem key={category.id} category={category} />
                ))
              ) : (
                <p style={{ color: M, fontSize: 14, padding: "40px 0" }}>No specific rules or requirements listed.</p>
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
            <h3 style={{ fontSize: 18, fontWeight: 600, color: FG, marginBottom: 8 }}>Share your experience</h3>
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
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(summary.averageRating) ? "#F59E0B" : "transparent"}
                    color={i < Math.round(summary.averageRating) ? "#F59E0B" : M}
                  />
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
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: FG, marginBottom: 2, fontFamily: '"Inter", sans-serif' }}>{rev.customerName || rev.author || "Verified Guest"}</h4>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[...Array(5)].map((_, si) => (
                          <Star
                            key={si}
                            size={14}
                            fill={si < (rev.rating || 5) ? "#F59E0B" : "transparent"}
                            color={si < (rev.rating || 5) ? "#F59E0B" : M}
                          />
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

