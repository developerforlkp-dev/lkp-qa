import React, { useState } from "react";
import cn from "classnames";
import { useHistory } from "react-router-dom";
import styles from "./CreditCard.module.sass";
import TextInput from "../../TextInput";
import TextArea from "../../TextArea";
import Checkbox from "../../Checkbox";

const cards = [
  {
    image: "./images/content/visa.svg",
    alt: "Visa",
  },
  {
    image: "./images/content/master-card.svg",
    alt: "Master Card",
  },
];

const CreditCard = ({ className, buttonUrl, hidePaymentFields = false }) => {
  const [save, setSave] = useState(true);
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
    // Try to read pending payment info
    let payment = null;
    try {
      const raw = localStorage.getItem("pendingPayment");
      payment = raw ? JSON.parse(raw) : null;
    } catch (_) {
      payment = null;
    }

    // Debug log to help verify state
    console.log("🔍 ConfirmAndPay: pendingPayment", payment);
    console.log("🔍 paymentMethod:", payment?.paymentMethod);
    console.log("🔍 razorpayKeyId:", payment?.razorpayKeyId);
    console.log("🔍 razorpayOrderId:", payment?.razorpayOrderId);
    console.log("🔍 amount:", payment?.amount);

    if (!payment || payment.paymentMethod !== "razorpay") {
      console.log("⚠️ No razorpay payment method, navigating directly to:", buttonUrl);
      // No payment session; just navigate to completion
      history.push(buttonUrl);
      return;
    }
    
    // Check if razorpayKeyId exists
    if (!payment.razorpayKeyId) {
      console.error("❌ Missing razorpayKeyId in payment data");
      alert("Payment configuration error. Please try booking again.");
      return;
    }

    try {
      await ensureRazorpayScript();

      const userInfo = (() => {
        try {
          const u = localStorage.getItem("userInfo");
          return u ? JSON.parse(u) : {};
        } catch {
          return {};
        }
      })();

      const bookingData = (() => {
        try {
          const b = localStorage.getItem("pendingBooking");
          return b ? JSON.parse(b) : null;
        } catch {
          return null;
        }
      })();

      const options = {
        key: payment.razorpayKeyId,
        amount: payment.amount,
        currency: payment.currency || "INR",
        order_id: payment.razorpayOrderId,
        name: bookingData?.listingTitle || "Booking Payment",
        description: "Complete your booking",
        prefill: {
          name: userInfo.name || userInfo.firstName || "",
          email: userInfo.email || "",
          contact: userInfo.customerPhone || userInfo.phone || "",
        },
        notes: {
          listingId: bookingData?.listingId || "",
          bookingDate: bookingData?.bookingSummary?.date || bookingData?.selectedDate || "",
          bookingTime: bookingData?.bookingSummary?.time || "",
          slotId: bookingData?.bookingSummary?.slotId || "",
        },
        handler: function (response) {
          try {
            localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(response));
            // Save the actual paid amount before removing pendingPayment
            // The amount sent to Razorpay is what was actually paid (after discount)
            try {
              const actualPaidAmount = payment.amount; // This is the amount sent to Razorpay (paid amount)
              localStorage.setItem("actualPaidAmount", JSON.stringify({
                amount: actualPaidAmount,
                currency: payment.currency || "INR"
              }));
            } catch (e) {
              console.error("Error saving actual paid amount:", e);
            }
          } catch {}
          localStorage.removeItem("pendingPayment");
          history.push(buttonUrl);
        },
        modal: {
          ondismiss: function () {
            // Leave user on the page; do not navigate
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      // If Razorpay fails to open, fallback navigation
      history.push(buttonUrl);
    }
  };

  return (
    <div className={cn(className, styles.confirm)}>
      {!hidePaymentFields && (
        <>
          <div className={styles.line}>
            <div className={styles.subtitle}>Credit Card</div>
            <div className={styles.cards}>
              {cards.map((x, index) => (
                <div className={styles.card} key={index}>
                  <img src={x.image} alt={x.alt} />
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
      <div className={styles.message}>
        <div className={styles.category}>Message the host</div>
        <TextArea
          className={styles.field}
          name="message"
          placeholder="I will be late about 1 hour, please wait..."
          required="required"
        />
      </div>
      <button className={cn("button", styles.button)} type="button" onClick={handleConfirmClick}>
        Confirm and pay
      </button>
    </div>
  );
};

export default CreditCard;
