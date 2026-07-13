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
        {displayAddons.length > 0 && (
          <div className={styles.addOnsSection}>
            <div className={styles.addOnsTitle}>Selected Add-ons</div>
            <div className={styles.addOnsList}>
              {displayAddons.map((addon, index) => {
                const addonName = addon.name || addon.addonName || addon.title || "Add-on";
                const addonQty = addon.quantity || 1;
                const unitPrice = parseNumericAmount(addon.pricePerUnit ?? addon.price);
                const subtotal = parseNumericAmount(addon.totalPrice ?? addon.priceValue) || (unitPrice * addonQty);

                return (
                  <div className={styles.addOnItem} key={addon.addonId || index}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      {addon.image && (
                        <img
                          src={addon.image}
                          alt={addonName}
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0, display: "block" }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.addOnItemName}>
                          {addonName}
                          <span style={{ opacity: 0.6, marginLeft: 4 }}>×{addonQty}</span>
                        </div>
                        {unitPrice > 0 && (
                          <div style={{ fontSize: 12, color: "#9A9FA5", marginTop: 2 }}>
                            {currency} {Number(unitPrice).toFixed(2)} / item
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.addOnItemPrice} style={{ flexShrink: 0 }}>
                      {currency} {Number(subtotal).toFixed(2)}
                    </div>
                    {onRemoveAddOn && (
                      <button className={styles.addOnRemoveButton} onClick={() => onRemoveAddOn(index)} title="Remove add-on">
                        <Icon name="close" size="12" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
