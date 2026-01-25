import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import cn from "classnames";
import styles from "./ViewDetails.module.sass";
import Icon from "../../components/Icon";
import { getBookingDetails } from "../../mocks/bookings";
import { getListing, getOrderDetails, getEventOrderDetails, getEventDetails, submitOrderReview } from "../../utils/api";
import Rating from "../../components/Rating";

// Helper function to format image URLs
const formatImageUrl = (url) => {
  if (!url) return "/images/content/card-pic-13.jpg";
  const raw = String(url).trim();
  if (!raw) return "/images/content/card-pic-13.jpg";
  
  // If already a full URL, return as is
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  
  // Relative path - return as is
  if (raw.startsWith("/")) {
    return raw;
  }

  // Azure blob storage path (e.g., "leads/Events/10/CoverPhoto/..." or an already-encoded "leads%2FEvents%2F...")
  // Keep any query string intact and ensure the path is safely encoded.
  const [pathPart, queryPart] = raw.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const asNonEmptyString = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// Determine payment status mapping - handle case-insensitive matching
const getPaymentStatus = (paymentStatus) => {
  if (!paymentStatus) return "Pending";
  
  // Normalize to uppercase for comparison
  const normalizedStatus = String(paymentStatus).toUpperCase().trim();
  
  // Map to display status
  const statusMap = {
    PENDING: "Pending",
    SUCCESS: "Success",
    SUCCESSFUL: "Success",
    COMPLETED: "Success",
    FAILED: "Failed",
    FAILURE: "Failed",
    CANCELLED: "Cancelled",
    CANCELED: "Cancelled",
    REFUNDED: "Refunded",
  };
  
  return statusMap[normalizedStatus] || "Pending";
};

// Check if payment has failed
const isPaymentFailed = (paymentStatus) => {
  if (!paymentStatus) return false;
  const normalizedStatus = String(paymentStatus).toUpperCase().trim();
  return normalizedStatus === "FAILED" || normalizedStatus === "FAILURE";
};

// Transform API booking data to component format
// eventData is used for EVENTS orders to get event details (images, title, location, etc.)
const transformBookingData = (apiBooking, listingData = null, eventData = null) => {
  // Determine if this is an event order
  const isEventOrder = apiBooking?.businessInterestCode === "EVENTS" || 
                       apiBooking?.eventId != null;

  const asText = (value) => {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  };

  const pickText = (...values) => {
    for (const v of values) {
      const t = asText(v);
      if (t) return t;
    }
    return null;
  };

  const customerObj =
    (apiBooking && typeof apiBooking === "object" &&
      (apiBooking.customer ||
        apiBooking.customerDetails ||
        apiBooking.guest ||
        apiBooking.guestDetails ||
        apiBooking.user ||
        apiBooking.userDetails ||
        apiBooking.contact)) ||
    null;

  const customerName = pickText(
    apiBooking?.customerName,
    apiBooking?.customerFullName,
    apiBooking?.guestName,
    apiBooking?.userName,
    apiBooking?.fullName,
    apiBooking?.name,
    [apiBooking?.firstName, apiBooking?.lastName].filter(Boolean).join(" "),
    [apiBooking?.customerFirstName, apiBooking?.customerLastName].filter(Boolean).join(" "),
    customerObj?.name,
    customerObj?.fullName,
    [customerObj?.firstName, customerObj?.lastName].filter(Boolean).join(" "),
    customerObj?.customerName,
    customerObj?.guestName
  );

  const customerPhone = pickText(
    apiBooking?.customerPhone,
    apiBooking?.phoneNumber,
    apiBooking?.phone,
    apiBooking?.mobile,
    apiBooking?.mobileNumber,
    apiBooking?.contactNumber,
    apiBooking?.customerMobile,
    customerObj?.phone,
    customerObj?.phoneNumber,
    customerObj?.mobile,
    customerObj?.mobileNumber,
    customerObj?.contactNumber
  );

  const customerEmail = pickText(
    apiBooking?.customerEmail,
    apiBooking?.email,
    apiBooking?.emailId,
    apiBooking?.emailAddress,
    apiBooking?.mailId,
    customerObj?.email,
    customerObj?.emailId,
    customerObj?.emailAddress,
    customerObj?.mailId
  );
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

  // Format time from "05:44:00" to "5:44 AM" format
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format currency amount
  const formatCurrency = (amount, currency = "INR") => {
    if (!amount) return "0.00";
    const numAmount = parseFloat(amount);
    if (currency === "INR") {
      return `₹${numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine status mapping - handle case-insensitive matching
  const getOrderStatus = (orderStatus) => {
    if (!orderStatus) return "Pending";
    
    // Normalize to uppercase for comparison
    const normalizedStatus = String(orderStatus).toUpperCase().trim();
    
    // Map to display status - keep PENDING as "Pending", CONFIRMED as "Confirmed"
  const statusMap = {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
      CANCELED: "Cancelled", // Handle alternative spelling
  };

    const mappedStatus = statusMap[normalizedStatus] || "Pending";
    
    // Log status mapping for debugging
    console.log("📊 Status mapping:", {
      originalOrderStatus: orderStatus,
      normalizedStatus: normalizedStatus,
      mappedStatus: mappedStatus,
    });
    
    return mappedStatus;
  };

  const status = getOrderStatus(apiBooking.orderStatus);
  
  // Also store the original orderStatus for reference
  const originalOrderStatus = apiBooking.orderStatus;

  // Get listing/event information - for EVENTS, prefer eventData and eventTitle
  const title = isEventOrder
    ? (eventData?.title || 
       eventData?.eventTitle ||
       apiBooking?.eventTitle || 
       apiBooking?.eventDetails?.eventTitle || 
       "Event Booking")
    : (listingData?.title || apiBooking?.listingTitle || "Booking");
  
  // Extract location from listing data or event data
  let location = { 
    address: "TBD", 
    city: "TBD", 
    country: "TBD", 
    directionsUrl: "#",
    latitude: null,
    longitude: null
  };
  
  // For event orders, try to get location from event data first
  if (isEventOrder && eventData) {
    // Check for coordinates first (most accurate)
    if (eventData.venueLatitude && eventData.venueLongitude) {
      location.latitude = parseFloat(eventData.venueLatitude);
      location.longitude = parseFloat(eventData.venueLongitude);
    } else if (eventData.latitude && eventData.longitude) {
      location.latitude = parseFloat(eventData.latitude);
      location.longitude = parseFloat(eventData.longitude);
    }
    
    // Check various possible location fields from event data
    if (eventData.venueFullAddress) {
      location.address = eventData.venueFullAddress;
    } else if (eventData.venueName) {
      location.address = eventData.venueName;
    } else if (eventData.address) {
      location.address = eventData.address;
    }
    
    if (eventData.venueDistrict) {
      location.city = eventData.venueDistrict;
    } else if (eventData.city) {
      location.city = eventData.city;
    }
    
    if (eventData.venueState) {
      location.country = eventData.venueState;
    } else if (eventData.state) {
      location.country = eventData.state;
    } else if (eventData.country) {
      location.country = eventData.country;
    }
    
    // Build directions URL - prefer coordinates if available
    if (location.latitude && location.longitude) {
      location.directionsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    } else {
      const locationQuery = [location.address, location.city, location.country]
        .filter(part => part && part !== "TBD")
        .join(", ");
      
      if (locationQuery && locationQuery !== "TBD, TBD, TBD") {
        location.directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(locationQuery)}`;
      }
    }
  }
  
  // Try to get location from listing data (for non-event orders or as fallback)
  if (!isEventOrder && listingData) {
    // Check for coordinates first (most accurate)
    if (listingData.meetingLatitude && listingData.meetingLongitude) {
      location.latitude = parseFloat(listingData.meetingLatitude);
      location.longitude = parseFloat(listingData.meetingLongitude);
    } else if (listingData.latitude && listingData.longitude) {
      location.latitude = parseFloat(listingData.latitude);
      location.longitude = parseFloat(listingData.longitude);
    }
    
    // Check various possible location fields
    if (listingData.address) {
      location.address = listingData.address;
    }
    if (listingData.city) {
      location.city = listingData.city;
    }
    if (listingData.state) {
      location.country = listingData.state;
    } else if (listingData.country) {
      location.country = listingData.country;
    }
    
    // If there's a location string, try to parse it
    if (listingData.location && typeof listingData.location === 'string') {
      const locationParts = listingData.location.split(',').map(s => s.trim());
      if (locationParts.length >= 2) {
        location.city = locationParts[0];
        location.country = locationParts.slice(1).join(', ');
      } else {
        location.city = listingData.location;
      }
    }
    
    // Build directions URL - prefer coordinates if available
    if (location.latitude && location.longitude) {
      location.directionsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    } else {
      const locationQuery = [location.address, location.city, location.country]
        .filter(part => part && part !== "TBD")
        .join(", ");
      
      if (locationQuery && locationQuery !== "TBD, TBD, TBD") {
        location.directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(locationQuery)}`;
      }
    }
  }
  
  // Fallback: if no location data, use a default or try to construct from available data
  if (location.city === "TBD" && location.country === "TBD" && !location.latitude) {
    // Try to get any location info from the listing
    if (listingData?.meetingPoint) {
      location.address = listingData.meetingPoint;
    }
    if (listingData?.meetingInstructions) {
      // Try to extract location from meeting instructions
      const instructions = listingData.meetingInstructions;
      if (instructions.includes(',')) {
        const parts = instructions.split(',').map(s => s.trim());
        location.address = parts[0];
        if (parts.length > 1) {
          location.city = parts[1];
        }
      } else {
        location.address = instructions;
      }
    }
    
    // Rebuild directions URL with updated data
    if (!location.latitude) {
      const locationQuery = [location.address, location.city, location.country]
        .filter(part => part && part !== "TBD")
        .join(", ");
      
      if (locationQuery && locationQuery !== "TBD, TBD, TBD") {
        location.directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(locationQuery)}`;
      }
    }
  }
  
  // Get cover photo - for EVENTS prefer event data, then listing data, then booking data
  let coverPhotoUrl;
  
  if (isEventOrder && eventData) {
    // Align with EventProduct: prefer canonical cover fields from /events/{id}
    // (some embedded event-details payloads contain non-canonical image fields).
    coverPhotoUrl =
      asNonEmptyString(eventData?.coverImage) ||
      asNonEmptyString(eventData?.coverImageUrl) ||
      asNonEmptyString(eventData?.coverPhotoUrl) ||
      asNonEmptyString(eventData?.imageUrl) ||
      asNonEmptyString(eventData?.bannerUrl) ||
      asNonEmptyString(eventData?.thumbnailUrl) ||
      // Fallback: other event APIs may use these keys
      asNonEmptyString(eventData?.eventCoverImageUrl) ||
      asNonEmptyString(eventData?.eventCoverPhotoUrl) ||
      asNonEmptyString(eventData?.eventCoverUrl) ||
      asNonEmptyString(eventData?.bannerImageUrl) ||
      asNonEmptyString(eventData?.coverPhoto) ||
      asNonEmptyString(eventData?.coverImage) ||
      asNonEmptyString(apiBooking?.eventDetails?.eventCoverImageUrl) ||
      asNonEmptyString(apiBooking?.coverPhotoUrl) ||
      "/images/content/card-pic-13.jpg";
  } else {
    coverPhotoUrl = listingData?.coverPhotoUrl || 
                    apiBooking?.listingCoverPhoto ||
                    apiBooking?.coverPhotoUrl ||
                    "/images/content/card-pic-13.jpg";
  }
  
  // Format the image URL to ensure it's a valid full URL
  coverPhotoUrl = formatImageUrl(coverPhotoUrl);

  // Build pricing breakdown
  const pricing = {
    basePrice: formatCurrency(apiBooking.basePrice, apiBooking.currency),
    addonsTotal: apiBooking.addonsTotal ? formatCurrency(apiBooking.addonsTotal, apiBooking.currency) : null,
    subtotal: apiBooking.subtotal ? formatCurrency(apiBooking.subtotal, apiBooking.currency) : null,
    discountAmount: apiBooking.discountAmount ? formatCurrency(apiBooking.discountAmount, apiBooking.currency) : null,
    taxAmount: apiBooking.taxAmount ? formatCurrency(apiBooking.taxAmount, apiBooking.currency) : null,
    platformFee: apiBooking.platformFee ? formatCurrency(apiBooking.platformFee, apiBooking.currency) : null,
    total: formatCurrency(apiBooking.totalPrice, apiBooking.currency),
  };

  // Build addons list
  const addonsList = Array.isArray(apiBooking.addons) 
    ? apiBooking.addons.map(addon => ({
        name: addon.addonName || "Addon",
        price: formatCurrency(addon.addonPrice, apiBooking.currency),
        quantity: addon.quantity || 1,
        total: formatCurrency((parseFloat(addon.addonPrice || 0) * (addon.quantity || 1)), apiBooking.currency),
      }))
    : [];

  // Build discounts list
  const discountsList = Array.isArray(apiBooking.discounts)
    ? apiBooking.discounts.map(discount => ({
        name: discount.discountName || "Discount",
        percentage: discount.appliedPercentage || 0,
        amount: formatCurrency(discount.discountAmount, apiBooking.currency),
        sponsor: discount.sponsor || "PLATFORM",
      }))
    : [];

  const result = {
    id: `bk-${apiBooking.orderId}`,
    orderId: apiBooking.orderId,
    bookingId: `LKP-${apiBooking.orderId}`,
    title: title,
    status: status,
    startDate: formatDate(apiBooking.bookingDate),
    endDate: formatDate(apiBooking.bookingDate),
    bookingDate: formatDate(apiBooking.bookingDate),
    bookingTime: formatTime(apiBooking.bookingTime),
    startTime: null, // Will be populated from slot data
    endTime: null, // Will be populated from slot data
    guestCount: apiBooking.numberOfGuests || 0,
    location: location,
    bannerImage: {
      src: coverPhotoUrl,
      srcSet: coverPhotoUrl,
      alt: title,
    },
    guest: {
      name: customerName || "Guest",
      phone: customerPhone || "",
      email: customerEmail || "",
    },
    pricing: pricing,
    paymentMethod: apiBooking.paymentMethod || apiBooking.payment_method || null,
    paymentStatus: apiBooking.paymentStatus || "PENDING",
    specialRequests: apiBooking.specialRequests,
    addons: addonsList,
    discounts: discountsList,
    notes: {
      cancellationPolicy: listingData?.cancellationPolicyText ? [listingData.cancellationPolicyText] : [],
      hostInstructions: [],
      requirements: [],
    },
    // Keep original data for reference
    originalData: apiBooking,
    listingData: listingData,
    eventData: eventData,
    isEventOrder: isEventOrder,
    // Store original orderStatus for proper status handling
    originalOrderStatus: originalOrderStatus,
    // Store statusTone for consistency with Bookings page
    statusTone: status.toLowerCase(),
  };

  // Extract guest requirements from listing data
  if (listingData?.guestRequirements && Array.isArray(listingData.guestRequirements)) {
    // Find "Rules and Policies" (settingId: 17) for Host Instructions
    const rulesAndPolicies = listingData.guestRequirements.find(
      (gr) => gr?.setting?.settingId === 17 && gr?.setting?.isActive
    );
    
    if (rulesAndPolicies && Array.isArray(rulesAndPolicies.questions)) {
      result.notes.hostInstructions = rulesAndPolicies.questions
        .filter((q) => q?.question?.isActive)
        .map((q) => q.question.title);
    }

    // Find "What's to Bring" (settingId: 18) for Guest Requirements
    const whatsToBring = listingData.guestRequirements.find(
      (gr) => gr?.setting?.settingId === 18 && gr?.setting?.isActive
    );
    
    if (whatsToBring && Array.isArray(whatsToBring.questions)) {
      result.notes.requirements = whatsToBring.questions
        .filter((q) => q?.question?.isActive)
        .map((q) => q.question.title);
    }
  }

  return result;
};

const ViewDetails = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("id") || "bk-up-001";
  const bookingType = params.get("type"); // "event" for event orders

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Loading booking with bookingId:", bookingId);
      
      try {
        // Extract orderId from bookingId (e.g., "bk-57" -> 57)
        // Try multiple formats: "bk-57", "57", etc.
        let orderId = null;
        
        // Format 1: "bk-57"
        const orderIdMatch = bookingId.match(/bk-(\d+)/);
        if (orderIdMatch) {
          orderId = parseInt(orderIdMatch[1], 10);
        } else {
          // Format 2: Direct number "57"
          const directMatch = bookingId.match(/^(\d+)$/);
          if (directMatch) {
            orderId = parseInt(directMatch[1], 10);
          }
        }
        
        console.log("🔍 Extracted orderId:", orderId);
        
        if (!orderId || isNaN(orderId)) {
          const errorMsg = `Invalid booking ID format: "${bookingId}". Expected format: "bk-57" or "57"`;
          console.error("❌", errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }
        
        let apiBookingData = null;
        let orderResponse = null;
        let slotDetails = null;

        // Fetch order details directly from API
        // Use event-specific API if type=event
        try {
          if (bookingType === "event") {
            console.log("📦 Fetching EVENT order details for orderId:", orderId);
            orderResponse = await getEventOrderDetails(orderId);
            console.log("✅ Event order details fetched from API:", orderResponse);
          } else {
            console.log("📦 Fetching regular order details for orderId:", orderId);
            orderResponse = await getOrderDetails(orderId);
            console.log("✅ Order details fetched from API:", orderResponse);
          }
          
          // The response structure can be:
          // Option 1: { order: {...}, addons: [], guestAnswers: [], history: [] }
          // Option 2: Direct order object
          if (orderResponse) {
            if (orderResponse.order) {
              // Wrapped in order property
              apiBookingData = orderResponse.order;
              console.log("✅ Order data extracted from order property:", apiBookingData);
            } else if (orderResponse.orderId) {
              // Direct order object
              apiBookingData = orderResponse;
              console.log("✅ Order data is direct object:", apiBookingData);
            }
            
            if (apiBookingData) {
              console.log("✅ Order data extracted:", apiBookingData);
              console.log("✅ Order addons:", orderResponse.addons || apiBookingData.addons);
              console.log("✅ Order history:", orderResponse.history);
            }
          }
        } catch (apiErr) {
          console.error("❌ Failed to fetch order details from API:", apiErr);
          console.error("Error details:", {
            message: apiErr.message,
            response: apiErr.response?.data,
            status: apiErr.response?.status,
            statusText: apiErr.response?.statusText,
            url: apiErr.config?.url,
          });
          
          // Extract meaningful error message
          let errorMessage = "Failed to fetch order details";
          if (apiErr.response?.data?.error) {
            errorMessage = apiErr.response.data.error;
          } else if (apiErr.response?.data?.message) {
            errorMessage = apiErr.response.data.message;
          } else if (apiErr.message) {
            errorMessage = apiErr.message;
          }
          
          if (apiErr.response?.status === 404) {
            errorMessage = `Order not found (ID: ${orderId})`;
          } else if (apiErr.response?.status === 401 || apiErr.response?.status === 403) {
            errorMessage = "Unauthorized. Please log in again.";
          } else if (apiErr.response?.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
          
          setError(errorMessage);
        }

        // Check if we have data, if not show error
        if (!apiBookingData) {
          console.error("❌ No booking data found for orderId:", orderId);
          // Only fallback to mock if we're in development/testing
          const mockBooking = getBookingDetails(bookingId);
          if (mockBooking) {
            console.warn("⚠️ Using mock booking data as fallback");
            setBooking(mockBooking);
            setLoading(false);
            return;
          }
          
          // If no mock data and no API data, show error
          if (!error) {
            setError(`Booking not found for order ID: ${orderId}`);
          }
          setLoading(false);
          return;
        }

        // Use time slot information from order response
        // The order response includes: timeSlotName, timeSlotStartTime, timeSlotEndTime, timeSlotMaxSeats
        if (apiBookingData.timeSlotStartTime || apiBookingData.timeSlotEndTime) {
          slotDetails = {
            slotName: apiBookingData.timeSlotName,
            startTime: apiBookingData.timeSlotStartTime,
            endTime: apiBookingData.timeSlotEndTime,
            maxSeats: apiBookingData.timeSlotMaxSeats,
          };
          console.log("✅ Using time slot from order data:", slotDetails);
        }

        // Merge addons from orderResponse if available (they might be in response root or in order.addons)
        if (orderResponse && Array.isArray(orderResponse.addons) && orderResponse.addons.length > 0) {
          // Addons might already be in apiBookingData.addons, but use response if different
          if (!apiBookingData.addons || apiBookingData.addons.length === 0) {
            apiBookingData.addons = orderResponse.addons;
          }
        }

        // Determine if this is an event order
        const isEventOrder = bookingType === "event" || 
                             apiBookingData?.businessInterestCode === "EVENTS" || 
                             apiBookingData?.eventId != null;

        // For event orders, prefer using event info embedded in the event-details API response
        // so the page can render without additional calls.
        let eventData = null;
        if (isEventOrder) {
          const embeddedEvent =
            orderResponse?.event ||
            orderResponse?.eventDetails ||
            orderResponse?.data?.event ||
            orderResponse?.data?.eventDetails ||
            apiBookingData?.event ||
            apiBookingData?.eventDetails ||
            null;

          if (embeddedEvent && typeof embeddedEvent === "object") {
            eventData = embeddedEvent;
            console.log("✅ Using embedded event details from event-details API response:", eventData);
          }
        }

        // If embedded event is missing key fields (title/image), enrich using public event API
        // (GET /api/events/{id} via getEventDetails)
        if (isEventOrder) {
          const hasTitle = !!(eventData?.title || eventData?.eventTitle || apiBookingData?.eventTitle);
          const hasImage = !!(
            eventData?.coverImage ||
            eventData?.coverImageUrl ||
            eventData?.bannerUrl ||
            eventData?.bannerImageUrl ||
            eventData?.eventCoverImageUrl ||
            eventData?.eventCoverPhotoUrl
          );
          const eventIdForDetails = apiBookingData?.eventId || eventData?.eventId || eventData?.id;

          // Always enrich from /events/{id} when possible to ensure the cover image/title match
          // what the event API considers the canonical values.
          if (eventIdForDetails) {
            try {
              if (!hasTitle || !hasImage) {
                console.log(`📦 Enriching event details for eventId: ${eventIdForDetails}`);
              } else {
                console.log(`📦 Refreshing event details for eventId: ${eventIdForDetails} (override image/title if different)`);
              }
              const enriched = await getEventDetails(eventIdForDetails);
              const embedded = eventData || {};
              eventData = {
                ...embedded,
                ...enriched,
                // Ensure enriched image fields win even if embedded already had a different image
                eventCoverImageUrl: enriched?.eventCoverImageUrl ?? embedded?.eventCoverImageUrl,
                eventCoverPhotoUrl: enriched?.eventCoverPhotoUrl ?? embedded?.eventCoverPhotoUrl,
                coverImageUrl: enriched?.coverImageUrl ?? embedded?.coverImageUrl,
                coverPhotoUrl: enriched?.coverPhotoUrl ?? embedded?.coverPhotoUrl,
                bannerImageUrl: enriched?.bannerImageUrl ?? embedded?.bannerImageUrl,
                title: enriched?.title ?? embedded?.title,
                eventTitle: enriched?.eventTitle ?? embedded?.eventTitle,
              };
              console.log("✅ Event details enriched from /events/{id}:", eventData);
            } catch (eventError) {
              console.warn(`⚠️ Failed to enrich event details for eventId ${eventIdForDetails}:`, eventError.message);
            }
          }
        }

        // Fallback: Fetch event details by eventId if not embedded
        if (isEventOrder && !eventData && apiBookingData.eventId) {
          try {
            console.log(`📦 Fetching event details for eventId: ${apiBookingData.eventId}`);
            eventData = await getEventDetails(apiBookingData.eventId);
            console.log(`✅ Fetched event details for eventId ${apiBookingData.eventId}:`, eventData);
          } catch (eventError) {
            console.warn(`⚠️ Failed to fetch event details for eventId ${apiBookingData.eventId}:`, eventError.message);
            // Create a fallback eventData object from order fields
            eventData = {
              title: apiBookingData.eventTitle || "Event Booking",
              eventTitle: apiBookingData.eventTitle || "Event Booking",
              eventCoverImageUrl: apiBookingData.eventDetails?.eventCoverImageUrl || null,
              venueFullAddress: apiBookingData.eventDetails?.venueFullAddress || null,
              venueName: apiBookingData.eventDetails?.venueName || null,
              venueDistrict: apiBookingData.eventDetails?.venueDistrict || null,
              venueState: apiBookingData.eventDetails?.venueState || null,
            };
          }
        }

        // Fetch listing data if listingId is available (for non-event orders)
        let listingData = null;
        if (!isEventOrder && apiBookingData.listingId) {
          try {
            listingData = await getListing(apiBookingData.listingId);
            console.log(`✅ Fetched listing ${apiBookingData.listingId} for order details`);
          } catch (error) {
            console.warn(`⚠️ Failed to fetch listing data for order ${apiBookingData.orderId}:`, error.message);
            // Create a fallback listingData object from order fields
            listingData = {
              title: apiBookingData.listingTitle || apiBookingData.title || "Booking",
              description: apiBookingData.listingDescription || apiBookingData.description || "",
              location: apiBookingData.listingLocation || apiBookingData.location || "",
              address: apiBookingData.listingAddress || apiBookingData.address || "",
              latitude: apiBookingData.listingLatitude ? parseFloat(apiBookingData.listingLatitude) : 
                        (apiBookingData.latitude ? parseFloat(apiBookingData.latitude) : null),
              longitude: apiBookingData.listingLongitude ? parseFloat(apiBookingData.listingLongitude) : 
                         (apiBookingData.longitude ? parseFloat(apiBookingData.longitude) : null),
              meetingLatitude: apiBookingData.listingLatitude ? parseFloat(apiBookingData.listingLatitude) : 
                              (apiBookingData.meetingLatitude ? parseFloat(apiBookingData.meetingLatitude) : null),
              meetingLongitude: apiBookingData.listingLongitude ? parseFloat(apiBookingData.listingLongitude) : 
                               (apiBookingData.meetingLongitude ? parseFloat(apiBookingData.meetingLongitude) : null),
              category: apiBookingData.listingCategory || apiBookingData.category || "Experience",
              categoryName: apiBookingData.listingCategory || apiBookingData.category || "Experience",
              maxGuests: apiBookingData.listingMaxGuests || apiBookingData.maxGuests || null,
              status: apiBookingData.listingStatus || apiBookingData.status || "",
              // Use cover photo from order as fallback
              coverPhotoUrl: apiBookingData.listingCoverPhoto || apiBookingData.coverPhotoUrl || "/images/content/card-pic-13.jpg",
            };
          }
        } else if (!isEventOrder) {
          // Create listingData from order fields if no listingId
          listingData = {
            title: apiBookingData.listingTitle || apiBookingData.title || "Booking",
            description: apiBookingData.listingDescription || apiBookingData.description || "",
            location: apiBookingData.listingLocation || apiBookingData.location || "",
            address: apiBookingData.listingAddress || apiBookingData.address || "",
            latitude: apiBookingData.listingLatitude ? parseFloat(apiBookingData.listingLatitude) : null,
            longitude: apiBookingData.listingLongitude ? parseFloat(apiBookingData.listingLongitude) : null,
            meetingLatitude: apiBookingData.listingLatitude ? parseFloat(apiBookingData.listingLatitude) : null,
            meetingLongitude: apiBookingData.listingLongitude ? parseFloat(apiBookingData.listingLongitude) : null,
            category: apiBookingData.listingCategory || apiBookingData.category || "Experience",
            categoryName: apiBookingData.listingCategory || apiBookingData.category || "Experience",
            maxGuests: apiBookingData.listingMaxGuests || apiBookingData.maxGuests || null,
            status: apiBookingData.listingStatus || apiBookingData.status || "",
            coverPhotoUrl: apiBookingData.listingCoverPhoto || apiBookingData.coverPhotoUrl || "/images/content/card-pic-13.jpg",
          };
        }
        
        console.log("✅ Using data:", isEventOrder ? "eventData" : (listingData ? "listingData from API" : "listingData from order fields"));

        // Transform the booking data
        let transformed;
        try {
          const mergedApiBookingData =
            orderResponse && typeof orderResponse === "object" && orderResponse.order
              ? { ...orderResponse, ...orderResponse.order }
              : apiBookingData;

          transformed = transformBookingData(mergedApiBookingData, listingData, eventData);
        console.log("✅ Transformed booking data:", transformed);
        console.log("✅ Original API booking data paymentMethod:", apiBookingData.paymentMethod);
        console.log("✅ Transformed paymentMethod:", transformed.paymentMethod);
        
          // Add slot time information from order data
          if (apiBookingData.timeSlotStartTime || apiBookingData.timeSlotEndTime) {
          const formatSlotTime = (timeString) => {
            if (!timeString) return "";
            // Handle both "HH:mm" and "HH:mm:ss" formats
            const timePart = timeString.split(" ")[0]; // Remove any date part
            const [hours, minutes] = timePart.split(":");
            const hour = parseInt(hours, 10);
            if (isNaN(hour)) return "";
            const ampm = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
          };
          
            if (apiBookingData.timeSlotStartTime) {
              transformed.startTime = formatSlotTime(apiBookingData.timeSlotStartTime);
              console.log("✅ Set start time from order:", apiBookingData.timeSlotStartTime, "->", transformed.startTime);
          }
            
            if (apiBookingData.timeSlotEndTime) {
              transformed.endTime = formatSlotTime(apiBookingData.timeSlotEndTime);
              console.log("✅ Set end time from order:", apiBookingData.timeSlotEndTime, "->", transformed.endTime);
          }
          }
          
          // Verify transformation was successful
          if (!transformed || !transformed.id) {
            throw new Error("Transformation failed - missing required fields");
        }
        
        setBooking(transformed);
          console.log("✅ Booking set successfully");
        } catch (transformErr) {
          console.error("❌ Error transforming booking data:", transformErr);
          setError(`Failed to process booking data: ${transformErr.message}`);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error loading booking:", err);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, bookingType]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const getInitialTab = () => {
    if (!booking) return "cancellation";
    if (booking.notes.cancellationPolicy) return "cancellation";
    if (booking.notes.hostInstructions) return "host";
    if (booking.notes.requirements) return "requirements";
    return "cancellation";
  };
  
  const [activeNotesTab, setActiveNotesTab] = useState(getInitialTab);

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (reviewRating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    
    if (!booking || !booking.orderId) {
      setReviewError("Invalid booking information");
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewError(null);
    
    try {
      // Get listingId and customerId from booking data
      const listingId = booking.originalData?.listingId || booking.listingData?.listingId || null;
      
      // Get customerId from booking data, or try localStorage as fallback
      let customerId = booking.originalData?.customerId || null;
      
      if (!customerId && typeof window !== "undefined") {
        // Try to get customerId from localStorage (various possible keys)
        try {
          const userDataStr = localStorage.getItem("userData");
          const customerDataStr = localStorage.getItem("customerData");
          
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            customerId = userData.customerId || userData.id || userData.userId || null;
          }
          
          if (!customerId && customerDataStr) {
            const customerData = JSON.parse(customerDataStr);
            customerId = customerData.customerId || customerData.id || customerData.userId || null;
          }
        } catch (e) {
          console.warn("Could not parse user data from localStorage:", e);
        }
      }
      
      console.log("📤 Submitting review with data:", {
        orderId: booking.orderId,
        rating: reviewRating,
        comment: reviewText,
        listingId: listingId,
        customerId: customerId,
      });
      
      await submitOrderReview(booking.orderId, {
        rating: reviewRating,
        comment: reviewText,
        listingId: listingId,
        customerId: customerId,
      });
      
      setReviewSubmitted(true);
      setReviewText("");
      setReviewRating(0);
      console.log("✅ Review submitted successfully");
    } catch (err) {
      console.error("❌ Error submitting review:", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          "Failed to submit review. Please try again.";
      setReviewError(errorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("section", styles.section)}>
        <div className={cn("container", styles.container)}>
          <div className={styles.notFound}>
            <h2>Loading booking details...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={cn("section", styles.section)}>
        <div className={cn("container", styles.container)}>
          <div className={styles.notFound}>
            <h2>{error || "Booking not found"}</h2>
            <p style={{ marginTop: "1rem", color: "#666" }}>
              Please check the console for more details.
            </p>
            <Link to="/bookings" className="button" style={{ marginTop: "1rem" }}>
              Back to My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const notesTabs = [
    { id: "cancellation", label: "Cancellation Policy" },
    { id: "host", label: "Host Instructions" },
    { id: "requirements", label: "Guest Requirements" },
  ];

  const getNotesContent = () => {
    if (activeNotesTab === "cancellation" && booking.notes.cancellationPolicy) {
      return booking.notes.cancellationPolicy;
    }
    if (activeNotesTab === "host" && booking.notes.hostInstructions) {
      return booking.notes.hostInstructions;
    }
    if (activeNotesTab === "requirements" && booking.notes.requirements) {
      return booking.notes.requirements;
    }
    return [];
  };

  const getStatusClass = (status) => {
    if (!status) return styles.statusDefault;
    
    // Get original orderStatus first for accurate status class
    const originalStatus = booking?.originalData?.orderStatus ? String(booking.originalData.orderStatus).toUpperCase().trim() : "";
    
    // Check original orderStatus first
    if (originalStatus === "PENDING") {
      return styles.statusPending; // Orange background for pending
    }
    if (originalStatus === "CONFIRMED") {
      return styles.statusConfirmed; // Use confirmed style
    }
    if (originalStatus === "COMPLETED") {
      return styles.statusCompleted;
    }
    if (originalStatus === "CANCELLED" || originalStatus === "CANCELED") {
      return styles.statusCancelled;
    }
    
    // Fallback to status parameter
    const statusLower = String(status).toLowerCase().trim();
    if (statusLower === "pending") {
      return styles.statusPending; // Orange background for pending
    }
    if (statusLower === "confirmed") {
      return styles.statusConfirmed;
    }
    if (statusLower === "upcoming") {
      return styles.statusUpcoming;
    }
    if (statusLower === "completed") {
      return styles.statusCompleted;
    }
    if (statusLower === "cancelled" || statusLower === "canceled") {
      return styles.statusCancelled;
    }
    return styles.statusDefault;
  };

  const getActionButtons = () => {
    // Get status from multiple sources for reliability
    const status = booking.status?.toLowerCase() || 
                   booking.statusTone || 
                   (booking.originalData?.orderStatus ? String(booking.originalData.orderStatus).toLowerCase() : "");
    
    if (status === "upcoming" || status === "pending" || status === "confirmed") {
      return [
        { label: "Message Host", variant: "primary" },
        { label: "Download Receipt", variant: "secondary" },
        { label: "Cancel Booking", variant: "secondary" },
      ];
    } else if (status === "completed") {
      return [
        { label: "Message Host", variant: "primary" },
        { label: "Download Receipt", variant: "secondary" },
        { label: "Leave Review", variant: "secondary" },
      ];
    } else if (status === "cancelled" || status === "canceled") {
      return [
        { label: "Explore Alternatives", variant: "primary" },
        { label: "View Cancellation", variant: "secondary" },
        { label: "Contact Support", variant: "secondary" },
      ];
    } else {
      // Default actions
      return [
        { label: "Message Host", variant: "primary" },
        { label: "Download Receipt", variant: "secondary" },
        { label: "Contact Support", variant: "secondary" },
      ];
    }
  };

  const getButtonClassName = (variant) => {
    if (variant === "primary") {
      return cn("button", "button-small");
    }
    return cn("button-stroke", "button-small");
  };

  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <header className={styles.header}>
          <h1 className={cn("h2", styles.title)}>{booking.title}</h1>
        </header>

        <div className={styles.banner}>
          <img
            src={booking.bannerImage.src}
            alt={booking.bannerImage.alt}
            onLoad={() => {
              console.log("✅ Banner image loaded:", booking.bannerImage.src);
            }}
            onError={(e) => {
              console.warn("⚠️ Banner image failed to load:", booking.bannerImage.src);
              e.currentTarget.src = "/images/content/card-pic-13.jpg";
              e.currentTarget.removeAttribute("srcset");
            }}
          />
        </div>

        <div className={cn(styles.card, styles.summaryCard)}>
          <h2 className={styles.cardTitle}>Summary Card</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Booking ID</div>
              <div className={styles.summaryValue}>{booking.bookingId}</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Booking Date</div>
              <div className={styles.summaryValue}>{booking.bookingDate}</div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Booking Time</div>
              <div className={styles.summaryValue}>
                {booking.startTime && booking.endTime ? (
                  <>
                    {booking.startTime} - {booking.endTime}
                  </>
                ) : booking.bookingTime ? (
                  booking.bookingTime
                ) : (
                  "Not specified"
                )}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Guests</div>
              <div className={styles.summaryValue}>
                {booking.guestCount} {booking.guestCount === 1 ? "guest" : "guests"}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Status</div>
              <div className={styles.summaryValue}>
                <span className={cn(styles.statusBadge, getStatusClass(booking.status || booking.statusTone || booking.originalData?.orderStatus))}>
                  {(() => {
                    // Get status from original orderStatus first, then fallback to mapped status
                    const originalStatus = booking.originalData?.orderStatus;
                    if (originalStatus) {
                      const normalized = String(originalStatus).toUpperCase().trim();
                      // Map original status to display text
                      if (normalized === "PENDING") return "Pending";
                      if (normalized === "CONFIRMED") return "Confirmed";
                      if (normalized === "COMPLETED") return "Completed";
                      if (normalized === "CANCELLED" || normalized === "CANCELED") return "Cancelled";
                    }
                    
                    // Fallback to booking.status if originalStatus not available
                    return booking.status || "Pending";
                  })()}
                </span>
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Payment Method</div>
              <div className={styles.summaryValue}>
                {(() => {
                  const paymentMethod = booking.paymentMethod || 
                                       booking.originalData?.paymentMethod || 
                                       booking.originalData?.payment_method ||
                                       null;
                  console.log("✅ Displaying payment method:", {
                    bookingPaymentMethod: booking.paymentMethod,
                    originalPaymentMethod: booking.originalData?.paymentMethod,
                    originalPayment_method: booking.originalData?.payment_method,
                    final: paymentMethod
                  });
                  return paymentMethod || "Not specified";
                })()}
              </div>
            </div>
          </div>
          <div className={styles.guestInfoSection}>
            <h3 className={styles.guestSectionTitle}>Guest Information</h3>
            <div className={styles.guestInfo}>
              <div className={styles.guestItem}>
                <div className={styles.guestLabel}>Name</div>
                <div className={styles.guestValue}>{booking.guest.name}</div>
              </div>
              <div className={styles.guestItem}>
                <div className={styles.guestLabel}>Phone</div>
                <div className={styles.guestValue}>{booking.guest.phone}</div>
              </div>
              <div className={styles.guestItem}>
                <div className={styles.guestLabel}>Email</div>
                <div className={styles.guestValue}>{booking.guest.email}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.locationPaymentGrid}>
          <div className={cn(styles.card, styles.locationCard)}>
            <h2 className={styles.cardTitle}>Location Details</h2>
            <div className={styles.locationContent}>
              <div className={styles.address}>
                <Icon name="marker" size="20" />
                <div>
                  {booking.location.address && booking.location.address !== "TBD" && (
                  <div className={styles.addressLine}>
                    {booking.location.address}
                  </div>
                  )}
                  <div className={styles.addressCity}>
                    {[booking.location.city, booking.location.country]
                      .filter(part => part && part !== "TBD")
                      .join(", ") || "Location information not available"}
                  </div>
                </div>
              </div>
              {(() => {
                // Check if we have coordinates (most accurate)
                const hasCoordinates = booking.location.latitude && booking.location.longitude;
                
                // Build location query for map - prefer coordinates
                let mapUrl = "";
                let hasValidLocation = false;
                
                if (hasCoordinates) {
                  // Use coordinates for precise location
                  mapUrl = `https://www.google.com/maps?q=${booking.location.latitude},${booking.location.longitude}&z=14&output=embed`;
                  hasValidLocation = true;
                } else {
                  // Fallback to address string
                  const locationParts = [
                    booking.location.address,
                    booking.location.city,
                    booking.location.country
                  ].filter(part => part && part !== "TBD");
                  
                  const locationQuery = locationParts.join(", ");
                  hasValidLocation = locationQuery && locationQuery.length > 0;
                  
                  if (hasValidLocation) {
                    mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(locationQuery)}&z=14&output=embed`;
                  }
                }
                
                return hasValidLocation ? (
              <div className={styles.mapContainer}>
                <iframe
                      src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className={styles.map}
                  title="Location map"
                />
                    {booking.location.directionsUrl && booking.location.directionsUrl !== "#" && (
                <a
                  href={booking.location.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.directionsLink}
                >
                  <Icon name="route" size="16" />
                  <span>Get Directions</span>
                </a>
                    )}
                  </div>
                ) : (
                  <div className={styles.mapContainer}>
                    <div className={styles.mapPlaceholder}>
                      <Icon name="marker" size="48" />
                      <p>Location information not available</p>
                      <p className={styles.mapPlaceholderSubtext}>
                        Please contact the host for location details
                      </p>
              </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className={cn(styles.card, styles.paymentCard)}>
            <h2 className={styles.cardTitle}>Payment Details</h2>
            <div className={styles.paymentContent}>
              <div className={styles.paymentRow}>
                <span>Base Price</span>
                <span>{booking.pricing.basePrice}</span>
              </div>
              {booking.pricing.addonsTotal && (
                <div className={styles.paymentRow}>
                  <span>Addons Total</span>
                  <span>{booking.pricing.addonsTotal}</span>
                </div>
              )}
              {booking.pricing.subtotal && (
                <div className={styles.paymentRow}>
                  <span>Subtotal</span>
                  <span>{booking.pricing.subtotal}</span>
                </div>
              )}
              {booking.pricing.discountAmount && (
                <div className={styles.paymentRow} style={{ color: '#0097B2' }}>
                  <span>Discount</span>
                  <span>-{booking.pricing.discountAmount}</span>
                </div>
              )}
              {booking.pricing.taxAmount && parseFloat(booking.originalData?.taxAmount || 0) > 0 && (
                <div className={styles.paymentRow}>
                  <span>Taxes</span>
                  <span>{booking.pricing.taxAmount}</span>
                </div>
              )}
              {booking.pricing.platformFee && parseFloat(booking.originalData?.platformFee || 0) > 0 && (
                <div className={styles.paymentRow}>
                  <span>Platform Fee</span>
                  <span>{booking.pricing.platformFee}</span>
                </div>
              )}
              <div className={cn(styles.paymentRow, styles.paymentTotal)}>
                <span>Total Paid</span>
                <span>{booking.pricing.total}</span>
              </div>
              <div className={styles.paymentMethod}>
                <Icon name="credit-card" size="16" />
                <span>Payment Status: </span>
                <span className={cn(styles.paymentStatusBadge, {
                  [styles.paymentStatusFailed]: isPaymentFailed(booking.paymentStatus),
                  [styles.paymentStatusPending]: getPaymentStatus(booking.paymentStatus) === "Pending",
                  [styles.paymentStatusSuccess]: getPaymentStatus(booking.paymentStatus) === "Success",
                })}>
                  {getPaymentStatus(booking.paymentStatus)}
                </span>
              </div>
              {isPaymentFailed(booking.paymentStatus) && (
                <div className={styles.paymentFailedMessage}>
                  <Icon name="alert-circle" size="16" />
                  <span>Payment failed. Please retry to complete your booking.</span>
                </div>
              )}
              {booking.originalData?.razorpayOrderId && (
                <div className={styles.paymentMethod} style={{ marginTop: '8px', fontSize: '12px', color: '#777E90' }}>
                  <span>Order ID: {booking.originalData.razorpayOrderId}</span>
              </div>
              )}
              {isPaymentFailed(booking.paymentStatus) && (
                <div className={styles.paymentActions}>
                  <button
                    type="button"
                    className={cn("button", "button-small", styles.retryPaymentButton)}
                    onClick={() => {
                      // TODO: Implement retry payment functionality
                      console.log("Retry payment for order:", booking.orderId);
                      alert("Payment retry functionality will be implemented here");
                    }}
                  >
                    <Icon name="refresh" size="16" />
                    <span>Retry Payment</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Addons Section */}
        {booking.addons && booking.addons.length > 0 && (
          <div className={cn(styles.card, styles.addonsCard)}>
            <h2 className={styles.cardTitle}>Addons</h2>
            <div className={styles.addonsList}>
              {booking.addons.map((addon, index) => (
                <div key={index} className={styles.addonItem}>
                  <div className={styles.addonName}>{addon.name}</div>
                  <div className={styles.addonDetails}>
                    <span>Price: {addon.price}</span>
                    <span>Quantity: {addon.quantity}</span>
                    <span className={styles.addonTotal}>Total: {addon.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discounts Section */}
        {booking.discounts && booking.discounts.length > 0 && (
          <div className={cn(styles.card, styles.discountsCard)}>
            <h2 className={styles.cardTitle}>Discounts Applied</h2>
            <div className={styles.discountsList}>
              {booking.discounts.map((discount, index) => (
                <div key={index} className={styles.discountItem}>
                  <div className={styles.discountName}>
                    {discount.name}
                    {discount.percentage > 0 && (
                      <span className={styles.discountPercentage}> ({discount.percentage}%)</span>
                    )}
                  </div>
                  <div className={styles.discountAmount}>{discount.amount}</div>
                  <div className={styles.discountSponsor}>Sponsored by: {discount.sponsor}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests Section */}
        {booking.specialRequests && (
          <div className={cn(styles.card, styles.specialRequestsCard)}>
            <h2 className={styles.cardTitle}>Special Requests</h2>
            <div className={styles.specialRequestsContent}>
              <p>{booking.specialRequests}</p>
            </div>
          </div>
        )}

        <div className={cn(styles.card, styles.notesCard)}>
          <h2 className={styles.cardTitle}>Important Notes & Terms</h2>
          <div className={styles.notesTabs}>
            {notesTabs.map((tab) => {
              const hasContent = 
                (tab.id === "cancellation" && booking.notes.cancellationPolicy) ||
                (tab.id === "host" && booking.notes.hostInstructions) ||
                (tab.id === "requirements" && booking.notes.requirements);
              
              if (!hasContent) return null;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(styles.notesTab, {
                    [styles.notesTabActive]: activeNotesTab === tab.id,
                  })}
                  onClick={() => setActiveNotesTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className={styles.notesContent}>
            <ul className={styles.noteList}>
              {getNotesContent().map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Review Section - Only show for completed orders */}
        {(booking.originalData?.orderStatus && String(booking.originalData.orderStatus).toUpperCase() === "COMPLETED") && (
          <div className={cn(styles.card, styles.reviewCard)}>
            <h2 className={styles.cardTitle}>Leave a Review</h2>
            {reviewSubmitted ? (
              <div className={styles.reviewSuccess}>
                <Icon name="check" size="24" />
                <p>Thank you! Your review has been submitted successfully.</p>
              </div>
            ) : (
              <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
                <div className={styles.reviewFormHead}>
                  <div className={styles.reviewFormText}>
                    Share your experience with <span>{booking.title}</span>
                  </div>
                  <Rating
                    className={styles.reviewRating}
                    rating={reviewRating}
                    onChange={setReviewRating}
                    readonly={false}
                  />
                </div>
                <div className={styles.reviewFormField}>
                  <textarea
                    className={styles.reviewInput}
                    value={reviewText}
                    onChange={(e) => {
                      setReviewText(e.target.value);
                      setReviewError(null);
                    }}
                    name="review"
                    placeholder="Share your thoughts about your experience..."
                    rows={4}
                    required
                    disabled={isSubmittingReview}
                  />
                  {reviewError && (
                    <div className={styles.reviewError}>{reviewError}</div>
                  )}
                </div>
                <div className={styles.reviewFormActions}>
                  <button
                    type="submit"
                    className={cn("button-small", styles.reviewButton)}
                    disabled={isSubmittingReview || reviewRating === 0}
                  >
                    {isSubmittingReview ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Review</span>
                        <Icon name="arrow-next" size="14" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className={cn(styles.card, styles.actionCard)}>
          <h3 className={styles.actionTitle}>Actions</h3>
          <div className={styles.actionButtons}>
            {getActionButtons().map((action, index) => (
              <button
                key={index}
                type="button"
                className={getButtonClassName(action.variant)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDetails;

