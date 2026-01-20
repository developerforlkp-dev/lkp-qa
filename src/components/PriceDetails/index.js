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
  onRemoveAddOn,
  amountToPay,
  currency = "INR",
  hostName,
  hostAvatar,
}) => {
  const [discound, setDiscound] = useState("");

  const handleSubmit = (e) => {
    alert();
  };

  // Format amount - Razorpay amounts are in paise (smallest currency unit), so divide by 100 for INR
  const formatAmount = (amount) => {
    if (!amount) return null;
    // If amount is in paise (typically > 1000 for reasonable prices), convert to rupees
    const amountInRupees = amount > 1000 ? (amount / 100).toFixed(2) : amount.toFixed(2);
    return `${currency} ${amountInRupees}`;
  };

  return (
    <div className={cn(className, styles.price)}>
      {more ? (
        <HeadMoreOptions className={styles.head} image={image} title={title} hostName={hostName} hostAvatar={hostAvatar} />
      ) : (
        <HeadOptions className={styles.head} image={image} title={title} hostName={hostName} hostAvatar={hostAvatar} />
      )}
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
        {amountToPay && (
          <div className={styles.amountToPaySection}>
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
        <div className={styles.table}>
          {table.map((x, index) => (
            <div className={styles.row} key={index}>
              <div className={styles.cell}>{x.title}</div>
              <div className={styles.cell}>{x.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.note}>
        <Icon name="coin" size="12" />
        Free cancellation until 3:00 PM on May 15, 2021
      </div>
    </div>
  );
};

export default PriceDetails;
