import React, { useState } from "react";
import cn from "classnames";
import { useHistory } from "react-router-dom";
import styles from "./CreditCard.module.sass";
import TextInput from "../../TextInput";
import Checkbox from "../../Checkbox";
import {
  createEventOrder,
  createOrder,
  createStayOrder,
  normalizeOrderPaymentSession,
  sendOrderMessage,
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

const CreditCard = ({ className, buttonUrl, hidePaymentFields = false, paymentData = null, messageText = "", bookingData: bookingDataProp = null }) => {
  const [save, setSave] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const history = useHistory();

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
    setIsProcessing(true);

    const bookingData = getStoredBookingData(bookingDataProp);
    let payment = null;
    try {
      const raw = localStorage.getItem("pendingPayment");
      payment = raw ? JSON.parse(raw) : paymentData;
    } catch (error) {
      payment = paymentData;
    }

    if (!payment || payment.paymentMethod !== "razorpay") {
      if (!bookingData) {
        alert("Could not find your pending booking. Please book again.");
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

      if (orderId) {
        activePayment = await ensureRazorpaySession({
          orderId,
          payment: activePayment,
          bookingData,
        });
        holdExpiresAt = activePayment?.holdExpiresAt || holdExpiresAt;
      }
    } catch (error) {
      console.error("Failed to create or initialize payment:", error);
      const hasOrderId = Boolean(orderId);
      alert(hasOrderId ? getInitializePaymentErrorMessage(error) : getOrderCreationErrorMessage(error));
      setIsProcessing(false);
      return;
    }

    if (isExpiredHold(holdExpiresAt)) {
      alert("Hold expired, recheck availability.");
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
    const isFreeBooking = Number(amount || 0) <= 0;

    if (!razorpayOrderId && !isFreeBooking) {
      alert("Could not initialize payment. Please try booking again.");
      setIsProcessing(false);
      return;
    }

    if (!razorpayKeyId && !isFreeBooking) {
      alert("Payment configuration error. Please try booking again.");
      setIsProcessing(false);
      return;
    }

    if (isFreeBooking) {
      try {
        const freePaymentSuccess = {
          razorpay_payment_id: `FREE_${orderId || Date.now()}`,
          razorpay_order_id: `FREE_ORDER_${orderId || Date.now()}`,
          razorpay_signature: "FREE_SIG",
        };
        localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(freePaymentSuccess));
        localStorage.setItem("actualPaidAmount", JSON.stringify({
          amount: 0,
          currency,
        }));
        if (bookingData) {
          localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
        }
        clearPendingCheckoutState({ keepCheckoutBooking: true });
        history.replace(buttonUrl);
      } catch (error) {
        console.error("Failed to finish free booking:", error);
        alert("Booking was created, but we could not finish the checkout state. Please refresh and try again.");
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

          clearPendingCheckoutState({ keepCheckoutBooking: true });
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
      alert("Unable to start payment. Please check your internet connection and try again.");
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
          {isProcessing ? "Processing..." : "Confirm and pay"}
        </button>
      </div>
    </div>
  );
};

export default CreditCard;
