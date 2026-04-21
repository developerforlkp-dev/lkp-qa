import React, { useState } from "react";
import cn from "classnames";
import styles from "./PriceDetails.module.sass";
import HeadMoreOptions from "./HeadMoreOptions";
import HeadOptions from "./HeadOptions";
import Icon from "../Icon";
import Form from "../Form";

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
  currency = "INR",
  hostName,
  hostAvatar,
}) => {
  const [discound, setDiscound] = useState("");

  const handleSubmit = () => {
    alert();
  };

  // Format amount - Razorpay amounts are in paise (smallest currency unit), so divide by 100 for INR
  const formatAmount = (amount) => {
    if (!amount) return null;
    const amountInRupees = amount > 1000 ? (amount / 100).toFixed(2) : amount.toFixed(2);
    return `${currency} ${amountInRupees}`;
  };

  // Prefer addonDetails (enriched from server) over legacy addOns prop
  const displayAddons = addonDetails && addonDetails.length > 0
    ? addonDetails
    : (addOns || []);

  return (
    <div className={cn(className, styles.price)}>
      {more ? (
        <HeadMoreOptions
          className={styles.head}
          image={image}
          title={title}
          hostName={hostName}
          hostAvatar={hostAvatar}
        />
      ) : (
        <HeadOptions
          className={styles.head}
          image={image}
          title={title}
          hostName={hostName}
          hostAvatar={hostAvatar}
        />
      )}

      {/* ── Booking summary items (date / time / guests) ── */}
      <div
        className={cn(styles.description, {
          [styles.flex]: items.length > 1,
        })}
      >
        {items.map((x, index) => (
          <div className={styles.item} key={index}>
            <div className={styles.icon}>
              <Icon name={x.icon} size="24" />
            </div>
            <div className={styles.box}>
              <div className={styles.category}>{x.category}</div>
              <div className={styles.subtitle}>{x.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.body}>
        <div className={styles.stage}>Price details</div>

        {/* ── Pricing breakdown rows (base price, add-ons, commission, tax, discount) ── */}
        {table && table.length > 0 && (
          <div className={styles.table}>
            {table.map((x, index) => (
              <div className={styles.row} key={index}>
                <div className={styles.cell}>
                  {typeof x.title === "string" && (x.title.includes(" × ") || x.title.includes(" x ")) ? (
                    <div className={styles.priceDetailsStack}>
                      {x.title.split(/(?= [×x] )/).map((part, i) => (
                        <span key={i}>{part.trim()}</span>
                      ))}
                    </div>
                  ) : (
                    x.title
                  )}
                </div>
                <div className={styles.cell}>{x.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Selected add-on cards ── */}
        {displayAddons.length > 0 && (
          <div className={styles.addOnsSection}>
            <div className={styles.addOnsTitle}>Selected Add-ons</div>
            <div className={styles.addOnsList}>
              {displayAddons.map((addon, index) => (
                <div className={styles.addOnItem} key={addon.addonId || index}>
                  {/* Left: image + name/subtitle stacked */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    {addon.image && (
                      <img
                        src={addon.image}
                        alt={addon.name}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: "cover",
                          borderRadius: 8,
                          flexShrink: 0,
                          display: "block",
                        }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      {/* Addon name */}
                      <div className={styles.addOnItemName}>
                        {addon.name}
                        {addon.quantity > 1 && (
                          <span style={{ opacity: 0.6, marginLeft: 4 }}>
                            ×{addon.quantity}
                          </span>
                        )}
                      </div>
                      {/* Per-unit price as subtitle */}
                      {addon.pricePerUnit > 0 && (
                        <div style={{ fontSize: 12, color: "#9A9FA5", marginTop: 2 }}>
                          {currency} {Number(addon.pricePerUnit).toFixed(2)} / item
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: total price */}
                  <div className={styles.addOnItemPrice} style={{ flexShrink: 0 }}>
                    {currency} {Number(addon.totalPrice || addon.pricePerUnit || 0).toFixed(2)}
                  </div>

                  {/* Optional remove button */}
                  {onRemoveAddOn && (
                    <button
                      className={styles.addOnRemoveButton}
                      onClick={() => onRemoveAddOn(index)}
                      title="Remove add-on"
                    >
                      <Icon name="close" size="12" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Amount to be paid ── */}
        {amountToPay && (
          <div className={styles.amountToPaySection} style={{ marginTop: 24 }}>
            <div className={styles.amountToPayLabel}>Amount to be paid</div>
            <div className={styles.amountToPayValue}>{formatAmount(amountToPay)}</div>
          </div>
        )}

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
      </div>

      <div className={styles.note}>
        <Icon name="coin" size="12" />
        Free cancellation until 3:00 PM on May 15, 2021
      </div>
    </div>
  );
};

export default PriceDetails;
