import React, { useState, useMemo, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";
import moment from "moment";
import "moment-timezone";
import cn from "classnames";
import styles from "./Description.module.sass";
import receiptStyles from "../../../components/Receipt/Receipt.module.sass";
import Icon from "../../../components/Icon";
import Details from "./Details";
import Receipt from "../../../components/Receipt";
import InlineDatePicker from "../../../components/InlineDatePicker";
import TimeSlotsPicker from "../../../components/TimeSlotsPicker";
import GuestPicker from "../../../components/GuestPicker";
import LoginModal from "../../../components/LoginModal";
import { getBillingConfiguration, createOrder, getListingSlots, loginWithGoogle, getStayRoomAvailability } from "../../../utils/api";

const Description = ({ classSection, listing, hostData }) => {
  const history = useHistory();
  const isStay = Boolean(listing?.stayId || listing?.stay_id || listing?.propertyType === "STAY");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [addOnQuantities, setAddOnQuantities] = useState({}); // Track quantities for Group pricing addons

  // State declarations - must come before they're used
  const [slotsData, setSlotsData] = useState([]); // Store slots from API
  const [transformedTimeSlots, setTransformedTimeSlots] = useState([]); // Transformed timeSlots for components
  const [billingConfig, setBillingConfig] = useState(null);
  const [availabilityData, setAvailabilityData] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleCheckStayAvailability = async () => {
    try {
      if (!isStay) return;
      const stayId = listing?.stayId || listing?.stay_id || listing?.id;
      if (!stayId) return;
      if (!selectedDate || !selectedEndDate) return;

      setStayAvailabilityLoading(true);

      const checkInDate = selectedDate.format("YYYY-MM-DD");
      const checkOutDate = selectedEndDate.format("YYYY-MM-DD");

      const res = await getStayRoomAvailability(stayId, checkInDate, checkOutDate);
      console.log("✅ Stay room availability (raw):", res);

      setStayAvailabilityResult(res);
      setStayAvailabilityChecked(true);
    } catch (err) {
      console.error("❌ Stay room availability failed:", err?.response?.data || err?.message || err);
      setStayAvailabilityResult(null);
      setStayAvailabilityChecked(false);
    } finally {
      setStayAvailabilityLoading(false);
    }
  };

  // Helper function to format time range with cleaner display
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    return `${formatTime(startTime)} – ${formatTime(endTime)}`;
  };

  // Don't pre-select date or time slot - let user choose
  const formattedDefaultDate = "Select date";

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [stayActiveDateField, setStayActiveDateField] = useState("checkin");
  const [stayAvailabilityChecked, setStayAvailabilityChecked] = useState(false);
  const [stayAvailabilityLoading, setStayAvailabilityLoading] = useState(false);
  const [stayAvailabilityResult, setStayAvailabilityResult] = useState(null);
  const [staySelectedRoomType, setStaySelectedRoomType] = useState("");
  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showRoomTypePicker, setShowRoomTypePicker] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const dateItemRef = useRef(null);
  const timeItemRef = useRef(null);
  const guestItemRef = useRef(null);
  const checkoutItemRef = useRef(null);
  const roomTypeItemRef = useRef(null);
  const initialValuesSetRef = useRef(false);

  useEffect(() => {
    if (!showRoomTypePicker) return;
    const handleDocMouseDown = (e) => {
      const el = roomTypeItemRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setShowRoomTypePicker(false);
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, [showRoomTypePicker]);

  useEffect(() => {
    if (!isStay) return;
    setStayAvailabilityChecked(false);
    setStayAvailabilityResult(null);
    setStaySelectedRoomType("");
    setShowRoomTypePicker(false);
  }, [isStay, selectedDate, selectedEndDate]);

  const stayRoomTypeOptions = useMemo(() => {
    if (!stayAvailabilityResult) return [];
    const payload = stayAvailabilityResult;

    const candidates =
      (Array.isArray(payload) && payload) ||
      (Array.isArray(payload.roomTypes) && payload.roomTypes) ||
      (Array.isArray(payload.rooms) && payload.rooms) ||
      (Array.isArray(payload.data) && payload.data) ||
      (Array.isArray(payload.data?.roomTypes) && payload.data.roomTypes) ||
      [];

    return candidates
      .map((x) => {
        if (typeof x === "string") {
          return { value: x, label: x, raw: x };
        }
        const id =
          x?.roomId ??
          x?.room_id ??
          x?.roomTypeId ??
          x?.room_type_id ??
          x?.id ??
          x?.code ??
          x?.name ??
          x?.title;

        const labelBase =
          x?.roomName ??
          x?.room_name ??
          x?.roomTypeName ??
          x?.room_type_name ??
          x?.name ??
          x?.title ??
          String(id ?? "Room");

        const availableRooms =
          x?.availableRooms ?? x?.available_rooms ?? x?.availability ?? x?.available ?? null;
        const label =
          typeof availableRooms === "number" ? `${labelBase} (${availableRooms} available)` : String(labelBase);
        if (!id) return null;

        if (typeof availableRooms === "number" && availableRooms <= 0) {
          return null;
        }

        return { value: String(id), label: String(label), raw: x };
      })
      .filter(Boolean);
  }, [stayAvailabilityResult]);

  // Helper function to get guest count (supports both old and new format)
  const getGuestCount = (guestsObj) => {
    if (guestsObj.guests !== undefined) {
      return guestsObj.guests;
    }
    // Legacy format: adults + children
    return (guestsObj.adults || 0) + (guestsObj.children || 0);
  };

  const guestCountText = useMemo(() => {
    const total = getGuestCount(guests);
    if (total === 0) return "Add guests";
    if (total === 1) return "1 guest";
    return `${total} guests`;
  }, [guests]);

  // Validation helper functions
  const isPastDate = (date) => {
    if (!date) return false;
    const today = moment().tz('Asia/Kolkata').startOf('day');
    return date.isBefore(today, 'day');
  };

  const isPastTime = (date, timeString) => {
    if (!date || !timeString) return false;
    const now = moment().tz('Asia/Kolkata');
    const today = moment().tz('Asia/Kolkata').startOf('day');

    // Only check time if date is today
    if (!date.isSame(today, 'day')) return false;

    // Parse time string (HH:mm or HH:mm:ss)
    const [hours, minutes] = timeString.split(':').map(Number);
    const slotTime = moment().tz('Asia/Kolkata').hours(hours).minutes(minutes).seconds(0);

    return slotTime.isBefore(now);
  };

  const getMaxGuestsForSlot = () => {
    // First check availability data for the selected date and slot
    if (selectedDateAvailability) {
      const maxSeats = selectedDateAvailability.max_seats;
      if (maxSeats !== undefined && maxSeats !== null) {
        return maxSeats;
      }
    }

    // Fallback to slot data
    if (selectedTimeSlotData) {
      const maxSeats = selectedTimeSlotData.maxSeats || selectedTimeSlotData.max_seats;
      if (maxSeats !== undefined && maxSeats !== null) {
        return maxSeats;
      }
    }

    // No limit found
    return null;
  };

  const validateBookingDateTime = () => {
    if (isStay) {
      if (!selectedDate) {
        return { valid: false, error: "Please select a check-in date" };
      }
      if (!selectedEndDate) {
        return { valid: false, error: "Please select a check-out date" };
      }
      if (isPastDate(selectedDate)) {
        return { valid: false, error: "Cannot book for a past date. Please select a future date." };
      }
      if (selectedEndDate.isBefore(selectedDate, 'day')) {
        return { valid: false, error: "Check-out date cannot be before check-in date" };
      }
      return { valid: true };
    }

    if (!selectedDate) {
      return { valid: false, error: "Please select a booking date" };
    }

    if (isPastDate(selectedDate)) {
      return { valid: false, error: "Cannot book for a past date. Please select a future date." };
    }

    if (!selectedTimeSlot) {
      return { valid: false, error: "Please select a time slot" };
    }

    // Get the booking time
    const bookingTime = selectedDateAvailability?.start_time || selectedTimeSlotData?.startTime;
    if (!bookingTime) {
      return { valid: false, error: "Please select a valid time slot" };
    }

    if (isPastTime(selectedDate, bookingTime)) {
      return { valid: false, error: "Selected time slot has passed. Please choose a future time." };
    }

    return { valid: true };
  };

  const validateGuestCount = () => {
    const guestCount = getGuestCount(guests);

    if (!guestCount || guestCount < 1) {
      return { valid: false, error: "Please select at least 1 guest" };
    }

    const maxGuests = getMaxGuestsForSlot();
    if (maxGuests !== null && guestCount > maxGuests) {
      return {
        valid: false,
        error: `Maximum ${maxGuests} guest${maxGuests === 1 ? '' : 's'} allowed for this slot. You selected ${guestCount} guest${guestCount === 1 ? '' : 's'}.`
      };
    }

    // Also check available seats
    if (selectedDateAvailability) {
      const availableSeats = selectedDateAvailability.available_seats;
      if (availableSeats !== undefined && guestCount > availableSeats) {
        const slotName = selectedDateAvailability.slot_name || selectedTimeSlotData?.slotName || selectedTimeSlot || "selected slot";
        return {
          valid: false,
          error: `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available for "${slotName}" on ${selectedDate.format("MMM DD, YYYY")}. You requested ${guestCount} seat${guestCount === 1 ? '' : 's'}.`
        };
      }
    }

    return { valid: true };
  };

  // Find the selected timeSlot object to get maxSeats and for display
  const selectedTimeSlotData = useMemo(() => {
    // First try to find in slotsData from API
    if (slotsData && slotsData.length > 0 && selectedTimeSlot) {
      const apiSlot = slotsData.find(
        (slot) => slot.slot_name === selectedTimeSlot || slot.slot_id?.toString() === selectedTimeSlot
      );
      if (apiSlot) {
        // Transform API slot to expected format
        return {
          slotId: apiSlot.slot_id,
          slot_id: apiSlot.slot_id,
          slotName: apiSlot.slot_name,
          startTime: apiSlot.schedule?.start_time,
          endTime: apiSlot.schedule?.end_time,
          startDate: apiSlot.schedule?.start_date,
          endDate: apiSlot.schedule?.end_date,
          maxSeats: apiSlot.capacity?.max_seats,
          pricePerPerson: apiSlot.pricing?.price_per_person,
          b2bRate: apiSlot.pricing?.b2b_rate,
        };
      }
    }
    // Fallback to listing timeSlots
    if (!listing?.timeSlots || !selectedTimeSlot) return null;
    return listing.timeSlots.find(
      (slot) => slot.slotName === selectedTimeSlot || slot.slotId?.toString() === selectedTimeSlot
    );
  }, [slotsData, listing?.timeSlots, selectedTimeSlot]);

  // Filter availability data by selected slot for date picker
  // If no slot is selected, show all availability (user can pick date first)
  const filteredAvailabilityData = useMemo(() => {
    if (!availabilityData.length) return [];

    // If no slot is selected, show all availability
    if (!selectedTimeSlotData && !selectedTimeSlot) {
      return availabilityData;
    }

    const slotId = selectedTimeSlotData?.slotId || selectedTimeSlotData?.slot_id;
    const slotName = selectedTimeSlotData?.slotName || selectedTimeSlot;

    // Filter availability to only show dates for the selected slot
    return availabilityData.filter(av =>
      slotId ? av.slot_id === slotId : av.slot_name === slotName
    );
  }, [availabilityData, selectedTimeSlotData, selectedTimeSlot]);

  // Get availability data for selected date and slot
  const selectedDateAvailability = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = selectedDate.format("YYYY-MM-DD");

    // 1. Try to find explicit availability from the array (updated by bookings)
    const explicitAv = filteredAvailabilityData.find(av => av.date === dateStr);
    if (explicitAv) return explicitAv;

    // 2. Fallback: If no booking record exists for this date, construct a default based on slot/listing max
    if (selectedTimeSlotData || selectedTimeSlot) {
      const slotMax = selectedTimeSlotData?.maxSeats || listing?.maxGuests || 0;
      return {
        date: dateStr,
        booked_seats: 0,
        available_seats: slotMax,
        max_seats: slotMax,
        is_available: true,
        slot_id: selectedTimeSlotData?.slotId || selectedTimeSlotData?.slot_id,
        slot_name: selectedTimeSlotData?.slotName || selectedTimeSlot,
        start_time: selectedTimeSlotData?.startTime,
        end_time: selectedTimeSlotData?.endTime,
        price_per_person: selectedTimeSlotData?.pricePerPerson,
        b2b_rate: selectedTimeSlotData?.b2bRate,
      };
    }

    return null;
  }, [selectedDate, filteredAvailabilityData, selectedTimeSlotData, selectedTimeSlot, listing?.maxGuests]);

  // Get the selected timeSlot object for display
  const selectedTimeSlotDisplay = useMemo(() => {
    // Use availability data if available, otherwise fallback to timeSlot data
    if (selectedDateAvailability) {
      const { start_time, end_time } = selectedDateAvailability;
      if (start_time && end_time) {
        return formatTimeRange(start_time, end_time);
      }
    }

    if (!selectedTimeSlotData) {
      return selectedTimeSlot || "Select time";
    }
    const { startTime, endTime, slotName } = selectedTimeSlotData;
    if (startTime && endTime) {
      return formatTimeRange(startTime, endTime);
    }
    return slotName || selectedTimeSlot || "Select time";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeSlotData, selectedTimeSlot, selectedDateAvailability]);

  const items = isStay
    ? [
        {
          title: selectedDate ? selectedDate.format("MMM DD, YYYY") : formattedDefaultDate,
          category: "Check-in",
          icon: "calendar",
        },
        {
          title: selectedEndDate ? selectedEndDate.format("MMM DD, YYYY") : formattedDefaultDate,
          category: "Check-out",
          icon: "calendar",
        },
        {
          title: guestCountText,
          category: "Guest",
          icon: "user",
        },
        {
          title:
            staySelectedRoomType
              ? (stayRoomTypeOptions.find((o) => o.value === staySelectedRoomType)?.label || "Room")
              : "Select room",
          category: "Room type",
          icon: "home",
        },
      ]
    : [
        {
          title: selectedDate ? selectedDate.format("MMM DD, YYYY") : formattedDefaultDate,
          category: "Select date",
          icon: "calendar",
        },
        {
          title: selectedTimeSlotDisplay || "Select time",
          category: "Time slot",
          icon: "clock",
        },
        {
          title: guestCountText,
          category: "Guest",
          icon: "user",
        },
      ];

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem("jwtToken");
    // Check if token exists and is not empty/null
    return !!(token && token.trim() !== "");
  };

  const handleToggleAddOn = (addOnId, pricingType) => {
    if (pricingType === "Group") {
      // For Group pricing, toggle selection and initialize quantity to 1
      setSelectedAddOns((prev) => {
        if (prev.includes(addOnId)) {
          // Remove from selection
          setAddOnQuantities((qty) => {
            const newQty = { ...qty };
            delete newQty[addOnId];
            return newQty;
          });
          return prev.filter((id) => id !== addOnId);
        } else {
          // Add to selection with quantity 1
          setAddOnQuantities((qty) => ({
            ...qty,
            [addOnId]: 1,
          }));
          return [...prev, addOnId];
        }
      });
    } else {
      // For Individual pricing, simple toggle
      setSelectedAddOns((prev) =>
        prev.includes(addOnId)
          ? prev.filter((id) => id !== addOnId)
          : [...prev, addOnId]
      );
    }
  };

  const handleAddOnQuantityChange = (addOnId, newQuantity) => {
    // If quantity reaches 0, deselect the addon
    if (newQuantity <= 0) {
      setSelectedAddOns((prev) => prev.filter((id) => id !== addOnId));
      setAddOnQuantities((prev) => {
        const newQty = { ...prev };
        delete newQty[addOnId];
        return newQty;
      });
    } else {
      setAddOnQuantities((prev) => ({
        ...prev,
        [addOnId]: newQuantity,
      }));
    }
  };

  const { addOnsTotal, finalTotal, receipt } = useMemo(() => {
    // Calculate addons price based on pricing type
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      // Find addon from listing data
      const listingAddon = listing?.addons?.find(
        (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
      );

      if (listingAddon) {
        const price = parseFloat(listingAddon.addon?.price || 0);
        const pricingType = listingAddon.addon?.pricingType || "Individual";
        const quantity = pricingType === "Group" ? (addOnQuantities[id] || 1) : 1;
        return sum + (price * quantity);
      }

      // No fallback - only use API addons
      return sum;
    }, 0);

    // Calculate base price based on guest count and price type
    const guestCount = getGuestCount(guests);
    // Use availability data if available, then selected slot, then fallback to listing data
    const pricePerPerson = selectedDateAvailability?.price_per_person
      ? parseFloat(selectedDateAvailability.price_per_person)
      : (selectedTimeSlotData?.pricePerPerson
        ? parseFloat(selectedTimeSlotData.pricePerPerson)
        : (listing?.timeSlots?.[0]?.pricePerPerson
          ? parseFloat(listing.timeSlots[0].pricePerPerson)
          : null));
    const pricePerNight = selectedDateAvailability?.b2b_rate
      ? parseFloat(selectedDateAvailability.b2b_rate)
      : (selectedTimeSlotData?.b2bRate
        ? parseFloat(selectedTimeSlotData.b2bRate)
        : (listing?.timeSlots?.[0]?.b2bRate
          ? parseFloat(listing.timeSlots[0].b2bRate)
          : 119));
    const currency = listing?.currency || "INR";

    // Calculate nights (assuming 1 night for now, can be enhanced with date range)
    const nights = 1; // Default to 1 night, can be calculated from date range

    let basePriceAmount;
    let priceDescription;

    if (pricePerPerson) {
      // Price per person
      basePriceAmount = pricePerPerson * guestCount * nights;
      priceDescription = `${currency} ${pricePerPerson.toFixed(2)} × ${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}${nights > 1 ? ` × ${nights} nights` : ''}`;
    } else {
      // Price per night
      basePriceAmount = pricePerNight * nights;
      priceDescription = `${currency} ${pricePerNight.toFixed(2)}${nights > 1 ? ` × ${nights} nights` : ''}`;
    }

    const subtotal = basePriceAmount + addOnsPrice;

    const receiptData = [
      {
        title: priceDescription,
        content: `${currency} ${basePriceAmount.toFixed(2)}`,
      },
    ];

    // Add individual addon entries
    if (selectedAddOns.length > 0) {
      selectedAddOns.forEach((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );

        if (listingAddon) {
          const price = parseFloat(listingAddon.addon?.price || 0);
          const pricingType = listingAddon.addon?.pricingType || "Individual";
          const quantity = pricingType === "Group" ? (addOnQuantities[id] || 1) : 1;
          const addonTotal = price * quantity;
          const addonTitle = listingAddon.addon?.title || "Add-on";

          if (pricingType === "Group") {
            receiptData.push({
              title: `${addonTitle} × ${quantity}`,
              content: `${currency} ${addonTotal.toFixed(2)}`,
            });
          } else {
            receiptData.push({
              title: addonTitle,
              content: `${currency} ${addonTotal.toFixed(2)}`,
            });
          }
        }
        // No fallback - only use API addons
      });
    }

    // Calculate and add taxes
    let totalTaxAmount = 0;
    if (billingConfig?.taxes && Array.isArray(billingConfig.taxes)) {
      const enabledTaxes = billingConfig.taxes.filter(tax => tax.isEnabled);
      enabledTaxes.forEach(tax => {
        const taxAmount = (subtotal * parseFloat(tax.currentRate || 0)) / 100;
        totalTaxAmount += taxAmount;
        receiptData.push({
          title: tax.name,
          content: `${currency} ${taxAmount.toFixed(2)}`,
        });
      });
    }

    const total = subtotal + totalTaxAmount;

    receiptData.push({
      title: "Total",
      content: `${currency} ${total.toFixed(2)}`,
    });

    return {
      addOnsTotal: addOnsPrice,
      finalTotal: addOnsPrice,
      receipt: receiptData,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddOns, addOnQuantities, guests, listing, billingConfig, selectedDateAvailability]);

  // Save booking data to localStorage
  const saveBookingData = () => {
    const selectedAddOnsData = selectedAddOns
      .map((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );
        if (listingAddon) {
          return {
            id: listingAddon.addon?.addonId ?? listingAddon.addonId ?? listingAddon.assignmentId,
            title: listingAddon.addon?.title,
            price: listingAddon.addon?.price,
            currency: listingAddon.addon?.currency,
            pricingType: listingAddon.addon?.pricingType,
            quantity: listingAddon.addon?.pricingType === "Group" ? (addOnQuantities[id] || 1) : 1,
          };
        }
        // No fallback - return null if not found in API
        return null;
      })
      .filter(Boolean);

    // derive booking time and slot id for summary
    const summaryBookingTime =
      (selectedDateAvailability?.start_time
        ? selectedDateAvailability.start_time
        : selectedTimeSlotData?.startTime) || "";
    const summaryEndTime =
      (selectedDateAvailability?.end_time
        ? selectedDateAvailability.end_time
        : selectedTimeSlotData?.endTime) || "";
    const summarySlotId =
      selectedTimeSlotData?.slotId ||
      selectedTimeSlotData?.slot_id ||
      selectedTimeSlotData?.id ||
      null;

    const guestsCount = getGuestCount(guests);

    // Get first image from listing - prefer coverPhotoUrl, then first listingMedia, then fallback
    const getFirstListingImage = () => {
      if (listing?.coverPhotoUrl) return listing.coverPhotoUrl;
      if (Array.isArray(listing?.listingMedia) && listing.listingMedia.length > 0) {
        const firstMedia = listing.listingMedia[0];
        return firstMedia.url ||
          (firstMedia.fileUrl?.startsWith("http")
            ? firstMedia.fileUrl
            : `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${firstMedia.fileUrl}`);
      }
      if (listing?.images?.[0]?.url) return listing.images[0].url;
      if (listing?.coverImage) return listing.coverImage;
      if (listing?.image) return listing.image;
      return "";
    };

    const bookingData = {
      listingId: listing?.listingId || listing?.id,
      listingTitle: listing?.title || listing?.name || listing?.listingTitle || "",
      listingImage: getFirstListingImage(),
      selectedDate: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      selectedTimeSlot: selectedTimeSlot,
      guests: guests,
      selectedAddOns: selectedAddOnsData,
      addOnQuantities: addOnQuantities,
      receipt: receipt,
      finalTotal: finalTotal,
      // extra fields to help checkout display
      bookingSummary: {
        date: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
        time: summaryBookingTime, // "HH:mm" or "HH:mm:ss" depending on source
        endTime: summaryEndTime, // "HH:mm" format for end time
        slotId: summarySlotId,
        guestCount: guestsCount,
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
  };

  // Load booking data from localStorage and proceed to checkout
  const proceedToCheckout = () => {
    const savedBooking = localStorage.getItem("pendingBooking");
    if (savedBooking) {
      const bookingData = JSON.parse(savedBooking);
      const selectedAddOnsData = bookingData.selectedAddOns || [];

      history.push({
        pathname: "/experience-checkout",
        state: {
          addOns: selectedAddOnsData,
          bookingData: bookingData,
        },
      });

      // Clear saved booking data after using it
      localStorage.removeItem("pendingBooking");
    } else {
      // Fallback to current state if no saved data - only use API addons
      const selectedAddOnsData = selectedAddOns
        .map((id) => {
          const listingAddon = listing?.addons?.find(
            (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
          );
          if (listingAddon) {
            return {
              id: listingAddon.addon?.addonId ?? listingAddon.addonId ?? listingAddon.assignmentId,
              title: listingAddon.addon?.title,
              price: listingAddon.addon?.price,
              currency: listingAddon.addon?.currency,
              pricingType: listingAddon.addon?.pricingType,
              quantity: listingAddon.addon?.pricingType === "Group" ? (addOnQuantities[id] || 1) : 1,
            };
          }
          return null;
        })
        .filter(Boolean);

      history.push({
        pathname: "/experience-checkout",
        state: { addOns: selectedAddOnsData },
      });
    }
  };

  // Validate that all required fields are selected before allowing reservation
  const isReserveEnabled = useMemo(() => {
    const hasDate = selectedDate !== null;
    const hasTimeSlot = selectedTimeSlot !== null;
    const hasCheckout = selectedEndDate !== null;
    const hasGuests = guests && getGuestCount(guests) > 0;
    return isStay ? (hasDate && hasCheckout && hasGuests) : (hasDate && hasTimeSlot && hasGuests);
  }, [selectedDate, selectedEndDate, selectedTimeSlot, guests, isStay]);

  const handleReserveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isStay) {
      return;
    }

    // Prevent action if validation fails
    if (!isReserveEnabled) {
      return;
    }

    // Validate date and time
    const dateTimeValidation = validateBookingDateTime();
    if (!dateTimeValidation.valid) {
      alert(dateTimeValidation.error);
      return;
    }

    // Validate guest count
    const guestValidation = validateGuestCount();
    if (!guestValidation.valid) {
      alert(guestValidation.error);
      return;
    }

    // Always save booking data first
    saveBookingData();

    // Check if user is logged in
    const loggedIn = isLoggedIn();

    if (!loggedIn) {
      // Show login modal - prevent any navigation
      setShowLoginModal(true);
      return;
    }

    // User is logged in, create order
    try {
      // Get customer info from localStorage or user profile
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName = userInfo.name ||
        (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") ||
        userInfo.customerName || "";
      const customerEmail = userInfo.email || userInfo.customerEmail || "";
      // Phone number should include country code if available
      const customerPhone = userInfo.customerPhone ||
        (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") ||
        userInfo.phoneNumber ||
        userInfo.phone || "";
      // Try to derive customerId from stored user info (various possible keys)
      const customerId =
        userInfo.customerId ||
        userInfo.customer_id ||
        userInfo.id ||
        userInfo.userId ||
        userInfo.customerID ||
        null;

      // Get special requests (if any input field exists in future)
      const specialRequests = "";

      // Get listing ID
      const listingId = listing?.listingId || listing?.id || 0;

      // Format booking date (YYYY-MM-DD)
      const bookingDate = selectedDate ? selectedDate.format("YYYY-MM-DD") : new Date().toISOString().split('T')[0];

      // Get booking time from availability or timeSlot
      let bookingTime = "00:00";
      if (selectedDateAvailability?.start_time) {
        bookingTime = selectedDateAvailability.start_time;
      } else if (selectedTimeSlotData?.startTime) {
        bookingTime = selectedTimeSlotData.startTime;
      }

      // Get booking slot ID
      const bookingSlotId = selectedTimeSlotData?.slotId ||
        selectedTimeSlotData?.slot_id ||
        selectedTimeSlotData?.id ||
        0;

      // Get number of guests
      const numberOfGuests = getGuestCount(guests);

      // Validate available seats before proceeding
      if (selectedDateAvailability) {
        const availableSeats = selectedDateAvailability.available_seats;
        const slotName = selectedDateAvailability.slot_name || selectedTimeSlotData?.slotName || selectedTimeSlot || "selected slot";

        if (availableSeats !== undefined && numberOfGuests > availableSeats) {
          alert(`Sorry, only ${availableSeats} seat(s) available for "${slotName}" on ${bookingDate}. You requested ${numberOfGuests} seat(s).`);
          return;
        }
      }

      // Calculate base price amount
      const guestCount = getGuestCount(guests);
      const pricePerPerson = selectedDateAvailability?.price_per_person
        ? parseFloat(selectedDateAvailability.price_per_person)
        : (listing?.timeSlots?.[0]?.pricePerPerson
          ? parseFloat(listing.timeSlots[0].pricePerPerson)
          : null);
      const pricePerNight = selectedDateAvailability?.b2b_rate
        ? parseFloat(selectedDateAvailability.b2b_rate)
        : (listing?.timeSlots?.[0]?.b2bRate
          ? parseFloat(listing.timeSlots[0].b2bRate)
          : 0);
      const nights = 1; // Default to 1 night

      let pricingBaseAmount = 0;
      if (pricePerPerson) {
        pricingBaseAmount = pricePerPerson * guestCount * nights;
      } else {
        pricingBaseAmount = pricePerNight * nights;
      }

      // Calculate pricing values
      const pricingAddonsTotal = addOnsTotal || 0;
      const pricingSubtotal = pricingBaseAmount + pricingAddonsTotal;

      // Calculate platform commission (from billing config)
      let pricingPlatformCommission = 0;
      if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
        const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
        if (platformFee) {
          pricingPlatformCommission = (pricingSubtotal * parseFloat(platformFee.currentRate || 0)) / 100;
        }
      }

      // Calculate tax amount
      let pricingTaxAmount = 0;
      if (billingConfig?.taxes && Array.isArray(billingConfig.taxes)) {
        const enabledTaxes = billingConfig.taxes.filter(tax => tax.isEnabled);
        enabledTaxes.forEach(tax => {
          const taxAmount = (pricingSubtotal * parseFloat(tax.currentRate || 0)) / 100;
          pricingTaxAmount += taxAmount;
        });
      }

      // Calculate discount (from billing config or default 0)
      const pricingDiscountAmount = 0; // Can be enhanced with discount codes

      // Calculate total price (subtotal + taxes - discounts, excluding platform commission)
      // eslint-disable-next-line no-unused-vars
      const pricingTotal = pricingSubtotal + pricingTaxAmount - pricingDiscountAmount;

      // Calculate host earnings (what the host receives: subtotal - platform commission)
      const calculatedHostEarnings = (pricingSubtotal || 5500) - (pricingPlatformCommission || 550);
      // eslint-disable-next-line no-unused-vars
      const hostEarnings = isNaN(calculatedHostEarnings) ? 4950 : calculatedHostEarnings;

      // Calculate price per unit (price per person or price per night)
      // eslint-disable-next-line no-unused-vars
      const pricePerUnit = pricePerPerson || pricePerNight || 0;

      // Order ID for new order (0 indicates new order, will be set by backend)
      // Note: orderId will be extracted from orderResponse after order creation

      // Build addons array per new API: [{ addonId, quantity }]
      const addonsArray = selectedAddOns.map((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );

        if (listingAddon) {
          const pricingType = listingAddon.addon?.pricingType || "Individual";
          const quantity = pricingType === "Group" ? (addOnQuantities[id] || 1) : 1;

          return {
            addonId: listingAddon.addon?.addonId ?? listingAddon.addonId ?? listingAddon.assignmentId,
            quantity: quantity,
          };
        }
        return null;
      }).filter(Boolean);
      // Guest answers placeholder (extend when questions UI exists)
      const guestAnswers = [];
      // Validate required fields before creating order
      if (!bookingDate) {
        alert("Please select a booking date.");
        return;
      }

      if (!selectedTimeSlot || !bookingSlotId || bookingSlotId === 0) {
        alert("Please select a time slot.");
        return;
      }

      if (!numberOfGuests || numberOfGuests < 1) {
        alert("Please select at least 1 guest.");
        return;
      }

      if (!bookingTime || bookingTime === "00:00") {
        alert("Please select a valid time slot.");
        return;
      }

      // Build order data - new API format
      const orderData = {
        listingId: listingId || 0,
        bookingDate: bookingDate,
        bookingTime: bookingTime, // "HH:mm"
        bookingSlotId: bookingSlotId || 0,
        guestCount: numberOfGuests || 1,
        ...(customerId ? { customerId } : {}),
        customer: {
          name: customerName || "Guest User",
          email: customerEmail || "guest@example.com",
          phone: customerPhone || "+911234567890",
        },
        specialRequests: specialRequests || "",
        addons: addonsArray,
        guestAnswers: guestAnswers,
        paymentMethod: "razorpay",
      };

      console.log("📦 Creating order:", orderData);

      // Create the order
      console.log("📤 Sending order data:", JSON.stringify(orderData, null, 2));
      const orderResponse = await createOrder(orderData);
      console.log("✅ Order created:", orderResponse);

      // Extract and save orderId from order response
      const createdOrderId = orderResponse?.orderId ||
        orderResponse?.data?.orderId ||
        orderResponse?.order?.orderId ||
        null;
      if (createdOrderId) {
        localStorage.setItem("pendingOrderId", String(createdOrderId));
        console.log("💾 Saved pending orderId:", createdOrderId);
      }

      // Save payment details for checkout (e.g., Razorpay) - handle multiple response shapes
      try {
        // Log the full order response to debug structure
        console.log("📋 Full order response:", JSON.stringify(orderResponse, null, 2));

        const payment =
          orderResponse?.payment ||
          orderResponse?.data?.payment ||
          orderResponse?.order?.payment ||
          (orderResponse?.razorpayOrderId && {
            paymentMethod: "razorpay",
            razorpayOrderId: orderResponse.razorpayOrderId,
            razorpayKeyId: orderResponse.razorpayKeyId,
            amount: orderResponse.amount,
            currency: orderResponse.currency || "INR",
          }) ||
          null;
        if (payment) {
          // Get discount from multiple possible locations
          const discount =
            orderResponse?.discount ||
            orderResponse?.data?.discount ||
            orderResponse?.order?.discount ||
            orderResponse?.payment?.discount ||
            payment.discount ||
            orderResponse?.totalDiscount ||
            orderResponse?.data?.totalDiscount ||
            undefined;

          // Get final/paid amount from multiple possible locations
          const finalAmount =
            orderResponse?.finalAmount ||
            orderResponse?.data?.finalAmount ||
            orderResponse?.order?.finalAmount ||
            orderResponse?.payment?.finalAmount ||
            payment.finalAmount ||
            orderResponse?.paidAmount ||
            orderResponse?.data?.paidAmount ||
            orderResponse?.order?.paidAmount ||
            orderResponse?.payment?.paidAmount ||
            payment.paidAmount ||
            undefined;

          // The Razorpay order amount is what was actually sent to Razorpay (the paid amount)
          // This might be different from orderResponse.amount (which could be total)
          const razorpayOrderAmount =
            orderResponse?.payment?.amount ||
            orderResponse?.payment?.razorpayOrderAmount ||
            orderResponse?.razorpayOrderAmount ||
            orderResponse?.data?.razorpayOrderAmount ||
            (orderResponse?.razorpayOrderId && orderResponse?.amount ? orderResponse.amount : undefined);

          // If we have a finalAmount, that's the paid amount
          // Otherwise, if we have discount, calculate: amount - discount = paid amount
          // Otherwise, use razorpayOrderAmount if available
          // Otherwise, use payment.amount (but it might be total)
          let paidAmount = finalAmount;
          if (!paidAmount && payment.amount && discount) {
            paidAmount = payment.amount - discount;
          } else if (!paidAmount && razorpayOrderAmount) {
            paidAmount = razorpayOrderAmount;
          }

          const paymentWithDiscount = {
            ...payment,
            discount: discount,
            finalAmount: finalAmount,
            paidAmount: paidAmount,
            // Store the original amount (which might be total) separately
            totalAmount: payment.amount,
            // Store Razorpay order amount if different
            razorpayOrderAmount: razorpayOrderAmount,
          };

          console.log("💳 Payment data to save:", paymentWithDiscount);
          localStorage.setItem("pendingPayment", JSON.stringify(paymentWithDiscount));

          // Cache Razorpay key for use by other booking types (e.g., events)
          if (paymentWithDiscount.razorpayKeyId) {
            localStorage.setItem("lastRazorpayKeyId", paymentWithDiscount.razorpayKeyId);
            console.log("🔑 Cached Razorpay key for future use");
          }
        } else {
          console.warn("No payment payload found on orderResponse:", orderResponse);
        }
      } catch (e) {
        console.warn("Failed to persist payment payload:", e);
      }

      // Redirect to checkout or success page
      proceedToCheckout();

    } catch (error) {
      console.error("❌ Error creating order:", error);

      // Handle 401 Unauthorized specifically (invalid/expired token)
      if (error.response?.status === 401) {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userInfo");
        setShowLoginModal(true);
        return;
      }

      // Extract detailed error message from API response
      let errorMessage = "Failed to create order. Please try again.";

      if (error.response?.data) {
        const errorData = error.response.data;

        // Try to extract meaningful error message
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (Array.isArray(errorData.errors)) {
          // Handle validation errors array
          errorMessage = errorData.errors.map(err => err.message || err).join(", ");
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid booking data. Please check that date, time slot, and guests are selected correctly.";
        }
      }

      alert(errorMessage);
    }
  };

  // Handle Google OAuth callback - receives idToken from Google
  const handleGoogleCallback = useRef(async (response) => {
    try {
      if (!response.credential) {
        throw new Error("No credential received from Google");
      }

      // Call API with idToken using the centralized API function
      const apiResponse = await loginWithGoogle(response.credential);

      // Save JWT token to localStorage
      const token = apiResponse?.token;
      if (!token) {
        throw new Error("No token received from API");
      }

      localStorage.setItem("jwtToken", token);
      console.log("✅ JWT token stored in localStorage");

      // Extract customer data from response
      const customer = apiResponse?.customer || {};

      // Store user info: firstName, lastName, email
      const userInfo = {
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        email: customer?.email || "",
        customerId: customer?.customerId,
        loginMethod: 'google'
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      console.log("✅ User info stored from Google login:", userInfo);

      // Also store individual values for easy access
      if (customer?.firstName) {
        localStorage.setItem("firstName", customer.firstName);
      }
      if (customer?.lastName) {
        localStorage.setItem("lastName", customer.lastName);
      }
      if (customer?.email) {
        localStorage.setItem("email", customer.email);
      }

      // Close modal
      setShowLoginModal(false);

      // Check if we have pending booking data and create order
      const savedBooking = localStorage.getItem("pendingBooking");
      if (savedBooking) {
        // Create order after login
        try {
          await createOrderFromPendingBooking();
        } catch (error) {
          console.error("Error creating order after Google login:", error);
          alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
        }
      } else {
        // Fallback to current state if no saved data
        proceedToCheckout();
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert(error.response?.data?.message || "Login failed. Please try again.");
    }
  });

  // Load Google Sign-In script
  useEffect(() => {
    if (!window.google && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback.current,
          });
        }
      };
      document.body.appendChild(script);
    }
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Handle Google login button click
  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // Trigger Google Sign-In button click
      const buttonContainer = document.getElementById("google-signin-button");
      if (buttonContainer) {
        const googleButton = buttonContainer.querySelector("div[role='button']");
        if (googleButton) {
          googleButton.click();
        } else {
          // Render button if not already rendered
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
          });
          // Wait a bit then click
          setTimeout(() => {
            const btn = buttonContainer.querySelector("div[role='button']");
            if (btn) btn.click();
          }, 100);
        }
      } else {
        alert("Google Sign-In button container not found.");
      }
    } else {
      alert("Google Sign-In is not available. Please configure REACT_APP_GOOGLE_CLIENT_ID.");
    }
  };

  // Create order from pending booking data (used after login)
  const createOrderFromPendingBooking = async () => {
    const savedBooking = localStorage.getItem("pendingBooking");
    if (!savedBooking) {
      console.warn("No pending booking data found");
      return;
    }

    const bookingData = JSON.parse(savedBooking);

    // Get customer info from localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const customerName = userInfo.name ||
      (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") ||
      userInfo.customerName || "";
    const customerEmail = userInfo.email || userInfo.customerEmail || "";
    const customerPhone = userInfo.customerPhone ||
      (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") ||
      userInfo.phoneNumber ||
      userInfo.phone || "";
    const customerId =
      userInfo.customerId ||
      userInfo.customer_id ||
      userInfo.id ||
      userInfo.userId ||
      userInfo.customerID ||
      null;

    // Get special requests (if any input field exists in future)
    const specialRequests = "";

    // Get listing ID
    const listingId = bookingData.listingId || listing?.listingId || listing?.id || 0;

    // Format booking date
    const bookingDate = bookingData.selectedDate ||
      (selectedDate ? selectedDate.format("YYYY-MM-DD") : new Date().toISOString().split('T')[0]);

    // Get booking time
    let bookingTime = "00:00";
    if (selectedDateAvailability?.start_time) {
      bookingTime = selectedDateAvailability.start_time;
    } else if (selectedTimeSlotData?.startTime) {
      bookingTime = selectedTimeSlotData.startTime;
    }

    // Get booking slot ID
    const bookingSlotId = selectedTimeSlotData?.slotId ||
      selectedTimeSlotData?.slot_id ||
      selectedTimeSlotData?.id ||
      bookingData.selectedTimeSlot ||
      0;

    // Get number of guests
    const numberOfGuests = bookingData.guests ?
      getGuestCount(bookingData.guests) :
      getGuestCount(guests);

    // Calculate base price amount
    const guestCount = numberOfGuests;
    const pricePerPerson = selectedDateAvailability?.price_per_person
      ? parseFloat(selectedDateAvailability.price_per_person)
      : (listing?.timeSlots?.[0]?.pricePerPerson
        ? parseFloat(listing.timeSlots[0].pricePerPerson)
        : null);
    const pricePerNight = selectedDateAvailability?.b2b_rate
      ? parseFloat(selectedDateAvailability.b2b_rate)
      : (listing?.timeSlots?.[0]?.b2bRate
        ? parseFloat(listing.timeSlots[0].b2bRate)
        : 0);
    const nights = 1;

    let pricingBaseAmount = 0;
    if (pricePerPerson) {
      pricingBaseAmount = pricePerPerson * guestCount * nights;
    } else {
      pricingBaseAmount = pricePerNight * nights;
    }

    // Calculate addons total - simplified structure matching API format
    let pricingAddonsTotal = 0;
    const addonsArray = [];
    if (bookingData.selectedAddOns && Array.isArray(bookingData.selectedAddOns)) {
      bookingData.selectedAddOns.forEach((addonData) => {
        const addonPrice = parseFloat(addonData.price || addonData.addonPrice || 0);
        const quantity = addonData.quantity || 1;
        pricingAddonsTotal += addonPrice * quantity;
        addonsArray.push({
          addonId: addonData.id || addonData.addonId,
          quantity: quantity,
        });
      });
    }

    const pricingSubtotal = pricingBaseAmount + pricingAddonsTotal;

    // Calculate platform commission
    let pricingPlatformCommission = 0;
    if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
      const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
      if (platformFee) {
        pricingPlatformCommission = (pricingSubtotal * parseFloat(platformFee.currentRate || 0)) / 100;
      }
    }

    // Calculate tax amount
    let pricingTaxAmount = 0;
    if (billingConfig?.taxes && Array.isArray(billingConfig.taxes)) {
      const enabledTaxes = billingConfig.taxes.filter(tax => tax.isEnabled);
      enabledTaxes.forEach(tax => {
        const taxAmount = (pricingSubtotal * parseFloat(tax.currentRate || 0)) / 100;
        pricingTaxAmount += taxAmount;
      });
    }

    const pricingDiscountAmount = 0;
    // Calculate total price (subtotal + taxes - discounts, excluding platform commission)
    // eslint-disable-next-line no-unused-vars
    const pricingTotal = pricingSubtotal + pricingTaxAmount - pricingDiscountAmount;

    // Calculate host earnings (what the host receives: subtotal - platform commission)
    const calculatedHostEarnings = (pricingSubtotal || 5500) - (pricingPlatformCommission || 550);
    // eslint-disable-next-line no-unused-vars
    const hostEarnings = isNaN(calculatedHostEarnings) ? 4950 : calculatedHostEarnings;

    // Guest answers placeholder (extend when questions UI exists)
    const guestAnswers = [];

    // Build order data - new API format
    const orderData = {
      listingId: listingId || 0,
      bookingDate: bookingDate,
      bookingTime: bookingTime, // "HH:mm"
      bookingSlotId: bookingSlotId || 0,
      guestCount: numberOfGuests || 1,
      ...(customerId ? { customerId } : {}),
      customer: {
        name: customerName || "Guest User",
        email: customerEmail || "guest@example.com",
        phone: customerPhone || "+911234567890",
      },
      specialRequests: specialRequests || "",
      addons: addonsArray,
      guestAnswers: guestAnswers,
      paymentMethod: "razorpay",
    };

    console.log("📦 Creating order after login:", orderData);

    // Create the order
    const orderResponse = await createOrder(orderData);
    console.log("✅ Order created:", orderResponse);

    // Save payment details for checkout (e.g., Razorpay)
    try {
      const payment =
        orderResponse?.payment ||
        orderResponse?.data?.payment ||
        orderResponse?.order?.payment ||
        (orderResponse?.razorpayOrderId && {
          paymentMethod: "razorpay",
          razorpayOrderId: orderResponse.razorpayOrderId,
          razorpayKeyId: orderResponse.razorpayKeyId,
          amount: orderResponse.amount,
          currency: orderResponse.currency || "INR",
        }) ||
        null;
      if (payment) {
        localStorage.setItem("pendingPayment", JSON.stringify(payment));

        // Cache Razorpay key for use by other booking types (e.g., events)
        if (payment.razorpayKeyId) {
          localStorage.setItem("lastRazorpayKeyId", payment.razorpayKeyId);
          console.log("🔑 Cached Razorpay key for future use");
        }
      } else {
        console.warn("No payment payload found on orderResponse:", orderResponse);
      }
    } catch (e) {
      console.warn("Failed to persist payment payload:", e);
    }


    // Redirect to checkout
    proceedToCheckout();
  };

  // Handle phone login callback (called after successful OTP verification)
  const handlePhoneLogin = async (phoneNumber, response) => {
    console.log("Phone login successful:", phoneNumber, response);
    // JWT token and user info are already stored in localStorage by LoginModal
    // Now create the order if we have pending booking data
    try {
      await createOrderFromPendingBooking();
    } catch (error) {
      console.error("Error creating order after login:", error);
      alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
    }
  };

  // Track if login modal was previously open to detect when it closes
  const prevLoginModalRef = useRef(false);

  // Check for successful login after modal closes (for Google login fallback)
  useEffect(() => {
    // Only proceed if modal was JUST closed (was open, now closed) AND user is now logged in AND we have saved booking
    // Note: Phone login handles order creation directly in handlePhoneLogin
    // This is a fallback for Google login if createOrderFromPendingBooking wasn't called
    const wasModalOpen = prevLoginModalRef.current;
    const isModalNowClosed = !showLoginModal;

    // Only run if modal was open and is now closed (user just logged in)
    if (wasModalOpen && isModalNowClosed && isLoggedIn()) {
      const savedBooking = localStorage.getItem("pendingBooking");
      if (savedBooking) {
        // Small delay to ensure modal is fully closed, then create order
        setTimeout(async () => {
          try {
            await createOrderFromPendingBooking();
          } catch (error) {
            console.error("Error creating order after login:", error);
            // Don't show alert for 400 errors - they're handled gracefully
            if (error.response?.status !== 400) {
              alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
            }
          }
        }, 100);
      }
    }

    // Update ref for next render
    prevLoginModalRef.current = showLoginModal;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoginModal]);

  const handleOpenDateTime = (index) => {
    // Show date picker when clicking date item (index 0) or check-out (index 1 for stays)
    if (index === 0 || (isStay && index === 1)) {
      if (isStay) {
        setStayActiveDateField(index === 1 ? "checkout" : "checkin");
      }
      setShowDatePicker(true);
      setShowTimeSlots(false);
      setShowGuestPicker(false);
    }
    // Show time slots when clicking time slot item (index 1)
    else if (index === 1) {
      setShowTimeSlots(true);
      setShowDatePicker(false);
      setShowGuestPicker(false);
    }
    // Show guest picker when clicking guest item (index 2)
    else if (index === 2) {
      setShowGuestPicker(true);
      setShowDatePicker(false);
      setShowTimeSlots(false);
    }
  };

  const handleDateSelect = (startDateText, endDateText) => {
    if (isStay) {
      if (startDateText) {
        const next = moment(new Date(startDateText));
        if (stayActiveDateField === "checkout") {
          setSelectedEndDate(next);
        } else {
          setSelectedDate(next);
        }
      }
    } else {
      if (startDateText) {
        setSelectedDate(moment(new Date(startDateText)));
      }
      if (endDateText) {
        setSelectedEndDate(moment(new Date(endDateText)));
      } else {
        setSelectedEndDate(null);
      }
    }
    setShowDatePicker(false);
  };

  const handleTimeSelect = (timeText) => {
    setSelectedTimeSlot(timeText);
    setShowTimeSlots(false);
  };

  // Get maxSeats from available_seats for selected date/slot, fallback to timeSlot capacity, then listing maxGuests
  // Note: available_seats is the actual available seats for the selected date and slot (can be less than max_seats)
  const maxSeats = useMemo(() => {
    // Priority 1: Use available_seats from selected date availability (most accurate)
    // We include 0 because if it's 0, it means the slot is full
    if (selectedDateAvailability?.available_seats !== undefined) {
      return selectedDateAvailability.available_seats;
    }
    // Priority 2: Use max_seats from selected date availability as fallback
    if (selectedDateAvailability?.max_seats !== undefined) {
      return selectedDateAvailability.max_seats;
    }
    // Priority 3: Use maxSeats from selected timeSlot capacity
    if (selectedTimeSlotData?.maxSeats !== undefined && selectedTimeSlotData?.maxSeats > 0) {
      return selectedTimeSlotData.maxSeats;
    }
    // Priority 4: Fallback to listing maxGuests (or undefined for no limit)
    return listing?.maxGuests || undefined;
  }, [selectedDateAvailability, selectedTimeSlotData, listing?.maxGuests]);

  const isFullyBooked = useMemo(() => {
    if (isStay) return false;
    // Only check if date and slot are selected
    if (!selectedDate || !selectedTimeSlot || !selectedDateAvailability) return false;
    return selectedDateAvailability.available_seats === 0;
  }, [isStay, selectedDate, selectedTimeSlot, selectedDateAvailability]);

  // Fetch slots data when listing is available
  useEffect(() => {
    if (isStay) {
      setSlotsData([]);
      setTransformedTimeSlots([]);
      setAvailabilityData([]);
      return;
    }
    // Early return if listing is not yet loaded or is empty object
    if (!listing || (typeof listing === 'object' && Object.keys(listing).length === 0)) {
      return;
    }

    // Try multiple possible property names for listingId
    const listingId = listing?.listingId || listing?.listing_id || listing?.id;

    // Early return if no valid listingId found
    if (!listingId) {
      return;
    }

    // Ensure listingId is a valid number or string
    const listingIdNum = Number(listingId);
    const validListingId = (!isNaN(listingIdNum) && listingIdNum > 0) ? listingIdNum : String(listingId);

    if (!validListingId || validListingId === "undefined" || validListingId === "null" || validListingId === "NaN" || validListingId === 0) {
      return;
    }

    // Reset initial values flag when listing changes
    initialValuesSetRef.current = false;

    const fetchSlots = async () => {

      try {
        // Calculate date range (current month + next month)
        // Use local date to avoid timezone issues
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 2, 0);

        // Format dates as YYYY-MM-DD using local date (avoid timezone issues)
        const formatDate = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        };

        const startDateStr = formatDate(startDate);
        const endDateStr = formatDate(endDate);

        if (!startDateStr || !endDateStr) {
          console.error("❌ Invalid date range:", { startDateStr, endDateStr });
          return;
        }

        console.log("📅 Fetching slots:", {
          listingId: validListingId,
          startDate: startDateStr,
          endDate: endDateStr
        });

        const slotsResponse = await getListingSlots(validListingId, startDateStr, endDateStr);
        console.log("✅ Slots data received:", slotsResponse);

        // Extract slots array from response
        const slots = slotsResponse?.slots || [];
        setSlotsData(slots);

        // Transform slots to match expected timeSlots format
        const transformed = slots.map((slot) => {
          // Convert selected_days array to day flags for compatibility
          const selectedDays = slot.schedule?.selected_days || [];
          const dayFlags = {
            isMonday: selectedDays.includes('MON'),
            isTuesday: selectedDays.includes('TUE'),
            isWednesday: selectedDays.includes('WED'),
            isThursday: selectedDays.includes('THU'),
            isFriday: selectedDays.includes('FRI'),
            isSaturday: selectedDays.includes('SAT'),
            isSunday: selectedDays.includes('SUN'),
          };

          return {
            slotId: slot.slot_id,
            slot_id: slot.slot_id,
            slotName: slot.slot_name,
            startTime: slot.schedule?.start_time,
            endTime: slot.schedule?.end_time,
            startDate: slot.schedule?.start_date,
            endDate: slot.schedule?.end_date,
            selected_days: selectedDays,
            ...dayFlags,
            maxSeats: slot.capacity?.max_seats,
            pricePerPerson: slot.pricing?.price_per_person,
            b2bRate: slot.pricing?.b2b_rate,
            corporateRate: slot.pricing?.corporate_rate,
            isActive: true, // Assume active if returned from API
          };
        });
        setTransformedTimeSlots(transformed);

        // Flatten availability data from all slots
        // The API already provides the correct available dates, so we use all of them
        const allAvailability = [];
        slots.forEach((slot) => {
          if (Array.isArray(slot.availability)) {
            slot.availability.forEach((av) => {
              // Include all dates from the API - they're already filtered by the backend
              allAvailability.push({
                date: av.date, // Format: YYYY-MM-DD
                booked_seats: av.booked_seats || 0,
                available_seats: av.available_seats || 0,
                is_available: av.is_available !== false,
                max_seats: slot.capacity?.max_seats || 0,
                start_time: slot.schedule?.start_time, // Format: HH:mm
                end_time: slot.schedule?.end_time, // Format: HH:mm
                price_per_person: slot.pricing?.price_per_person,
                b2b_rate: slot.pricing?.b2b_rate,
                slot_id: slot.slot_id,
                slot_name: slot.slot_name,
              });
            });
          }
        });
        setAvailabilityData(allAvailability);

        // Don't pre-select date or time slot - let user choose
        // Just mark that we've loaded the slots data
        if (slots.length > 0 && !initialValuesSetRef.current) {
          initialValuesSetRef.current = true;
        }
      } catch (error) {
        // Handle 400 errors gracefully - they might be expected for some listings
        if (error.response?.status === 400) {
          console.warn("⚠️ 400 Bad Request for slots (listing might not have slots configured):", {
            listingId: validListingId,
            message: error.response?.data?.message || error.message,
            response: error.response?.data
          });
        } else {
          console.error("❌ Failed to fetch slots:", {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            listingId: validListingId
          });
        }
        // Don't show error to user, just set empty arrays
        setSlotsData([]);
        setTransformedTimeSlots([]);
        setAvailabilityData([]);
      }
    };

    fetchSlots();
  }, [listing, isStay]);

  // Fetch billing configuration when listing is available
  useEffect(() => {
    if (isStay) {
      setBillingConfig(null);
      return;
    }
    // Early return if listing is not yet loaded or is empty object
    if (!listing || (typeof listing === 'object' && Object.keys(listing).length === 0)) {
      return;
    }

    // Try multiple possible property names for listingId
    const listingId = listing?.listingId || listing?.listing_id || listing?.id;

    // Early return if no valid listingId found
    if (!listingId) {
      return;
    }

    // Ensure listingId is a valid number or string
    const listingIdNum = Number(listingId);
    const validListingId = (!isNaN(listingIdNum) && listingIdNum > 0) ? listingIdNum : String(listingId);

    if (!validListingId || validListingId === "undefined" || validListingId === "null" || validListingId === "NaN" || validListingId === 0) {
      return;
    }

    const fetchBillingConfig = async () => {

      try {
        const config = await getBillingConfiguration(validListingId);
        setBillingConfig(config);
      } catch (error) {
        // Handle 400 errors gracefully - they might be expected for some listings
        if (error.response?.status === 400) {
          console.warn("⚠️ 400 Bad Request for billing config (listing might not have billing config):", {
            listingId: validListingId,
            message: error.response?.data?.message || error.message,
            response: error.response?.data
          });
        } else {
          console.error("❌ Failed to fetch billing configuration:", {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            listingId: validListingId
          });
        }
        // Set to null on error so we don't show taxes
        setBillingConfig(null);
      }
    };

    fetchBillingConfig();
  }, [listing, isStay]);

  // Note: Availability is now fetched from slots API, so we don't need a separate availability fetch
  // The old availability endpoint is kept as a fallback but disabled when slots data is available

  // Ensure guest count doesn't exceed available seats when date/slot/availability changes
  React.useEffect(() => {
    if (maxSeats !== undefined && maxSeats > 0) {
      const currentTotal = getGuestCount(guests);
      if (currentTotal > maxSeats) {
        // Adjust guests to not exceed available seats
        // We reduce children first, then adults
        const newGuests = { ...guests };
        if (newGuests.children > 0) {
          const overage = currentTotal - maxSeats;
          newGuests.children = Math.max(0, newGuests.children - overage);
          const newTotal = (newGuests.adults || 0) + (newGuests.children || 0);
          if (newTotal > maxSeats) {
            newGuests.adults = maxSeats;
          }
        } else {
          newGuests.adults = maxSeats;
        }

        // Also check if infants still fit (infants <= adults)
        if (newGuests.infants > newGuests.adults) {
          newGuests.infants = newGuests.adults;
        }

        setGuests(newGuests);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSeats, selectedDateAvailability, guests]);

  return (
    <>
      <div className={cn(classSection, styles.section)}>
        <div className={cn("container", styles.container)}>
          <div className={styles.wrapper}>
            <Details
              className={styles.details}
              listing={listing}
              selectedAddOns={selectedAddOns}
              addOnQuantities={addOnQuantities}
              onToggleAddOn={handleToggleAddOn}
              onAddOnQuantityChange={handleAddOnQuantityChange}
            />
            <Receipt
              className={styles.receipt}
              items={items}
              hostData={hostData}
              priceActual={
                selectedTimeSlotData?.pricePerPerson
                  ? `${listing?.currency || "INR"} ${selectedTimeSlotData.pricePerPerson}`
                  : selectedTimeSlotData?.b2bRate
                    ? `${listing?.currency || "INR"} ${selectedTimeSlotData.b2bRate}`
                    : listing?.timeSlots?.[0]?.pricePerPerson
                      ? `${listing?.currency || "INR"} ${listing.timeSlots[0].pricePerPerson}`
                      : listing?.timeSlots?.[0]?.b2bRate
                        ? `${listing?.currency || "INR"} ${listing.timeSlots[0].b2bRate}`
                        : "$119"
              }
              time={
                selectedTimeSlotData?.pricePerPerson || listing?.timeSlots?.[0]?.pricePerPerson
                  ? "person"
                  : "night"
              }
              avatar={listing?.hostAvatar || listing?.avatar}
              onItemClick={handleOpenDateTime}
              renderItem={(item, index) => {
                if (index === 0) {
                  return (
                    <div ref={dateItemRef} style={{ position: 'relative' }}>
                      <div
                        className={receiptStyles.item}
                        onClick={() => handleOpenDateTime(0)}
                        role="button"
                      >
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>{item.title}</div>
                        </div>
                      </div>
                      <InlineDatePicker
                        visible={isStay ? (showDatePicker && stayActiveDateField === "checkin") : showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onDateSelect={handleDateSelect}
                        selectedDate={selectedDate ? selectedDate.toDate().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null}
                        timeSlots={transformedTimeSlots.length > 0 ? transformedTimeSlots : (listing?.timeSlots || [])}
                        availabilityData={filteredAvailabilityData}
                      />
                    </div>
                  );
                }
                if (index === 1) {
                  if (isStay) {
                    const stayPickerSelected =
                      stayActiveDateField === "checkout" ? selectedEndDate : selectedDate;
                    return (
                      <div ref={checkoutItemRef} style={{ position: 'relative' }}>
                        <div
                          className={receiptStyles.item}
                          onClick={() => handleOpenDateTime(1)}
                          role="button"
                        >
                          <div className={receiptStyles.icon}>
                            <Icon name={item.icon} size="24" />
                          </div>
                          <div className={receiptStyles.box}>
                            <div className={receiptStyles.category}>{item.category}</div>
                            <div className={receiptStyles.subtitle}>{item.title}</div>
                          </div>
                        </div>
                        <InlineDatePicker
                          visible={showDatePicker && stayActiveDateField === "checkout"}
                          onClose={() => setShowDatePicker(false)}
                          onDateSelect={handleDateSelect}
                          selectedDate={stayPickerSelected ? stayPickerSelected.toDate().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null}
                          timeSlots={transformedTimeSlots.length > 0 ? transformedTimeSlots : (listing?.timeSlots || [])}
                          availabilityData={filteredAvailabilityData}
                        />
                      </div>
                    );
                  }
                  return (
                    <div ref={timeItemRef} style={{ position: 'relative' }}>
                      <div
                        className={receiptStyles.item}
                        onClick={() => handleOpenDateTime(1)}
                        role="button"
                      >
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>{item.title}</div>
                        </div>
                      </div>
                      <TimeSlotsPicker
                        visible={showTimeSlots}
                        onClose={() => setShowTimeSlots(false)}
                        onTimeSelect={handleTimeSelect}
                        selectedTime={selectedTimeSlot}
                        timeSlots={transformedTimeSlots.length > 0 ? transformedTimeSlots : (listing?.timeSlots || [])}
                      />
                    </div>
                  );
                }
                if (index === 2) {
                  if (isStay && !stayAvailabilityChecked) {
                    return (
                      <div ref={guestItemRef} style={{ position: 'relative' }}>
                        <div
                          className={cn(receiptStyles.item, receiptStyles.guestCentered)}
                          role="button"
                        >
                          <div className={receiptStyles.icon}>
                            <Icon name={item.icon} size="24" />
                          </div>
                          <div className={receiptStyles.box}>
                            <div className={receiptStyles.category}>{item.category}</div>
                            <div className={receiptStyles.subtitle}>{item.title}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div ref={guestItemRef} style={{ position: 'relative' }}>
                      <div
                        className={cn(receiptStyles.item, receiptStyles.guestCentered)}
                        onClick={() => handleOpenDateTime(2)}
                        role="button"
                      >
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>{item.title}</div>
                        </div>
                      </div>
                      <GuestPicker
                        visible={showGuestPicker}
                        onClose={() => setShowGuestPicker(false)}
                        onGuestChange={(guestData) => {
                          setGuests(guestData);
                        }}
                        initialGuests={guests}
                        maxGuests={listing?.maxGuests || undefined}
                        maxSeats={maxSeats}
                        allowPets={listing?.allowPets || false}
                        childrenAllowed={listing?.childrenAllowed !== false}
                        infantsAllowed={listing?.infantsAllowed === true}
                        adultsLabel="Guests"
                      />
                    </div>
                  );
                }
                if (index === 3) {
                  const selectedRoomLabel =
                    staySelectedRoomType
                      ? (stayRoomTypeOptions.find((o) => o.value === staySelectedRoomType)?.label || "Room")
                      : "Select room";

                  return (
                    <div ref={roomTypeItemRef} style={{ position: 'relative' }}>
                      <div className={receiptStyles.item}>
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>
                            <div
                              role="button"
                              onClick={() => {
                                if (!isStay || !stayAvailabilityChecked || stayRoomTypeOptions.length === 0) return;
                                setShowRoomTypePicker((v) => !v);
                              }}
                              style={{
                                width: "100%",
                                background: "transparent",
                                color: "inherit",
                                border: "none",
                                outline: "none",
                                cursor:
                                  !isStay || !stayAvailabilityChecked || stayRoomTypeOptions.length === 0
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              {selectedRoomLabel}
                            </div>
                          </div>
                        </div>
                      </div>

                      {showRoomTypePicker && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "100%",
                            marginTop: 6,
                            background: "#141416",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.12)",
                            overflow: "hidden",
                            zIndex: 50,
                          }}
                        >
                          <div
                            role="button"
                            onClick={() => {
                              setStaySelectedRoomType("");
                              setShowRoomTypePicker(false);
                            }}
                            style={{
                              padding: "10px 12px",
                              color: "#FFFFFF",
                              background: "#141416",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#141416";
                            }}
                          >
                            Select room
                          </div>
                          {stayRoomTypeOptions.map((opt) => (
                            <div
                              key={opt.value}
                              role="button"
                              onClick={() => {
                                setStaySelectedRoomType(opt.value);
                                setShowRoomTypePicker(false);
                              }}
                              style={{
                                padding: "10px 12px",
                                color: "#FFFFFF",
                                background: "#141416",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#141416";
                              }}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            >
              <div className={styles.btns}>
                <button className={cn("button-stroke", styles.button)}>
                  <span>Save</span>
                  <Icon name="plus" size="16" />
                </button>
                {isStay ? (
                  <button
                    type="button"
                    className={cn("button", styles.button)}
                    onClick={handleCheckStayAvailability}
                    disabled={!selectedDate || !selectedEndDate || stayAvailabilityLoading}
                    title={!selectedDate || !selectedEndDate ? "Please select check-in and check-out dates" : ""}
                  >
                    <span>{stayAvailabilityLoading ? "Checking..." : "Check availability"}</span>
                    <Icon name="bag" size="16" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn("button", styles.button)}
                    onClick={handleReserveClick}
                    disabled={!isReserveEnabled}
                    title={!isReserveEnabled ? "Please select date, time slot, and guests" : ""}
                  >
                    <span>Reserve</span>
                    <Icon name="bag" size="16" />
                  </button>
                )}
              </div>
              {isFullyBooked && (
                <div style={{ color: "#FF6A55", marginTop: 12, fontSize: 13, fontWeight: "500", textAlign: "center" }}>
                  This slot is fully booked. Please select another date or time.
                </div>
              )}
              {!isFullyBooked && selectedDate && selectedTimeSlot && selectedDateAvailability && getGuestCount(guests) > (selectedDateAvailability.available_seats ?? 999) && (
                <div style={{ color: "#FF6A55", marginTop: 12, fontSize: 13, fontWeight: "500", textAlign: "center" }}>
                  Only {selectedDateAvailability.available_seats} seat(s) available for this slot.
                </div>
              )}
              <div className={styles.table}>
                {receipt.map((x, index) => (
                  <div className={styles.line} key={index}>
                    <div className={styles.cell}>{x.title}</div>
                    <div className={styles.cell}>{x.content}</div>
                  </div>
                ))}
              </div>
              <div className={styles.foot}>
                <button className={styles.report}>
                  <Icon name="flag" size="12" />
                  Report this property
                </button>
              </div>
            </Receipt>
          </div>
        </div>
      </div>
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onGoogleLogin={handleGoogleLogin}
        onPhoneLogin={handlePhoneLogin}
      />
    </>
  );
};

export default Description;
