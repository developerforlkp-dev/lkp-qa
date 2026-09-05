import React, { useState } from "react";
import cn from "classnames";
import styles from "./PriceDetails.module.sass";
import HeadMoreOptions from "./HeadMoreOptions";
import HeadOptions from "./HeadOptions";
import Icon from "../Icon";
import Form from "../Form";
import CreditCard from "../ConfirmAndPay/CreditCard";

const PriceDetails = ({
  className,
  more,
  image,
  title,
  items,
  table,
  discoundCode,
  addOns,
  addonDetails,
  onRemoveAddOn,
  amountToPay,
  amountInPaise = false,
  currency = "INR",
  hostName,
  hostAvatar,
  cancellationPolicy,
  rating,
  reviewsCount,
  buttonUrl,
  paymentData,
  messageText,
  bookingData,
  hideHeader,
  guestDetails,
  onGuestValidationFailed,
  hideCancellationIcon,
}) => {
  const [discound, setDiscound] = useState("");

  const handleSubmit = () => {
    alert();
  };

  const parseNumericAmount = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };

  const formatAmount = (amount) => {
    if (!amount) return null;
    const numericAmount = Number(amount) || 0;
    const amountInRupees = amountInPaise ? (numericAmount / 100).toFixed(2) : numericAmount.toFixed(2);
    return `${currency} ${amountInRupees}`;
  };

  const displayAddons = addonDetails && addonDetails.length > 0
    ? addonDetails
    : (addOns || []);

  return (
    <div className={cn(className, styles.price)}>
      {!hideHeader && (
        more ? (
          <HeadMoreOptions
            className={styles.head}
            image={image}
            title={title}
            hostName={hostName}
            hostAvatar={hostAvatar}
            rating={rating}
            reviewsCount={reviewsCount}
          />
        ) : (
          <HeadOptions
            className={styles.head}
            image={image}
            title={title}
            hostName={hostName}
            hostAvatar={hostAvatar}
          />
        )
      )}

      {/* Removed duplicate Booking summary items (Date / Time / Guests) since they are on the left */}

      <div className={cn(styles.body, { [styles.bodyNoHeader]: hideHeader })}>

        <div className={styles.stage}>Price details</div>

        {table && table.length > 0 && (
          <div className={styles.table}>
            {table.map((x, index) => {
              const title = x?.title || "";
              const value = x?.value || "";

              const resolveColor = (colorStr, defaultColor) => {
                if (!colorStr || typeof colorStr !== "string") return defaultColor;
                const trimmed = colorStr.trim();
                if (trimmed.startsWith("#") || trimmed.startsWith("rgb") || trimmed.startsWith("hsl")) {
                  return trimmed;
                }
                const lower = trimmed.toLowerCase();
                if (lower === "grey" || lower === "gray") return "#B0B4BD";
                if (lower === "black") return undefined;
                return lower;
              };

              const renderTitle = (t, item) => {
                const isDiscountItem =
                  item?.isDiscount ||
                  item?.code === "discount" ||
                  item?.code === "earlybird" ||
                  item?.code === "longstay" ||
                  item?.code === "promo" ||
                  item?.code === "seasonal" ||
                  (typeof item?.code === "string" && (item.code.includes("discount") || item.code.includes("stay") || item.code.includes("bird") || item.code.includes("promo") || item.code.includes("season"))) ||
                  /discount/i.test(item?.title || t || "") ||
                  /early\s*bird/i.test(item?.title || t || "") ||
                  /long\s*stay/i.test(item?.title || t || "");

                const titleColor = resolveColor(item?.titleColor);
                const titleStyle = titleColor ? { color: titleColor } : undefined;

                if (isDiscountItem) {
                  return <span className={styles.mainLabel}>{item?.title || t}</span>;
                }

                if (item?.subtitle) {
                  return (
                    <div className={styles.priceDetailsStack}>
                      <span className={styles.mainLabel}>{item.title}</span>
                      <span className={styles.calculationLabel}>{item.subtitle}</span>
                    </div>
                  );
                }
                if (typeof t === "string" && t.includes("(") && t.includes(")")) {
                  const parts = t.split("(");
                  if (parts.length > 1) {
                    const mainLabel = parts[0].trim();
                    const detail = "(" + parts.slice(1).join("(").trim();
                    return (
                      <div className={styles.priceDetailsStack}>
                        <span className={styles.mainLabel}>{mainLabel}</span>
                        <span className={styles.calculationLabel}>{detail}</span>
                      </div>
                    );
                  }
                }
                if (titleColor) {
                  // Fallback for simple titles with color, wrapping in mainLabel to enforce dark mode adaptation
                  return <span className={styles.mainLabel}>{t}</span>;
                }
                return <span className={styles.mainLabel}>{t}</span>;
              };

              // Ignore valueColor if it breaks dark mode, relying on CSS instead
              // const valueColor = resolveColor(x?.valueColor);
              // const valueStyle = valueColor ? { color: valueColor } : undefined;

              return (
                <div className={styles.row} key={index}>
                  <div className={styles.cell}>{renderTitle(title, x)}</div>
                  <div className={styles.cell}>{value}</div>
                </div>
              );
            })}
          </div>
        )}

        {amountToPay && (
          <div className={styles.highlightedAmount}>
            <div className={styles.amountLabel}>Amount to be paid</div>
            <div className={styles.amountValue}>{formatAmount(amountToPay)}</div>
          </div>
        )}

        {/* ── Checkout Button ── */}
        <div className={styles.checkoutAction}>
          <CreditCard 
            buttonUrl={buttonUrl} 
            hidePaymentFields 
            paymentData={paymentData} 
            messageText={messageText} 
            bookingData={bookingData}
            guestDetails={guestDetails}
            onGuestValidationFailed={onGuestValidationFailed}
          />
        </div>

        {discoundCode && (
          <Form
            className={styles.form}
            value={discound}
            setValue={setDiscound}
            onSubmit={() => handleSubmit()}
            placeholder="Enter discound code"
            type="text"
            name="code"
            icon="arrow-next"
          />
        )}

        {cancellationPolicy && (
          <div className={styles.cancellation}>
            {!hideCancellationIcon && <Icon name="coin" size="16" />}
            <div className={styles.cancellationList}>
              {cancellationPolicy.split('.').map(p => p.trim()).filter(Boolean).map((policy, idx) => (
                <div key={idx} className={styles.cancellationItem}>
                  <span className={styles.bullet}>•</span>
                  <span>{policy}.</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceDetails;
