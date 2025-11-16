import React, { useState, useMemo } from "react";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./GuestPicker.module.sass";
import Icon from "../Icon";

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
  maxGuests = 4,
  maxSeats,
  allowPets = false,
  childrenAllowed = true,
  infantsAllowed = true,
  className,
}) => {
  const [guests, setGuests] = useState(initialGuests);

  // Use maxSeats if provided, otherwise fall back to maxGuests
  const maxAllowed = maxSeats !== undefined ? maxSeats : maxGuests;

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
  }, [guests]);

  const handleIncrement = (type) => {
    setGuests((prev) => {
      const newGuests = { ...prev };
      
      if (type === "adults") {
        newGuests.adults = Math.min(newGuests.adults + 1, maxAllowed);
      } else if (type === "children") {
        const total = newGuests.adults + newGuests.children;
        if (total < maxAllowed) {
          newGuests.children = newGuests.children + 1;
        }
      } else if (type === "infants") {
        newGuests.infants = newGuests.infants + 1;
      } else if (type === "pets" && allowPets) {
        newGuests.pets = newGuests.pets + 1;
      }
      
      onGuestChange?.(newGuests);
      return newGuests;
    });
  };

  const handleDecrement = (type) => {
    setGuests((prev) => {
      const newGuests = { ...prev };
      
      if (type === "adults" && newGuests.adults > 0) {
        newGuests.adults = Math.max(0, newGuests.adults - 1);
        // Ensure at least 1 adult if there are children
        if (newGuests.children > 0 && newGuests.adults === 0) {
          newGuests.adults = 1;
        }
      } else if (type === "children" && newGuests.children > 0) {
        newGuests.children = newGuests.children - 1;
      } else if (type === "infants" && newGuests.infants > 0) {
        newGuests.infants = newGuests.infants - 1;
      } else if (type === "pets" && newGuests.pets > 0) {
        newGuests.pets = newGuests.pets - 1;
      }
      
      onGuestChange?.(newGuests);
      return newGuests;
    });
  };

  const canIncrement = (type) => {
    if (type === "adults") {
      return guests.adults < maxAllowed;
    } else if (type === "children") {
      return totalGuests < maxAllowed;
    } else if (type === "infants") {
      return true; // No limit on infants
    } else if (type === "pets") {
      return allowPets;
    }
    return false;
  };

  const canDecrement = (type) => {
    if (type === "adults") {
      return guests.adults > 1 || (guests.adults === 1 && guests.children === 0);
    } else if (type === "children") {
      return guests.children > 0;
    } else if (type === "infants") {
      return guests.infants > 0;
    } else if (type === "pets") {
      return guests.pets > 0;
    }
    return false;
  };

  const guestCategories = [
    {
      type: "adults",
      label: "Adults",
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
          <button className={styles.collapseButton} onClick={onClose}>
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
                <div className={styles.counter}>
                  <button
                    className={cn(styles.counterButton, {
                      [styles.disabled]: !canDecrement(category.type),
                    })}
                    onClick={() => handleDecrement(category.type)}
                    disabled={!canDecrement(category.type)}
                  >
                    <Icon name="minus" size="16" />
                  </button>
                  <div className={styles.counterValue}>{category.value}</div>
                  <button
                    className={cn(styles.counterButton, {
                      [styles.disabled]: !canIncrement(category.type),
                    })}
                    onClick={() => handleIncrement(category.type)}
                    disabled={!canIncrement(category.type)}
                  >
                    <Icon name="plus" size="16" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <div className={styles.rules}>
            {maxAllowed > 0 && (
              <div className={styles.ruleText}>
                This place has a maximum of {maxAllowed} guests, not including infants.
                {!allowPets && " Pets aren't allowed."}
              </div>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default GuestPicker;

