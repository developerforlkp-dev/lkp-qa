import React, { useState } from "react";
import cn from "classnames";
import { useHistory } from "react-router-dom";
import styles from "./CreditCard.module.sass";
import TextInput from "../../TextInput";
import Checkbox from "../../Checkbox";
import Modal from "../../Modal";
import {
  createEventOrder,
  createOrder,
  createStayOrder,
  normalizeOrderPaymentSession,
  sendOrderMessage,
  saveGuestDetails,
  finalizeFreeEvent,
} from "../../../utils/api";
import {
  clearPendingCheckoutState,
  getInitializePaymentErrorMessage,
  getPendingOrderId,
  initializePendingOrderPayment,
  isExpiredHold,
  persistPendingCheckout,
} from "../../../utils/paymentSession";

const cards = [
  {
    image: "",
    alt: "Visa",
  },
  {
    image: "",
    alt: "Master Card",
  },
];

const getStoredBookingData = (fallback = null) => {
  try {
    const raw = localStorage.getItem("pendingBooking");
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const extractRazorpayCredentials = (payload) => {
  let razorpayOrderId = null;
  let razorpayKeyId = null;

  const search = (node) => {
    if (!node || typeof node !== "object" || (razorpayOrderId && razorpayKeyId)) return;
    Object.entries(node).forEach(([key, value]) => {
      if (razorpayOrderId && razorpayKeyId) return;
      if (typeof value === "string") {
        const lowerKey = String(key || "").toLowerCase();
        if (!razorpayOrderId && value.startsWith("order_") && (lowerKey.includes("razorpay") || lowerKey.includes("order"))) {
          razorpayOrderId = value;
        }
        if (!razorpayKeyId && value.startsWith("rzp_") && (lowerKey.includes("razorpay") || lowerKey.includes("key") || lowerKey === "keyid")) {
          razorpayKeyId = value;
        }
        return;
      }
      if (value && typeof value === "object") {
        search(value);
      }
    });
  };

  search(payload);
  return { razorpayOrderId, razorpayKeyId };
};

const getOrderCreationErrorMessage = (error) => {
  const code = String(
    error?.response?.data?.code ||
    error?.response?.data?.errorCode ||
    ""
  ).trim().toUpperCase();
  const message =
    error?.response?.data?.details ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to create booking right now.";

  if (code.includes("INVENTORY") || code.includes("UNAVAILABLE")) {
    return "This slot or room is no longer available. Please recheck availability.";
  }
  if (code.includes("HOLD") || /hold expired/i.test(message)) {
    return "Hold expired, recheck availability.";
  }
  if (/status:\s*DISABLED/i.test(message)) {
    return "Sorry, this experience is currently disabled and cannot be booked at the moment.\n\nPlease try another experience or contact support for help.";
  }
  return message;
};

const createOrderFromBooking = async (bookingData) => {
  const bookingType = bookingData?.checkoutType || bookingData?.bookingType;
  const orderPayload = bookingData?.orderRequest;

  if (!orderPayload || !bookingType) {
    throw new Error("Missing booking details. Please start the booking again.");
  }

  if (bookingType === "stay") {
    return createStayOrder(orderPayload);
  }
  if (bookingType === "event") {
    return createEventOrder(orderPayload);
  }
  if (bookingType === "experience") {
    return createOrder(orderPayload);
  }

  throw new Error("Unsupported booking type. Please start the booking again.");
};

const normalizeSuccessfulOrder = (payload, bookingData) => {
  const normalized = normalizeOrderPaymentSession(payload, {
    orderId: bookingData?.orderId || null,
    currency: bookingData?.currency || bookingData?.pricing?.currency || "INR",
  });
  const extracted = extractRazorpayCredentials(payload);
  const payment = normalized?.payment || {};
  const order = payload?.order || payload?.data?.order || payload || {};
  const amountFromBooking = Number(
    bookingData?.finalTotal ??
    bookingData?.totalAmount ??
    bookingData?.pricing?.total ??
    0
  );

  return {
    orderId: normalized?.orderId || order?.orderId || order?.id || null,
    holdExpiresAt: normalized?.holdExpiresAt || null,
    payment: {
      razorpayOrderId: payment?.razorpayOrderId || extracted.razorpayOrderId || null,
      razorpayKeyId:
        payment?.razorpayKeyId ||
        extracted.razorpayKeyId ||
        localStorage.getItem("lastRazorpayKeyId") ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        null,
      amount:
        payment?.amount ||
        Number(order?.amount) ||
        (amountFromBooking > 0 ? Math.round(amountFromBooking * 100) : null),
      currency: payment?.currency || order?.currency || bookingData?.currency || bookingData?.pricing?.currency || "INR",
    },
    raw: payload,
  };
};

const ensureRazorpaySession = async ({ orderId, payment, bookingData }) => {
  const amountFromBooking = Number(
    bookingData?.finalTotal ??
    bookingData?.totalAmount ??
    bookingData?.pricing?.total ??
    0
  );
  const needsInitialization = !payment?.razorpayOrderId || !payment?.razorpayKeyId || !payment?.amount;

  if (!needsInitialization) {
    return payment;
  }

  const initialized = await initializePendingOrderPayment(orderId, {
    amount: payment?.amount || (amountFromBooking > 0 ? Math.round(amountFromBooking * 100) : null),
    currency: payment?.currency || bookingData?.currency || bookingData?.pricing?.currency || "INR",
    paymentMethod: "razorpay",
  });

  return initialized?.persistedPayment || payment;
};

const CreditCard = ({ className, buttonUrl, hidePaymentFields = false, paymentData = null, messageText = "", bookingData: bookingDataProp = null, guestDetails = null, onGuestValidationFailed }) => {
  const [save, setSave] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState("");
  const history = useHistory();

  const isFreeBookingView = Number(
    paymentData?.amount ?? 
    (Number(
      bookingDataProp?.finalTotal ?? 
      bookingDataProp?.totalAmount ?? 
      bookingDataProp?.pricing?.total ?? 0
    ) > 0 ? 1 : 0)
  ) <= 0;

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

  const handleConfirmClick = async () => {
    if (isProcessing) return;
    
    const bookingData = getStoredBookingData(bookingDataProp);
    
    // Calculate total guests for validation
    const adults = Number(bookingData?.guests?.adults || bookingData?.pricing?.adultsCount || bookingData?.adultsCount || bookingData?.adultCount || 0);
    const children = Number(bookingData?.guests?.children || bookingData?.pricing?.childrenCount || bookingData?.childrenCount || bookingData?.childCount || 0);
    const guestsCount = Number(bookingData?.bookingSummary?.guestCount || bookingData?.guests?.guests || 0);
    const totalGuestsNum = (adults > 0 || children > 0) ? (adults + children) : (guestsCount || 1);
    
    if (guestDetails) {
      let errors = {};
      let firstErrorField = null;

      if (!guestDetails.firstName) {
        errors.firstName = "First name is required";
        if (!firstErrorField) firstErrorField = "guest-field-firstName";
      }
      if (!guestDetails.lastName) {
        errors.lastName = "Last name is required";
        if (!firstErrorField) firstErrorField = "guest-field-lastName";
      }
      if (!guestDetails.email) {
        errors.email = "Email is required";
        if (!firstErrorField) firstErrorField = "guest-field-email";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) {
        errors.email = "Please enter a valid email address";
        if (!firstErrorField) firstErrorField = "guest-field-email";
      }
      
      const phoneDigits = guestDetails.mobileNumber?.replace(/\D/g, "") || "";
      if (!guestDetails.mobileNumber) {
        errors.mobileNumber = "Mobile number is required";
        if (!firstErrorField) firstErrorField = "guest-field-mobileNumber";
      } else if (phoneDigits.length !== 10) {
        errors.mobileNumber = "Mobile number must be exactly 10 digits";
        if (!firstErrorField) firstErrorField = "guest-field-mobileNumber";
      }
      
      const additionalGuests = guestDetails.additionalGuests || [];
      for (let i = 0; i < additionalGuests.length; i++) {
        const ag = additionalGuests[i];
        if (!ag || !ag.firstName) {
          errors[`ag-${i}-firstName`] = "First name is required";
          if (!firstErrorField) firstErrorField = `guest-field-ag-${i}-firstName`;
        }
        if (!ag || !ag.lastName) {
          errors[`ag-${i}-lastName`] = "Last name is required";
          if (!firstErrorField) firstErrorField = `guest-field-ag-${i}-lastName`;
        }
      }

      if (Object.keys(errors).length > 0) {
        if (onGuestValidationFailed) {
          onGuestValidationFailed(errors, firstErrorField);
        } else {
          setErrorModalMsg("Please fill all mandatory Guest Details.");
        }
        return;
      } else {
        if (onGuestValidationFailed) {
          onGuestValidationFailed({});
        }
      }
    }
    
    setIsProcessing(true);
    let payment = null;
    try {
      const raw = localStorage.getItem("pendingPayment");
      payment = raw ? JSON.parse(raw) : paymentData;
    } catch (error) {
      payment = paymentData;
    }

    if (!payment || payment.paymentMethod !== "razorpay") {
      if (!bookingData) {
        setErrorModalMsg("Could not find your pending booking. Please book again.");
        setIsProcessing(false);
        return;
      }
    }

    let activePayment = payment;
    let orderId = payment?.orderId || getPendingOrderId();
    let holdExpiresAt = payment?.holdExpiresAt || null;
    try {
      if (!orderId) {
        const createdOrderResponse = await createOrderFromBooking(bookingData);
        const createdSession = normalizeSuccessfulOrder(createdOrderResponse, bookingData);
        orderId = createdSession.orderId;
        holdExpiresAt = createdSession.holdExpiresAt;

        if (!orderId) {
          throw new Error("Order created, but the response did not include an order id.");
        }

        activePayment = persistPendingCheckout({
          bookingData,
          session: createdOrderResponse,
          extras: {
            orderId,
            paymentMethod: "razorpay",
            amount: createdSession.payment.amount,
            currency: createdSession.payment.currency,
            razorpayOrderId: createdSession.payment.razorpayOrderId,
            razorpayKeyId: createdSession.payment.razorpayKeyId,
            holdExpiresAt: createdSession.holdExpiresAt,
          },
          saveCheckoutBooking: true,
        });

        if (createdSession.payment.razorpayKeyId) {
          localStorage.setItem("lastRazorpayKeyId", createdSession.payment.razorpayKeyId);
        }
      }

      const activeAmount = activePayment?.amount ?? (Number(bookingData?.finalTotal ?? bookingData?.totalAmount ?? bookingData?.pricing?.total ?? 0) > 0 ? 1 : 0);
      const isActuallyFree = Number(activeAmount) <= 0;

      if (orderId && !isActuallyFree) {
        activePayment = await ensureRazorpaySession({
          orderId,
          payment: activePayment,
          bookingData,
        });
        holdExpiresAt = activePayment?.holdExpiresAt || holdExpiresAt;
      }
      
      if (orderId && guestDetails) {
        const payload = {
          numberOfGuests: totalGuestsNum,
          guestDetails: {
            title: guestDetails.title || "Mr",
            firstName: guestDetails.firstName,
            lastName: guestDetails.lastName,
            email: guestDetails.email,
            mobileNumber: guestDetails.mobileNumber,
            countryCode: guestDetails.countryCode || "+91",
            additionalGuests: guestDetails.additionalGuests || [],
          }
        };
        
        await saveGuestDetails(orderId, payload);
      }
    } catch (error) {
      console.error("Failed to create or initialize payment:", error);
      const hasOrderId = Boolean(orderId);
      const respData = error?.response?.data;
      let apiErrorMsg = respData?.message || respData?.details;
      
      // If there are specific field errors from the backend, append them
      if (respData?.errors) {
        const errorDetails = typeof respData.errors === 'string' 
          ? respData.errors 
          : JSON.stringify(respData.errors);
        apiErrorMsg = `${apiErrorMsg}\nDetails: ${errorDetails}`;
      } else if (respData && typeof respData === 'object' && !apiErrorMsg) {
        apiErrorMsg = JSON.stringify(respData);
      }
      
      setErrorModalMsg(apiErrorMsg || (hasOrderId ? getInitializePaymentErrorMessage(error) : getOrderCreationErrorMessage(error)));
      setIsProcessing(false);
      return;
    }

    if (isExpiredHold(holdExpiresAt)) {
      setErrorModalMsg("Hold expired, recheck availability.");
      setIsProcessing(false);
      return;
    }

    if (orderId && messageText && messageText.trim() !== "") {
      try {
        await sendOrderMessage(orderId, messageText);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }

    const razorpayOrderId = activePayment?.razorpayOrderId;
    const razorpayKeyId = activePayment?.razorpayKeyId;
    const amount = activePayment?.amount;
    const currency = activePayment?.currency || "INR";
    const isFreeBooking = Number(amount ?? (Number(bookingData?.finalTotal ?? bookingData?.totalAmount ?? bookingData?.pricing?.total ?? 0) > 0 ? 1 : 0)) <= 0;

    if (!razorpayOrderId && !isFreeBooking) {
      setErrorModalMsg("Could not initialize payment. Please try booking again.");
      setIsProcessing(false);
      return;
    }

    if (!razorpayKeyId && !isFreeBooking) {
      setErrorModalMsg("Payment configuration error. Please try booking again.");
      setIsProcessing(false);
      return;
    }

    if (isFreeBooking) {
      try {
        const freeEventResponse = await finalizeFreeEvent(orderId);
        // We use the new API, but we simulate razorpay success for the CheckoutComplete page to work out of the box
        const freePaymentSuccess = {
          razorpay_payment_id: `FREE_${orderId || Date.now()}`,
          razorpay_order_id: `FREE_ORDER_${orderId || Date.now()}`,
          razorpay_signature: "FREE_SIG",
          finalizationMode: freeEventResponse?.finalization?.mode || "AUTO_CONFIRMED",
        };
        localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(freePaymentSuccess));
        localStorage.setItem("actualPaidAmount", JSON.stringify({
          amount: 0,
          currency,
        }));
        if (bookingData) {
          localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
        }
        clearPendingCheckoutState({ keepCheckoutBooking: true, keepActualPaidAmount: true });
        history.replace(buttonUrl);
      } catch (error) {
        console.error("Failed to finish free booking:", error);
        setErrorModalMsg("Booking was created, but we could not finish the checkout state. Please refresh and try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      await ensureRazorpayScript();
      const userInfo = (() => {
        try {
          const raw = localStorage.getItem("userInfo");
          return raw ? JSON.parse(raw) : {};
        } catch (error) {
          return {};
        }
      })();

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: bookingData?.listingTitle || "Booking Payment",
        description: "Complete your booking",
        prefill: {
          name: userInfo.name || userInfo.firstName || "",
          email: userInfo.email || "",
          contact: userInfo.customerPhone || userInfo.phone || "",
        },
        notes: {
          listingId: bookingData?.listingId || bookingData?.eventId || bookingData?.stayId || "",
          bookingDate: bookingData?.bookingSummary?.date || bookingData?.selectedDate || bookingData?.checkInDate || "",
          bookingTime: bookingData?.bookingSummary?.time || "",
          slotId: bookingData?.bookingSummary?.slotId || bookingData?.eventSlotId || "",
        },
        handler: async function (response) {
          setIsProcessing(false);
          try {
            const pendingOrderId = getPendingOrderId() || orderId;
            localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(response));
            localStorage.setItem("actualPaidAmount", JSON.stringify({
              amount,
              currency,
            }));

            const currentBooking = localStorage.getItem("pendingBooking");
            if (currentBooking) {
              localStorage.setItem("checkoutBooking", currentBooking);
            }
            if (pendingOrderId && bookingData?.orderRequest) {
              const updatedBooking = {
                ...bookingData,
                orderId: pendingOrderId,
              };
              localStorage.setItem("pendingBooking", JSON.stringify(updatedBooking));
              localStorage.setItem("checkoutBooking", JSON.stringify(updatedBooking));
            }
          } catch (error) {
            console.error("Failed to persist payment success state:", error);
          }

          clearPendingCheckoutState({ keepCheckoutBooking: true, keepActualPaidAmount: true });
          history.replace(buttonUrl);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Failed to open Razorpay checkout:", error);
      setErrorModalMsg("Unable to start payment. Please check your internet connection and try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn(className, styles.confirm)}>
      {!hidePaymentFields && (
        <>
          <div className={styles.line}>
            <div className={styles.subtitle}>Credit Card</div>
            <div className={styles.cards}>
              {cards.map((card, index) => (
                <div className={styles.card} key={index}>
                  <img src={card.image} alt={card.alt} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.fieldset}>
            <TextInput
              className={styles.field}
              label="card number"
              name="card"
              type="tel"
              placeholder="XXXX XXXX XXXX XXXX"
              required
            />
            <TextInput
              className={styles.field}
              label="card holder"
              name="holder"
              type="text"
              placeholder="TRAN MAU TRI TAM"
              required
            />
            <div className={styles.row}>
              <TextInput
                className={styles.field}
                label="EXPIRATION DATE"
                name="date"
                type="tel"
                placeholder="MM / YY"
                required
              />
              <TextInput
                className={styles.field}
                label="CVC"
                name="cvc"
                type="tel"
                placeholder="CVC"
                required
              />
            </div>
          </div>
          <Checkbox
            className={styles.checkbox}
            value={save}
            onChange={() => setSave(!save)}
            content="Save Card"
          />
        </>
      )}
      <div className={styles.stickyBottom}>
        <button
          className={cn("button", styles.button)}
          type="button"
          onClick={handleConfirmClick}
          disabled={isProcessing}
          style={{ opacity: isProcessing ? 0.7 : 1, cursor: isProcessing ? "not-allowed" : "pointer" }}
        >
          {isProcessing ? (isFreeBookingView ? "Confirming..." : "Processing...") : (isFreeBookingView ? "Confirm Booking" : "Confirm and pay")}
        </button>
      </div>
      <Modal visible={!!errorModalMsg} onClose={() => setErrorModalMsg("")}>
        <div style={{ padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: "16px", color: "#E02E2E" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "600" }}>
            {typeof errorModalMsg === 'string' && errorModalMsg.toLowerCase().includes("already booked")
              ? "Dates Unavailable"
              : typeof errorModalMsg === 'string' && errorModalMsg.includes("currently disabled") 
                ? "Booking Unavailable" 
                : "Oops!"}
          </h3>
          <p style={{ marginBottom: "24px", fontSize: "16px", color: "#4A4A4A", wordBreak: "break-word", whiteSpace: "pre-line" }}>
            {typeof errorModalMsg === 'string' && errorModalMsg.toLowerCase().includes("already booked")
              ? "This property is already booked for the selected dates. Please try selecting different dates or explore other properties."
              : errorModalMsg}
          </p>
          <button className="button" onClick={() => setErrorModalMsg("")} style={{ width: "100%" }}>
            Okay
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CreditCard;
