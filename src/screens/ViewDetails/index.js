import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import cn from "classnames";
import styles from "./ViewDetails.module.sass";
import Icon from "../../components/Icon";
import { getBookingDetails } from "../../mocks/bookings";
import { getListing, getOrderDetails, getEventOrderDetails, getEventDetails, submitOrderReview, getStayDetails, cancelOrder, cancelEventOrder, getEligibleBookings, getListingReviews, getEventReviews, getStayReviews, getOrderRefundDetails, getOrderCancelPreview, validateExperienceOrEventOrder, validateStayOrder, getCustomerProfile, getCancellationReasons } from "../../utils/api";
import { getInitializePaymentErrorMessage, initializePendingOrderPayment, isExpiredHold } from "../../utils/paymentSession";
import Rating from "../../components/Rating";
import Modal from "../../components/Modal";
import html2pdf from "html2pdf.js";
import LoadingSkeleton from "../../components/LoadingSkeleton";

// Helper 
const formatMoney = (amount, currency = "INR") => {
  if (amount == null) return "0.00";
  const value = Number(amount);
  if (!Number.isFinite(value)) return "0.00";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper to format refund status
const formatRefundStatus = (status) => {
  if (!status) return "N/A";
  const s = String(status).toUpperCase();
  if (s === "COMPLETED" || s === "SUCCESS") return "Refunded";
  if (s === "PENDING" || s === "INITIATED") return "Processing";
  if (s === "FAILED") return "Failed";
  return status;
};

// Helper function to format image URLs
const formatImageUrl = (url) => {
  if (!url) return "";
  const raw = String(url).trim();
  if (!raw) return "";

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

const toTitleCase = (value) => {
  const text = asNonEmptyString(value);
  if (!text) return null;

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatPersonName = (value) => {
  const text = asNonEmptyString(value);
  if (!text) return null;

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (part.length === 1) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
};

const formatPaymentMethod = (value) => {
  const text = asNonEmptyString(value);
  if (!text) return null;

  if (text.trim().toLowerCase() === "upi") {
    return "UPI";
  }

  return toTitleCase(text);
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
const transformBookingData = (apiBooking, listingData = null, eventData = null, stayData = null, reviewData = null, profileData = null) => {
  // Determine if this is an event order
  const isEventOrder = apiBooking?.businessInterestCode === "EVENTS" ||
    apiBooking?.eventId != null;

  // Extract rating and review count
  const rating = reviewData?.ratingSummary?.averageRating || 0;
  const reviewCount = reviewData?.ratingSummary?.totalReviews || 0;

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

  // Use profile data if it belongs to the same customer to ensure sync
  const useProfileInfo = profileData &&
    (profileData.customerId === apiBooking.customerId ||
      profileData.customerId === apiBooking.customer?.customerId ||
      !apiBooking.customerId); // Fallback if customerId is missing in booking but it's the user's booking

  const customerName = useProfileInfo
    ? [profileData.firstName, profileData.lastName].filter(Boolean).join(" ")
    : pickText(
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
  const formattedCustomerName = formatPersonName(customerName);

  const customerPhone = useProfileInfo
    ? (profileData.phone || profileData.mobile || "")
    : pickText(
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

  const customerEmail = useProfileInfo
    ? (profileData.email || "")
    : pickText(
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
    if (Number.isNaN(date.getTime())) return "";
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

    const isEpoch = !isNaN(Number(timeString)) && String(timeString).trim().length > 0;
    const isIsoOrFullDate = typeof timeString === 'string' && (timeString.includes("T") || timeString.match(/[a-zA-Z]{3}.*\d{4}/));

    if (isEpoch || isIsoOrFullDate) {
      const date = new Date(isEpoch ? Number(timeString) : timeString);
      if (!Number.isNaN(date.getTime())) {
        const hour = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      }
    }

    let timePart = String(timeString);
    if (timePart.includes(" ")) {
      timePart = timePart.split(" ")[1] || timePart;
    }
    const parts = timePart.split(":");
    if (parts.length < 2) return timeString;

    const hour = parseInt(parts[0], 10);
    if (isNaN(hour)) return timeString;

    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${parts[1]} ${ampm}`;
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
      PENDING_CONFIRMATION: "Pending Confirmation",
      CONFIRMED: "Confirmed",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      CANCELED: "Cancelled", // Handle alternative spelling
      REJECTED: "Rejected",
      DECLINED: "Rejected",
    };

    const mappedStatus = statusMap[normalizedStatus] || "Pending";

    // Log status mapping for debugging
    //console.log("📊 Status mapping:", {
    //   originalOrderStatus: orderStatus,
    //    normalizedStatus: normalizedStatus,
    //   mappedStatus: mappedStatus,
    // });

    return mappedStatus;
  };

  let status = getOrderStatus(apiBooking.orderStatus);

  // If the backend says Upcoming (PENDING/CONFIRMED) but the booking date and time have
  // already passed, show the booking in Completed instead for consistency with Bookings list.
  if (status === "Pending" || status === "Confirmed") {
    const bookingDateStr =
      apiBooking.checkOutDate ||
      apiBooking.checkInDate ||
      apiBooking.bookingDate ||
      apiBooking.eventDate ||
      apiBooking.eventDetails?.eventDate ||
      null;

    if (bookingDateStr) {
      const deadline = new Date(bookingDateStr);
      const endTimeStr = apiBooking.timeSlotEndTime || apiBooking.checkOutTime || apiBooking.endTime || apiBooking.bookingTime;

      if (endTimeStr && typeof endTimeStr === 'string' && endTimeStr.includes(':')) {
        const parts = endTimeStr.split(':').map(Number);
        deadline.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
      } else {
        deadline.setHours(23, 59, 59, 999);
      }

      if (deadline < new Date()) {
        status = "Completed";
      }
    }
  }

  // Also store the original orderStatus for reference
  const originalOrderStatus = apiBooking.orderStatus;

  // Get listing/event information - for EVENTS, prefer eventData and eventTitle
  const title = isEventOrder
    ? (eventData?.title ||
      eventData?.eventTitle ||
      apiBooking?.eventTitle ||
      apiBooking?.eventDetails?.eventTitle ||
      "Event Booking")
    : (stayData?.propertyName ||
      stayData?.title ||
      stayData?.name ||
      apiBooking?.stayOrderRooms?.[0]?.propertyName ||
      listingData?.title ||
      apiBooking?.listingTitle ||
      apiBooking?.stayTitle ||
      "Booking");

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

    // Map city/district
    location.city = pickText(
      eventData.venueDistrict,
      eventData.venueCity,
      eventData.city,
      eventData.district
    ) || "TBD";

    // Map country/state
    location.country = pickText(
      eventData.venueCountry,
      eventData.country,
      eventData.venueState,
      eventData.state
    ) || "TBD";

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

    // Map address
    location.address = pickText(
      listingData.meetingAddress,
      listingData.meetingPoint,
      listingData.address,
      listingData.fullAddress
    ) || "TBD";

    // Map city
    location.city = pickText(
      listingData.meetingCity,
      listingData.city,
      listingData.meetingDistrict,
      listingData.district
    ) || "TBD";

    // Map country
    location.country = pickText(
      listingData.meetingCountry,
      listingData.country,
      listingData.meetingState,
      listingData.state
    ) || "TBD";

    // If still TBD city/country, try to parse the 'location' field if it exists
    if ((location.city === "TBD" || location.country === "TBD") && listingData.location && typeof listingData.location === 'string') {
      const locationParts = listingData.location.split(',').map(s => s.trim());
      if (locationParts.length >= 2) {
        if (location.city === "TBD") location.city = locationParts[0];
        if (location.country === "TBD") location.country = locationParts.slice(1).join(', ');
      } else if (location.city === "TBD") {
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

  // Try to get location from stay data
  if (!isEventOrder && stayData) {
    if (stayData.latitude && stayData.longitude) {
      location.latitude = parseFloat(stayData.latitude);
      location.longitude = parseFloat(stayData.longitude);
    }

    // Map address
    location.address = pickText(
      stayData.address,
      stayData.fullAddress,
      stayData.location,
      location.address
    ) || "TBD";

    // Map city
    location.city = pickText(
      stayData.city,
      stayData.district,
      location.city
    ) || "TBD";

    // Map country
    location.country = pickText(
      stayData.country,
      stayData.state,
      location.country
    ) || "TBD";

    // Build directions URL
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

  // Final fallback: if no location data, use listing.location or meetingInstructions
  if (location.city === "TBD" && location.country === "TBD" && !location.latitude) {
    if (listingData?.location && typeof listingData.location === 'string') {
      const lp = listingData.location.split(',').map(s => s.trim());
      location.city = lp[0] || "TBD";
      if (lp.length > 1) location.country = lp.slice(1).join(", ");
    }

    if (listingData?.meetingInstructions && location.address === "TBD") {
      const instructions = listingData.meetingInstructions;
      if (instructions.length < 100) { // Only use if it looks like a short address
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
      "";
  } else {
    let stayCoverPhoto = null;
    if (stayData) {
      stayCoverPhoto =
        stayData.coverImageUrl ||
        stayData.coverPhotoUrl ||
        (Array.isArray(stayData.listingMedia) && stayData.listingMedia[0]
          ? (stayData.listingMedia[0].url || stayData.listingMedia[0].blobName || stayData.listingMedia[0].fileUrl)
          : null) ||
        (Array.isArray(stayData.media) && stayData.media[0]
          ? (stayData.media[0].url || stayData.media[0].blobName || stayData.media[0].fileUrl)
          : null) ||
        (Array.isArray(stayData.images) ? stayData.images[0] : null) ||
        (Array.isArray(stayData.propertyImages) ? stayData.propertyImages[0] : null);
    }

    coverPhotoUrl = listingData?.coverPhotoUrl ||
      stayCoverPhoto ||
      apiBooking?.listingCoverPhoto ||
      apiBooking?.coverPhotoUrl ||
      "";
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
    startDate: formatDate(apiBooking.checkInDate || apiBooking.eventDate || apiBooking.bookingDate),
    endDate: formatDate(apiBooking.checkOutDate || apiBooking.eventDate || apiBooking.bookingDate),
    bookingDate: formatDate(apiBooking.orderDate || apiBooking.createdAt || apiBooking.bookingDate),
    bookingTime: formatTime(apiBooking.orderDate || apiBooking.createdAt || apiBooking.bookingTime),
    reservationDate: formatDate(apiBooking.checkInDate || apiBooking.eventDate || (apiBooking.timeSlotStartTime && (apiBooking.timeSlotStartTime.includes('T') || apiBooking.timeSlotStartTime.includes(' ')) ? apiBooking.timeSlotStartTime.split(/[T ]/)[0] : null) || apiBooking.bookingDate),
    startTime: formatTime(apiBooking.checkInTime || apiBooking.originalData?.checkInTime || stayData?.checkInTime), // Will be overridden by slot data if present
    endTime: formatTime(apiBooking.checkOutTime || apiBooking.originalData?.checkOutTime || stayData?.checkOutTime), // Will be overridden by slot data if present
    guestCount: apiBooking.numberOfGuests || 0,
    adultsCount: Math.max(
      apiBooking.guests?.adults || apiBooking.originalData?.guests?.adults || apiBooking.originalData?.pricing?.adultsCount || apiBooking.adultsCount || apiBooking.adultCount || apiBooking.adults || 0,
      Array.isArray(apiBooking.stayOrderRooms) ? apiBooking.stayOrderRooms.reduce((sum, r) => sum + (r.adults || r.numberOfAdults || r.noOfAdults || r.adultCount || 0) + (r.extraAdults || r.extraAdult || 0), 0) : 0
    ),
    childrenCount: Math.max(
      apiBooking.guests?.children || apiBooking.originalData?.guests?.children || apiBooking.originalData?.pricing?.childrenCount || apiBooking.childrenCount || apiBooking.childCount || apiBooking.children || 0,
      Array.isArray(apiBooking.stayOrderRooms) ? apiBooking.stayOrderRooms.reduce((sum, r) => sum + (r.children || r.numberOfChildren || r.noOfChildren || r.childCount || 0) + (r.extraChildren || r.extraChild || 0), 0) : 0
    ),
    location: location,
    bannerImage: {
      src: coverPhotoUrl,
      srcSet: coverPhotoUrl,
      alt: title,
    },
    guest: {
      name: formattedCustomerName || customerName || "Guest",
      phone: customerPhone || "",
      email: customerEmail || "",
    },
    pricing: pricing,
    paymentMethod: formatPaymentMethod(apiBooking.paymentMethod || apiBooking.payment_method) || null,
    paymentStatus: apiBooking.paymentStatus || "PENDING",
    specialRequests: apiBooking.specialRequests,
    addons: addonsList,
    discounts: discountsList,
    notes: {
      cancellationPolicy: normalizePolicyTextList(
        listingData?.cancellationPolicySummary,
        listingData?.cancellationPolicyText,
        listingData?.cancellationPolicy,
        eventData?.cancellationPolicySummary,
        eventData?.cancellationPolicyText,
        eventData?.cancellationPolicy,
        stayData?.cancellationPolicySummary,
        stayData?.cancellationPolicyTemplate,
        stayData?.cancellationPolicyText,
        stayData?.cancellationPolicy
      ),
      hostInstructions: [],
      requirements: [],
    },
    // Keep original data for reference
    originalData: apiBooking,
    listingData: listingData,
    eventData: eventData,
    stayData: stayData,
    isEventOrder: isEventOrder,
    // Store original orderStatus for proper status handling
    originalOrderStatus: originalOrderStatus,
    // Store statusTone for consistency with Bookings page
    statusTone: status.toLowerCase(),
  };

  // Removed guest requirements and other host instructions from listingData.guestRequirements
  // as per user request to only show Meeting Instructions.

  // Ensure meeting instructions are also included in host notes
  if (listingData?.meetingInstructions) {
    const meetingNote = `Meeting Instructions: ${listingData.meetingInstructions}`;
    if (!result.notes.hostInstructions.includes(meetingNote)) {
      result.notes.hostInstructions.unshift(meetingNote);
    }
  }

  // Extract stay amenities/policies if available
  if (stayData) {
    const stayCheckInMethod = pickText(stayData.checkInMethod);
    const stayCheckInInstruction = pickText(stayData.checkInInstructions);

    if (stayCheckInMethod) {
      result.notes.hostInstructions.push(`Check-in Method: ${stayCheckInMethod}`);
    }

    if (stayCheckInInstruction) {
      result.notes.hostInstructions.push(`Check-in Instructions: ${stayCheckInInstruction}`);
    }

    if (stayData.houseRules && !result.notes.hostInstructions.length) {
      result.notes.hostInstructions = Array.isArray(stayData.houseRules)
        ? stayData.houseRules
        : [stayData.houseRules];
    }
    if (!result.notes.cancellationPolicy.length) {
      result.notes.cancellationPolicy = normalizePolicyTextList(
        stayData.cancellationPolicySummary,
        stayData.cancellationPolicyTemplate,
        stayData.cancellationPolicyText,
        stayData.cancellationPolicy
      );
    }
  }

  return result;
};

const formatCancelPreviewMoney = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCancelPreviewDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatRefundPolicyUsed = (percentage) => {
  const numericValue = Number(percentage);
  if (!Number.isFinite(numericValue)) return "N/A";
  if (numericValue <= 0) return "No refund";
  return `${Math.round(numericValue)}% refund`;
};

const RECEIPT_SUPPORT_EMAIL = "support@littleknownplanet.com";
const RECEIPT_SUPPORT_PHONE = "Available on request";

const getReceiptDateLabel = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getReceiptNumericAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return 0;
  const normalized = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatReceiptMoney = (value, currency = "INR") => {
  const amount = getReceiptNumericAmount(value);
  const currencyCode = currency || "INR";
  return new Intl.NumberFormat(currencyCode === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getReceiptPercent = (amount, base) => {
  const numericAmount = getReceiptNumericAmount(amount);
  const numericBase = getReceiptNumericAmount(base);
  if (!numericAmount || !numericBase) return null;
  return Math.round((Math.abs(numericAmount) / numericBase) * 100);
};

const numberToWordsBelowThousand = (value) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (value < 20) return ones[value];
  if (value < 100) {
    const ten = tens[Math.floor(value / 10)];
    const remainder = value % 10;
    return remainder ? `${ten} ${ones[remainder]}` : ten;
  }

  const hundred = `${ones[Math.floor(value / 100)]} Hundred`;
  const remainder = value % 100;
  return remainder ? `${hundred} ${numberToWordsBelowThousand(remainder)}` : hundred;
};

const numberToWordsIndian = (value) => {
  const numericValue = Math.floor(Math.abs(Number(value) || 0));
  if (!numericValue) return "Zero";

  const segments = [
    { size: 10000000, label: "Crore" },
    { size: 100000, label: "Lakh" },
    { size: 1000, label: "Thousand" },
  ];

  let remaining = numericValue;
  const words = [];

  segments.forEach(({ size, label }) => {
    if (remaining >= size) {
      const segmentValue = Math.floor(remaining / size);
      words.push(`${numberToWordsBelowThousand(segmentValue)} ${label}`);
      remaining %= size;
    }
  });

  if (remaining > 0) {
    words.push(numberToWordsBelowThousand(remaining));
  }

  return words.join(" ").trim();
};

const formatAmountInWords = (value) => {
  const numericValue = getReceiptNumericAmount(value);
  const rupees = Math.floor(numericValue);
  const paise = Math.round((numericValue - rupees) * 100);
  const rupeesText = `${numberToWordsIndian(rupees)} Rupees`;
  if (!paise) return `${rupeesText} Only`;
  return `${rupeesText} and ${numberToWordsIndian(paise)} Paise Only`;
};

const normalizePolicyTextList = (...values) => {
  const results = [];

  const pushValue = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(pushValue);
      return;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) results.push(trimmed);
      return;
    }

    if (typeof value === "object") {
      const objectText =
        value.cancellationPolicySummary ||
        value.cancellationPolicyTemplate ||
        value.cancellationPolicyText ||
        value.cancellationPolicy ||
        value.policySummary ||
        value.policyText ||
        value.text ||
        value.description ||
        value.value ||
        value.title ||
        value.name ||
        value.policyRule ||
        value.propertyRule ||
        value.rule ||
        value.content;

      if (typeof objectText === "string" && objectText.trim()) {
        results.push(objectText.trim());
      }
    }
  };

  values.forEach(pushValue);
  return [...new Set(results)];
};

const getPublicCancellationPolicyTexts = ({ booking, refundDetails, cancelPreview }) => {
  // First, check if there's a specifically applied policy from a cancellation action
  const appliedPolicy = cancelPreview?.policyUsed || 
    cancelPreview?.policyApplied || 
    refundDetails?.appliedRefundPolicy || 
    refundDetails?.appliedRefundPolicyName || 
    refundDetails?.appliedPolicy || 
    refundDetails?.refundPolicyName || 
    refundDetails?.policyName || 
    refundDetails?.policyLabel || 
    refundDetails?.refundPolicy || 
    refundDetails?.refundPolicyText;

  if (appliedPolicy && typeof appliedPolicy === "string" && appliedPolicy.trim()) {
    return [appliedPolicy.trim()];
  }

  // Next, if there's a specifically determined policy in the normalized notes, use just the primary one
  if (booking?.notes?.cancellationPolicy && booking.notes.cancellationPolicy.length > 0) {
    return [booking.notes.cancellationPolicy[0]];
  }

  // Fallback to checking the property data, picking the most specific summary first
  const listingData = booking?.listingData || booking?.originalData?.listingData || null;
  const stayData = booking?.stayData || booking?.originalData?.stayData || null;
  const eventData = booking?.eventData || booking?.originalData?.eventData || null;

  const policies = normalizePolicyTextList(
    stayData?.cancellationPolicySummary || stayData?.cancellationPolicyTemplate || stayData?.cancellationPolicyText || stayData?.cancellationPolicy,
    eventData?.cancellationPolicySummary || eventData?.cancellationPolicyText || eventData?.cancellationPolicy,
    listingData?.cancellationPolicySummary || listingData?.cancellationPolicyText || listingData?.cancellationPolicy
  );

  return policies.length > 0 ? [policies[0]] : [];
};

const ViewDetails = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("id") || "bk-up-001";
  const bookingType = params.get("type"); // "event" for event orders
  const sourceTab = String(location?.state?.sourceTab || "").toLowerCase();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [orderIdsEligibleForReview, setOrderIdsEligibleForReview] = useState(new Set());

  // Cancellation state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [pendingCancellation, setPendingCancellation] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Receipt state
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [refundDetails, setRefundDetails] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [confirmCancelModalVisible, setConfirmCancelModalVisible] = useState(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationModalData, setValidationModalData] = useState({
    title: "",
    message: "",
    code: "",
    details: "",
  });
  const [hasAutopaid, setHasAutopaid] = useState(false);
  const [priceChangedData, setPriceChangedData] = useState(null);
  const [confirmPayModalVisible, setConfirmPayModalVisible] = useState(false);

  // Review modal state (for Leave Review button in action card)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewModalRating, setReviewModalRating] = useState(0);
  const [reviewModalComment, setReviewModalComment] = useState("");
  const [reviewModalError, setReviewModalError] = useState(null);
  const [isSubmittingReviewModal, setIsSubmittingReviewModal] = useState(false);

  // isCompletedOrder: true if backend status is COMPLETED, OR if the booking has been date-overridden to "Completed"
  const isCompletedOrder =
    String(booking?.originalData?.orderStatus || "").toUpperCase() === "COMPLETED" ||
    booking?.status === "Completed" ||
    booking?.statusTone === "completed";
  const canLeaveReview = booking?.orderId != null && orderIdsEligibleForReview.has(Number(booking.orderId));

  const receiptViewModel = useMemo(() => {
    if (!booking) return null;

    const originalData = booking.originalData || {};
    const currency = originalData.currency || "INR";
    const invoiceSourceDate =
      originalData.createdAt ||
      originalData.orderDate ||
      originalData.bookingDate ||
      originalData.checkInDate ||
      booking.bookingDate ||
      booking.startDate;

    const invoiceDateLabel = getReceiptDateLabel(invoiceSourceDate);
    const isPending = booking.status === "Pending" || String(originalData.orderStatus || "").toUpperCase() === "PENDING";
    const totalAmount = booking.pricing?.total || originalData.totalPrice || 0;
    const baseAmount = booking.pricing?.basePrice || originalData.basePrice || 0;
    const subtotalAmount = booking.pricing?.subtotal || originalData.subtotal || baseAmount;
    const discountAmount = booking.pricing?.discountAmount || originalData.discountAmount || 0;
    const taxAmount = booking.pricing?.taxAmount || originalData.taxAmount || 0;
    const listingReference =
      originalData.listingId ||
      originalData.stayId ||
      originalData.eventId ||
      booking.listingData?.listingId ||
      booking.stayData?.stayId ||
      booking.orderId;
    const propertyTitle =
      booking.title ||
      booking.stayData?.propertyName ||
      booking.listingData?.title ||
      booking.eventData?.title ||
      "Booking";
    const propertySubtitle =
      originalData.roomType ||
      originalData.stayOrderRooms?.[0]?.roomTypeName ||
      originalData.stayOrderRooms?.[0]?.propertyName ||
      booking.listingData?.categoryName ||
      booking.stayData?.propertyType ||
      booking.eventData?.venueName ||
      "Confirmed booking";
    const guestSummary = (() => {
      const adults = Math.max(booking.adultsCount || 0, booking.guestCount - (booking.childrenCount || 0));
      const children = booking.childrenCount || 0;
      if (adults > 0 || children > 0) {
        const total = adults + children;
        const adultText = adults > 0 ? `${adults} Adult${adults > 1 ? "s" : ""}` : "";
        const childText = children > 0 ? `${children} Child${children !== 1 ? "ren" : ""}` : "";
        if (adults > 0 && children > 0) return `${total} Guest${total !== 1 ? "s" : ""} (${adultText}, ${childText})`;
        return `${total} Guest${total !== 1 ? "s" : ""} (${adultText || childText})`;
      }
      return `${booking.guestCount || 0} Guest${booking.guestCount === 1 ? "" : "s"}`;
    })();
    const scheduleLabel = booking.startTime && booking.endTime
      ? `${booking.reservationDate || booking.startDate} | ${booking.startTime} - ${booking.endTime}`
      : `${booking.reservationDate || booking.startDate}${booking.bookingTime ? ` | ${booking.bookingTime}` : ""}`;
    const discountPercent = getReceiptPercent(discountAmount, subtotalAmount);
    const taxBaseAmount = subtotalAmount - (getReceiptNumericAmount(discountAmount) || 0);
    const taxPercent = getReceiptPercent(taxAmount, taxBaseAmount > 0 ? taxBaseAmount : subtotalAmount);
    const companyWebsite =
      (typeof window !== "undefined" && window.location?.origin) ||
      "https://www.littleknownplanet.com";
    const companyEmail = RECEIPT_SUPPORT_EMAIL;
    const companyPhone = RECEIPT_SUPPORT_PHONE;
    const publicCancellationPolicies = getPublicCancellationPolicyTexts({ booking, refundDetails, cancelPreview });
    const receiptRows = [
      {
        label: `Base price (${formatReceiptMoney(baseAmount, currency)}${booking.guestCount ? ` x ${booking.guestCount} guest${booking.guestCount > 1 ? "s" : ""}` : ""})`,
        value: formatReceiptMoney(baseAmount, currency),
      },
      ...(booking.addons || []).map((addon) => ({
        label: `${addon.name} (x${addon.quantity || 1})`,
        value: addon.total || formatReceiptMoney(addon.price, currency),
      })),
      {
        label: "Total",
        value: formatReceiptMoney(subtotalAmount, currency),
      },
      ...(getReceiptNumericAmount(discountAmount) > 0 ? [{
        label: `Discount`,
        value: `- ${formatReceiptMoney(discountAmount, currency)}`,
        isNegative: true,
      }] : []),
      ...(getReceiptNumericAmount(taxAmount) > 0 ? [{
        label: `Taxes`,
        value: formatReceiptMoney(taxAmount, currency),
      }] : []),
      {
        label: isPending ? "Amount Payable" : "Total Paid",
        value: formatReceiptMoney(totalAmount, currency),
        isTotal: true,
      },
    ];

    return {
      companyWebsite,
      companyEmail,
      companyPhone,
      invoiceId: `INV: ${String(booking.orderId || "").padStart(6, "0")}`,
      invoiceDateLabel,
      dueDateLabel: isPending ? invoiceDateLabel : "Paid on Receipt",
      paymentTermsLabel: isPending
        ? "Due on Receipt"
        : `Paid${booking.paymentMethod ? ` via ${booking.paymentMethod}` : ""}`,
      billTo: {
        name: booking.guest?.name || "Guest",
        phone: booking.guest?.phone || "Phone unavailable",
        email: booking.guest?.email || "Email unavailable",
      },
      property: {
        title: propertyTitle,
        line1: propertySubtitle,
        line2: [booking.location?.address, booking.location?.city].filter(Boolean).join(", ") || "Location unavailable",
        line3: booking.location?.country || "",
        badge: `Listing ID: LKP-${listingReference}`,
      },
      scheduleLabel,
      guestSummary,
      rows: receiptRows,
      totalAmountLabel: formatReceiptMoney(totalAmount, currency),
      totalAmountWords: formatAmountInWords(totalAmount),
      cancellationPolicies: publicCancellationPolicies.length
        ? publicCancellationPolicies
        : ["Cancellation policy will follow the booking confirmation and partner policy."],
      requiredDetails: [
        `Invoice number: ${String(booking.orderId || "").padStart(6, "0")}`,
        `Guest details: ${booking.guest?.name || "Guest"}${booking.guest?.email ? `, ${booking.guest.email}` : ""}`,
        `Property / listing: ${propertyTitle}`,
        `Booking schedule: ${scheduleLabel}`,
        `Guest count: ${guestSummary}`,
        `Payment summary: ${formatReceiptMoney(totalAmount, currency)}${booking.paymentMethod ? ` via ${booking.paymentMethod}` : ""}`,
        `Receipt breakdown: base fare, add-ons, discount, taxes, total`,
        `Cancellation policy and support contacts`,
      ],
    };
  }, [booking, cancelPreview, refundDetails]);

  const isPastStayCheckInTime = () => {
    if (!booking) return false;

    // Only apply to Stays
    const businessInterestCode = String(booking?.originalData?.businessInterestCode || "").toUpperCase();
    const isStayOrder = businessInterestCode === "STAYS" ||
      booking?.originalData?.stayId != null ||
      (booking?.originalData?.stayOrderRooms && booking?.originalData?.stayOrderRooms.length > 0) ||
      booking?.stayData != null;

    if (!isStayOrder) return false;

    // Check if already cancelled or completed
    const status = booking.status?.toLowerCase() ||
      booking.statusTone ||
      (booking.originalData?.orderStatus ? String(booking.originalData.orderStatus).toLowerCase() : "");

    if (status === "cancelled" || status === "canceled" || status === "completed") {
      return false;
    }

    const checkInDateStr =
      booking?.originalData?.checkInDate ||
      booking?.originalData?.bookingDate ||
      booking?.stayData?.checkInDate;

    if (!checkInDateStr) return false;

    const checkInDatetime = new Date(checkInDateStr);

    const checkInTimeStr =
      booking?.originalData?.checkInTime ||
      booking?.originalData?.bookingTime ||
      booking?.stayData?.checkInTime ||
      "14:00:00";

    if (checkInTimeStr && typeof checkInTimeStr === 'string' && checkInTimeStr.includes(':')) {
      const parts = checkInTimeStr.split(':').map(Number);
      checkInDatetime.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
    } else {
      checkInDatetime.setHours(14, 0, 0, 0);
    }

    return new Date() >= checkInDatetime;
  };

  const isPastStayCheckOutTime = () => {
    if (!booking) return false;

    // Only apply to Stays
    const businessInterestCode = String(booking?.originalData?.businessInterestCode || "").toUpperCase();
    const isStayOrder = businessInterestCode === "STAYS" ||
      booking?.originalData?.stayId != null ||
      (booking?.originalData?.stayOrderRooms && booking?.originalData?.stayOrderRooms.length > 0) ||
      booking?.stayData != null;

    if (!isStayOrder) return true; // If not a stay, we don't restrict by stay rules

    const checkOutDateStr =
      booking?.originalData?.checkOutDate ||
      booking?.originalData?.endDate ||
      booking?.stayData?.checkOutDate;

    if (!checkOutDateStr) return true; // If no check out date, allow it

    const checkOutDatetime = new Date(checkOutDateStr);

    const checkOutTimeStr =
      booking?.originalData?.checkOutTime ||
      booking?.originalData?.endTime ||
      booking?.stayData?.checkOutTime ||
      "11:00:00";

    if (checkOutTimeStr && typeof checkOutTimeStr === 'string' && checkOutTimeStr.includes(':')) {
      const parts = checkOutTimeStr.split(':').map(Number);
      checkOutDatetime.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
    } else {
      checkOutDatetime.setHours(11, 0, 0, 0);
    }

    return new Date() >= checkOutDatetime;
  };

  const handleCancelBookingClick = async () => {
    if (isPastStayCheckInTime()) {
      return;
    }
    setPendingCancellation(null);
    setCancelModalVisible(true);
    setCancelReason("");
    setSelectedReason("");
    setCancelError(null);
    setCancelPreviewLoading(Boolean(booking?.orderId));

    if (!booking?.orderId) {
      setCancelPreviewLoading(false);
      return;
    }

    try {
      const preview = await getOrderCancelPreview(booking.orderId);
      setCancelPreview(preview && typeof preview === "object" ? preview : null);
    } catch (err) {
      console.warn("⚠️ Failed to fetch cancel preview:", err?.message || err);
      setCancelPreview(null);
    } finally {
      setCancelPreviewLoading(false);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelModalVisible(false);
    setCancelReason("");
    setSelectedReason("");
    setPendingCancellation(null);
    setCancelError(null);
    setCancelPreviewLoading(false);
    setConfirmCancelModalVisible(false);
  };

  const getFriendlyCancellationError = (error) => {
    const status = Number(error?.response?.status);
    const message = String(
      error?.response?.data?.reason ||
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      ""
    );
    const normalized = message.toLowerCase();
    const isNoCancellationPolicy =
      normalized.includes("cancellation not allowed") ||
      normalized.includes("no cancellation policy") ||
      normalized.includes("cancellation policy not defined") ||
      normalized.includes("cancel is not allowed");

    if (status === 400 && isNoCancellationPolicy) {
      return "No cancellation available.";
    }

    return (
      error?.response?.data?.message ||
      error?.response?.data?.reason ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to cancel booking. Please try again."
    );
  };

  const executeCancelBooking = async () => {
    const reason = pendingCancellation?.reason || cancelReason;

    let finalReason = reason;
    if (!pendingCancellation?.reason) {
      if (!selectedReason && !cancelReason.trim()) {
        setCancelError("Please select or enter a reason for cancellation");
        return;
      }
      finalReason = selectedReason
        ? (cancelReason.trim() ? `${selectedReason} - ${cancelReason.trim()}` : selectedReason)
        : cancelReason.trim();
    }

    if (!String(finalReason || "").trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const cancelRequestBody = {
        reason: String(finalReason).trim(),
        adminOverride: false,
      };

      if (booking.isEventOrder) {
        await cancelEventOrder(booking.orderId, cancelRequestBody);
      } else {
        await cancelOrder(booking.orderId, cancelRequestBody);
      }

      // Update local state to show as cancelled
      setBooking(prev => ({
        ...prev,
        status: "Cancelled",
        statusTone: "cancelled",
        originalOrderStatus: "CANCELLED",
        originalData: {
          ...prev.originalData,
          orderStatus: "CANCELLED",
          cancelledAt: new Date().toISOString()
        }
      }));

      setConfirmCancelModalVisible(false);
      setCancelModalVisible(false);
      setCancelReason("");
      setPendingCancellation(null);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setCancelError(getFriendlyCancellationError(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmCancel = () => {
    if (!selectedReason && !cancelReason.trim()) {
      setCancelError("Please select or enter a reason for cancellation.");
      return;
    }

    const finalReason = selectedReason
      ? (cancelReason.trim() ? `${selectedReason} - ${cancelReason.trim()}` : selectedReason)
      : cancelReason.trim();

    setPendingCancellation({
      booking,
      reason: finalReason,
    });
    setCancelError(null);
    setCancelModalVisible(false);
    setConfirmCancelModalVisible(true);
  };

  const handleCloseConfirmCancelModal = () => {
    if (isCancelling) return;
    setConfirmCancelModalVisible(false);
    setCancelModalVisible(true);
  };

  const handleDownloadReceiptClick = () => {
    setReceiptModalVisible(true);
  };

  const handlePrintReceipt = () => {
    const element = document.getElementById("receipt-ticket-pdf");
    if (!element) return;

    element.classList.add(styles.receiptPdfMode);

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `LKP_Receipt_${booking.orderId}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 1.7, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      pagebreak: { mode: ['avoid-all', 'css'] },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .finally(() => {
        element.classList.remove(styles.receiptPdfMode);
      });
  };

  const ensureRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });

  const showValidationModal = ({ title, message, code = "", details = "" }) => {
    setValidationModalData({ title, message, code, details });
    setValidationModalVisible(true);
  };

  const mapValidationFailureToFriendlyMessage = (failure) => {
    const code = String(failure?.code || "UNKNOWN").toUpperCase();
    const details = failure?.details || {};

    switch (code) {
      case "ORDER_NOT_FOUND":
        return {
          title: "Booking not found",
          message: "We could not find this booking. Please refresh and try again.",
          code,
          details: "",
        };
      case "ORDER_NOT_PENDING":
        return {
          title: "Booking is no longer pending",
          message: "This booking cannot be confirmed now because its status has changed.",
          code,
          details: "",
        };
      case "WRONG_ORDER_TYPE":
        return {
          title: "Booking type mismatch",
          message: "We could not validate this booking due to a booking type mismatch.",
          code,
          details: "",
        };
      case "DATE_UNAVAILABLE":
        return {
          title: "Selected date unavailable",
          message: "The selected date is no longer available. Please choose another date.",
          code,
          details: "",
        };
      case "SLOT_UNAVAILABLE":
        return {
          title: "Selected slot unavailable",
          message: "The selected time slot is no longer available. Please choose another slot.",
          code,
          details: "",
        };
      case "CAPACITY_EXCEEDED": {
        const requested = details.requested != null ? String(details.requested) : "";
        const available = details.available != null ? String(details.available) : "";
        const ticketName = failure?.message?.match(/"([^"]+)"/)?.[1] || "";
        const summary = requested || available
          ? `${ticketName ? `${ticketName}: ` : ""}${available || "0"} left, requested ${requested || "N/A"}.`
          : "Requested quantity exceeds current availability.";
        return {
          title: "Not enough capacity",
          message: "Some selected tickets are no longer available in the requested quantity.",
          code,
          details: summary,
        };
      }
      case "ROOM_UNAVAILABLE":
        return {
          title: "Room unavailable",
          message: "The selected room is not available for the chosen dates.",
          code,
          details: "",
        };
      case "PROPERTY_UNAVAILABLE":
        return {
          title: "Property unavailable",
          message: "This property is not available for the selected dates.",
          code,
          details: "",
        };
      default:
        return {
          title: "Availability check failed",
          message: "We could not validate this booking right now. Please try again.",
          code,
          details: "",
        };
    }
  };

  const triggerRazorpayOpen = async (orderResponse, order, payment) => {
    setIsConfirmingBooking(true);
    try {
      const fallbackAmount =
        Number(payment?.amount) > 0
          ? Number(payment.amount)
          : Math.round(Number(order?.totalPrice || order?.finalAmount || booking?.originalData?.totalPrice || 0) * 100);

      const session = await initializePendingOrderPayment(booking.orderId, {
        amount: fallbackAmount,
        currency: payment?.currency || order?.currency || booking?.originalData?.currency || "INR",
      });

      if (isExpiredHold(session?.holdExpiresAt)) {
        alert("Hold expired, recheck availability.");
        return;
      }

      const amountInPaise = Number(session?.payment?.amount || fallbackAmount);
      const razorpayOrderId = session?.payment?.razorpayOrderId;
      const razorpayKeyId = session?.payment?.razorpayKeyId;

      if (!razorpayOrderId) {
        alert("Unable to confirm booking: payment session is missing.");
        return;
      }
      if (!razorpayKeyId) {
        alert("Unable to confirm booking: Razorpay key is missing.");
        return;
      }
      if (!amountInPaise || amountInPaise <= 0) {
        alert("Unable to confirm booking: amount is invalid.");
        return;
      }

      const paymentData = {
        orderId: booking.orderId,
        razorpayOrderId,
        razorpayKeyId,
        amount: amountInPaise,
        currency: session?.payment?.currency || payment?.currency || order?.currency || booking?.originalData?.currency || "INR",
        paymentMethod: "razorpay",
        holdExpiresAt: session?.holdExpiresAt || null,
      };

      localStorage.setItem("pendingOrderId", String(booking.orderId));
      localStorage.setItem("pendingPayment", JSON.stringify(paymentData));
      localStorage.removeItem("razorpayPaymentSuccess");
      localStorage.removeItem("paymentFailed");
      localStorage.setItem("lastRazorpayKeyId", razorpayKeyId);

      await ensureRazorpayScript();

      setConfirmPayModalVisible(false);

      const options = {
        key: razorpayKeyId,
        amount: amountInPaise,
        currency: paymentData.currency,
        order_id: razorpayOrderId,
        name: "Little Known Planet",
        description: booking.title || "Booking Confirmation",
        handler: (response) => {
          localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(response));
          window.location.reload();
        },
        modal: {
          ondismiss: () => {
            setIsConfirmingBooking(false);
          },
        },
        prefill: {
          name: booking?.guest?.name || "",
          email: booking?.guest?.email || "",
          contact: booking?.guest?.phone || "",
        },
        theme: {
          color: "#0097B2",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error confirming booking:", err);
      alert(getInitializePaymentErrorMessage(err));
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  const openRazorpayForBooking = async (bypassPriceCheck = false) => {
    if (!booking?.orderId || isConfirmingBooking) return;
    setIsConfirmingBooking(true);

    try {
      const orderResponse = booking.isEventOrder
        ? await getEventOrderDetails(booking.orderId)
        : await getOrderDetails(booking.orderId);
      const order = orderResponse?.order || orderResponse || {};
      const payment = orderResponse?.payment || order?.payment || {};

      const latestPrice = Number(order?.totalPrice || order?.finalAmount || 0);
      const originalPrice = Number(booking?.originalData?.totalPrice || 0);

      if (!bypassPriceCheck && latestPrice > 0 && originalPrice > 0 && latestPrice !== originalPrice) {
        setPriceChangedData({
          oldPrice: originalPrice,
          newPrice: latestPrice,
          currency: order?.currency || booking?.originalData?.currency || "INR",
          onConfirm: () => {
            setPriceChangedData(null);
            triggerRazorpayOpen(orderResponse, order, payment);
          }
        });
        setIsConfirmingBooking(false);
        return;
      }

      await triggerRazorpayOpen(orderResponse, order, payment);
    } catch (err) {
      console.error("Error fetching order details for Razorpay:", err);
      alert(err?.message || "Failed to initialize payment.");
      setIsConfirmingBooking(false);
    }
  };

  const handleCheckAvailabilityAndProceed = async () => {
    if (!booking?.orderId || isCheckingAvailability || isConfirmingBooking) return;

    setIsCheckingAvailability(true);
    try {
      const businessInterestCode = String(booking?.originalData?.businessInterestCode || "").toUpperCase();
      const isStayOrder = businessInterestCode === "STAYS" ||
        booking?.originalData?.stayId != null ||
        Array.isArray(booking?.originalData?.stayOrderRooms);

      const response = isStayOrder
        ? await validateStayOrder(booking.orderId)
        : await validateExperienceOrEventOrder(booking.orderId);

      if (response?.canProceed === true) {
        const isEvent = booking.isEventOrder || businessInterestCode === "EVENTS" || bookingType === "event";
        const isExperienceOrder = !isStayOrder && !isEvent;
        const originalStatus = booking?.originalData?.orderStatus ? String(booking.originalData.orderStatus).toUpperCase().trim() : "";

        if (isExperienceOrder && originalStatus === "PENDING") {
          setConfirmPayModalVisible(true);
        } else {
          await openRazorpayForBooking();
        }
        return;
      }

      const firstFailure = Array.isArray(response?.failures) && response.failures.length > 0
        ? response.failures[0]
        : null;

      if (firstFailure) {
        showValidationModal(mapValidationFailureToFriendlyMessage(firstFailure));
      } else {
        showValidationModal({
          title: "Availability check failed",
          message: "This booking cannot be confirmed right now. Please try again later.",
          code: "",
          details: "",
        });
      }
    } catch (error) {
      console.error("Error validating booking:", error);

      // Validation APIs may return business validation failures as HTTP 409.
      // In that case, use the payload and show the same user-friendly popup.
      const responseData = error?.response?.data;
      if (error?.response?.status === 409 && responseData) {
        const firstFailure = Array.isArray(responseData?.failures) && responseData.failures.length > 0
          ? responseData.failures[0]
          : null;

        if (firstFailure) {
          showValidationModal(mapValidationFailureToFriendlyMessage(firstFailure));
          return;
        }

        showValidationModal({
          title: "Availability check failed",
          message: "This booking cannot be confirmed right now. Please try again later.",
          code: "",
          details: "",
        });
        return;
      }

      showValidationModal({
        title: "Unable to check availability",
        message: "Couldn’t verify availability right now. Please try again.",
        code: "",
        details: "",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      setError(null);

      //console.log("🔍 Loading booking with bookingId:", bookingId);

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

        //console.log("🔍 Extracted orderId:", orderId);

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
            //console.log("📦 Fetching EVENT order details for orderId:", orderId);
            orderResponse = await getEventOrderDetails(orderId);
            //console.log("✅ Event order details fetched from API:", orderResponse);
          } else {
            //console.log("📦 Fetching regular order details for orderId:", orderId);
            orderResponse = await getOrderDetails(orderId);
            // console.log("✅ Order details fetched from API:", orderResponse);
          }

          // The response structure can be:
          // Option 1: { order: {...}, addons: [], guestAnswers: [], history: [] }
          // Option 2: Direct order object
          if (orderResponse) {
            if (orderResponse.order) {
              // Wrapped in order property
              apiBookingData = orderResponse.order;
              // console.log("✅ Order data extracted from order property:", apiBookingData);
            } else if (orderResponse.orderId) {
              // Direct order object
              apiBookingData = orderResponse;
              //console.log("✅ Order data is direct object:", apiBookingData);
            }

            if (apiBookingData) {
              // console.log("✅ Order data extracted:", apiBookingData);
              // console.log("✅ Order addons:", orderResponse.addons || apiBookingData.addons);
              // console.log("✅ Order history:", orderResponse.history);
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
          //console.log("✅ Using time slot from order data:", slotDetails);
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
            // console.log("✅ Using embedded event details from event-details API response:", eventData);
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
                // console.log(`📦 Enriching event details for eventId: ${eventIdForDetails}`);
              } else {
                // console.log(`📦 Refreshing event details for eventId: ${eventIdForDetails} (override image/title if different)`);
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
              //console.log("✅ Event details enriched from /events/{id}:", eventData);
            } catch (eventError) {
              console.warn(`⚠️ Failed to enrich event details for eventId ${eventIdForDetails}:`, eventError.message);
            }
          }
        }

        // Fallback: Fetch event details by eventId if not embedded
        if (isEventOrder && !eventData && apiBookingData.eventId) {
          try {
            //console.log(`📦 Fetching event details for eventId: ${apiBookingData.eventId}`);
            eventData = await getEventDetails(apiBookingData.eventId);
            // console.log(`✅ Fetched event details for eventId ${apiBookingData.eventId}:`, eventData);
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
            // console.log(`✅ Fetched listing ${apiBookingData.listingId} for order details`);
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
              coverPhotoUrl: apiBookingData.listingCoverPhoto || apiBookingData.coverPhotoUrl || "",
            };
          }
        }
        // Fetch stay data if stayId is available
        let stayData = null;
        const resolvedStayId = (() => {
          if (apiBookingData?.stayId != null) return apiBookingData.stayId;
          const rooms = orderResponse?.stayOrderRooms || apiBookingData?.stayOrderRooms || apiBookingData?.rooms || apiBookingData?.room || [];
          if (Array.isArray(rooms) && rooms.length > 0) {
            const id = rooms[0]?.stayId ?? rooms[0]?.stay_id ?? rooms[0]?.propertyId;
            if (id != null) return id;
          }
          return apiBookingData?.propertyId ?? apiBookingData?.stay_id ?? null;
        })();

        if (resolvedStayId != null) {
          try {
            stayData = await getStayDetails(resolvedStayId);
            // console.log(`✅ Fetched stay ${resolvedStayId} for order details`);
          } catch (error) {
            console.warn(`⚠️ Failed to fetch stay data for order ${apiBookingData.orderId}:`, error.message);
          }
        }

        const isStayOrder = apiBookingData?.businessInterestCode === "STAYS" || resolvedStayId != null;

        if (!isEventOrder) {
          // Create listingData from order fields if no listingId
          const fallbackRooms = orderResponse?.stayOrderRooms || apiBookingData?.stayOrderRooms || [];
          const categoryName = isStayOrder ? "Stays" : "Experience";
          const title = isStayOrder
            ? (stayData?.propertyName || stayData?.name || fallbackRooms[0]?.propertyName || "Stay Booking")
            : (apiBookingData.listingTitle || apiBookingData.title || "Booking");

          listingData = listingData || {
            title: title,
            description: apiBookingData.listingDescription || apiBookingData.description || "",
            location: apiBookingData.listingLocation || apiBookingData.location || "",
            address: apiBookingData.listingAddress || apiBookingData.address || "",
            latitude: apiBookingData.listingLatitude ? parseFloat(apiBookingData.listingLatitude) : null,
            longitude: apiBookingData.listingLongitude ? parseFloat(apiBookingData.listingLongitude) : null,
            meetingLatitude: apiBookingData.listingLatitude ? parseFloat(apiBookingData.listingLatitude) : null,
            meetingLongitude: apiBookingData.listingLongitude ? parseFloat(apiBookingData.listingLongitude) : null,
            category: apiBookingData.listingCategory || apiBookingData.category || categoryName,
            categoryName: apiBookingData.listingCategory || apiBookingData.category || categoryName,
            maxGuests: apiBookingData.listingMaxGuests || apiBookingData.maxGuests || null,
            status: apiBookingData.listingStatus || apiBookingData.status || "",
            coverPhotoUrl: apiBookingData.listingCoverPhoto || apiBookingData.coverPhotoUrl || stayData?.coverImageUrl || "",
          };
        }


        // console.log("✅ Using data:", isEventOrder ? "eventData" : (listingData ? "listingData from API" : "listingData from order fields"));

        // Fetch user profile to ensure synced data
        let profile = null;
        try {
          const profileData = await getCustomerProfile();
          if (profileData && profileData.customer) {
            profile = profileData.customer;
            setUserProfile(profile);
            //console.log("✅ Current user profile fetched for sync:", profile);
          }
        } catch (profileErr) {
          console.warn("⚠️ Failed to fetch user profile for sync:", profileErr.message);
        }

        // Transform the booking data
        let transformed;
        try {
          const mergedApiBookingData =
            orderResponse && typeof orderResponse === "object" && orderResponse.order
              ? { ...orderResponse, ...orderResponse.order }
              : apiBookingData;

          // Fetch review data using category-specific API
          let reviewData = null;
          try {
            if (apiBookingData.listingId) {
              reviewData = await getListingReviews(apiBookingData.listingId);
            } else if (apiBookingData.eventId) {
              reviewData = await getEventReviews(apiBookingData.eventId);
            } else if (resolvedStayId) {
              reviewData = await getStayReviews(resolvedStayId);
            }
            if (reviewData) console.log("✅ Review summary fetched for Details:", reviewData);
          } catch (reviewErr) {
            console.warn("⚠️ Failed to fetch review summary for Details:", reviewErr);
          }

          transformed = transformBookingData(mergedApiBookingData, listingData, eventData, stayData, reviewData, profile);
          // console.log("✅ Transformed booking data:", transformed);
          //  console.log("✅ Original API booking data paymentMethod:", apiBookingData.paymentMethod);
          //  console.log("✅ Transformed paymentMethod:", transformed.paymentMethod);

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
              //console.log("✅ Set start time from order:", apiBookingData.timeSlotStartTime, "->", transformed.startTime);
            }

            if (apiBookingData.timeSlotEndTime) {
              transformed.endTime = formatSlotTime(apiBookingData.timeSlotEndTime);
              //console.log("✅ Set end time from order:", apiBookingData.timeSlotEndTime, "->", transformed.endTime);
            }
          }

          // Verify transformation was successful
          if (!transformed || !transformed.id) {
            throw new Error("Transformation failed - missing required fields");
          }

          setBooking(transformed);
          // console.log("✅ Booking set successfully");
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

  useEffect(() => {
    const autoPayParam = new URLSearchParams(location.search).get("autopay") === "true";
    if (autoPayParam && booking && !loading && !error && !hasAutopaid) {
      setHasAutopaid(true);
      handleCheckAvailabilityAndProceed();
    }
  }, [booking, loading, error, hasAutopaid, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadReviewEligibility = async () => {
      if (!booking?.orderId) return;
      try {
        const eligibleData = await getEligibleBookings();
        const eligibleList = Array.isArray(eligibleData) ? eligibleData : [];
        const eligibleIds = new Set(
          eligibleList
            .map((item) => (item?.orderId != null ? Number(item.orderId) : null))
            .filter(Boolean)
        );
        setOrderIdsEligibleForReview(eligibleIds);
      } catch (err) {
        console.warn("⚠️ Failed to fetch review eligibility in details page:", err?.message || err);
        setOrderIdsEligibleForReview(new Set());
      }
    };

    loadReviewEligibility();
  }, [booking?.orderId]);

  useEffect(() => {
    const loadRefundDetails = async () => {
      if (!booking?.orderId) {
        setRefundDetails(null);
        return;
      }

      try {
        const data = await getOrderRefundDetails(booking.orderId);
        setRefundDetails(data && typeof data === "object" ? data : null);
      } catch (err) {
        console.warn("⚠️ Failed to fetch refund details:", err?.message || err);
        setRefundDetails(null);
      }
    };

    loadRefundDetails();
  }, [booking?.orderId]);

  useEffect(() => {
    const loadCancelPreview = async () => {
      if (!booking?.orderId) {
        setCancelPreview(null);
        return;
      }

      try {
        const data = await getOrderCancelPreview(booking.orderId);
        setCancelPreview(data && typeof data === "object" ? data : null);
      } catch (err) {
        console.warn("⚠️ Failed to fetch cancel preview:", err?.message || err);
        setCancelPreview(null);
      }
    };

    loadCancelPreview();
  }, [booking?.orderId]);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const reasons = await getCancellationReasons();
        setCancellationReasons(reasons);
      } catch (err) {
        console.warn("Failed to fetch cancellation reasons", err);
      }
    };
    fetchReasons();
  }, []);

  const formatMoney = (amount, currency = "INR") => {
    if (amount === null || amount === undefined || amount === "") return "N/A";
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) return "N/A";
    if (currency === "INR") {
      return `₹${numericAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${numericAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatRefundStatus = (status) => {
    const raw = String(status || "").trim();
    if (!raw) return "N/A";
    if (raw.toUpperCase() === "NOT_REQUIRED") return "No Refund";
    return raw.replaceAll("_", " ");
  };

  const formatPolicyWindow = (policy) => {
    if (!policy || typeof policy !== "object") return "";

    const timeUnit = String(policy.timeUnit || "").trim().toUpperCase();
    const defaultUnitSingular = timeUnit === "HOUR" ? "hour" : "day";
    const defaultUnitPlural = timeUnit === "HOUR" ? "hours" : "days";
    const unitSingular = policy.timeUnitLabel || defaultUnitSingular;
    const unitPlural = policy.timeUnitLabelPlural || defaultUnitPlural;
    const minValue = policy.minValue ?? policy.minDaysBeforeStart ?? policy.minDays;
    const maxValue = policy.maxValue ?? policy.maxDaysBeforeStart ?? policy.maxDays;
    const formatUnit = (value) => Number(value) === 1 ? unitSingular : unitPlural;

    if (minValue != null && maxValue != null) {
      if (Number(minValue) === 0 && Number(maxValue) === 0) {
        return "on the start date";
      }
      return `${minValue} to ${maxValue} ${formatUnit(maxValue)} before start`;
    }
    if (minValue != null) {
      if (Number(minValue) === 0) {
        return "any time before start";
      }
      return `${minValue}+ ${formatUnit(minValue)} before start`;
    }
    if (maxValue != null) {
      if (Number(maxValue) === 0) {
        return "up to the start date";
      }
      return `up to ${maxValue} ${formatUnit(maxValue)} before start`;
    }

    return "";
  };

  const getCancelPreviewRows = (preview) => {
    if (!preview || typeof preview !== "object") return [];

    const policyUsed = preview.policyUsed || preview.policyApplied;
    const appliedPercentage =
      preview.policyUsed?.percentage ??
      preview.policyApplied?.percentage ??
      (preview.cancellationFeePercentage != null
        ? 100 - Number(preview.cancellationFeePercentage || 0)
        : null);
    const refundPolicyUsed = formatRefundPolicyUsed(appliedPercentage);

    return [
      { label: "Cancellation available", value: preview.canCancel ? "Yes" : "No" },
      { label: "Refund amount", value: formatCancelPreviewMoney(preview.refundAmount) },
      { label: "Cancellation fee", value: formatCancelPreviewMoney(preview.cancellationFee) },
      { label: "Cancellation fee %", value: preview.cancellationFeePercentage != null ? `${preview.cancellationFeePercentage}%` : "N/A" },
      { label: "Total paid", value: formatCancelPreviewMoney(preview.totalPaid) },
      { label: "Days before booking", value: preview.daysDifference != null ? `${preview.daysDifference} day${Number(preview.daysDifference) === 1 ? "" : "s"}` : "N/A" },
      { label: refundPolicyUsed === "No refund" ? "Refund window used" : "Policy window used", value: formatPolicyWindow(policyUsed) },
      { label: "Refund policy used", value: refundPolicyUsed },
      { label: "Booking date", value: formatCancelPreviewDate(preview.bookingDate) },
    ];
  };

  const getAppliedRefundPolicyText = () => {
    const bookingStatus = String(
      booking?.statusTone ||
      booking?.status ||
      booking?.originalData?.orderStatus ||
      ""
    ).toLowerCase().trim();
    const isCancelled = bookingStatus === "cancelled" || bookingStatus === "canceled";

    if (isCancelled) {
      const appliedPolicy = (
        refundDetails?.policyUsed ||
        refundDetails?.policyApplied ||
        (refundDetails?.appliedPolicy && typeof refundDetails.appliedPolicy === "object" ? refundDetails.appliedPolicy : null) ||
        (refundDetails?.appliedRefundPolicy && typeof refundDetails.appliedRefundPolicy === "object" ? refundDetails.appliedRefundPolicy : null) ||
        (refundDetails?.refundPolicy && typeof refundDetails.refundPolicy === "object" ? refundDetails.refundPolicy : null) ||
        null
      );

      const appliedPolicyTextCandidates = [
        refundDetails?.appliedRefundPolicy,
        refundDetails?.appliedRefundPolicyName,
        refundDetails?.appliedPolicyName,
        refundDetails?.refundPolicyName,
        refundDetails?.policyName,
        refundDetails?.policyLabel,
        refundDetails?.refundPolicyText,
      ];
      const appliedPolicyText = appliedPolicyTextCandidates.find(
        (value) => typeof value === "string" && value.trim() !== ""
      );

      if (appliedPolicyText) {
        return appliedPolicyText.trim();
      }

      const appliedPercentage =
        refundDetails?.policyUsed?.percentage ??
        refundDetails?.policyApplied?.percentage ??
        refundDetails?.appliedPolicy?.percentage ??
        refundDetails?.appliedRefundPolicy?.percentage ??
        refundDetails?.refundPolicy?.percentage ??
        refundDetails?.appliedRefundPercentage ??
        refundDetails?.refundPercentage ??
        refundDetails?.policyPercentage ??
        refundDetails?.percentage ??
        (refundDetails?.cancellationFeePercentage != null
          ? 100 - Number(refundDetails.cancellationFeePercentage || 0)
          : null);

      const appliedWindow = formatPolicyWindow(appliedPolicy);
      const appliedRefundText = Number.isFinite(Number(appliedPercentage))
        ? formatRefundPolicyUsed(appliedPercentage)
        : "";

      if (appliedRefundText && appliedWindow) {
        return `${appliedRefundText} (${appliedWindow})`;
      }
      if (appliedRefundText) return appliedRefundText;
      if (appliedWindow) return appliedWindow;
    }

    const previewPolicy = cancelPreview?.policyUsed || cancelPreview?.policyApplied;
    const previewPercentage =
      cancelPreview?.policyUsed?.percentage ??
      cancelPreview?.policyApplied?.percentage ??
      (cancelPreview?.cancellationFeePercentage != null
        ? 100 - Number(cancelPreview.cancellationFeePercentage || 0)
        : null);

    if (Number.isFinite(Number(previewPercentage))) {
      const normalizedPercentage = Number(previewPercentage);
      const previewWindow = formatPolicyWindow(previewPolicy);

      if (normalizedPercentage <= 0) {
        return previewWindow
          ? `If you cancel now (${previewWindow}), you'll receive 0% refund.`
          : "If you cancel now, you'll receive 0% refund.";
      }

      return previewWindow
        ? `If you cancel now (${previewWindow}), you'll receive ${normalizedPercentage}% refund.`
        : `If you cancel now, you'll receive ${normalizedPercentage}% refund.`;
    }

    const listingCancellationPolicy = booking?.listingData?.cancellationPolicyText;
    const listingPolicyText = Array.isArray(listingCancellationPolicy)
      ? listingCancellationPolicy.map((item) => String(item || "").trim()).filter(Boolean).join(" ")
      : (typeof listingCancellationPolicy === "string" ? listingCancellationPolicy.trim() : "");

    const policyCandidates = [
      listingPolicyText,
      booking?.eventData?.cancellationPolicySummary,
      booking?.eventData?.cancellationPolicyText,
      booking?.eventData?.cancellationPolicy,
      booking?.stayData?.cancellationPolicySummary,
      booking?.stayData?.cancellationPolicyText,
      booking?.stayData?.cancellationPolicy,
      booking?.originalData?.eventData?.cancellationPolicySummary,
      booking?.originalData?.eventData?.cancellationPolicyText,
      booking?.originalData?.eventData?.cancellationPolicy,
      booking?.originalData?.stayData?.cancellationPolicySummary,
      booking?.originalData?.stayData?.cancellationPolicyText,
      booking?.originalData?.stayData?.cancellationPolicy,
      refundDetails?.appliedRefundPolicy,
      refundDetails?.appliedRefundPolicyName,
      refundDetails?.appliedPolicy,
      refundDetails?.refundPolicyName,
      refundDetails?.policyName,
      refundDetails?.policyLabel,
      refundDetails?.policy,
      refundDetails?.refundPolicy,
      refundDetails?.refundPolicyText,
      booking?.originalData?.appliedRefundPolicy,
      booking?.originalData?.appliedRefundPolicyName,
      booking?.originalData?.appliedPolicy,
      booking?.originalData?.refundPolicyName,
      booking?.originalData?.refundPolicy,
      booking?.originalData?.refundPolicyText,
      Array.isArray(booking?.notes?.cancellationPolicy)
        ? booking.notes.cancellationPolicy.map((item) => String(item || "").trim()).filter(Boolean).join(" ")
        : "",
    ];

    const firstText = policyCandidates.find((val) => typeof val === "string" && val.trim() !== "");
    return firstText ? firstText.trim() : "";
  };

  const cancelPreviewRows = getCancelPreviewRows(cancelPreview);

  const getInitialTab = () => {
    return "host";
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

      //console.log("📤 Submitting review with data:", {
      //  orderId: booking.orderId,
      //  rating: reviewRating,
      //  comment: reviewText,
      // listingId: listingId,
      //  customerId: customerId,
      // });

      await submitOrderReview(booking.orderId, {
        rating: reviewRating,
        comment: reviewText,
        listingId: listingId,
        customerId: customerId,
      });

      setOrderIdsEligibleForReview((prev) => {
        const next = new Set(prev);
        next.delete(Number(booking.orderId));
        return next;
      });
      setReviewSubmitted(true);
      setReviewText("");
      setReviewRating(0);
      //console.log("✅ Review submitted successfully");
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
          <LoadingSkeleton variant="detail" />
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
    { id: "host", label: "Host Instructions" },
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

    // If booking.status has been overridden to "Completed" by date-based logic,
    // respect that override before checking the raw backend orderStatus.
    if (booking?.status === "Completed" || booking?.statusTone === "completed") {
      return styles.statusCompleted;
    }

    // Get original orderStatus for accurate status class
    const originalStatus = booking?.originalData?.orderStatus ? String(booking.originalData.orderStatus).toUpperCase().trim() : "";

    // Check original orderStatus
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
    const status = booking.status?.toLowerCase() ||
      booking.statusTone ||
      (booking.originalData?.orderStatus ? String(booking.originalData.orderStatus).toLowerCase() : "");
    const originalStatus = booking.originalData?.orderStatus
      ? String(booking.originalData.orderStatus).toUpperCase().trim()
      : "";

    if (originalStatus === "PENDING" || status === "pending") {
      const actions = [];
      if (sourceTab !== "cancelled") {
        if (!isPastStayCheckInTime()) {
          actions.push({ label: "Cancel Booking", variant: "secondary", onClick: handleCancelBookingClick });
        }
      }
      return actions;
    }

    if (status === "upcoming" || status === "confirmed") {
      const actions = [
        { label: "Download Receipt", variant: "primary", onClick: handleDownloadReceiptClick },
      ];
      if (!isPastStayCheckInTime()) {
        actions.push({ label: "Cancel Booking", variant: "secondary", onClick: handleCancelBookingClick });
      }
      if (canLeaveReview && isPastStayCheckOutTime() && sourceTab !== "upcoming") {
        actions.push({
          label: "Leave Review",
          variant: "secondary",
          onClick: () => {
            // Try to scroll to inline review card first, else open modal
            const reviewSection = document.querySelector(`.${styles.reviewCard}`);
            if (reviewSection) {
              reviewSection.scrollIntoView({ behavior: "smooth" });
            } else {
              setReviewModalRating(0);
              setReviewModalComment("");
              setReviewModalError(null);
              setReviewModalVisible(true);
            }
          },
        });
      }
      return actions;
    } else if (status === "completed") {
      const actions = [
        { label: "Download Receipt", variant: "primary", onClick: handleDownloadReceiptClick },
      ];
      if (canLeaveReview && isPastStayCheckOutTime() && sourceTab !== "upcoming") {
        actions.push({
          label: "Leave Review",
          variant: "secondary",
          onClick: () => {
            // Try to scroll to inline review card first, else open modal
            const reviewSection = document.querySelector(`.${styles.reviewCard}`);
            if (reviewSection) {
              reviewSection.scrollIntoView({ behavior: "smooth" });
            } else {
              setReviewModalRating(0);
              setReviewModalComment("");
              setReviewModalError(null);
              setReviewModalVisible(true);
            }
          },
        });
      }
      return actions;
    } else if (status === "cancelled" || status === "canceled") {
      return [
        { label: "Explore Alternatives", variant: "primary", onClick: () => window.location.href = "/" },
      ];
    } else {
      return [
        { label: "Download Receipt", variant: "primary", onClick: handleDownloadReceiptClick },
      ];
    }
  };

  const getButtonClassName = (variant) => {
    if (variant === "primary") {
      return cn("button", "button-small");
    }
    return cn("button-stroke", "button-small");
  };

  const bookingStatusLower = String(
    booking?.statusTone ||
    booking?.status ||
    booking?.originalData?.orderStatus ||
    ""
  ).toLowerCase().trim();
  const isCancelledBooking = bookingStatusLower === "cancelled" || bookingStatusLower === "canceled";

  const getConfirmCancelSummaryRows = (preview) => {
    if (!preview || typeof preview !== "object") return [];

    const policyUsed = preview.policyUsed || preview.policyApplied;
    const appliedPercentage =
      preview.policyUsed?.percentage ??
      preview.policyApplied?.percentage ??
      (preview.cancellationFeePercentage != null
        ? 100 - Number(preview.cancellationFeePercentage || 0)
        : null);

    return [
      { label: "Total amount", value: formatCancelPreviewMoney(preview.totalPaid) },
      { label: "Refund amount", value: formatCancelPreviewMoney(preview.refundAmount) },
      { label: "Refund policy used", value: formatRefundPolicyUsed(appliedPercentage) },
      { label: "Policy window used", value: formatPolicyWindow(policyUsed) },
      { label: "Booking date", value: formatCancelPreviewDate(preview.bookingDate) },
    ];
  };

  const confirmCancelSummaryRows = cancelPreview ? getConfirmCancelSummaryRows(cancelPreview) : [];

  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <header className={styles.header}>
          <Link
            to="/bookings"
            className={cn("button-stroke", "button-small")}
            style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Icon name="arrow-prev" size="14" />
            <span>Back to Bookings</span>
          </Link>
          <h1 className={cn("h2", styles.title)} style={{ marginTop: "16px" }}>{booking.title}</h1>
          {booking.rating > 0 && (
            <div className={styles.ratingRow}>
              <Rating className={styles.rating} rating={booking.rating} readonly={true} />
              <span className={styles.reviewCount}>({booking.reviewCount} reviews)</span>
            </div>
          )}
        </header>

        <div className={styles.banner}>
          <img
            src={booking.bannerImage.src}
            alt={booking.bannerImage.alt}
            onLoad={() => {
              //console.log("✅ Banner image loaded:", booking.bannerImage.src);
            }}
            onError={(e) => {
              console.warn("⚠️ Banner image failed to load:", booking.bannerImage.src);
              e.currentTarget.src = "";
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
              <div className={styles.summaryValue}>{booking.bookingTime || "Not specified"}</div>
            </div>
            {booking.reservationDate && (
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Reservation Date</div>
                <div className={styles.summaryValue}>{booking.reservationDate}</div>
              </div>
            )}
            {(booking.startTime || booking.endTime) && (
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>Reservation Time</div>
                <div className={styles.summaryValue}>
                  {booking.startTime && booking.endTime ? (
                    <>
                      {booking.startTime} - {booking.endTime}
                    </>
                  ) : (
                    booking.startTime || booking.endTime
                  )}
                </div>
              </div>
            )}
            {(() => {
              const adults = Math.max(booking.adultsCount || 0, booking.guestCount - (booking.childrenCount || 0));
              const children = booking.childrenCount || 0;
              const total = adults + children;
              return (
                <>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Total Guests</div>
                    <div className={styles.summaryValue}>{total} {total === 1 ? "Guest" : "Guests"}</div>
                  </div>
                  {adults > 0 && (
                    <div className={styles.summaryItem}>
                      <div className={styles.summaryLabel}>Adults</div>
                      <div className={styles.summaryValue}>{adults}</div>
                    </div>
                  )}
                  {children > 0 && (
                    <div className={styles.summaryItem}>
                      <div className={styles.summaryLabel}>Children</div>
                      <div className={styles.summaryValue}>{children}</div>
                    </div>
                  )}
                </>
              );
            })()}
            <div className={styles.summaryItem}>
              <div className={styles.summaryLabel}>Status</div>
              <div className={styles.summaryValue}>
                <span className={cn(styles.statusBadge, getStatusClass(booking.status || booking.statusTone || booking.originalData?.orderStatus))}>
                  {(() => {
                    // If booking.status has been overridden to "Completed" by date-based logic,
                    // show "Completed" regardless of the raw backend orderStatus (which may still be CONFIRMED).
                    if (booking.status === "Completed" || booking.statusTone === "completed") {
                      return "Completed";
                    }

                    // Get status from original orderStatus, then fallback to mapped status
                    const originalStatus = booking.originalData?.orderStatus;
                    if (originalStatus) {
                      const normalized = String(originalStatus).toUpperCase().trim();
                      // Map original status to display text
                      if (normalized === "PENDING") return "Pending";
                      if (normalized === "PENDING_CONFIRMATION") return "Pending Confirmation";
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
                  const paymentMethod = formatPaymentMethod(
                    booking.paymentMethod ||
                    booking.originalData?.paymentMethod ||
                    booking.originalData?.payment_method
                  );
                  // console.log("✅ Displaying payment method:", {
                  //   bookingPaymentMethod: booking.paymentMethod,
                  //   originalPaymentMethod: booking.originalData?.paymentMethod,
                  //   originalPayment_method: booking.originalData?.payment_method,
                  //   final: paymentMethod
                  // });
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
          {booking.addons && booking.addons.length > 0 && (
            <div className={styles.addonsInlineSection}>
              <h3 className={styles.addonsSectionTitle}>Selected Add-ons</h3>
              <div className={styles.addonsInlineList}>
                {booking.addons.map((addon, index) => (
                  <div key={index} className={styles.addonChip}>
                    <span className={styles.addonName}>{addon.name}</span>
                    <span className={styles.addonQty}>×{addon.quantity}</span>
                    <span className={styles.addonSeparator}>—</span>
                    <span className={styles.addonPrice}>{addon.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <div className={cn(styles.paymentRow, styles.paymentTotal)}>
                <span>{booking.status === "Pending" ? "Amount Payable" : "Total Paid"}</span>
                <span>{booking.pricing.total}</span>
              </div>
              {(booking.status === "Pending" || String(booking.originalData?.orderStatus || "").toUpperCase() === "PENDING") && String(booking.originalData?.orderStatus || "").toUpperCase() !== "PENDING_CONFIRMATION" && (
                <div className={styles.paymentActions}>
                  <button
                    type="button"
                    className={cn("button", styles.payNowBtn)}
                    onClick={handleCheckAvailabilityAndProceed}
                    disabled={isCheckingAvailability || isConfirmingBooking}
                    style={{ backgroundColor: "#0097B2", borderColor: "#0097B2" }}
                  >
                    {isCheckingAvailability
                      ? "Checking Availability..."
                      : (isConfirmingBooking ? "Opening Payment..." : "Check Availability & Pay Now")}
                  </button>
                </div>
              )}
              {refundDetails && (
                <>
                  {isCancelledBooking && (
                    <div className={styles.paymentRow}>
                      <span>Refund Status</span>
                      <span>{formatRefundStatus(refundDetails.refundStatus)}</span>
                    </div>
                  )}
                  <div className={styles.paymentRow}>
                    <span>Refund Amount</span>
                    <span>{formatMoney(refundDetails.refundAmount, refundDetails.currency || booking?.originalData?.currency || "INR")}</span>
                  </div>
                  <div className={styles.paymentRow}>
                    <span>Total Amount</span>
                    <span>{formatMoney(refundDetails.totalPaid, refundDetails.currency || booking?.originalData?.currency || "INR")}</span>
                  </div>
                </>
              )}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E6E8EC' }}>
                {(() => {
                  const isRefundAmountZero = refundDetails && Number(refundDetails.refundAmount) <= 0;
                  const isNoRefundStatus = refundDetails && (String(refundDetails.refundStatus).toUpperCase() === 'NOT_REQUIRED' || String(refundDetails.refundStatus).toUpperCase() === 'NO_REFUND');
                  const hasNoRefund = isCancelledBooking && (isRefundAmountZero || isNoRefundStatus);
                  const policyText = getAppliedRefundPolicyText();
                  const isPolicyTextNoRefund = policyText && policyText.toLowerCase().includes("no refund");

                  if (!isCancelledBooking || hasNoRefund || isPolicyTextNoRefund) {
                    return (
                      <p style={{ fontSize: '12px', color: '#777E90', marginBottom: '0', lineHeight: '1.5' }}>
                        Cancellation and refund eligibility will be determined based on the date of cancellation and the applicable refund policy.
                      </p>
                    );
                  }

                  if (policyText) {
                    return (
                      <p style={{ fontSize: '12px', color: '#777E90', lineHeight: '1.5', marginBottom: '0' }}>
                        <span style={{ fontWeight: 500 }}>Applied Cancellation Policy: </span>
                        {policyText}
                      </p>
                    );
                  }

                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>





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

        {/* Review Section - Only show for completed orders and after checkout */}
        {(isCompletedOrder && isPastStayCheckOutTime() && (canLeaveReview || reviewSubmitted)) && (
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

        {(getActionButtons().length > 0 || isPastStayCheckInTime()) && (
          <div className={cn(styles.card, styles.actionCard)}>
            <h3 className={styles.actionTitle}>Actions</h3>
            {isPastStayCheckInTime() && (
              <div style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #ffeeba' }}>
                This stay has already started and can no longer be cancelled.
              </div>
            )}
            {getActionButtons().length > 0 && (
              <div className={styles.actionButtons}>
                {getActionButtons().map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    className={getButtonClassName(action.variant)}
                    onClick={action.onClick}
                    disabled={Boolean(action.disabled)}
                    style={{ cursor: "pointer" }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <Modal
        visible={validationModalVisible}
        onClose={() => setValidationModalVisible(false)}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>{validationModalData.title}</h2>
            <p className={styles.cancelModalDescription}>{validationModalData.message}</p>
          </div>
          <div className={styles.cancelModalBody}>
            {validationModalData.details ? (
              <p className={styles.cancelModalDescription} style={{ marginBottom: "8px" }}>
                {validationModalData.details}
              </p>
            ) : null}
          </div>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              onClick={() => setValidationModalVisible(false)}
            >
              Okay
            </button>
          </div>
        </div>
      </Modal>

      {/* Price Update Consent Modal */}
      <Modal
        visible={!!priceChangedData}
        onClose={() => {
          setPriceChangedData(null);
          setIsConfirmingBooking(false);
        }}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>Price Updated</h2>
            <p className={styles.cancelModalDescription}>
              The price for this experience booking has been updated.
            </p>
          </div>
          <div className={styles.cancelModalBody}>
            <p className={styles.cancelModalDescription} style={{ marginBottom: "16px" }}>
              Original Price: <strong>{priceChangedData ? formatMoney(priceChangedData.oldPrice, priceChangedData.currency) : ""}</strong>
              <br />
              Updated Price: <strong>{priceChangedData ? formatMoney(priceChangedData.newPrice, priceChangedData.currency) : ""}</strong>
            </p>
            <p className={styles.cancelModalDescription}>
              Would you like to proceed with the updated payment amount?
            </p>
          </div>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={() => {
                setPriceChangedData(null);
                setIsConfirmingBooking(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              onClick={() => {
                if (priceChangedData?.onConfirm) {
                  priceChangedData.onConfirm();
                }
              }}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* Slot Available Confirmation Modal */}
      <Modal
        visible={confirmPayModalVisible}
        onClose={() => {
          if (!isConfirmingBooking) setConfirmPayModalVisible(false);
        }}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle} style={{ color: "#0097B2" }}>Slot Available</h2>
            <p className={styles.cancelModalDescription}>
              Your selected experience slot is currently available.
              You can proceed with payment to confirm your booking.
            </p>
          </div>



          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={() => setConfirmPayModalVisible(false)}
              disabled={isConfirmingBooking}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              onClick={async () => {
                await openRazorpayForBooking();
              }}
              disabled={isConfirmingBooking}
              style={{ backgroundColor: "#0097B2", borderColor: "#0097B2" }}
            >
              {isConfirmingBooking ? "Initializing..." : "Continue to Payment"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        visible={cancelModalVisible}
        onClose={handleCloseCancelModal}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={cn(styles.cancelModalContent, styles.cancelModalContentScrollable)}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle} style={{ fontSize: "28px", fontWeight: "600", color: "#141416", marginBottom: "12px" }}>
              Cancel Booking
            </h2>
            <p className={styles.cancelModalDescription} style={{ fontSize: "14px", color: "#777E90", lineHeight: "1.5" }}>
              We're sorry to see you go. Please let us know<br />why you're cancelling this booking.
            </p>
          </div>
          <div className={cn(styles.cancelModalBody, styles.cancelModalBodyScrollable)} style={{ padding: "0 32px" }}>
            <div className={styles.cancelPolicyBox} style={{ background: "transparent", padding: 0, border: "none", marginBottom: "24px" }}>
              <div className={styles.cancelPolicyLabel} style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#B1B5C3", marginBottom: "16px" }}>
                Select a reason
              </div>
              {cancellationReasons.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[...cancellationReasons]
                    .sort((a, b) => (a?.sortOrder || 0) - (b?.sortOrder || 0))
                    .map((reason, idx) => {
                      const reasonText = typeof reason === 'object' ? (reason.displayName || reason.reason || reason.name || JSON.stringify(reason)) : reason;
                      const isSelected = selectedReason === reasonText;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedReason(reasonText)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "18px 20px",
                            border: `1px solid ${isSelected ? "#0097B2" : "#E6E8EC"}`,
                            borderRadius: "8px",
                            cursor: "pointer",
                            backgroundColor: isSelected ? "#F2FBFC" : "#FFFFFF",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <span style={{ fontSize: "15px", color: "#141416", fontWeight: isSelected ? "500" : "400" }}>
                            {reasonText}
                          </span>
                          <div style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            border: `2px solid ${isSelected ? "#0097B2" : "#B1B5C3"}`,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#FFFFFF",
                            flexShrink: 0
                          }}>
                            {isSelected && (
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#0097B2" }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className={styles.cancelPolicyText}>
                  Loading reasons...
                </div>
              )}
            </div>

            {selectedReason && selectedReason.toLowerCase().includes("other") && (
              <div className={styles.cancelModalFormGroup} style={{ marginTop: "24px" }}>
                <label htmlFor="cancelReason" className={styles.cancelModalLabel} style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: "#B1B5C3", marginBottom: "12px" }}>
                  Additional details (optional)
                </label>
                <textarea
                  id="cancelReason"
                  className={cn(styles.cancelModalInput, styles.cancelModalTextarea, {
                    [styles.inputError]: cancelError && !cancelReason.trim(),
                  })}
                  style={{ borderRadius: "8px", border: "1px solid #E6E8EC", padding: "16px", minHeight: "100px", resize: "none" }}
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    setCancelError(null);
                  }}
                  placeholder="Tell us more about your reason (optional)..."
                  maxLength={250}
                  disabled={isCancelling}
                />
                <div style={{ textAlign: "right", fontSize: "12px", color: "#B1B5C3", marginTop: "4px" }}>
                  {cancelReason.length}/250
                </div>
              </div>
            )}
            {cancelError && (
              <div className={styles.cancelModalError}>
                {cancelError}
              </div>
            )}
          </div>
          <div className={styles.cancelModalFooter} style={{ padding: "24px 32px", borderTop: "1px solid #E6E8EC", display: "flex", gap: "16px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className={cn("button-stroke")}
              style={{ flex: 1, borderRadius: "24px", padding: "12px 24px", height: "48px" }}
              onClick={handleCloseCancelModal}
              disabled={isCancelling}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn("button")}
              style={{ flex: 1, borderRadius: "24px", padding: "12px 24px", height: "48px", backgroundColor: "#0097B2", color: "white", border: "none" }}
              onClick={handleConfirmCancel}
              disabled={isCancelling || !selectedReason}
            >
              {isCancelling ? "Submitting..." : "Submit Cancellation"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        visible={confirmCancelModalVisible}
        onClose={handleCloseConfirmCancelModal}
        outerClassName={styles.confirmCancelModalOuter}
      >
        <div className={styles.confirmCancelModalContent || styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>Confirm Cancellation</h2>
            <p className={styles.cancelModalDescription}>
              {booking ? `Cancel "${booking.title}" and apply the previewed cancellation policy?` : "Confirm this cancellation?"}
            </p>
          </div>
          <div className={styles.confirmCancelSummary}>
            {cancelPreviewLoading ? (
              <p style={{ margin: 0, fontSize: "14px", color: "#777E90" }}>
                Loading cancellation preview...
              </p>
            ) : confirmCancelSummaryRows.length > 0 ? (
              <>
                {confirmCancelSummaryRows.map((row) => (
                  <div className={styles.confirmCancelSummaryRow} key={row.label}>
                    <span className={styles.confirmCancelSummaryLabel}>{row.label}</span>
                    <span className={styles.confirmCancelSummaryValue}>{row.value}</span>
                  </div>
                ))}
                <div className={styles.confirmCancelSummaryRow}>
                  <span className={styles.confirmCancelSummaryLabel} style={{ fontWeight: 600, color: "#141416" }}>
                    Important
                  </span>
                  <span className={styles.confirmCancelSummaryValue} style={{ color: "#0097B2", fontWeight: 500 }}>
                    This cancellation cannot be undone.
                  </span>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#777E90" }}>
                No preview available.
              </p>
            )}
          </div>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={handleCloseConfirmCancelModal}
              disabled={isCancelling}
            >
              No
            </button>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              onClick={executeCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Leave Review Modal - opened from the Leave Review action button */}
      <Modal
        visible={reviewModalVisible}
        onClose={() => {
          if (!isSubmittingReviewModal) {
            setReviewModalVisible(false);
            setReviewModalRating(0);
            setReviewModalComment("");
            setReviewModalError(null);
          }
        }}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>Leave a Review</h2>
            <p className={styles.cancelModalDescription}>
              {booking ? `How was your experience with "${booking.title}"?` : "Share your experience."}
            </p>
          </div>
          <div className={styles.cancelModalBody}>
            <div className={styles.cancelModalFormGroup}>
              <label className={styles.cancelModalLabel}>
                Rating <span className={styles.required}>*</span>
              </label>
              <Rating
                className={styles.reviewRating}
                rating={reviewModalRating}
                onChange={setReviewModalRating}
                readonly={false}
              />
            </div>
            <div className={styles.cancelModalFormGroup}>
              <label htmlFor="viewDetailsReviewComment" className={styles.cancelModalLabel}>
                Comment (optional)
              </label>
              <textarea
                id="viewDetailsReviewComment"
                className={cn(styles.cancelModalInput, styles.cancelModalTextarea)}
                value={reviewModalComment}
                onChange={(e) => {
                  setReviewModalComment(e.target.value);
                  setReviewModalError(null);
                }}
                placeholder="Share your thoughts about your experience..."
                rows={3}
                disabled={isSubmittingReviewModal}
              />
            </div>
            {reviewModalError && (
              <div className={styles.cancelModalError}>{reviewModalError}</div>
            )}
          </div>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={() => {
                setReviewModalVisible(false);
                setReviewModalRating(0);
                setReviewModalComment("");
                setReviewModalError(null);
              }}
              disabled={isSubmittingReviewModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn("button", styles.cancelModalBtn)}
              disabled={isSubmittingReviewModal || reviewModalRating < 1 || reviewModalRating > 5}
              style={{ cursor: reviewModalRating >= 1 ? "pointer" : "not-allowed" }}
              onClick={async () => {
                if (!booking || reviewModalRating < 1) {
                  setReviewModalError("Please select a rating (1–5 stars).");
                  return;
                }
                setReviewModalError(null);
                setIsSubmittingReviewModal(true);
                try {
                  await submitOrderReview(booking.orderId, {
                    rating: reviewModalRating,
                    comment: reviewModalComment.trim() || undefined,
                    listingId: booking.originalData?.listingId,
                    eventId: booking.originalData?.eventId,
                    stayId: booking.originalData?.stayId ||
                      (booking.originalData?.stayOrderRooms && booking.originalData.stayOrderRooms[0]?.stayId),
                  });
                  // Remove from eligible set so button disappears
                  setOrderIdsEligibleForReview((prev) => {
                    const next = new Set(prev);
                    next.delete(Number(booking.orderId));
                    return next;
                  });
                  setReviewSubmitted(true);
                  setReviewModalVisible(false);
                  setReviewModalRating(0);
                  setReviewModalComment("");
                } catch (err) {
                  const status = err.response?.status;
                  const message = err.response?.data?.message || err.message;
                  if (status === 409) {
                    setReviewModalError("You've already reviewed this order.");
                    setOrderIdsEligibleForReview((prev) => {
                      const next = new Set(prev);
                      next.delete(Number(booking.orderId));
                      return next;
                    });
                  } else {
                    setReviewModalError(message || "Failed to submit review. Please try again.");
                  }
                } finally {
                  setIsSubmittingReviewModal(false);
                }
              }}
            >
              {isSubmittingReviewModal ? "Submitting..." : "Post it!"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        outerClassName={styles.receiptModalOuter}
        containerClassName={styles.receiptModalContainer}
      >
        <div className={styles.receiptModalContent}>
          <div className={styles.receiptModalHeader}>
            <h2 className={styles.receiptModalTitle}>Booking Receipt</h2>
            <button
              className={cn("button-small", styles.downloadPdfButton)}
              onClick={handlePrintReceipt}
            >
              <Icon name="download" size="18" />
              <span>Download PDF</span>
            </button>
          </div>
          {receiptViewModel && (
            <>
              <div className={styles.receiptPrintArea}>
                <div id="receipt-ticket-pdf" className={styles.receiptSheet}>
                  <div className={styles.receiptHero}>
                    <div className={styles.receiptLogoCard}>
                      <img
                        src="/images/littleplanet-logo.svg"
                        alt="Little Known Planet"
                        className={styles.receiptLogoImage}
                      />
                    </div>
                    <div className={styles.receiptHeroInfo}>
                      <div className={styles.receiptBrandName}><span>Little Known Planet</span></div>
                      <div className={styles.receiptBrandMeta}>
                        <span><Icon name="globe" size="14" />{receiptViewModel.companyWebsite.replace(/^https?:\/\//, "")}</span>
                        <span><Icon name="phone" size="14" />{receiptViewModel.companyPhone}</span>
                        <span><Icon name="email" size="14" />{receiptViewModel.companyEmail}</span>
                      </div>
                    </div>
                    <div className={styles.receiptInvoicePill}><span>{receiptViewModel.invoiceId}</span></div>
                  </div>

                  <div className={styles.receiptMetaGrid}>
                    <div className={styles.receiptMetaCard}>
                      <div className={styles.receiptSectionTitle}>
                        <Icon name="user" size="16" />
                        <span>Bill To:</span>
                      </div>
                      <div className={styles.receiptPrimaryText}>{receiptViewModel.billTo.name}</div>
                      <div className={styles.receiptSecondaryText}>{receiptViewModel.billTo.line1}</div>
                      <div className={styles.receiptSecondaryText}>{receiptViewModel.billTo.line2}</div>
                      {receiptViewModel.billTo.line3 && <div className={styles.receiptSecondaryText}>{receiptViewModel.billTo.line3}</div>}
                      <div className={styles.receiptSecondaryText}>{receiptViewModel.billTo.phone}</div>
                      <div className={styles.receiptSecondaryText}>{receiptViewModel.billTo.email}</div>
                    </div>

                    <div className={styles.receiptMetaCard}>
                      <div className={styles.receiptSectionTitle}>
                        <Icon name="home" size="16" />
                        <span>Property / Listing:</span>
                      </div>
                      <div className={styles.receiptPrimaryText}>{receiptViewModel.property.title}</div>
                      <div className={styles.receiptSecondaryText}>{receiptViewModel.property.line1}</div>
                      <div className={styles.receiptSecondaryText}>{receiptViewModel.property.line2}</div>
                      {receiptViewModel.property.line3 && <div className={styles.receiptSecondaryText}>{receiptViewModel.property.line3}</div>}
                      <div className={styles.receiptBadge}><span>{receiptViewModel.property.badge}</span></div>
                    </div>

                    <div className={styles.receiptMetaCard}>
                      <div className={styles.receiptMetaBlock}>
                        <div className={styles.receiptSectionTitle}>
                          <Icon name="calendar" size="16" />
                          <span>Invoice Date:</span>
                        </div>
                        <div className={styles.receiptSecondaryText}>{receiptViewModel.invoiceDateLabel}</div>
                      </div>
                      <div className={styles.receiptMetaBlock}>
                        <div className={styles.receiptSectionTitle}>
                          <Icon name="clock" size="16" />
                          <span>Due Date:</span>
                        </div>
                        <div className={styles.receiptSecondaryText}>{receiptViewModel.dueDateLabel}</div>
                      </div>
                      <div className={styles.receiptMetaBlock}>
                        <div className={styles.receiptSectionTitle}>
                          <Icon name="wallet" size="16" />
                          <span>Payment Terms:</span>
                        </div>
                        <div className={styles.receiptSecondaryText}>{receiptViewModel.paymentTermsLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.receiptFinanceGrid}>
                    <div className={styles.receiptTableCard}>
                      <div className={styles.receiptTableHeader}>
                        <span>Price details</span>
                        <span>Amount (INR)</span>
                      </div>
                      <div className={styles.receiptTableBody}>
                        {receiptViewModel.rows.map((row) => (
                          <div
                            key={`${row.label}-${row.value}`}
                            className={cn(
                              styles.receiptTableRow,
                              row.isNegative && styles.receiptTableRowNegative,
                              row.isTotal && styles.receiptTableRowTotal
                            )}
                          >
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={styles.receiptSummaryCard}>
                      <div className={styles.receiptSummaryLabel}>{booking.status === "Pending" ? "Amount Payable" : "Total Paid"}</div>
                      <div className={styles.receiptSummaryValue}>{receiptViewModel.totalAmountLabel}</div>
                      <div className={styles.receiptSummaryDivider}></div>
                      <div className={styles.receiptSummaryWordsLabel}>Amount in Words:</div>
                      <div className={styles.receiptSummaryWords}>{receiptViewModel.totalAmountWords}</div>
                      <div className={styles.receiptSummaryMeta}>
                        <span>{receiptViewModel.scheduleLabel}</span>
                        <span>{receiptViewModel.guestSummary}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.receiptPolicyCard}>
                    <div className={styles.receiptSectionTitle}>
                      <Icon name="shield" size="16" />
                      <span>Cancellation Policy:</span>
                    </div>
                    <div className={styles.receiptPolicyList}>
                      {receiptViewModel.cancellationPolicies
                        .flatMap((item) =>
                          String(item)
                            .split("\n")
                            .map((part) => part.trim())
                            .filter(Boolean)
                        )
                        .map((item) => (
                          <div key={item} className={styles.receiptPolicyItem}>
                            <span className={styles.receiptPolicyBullet} />
                            <span className={styles.receiptPolicyText}>{item}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className={styles.receiptFooter}>
                    <div className={styles.receiptFooterBrand}>Little Known Planet</div>
                    <div className={styles.receiptFooterLinks}>
                      <span><Icon name="globe" size="14" />{receiptViewModel.companyWebsite.replace(/^https?:\/\//, "")}</span>
                      <span><Icon name="email" size="14" />{receiptViewModel.companyEmail}</span>
                      <span><Icon name="phone" size="14" />{receiptViewModel.companyPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.receiptChecklist}>
                <div className={styles.receiptChecklistTitle}>Required Details Included</div>
                <ul className={styles.receiptChecklistList}>
                  {receiptViewModel.requiredDetails.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ViewDetails;


