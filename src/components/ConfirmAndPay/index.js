import React from "react";
import cn from "classnames";
import styles from "./ConfirmAndPay.module.sass";
import CreditCard from "./CreditCard";
import Icon from "../Icon";

const ConfirmAndPay = ({
  className,
  guests,
  title,
  buttonUrl,
  amountToPay,
  currency = "INR",
  dateValue,
  guestValue,
  onEditDate,
  onEditGuests,
  datePicker,
  guestPicker,
  paymentData,
  // Stay-specific props
  isStay,
  checkInDate,
  checkOutDate,
  roomType,
  mealPlan,
}) => {
  const formatAmount = (amount) => {
    if (!amount) return null;
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
              {isStay ? (
                <>
                  {/* Check-in */}
                  <div className={styles.option}>
                    <div className={styles.info}>Check-in</div>
                    <div className={styles.value}>{checkInDate || "Select date"}</div>
                  </div>
                  {/* Check-out */}
                  <div className={styles.option}>
                    <div className={styles.info}>Check-out</div>
                    <div className={styles.value}>{checkOutDate || "Select date"}</div>
                  </div>
                  {/* Room type */}
                  {roomType && (
                    <div className={styles.option}>
                      <div className={styles.info}>Room type</div>
                      <div className={styles.value}>{roomType}</div>
                    </div>
                  )}
                  {/* Meal plan */}
                  {mealPlan && (
                    <div className={styles.option}>
                      <div className={styles.info}>Meal plan</div>
                      <div className={styles.value}>{mealPlan}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.option}>
                    <div className={styles.info}>Dates</div>
                    <input className={styles.input} type="text" />
                    <div className={styles.value}>{dateValue || "Select date"}</div>
                    {onEditDate && (
                      <button className={styles.edit} onClick={onEditDate}>
                        <Icon name="edit" size="24" />
                      </button>
                    )}
                    {onEditDate && datePicker}
                  </div>
                  {guests && (
                    <div className={styles.option}>
                      <div className={styles.info}>Guests</div>
                      <input className={styles.input} type="text" />
                      <div className={styles.value}>{guestValue || "Add guests"}</div>
                      {onEditGuests && (
                        <button className={styles.edit} onClick={onEditGuests}>
                          <Icon name="edit" size="24" />
                        </button>
                      )}
                      {onEditGuests && guestPicker}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className={styles.item}>
          <CreditCard className={styles.credit} buttonUrl={buttonUrl} hidePaymentFields paymentData={paymentData} />
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPay;

