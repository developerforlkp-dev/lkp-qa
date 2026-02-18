import React, { useState, useMemo } from "react";
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
  className,
}) => {
  const [guests, setGuests] = useState(initialGuests);

  // Use maxSeats if provided, otherwise fall back to maxGuests, or undefined (no limit)
  const maxAllowed = maxSeats !== undefined ? maxSeats : (maxGuests !== undefined ? maxGuests : undefined);

  // Keep state in sync with initialGuests prop and enforce maxAllowed
  React.useEffect(() => {
    setGuests(prev => {
      const target = { ...initialGuests };
      const total = target.adults + target.children;

      // If parent state exceeds maxAllowed, clamp it
      if (maxAllowed !== undefined && total > maxAllowed) {
        // Simple clamping: reduce children first, then adults
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

        // Notify parent if we had to clamp
        onGuestChange?.(target);
      }

      // Also ensure infants don't exceed adults
      if (target.infants > target.adults) {
        target.infants = target.adults;
        onGuestChange?.(target);
      }

      return target;
    });
  }, [initialGuests, maxAllowed]);

  const totalGuests = useMemo(() => {
    // Infants don't count toward maximum (matching Airbnb style)
    return guests.adults + guests.children;
  }, [guests.adults, guests.children]);

  const guestCountText = useMemo(() => {
    // Display count excludes infants (matching Airbnb style)
    const total = guests.adults + guests.children;
    if (total === 0) return "Add guests";
    if (total === 1) return "1 guest";
    return `${total} guests`;
  }, [guests.adults, guests.children]);


  const guestCategories = [
    {
      type: "adults",
      label: adultsLabel,
      subtitle: "Age 13+",
      value: guests.adults,
      show: true, // Always show adults
    },
    {
      type: "children",
      label: "Children",
      subtitle: "Ages 2–12",
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
            // Filter categories based on show flag
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
                    <a href="#" className={styles.serviceAnimalLink}>
                      Bringing a service animal?
                    </a>
                  )}
                </div>
                <Counter
                  className={styles.counter}
                  value={category.value}
                  setValue={(newValue) => {
                    setGuests((prev) => {
                      const newGuests = { ...prev };

                      if (category.type === "adults") {
                        // Ensure at least 1 adult if there are children or infants
                        if (newValue === 0 && (prev.children > 0 || prev.infants > 0)) {
                          newValue = 1;
                        }
                        newGuests.adults = newValue;

                        // Limit infants to the same size as adults
                        if (newGuests.infants > newValue) {
                          newGuests.infants = newValue;
                        }
                      } else if (category.type === "children") {
                        newGuests.children = newValue;
                        // Ensure at least 1 adult if there are children
                        if (newValue > 0 && newGuests.adults === 0) {
                          newGuests.adults = 1;
                        }
                      } else if (category.type === "infants") {
                        newGuests.infants = newValue;
                        // Ensure at least 1 adult if there are infants
                        if (newValue > 0 && newGuests.adults === 0) {
                          newGuests.adults = 1;
                        }
                      } else if (category.type === "pets") {
                        newGuests.pets = newValue;
                      }

                      onGuestChange?.(newGuests);
                      return newGuests;
                    });
                  }}
                  iconMinus="minus"
                  iconPlus="plus"
                  min={category.type === "adults" ? (maxAllowed === 0 ? 0 : 1) : 0}
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

