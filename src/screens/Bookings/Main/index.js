import React, { useEffect, useMemo, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ProductNavbar from "../../../components/ProductNavbar";
import cn from "classnames";
import styles from "./Main.module.sass";
import Icon from "../../../components/Icon";
import Modal from "../../../components/Modal";
import { emptyStateCopy } from "../../../mocks/bookings";
import { cancelOrder, cancelEventOrder, getEventDetails, getListing, getCompletedOrders, getOrderCancelPreview, submitOrderReview, getEligibleBookings, getStayDetails } from "../../../utils/api";
import Rating from "../../../components/Rating";

// Helper function to format image URLs
const formatImageUrl = (url) => {
  if (!url) return "/images/content/card-pic-13.jpg";

  // If already a full URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it's an Azure blob storage path, prepend the base URL
  if (url.includes("/") && !url.startsWith("/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }

  // If it's a relative path, return as is
  if (url.startsWith("/")) {
    return url;
  }

  // Default fallback
  return "/images/content/card-pic-13.jpg";
};

// Helper function to transform multiple bookings with listing data
// Optimized to cache listing data and avoid duplicate API calls
const transformMultipleBookings = async (bookingsArray) => {
  if (!Array.isArray(bookingsArray) || bookingsArray.length === 0) {
    return [];
  }

  // Step 1: Collect unique listingIds
  const uniqueListingIds = [...new Set(
    bookingsArray
      .map(booking => booking.listingId)
      .filter(id => id != null && id !== undefined)
  )];

  // Step 1b: Collect unique eventIds for event orders
  const uniqueEventIds = [...new Set(
    bookingsArray
      .map((booking) => booking?.eventId)
      .filter((id) => id != null && id !== undefined)
  )];

  // Step 1c: Collect unique stayIds for stay orders
  // Stay orders may have stayId at top level, inside rooms array, or derivable from businessInterestCode
  const uniqueStayIds = [...new Set(
    bookingsArray
      .map((booking) => {
        // Try top-level stayId first
        if (booking?.stayId != null) return booking.stayId;
        // Try rooms array (each room might have stayId) - note it's `stayOrderRooms` in API
        const rooms = booking?.stayOrderRooms || booking?.rooms || booking?.room || [];
        if (Array.isArray(rooms) && rooms.length > 0) {
          const roomStayId = rooms[0]?.stayId ?? rooms[0]?.stay_id ?? rooms[0]?.propertyId;
          if (roomStayId != null) return roomStayId;
        }
        // Try other common field names
        return booking?.propertyId ?? booking?.stay_id ?? booking?.stayOrderId ?? null;
      })
      .filter((id) => id != null && id !== undefined)
  )];

  // Step 2: Fetch all unique listings in parallel (cached)
  const listingCache = new Map();
  const eventCache = new Map();
  const stayCache = new Map();

  if (uniqueListingIds.length > 0) {
    const listingPromises = uniqueListingIds.map(async (listingId) => {
      try {
        const listingData = await getListing(listingId);
        listingCache.set(listingId, listingData);
        console.log(`✅ Fetched listing ${listingId} (cached for reuse)`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch listing ${listingId}:`, error.message);
        listingCache.set(listingId, null); // Cache null to avoid retrying
      }
    });

    await Promise.all(listingPromises);
  }

  if (uniqueEventIds.length > 0) {
    const eventPromises = uniqueEventIds.map(async (eventId) => {
      try {
        const eventData = await getEventDetails(eventId);
        eventCache.set(eventId, eventData);
        console.log(`✅ Fetched event ${eventId} (cached for reuse)`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch event ${eventId}:`, error.message);
        eventCache.set(eventId, null);
      }
    });

    await Promise.all(eventPromises);
  }

  if (uniqueStayIds.length > 0) {
    const stayPromises = uniqueStayIds.map(async (stayId) => {
      try {
        const stayData = await getStayDetails(stayId);
        stayCache.set(stayId, stayData);
        console.log(`✅ Fetched stay ${stayId} (cached for reuse)`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch stay ${stayId}:`, error.message);
        stayCache.set(stayId, null);
      }
    });

    await Promise.all(stayPromises);
  }

  // Step 3: Transform bookings using cached listing data
  return bookingsArray.map((apiBooking) => {
    const listingData = apiBooking.listingId ? listingCache.get(apiBooking.listingId) : null;
    const eventData = apiBooking?.eventId ? eventCache.get(apiBooking.eventId) : null;
    // Resolve stayId using same multi-path logic as uniqueStayIds extraction above
    const resolvedStayId = (() => {
      if (apiBooking?.stayId != null) return apiBooking.stayId;
      const rooms = apiBooking?.stayOrderRooms || apiBooking?.rooms || apiBooking?.room || [];
      if (Array.isArray(rooms) && rooms.length > 0) {
        const id = rooms[0]?.stayId ?? rooms[0]?.stay_id ?? rooms[0]?.propertyId;
        if (id != null) return id;
      }
      return apiBooking?.propertyId ?? apiBooking?.stay_id ?? null;
    })();
    const stayData = resolvedStayId != null ? stayCache.get(resolvedStayId) : null;
    return transformBookingData(apiBooking, listingData, eventData, stayData);
  });
};

// Transform API booking data to component format
const transformBookingData = (apiBooking, listingData = null, eventData = null, stayData = null) => {
  const eventDetails = eventData?.event || eventData?.data?.event || eventData?.data || eventData;

  // Format date from "2025-11-19" to "Fri, 21 Nov 2025" format
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Determine status mapping
  const statusMap = {
    // PENDING means reservation was initiated but not confirmed/paid.
    // Show these in Cancelled tab instead of Upcoming.
    PENDING: "Cancelled",
    CONFIRMED: "Upcoming",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  let status = statusMap[apiBooking.orderStatus] || "Upcoming";

  // If the backend says Upcoming (PENDING/CONFIRMED) but the booking date has
  // already passed, show the booking in Completed instead.
  if (status === "Upcoming") {
    const bookingDateStr =
      apiBooking.checkOutDate ||
      apiBooking.checkInDate ||
      apiBooking.bookingDate ||
      apiBooking.eventDate ||
      apiBooking.eventDetails?.eventDate ||
      null;

    if (bookingDateStr) {
      // Compare against end-of-experience time if available, otherwise end-of-day
      const deadline = new Date(bookingDateStr);
      
      const endTimeStr = apiBooking.timeSlotEndTime || apiBooking.checkOutTime || apiBooking.endTime || apiBooking.bookingTime;
      
      if (endTimeStr && typeof endTimeStr === 'string' && endTimeStr.includes(':')) {
        const [hours, minutes, seconds] = endTimeStr.split(':').map(Number);
        deadline.setHours(hours || 0, minutes || 0, seconds || 0, 0);
      } else {
        // Fallback to end-of-day if no specific time is provided
        deadline.setHours(23, 59, 59, 999);
      }

      if (deadline < new Date()) {
        status = "Completed";
      }
    }
  }

  // Get title - for EVENTS orders, prefer eventTitle; for others, prefer listing data
  // Check if this is an EVENTS order by businessInterestCode
  const isEventOrder = apiBooking?.businessInterestCode === "EVENTS" ||
    apiBooking?.eventId != null;

  const title = isEventOrder
    ? (eventDetails?.title ||
      eventDetails?.eventTitle ||
      eventDetails?.name ||
      apiBooking?.eventTitle ||
      apiBooking?.eventDetails?.eventTitle ||
      apiBooking?.listing?.eventTitle ||
      apiBooking?.title ||
      "Event Booking")
    : (stayData?.title ||
      stayData?.name ||
      listingData?.title ||
      apiBooking?.listingTitle ||
      apiBooking?.listing?.title ||
      apiBooking?.stayTitle ||
      apiBooking?.title ||
      "Booking");

  // Get category - use businessInterestCode (like "EXPERIENCE", "EVENTS")
  // This shows the service type after "SERVICE •"
  const category =
    stayData?.businessInterestCode ||
    listingData?.businessInterestCode ||
    listingData?.businessInterest ||
    apiBooking?.businessInterestCode ||
    apiBooking?.businessInterest ||
    apiBooking?.listing?.businessInterestCode ||
    apiBooking?.listing?.businessInterest ||
    (stayData ? "STAYS" : (apiBooking?.eventId || apiBooking?.eventDetails ? "EVENTS" : "EXPERIENCE"));

  // Extract location - for EVENTS prefer event data, for others prefer listing data
  let location = "Location TBD";

  // For event orders, check event location first
  if (isEventOrder) {
    if (eventDetails?.fullVenueAddress) {
      location = eventDetails.fullVenueAddress;
    } else if (eventDetails?.venueFullAddress) {
      location = eventDetails.venueFullAddress;
    } else if (eventDetails?.venueSearchLocation) {
      location = eventDetails.venueSearchLocation;
    } else if (eventDetails?.venueName) {
      location = eventDetails.venueName;
    } else if (eventDetails?.venueDistrict && eventDetails?.venueState) {
      location = `${eventDetails.venueDistrict}, ${eventDetails.venueState}`;
    } else if (eventDetails?.venueDistrict) {
      location = eventDetails.venueDistrict;
    } else if (eventDetails?.venueState) {
      location = eventDetails.venueState;
    } else if (apiBooking?.eventDetails?.venueFullAddress) {
      location = apiBooking.eventDetails.venueFullAddress;
    } else if (apiBooking?.eventDetails?.venueName) {
      location = apiBooking.eventDetails.venueName;
    } else if (apiBooking?.eventDetails?.venueDistrict && apiBooking?.eventDetails?.venueState) {
      location = `${apiBooking.eventDetails.venueDistrict}, ${apiBooking.eventDetails.venueState}`;
    } else if (apiBooking?.eventDetails?.venueDistrict) {
      location = apiBooking.eventDetails.venueDistrict;
    } else if (apiBooking?.venueFullAddress) {
      location = apiBooking.venueFullAddress;
    } else if (apiBooking?.venueName) {
      location = apiBooking.venueName;
    } else if (apiBooking?.venueDistrict && apiBooking?.venueState) {
      location = `${apiBooking.venueDistrict}, ${apiBooking.venueState}`;
    } else if (apiBooking?.venueDistrict) {
      location = apiBooking.venueDistrict;
    }
  }

  // For non-event orders or as fallback, check listing data first (most accurate)
  if (location === "Location TBD" && listingData) {
    if (listingData.meetingAddress) {
      location = listingData.meetingAddress;
    } else if (listingData.meetingLocationName) {
      location = listingData.meetingLocationName;
    } else if (listingData.location) {
      location = listingData.location;
    } else if (listingData.city && listingData.state) {
      location = `${listingData.city}, ${listingData.state}`;
    } else if (listingData.city) {
      location = listingData.city;
    } else if (listingData.address) {
      location = listingData.address;
    }
  }

  // Check stay data for location
  if (location === "Location TBD" && stayData) {
    if (stayData.address) {
      location = stayData.address;
    } else if (stayData.city && stayData.state) {
      location = `${stayData.city}, ${stayData.state}`;
    } else if (stayData.city) {
      location = stayData.city;
    } else if (stayData.location) {
      location = stayData.location;
    }
  }

  // Fallback: Check booking data if location still not available
  if (location === "Location TBD") {
    if (apiBooking?.meetingAddress) {
      location = apiBooking.meetingAddress;
    } else if (apiBooking?.meetingLocationName) {
      location = apiBooking.meetingLocationName;
    } else if (apiBooking?.location) {
      location = apiBooking.location;
    } else if (apiBooking?.city && apiBooking?.state) {
      location = `${apiBooking.city}, ${apiBooking.state}`;
    } else if (apiBooking?.city) {
      location = apiBooking.city;
    } else if (apiBooking?.address) {
      location = apiBooking.address;
    } else if (apiBooking?.listing?.meetingAddress) {
      location = apiBooking.listing.meetingAddress;
    } else if (apiBooking?.listing?.location) {
      location = apiBooking.listing.location;
    } else if (apiBooking?.listing?.city && apiBooking?.listing?.state) {
      location = `${apiBooking.listing.city}, ${apiBooking.listing.state}`;
    }
    // Check event details for location
    else if (apiBooking?.eventDetails?.venueFullAddress) {
      location = apiBooking.eventDetails.venueFullAddress;
    } else if (apiBooking?.eventDetails?.venueName) {
      location = apiBooking.eventDetails.venueName;
    } else if (apiBooking?.eventDetails?.venueDistrict && apiBooking?.eventDetails?.venueState) {
      location = `${apiBooking.eventDetails.venueDistrict}, ${apiBooking.eventDetails.venueState}`;
    } else if (apiBooking?.eventDetails?.venueDistrict) {
      location = apiBooking.eventDetails.venueDistrict;
    }
  }

  // Get cover photo - for EVENTS prefer event images, for others prefer listing data
  let coverPhotoUrl = null;

  if (isEventOrder) {
    // For event orders, prioritize event-specific cover images
    coverPhotoUrl = eventDetails?.coverImage ||
      eventDetails?.coverImageUrl ||
      eventDetails?.coverPhotoUrl ||
      eventDetails?.imageUrl ||
      (Array.isArray(eventDetails?.media) && eventDetails.media[0]
        ? (eventDetails.media[0].url || eventDetails.media[0].imageUrl || eventDetails.media[0].fileUrl)
        : null) ||
      apiBooking?.eventCoverImageUrl ||
      apiBooking?.eventDetails?.eventCoverImageUrl ||
      apiBooking?.listing?.eventCoverImageUrl ||
      apiBooking?.listingCoverPhotoUrl ||
      apiBooking?.coverPhotoUrl ||
      null;
  } else {
    // For non-event orders, use listing data
    if (listingData?.listingCoverPhotoUrl) {
      coverPhotoUrl = listingData.listingCoverPhotoUrl;
    } else if (listingData?.coverPhotoUrl) {
      coverPhotoUrl = listingData.coverPhotoUrl;
    } else if (stayData) {
      // Try all common image fields from the stay API response
      coverPhotoUrl =
        stayData.coverImageUrl ||
        stayData.coverPhotoUrl ||
        (Array.isArray(stayData.listingMedia) && stayData.listingMedia[0]
          ? (stayData.listingMedia[0].url || stayData.listingMedia[0].blobName || stayData.listingMedia[0].fileUrl)
          : null) ||
        (Array.isArray(stayData.media) && stayData.media[0]
          ? (stayData.media[0].url || stayData.media[0].blobName || stayData.media[0].fileUrl)
          : null) ||
        (Array.isArray(stayData.images) ? stayData.images[0] : null) ||
        (Array.isArray(stayData.propertyImages) ? stayData.propertyImages[0] : null) ||
        null;
    } else if (apiBooking?.listingCoverPhotoUrl) {
      coverPhotoUrl = apiBooking.listingCoverPhotoUrl;
    } else if (apiBooking?.listingCoverPhoto) {
      coverPhotoUrl = apiBooking.listingCoverPhoto;
    } else if (apiBooking?.listing?.listingCoverPhotoUrl) {
      coverPhotoUrl = apiBooking.listing.listingCoverPhotoUrl;
    } else if (apiBooking?.listing?.coverPhotoUrl) {
      coverPhotoUrl = apiBooking.listing.coverPhotoUrl;
    } else if (apiBooking?.coverPhotoUrl) {
      coverPhotoUrl = apiBooking.coverPhotoUrl;
    }
  }

  // Format the image URL to ensure it's a valid full URL
  coverPhotoUrl = formatImageUrl(coverPhotoUrl);

  // Type is always "SERVICE" as the label
  const type = "SERVICE";

  return {
    id: `bk-${apiBooking.orderId}`,
    orderId: apiBooking.orderId,
    title: title,
    type: type,
    category: category,
    location: location,
    startDate: formatDate(apiBooking.checkInDate || apiBooking.bookingDate),
    endDate: formatDate(apiBooking.checkOutDate || apiBooking.bookingDate), // You may want to calculate end date based on bookingSlotId
    status: status,
    statusTone: status.toLowerCase(),
    thumbnail: {
      src: coverPhotoUrl,
      srcSet: coverPhotoUrl,
      alt: title,
    },
    // Include original booking data for details
    bookingData: apiBooking,
  };
};

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const actionsByStatus = {
  Upcoming: [
    { label: "View Details", variant: "primary" },
    { label: "Leave review", variant: "secondary" },
    { label: "Cancel Booking", variant: "secondary" },
  ],
  Completed: [
    { label: "View Details", variant: "primary" },
    { label: "Leave review", variant: "secondary" },
  ],
  Cancelled: [
    { label: "View Details", variant: "primary" },
  ],
};

const Main = ({
  bookingData: propBookingData = null,
  completedOrders: propCompletedOrders = null,
  completedCount = 0,
  setCompletedOrders = null
}) => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [displayedTab, setDisplayedTab] = useState(tabs[0].id);
  const [transitionPhase, setTransitionPhase] = useState("idle");
  const [pendingTab, setPendingTab] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [transformedBookings, setTransformedBookings] = useState([]);
  const [transformedCompletedBookings, setTransformedCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false); // Track if initial tab has been set
  // Review modal state (completed orders only)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [bookingToReview, setBookingToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [orderIdsEligibleForReview, setOrderIdsEligibleForReview] = useState(new Set());

  // Fetch review eligibility on mount
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const eligibleData = await getEligibleBookings();
        const eligibleList = Array.isArray(eligibleData) ? eligibleData : [];
        const eligibleIds = new Set(
          eligibleList.map((o) => (o.orderId != null ? Number(o.orderId) : null)).filter(Boolean)
        );
        setOrderIdsEligibleForReview(eligibleIds);
        console.log("✅ Fetched review eligibility on mount:", eligibleIds.size, "orders");
      } catch (error) {
        console.warn("⚠️ Failed to fetch review eligibility on mount:", error);
      }
    };
    fetchEligibility();
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [displayedTab]);

  // Transform booking data when propBookingData is provided
  useEffect(() => {
    const transformBookings = async () => {
      setLoading(true);
      try {
        let regularTransformed = [];
        let completedTransformed = [];

        // Handle regular bookings (upcoming, pending, cancelled - excluding completed)
        if (propBookingData !== null && propBookingData !== undefined) {
          const bookingsArray = Array.isArray(propBookingData)
            ? propBookingData
            : [propBookingData];

          // Filter out COMPLETED status orders from regular bookings
          const filteredBookings = bookingsArray.filter(
            booking => booking && booking.orderStatus !== "COMPLETED"
          );

          if (filteredBookings.length > 0) {
            regularTransformed = await transformMultipleBookings(filteredBookings);
            setTransformedBookings(regularTransformed);
          } else {
            setTransformedBookings([]);
          }
        } else {
          setTransformedBookings([]);
        }

        // Handle completed/expired orders separately
        if (propCompletedOrders !== null && propCompletedOrders !== undefined) {
          const completedArray = Array.isArray(propCompletedOrders)
            ? propCompletedOrders
            : [propCompletedOrders];

          // Filter to ensure we only have valid orders
          const validCompletedOrders = completedArray.filter(order => order);

          if (validCompletedOrders.length > 0) {
            completedTransformed = await transformMultipleBookings(validCompletedOrders);
            setTransformedCompletedBookings(completedTransformed);
          } else {
            setTransformedCompletedBookings([]);
          }
        } else {
          setTransformedCompletedBookings([]);
        }

        // Always open on the Upcoming tab on initial load
        if (!initialTabSet) {
          setActiveTab("upcoming");
          setDisplayedTab("upcoming");
          setInitialTabSet(true);
        }
      } catch (error) {
        console.error("Error transforming booking data:", error);
        // Fallback: transform with empty arrays on error
        setTransformedBookings([]);
        setTransformedCompletedBookings([]);
      } finally {
        setLoading(false);
      }
    };

    transformBookings();
  }, [propBookingData, propCompletedOrders, initialTabSet]);

  const countsByTab = useMemo(() => {
    // Count upcoming, completed (date-overridden), and cancelled from regular bookings
    const categorized = transformedBookings.reduce((acc, booking) => {
      const tabId = booking.statusTone === "upcoming" ? "upcoming"
        : booking.statusTone === "completed" ? "completed"
        : "cancelled";
      acc[tabId] = (acc[tabId] || 0) + 1;
      return acc;
    }, {});

    // Add server-side completed orders; also include date-overridden completed from regular bookings
    const dateOverriddenCompleted = categorized.completed || 0;
    if (transformedCompletedBookings.length > 0) {
      categorized.completed = transformedCompletedBookings.length + dateOverriddenCompleted;
    } else {
      categorized.completed = (completedCount || 0) + dateOverriddenCompleted;
    }

    return tabs.reduce((acc, tab) => {
      acc[tab.id] = categorized[tab.id] || 0;
      return acc;
    }, {});
  }, [transformedBookings, transformedCompletedBookings, completedCount]);

  const bookingsForTab = useMemo(() => {
    // For completed tab: merge server-side completed orders + date-overridden ones from regular bookings
    if (displayedTab === "completed") {
      const dateOverridden = transformedBookings.filter(
        (b) => b.statusTone === "completed"
      );
      return [...dateOverridden, ...transformedCompletedBookings];
    }

    // For upcoming and cancelled tabs, exclude date-overridden completed bookings
    return transformedBookings.filter((booking) => {
      const tabId = booking.statusTone === "upcoming" ? "upcoming"
        : booking.statusTone === "completed" ? null  // exclude — goes to completed tab
        : "cancelled";
      return tabId === displayedTab;
    });
  }, [transformedBookings, transformedCompletedBookings, displayedTab]);

  // Paginated bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return bookingsForTab.slice(startIndex, startIndex + itemsPerPage);
  }, [bookingsForTab, currentPage]);

  const totalPages = Math.ceil(bookingsForTab.length / itemsPerPage);

  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const emptyState = emptyStateCopy[displayedTab] || emptyStateCopy.upcoming;

  useEffect(() => {
    if (transitionPhase === "fadingOut") {
      const timeout = setTimeout(() => {
        if (pendingTab) {
          setDisplayedTab(pendingTab);
        }
        setTransitionPhase("fadingIn");
      }, 180);

      return () => clearTimeout(timeout);
    }

    if (transitionPhase === "fadingIn") {
      const timeout = setTimeout(() => {
        setTransitionPhase("idle");
        setPendingTab(null);
      }, 220);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [pendingTab, transitionPhase]);

  const handleTabChange = async (nextTab) => {
    if (nextTab === activeTab || transitionPhase === "fadingOut") {
      return;
    }

    // Immediately mark that user has manually selected a tab to prevent auto-switching
    // This prevents the useEffect from resetting the tab when propCompletedOrders changes
    setInitialTabSet(true);

    // Set the tab immediately so user sees the change
    setActiveTab(nextTab);
    setPendingTab(nextTab);
    setTransitionPhase("fadingOut");

    // If clicking on completed tab and we haven't loaded completed orders yet, fetch them
    if (nextTab === "completed" && transformedCompletedBookings.length === 0 && !loadingCompleted) {
      setLoadingCompleted(true);
      try {
        const [completedOrdersData, eligibleData] = await Promise.all([
          getCompletedOrders(1, 20),
          getEligibleBookings().catch(() => []),
        ]);
        console.log("✅ Fetched completed orders:", completedOrdersData);

        if (Array.isArray(completedOrdersData) && completedOrdersData.length > 0) {
          const transformed = await transformMultipleBookings(completedOrdersData);
          setTransformedCompletedBookings(transformed);
        }
        // Eligible bookings = completed orders without reviews; show "Leave review" for these orderIds
        const eligibleList = Array.isArray(eligibleData) ? eligibleData : [];
        const eligibleIds = new Set(
          eligibleList.map((o) => (o.orderId != null ? Number(o.orderId) : null)).filter(Boolean)
        );
        setOrderIdsEligibleForReview(eligibleIds);
      } catch (error) {
        console.error("❌ Error fetching completed orders:", error);
      } finally {
        setLoadingCompleted(false);
      }
    }
  };

  const getButtonClassName = (variant) => {
    switch (variant) {
      case "secondary":
        return cn("button-stroke", "button-small", styles.actionButton);
      case "ghost":
        return cn("button-stroke", "button-small", styles.ghostButton, styles.actionButton);
      default:
        return cn("button", "button-small", styles.actionButton);
    }
  };

  const handleCancelBookingClick = async (booking) => {
    setBookingToCancel(booking);
    setCancelReason("");
    setCancelError(null);

    const isEventOrder = booking?.category === "EVENTS" || booking?.bookingData?.eventId != null;
    if (isEventOrder && booking?.orderId) {
      try {
        const preview = await getOrderCancelPreview(booking.orderId);
        console.log("🧾 Event cancel preview:", {
          orderId: booking.orderId,
          preview,
          booking,
        });
      } catch (e) {
        console.warn("⚠️ Failed to fetch cancel preview:", e?.response?.data || e?.message || e);
      }
    }

    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !cancelReason.trim()) {
      setCancelError("Please enter a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const cancelRequestBody = {
        reason: cancelReason.trim(),
        adminOverride: false,
      };

      const orderIdForCancel = bookingToCancel.orderId;
      const cancelUrl = `/api/orders/${orderIdForCancel}/cancel`;
      console.log("🧾 Cancel booking request:", {
        url: cancelUrl,
        orderId: orderIdForCancel,
        body: cancelRequestBody,
        bookingToCancel,
      });

      const isEventOrder = bookingToCancel?.category === "EVENTS" || bookingToCancel?.bookingData?.eventId != null;

      // Call the correct cancel API
      if (isEventOrder) {
        await cancelEventOrder(orderIdForCancel, cancelRequestBody);
      } else {
        await cancelOrder(orderIdForCancel, cancelRequestBody);
      }

      // Update the booking status in the transformed bookings
      setTransformedBookings((prevBookings) => {
        return prevBookings.map((booking) => {
          if (booking.orderId === bookingToCancel.orderId) {
            // Update the booking to cancelled status
            const updatedBooking = {
              ...booking,
              status: "Cancelled",
              statusTone: "cancelled",
              bookingData: {
                ...booking.bookingData,
                orderStatus: "CANCELLED",
              },
            };
            return updatedBooking;
          }
          return booking;
        });
      });

      // Switch to cancelled tab if not already there
      if (activeTab !== "cancelled") {
        setActiveTab("cancelled");
        setPendingTab("cancelled");
        setTransitionPhase("fadingOut");
      }

      // Close modal and reset state
      setCancelModalVisible(false);
      setBookingToCancel(null);
      setCancelReason("");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setCancelError(
        error.response?.data?.message ||
        error.message ||
        "Failed to cancel booking. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelModalVisible(false);
    setBookingToCancel(null);
    setCancelReason("");
    setCancelError(null);
  };

  const handleLeaveReviewClick = (booking) => {
    setBookingToReview(booking);
    setReviewRating(0);
    setReviewComment("");
    setReviewError(null);
    setReviewModalVisible(true);
  };

  const handleCloseReviewModal = () => {
    setReviewModalVisible(false);
    setBookingToReview(null);
    setReviewRating(0);
    setReviewComment("");
    setReviewError(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!bookingToReview || reviewRating < 1 || reviewRating > 5) {
      setReviewError("Please select a rating (1–5 stars).");
      return;
    }
    setReviewError(null);
    setIsSubmittingReview(true);
    try {
      await submitOrderReview(bookingToReview.orderId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        listingId: bookingToReview.bookingData?.listingId,
      });
      setOrderIdsEligibleForReview((prev) => {
        const next = new Set(prev);
        next.delete(bookingToReview.orderId);
        return next;
      });
      handleCloseReviewModal();
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      if (status === 409) {
        setReviewError("You've already reviewed this order.");
        setOrderIdsEligibleForReview((prev) => {
          const next = new Set(prev);
          next.delete(bookingToReview.orderId);
          return next;
        });
      } else {
        setReviewError(message || "Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Show loading state while fetching/transforming data
  // Show loading if: (1) currently loading, OR (2) no data provided yet (null)
  if ((loading && transformedBookings.length === 0) || (propBookingData === null && transformedBookings.length === 0)) {
    return (
      <div className={cn("section", styles.section)}>
        <div className={cn("container", styles.container)}>
          <header className={styles.head}>
            <div className={styles.heading}>
              <h1 className={cn("h2", styles.title)}>My bookings</h1>
            </div>
          </header>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("section-pd", styles.main)}>
      <ProductNavbar top={100} left={60} />
      <div className={cn("container", styles.container)}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div className={styles.heading}>
            <h1 className={cn("h2", styles.title)}>My bookings</h1>
          </div>
        </div>
        <div className={styles.tabsWrapper}>
          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(styles.tab, {
                  [styles.tabActive]: tab.id === activeTab,
                })}
              >
                <span>{tab.label}</span>
                <span className={styles.count}>{countsByTab[tab.id]}</span>
              </button>
            ))}
          </div>
        </div>
        <div
          className={cn(styles.panel, {
            [styles.fadeOut]: transitionPhase === "fadingOut",
            [styles.fadeIn]: transitionPhase === "fadingIn",
          })}
        >
          {loadingCompleted && displayedTab === "completed" ? (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <p>Loading completed orders...</p>
            </div>
          ) : bookingsForTab.length > 0 ? (
            <div className={styles.list}>
              {paginatedBookings.map((booking) => (
                <article className={styles.card} key={booking.id}>
                  <div className={styles.media}>
                    <img
                      src={booking.thumbnail.src}
                      srcSet={`${booking.thumbnail.srcSet} 2x`}
                      alt={booking.thumbnail.alt}
                    />
                  </div>
                  <div className={styles.body}>
                    <div className={styles.bodyTop}>
                      <div className={styles.meta}>
                        <div className={styles.typeRow}>
                          <span className={styles.type}>{booking.type}</span>
                          <span className={styles.dot} aria-hidden="true">
                            •
                          </span>
                          <span className={styles.category}>
                            {booking.category}
                          </span>
                          {booking.bookingData?.orderStatus && (
                            <>
                              <span className={styles.dot} aria-hidden="true">
                                •
                              </span>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                                lineHeight: "1",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                backgroundColor: booking.bookingData.orderStatus === "CONFIRMED" ? "#E8F5E9" :
                                                 booking.bookingData.orderStatus === "COMPLETED" ? "#E3F2FD" :
                                                 booking.bookingData.orderStatus === "PENDING"   ? "#FFF3E0" :
                                                 booking.bookingData.orderStatus === "CANCELLED" ? "#FFEBEE" : "#F3F4F6",
                                color: booking.bookingData.orderStatus === "CONFIRMED" ? "#2E7D32" :
                                       booking.bookingData.orderStatus === "COMPLETED" ? "#1565C0" :
                                       booking.bookingData.orderStatus === "PENDING"   ? "#E65100" :
                                       booking.bookingData.orderStatus === "CANCELLED" ? "#C62828" : "#6B7280",
                              }}>
                                {booking.bookingData.orderStatus}
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className={styles.cardTitle}>{booking.title}</h2>
                        <div className={styles.locationRow}>
                          <Icon name="marker" size="16" />
                          <span>{booking.location}</span>
                        </div>
                        <div className={styles.dateRow}>
                          <Icon name="calendar" size="16" />
                          <span>
                            {booking.startDate}
                            {booking.endDate &&
                              booking.endDate !== booking.startDate && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  {booking.endDate}
                                </>
                              )}
                          </span>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        {(actionsByStatus[booking.status] || []).map((action) => {
                          if (action.label === "View Details") {
                            // Pass businessInterestCode (category) to determine which API to use
                            const isEvent = booking.category === "EVENTS" ||
                              booking.bookingData?.eventId ||
                              booking.bookingData?.businessInterestCode === "EVENTS";
                            const viewUrl = isEvent
                              ? `/viewdetails?id=${booking.id}&type=event`
                              : `/viewdetails?id=${booking.id}`;
                            return (
                              <Link
                                key={`${booking.id}-${action.label}`}
                                to={viewUrl}
                                className={getButtonClassName(action.variant)}
                              >
                                {action.label}
                              </Link>
                            );
                          }
                          if (action.label === "Cancel Booking") {
                            return (
                              <button
                                type="button"
                                key={`${booking.id}-${action.label}`}
                                className={getButtonClassName(action.variant)}
                                onClick={() => handleCancelBookingClick(booking)}
                              >
                                {action.label}
                              </button>
                            );
                          }
                          if (action.label === "Leave review") {
                            if (!orderIdsEligibleForReview.has(booking.orderId)) return null;
                            return (
                              <button
                                type="button"
                                key={`${booking.id}-${action.label}`}
                                className={getButtonClassName(action.variant)}
                                onClick={() => handleLeaveReviewClick(booking)}
                              >
                                {action.label}
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              key={`${booking.id}-${action.label}`}
                              className={getButtonClassName(action.variant)}
                            >
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '32px', gap: '16px' }}>
                  <button
                    type="button"
                    className="button-stroke button-small"
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="button-stroke button-small"
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIllustration}>
                <img
                  src={emptyState.illustration}
                  srcSet={`${emptyState.illustrationSet} 2x`}
                  alt={emptyState.illustrationAlt}
                />
              </div>
              <div className={styles.emptyContent}>
                <h2 className={styles.emptyTitle}>
                  {emptyState.title}
                </h2>
                <p className={styles.emptyDescription}>
                  {emptyState.description}
                </p>
                <button type="button" className="button">
                  Explore experiences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        visible={cancelModalVisible}
        onClose={handleCloseCancelModal}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>
              Cancel Booking
            </h2>
            <p className={styles.cancelModalDescription}>
              Please provide a reason for cancelling this booking.
            </p>
          </div>
          <div className={styles.cancelModalBody}>
            <div className={styles.cancelModalFormGroup}>
              <label htmlFor="cancelReason" className={styles.cancelModalLabel}>
                Reason for Cancellation <span className={styles.required}>*</span>
              </label>
              <textarea
                id="cancelReason"
                className={cn(styles.cancelModalInput, styles.cancelModalTextarea, {
                  [styles.inputError]: cancelError && !cancelReason.trim(),
                })}
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError(null);
                }}
                placeholder="Enter the reason for cancellation..."
                rows={4}
                disabled={isCancelling}
              />
            </div>
            {cancelError && (
              <div className={styles.cancelModalError}>
                {cancelError}
              </div>
            )}
          </div>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={handleCloseCancelModal}
              disabled={isCancelling}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? "Cancelling..." : "Submit"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        visible={reviewModalVisible}
        onClose={handleCloseReviewModal}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>
              Add a review
            </h2>
            <p className={styles.cancelModalDescription}>
              {bookingToReview ? `How was your experience with "${bookingToReview.title}"?` : "Share your experience."}
            </p>
          </div>
          <form onSubmit={handleSubmitReview} className={styles.cancelModalBody}>
            <div className={styles.cancelModalFormGroup}>
              <label className={styles.cancelModalLabel}>
                Rating <span className={styles.required}>*</span>
              </label>
              <Rating
                className={styles.reviewRating}
                rating={reviewRating}
                onChange={setReviewRating}
                readonly={false}
              />
            </div>
            <div className={styles.cancelModalFormGroup}>
              <label htmlFor="reviewComment" className={styles.cancelModalLabel}>
                Comment (optional)
              </label>
              <textarea
                id="reviewComment"
                className={cn(styles.cancelModalInput, styles.cancelModalTextarea)}
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  setReviewError(null);
                }}
                placeholder="Share your thoughts..."
                rows={3}
                disabled={isSubmittingReview}
              />
            </div>
            {reviewError && (
              <div className={styles.cancelModalError}>
                {reviewError}
              </div>
            )}
          </form>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={handleCloseReviewModal}
              disabled={isSubmittingReview}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || reviewRating < 1 || reviewRating > 5}
            >
              {isSubmittingReview ? "Submitting..." : "Post it!"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Main;
          
