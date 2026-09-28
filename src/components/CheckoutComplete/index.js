import React, { useRef, useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
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
  booking: propBooking,
}) => {
  const receiptRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const bookedMessage = isStay
    ? "Your stay has been booked!"
    : isEvent
      ? "Your event has been booked!"
      : "Your trip has been booked!";

  const handlePrintReceipt = () => {
    if (onPrintReceipt) {
      onPrintReceipt();
      return;
    }

    try {
      setIsPrinting(true);

      // Retrieve full booking context from props or localStorage
      let bookingData = propBooking;
      if (!bookingData && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("checkoutBooking") || localStorage.getItem("pendingBooking");
          if (raw) bookingData = JSON.parse(raw);
        } catch { }
      }

      let directData = {};
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("directBookingData");
          if (raw) directData = JSON.parse(raw);
        } catch { }
      }

      let directPaymentSuccess = {};
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("directPaymentSuccess") || localStorage.getItem("razorpayPaymentSuccess");
          if (raw) directPaymentSuccess = JSON.parse(raw);
        } catch { }
      }

      const formattedDate = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const orderRef =
        options?.find((o) => o.title?.toLowerCase().includes("order") || o.title?.toLowerCase().includes("reference") || o.title?.toLowerCase().includes("payment"))?.content ||
        bookingData?.displayDirectBookingOrderId ||
        bookingData?.displayDirectBookingOrderld ||
        bookingData?.directBookingOrderId ||
        bookingData?.orderId ||
        bookingData?.id ||
        directPaymentSuccess?.displayDirectBookingOrderId ||
        directPaymentSuccess?.displayDirectBookingOrderld ||
        directPaymentSuccess?.directBookingOrderId ||
        directPaymentSuccess?.order_id ||
        directPaymentSuccess?.payment_id ||
        (typeof window !== "undefined" ? localStorage.getItem("displayDirectBookingOrderId") || localStorage.getItem("directBookingOrderId") : null) ||
        "Receipt";
      const cleanRef = String(orderRef).replace(/[^a-zA-Z0-9-_]/g, "");

      // Guest / Bill To Information
      const guestName =
        bookingData?.customerName ||
        bookingData?.guestDetails?.name ||
        [bookingData?.guestDetails?.firstName, bookingData?.guestDetails?.lastName].filter(Boolean).join(" ") ||
        bookingData?.guest?.name ||
        "Guest";
      const guestPhone =
        bookingData?.customerPhone ||
        bookingData?.guestDetails?.mobileNumber ||
        bookingData?.guestDetails?.phone ||
        bookingData?.guest?.phone ||
        "";
      const guestEmail =
        bookingData?.customerEmail ||
        bookingData?.guestDetails?.email ||
        bookingData?.guest?.email ||
        "";

      // Host and Experience details
      const hostDisplayName =
        hostName ||
        bookingData?.officialName ||
        directData?.officialName ||
        bookingData?.hostName ||
        directData?.leadName ||
        bookingData?.directBooking?.leadName ||
        "Experience Host";

      const experienceTitle =
        title ||
        bookingData?.listingTitle ||
        bookingData?.title ||
        directData?.title ||
        "Experience Booking";

      const meetingLoc =
        bookingData?.meetingAddress ||
        directData?.meetingAddress ||
        bookingData?.meetingLocationName ||
        directData?.meetingLocationName ||
        bookingData?.location ||
        "";

      const utrNumber =
        bookingData?.utrNumber ||
        directPaymentSuccess?.utrNumber ||
        (typeof window !== "undefined" && bookingData?.orderId ? localStorage.getItem(`utr_${bookingData.orderId}`) : null) ||
        (typeof window !== "undefined" && cleanRef ? localStorage.getItem(`utr_${cleanRef}`) : null) ||
        "";

      const itemsHtml = Array.isArray(items) && items.length > 0
        ? items.map((x) => `
          <div style="background: #F4F5F6; border-radius: 10px; padding: 12px 16px; border: 1px solid #E6E8EC;">
            <div style="font-size: 11px; font-weight: 700; color: #777E90; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${x.title || ""}</div>
            <div style="font-size: 14px; font-weight: 600; color: #141416;">${x.content || "—"}</div>
          </div>
        `).join("")
        : "";

      const optionsHtml = Array.isArray(options) && options.length > 0
        ? options.map((x, idx) => {
          const isTotal = /total/i.test(x.title || "") || /amount/i.test(x.title || "");
          const bg = isTotal ? "#E6F6F8" : (idx % 2 === 0 ? "#FAFAFB" : "#FFFFFF");
          const textColor = isTotal ? "#0097B2" : "#141416";
          const fontWeight = isTotal ? "800" : "600";
          const fontSize = isTotal ? "15px" : "13px";
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: ${bg}; border-bottom: 1px solid #E6E8EC; font-size: ${fontSize};">
              <span style="color: ${isTotal ? '#0097B2' : '#353945'}; font-weight: ${fontWeight};">${x.title || ""}</span>
              <span style="color: ${textColor}; font-weight: ${fontWeight};">${x.content || ""}</span>
            </div>
          `;
        }).join("")
        : "";

      // Add-ons list if present
      const addons = bookingData?.addons || bookingData?.selectedAddOns || [];
      const addonsHtml = Array.isArray(addons) && addons.length > 0
        ? `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
              Selected Add-ons
            </div>
            <div style="border-radius: 10px; overflow: hidden; border: 1px solid #E6E8EC;">
              ${addons.map((a, i) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: ${i % 2 === 0 ? '#FAFAFB' : '#FFFFFF'}; border-bottom: 1px solid #E6E8EC; font-size: 12px;">
                  <span style="color: #141416; font-weight: 600;">${a.title || a.name || "Add-on"} ${a.quantity ? `(x${a.quantity})` : ""}</span>
                  <span style="color: #353945; font-weight: 600;">₹${Number(a.price || a.amount || 0).toFixed(2)}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `
        : "";

      // Meeting Instructions / Rules if available
      const meetingNotes = bookingData?.meetingInstructions || directData?.meetingInstructions || "";
      const instructionsHtml = meetingNotes
        ? `
          <div style="margin-bottom: 20px; background: #F8FAFC; border-radius: 12px; padding: 14px 18px; border: 1px solid #E2E8F0;">
            <div style="font-size: 11px; font-weight: 800; color: #0097B2; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
              Meeting & Arrival Instructions
            </div>
            <div style="font-size: 12px; color: #475569; line-height: 1.5; white-space: pre-line;">
              ${meetingNotes}
            </div>
          </div>
        `
        : "";

      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt_${cleanRef || "DirectBooking"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #141416;
              background: #ffffff;
              margin: 0;
              padding: 16px;
              font-size: 13px;
              line-height: 1.5;
            }
            .receipt-container {
              max-width: 750px;
              margin: 0 auto;
              padding: 24px 28px;
              border: 1px solid #E6E8EC;
              border-radius: 12px;
            }
            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .receipt-container {
                border: none;
                padding: 0;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #0097B2; margin-bottom: 20px;">
              <div>
                <div style="font-size: 22px; font-weight: 800; color: #0097B2; letter-spacing: -0.02em; margin-bottom: 2px;">
                  ${hostDisplayName}
                </div>
                <div style="font-size: 12px; color: #777E90; font-weight: 600;">
                  ${isDirectBooking ? "Official Direct Booking Receipt" : "Official Booking Receipt"}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; font-weight: 800; color: #0097B2; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(0, 151, 178, 0.08); padding: 4px 12px; border-radius: 100px; display: inline-block; margin-bottom: 4px;">
                  ${cleanRef ? `Ref: ${cleanRef}` : "Confirmed"}
                </div>
                <div style="font-size: 12px; color: #777E90; font-weight: 600;">
                  Date: ${formattedDate}
                </div>
              </div>
            </div>

            <!-- Bill To & Booking Info Cards -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px;">
              <div style="background: #FAFAFB; border-radius: 12px; padding: 14px 16px; border: 1px solid #E6E8EC;">
                <div style="font-size: 11px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                  Bill To / Guest
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #141416; margin-bottom: 2px;">${guestName}</div>
                ${guestPhone ? `<div style="font-size: 12px; color: #777E90;">Phone: ${guestPhone}</div>` : ""}
                ${guestEmail ? `<div style="font-size: 12px; color: #777E90;">Email: ${guestEmail}</div>` : ""}
                ${utrNumber ? `<div style="font-size: 12px; color: #0097B2; font-weight: 600; margin-top: 4px;">UTR: ${utrNumber}</div>` : ""}
              </div>

              <div style="background: #FAFAFB; border-radius: 12px; padding: 14px 16px; border: 1px solid #E6E8EC;">
                <div style="font-size: 11px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
                  Experience & Location
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #141416; margin-bottom: 2px;">${experienceTitle}</div>
                <div style="font-size: 12px; color: #777E90;">Hosted by ${hostDisplayName}</div>
                ${meetingLoc ? `<div style="font-size: 12px; color: #777E90; margin-top: 2px;">📍 ${meetingLoc}</div>` : ""}
              </div>
            </div>

            ${itemsHtml ? `
              <div style="margin-bottom: 20px;">
                <div style="font-size: 11px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  Reservation Summary
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                  ${itemsHtml}
                </div>
              </div>
            ` : ""}

            ${addonsHtml}

            ${optionsHtml ? `
              <div style="margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; color: #777E90; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                  Payment & Pricing Breakdown
                </div>
                <div style="border-radius: 12px; overflow: hidden; border: 1px solid #E6E8EC;">
                  ${optionsHtml}
                </div>
              </div>
            ` : ""}

            ${instructionsHtml}

            <div style="text-align: center; padding-top: 14px; border-top: 1px solid #E6E8EC; font-size: 11px; color: #777E90; line-height: 1.6;">
              <div>Thank you for your booking! This is your official electronic booking receipt.</div>
              <div style="font-size: 10px; color: #B1B5C3; margin-top: 2px;">
                ${isDirectBooking ? `Direct Booking • ${hostDisplayName}` : "Secure booking powered by Little Known Planet"}
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a hidden iframe to print cleanly without full-page disturbance
      const iframe = document.createElement("iframe");
      iframe.setAttribute("style", "position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0; visibility: hidden;");
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(receiptContent);
      doc.close();

      const triggerPrint = () => {
        try {
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        } catch (e) {
          console.error("Iframe print error, falling back to window.print():", e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            setIsPrinting(false);
          }, 1500);
        }
      };

      setTimeout(triggerPrint, 250);
    } catch (err) {
      console.error("Receipt generation error:", err);
      window.print();
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
