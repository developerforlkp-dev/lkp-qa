import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import cn from "classnames";
import styles from "./ExperienceCheckout.module.sass";
import Control from "../../components/Control";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";
import HeadOptions from "../../components/PriceDetails/HeadOptions";
import ConfirmAndPay from "../../components/ConfirmAndPay";
import PriceDetails from "../../components/PriceDetails";
import { getOrderDetails, getStayDetails, getListingAddons, getEventAddons } from "../../utils/api";
import { buildExperienceUrl } from "../../utils/experienceUrl";
import {
  getPendingPayment,
  hydratePendingPaymentFromOrder,
  isExpiredHold,
  isPendingCheckoutComplete,
  isFailedPaymentStatus,
} from "../../utils/paymentSession";

const formatImageUrl = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  const [pathPart, queryPart] = raw.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const getHostName = (...sources) => {
  for (const source of sources) {
    if (!source) continue;
    const firstName = source?.firstName || source?.host?.firstName || "";
    const lastName = source?.lastName || source?.host?.lastName || "";
    const combinedName = `${firstName} ${lastName}`.trim();

    const candidates = [
      source?.displayName,
      source?.name,
      source?.businessName,
      source?.primaryContactName,
      source?.contactInformation?.primaryContactName,
      source?.primaryContact?.name,
      source?.hostName,
      source?.host?.displayName,
      source?.host?.name,
      source?.host?.businessName,
      source?.host?.hostName,
      combinedName,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return "Host";
};

const getHostAvatar = (...sources) => {
  for (const source of sources) {
    if (!source) continue;
    const candidates = [
      source?.profilePhotoUrl,
      source?.host?.profilePhotoUrl,
      source?.picture,
      source?.avatar,
      source?.profileImage,
      source?.profileImageUrl,
      source?.profilePhoto,
      source?.image,
      source?.hostAvatar,
      source?.host?.picture,
      source?.host?.avatar,
      source?.host?.profileImage,
      source?.host?.profileImageUrl,
      source?.host?.profilePhoto,
      source?.host?.image,
      source?.host?.hostAvatar,
    ];

    for (const candidate of candidates) {
      const formatted = formatImageUrl(candidate);
      if (formatted) return formatted;
    }
  }

  return null;
};


const formatMoneyLabel = (currency, amount) => `${currency} ${Number(amount || 0).toFixed(2)}`;
const toPositiveNumber = (...values) => {
  for (const value of values) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue;
    }
  }
  return 0;
};

const toFiniteNumberOrNull = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }
  return null;
};

const hasDefinedValue = (...values) =>
  values.some((value) => value !== null && value !== undefined && value !== "");

const getStableDisplayPercent = ({ preferredRate = 0, fallbackRate = 0, tolerance = 0.011 }) => {
  const preferred = Number(preferredRate);
  const fallback = Number(fallbackRate);

  if (Number.isFinite(preferred) && preferred > 0) {
    if (!Number.isFinite(fallback) || fallback <= 0) {
      return preferred;
    }

    if (Math.abs(preferred - fallback) <= tolerance) {
      return preferred;
    }

    if (preferred.toFixed(2) === fallback.toFixed(2)) {
      return preferred;
    }
  }

  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
};

const buildChildPricingBreakdown = ({
  childrenCount,
  childAges,
  pricing,
  bookingData,
  adultPrice,
}) => {
  const count = Number(childrenCount || 0);
  if (count <= 0) return [];

  const rawChildAges = Array.isArray(childAges) && childAges.length > 0
    ? childAges
    : (Array.isArray(bookingData?.childAges) && bookingData.childAges.length > 0
      ? bookingData.childAges
      : (Array.isArray(bookingData?.guests?.childAges) && bookingData.guests.childAges.length > 0
        ? bookingData.guests.childAges
        : (Array.isArray(pricing?.childAges) ? pricing.childAges : [])));

  // Extract tiers from any possible location
  const tiersCandidates = [
    pricing?.childPricingTiers,
    pricing?.child_pricing_tiers,
    bookingData?.childPricingTiers,
    bookingData?.child_pricing_tiers,
    bookingData?.pricing?.childPricingTiers,
    bookingData?.pricing?.child_pricing_tiers,
    bookingData?.selectedTicket?.childPricingTiers,
    bookingData?.selectedTicket?.child_pricing_tiers,
    bookingData?.selectedSlot?.childPricingTiers,
    bookingData?.selectedSlot?.child_pricing_tiers,
    bookingData?.listing?.childPricingTiers,
    bookingData?.event?.childPricingTiers,
    bookingData?.selectedTier?.childPricingTiers,
  ];
  let tiers = [];
  for (const tc of tiersCandidates) {
    if (Array.isArray(tc) && tc.length > 0) {
      tiers = tc;
      break;
    }
  }

  const childAgeFrom = toFiniteNumberOrNull(
    pricing?.childAgeFrom,
    bookingData?.childAgeFrom,
    bookingData?.selectedSlot?.childAgeFrom,
    bookingData?.listing?.childAgeFrom,
    bookingData?.selectedTicket?.childAgeFrom,
    bookingData?.pricing?.childAgeFrom
  );
  const childAgeTo = toFiniteNumberOrNull(
    pricing?.childAgeTo,
    bookingData?.childAgeTo,
    bookingData?.selectedSlot?.childAgeTo,
    bookingData?.listing?.childAgeTo,
    bookingData?.selectedTicket?.childAgeTo,
    bookingData?.pricing?.childAgeTo
  );
  const hasAgeRange = childAgeFrom != null && childAgeTo != null && childAgeTo >= childAgeFrom;

  const childPriceCandidates = [
    pricing?.baseChildPricePerChild,
    pricing?.childPricePerChild,
    bookingData?.pricing?.baseChildPricePerChild,
    bookingData?.pricing?.childPricePerChild,
    bookingData?.childPricePerChild,
    bookingData?.priceDetails?.childPricePerChild,
    bookingData?.orderRequest?.childPricePerChild,
    bookingData?.selectedTicket?.childPrice,
    bookingData?.selectedTicket?.child_price,
    bookingData?.selectedSlot?.childPricePerChild,
    bookingData?.selectedSlot?.childPrice,
    bookingData?.listing?.childPricePerChild,
    bookingData?.listing?.childPrice,
  ];
  const hasExplicitChildPrice = hasDefinedValue(...childPriceCandidates);
  const resolvedChildPrice = toFiniteNumberOrNull(...childPriceCandidates);
  const flatChildPrice = hasExplicitChildPrice ? (resolvedChildPrice ?? 0) : adultPrice;

  const allowChildPricing = Boolean(
    (
      pricing?.allowChildPricing ??
      pricing?.childPricingAllowed ??
      bookingData?.allowChildPricing ??
      bookingData?.childPricingAllowed ??
      bookingData?.selectedSlot?.allowChildPricing ??
      bookingData?.selectedSlot?.childPricingAllowed ??
      bookingData?.selectedTicket?.allowChildPricing ??
      bookingData?.listing?.allowChildPricing
    ) ||
    hasExplicitChildPrice ||
    tiers.length > 0
  );

  const groups = {};

  for (let i = 0; i < count; i++) {
    const rawAge = rawChildAges[i];
    const age = rawAge != null && rawAge !== "" && !isNaN(Number(rawAge)) ? Number(rawAge) : null;

    let groupKey = "";
    let ageRange = null;
    let unitPrice = flatChildPrice;
    let isFree = false;
    let sortOrder = 50;

    if (tiers.length > 0) {
      if (age !== null) {
        const matchedTier = tiers.find((t) => {
          const from = toFiniteNumberOrNull(t?.ageFrom, t?.age_from);
          const to = toFiniteNumberOrNull(t?.ageTo, t?.age_to);
          if (from == null || to == null) return false;
          return age >= from && age <= to;
        });

        if (matchedTier) {
          const from = toFiniteNumberOrNull(matchedTier?.ageFrom, matchedTier?.age_from) ?? 0;
          const to = toFiniteNumberOrNull(matchedTier?.ageTo, matchedTier?.age_to) ?? 100;
          ageRange = `${from}–${to} yrs`;
          unitPrice = Number(matchedTier?.pricePerChild ?? matchedTier?.price_per_child ?? matchedTier?.price ?? 0);
          isFree = unitPrice === 0;
          groupKey = `tier_${from}_${to}_${unitPrice}`;
          sortOrder = from;
        } else {
          const minAge = Math.min(...tiers.map((t) => toFiniteNumberOrNull(t?.ageFrom, t?.age_from) ?? 0));
          const maxAge = Math.max(...tiers.map((t) => toFiniteNumberOrNull(t?.ageTo, t?.age_to) ?? 100));

          if (age < minAge) {
            ageRange = minAge === 1 ? "Under 1 yr" : (minAge > 0 ? `0–${minAge - 1} yrs` : `< ${minAge} yrs`);
            unitPrice = 0;
            isFree = true;
            groupKey = `free_under_${minAge}_0`;
            sortOrder = -1;
          } else if (age > maxAge) {
            ageRange = `> ${maxAge} yrs`;
            unitPrice = adultPrice;
            isFree = false;
            groupKey = `above_${maxAge}_${adultPrice}`;
            sortOrder = 900 + maxAge;
          } else {
            ageRange = `Age ${age}`;
            unitPrice = flatChildPrice;
            isFree = unitPrice === 0;
            groupKey = `age_${age}_${unitPrice}`;
            sortOrder = age;
          }
        }
      } else {
        unitPrice = flatChildPrice;
        isFree = unitPrice === 0;
        groupKey = `tier_default_${unitPrice}`;
        sortOrder = 100;
      }
    } else if (allowChildPricing && hasAgeRange) {
      if (age !== null) {
        if (age < childAgeFrom) {
          ageRange = childAgeFrom === 1 ? "Under 1 yr" : (childAgeFrom > 0 ? `0–${childAgeFrom - 1} yrs` : `< ${childAgeFrom} yrs`);
          unitPrice = 0;
          isFree = true;
          groupKey = `free_under_${childAgeFrom}_0`;
          sortOrder = -1;
        } else if (age > childAgeTo) {
          ageRange = `> ${childAgeTo} yrs`;
          unitPrice = adultPrice;
          isFree = false;
          groupKey = `above_${childAgeTo}_${adultPrice}`;
          sortOrder = 900 + childAgeTo;
        } else {
          ageRange = `${childAgeFrom}–${childAgeTo} yrs`;
          unitPrice = flatChildPrice;
          isFree = unitPrice === 0;
          groupKey = `range_${childAgeFrom}_${childAgeTo}_${unitPrice}`;
          sortOrder = childAgeFrom;
        }
      } else {
        ageRange = `${childAgeFrom}–${childAgeTo} yrs`;
        unitPrice = flatChildPrice;
        isFree = unitPrice === 0;
        groupKey = `range_${childAgeFrom}_${childAgeTo}_${unitPrice}`;
        sortOrder = childAgeFrom;
      }
    } else {
      ageRange = hasAgeRange ? `${childAgeFrom}–${childAgeTo} yrs` : null;
      unitPrice = flatChildPrice;
      isFree = unitPrice === 0;
      groupKey = `flat_${ageRange || "default"}_${unitPrice}`;
      sortOrder = 50;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = {
        ageRange,
        unitPrice,
        isFree,
        count: 0,
        sortOrder,
      };
    }
    groups[groupKey].count += 1;
  }

  return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
};


const Checkout = () => {
  const location = useLocation();
  const history = useHistory();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingData, setBookingData] = useState(location.state?.bookingData || null);
  const [paymentData, setPaymentData] = useState(location.state?.paymentData || null);
  const [checkingPayment, setCheckingPayment] = useState(location.state?.bookingData ? false : true);
  const [stayImageUrl, setStayImageUrl] = useState(null);
  const [addonDetails, setAddonDetails] = useState([]);
  const [reviewsData, setReviewsData] = useState({ rating: null, count: 0 });
  const [messageText, setMessageText] = useState("");
  const [guestDetails, setGuestDetails] = useState({
    title: "Mr",
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    countryCode: "+91",
    additionalGuests: [],
    gstDetails: { companyName: "", gstNumber: "" },
  });
  const [guestErrors, setGuestErrors] = useState({});

  const handleGuestValidationFailed = (errors, firstErrorField) => {
    setGuestErrors(errors || {});
    if (firstErrorField) {
      setTimeout(() => {
        const el = document.getElementById(firstErrorField);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
        }
      }, 100);
    }
  };

  // Initialize add-ons from location state or bookingData
  useEffect(() => {
    const list = location.state?.addOns || bookingData?.selectedAddOns || bookingData?.addOns;
    if (Array.isArray(list) && list.length > 0) {
      setSelectedAddOns(list);
    }
  }, [location.state, bookingData]);

  // Fallback: hydrate bookingData from localStorage if not present in state
  useEffect(() => {
    if (!bookingData) {
      try {
        const saved = localStorage.getItem("pendingBooking");
        if (saved) {
          const parsed = JSON.parse(saved);
          setBookingData(parsed);
          if (Array.isArray(parsed.selectedAddOns)) {
            setSelectedAddOns(parsed.selectedAddOns);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [bookingData]);

  // Read payment data from route state or matching pending payment
  useEffect(() => {
    try {
      if (location.state?.paymentData) {
        setPaymentData(location.state.paymentData);
        return;
      }

      const payment = getPendingPayment();
      if (payment && bookingData) {
        const bookingOrderId = bookingData?.orderId || bookingData?.order?.orderId || bookingData?.order?.id;
        const isMatch =
          (bookingOrderId && String(payment.orderId) === String(bookingOrderId)) ||
          (payment.listingId && bookingData.listingId && String(payment.listingId) === String(bookingData.listingId)) ||
          (payment.eventId && bookingData.eventId && String(payment.eventId) === String(bookingData.eventId));

        if (isMatch) {
          setPaymentData(payment);

          let actualPaidAmount = payment.amount;
          if (payment.discount !== undefined && payment.discount > 0) {
            actualPaidAmount = payment.amount - payment.discount;
          } else if (payment.paidAmount !== undefined && payment.paidAmount > 0) {
            actualPaidAmount = payment.paidAmount;
          } else if (payment.finalAmount !== undefined && payment.finalAmount > 0) {
            actualPaidAmount = payment.finalAmount;
          }

          try {
            localStorage.setItem("actualPaidAmount", JSON.stringify({
              amount: actualPaidAmount,
              currency: payment.currency || "INR"
            }));
          } catch (e) {
            console.error("Error saving actual paid amount:", e);
          }
        }
      }
    } catch (e) {
      console.error("Error reading payment data:", e);
    }
  }, [location.state, bookingData]);

  // Persist snapshot for completion screen
  useEffect(() => {
    if (bookingData) {
      try {
        localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
      } catch { }
    }
  }, [bookingData]);

  useEffect(() => {
    if (bookingData) {
      console.log("💳 [ExperienceCheckout Page] Loaded bookingData:", bookingData);
      if (bookingData?.previewPrice) {
        console.log("💳 [ExperienceCheckout Page] preview-price response:", bookingData.previewPrice);
        console.log("💳 [ExperienceCheckout Page] pricing object:", bookingData.pricing);
      }
      if (paymentData) {
        console.log("💳 [ExperienceCheckout Page] paymentData:", paymentData);
      }
    }
  }, [bookingData, paymentData]);

  // Check payment status when component mounts (redirect if completed / failed)
  useEffect(() => {
    const checkPaymentAndLoadPricing = async () => {
      if (!location.state?.bookingData && !bookingData) {
        setCheckingPayment(true);
      }

      try {
        const pendingOrderId = localStorage.getItem("pendingOrderId");
        if (!pendingOrderId) {
          setCheckingPayment(false);
          return;
        }

        const orderDetails = await getOrderDetails(pendingOrderId);
        const order = orderDetails?.order || orderDetails;

        if (order) {
          let checkoutBooking = location.state?.bookingData || null;
          if (!checkoutBooking) {
            try {
              const savedBooking = localStorage.getItem("pendingBooking");
              checkoutBooking = savedBooking ? JSON.parse(savedBooking) : null;
            } catch {
              checkoutBooking = null;
            }
          }
          const isExperienceCheckout = Boolean(checkoutBooking?.listingId) && !checkoutBooking?.eventId;
          const orderListingId = order?.listingId || orderDetails?.listingId || order?.listing?.listingId;
          const isStaleEventOrder =
            isExperienceCheckout &&
            (
              (orderListingId && String(orderListingId) !== String(checkoutBooking.listingId)) ||
              (!orderListingId && Boolean(order?.eventId || orderDetails?.eventId || order?.eventTitle || orderDetails?.eventTitle || order?.eventDetails || orderDetails?.eventDetails))
            );

          if (isStaleEventOrder) {
            localStorage.removeItem("pendingOrderId");
            console.warn("Ignored stale event order while loading experience checkout:", pendingOrderId);
            setCheckingPayment(false);
            return;
          }

          const restoredPayment = hydratePendingPaymentFromOrder(orderDetails, {
            orderId: order?.orderId || pendingOrderId,
            amount: getPendingPayment()?.amount,
            currency: getPendingPayment()?.currency || order?.currency || "INR",
          });

          setPaymentData(restoredPayment);

          if (isPendingCheckoutComplete({
            paymentStatus: restoredPayment?.paymentStatus || order?.paymentStatus,
            orderStatus: restoredPayment?.orderStatus || order?.orderStatus,
          })) {
            history.replace("/experience-checkout-complete");
            return;
          }

          if (isFailedPaymentStatus(restoredPayment?.paymentStatus || order?.paymentStatus)) {
            localStorage.setItem("paymentFailed", "true");
            localStorage.setItem("paymentFailureOrderId", String(order.orderId || pendingOrderId));
            history.replace("/experience-checkout-complete");
            return;
          }

          if (isExpiredHold(restoredPayment?.holdExpiresAt)) {
            setPaymentData((prev) => ({
              ...(prev || {}),
              ...restoredPayment,
              holdExpired: true,
            }));
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      } finally {
        setCheckingPayment(false);
      }
    };

    checkPaymentAndLoadPricing();
  }, [history, location.state]);


  // eslint-disable-next-line no-unused-vars
  const handleRemoveAddOn = (indexToRemove) => {
    setSelectedAddOns((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Fallback: build addonDetails from selectedAddOns if server breakdown not yet loaded
  useEffect(() => {
    const listingId = bookingData?.listingId;
    const eventId = bookingData?.eventId;
    if (!listingId && !eventId) return;
    // Skip if server pricing already set addonDetails (via the payment check useEffect)
    if (addonDetails.length > 0) return;

    // Source: selectedAddOns from location.state (items like { id, title, price, ... })
    const fallbackAddons = bookingData?.selectedAddOns || selectedAddOns || [];
    if (!fallbackAddons.length) return;

    const fetchAddons = listingId 
      ? getListingAddons(listingId) 
      : getEventAddons(eventId);

    fetchAddons.then((allAddons) => {
      const merged = fallbackAddons.map((oa) => {
        const inner = oa?.addon || oa || {};
        const addonId = inner.addonId || inner.id || oa.addonId || oa.id || (typeof oa === "string" ? oa : null);
        const full = Array.isArray(allAddons)
          ? allAddons.find((a) => String(a.addonId || a.id) === String(addonId))
          : null;

        const parseNumericAmount = (val) => {
          if (val === null || val === undefined) return 0;
          if (typeof val === "number") return Number.isFinite(val) ? val : 0;
          const match = String(val).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
          return match ? Number(match[0]) : 0;
        };
        const getFirstPos = (...candidates) => {
          for (const c of candidates) {
            const n = parseNumericAmount(c);
            if (n > 0) return n;
          }
          return 0;
        };
        const getFirstStr = (...candidates) => {
          for (const c of candidates) {
            if (c && typeof c === "string" && c.trim() && c.trim().toLowerCase() !== "add-on") {
              return c.trim();
            }
          }
          return null;
        };

        const name = getFirstStr(
          oa.name, oa.addonName, oa.title,
          inner.name, inner.addonName, inner.title,
          full?.title, full?.name, full?.addonName
        ) || "Add-on";

        const quantity = getFirstPos(
          oa.quantity, inner.quantity, bookingData?.addOnQuantities?.[addonId]
        ) || 1;

        const pricePerUnit = getFirstPos(
          oa.pricePerUnit, oa.addonPrice, oa.price, oa.pricePerItem,
          inner.pricePerUnit, inner.addonPrice, inner.price, inner.pricePerItem,
          full?.pricePerUnit, full?.addonPrice, full?.price, full?.pricePerItem, full?.addon?.price
        );

        const totalPriceCandidate = getFirstPos(
          oa.totalPrice, oa.priceValue, oa.amount,
          inner.totalPrice, inner.priceValue, inner.amount
        );
        const totalPrice = totalPriceCandidate > 0 ? totalPriceCandidate : (pricePerUnit * quantity);
        const image = full?.imageUrl || full?.image || full?.coverImageUrl || full?.addon?.imageUrl || full?.addon?.image || oa.image || oa.imageUrl || inner.image || inner.imageUrl || null;

        return {
          addonId,
          name,
          quantity,
          pricePerUnit,
          totalPrice,
          image,
        };
      });
      setAddonDetails(merged);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData?.listingId, bookingData?.eventId]);

  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  useEffect(() => {
    if (bookingData?.stayId) {
      getStayDetails(bookingData.stayId)
        .then((data) => {
          const rawCoverImg =
            data?.coverImageUrl ||
            data?.coverPhotoUrl ||
            (Array.isArray(data?.listingMedia) && data.listingMedia[0]
              ? (data.listingMedia[0].url || data.listingMedia[0].blobName || data.listingMedia[0].fileUrl)
              : null) ||
            (Array.isArray(data?.media) && data.media[0]
              ? (data.media[0].url || data.media[0].blobName || data.media[0].fileUrl)
              : null) ||
            (Array.isArray(data?.images) && data.images[0]
              ? (data.images[0].url || data.images[0].blobName || data.images[0].fileUrl || (typeof data.images[0] === "string" ? data.images[0] : null))
              : null) ||
            (Array.isArray(data?.propertyImages) && data.propertyImages[0]
              ? (data.propertyImages[0].url || data.propertyImages[0].blobName || data.propertyImages[0].fileUrl || (typeof data.propertyImages[0] === "string" ? data.propertyImages[0] : null))
              : null) ||
            "";
          if (rawCoverImg) {
            setStayImageUrl(formatImageUrl(rawCoverImg));
          }
        })
        .catch(console.error);
    }
  }, [bookingData?.stayId]);
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const raw = String(timeString).trim();
    const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return raw;
    const hours = match[1];
    const minutes = match[2] || "00";
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
  };

  // Build booking items (date, time, guests) for summary
  const items = useMemo(() => {
    const dateTitle =
      bookingData?.bookingSummary?.date ||
      bookingData?.selectedDate ||
      "Select date";

    // Format time slot with start and end time if available
    let timeTitle = "Select time";
    if (bookingData?.bookingSummary?.time) {
      const startTime = bookingData.bookingSummary.time;
      const endTime = bookingData?.bookingSummary?.endTime;

      // If we have both start and end time, format as range
      if (startTime && endTime) {
        timeTitle = `${formatTime(startTime)} – ${formatTime(endTime)}`;
      } else if (startTime) {
        // Only start time available, check if it's already formatted
        if (startTime.includes("–") || startTime.includes("-")) {
          timeTitle = startTime;
        } else {
          timeTitle = formatTime(startTime);
        }
      }
    }

    // Get guest count - check multiple possible formats
    const adults =
      bookingData?.guests?.adults ||
      bookingData?.pricing?.adultsCount ||
      bookingData?.adultsCount ||
      bookingData?.adultCount ||
      0;
    const children =
      bookingData?.guests?.children ||
      bookingData?.pricing?.childrenCount ||
      bookingData?.childrenCount ||
      bookingData?.childCount ||
      0;

    let guestsTitle = "Add guests";
    if (adults > 0 || children > 0) {
      const parts = [];
      if (adults > 0) {
        parts.push(`${adults} ${adults === 1 ? "Adult" : "Adults"}`);
      }
      if (children > 0) {
        const rawChildAges = Array.isArray(bookingData?.childAges) && bookingData.childAges.length > 0
          ? bookingData.childAges
          : (Array.isArray(bookingData?.guests?.childAges) && bookingData.guests.childAges.length > 0
            ? bookingData.guests.childAges
            : (Array.isArray(bookingData?.pricing?.childAges) ? bookingData.pricing.childAges : []));
        const validAges = rawChildAges.filter((a) => a !== "" && a !== null && a !== undefined);
        const childLabel = `${children} ${children === 1 ? "Child" : "Children"}`;
        parts.push(validAges.length > 0 ? `${childLabel} (Age${validAges.length > 1 ? "s" : ""}: ${validAges.join(", ")})` : childLabel);
      }
      guestsTitle = parts.join(", ");
    } else {
      const guestsCount =
        bookingData?.bookingSummary?.guestCount ||
        bookingData?.guests?.guests ||
        0;
      if (guestsCount > 0) {
        guestsTitle = `${guestsCount} ${guestsCount === 1 ? "guest" : "guests"}`;
      }
    }

    return [
      {
        title: dateTitle,
        category: "Date",
        icon: "calendar",
      },
      {
        title: timeTitle,
        category: "Time slot",
        icon: "clock",
      },
      {
        title: guestsTitle,
        category: "Guest",
        icon: "user",
      },
    ];
  }, [bookingData]);

  // Build price breakdown table from bookingData.pricing or previewPrice.data
  // eslint-disable-next-line no-unused-vars
  const { addOnsTotal, finalTotal, table } = useMemo(() => {
    const isEvent = Boolean(bookingData?.eventId) || bookingData?.checkoutType === "event" || bookingData?.businessInterest === "EVENT";
    const pricing = bookingData?.pricing;
    const cur = pricing?.currency || paymentData?.currency || "INR";
    const fmt = (n) => formatMoneyLabel(cur, n);

    const apiDataArray =
      (Array.isArray(bookingData?.previewPrice?.data) && bookingData.previewPrice.data.length > 0)
        ? bookingData.previewPrice.data
        : (Array.isArray(bookingData?.priceBreakdownData) && bookingData.priceBreakdownData.length > 0)
          ? bookingData.priceBreakdownData
          : (Array.isArray(bookingData?.data) && bookingData.data.length > 0)
            ? bookingData.data
            : null;

    // Strict direct data rendering from POST /api/orders/preview-price response
    if (apiDataArray) {
      const rows = [];
      let totalAmountToPay = null;
      let calculatedAddonsTotal = 0;

      apiDataArray.forEach((item) => {
        if (!item) return;
        const title = item?.title || "";
        const amountNum = Number(item?.amount ?? 0);

        // Capture Amount to be paid for the highlight box
        if (/amount\s*to\s*be\s*paid/i.test(title) || item?.code === "amount_to_be_paid") {
          totalAmountToPay = amountNum;
          return;
        }

        if (/add-?ons?\s*total/i.test(title) || item?.code === "addons_total") {
          calculatedAddonsTotal = amountNum;
        }

        const isDiscount =
          item?.code === "discount" ||
          item?.code === "earlybird" ||
          item?.code === "longstay" ||
          item?.code === "promo" ||
          item?.code === "seasonal" ||
          (typeof item?.code === "string" && (item.code.includes("discount") || item.code.includes("stay") || item.code.includes("bird") || item.code.includes("promo") || item.code.includes("season"))) ||
          /discount/i.test(title) ||
          /early\s*bird/i.test(title) ||
          /long\s*stay/i.test(title) ||
          /seasonal/i.test(title);
        const isTax = item?.code === "tax" || /tax/i.test(title);
        const isFee = item?.code === "fee" || /fee/i.test(title);

        let valueFormatted = fmt(amountNum);
        if (isDiscount && amountNum > 0) {
          valueFormatted = `- ${fmt(amountNum)}`;
        }

        rows.push({
          title: item.title,
          subtitle: isDiscount ? null : item.subtitle,
          titleColor: item.titleColor,
          subtitleColor: item.subtitleColor,
          percentage: item.percentage,
          code: item.code,
          isDiscount,
          amount: amountNum,
          value: valueFormatted,
        });
      });

      return {
        addOnsTotal: calculatedAddonsTotal,
        finalTotal: totalAmountToPay != null ? totalAmountToPay : (pricing?.totalPrice ?? pricing?.total ?? 0),
        table: rows,
      };
    }

    // Strict Event Pricing Breakdown from POST /api/orders/preview-price API response
    if (isEvent && pricing) {
      const rows = [];
      const breakdown = pricing.breakdown || {};

      // 1. Tickets breakdown
      if (Array.isArray(breakdown.tickets) && breakdown.tickets.length > 0) {
        breakdown.tickets.forEach((t) => {
          const typeName = t.ticketTypeName || t.name || t.ticketName || "Ticket";
          const qty = Number(t.quantity || 0);
          const price = Number(t.pricePerTicket ?? t.price ?? 0);
          const totalTicketPrice = Number(t.totalTicketPrice ?? (qty * price));
          const adultQty = Number(t.adultQuantity ?? 0);
          const childQty = Number(t.childQuantity ?? 0);
          const childPrice = t.childPricePerTicket != null ? Number(t.childPricePerTicket) : null;

          if (adultQty > 0 && childQty > 0 && childPrice != null && childPrice !== price) {
            rows.push({
              title: `${typeName} - Adults (${adultQty} × ${fmt(price)})`,
              value: fmt(adultQty * price),
            });
            rows.push({
              title: `${typeName} - Children (${childQty} × ${fmt(childPrice)})`,
              value: fmt(childQty * childPrice),
            });
          } else if (qty > 0 && price > 0) {
            rows.push({
              title: `${typeName} (${qty} × ${fmt(price)})`,
              value: fmt(totalTicketPrice),
            });
          } else if (qty > 0) {
            rows.push({
              title: `${typeName} (${qty} ${qty === 1 ? "ticket" : "tickets"})`,
              value: fmt(totalTicketPrice),
            });
          } else if (totalTicketPrice > 0) {
            rows.push({
              title: typeName,
              value: fmt(totalTicketPrice),
            });
          }
        });
      } else if (Number(pricing.basePrice || 0) > 0) {
        const guests = Number(pricing.numberOfGuests || pricing.adultCount || bookingData?.bookingSummary?.guestCount || 1);
        const ppp = guests > 0 ? (pricing.basePrice / guests) : pricing.basePrice;
        rows.push({
          title: `Base price (${guests} ${guests !== 1 ? "tickets" : "ticket"} × ${fmt(ppp)})`,
          value: fmt(pricing.basePrice),
        });
      }

      // 2. Add-ons breakdown
      if (Array.isArray(breakdown.addons) && breakdown.addons.length > 0) {
        breakdown.addons.forEach((a) => {
          const aName = a.addonName || a.name || a.title || "Add-on";
          const qty = Number(a.quantity || 1);
          const price = Number(a.addonPrice ?? a.price ?? 0);
          const totalAddonPrice = Number(a.totalPrice ?? (qty * price));
          rows.push({
            title: `${aName} (${qty} × ${fmt(price)})`,
            value: fmt(totalAddonPrice),
          });
        });
      } else if (Number(pricing.addonsTotal || 0) > 0) {
        rows.push({
          title: "Add-ons Total",
          value: fmt(pricing.addonsTotal),
        });
      }

      // 3. Subtotal
      const hasDiscounts = Number(pricing.discountAmount || 0) > 0 || (Array.isArray(breakdown.discounts) && breakdown.discounts.length > 0);
      const hasTaxes = Number(pricing.taxAmount || 0) > 0 || (Array.isArray(breakdown.taxes) && breakdown.taxes.length > 0);
      const hasAddons = Number(pricing.addonsTotal || 0) > 0 || (Array.isArray(breakdown.addons) && breakdown.addons.length > 0);
      const hasPlatformFee = Number(pricing.platformFee || 0) > 0;

      if (pricing.subtotal != null && (hasDiscounts || hasTaxes || hasAddons || hasPlatformFee)) {
        rows.push({
          title: "Subtotal",
          value: fmt(pricing.subtotal),
        });
      }

      // 4. Discounts
      if (Array.isArray(breakdown.discounts) && breakdown.discounts.length > 0) {
        breakdown.discounts.forEach((d) => {
          const dName = d.discountName || d.name || d.title || "Discount";
          const dAmt = Number(d.discountAmount ?? d.amount ?? 0);
          if (dAmt > 0) {
            rows.push({
              title: dName,
              value: `- ${fmt(dAmt)}`,
            });
          }
        });
      } else if (Number(pricing.discountAmount || 0) > 0) {
        rows.push({
          title: "Discount",
          value: `- ${fmt(pricing.discountAmount)}`,
        });
      }

      // 5. Platform Fee
      if (Number(pricing.platformFee || 0) > 0) {
        rows.push({
          title: "Platform fee",
          value: `+ ${fmt(pricing.platformFee)}`,
        });
      }

      // 6. Taxes
      if (Array.isArray(breakdown.taxes) && breakdown.taxes.length > 0) {
        breakdown.taxes.forEach((tx) => {
          const txName = tx.taxName || tx.name || tx.title || "Taxes & Fees";
          const txAmt = Number(tx.taxAmount ?? tx.amount ?? 0);
          if (txAmt > 0) {
            rows.push({
              title: txName,
              value: fmt(txAmt),
            });
          }
        });
      } else if (Number(pricing.taxAmount || 0) > 0) {
        rows.push({
          title: "Taxes & Fees",
          value: fmt(pricing.taxAmount),
        });
      }

      const totalVal = Number(pricing.totalPrice ?? pricing.total ?? 0);

      return {
        addOnsTotal: Number(pricing.addonsTotal || 0),
        finalTotal: totalVal,
        table: rows,
      };
    }

    if (pricing) {
      const rows = [];

      const basePrice = pricing.basePrice || pricing.baseAmount || 0;
      const addonsTotal = pricing.addonsTotal || 0;
      const tax = pricing.tax || pricing.taxAmount || 0;
      const discount = pricing.discount || pricing.discountAmount || 0;
      
      const taxRate = Number(pricing.taxRate || 0);
      const taxableSubtotal = Math.max(0, Number(basePrice || 0) + Number(addonsTotal || 0) - Number(discount || 0));
      const computedTaxFromSubtotal = taxRate > 0 ? (taxableSubtotal * taxRate) / 100 : 0;
      // Keep checkout breakdown aligned with payable total:
      // use provided tax first (server/local computed), only derive from rate as fallback.
      const displayTax = Number(tax || 0) > 0 ? Number(tax) : computedTaxFromSubtotal;
      const subtotalBeforeDiscountAndTax = Math.max(0, Number(basePrice || 0) + Number(addonsTotal || 0));

      // Base price
      if (basePrice > 0) {
        const adults = Number(pricing.adultsCount ?? bookingData?.guests?.adults ?? bookingData?.adultsCount ?? 0);
        const children = Number(pricing.childrenCount ?? bookingData?.guests?.children ?? bookingData?.childrenCount ?? 0);
        const totalG = (adults + children) || Number(pricing.guestCount || 1);

        if (children > 0) {
          const ppp = toFiniteNumberOrNull(
            pricing.adultBasePricePerPerson,
            pricing.basePricePerPerson,
            pricing.pricePerPerson,
            totalG > 0 ? (basePrice / totalG) : null
          ) || 0;

          if (adults > 0) {
            rows.push({
              title: `Adults (${adults} × ${fmt(ppp)})`,
              value: fmt(ppp * adults),
            });
          }

          const childGroups = buildChildPricingBreakdown({
            childrenCount: children,
            childAges: bookingData?.childAges || bookingData?.guests?.childAges || pricing?.childAges || [],
            pricing,
            bookingData,
            adultPrice: ppp,
          });

          if (childGroups.length > 0) {
            childGroups.forEach((group) => {
              const rangePrefix = group.ageRange ? `${group.ageRange}: ` : "";
              const priceDisplay = (group.isFree || group.unitPrice === 0) ? "Free" : fmt(group.unitPrice);
              const countDisplay = group.count;
              const title = countDisplay === 1
                ? `Child (${rangePrefix}${priceDisplay})`
                : `Children (${rangePrefix}${priceDisplay} × ${countDisplay})`;
              const groupTotal = (group.isFree || group.unitPrice === 0) ? 0 : group.unitPrice * countDisplay;
              rows.push({
                title,
                value: fmt(groupTotal),
              });
            });
          } else {
            const childPriceCandidates = [
              pricing.baseChildPricePerChild,
              pricing.childPricePerChild,
              bookingData?.pricing?.baseChildPricePerChild,
              bookingData?.pricing?.childPricePerChild,
              bookingData?.childPricePerChild,
              bookingData?.priceDetails?.childPricePerChild,
              bookingData?.orderRequest?.childPricePerChild,
            ];
            const hasExplicitChildPrice = hasDefinedValue(...childPriceCandidates);
            const resolvedChildPrice = toFiniteNumberOrNull(...childPriceCandidates);
            const cpp = hasExplicitChildPrice ? (resolvedChildPrice ?? 0) : ppp;
            const adultsTotal = ppp * adults;
            const remaining = Math.max(0, basePrice - adultsTotal);
            const applicableChildren = cpp > 0 ? Math.round(remaining / cpp) : children;
            if (applicableChildren > 0) {
              rows.push({
                title: `Children (${applicableChildren} × ${fmt(cpp)})`,
                value: fmt(remaining),
              });
            } else {
              rows.push({
                title: `Children (${children} × ${fmt(0)})`,
                value: fmt(0),
              });
            }
          }
        } else {
          const guests = totalG;
          const ppp = pricing.basePricePerPerson || pricing.adultBasePricePerPerson || pricing.pricePerPerson;
          const basePpp = ppp || (basePrice / guests);
          const label = `Base price (${guests} ${guests !== 1 ? "guests" : "guest"} × ${fmt(basePpp)})`;
          rows.push({ title: label, value: fmt(basePrice) });
        }
      }

      if (addonsTotal > 0) {
        rows.push({ title: "Add-ons Total", value: fmt(addonsTotal) });
      }

      if (subtotalBeforeDiscountAndTax > 0 && (discount > 0 || displayTax > 0 || addonsTotal > 0)) {
        rows.push({ title: "Subtotal", value: fmt(subtotalBeforeDiscountAndTax) });
      }

      const rawPayableAmount = Number(
        paymentData?.amount ??
        pricing.total ??
        pricing.finalAmount ??
        0
      );
      const isAmountInPaise = paymentData?.paymentMethod === "razorpay";
      const payableAmount =
        rawPayableAmount > 0 && isAmountInPaise && rawPayableAmount > 100 && (subtotalBeforeDiscountAndTax > 0 && rawPayableAmount > subtotalBeforeDiscountAndTax * 5)
          ? rawPayableAmount / 100
          : rawPayableAmount;

      const formatPercent = (rate) => {
        if (!rate || rate <= 0) return "";
        const rounded = Number(rate.toFixed(2));
        return Number.isInteger(rounded) ? `${rounded}%` : `${rate.toFixed(2)}%`;
      };

      // ── DISCOUNTS ──
      // Separate Early Bird discount and combine all other discounts together
      let earlyBirdAmount = 0;
      let earlyBirdRate = 0;
      let otherDiscountsAmount = 0;

      if (Array.isArray(pricing.breakdown?.discounts) && pricing.breakdown.discounts.length > 0) {
        pricing.breakdown.discounts.forEach((discItem) => {
          const name = String(
            discItem?.discountName ||
            discItem?.name ||
            discItem?.type ||
            discItem?.title ||
            discItem?.label ||
            discItem?.description ||
            discItem?.discountType ||
            ""
          ).toLowerCase();
          const amt = Number(discItem?.discountAmount ?? discItem?.amount ?? discItem?.value ?? discItem?.discount ?? 0);
          const rate = Number(discItem?.appliedPercentage ?? discItem?.percentage ?? discItem?.rate ?? discItem?.discountRate ?? 0);

          if (/early\s*bird/i.test(name)) {
            earlyBirdAmount += amt;
            if (rate > 0) earlyBirdRate = rate;
          } else {
            otherDiscountsAmount += amt;
          }
        });
      }

      // If breakdown was not available, use top-level pricing fields
      if (earlyBirdAmount === 0 && otherDiscountsAmount === 0) {
        earlyBirdAmount = Number(pricing.earlyBirdDiscount || pricing.earlyBirdDiscountAmount || 0);
        earlyBirdRate = Number(pricing.earlyBirdDiscountRate || pricing.earlyBirdDiscountPercentage || 0);

        const promo = Number(pricing.promoDiscount || pricing.promoDiscountAmount || 0);
        const coupon = Number(pricing.couponDiscount || pricing.couponDiscountAmount || 0);
        const generalDiscount = Number(pricing.discount || pricing.discountAmount || 0);

        otherDiscountsAmount = (promo + coupon) > 0 ? (promo + coupon) : Math.max(0, generalDiscount - earlyBirdAmount);
      }

      // If totalDiscount from payable exceeds current sum, top up otherDiscountsAmount
      const knownDiscountsSum = earlyBirdAmount + otherDiscountsAmount;
      if (knownDiscountsSum === 0 && Number(discount || 0) > 0) {
        otherDiscountsAmount = Number(discount);
      }

      let otherDiscountsRate = 0;
      if (subtotalBeforeDiscountAndTax > 0) {
        if (otherDiscountsAmount > 0) {
          otherDiscountsRate = (otherDiscountsAmount / subtotalBeforeDiscountAndTax) * 100;
        }
        if (earlyBirdAmount > 0 && earlyBirdRate <= 0) {
          earlyBirdRate = (earlyBirdAmount / subtotalBeforeDiscountAndTax) * 100;
        }
      }

      if (otherDiscountsAmount > 0) {
        const rateLabel = otherDiscountsRate > 0 ? ` (${formatPercent(otherDiscountsRate)})` : "";
        rows.push({ title: `Discount${rateLabel}`, value: `- ${fmt(otherDiscountsAmount)}` });
      }

      if (earlyBirdAmount > 0) {
        const ebLabel = earlyBirdRate > 0 ? ` (${formatPercent(earlyBirdRate)})` : "";
        rows.push({ title: `Early Bird Discount${ebLabel}`, value: `- ${fmt(earlyBirdAmount)}` });
      }

      // ── TAXES ──
      let resolvedTaxAmount = 0;
      let resolvedTaxRate = Number(pricing.taxRate ?? pricing.taxPercentage ?? pricing.tax_rate ?? 0);

      if (Array.isArray(pricing.breakdown?.taxes) && pricing.breakdown.taxes.length > 0) {
        pricing.breakdown.taxes.forEach((taxItem) => {
          const amt = Number(taxItem?.amount ?? taxItem?.value ?? taxItem?.tax ?? taxItem?.taxAmount ?? 0);
          resolvedTaxAmount += amt;
          const rate = Number(taxItem?.rate ?? taxItem?.percentage ?? taxItem?.taxRate ?? 0);
          if (rate > 0 && resolvedTaxRate === 0) resolvedTaxRate = rate;
        });
      }

      if (resolvedTaxAmount <= 0) {
        resolvedTaxAmount = Number(pricing.tax || pricing.taxAmount || pricing.tax_amount || displayTax || 0);
      }

      // If still 0, derive from total: payableAmount - (subtotal - discounts)
      if (resolvedTaxAmount <= 0 && payableAmount > 0) {
        const totalDisc = earlyBirdAmount + otherDiscountsAmount;
        const discountedSubtotal = Math.max(0, subtotalBeforeDiscountAndTax - totalDisc);
        if (payableAmount > discountedSubtotal) {
          resolvedTaxAmount = Number((payableAmount - discountedSubtotal).toFixed(2));
        }
      }

      if (resolvedTaxAmount > 0) {
        const effectiveSubtotal = Math.max(0, subtotalBeforeDiscountAndTax - (earlyBirdAmount + otherDiscountsAmount));
        if (resolvedTaxRate <= 0 && effectiveSubtotal > 0) {
          resolvedTaxRate = (resolvedTaxAmount / effectiveSubtotal) * 100;
        }
        const rateLabel = resolvedTaxRate > 0 ? ` (${formatPercent(resolvedTaxRate)})` : "";
        rows.push({ title: `Tax${rateLabel}`, value: `+ ${fmt(resolvedTaxAmount)}` });
      }

      return {
        addOnsTotal: addonsTotal,
        finalTotal: pricing.total || pricing.finalAmount || 0,
        table: rows,
      };
    }

    // Fallback: receipt-based rows
    if (bookingData?.receipt && Array.isArray(bookingData.receipt)) {
      const rows = bookingData.receipt
        .filter((r) => r?.kind === "tax")
        .map((r) => ({ title: r.title, value: r.content }));
      return { addOnsTotal: 0, finalTotal: 0, table: rows };
    }

    // Last resort
    const addOnsPrice = selectedAddOns.reduce((sum, addOn) => {
      const unitPrice = Number(addOn?.priceValue || addOn?.price || 0) || 0;
      const qty = Number(addOn?.quantity || 1) || 1;
      return sum + (unitPrice * qty);
    }, 0);
    return {
      addOnsTotal: addOnsPrice,
      finalTotal: addOnsPrice,
      table: [{ title: "Add-ons Total", value: formatMoneyLabel(cur, addOnsPrice) }],
    };
  }, [bookingData, selectedAddOns, paymentData]);

  const [cancellationPolicy, setCancellationPolicy] = useState(null);

  // Sync cancellation policy from bookingData
  useEffect(() => {
    if (bookingData?.cancellationPolicySummary) {
      setCancellationPolicy(bookingData.cancellationPolicySummary);
    } else if (bookingData?.cancellationAllowed === false) {
      setCancellationPolicy(null);
    }
  }, [bookingData?.cancellationAllowed, bookingData?.cancellationPolicySummary]);

  // Show loading state while checking payment status
  if (checkingPayment) {
    return (
      <div className={cn("section-mb80", styles.section)} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className={cn("container", styles.container)}>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>Checking payment status...</p>
          </div>
        </div>
      </div>
    );
  }

  const listingTitle = bookingData?.listingTitle || "Your trip";
  const isEventBooking = Boolean(bookingData?.eventId) || bookingData?.checkoutType === "event" || bookingData?.businessInterest === "EVENT";
  const isStayBooking = Boolean(bookingData?.stayId);
  const isAmountInPaise = paymentData?.paymentMethod === "razorpay";
  const resolvedCurrency = bookingData?.pricing?.currency || bookingData?.previewPrice?.pricing?.currency || paymentData?.currency || "INR";
  
  const apiAmountToBePaid = (() => {
    const arr = Array.isArray(bookingData?.previewPrice?.data)
      ? bookingData.previewPrice.data
      : (Array.isArray(bookingData?.priceBreakdownData)
        ? bookingData.priceBreakdownData
        : (Array.isArray(bookingData?.data) ? bookingData.data : null));
    if (!arr) return null;
    const match = arr.find((item) => /amount\s*to\s*be\s*paid/i.test(item?.title || "") || item?.code === "amount_to_be_paid");
    return match?.amount != null ? Number(match.amount) : null;
  })();

  // Authoritative price comes strictly from POST /api/orders/preview-price
  const resolvedAmountToPay =
    (apiAmountToBePaid != null
      ? (isAmountInPaise ? Math.round(apiAmountToBePaid * 100) : apiAmountToBePaid)
      : null)
    ?? bookingData?.previewPrice?.payment?.amount
    ?? (bookingData?.previewPrice?.pricing?.totalPrice != null ? (isAmountInPaise ? Math.round(bookingData.previewPrice.pricing.totalPrice * 100) : bookingData.previewPrice.pricing.totalPrice) : null)
    ?? (bookingData?.previewPrice?.pricing?.total != null ? (isAmountInPaise ? Math.round(bookingData.previewPrice.pricing.total * 100) : bookingData.previewPrice.pricing.total) : null)
    ?? (bookingData?.pricing?.totalPrice != null ? (isAmountInPaise ? Math.round(bookingData.pricing.totalPrice * 100) : bookingData.pricing.totalPrice) : null)
    ?? (bookingData?.pricing?.total != null ? (isAmountInPaise ? Math.round(bookingData.pricing.total * 100) : bookingData.pricing.total) : null)
    ?? paymentData?.amount
    ?? finalTotal
    ?? bookingData?.finalTotal
    ?? null;
  const backUrl =
    bookingData?.returnTo ||
    (isEventBooking ? `/event?id=${bookingData.eventId}` : null) ||
    (isStayBooking ? `/stay-details?id=${bookingData.stayId}` : null);

  let bookingDetailsUrl = "/experience-product";
  if (bookingData?.returnTo) {
    bookingDetailsUrl = bookingData.returnTo;
  } else if (isEventBooking && bookingData?.eventId) {
    bookingDetailsUrl = `/event?id=${bookingData.eventId}`;
  } else if (isStayBooking && bookingData?.stayId) {
    bookingDetailsUrl = `/stay-details?id=${bookingData.stayId}`;
  } else if (bookingData?.listingId) {
    bookingDetailsUrl = buildExperienceUrl(bookingData?.listingTitle || "experience", bookingData.listingId);
  }

  const breadcrumbs = [
    {
      title: "Booking details",
      url: bookingDetailsUrl,
    },
    {
      title: "Confirm and pay",
    },
  ];
  //test 3
  // Get first image - ensure it's a single image URL, not an array
  const getListingImage = () => {
    if (stayImageUrl) return stayImageUrl;
    const image = bookingData?.roomImage || bookingData?.listingImage;
    if (!image) return "/images/content/photo-1.1.jpg";
    // If it's an array, get the first item
    if (Array.isArray(image)) {
      return image[0]?.url || image[0] || "/images/content/photo-1.1.jpg";
    }
    // If it's a string, return it
    if (typeof image === 'string') {
      return formatImageUrl(image);
    }
    return "/images/content/photo-1.1.jpg";
  };
  const listingImage = getListingImage();

  const hostSources = [
    bookingData,
    bookingData?.listing?.host,
    bookingData?.host,
  ];
  const hostName = getHostName(...hostSources);
  const hostAvatar = getHostAvatar(...hostSources) || "/images/content/avatar.jpg";


  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.headerRow}>
          <Control
            className={styles.backControl}
            urlHome="/"
            backUrl={backUrl}
          />
          <h2 className={styles.pageTitle}>{isEventBooking ? "Your event" : "Your trip"}</h2>
        </div>
        <div className={styles.wrapper}>
          <ConfirmAndPay
            className={styles.confirm}
            guests
            dateValue={items[0]?.title}
            timeValue={items[1]?.category === "Time slot" ? items[1]?.title : undefined}
            guestValue={items[2]?.title || items[1]?.title}
            messageText={messageText}
            setMessageText={setMessageText}
            guestDetails={guestDetails}
            setGuestDetails={setGuestDetails}
            guestErrors={guestErrors}
            numberOfGuests={(bookingData?.guests?.adults || 0) + (bookingData?.guests?.children || 0) || bookingData?.bookingSummary?.guestCount || bookingData?.guests?.guests || 1}
            addonDetails={addonDetails}
            addOns={selectedAddOns}
            currency={resolvedCurrency}
          >
            <HeadOptions
              image={listingImage}
              hostName={hostName}
              hostAvatar={hostAvatar}
            />
          </ConfirmAndPay>
          <PriceDetails
            className={styles.price}
            hideHeader={true}
            more
            image={listingImage}
            title={listingTitle}
            items={items}
            table={table}
            addonDetails={addonDetails}
            addOns={selectedAddOns}
            amountToPay={resolvedAmountToPay}
            amountInPaise={isAmountInPaise}
            currency={resolvedCurrency}
            hostName={hostName}
            hostAvatar={hostAvatar}
            cancellationPolicy={cancellationPolicy}
            rating={reviewsData.rating}
            reviewsCount={reviewsData.count}
            buttonUrl="/experience-checkout-complete"
            paymentData={paymentData}
            messageText={messageText}
            bookingData={bookingData}
            guestDetails={guestDetails}
            onGuestValidationFailed={handleGuestValidationFailed}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;


