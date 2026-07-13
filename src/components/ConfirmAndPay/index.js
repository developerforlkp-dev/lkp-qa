import React from "react";
import cn from "classnames";
import styles from "./ConfirmAndPay.module.sass";
import Icon from "../Icon";
import TextArea from "../TextArea";

const ConfirmAndPay = ({
  className,
  children,
  guests,
  title,
  dateValue,
  guestValue,
  timeValue,
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
  // Message state passed down
  messageText,
  setMessageText,
}) => {
  return (
    <div className={cn(className, styles.confirm)}>
      <div className={styles.subtitle}>Almost done! Review your trip details and complete your booking.</div>
      
      <div className={styles.stepper}>
        <div className={styles.step}>
          <div className={styles.stepIcon}>
            <Icon name="check" size="16" />
          </div>
          <div className={styles.stepLabel}>Booking details</div>
        </div>
        <div className={styles.stepperLine} />
        <div className={styles.stepActive}>
          <div className={styles.stepIconActive}>2</div>
          <div className={styles.stepLabelActive}>Confirm and pay</div>
        </div>
      </div>
      
      {children}

      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.box}>
            <div className={styles.category}>{title}</div>
            <div className={styles.tripGrid}>
              {isStay ? (
                <>
                  {/* Check-in */}
                  <div className={styles.tripCard}>
                    <div className={styles.cardHeader}>
                      <Icon name="calendar" size="24" />
                      <div className={styles.info}>Check-in</div>
                    </div>
                    <div className={styles.value}>{checkInDate || "Select date"}</div>
                  </div>
                  {/* Check-out */}
                  <div className={styles.tripCard}>
                    <div className={styles.cardHeader}>
                      <Icon name="calendar" size="24" />
                      <div className={styles.info}>Check-out</div>
                    </div>
                    <div className={styles.value}>{checkOutDate || "Select date"}</div>
                  </div>
                  {/* Room type */}
                  {roomType && (
                    <div className={styles.tripCard}>
                      <div className={styles.cardHeader}>
                        <Icon name="home" size="24" />
                        <div className={styles.info}>Room type</div>
                      </div>
                      <div className={styles.value}>{roomType}</div>
                    </div>
                  )}
                  {/* Meal plan */}
                  {mealPlan && (
                    <div className={styles.tripCard}>
                      <div className={styles.cardHeader}>
                        <Icon name="lightning" size="24" />
                        <div className={styles.info}>Meal plan</div>
                      </div>
                      <div className={styles.value}>{mealPlan}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.tripCard}>
                    <div className={styles.cardHeader}>
                      <Icon name="calendar" size="24" />
                      <div className={styles.info}>
                        {dateValue && (dateValue.includes(" - ") || dateValue.includes(" – ") || dateValue.includes(" to ")) ? "Dates" : "Date"}
                      </div>
                      {onEditDate && (
                        <button className={styles.edit} onClick={onEditDate}>
                          <Icon name="edit" size="16" />
                        </button>
                      )}
                    </div>
                    <div className={styles.value}>{dateValue || "Select date"}</div>
                    {onEditDate && datePicker}
                  </div>
                  {timeValue && (
                    <div className={styles.tripCard}>
                      <div className={styles.cardHeader}>
                        <Icon name="clock" size="24" />
                        <div className={styles.info}>Time slot</div>
                      </div>
                      <div className={styles.value}>{timeValue}</div>
                    </div>
                  )}
                  {guests && (
                    <div className={styles.tripCard}>
                      <div className={styles.cardHeader}>
                        <Icon name="user" size="24" />
                        <div className={styles.info}>Guests</div>
                        {onEditGuests && (
                          <button className={styles.edit} onClick={onEditGuests}>
                            <Icon name="edit" size="16" />
                          </button>
                        )}
                      </div>
                      <div className={styles.value}>{guestValue || "Add guests"}</div>
                      {onEditGuests && guestPicker}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.messageSection}>
              <div className={styles.category}>Message the host</div>
              <div className={styles.messageSubtitle}>Let the host know if you have any special requests.</div>
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
      </div>
    </div>
  );
};

export default ConfirmAndPay;


