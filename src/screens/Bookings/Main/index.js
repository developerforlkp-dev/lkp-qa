import React, { useEffect, useMemo, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import cn from "classnames";
import styles from "./Main.module.sass";
import Icon from "../../../components/Icon";
import Modal from "../../../components/Modal";
import { emptyStateCopy } from "../../../mocks/bookings";
import { cancelOrder, cancelEventOrder, getEventDetails, getListing, getCompletedOrders, getOrderCancelPreview, submitOrderReview, getEligibleBookings, getStayDetails, getListingReviews, getEventReviews, getStayReviews, validateExperienceOrEventOrder, getOrderDetails, getCancellationReasons, sendOrderMessage } from "../../../utils/api";
import { getInitializePaymentErrorMessage, initializePendingOrderPayment, isExpiredHold } from "../../../utils/paymentSession";
import { buildExperienceUrl } from "../../../utils/experienceUrl";
import Rating from "../../../components/Rating";
import LoadingSkeleton from "../../../components/LoadingSkeleton";

// Helper function to format image URLs
const formatImageUrl = (url) => {
  if (!url) return "";

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
  return "";
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

const formatPolicyWindow = (policy) => {
  if (!policy || typeof policy !== "object") return "N/A";

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
      return "On the start date";
    }
    return `${minValue} to ${maxValue} ${formatUnit(maxValue)} before start`;
  }
  if (minValue != null) {
    if (Number(minValue) === 0) {
      return "Any time before start";
    }
    return `${minValue}+ ${formatUnit(minValue)} before start`;
  }
  if (maxValue != null) {
    if (Number(maxValue) === 0) {
      return "Up to the start date";
    }
    return `Up to ${maxValue} ${formatUnit(maxValue)} before start`;
  }
  return "N/A";
};

const formatRefundPolicyUsed = (percentage) => {
  const numericValue = Number(percentage);
  if (!Number.isFinite(numericValue)) return "N/A";
  if (numericValue <= 0) return "No refund";
  return `${numericValue}% refund`;
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

// Helper function to extract booking status lightly without calling external APIs
const enrichRawBooking = (apiBooking) => {
  const statusMap = {
    PENDING: "Pending",
    CONFIRMED: "Upcoming",
    SUCCESS: "Upcoming",
    PAID: "Upcoming",
    BOOKED: "Upcoming",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Cancelled",
    DECLINED: "Cancelled",
  };

  const normalizedOrderStatus = String(apiBooking?.orderStatus || "").toUpperCase().trim();
  let status = statusMap[normalizedOrderStatus] || "Upcoming";

  if (status === "Upcoming" || status === "Completed") {
    const stayRooms = Array.isArray(apiBooking?.stayOrderRooms) ? apiBooking.stayOrderRooms : [];
    const roomCheckOutDates = stayRooms
      .map((room) => room?.checkOutDate || room?.checkoutDate || room?.check_out_date)
      .filter(Boolean);
    const roomCheckOutTimes = stayRooms
      .map((room) => room?.checkOutTime || room?.checkoutTime || room?.check_out_time)
      .filter(Boolean);

    const bookingDateStr =
      roomCheckOutDates[0] ||
      apiBooking.checkOutDate ||
      apiBooking.checkoutDate ||
      apiBooking.checkInDate ||
      apiBooking.bookingDate ||
      apiBooking.eventDate ||
      apiBooking.eventDetails?.eventDate ||
      null;

    if (bookingDateStr) {
      const deadline = new Date(bookingDateStr);
      const endTimeStr =
        roomCheckOutTimes[0] ||
        apiBooking.timeSlotEndTime ||
        apiBooking.checkOutTime ||
        apiBooking.checkoutTime ||
        apiBooking.endTime ||
        apiBooking.bookingTime;

      if (endTimeStr && typeof endTimeStr === 'string' && endTimeStr.includes(':')) {
        const [hours, minutes, seconds] = endTimeStr.split(':').map(Number);
        deadline.setHours(hours || 0, minutes || 0, seconds || 0, 0);
      } else {
        deadline.setHours(23, 59, 59, 999);
      }
      if (deadline < new Date()) {
        status = "Completed";
      } else {
        status = "Upcoming";
      }
    }
  }
  return {
    id: `bk-${apiBooking.orderId}`,
    orderId: apiBooking.orderId,
    statusTone: status.toLowerCase(),
    status: status,
    bookingData: apiBooking
  };
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
      } catch (error) {
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
      } catch (error) {
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
      } catch (error) {
        stayCache.set(stayId, null);
      }
    });

    await Promise.all(stayPromises);
  }

  // Step 2b: Fetch review summaries for all unique listings/events/stays
  // We call the specific category-based API for each ID to ensure consistency
  const reviewCache = new Map();

  const reviewPromises = [];

  // Fetch Experience reviews
  if (uniqueListingIds.length > 0) {
    uniqueListingIds.forEach(id => {
      reviewPromises.push(
        getListingReviews(id).then(data => reviewCache.set(`experience_${id}`, data))
          .catch(() => reviewCache.set(`experience_${id}`, null))
      );
    });
  }

  // Fetch Event reviews
  if (uniqueEventIds.length > 0) {
    uniqueEventIds.forEach(id => {
      reviewPromises.push(
        getEventReviews(id).then(data => reviewCache.set(`event_${id}`, data))
          .catch(() => reviewCache.set(`event_${id}`, null))
      );
    });
  }

  // Fetch Stay reviews
  if (uniqueStayIds.length > 0) {
    uniqueStayIds.forEach(id => {
      reviewPromises.push(
        getStayReviews(id).then(data => reviewCache.set(`stay_${id}`, data))
          .catch(() => reviewCache.set(`stay_${id}`, null))
      );
    });
  }

  if (reviewPromises.length > 0) {
    await Promise.all(reviewPromises);
  }

  // Step 3: Transform bookings using cached listing and review data
  const transformed = bookingsArray.map((apiBooking) => {
    try {
      const listingId = apiBooking.listingId || apiBooking.experienceId || (apiBooking.listing && (apiBooking.listing.listingId || apiBooking.listing.id));
      const listingData = listingId ? listingCache.get(listingId) : null;

      const eventId = apiBooking?.eventId || apiBooking?.eventDetails?.eventId || (apiBooking.listing && apiBooking.listing.eventId);
      const eventData = eventId ? eventCache.get(eventId) : null;

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

      // Resolve review data using category-specific keys
      const reviewData = (() => {
        if (listingId) return reviewCache.get(`experience_${listingId}`);
        if (eventId) return reviewCache.get(`event_${eventId}`);
        if (resolvedStayId) return reviewCache.get(`stay_${resolvedStayId}`);
        return null;
      })();

      return transformBookingData(apiBooking, listingData, eventData, stayData, reviewData);
    } catch (err) {
      console.warn("⚠️ Failed to transform single booking:", apiBooking.orderId, err);
      return null;
    }
  });

  // Filter out any that failed transformation
  return transformed.filter(Boolean);
};

// Transform API booking data to component format
const transformBookingData = (apiBooking, listingData = null, eventData = null, stayData = null, reviewData = null) => {
  const eventDetails = eventData?.event || eventData?.data?.event || eventData?.data || eventData;

  // Extract rating and review count (handles ratingSummary, summary, and direct properties)
  const summary = reviewData?.ratingSummary || reviewData?.summary;
  const rating = summary?.averageRating || 0;
  const reviewCount = summary?.totalReviews || (Array.isArray(reviewData) ? reviewData.length : (Array.isArray(reviewData?.reviews) ? reviewData.reviews.length : 0));

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
    // Treat pending bookings as pending for tab placement
    PENDING: "Pending",
    CONFIRMED: "Upcoming",
    SUCCESS: "Upcoming",
    PAID: "Upcoming",
    BOOKED: "Upcoming",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Cancelled",
    DECLINED: "Cancelled",
  };

  const normalizedOrderStatus = String(apiBooking?.orderStatus || "").toUpperCase().trim();
  let status = statusMap[normalizedOrderStatus] || "Upcoming";

  // Override status based on date to ensure correct tab categorization (Upcoming vs Completed).
  // This ensures stays and experiences only move to Completed after their end date has passed.
  if (status === "Upcoming" || status === "Completed") {
    const stayRooms = Array.isArray(apiBooking?.stayOrderRooms) ? apiBooking.stayOrderRooms : [];
    const roomCheckOutDates = stayRooms
      .map((room) => room?.checkOutDate || room?.checkoutDate || room?.check_out_date)
      .filter(Boolean);
    const roomCheckOutTimes = stayRooms
      .map((room) => room?.checkOutTime || room?.checkoutTime || room?.check_out_time)
      .filter(Boolean);

    const bookingDateStr =
      roomCheckOutDates[0] ||
      apiBooking.checkOutDate ||
      apiBooking.checkoutDate ||
      apiBooking.checkInDate ||
      apiBooking.bookingDate ||
      apiBooking.eventDate ||
      apiBooking.eventDetails?.eventDate ||
      null;

    if (bookingDateStr) {
      // Compare against end-of-experience time if available, otherwise end-of-day
      const deadline = new Date(bookingDateStr);

      const endTimeStr =
        roomCheckOutTimes[0] ||
        apiBooking.timeSlotEndTime ||
        apiBooking.checkOutTime ||
        apiBooking.checkoutTime ||
        apiBooking.endTime ||
        apiBooking.bookingTime;

      if (endTimeStr && typeof endTimeStr === 'string' && endTimeStr.includes(':')) {
        const [hours, minutes, seconds] = endTimeStr.split(':').map(Number);
        deadline.setHours(hours || 0, minutes || 0, seconds || 0, 0);
      } else {
        // Fallback to end-of-day if no specific time is provided
        deadline.setHours(23, 59, 59, 999);
      }

      if (deadline < new Date()) {
        status = "Completed";
      } else {
        status = "Upcoming";
      }
    }
  }

  // Get title - for EVENTS orders, prefer eventTitle; for others, prefer listing data
  // Check if this is an EVENTS order by businessInterestCode
  const isEventOrder =
    apiBooking?.businessInterestCode === "EVENTS" ||
    apiBooking?.businessInterestCode === "EVENT" ||
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
    listingData: listingData || null,
    eventData: eventDetails || null,
    stayData: stayData || null,
    // Include original booking data for details
    bookingData: apiBooking,
    // Include rating data
    rating: rating,
    reviewCount: reviewCount,
  };
};

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "cancelled", label: "Cancelled" },
];

const getResolvedStayId = (bookingData) => {
  if (bookingData?.stayId != null) return bookingData.stayId;
  const rooms = bookingData?.stayOrderRooms || bookingData?.rooms || bookingData?.room || [];
  if (Array.isArray(rooms) && rooms.length > 0) {
    const roomStayId = rooms[0]?.stayId ?? rooms[0]?.stay_id ?? rooms[0]?.propertyId;
    if (roomStayId != null) return roomStayId;
  }
  return bookingData?.propertyId ?? bookingData?.stay_id ?? null;
};

const getBookingGuests = (bookingData) => {
  const guestSource = bookingData?.guests || {};
  const children = Number(
    guestSource?.children ??
    bookingData?.pricing?.childrenCount ??
    bookingData?.childrenCount ??
    bookingData?.childCount ??
    bookingData?.children ??
    0
  ) || 0;
  const adults =
    Number(
      guestSource?.adults ??
      bookingData?.pricing?.adultsCount ??
      bookingData?.adultsCount ??
      bookingData?.adultCount ??
      bookingData?.adults ??
      0
    ) ||
    Math.max(0, (Number(bookingData?.guestCount ?? bookingData?.numberOfGuests ?? 0) || 0) - children);

  const summaryGuestCount =
    Number(bookingData?.bookingSummary?.guestCount ?? bookingData?.pricing?.guestCount ?? guestSource?.guests ?? 0) || 0;
  const resolvedAdults = adults > 0 ? adults : Math.max(0, summaryGuestCount - children);

  return {
    adults: resolvedAdults,
    children,
    infants: 0,
    childAges: [],
  };
};

const buildPendingBookingRestoreState = (booking) => {
  const bookingData = booking?.bookingData || {};
  const businessInterestCode = String(
    bookingData?.businessInterestCode || booking?.category || ""
  ).toUpperCase();
  const isStayOrder = businessInterestCode === "STAYS" || getResolvedStayId(bookingData) != null;
  const guests = getBookingGuests(bookingData);

  if (isStayOrder) {
    const stayId = getResolvedStayId(bookingData);
    if (stayId == null) return null;

    return {
      detailUrl: `/stay-details?id=${encodeURIComponent(stayId)}`,
    };
  }

  const listingId =
    bookingData?.listingId ??
    bookingData?.experienceId ??
    bookingData?.eventId ??
    booking?.listingData?.listingId ??
    booking?.listingData?.id ??
    booking?.eventData?.eventId ??
    booking?.eventData?.id;

  if (listingId == null) return null;

  const isEventOrder =
    businessInterestCode === "EVENTS" ||
    businessInterestCode === "EVENT" ||
    bookingData?.eventId != null;

  return {
    detailUrl: isEventOrder
      ? `/event?id=${encodeURIComponent(listingId)}`
      : buildExperienceUrl(booking?.title || bookingData?.listingTitle || "experience", listingId),
  };
};

const buildPendingBookingFallbackUrl = (booking) => {
  const bookingData = booking?.bookingData || {};
  const stayId = getResolvedStayId(bookingData);
  if (stayId != null) {
    return `/stay-details?id=${encodeURIComponent(stayId)}`;
  }

  const listingId =
    bookingData?.listingId ??
    bookingData?.experienceId ??
    bookingData?.eventId ??
    booking?.listingData?.listingId ??
    booking?.listingData?.id ??
    booking?.eventData?.eventId ??
    booking?.eventData?.id;
  const businessInterestCode = String(
    bookingData?.businessInterestCode ||
    booking?.category ||
    ""
  ).trim().toUpperCase();
  const isEventOrder =
    businessInterestCode === "EVENTS" ||
    businessInterestCode === "EVENT" ||
    bookingData?.eventId != null;

  if (listingId != null) {
    return isEventOrder
      ? `/event?id=${encodeURIComponent(listingId)}`
      : buildExperienceUrl(booking?.title || bookingData?.listingTitle || "experience", listingId);
  }

  return null;
};

const actionsByStatus = {
  Upcoming: [
    { label: "View Details", variant: "primary" },
    { label: "Message Host", variant: "secondary" },
    { label: "Cancel Booking", variant: "secondary" },
  ],
  Completed: [
    { label: "View Details", variant: "primary" },
    { label: "Leave review", variant: "secondary" },
  ],
  Pending: [
    { label: "View Details", variant: "primary" },
  ],
  Cancelled: [
    { label: "View Details", variant: "primary" },
  ],
};

const isPastStayCheckInTime = (booking) => {
  if (!booking) return false;
  const { bookingData, stayData } = booking;

  // Only apply to Stays
  const businessInterestCode = String(bookingData?.businessInterestCode || booking?.category || "").toUpperCase();
  const isStayOrder = businessInterestCode === "STAYS" ||
    bookingData?.stayId != null ||
    (bookingData?.stayOrderRooms && bookingData?.stayOrderRooms.length > 0) ||
    stayData != null;

  if (!isStayOrder) return false;

  const status = booking.statusTone || booking.status?.toLowerCase();
  if (status === "cancelled" || status === "canceled" || status === "completed") {
    return false;
  }

  const checkInDateStr =
    bookingData?.checkInDate ||
    bookingData?.bookingDate ||
    stayData?.checkInDate;

  if (!checkInDateStr) return false;

  const checkInDatetime = new Date(checkInDateStr);

  const checkInTimeStr =
    bookingData?.checkInTime ||
    bookingData?.bookingTime ||
    stayData?.checkInTime ||
    "14:00:00";

  if (checkInTimeStr && typeof checkInTimeStr === 'string' && checkInTimeStr.includes(':')) {
    const parts = checkInTimeStr.split(':').map(Number);
    checkInDatetime.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  } else {
    checkInDatetime.setHours(14, 0, 0, 0);
  }

  return new Date() >= checkInDatetime;
};

const isPastStayCheckOutTime = (booking) => {
  if (!booking) return false;
  const { bookingData, stayData } = booking;

  // Only apply to Stays
  const businessInterestCode = String(bookingData?.businessInterestCode || booking?.category || "").toUpperCase();
  const isStayOrder = businessInterestCode === "STAYS" ||
    bookingData?.stayId != null ||
    (bookingData?.stayOrderRooms && bookingData?.stayOrderRooms.length > 0) ||
    stayData != null;

  if (!isStayOrder) return true; // Non-stays bypass stay checkout restriction

  const checkOutDateStr =
    bookingData?.checkOutDate ||
    bookingData?.endDate ||
    stayData?.checkOutDate;

  if (!checkOutDateStr) return true; // If missing checkout date, don't restrict

  const checkOutDatetime = new Date(checkOutDateStr);

  const checkOutTimeStr =
    bookingData?.checkOutTime ||
    bookingData?.endTime ||
    stayData?.checkOutTime ||
    "11:00:00";

  if (checkOutTimeStr && typeof checkOutTimeStr === 'string' && checkOutTimeStr.includes(':')) {
    const parts = checkOutTimeStr.split(':').map(Number);
    checkOutDatetime.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
  } else {
    checkOutDatetime.setHours(11, 0, 0, 0);
  }

  return new Date() >= checkOutDatetime;
};

const getAllowedActionsForTab = (tabId, booking, orderIdsEligibleForReview) => {
  const baseActions = actionsByStatus[booking?.status] || [];

  let actions = [...baseActions];

  if (tabId === "cancelled") {
    actions = actions.filter((a) => a.label === "View Details");
  } else if (tabId === "pending") {
    const validActions = actions.filter((a) => a.label === "View Details");
    const businessInterestCode = String(
      booking?.bookingData?.businessInterestCode || booking?.category || ""
    ).toUpperCase();
    const isStayOrder =
      businessInterestCode === "STAYS" ||
      getResolvedStayId(booking?.bookingData) != null;
    const isExperienceLikeOrder =
      businessInterestCode === "EXPERIENCE" ||
      businessInterestCode === "EVENTS" ||
      businessInterestCode === "EVENT";

    if ((isStayOrder || isExperienceLikeOrder) && String(booking?.bookingData?.orderStatus || "").toUpperCase() === "PENDING") {
      validActions.unshift({ label: "Check Availability", variant: "secondary" });
    }
    actions = validActions;
  } else if (tabId === "upcoming") {
    actions = actions.filter((a) => a.label !== "Leave review");
  } else if (tabId === "completed") {
    actions = actions.filter((a) => {
      if (a.label !== "Leave review") return true;
      return orderIdsEligibleForReview.has(booking.orderId) && isPastStayCheckOutTime(booking);
    });
  }

  if (isPastStayCheckInTime(booking)) {
    actions = actions.filter((a) => a.label !== "Cancel Booking");
  }

  if (String(booking?.bookingData?.orderStatus || "").toUpperCase() === "PENDING_CONFIRMATION") {
    actions = actions.filter((a) => a.label !== "Cancel Booking");
  }

  return actions;
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
  const [pendingCancellation, setPendingCancellation] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelPreviewLoading, setCancelPreviewLoading] = useState(false);
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [confirmCancelModalVisible, setConfirmCancelModalVisible] = useState(false);
  const [rawBookings, setRawBookings] = useState([]);
  const [rawCompletedBookings, setRawCompletedBookings] = useState([]);
  const [paginatedTransformedBookings, setPaginatedTransformedBookings] = useState([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false); // Track if initial tab has been set

  // Cache of already-transformed bookings keyed by orderId.
  // This prevents re-fetching API data when switching back to a previously loaded tab.
  const transformedCacheRef = React.useRef(new Map());
  // Review modal state (completed orders only)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [bookingToReview, setBookingToReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [orderIdsEligibleForReview, setOrderIdsEligibleForReview] = useState(new Set());

  // Check Availability State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [checkingOrderId, setCheckingOrderId] = useState(null);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationModalData, setValidationModalData] = useState({ title: "", message: "", details: "", isSuccess: false });
  const [validatedBookingId, setValidatedBookingId] = useState(null);
  const [confirmPayModalVisible, setConfirmPayModalVisible] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [bookingToMessage, setBookingToMessage] = useState(null);
  const [hostMessageText, setHostMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);

  const handleMessageHostClick = (booking) => {
    setBookingToMessage(booking);
    setHostMessageText("");
    setMessageModalVisible(true);
  };

  const handleSendMessage = async () => {
    if (!hostMessageText || hostMessageText.trim() === "") return;
    if (!bookingToMessage?.orderId) return;

    setIsSendingMessage(true);
    try {
      await sendOrderMessage(bookingToMessage.orderId, hostMessageText);
      setMessageStatus('success');
      setTimeout(() => setMessageStatus(null), 3000);
      setMessageModalVisible(false);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessageStatus('error');
      setTimeout(() => setMessageStatus(null), 3000);
    } finally {
      setIsSendingMessage(false);
    }
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
          isSuccess: false,
        };
      case "ORDER_NOT_PENDING":
        return {
          title: "Booking is no longer pending",
          message: "This booking cannot be confirmed now because its status has changed.",
          code,
          details: "",
          isSuccess: false,
        };
      case "DATE_UNAVAILABLE":
        return {
          title: "Selected date unavailable",
          message: "The selected date is no longer available.",
          code,
          details: "",
          isSuccess: false,
        };
      case "SLOT_UNAVAILABLE":
        return {
          title: "Selected slot unavailable",
          message: "The selected time slot is no longer available.",
          code,
          details: "",
          isSuccess: false,
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
          isSuccess: false,
        };
      }
      default:
        return {
          title: "Availability check failed",
          message: "We could not validate this booking right now. Please try again.",
          code,
          details: "",
          isSuccess: false,
        };
    }
  };

  const handleCheckAvailability = async (booking) => {
    const pendingRestore = buildPendingBookingRestoreState(booking);
    const redirectUrl = pendingRestore?.detailUrl || buildPendingBookingFallbackUrl(booking);

    if (pendingRestore?.storageState) {
      try {
        localStorage.setItem("frontendPendingBookingState", JSON.stringify(pendingRestore.storageState));
      } catch (error) {
        console.error("Failed to persist pending booking state:", error);
      }
    }

    if (redirectUrl) {
      history.push(redirectUrl, {
        openReserveModal: true,
        source: "check-availability",
        orderId: booking?.orderId,
      });
      return;
    }

    if (isCheckingAvailability) return;
    setIsCheckingAvailability(true);
    setCheckingOrderId(booking.orderId);
    try {
      const response = await validateExperienceOrEventOrder(booking.orderId);
      if (response?.canProceed === true) {
        setSelectedBookingForPayment(booking);
        setConfirmPayModalVisible(true);
        return;
      }

      const firstFailure = Array.isArray(response?.failures) && response.failures.length > 0
        ? response.failures[0]
        : null;

      if (firstFailure) {
        setValidationModalData(mapValidationFailureToFriendlyMessage(firstFailure));
      } else {
        setValidationModalData({
          title: "Availability check failed",
          message: "Selected slot is no longer available",
          details: "",
          isSuccess: false,
        });
      }
      setValidatedBookingId(null);
      setValidationModalVisible(true);
    } catch (error) {
      console.error("Error validating booking:", error);
      const responseData = error?.response?.data;
      if (error?.response?.status === 409 && responseData) {
        const firstFailure = Array.isArray(responseData?.failures) && responseData.failures.length > 0
          ? responseData.failures[0]
          : null;
        if (firstFailure) {
          setValidationModalData(mapValidationFailureToFriendlyMessage(firstFailure));
          setValidatedBookingId(null);
          setValidationModalVisible(true);
          return;
        }
      }
      setValidationModalData({
        title: "Unable to check availability",
        message: error?.message || "Failed to check availability.",
        details: "",
        isSuccess: false,
      });
      setValidatedBookingId(null);
      setValidationModalVisible(true);
    } finally {
      setIsCheckingAvailability(false);
      setCheckingOrderId(null);
    }
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

  const formatMoney = (amount, currency = "INR") => {
    const value = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const openRazorpayForBooking = async (booking) => {
    if (!booking?.orderId || isConfirmingBooking) return;
    setIsConfirmingBooking(true);

    try {
      const orderResponse = await getOrderDetails(booking.orderId);
      const order = orderResponse?.order || orderResponse || {};
      const payment = orderResponse?.payment || order?.payment || {};

      const fallbackAmount =
        Number(payment?.amount) > 0
          ? Number(payment.amount)
          : Math.round(Number(order?.totalPrice || order?.finalAmount || booking?.bookingData?.totalPrice || 0) * 100);

      const session = await initializePendingOrderPayment(booking.orderId, {
        amount: fallbackAmount,
        currency: payment?.currency || order?.currency || booking?.bookingData?.currency || "INR",
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
        currency: session?.payment?.currency || payment?.currency || order?.currency || booking?.bookingData?.currency || "INR",
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
          name: booking?.bookingData?.guest?.name || "",
          email: booking?.bookingData?.guest?.email || "",
          contact: booking?.bookingData?.guest?.phone || "",
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
        //console.log("✅ Fetched review eligibility on mount:", eligibleIds.size, "orders");
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
    const processBookings = () => {
      setLoading(true);
      try {
        let regularRaw = [];
        let completedRaw = [];

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
            regularRaw = filteredBookings.map(enrichRawBooking);
            setRawBookings(regularRaw);
          } else {
            setRawBookings([]);
          }
        } else {
          setRawBookings([]);
        }

        // Handle completed/expired orders separately
        if (propCompletedOrders !== null && propCompletedOrders !== undefined) {
          const completedArray = Array.isArray(propCompletedOrders)
            ? propCompletedOrders
            : [propCompletedOrders];

          // Filter to ensure we only have valid orders
          const validCompletedOrders = completedArray.filter(order => order);

          if (validCompletedOrders.length > 0) {
            completedRaw = validCompletedOrders.map(enrichRawBooking);
            setRawCompletedBookings(completedRaw);
          } else {
            setRawCompletedBookings([]);
          }
        } else {
          setRawCompletedBookings([]);
        }

        // Always open on the Upcoming tab on initial load
        if (!initialTabSet) {
          setActiveTab("upcoming");
          setDisplayedTab("upcoming");
          setInitialTabSet(true);
        }
      } catch (error) {
        console.error("Error processing booking data:", error);
        // Fallback: transform with empty arrays on error
        setRawBookings([]);
        setRawCompletedBookings([]);
      } finally {
        setLoading(false);
      }
    };

    processBookings();
  }, [propBookingData, propCompletedOrders, initialTabSet]);

  const countsByTab = useMemo(() => {
    // Count upcoming, completed (date-overridden), pending, and cancelled from regular bookings
    const categorized = rawBookings.reduce((acc, booking) => {
      const tabId = booking.statusTone === "upcoming" ? "upcoming"
        : booking.statusTone === "completed" ? "completed"
          : booking.statusTone === "pending" ? "pending"
            : "cancelled";
      acc[tabId] = (acc[tabId] || 0) + 1;
      return acc;
    }, {});

    // Add server-side completed orders; also include date-overridden completed from regular bookings
    const dateOverriddenCompleted = categorized.completed || 0;
    if (rawCompletedBookings.length > 0) {
      categorized.completed = rawCompletedBookings.length + dateOverriddenCompleted;
    } else {
      categorized.completed = (completedCount || 0) + dateOverriddenCompleted;
    }

    return tabs.reduce((acc, tab) => {
      acc[tab.id] = categorized[tab.id] || 0;
      return acc;
    }, {});
  }, [rawBookings, rawCompletedBookings, completedCount]);

  const bookingsForTab = useMemo(() => {
    let result = [];
    // For completed tab: merge server-side completed orders + date-overridden ones from regular bookings
    if (displayedTab === "completed") {
      const dateOverridden = rawBookings.filter(
        (b) => b.statusTone === "completed"
      );
      result = [...dateOverridden, ...rawCompletedBookings];
    } else {
      // For upcoming, pending, and cancelled tabs, exclude date-overridden completed bookings
      result = rawBookings.filter((booking) => {
        const tabId = booking.statusTone === "upcoming" ? "upcoming"
          : booking.statusTone === "completed" ? null  // exclude — goes to completed tab
            : booking.statusTone === "pending" ? "pending"
              : "cancelled";
        return tabId === displayedTab;
      });
    }

    // Sort by booking time descending to show latest bookings first
    return [...result].sort((a, b) => {
      // 1. For Cancelled tab, prioritize the cancellation/rejection time if available
      if (displayedTab === "cancelled") {
        const cancelA = a.bookingData?.cancelledAt || a.bookingData?.rejectedAt || a.bookingData?.updatedAt || "";
        const cancelB = b.bookingData?.cancelledAt || b.bookingData?.rejectedAt || b.bookingData?.updatedAt || "";
        if (cancelA !== cancelB) {
          return cancelB.localeCompare(cancelA);
        }
      }

      // 2. Sort by the time the booking was actually MADE (createdAt or orderDate)
      // This ensures "Latest Bookings" appear on top as requested.
      const createdA = a.bookingData?.createdAt || a.bookingData?.orderDate || a.bookingData?.bookedAt || "";
      const createdB = b.bookingData?.createdAt || b.bookingData?.orderDate || b.bookingData?.bookedAt || "";

      if (createdA !== createdB) {
        return createdB.localeCompare(createdA);
      }

      // 3. Fallback to orderId descending (sequential IDs usually represent creation order)
      const idA = parseInt(a.orderId) || 0;
      const idB = parseInt(b.orderId) || 0;
      if (idA !== idB) {
        return idB - idA;
      }

      // 4. Last resort: Sort by the experience/service date
      const dateA = a.bookingData?.checkInDate || a.bookingData?.bookingDate || a.bookingData?.eventDate || "";
      const dateB = b.bookingData?.checkInDate || b.bookingData?.bookingDate || b.bookingData?.eventDate || "";
      return dateB.localeCompare(dateA);
    });
  }, [rawBookings, rawCompletedBookings, displayedTab]);

  // Paginated bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return bookingsForTab.slice(startIndex, startIndex + itemsPerPage);
  }, [bookingsForTab, currentPage]);

  // Lazy transform: only transform bookings on the current page.
  // Uses a cache keyed by orderId so switching back to an already-loaded
  // tab renders instantly with NO skeleton shown.
  useEffect(() => {
    const transformPage = async () => {
      if (paginatedBookings.length === 0) {
        setPaginatedTransformedBookings([]);
        return;
      }

      const cache = transformedCacheRef.current;

      // Check if every booking on this page is already cached
      const allCached = paginatedBookings.every(b => cache.has(String(b.orderId)));

      if (allCached) {
        // Instant render from cache — no skeleton, no API calls
        setPaginatedTransformedBookings(
          paginatedBookings.map(b => cache.get(String(b.orderId)))
        );
        return;
      }

      // Some bookings are not yet cached — transform only the missing ones
      setIsTransforming(true);
      try {
        const missing = paginatedBookings.filter(b => !cache.has(String(b.orderId)));
        const missingRaw = missing.map(b => b.bookingData);
        const freshTransformed = await transformMultipleBookings(missingRaw);

        // Store the newly transformed bookings in the cache
        freshTransformed.forEach(t => {
          if (t && t.orderId != null) {
            cache.set(String(t.orderId), t);
          }
        });

        // Build the full ordered result from cache
        const result = paginatedBookings.map(b => cache.get(String(b.orderId))).filter(Boolean);
        setPaginatedTransformedBookings(result);
      } catch (err) {
        console.error("Error transforming page:", err);
      } finally {
        setIsTransforming(false);
      }
    };
    transformPage();
  }, [paginatedBookings]);

  const totalPages = Math.ceil(bookingsForTab.length / itemsPerPage);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    scrollToTop();
  };

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    scrollToTop();
  };

  const emptyState = emptyStateCopy[displayedTab] || emptyStateCopy.upcoming;
  const cancelPreviewRows = getCancelPreviewRows(cancelPreview);
  const confirmCancelSummaryRows = getConfirmCancelSummaryRows(cancelPreview);

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
    if (nextTab === "completed" && rawCompletedBookings.length === 0 && !loadingCompleted) {
      setLoadingCompleted(true);
      try {
        const [completedOrdersData, eligibleData] = await Promise.all([
          getCompletedOrders(1, 100),
          getEligibleBookings().catch(() => []),
        ]);
        //console.log("✅ Fetched completed orders:", completedOrdersData);

        if (Array.isArray(completedOrdersData) && completedOrdersData.length > 0) {
          const completedRaw = completedOrdersData.filter(order => order).map(enrichRawBooking);
          setRawCompletedBookings(completedRaw);
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

  const handleCancelBookingClick = async (booking) => {
    setBookingToCancel(booking);
    setCancelReason("");
    setSelectedReason("");
    setPendingCancellation(null);
    setCancelError(null);
    setCancelPreview(null);
    setCancelPreviewLoading(Boolean(booking?.orderId));

    if (booking?.orderId) {
      try {
        const preview = await getOrderCancelPreview(booking.orderId);
        setCancelPreview(preview);
        /*console.log("🧾 Event cancel preview:", {
          orderId: booking.orderId,
          preview,
          booking,
        });*/
      } catch (e) {
        console.warn("⚠️ Failed to fetch cancel preview:", e?.response?.data || e?.message || e);
      } finally {
        setCancelPreviewLoading(false);
      }
    } else {
      setCancelPreviewLoading(false);
    }

    setCancelModalVisible(true);
  };

  const executeCancelBooking = async () => {
    const booking = pendingCancellation?.booking || bookingToCancel;
    const reason = pendingCancellation?.reason || cancelReason;

    // Use finalReason if not passed in pendingCancellation
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

    if (!booking || !String(finalReason || "").trim()) {
      setCancelError("Please provide a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const cancelRequestBody = {
        reason: String(finalReason).trim(),
        adminOverride: false,
      };

      const orderIdForCancel = booking.orderId;
      const cancelUrl = `/api/orders/${orderIdForCancel}/cancel`;
      /*console.log("🧾 Cancel booking request:", {
        url: cancelUrl,
        orderId: orderIdForCancel,
        body: cancelRequestBody,
        booking,
      });*/

      const isEventOrder = booking?.category === "EVENTS" || booking?.bookingData?.eventId != null;

      // Call the correct cancel API
      if (isEventOrder) {
        await cancelEventOrder(orderIdForCancel, cancelRequestBody);
      } else {
        await cancelOrder(orderIdForCancel, cancelRequestBody);
      }

      // Update the booking status in the raw bookings
      setRawBookings((prevBookings) => {
        return prevBookings.map((booking) => {
          if (booking.orderId === orderIdForCancel) {
            // Update the booking to cancelled status
            const updatedBooking = {
              ...booking,
              status: "Cancelled",
              statusTone: "cancelled",
              bookingData: {
                ...booking.bookingData,
                orderStatus: "CANCELLED",
                cancelledAt: new Date().toISOString(),
              },
            };
            return updatedBooking;
          }
          return booking;
        });
      });

      // Invalidate this booking in the transform cache so the cancelled tab shows fresh data
      transformedCacheRef.current.delete(String(orderIdForCancel));

      // Switch to cancelled tab if not already there, using handleTabChange for proper animation
      if (activeTab !== "cancelled") {
        handleTabChange("cancelled");
      }

      // Close modal and reset state
      setConfirmCancelModalVisible(false);
      setCancelModalVisible(false);
      setBookingToCancel(null);
      setCancelReason("");
      setPendingCancellation(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setCancelError(getFriendlyCancellationError(error));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelModalVisible(false);
    setBookingToCancel(null);
    setCancelReason("");
    setSelectedReason("");
    setPendingCancellation(null);
    setCancelError(null);
    setCancelPreview(null);
    setCancelPreviewLoading(false);
    setConfirmCancelModalVisible(false);
  };

  const handleConfirmCancel = () => {
    if (!bookingToCancel || (!selectedReason && !cancelReason.trim())) {
      setCancelError("Please select or enter a reason for cancellation");
      return;
    }

    const finalReason = selectedReason
      ? (cancelReason.trim() ? `${selectedReason} - ${cancelReason.trim()}` : selectedReason)
      : cancelReason.trim();

    setPendingCancellation({
      booking: bookingToCancel,
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
        eventId: bookingToReview.bookingData?.eventId,
        stayId: bookingToReview.bookingData?.stayId ||
          (bookingToReview.bookingData?.stayOrderRooms && bookingToReview.bookingData.stayOrderRooms[0]?.stayId),
      });

      // Update eligibility immediately
      setOrderIdsEligibleForReview((prev) => {
        const next = new Set(prev);
        next.delete(bookingToReview.orderId);
        return next;
      });

      // Refresh review data for the specific listing to update the card's rating/count
      const listingIdToRefresh = bookingToReview.bookingData?.listingId ||
        bookingToReview.bookingData?.experienceId ||
        bookingToReview.listingId;
      const eventIdToRefresh = bookingToReview.bookingData?.eventId || bookingToReview.eventId;
      const stayIdToRefresh = bookingToReview.bookingData?.stayId ||
        (bookingToReview.bookingData?.stayOrderRooms && bookingToReview.bookingData.stayOrderRooms[0]?.stayId) ||
        bookingToReview.stayId;

      try {
        let freshReviewData = null;
        if (listingIdToRefresh) freshReviewData = await getListingReviews(listingIdToRefresh);
        else if (eventIdToRefresh) freshReviewData = await getEventReviews(eventIdToRefresh);
        else if (stayIdToRefresh) freshReviewData = await getStayReviews(stayIdToRefresh);

        if (freshReviewData) {
          // Robustly extract rating and count (handles both object and plain array responses)
          const summary = freshReviewData?.ratingSummary || freshReviewData?.summary;
          const rating = summary?.averageRating ||
            (Array.isArray(freshReviewData) && freshReviewData.length > 0
              ? (freshReviewData.reduce((acc, r) => acc + (r.rating || 0), 0) / freshReviewData.length)
              : 0);
          const reviewCount = summary?.totalReviews ||
            (Array.isArray(freshReviewData) ? freshReviewData.length :
              (Array.isArray(freshReviewData?.reviews) ? freshReviewData.reviews.length : 0));

          const updateBooking = (prev) => prev.map(b => {
            if (b.orderId === bookingToReview.orderId) {
              return { ...b, rating, reviewCount };
            }
            return b;
          });

          setPaginatedTransformedBookings(updateBooking);
          //console.log(`✅ UI updated for order ${bookingToReview.orderId}: ${rating} stars, ${reviewCount} reviews`);
        }
      } catch (refreshErr) {
        console.warn("⚠️ Failed to refresh review summary after submission:", refreshErr);
      }

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

  // Show loading state while fetching order list data only on initial load
  // Do NOT block on isTransforming — that is handled inline in the list area
  if ((loading && rawBookings.length === 0) || (propBookingData === null && rawBookings.length === 0)) {
    return (
      <div style={{ padding: "4rem 2rem", minHeight: "80vh" }}>
        <LoadingSkeleton variant="bookings" count={3} />
      </div>
    );
  }

  return (
    <div className={cn("section-pd", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.headerWrapper}>
          <div className={styles.heading}>
            <h1 className={cn("h2", styles.title)} style={{ fontFamily: "Cormorant Garamond, serif" }}>
              My <span style={{ color: "#0097B2", fontStyle: "italic" }}>bookings</span>
            </h1>
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
            <div style={{ padding: "1rem 0" }}>
              <LoadingSkeleton variant="bookingsList" count={3} />
            </div>
          ) : isTransforming ? (
            <div style={{ padding: "1rem 0" }}>
              <LoadingSkeleton variant="bookingsList" count={3} />
            </div>
          ) : bookingsForTab.length > 0 ? (
            <div className={styles.list}>
              {paginatedTransformedBookings.map((booking) => (
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
                          {((Number(booking.bookingData?.totalAmount) === 0) ||
                            (Number(booking.bookingData?.totalPrice) === 0) ||
                            (Number(booking.bookingData?.finalAmount) === 0) ||
                            (Number(booking.bookingData?.amount) === 0)) && (
                              <>
                                <span className={styles.dot} aria-hidden="true">
                                  •
                                </span>
                                <span className={styles.category} style={{ color: "#4584FF" }}>
                                  Free Reservation
                                </span>
                              </>
                            )}
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
                                backgroundColor: (booking.status === "Completed" || displayedTab === "completed") ? "#E3F2FD" :
                                  (String(booking.bookingData.orderStatus || "").toUpperCase() === "CONFIRMED") ? "#E8F5E9" :
                                    (String(booking.bookingData.orderStatus || "").toUpperCase() === "PENDING") ? "#FFF3E0" :
                                      (String(booking.bookingData.orderStatus || "").toUpperCase() === "CANCELLED" || String(booking.bookingData.orderStatus || "").toUpperCase() === "CANCELED") ? "#FFEBEE" : "#F3F4F6",
                                color: (booking.status === "Completed" || displayedTab === "completed") ? "#1565C0" :
                                  (String(booking.bookingData.orderStatus || "").toUpperCase() === "CONFIRMED") ? "#2E7D32" :
                                    (String(booking.bookingData.orderStatus || "").toUpperCase() === "PENDING") ? "#E65100" :
                                      (String(booking.bookingData.orderStatus || "").toUpperCase() === "CANCELLED" || String(booking.bookingData.orderStatus || "").toUpperCase() === "CANCELED") ? "#C62828" : "#6B7280",
                              }}>
                                {(booking.status === "Completed" || displayedTab === "completed") ? "COMPLETED" : (
                                  String(booking.bookingData?.orderStatus || "").toUpperCase()
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className={styles.cardTitle}>{booking.title}</h2>
                        {booking.rating > 0 && (
                          <div className={styles.ratingRow}>
                            <Rating className={styles.rating} rating={booking.rating} readonly={true} />
                            <span className={styles.reviewCount}>({booking.reviewCount})</span>
                          </div>
                        )}
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
                        {getAllowedActionsForTab(displayedTab, booking, orderIdsEligibleForReview).map((action) => {
                          if (action.label === "View Details") {
                            // Pass businessInterestCode (category) to determine which API to use
                            const isEvent = booking.category === "EVENTS" ||
                              booking.bookingData?.eventId ||
                              booking.bookingData?.businessInterestCode === "EVENTS";
                            const search = isEvent
                              ? `?id=${encodeURIComponent(booking.id)}&type=event`
                              : `?id=${encodeURIComponent(booking.id)}`;
                            return (
                              <Link
                                key={`${booking.id}-${action.label}`}
                                to={{
                                  pathname: "/viewdetails",
                                  search,
                                  state: { sourceTab: displayedTab },
                                }}
                                className={getButtonClassName(action.variant)}
                              >
                                {action.label}
                              </Link>
                            );
                          }
                          if (action.label === "Check Availability") {
                            const isChecking = isCheckingAvailability && checkingOrderId === booking.orderId;
                            return (
                              <button
                                type="button"
                                key={`${booking.id}-${action.label}`}
                                className={getButtonClassName(action.variant)}
                                onClick={() => handleCheckAvailability(booking)}
                                disabled={isCheckingAvailability}
                              >
                                {isChecking ? "Checking..." : action.label}
                              </button>
                            );
                          }
                          if (action.label === "Message Host") {
                            return (
                              <button
                                type="button"
                                key={`${booking.id}-${action.label}`}
                                className={getButtonClassName(action.variant)}
                                onClick={() => handleMessageHostClick(booking)}
                              >
                                {action.label}
                              </button>
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
                <Link to="/" className="button">
                  Explore all
                </Link>
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
        <div className={styles.confirmCancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>Confirm Cancellation</h2>
            <p className={styles.cancelModalDescription}>
              {bookingToCancel
                ? `Cancel "${bookingToCancel.title}" and apply the previewed cancellation policy?`
                : "Confirm this cancellation?"}
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
                  <span className={styles.confirmCancelSummaryLabel}>Important</span>
                  <span className={styles.confirmCancelSummaryValue}>
                    This cancellation cannot be undone.
                  </span>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#E65100", fontWeight: 500 }}>
                Cancellation preview is unavailable right now. You can go back and try again.
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
              disabled={isCancelling || cancelPreviewLoading || confirmCancelSummaryRows.length === 0}
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        visible={reviewModalVisible}
        onClose={handleCloseReviewModal}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent} data-review-modal-content>
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
                burstContainerSelector='[data-review-modal-content]'
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

      <Modal
        visible={validationModalVisible}
        onClose={() => setValidationModalVisible(false)}
        outerClassName={styles.cancelModalOuter}
      >
        <div className={styles.cancelModalContent}>
          <div className={styles.cancelModalHeader}>
            <h2 className={styles.cancelModalTitle}>
              {validationModalData.title}
            </h2>
            <p className={styles.cancelModalDescription}>
              {validationModalData.message}
            </p>
            {validationModalData.details && (
              <p className={styles.cancelModalDescription} style={{ marginTop: '8px' }}>
                {validationModalData.details}
              </p>
            )}
          </div>
          <div className={styles.cancelModalFooter}>
            <button
              type="button"
              className={cn("button-stroke", styles.cancelModalBtn)}
              onClick={() => setValidationModalVisible(false)}
            >
              {validationModalData.isSuccess ? "Cancel" : "Close"}
            </button>
            {validationModalData.isSuccess && (
              <Link
                to={{
                  pathname: "/viewdetails",
                  search: `?id=${encodeURIComponent(validatedBookingId)}`,
                  state: { sourceTab: displayedTab },
                }}
                className={cn("button", styles.cancelModalBtn)}
                onClick={() => setValidationModalVisible(false)}
              >
                Continue to Payment
              </Link>
            )}
          </div>
        </div>
      </Modal>

      {/* Slot Available Confirmation Modal */}
      <Modal
        visible={confirmPayModalVisible}
        onClose={() => {
          if (!isConfirmingBooking) setConfirmPayModalVisible(false);
        }}
        outerClassName={styles.slotModalOuter}
      >
        <div className={styles.cancelModalContent} style={{ maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className={styles.cancelModalHeader} style={{ flexShrink: 0, padding: "32px 32px 16px" }}>
            <h2 className={styles.cancelModalTitle} style={{ color: "#0097B2" }}>Slot Available</h2>
            <p className={styles.cancelModalDescription} style={{ marginBottom: 0 }}>
              Your selected experience slot is currently available.
              You can proceed with payment to confirm your booking.
            </p>
          </div>

          <div className={styles.cancelModalBody} style={{ flex: "1 1 auto", overflowY: "auto", padding: "0 32px 16px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              margin: "4px 0 16px",
              textAlign: "left"
            }}>
              {/* Left Column: Booking Summary */}
              <div style={{
                background: "rgba(244, 245, 246, 0.03)",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid rgba(226, 232, 240, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", borderBottom: "1px solid rgba(226, 232, 240, 0.08)", paddingBottom: "8px", margin: 0 }}>
                  Booking Summary
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ color: "#777E90" }}>Experience:</span>
                    <span style={{ fontWeight: "500", textAlign: "right" }}>{selectedBookingForPayment?.title}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#777E90" }}>Date:</span>
                    <span style={{ fontWeight: "500" }}>{selectedBookingForPayment?.bookingData?.bookingDate || selectedBookingForPayment?.startDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#777E90" }}>Time Slot:</span>
                    <span style={{ fontWeight: "500" }}>
                      {selectedBookingForPayment?.bookingData?.bookingTime || selectedBookingForPayment?.bookingData?.bookingSlot?.name || "Confirmed Slot"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#777E90" }}>Guests:</span>
                    <span style={{ fontWeight: "500" }}>
                      {(() => {
                        const adults = selectedBookingForPayment?.bookingData?.adultsCount > 0 ? selectedBookingForPayment.bookingData.adultsCount : Math.max(0, (selectedBookingForPayment?.bookingData?.guestCount || 0) - (selectedBookingForPayment?.bookingData?.childrenCount || 0));
                        const children = selectedBookingForPayment?.bookingData?.childrenCount || 0;
                        if (adults > 0 || children > 0) {
                          return `${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} Child${children !== 1 ? "ren" : ""}` : ""}`;
                        }
                        return `${selectedBookingForPayment?.bookingData?.guestCount || 0} Guest${selectedBookingForPayment?.bookingData?.guestCount === 1 ? "" : "s"}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Price Details */}
              <div style={{
                background: "rgba(244, 245, 246, 0.03)",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid rgba(226, 232, 240, 0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px"
              }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", borderBottom: "1px solid rgba(226, 232, 240, 0.08)", paddingBottom: "8px", margin: 0, marginBottom: "12px" }}>
                    Price Details
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                    {/* Base Price */}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#777E90" }}>Base Price:</span>
                      <span>{formatMoney(selectedBookingForPayment?.bookingData?.basePrice, selectedBookingForPayment?.bookingData?.currency)}</span>
                    </div>

                    {/* Add-ons detailed list */}
                    {(() => {
                      const addons = selectedBookingForPayment?.bookingData?.addons || selectedBookingForPayment?.bookingData?.selectedAddons || [];
                      if (addons && addons.length > 0) {
                        return (
                          <>
                            {addons.map((addon, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "12px", fontStyle: "italic" }}>
                                <span style={{ color: "#777E90" }}>+ {addon.addonName || addon.name} (x{addon.quantity || 1})</span>
                                <span>{formatMoney((parseFloat(addon.addonPrice || addon.price || 0) * (addon.quantity || 1)), selectedBookingForPayment?.bookingData?.currency)}</span>
                              </div>
                            ))}
                            {selectedBookingForPayment?.bookingData?.addonsTotal > 0 && (
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#777E90" }}>Add-ons Total:</span>
                                <span>{formatMoney(selectedBookingForPayment?.bookingData?.addonsTotal, selectedBookingForPayment?.bookingData?.currency)}</span>
                              </div>
                            )}
                          </>
                        );
                      }
                      return null;
                    })()}

                    {/* Subtotal */}
                    {selectedBookingForPayment?.bookingData?.subtotal > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#777E90" }}>Subtotal:</span>
                        <span>{formatMoney(selectedBookingForPayment?.bookingData?.subtotal, selectedBookingForPayment?.bookingData?.currency)}</span>
                      </div>
                    )}

                    {/* Discounts */}
                    {selectedBookingForPayment?.bookingData?.discountAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#FF6A55" }}>
                        <span>Discount:</span>
                        <span>-{formatMoney(selectedBookingForPayment?.bookingData?.discountAmount, selectedBookingForPayment?.bookingData?.currency)}</span>
                      </div>
                    )}

                    {/* Taxes */}
                    {selectedBookingForPayment?.bookingData?.taxAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#777E90" }}>Taxes:</span>
                        <span>{formatMoney(selectedBookingForPayment?.bookingData?.taxAmount, selectedBookingForPayment?.bookingData?.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Payable */}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(226, 232, 240, 0.08)", paddingTop: "8px", fontSize: "16px", fontWeight: "600", margin: 0 }}>
                  <span>{selectedBookingForPayment?.bookingData?.orderStatus === "PENDING" || selectedBookingForPayment?.status === "Pending" ? "Amount Payable:" : "Total Amount:"}</span>
                  <span style={{ color: "#0097B2" }}>{formatMoney(selectedBookingForPayment?.bookingData?.totalPrice || selectedBookingForPayment?.bookingData?.finalAmount, selectedBookingForPayment?.bookingData?.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cancelModalFooter} style={{ flexShrink: 0 }}>
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
                await openRazorpayForBooking(selectedBookingForPayment);
              }}
              disabled={isConfirmingBooking}
              style={{ backgroundColor: "#0097B2", borderColor: "#0097B2" }}
            >
              {isConfirmingBooking ? "Initializing..." : "Pay Now"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        visible={messageModalVisible}
        onClose={() => !isSendingMessage && setMessageModalVisible(false)}
        outerClassName={styles.confirmCancelModalOuter}
      >
        <div className={styles.confirmCancelModalContent}>
          <div className={styles.cancelModalHeader} style={{ paddingBottom: '16px', borderBottom: '1px solid #E6E8EC' }}>
            <h2 className={styles.cancelModalTitle} style={{ fontSize: '24px', marginBottom: '8px' }}>Message Host</h2>
            <p className={styles.cancelModalDescription} style={{ color: '#777E90', fontSize: '14px' }}>
              {bookingToMessage?.title}
            </p>
          </div>

          <div className={styles.cancelModalBody} style={{ padding: '24px 32px' }}>
            <div style={{ marginBottom: "0" }}>
              <label className={styles.cancelModalLabel} style={{ fontWeight: '600', marginBottom: '12px', display: 'block', fontSize: '14px' }}>
                Your message
              </label>
              <textarea
                className={styles.cancelModalTextarea}
                placeholder="Write your message here..."
                value={hostMessageText}
                onChange={(e) => setHostMessageText(e.target.value)}
                disabled={isSendingMessage}
                style={{ minHeight: '120px', resize: 'none', padding: '16px', borderRadius: '12px', border: '1px solid #E6E8EC', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className={styles.cancelModalFooter} style={{ padding: '24px 32px', borderTop: '1px solid #E6E8EC', display: 'flex', gap: '16px', justifyContent: 'flex-end', background: '#F4F5F6' }}>
            <button
              className={cn("button-stroke")}
              style={{ flex: 1, borderRadius: '24px', height: '48px', margin: 0 }}
              onClick={() => setMessageModalVisible(false)}
              disabled={isSendingMessage}
            >
              Cancel
            </button>
            <button
              className={cn("button")}
              style={{ flex: 1, borderRadius: '24px', height: '48px', backgroundColor: '#0097B2', color: 'white', border: 'none', margin: 0 }}
              onClick={handleSendMessage}
              disabled={isSendingMessage || !hostMessageText.trim()}
            >
              {isSendingMessage ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </Modal>

      {messageStatus && (
        <div style={{
          position: "fixed",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          background: messageStatus === 'error' ? "#FF5A5F" : "#222222",
          color: "#FFFFFF",
          padding: "12px 24px",
          borderRadius: "100px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {messageStatus === 'success' ? "Message sent successfully!" : "Failed to send message. Please try again."}
        </div>
      )}
    </div>
  );
};

export default Main;


