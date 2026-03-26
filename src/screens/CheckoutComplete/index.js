import React, { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import styles from "./CheckoutComplete.module.sass";
import Control from "../../components/Control";
import CheckoutSlider from "./CheckoutSlider";
import CheckoutCompleteComponent from "../../components/CheckoutComplete";
import { getStayDetails } from "../../utils/api";

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

const CheckoutComplete = () => {
  const [booking, setBooking] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [stayImageUrl, setStayImageUrl] = useState(null);

  useEffect(() => {
    try {
      // Try checkoutBooking first, then fallback to pendingBooking
      const checkoutB = localStorage.getItem("checkoutBooking");
      const pendingB = localStorage.getItem("pendingBooking");
      const b = checkoutB || pendingB;
      if (b) {
        const parsed = JSON.parse(b);
        setBooking(parsed);
      }
    } catch (e) {
      console.error("Error loading booking data:", e);
    }
    try {
      const p = localStorage.getItem("razorpayPaymentSuccess");
      if (p) setPaymentSuccess(JSON.parse(p));
    } catch { }
    try {
      const pendingPayment = localStorage.getItem("pendingPayment");
      if (pendingPayment) {
        const parsed = JSON.parse(pendingPayment);
        setPaymentData(parsed);
        // Debug: log payment data to see what fields are available
        console.log("💰 Payment Data from localStorage:", parsed);
      }
    } catch { }
    // Read the actual paid amount that was passed from checkout page
    try {
      const actualPaid = localStorage.getItem("actualPaidAmount");
      if (actualPaid) {
        const parsed = JSON.parse(actualPaid);
        // Update paymentData with the actual paid amount
        setPaymentData(prev => ({
          ...prev,
          paidAmount: parsed.amount,
          currency: parsed.currency || prev?.currency || "INR"
        }));
        console.log("✅ Actual paid amount from checkout:", parsed);
      }
    } catch (e) {
      console.error("Error reading actual paid amount:", e);
    }

    // Check if payment failed
    try {
      const failed = localStorage.getItem("paymentFailed");
      if (failed === "true") {
        setPaymentFailed(true);
        // Clean up the flag
        localStorage.removeItem("paymentFailed");
      }
    } catch (e) {
      console.error("Error checking payment failure status:", e);
    }
  }, []);

  const title = booking?.listingTitle || "Your booking is confirmed";

  const breadcrumbs = [
    {
      title: title,
      url: booking?.listingId 
        ? (booking?.isStay || booking?.checkInDate ? `/stay-product?id=${booking.listingId}` : `/experience-product?id=${booking.listingId}`) 
        : (booking?.isStay || booking?.checkInDate ? "/stay-product" : "/experience-product"),
    },
    {
      title: "Confirm and pay",
    },
    {
      title: "Checkout completed",
    },
  ];

  useEffect(() => {
    if (booking?.stayId) {
      getStayDetails(booking.stayId)
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
  }, [booking?.stayId]);

  const gallery = useMemo(() => {
    // Prefer stay image fetched from API if we have stayId, else fallback to booking stored images
    const rawImg = stayImageUrl || booking?.roomImage || booking?.listingImage;
    const img = rawImg && typeof rawImg === 'string' && !rawImg.startsWith('http') && !rawImg.startsWith('/')
      ? formatImageUrl(rawImg)
      : (rawImg || "/images/content/slider-pic-1.jpg");

    return [
      { src: img, srcSet: img },
      { src: img, srcSet: img },
      { src: img, srcSet: img },
    ];
  }, [booking, stayImageUrl]);

  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format amount - amounts from Razorpay (via pendingPayment/actualPaidAmount) are in paise
  // so we always divide by 100 for those. For values that might already be in rupees
  // (e.g. from receipt total strings), we keep the >100000 heuristic as a guard.
  const formatAmount = (amount, currency = "INR", alreadyInPaise = false) => {
    if (amount === undefined || amount === null || isNaN(amount)) return null;
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return null;
    // Razorpay amounts are always in paise. Anything over 100 that looks like paise:
    // treat amounts > 100 and they came from Razorpay as paise → divide by 100
    const amountInRupees = (alreadyInPaise || numAmount > 100000)
      ? (numAmount / 100).toFixed(2)
      : numAmount.toFixed(2);
    return `${currency} ${amountInRupees}`;
  };


  const isStay = useMemo(() => booking?.isStay || !!(booking?.checkInDate || booking?.checkOutDate), [booking]);

  const parameters = useMemo(() => {
    // Get guest count - check multiple possible formats
    const guestsCount =
      booking?.bookingSummary?.guestCount ||
      booking?.guests?.guests ||
      (booking?.guests?.adults || 0) + (booking?.guests?.children || 0);

    // For stays, we no longer show the fake rating/host since it's dynamic
    // but we can still show guests in the parameters block underneath
    return [
      { title: `${guestsCount} ${guestsCount === 1 ? "guest" : "guests"}`, icon: "user" },
    ];
  }, [booking]);

  const options = useMemo(() => {
    // Get amount paid - this should be the actual amount after discount
    // The actual paid amount is 970, but paymentData.amount might be 1076.35 (total before discount)
    let amountPaid = "—";

    // Debug: log receipt and payment data
    if (booking?.receipt) {
      console.log("🧾 Receipt data:", booking.receipt);
    }
    if (paymentData) {
      console.log("💳 Payment data:", paymentData);
    }

    // Priority 1: Use paidAmount from paymentData — this is in paise from Razorpay
    if (paymentData?.paidAmount !== undefined && paymentData.paidAmount !== null) {
      const formatted = formatAmount(paymentData.paidAmount, paymentData.currency || "INR", true);
      if (formatted) {
        amountPaid = formatted;
        console.log("✅ Using paidAmount from paymentData (paise):", paymentData.paidAmount, "→", formatted);
      }
    }

    // Priority 2: Check for finalAmount in paymentData (also in paise)
    if (amountPaid === "—" && paymentData?.finalAmount !== undefined && paymentData.finalAmount !== null) {
      const formatted = formatAmount(paymentData.finalAmount, paymentData.currency || "INR", true);
      if (formatted) {
        amountPaid = formatted;
        console.log("✅ Using finalAmount from paymentData (paise):", paymentData.finalAmount, "→", formatted);
      }
    }

    // Priority 3: Calculate from paymentData: amount - discount = paidAmount
    if (amountPaid === "—" && paymentData?.amount !== undefined && paymentData?.discount !== undefined) {
      try {
        const paidAmount = paymentData.amount - paymentData.discount;
        const formatted = formatAmount(paidAmount, paymentData.currency || "INR");
        if (formatted) {
          amountPaid = formatted;
          console.log("✅ Calculated from paymentData (amount - discount):", {
            total: paymentData.amount,
            discount: paymentData.discount,
            paidAmount
          });
        }
      } catch (e) {
        console.error("❌ Error calculating from paymentData:", e);
      }
    }

    // Priority 4: Check receipt for "Paid" row
    if (amountPaid === "—" && booking?.receipt && Array.isArray(booking.receipt)) {
      const paidRow = booking.receipt.find((r) =>
        r.title?.toLowerCase().includes("paid") ||
        r.title?.toLowerCase().includes("amount paid")
      );

      if (paidRow?.content) {
        amountPaid = paidRow.content;
        console.log("✅ Found paid row in receipt:", paidRow);
      }
    }

    // Priority 5: Calculate from receipt: total - discount
    if (amountPaid === "—" && booking?.receipt && Array.isArray(booking.receipt)) {
      const totalRow = booking.receipt.find((r) => r.title?.toLowerCase() === "total");
      const discountRow = booking.receipt.find((r) =>
        r.title?.toLowerCase().includes("discount") ||
        r.title?.toLowerCase().includes("promo") ||
        r.title?.toLowerCase().includes("off")
      );

      if (totalRow?.content && discountRow?.content) {
        try {
          const totalMatch = totalRow.content.match(/[\d,]+\.?\d*/);
          const discountMatch = discountRow.content.match(/[\d,]+\.?\d*/);

          if (totalMatch && discountMatch) {
            const total = parseFloat(totalMatch[0].replace(/,/g, ''));
            const discount = parseFloat(discountMatch[0].replace(/,/g, ''));
            const paidAmount = total - discount;
            const currency = totalRow.content.replace(/[\d,.\s]/g, '').trim() || paymentData?.currency || "INR";
            amountPaid = `${currency} ${paidAmount.toFixed(2)}`;
            console.log("✅ Calculated from receipt (total - discount):", { total, discount, paidAmount });
          }
        } catch (e) {
          console.error("❌ Error calculating from receipt:", e);
        }
      }
    }

    // Priority 6: Calculate from paymentData.amount and receipt discount
    if (amountPaid === "—" && paymentData?.amount && booking?.receipt && Array.isArray(booking.receipt)) {
      const discountRow = booking.receipt.find((r) =>
        r.title?.toLowerCase().includes("discount") ||
        r.title?.toLowerCase().includes("promo") ||
        r.title?.toLowerCase().includes("off")
      );

      if (discountRow?.content) {
        try {
          const discountMatch = discountRow.content.match(/[\d,]+\.?\d*/);
          if (discountMatch) {
            const discountInRupees = parseFloat(discountMatch[0].replace(/,/g, ''));
            const discountInPaise = discountInRupees * 100;
            const paidAmount = paymentData.amount - discountInPaise;
            const formatted = formatAmount(paidAmount, paymentData.currency || "INR");
            if (formatted) {
              amountPaid = formatted;
              console.log("✅ Calculated from paymentData.amount and receipt discount:", {
                total: paymentData.amount,
                discountInPaise,
                paidAmount
              });
            }
          }
        } catch (e) {
          console.error("❌ Error calculating from paymentData.amount and receipt:", e);
        }
      }
    }

    // Priority 7: Use paymentData.amount as fallback (might be total, but better than nothing)
    if (amountPaid === "—" && paymentData?.amount) {
      const formatted = formatAmount(paymentData.amount, paymentData.currency || "INR");
      if (formatted) {
        amountPaid = formatted;
        console.log("⚠️ Using paymentData.amount as fallback (might be total):", paymentData.amount);
      }
    }

    // Priority 8: Use receipt total as last resort
    if (amountPaid === "—" && booking?.receipt && Array.isArray(booking.receipt)) {
      const totalRow = booking.receipt.find((r) => r.title?.toLowerCase() === "total");
      if (totalRow?.content) {
        amountPaid = totalRow.content;
        console.log("⚠️ Using receipt total as last resort:", totalRow.content);
      }
    }

    console.log("💰 Final amount paid:", amountPaid);

    return [
      {
        title: "Booking code:",
        content:
          paymentSuccess?.razorpay_payment_id ||
          paymentSuccess?.payment_id ||
          (paymentFailed ? "Payment Failed" : "—"),
        icon: "hand-cart",
      },
      {
        title: "Date:",
        content:
          booking?.bookingSummary?.date ||
          booking?.checkInDate ||
          booking?.selectedDate ||
          "—",
        icon: "calendar",
      },
      {
        title: paymentFailed ? "Amount to pay:" : "Amount paid:",
        content: paymentFailed ? (amountPaid !== "—" ? amountPaid : "—") : amountPaid,
        icon: "receipt",
      },
      {
        title: "Payment method:",
        content: paymentFailed ? "Payment Failed" : "Razorpay",
        icon: paymentFailed ? "alert-circle" : "wallet",
      },
    ];
  }, [booking, paymentSuccess, paymentData, paymentFailed]);

  const items = useMemo(() => {
    // Format time slot with start and end time if available
    let timeContent = "—";
    if (booking?.bookingSummary?.time) {
      const startTime = booking.bookingSummary.time;
      const endTime = booking?.bookingSummary?.endTime;

      // If we have both start and end time, format as range
      if (startTime && endTime) {
        timeContent = `${formatTime(startTime)} – ${formatTime(endTime)}`;
      } else if (startTime) {
        // Only start time available, check if it's already formatted
        if (startTime.includes("–") || startTime.includes("-")) {
          timeContent = startTime;
        } else {
          timeContent = formatTime(startTime);
        }
      }
    }

    // Get guest count - check multiple possible formats
    const guestsCount =
      booking?.bookingSummary?.guestCount ||
      booking?.guests?.guests ||
      (booking?.guests?.adults || 0) + (booking?.guests?.children || 0);

    const guestsContent = guestsCount > 0
      ? `${guestsCount} ${guestsCount === 1 ? "guest" : "guests"}`
      : "—";

    const isStay = booking?.isStay || !!(booking?.checkInDate || booking?.checkOutDate);

    if (isStay) {
      return [
        {
          title: "Check-in",
          content: booking?.checkInDate || "—",
        },
        {
          title: "Check-out",
          content: booking?.checkOutDate || "—",
        },
        {
          title: "Guests",
          content: guestsContent,
        },
        ...(booking?.roomType ? [{ title: "Room type", content: booking.roomType }] : []),
        ...(booking?.roomsBooked && booking.roomsBooked > 0
          ? [{ title: "Rooms booked", content: `${booking.roomsBooked} room${booking.roomsBooked > 1 ? "s" : ""}` }]
          : []),
        ...(booking?.mealPlan ? [{ title: "Meal plan", content: booking.mealPlan }] : []),
      ];
    }

    return [
      {
        title: "Date",
        content:
          booking?.bookingSummary?.date ||
          booking?.selectedDate ||
          "—",
      },
      {
        title: "Time",
        content: timeContent,
      },
      {
        title: "Guests",
        content: guestsContent,
      },
    ];
  }, [booking]);

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          breadcrumbs={breadcrumbs}
        />
        <div className={styles.row}>
          <div className={styles.col}>
            <CheckoutSlider className={styles.slider} gallery={gallery} />
          </div>
          <div className={styles.col}>
            <CheckoutCompleteComponent
              className={styles.complete}
              title={title}
              options={options}
              items={items}
              isStay={booking?.isStay || !!(booking?.checkInDate || booking?.checkOutDate)}
              hostName={booking?.hostName}
              avatarUrl={booking?.hostAvatarUrl}
              rating={booking?.rating}
              reviews={booking?.reviews}
              paymentFailed={paymentFailed}
              onRetryPayment={() => {
                // Redirect back to checkout to retry payment
                window.location.href = "/checkout";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutComplete;
