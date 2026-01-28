import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import cn from "classnames";
import styles from "./Main.module.sass";
import Icon from "../../../components/Icon";
import Modal from "../../../components/Modal";
import { emptyStateCopy } from "../../../mocks/bookings";
import { cancelOrder, cancelEventOrder, getEventDetails, getListing, getCompletedOrders, getOrderCancelPreview, submitOrderReview, getEligibleBookings } from "../../../utils/api";
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

  // Step 2: Fetch all unique listings in parallel (cached)
  const listingCache = new Map();
  const eventCache = new Map();
  
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

  // Step 3: Transform bookings using cached listing data
  return bookingsArray.map((apiBooking) => {
    const listingData = apiBooking.listingId ? listingCache.get(apiBooking.listingId) : null;
    const eventData = apiBooking?.eventId ? eventCache.get(apiBooking.eventId) : null;
    return transformBookingData(apiBooking, listingData, eventData);
  });
};

// Transform API booking data to component format
const transformBookingData = (apiBooking, listingData = null, eventData = null) => {
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
    PENDING: "Upcoming",
    CONFIRMED: "Upcoming",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const status = statusMap[apiBooking.orderStatus] || "Upcoming";

  // Get title - for EVENTS orders, prefer eventTitle; for others, prefer listing data
  // Check if this is an EVENTS order by businessInterestCode
  const isEventOrder = apiBooking?.businessInterestCode === "EVENTS" || 
                       apiBooking?.eventId != null;
  
  const title = isEventOrder
    ? (apiBooking?.eventTitle || 
       apiBooking?.eventDetails?.eventTitle || 
       apiBooking?.listing?.eventTitle ||
       apiBooking?.title || 
       "Event Booking")
    : (listingData?.title || 
       apiBooking?.listingTitle || 
       apiBooking?.listing?.title || 
       apiBooking?.title || 
       "Booking");
  
  // Get category - use businessInterestCode (like "EXPERIENCE", "EVENTS")
  // This shows the service type after "SERVICE •"
  const category = 
    listingData?.businessInterestCode ||
    listingData?.businessInterest ||
    apiBooking?.businessInterestCode ||
    apiBooking?.businessInterest ||
    apiBooking?.listing?.businessInterestCode ||
    apiBooking?.listing?.businessInterest ||
    (apiBooking?.eventId || apiBooking?.eventDetails ? "EVENTS" : "EXPERIENCE");
  
  // Extract location - for EVENTS prefer event data, for others prefer listing data
  let location = "Location TBD";
  
  // For event orders, check event location first
  if (isEventOrder) {
    if (eventData?.fullVenueAddress) {
      location = eventData.fullVenueAddress;
    } else if (eventData?.venueFullAddress) {
      location = eventData.venueFullAddress;
    } else if (eventData?.venueSearchLocation) {
      location = eventData.venueSearchLocation;
    } else if (eventData?.venueName) {
      location = eventData.venueName;
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
    coverPhotoUrl = eventData?.coverImage ||
                    eventData?.coverImageUrl ||
                    eventData?.coverPhotoUrl ||
                    eventData?.imageUrl ||
                    apiBooking?.eventCoverImageUrl ||
                    apiBooking?.eventDetails?.eventCoverImageUrl ||
                    apiBooking?.listing?.eventCoverImageUrl ||
                    apiBooking?.coverPhotoUrl ||
                    null;
  } else {
    // For non-event orders, use listing data
    if (listingData?.coverPhotoUrl) {
      coverPhotoUrl = listingData.coverPhotoUrl;
    } else if (apiBooking?.listingCoverPhoto) {
      coverPhotoUrl = apiBooking.listingCoverPhoto;
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
    startDate: formatDate(apiBooking.bookingDate),
    endDate: formatDate(apiBooking.bookingDate), // You may want to calculate end date based on bookingSlotId
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
    { label: "Cancel Booking", variant: "secondary" },
    { label: "Message Host", variant: "secondary" },
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
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [displayedTab, setDisplayedTab] = useState(tabs[0].id);
  const [transitionPhase, setTransitionPhase] = useState("idle");
  const [pendingTab, setPendingTab] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
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
          
          // Set the correct tab based on first booking status (or most common status)
        // Only set default tab on initial load - never override user's manual selection
        if (!initialTabSet && (regularTransformed.length > 0 || completedTransformed.length > 0)) {
          const statusCounts = {
            upcoming: regularTransformed.filter(b => b.statusTone === "upcoming").length,
            completed: completedTransformed.length,
            cancelled: regularTransformed.filter(b => b.statusTone === "cancelled").length,
          };
            
            // Set tab to the one with most bookings, defaulting to upcoming
            const defaultTab = Object.keys(statusCounts).reduce((a, b) => 
              statusCounts[a] > statusCounts[b] ? a : b, "upcoming"
            );
            
            setActiveTab(defaultTab);
            setDisplayedTab(defaultTab);
          setInitialTabSet(true); // Mark that initial tab has been set - prevent future auto-switching
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
  }, [propBookingData, propCompletedOrders]);

  const countsByTab = useMemo(() => {
    // Count upcoming and cancelled from regular bookings
    const categorized = transformedBookings.reduce((acc, booking) => {
      const tabId = booking.statusTone === "upcoming" ? "upcoming" 
                 : "cancelled";
      acc[tabId] = (acc[tabId] || 0) + 1;
      return acc;
    }, {});
    
    // Use completedCount from API initially, but update to actual loaded orders count once fetched
    if (transformedCompletedBookings.length > 0) {
      categorized.completed = transformedCompletedBookings.length;
    } else {
      categorized.completed = completedCount || 0;
    }
    
    return tabs.reduce((acc, tab) => {
      acc[tab.id] = categorized[tab.id] || 0;
      return acc;
    }, {});
  }, [transformedBookings, transformedCompletedBookings, completedCount]);

  const bookingsForTab = useMemo(() => {
    // For completed tab, use completed/expired bookings
    if (displayedTab === "completed") {
      return transformedCompletedBookings;
    }
    
    // For upcoming and cancelled tabs, use regular bookings
    return transformedBookings.filter((booking) => {
      const tabId = booking.statusTone === "upcoming" ? "upcoming" 
                 : "cancelled";
      return tabId === displayedTab;
    });
  }, [transformedBookings, transformedCompletedBookings, displayedTab]);

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
    setCancelPreview(null);

    const isEventOrder = booking?.category === "EVENTS" || booking?.bookingData?.eventId != null;
    if (isEventOrder && booking?.orderId) {
      try {
        const preview = await getOrderCancelPreview(booking.orderId);
        console.log("🧾 Event cancel preview:", {
          orderId: booking.orderId,
          preview,
          booking,
        });
        setCancelPreview(preview);
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
    setCancelPreview(null);
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
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <header className={styles.head}>
          <div className={styles.heading}>
            <h1 className={cn("h2", styles.title)}>My bookings</h1>
          </div>
        </header>
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
              {bookingsForTab.map((booking) => (
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
