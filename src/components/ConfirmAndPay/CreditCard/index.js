import React, { useEffect, useState } from "react";
import cn from "classnames";
import { useHistory } from "react-router-dom";
import styles from "./CreditCard.module.sass";
import TextInput from "../../TextInput";
import Checkbox from "../../Checkbox";
import { sendOrderMessage } from "../../../utils/api";
import {
  getInitializePaymentErrorMessage,
  getPendingOrderId,
  initializePendingOrderPayment,
  isExpiredHold,
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

const CreditCard = ({ className, buttonUrl, hidePaymentFields = false, paymentData = null, messageText = "" }) => {
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

    let payment = null;
    try {
      const raw = localStorage.getItem("pendingPayment");
      payment = raw ? JSON.parse(raw) : paymentData;
    } catch (error) {
      payment = paymentData;
    }

    if (!payment || payment.paymentMethod !== "razorpay") {
      const orderId = getPendingOrderId();
      if (messageText && messageText.trim() !== "" && orderId) {
        try {
          await sendOrderMessage(orderId, messageText);
        } catch (error) {
          console.error("Failed to send message:", error);
        }
      }

      history.replace(buttonUrl);
      setIsProcessing(false);
      return;
    }

    const orderId = payment.orderId || getPendingOrderId();
    if (!orderId) {
      alert("Could not find a pending order for payment. Please book again.");
      setIsProcessing(false);
      return;
    }

    let session;
    try {
      session = await initializePendingOrderPayment(orderId, {
        amount: payment.amount,
        currency: payment.currency || "INR",
      });
    } catch (error) {
      console.error("Failed to initialize payment:", error);
      alert(getInitializePaymentErrorMessage(error));
      setIsProcessing(false);
      return;
    }

    if (isExpiredHold(session?.holdExpiresAt)) {
      alert("Hold expired, recheck availability.");
      setIsProcessing(false);
      return;
    }

    const razorpayOrderId = session?.payment?.razorpayOrderId;
    const razorpayKeyId = session?.payment?.razorpayKeyId;
    const amount = session?.payment?.amount;
    const currency = session?.payment?.currency || "INR";

    if (!razorpayOrderId) {
      alert("Could not initialize payment. Please try booking again.");
      setIsProcessing(false);
      return;
    }

    if (!razorpayKeyId) {
      alert("Payment configuration error. Please try booking again.");
      setIsProcessing(false);
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

      const bookingData = (() => {
        try {
          const raw = localStorage.getItem("pendingBooking");
          return raw ? JSON.parse(raw) : null;
        } catch (error) {
          return null;
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
            if (messageText && messageText.trim() !== "" && pendingOrderId) {
              try {
                await sendOrderMessage(pendingOrderId, messageText);
              } catch (error) {
                console.error("Failed to send message:", error);
              }
            }

            localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(response));
            localStorage.setItem("actualPaidAmount", JSON.stringify({
              amount,
              currency,
            }));

            const currentBooking = localStorage.getItem("pendingBooking");
            if (currentBooking) {
              localStorage.setItem("checkoutBooking", currentBooking);
            }
          } catch (error) {
            console.error("Failed to persist payment success state:", error);
          }

          localStorage.removeItem("pendingPayment");
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
