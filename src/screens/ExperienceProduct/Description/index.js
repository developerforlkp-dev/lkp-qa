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
import Dropdown from "../../../components/Dropdown";
import LoginModal from "../../../components/LoginModal";
import { getBillingConfiguration, createOrder, getListingSlots, loginWithGoogle, getStayRoomAvailability, createStayOrder } from "../../../utils/api";

const Description = ({ classSection, listing, hostData, externalRoomId, externalMealPlan, onRoomSelect, selectedRoomId, externalRoomsCount, onRoomsCountChange }) => {
  const history = useHistory();
  const isStay = Boolean(listing?.stayId || listing?.stay_id || listing?.propertyType === "STAY");
  const isPropertyBased = isStay && (listing?.stay?.bookingScope === "Property-Based" || listing?.stay?.bookingScope === "Property Based" || listing?.bookingScope === "Property-Based" || listing?.bookingScope === "Property Based");
  const isFood = Boolean(listing?.menuName || listing?.cuisineType || listing?.foodId || listing?.menuId);
  const isPlace = Boolean(listing?.placeName || listing?.placeType || listing?.placeId);
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

  const normalizeBookingTime = (timeString) => {
    if (!timeString) return "00:00";
    const parts = String(timeString).split(":");
    const hours = parts[0] ?? "00";
    const minutes = parts[1] ?? "00";
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
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
const [selectedMealPlanCode, setSelectedMealPlanCode] = useState(null);

// Sync external room + meal plan selection from RoomCards
useEffect(() => {
  if (externalRoomId) setStaySelectedRoomType(externalRoomId);
}, [externalRoomId]);

useEffect(() => {
  if (externalMealPlan) setSelectedMealPlanCode(externalMealPlan);
}, [externalMealPlan]);

const [guests, setGuests] = useState({
  adults: 0,
  children: 0,
  infants: 0,
  pets: 0,
});
const [hasSelectedGuests, setHasSelectedGuests] = useState(false);
const [showDatePicker, setShowDatePicker] = useState(false);
const [showTimeSlots, setShowTimeSlots] = useState(false);
const [showGuestPicker, setShowGuestPicker] = useState(false);
const [showRoomTypePicker, setShowRoomTypePicker] = useState(false);
const [showLoginModal, setShowLoginModal] = useState(false);
const [isReserveSubmitting, setIsReserveSubmitting] = useState(false);
const dateItemRef = useRef(null);
const timeItemRef = useRef(null);
const guestItemRef = useRef(null);
const checkoutItemRef = useRef(null);
const roomTypeItemRef = useRef(null);
const initialValuesSetRef = useRef(false);
const reserveSubmitLockRef = useRef(false);

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
  // Only reset availability when DATES change, NOT when guest count changes.
  // Guest count changes should not require re-checking availability.
  setStayAvailabilityChecked(false);
  setStayAvailabilityResult(null);
  setStaySelectedRoomType("");
  setShowRoomTypePicker(false);
}, [isStay, selectedDate, selectedEndDate]);

// Helper function to get guest count (supports both old and new format)
const getGuestCount = (guestsObj) => {
  if (!guestsObj) return 0;
  if (guestsObj.guests !== undefined) {
    return guestsObj.guests;
  }
  // Legacy format: adults + children
  return (guestsObj.adults || 0) + (guestsObj.children || 0);
};

const minimumChargeAge = 12;

const billableGuestLabel = useMemo(() => {
  if (listing?.childAgeTo !== undefined) {
    return `Age ${listing.childAgeTo + 1}+`;
  }
  return `Age 12+`;
}, [listing?.childAgeTo]);

const childrenGuestLabel = useMemo(() => {
  if (listing?.childAgeFrom !== undefined && listing?.childAgeTo !== undefined) {
    return `Ages ${listing.childAgeFrom}-${listing.childAgeTo}`;
  }
  return `Ages 6-12`;
}, [listing?.childAgeFrom, listing?.childAgeTo]);

  const getBillableGuestCount = (guestsObj) => {
    if (!guestsObj) return 0;
    // For both stays and experiences, billable count should be the total number of guests (adults + children)
    // to match "Price x Number of count" logic for Individual pricing.
    return getGuestCount(guestsObj);
  };

const stayRoomTypeOptions = useMemo(() => {
  // Choose candidates: from availability result or directly from listing
  let candidates = [];
  if (stayAvailabilityResult) {
    const payload = stayAvailabilityResult;
    candidates =
      (Array.isArray(payload) && payload) ||
      (Array.isArray(payload.roomTypes) && payload.roomTypes) ||
      (Array.isArray(payload.rooms) && payload.rooms) ||
      (Array.isArray(payload.data) && payload.data) ||
      (Array.isArray(payload.data?.roomTypes) && payload.data.roomTypes) ||
      [];
  } else if (listing) {
    candidates = listing.rooms || listing.roomTypes || listing.room_types || listing.stay?.rooms || [];
  }

  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  const seenIds = new Set();
  return candidates
    .map((x) => {
      if (typeof x === "string") {
        if (seenIds.has(x)) return null;
        seenIds.add(x);
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

      if (!id || seenIds.has(String(id))) return null;
      seenIds.add(String(id));

      // Show ALL rooms regardless of guest count.
      // Extra-room logic / messaging handles cases where guests > room capacity.
      // Show ALL rooms regardless of guest count.
      // Extra-room logic / messaging handles cases where guests > room capacity.
      const maxRoomGuests = x?.maxGuests ?? x?.max_guests ?? x?.capacity ?? x?.maxAdults ?? 0;

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

      let label = String(labelBase);
      if (typeof availableRooms === "number") {
        label += ` (${availableRooms} available)`;
      } else if (maxRoomGuests > 0) {
        label += ` (Max ${maxRoomGuests})`;
      }

      if (typeof availableRooms === "number" && availableRooms <= 0) {
        return null;
      }

      return { value: String(id), label: String(label), raw: x };
    })
    .filter(Boolean);
}, [stayAvailabilityResult, listing, guests]);
const stayMealPlanOptions = useMemo(() => {
  if (!isStay || !listing) return [];

  const MEAL_LABELS_FULL = {
    EP: "Room Only (EP)",
    BB: "Bed & Breakfast (BB)",
    CP: "Continental Plan (CP)",
    MAP: "Half Board (MAP)",
    AP: "Full Board (AP)"
  };

  let plans = [];

  if (isPropertyBased) {
    const stayProp = listing?.stay || listing;
    if (stayProp?.mealPlanPricing && typeof stayProp.mealPlanPricing === "object") {
      plans = Object.keys(stayProp.mealPlanPricing);
    } else {
      // Fallback: check legacy price fields
      if (stayProp?.epPrice || stayProp?.startingPrice || stayProp?.b2cPrice) plans.push("EP");
      if (stayProp?.bbPrice) plans.push("BB");
      if (stayProp?.cpPrice) plans.push("CP");
      if (stayProp?.mapPrice) plans.push("MAP");
      if (stayProp?.apPrice) plans.push("AP");
    }
  } else {
    // Room-based: meal plans of selected room
    const rooms = listing?.rooms || listing?.roomTypes || listing?.room_types || listing?.stay?.rooms || [];
    const selRoom = rooms.find(r => String(r.roomId ?? r.id ?? r.roomTypeId ?? r.code) === String(staySelectedRoomType));
    if (selRoom) {
      if (selRoom.mealPlanPricing && typeof selRoom.mealPlanPricing === "object") {
        plans = Object.keys(selRoom.mealPlanPricing);
      } else {
        if (selRoom.epPrice) plans.push("EP");
        if (selRoom.bbPrice) plans.push("BB");
        if (selRoom.cpPrice) plans.push("CP");
        if (selRoom.mapPrice) plans.push("MAP");
        if (selRoom.apPrice) plans.push("AP");
      }
    }
  }

  // Deduplicate and map with prices
  const currency = listing?.stay?.currency || listing?.currency || "INR";
  
  return [...new Set(plans)].map(code => {
    let pricePa = 0;
    if (isPropertyBased) {
      const stayProp = listing?.stay || listing;
      if (stayProp?.mealPlanPricing?.[code]) {
        pricePa = parseFloat(stayProp.mealPlanPricing[code].b2cPrice || stayProp.mealPlanPricing[code].price || 0);
      } else {
        if (code === "EP") pricePa = parseFloat(stayProp?.epPrice || stayProp?.startingPrice || stayProp?.b2cPrice || 0);
        else if (code === "BB") pricePa = parseFloat(stayProp?.bbPrice || 0);
        else if (code === "CP") pricePa = parseFloat(stayProp?.cpPrice || 0);
        else if (code === "MAP") pricePa = parseFloat(stayProp?.mapPrice || 0);
        else if (code === "AP") pricePa = parseFloat(stayProp?.apPrice || 0);
      }
    } else {
       // For room-based, price is harder to show in a general list without more logic,
       // but we can try to find it for the selected room
       const rooms = listing?.rooms || listing?.roomTypes || listing?.room_types || listing?.stay?.rooms || [];
       const selRoom = rooms.find(r => String(r.roomId ?? r.id ?? r.roomTypeId ?? r.code) === String(staySelectedRoomType));
       if (selRoom) {
         if (selRoom.mealPlanPricing?.[code]) {
            pricePa = parseFloat(selRoom.mealPlanPricing[code].b2cPrice || selRoom.mealPlanPricing[code].price || 0);
         } else {
            if (code === "EP") pricePa = parseFloat(selRoom.epPrice || selRoom.b2cPrice || 0);
            else if (code === "BB") pricePa = parseFloat(selRoom.bbPrice || 0);
            else if (code === "CP") pricePa = parseFloat(selRoom.cpPrice || 0);
            else if (code === "MAP") pricePa = parseFloat(selRoom.mapPrice || 0);
            else if (code === "AP") pricePa = parseFloat(selRoom.apPrice || 0);
         }
       }
    }

    const pricePart = pricePa > 0 ? ` (+ ${currency} ${pricePa.toFixed(0)})` : "";
    return {
      value: code,
      label: (MEAL_LABELS_FULL[code] || code) + pricePart
    };
  });
}, [isStay, isPropertyBased, listing, staySelectedRoomType]);
const guestCountText = useMemo(() => {
  if (!isStay && !hasSelectedGuests) return "Add guests";
  const total = getGuestCount(guests);
  if (total === 0) return "Add guests";
  if (total === 1) return "1 guest";
  return `${total} guests`;
}, [guests, hasSelectedGuests, isStay]);

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
        groupBookingPricing: apiSlot.group_booking_pricing || [],
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
  if (!isStay && !selectedTimeSlot) return null;
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
      group_booking_pricing: selectedTimeSlotData?.groupBookingPricing || [],
    };
  }

  return null;
}, [selectedDate, filteredAvailabilityData, selectedTimeSlotData, selectedTimeSlot, listing?.maxGuests, isStay]);

const availableTimeSlotsForSelectedDate = useMemo(() => {
  if (isStay) return [];

  const availableTimeSlots = (transformedTimeSlots.length > 0 ? transformedTimeSlots : (listing?.timeSlots || []))
    .filter(slot => slot.is_active !== false && slot.isActive !== false);
  if (!selectedDate) return availableTimeSlots;

  const DAY_CODES_LOCAL = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const DAY_FLAGS_LOCAL = ['isSunday', 'isMonday', 'isTuesday', 'isWednesday', 'isThursday', 'isFriday', 'isSaturday'];
  const dayIdx = selectedDate.day();
  const dayCode = DAY_CODES_LOCAL[dayIdx];
  const dayFlag = DAY_FLAGS_LOCAL[dayIdx];

  return availableTimeSlots.filter((slot) => {
    const slotStartDate = slot.startDate || slot.start_date;
    const slotEndDate = slot.endDate || slot.end_date;
    const isWithinDateRange = (!slotStartDate || !selectedDate.isBefore(moment(slotStartDate), "day"))
      && (!slotEndDate || !selectedDate.isAfter(moment(slotEndDate), "day"));

    if (!isWithinDateRange) return false;

    if (Array.isArray(slot.selected_days) && slot.selected_days.length > 0) {
      return slot.selected_days.includes(dayCode);
    }
    if (slot[dayFlag] !== undefined) return slot[dayFlag] === true;
    return true;
  });
}, [isStay, transformedTimeSlots, listing?.timeSlots, selectedDate]);

const hasFutureTimeSlots = useMemo(() => {
  if (isStay || !selectedDate) return true;
  if (isPastDate(selectedDate)) return false;

  if (availableTimeSlotsForSelectedDate.length === 0) {
    return false;
  }

  return availableTimeSlotsForSelectedDate.some((slot) => {
    const slotStartTime = slot.startTime || slot.start_time;
    if (!slotStartTime) return true;
    return !isPastTime(selectedDate, slotStartTime);
  });
}, [isStay, selectedDate, availableTimeSlotsForSelectedDate]);

const selectedSlotPassed = useMemo(() => {
  if (isStay || !selectedDate || !selectedTimeSlot) return false;
  if (isPastDate(selectedDate)) return true;

  const bookingTime = selectedDateAvailability?.start_time || selectedTimeSlotData?.startTime;
  if (!bookingTime) return false;

  return isPastTime(selectedDate, bookingTime);
}, [isStay, selectedDate, selectedTimeSlot, selectedDateAvailability, selectedTimeSlotData]);

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

const stayItems = [
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
];

// Room item for both types:
// - Room-based (!isPropertyBased): static info synced with cards
// - Property-based (isPropertyBased): simple static label "Full Property"
const rooms = listing?.rooms || listing?.roomTypes || listing?.room_types || listing?.stay?.rooms || listing?.stayDetails?.rooms || [];
const selRoom = staySelectedRoomType
  ? rooms.find(r => String(r.roomId ?? r.id ?? r.roomTypeId ?? r.code) === String(staySelectedRoomType))
  : null;

const MEAL_LABELS = { EP: "Room Only", BB: "Bed & Breakfast", CP: "+ Breakfast", MAP: "Half Board", AP: "Full Board" };
const mealLabel = selectedMealPlanCode ? (MEAL_LABELS[selectedMealPlanCode] || selectedMealPlanCode) : "";

stayItems.push({
  title: isPropertyBased
    ? "Full Property"
    : (selRoom ? `${selRoom.roomName || selRoom.name || "Room"}${mealLabel ? ` · ${mealLabel}` : ""}` : "Select from cards below"),
  category: "Room",
  icon: "home",
});

const items = isStay
  ? stayItems
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
    if (pricingType === "Individual") {
      // For Individual pricing, toggle selection and initialize quantity to 1
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
      // For Group pricing, simple toggle (fixed price)
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

const lowestRoomPrice = useMemo(() => {
  if (!isStay || !listing) return null;
  const rooms = listing.rooms || listing.roomTypes || listing.room_types || listing.stay?.rooms || listing.stayDetails?.rooms || [];
  if (!Array.isArray(rooms) || rooms.length === 0) return null;

  // Determine if the check-in date falls within any seasonal period
  const checkIn = selectedDate ? selectedDate.format("YYYY-MM-DD") : null;
  const activeSeason = (checkIn && listing?.seasonalPeriods)
    ? listing.seasonalPeriods.find(p =>
      moment(checkIn).isSameOrAfter(p.startDate) && moment(checkIn).isSameOrBefore(p.endDate)
    )
    : null;

  let minB2cMealPrice = Infinity;
  let minGeneralB2cPrice = Infinity;

  rooms.forEach((room) => {
    // 1. Check nested mealPlanPricing
    if (room.mealPlanPricing && typeof room.mealPlanPricing === 'object') {
      Object.values(room.mealPlanPricing).forEach((plan) => {
        if (plan) {
          let val = 0;
          if (activeSeason && plan?.hikePrice && parseFloat(plan.hikePrice) > 0) {
            val = parseFloat(plan.hikePrice);
          } else {
            val = parseFloat(plan.b2cPrice || plan.price || plan.amount || 0);
          }
          if (!isNaN(val) && val > 0 && val < minB2cMealPrice) {
            minB2cMealPrice = val;
          }
        }
      });
    }

    // 2. Flat meal plan b2c prices (Legacy fields - usually don't have hikePrice equivalent here)
    const mealPrices = [room.cpPrice, room.mapPrice, room.apPrice, room.cp_price, room.map_price, room.ap_price];
    mealPrices.forEach((p) => {
      const val = parseFloat(p);
      if (!isNaN(val) && val > 0 && val < minB2cMealPrice) {
        minB2cMealPrice = val;
      }
    });

    // 3. General b2cPrice
    const generalB2cPrices = [room.b2cPrice, room.b2c_price, room.price, room.amount];
    generalB2cPrices.forEach((p) => {
      const val = parseFloat(p);
      if (!isNaN(val) && val > 0 && val < minGeneralB2cPrice) {
        minGeneralB2cPrice = val;
      }
    });
  });

  const finalPrice = minB2cMealPrice !== Infinity ? minB2cMealPrice : (minGeneralB2cPrice !== Infinity ? minGeneralB2cPrice : null);

  if (finalPrice !== null || rooms.length > 0) {
    console.log(`📊 API Pricing Debug [Listing: ${listing?.id || listing?.stayId || 'unknown'}]:`, {
      isStay,
      foundRoomsCount: rooms.length,
      isSeasonal: !!activeSeason,
      minB2cMealPrice: minB2cMealPrice === Infinity ? 'N/A' : minB2cMealPrice,
      minGeneralB2cPrice: minGeneralB2cPrice === Infinity ? 'N/A' : minGeneralB2cPrice,
      selectedLowestB2cPrice: finalPrice,
    });
  }

  return finalPrice;
}, [listing, isStay, selectedDate]);

  const { addOnsTotal, finalTotal, receipt, priceInfo, pricingBreakdown } = useMemo(() => {
    // Determine guest counts early so individual-priced addons can be multiplied per guest
    const guestCount = getGuestCount(guests);
    const billableGuestCount = getBillableGuestCount(guests);

    // Calculate addons price based on pricing type
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      // Find addon from listing data
      const listingAddon = listing?.addons?.find(
        (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
      );

      if (listingAddon) {
        const price = parseFloat(listingAddon.addon?.price || 0);
        const pricingType = listingAddon.addon?.pricingType || "Individual";
        const quantity = pricingType === "Individual" ? (addOnQuantities[id] || 1) : 1;
        return sum + (price * quantity);
      }

      // No fallback - only use API addons
      return sum;
    }, 0);

    // Total guests drive slot capacity; billable guests drive experience pricing.
    // Use availability data if available, then selected slot, then fallback to listing data
    let pricePerPerson = selectedDateAvailability?.price_per_person
      ? parseFloat(selectedDateAvailability.price_per_person)
      : (selectedTimeSlotData?.pricePerPerson
        ? parseFloat(selectedTimeSlotData.pricePerPerson)
        : (listing?.timeSlots?.[0]?.pricePerPerson
          ? parseFloat(listing.timeSlots[0].pricePerPerson)
          : null));

    // Handle group pricing: override if guestCount falls in a defined range
    const groupPricing = selectedDateAvailability?.group_booking_pricing ||
      selectedTimeSlotData?.groupBookingPricing;
    if (groupPricing && Array.isArray(groupPricing) && groupPricing.length > 0) {
      const match = groupPricing.find(p =>
        guestCount >= (p.group_count_from || p.groupCountFrom || 0) &&
        guestCount <= (p.group_count_upto || p.groupCountUpto || Infinity)
      );
      if (match && (match.price_per_person || match.pricePerPerson)) {
        pricePerPerson = parseFloat(match.price_per_person || match.pricePerPerson);
      }
    }

    // For stays: calculate actual nights between check-in and check-out
    const nightsCount = (isStay && selectedDate && selectedEndDate)
      ? Math.max(1, moment(selectedEndDate).diff(moment(selectedDate), 'days'))
      : 1;

    // For room-based stays: determine how many rooms are needed based on guest count
    // Priority: 1. Manual selection (externalRoomsCount), 2. Automatic calculation
    let roomsNeeded = externalRoomsCount || 1;
    if (isStay && !isPropertyBased && staySelectedRoomType && !externalRoomsCount) {
      const rooms = listing.rooms || listing.roomTypes || listing.room_types || listing.stay?.rooms || [];
      const selectedRoomObj = rooms.find(r =>
        String(r.roomId ?? r.room_id ?? r.roomTypeId ?? r.id ?? r.code) === String(staySelectedRoomType)
      );
      if (selectedRoomObj) {
        const roomCap = Number(
          selectedRoomObj.maxGuests ?? selectedRoomObj.max_guests ??
          ((selectedRoomObj.maxAdults || 0) + (selectedRoomObj.maxChildren || 0)) ?? 2
        ) || 2;
        if (guestCount > roomCap) {
          roomsNeeded = Math.ceil(guestCount / roomCap);
        }
      }
    }

    // pricePerNight: use B2C price only (never b2bPrice for customer display)
    // Priority: selected room's mealPlanPricing b2cPrice > lowestRoomPrice (b2c) > property b2cPrice
    let pricePerNight;
    if (isStay && isPropertyBased) {
      const stayProp = listing?.stay || listing;
      const basePrice = parseFloat(stayProp?.fullPropertyB2cPrice || stayProp?.b2cPrice || 0);
      
      const maxAdults = parseInt(stayProp?.maxAdults || 0);
      const maxChildren = parseInt(stayProp?.maxChildren || 0);
      
      const extraAdults = Math.max(0, (guests?.adults || 0) - maxAdults);
      const extraChildren = Math.max(0, (guests?.children || 0) - maxChildren);
      
      const extraAdultPrice = parseFloat(stayProp?.extraAdultPrice || 0);
      const extraChildPrice = parseFloat(stayProp?.extraChildPrice || 0);
      
      pricePerNight = basePrice + (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);
    } else if (isStay && staySelectedRoomType) {
      // Find selected room and get its b2cPrice from mealPlanPricing
      const rooms = listing.rooms || listing.roomTypes || listing.room_types || listing.stay?.rooms || [];
      const selRoom = rooms.find(r =>
        String(r.roomId ?? r.room_id ?? r.roomTypeId ?? r.id ?? r.code) === String(staySelectedRoomType)
      );
      if (selRoom?.mealPlanPricing) {
        // Determine if the check-in date falls within any seasonal period
        const checkIn = selectedDate ? selectedDate.format("YYYY-MM-DD") : null;
        const activeSeason = (checkIn && listing?.seasonalPeriods)
          ? listing.seasonalPeriods.find(p =>
            moment(checkIn).isSameOrAfter(p.startDate) && moment(checkIn).isSameOrBefore(p.endDate)
          )
          : null;

        // Use selected meal plan if available, else fall back to lowest
        const planKey = selectedMealPlanCode && selRoom.mealPlanPricing[selectedMealPlanCode]
          ? selectedMealPlanCode
          : null;

        if (planKey) {
          const plan = selRoom.mealPlanPricing[planKey];
          if (activeSeason && plan?.hikePrice && parseFloat(plan.hikePrice) > 0) {
            pricePerNight = parseFloat(plan.hikePrice);
          } else {
            pricePerNight = parseFloat(plan?.b2cPrice || plan?.price || 0);
          }
        } else {
          const plans = Object.values(selRoom.mealPlanPricing);
          pricePerNight = plans.reduce((best, plan) => {
            let val = 0;
            if (activeSeason && plan?.hikePrice && parseFloat(plan.hikePrice) > 0) {
              val = parseFloat(plan.hikePrice);
            } else {
              val = parseFloat(plan?.b2cPrice || plan?.price || 0);
            }
            return val > 0 && (best === 0 || val < best) ? val : best;
          }, 0);
        }
      }
      pricePerNight = pricePerNight || lowestRoomPrice || 0;
    } else if (isStay) {
      pricePerNight = lowestRoomPrice || 0;
    } else {
      pricePerNight = selectedDateAvailability?.b2b_rate
        ? parseFloat(selectedDateAvailability.b2b_rate)
        : (selectedTimeSlotData?.b2bRate
          ? parseFloat(selectedTimeSlotData.b2bRate)
          : (listing?.timeSlots?.[0]?.b2bRate ? parseFloat(listing.timeSlots[0].b2bRate) : 0));
    }
    const currency = listing?.currency || "INR";

    const experiencePricingType = listing?.pricingType || (pricePerPerson ? "Individual" : "Group");
    const allowChildPricing = Boolean(listing?.allowChildPricing || listing?.childPricingAllowed);
    const childPricePerChild = parseFloat(listing?.childPricePerChild || listing?.childPrice || 0);

    let basePriceAmount;
    let priceDescription;

    if (!isStay) {
      if (experiencePricingType === "Group") {
        // Group Pricing: Fixed price applied once
        basePriceAmount = pricePerNight * nightsCount;
        priceDescription = `${currency} ${pricePerNight.toFixed(2)}${nightsCount > 1 ? ` x ${nightsCount} nights` : ""}`;
      } else {
        // Individual Pricing: Price per person x total guest count
        if (allowChildPricing && guests.children > 0) {
          const adultsCount = guests.adults || 0;
          const childrenCount = guests.children || 0;
          const infantsCount = guests.infants || 0;

          const adultsTotal = pricePerPerson * adultsCount * nightsCount;
          const childrenTotal = childPricePerChild * childrenCount * nightsCount;
          basePriceAmount = adultsTotal + childrenTotal;

          const adultDesc = `${adultsCount} ${adultsCount === 1 ? "Adult" : "Adults"} x ${currency} ${pricePerPerson.toFixed(2)}`;
          const childDesc = `${childrenCount} ${childrenCount === 1 ? "Child" : "Children"} x ${currency} ${childPricePerChild.toFixed(2)}`;
          const nightDesc = nightsCount > 1 ? ` x ${nightsCount} nights` : "";

          priceDescription = `${adultDesc}, ${childDesc}${nightDesc}`;
        } else {
          basePriceAmount = pricePerPerson * billableGuestCount * nightsCount;
          priceDescription = `${currency} ${pricePerPerson.toFixed(2)} x ${billableGuestCount} ${billableGuestCount === 1 ? "guest" : "guests"}${nightsCount > 1 ? ` x ${nightsCount} nights` : ""}`;
        }
      }
    } else {
      // Stay: Price per room per night × nights × rooms
      basePriceAmount = pricePerNight * nightsCount * roomsNeeded;
      const roomStr = roomsNeeded > 1 ? ` × ${roomsNeeded} room${roomsNeeded > 1 ? 's' : ''}` : '';
      const nightStr = nightsCount > 1 ? ` × ${nightsCount} nights` : '';
      const MEAL_LABELS = { EP: "Room Only", BB: "Bed & Breakfast", CP: "+ Breakfast", MAP: "Half Board", AP: "Full Board" };
      const mealDesc = selectedMealPlanCode ? ` (${MEAL_LABELS[selectedMealPlanCode] || selectedMealPlanCode})` : "";
      priceDescription = `${currency} ${pricePerNight.toFixed(2)}${mealDesc}${nightStr}${roomStr}`;
    }

    const subtotal = basePriceAmount + addOnsPrice;

    // Check for API-level discount first, then fall back to billingConfig if needed
    const apiDiscountPercentage = parseFloat(
      listing?.pricing?.discount?.total ||
      listing?.pricing?.discount?.percentage ||
      0
    );
    const discountPercentage = apiDiscountPercentage || 0;

    const discountAmount = (subtotal * discountPercentage) / 100;
    const taxableAmount = Math.max(subtotal - discountAmount, 0);

    const receiptData = [];

    if (!isStay && allowChildPricing && (guests.children > 0 || guests.infants > 0)) {
      const adultsCount = guests.adults || 0;
      const childrenCount = guests.children || 0;
      const infantsCount = guests.infants || 0;
      const nightStr = nightsCount > 1 ? ` x ${nightsCount} nights` : "";

      if (adultsCount > 0) {
        receiptData.push({
          title: `${adultsCount} ${adultsCount === 1 ? "Adult" : "Adults"} x ${currency} ${pricePerPerson.toFixed(2)}${nightStr}`,
          content: `${currency} ${(pricePerPerson * adultsCount * nightsCount).toFixed(2)}`,
          kind: "base",
          showInCheckout: true,
        });
      }

      if (childrenCount > 0) {
        receiptData.push({
          title: `${childrenCount} ${childrenCount === 1 ? "Child" : "Children"} x ${currency} ${childPricePerChild.toFixed(2)}${nightStr}`,
          content: `${currency} ${(childPricePerChild * childrenCount * nightsCount).toFixed(2)}`,
          kind: "base",
          showInCheckout: true,
        });
      }

      if (infantsCount > 0) {
        receiptData.push({
          title: `${infantsCount} ${infantsCount === 1 ? "Infant" : "Infants"} (Free)${nightStr}`,
          content: `${currency} 0.00`,
          kind: "base",
          showInCheckout: true,
        });
      }
    } else {
      receiptData.push({
        title: priceDescription,
        content: `${currency} ${basePriceAmount.toFixed(2)}`,
        kind: "base",
        showInCheckout: true,
      });
    }

    // Add individual addon entries
    if (selectedAddOns.length > 0) {
      const billableGuestCountForReceipt = getBillableGuestCount(guests);
      selectedAddOns.forEach((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );

        if (listingAddon) {
          const price = parseFloat(listingAddon.addon?.price || 0);
          const pricingType = listingAddon.addon?.pricingType || "Individual";
          const quantity = pricingType === "Individual" ? (addOnQuantities[id] || 1) : 1;
          const addonTotal = price * quantity;
          const addonTitle = listingAddon.addon?.title || "Add-on";

          if (pricingType === "Group") {
            receiptData.push({
              title: `${addonTitle} × ${quantity}`,
              content: `${currency} ${addonTotal.toFixed(2)}`,
              kind: "addon",
              showInCheckout: false,
            });
          } else {
            receiptData.push({
              title: addonTitle,
              content: `${currency} ${addonTotal.toFixed(2)}`,
              kind: "addon",
              showInCheckout: false,
            });
          }
        }
        // No fallback - only use API addons
      });
    }

    if (discountAmount > 0) {
      receiptData.push({
        title: `Discount (${discountPercentage.toFixed(0)}%)`,
        content: `- ${currency} ${discountAmount.toFixed(2)}`,
        kind: "discount",
        showInCheckout: false,
      });
    }

    // Calculate and add guest taxes
    let totalTaxAmount = 0;
    let apiTaxPercentage = 0;

    // Prioritize granular taxes from billingConfig (these are typically guest-facing)
    const enabledBillingTaxes = billingConfig?.taxes?.filter(tax => tax.isEnabled) || [];
    
    if (enabledBillingTaxes.length > 0) {
      enabledBillingTaxes.forEach(tax => {
        const taxRate = parseFloat(tax.currentRate || 0);
        const taxAmount = (taxableAmount * taxRate) / 100;
        totalTaxAmount += taxAmount;
        apiTaxPercentage += taxRate;
        receiptData.push({
          title: `${tax.name} (${taxRate}%)`,
          content: `${currency} ${taxAmount.toFixed(2)}`,
          kind: "tax",
          showInCheckout: true,
        });
      });
    } else {
      // Fallback to listing-level customer tax or total tax
      apiTaxPercentage = parseFloat(listing?.pricing?.tax?.customer || listing?.pricing?.tax?.total || 0);
      if (apiTaxPercentage > 0) {
        const taxAmount = (taxableAmount * apiTaxPercentage) / 100;
        totalTaxAmount = taxAmount;
        receiptData.push({
          title: `Tax (${apiTaxPercentage}%)`,
          content: `${currency} ${taxAmount.toFixed(2)}`,
          kind: "tax",
          showInCheckout: true,
        });
      }
    }

    // Calculate Platform Commission (Service fee)
    // Note: Per requirement, service fee (commission) is deducted from host earnings,
    // and should not be added to the final guest price.
    let pricingPlatformCommission = 0;
    const apiCommissionPercentage = parseFloat(listing?.pricing?.commission || 0);

    if (apiCommissionPercentage > 0) {
      pricingPlatformCommission = (subtotal * apiCommissionPercentage) / 100;
      // We calculate it for host earnings logic, but don't show it to the guest as an addition
    } else if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
      const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
      if (platformFee) {
        pricingPlatformCommission = (subtotal * parseFloat(platformFee.currentRate || 0)) / 100;
      }
    }

    // Guest pays subtotal - discount + guest taxes.
    const total = taxableAmount + totalTaxAmount;

    receiptData.push({
      title: "Total",
      content: `${currency} ${total.toFixed(2)}`,
      kind: "total",
      showInCheckout: true,
    });

    const displayPriceValue = pricePerPerson || pricePerNight;
    const priceActualText = `${currency} ${displayPriceValue.toFixed(2)}`;
    const priceTimeUnit = pricePerPerson ? "person" : "night";

    return {
      addOnsTotal: addOnsPrice,
      finalTotal: total,
      receipt: receiptData,
      priceInfo: {
        priceActual: priceActualText,
        time: priceTimeUnit,
        total: total,
      },
      pricingBreakdown: {
        currency,
        basePrice: basePriceAmount,
        addonsTotal: addOnsPrice,
        subtotal,
        discountPercentage,
        discount: discountAmount,
        tax: totalTaxAmount,
        taxRate: apiTaxPercentage || 0,
        commission: 0, // Commission is deducted from host, not charged to guest
        commissionRate: 0,
        pricePerPerson: pricePerPerson,
        adultsCount: (guests.adults || 0),
        childrenCount: (guests.children || 0),
        allowChildPricing,
        childPricePerChild,
        total,
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddOns, addOnQuantities, guests, listing, billingConfig, selectedDateAvailability, lowestRoomPrice, selectedTimeSlotData, isStay, isPropertyBased, staySelectedRoomType, selectedMealPlanCode, selectedDate, selectedEndDate, externalRoomsCount]);

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
            quantity: listingAddon.addon?.pricingType === "Individual" ? (addOnQuantities[id] || 1) : 1,
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

    // Derive stay-specific summary fields
    const selectedRoomLabel = staySelectedRoomType
      ? (stayRoomTypeOptions.find((o) => o.value === staySelectedRoomType)?.label || staySelectedRoomType)
      : "";

    // Derive mealPlanCode for the selected room (same logic as handleBookStay)
    const selectedRoomId = Number(staySelectedRoomType) || 0;
    const stayRooms = listing?.rooms || listing?.roomTypes || listing?.room_types || listing?.stay?.rooms || [];
    const selectedRoomObj = stayRooms.find(r =>
      (r.roomId ?? r.room_id ?? r.roomTypeId ?? r.id) === selectedRoomId
    );
    let stayMealPlanCode = "EP";
    if (selectedRoomObj) {
      if (selectedRoomObj.mealPlanPricing && typeof selectedRoomObj.mealPlanPricing === "object") {
        const plans = Object.keys(selectedRoomObj.mealPlanPricing);
        if (plans.length > 0) stayMealPlanCode = plans[0];
      } else if (selectedRoomObj.cpPrice) stayMealPlanCode = "CP";
      else if (selectedRoomObj.mapPrice) stayMealPlanCode = "MAP";
      else if (selectedRoomObj.apPrice) stayMealPlanCode = "AP";
    }

    const mealPlanLabels = { EP: "EP (Room Only)", CP: "CP (Breakfast)", BB: "BB (Bed & Breakfast)", MAP: "MAP (Half Board)", AP: "AP (Full Board)" };

    // Calculate roomsNeeded for the selected room
    // Priority: 1. Manual selection (externalRoomsCount), 2. Automatic calculation
    let stayRoomsNeeded = externalRoomsCount || 1;
    const stayGuestCount = getGuestCount(guests);
    if (selectedRoomObj && !externalRoomsCount) {
      const cap = Number(
        selectedRoomObj.maxGuests ??
        ((selectedRoomObj.maxAdults || 0) + (selectedRoomObj.maxChildren || 0))
      ) || 2;
      if (stayGuestCount > cap) stayRoomsNeeded = Math.ceil(stayGuestCount / cap);
    }

    // Get room image (prefer room photo, fall back to listing image)
    const roomImage = selectedRoomObj?.photoUrl ||
      selectedRoomObj?.imageUrl ||
      selectedRoomObj?.coverPhotoUrl ||
      (Array.isArray(selectedRoomObj?.images) ? selectedRoomObj.images[0]?.url : null) ||
      null;

    const bookingData = {
      stayId: isStay ? (listing?.stayId || listing?.stay_id || listing?.id) : null,
      listingId: listing?.listingId || listing?.id,
      listingTitle: listing?.title || listing?.name || listing?.listingTitle || "",
      listingImage: getFirstListingImage(),
      roomImage: roomImage || getFirstListingImage(),
      hostName: (hostData?.firstName ? `${hostData?.firstName} ${hostData?.lastName || ""}`.trim() : hostData?.name) ||
        (listing?.host?.firstName ? `${listing?.host?.firstName} ${listing?.host?.lastName || ""}`.trim() : listing?.host?.name) || "Host",
      hostAvatar: hostData?.profilePhotoUrl || hostData?.avatar || hostData?.profileImage || hostData?.image ||
        listing?.host?.profilePhotoUrl || listing?.host?.picture || listing?.host?.avatar || "/images/content/avatar.jpg",
      selectedDate: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      selectedTimeSlot: selectedTimeSlot,
      guests: guests,
      selectedAddOns: selectedAddOnsData,
      addOnQuantities: addOnQuantities,
      receipt: receipt,
      finalTotal: finalTotal,
      pricing: pricingBreakdown,
      // extra fields to help checkout display
      bookingSummary: {
        date: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
        time: summaryBookingTime,
        endTime: summaryEndTime,
        slotId: summarySlotId,
        guestCount: stayGuestCount,
        billableGuestCount: isStay ? stayGuestCount : getBillableGuestCount(guests),
      },
      // Stay-specific fields for "Your trip" section
      isStay,
      checkInDate: isStay && selectedDate ? selectedDate.format("MMM DD, YYYY") : null,
      checkOutDate: isStay && selectedEndDate ? selectedEndDate.format("MMM DD, YYYY") : null,
      roomType: selectedRoomLabel || null,
      roomsBooked: isStay && !isPropertyBased ? stayRoomsNeeded : null,
      mealPlan: staySelectedRoomType ? (mealPlanLabels[stayMealPlanCode] || stayMealPlanCode) : null,
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
              quantity: listingAddon.addon?.pricingType === "Individual" ? (addOnQuantities[id] || 1) : 1,
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
    const guestCount = getGuestCount(guests);
    const hasGuests = isStay ? guestCount > 0 : hasSelectedGuests && guestCount > 0;

    // Check if requested guests exceed available capacity
    // Use selectedDateAvailability (which now always has a value if a date/slot is picked)
    const hasCapacity = selectedDateAvailability
      ? (selectedDateAvailability.available_seats !== undefined ? guestCount <= selectedDateAvailability.available_seats : true)
      : true;

    return isStay ? (hasDate && hasCheckout && hasGuests) : (hasDate && hasTimeSlot && hasGuests && hasCapacity);
  }, [selectedDate, selectedEndDate, selectedTimeSlot, guests, isStay, selectedDateAvailability, hasSelectedGuests]);

  const handleReserveClick = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent reserve if selected slot has already passed or no future slots exist
    if (selectedSlotPassed) {
      alert("The selected time slot has already passed. Please choose another date or time.");
      return;
    }
    if (!hasFutureTimeSlots) {
      alert("No upcoming time slots are available for this experience.");
      return;
    }

    if (reserveSubmitLockRef.current) {
      return;
    }

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
    let success = false;
    try {
      reserveSubmitLockRef.current = true;
      setIsReserveSubmitting(true);

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
      // Get special requests (if any input field exists in future)
      const specialRequests = "";

      // Get listing ID
      const listingId = Number(listing?.listingId || listing?.id || 0);
      if (!listingId || listingId < 1) {
        alert("Invalid listing. Please reload the experience and try again.");
        return;
      }

      // Format booking date (YYYY-MM-DD)
      const bookingDate = selectedDate ? selectedDate.format("YYYY-MM-DD") : new Date().toISOString().split('T')[0];

      // Get booking time from availability or timeSlot
      let bookingTime = "00:00";
      if (selectedDateAvailability?.start_time) {
        bookingTime = selectedDateAvailability.start_time;
      } else if (selectedTimeSlotData?.startTime) {
        bookingTime = selectedTimeSlotData.startTime;
      }
      bookingTime = normalizeBookingTime(bookingTime);

      // Get booking slot ID
      const bookingSlotId = Number(
        selectedTimeSlotData?.slotId ||
        selectedTimeSlotData?.slot_id ||
        selectedTimeSlotData?.id ||
        0
      );

      // Total guests reserve capacity; billable guests drive pricing and payment.
      const numberOfGuests = getGuestCount(guests);
      const billableGuests = getBillableGuestCount(guests);

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
      const guestCountForPricing = billableGuests;
      let pricePerPerson = selectedDateAvailability?.price_per_person
        ? parseFloat(selectedDateAvailability.price_per_person)
        : (listing?.timeSlots?.[0]?.pricePerPerson
          ? parseFloat(listing.timeSlots[0].pricePerPerson)
          : null);

      // Re-apply Group Pricing match logic here
      const groupPricingRules = selectedDateAvailability?.group_booking_pricing ||
        selectedTimeSlotData?.groupBookingPricing;
      if (groupPricingRules && Array.isArray(groupPricingRules) && groupPricingRules.length > 0) {
        const totalGuests = getGuestCount(guests);
        const match = groupPricingRules.find(p =>
          totalGuests >= (p.group_count_from || p.groupCountFrom || 0) &&
          totalGuests <= (p.group_count_upto || p.groupCountUpto || Infinity)
        );
        if (match && (match.price_per_person || match.pricePerPerson)) {
          pricePerPerson = parseFloat(match.price_per_person || match.pricePerPerson);
        }
      }

      const pricePerNight = selectedDateAvailability?.b2b_rate
        ? parseFloat(selectedDateAvailability.b2b_rate)
        : (listing?.timeSlots?.[0]?.b2bRate
          ? parseFloat(listing.timeSlots[0].b2bRate)
          : 0);
      const nights = 1; // Default to 1 night

      let pricingBaseAmount = 0;
      const experiencePricingType = listing?.pricingType || (pricePerPerson ? "Individual" : "Group");
      const allowChildPricing = Boolean(listing?.allowChildPricing || listing?.childPricingAllowed);
      const childPricePerChild = parseFloat(listing?.childPricePerChild || listing?.childPrice || 0);

      if (experiencePricingType === "Group") {
        // Group Pricing: Fixed price
        pricingBaseAmount = pricePerNight * nights;
      } else if (pricePerPerson) {
        // Individual Pricing
        if (allowChildPricing && guests.children > 0) {
          const adultsTotal = pricePerPerson * (guests.adults || 0) * nights;
          const childrenTotal = childPricePerChild * (guests.children || 0) * nights;
          pricingBaseAmount = adultsTotal + childrenTotal;
        } else {
          pricingBaseAmount = pricePerPerson * guestCountForPricing * nights;
        }
      } else {
        // Fallback
        pricingBaseAmount = pricePerNight * nights;
      }

      // Calculate pricing values
      const pricingAddonsTotal = addOnsTotal || 0;
      const pricingSubtotal = pricingBaseAmount + pricingAddonsTotal;

      // Calculate platform commission (service fee)
      // Note: This is deducted from host earnings, not added to guest price.
      let pricingPlatformCommission = 0;
      const apiCommissionPercentage = parseFloat(listing?.pricing?.commission || 0);
      if (apiCommissionPercentage > 0) {
        pricingPlatformCommission = (pricingSubtotal * apiCommissionPercentage) / 100;
      } else if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
        const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
        if (platformFee) {
          pricingPlatformCommission = (pricingSubtotal * parseFloat(platformFee.currentRate || 0)) / 100;
        }
      }

      const apiDiscountPercentage = parseFloat(
        listing?.pricing?.discount?.total ||
        listing?.pricing?.discount?.percentage ||
        0
      );
      const pricingDiscountAmount = (pricingSubtotal * apiDiscountPercentage) / 100;
      const pricingTaxableAmount = Math.max(pricingSubtotal - pricingDiscountAmount, 0);

      // Calculate tax amount (guest portion)
      let pricingTaxAmount = 0;
      let calculatedTaxRate = 0;
      const enabledBillingTaxes = billingConfig?.taxes?.filter(tax => tax.isEnabled) || [];

      if (enabledBillingTaxes.length > 0) {
        enabledBillingTaxes.forEach(tax => {
          const taxRate = parseFloat(tax.currentRate || 0);
          pricingTaxAmount += (pricingTaxableAmount * taxRate) / 100;
          calculatedTaxRate += taxRate;
        });
      } else {
        const apiTaxPercentage = parseFloat(listing?.pricing?.tax?.customer || listing?.pricing?.tax?.total || 0);
        if (apiTaxPercentage > 0) {
          pricingTaxAmount = (pricingTaxableAmount * apiTaxPercentage) / 100;
          calculatedTaxRate = apiTaxPercentage;
        }
      }

      // Calculate total price (subtotal + taxes - discounts)
      // Note: Per requirement, platform commission (platformFee) is NOT added to the guest total price.
      const pricingTotal = pricingTaxableAmount + pricingTaxAmount;

      // Calculate host earnings (what the host receives: subtotal - platform commission)
      const calculatedHostEarnings = pricingSubtotal - pricingPlatformCommission;
      const hostEarnings = isNaN(calculatedHostEarnings) ? pricingSubtotal : calculatedHostEarnings;

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
          const quantity = pricingType === "Individual" ? (addOnQuantities[id] || 1) : 1;

          return {
            addonId: listingAddon.addon?.addonId ?? listingAddon.addonId ?? listingAddon.assignmentId,
            addonName: listingAddon.addon?.title || "Add-on",
            addonPrice: parseFloat(listingAddon.addon?.price || 0),
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

      if (!selectedTimeSlot || !bookingSlotId || bookingSlotId < 1) {
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
        bookingTime: bookingTime, // "HH:mm:ss"
        bookingSlotId: bookingSlotId || 0,
        guestCount: numberOfGuests,
        childCount: guests.children || 0,
        childPricePerChild: childPricePerChild || 0,
        customer: {
          name: customerName || "Guest User",
          email: customerEmail || "guest@example.com",
          phone: customerPhone || "+911234567890",
        },
        specialRequests: specialRequests || "",
        paymentMethod: "razorpay",
        addons: addonsArray,
        guestAnswers: guestAnswers,
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
        orderResponse?.id ||
        orderResponse?.data?.id ||
        orderResponse?.order?.id ||
        null;
      if (createdOrderId) {
        localStorage.setItem("pendingOrderId", String(createdOrderId));
        console.log("💾 Saved pending orderId:", createdOrderId);
      } else {
        localStorage.removeItem("pendingOrderId");
        console.warn("No orderId found on orderResponse; cleared pendingOrderId to avoid stale checkout data.");
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
      success = true;
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
    } finally {
      if (!success) {
        reserveSubmitLockRef.current = false;
        setIsReserveSubmitting(false);
      }
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
    if (reserveSubmitLockRef.current) {
      return;
    }

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
    // Get special requests (if any input field exists in future)
    const specialRequests = "";

    // Get listing ID
    const listingId = Number(bookingData.listingId || listing?.listingId || listing?.id || 0);
    if (!listingId || listingId < 1) {
      throw new Error("Invalid listing. Please reload the experience and try again.");
    }

    // Format booking date
    const bookingDate = bookingData.selectedDate ||
      (selectedDate ? selectedDate.format("YYYY-MM-DD") : new Date().toISOString().split('T')[0]);

    // Get booking time
    let bookingTime = "00:00";
    if (selectedDateAvailability?.start_time) {
      bookingTime = selectedDateAvailability.start_time;
    } else if (selectedTimeSlotData?.startTime) {
      bookingTime = selectedTimeSlotData.startTime;
    } else if (bookingData?.bookingSummary?.time) {
      bookingTime = bookingData.bookingSummary.time;
    }
    bookingTime = normalizeBookingTime(bookingTime);

    // Get booking slot ID
    const bookingSlotId = Number(
      selectedTimeSlotData?.slotId ||
      selectedTimeSlotData?.slot_id ||
      selectedTimeSlotData?.id ||
      bookingData?.bookingSummary?.slotId ||
      0
    );

    if (!bookingSlotId || bookingSlotId < 1) {
      throw new Error("Invalid booking slot. Please reselect the date and time slot.");
    }

    if (!bookingTime || bookingTime === "00:00") {
      throw new Error("Invalid booking time. Please reselect the date and time slot.");
    }

    // Get number of guests
    const billableGuests = bookingData.guests ?
      getBillableGuestCount(bookingData.guests) :
      getBillableGuestCount(guests);
    const totalGuestsForOrder =
      bookingData?.bookingSummary?.guestCount ||
      bookingData?.guests?.guests ||
      (bookingData?.guests ? (bookingData.guests.adults || 0) + (bookingData.guests.children || 0) : getGuestCount(guests));

    // Calculate base price amount
    const guestCount = billableGuests;
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
          addonName: addonData.title || addonData.addonName || "Add-on",
          addonPrice: addonPrice,
          quantity: quantity,
        });
      });
    }

    const pricingSubtotal = pricingBaseAmount + pricingAddonsTotal;

    // Calculate platform commission (service fee)
    // Note: Deducted from host earnings, not added to guest price.
    let pricingPlatformCommission = 0;
    const apiCommissionPercentage = parseFloat(listing?.pricing?.commission || 0);
    if (apiCommissionPercentage > 0) {
      pricingPlatformCommission = (pricingSubtotal * apiCommissionPercentage) / 100;
    } else if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
      const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
      if (platformFee) {
        pricingPlatformCommission = (pricingSubtotal * parseFloat(platformFee.currentRate || 0)) / 100;
      }
    }

    const pricingDiscountAmount = (pricingSubtotal * (parseFloat(
      listing?.pricing?.discount?.total ||
      listing?.pricing?.discount?.percentage ||
      0
    ) || 0)) / 100;
    const pricingTaxableAmount = Math.max(pricingSubtotal - pricingDiscountAmount, 0);

    // Calculate tax amount (prioritize guest portion from billingConfig)
    let pricingTaxAmount = 0;
    let calculatedTaxRate = 0;
    const enabledBillingTaxes = billingConfig?.taxes?.filter(tax => tax.isEnabled) || [];

    if (enabledBillingTaxes.length > 0) {
      enabledBillingTaxes.forEach(tax => {
        const taxRate = parseFloat(tax.currentRate || 0);
        pricingTaxAmount += (pricingTaxableAmount * taxRate) / 100;
        calculatedTaxRate += taxRate;
      });
    } else {
      const apiTaxPercentage = parseFloat(listing?.pricing?.tax?.customer || listing?.pricing?.tax?.total || 0);
      if (apiTaxPercentage > 0) {
        pricingTaxAmount = (pricingTaxableAmount * apiTaxPercentage) / 100;
        calculatedTaxRate = apiTaxPercentage;
      }
    }

    // Calculate total price (subtotal + taxes - discounts, excluding platform commission)
    const pricingTotal = pricingTaxableAmount + pricingTaxAmount;

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
      bookingTime: bookingTime, // "HH:mm:ss"
      bookingSlotId: bookingSlotId || 0,
      guestCount: totalGuestsForOrder,
      childCount: bookingData.guests?.children || 0,
      childPricePerChild: bookingData.pricing?.childPricePerChild || listing?.childPricePerChild || listing?.childPrice || 0,
      customer: {
        name: customerName || "Guest User",
        email: customerEmail || "guest@example.com",
        phone: customerPhone || "+911234567890",
      },
      specialRequests: specialRequests || "",
      paymentMethod: "razorpay",
      addons: addonsArray,
      guestAnswers: guestAnswers,
    };

    console.log("📦 Creating order after login:", orderData);

    reserveSubmitLockRef.current = true;
    setIsReserveSubmitting(true);

    // Create the order
    const orderResponse = await createOrder(orderData);
    console.log("✅ Order created:", orderResponse);

    const createdOrderId = orderResponse?.orderId ||
      orderResponse?.data?.orderId ||
      orderResponse?.order?.orderId ||
      orderResponse?.id ||
      orderResponse?.data?.id ||
      orderResponse?.order?.id ||
      null;
    if (createdOrderId) {
      localStorage.setItem("pendingOrderId", String(createdOrderId));
      console.log("💾 Saved pending orderId:", createdOrderId);
    } else {
      localStorage.removeItem("pendingOrderId");
      console.warn("No orderId found on orderResponse; cleared pendingOrderId to avoid stale checkout data.");
    }

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
    reserveSubmitLockRef.current = false;
    setIsReserveSubmitting(false);
  };

  // Handle phone login callback (called after successful OTP verification)
  const handlePhoneLogin = async (phoneNumber, response) => {
    console.log("Phone login successful:", phoneNumber, response);
    // JWT token and user info are already stored in localStorage by LoginModal
    // Now create the order if we have pending booking data
    try {
      await createOrderFromPendingBooking();
    } catch (error) {
      reserveSubmitLockRef.current = false;
      setIsReserveSubmitting(false);
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
            reserveSubmitLockRef.current = false;
            setIsReserveSubmitting(false);
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
    if (index === 0 || (isStay && index === 1)) {
      if (isStay) {
        setStayActiveDateField(index === 1 ? "checkout" : "checkin");
      }
      setShowDatePicker(true);
      setShowTimeSlots(false);
      setShowGuestPicker(false);
    }
    else if (index === 1) {
      setShowTimeSlots(true);
      setShowDatePicker(false);
      setShowGuestPicker(false);
    }
    else if (index === 2) {
      if (!isStay && (!selectedDate || !selectedTimeSlot)) {
        return;
      }
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
    if (!isStay) {
      setHasSelectedGuests(false);
      setShowGuestPicker(false);
    }
    setShowDatePicker(false);
  };

  const handleTimeSelect = (timeText) => {
    setSelectedTimeSlot(timeText);
    if (!isStay) {
      setHasSelectedGuests(false);
      setShowGuestPicker(false);
    }
    setShowTimeSlots(false);
  };

  // Get maxSeats from available_seats for selected date/slot, fallback to timeSlot capacity, then listing maxGuests
  // Note: available_seats is the actual available seats for the selected date and slot (can be less than max_seats)
  const maxSeats = useMemo(() => {
    // Priority 1: Use available_seats (can be less than max_seats)
    if (selectedDateAvailability?.available_seats !== undefined) {
      return selectedDateAvailability.available_seats;
    }
    // Priority 2: Use max_seats as fallback
    if (selectedDateAvailability?.max_seats !== undefined) {
      return selectedDateAvailability.max_seats;
    }
    // Priority 3: Use maxSeats from selected timeSlot
    if (selectedTimeSlotData?.maxSeats !== undefined && selectedTimeSlotData?.maxSeats > 0) {
      return selectedTimeSlotData.maxSeats;
    }
    // Priority 4: Fallback to listing maxGuests
    return listing?.maxGuests || undefined;
  }, [selectedDateAvailability, selectedTimeSlotData, listing?.maxGuests]);

  const isFullyBooked = useMemo(() => {
    if (isStay) return false;
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

        // Extract slots array from response and filter by is_active status
        const slots = (slotsResponse?.slots || []).filter(slot => {
          // If is_active is explicitly false, hide it. 
          // Treat undefined or true as active.
          return slot.is_active !== false && slot.isActive !== false;
        });
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

  const displayPrice = React.useMemo(() => {
    let price = 0;
    if (isPropertyBased) {
      // Property-based stay: fullPropertyB2cPrice may be directly on listing OR under listing.stay
      price = parseFloat(
        listing?.fullPropertyB2cPrice ||
        listing?.stay?.fullPropertyB2cPrice ||
        listing?.stay?.b2cPrice ||
        listing?.stay?.startingPrice ||
        listing?.stay?.pricePerNight ||
        listing?.stay?.price || 0
      );
    } else if (isStay) {
      // Room-based stay: show the lowest room B2C price ("starting from")
      price = lowestRoomPrice || parseFloat(listing?.stay?.startingPrice || listing?.stay?.pricePerNight || listing?.stay?.b2cPrice || 0);
    } else {
      price = parseFloat(listing?.b2cPrice || listing?.price || 0);
      // Fallback: Check slots data for pricing if experience level price is missing
      if (!price && slotsData && slotsData.length > 0) {
        const firstSlotPrice = slotsData[0]?.pricing?.price_per_person || slotsData[0]?.pricing?.b2b_rate;
        if (firstSlotPrice) {
          price = parseFloat(firstSlotPrice);
        }
      }
    }
    const currency = listing?.stay?.currency || listing?.currency || "INR";
    return price > 0 ? `${currency} ${price.toFixed(2)}` : "";
  }, [listing, isStay, isPropertyBased, slotsData, lowestRoomPrice]);

  const handleCheckStayAvailability = async () => {
    try {
      if (!isStay || isPropertyBased) return;
      const stayId = listing?.stayId || listing?.stay_id || listing?.id;
      if (!stayId) return;
      if (!selectedDate || !selectedEndDate) return;

      // Validate guest count against room capacities before checking availability
      if (stayRoomTypeOptions.length === 0) {
        alert("No room with the guest availability.");
        return;
      }

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

  const handleBookStay = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isStay) return;

    // Save booking data first
    saveBookingData();

    // Check if user is logged in
    if (!isLoggedIn()) {
      setShowLoginModal(true);
      return;
    }

    try {
      setStayAvailabilityLoading(true);

      const stayId = listing?.stayId || listing?.stay_id || listing?.id;
      const checkInDate = selectedDate.format("YYYY-MM-DD");
      const checkOutDate = selectedEndDate.format("YYYY-MM-DD");
      const guestCount = getGuestCount(guests);

      // Map to the specific request body format for stay orders
      const selectedRoomId = Number(staySelectedRoomType) || 0;
      const rooms = listing.rooms || listing.roomTypes || listing.room_types || listing.stay?.rooms || [];
      const selectedRoomObject = rooms.find(r =>
        (r.roomId ?? r.room_id ?? r.roomTypeId ?? r.room_type_id ?? r.id) === selectedRoomId
      );

      let mealPlanCode = "EP"; // Default to European Plan
      if (selectedRoomObject) {
        if (selectedRoomObject.mealPlanPricing && typeof selectedRoomObject.mealPlanPricing === 'object') {
          const plans = Object.keys(selectedRoomObject.mealPlanPricing);
          if (plans.length > 0) mealPlanCode = plans[0];
        } else if (selectedRoomObject.cpPrice || selectedRoomObject.cp_price) {
          mealPlanCode = "CP";
        } else if (selectedRoomObject.mapPrice || selectedRoomObject.map_price) {
          mealPlanCode = "MAP";
        } else if (selectedRoomObject.apPrice || selectedRoomObject.ap_price) {
          mealPlanCode = "AP";
        }
      }

      let calculatedAmount = 0;
      let roomsNeeded = 1; // default to 1 room

      if (selectedRoomObject && staySelectedRoomType) {
        let basePrice = 0;
        let extraAdultPrice = parseFloat(selectedRoomObject.extraAdultPrice || listing?.stay?.extraAdultPrice || 0);
        let extraChildPrice = parseFloat(selectedRoomObject.extraChildPrice || listing?.stay?.extraChildPrice || 0);

        if (selectedRoomObject.mealPlanPricing && selectedRoomObject.mealPlanPricing[mealPlanCode]) {
          const mp = selectedRoomObject.mealPlanPricing[mealPlanCode];
          // Determine if the check-in date falls within any seasonal period
          const checkIn = selectedDate.format("YYYY-MM-DD");
          const activeSeason = listing?.seasonalPeriods?.find(p =>
            moment(checkIn).isSameOrAfter(p.startDate) && moment(checkIn).isSameOrBefore(p.endDate)
          );

          if (activeSeason && mp.hikePrice && parseFloat(mp.hikePrice) > 0) {
            basePrice = parseFloat(mp.hikePrice);
          } else {
            // Use b2cPrice ONLY — never fall back to b2bPrice for customer billing
            basePrice = parseFloat(mp.b2cPrice || mp.price || 0);
          }
          if (mp.extraAdultPrice) extraAdultPrice = parseFloat(mp.extraAdultPrice);
          if (mp.extraChildPrice) extraChildPrice = parseFloat(mp.extraChildPrice);
        } else {
          if (mealPlanCode === "BB" && Number(selectedRoomObject.bbPrice) > 0) basePrice = parseFloat(selectedRoomObject.bbPrice);
          else if (mealPlanCode === "CP" && Number(selectedRoomObject.cpPrice) > 0) basePrice = parseFloat(selectedRoomObject.cpPrice);
          else if (mealPlanCode === "MAP" && Number(selectedRoomObject.mapPrice) > 0) basePrice = parseFloat(selectedRoomObject.mapPrice);
          else if (mealPlanCode === "AP" && Number(selectedRoomObject.apPrice) > 0) basePrice = parseFloat(selectedRoomObject.apPrice);
          else if (mealPlanCode === "EP" && Number(selectedRoomObject.epPrice) > 0) basePrice = parseFloat(selectedRoomObject.epPrice);
          else basePrice = parseFloat(selectedRoomObject.b2cPrice || selectedRoomObject.price || 0);
        }
        // Compute how many rooms are needed for the guest count
        const roomCap = Number(
          selectedRoomObject.maxGuests ??
          ((selectedRoomObject.maxAdults || 0) + (selectedRoomObject.maxChildren || 0))
        ) || 2;
        if (guestCount > roomCap) {
          roomsNeeded = Math.ceil(guestCount / roomCap);
        }
        // Extra guest pricing (applies within a single room's capacity)
        const maxAdults = selectedRoomObject.maxAdults || listing?.stay?.maxAdults || 0;
        const maxChildren = selectedRoomObject.maxChildren || listing?.stay?.maxChildren || 0;
        const extraAdults = Math.max(0, (guests?.adults || 0) - maxAdults);
        const extraChildren = Math.max(0, (guests?.children || 0) - maxChildren);
        const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);

        const amountPerNight = basePrice + totalExtraPrice;
        const nightsCount = checkInDate && checkOutDate ? Math.max(1, moment(checkOutDate).diff(moment(checkInDate), "days")) : 1;
        // Multiply by roomsNeeded so total amount reflects all rooms booked
        calculatedAmount = amountPerNight * nightsCount * roomsNeeded;

        console.log("💰 Booking amount calc:", { basePrice, roomCap, guestCount, roomsNeeded, amountPerNight, nightsCount, calculatedAmount });
      }
      // Get customer info for the order
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName = userInfo.name ||
        (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") ||
        userInfo.customerName || "Guest User";
      const customerEmail = userInfo.email || userInfo.customerEmail || "guest@example.com";
      const customerPhone = userInfo.customerPhone ||
        (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") ||
        userInfo.phoneNumber ||
        userInfo.phone || "+911234567890";

      let orderData;

    if (staySelectedRoomType && selectedRoomId) {
      // Room-based stay: include rooms array with correct roomsBooked count
      orderData = {
        stayId: Number(stayId) || 0,
        checkInDate,
        checkOutDate,
        numberOfGuests: guestCount,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests: "",
        amount: calculatedAmount, // B2C price × nights × roomsNeeded
        paymentMethod: "razorpay",
        rooms: [
          {
            roomId: selectedRoomId,
            roomsBooked: roomsNeeded,  // ← correct: 1 or more based on guest count
            adults: guests.adults || 1,
            children: guests.children || 0,
            mealPlanCode: selectedMealPlanCode || mealPlanCode || "EP",
            extraBeds: 0,
          },
        ],
      };


    } else {
      // Property-based stay: strictly use fullPropertyB2cPrice + extra guest logic
      const stayProp = listing?.stay || listing;
      const basePrice = parseFloat(stayProp?.fullPropertyB2cPrice || stayProp?.b2cPrice || 0);

      const extraAdultPrice = parseFloat(stayProp?.extraAdultPrice || 0);
      const extraChildPrice = parseFloat(stayProp?.extraChildPrice || 0);

      const maxAdults = parseInt(stayProp?.maxAdults || 0);
      const maxChildren = parseInt(stayProp?.maxChildren || 0);

      const extraAdults = Math.max(0, (guests?.adults || 0) - maxAdults);
      const extraChildren = Math.max(0, (guests?.children || 0) - maxChildren);

      const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);
      const amountPerNight = basePrice + totalExtraPrice;
      const nightsCount = checkInDate && checkOutDate ? Math.max(1, moment(checkOutDate).diff(moment(checkInDate), "days")) : 1;
      calculatedAmount = amountPerNight * nightsCount;

      orderData = {
        stayId: Number(stayId) || 0,
        checkInDate,
        checkOutDate,
        numberOfGuests: guestCount,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests: "",
        amount: calculatedAmount,
        paymentMethod: "razorpay",
        rooms: [],
      };
    }

    console.log("📦 Creating stay order (updated schema):", orderData);
    const res = await createStayOrder(orderData);
    console.log("✅ Stay order created:", res);

    // Handle payment and redirect
    const paymentResponse = res?.payment || res?.data?.payment || res?.order?.payment || res;
    const rzpOrderId = paymentResponse?.razorpayOrderId || res?.razorpayOrderId || res?.order?.razorpayOrderId;
    const rzpKeyId = paymentResponse?.razorpayKeyId || res?.razorpayKeyId || res?.order?.razorpayKeyId || "rzp_test_RaBjdu0Ed3p1gN";

    // Always use our frontend-calculated amount (b2cPrice × nights × roomsNeeded).
    // The backend may add taxes/surcharges that inflate the Razorpay order amount —
    // we display our calculated total to keep it consistent with the receipt breakdown.
    const amountInPaise = Math.round(calculatedAmount * 100);
    // Keep backend Razorpay order id & key for the actual payment flow

    const currency = paymentResponse?.currency || res?.currency || res?.order?.currency || "INR";

    localStorage.setItem("pendingPayment", JSON.stringify({
      paymentMethod: "razorpay",
      razorpayOrderId: rzpOrderId,
      razorpayKeyId: rzpKeyId,
      amount: amountInPaise,
      currency: currency,
    }));

    history.push("/checkout");
  } catch (err) {
    console.error("❌ Stay booking failed:", err);
    alert(err.response?.data?.message || err.message || "Booking failed. Please try again.");
  } finally {
    setStayAvailabilityLoading(false);
  }
};

  const displayTime = isStay ? "night" : "person";

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
            onRoomSelect={onRoomSelect}
            selectedRoomId={staySelectedRoomType}
            roomsCount={externalRoomsCount}
            onRoomsCountChange={onRoomsCountChange}
          />
          {(!isFood && !isPlace) && (
            <Receipt
              className={styles.receipt}
              items={items}
              hostData={hostData}
              priceActual={displayPrice}
              time={displayTime}
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
                          visible={isStay ? (showDatePicker && stayActiveDateField === "checkout") : showDatePicker}
                          onClose={() => setShowDatePicker(false)}
                          onDateSelect={handleDateSelect}
                          selectedDate={selectedEndDate ? selectedEndDate.toDate().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null}
                          timeSlots={transformedTimeSlots.length > 0 ? transformedTimeSlots : (listing?.timeSlots || [])}
                          availabilityData={filteredAvailabilityData}
                        />
                      </div>
                    );
                  }

                  // Determine whether any time slots exist and are valid for the selected day
                  const availableTimeSlots = transformedTimeSlots.length > 0 ? transformedTimeSlots : (listing?.timeSlots || []);
                  // If a date is selected, filter by day of week to decide if the tile should be enabled
                  const DAY_CODES_LOCAL = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                  const DAY_FLAGS_LOCAL = ['isSunday', 'isMonday', 'isTuesday', 'isWednesday', 'isThursday', 'isFriday', 'isSaturday'];
                  const slotsForSelectedDay = (() => {
                    if (!selectedDate) return availableTimeSlots;
                    const dayIdx = selectedDate.day(); // moment's .day() returns 0=Sun…6=Sat
                    const dayCode = DAY_CODES_LOCAL[dayIdx];
                    const dayFlag = DAY_FLAGS_LOCAL[dayIdx];
                    return availableTimeSlots.filter((slot) => {
                      if (Array.isArray(slot.selected_days) && slot.selected_days.length > 0) {
                        return slot.selected_days.includes(dayCode);
                      }
                      if (slot[dayFlag] !== undefined) return slot[dayFlag] === true;
                      return true; // no day info, always show
                    });
                  })();
                  const hasTimeSlots = slotsForSelectedDay.length > 0;
                  return (
                    <div ref={timeItemRef} style={{ position: 'relative' }}>
                      <div
                        className={receiptStyles.item}
                        onClick={hasTimeSlots ? () => handleOpenDateTime(1) : undefined}
                        role={hasTimeSlots ? "button" : undefined}
                        style={{
                          cursor: hasTimeSlots ? 'pointer' : 'not-allowed',
                          opacity: hasTimeSlots ? 1 : 0.5,
                          pointerEvents: hasTimeSlots ? 'auto' : 'none',
                        }}
                        title={hasTimeSlots ? undefined : "No time slots available for the selected date"}
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
                        visible={showTimeSlots && hasTimeSlots}
                        onClose={() => setShowTimeSlots(false)}
                        onTimeSelect={handleTimeSelect}
                        selectedTime={selectedTimeSlot}
                        timeSlots={availableTimeSlots}
                        selectedDate={selectedDate}
                      />
                    </div>
                  );
                }
                if (index === 2) {
                  const canSelectGuests = isStay || (selectedDate && selectedTimeSlot);
                  return (
                    <div ref={guestItemRef} style={{ position: 'relative' }}>
                      <div
                        className={cn(receiptStyles.item, receiptStyles.guestCentered)}
                        onClick={canSelectGuests ? () => handleOpenDateTime(2) : undefined}
                        role={canSelectGuests ? "button" : undefined}
                        style={{
                          cursor: canSelectGuests ? 'pointer' : 'not-allowed',
                          opacity: canSelectGuests ? 1 : 0.5,
                          pointerEvents: canSelectGuests ? 'auto' : 'none',
                        }}
                        title={canSelectGuests ? undefined : "Please select date and time first"}
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
                        visible={showGuestPicker && canSelectGuests}
                        onClose={() => setShowGuestPicker(false)}
                        onGuestChange={(g) => {
                          setGuests(g);
                          setHasSelectedGuests(true);
                        }}
                        initialGuests={guests}
                        maxGuests={listing?.maxGuests || undefined}
                        maxSeats={maxSeats}
                        allowPets={listing?.allowPets || false}
                        childrenAllowed={listing?.childrenAllowed !== false}
                        infantsAllowed={listing?.infantsAllowed === true}
                        adultsLabel="Guests"
                        adultsSubtitle={billableGuestLabel}
                        childrenSubtitle={childrenGuestLabel}
                        requireAdultForChildren={false}
                      />
                    </div>
                  );
                }
                if (index === 3) {
                  // Static row for property-based stays (no selection needed)
                  if (isPropertyBased) {
                    return (
                      <div className={receiptStyles.item} style={{ cursor: 'default' }}>
                        <div className={receiptStyles.icon}>
                          <Icon name="home" size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>Room</div>
                          <div className={receiptStyles.subtitle}>Full Property</div>
                        </div>
                      </div>
                    );
                  }

                  // Static read-only row for room-based stays (selection happens in cards)
                  return (
                    <div className={receiptStyles.item} style={{ cursor: 'default' }}>
                      <div className={receiptStyles.icon}>
                        <Icon name={item.icon} size="24" />
                      </div>
                      <div className={receiptStyles.box}>
                        <div className={receiptStyles.category}>{item.category}</div>
                        <div className={receiptStyles.subtitle}>{item.title}</div>
                      </div>
                    </div>
                  );
                }

                return null;
              }}
              >
                <div className={styles.btns}>
                  {isStay ? (
                    <button
                      type="button"
                      className={cn("button", styles.button)}
                      onClick={handleBookStay}
                      disabled={!selectedDate || !selectedEndDate || !hasSelectedGuests || (!isPropertyBased && !staySelectedRoomType) || stayAvailabilityLoading}
                      title={
                        !selectedDate || !selectedEndDate ? "Please select check-in and check-out dates" : 
                        !hasSelectedGuests ? "Please confirm guest count" :
                        (!isPropertyBased && !staySelectedRoomType) ? "Please select a room from the cards above" : ""
                      }
                    >
                      <span>
                        {stayAvailabilityLoading ? "Processing..." : "Book now"}
                      </span>
                      <Icon name="bag" size="16" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={cn("button", styles.button)}
                      onClick={handleReserveClick}
                      disabled={!isReserveEnabled || isReserveSubmitting || selectedSlotPassed || !hasFutureTimeSlots}
                      title={
                        !isReserveEnabled ? "Please select date, time slot, and guests" :
                        (!hasFutureTimeSlots ? "No upcoming time slots available for this experience" :
                          (selectedSlotPassed ? "Selected time slot has already passed" : ""))
                      }
                    >
                      <span>{isReserveSubmitting ? "Processing..." : (isFullyBooked ? "Fully Booked" : "Reserve")}</span>
                      <Icon name="bag" size="16" />
                    </button>
                  )}
                </div>
                {isFullyBooked && (
                  <div style={{ color: "#FF6A55", marginTop: 12, fontSize: 13, fontWeight: "500", textAlign: "center" }}>
                    This slot is fully booked. Please select another date or time.
                  </div>
                )}
                {/* New warnings for passed/absent slots */}
                {!isFullyBooked && !hasFutureTimeSlots && (
                  <div style={{ color: "#FF6A55", marginTop: 12, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                    No upcoming time slots available for this experience.
                    Please contact the host or check back later.
                  </div>
                )}
                {!isFullyBooked && selectedSlotPassed && (
                  <div style={{ color: "#FF6A55", marginTop: 12, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                    The selected time slot has already passed for the chosen date. Please select another date or time.
                  </div>
                )}
                {!isFullyBooked && selectedDate && selectedTimeSlot && selectedDateAvailability && getGuestCount(guests) > (selectedDateAvailability.available_seats ?? 999) && (
                  <div style={{ color: "#FF6A55", marginTop: 12, fontSize: 13, fontWeight: "500", textAlign: "center" }}>
                    Only {selectedDateAvailability.available_seats} seat(s) available for this slot.
                  </div>
                )}

              <div className={styles.table}>
                  {/* For room-based stays: hide receipt until a room type is chosen.
                      For property-based stays: hide until dates are selected.
                      For experiences/other: only show after guests are explicitly selected. */}
                  {((!isStay && hasSelectedGuests) ||
                    (isStay && isPropertyBased && selectedDate && selectedEndDate) ||
                    (isStay && !isPropertyBased && staySelectedRoomType)
                  ) && receipt.map((x, index) => (
                    <div className={styles.line} key={index}>
                      <div className={styles.cell}>
                        {typeof x.title === "string" && (x.title.includes(" × ") || x.title.includes(" x ")) ? (
                          <div className={styles.priceDetailsStack}>
                            {x.title.split(/(?= [×x] )/).map((part, i) => (
                              <span key={i}>{part.trim()}</span>
                            ))}
                          </div>
                        ) : (
                          x.title
                        )}
                      </div>
                      <div className={styles.cell}>{x.content}</div>
                    </div>
                  ))
                }
                </div>
              <div className={styles.foot}>
                <button className={styles.report}>
                  <Icon name="flag" size="12" />
                  Report this property
                </button>
              </div>
            </Receipt>
          )}
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



