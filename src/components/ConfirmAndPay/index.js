import React from "react";
import cn from "classnames";
import styles from "./ConfirmAndPay.module.sass";
import Icon from "../Icon";
import TextArea from "../TextArea";
import GuestDetailsForm from "../GuestDetailsForm";

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
  childAges = [],
  addonDetails,
  addOns,
  currency = "INR",
  // Message state passed down
  messageText,
  setMessageText,
  guestDetails,
  setGuestDetails,
  guestErrors = {},
  numberOfGuests,
}) => {
  const parseNumericAmount = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };

  const getFirstPositiveNumber = (...candidates) => {
    for (const c of candidates) {
      const n = parseNumericAmount(c);
      if (n > 0) return n;
    }
    return 0;
  };

  const getFirstNonEmptyString = (...candidates) => {
    for (const c of candidates) {
      if (c && typeof c === "string" && c.trim() && c.trim().toLowerCase() !== "add-on") {
        return c.trim();
      }
    }
    return null;
  };

  const displayAddons = addonDetails && addonDetails.length > 0
    ? addonDetails
    : (addOns || []);
  
  const addonsSection = displayAddons.length > 0 && (
    <div className={styles.addOnsSection}>
      <div className={styles.addOnsTitle}>Selected Add-ons</div>
      <div className={styles.addOnsList}>
        {displayAddons.map((addonItem, index) => {
          const addonObj = (addonItem && typeof addonItem === "object" && addonItem.addon) ? addonItem.addon : (addonItem || {});
          const addonId = addonItem.addonId || addonObj.addonId || addonItem.id || addonObj.id;

          const fallbackItem = Array.isArray(addOns)
            ? addOns.find((a) => {
                const aObj = (a && typeof a === "object" && a.addon) ? a.addon : (a || {});
                const aId = a.addonId || a.id || aObj.addonId || aObj.id;
                return String(aId) === String(addonId);
              })
            : null;
          const fallbackObj = (fallbackItem && typeof fallbackItem === "object" && fallbackItem.addon) ? fallbackItem.addon : (fallbackItem || {});

          const addonName = getFirstNonEmptyString(
            addonItem.name,
            addonItem.addonName,
            addonItem.title,
            addonObj.name,
            addonObj.addonName,
            addonObj.title,
            fallbackItem?.name,
            fallbackItem?.addonName,
            fallbackItem?.title,
            fallbackObj?.name,
            fallbackObj?.addonName,
            fallbackObj?.title
          ) || (typeof addonItem === "string" ? addonItem : "Add-on");

          const addonQty = getFirstPositiveNumber(
            addonItem.quantity,
            addonObj.quantity,
            fallbackItem?.quantity,
            fallbackObj?.quantity
          ) || 1;

          const unitPrice = getFirstPositiveNumber(
            addonItem.pricePerUnit,
            addonItem.price,
            addonItem.addonPrice,
            addonItem.pricePerItem,
            addonItem.unitPrice,
            addonObj.pricePerUnit,
            addonObj.price,
            addonObj.addonPrice,
            addonObj.pricePerItem,
            addonObj.unitPrice,
            fallbackItem?.pricePerUnit,
            fallbackItem?.price,
            fallbackItem?.addonPrice,
            fallbackItem?.pricePerItem,
            fallbackItem?.unitPrice,
            fallbackObj?.pricePerUnit,
            fallbackObj?.price,
            fallbackObj?.addonPrice,
            fallbackObj?.pricePerItem,
            fallbackObj?.unitPrice
          );

          const subtotalCandidate = getFirstPositiveNumber(
            addonItem.totalPrice,
            addonItem.priceValue,
            addonItem.amount,
            addonObj.totalPrice,
            addonObj.priceValue,
            addonObj.amount,
            fallbackItem?.totalPrice,
            fallbackItem?.priceValue,
            fallbackItem?.amount,
            fallbackObj?.totalPrice,
            fallbackObj?.priceValue,
            fallbackObj?.amount
          );

          const subtotal = subtotalCandidate > 0 ? subtotalCandidate : (unitPrice * addonQty);
          const addonImg =
            addonItem.image ||
            addonItem.imageUrl ||
            addonObj.image ||
            addonObj.imageUrl ||
            addonObj.coverImageUrl ||
            fallbackItem?.image ||
            fallbackItem?.imageUrl ||
            fallbackObj?.image ||
            fallbackObj?.imageUrl ||
            fallbackObj?.coverImageUrl ||
            null;

          return (
            <div className={styles.addOnItem} key={addonItem.addonId || addonObj.addonId || index}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                {addonImg && (
                  <img
                    src={addonImg}
                    alt={addonName}
                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0, display: "block" }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div className={styles.addOnItemName}>
                    {addonName}
                    <span style={{ opacity: 0.6, marginLeft: 4 }}>×{addonQty}</span>
                  </div>
                </div>
              </div>
              <div className={styles.addOnItemPrice} style={{ flexShrink: 0 }}>
                {currency} {Number(subtotal).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

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
      
      {guestDetails && setGuestDetails && (
        <GuestDetailsForm
          guestDetails={guestDetails}
          setGuestDetails={setGuestDetails}
          guestErrors={guestErrors}
          numberOfGuests={numberOfGuests || 1}
        />
      )}
      
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
                  {childAges.length > 0 && (
                    <div className={styles.tripCard}>
                      <div className={styles.cardHeader}>
                        <Icon name="user" size="24" />
                        <div className={styles.info}>Child ages</div>
                      </div>
                      <div className={styles.value}>{childAges.join(", ")}</div>
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
            
            {addonsSection}

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


