import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./Checkout.module.sass";
import Control from "../../components/Control";
import ConfirmAndPay from "../../components/ConfirmAndPay";
import PriceDetails from "../../components/PriceDetails";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";
import { getStayDetails } from "../../utils/api";
import { buildExperienceUrl } from "../../utils/experienceUrl";

const formatImageUrl = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  const [pathPart, queryPart] = raw.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};


  // The correct breadcrumbs logic is placed in the component render method


const Checkout = () => {
  const location = useLocation();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingData, setBookingData] = useState(location.state?.bookingData || null);
  const [paymentData, setPaymentData] = useState(null);
  const [stayImageUrl, setStayImageUrl] = useState(null);

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
    // For now, keep time slot but might need validation against available slots for new date

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

  // Read payment data from localStorage
  useEffect(() => {
    try {
      const pendingPayment = localStorage.getItem("pendingPayment");
      if (pendingPayment) {
        const payment = JSON.parse(pendingPayment);
        setPaymentData(payment);
      }
    } catch (e) {
      console.error("Error reading payment data:", e);
    }
  }, []);

  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  useEffect(() => {
    if (bookingData?.stayId) {
      getStayDetails(bookingData.stayId)
        .then((data) => {
          const rawCoverImg =
            data?.coverImageUrl ||
            data?.coverPhotoUrl ||
            (Array.isArray(data?.listingMedia) && data.listingMedia[0]
              ? (data.listingMedia[0].url || data.listingMedia[0].blobName || data.listingMedia[0].fileUrl)
              : null) ||
            (Array.isArray(data?.media) && data.media[0]
              ? (data.media[0].url || data.media[0].blobName || data.media[0].fileUrl)
              : null) ||
            (Array.isArray(data?.images) && data.images[0]
              ? (data.images[0].url || data.images[0].blobName || data.images[0].fileUrl || (typeof data.images[0] === "string" ? data.images[0] : null))
              : null) ||
            (Array.isArray(data?.propertyImages) && data.propertyImages[0]
              ? (data.propertyImages[0].url || data.propertyImages[0].blobName || data.propertyImages[0].fileUrl || (typeof data.propertyImages[0] === "string" ? data.propertyImages[0] : null))
              : null) ||
            "";
          if (rawCoverImg) {
            setStayImageUrl(formatImageUrl(rawCoverImg));
          }
        })
        .catch(console.error);
    }
  }, [bookingData?.stayId]);
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Build booking items for summary
  const items = useMemo(() => {
    // Detect stay: explicit flag OR check-in/check-out dates present
    const isStay = bookingData?.isStay || !!(bookingData?.checkInDate || bookingData?.checkOutDate);

    if (isStay) {
      const stayItems = [
        {
          title: bookingData?.checkInDate || bookingData?.bookingSummary?.date || bookingData?.selectedDate || "Select date",
          category: "Check-in",
          icon: "calendar",
        },
        {
          title: bookingData?.checkOutDate || "Select date",
          category: "Check-out",
          icon: "calendar",
        },
      ];
      if (bookingData?.roomType) {
        stayItems.push({
          title: bookingData.roomType,
          category: "Room type",
          icon: "home",
        });
      }
      if (bookingData?.mealPlan) {
        stayItems.push({
          title: bookingData.mealPlan,
          category: "Meal plan",
          icon: "lightning",
        });
      }
      return stayItems;
    }

    // ── Experience / event bookings: date, time slot, guests ──
    const dateTitle =
      bookingData?.bookingSummary?.date ||
      bookingData?.selectedDate ||
      "Select date";

    let timeTitle = "Select time";
    if (bookingData?.bookingSummary?.time) {
      const startTime = bookingData.bookingSummary.time;
      const endTime = bookingData?.bookingSummary?.endTime;
      if (startTime && endTime) {
        timeTitle = `${formatTime(startTime)} – ${formatTime(endTime)}`;
      } else if (startTime) {
        timeTitle = startTime.includes("–") || startTime.includes("-")
          ? startTime
          : formatTime(startTime);
      }
    }

    const guestsCount =
      bookingData?.bookingSummary?.guestCount ||
      bookingData?.guests?.guests ||
      (bookingData?.guests?.adults || 0) + (bookingData?.guests?.children || 0);
    const guestsTitle = guestsCount > 0
      ? `${guestsCount} ${guestsCount === 1 ? "guest" : "guests"}`
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
  const { table } = useMemo(() => {
    if (bookingData?.receipt && Array.isArray(bookingData.receipt)) {
      const rows = bookingData.receipt.map((r) => ({
        title: r.title,
        value: r.content,
      }));
      return {
        table: rows,
      };
    }

    // Fallback: compute a minimal table from selectedAddOns only
    const addOnsPrice = selectedAddOns.reduce(
      (sum, addOn) => sum + (addOn?.priceValue || addOn?.price || 0),
      0
    );
    return {
      table: [
        {
          title: "Add-ons",
          value: `${addOnsPrice}`,
        },
      ],
    };
  }, [bookingData, selectedAddOns]);

  const isStayBooking = !!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate);
  const tripTitle = isStayBooking ? "Your stay" : "Your trip";

  // Get first image
  const getListingImage = () => {
    if (stayImageUrl) return stayImageUrl;
    const image = bookingData?.roomImage || bookingData?.listingImage;
    if (!image) return "/images/content/photo-checkout.jpg";
    if (Array.isArray(image)) {
      return image[0]?.url || image[0] || "/images/content/photo-checkout.jpg";
    }
    if (typeof image === 'string') {
      return formatImageUrl(image);
    }
    return "/images/content/photo-checkout.jpg";
  };
  const listingImage = getListingImage();
  const hostName = bookingData?.listing?.host?.firstName
    ? `${bookingData.listing.host.firstName} ${bookingData.listing.host.lastName || ''}`.trim()
    : (bookingData?.listing?.host?.name || "Host");
  const hostAvatar = bookingData?.listing?.host?.picture || bookingData?.listing?.host?.avatar;

  const breadcrumbs = [
    {
      title: "Booking details",
      url: bookingData?.listingId
        ? buildExperienceUrl(bookingData?.listingTitle || "experience", bookingData.listingId)
        : "/experience-product",
    },
    {
      title: "Confirm and pay",
    },
  ];

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
            title={tripTitle}
            buttonUrl="/checkout-complete"
            guests={!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate)}
            amountToPay={paymentData?.amount}
            currency={paymentData?.currency || "INR"}
            dateValue={items[0]?.title}
            guestValue={items[2]?.title}
            onEditDate={() => setShowDatePicker(true)}
            onEditGuests={() => setShowGuestPicker(true)}
            isStay={!!(bookingData?.isStay || bookingData?.checkInDate || bookingData?.checkOutDate)}
            checkInDate={bookingData?.checkInDate}
            checkOutDate={bookingData?.checkOutDate}
            roomType={bookingData?.roomType}
            mealPlan={bookingData?.mealPlan}
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
            image={listingImage}
            title={tripTitle}
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
