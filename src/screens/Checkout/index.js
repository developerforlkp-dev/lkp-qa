import React, { useMemo, useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./Checkout.module.sass";
import Control from "../../components/Control";
import ConfirmAndPay from "../../components/ConfirmAndPay";
import PriceDetails from "../../components/PriceDetails";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";
import { getOrderDetails, getStayDetails } from "../../utils/api";
import { buildExperienceUrl } from "../../utils/experienceUrl";
import {
  getPendingOrderId,
  getPendingPayment,
  hydratePendingPaymentFromOrder,
  isExpiredHold,
  isFailedPaymentStatus,
  isPendingCheckoutComplete,
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

const formatInr = (amount) => `INR ${Number(amount || 0).toFixed(2)}`;

const normalizeTaxTitle = (title, taxRate = null) => {
  if (!/^tax/i.test(String(title || ""))) return title;
  const rateLabel = taxRate && Number(taxRate) > 0 ? ` (${Number(taxRate).toFixed(2)}%)` : "";
  return `Taxes${rateLabel}`;
};

const getAddOnAmount = (addOn) => {
  if (!addOn) return 0;
  const quantity = Number(addOn?.quantity || 1);
  const totalPrice = Number(addOn?.totalPrice);
  if (Number.isFinite(totalPrice) && totalPrice >= 0) return totalPrice;

  const priceValue = Number(addOn?.priceValue);
  if (Number.isFinite(priceValue) && priceValue >= 0) return priceValue;

  const pricePerUnit = Number(addOn?.pricePerUnit ?? addOn?.price);
  if (Number.isFinite(pricePerUnit) && pricePerUnit >= 0) return pricePerUnit * quantity;

  return 0;
};

const getStayEarlyBirdDiscount = (stayDetails, checkInDate) => {
  const earlyBirdDiscounts = stayDetails?.earlyBirdDiscounts || stayDetails?.early_bird_discounts || [];
  if (!checkInDate || !Array.isArray(earlyBirdDiscounts) || earlyBirdDiscounts.length === 0) {
    return { percent: 0, amount: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stayDate = new Date(checkInDate);
  if (Number.isNaN(stayDate.getTime())) {
    return { percent: 0, amount: 0 };
  }
  stayDate.setHours(0, 0, 0, 0);

  const daysInAdvance = Math.floor((stayDate - today) / (1000 * 60 * 60 * 24));
  const eligibleTiers = earlyBirdDiscounts.filter((tier) => (
    tier?.isActive && daysInAdvance >= Number(tier?.daysInAdvance || 0)
  ));

  if (eligibleTiers.length === 0) {
    return { percent: 0, amount: 0 };
  }

  const bestTier = eligibleTiers.sort(
    (a, b) => Number(b?.percentage || 0) - Number(a?.percentage || 0)
  )[0];

  return {
    percent: Number(bestTier?.percentage || 0),
    amount: 0,
  };
};

const isPropertyBasedStayBooking = (stayDetails, bookingData, orderDetails) => {
  const scopeValues = [
    stayDetails?.bookingScope,
    stayDetails?.booking_scope,
    stayDetails?.scope,
    bookingData?.bookingScope,
    bookingData?.booking_scope,
    bookingData?.scope,
    bookingData?.roomType,
    orderDetails?.order?.bookingScope,
    orderDetails?.order?.booking_scope,
    orderDetails?.order?.scope,
    orderDetails?.raw?.order?.bookingScope,
    orderDetails?.raw?.order?.booking_scope,
    orderDetails?.raw?.order?.scope,
  ];

  return scopeValues.some((value) => String(value || "").toLowerCase().includes("property"));
};

const getPropertyBaseNightlyPrice = (stayDetails, checkInDate) => {
  if (!isPropertyBasedStayBooking(stayDetails, null, null)) {
    return 0;
  }

  const asNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const toDateOnly = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const stayDate = toDateOnly(checkInDate);
  const seasonalPeriods = Array.isArray(stayDetails?.seasonalPricing)
    ? stayDetails.seasonalPricing
    : (Array.isArray(stayDetails?.seasonalPricings)
      ? stayDetails.seasonalPricings
      : (Array.isArray(stayDetails?.seasonalPeriods) ? stayDetails.seasonalPeriods : []));

  const activeSeason = seasonalPeriods.find((period) => {
    const start = toDateOnly(period?.startDate || period?.start_date);
    const end = toDateOnly(period?.endDate || period?.end_date);
    if (!stayDate || !start || !end) return false;
    return stayDate >= start && stayDate <= end;
  });

  return (
    asNumber(activeSeason?.fullPropertyHikePrice) ??
    asNumber(activeSeason?.hikePrice) ??
    asNumber(activeSeason?.fullPropertyB2cPrice) ??
    asNumber(activeSeason?.fullPropertyb2cPrice) ??
    asNumber(activeSeason?.full_property_b2c_price) ??
    asNumber(activeSeason?.b2cPrice) ??
    asNumber(stayDetails?.fullPropertyHikePrice) ??
    asNumber(stayDetails?.fullPropertyB2cPrice) ??
    asNumber(stayDetails?.fullPropertyb2cPrice) ??
    asNumber(stayDetails?.full_property_b2c_price) ??
    asNumber(stayDetails?.b2cPrice) ??
    asNumber(stayDetails?.pricePerNight) ??
    asNumber(stayDetails?.startingPrice) ??
    asNumber(stayDetails?.price) ??
    0
  );
};

const getOrderNumericValue = (orderDetails, ...keys) => {
  const order = orderDetails?.order || orderDetails?.raw?.order || orderDetails || {};
  for (const key of keys) {
    const value = order?.[key];
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const reorderPriceRows = (rows, computedTotal = null) => {
  const primaryRows = [];
  const addOnRows = [];
  const discountRows = [];
  const taxRows = [];
  const trailingRows = [];

  rows.forEach((row) => {
    const title = String(row?.title || "");
    if (/add[\s-]?ons?/i.test(title)) {
      addOnRows.push({ ...row, title: "Add-ons Total" });
      return;
    }
    if (/discount/i.test(title)) {
      discountRows.push(row);
      return;
    }
    if (/^tax/i.test(title)) {
      taxRows.push(row);
      return;
    }
    if (/^subtotal$/i.test(title) || /^total$/i.test(title) || /amount payable|total paid|grand total/i.test(title)) {
      return;
    }
    if (/base stay|base price|extra adult|extra child|adults|children/i.test(title)) {
      primaryRows.push(row);
      return;
    }
    trailingRows.push(row);
  });

  const orderedRows = [...primaryRows, ...addOnRows];
  if (computedTotal !== null && Number(computedTotal) > 0) {
    orderedRows.push({ title: "Total", value: formatInr(computedTotal) });
  }
  orderedRows.push(...discountRows, ...taxRows, ...trailingRows);
  return orderedRows;
};


  // The correct breadcrumbs logic is placed in the component render method


const Checkout = () => {
  const location = useLocation();
  const history = useHistory();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingData, setBookingData] = useState(location.state?.bookingData || null);
  const [paymentData, setPaymentData] = useState(null);
  const [stayImageUrl, setStayImageUrl] = useState(null);
  const [stayDetails, setStayDetails] = useState(null);
  const [pendingOrderDetails, setPendingOrderDetails] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Edit functionality state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  // Date selection handler
  const handleDateSelect = (startDateText, endDateText) => {
    if (!bookingData) return;

    // Update booking data with new date
    const newBookingData = { ...bookingData };

    // Update date summary
    if (newBookingData.bookingSummary) {
      newBookingData.bookingSummary.date = startDateText;
      if (endDateText && endDateText !== startDateText) {
        // handle range if needed
      }
    }
    newBookingData.selectedDate = startDateText;

    // Validate time slot for new date (reset if invalid? or keep if valid?)
    // For now, keep time slot but might need validation against available slots for new date

    setBookingData(newBookingData);
    setShowDatePicker(false);
  };

  // Guest selection handler
  const handleGuestChange = (newGuests) => {
    if (!bookingData) return;

    const newBookingData = { ...bookingData };

    // Update guests object
    newBookingData.guests = newGuests;

    // Update summary text
    const totalGuests = (newGuests.adults || 0) + (newGuests.children || 0);
    if (newBookingData.bookingSummary) {
      newBookingData.bookingSummary.guestCount = totalGuests;
    }

    // Recalculate prices
    // Try to find price per person from priceDetails or extract from receipt
    let pricePerPerson = newBookingData.priceDetails?.pricePerPerson || 0;

    // Fallback: extract from receipt if not found
    if (!pricePerPerson && newBookingData.receipt) {
      const baseRow = newBookingData.receipt.find(r => r.title.toLowerCase().includes('guest') || r.title.toLowerCase().includes('adult') || r.title.toLowerCase().includes('night'));
      if (baseRow) {
        // Extract price from string like "INR 800.00 x 1 guest" or "800 x 1"
        // We look for the first number (allowing decimals)
        const matches = baseRow.title.match(/(\d+(\.\d+)?)/);
        if (matches && matches[0]) {
          pricePerPerson = parseFloat(matches[0]);
        }
      }
    }

    // Try to update total price if we have enough info
    if (pricePerPerson > 0) {
      // Calculate new base total
      const newBaseTotal = pricePerPerson * totalGuests;

      // Add add-ons
      const addOnsTotal = selectedAddOns.reduce(
        (sum, addOn) => sum + getAddOnAmount(addOn),
        0
      );

      const newFinalTotal = newBaseTotal + addOnsTotal;

      if (newBookingData.priceDetails) {
        newBookingData.priceDetails.totalPrice = newFinalTotal;
      }
      newBookingData.finalTotal = newFinalTotal;

      // Update payment data (amount to pay)
      // Store in paise (x100) because components expect Razorpay format and divide by 100 if > 1000
      setPaymentData(prev => ({
        ...prev,
        amount: newFinalTotal * 100
      }));

      // Update receipt table
      if (newBookingData.receipt) {
        const newReceipt = [...newBookingData.receipt];
        // Ideally identify row by title
        const baseRowIndex = newReceipt.findIndex(r => r.title.toLowerCase().includes('adult') || r.title.toLowerCase().includes('guest') || r.title.toLowerCase().includes('night'));

        if (baseRowIndex >= 0) {
          const currency = newBookingData.currency || "INR";
          newReceipt[baseRowIndex] = {
            ...newReceipt[baseRowIndex],
            title: `${currency} ${pricePerPerson.toFixed(2)} x ${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}`,
            content: `${currency} ${newBaseTotal.toFixed(2)}`
          };
        }

        // Update total row
        const totalRowIndex = newReceipt.findIndex(r => r.title.includes('Total') || r.title === 'Total');
        if (totalRowIndex >= 0) {
          const currency = newBookingData.currency || "INR";
          newReceipt[totalRowIndex] = {
            ...newReceipt[totalRowIndex],
            content: `${currency} ${newFinalTotal.toFixed(2)}`
          };
        }
        newBookingData.receipt = newReceipt;
      }
    }

    setBookingData(newBookingData);
  };

  // Initialize add-ons from location state
  useEffect(() => {
    if (location.state?.addOns) {
      setSelectedAddOns(location.state.addOns);
    }
  }, [location.state]);

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

  // Read payment data from localStorage
  useEffect(() => {
    try {
      const payment = getPendingPayment();
      if (payment) {
        setPaymentData(payment);
      }
    } catch (e) {
      console.error("Error reading payment data:", e);
    }
  }, []);

  useEffect(() => {
    const restorePendingCheckout = async () => {
      const pendingOrderId = getPendingOrderId();
      if (!pendingOrderId) return;

      setCheckingPayment(true);
      try {
        const orderDetails = await getOrderDetails(pendingOrderId);
        setPendingOrderDetails(orderDetails || null);
        const order = orderDetails?.order || orderDetails || {};
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
          history.replace("/checkout-complete");
          return;
        }

        if (isFailedPaymentStatus(restoredPayment?.paymentStatus || order?.paymentStatus)) {
          localStorage.setItem("paymentFailed", "true");
          localStorage.setItem("paymentFailureOrderId", String(order?.orderId || pendingOrderId));
          history.replace("/checkout-complete");
          return;
        }

        if (isExpiredHold(restoredPayment?.holdExpiresAt)) {
          setPaymentData((prev) => ({
            ...(prev || {}),
            ...restoredPayment,
            holdExpired: true,
          }));
        }
      } catch (error) {
        console.error("Error restoring pending checkout payment:", error);
      } finally {
        setCheckingPayment(false);
      }
    };

    restorePendingCheckout();
  }, [history]);

  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  useEffect(() => {
    if (bookingData?.stayId) {
      getStayDetails(bookingData.stayId)
        .then((data) => {
          setStayDetails(data || null);
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
    } else {
      setStayDetails(null);
    }
  }, [bookingData?.stayId]);
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Build booking items for summary
  const items = useMemo(() => {
    // Detect stay: explicit flag OR check-in/check-out dates present
    const isStay = bookingData?.isStay || !!(bookingData?.checkInDate || bookingData?.checkOutDate);

    if (isStay) {
      const stayItems = [
        {
          title: bookingData?.checkInDate || bookingData?.bookingSummary?.date || bookingData?.selectedDate || "Select date",
          category: "Check-in",
          icon: "calendar",
        },
        {
          title: bookingData?.checkOutDate || "Select date",
          category: "Check-out",
          icon: "calendar",
        },
      ];
      if (bookingData?.roomType) {
        stayItems.push({
          title: bookingData.roomType,
          category: "Room type",
          icon: "home",
        });
      }
      if (bookingData?.mealPlan) {
        stayItems.push({
          title: bookingData.mealPlan,
          category: "Meal plan",
          icon: "lightning",
        });
      }
      return stayItems;
    }

    // ── Experience / event bookings: date, time slot, guests ──
    const dateTitle =
      bookingData?.bookingSummary?.date ||
      bookingData?.selectedDate ||
      "Select date";

    let timeTitle = "Select time";
    if (bookingData?.bookingSummary?.time) {
      const startTime = bookingData.bookingSummary.time;
      const endTime = bookingData?.bookingSummary?.endTime;
      if (startTime && endTime) {
        timeTitle = `${formatTime(startTime)} – ${formatTime(endTime)}`;
      } else if (startTime) {
        timeTitle = startTime.includes("–") || startTime.includes("-")
          ? startTime
          : formatTime(startTime);
      }
    }

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
        parts.push(`${children} ${children === 1 ? "Child" : "Children"}`);
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


  // Build price table from receipt if provided
  const { table, computedFinalAmount } = useMemo(() => {
    const parseAmount = (val) => {
      if (val === null || val === undefined) return 0;
      const raw = String(val).replace(/,/g, "");
      const m = raw.match(/-?\d+(\.\d+)?/);
      return m ? Number(m[0]) : 0;
    };

    const isStay = !!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate);

    if (isStay && bookingData?.receipt && Array.isArray(bookingData.receipt) && stayDetails) {
      const rows = bookingData.receipt.map((r) => ({ title: r.title, value: r.content }));

      let nights = 1;
      if (bookingData?.checkInDate && bookingData?.checkOutDate) {
        const inDate = new Date(bookingData.checkInDate);
        const outDate = new Date(bookingData.checkOutDate);
        const diff = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
        if (Number.isFinite(diff) && diff > 0) nights = diff;
      }

      const baseRow = rows.find((r) => /base stay|base price|total base/i.test(String(r.title || "")));
      const isPropertyBasedStay = isPropertyBasedStayBooking(stayDetails, bookingData, pendingOrderDetails);
      const orderBasePrice = isPropertyBasedStay
        ? getOrderNumericValue(pendingOrderDetails, "basePrice")
        : 0;
      const orderAddOnsAmount = isPropertyBasedStay
        ? getOrderNumericValue(pendingOrderDetails, "addonsTotal")
        : 0;
      const propertyBaseFromApi = isPropertyBasedStay
        ? Math.max(
            orderBasePrice,
            getPropertyBaseNightlyPrice(stayDetails, bookingData?.checkInDate) * nights
          )
        : 0;
      let baseAmount = propertyBaseFromApi > 0
        ? propertyBaseFromApi
        : parseAmount(baseRow?.value);

      const discountTiers = Array.isArray(stayDetails?.discountTiers) ? stayDetails.discountTiers : [];
      const activeTier = discountTiers.find((t) => {
        const min = Number(t?.minimumDays || 0);
        const max = Number(t?.maximumDays || 99999);
        return nights >= min && nights <= max;
      });
      const tierDiscountPercent = Number(activeTier?.discountPercentage || 0);

      // Also include generic pricing-level discounts from stay API payload
      // (customer/total can coexist with tier-based discounts).
      const pricingDiscount = stayDetails?.pricing?.discount || {};
      const pricingDiscountPercent = Number(
        pricingDiscount?.customer ??
        pricingDiscount?.total ??
        pricingDiscount?.guest ??
        pricingDiscount?.lkp ??
        0
      ) || 0;

      const extraRows = rows.filter((r) => /extra adult|extra child/i.test(String(r.title || "")));
      const extraAmount = extraRows.reduce((sum, r) => sum + parseAmount(r.value), 0);
      const addOnRows = rows.filter((r) => /add[\s-]?ons?/i.test(String(r.title || "")));
      const receiptAddOnsAmount = addOnRows.reduce((sum, r) => sum + parseAmount(r.value), 0);
      const addOnsAmount = orderAddOnsAmount > 0 ? orderAddOnsAmount : receiptAddOnsAmount;
      const existingDiscountAmount = rows
        .filter((r) => /discount/i.test(String(r.title || "")))
        .reduce((sum, r) => sum + Math.abs(parseAmount(r.value)), 0);
      const existingTaxAmount = rows
        .filter((r) => /^tax/i.test(String(r.title || "")))
        .reduce((sum, r) => sum + parseAmount(r.value), 0);
      const finalGuestPriceRow = rows.find((r) => /final guest price|stay total|grand total/i.test(String(r.title || "")));
      const finalGuestAmount = parseAmount(finalGuestPriceRow?.value || bookingData?.totalAmount);

      if (baseAmount <= 0) {
        const reconstructedDiscountableAmount = Math.max(
          0,
          finalGuestAmount - existingTaxAmount + existingDiscountAmount
        );
        const inferredBaseAmount = Math.max(0, reconstructedDiscountableAmount - extraAmount);
        if (inferredBaseAmount > 0) {
          baseAmount = inferredBaseAmount;
        }
      }

      const discountableAmount = Math.max(0, baseAmount + extraAmount + addOnsAmount);

      const longStayDiscountAmount = discountableAmount > 0 && tierDiscountPercent > 0
        ? (discountableAmount * tierDiscountPercent) / 100
        : 0;
      const existingEarlyBirdRow = rows.find((r) => /early[\s-]?bird/i.test(String(r.title || "")));
      const existingEarlyBirdPercentMatch = String(existingEarlyBirdRow?.title || "").match(/(\d+(?:\.\d+)?)\s*%/);
      const existingEarlyBirdPercent = existingEarlyBirdPercentMatch ? Number(existingEarlyBirdPercentMatch[1]) : 0;
      const existingEarlyBirdAmount = existingEarlyBirdRow ? Math.abs(parseAmount(existingEarlyBirdRow.value)) : 0;
      const computedEarlyBird = getStayEarlyBirdDiscount(stayDetails, bookingData?.checkInDate);
      const earlyBirdDiscountPercent = computedEarlyBird.percent || existingEarlyBirdPercent;
      const earlyBirdDiscountAmount = discountableAmount > 0 && earlyBirdDiscountPercent > 0
        ? (discountableAmount * earlyBirdDiscountPercent) / 100
        : existingEarlyBirdAmount;
      const additionalDiscountAmount = discountableAmount > 0 && pricingDiscountPercent > 0
        ? (discountableAmount * pricingDiscountPercent) / 100
        : 0;

      const taxRate = Array.isArray(stayDetails?.taxes)
        ? stayDetails.taxes.reduce((sum, t) => sum + Number(t?.currentRate ?? t?.appliedPercentage ?? t?.rate ?? 0), 0)
        : 0;

      // Keep base stay as pure room charge (no discount/tax mixed in)
      if (baseRow) {
        baseRow.value = `INR ${baseAmount.toFixed(2)}`;
      }
      if (addOnRows.length > 0 && orderAddOnsAmount > 0) {
        addOnRows.forEach((row) => {
          row.value = `INR ${orderAddOnsAmount.toFixed(2)}`;
        });
      }

      // Remove generic discount rows; we'll reinsert a single authoritative one
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const title = String(rows[i]?.title || "");
        if (/discount/i.test(title) && !/long[\s-]?stay/i.test(title) && !/early[\s-]?bird/i.test(title)) {
          rows.splice(i, 1);
        }
      }

      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const title = String(rows[i]?.title || "");
        if (/early[\s-]?bird/i.test(title)) {
          rows.splice(i, 1);
        }
      }

      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const title = String(rows[i]?.title || "");
        if (/final guest price|stay total|grand total/i.test(title)) {
          rows.splice(i, 1);
        }
      }

      // Remove existing long-stay rows too (to avoid duplicates), then reinsert once
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const title = String(rows[i]?.title || "");
        if (/long[\s-]?stay/i.test(title)) {
          rows.splice(i, 1);
        }
      }

      // Remove Adults/Children rows for Hostel bookings
      const isHostel = String(stayDetails?.bookingScope || stayDetails?.booking_scope || stayDetails?.scope || "").toLowerCase().includes("hostel");
      if (isHostel) {
        for (let i = rows.length - 1; i >= 0; i -= 1) {
          const title = String(rows[i]?.title || "").toLowerCase().trim();
          if (title === "adults" || title === "children") {
            rows.splice(i, 1);
          }
        }
      }

      let taxRowIndexForInsert = rows.findIndex((r) => /^tax/i.test(String(r.title || "")));
      if (taxRowIndexForInsert < 0) taxRowIndexForInsert = rows.length;
      let nextInsertIndex = taxRowIndexForInsert;

      // Total Discount should represent only additional pricing discount (not long-stay)
      if (additionalDiscountAmount > 0) {
        rows.splice(nextInsertIndex, 0, {
          title: `Discount (${pricingDiscountPercent.toFixed(2)}%)`,
          value: `- INR ${additionalDiscountAmount.toFixed(2)}`,
        });
        nextInsertIndex += 1;
      }

      if (earlyBirdDiscountAmount > 0) {
        rows.splice(nextInsertIndex, 0, {
          title: `Early Bird Discount (${earlyBirdDiscountPercent.toFixed(2)}%)`,
          value: `- INR ${earlyBirdDiscountAmount.toFixed(2)}`,
        });
        nextInsertIndex += 1;
      }

      // Show long-stay discount as a separate line item
      if (longStayDiscountAmount > 0) {
        rows.splice(nextInsertIndex, 0, {
          title: `Long-stay Discount (${tierDiscountPercent.toFixed(2)}%)`,
          value: `- INR ${longStayDiscountAmount.toFixed(2)}`,
        });
      }

      const taxRowIndex = rows.findIndex((r) => /^tax/i.test(String(r.title || "")));
      let correctedTax = 0;
      if (taxRate > 0) {
        // Recalculate tax based on discounted subtotal and ensure the row exists.
        const discountRows = rows.filter((r) => /discount/i.test(String(r.title || "")));
        const currentDiscountAmount = discountRows.reduce(
          (sum, r) => sum + Math.abs(parseAmount(r.value)),
          0
        );

        const subtotalForTax = discountableAmount - currentDiscountAmount;
        correctedTax = Math.max(0, subtotalForTax * (taxRate / 100));
        const taxRow = {
          title: normalizeTaxTitle("Tax", taxRate),
          value: formatInr(correctedTax),
        };

        if (taxRowIndex >= 0) {
          rows[taxRowIndex] = taxRow;
        } else {
          rows.push(taxRow);
        }
      }

      const totalDiscountAmount = rows
        .filter((r) => /discount/i.test(String(r.title || "")))
        .reduce((sum, r) => sum + Math.abs(parseAmount(r.value)), 0);
      const correctedFinalAmount = Math.max(0, discountableAmount - totalDiscountAmount + correctedTax);
      rows.push({
        title: "Final Guest Price",
        value: formatInr(correctedFinalAmount),
      });

      const normalizedRows = rows.map((row) => {
        const title = String(row?.title || "");
        if (/add[\s-]?ons?/i.test(title)) {
          return { ...row, title: "Add-ons Total", value: formatInr(parseAmount(row.value)) };
        }
        if (/^tax/i.test(title)) {
          return { ...row, title: normalizeTaxTitle(title, taxRate), value: formatInr(parseAmount(row.value)) };
        }
        return row;
      });

      return {
        table: reorderPriceRows(
          normalizedRows,
          Math.max(0, baseAmount + extraAmount + addOnsAmount)
        ),
        computedFinalAmount: correctedFinalAmount,
      };
    }

    if (bookingData?.receipt && Array.isArray(bookingData.receipt)) {
      const rows = bookingData.receipt.map((r) => ({
        title: /^tax/i.test(String(r.title || "")) ? normalizeTaxTitle(r.title) : r.title,
        value: r.content,
      }));
      return {
        table: reorderPriceRows(rows),
        computedFinalAmount: null,
      };
    }

    // Fallback: compute a minimal table from selectedAddOns only
    const addOnsPrice = selectedAddOns.reduce(
      (sum, addOn) => sum + getAddOnAmount(addOn),
      0
    );
    return {
      table: [
        {
          title: "Add-ons Total",
          value: formatInr(addOnsPrice),
        },
      ],
      computedFinalAmount: addOnsPrice,
    };
  }, [bookingData, selectedAddOns, stayDetails, pendingOrderDetails]);

  useEffect(() => {
    if (computedFinalAmount == null || !paymentData) return;

    const adjustedAmount = paymentData?.paymentMethod === "razorpay"
      ? Math.round(computedFinalAmount * 100)
      : computedFinalAmount;

    if (Number(paymentData.amount) === Number(adjustedAmount)) return;

    const nextPaymentData = {
      ...paymentData,
      amount: adjustedAmount,
    };

    setPaymentData(nextPaymentData);
    try {
      localStorage.setItem("pendingPayment", JSON.stringify(nextPaymentData));
    } catch (e) {
      console.error("Error updating payment data:", e);
    }
  }, [computedFinalAmount, paymentData]);

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

  const isStayBooking = !!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate);
  const tripTitle = isStayBooking ? "Your stay" : "Your trip";
  const isAmountInPaise = paymentData?.paymentMethod === "razorpay";
  const effectivePaymentData = computedFinalAmount != null && paymentData
    ? {
        ...paymentData,
        amount: isAmountInPaise ? Math.round(computedFinalAmount * 100) : computedFinalAmount,
      }
    : paymentData;
  const resolvedAmountToPay = computedFinalAmount != null
    ? (isAmountInPaise ? Math.round(computedFinalAmount * 100) : computedFinalAmount)
    : paymentData?.amount;

  // Get first image
  const getListingImage = () => {
    if (stayImageUrl) return stayImageUrl;
    const image = bookingData?.roomImage || bookingData?.listingImage;
    if (!image) return "/images/content/photo-checkout.jpg";
    if (Array.isArray(image)) {
      return image[0]?.url || image[0] || "/images/content/photo-checkout.jpg";
    }
    if (typeof image === 'string') {
      return formatImageUrl(image);
    }
    return "/images/content/photo-checkout.jpg";
  };
  const listingImage = getListingImage();
  const hostInfo = bookingData?.listing?.host || stayDetails?.host || stayDetails?.listing?.host;
  const hostName = hostInfo?.displayName || 
                   (hostInfo?.firstName ? `${hostInfo.firstName} ${hostInfo.lastName || ""}`.trim() : null) || 
                   hostInfo?.name || 
                   "Host";
  const hostAvatar = hostInfo?.picture || hostInfo?.avatar || hostInfo?.profileImage || hostInfo?.image;

  const isEventBooking = Boolean(bookingData?.eventId);
  const backUrl =
    bookingData?.returnTo ||
    (isEventBooking ? `/event?id=${bookingData.eventId}` : null) ||
    (bookingData?.stayId ? `/stay-details?id=${bookingData.stayId}` : null);

  let bookingDetailsUrl = "/experience-product";
  if (bookingData?.returnTo) {
    bookingDetailsUrl = bookingData.returnTo;
  } else if (isEventBooking && bookingData?.eventId) {
    bookingDetailsUrl = `/event?id=${bookingData.eventId}`;
  } else if (bookingData?.stayId) {
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

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          backUrl={backUrl}
        />
        <div className={styles.wrapper}>
          <ConfirmAndPay
            className={styles.confirm}
            title={tripTitle}
            guests={!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate)}
            dateValue={items[0]?.title}
            timeValue={items[1]?.category === "Time slot" ? items[1]?.title : undefined}
            guestValue={items[2]?.title || items[1]?.title} // fallback if there's no time slot
            onEditDate={() => setShowDatePicker(true)}
            onEditGuests={() => setShowGuestPicker(true)}
            isStay={!!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate)}
            checkInDate={bookingData?.checkInDate}
            checkOutDate={bookingData?.checkOutDate}
            roomType={bookingData?.roomType}
            mealPlan={bookingData?.mealPlan}
            messageText={messageText}
            setMessageText={setMessageText}
            datePicker={(
              <InlineDatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={handleDateSelect}
                selectedDate={bookingData?.selectedDate ? new Date(bookingData.selectedDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null}
              />
            )}
            guestPicker={(
              <GuestPicker
                visible={showGuestPicker}
                onClose={() => setShowGuestPicker(false)}
                onGuestChange={handleGuestChange}
                initialGuests={bookingData?.guests || { adults: 1, children: 0, infants: 0 }}
                maxGuests={bookingData?.listing?.maxGuests || 10}
              />
            )}
          />
          <PriceDetails
            className={styles.price}
            image={listingImage}
            title={tripTitle}
            items={items}
            table={table}
            addOns={selectedAddOns}
            addonDetails={selectedAddOns}
            amountToPay={resolvedAmountToPay}
            amountInPaise={isAmountInPaise}
            currency={paymentData?.currency || "INR"}
            hostName={hostName}
            hostAvatar={hostAvatar}
            cancellationPolicy={bookingData?.cancellationPolicySummary || stayDetails?.cancellationPolicySummary}
            buttonUrl="/checkout-complete"
            paymentData={effectivePaymentData}
            messageText={messageText}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
