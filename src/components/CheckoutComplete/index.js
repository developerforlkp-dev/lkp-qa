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

    try {
      setIsPrinting(true);

      const formattedDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const orderRef =
        options?.find((o) => o.title?.toLowerCase().includes("reference") || o.title?.toLowerCase().includes("payment"))?.content ||
        "Receipt";
      const cleanRef = String(orderRef).replace(/[^a-zA-Z0-9-_]/g, "");

      const itemsHtml = Array.isArray(items) && items.length > 0
        ? items.map(x => `
          <div style="background: #F4F5F6; border-radius: 12px; padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box; border: 1px solid #E6E8EC;">
            <div style="font-size: 11px; font-weight: 700; color: #777E90; text-transform: uppercase; letter-spacing: 0.05em;">${x.title || ""}</div>
            <div style="font-size: 14px; font-weight: 600; color: #141416;">${x.content || ""}</div>
          </div>
        `).join("")
        : "";

      const optionsHtml = Array.isArray(options) && options.length > 0
        ? options.map((x, idx) => {
          const isTotal = /total/i.test(x.title || "");
          const bg = isTotal ? "#E6F6F8" : (idx % 2 === 0 ? "#FAFAFB" : "#FFFFFF");
          const textColor = isTotal ? "#0097B2" : "#141416";
          const fontWeight = isTotal ? "800" : "600";
          const fontSize = isTotal ? "16px" : "13px";
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: ${bg}; border-bottom: 1px solid #E6E8EC; font-size: ${fontSize};">
              <span style="color: ${isTotal ? '#0097B2' : '#353945'}; font-weight: ${fontWeight};">${x.title || ""}</span>
              <span style="color: ${textColor}; font-weight: ${fontWeight};">${x.content || ""}</span>
            </div>
          `;
        }).join("")
        : "";

      // Create a fixed off-screen container at (0,0) so html2canvas renders accurately
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.zIndex = "-9999";
      container.style.opacity = "1";
      container.style.pointerEvents = "none";
      container.style.width = "750px";
      container.style.padding = "32px 36px";
      container.style.background = "#ffffff";
      container.style.color = "#141416";
      container.style.boxSizing = "border-box";
      container.style.fontFamily = "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0097B2; margin-bottom: 24px;">
          <div>
            ${isDirectBooking ? `
              <div style="font-size: 24px; font-weight: 800; color: #0097B2; letter-spacing: -0.02em; margin-bottom: 4px;">
                Booking Confirmation
              </div>
            ` : `
              <div style="font-size: 24px; font-weight: 800; color: #0097B2; letter-spacing: -0.02em; margin-bottom: 4px;">
                Little Known Planet
              </div>
              <div style="font-size: 12px; color: #777E90; font-weight: 500;">
                dev.littleknownplanet.com
              </div>
            `}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: 800; color: #0097B2; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(0, 151, 178, 0.08); padding: 4px 12px; border-radius: 100px; display: inline-block; margin-bottom: 6px;">
              Official Receipt
            </div>
            <div style="font-size: 12px; color: #777E90; font-weight: 600;">
              ${formattedDate}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 24px; background: #FAFAFB; border-radius: 16px; padding: 20px; border: 1px solid #E6E8EC;">
          <div style="font-size: 18px; font-weight: 700; color: #141416; margin-bottom: 6px;">
            ${paymentFailed ? "Payment Failed" : (title || "Experience Booking")}
          </div>
          <div style="font-size: 13px; color: ${paymentFailed ? '#E53935' : '#0097B2'}; font-weight: 600; margin-bottom: 8px;">
            ${paymentFailed ? "Your payment could not be processed." : bookedMessage}
          </div>
          ${hostName ? `
            <div style="font-size: 12px; color: #777E90; font-weight: 500;">
              Hosted by <strong style="color: #141416;">${hostName}</strong>
            </div>
          ` : ""}
        </div>

        ${itemsHtml ? `
          <div style="margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
              Reservation Summary
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
              ${itemsHtml}
            </div>
          </div>
        ` : ""}

        ${optionsHtml ? `
          <div style="margin-bottom: 28px;">
            <div style="font-size: 12px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
              Payment & Pricing Breakdown
            </div>
            <div style="border-radius: 12px; overflow: hidden; border: 1px solid #E6E8EC;">
              ${optionsHtml}
            </div>
          </div>
        ` : ""}

        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E6E8EC; font-size: 11px; color: #777E90; line-height: 1.6;">
          <div>${isDirectBooking ? "Thank you for your booking!" : "Thank you for booking with Little Known Planet!"}</div>
          <div style="font-size: 10px; color: #B1B5C3; margin-top: 2px;">
            ${isDirectBooking ? "Secure booking & payment" : "Secure booking & payment powered by Little Known Planet"}
          </div>
        </div>
      `;

      document.body.appendChild(container);

      const opt = {
        margin: [8, 8, 8, 8],
        filename: `${isDirectBooking ? "Receipt" : "LKP_Receipt"}_${cleanRef || "DirectBooking"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollY: 0,
          scrollX: 0,
          windowWidth: 750,
        },
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
