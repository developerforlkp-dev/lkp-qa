import React from "react";
import cn from "classnames";
import styles from "./ConfirmAndPay.module.sass";
import CreditCard from "./CreditCard";
import Icon from "../Icon";

const ConfirmAndPay = ({ className, guests, title, buttonUrl, amountToPay, currency = "INR", dateValue, guestValue, onEditDate, onEditGuests, datePicker, guestPicker }) => {
  // keep minimal local state if needed later

  // Format amount - Razorpay amounts are in paise (smallest currency unit), so divide by 100 for INR
  const formatAmount = (amount) => {
    if (!amount) return null;
    // If amount is in paise (typically > 1000 for reasonable prices), convert to rupees
    const amountInRupees = amount > 1000 ? (amount / 100).toFixed(2) : amount.toFixed(2);
    return `${currency} ${amountInRupees}`;
  };

  return (
    <div className={cn(className, styles.confirm)}>
      <div className={cn("h2", styles.title)}>Confirm and pay</div>
      {amountToPay && (
        <div className={styles.amountToPay}>
          <div className={styles.amountLabel}>Amount to be paid</div>
          <div className={styles.amountValue}>{formatAmount(amountToPay)}</div>
        </div>
      )}
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.box}>
            <div className={styles.category}>{title}</div>
            <div className={styles.group}>
              <div className={styles.option}>
                <div className={styles.info}>Dates</div>
                <input className={styles.input} type="text" />
                <div className={styles.value}>{dateValue || "Select date"}</div>
                <button className={styles.edit} onClick={onEditDate}>
                  <Icon name="edit" size="24" />
                </button>
                {datePicker}
              </div>
              {guests && (
                <div className={styles.option}>
                  <div className={styles.info}>Guests</div>
                  <input className={styles.input} type="text" />
                  <div className={styles.value}>{guestValue || "Add guests"}</div>
                  <button className={styles.edit} onClick={onEditGuests}>
                    <Icon name="edit" size="24" />
                  </button>
                  {guestPicker}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.item}>
          <CreditCard className={styles.credit} buttonUrl={buttonUrl} hidePaymentFields />
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPay;
