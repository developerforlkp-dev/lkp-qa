import React, { useState, useMemo } from "react";
import cn from "classnames";
import { useHistory } from "react-router-dom";
import styles from "./AddOnsModal.module.sass";
import Modal from "../Modal";
import Checkbox from "../Checkbox";
import Icon from "../Icon";

const mockAddOns = [
  {
    id: 1,
    name: "Airport Transfer",
    description: "Complimentary pick-up and drop-off service from Queenstown Airport",
    price: 45,
    image: "",
  },
  {
    id: 2,
    name: "Breakfast Package",
    description: "Daily continental breakfast with local specialties included",
    price: 25,
    image: "",
  },
  {
    id: 3,
    name: "Spa & Wellness",
    description: "Access to on-site spa facilities and wellness amenities",
    price: 80,
    image: "",
  },
  {
    id: 4,
    name: "Late Checkout",
    description: "Extend your checkout until 2 PM at no additional charge",
    price: 30,
    image: "",
  },
  {
    id: 5,
    name: "Room Upgrade",
    description: "Upgrade to a suite with mountain views and premium amenities",
    price: 150,
    image: "",
  },
  {
    id: 6,
    name: "WiFi Premium",
    description: "High-speed internet connection with unlimited data",
    price: 15,
    image: "",
  },
];

const baseTotal = 833; // From the receipt data

const AddOnsModal = ({ visible, onClose, basePrice = baseTotal }) => {
  const history = useHistory();
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const handleToggleAddOn = (addOnId) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const { totalAddOnsPrice, finalTotal, selectedAddOnsData, selectedNames } = useMemo(() => {
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      const addOn = mockAddOns.find((a) => a.id === id);
      return sum + (addOn?.price || 0);
    }, 0);
    const data = selectedAddOns
      .map((id) => mockAddOns.find((a) => a.id === id))
      .filter(Boolean);
    return {
      totalAddOnsPrice: addOnsPrice,
      finalTotal: basePrice + addOnsPrice,
      selectedAddOnsData: data,
      selectedNames: data.map((d) => d.name),
    };
  }, [selectedAddOns, basePrice]);

  const selectedCount = selectedAddOns.length;

  const handleSkip = () => {
    setSelectedAddOns([]);
    onClose();
    history.push({
      pathname: "/experience-checkout",
      state: { addOns: [] },
    });
  };

  const handleContinue = () => {
    onClose();
    history.push({
      pathname: "/experience-checkout",
      state: { addOns: selectedAddOnsData },
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} outerClassName={styles.modalOuter}>
      <div className={styles.modalContent}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Customize your experience</h2>
              <p className={styles.modalSubtitle}>Select add-ons to enhance your experience</p>
            </div>

            <div className={styles.addOnsList}>
              {mockAddOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className={cn(styles.addOnCard, {
                    [styles.addOnCardSelected]: selectedAddOns.includes(addOn.id),
                  })}
                  onClick={() => handleToggleAddOn(addOn.id)}
                >
                  <div className={styles.addOnImage}>
                    {addOn.image ? (
                      <img src={addOn.image} alt={addOn.name} />
                    ) : (
                      <div className={styles.addOnIcon}>
                        <Icon name="star" size="24" />
                      </div>
                    )}
                  </div>
                  <div className={styles.addOnContent}>
                    <div className={styles.addOnHeader}>
                      <h3 className={styles.addOnName}>{addOn.name}</h3>
                      <span className={styles.addOnPrice}>${addOn.price}</span>
                    </div>
                    <p className={styles.addOnDescription}>{addOn.description}</p>
                  </div>
                  <div
                    className={styles.addOnCheckbox}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      value={selectedAddOns.includes(addOn.id)}
                      onChange={() => handleToggleAddOn(addOn.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.right}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>Summary</div>
              <div className={styles.summaryScroll}>
                <div className={styles.totalSummary}>
                  <div className={styles.totalLine}>
                    <span className={styles.totalLabel}>Base price</span>
                    <span className={styles.totalValue}>${basePrice}</span>
                  </div>
                  {selectedCount > 0 && (
                    <>
                      <div className={styles.totalLine}>
                        <span className={styles.totalLabel}>Add-ons ({selectedCount})</span>
                        <span className={styles.totalValue}>+${totalAddOnsPrice}</span>
                      </div>
                      <div className={styles.selectedList}>
                        {selectedAddOnsData.map((item) => (
                          <div key={item.id} className={styles.selectedItem}>
                            <span className={styles.selectedItemName}>{item.name}</span>
                            <span className={styles.selectedItemPrice}>${item.price}</span>
                            <button
                              className={styles.removeBtn}
                              aria-label={`Remove ${item.name}`}
                              onClick={() => handleToggleAddOn(item.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className={cn(styles.totalLine, styles.totalLineFinal)}>
                        <span className={styles.totalLabelFinal}>Total</span>
                        <span className={styles.totalValueFinal}>${finalTotal}</span>
                      </div>
                    </>
                  )}
                  {selectedCount === 0 && (
                    <div className={cn(styles.totalLine, styles.totalLineFinal)}>
                      <span className={styles.totalLabelFinal}>Total</span>
                      <span className={styles.totalValueFinal}>${basePrice}</span>
                    </div>
                  )}
                </div>
              </div>

              <button className={cn("button", styles.actionButton)} onClick={handleContinue}>Continue</button>
              <button className={cn("button-stroke", styles.skipButton)} onClick={handleSkip}>Skip for now</button>
            </div>
          </aside>
        </div>
      </div>
    </Modal>
  );
};

export default AddOnsModal;


