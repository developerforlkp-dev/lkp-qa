import React, { useState } from "react";
import cn from "classnames";
import styles from "./ConfirmAndPay.module.sass";
import CreditCard from "./CreditCard";
import Icon from "../Icon";
import TextArea from "../TextArea";

const ConfirmAndPay = ({
  className,
  guests,
  title,
  buttonUrl,
  amountToPay,
  amountInPaise = false,
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
  const [messageText, setMessageText] = useState("");

  const formatAmount = (amount) => {
    if (!amount) return null;
    const numericAmount = Number(amount) || 0;
    const amountInRupees = amountInPaise ? (numericAmount / 100).toFixed(2) : numericAmount.toFixed(2);
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
                    <div className={styles.info}>
                      {dateValue && (dateValue.includes(" - ") || dateValue.includes(" – ") || dateValue.includes(" to ")) ? "Dates" : "Date"}
                    </div>
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

            <div className={styles.message} style={{ marginTop: '32px', display: 'block' }}>
              <div className={styles.category} style={{ marginBottom: '16px' }}>Message the host</div>
              <TextArea
                className={styles.field}
                name="messageText"
                placeholder="Hi, I need help confirming the booking time."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className={styles.item}>
          <CreditCard className={styles.credit} buttonUrl={buttonUrl} hidePaymentFields paymentData={paymentData} messageText={messageText} />
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPay;


