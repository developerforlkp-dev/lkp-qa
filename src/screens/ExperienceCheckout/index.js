import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import cn from "classnames";
import styles from "./ExperienceCheckout.module.sass";
import Control from "../../components/Control";
import ConfirmAndPay from "../../components/ConfirmAndPay";
import PriceDetails from "../../components/PriceDetails";
import { getOrderDetails, getStayDetails, getListingAddons } from "../../utils/api";
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


const Checkout = () => {
  const location = useLocation();
  const history = useHistory();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingData, setBookingData] = useState(location.state?.bookingData || null);
  const [paymentData, setPaymentData] = useState(location.state?.paymentData || null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [stayImageUrl, setStayImageUrl] = useState(null);
  const [addonDetails, setAddonDetails] = useState([]);

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
      } else if (location.state?.paymentData) {
        setPaymentData(location.state.paymentData);
      }
    } catch (e) {
      console.error("Error reading payment data:", e);
    }
  }, [location.state]);

  // Persist snapshot for completion screen
  useEffect(() => {
    if (bookingData) {
      try {
        localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
      } catch { }
    }
  }, [bookingData]);

  // Check payment status when component mounts, and also load server-side pricing
  useEffect(() => {
    const checkPaymentAndLoadPricing = async () => {
      setCheckingPayment(true);

      try {
        const pendingOrderId = localStorage.getItem("pendingOrderId");
        if (!pendingOrderId) {
          setCheckingPayment(false);
          return;
        }

        // Always fetch order details — needed for server pricing (commission, tax, etc.)
        // regardless of whether payment already succeeded
        const orderDetails = await getOrderDetails(pendingOrderId);
        const order = orderDetails?.order || orderDetails;

        if (order) {
          let checkoutBooking = location.state?.bookingData || null;
          if (!checkoutBooking) {
            try {
              const savedBooking = localStorage.getItem("pendingBooking");
              checkoutBooking = savedBooking ? JSON.parse(savedBooking) : null;
            } catch {
              checkoutBooking = null;
            }
          }
          const isExperienceCheckout = Boolean(checkoutBooking?.listingId) && !checkoutBooking?.eventId;
          const orderListingId = order?.listingId || orderDetails?.listingId || order?.listing?.listingId;
          const isStaleEventOrder =
            isExperienceCheckout &&
            (
              (orderListingId && String(orderListingId) !== String(checkoutBooking.listingId)) ||
              (!orderListingId && Boolean(order?.eventId || orderDetails?.eventId || order?.eventTitle || orderDetails?.eventTitle || order?.eventDetails || orderDetails?.eventDetails))
            );

          if (isStaleEventOrder) {
            localStorage.removeItem("pendingOrderId");
            console.warn("Ignored stale event order while loading experience checkout:", pendingOrderId);
            setCheckingPayment(false);
            return;
          }

          const paymentStatus = order.paymentStatus || "PENDING";
          const normalizedStatus = String(paymentStatus).toUpperCase().trim();

          if (normalizedStatus === "FAILED" || normalizedStatus === "FAILURE") {
            localStorage.setItem("paymentFailed", "true");
            localStorage.setItem("paymentFailureOrderId", String(order.orderId || pendingOrderId));
            history.push("/experience-checkout-complete");
            return;
          }

          // ✅ Always merge server-side pricing so commission/tax/discount always show
          // The order creation response has `.pricing`, but `getOrderDetails` might only have flat fields on `order`.
          const serverPricing = orderDetails?.pricing || order?.pricing || {
            basePrice: order?.basePrice,
            addonsTotal: order?.addonsTotal,
            commission: order?.platformFee || order?.commission,
            commissionRate: order?.commissionRate,
            tax: order?.taxAmount || order?.tax,
            discount: order?.discountAmount || order?.discount,
            total: order?.totalPrice || order?.finalAmount || order?.total,
            guestCount: order?.numberOfGuests,
            pricePerPerson: order?.pricePerPerson,
          };

          if (serverPricing) {
            setBookingData((prev) => {
              const prevPricing = prev?.pricing || {};
              
              // Get local discount calculate from Experience Details pg
              const localDiscount = prevPricing.discountAmount || prevPricing.discount || 0;
              
              // Prefer server discount unless it's falsely 0 while local had one
              let finalDiscount = serverPricing.discount || serverPricing.discountAmount || 0;
              if (Number(finalDiscount) === 0 && Number(localDiscount) > 0) {
                finalDiscount = localDiscount;
              }

              return {
                ...(prev || {}),
                hostName: order?.hostName || orderDetails?.hostName || prev?.hostName,
                hostAvatar: "/images/content/avatar.jpg",
                pricing: {
                  ...prevPricing,
                  ...serverPricing,
                  discount: finalDiscount,
                  discountAmount: finalDiscount,
                  // Prioritize local calculation (prevPricing) to ensure consistency with details page
                  // only fall back to server if local is missing.
                  tax: (Number(prevPricing.tax || 0) > 0)
                    ? prevPricing.tax
                    : (serverPricing.tax || serverPricing.taxAmount || 0),
                  taxRate: (Number(prevPricing.taxRate || 0) > 0)
                    ? prevPricing.taxRate
                    : (serverPricing.taxRate || 0),
                  commission: (Number(prevPricing.commission || 0) > 0)
                    ? prevPricing.commission
                    : (serverPricing.commission || serverPricing.platformFee || 0),
                  commissionRate: (Number(prevPricing.commissionRate || 0) > 0)
                    ? prevPricing.commissionRate
                    : (serverPricing.commissionRate || 0),
                  // If we use local components, we should also use local total for consistency in the breakdown table
                  total: (Number(prevPricing.total || 0) > 0)
                    ? prevPricing.total
                    : (serverPricing.total || serverPricing.totalPrice || serverPricing.finalAmount || 0),
                  // Always preserve child-pricing fields from local — server never returns these
                  pricePerPerson: (Number(prevPricing.pricePerPerson || 0) > 0)
                    ? prevPricing.pricePerPerson
                    : (serverPricing.pricePerPerson || 0),
                  allowChildPricing: prevPricing.allowChildPricing ?? serverPricing.allowChildPricing ?? false,
                  adultsCount: prevPricing.adultsCount ?? serverPricing.adultsCount,
                  childrenCount: prevPricing.childrenCount ?? serverPricing.childrenCount,
                  childPricePerChild: (Number(prevPricing.childPricePerChild || 0) > 0)
                    ? prevPricing.childPricePerChild
                    : (serverPricing.childPricePerChild || 0),
                },
              };
            });
          }

          // ✅ Also enrich addonDetails from the server breakdown addons
          const serverAddons = serverPricing?.breakdown?.addons || order.addons || [];
          if (serverAddons.length > 0) {
            const listingId = order.listingId || orderDetails?.listingId;
            if (listingId) {
              getListingAddons(listingId).then((allAddons) => {
                const merged = serverAddons.map((oa) => {
                  const addonId = oa.addonId || oa.id;
                  const full = allAddons.find(
                    (a) => String(a.addonId || a.id) === String(addonId)
                  );
                  return {
                    addonId,
                    name: oa.addonName || full?.title || full?.name || full?.addonName || "Add-on",
                    quantity: oa.quantity || 1,
                    pricePerUnit: oa.pricePerUnit || oa.addonPrice || oa.price || 0,
                    totalPrice: oa.totalPrice || (oa.pricePerUnit || oa.addonPrice || oa.price || 0) * (oa.quantity || 1),
                    image: full?.imageUrl || full?.image || full?.coverImageUrl || null,
                  };
                });
                setAddonDetails(merged);
              }).catch(console.error);
            }
          }
        }

        setCheckingPayment(false);
      } catch (error) {
        console.error("Error checking payment status:", error);
        setCheckingPayment(false);
      }
    };

    checkPaymentAndLoadPricing();
  }, [history, location.state]);


  // eslint-disable-next-line no-unused-vars
  const handleRemoveAddOn = (indexToRemove) => {
    setSelectedAddOns((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // Fallback: build addonDetails from selectedAddOns if server breakdown not yet loaded
  useEffect(() => {
    const listingId = bookingData?.listingId;
    if (!listingId) return;
    // Skip if server pricing already set addonDetails (via the payment check useEffect)
    if (addonDetails.length > 0) return;

    // Source: selectedAddOns from location.state (items like { id, title, price, ... })
    const fallbackAddons = bookingData?.selectedAddOns || selectedAddOns || [];
    if (!fallbackAddons.length) return;

    getListingAddons(listingId).then((allAddons) => {
      const merged = fallbackAddons.map((oa) => {
        const addonId = oa.addonId || oa.id;
        const full = allAddons.find(
          (a) => String(a.addonId || a.id) === String(addonId)
        );
        return {
          addonId,
          // Try all possible name fields
          name: oa.addonName || oa.title || full?.title || full?.name || full?.addonName || "Add-on",
          quantity: oa.quantity || 1,
          pricePerUnit: oa.pricePerUnit || oa.addonPrice || oa.price || 0,
          totalPrice:
            oa.totalPrice ||
            (oa.pricePerUnit || oa.addonPrice || oa.price || 0) * (oa.quantity || 1),
          image: full?.imageUrl || full?.image || full?.coverImageUrl || null,
        };
      });
      setAddonDetails(merged);
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData?.listingId]);

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
    const raw = String(timeString).trim();
    const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?/);
    if (!match) return raw;
    const hours = match[1];
    const minutes = match[2] || "00";
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
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

  // Build price breakdown table from bookingData.pricing
  // eslint-disable-next-line no-unused-vars
  const { addOnsTotal, finalTotal, table } = useMemo(() => {
    const pricing = bookingData?.pricing;
    const cur = pricing?.currency || paymentData?.currency || "INR";
    const fmt = (n) => `${cur} ${Number(n || 0).toFixed(2)}`;

    if (pricing) {
      const rows = [];

      const basePrice = pricing.basePrice || pricing.baseAmount || 0;
      const addonsTotal = pricing.addonsTotal || 0;
      const commission = pricing.commission || pricing.platformCommission || pricing.platformFee || 0;
      const tax = pricing.tax || pricing.taxAmount || 0;
      const discount = pricing.discount || pricing.discountAmount || 0;

      // Base price
      if (basePrice > 0) {
        if (pricing.allowChildPricing && pricing.childrenCount > 0) {
          const adults = pricing.adultsCount || 0;
          const children = pricing.childrenCount || 0;
          const ppp = pricing.pricePerPerson || 0;
          const cpp = pricing.childPricePerChild || 0;

          if (adults > 0) {
             rows.push({ title: `Adults (${fmt(ppp)} × ${adults})`, value: fmt(ppp * adults) });
          }
          if (children > 0) {
             rows.push({ title: `Children (${fmt(cpp)} × ${children})`, value: fmt(cpp * children) });
          }
        } else {
          const guests = pricing.guestCount || 1;
          const ppp = pricing.pricePerPerson;
          const label = ppp
            ? `Base price (${fmt(ppp)} × ${guests} guest${guests !== 1 ? 's' : ''})`
            : "Base price";
          rows.push({ title: label, value: fmt(basePrice) });
        }
      }

      // // Add-ons subtotal
      // if (addonsTotal > 0) {
      //   rows.push({ title: "Add-ons", value: fmt(addonsTotal) });
      // }

      // Commission / service fee - Hidden for guest view as per requirement (host deduction)
      /*
      if (commission > 0) {
        const rate = pricing.commissionRate ? ` (${pricing.commissionRate}%)` : "";
        rows.push({ title: `Service fee${rate}`, value: fmt(commission) });
      }
      */

      // Tax
      if (tax > 0) {
        const rate = pricing.taxRate ? ` (${pricing.taxRate}%)` : "";
        rows.push({ title: `Tax${rate}`, value: fmt(tax) });
      }

      // Discount
      if (discount > 0) {
        rows.push({ title: "Discount", value: `- ${fmt(discount)}` });
      }

      return {
        addOnsTotal: addonsTotal,
        finalTotal: pricing.total || pricing.finalAmount || 0,
        table: rows,
      };
    }

    // Fallback: receipt-based rows
    if (bookingData?.receipt && Array.isArray(bookingData.receipt)) {
      const rows = bookingData.receipt
        .filter((r) => r?.kind === "tax")
        .map((r) => ({ title: r.title, value: r.content }));
      return { addOnsTotal: 0, finalTotal: 0, table: rows };
    }

    // Last resort
    const addOnsPrice = selectedAddOns.reduce(
      (sum, addOn) => sum + (addOn?.priceValue || addOn?.price || 0),
      0
    );
    return {
      addOnsTotal: addOnsPrice,
      finalTotal: addOnsPrice,
      table: [{ title: "Add-ons", value: `${addOnsPrice}` }],
    };
  }, [bookingData, selectedAddOns, paymentData]);

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
  const isEventBooking = Boolean(bookingData?.eventId);
  const backUrl =
    bookingData?.returnTo ||
    (isEventBooking ? `/event?id=${bookingData.eventId}` : null);
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
  //test 3
  // Get first image - ensure it's a single image URL, not an array
  const getListingImage = () => {
    if (stayImageUrl) return stayImageUrl;
    const image = bookingData?.roomImage || bookingData?.listingImage;
    if (!image) return "/images/content/photo-1.1.jpg";
    // If it's an array, get the first item
    if (Array.isArray(image)) {
      return image[0]?.url || image[0] || "/images/content/photo-1.1.jpg";
    }
    // If it's a string, return it
    if (typeof image === 'string') {
      return formatImageUrl(image);
    }
    return "/images/content/photo-1.1.jpg";
  };
  const listingImage = getListingImage();
  const hostName = bookingData?.hostName || "Host";
  const hostAvatar = bookingData?.hostAvatar || "/images/content/avatar.jpg";

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          backUrl={backUrl}
          breadcrumbs={breadcrumbs}
        />
        <div className={styles.wrapper}>
          <ConfirmAndPay
            className={styles.confirm}
            title={isEventBooking ? "Your event" : "Your trip"}
            buttonUrl="/experience-checkout-complete"
            guests
            amountToPay={paymentData?.amount}
            currency={paymentData?.currency || "INR"}
            dateValue={items[0]?.title}
            guestValue={items[2]?.title}
            paymentData={paymentData}
          />
          <PriceDetails
            className={styles.price}
            more
            image={listingImage}
            title={listingTitle}
            items={items}
            table={table}
            addonDetails={addonDetails}
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
