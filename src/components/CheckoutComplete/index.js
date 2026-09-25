import React, { useRef, useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import styles from "./CheckoutComplete.module.sass";
import Icon from "../Icon";

const CheckoutComplete = ({
  className,
  title,
  parameters,
  options,
  items,
  paymentFailed = false,
  onRetryPayment,
  isStay,
  isEvent,
  hostName,
  avatarUrl,
  rating,
  reviews,
  isDirectBooking = false,
  onPrintReceipt,
}) => {
  const receiptRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const bookedMessage = isStay
    ? "Your stay has been booked!"
    : isEvent
      ? "Your event has been booked!"
      : "Your trip has been booked!";

  const handlePrintReceipt = async () => {
    if (onPrintReceipt) {
      onPrintReceipt();
      return;
    }

    const targetElement = receiptRef.current;
    if (!targetElement) {
      window.print();
      return;
    }

    try {
      setIsPrinting(true);

      // Clone the receipt card to avoid mutating active UI
      const clone = targetElement.cloneNode(true);

      // Remove the action buttons from the printed receipt
      const btns = clone.querySelector(`.${styles.btns}`) || clone.querySelector('[class*="btns"]');
      if (btns) btns.remove();

      // Create an off-screen container styled for clean PDF capture
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "750px";
      container.style.padding = "36px 40px";
      container.style.background = "#ffffff";
      container.style.color = "#141416";
      container.style.boxSizing = "border-box";
      container.style.fontFamily = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

      // Top branding header for the receipt
      const headerBrand = document.createElement("div");
      headerBrand.style.display = "flex";
      headerBrand.style.justifyContent = "space-between";
      headerBrand.style.alignItems = "center";
      headerBrand.style.paddingBottom = "16px";
      headerBrand.style.marginBottom = "24px";
      headerBrand.style.borderBottom = "2px solid #0097B2";
      headerBrand.innerHTML = `
        <div style="font-size: 22px; font-weight: 700; color: #0097B2; letter-spacing: -0.02em;">
          Little Known Planet
        </div>
        <div style="font-size: 11px; font-weight: 700; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em;">
          Booking Receipt
        </div>
      `;
      container.appendChild(headerBrand);
      container.appendChild(clone);
      document.body.appendChild(container);

      const orderRef =
        options?.find((o) => o.title?.toLowerCase().includes("reference") || o.title?.toLowerCase().includes("payment"))?.content ||
        "Receipt";
      const cleanRef = String(orderRef).replace(/[^a-zA-Z0-9-_]/g, "");

      const opt = {
        margin: [8, 8, 8, 8],
        filename: `LKP_Receipt_${cleanRef || "DirectBooking"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
        pagebreak: { mode: ["avoid-all", "css"] },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().from(container).set(opt).save();

      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    } catch (err) {
      console.error("Receipt generation error:", err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div ref={receiptRef} id="checkout-complete-receipt" className={cn(className, styles.complete)}>
      <div className={styles.head}>
        {paymentFailed ? (
          <>
            <div className={cn("h2", styles.title)} style={{ color: "#0097B2" }}>Payment Failed</div>
            <div className={styles.info} style={{ color: "#0097B2" }}>
              Your payment could not be processed. Please try again.
            </div>
          </>
        ) : (
          <>
            <div className={cn("h2", styles.title)}>
              <span className={styles.desktopText}>Congratulation!</span>
              <span className={styles.mobileText}>Your Journey Begins</span>
            </div>
            <div className={styles.info}>
              {bookedMessage}{" "}
              <span role="img" aria-label="firework">
                🎉
              </span>
            </div>
          </>
        )}
        <div className={styles.subtitle}>{title}</div>
        {hostName && (
          <div className={styles.author}>
            <div className={styles.text}>Hosted by</div>
            <div className={styles.avatar}>
              <img src={avatarUrl || "/images/content/avatar.jpg"} alt="Avatar" />
            </div>
            <div className={styles.man}>{hostName}</div>
          </div>
        )}
      </div>
      <div className={styles.line}>
        {rating && (
          <div className={styles.rating}>
            <Icon name="star" size="20" />
            <div className={styles.number}>{rating}</div>
            {reviews && <div className={styles.reviews}>({reviews} reviews)</div>}
          </div>
        )}
        {parameters && (
          <div className={styles.parameters}>
            {parameters.map((x, index) => (
              <div className={styles.parameter} key={index}>
                {x.icon && <Icon name={x.icon} size="16" />}
                {x.title}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.list}>
        {items.map((x, index) => (
          <div
            className={cn(styles.item, {
              [styles.itemFull]: String(x.title || "").toLowerCase() === "guests",
            })}
            key={index}
          >
            {x.icon && (
              <div className={styles.icon} style={{ borderColor: x.color }}>
                <Icon name={x.icon} size="24" />
              </div>
            )}
            <div className={styles.details}>
              <div className={styles.category}>{x.title}</div>
              <div className={styles.value}>{x.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.stage}>Booking details</div>
      <div className={styles.table}>
        {options.map((x, index) => (
          <div className={styles.row} key={index}>
            <div className={styles.cell}>
              <Icon name={x.icon} size="20" />
              {x.title}
            </div>
            <div className={styles.cell}>{x.content}</div>
          </div>
        ))}
      </div>
      <div className={styles.btns}>
        {paymentFailed ? (
          <>
            <Link className={cn("button-stroke", styles.button)} to="/bookings">
              Your bookings
            </Link>
            {onRetryPayment && (
              <button
                type="button"
                className={cn("button", styles.button)}
                onClick={onRetryPayment}
              >
                Retry Payment
              </button>
            )}
          </>
        ) : (
          <>
            {!isDirectBooking ? (
              <Link className={cn("button-stroke", styles.button)} to="/bookings">
                Your bookings
              </Link>
            ) : (
              <button
                type="button"
                className={cn("button-stroke", styles.button)}
                onClick={handlePrintReceipt}
                disabled={isPrinting}
              >
                {isPrinting ? "Generating Receipt..." : "Print Receipt"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutComplete;
