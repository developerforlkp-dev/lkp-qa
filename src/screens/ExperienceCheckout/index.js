import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import cn from "classnames";
import styles from "./ExperienceCheckout.module.sass";
import Control from "../../components/Control";
import ConfirmAndPay from "../../components/ConfirmAndPay";
import PriceDetails from "../../components/PriceDetails";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";
import { getOrderDetails } from "../../utils/api";

const breadcrumbs = [
  {
    title: "Spectacular views of Queenstown",
    url: "/experience-product",
  },
  {
    title: "Confirm and pay",
  },
];

const Checkout = () => {
  const location = useLocation();
  const history = useHistory();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingData, setBookingData] = useState(location.state?.bookingData || null);
  const [paymentData, setPaymentData] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(true);

  // Edit functionality state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  // Date selection handler
  const handleDateSelect = (startDateText, endDateText) => {
    if (!bookingData) return;

    // Update booking data with new date
    const newBookingData = { ...bookingData };

    // Update date summary
    if (newBookingData.bookingSummary) {
      newBookingData.bookingSummary.date = startDateText;
      if (endDateText && endDateText !== startDateText) {
        // handle range if needed
      }
    }
    newBookingData.selectedDate = startDateText;

    // Validate time slot for new date (reset if invalid? or keep if valid?)

    setBookingData(newBookingData);
    setShowDatePicker(false);
  };

  // Guest selection handler
  const handleGuestChange = (newGuests) => {
    if (!bookingData) return;

    const newBookingData = { ...bookingData };

    // Update guests object
    newBookingData.guests = newGuests;

    // Update summary text
    const totalGuests = (newGuests.adults || 0) + (newGuests.children || 0);
    if (newBookingData.bookingSummary) {
      newBookingData.bookingSummary.guestCount = totalGuests;
    }

    // Recalculate prices
    // Try to find price per person from priceDetails or extract from receipt
    let pricePerPerson = newBookingData.priceDetails?.pricePerPerson || 0;

    // Fallback: extract from receipt if not found
    if (!pricePerPerson && newBookingData.receipt) {
      const baseRow = newBookingData.receipt.find(r => r.title.toLowerCase().includes('guest') || r.title.toLowerCase().includes('adult') || r.title.toLowerCase().includes('night'));
      if (baseRow) {
        // Extract price from string like "INR 800.00 x 1 guest" or "800 x 1"
        // We look for the first number (allowing decimals)
        const matches = baseRow.title.match(/(\d+(\.\d+)?)/);
        if (matches && matches[0]) {
          pricePerPerson = parseFloat(matches[0]);
        }
      }
    }

    // Try to update total price if we have enough info
    if (pricePerPerson > 0) {
      // Calculate new base total
      const newBaseTotal = pricePerPerson * totalGuests;

      // Add add-ons
      const addOnsTotal = selectedAddOns.reduce(
        (sum, addOn) => sum + (addOn?.priceValue || addOn?.price || 0),
        0
      );

      const newFinalTotal = newBaseTotal + addOnsTotal;

      if (newBookingData.priceDetails) {
        newBookingData.priceDetails.totalPrice = newFinalTotal;
      }
      newBookingData.finalTotal = newFinalTotal;

      // Update payment data (amount to pay)
      // Store in paise (x100) because components expect Razorpay format and divide by 100 if > 1000
      setPaymentData(prev => ({
        ...prev,
        amount: newFinalTotal * 100
      }));

      // Update receipt table
      if (newBookingData.receipt) {
        const newReceipt = [...newBookingData.receipt];
        // Ideally identify row by title
        const baseRowIndex = newReceipt.findIndex(r => r.title.toLowerCase().includes('adult') || r.title.toLowerCase().includes('guest') || r.title.toLowerCase().includes('night'));

        if (baseRowIndex >= 0) {
          const currency = newBookingData.currency || "INR";
          newReceipt[baseRowIndex] = {
            ...newReceipt[baseRowIndex],
            title: `${currency} ${pricePerPerson.toFixed(2)} x ${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}`,
            content: `${currency} ${newBaseTotal.toFixed(2)}`
          };
        }

        // Update total row
        const totalRowIndex = newReceipt.findIndex(r => r.title.includes('Total') || r.title === 'Total');
        if (totalRowIndex >= 0) {
          const currency = newBookingData.currency || "INR";
          newReceipt[totalRowIndex] = {
            ...newReceipt[totalRowIndex],
            content: `${currency} ${newFinalTotal.toFixed(2)}`
          };
        }
        newBookingData.receipt = newReceipt;
      }
    }

    setBookingData(newBookingData);
  };

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

  // Read payment data from order response
  useEffect(() => {
    try {
      const pendingPayment = localStorage.getItem("pendingPayment");
      if (pendingPayment) {
        const payment = JSON.parse(pendingPayment);
        setPaymentData(payment);

        // Calculate and save the actual paid amount (after discount)
        // This will be used in the checkout complete page
        let actualPaidAmount = payment.amount; // Default to amount

        // If there's a discount, calculate paid amount = amount - discount
        if (payment.discount !== undefined && payment.discount > 0) {
          actualPaidAmount = payment.amount - payment.discount;
        } else if (payment.paidAmount !== undefined && payment.paidAmount > 0) {
          actualPaidAmount = payment.paidAmount;
        } else if (payment.finalAmount !== undefined && payment.finalAmount > 0) {
          actualPaidAmount = payment.finalAmount;
        }

        // Save the actual paid amount to localStorage for checkout complete page
        try {
          localStorage.setItem("actualPaidAmount", JSON.stringify({
            amount: actualPaidAmount,
            currency: payment.currency || "INR"
          }));
        } catch (e) {
          console.error("Error saving actual paid amount:", e);
        }
      }
    } catch (e) {
      console.error("Error reading payment data:", e);
    }
  }, []);

  // Persist snapshot for completion screen
  useEffect(() => {
    if (bookingData) {
      try {
        localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
      } catch { }
    }
  }, [bookingData]);

  // Check payment status when component mounts
  useEffect(() => {
    const checkPaymentStatus = async () => {
      setCheckingPayment(true);

      try {
        // Check if payment was already successful
        const paymentSuccess = localStorage.getItem("razorpayPaymentSuccess");
        if (paymentSuccess) {
          // Payment already succeeded, allow user to proceed
          setCheckingPayment(false);
          return;
        }

        // Check if there's a pending orderId
        const pendingOrderId = localStorage.getItem("pendingOrderId");
        if (!pendingOrderId) {
          // No order created yet, allow normal checkout flow
          setCheckingPayment(false);
          return;
        }

        // Fetch order details to check payment status
        const orderDetails = await getOrderDetails(pendingOrderId);
        const order = orderDetails?.order || orderDetails;

        if (order) {
          const paymentStatus = order.paymentStatus || "PENDING";
          const normalizedStatus = String(paymentStatus).toUpperCase().trim();

          // If payment failed, redirect to complete page with failure status
          if (normalizedStatus === "FAILED" || normalizedStatus === "FAILURE") {
            localStorage.setItem("paymentFailed", "true");
            localStorage.setItem("paymentFailureOrderId", String(order.orderId || pendingOrderId));
            history.push("/experience-checkout-complete");
            return;
          }
        }

        setCheckingPayment(false);
      } catch (error) {
        console.error("Error checking payment status:", error);
        // If error checking, allow normal checkout flow
        setCheckingPayment(false);
      }
    };

    checkPaymentStatus();
  }, [history]);


  // eslint-disable-next-line no-unused-vars
  const handleRemoveAddOn = (indexToRemove) => {
    setSelectedAddOns((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Build booking items (date, time, guests) for summary
  const items = useMemo(() => {
    const dateTitle =
      bookingData?.bookingSummary?.date ||
      bookingData?.selectedDate ||
      "Select date";

    // Format time slot with start and end time if available
    let timeTitle = "Select time";
    if (bookingData?.bookingSummary?.time) {
      const startTime = bookingData.bookingSummary.time;
      const endTime = bookingData?.bookingSummary?.endTime;

      // If we have both start and end time, format as range
      if (startTime && endTime) {
        timeTitle = `${formatTime(startTime)} – ${formatTime(endTime)}`;
      } else if (startTime) {
        // Only start time available, check if it's already formatted
        if (startTime.includes("–") || startTime.includes("-")) {
          timeTitle = startTime;
        } else {
          timeTitle = formatTime(startTime);
        }
      }
    }

    // Get guest count - check multiple possible formats
    const guestsCount =
      bookingData?.bookingSummary?.guestCount ||
      bookingData?.guests?.guests ||
      (bookingData?.guests?.adults || 0) + (bookingData?.guests?.children || 0);
    const guestsTitle = guestsCount > 0
      ? `${guestsCount} ${guestsCount === 1 ? 'guest' : 'guests'}`
      : "Add guests";

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
  // eslint-disable-next-line no-unused-vars
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

  // Show loading state while checking payment status
  if (checkingPayment) {
    return (
      <div className={cn("section-mb80", styles.section)}>
        <div className={cn("container", styles.container)}>
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>Checking payment status...</p>
          </div>
        </div>
      </div>
    );
  }

  const listingTitle = bookingData?.listingTitle || "Your trip";
  // Get first image - ensure it's a single image URL, not an array
  const getListingImage = () => {
    const image = bookingData?.listingImage;
    if (!image) return "/images/content/photo-1.1.jpg";
    // If it's an array, get the first item
    if (Array.isArray(image)) {
      return image[0]?.url || image[0] || "/images/content/photo-1.1.jpg";
    }
    // If it's a string, return it
    if (typeof image === 'string') {
      return image;
    }
    return "/images/content/photo-1.1.jpg";
  };
  const listingImage = getListingImage();
  const hostName = bookingData?.listing?.host?.firstName
    ? `${bookingData.listing.host.firstName} ${bookingData.listing.host.lastName || ''}`.trim()
    : (bookingData?.listing?.host?.name || "Host");
  const hostAvatar = bookingData?.listing?.host?.picture || bookingData?.listing?.host?.avatar;

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          breadcrumbs={breadcrumbs}
        />
        <div className={styles.wrapper}>
          <ConfirmAndPay
            className={styles.confirm}
            title="Your trip"
            buttonUrl="/experience-checkout-complete"
            guests
            amountToPay={paymentData?.amount}
            currency={paymentData?.currency || "INR"}
            dateValue={items[0]?.title}
            guestValue={items[2]?.title}
            onEditDate={() => setShowDatePicker(true)}
            onEditGuests={() => setShowGuestPicker(true)}
            datePicker={(
              <InlineDatePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={handleDateSelect}
                selectedDate={bookingData?.selectedDate ? new Date(bookingData.selectedDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null}
              />
            )}
            guestPicker={(
              <GuestPicker
                visible={showGuestPicker}
                onClose={() => setShowGuestPicker(false)}
                onGuestChange={handleGuestChange}
                initialGuests={bookingData?.guests || { adults: 1, children: 0, infants: 0 }}
                maxGuests={bookingData?.listing?.maxGuests || 10}
              />
            )}
          />
          <PriceDetails
            className={styles.price}
            more
            image={listingImage}
            title={listingTitle}
            items={items}
            table={table}
            amountToPay={paymentData?.amount}
            currency={paymentData?.currency || "INR"}
            hostName={hostName}
            hostAvatar={hostAvatar}
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
