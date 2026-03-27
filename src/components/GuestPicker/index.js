import React, { useState, useMemo, useRef } from "react";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./GuestPicker.module.sass";
import Icon from "../Icon";
import Counter from "../Counter";

const GuestPicker = ({
  visible,
  onClose,
  onGuestChange,
  initialGuests = {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  },
  maxGuests,
  maxSeats,
  allowPets = false,
  childrenAllowed = true,
  infantsAllowed = true,
  adultsLabel = "Adults",
  adultsSubtitle = "Age 13+",
  childrenSubtitle = "Ages 2-12",
  requireAdultForChildren = true,
  className,
}) => {
  const [guests, setGuests] = useState(initialGuests);
  const skipGuestChangeRef = useRef(true);
  const onGuestChangeRef = useRef(onGuestChange);

  React.useEffect(() => {
    onGuestChangeRef.current = onGuestChange;
  }, [onGuestChange]);

  const maxAllowed =
    maxSeats !== undefined ? maxSeats : (maxGuests !== undefined ? maxGuests : undefined);

  React.useEffect(() => {
    const target = { ...initialGuests };
    const total = target.adults + target.children;
    let changed = false;
    const target = { ...initialGuests };
    const total = target.adults + target.children;
    let changed = false;

    if (maxAllowed !== undefined && total > maxAllowed) {
      if (target.children > 0) {
        const overage = total - maxAllowed;
        target.children = Math.max(0, target.children - overage);
        const newTotal = target.adults + target.children;
        if (newTotal > maxAllowed) {
          target.adults = Math.max(0, maxAllowed);
        }
      } else {
        target.adults = Math.max(0, maxAllowed);
      }
      changed = true;
    }

    if (target.infants > target.adults) {
      target.infants = target.adults;
      changed = true;
    }

    const sameGuests =
      guests.adults === (target.adults || 0) &&
      guests.children === (target.children || 0) &&
      guests.infants === (target.infants || 0) &&
      (guests.pets || 0) === (target.pets || 0);

    if (!sameGuests) {
      skipGuestChangeRef.current = !changed;
      setGuests(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGuests, maxAllowed]);

  React.useEffect(() => {
    if (skipGuestChangeRef.current) {
      skipGuestChangeRef.current = false;
      return;
    }
    onGuestChangeRef.current?.(guests);
  }, [guests]);

  const totalGuests = useMemo(() => {
    return guests.adults + guests.children;
  }, [guests.adults, guests.children]);

  const guestCountText = useMemo(() => {
    const total = guests.adults + guests.children;
    if (total === 0) return "Add guests";
    if (total === 1) return "1 guest";
    return `${total} guests`;
  }, [guests.adults, guests.children]);

  const adultMin = useMemo(() => {
    if (maxAllowed === 0) return 0;
    if (guests.infants > 0) return 1;
    if (requireAdultForChildren && guests.children > 0) return 1;
    return 0;
  }, [guests.children, guests.infants, maxAllowed, requireAdultForChildren]);

  const guestCategories = [
    {
      type: "adults",
      label: adultsLabel,
      subtitle: adultsSubtitle,
      value: guests.adults,
      show: true,
    },
    {
      type: "children",
      label: "Children",
      subtitle: childrenSubtitle,
      value: guests.children,
      show: childrenAllowed,
    },
    {
      type: "infants",
      label: "Infants",
      subtitle: "Under 2",
      value: guests.infants,
      show: infantsAllowed,
    },
    {
      type: "pets",
      label: "Pets",
      subtitle: null,
      value: guests.pets,
      showServiceAnimalLink: true,
      show: allowPets,
    },
  ];

  if (!visible) return null;

  return (
    <OutsideClickHandler onOutsideClick={onClose}>
      <div className={cn(styles.picker, className)}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLabel}>GUESTS</div>
            <div className={styles.headerValue}>{guestCountText}</div>
          </div>
          <button type="button" className={styles.collapseButton} onClick={onClose}>
            <Icon name="arrow-bottom" size="16" />
          </button>
        </div>

        <div className={styles.content}>
          {guestCategories.map((category) => {
            if (!category.show) {
              return null;
            }

            return (
              <div key={category.type} className={styles.categoryRow}>
                <div className={styles.categoryInfo}>
                  <div className={styles.categoryLabel}>{category.label}</div>
                  {category.subtitle && (
                    <div className={styles.categorySubtitle}>{category.subtitle}</div>
                  )}
                  {category.type === "pets" && category.showServiceAnimalLink && (
                    <button type="button" className={styles.serviceAnimalLink}>
                      Bringing a service animal?
                    </button>
                  )}
                </div>
                <Counter
                  className={styles.counter}
                  value={category.value}
                  setValue={(newValue) => {
                    setGuests((prev) => {
                      const newGuests = { ...prev };

                      if (category.type === "adults") {
                        if (
                          newValue === 0 &&
                          ((requireAdultForChildren && prev.children > 0) || prev.infants > 0)
                        ) {
                          newValue = 1;
                        }
                        newGuests.adults = newValue;

                        if (newGuests.infants > newValue) {
                          newGuests.infants = newValue;
                        }
                      } else if (category.type === "children") {
                        newGuests.children = newValue;
                        if (requireAdultForChildren && newValue > 0 && newGuests.adults === 0) {
                          newGuests.adults = 1;
                        }
                      } else if (category.type === "infants") {
                        newGuests.infants = newValue;
                        if (newValue > 0 && newGuests.adults === 0) {
                          newGuests.adults = 1;
                        }
                      } else if (category.type === "pets") {
                        newGuests.pets = newValue;
                      }

                      return newGuests;
                    });
                  }}
                  iconMinus="minus"
                  iconPlus="plus"
                  min={category.type === "adults" ? adultMin : 0}
                  max={
                    category.type === "infants"
                      ? guests.adults
                      : maxAllowed !== undefined
                        ? Math.max(0, maxAllowed - (totalGuests - category.value))
                        : undefined
                  }
                />
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.rules}>
            {maxAllowed !== undefined && (
              <div className={styles.ruleText}>
                {maxAllowed === 0
                  ? "This slot is fully booked."
                  : `This place has a maximum of ${maxAllowed} guests, not including infants.`}
                {!allowPets && " Pets aren't allowed."}
              </div>
            )}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default GuestPicker;
