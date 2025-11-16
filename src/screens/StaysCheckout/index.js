import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./StaysCheckout.module.sass";
import Control from "../../components/Control";
import ConfirmAndPay from "../../components/ConfirmAndPay";
import PriceDetails from "../../components/PriceDetails";

const breadcrumbs = [
  {
    title: "Spectacular views of Queenstown",
    url: "/stays-product",
  },
  {
    title: "Confirm and pay",
  },
];

const Checkout = () => {
  const location = useLocation();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingData, setBookingData] = useState(location.state?.bookingData || null);

  // Initialize add-ons from location state
  useEffect(() => {
    if (location.state?.addOns) {
      setSelectedAddOns(location.state.addOns);
    }
  }, [location.state]);

  // Fallback: hydrate bookingData from localStorage if not present in state
  useEffect(() => {
    if (!bookingData) {
      try {
        const saved = localStorage.getItem("pendingBooking");
        if (saved) {
          const parsed = JSON.parse(saved);
          setBookingData(parsed);
          if (Array.isArray(parsed.selectedAddOns)) {
            setSelectedAddOns(parsed.selectedAddOns);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [bookingData]);

  // Persist snapshot for completion screen
  useEffect(() => {
    if (bookingData) {
      try {
        localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
      } catch {}
    }
  }, [bookingData]);


  const handleRemoveAddOn = (indexToRemove) => {
    setSelectedAddOns((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Build booking items (date, time, guests) for summary
  const items = useMemo(() => {
    const dateTitle =
      bookingData?.bookingSummary?.date ||
      bookingData?.selectedDate ||
      "Select date";
    const timeTitle =
      bookingData?.bookingSummary?.time ||
      "Select time";
    const guestsCount =
      (bookingData?.guests?.adults || 0) + (bookingData?.guests?.children || 0);
    const guestsTitle = guestsCount > 0 ? `${guestsCount} guests` : "Add guests";

    return [
      {
        title: dateTitle,
        category: "Date",
        icon: "calendar",
      },
      {
        title: timeTitle,
        category: "Time slot",
        icon: "clock",
      },
      {
        title: guestsTitle,
        category: "Guest",
        icon: "user",
      },
    ];
  }, [bookingData]);

  // Build price table from receipt if provided
  const { addOnsTotal, finalTotal, table } = useMemo(() => {
    if (bookingData?.receipt && Array.isArray(bookingData.receipt)) {
      const rows = bookingData.receipt.map((r) => ({
        title: r.title,
        value: r.content,
      }));
      return {
        addOnsTotal: bookingData.addOnsTotal || 0,
        finalTotal: bookingData.finalTotal || 0,
        table: rows,
      };
    }

    // Fallback: compute a minimal table from selectedAddOns only
    const addOnsPrice = selectedAddOns.reduce(
      (sum, addOn) => sum + (addOn?.priceValue || addOn?.price || 0),
      0
    );
    return {
      addOnsTotal: addOnsPrice,
      finalTotal: addOnsPrice,
      table: [
        {
          title: "Add-ons",
          value: `${addOnsPrice}`,
        },
      ],
    };
  }, [bookingData, selectedAddOns]);

  const listingTitle = bookingData?.listingTitle || "Your trip";
  const listingImage = bookingData?.listingImage || "/images/content/photo-1.1.jpg";

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/stays-product"
          breadcrumbs={breadcrumbs}
        />
        <div className={styles.wrapper}>
          <ConfirmAndPay
            className={styles.confirm}
            title="Your trip"
            buttonUrl="/stays-checkout-complete"
            guests
          />
          <PriceDetails
            className={styles.price}
            more
            image={listingImage}
            title={listingTitle}
            items={items}
            table={table}
            addOns={selectedAddOns}
            onRemoveAddOn={handleRemoveAddOn}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
