import React, { useState, useRef, useEffect } from "react";
import cn from "classnames";
import moment from "moment";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./EventProduct.module.sass";
import Page from "../../components/Page";
import ProductNavbar from "../../components/ProductNavbar";
import Icon from "../../components/Icon";
import Loader from "../../components/Loader";
import Actions from "../../components/Actions";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";
import GuestPicker from "../../components/GuestPicker";
import { browse2 } from "../../mocks/browse";
import { useLocation, useHistory } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { createEventOrder, getEventDetails } from "../../utils/api";
import Modal from "../../components/Modal";
import Login from "../../components/Login";
import PhotoView from "../../components/PhotoView";

const asNonEmptyString = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asNumber = (value) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const toIsoFromDateTimeParts = (dateValue, timeValue) => {
  const dateStr = asNonEmptyString(dateValue);
  const timeStr = asNonEmptyString(timeValue);
  if (!dateStr && !timeStr) return null;

  const candidates = [];
  if (dateStr && timeStr) {
    candidates.push(`${dateStr} ${timeStr}`);
    candidates.push(`${dateStr}, ${timeStr}`);
    candidates.push(`${dateStr}T${timeStr}`);
  }
  if (dateStr && !timeStr) candidates.push(dateStr);
  if (timeStr && !dateStr) candidates.push(timeStr);

  const formats = [
    moment.ISO_8601,
    "YYYY-MM-DD HH:mm",
    "YYYY-MM-DD hh:mm A",
    "YYYY-MM-DDTHH:mm",
    "DD/MM/YYYY, HH:mm",
    "DD/MM/YYYY, hh:mm a",
    "DD/MM/YYYY HH:mm",
    "DD/MM/YYYY hh:mm a",
    "MM/DD/YYYY, HH:mm",
    "MM/DD/YYYY, hh:mm a",
    "MM/DD/YYYY HH:mm",
    "MM/DD/YYYY hh:mm a",
  ];

  for (const c of candidates) {
    const m = moment(c, formats, true);
    if (m.isValid()) return m.toISOString();
  }

  const loose = moment(candidates[0]);
  return loose.isValid() ? loose.toISOString() : null;
};

const normalizeTicketTypes = (rawTypes, fallbackCurrency) => {
  if (!Array.isArray(rawTypes)) return [];
  return rawTypes
    .map((t, idx) => {
      const name =
        asNonEmptyString(t?.name) ||
        asNonEmptyString(t?.ticketTypeName) ||
        asNonEmptyString(t?.typeName) ||
        asNonEmptyString(t?.title) ||
        asNonEmptyString(t?.ticketName) ||
        asNonEmptyString(t?.ticket_name) ||
        `Ticket ${idx + 1}`;

      const price =
        asNumber(t?.price) ??
        asNumber(t?.ticketTypePrice) ??
        asNumber(t?.typePrice) ??
        asNumber(t?.ticketPrice) ??
        asNumber(t?.ticket_price) ??
        asNumber(t?.individualPrice) ??
        asNumber(t?.amount);

      const idRaw = t?.id ?? t?.ticketTypeId ?? t?.ticket_type_id ?? t?.typeId;
      const id = asNonEmptyString(idRaw) || (idRaw !== undefined && idRaw !== null ? String(idRaw) : null) || `tt-${idx}`;

      const currency = asNonEmptyString(t?.currency) || fallbackCurrency || "USD";

      const applicableSlots = Array.isArray(t?.applicableSlots)
        ? t.applicableSlots
        : Array.isArray(t?.slots)
          ? t.slots
          : [];

      return {
        id,
        name,
        price: Number.isFinite(price) ? price : 0,
        currency,
        applicableSlots,
      };
    })
    .filter(Boolean);
};

// Normalize slots array to extract slot IDs and names
const normalizeSlots = (rawSlots) => {
  if (!Array.isArray(rawSlots)) return [];
  return rawSlots
    .map((s, idx) => {
      if (typeof s === "string") {
        return { id: null, name: s };
      }
      if (s && typeof s === "object") {
        // Skip inactive slots
        if (s.is_active === false || s.isActive === false) return null;

        const slotId =
          asNumber(s?.id) ??
          asNumber(s?.slotId) ??
          asNumber(s?.slot_id) ??
          asNumber(s?.eventSlotId) ??
          asNumber(s?.event_slot_id);
        const slotName =
          asNonEmptyString(s?.name) ||
          asNonEmptyString(s?.slotName) ||
          asNonEmptyString(s?.title) ||
          `Slot ${idx + 1}`;
        return {
          id: slotId,
          name: slotName,
          date: asNonEmptyString(s?.date) || asNonEmptyString(s?.slotDate),
          time: asNonEmptyString(s?.time) || asNonEmptyString(s?.slotTime),
        };
      }
      return null;
    })
    .filter(Boolean);
};

const normalizeArtists = (rawArtists, fallbackImages) => {
  if (!Array.isArray(rawArtists)) return [];
  return rawArtists
    .map((a, idx) => {
      const title =
        asNonEmptyString(a?.name) ||
        asNonEmptyString(a?.title) ||
        asNonEmptyString(a?.artistName) ||
        asNonEmptyString(a?.artist_name) ||
        null;
      if (!title) return null;

      const description = asNonEmptyString(a?.description) || asNonEmptyString(a?.about) || "";
      const image =
        asNonEmptyString(a?.image) ||
        asNonEmptyString(a?.imageUrl) ||
        asNonEmptyString(a?.photoUrl) ||
        asNonEmptyString(a?.avatarUrl) ||
        (Array.isArray(fallbackImages) && fallbackImages.length > 0
          ? fallbackImages[idx % fallbackImages.length]
          : "");

      return { title, description, image };
    })
    .filter(Boolean);
};

// Dummy event data with all required fields
const dummyEventData = {
  eventId: 1,
  coverImage: "/images/content/main-pic-1.jpg",
  title: "Summer Music Festival 2024",
  description: "Join us for an unforgettable weekend of live music, art, and community. Featuring top artists from around the world, local food vendors, and interactive art installations. This is a family-friendly event with activities for all ages.",
  gallery: [
    "/images/content/main-pic-2.jpg",
    "/images/content/main-pic-3.jpg",
    "/images/content/main-pic-4.jpg",
    "/images/content/main-pic-5.jpg",
    "/images/content/main-pic-6.jpg",
    "/images/content/browse-pic-1.jpg",
    "/images/content/browse-pic-2.jpg",
    "/images/content/browse-pic-3.jpg",
  ],
  startDate: "2024-07-15",
  startTime: "14:00",
  endDate: "2024-07-17",
  endTime: "22:00",
  isMultiDayEvent: true,
  eventMode: "Offline", // "Online" or "Offline"
  venueSearchLocation: "Central Park, New York",
  fullVenueAddress: "123 Park Avenue, New York, NY 10001, United States",
  latitude: 40.785091,
  longitude: -73.968285,
  totalCapacity: 10000,
  ticketPrice: 75,
  currency: "INR",
  ticketTypes: [
    { id: "general", name: "General Admission", price: 75 },
    { id: "vip", name: "VIP", price: 150 },
    { id: "premium", name: "Premium", price: 200 },
  ],
  bookingCutoffTime: "2024-07-14T12:00:00", // ISO format
  cancellationAllowed: true,
  cancellationCutoff: "2024-07-10T00:00:00", // ISO format
  refundPercentage: 80,
  organizerName: "City Events Co.",
  organizerEmail: "contact@cityevents.com",
  organizerPhone: "+1 (555) 123-4567",
  termsAndPolicies: "All tickets are non-transferable. Refunds are available up to 5 days before the event. No refunds will be issued after the cancellation cutoff date. Event may be cancelled or postponed due to weather or other circumstances beyond our control.",
  publishStatus: "Published", // "Published", "Draft", "Cancelled"
  whatYoullDo: [
    {
      title: "Join me in an exclusive lounge",
      description: "I'd love to get to know you and hear what the spirit of the Paralympics means to you.",
      image: "/images/content/main-pic-2.jpg",
    },
    {
      title: "Hear the story behind my medals",
      description: "Behind each medal is the journey of an athlete who kept going, despite adversity.",
      image: "/images/content/main-pic-3.jpg",
    },
    {
      title: "The Paralympic mindset",
      description: "I'll share the skills I've gained through competing in the Paralympics for 30 years.",
      image: "/images/content/main-pic-4.jpg",
    },
    {
      title: "Reflect on your own resilience",
      description: "I'll guide you through a mindset exercise to unlock the strengths that have come out of your setbacks.",
      image: "/images/content/main-pic-5.jpg",
    },
  ],
};

const EventProduct = () => {
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);
  const eventIdFromQuery =
    searchParams.get("id") ||
    searchParams.get("eventId") ||
    searchParams.get("event_id") ||
    searchParams.get("listingId") ||
    searchParams.get("listing_id");
  const eventIdFromState =
    location?.state?.id ??
    location?.state?.eventId ??
    location?.state?.event_id ??
    location?.state?.listingId ??
    location?.state?.listing_id;
  const eventId = eventIdFromQuery ?? eventIdFromState;
  const preselectedGuestsFromState = location?.state?.preselectedGuests;
  const preselectedTicketTypeIdFromState =
    location?.state?.preselectedTicketTypeId != null
      ? String(location.state.preselectedTicketTypeId)
      : null;
  const checkoutAfterGuestSelection = Boolean(location?.state?.checkoutAfterGuestSelection);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [guests, setGuests] = useState({
    adults: asNumber(preselectedGuestsFromState?.adults) ?? 1,
    children: asNumber(preselectedGuestsFromState?.children) ?? 0,
    infants: asNumber(preselectedGuestsFromState?.infants) ?? 0,
    pets: asNumber(preselectedGuestsFromState?.pets) ?? 0,
  });
  const [showGuestPicker, setShowGuestPicker] = useState(Boolean(location?.state?.openGuestPicker));
  const guestItemRef = useRef(null);
  const [selectedTicketType, setSelectedTicketType] = useState(preselectedTicketTypeIdFromState || "general");
  const [showTicketTypePicker, setShowTicketTypePicker] = useState(false);
  const ticketTypeItemRef = useRef(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const autoCheckoutTriggeredRef = useRef(false);
  const handleBookNowRef = useRef(null);
  const [bookButtonArmed, setBookButtonArmed] = useState(Boolean(checkoutAfterGuestSelection));

  const hasValidJwtToken = () => {
    if (typeof window === "undefined") return false;
    const raw = localStorage.getItem("jwtToken");
    const token = typeof raw === "string" ? raw.trim() : "";
    return !!token && token !== "undefined" && token !== "null" && token !== "NaN";
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!eventId) {
          if (!mounted) return;
          setEvent(dummyEventData);
          return;
        }

        const payload = await getEventDetails(eventId);

        const derivedId = payload?.eventId ?? payload?.event_id ?? payload?.id ?? payload?._id ?? eventId;

        const derivedCover =
          asNonEmptyString(payload?.coverImage) ||
          asNonEmptyString(payload?.coverImageUrl) ||
          asNonEmptyString(payload?.coverPhotoUrl) ||
          asNonEmptyString(payload?.imageUrl) ||
          asNonEmptyString(payload?.bannerUrl) ||
          asNonEmptyString(payload?.thumbnailUrl);

        const rawGallery = payload?.gallery ?? payload?.images ?? payload?.photos ?? payload?.media;
        const derivedGallery = Array.isArray(rawGallery)
          ? rawGallery
            .map((g) => {
              if (typeof g === "string") return asNonEmptyString(g);
              if (g && typeof g === "object") {
                return (
                  asNonEmptyString(g?.url) ||
                  asNonEmptyString(g?.src) ||
                  asNonEmptyString(g?.imageUrl) ||
                  asNonEmptyString(g?.mediaUrl)
                );
              }
              return null;
            })
            .filter(Boolean)
          : [];

        const ticketSaleEndIso =
          toIsoFromDateTimeParts(payload?.ticketSaleEndDate, payload?.ticketSaleEndTime) ||
          toIsoFromDateTimeParts(payload?.ticketSaleEnd, payload?.ticketSaleEndTime) ||
          asNonEmptyString(payload?.ticketSaleEndDateTime) ||
          asNonEmptyString(payload?.ticketSaleEndDatetime) ||
          asNonEmptyString(payload?.ticketSaleEndAt) ||
          asNonEmptyString(payload?.bookingCutoffTime) ||
          asNonEmptyString(payload?.bookingCutoff);

        const inferredTicketCurrency =
          asNonEmptyString(payload?.currency) ||
          asNonEmptyString(payload?.currencyCode) ||
          asNonEmptyString(payload?.currency_code) ||
          dummyEventData.currency;

        const rawTicketTypes =
          payload?.ticketTypes ||
          payload?.tickets ||
          payload?.ticket_types ||
          payload?.ticketType ||
          payload?.ticket_type ||
          payload?.ticketTypeList ||
          payload?.ticketTypeDetails ||
          payload?.ticketTypeDTOs ||
          payload?.ticketTypeDtos ||
          payload?.ticketTypeResponses;

        const normalizedTicketTypes = normalizeTicketTypes(rawTicketTypes, inferredTicketCurrency);

        const inferredTicketPrice =
          asNumber(payload?.ticketPrice) ??
          asNumber(payload?.ticket_price) ??
          asNumber(payload?.price) ??
          asNumber(payload?.amount) ??
          asNumber(payload?.entryFee) ??
          asNumber(payload?.entry_fee) ??
          asNumber(payload?.basePrice) ??
          asNumber(payload?.base_price) ??
          asNumber(payload?.startingPrice) ??
          asNumber(payload?.starting_price) ??
          asNumber(payload?.minPrice) ??
          asNumber(payload?.min_price) ??
          asNumber(payload?.minimumPrice) ??
          asNumber(payload?.minimum_price) ??
          asNumber(payload?.perHeadPrice) ??
          asNumber(payload?.per_head_price);
        const inferredTicketName =
          asNonEmptyString(payload?.ticketTypeName) ||
          asNonEmptyString(payload?.ticketName) ||
          asNonEmptyString(payload?.ticket_type) ||
          asNonEmptyString(payload?.ticketType) ||
          "General Admission";
        const inferredTicketTypes = Number.isFinite(inferredTicketPrice)
          ? [{ id: "default", name: inferredTicketName, price: inferredTicketPrice, currency: inferredTicketCurrency, applicableSlots: [] }]
          : [];

        const rawSlots =
          payload?.applicableSlots ||
          payload?.slots ||
          payload?.eventSlots ||
          payload?.event_slots ||
          normalizedTicketTypes.flatMap((t) => t.applicableSlots || []);

        // Normalize slots to get full slot objects with IDs
        const normalizedSlots = normalizeSlots(rawSlots);
        const slotNames = normalizedSlots.map((s) => s.name).filter(Boolean);

        const backendArtists = normalizeArtists(payload?.artists, derivedGallery.length > 0 ? derivedGallery : dummyEventData.gallery);
        const derivedArtists = backendArtists.length > 0
          ? backendArtists
          : slotNames.map((name, index) => ({
            title: name,
            description: "",
            image: (derivedGallery.length > 0 ? derivedGallery : dummyEventData.gallery)[index % (derivedGallery.length > 0 ? derivedGallery.length : dummyEventData.gallery.length)],
          }));

        const derivedVenueSearchLocation =
          asNonEmptyString(payload?.venueSearchLocation) ||
          asNonEmptyString(payload?.venue) ||
          asNonEmptyString(payload?.location) ||
          asNonEmptyString(payload?.venueName) ||
          asNonEmptyString(payload?.city);

        const derivedFullVenueAddress =
          asNonEmptyString(payload?.fullVenueAddress) ||
          asNonEmptyString(payload?.address) ||
          asNonEmptyString(payload?.venueAddress) ||
          asNonEmptyString(payload?.fullAddress);

        const derivedLatitude = asNumber(payload?.latitude) ?? asNumber(payload?.lat);
        const derivedLongitude = asNumber(payload?.longitude) ?? asNumber(payload?.lng) ?? asNumber(payload?.lon);

        const normalizedEvent = {
          ...dummyEventData,
          ...payload,
          eventId: derivedId,
          title: payload?.title || payload?.eventName || payload?.name || dummyEventData.title,
          description: payload?.description || payload?.about || payload?.details || dummyEventData.description,
          coverImage: derivedCover || dummyEventData.coverImage,
          gallery: derivedGallery.length > 0 ? derivedGallery : dummyEventData.gallery,
          startDate: payload?.startDate || payload?.start_date || dummyEventData.startDate,
          startTime: payload?.startTime || payload?.start_time || dummyEventData.startTime,
          endDate: payload?.endDate || payload?.end_date || dummyEventData.endDate,
          endTime: payload?.endTime || payload?.end_time || dummyEventData.endTime,
          eventMode: payload?.eventMode || payload?.mode || dummyEventData.eventMode,
          venueSearchLocation: derivedVenueSearchLocation,
          fullVenueAddress: derivedFullVenueAddress,
          latitude: derivedLatitude,
          longitude: derivedLongitude,
          totalCapacity: payload?.totalCapacity ?? payload?.capacity ?? dummyEventData.totalCapacity,
          ticketPrice: inferredTicketPrice ?? null,
          currency: inferredTicketCurrency,
          ticketTypes:
            normalizedTicketTypes.length > 0
              ? normalizedTicketTypes
              : inferredTicketTypes,
          bookingCutoffTime: ticketSaleEndIso || dummyEventData.bookingCutoffTime,
          cancellationAllowed: payload?.cancellationAllowed ?? dummyEventData.cancellationAllowed,
          cancellationCutoff: payload?.cancellationCutoff || payload?.cancellationCutoffTime || dummyEventData.cancellationCutoff,
          refundPercentage: payload?.refundPercentage ?? dummyEventData.refundPercentage,
          organizerName: payload?.organizerName || payload?.organizer || dummyEventData.organizerName,
          organizerEmail: payload?.organizerEmail || dummyEventData.organizerEmail,
          organizerPhone: payload?.organizerPhone || dummyEventData.organizerPhone,
          termsAndPolicies: payload?.termsAndPolicies || payload?.terms || dummyEventData.termsAndPolicies,
          artists: derivedArtists,
          whatYoullDo: Array.isArray(payload?.whatYoullDo) ? payload.whatYoullDo : [],
          // Store normalized slots with IDs for booking
          slots: normalizedSlots,
        };

        if (!mounted) return;
        setEvent(normalizedEvent);
      } catch (e) {
        if (!mounted) return;
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError("Please login to view this event.");
        } else {
          setError(e?.message || "Failed to load event details");
        }
        setEvent(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    const selectedTicketExists = event.ticketTypes?.some(
      (ticketType) => String(ticketType.id) === String(preselectedTicketTypeIdFromState)
    );

    setSelectedTicketType(
      selectedTicketExists
        ? String(preselectedTicketTypeIdFromState)
        : event.ticketTypes?.[0]?.id || "general"
    );
  }, [event, preselectedTicketTypeIdFromState]);

  // Format date for display
  const formatDate = (dateStr) => {
    return moment(dateStr).format("MMMM D, YYYY");
  };

  // Format time for display
  const formatTime = (timeStr) => {
    return moment(timeStr, "HH:mm").format("h:mm A");
  };

  // Format datetime for display
  const formatDateTime = (dateTimeStr) => {
    return moment(dateTimeStr).format("MMMM D, YYYY [at] h:mm A");
  };

  // Check if booking is still open
  const isBookingOpen = () => {
    if (!event.bookingCutoffTime) return true;
    const cutoff = moment(event.bookingCutoffTime);
    if (!cutoff.isValid()) return true;
    return moment().isBefore(cutoff);
  };

  // Get all images for gallery
  const allImages = [event?.coverImage, ...(event?.gallery || [])].filter(Boolean);
  const selectedHeroImage = allImages[galleryIndex] || allImages[0];
  const displayCurrency = event?.currency === "USD" ? "INR" : event?.currency;
  const totalGuestsSelected = guests.adults + guests.children;

  const minimumAge =
    asNumber(event?.minimumAge) ??
    asNumber(event?.minimum_age) ??
    asNumber(event?.minAge) ??
    asNumber(event?.min_age);

  const getCustomerDetailsForBooking = () => {
    const userInfoRaw = localStorage.getItem("userInfo");
    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : {};

    const firstName = userInfo?.firstName || localStorage.getItem("firstName") || "";
    const lastName = userInfo?.lastName || localStorage.getItem("lastName") || "";
    const email = userInfo?.email || localStorage.getItem("email") || "";

    const phone =
      userInfo?.customerPhone ||
      userInfo?.phoneNumber ||
      userInfo?.phone ||
      localStorage.getItem("phone") ||
      localStorage.getItem("phoneNumber") ||
      "";

    return {
      firstName,
      lastName,
      email,
      phone,
    };
  };

  const getEventSlotIdForBooking = () => {
    // First try to get from direct event properties
    const directSlotId =
      asNumber(event?.eventSlotId) ??
      asNumber(event?.event_slot_id) ??
      asNumber(event?.slotId) ??
      asNumber(event?.slot_id) ??
      asNumber(event?.defaultSlotId) ??
      asNumber(event?.default_slot_id);

    if (directSlotId && directSlotId > 0) {
      console.log("📍 Using direct eventSlotId:", directSlotId);
      return directSlotId;
    }

    // Try to get from the slots array (first available slot)
    if (Array.isArray(event?.slots) && event.slots.length > 0) {
      const firstSlot = event.slots[0];
      const slotIdFromArray =
        asNumber(firstSlot?.id) ??
        asNumber(firstSlot?.slotId) ??
        asNumber(firstSlot?.eventSlotId);
      if (slotIdFromArray && slotIdFromArray > 0) {
        console.log("📍 Using slotId from slots array:", slotIdFromArray);
        return slotIdFromArray;
      }
    }

    // Try to get from ticket types' applicable slots
    if (Array.isArray(event?.ticketTypes)) {
      for (const ticketType of event.ticketTypes) {
        if (Array.isArray(ticketType?.applicableSlots) && ticketType.applicableSlots.length > 0) {
          const slot = ticketType.applicableSlots[0];
          // Check all possible slot ID field names
          const slotId =
            asNumber(slot?.eventSlotId) ??
            asNumber(slot?.event_slot_id) ??
            asNumber(slot?.slotId) ??
            asNumber(slot?.slot_id) ??
            asNumber(slot?.id);
          if (slotId && slotId > 0) {
            console.log("📍 Using slotId from ticketType applicableSlots:", slotId, "slot:", slot);
            return slotId;
          }
        }
      }
    }

    // Log warning if no slot ID found
    console.warn("⚠️ Could not find eventSlotId in event data:", {
      eventSlotId: event?.eventSlotId,
      slotId: event?.slotId,
      slots: event?.slots,
      ticketTypes: event?.ticketTypes?.map(t => ({
        id: t.id,
        applicableSlots: t.applicableSlots
      }))
    });

    return 0;
  };

  const getTicketTypeIdForBooking = (ticketType) => {
    const raw = ticketType?.ticketTypeId ?? ticketType?.ticket_type_id ?? ticketType?.typeId ?? ticketType?.id;
    const parsed = asNumber(raw);
    return parsed ?? 0;
  };

  const handleBookNow = async () => {
    if (!event) return;
    if (bookingLoading) return;

    if (!hasValidJwtToken()) {
      setShowLoginModal(true);
      return;
    }

    const customerDetails = getCustomerDetailsForBooking();
    const eventIdNum = asNumber(event?.eventId ?? event?.event_id ?? event?.id ?? eventId) ?? 0;
    const eventSlotIdNum = getEventSlotIdForBooking();

    const selectedType =
      event.ticketTypes?.find((t) => t.id === selectedTicketType) ||
      event.ticketTypes?.[0] ||
      null;

    const quantity = Math.max(1, (guests?.adults || 0) + (guests?.children || 0));
    const pricePerTicket = asNumber(selectedType?.price) ?? asNumber(event.ticketPrice) ?? 0;

    // Calculate total number of guests (required by backend)
    const numberOfGuests = quantity;

    // Get booking date - use event start date or today's date
    const bookingDate = event?.startDate || moment().format("YYYY-MM-DD");

    // Get ticket type name (required by backend)
    const ticketTypeName = selectedType?.name || selectedType?.ticketTypeName || "General Admission";

    // Validate slot ID before creating payload
    if (!eventSlotIdNum || eventSlotIdNum <= 0) {
      console.error("❌ Cannot book: eventSlotId is missing or invalid. Check event details API response.");
      alert("Unable to book: Event slot information is missing. Please try again later.");
      return;
    }

    const payload = {
      eventId: eventIdNum,
      eventSlotId: eventSlotIdNum, // From event details API
      bookingDate: bookingDate, // Required: YYYY-MM-DD format
      numberOfGuests: numberOfGuests, // Required: must be a number > 0
      customerDetails,
      tickets: [
        {
          ticketTypeId: getTicketTypeIdForBooking(selectedType),
          ticketTypeName: ticketTypeName, // Required by backend
          quantity,
          pricePerTicket: Number(pricePerTicket.toFixed(2)),
        },
      ],
      appliedDiscountCode: null,
      notes: null,
    };

    console.log("🧾 Event booking payload:", JSON.stringify(payload, null, 2));

    try {
      setBookingLoading(true);
      const res = await createEventOrder(payload);
      console.log("✅ Event booking response (full):", JSON.stringify(res, null, 2));

      // Extract order and payment info from response (same pattern as experience)
      const order = res?.order || res;
      console.log("📋 Order object:", order);

      // Extract payment object (same as experience checkout)
      const payment =
        res?.payment ||
        res?.data?.payment ||
        res?.order?.payment ||
        order?.payment ||
        null;
      console.log("💳 Payment object:", payment);

      const orderId = order?.orderId || order?.id || res?.orderId || res?.id;
      const razorpayOrderId =
        payment?.razorpayOrderId ||
        order?.razorpayOrderId ||
        res?.razorpayOrderId ||
        order?.razorpay_order_id ||
        res?.razorpay_order_id;

      console.log("🔑 Extracted orderId:", orderId);
      console.log("🔑 Extracted razorpayOrderId:", razorpayOrderId);

      // Calculate total amount (in paise for Razorpay)
      const totalAmount = quantity * pricePerTicket;
      // Use amount from payment response if available, otherwise calculate
      const amountInPaise = payment?.amount || Math.round(totalAmount * 100);

      // Get currency from event or default to INR
      const currency = event?.currency || "INR";

      // Prepare booking data for checkout page
      const bookingDataForCheckout = {
        // Event details
        eventId: eventIdNum,
        eventSlotId: eventSlotIdNum,
        listingTitle: event?.title || "Event Booking",
        listingImage: event?.coverImage || event?.gallery?.[0],
        returnTo: `/event?id=${eventIdNum}`,

        // Booking summary
        bookingSummary: {
          date: moment(bookingDate).format("MMM DD, YYYY"),
          time: event?.startTime || "",
          guestCount: numberOfGuests,
        },

        // Guest details
        guests: guests,

        // Price details
        priceDetails: {
          pricePerPerson: pricePerTicket,
          totalPrice: totalAmount,
        },

        // Receipt for display
        receipt: [
          {
            title: `${currency} ${pricePerTicket.toFixed(2)} x ${numberOfGuests} ${numberOfGuests === 1 ? 'ticket' : 'tickets'}`,
            content: `${currency} ${totalAmount.toFixed(2)}`,
          },
          {
            title: "Total",
            content: `${currency} ${totalAmount.toFixed(2)}`,
          },
        ],

        // Currency
        currency: currency,
        finalTotal: totalAmount,

        // Ticket info
        ticketType: ticketTypeName,
        ticketTypeId: getTicketTypeIdForBooking(selectedType),
      };

      // Get Razorpay key from response (same pattern as experience checkout)
      // Check payment object first, then order, then response root
      // Also check localStorage for cached key from previous experience booking
      const getCachedRazorpayKey = () => {
        try {
          // Try to get from a previous successful payment
          const cachedPayment = localStorage.getItem("lastRazorpayKeyId");
          if (cachedPayment) return cachedPayment;

          // Try to get from pending payment (if experience was booked before)
          const pendingPayment = localStorage.getItem("pendingPayment");
          if (pendingPayment) {
            const parsed = JSON.parse(pendingPayment);
            if (parsed?.razorpayKeyId) return parsed.razorpayKeyId;
          }
        } catch (e) {
          console.warn("Could not get cached Razorpay key:", e);
        }
        return null;
      };

      // Hardcoded fallback key for production (test mode)
      const RAZORPAY_FALLBACK_KEY = "rzp_test_RaBjdu0Ed3p1gN";

      const razorpayKeyId =
        payment?.razorpayKeyId ||
        payment?.razorpay_key_id ||
        payment?.keyId ||
        order?.razorpayKeyId ||
        res?.razorpayKeyId ||
        order?.razorpay_key_id ||
        res?.razorpay_key_id ||
        order?.razorpayKey ||
        res?.razorpayKey ||
        order?.keyId ||
        res?.keyId ||
        process.env.REACT_APP_RAZORPAY_KEY_ID || // Fallback to env variable
        getCachedRazorpayKey() || // Fallback to cached key from experience
        RAZORPAY_FALLBACK_KEY; // Final fallback - hardcoded key

      console.log("🔑 Extracted razorpayKeyId:", razorpayKeyId);

      // Save the key for future use if we got it
      if (razorpayKeyId) {
        try {
          localStorage.setItem("lastRazorpayKeyId", razorpayKeyId);
        } catch (e) { }
      }

      // Warn if missing critical payment data
      if (!razorpayOrderId) {
        console.warn("⚠️ razorpayOrderId is missing from API response!");
      }
      if (!razorpayKeyId) {
        console.error("❌ razorpayKeyId is missing from API response!");
        console.error("💡 Book an experience first to cache the Razorpay key, OR add REACT_APP_RAZORPAY_KEY_ID to .env file");
        alert("Payment configuration error: Razorpay key is missing. Please book an experience first or contact support.");
        return;
      }

      // Prepare payment data for Razorpay (same structure as experience checkout)
      const paymentData = {
        orderId: orderId,
        razorpayOrderId: razorpayOrderId,
        razorpayKeyId: razorpayKeyId,
        amount: amountInPaise,
        currency: payment?.currency || currency,
        paymentMethod: "razorpay", // Required to trigger Razorpay checkout
        eventId: eventIdNum,
        eventSlotId: eventSlotIdNum,
        // Include discount info if available
        discount: payment?.discount || res?.discount || 0,
        finalAmount: payment?.finalAmount || amountInPaise,
      };

      // Save to localStorage for checkout page
      localStorage.setItem("pendingBooking", JSON.stringify(bookingDataForCheckout));
      localStorage.setItem("pendingPayment", JSON.stringify(paymentData));
      localStorage.setItem("pendingOrderId", String(orderId));

      // Clear any previous payment status
      localStorage.removeItem("razorpayPaymentSuccess");
      localStorage.removeItem("paymentFailed");

      console.log("📦 Booking data saved:", bookingDataForCheckout);
      console.log("💳 Payment data saved:", paymentData);

      // Redirect to checkout page
      history.replace("/experience-checkout", {
        bookingData: bookingDataForCheckout,
        paymentData: paymentData,
      });

    } catch (e) {
      console.error("❌ Event booking failed:", e?.response?.data || e?.message || e);
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        setShowLoginModal(true);
        return;
      }
      const errorMessage = e?.response?.data?.message || e?.response?.data?.error || e?.message || "Booking failed. Please try again.";
      alert(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  handleBookNowRef.current = handleBookNow;

  useEffect(() => {
    if (!event || !checkoutAfterGuestSelection || autoCheckoutTriggeredRef.current) return;
    autoCheckoutTriggeredRef.current = true;
    handleBookNowRef.current?.();
  }, [event, checkoutAfterGuestSelection]);

  const socials = [
    { title: "twitter", url: "https://twitter.com/ui8" },
    { title: "instagram", url: "https://www.instagram.com/ui8net/" },
    { title: "facebook", url: "https://www.facebook.com/ui8.net/" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader />
      </div>
    );
  }

  if (!event) {
    return error ? (
      <div className={styles.eventProduct}>
        <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "#fee", color: "#c33" }}>
          <p>⚠️ {error}</p>
        </div>
      </div>
    ) : null;
  }

  if (checkoutAfterGuestSelection && bookingLoading && !showLoginModal) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.eventProduct}>
      <Modal visible={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <Login onClose={() => setShowLoginModal(false)} />
      </Modal>
      {error && (
        <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "#fee", color: "#c33" }}>
          <p>⚠️ {error}</p>
        </div>
      )}
      {/* Hero Section with Title, Actions, and Gallery */}
      <div className={cn("section-mb64", styles.hero)} style={{ zIndex: 50 }}>
        <ProductNavbar top={100} left={60} />
        <div className={cn("container", styles.heroContainer)}>
          {/* Header with Title and Actions */}
          <div className={styles.heroHeader}>
            <div className={styles.heroTitleBox}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                <h1 className={styles.heroTitle}>{event.title}</h1>
              </div>
            </div>
            <div className={styles.heroActions}>
              <Actions />
            </div>
          </div>

          {/* Gallery Layout - 4 Images in Rectangle Arrangement */}
          {allImages.length > 0 && (
            <div className={styles.heroGallery}>
              {/* Main Large Image on Left */}
              <div
                className={styles.heroMainImage}
                onClick={() => {
                  setPhotoIndex(0);
                  setPhotoVisible(true);
                }}
              >
                <img
                  src={selectedHeroImage || "/images/content/main-pic-1.jpg"}
                  alt={event.title}
                />
              </div>

              {/* Grid of 3 Smaller Images on Right */}
              <div className={styles.heroImageGrid}>
                {[1, 2, 3].map((imgIdx) => {
                  const img = allImages[imgIdx] || allImages[0];
                  const isLast = imgIdx === 3;
                  return (
                    <div
                      key={imgIdx}
                      className={styles.heroGridImage}
                      onClick={() => {
                        setPhotoIndex(imgIdx);
                        setPhotoVisible(true);
                      }}
                    >
                      <img
                        src={img}
                        alt={`Event ${imgIdx + 1}`}
                      />
                      {/* Show all photos button on last image */}
                      {isLast && allImages.length > 4 && (
                        <button
                          className={styles.showAllPhotos}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoIndex(3);
                            setPhotoVisible(true);
                          }}
                        >
                          <Icon name="image" size="20" />
                          <span>Show all photos</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {photoVisible && (
          <PhotoView
            visible={photoVisible}
            items={allImages}
            initialSlide={photoIndex}
            onClose={() => setPhotoVisible(false)}
            title={event?.title}
          />
        )}
      </div>

      {/* Main Content */}
      <div className={cn("container", styles.container)}>
        <div className={styles.layout}>
          {/* Left Column - Main Content */}
          <div className={styles.mainContent}>
            {/* Description Section */}
            <section className={cn("section", styles.contentSection)}>
              <h2 className={styles.sectionTitle}>About This Event</h2>
              <div className={styles.description}>
                <p>{event.description}</p>
              </div>
            </section>

            {/* Artists Section */}
            {event.artists && event.artists.length > 0 && (
              <section className={cn("section", styles.contentSection, styles.whatYoullDoSection)}>
                <h2 className={styles.sectionTitle}>Artists</h2>
                <div className={styles.whatYoullDoList}>
                  {event.artists.map((item, index) => (
                    <div
                      key={index}
                      className={cn(styles.whatYoullDoItem, {
                        [styles.lastItem]: index === event.artists.length - 1,
                      })}
                    >
                      <div className={styles.whatYoullDoImage}>
                        <img src={item.image} alt={item.title} />
                      </div>
                      <div className={styles.whatYoullDoContent}>
                        <h3 className={styles.whatYoullDoTitle}>{item.title}</h3>
                        <p className={styles.whatYoullDoDescription}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* What You'll Do Section */}
            {event.whatYoullDo && event.whatYoullDo.length > 0 && (
              <section className={cn("section", styles.contentSection, styles.whatYoullDoSection)}>
                <h2 className={styles.sectionTitle}>What you'll do</h2>
                <div className={styles.whatYoullDoList}>
                  {event.whatYoullDo.map((item, index) => (
                    <div
                      key={index}
                      className={cn(styles.whatYoullDoItem, {
                        [styles.lastItem]: index === event.whatYoullDo.length - 1,
                      })}
                    >
                      <div className={styles.whatYoullDoImage}>
                        <img src={item.image} alt={item.title} />
                      </div>
                      <div className={styles.whatYoullDoContent}>
                        <h3 className={styles.whatYoullDoTitle}>{item.title}</h3>
                        <p className={styles.whatYoullDoDescription}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}





          </div>

          {/* Right Column - Booking Sidebar */}
          <div className={styles.sidebar}>
            {/* Booking Card */}
            <div className={styles.bookingCard}>
              {/* Event Information Heading */}
              <h3 className={styles.bookingCardTitle}>Event Information</h3>

              {/* Event Details List */}
              <div className={styles.eventDetailsList}>
                <div className={styles.eventDetailItem}>
                  <Icon name="calendar" size="18" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className={styles.eventDetailItem}>
                  <Icon name="clock" size="18" />
                  <span>{formatTime(event.startTime)}</span>
                </div>
                <div className={styles.eventDetailItem}>
                  <Icon name="clock" size="18" />
                  <span>1hr 30min</span>
                </div>
                <div className={styles.eventDetailItem}>
                  <Icon name="user" size="18" />
                  <span>{Number.isFinite(minimumAge) && minimumAge > 0 ? `${minimumAge}+` : "18+"}</span>
                </div>
                <div className={styles.eventDetailItem}>
                  <Icon name="globe" size="18" />
                  <span>English</span>
                </div>
                <div className={styles.eventDetailItem}>
                  <Icon name="star" size="18" />
                  <span>Music</span>
                </div>
                {/* Guest/Attendee Selector */}
                <div
                  ref={guestItemRef}
                  className={cn(styles.eventDetailItem, styles.clickableItem)}
                  style={{ position: 'relative' }}
                >
                  <Icon name="user" size="18" />
                  <div
                    className={styles.guestSelector}
                    onClick={() => {
                      setShowGuestPicker(!showGuestPicker);
                      setBookButtonArmed(true);
                    }}
                    role="button"
                  >
                    <span className={styles.guestLabel}>Guest</span>
                    <span className={styles.guestValue}>
                      {guests.adults + guests.children === 0
                        ? "Add guests"
                        : guests.adults + guests.children === 1
                          ? "1 guest"
                          : `${guests.adults + guests.children} guests`}
                    </span>
                  </div>
                  <GuestPicker
                    visible={showGuestPicker}
                    onClose={() => setShowGuestPicker(false)}
                    onGuestChange={(guestData) => {
                      setGuests(guestData);
                    }}
                    initialGuests={guests}
                    maxGuests={event.totalCapacity || undefined}
                    allowPets={false}
                    childrenAllowed={true}
                    infantsAllowed={true}
                    adultsLabel="Guests"
                  />
                </div>
                {/* Ticket Type Selector */}
                {event.ticketTypes && event.ticketTypes.length > 0 && (
                  <OutsideClickHandler onOutsideClick={() => setShowTicketTypePicker(false)}>
                    <div
                      ref={ticketTypeItemRef}
                      className={cn(styles.eventDetailItem, styles.clickableItem)}
                      style={{ position: 'relative' }}
                    >
                      <Icon name="bag" size="18" />
                      <div
                        className={styles.guestSelector}
                        onClick={() => setShowTicketTypePicker(!showTicketTypePicker)}
                        role="button"
                      >
                        <span className={styles.guestLabel}>Ticket Type</span>
                        <span className={styles.guestValue}>
                          {(() => {
                            const selectedType = event.ticketTypes.find(t => t.id === selectedTicketType) || event.ticketTypes[0];
                            const price = asNumber(selectedType?.price) ?? asNumber(event.ticketPrice) ?? 0;
                            return `${selectedType?.name || "Ticket"} - ${displayCurrency} ${price.toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                      {showTicketTypePicker && (
                        <div className={styles.ticketTypePicker}>
                          {event.ticketTypes.map((ticketType) => (
                            <div
                              key={ticketType.id}
                              className={cn(styles.ticketTypeOption, {
                                [styles.selected]: selectedTicketType === ticketType.id,
                              })}
                              onClick={() => {
                                setSelectedTicketType(ticketType.id);
                                setShowTicketTypePicker(false);
                              }}
                            >
                              <div className={styles.ticketTypeName}>{ticketType.name}</div>
                              <div className={styles.ticketTypePrice}>
                                {event.currency} {ticketType.price}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </OutsideClickHandler>
                )}
              </div>

              {/* Booking Status Banner */}
              {isBookingOpen() && (
                <div className={styles.bookingStatusBanner}>
                  <Icon name="bell" size="18" />
                  <span>Bookings are filling fast for {event.venueSearchLocation || "this event"}</span>
                </div>
              )}

              {!isBookingOpen() && (
                <div className={styles.bookingStatusBannerClosed}>
                  <Icon name="close-circle" size="18" />
                  <span>Booking is now closed</span>
                </div>
              )}

              {/* Total Price and Book Button Section */}
              <div className={styles.bookingFooter}>
                <div className={styles.totalPriceSection}>
                  <span className={styles.totalPriceLabel}>Total Price</span>
                  <span className={styles.totalPriceAmount}>
                    {(() => {
                      const selectedType = event.ticketTypes?.find(t => t.id === selectedTicketType) || event.ticketTypes?.[0] || { price: event.ticketPrice || 0 };
                      const totalGuests = guests.adults + guests.children;
                      const unitPrice = asNumber(selectedType?.price) ?? asNumber(event.ticketPrice) ?? 0;
                      const totalPrice = totalGuests * unitPrice;
                      return `${displayCurrency} ${totalPrice.toFixed(2)}`;
                    })()}
                  </span>
                </div>
                <button
                  className={cn("button", styles.bookButton)}
                  disabled={!isBookingOpen() || bookingLoading}
                  onClick={() => {
                    if (!bookButtonArmed) {
                      setShowGuestPicker(true);
                      setBookButtonArmed(true);
                      return;
                    }
                    setShowGuestPicker(false);
                    handleBookNow();
                  }}
                >
                  <span>
                    {bookingLoading
                      ? "Processing..."
                      : bookButtonArmed
                        ? `Confirm${totalGuestsSelected > 0 ? ` (${totalGuestsSelected})` : ""}`
                        : "Book Now"}
                  </span>
                  <Icon name="bag" size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Venue Information Section */}
      {event.eventMode === "Offline" && (event.venueSearchLocation || event.fullVenueAddress || (event.latitude && event.longitude)) && (
        <section className={cn("section", styles.venueSection)}>
          <div className={cn("container", styles.venueContainer)}>
            <div className={styles.venueInner}>
              <h2 className={styles.sectionTitle}>Venue Information</h2>
              <div className={styles.venueCard}>
                <div className={styles.venueHeader}>
                  <Icon name="marker" size="24" />
                  <div>
                    <div className={styles.venueLocation}>{event.venueSearchLocation}</div>
                    <div className={styles.venueAddress}>{event.fullVenueAddress}</div>
                  </div>
                </div>
                {event.latitude && event.longitude && (
                  <div className={styles.venueMap}>
                    <div className={styles.mapPlaceholder}>
                      <Icon name="location" size="48" />
                      <p>Map View</p>
                      <div className={styles.mapCoordinates}>
                        {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cancellation & Refund Policy Section */}
      {(event.cancellationAllowed !== undefined || event.refundPercentage) && (
        <section className={cn("section", styles.policySection)}>
          <div className={cn("container", styles.policyContainer)}>
            <div className={styles.policyInner}>
              <h2 className={styles.sectionTitle}>Cancellation & Refund Policy</h2>
              <div className={styles.policyCard}>
                <div className={styles.policyItem}>
                  <div className={styles.policyLabel}>Cancellation Allowed</div>
                  <div className={styles.policyValue}>
                    {event.cancellationAllowed ? (
                      <span className={styles.badgeYes}>Yes</span>
                    ) : (
                      <span className={styles.badgeNo}>No</span>
                    )}
                  </div>
                </div>
                {event.cancellationAllowed && event.cancellationCutoff && (
                  <div className={styles.policyItem}>
                    <div className={styles.policyLabel}>Cancellation Cut-off</div>
                    <div className={styles.policyValue}>
                      {formatDateTime(event.cancellationCutoff)}
                    </div>
                  </div>
                )}
                {event.refundPercentage !== undefined && (
                  <div className={styles.policyItem}>
                    <div className={styles.policyLabel}>Refund Percentage</div>
                    <div className={styles.policyValue}>{event.refundPercentage}%</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Terms & Policies Section */}
      {event.termsAndPolicies && (
        <section className={cn("section", styles.termsSection)}>
          <div className={cn("container", styles.termsContainer)}>
            <div className={styles.termsInner}>
              <h2 className={styles.sectionTitle}>Terms & Policies</h2>
              <div className={styles.termsCard}>
                <p>{event.termsAndPolicies}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className={cn("section", styles.reviewsSection)}>
        <div className={cn("container", styles.reviewsContainer)}>
          <div className={styles.reviewsInner}>
            <CommentsProduct
              className={styles.comments}
              parametersUser={[
                { title: "Verified Organizer", icon: "check" },
              ]}
              info={event.description}
              socials={socials}
              buttonText="Contact Organizer"
            />
          </div>
        </div>
      </section>

      {/* Related Events */}
      <div className={styles.relatedSection}>
        <Browse
          classSection="section"
          headSmall
          classTitle="h4"
          title="More Events You Might Like"
          items={browse2}
        />
      </div>
    </div>
  );
};

export default EventProduct;
