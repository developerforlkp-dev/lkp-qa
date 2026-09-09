import React, { useState, useRef, useEffect } from "react";
import {
  QrCode,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  UploadCloud,
  ImageIcon,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTheme } from "../JUI/Theme";
import { getDirectBookingConfig, generateUpiUri, getUpiQrCodeUrl } from "../../utils/directBooking";
import { getPublicDirectBooking, submitPublicDirectBooking } from "../../utils/api";

export default function DirectUpiSection({
  bookingData,
  hostData,
  paymentData,
  guestDetails,
  amount: explicitAmount,
  onSuccess,
  className = "",
  style = {},
}) {
  const { theme, tokens: { B, BG, FG, W, A, M } } = useTheme();
  const isDark = theme === "dark";

  const [directApiData, setDirectApiData] = useState(() => {
    try {
      const stored = localStorage.getItem("directBookingData");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const resolveToken = () => {
    if (bookingData?.directBookingToken) return bookingData.directBookingToken;
    if (bookingData?.directBooking?.token) return bookingData.directBooking?.token;
    if (bookingData?.token) return bookingData.token;
    try {
      const storedToken = localStorage.getItem("directBookingToken");
      if (storedToken) return storedToken;
    } catch (e) {}
    try {
      const stored = localStorage.getItem("directBookingData");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) return parsed.token;
      }
    } catch (e) {}
    if (typeof window !== "undefined") {
      const doubleMatch = window.location.pathname.match(/\/(?:direct|direct-book|direct-booking)\/[^/]+\/([^/?#]+)/i);
      if (doubleMatch && doubleMatch[1] && !["experience-checkout", "complete", "checkout"].includes(doubleMatch[1])) {
        return doubleMatch[1];
      }
      const match = window.location.pathname.match(/\/(?:direct-book|direct-booking|direct)\/([^/?#]+)/i);
      if (match && match[1] && !["experience-checkout", "complete", "checkout", "experience"].includes(match[1])) {
        return match[1];
      }
      const paramToken = new URLSearchParams(window.location.search).get("token");
      if (paramToken) return paramToken;
      const paramRef = new URLSearchParams(window.location.search).get("ref");
      if (paramRef) return paramRef;
    }
    if (bookingData?.listingId) {
      if (bookingData?.listingTitle) {
        const slug = String(bookingData.listingTitle)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        return `${slug}-${bookingData.listingId}`;
      }
      return String(bookingData.listingId);
    }
    return "trek-the-himalayas-55";
  };

  const token = resolveToken();

  useEffect(() => {
    let active = true;
    if (!token) return;

    getPublicDirectBooking(token)
      .then((res) => {
        if (!active || !res) return;
        const data = res?.data || res;
        setDirectApiData(data);
        try {
          localStorage.setItem("directBookingData", JSON.stringify({ ...data, token }));
          localStorage.setItem("directBookingToken", token);
        } catch (e) {}
      })
      .catch((err) => {
        console.warn(`[DirectUpiSection] Error fetching public direct booking for "${token}":`, err);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const config = getDirectBookingConfig(bookingData, hostData, paymentData);

  const activeUpiId =
    directApiData?.upiId ||
    directApiData?.leadUpiId ||
    directApiData?.lead?.upiId ||
    directApiData?.data?.upiId ||
    bookingData?.directBooking?.upiId ||
    bookingData?.upiId ||
    hostData?.upiId ||
    hostData?.host?.upiId ||
    hostData?.paymentUpi ||
    hostData?.bankDetails?.upiId ||
    config.upiId ||
    "lkpbookings@okhdfcbank";

  const activePayeeName =
    directApiData?.leadName ||
    directApiData?.lead?.name ||
    directApiData?.data?.leadName ||
    bookingData?.directBooking?.leadName ||
    bookingData?.leadName ||
    hostData?.displayName ||
    hostData?.name ||
    config.payeeName ||
    "LKP Direct Booking";

  const activeAmount =
    explicitAmount != null && Number(explicitAmount) > 0
      ? Number(explicitAmount)
      : config.amount;

  const activeUpiUri = generateUpiUri({
    upiId: activeUpiId,
    payeeName: activePayeeName,
    amount: activeAmount,
    transactionNote: config.transactionNote,
  });

  const activeQrCodeUrl =
    (directApiData?.qrCodeUrl && !activeAmount)
      ? directApiData.qrCodeUrl
      : getUpiQrCodeUrl(activeUpiUri, 260);

  const initialCustomerName =
    bookingData?.customerName ||
    [bookingData?.guestDetails?.firstName, bookingData?.guestDetails?.lastName].filter(Boolean).join(" ") ||
    bookingData?.guestDetails?.name ||
    bookingData?.customer?.name ||
    bookingData?.orderRequest?.customer?.name ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
        return u.name || [u.firstName, u.lastName].filter(Boolean).join(" ");
      } catch {
        return "";
      }
    })() ||
    "Guest User";

  const initialCustomerPhone =
    bookingData?.customerPhone ||
    bookingData?.guestDetails?.mobileNumber ||
    bookingData?.guestDetails?.phone ||
    bookingData?.customer?.phone ||
    bookingData?.orderRequest?.customer?.phone ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
        return u.phoneNumber || u.mobileNumber || u.phone;
      } catch {
        return "";
      }
    })() ||
    "";

  const resolvedBookingDate =
    bookingData?.selectedDate ||
    bookingData?.bookingDate ||
    bookingData?.orderRequest?.bookingDate ||
    bookingData?.bookingSummary?.date ||
    (() => {
      try {
        const p = new URLSearchParams(window.location.search).get("startDate");
        if (p) return p;
      } catch {}
      return new Date().toISOString().split("T")[0];
    })();

  const resolvedBookingSlotId =
    bookingData?.orderRequest?.bookingSlotId ||
    bookingData?.bookingSlotId ||
    bookingData?.selectedSlot?.id ||
    bookingData?.selectedSlot?.slotId ||
    bookingData?.orderRequest?.eventSlotId ||
    bookingData?.eventSlotId ||
    1;

  const resolvedGuestCount =
    bookingData?.guestCount ||
    bookingData?.orderRequest?.guestCount ||
    bookingData?.bookingSummary?.guestCount ||
    (Number(bookingData?.guests?.adults || 0) + Number(bookingData?.guests?.children || 0)) ||
    1;

  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [copied, setCopied] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [utrNumber, setUtrNumber] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem(`utr_${config.orderId}`) || "" : "")
  );
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(
    () => (typeof window !== "undefined" ? Boolean(localStorage.getItem(`utr_submitted_${config.orderId}`)) : false)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (guestDetails) {
      const derivedName =
        [guestDetails.firstName, guestDetails.lastName].filter(Boolean).join(" ") ||
        guestDetails.name ||
        "";
      if (derivedName && (!customerName || customerName === "Guest User")) {
        setCustomerName(derivedName);
      }
      const derivedPhone = guestDetails.mobileNumber || guestDetails.phone || "";
      if (derivedPhone && !customerPhone) {
        setCustomerPhone(derivedPhone);
      }
    }
  }, [guestDetails]);

  const handleCopyUpi = () => {
    if (!activeUpiId) return;
    navigator.clipboard?.writeText(activeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyNote = () => {
    if (!config.transactionNote) return;
    navigator.clipboard?.writeText(config.transactionNote);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2200);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    } else {
      setScreenshotPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setScreenshotFile(null);
    setScreenshotName("");
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitConfirmation = async (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setSubmitError("Please enter your 12-digit UPI reference / UTR number.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const token = resolveToken();

    const formData = new FormData();
    formData.append("customerName", customerName.trim() || "Guest User");
    formData.append("customerPhone", customerPhone.trim());
    formData.append("bookingDate", resolvedBookingDate);
    formData.append("bookingSlotId", Number(resolvedBookingSlotId) || 1);
    formData.append("guestCount", Number(resolvedGuestCount) || 1);
    formData.append("utrNumber", utrNumber.trim());
    if (screenshotFile) {
      formData.append("paymentScreenshot", screenshotFile);
    }

    try {
      const res = await submitPublicDirectBooking(token, formData);
      localStorage.setItem(`utr_${config.orderId}`, utrNumber.trim());
      localStorage.setItem(`utr_submitted_${config.orderId}`, "true");
      setIsSubmitted(true);

      const directPaymentSuccess = {
        payment_method: "upi",
        payment_id: `UPI_${utrNumber.trim()}`,
        order_id: config.orderId,
        status: "confirmed",
        utrNumber: utrNumber.trim(),
      };
      localStorage.setItem("directPaymentSuccess", JSON.stringify(directPaymentSuccess));
      localStorage.setItem("isDirectBooking", "true");
      if (bookingData) {
        bookingData.isDirectBooking = true;
        bookingData.utrNumber = utrNumber.trim();
        if (guestDetails) {
          bookingData.guestDetails = guestDetails;
        }
        localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
      }

      if (typeof onSuccess === "function") {
        onSuccess(res || { utrNumber: utrNumber.trim() });
      }
    } catch (err) {
      console.error("Direct booking submit error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to submit payment confirmation. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUtr = handleSubmitConfirmation;

  return (
    <div
      className={className}
      style={{
        marginTop: 0,
        borderRadius: 24,
        border: `1px solid ${B}`,
        background: isDark ? "#141416" : "#FFFFFF",
        boxShadow: isDark
          ? "0 12px 32px rgba(0,0,0,0.4)"
          : "0 12px 32px rgba(0,0,0,0.06)",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header banner */}
      <div
        style={{
          padding: "20px 24px",
          background: isDark
            ? "linear-gradient(135deg, rgba(8, 181, 214, 0.15), rgba(0,0,0,0.2))"
            : "linear-gradient(135deg, rgba(8, 181, 214, 0.08), rgba(255,255,255,0.8))",
          borderBottom: `1px solid ${B}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: A || "#08B5D6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            <QrCode size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: FG,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Direct UPI Payment
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.12)",
                  color: "#22C55E",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ShieldCheck size={12} /> Direct Verified
              </span>
            </div>
            <div style={{ fontSize: 13, color: M, marginTop: 2 }}>
              Scan the QR code or use the UPI ID below to complete your payment
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 28,
          alignItems: "center",
        }}
      >
        {/* QR Code Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 20,
            borderRadius: 20,
            background: isDark ? "#1C1E22" : "#F7F8F9",
            border: `1px solid ${B}`,
          }}
        >
          <div
            style={{
              padding: 14,
              background: "#FFFFFF",
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E6E8EC",
            }}
          >
            <img
              src={activeQrCodeUrl}
              alt="UPI QR Code"
              style={{
                width: 200,
                height: 200,
                display: "block",
                borderRadius: 8,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: M,
              fontWeight: 500,
            }}
          >
            <Smartphone size={14} color={A || "#08B5D6"} />
            <span>Works with Google Pay, PhonePe, Paytm, BHIM & more</span>
          </div>
        </div>

        {/* UPI Details and Confirmation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* UPI ID Field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: M,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Payee UPI ID
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 14,
                border: `1px solid ${B}`,
                background: isDark ? "#1C1E22" : "#FFFFFF",
                padding: "6px 6px 6px 14px",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: FG,
                  flex: 1,
                  fontFamily: "monospace",
                  letterSpacing: "0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {activeUpiId}
              </span>
              <button
                type="button"
                onClick={handleCopyUpi}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: copied ? "#22C55E" : (isDark ? "rgba(255,255,255,0.08)" : "#F4F5F6"),
                  color: copied ? "#FFFFFF" : FG,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Payee Name & Transaction Note */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${B}`,
                background: isDark ? "rgba(255,255,255,0.03)" : "#FAFAFA",
              }}
            >
              <div style={{ fontSize: 11, color: M }}>Payee Name</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: FG, marginTop: 2 }}>
                {activePayeeName}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${B}`,
                background: isDark ? "rgba(255,255,255,0.03)" : "#FAFAFA",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: M }}>Reference Note</span>
                <button
                  type="button"
                  onClick={handleCopyNote}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: copiedNote ? "#22C55E" : (A || "#08B5D6"),
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {copiedNote ? "Copied" : "Copy"}
                </button>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: FG,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {config.transactionNote}
              </div>
            </div>
          </div>

          {/* UTR / Reference confirmation form */}
          <div
            style={{
              padding: 18,
              borderRadius: 18,
              border: `1px solid ${isSubmitted ? "#22C55E" : B}`,
              background: isSubmitted
                ? (isDark ? "rgba(34, 197, 94, 0.08)" : "rgba(34, 197, 94, 0.06)")
                : (isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA"),
            }}
          >
            {isSubmitted ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle2 size={24} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: FG }}>
                      Payment Confirmation Submitted!
                    </div>
                    <div style={{ fontSize: 12, color: M, marginTop: 4, lineHeight: 1.5 }}>
                      Reference / UTR: <span style={{ fontFamily: "monospace", fontWeight: 700, color: FG }}>{utrNumber}</span>
                      {customerName && <span> • {customerName}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#22C55E", marginTop: 4, fontWeight: 500 }}>
                      ✓ Your host has been notified to verify your payment and finalize your reservation.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: A || "#08B5D6",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "4px 8px",
                      textDecoration: "underline",
                    }}
                  >
                    Edit or Resubmit Confirmation
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitConfirmation} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: FG, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>Submit Payment Confirmation</span>
                    <span style={{ fontSize: 11, color: A || "#08B5D6", fontWeight: 600 }}>(Required)</span>
                  </div>
                  <div style={{ fontSize: 11, color: M, marginTop: 2 }}>
                    After paying via UPI, enter your details and UTR to complete your booking.
                  </div>
                </div>

                {/* Customer Name & Phone Fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: M, marginBottom: 4 }}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${B}`,
                        background: isDark ? "#141416" : "#FFFFFF",
                        color: FG,
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: M, marginBottom: 4 }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Your Phone Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${B}`,
                        background: isDark ? "#141416" : "#FFFFFF",
                        color: FG,
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* UTR / Reference Number Input */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: M, marginBottom: 4 }}>
                    UPI Reference / UTR Number (12 digits) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    maxLength={24}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${B}`,
                      background: isDark ? "#141416" : "#FFFFFF",
                      color: FG,
                      fontSize: 13,
                      fontFamily: "monospace",
                      outline: "none",
                      boxSizing: "border-box",
                      letterSpacing: "0.04em",
                    }}
                  />
                </div>

                {/* Screenshot Upload Field */}
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: M, marginBottom: 4 }}>
                    Payment Screenshot (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    id="payment-screenshot-input"
                  />

                  {screenshotFile ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${B}`,
                        background: isDark ? "#1C1E22" : "#FFFFFF",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                        {screenshotPreview ? (
                          <img
                            src={screenshotPreview}
                            alt="Preview"
                            style={{ width: 28, height: 28, objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          <ImageIcon size={18} color={A || "#08B5D6"} />
                        )}
                        <span
                          style={{
                            fontSize: 12,
                            color: FG,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {screenshotName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          color: M,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px dashed ${B}`,
                        background: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                        color: M,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s",
                      }}
                    >
                      <UploadCloud size={16} color={A || "#08B5D6"} />
                      <span>Upload payment receipt / screenshot</span>
                    </button>
                  )}
                </div>

                {submitError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#EF4444",
                      fontSize: 12,
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!utrNumber.trim() || submitting}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: utrNumber.trim() ? (A || "#08B5D6") : (isDark ? "#23262F" : "#E6E8EC"),
                    color: utrNumber.trim() ? "#FFFFFF" : M,
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: utrNumber.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    transition: "all 0.2s",
                    marginTop: 4,
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Confirmation...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Booking & Payment</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
