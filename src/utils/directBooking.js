/**
 * Utility functions for Direct Booking flow
 */

export const isDirectBookingPathOrState = (location) => {
  if (!location) {
    if (typeof window !== "undefined") {
      const path = (window.location.pathname || "").toLowerCase();
      const searchParams = new URLSearchParams(window.location.search || "");
      const isPath =
        path.startsWith("/direct") ||
        path.includes("/direct-booking") ||
        path.includes("/direct-book") ||
        path.includes("/direct/");
      const isQuery =
        searchParams.get("direct") === "true" ||
        searchParams.get("directBooking") === "true" ||
        searchParams.get("mode") === "direct";
      return isPath || isQuery;
    }
    return false;
  }

  const pathname = (location.pathname || "").toLowerCase();
  const search = location.search || "";
  const params = new URLSearchParams(search);

  const isDirectPath =
    pathname.startsWith("/direct") ||
    pathname.includes("/direct-booking") ||
    pathname.includes("/direct-book") ||
    pathname.includes("/direct/");

  const isDirectState = Boolean(
    location.state?.isDirectBooking || location.state?.directBooking
  );

  const isDirectQuery =
    params.get("direct") === "true" ||
    params.get("directBooking") === "true" ||
    params.get("mode") === "direct";

  return isDirectPath || isDirectState || isDirectQuery;
};

/**
 * Generates an NPCI compliant UPI Intent URI
 */
export const generateUpiUri = ({
  upiId = "lkpbookings@okhdfcbank",
  payeeName = "LKP Experiences",
  amount = 0,
  transactionNote = "Direct Experience Booking",
  currency = "INR",
} = {}) => {
  const cleanUpiId = String(upiId || "lkpbookings@okhdfcbank").trim();
  const cleanPayee = String(payeeName || "LKP Experiences").trim();
  const cleanNote = String(transactionNote || "Direct Experience Booking").trim();
  const numAmount = Number(amount) || 0;
  const formattedAmount = numAmount > 0 ? numAmount.toFixed(2) : "0.00";

  const params = new URLSearchParams();
  params.set("pa", cleanUpiId);
  params.set("pn", cleanPayee);
  params.set("tn", cleanNote);
  if (numAmount > 0) {
    params.set("am", formattedAmount);
  }
  params.set("cu", currency || "INR");

  return `upi://pay?${params.toString()}`;
};

/**
 * Generates a high-quality QR code image URL for a given UPI URI
 */
export const getUpiQrCodeUrl = (upiUri, size = 260) => {
  const encoded = encodeURIComponent(upiUri);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=8&format=svg`;
};

/**
 * Resolves direct booking payment details from available booking/host data
 */
export const getDirectBookingConfig = (bookingData = {}, hostData = null, paymentData = null) => {
  let storedDirectData = null;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("directBookingData") : null;
    if (raw) storedDirectData = JSON.parse(raw);
  } catch (e) {}

  // Prioritize API response leadName, upiId, and qrCodeUrl from /api/public/direct-bookings/:token
  const hostUpi =
    storedDirectData?.upiId ||
    storedDirectData?.leadUpiId ||
    storedDirectData?.lead?.upiId ||
    storedDirectData?.data?.upiId ||
    bookingData?.directBooking?.upiId ||
    bookingData?.upiId ||
    hostData?.upiId ||
    hostData?.paymentUpi ||
    hostData?.host?.upiId ||
    hostData?.bankDetails?.upiId ||
    bookingData?.hostUpi ||
    process.env.REACT_APP_DIRECT_BOOKING_UPI_ID ||
    "lkpbookings@okhdfcbank";

  const payeeName =
    storedDirectData?.leadName ||
    storedDirectData?.lead?.name ||
    storedDirectData?.data?.leadName ||
    bookingData?.directBooking?.leadName ||
    bookingData?.leadName ||
    hostData?.displayName ||
    hostData?.businessName ||
    hostData?.host?.displayName ||
    hostData?.host?.businessName ||
    bookingData?.listingTitle ||
    "LKP Direct Booking";

  const rawAmount =
    paymentData?.paidAmount ??
    paymentData?.finalAmount ??
    paymentData?.amount ??
    bookingData?.finalTotal ??
    bookingData?.totalAmount ??
    bookingData?.pricing?.total ??
    0;

  // Convert paise to rupees if needed (> 10000 and has isAmountInPaise flag or in paise)
  const isPaise = rawAmount > 5000 && String(paymentData?.amount) === String(rawAmount);
  const amount = Number(rawAmount) > 0 ? (isPaise ? Number(rawAmount) / 100 : Number(rawAmount)) : 0;

  let orderId =
    bookingData?.orderId ||
    paymentData?.orderId ||
    bookingData?.id ||
    bookingData?.directOrderId;

  if (!orderId && typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("directBookingSessionOrderId");
      if (stored) {
        orderId = stored;
      } else {
        const seed = bookingData?.directBookingToken || bookingData?.listingId || Math.floor(Math.random() * 900000 + 100000);
        const generated = `DIR-${String(seed).slice(-6)}`;
        sessionStorage.setItem("directBookingSessionOrderId", generated);
        orderId = generated;
      }
    } catch (e) {
      orderId = "DIR-PAYMENT";
    }
  }

  if (!orderId) {
    orderId = "DIR-PAYMENT";
  }

  const transactionNote = `Booking ${orderId} - ${bookingData?.listingTitle ? bookingData.listingTitle.slice(0, 18) : "Experience"}`;

  const upiUri = generateUpiUri({
    upiId: hostUpi,
    payeeName,
    amount,
    transactionNote,
  });

  return {
    upiId: hostUpi,
    payeeName,
    amount,
    orderId,
    transactionNote,
    upiUri,
    qrCodeUrl: getUpiQrCodeUrl(upiUri, 260),
  };
};
