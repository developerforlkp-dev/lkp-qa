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
  hideHeader,
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
              const renderTitle = (title) => {
                if (typeof title === "string" && /Extra (Adult|Child) Charges/i.test(title) && title.includes("(") && title.includes(")")) {
                  const parts = title.split("(");
                  if (parts.length > 1) {
                    const mainLabel = parts[0].trim();
                    const calculation = "(" + parts.slice(1).join("(").trim();
                    return (
                      <div className={styles.priceDetailsStack}>
                        <span className={styles.mainLabel}>{mainLabel}</span>
                        <span className={styles.calculationLabel}>{calculation}</span>
                      </div>
                    );
                  }
                }
                return title;
              };

              return (
                <div className={styles.row} key={index}>
                  <div className={styles.cell}>{renderTitle(x.title)}</div>
                  <div className={styles.cell}>{x.value}</div>
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
          <CreditCard buttonUrl={buttonUrl} hidePaymentFields paymentData={paymentData} messageText={messageText} />
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
            <Icon name="coin" size="16" />
            <div style={{ whiteSpace: "pre-line" }}>{cancellationPolicy}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceDetails;
