import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Ticket, ChefHat, Bed, X, Sparkles, Clock, Users, Star, Plus, Minus, CheckCircle2, ShieldCheck, ChevronDown } from "lucide-react";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";

import TimeSlotsPicker from "../TimeSlotsPicker";
import Counter from "../Counter";
import { createEventOrder, createOrder, getEventSlotAvailability, getListingSlots } from "../../utils/api";

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asDate = (value) => {
  if (!value) return null;
  // If the backend sends UTC strings but they are actually local times, strip the Z
  const normalizedValue = typeof value === "string" && value.endsWith("Z") 
    ? value.slice(0, -1) 
    : value;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatSaleDate = (date) => (
  date
    ? date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : ""
);

const asSeatLimit = (value) => {
  const parsed = asNumber(value);
  return parsed != null && parsed >= 0 ? parsed : undefined;
};

const asBoolean = (value, fallback = false) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};

const getSlotSeatLimit = (slot) => (
  asSeatLimit(slot?.maxSeats) ??
  asSeatLimit(slot?.max_seats) ??
  asSeatLimit(slot?.capacity?.maxSeats) ??
  asSeatLimit(slot?.capacity?.max_seats) ??
  asSeatLimit(slot?.availableSeats) ??
  asSeatLimit(slot?.available_seats)
);

const getSlotId = (slot) => (
  asNumber(slot) ??
  asNumber(slot?.eventSlotId) ??
  asNumber(slot?.event_slot_id) ??
  asNumber(slot?.slotId) ??
  asNumber(slot?.slot_id) ??
  asNumber(slot?.id)
);

const getSlotLabel = (slot, index = 0) => (
  (typeof slot === "string" || typeof slot === "number" ? String(slot) : "") ||
  slot?.slotName ||
  slot?.slot_name ||
  slot?.name ||
  slot?.title ||
  slot?.label ||
  slot?.startTime ||
  slot?.slotStartTime ||
  slot?.time ||
  `Slot ${index + 1}`
);

const getSlotAccessKeys = (slot, index = 0) => {
  const rawIds = slot && typeof slot === "object"
    ? [
        slot.eventSlotId,
        slot.event_slot_id,
        slot.slotId,
        slot.slot_id,
        slot.id,
      ]
    : [slot];
  const ids = rawIds
    .map((value) => asNumber(value))
    .filter((value) => value != null);
  const label = String(getSlotLabel(slot, index) || "").trim().toLowerCase();
  return [
    ...ids.map((id) => `id:${id}`),
    label ? `label:${label}` : null,
  ].filter(Boolean);
};

const getTicketId = (ticket) => (
  asNumber(ticket?.ticketTypeId) ??
  asNumber(ticket?.ticket_type_id) ??
  asNumber(ticket?.typeId) ??
  asNumber(ticket?.id)
);

const getTicketName = (ticket, index = 0) => (
  ticket?.name ||
  ticket?.ticketTypeName ||
  ticket?.typeName ||
  ticket?.title ||
  ticket?.ticketName ||
  `Ticket ${index + 1}`
);

const getTicketPrice = (ticket, fallback = 0) => (
  asNumber(ticket?.price) ??
  asNumber(ticket?.ticketTypePrice) ??
  asNumber(ticket?.typePrice) ??
  asNumber(ticket?.ticketPrice) ??
  asNumber(ticket?.individualPrice) ??
  asNumber(ticket?.amount) ??
  asNumber(ticket?.basePrice) ??
  fallback
);

const getTicketTotalTickets = (ticket) => (
  asNumber(ticket?.totalTickets) ??
  asNumber(ticket?.totalTicket) ??
  asNumber(ticket?.total_tickets) ??
  asNumber(ticket?.total_ticket)
);

const getTicketMaxPerBooking = (ticket) => (
  asNumber(ticket?.maxPerBooking) ??
  asNumber(ticket?.max_per_booking) ??
  asNumber(ticket?.maxTicketsPerBooking) ??
  asNumber(ticket?.max_tickets_per_booking)
);

const getTicketAvailabilityTotal = (item) => (
  asNumber(item?.totalTickets) ??
  asNumber(item?.totalTicket) ??
  asNumber(item?.total_tickets) ??
  asNumber(item?.total_ticket) ??
  asNumber(item?.capacity) ??
  asNumber(item?.totalCapacity) ??
  asNumber(item?.total_capacity) ??
  asNumber(item?.total)
);

const getTicketAvailabilityRemaining = (item) => (
  asNumber(item?.remainingTickets) ??
  asNumber(item?.remainingTicket) ??
  asNumber(item?.ticketsRemaining) ??
  asNumber(item?.remaining_tickets) ??
  asNumber(item?.remaining_ticket) ??
  asNumber(item?.availableTickets) ??
  asNumber(item?.availableTicket) ??
  asNumber(item?.available_tickets) ??
  asNumber(item?.available_ticket) ??
  asNumber(item?.availableQuantity) ??
  asNumber(item?.available_quantity) ??
  asNumber(item?.availableCount) ??
  asNumber(item?.available_count) ??
  asNumber(item?.remaining) ??
  asNumber(item?.available)
);

const getTicketAvailabilityBooked = (item) => (
  asNumber(item?.bookedTickets) ??
  asNumber(item?.bookedTicket) ??
  asNumber(item?.booked_tickets) ??
  asNumber(item?.booked_ticket) ??
  asNumber(item?.soldTickets) ??
  asNumber(item?.sold_tickets) ??
  asNumber(item?.usedTickets) ??
  asNumber(item?.used_tickets) ??
  asNumber(item?.bookedCount) ??
  asNumber(item?.booked_count) ??
  asNumber(item?.booked) ??
  asNumber(item?.sold)
);

const getTicketGroupPricingTiers = (ticket) => {
  const tiers =
    ticket?.groupPricingTiers ??
    ticket?.group_pricing_tiers ??
    ticket?.groupBookingPricing ??
    ticket?.group_booking_pricing ??
    [];
  return Array.isArray(tiers) ? tiers : [];
};

const getEffectiveTicketPrice = (ticket, quantity, fallbackPrice = 0) => {
  const basePrice = getTicketPrice(ticket, fallbackPrice);
  const tier = getTicketGroupPricingTiers(ticket).find((item) => {
    const min = asNumber(item?.minQuantity ?? item?.min_quantity ?? item?.groupCountFrom ?? item?.group_count_from) ?? 0;
    const max = asNumber(item?.maxQuantity ?? item?.max_quantity ?? item?.groupCountUpto ?? item?.group_count_upto) ?? Infinity;
    return quantity >= min && quantity <= max;
  });
  const tierPrice = asNumber(tier?.pricePerTicket ?? tier?.price_per_ticket ?? tier?.price ?? tier?.ticketPrice);
  return {
    price: tierPrice ?? basePrice,
    tier: tier || null,
    basePrice,
  };
};

const getGroupPricingTierPrice = (tiers = [], guestCount = 0) => {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;

  const tier = tiers.find((item) => {
    const min = asNumber(
      item?.group_count_from ??
      item?.groupCountFrom ??
      item?.minQuantity ??
      item?.min_quantity ??
      item?.minGuests ??
      item?.min_guests
    ) ?? 0;
    const max = asNumber(
      item?.group_count_upto ??
      item?.groupCountUpto ??
      item?.maxQuantity ??
      item?.max_quantity ??
      item?.maxGuests ??
      item?.max_guests
    ) ?? Infinity;
    return guestCount >= min && guestCount <= max;
  });

  return tier
    ? asNumber(tier.price_per_person ?? tier.pricePerPerson ?? tier.price ?? tier.amount)
    : null;
};

const getRateFromPricing = (...values) => {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed != null) return parsed;
  }
  return 0;
};

const calculateEventGuestPricing = (unitPrice, pricing = {}, earlyBirdDiscounts = [], bookingDate = null) => {
  const baseUnitPrice = asNumber(unitPrice) ?? 0;
  const discount = pricing?.discount || {};
  const tax = pricing?.tax || {};
  
  let discountRate = getRateFromPricing(
    discount.customer,
    discount.guest,
    discount.total,
    pricing?.discountRate,
    pricing?.discount
  );

  // Apply Early Bird Discount if applicable
  if (bookingDate && Array.isArray(earlyBirdDiscounts) && earlyBirdDiscounts.length > 0) {
    const today = moment().startOf('day');
    const bDate = moment(bookingDate).startOf('day');
    const daysInAdvance = bDate.diff(today, 'days');

    const applicableDiscounts = earlyBirdDiscounts.filter(d => 
      d.isActive !== false && daysInAdvance >= (asNumber(d.daysInAdvance) ?? 0)
    );
    
    if (applicableDiscounts.length > 0) {
      // Use the discount with the highest percentage if multiple apply
      const bestDiscount = applicableDiscounts.reduce((prev, current) => 
        ((asNumber(current.percentage) ?? 0) > (asNumber(prev.percentage) ?? 0)) ? current : prev
      );
      discountRate += (asNumber(bestDiscount.percentage) ?? 0);
    }
  }

  const customerTaxRate = getRateFromPricing(
    tax.customer,
    tax.guest,
    pricing?.customerTax,
    pricing?.customerTaxRate,
    pricing?.taxRate,
    tax.total
  );
  const discountAmount = baseUnitPrice * (discountRate / 100);
  const priceAfterDiscount = Math.max(0, baseUnitPrice - discountAmount);
  const taxAmount = priceAfterDiscount * (customerTaxRate / 100);
  const finalUnitPrice = priceAfterDiscount + taxAmount;

  return {
    baseUnitPrice,
    discountRate,
    discountAmount,
    priceAfterDiscount,
    customerTaxRate,
    taxAmount,
    finalUnitPrice,
  };
};

const getTicketSaleWindow = (listing, ticket) => {
  const startsAt = asDate(
    ticket?.ticketSaleStartDate ??
    ticket?.ticket_sale_start_date ??
    ticket?.saleStartDate ??
    listing?.ticketSaleStartDate ??
    listing?.ticket_sale_start_date ??
    listing?.saleStartDate
  );
  const endsAt = asDate(
    ticket?.ticketSaleEndDate ??
    ticket?.ticket_sale_end_date ??
    ticket?.saleEndDate ??
    listing?.ticketSaleEndDate ??
    listing?.ticket_sale_end_date ??
    listing?.saleEndDate ??
    listing?.bookingCutoffTime
  );
  const now = new Date();

  if (startsAt && now < startsAt) {
    return {
      isOpen: false,
      status: "upcoming",
      message: `Booking is not open yet. Ticket sales start on ${formatSaleDate(startsAt)}.`,
    };
  }

  if (endsAt && now > endsAt) {
    return {
      isOpen: false,
      status: "closed",
      message: `Booking date is closed. Ticket sales ended on ${formatSaleDate(endsAt)}.`,
    };
  }

  return {
    isOpen: true,
    status: "open",
    message: endsAt ? `Ticket sales close on ${formatSaleDate(endsAt)}.` : "",
  };
};

const getTicketSlotRestrictions = (ticket) => {
  const sources = [
    ticket?.applicableSlots,
    ticket?.applicable_slots,
    ticket?.eventSlots,
    ticket?.event_slots,
    ticket?.allowedSlots,
    ticket?.allowed_slots,
    ticket?.slotIds,
    ticket?.slot_ids,
    ticket?.slots,
  ];
  const source = sources.find((item) => Array.isArray(item) && item.length > 0);
  return source || [];
};

const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value?.format === "function") return value.format("YYYY-MM-DD");
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const makeLocalDate = (dateKey) => {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(dateKey);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const normalizeBookingTime = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2})(?::(\d{1,2}))?/);
  if (!match) return raw;
  const hours = String(Math.min(Math.max(Number(match[1]) || 0, 0), 23)).padStart(2, "0");
  const minutes = String(Math.min(Math.max(Number(match[2]) || 0, 0), 59)).padStart(2, "0");
  return `${hours}:${minutes}:00`;
};

const getRazorpayKeyFromCache = () => {
  try {
    const cachedKey = localStorage.getItem("lastRazorpayKeyId");
    if (cachedKey && cachedKey.startsWith("rzp_")) return cachedKey;
    const pendingPayment = localStorage.getItem("pendingPayment");
    if (pendingPayment) return JSON.parse(pendingPayment)?.razorpayKeyId;
  } catch (e) {
    console.warn("Could not read cached Razorpay key:", e);
  }
  return null;
};

const extractRazorpayCredentials = (res) => {
  let orderId = null;
  let keyId = null;

  const search = (obj) => {
    if (!obj || typeof obj !== "object") return;
    if (orderId && keyId) return;

    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const val = obj[key];

      if (typeof val === "string") {
        if (!orderId && val.startsWith("order_") && (lowerKey.includes("razorpay") || lowerKey.includes("order"))) {
          orderId = val;
        }
        if (!keyId && val.startsWith("rzp_") && (lowerKey.includes("razorpay") || lowerKey.includes("key"))) {
          keyId = val;
        }
      } else if (typeof val === "object") {
        search(val);
      }
    }
  };

  search(res);
  return { razorpayOrderId: orderId, razorpayKeyId: keyId };
};

const addDateRangeKeys = (keys, startValue, endValue) => {
  const startKey = getDateKey(startValue);
  const endKey = getDateKey(endValue || startValue);
  if (!startKey) return;

  const start = makeLocalDate(startKey);
  const end = makeLocalDate(endKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    keys.add(startKey);
    return;
  }

  const current = start <= end ? start : end;
  const last = start <= end ? end : start;
  while (current <= last) {
    keys.add(getDateKey(current));
    current.setDate(current.getDate() + 1);
  }
};

const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getSelectedDayCodes = (source = {}) => {
  const schedule = source.schedule || {};
  const selectedDays = source.selected_days || source.selectedDays || schedule.selected_days || schedule.selectedDays;
  if (!Array.isArray(selectedDays) || selectedDays.length === 0) return null;
  return new Set(selectedDays.map((day) => String(day).trim().toUpperCase()).filter(Boolean));
};

const hasWeekdayFlags = (source = {}) => (
  [
    source.isSunday,
    source.isMonday,
    source.isTuesday,
    source.isWednesday,
    source.isThursday,
    source.isFriday,
    source.isSaturday,
    source.is_sunday,
    source.is_monday,
    source.is_tuesday,
    source.is_wednesday,
    source.is_thursday,
    source.is_friday,
    source.is_saturday,
  ].some((value) => value === true || value === false)
);

const isWeekdayEnabled = (source = {}, weekday) => {
  const selectedDayCodes = getSelectedDayCodes(source);
  if (selectedDayCodes) return selectedDayCodes.has(WEEKDAY_CODES[weekday]);

  const flags = [
    [source.isSunday, source.is_sunday],
    [source.isMonday, source.is_monday],
    [source.isTuesday, source.is_tuesday],
    [source.isWednesday, source.is_wednesday],
    [source.isThursday, source.is_thursday],
    [source.isFriday, source.is_friday],
    [source.isSaturday, source.is_saturday],
  ];
  const values = flags[weekday] || [];
  const explicit = values.find((value) => value === true || value === false);
  return explicit !== false;
};

const addScheduleDateKeys = (keys, source = {}, fallback = {}) => {
  const schedule = source.schedule || {};
  const startKey = getDateKey(
    source.startDate ||
    source.start_date ||
    source.slotStartDate ||
    source.slot_start_date ||
    source.availableFrom ||
    source.available_from ||
    source.bookingStartDate ||
    source.booking_start_date ||
    schedule.startDate ||
    schedule.start_date ||
    fallback.startDate ||
    fallback.start_date ||
    fallback.bookingStartDate
  );
  const endKey = getDateKey(
    source.endDate ||
    source.end_date ||
    source.slotEndDate ||
    source.slot_end_date ||
    source.availableTo ||
    source.available_to ||
    source.bookingEndDate ||
    source.booking_end_date ||
    schedule.endDate ||
    schedule.end_date ||
    fallback.endDate ||
    fallback.end_date ||
    fallback.bookingEndDate ||
    startKey
  );

  if (!startKey) return;

  const start = makeLocalDate(startKey);
  const end = makeLocalDate(endKey || startKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    keys.add(startKey);
    return;
  }

  const current = start <= end ? start : end;
  const last = start <= end ? end : start;
  const shouldFilterByWeekday = Boolean(getSelectedDayCodes(source)) || hasWeekdayFlags(source);

  while (current <= last) {
    if (!shouldFilterByWeekday || isWeekdayEnabled(source, current.getDay())) {
      keys.add(getDateKey(current));
    }
    current.setDate(current.getDate() + 1);
  }
};

const normalizeEventSlots = (slots = [], fallbackPrice = 0) => (
  Array.isArray(slots) ? slots
    .map((slot, index) => {
      if (!slot) return null;
      const source = typeof slot === "string" ? { slotName: slot } : slot;
      if (source.is_active === false || source.isActive === false) return null;
      const id = getSlotId(source);
      return {
        ...source,
        id: id ?? source.id ?? source.slotId ?? `slot-${index}`,
        eventSlotId: id,
        slotName: getSlotLabel(source, index),
        startTime: source.startTime || source.time || source.slotTime || "",
        endTime: source.endTime || "",
        pricePerPerson: source.pricePerPerson ?? source.price ?? fallbackPrice
      };
    })
    .filter(Boolean) : []
);

const unwrapAvailabilityPayload = (payload) => {
  if (!payload) return payload;
  return payload.data ?? payload.availability ?? payload.slotAvailability ?? payload.slotAvailabilities ?? payload;
};

const getAvailabilityTicketId = (item) => (
  asNumber(item?.ticketTypeId) ??
  asNumber(item?.ticket_type_id) ??
  asNumber(item?.ticketId) ??
  asNumber(item?.ticket_id) ??
  asNumber(item?.typeId) ??
  asNumber(item?.id)
);

const getAvailabilitySlotId = (item) => (
  getSlotId(item) ??
  asNumber(item?.eventSlot?.eventSlotId) ??
  asNumber(item?.slot?.eventSlotId) ??
  asNumber(item?.slot?.slotId)
);

const normalizeEventAvailability = (payload) => {
  const source = unwrapAvailabilityPayload(payload);
  const records = [];

  const pushRecord = (item, parent = {}) => {
    if (!item || typeof item !== "object") return;
    const ticketId = getAvailabilityTicketId(item) ?? getAvailabilityTicketId(parent);
    const slotId = getAvailabilitySlotId(item) ?? getAvailabilitySlotId(parent);
    const total = getTicketAvailabilityTotal(item) ?? getTicketAvailabilityTotal(parent);
    const booked = getTicketAvailabilityBooked(item) ?? getTicketAvailabilityBooked(parent);
    const explicitRemaining = getTicketAvailabilityRemaining(item) ?? getTicketAvailabilityRemaining(parent);
    const remaining = explicitRemaining ?? (total != null && booked != null ? Math.max(0, total - booked) : undefined);
    const isAvailable = item.isAvailable ?? item.available ?? item.inStock ?? parent.isAvailable ?? parent.available;

    if (ticketId == null && slotId == null && total == null && remaining == null && isAvailable == null) return;
    records.push({ ...parent, ...item, ticketId, slotId, total, remaining, isAvailable });
  };

  const visit = (value, parent = {}) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, parent));
      return;
    }
    if (typeof value !== "object") return;

    const nestedSlotArrays = [
      value.slots,
      value.eventSlots,
      value.event_slots,
      value.timeSlots,
      value.time_slots,
      value.slotAvailability,
      value.slotAvailabilities,
    ].filter(Array.isArray);

    if (nestedSlotArrays.length > 0) {
      nestedSlotArrays.forEach((items) => items.forEach((item) => visit(item, item)));
      return;
    }

    const nestedTicketArrays = [
      value.ticketTypes,
      value.ticket_types,
      value.tickets,
      value.availability,
      value.availabilities,
      value.ticketAvailability,
      value.ticketAvailabilities,
    ].filter(Array.isArray);

    if (nestedTicketArrays.length > 0) {
      nestedTicketArrays.forEach((items) => items.forEach((item) => pushRecord(item, value)));
      return;
    }

    const keyedTicketEntries = Object.entries(value).filter(([, item]) => (
      item && typeof item === "object" && !Array.isArray(item)
    ));

    if (
      getAvailabilityTicketId(value) != null ||
      getTicketAvailabilityTotal(value) != null ||
      getTicketAvailabilityRemaining(value) != null ||
      value.isAvailable != null ||
      value.available != null
    ) {
      pushRecord(value, parent);
      return;
    }

    keyedTicketEntries.forEach(([key, item]) => {
      const numericKey = asNumber(key);
      pushRecord({ ...item, ticketTypeId: item.ticketTypeId ?? item.ticket_type_id ?? numericKey }, parent);
    });
  };

  visit(source);
  return records;
};

const unwrapSlotsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.slots)) return payload.slots;
  if (Array.isArray(payload?.data?.slots)) return payload.data.slots;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getSlotAvailabilityForDate = (slot, dateKey) => {
  const records = Array.isArray(slot?.availability) ? slot.availability : [];
  return records.find((item) => getDateKey(item?.date || item?.bookingDate || item?.booking_date) === dateKey) || null;
};

const normalizeExperienceSlots = (slots = [], dateKey = "") => (
  Array.isArray(slots) ? slots
    .map((slot, index) => {
      if (!slot || typeof slot !== "object") return null;
      const schedule = slot.schedule || {};
      const capacity = slot.capacity || {};
      const pricing = slot.pricing || {};
      const availability = getSlotAvailabilityForDate(slot, dateKey);
      const id = getSlotId(slot);
      const slotName = getSlotLabel(slot, index);
      const isAvailable = availability?.is_available ?? availability?.isAvailable ?? slot.is_available ?? slot.isAvailable;
      const privateBookingEnabled = availability?.privateBookingEnabled ?? availability?.private_booking_enabled ?? slot.privateBookingEnabled ?? slot.private_booking_enabled ?? false;
      const hasPrivateBooking = availability?.hasPrivateBooking ?? availability?.has_private_booking ?? slot.hasPrivateBooking ?? slot.has_private_booking ?? false;
      const explicitPrivateBookingAvailable = availability?.privateBookingAvailable ?? availability?.private_booking_available ?? slot.privateBookingAvailable ?? slot.private_booking_available;
      const privateBookingAvailable = explicitPrivateBookingAvailable ?? Boolean(privateBookingEnabled && !hasPrivateBooking && isAvailable !== false);

      return {
        ...slot,
        id: id ?? slot.id ?? slot.slotId ?? slot.slot_id ?? `slot-${index}`,
        slotId: id ?? slot.slotId ?? slot.slot_id,
        slot_id: id ?? slot.slot_id ?? slot.slotId,
        slotName,
        slot_name: slot.slot_name ?? slotName,
        startTime: slot.startTime || slot.start_time || schedule.startTime || schedule.start_time || "",
        endTime: slot.endTime || slot.end_time || schedule.endTime || schedule.end_time || "",
        startDate: slot.startDate || slot.start_date || schedule.startDate || schedule.start_date,
        endDate: slot.endDate || slot.end_date || schedule.endDate || schedule.end_date,
        selected_days: slot.selected_days || schedule.selected_days,
        maxSeats: slot.maxSeats ?? slot.max_seats ?? capacity.maxSeats ?? capacity.max_seats,
        availableSeats: availability?.available_seats ?? availability?.availableSeats ?? slot.availableSeats ?? slot.available_seats,
        pricePerPerson: pricing.price_per_person ?? pricing.pricePerPerson ?? slot.pricePerPerson ?? slot.price_per_person ?? slot.price,
        group_booking_pricing: slot.group_booking_pricing || slot.groupBookingPricing || [],
        availability: Array.isArray(slot.availability) ? slot.availability : [],
        selectedDateAvailability: availability,
        is_available: isAvailable,
        privateBookingEnabled,
        hasPrivateBooking,
        privateBookingAvailable,
      };
    })
    .filter(Boolean) : []
);

const collectPrivateBookedSlotIds = (listing) => {
  const sources = [
    listing?.privateBookedSlots,
    listing?.private_booked_slots,
    listing?.privateBookedSlotIds,
    listing?.private_booked_slot_ids,
    listing?.privateBookingSlots,
    listing?.private_booking_slots,
  ].filter(Array.isArray);
  const ids = new Set();

  sources.flat().forEach((item) => {
    const id = getSlotId(item);
    if (id != null) ids.add(String(id));
  });

  return ids;
};

const getLatestExperienceSlotEndDate = (listing) => {
  const slotSources = [
    listing?.timeSlots,
    listing?.slots,
    listing?.availability,
  ].filter(Array.isArray);
  const dateKeys = [];

  slotSources.flat().forEach((slot) => {
    if (!slot || typeof slot !== "object") return;
    const schedule = slot.schedule || {};
    const key = getDateKey(
      slot.endDate ||
      slot.end_date ||
      slot.slotEndDate ||
      slot.availableTo ||
      schedule.endDate ||
      schedule.end_date ||
      slot.startDate ||
      slot.start_date ||
      schedule.startDate ||
      schedule.start_date
    );
    if (key) dateKeys.push(key);
  });

  return dateKeys.sort().pop() || getDateKey(listing?.endDate || listing?.bookingEndDate || listing?.startDate);
};

function EventInlineCalendar({ selectedDate, onDateSelect, availableDateKeys, tokens, emptyMessage = "No available dates." }) {
  const { A, AL, BG, FG, M, B, S, W } = tokens;
  const getInitialViewDate = useCallback(() => {
    if (selectedDate && typeof selectedDate.toDate === "function") return selectedDate.toDate();
    if (selectedDate) return makeLocalDate(getDateKey(selectedDate));

    const todayKey = getDateKey(new Date());
    const availableKeys = [...availableDateKeys].filter((key) => key >= todayKey).sort();
    const currentMonthPrefix = todayKey.slice(0, 7);
    const currentMonthKey = availableKeys.find((key) => key.slice(0, 7) === currentMonthPrefix);
    const firstAvailableKey = currentMonthKey || availableKeys[0];
    return firstAvailableKey ? makeLocalDate(firstAvailableKey) : new Date();
  }, [availableDateKeys, selectedDate]);
  const [viewDate, setViewDate] = useState(() => getInitialViewDate());

  useEffect(() => {
    setViewDate(getInitialViewDate());
  }, [getInitialViewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedKey = getDateKey(selectedDate);

  // Today's date key (YYYY-MM-DD) for past-date comparison
  const todayKey = getDateKey(new Date());
  const now = new Date();
  const isViewingCurrentOrPastMonth =
    year < now.getFullYear() ||
    (year === now.getFullYear() && month <= now.getMonth());

  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isPast = key < todayKey;
      return { day, key, isAvailable: !isPast && availableDateKeys.has(key), isPast };
    }),
  ];

  return (
    <div style={{ background: S, borderRadius: 16, padding: 18, border: `1px solid ${B}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          disabled={isViewingCurrentOrPastMonth}
          style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${B}`, background: BG, color: isViewingCurrentOrPastMonth ? `${M}44` : FG, cursor: isViewingCurrentOrPastMonth ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isViewingCurrentOrPastMonth ? 0.4 : 1 }}
        >
          <ChevronDown size={15} style={{ transform: "rotate(90deg)" }} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 800, color: FG }}>
          {viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${B}`, background: BG, color: FG, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronDown size={15} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: M, padding: "4px 0" }}>
            {day}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell) return <div key={`blank-${index}`} />;
          const isSelected = selectedKey === cell.key;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.isAvailable}
              onClick={() => onDateSelect(moment(cell.key))}
              title={cell.isPast ? "Past date" : undefined}
              style={{
                aspectRatio: "1 / 1",
                minWidth: 0,
                borderRadius: 12,
                border: `1px solid ${isSelected ? A : cell.isAvailable ? `${A}55` : "transparent"}`,
                background: isSelected ? A : cell.isAvailable ? AL : "transparent",
                color: isSelected ? W : cell.isPast ? `${M}33` : cell.isAvailable ? FG : `${M}55`,
                cursor: cell.isAvailable ? "pointer" : "not-allowed",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: cell.isPast ? "line-through" : "none",
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      {availableDateKeys.size === 0 && (
        <div style={{ marginTop: 12, color: M, fontSize: 12, fontWeight: 600, textAlign: "center" }}>
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export function BookingSystem({ listing, type = "experience", selectedAddOns = [], triggerLabel = "Reserve Now", reserveLabel = "Reserve Experience" }) {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W } } = useTheme();
  const isMountedRef = useRef(true);
  const [show, setShow] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Real State management
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0 });
  const totalGuests = guests.adults + guests.children;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateFilteredSlots, setDateFilteredSlots] = useState([]);
  const [dateFilteredSlotsLoaded, setDateFilteredSlotsLoaded] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [privateBooking, setPrivateBooking] = useState(false);
  

  const isEventBooking = type === "event";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const eventTickets = useMemo(() => {
    if (!isEventBooking) return [];
    if (Array.isArray(listing?.ticketTypes)) return listing.ticketTypes;
    if (Array.isArray(listing?.tickets)) return listing.tickets;
    if (Array.isArray(listing?.ticketTiers)) return listing.ticketTiers;
    return [];
  }, [isEventBooking, listing?.ticketTypes, listing?.tickets, listing?.ticketTiers]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [selectedEventSlotIds, setSelectedEventSlotIds] = useState([]);
  const selectedEventSlotId = selectedEventSlotIds[0] || "";
  const selectedTicket = useMemo(() => (
    eventTickets.find(ticket => String(ticket.id ?? ticket.ticketTypeId ?? ticket.typeId) === String(selectedTicketTypeId)) || eventTickets[0] || null
  ), [eventTickets, selectedTicketTypeId]);
  const ticketSaleWindow = useMemo(() => (
    isEventBooking ? getTicketSaleWindow(listing, selectedTicket) : { isOpen: true, status: "open", message: "" }
  ), [isEventBooking, listing, selectedTicket]);
  const eventFallbackSlots = useMemo(() => (
    listing?.eventSlots || listing?.slots || listing?.timeSlots || []
  ), [listing?.eventSlots, listing?.slots, listing?.timeSlots]);
  const baseTimeSlots = useMemo(() => (
    Array.isArray(listing?.timeSlots) ? listing.timeSlots : []
  ), [listing?.timeSlots]);
  const ticketApplicableSlots = useMemo(() => {
    return getTicketSlotRestrictions(selectedTicket);
  }, [selectedTicket]);
  const ticketNameRestriction = useMemo(() => {
    const name = String(getTicketName(selectedTicket) || "").toLowerCase();
    if (name.includes("vip")) return "all";
    if (name.includes("evening")) return "evening";
    if (name.includes("general") || name.includes("morning")) return "morning";
    return "";
  }, [selectedTicket]);
  const canSelectMultipleEventSlots = ticketNameRestriction === "all";
  const ticketHasSlotRestrictions = ticketApplicableSlots.length > 0 || Boolean(ticketNameRestriction);
  const allEventSlotSource = useMemo(() => (
    eventFallbackSlots.length > 0 ? eventFallbackSlots : ticketApplicableSlots
  ), [eventFallbackSlots, ticketApplicableSlots]);
  const eventPrice = getTicketPrice(selectedTicket, asNumber(listing?.ticketPrice) ?? asNumber(listing?.price) ?? asNumber(listing?.basePrice) ?? 0);
  const effectiveEventPrice = useMemo(() => (
    getEffectiveTicketPrice(selectedTicket, totalGuests, eventPrice)
  ), [selectedTicket, totalGuests, eventPrice]);
  const eventGuestPricing = useMemo(() => (
    calculateEventGuestPricing(effectiveEventPrice.price, listing?.pricing, listing?.earlyBirdDiscounts, startDate)
  ), [effectiveEventPrice.price, listing?.pricing, listing?.earlyBirdDiscounts, startDate]);
  const selectedTicketTotalTickets = getTicketTotalTickets(selectedTicket);
  const selectedTicketMaxPerBooking = getTicketMaxPerBooking(selectedTicket);
  const eventIdForAvailability = asNumber(listing?.eventId ?? listing?.event_id ?? listing?.id ?? listing?.listingId);
  const [eventAvailabilityLoading, setEventAvailabilityLoading] = useState(false);
  const [eventAvailabilityError, setEventAvailabilityError] = useState("");
  const [eventAvailabilityRecords, setEventAvailabilityRecords] = useState([]);
  const eventSlots = useMemo(() => (
    normalizeEventSlots(allEventSlotSource, eventPrice)
  ), [allEventSlotSource, eventPrice]);
  const accessibleSlotKeys = useMemo(() => {
    if (!ticketHasSlotRestrictions) return null;
    const keys = new Set();
    ticketApplicableSlots.forEach((slot, index) => {
      getSlotAccessKeys(slot, index).forEach(key => keys.add(key));
    });
    return keys;
  }, [ticketApplicableSlots, ticketHasSlotRestrictions]);
  const isEventSlotAccessible = useCallback((slot, index = 0) => {
    if (!ticketHasSlotRestrictions) return true;
    if (ticketNameRestriction === "all") return true;
    if (accessibleSlotKeys && accessibleSlotKeys.size > 0 && getSlotAccessKeys(slot, index).some(key => accessibleSlotKeys.has(key))) {
      return true;
    }
    if (ticketNameRestriction) {
      const slotLabel = String(getSlotLabel(slot, index) || "").toLowerCase();
      return slotLabel.includes(ticketNameRestriction);
    }
    return false;
  }, [accessibleSlotKeys, ticketHasSlotRestrictions, ticketNameRestriction]);
  const selectedEventSlot = useMemo(() => (
    eventSlots.find((slot, index) => String(slot.eventSlotId ?? slot.id) === String(selectedEventSlotId) && isEventSlotAccessible(slot, index)) || null
  ), [eventSlots, selectedEventSlotId, isEventSlotAccessible]);
  const selectedEventSlots = useMemo(() => (
    eventSlots.filter((slot, index) => selectedEventSlotIds.includes(String(slot.eventSlotId ?? slot.id)) && isEventSlotAccessible(slot, index))
  ), [eventSlots, selectedEventSlotIds, isEventSlotAccessible]);
  const selectedTicketAvailability = useMemo(() => {
    if (!isEventBooking || !selectedTicket) return null;
    const ticketId = getTicketId(selectedTicket);
    if (ticketId == null) return null;

    const ticketRecords = eventAvailabilityRecords.filter((item) => String(item.ticketId) === String(ticketId));
    if (ticketRecords.length === 0) return null;

    const selectedSlotIds = selectedEventSlots
      .map((slot) => getSlotId(slot))
      .filter((value) => value != null)
      .map(String);
    const scopedRecords = selectedSlotIds.length > 0
      ? ticketRecords.filter((item) => item.slotId == null || selectedSlotIds.includes(String(item.slotId)))
      : ticketRecords;
    const records = scopedRecords.length > 0 ? scopedRecords : ticketRecords;
    const totals = records.map((item) => item.total).filter((value) => value != null);
    const remainings = records.map((item) => item.remaining).filter((value) => value != null);
    const total = totals.length > 0 ? totals.reduce((sum, value) => sum + value, 0) : undefined;
    const remaining = remainings.length > 0 ? remainings.reduce((sum, value) => sum + value, 0) : undefined;
    const unavailable = records.some((item) => item.isAvailable === false) || remaining === 0;

    return {
      total,
      remaining,
      isSoldOut: unavailable,
    };
  }, [eventAvailabilityRecords, isEventBooking, selectedEventSlots, selectedTicket]);
  const selectedTicketRemainingTickets = selectedTicketAvailability?.remaining;
  const selectedTicketAvailabilityTotal = selectedTicketAvailability?.total ?? selectedTicketTotalTickets;
  const selectedTicketSoldOut = Boolean(selectedTicketAvailability?.isSoldOut);
  const eventAvailableDateKeys = useMemo(() => {
    if (!isEventBooking) return new Set();
    const keys = new Set();

    eventSlots.forEach((slot, index) => {
      if (!isEventSlotAccessible(slot, index)) return;
      addDateRangeKeys(
        keys,
        slot.slotStartDate || slot.slotDate || slot.date || slot.eventDate || slot.startDate,
        slot.slotEndDate || slot.endDate || slot.end_date
      );
    });

    addDateRangeKeys(
      keys,
      listing?.startDate || listing?.eventStartDate || listing?.bookingStartDate,
      listing?.endDate || listing?.eventEndDate || listing?.bookingEndDate || listing?.startDate
    );

    return keys;
  }, [eventSlots, isEventBooking, isEventSlotAccessible, listing?.bookingEndDate, listing?.bookingStartDate, listing?.endDate, listing?.eventEndDate, listing?.eventStartDate, listing?.startDate]);
  const listingId = listing?.listingId;
  const selectedDateKey = useMemo(() => getDateKey(startDate), [startDate]);
  const slotsLookupEndDate = useMemo(() => getLatestExperienceSlotEndDate(listing), [listing]);
  const privateBookedSlotIds = useMemo(() => collectPrivateBookedSlotIds(listing), [listing]);
  const timeSlots = useMemo(() => {
    const sourceSlots = selectedDateKey && dateFilteredSlotsLoaded ? dateFilteredSlots : baseTimeSlots;
    return sourceSlots.filter((slot) => {
      const slotId = getSlotId(slot);
      const isPrivatelyBooked = slot?.hasPrivateBooking === true || (slotId != null && privateBookedSlotIds.has(String(slotId)));
      return !isPrivatelyBooked;
    });
  }, [baseTimeSlots, dateFilteredSlots, dateFilteredSlotsLoaded, privateBookedSlotIds, selectedDateKey]);
  const experienceAvailableDateKeys = useMemo(() => {
    if (isEventBooking) return new Set();
    const keys = new Set();
    const schedules = [
      ...(Array.isArray(timeSlots) ? timeSlots : []),
      ...(Array.isArray(listing?.slots) ? listing.slots : []),
      ...(Array.isArray(listing?.availability) ? listing.availability : []),
      ...(Array.isArray(listing?.availableDates) ? listing.availableDates : []),
    ];

    if (schedules.length > 0) {
      schedules.forEach((schedule) => {
        if (!schedule) return;
        if (typeof schedule === "string") {
          const key = getDateKey(schedule);
          if (key) keys.add(key);
          return;
        }
        addScheduleDateKeys(keys, schedule, listing);
      });
    } else {
      addScheduleDateKeys(keys, listing, listing);
    }

    return keys;
  }, [isEventBooking, listing, timeSlots]);

  useEffect(() => {
    if (!isEventBooking || selectedTicketTypeId || eventTickets.length === 0) return;
    const firstTicket = eventTickets[0];
    setSelectedTicketTypeId(String(firstTicket.id ?? firstTicket.ticketTypeId ?? firstTicket.typeId ?? "ticket-0"));
  }, [eventTickets, isEventBooking, selectedTicketTypeId]);

  useEffect(() => {
    if (!isEventBooking || !show || !eventIdForAvailability) return;

    let cancelled = false;
    setEventAvailabilityLoading(true);
    setEventAvailabilityError("");

    getEventSlotAvailability(eventIdForAvailability)
      .then((payload) => {
        if (cancelled || !isMountedRef.current) return;
        const normalized = normalizeEventAvailability(payload);
        console.log("Event slot availability raw payload:", payload);
        console.log("Event slot availability normalized records:", normalized);
        setEventAvailabilityRecords(normalized);
      })
      .catch((error) => {
        if (cancelled || !isMountedRef.current) return;
        setEventAvailabilityRecords([]);
        setEventAvailabilityError(error?.response?.data?.message || error?.response?.data?.error || error?.message || "Could not load ticket availability.");
      })
      .finally(() => {
        if (!cancelled && isMountedRef.current) setEventAvailabilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventIdForAvailability, isEventBooking, show]);

  useEffect(() => {
    if (isEventBooking) return;

    setStartTime(null);
    setPrivateBooking(false);
    setShowTimePicker(false);

    if (!show || !listingId || !selectedDateKey || !slotsLookupEndDate) {
      setDateFilteredSlots([]);
      setDateFilteredSlotsLoaded(false);
      setSlotsError("");
      setSlotsLoading(false);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");
    setDateFilteredSlotsLoaded(false);

    getListingSlots(listingId, selectedDateKey, slotsLookupEndDate)
      .then((payload) => {
        if (cancelled || !isMountedRef.current) return;
        const normalized = normalizeExperienceSlots(unwrapSlotsPayload(payload), selectedDateKey);
        setDateFilteredSlots(normalized);
        setDateFilteredSlotsLoaded(true);
      })
      .catch((error) => {
        if (cancelled || !isMountedRef.current) return;
        setDateFilteredSlots([]);
        setDateFilteredSlotsLoaded(false);
        setSlotsError(error?.response?.data?.message || error?.response?.data?.error || error?.message || "Could not load slots for this date.");
      })
      .finally(() => {
        if (!cancelled && isMountedRef.current) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEventBooking, listingId, selectedDateKey, show, slotsLookupEndDate]);

  useEffect(() => {
    if (!isEventBooking) return;
    const validSelectedSlots = eventSlots.filter((slot, index) => (
      selectedEventSlotIds.includes(String(slot.eventSlotId ?? slot.id)) && isEventSlotAccessible(slot, index)
    ));
    if (validSelectedSlots.length > 0) {
      const nextSelection = canSelectMultipleEventSlots
        ? validSelectedSlots.map((slot) => String(slot.eventSlotId ?? slot.id))
        : [String(validSelectedSlots[0].eventSlotId ?? validSelectedSlots[0].id)];
      if (nextSelection.join("|") !== selectedEventSlotIds.join("|")) {
        setSelectedEventSlotIds(nextSelection);
      }
      setStartTime(validSelectedSlots.map((slot) => slot.slotName).join(", "));
      return;
    }
    const firstSlot = eventSlots.find((slot, index) => isEventSlotAccessible(slot, index));
    setSelectedEventSlotIds(firstSlot ? [String(firstSlot.eventSlotId ?? firstSlot.id)] : []);
    setStartTime(firstSlot ? firstSlot.slotName : null);
  }, [canSelectMultipleEventSlots, eventSlots, isEventBooking, selectedEventSlotIds, isEventSlotAccessible]);

  // Calculate addon total
  const addOnsTotal = selectedAddOns.reduce((sum, item) => {
    const addon = item.addon || item;
    const quantity = item.quantity || 1;
    return sum + ((parseFloat(addon.price) || 0) * quantity);
  }, 0);

  // Extract proper price depending on whether a time slot is selected
  const selectedSlotData = timeSlots.find(s => s.slotName === startTime || s.startTime === startTime) || null;
  const staleSelectedSlotData = (dateFilteredSlotsLoaded ? dateFilteredSlots : baseTimeSlots).find(s => s.slotName === startTime || s.startTime === startTime) || null;
  const selectedSlotHasPrivateBooking = !isEventBooking && Boolean(startTime) && staleSelectedSlotData?.hasPrivateBooking === true;
  const dateHasPrivateBookingAvailable = !isEventBooking && Boolean(selectedDateKey) && dateFilteredSlotsLoaded && timeSlots.some((slot) => slot.privateBookingAvailable === true);
  const selectedSlotPrivateBookingAvailable = !isEventBooking && Boolean(startTime) && selectedSlotData?.privateBookingAvailable === true;
  const showPrivateBookingToggle = selectedSlotPrivateBookingAvailable;
  const privateBookingMessage = !isEventBooking && selectedDateKey && dateFilteredSlotsLoaded
    ? (selectedSlotHasPrivateBooking
        ? "This slot already has a private booking. Choose another slot."
        : !dateHasPrivateBookingAvailable
        ? "No private booking available for this date."
        : (startTime && !selectedSlotPrivateBookingAvailable
            ? "This slot does not have private booking. Choose another slot."
            : ""))
    : "";
  const selectedSlotSeatLimit = getSlotSeatLimit(selectedSlotData);
  const guestSeatLimit = isEventBooking ? undefined : selectedSlotSeatLimit;
  const eventTicketAvailableLimit = isEventBooking && selectedTicketRemainingTickets !== undefined
    ? Math.max(0, selectedTicketRemainingTickets)
    : undefined;
  const eventGuestLimits = [selectedTicketMaxPerBooking, eventTicketAvailableLimit].filter((value) => value !== undefined);
  const bookingGuestLimit = isEventBooking
    ? (eventGuestLimits.length > 0 ? Math.min(...eventGuestLimits) : undefined)
    : guestSeatLimit;
  const rawExperiencePrice = selectedSlotData?.pricePerPerson 
    || listing?.timeSlots?.[0]?.pricePerPerson
    || listing?.pricing?.basePrice
    || listing?.basePrice
    || listing?.price 
    || listing?.b2cPrice 
    || "0";

  // Group pricing: override rawExperiencePrice if guest count matches a tier
  const groupPricingRules = !isEventBooking
    ? (selectedSlotData?.group_booking_pricing || selectedSlotData?.groupBookingPricing || [])
    : [];
  const groupOverridePrice = getGroupPricingTierPrice(groupPricingRules, totalGuests);
  // Effective raw base price: group tier wins when matched, else use slot/listing price
  const effectiveRawPrice = (groupOverridePrice != null && groupOverridePrice > 0)
    ? groupOverridePrice
    : rawExperiencePrice;

  const experienceGuestPricing = !isEventBooking
    ? calculateEventGuestPricing(effectiveRawPrice, listing?.pricing, listing?.earlyBirdDiscounts, startDate)
    : null;
  const extractedPrice = isEventBooking
    ? eventGuestPricing.finalUnitPrice
    : (experienceGuestPricing?.finalUnitPrice ?? parseFloat(effectiveRawPrice || 0));

  // Child pricing for experiences
  const childrenAllowed = !isEventBooking && asBoolean(
    listing?.childrenAllowed ?? listing?.childAllowed ?? listing?.allowChildren,
    true
  );
  const rawChildPrice = !isEventBooking
    ? (listing?.childPricePerChild || listing?.childPrice || listing?.pricing?.childPricePerChild || 0)
    : 0;
  const childGuestPricing = !isEventBooking && childrenAllowed && rawChildPrice > 0
    ? calculateEventGuestPricing(rawChildPrice, listing?.pricing, listing?.earlyBirdDiscounts, startDate)
    : null;
  // Effective per-child price (after discount + tax), fallback to adult price if no child price set
  const effectiveChildPrice = childGuestPricing
    ? childGuestPricing.finalUnitPrice
    : extractedPrice;
  const hasChildPricing = childrenAllowed && rawChildPrice > 0 && guests.children > 0;
  const baseAdultPricePerPerson = parseFloat(effectiveRawPrice || 0);
  const baseChildPricePerChild = hasChildPricing ? parseFloat(rawChildPrice || 0) : baseAdultPricePerPerson;
  
  const data = {
    price: extractedPrice,
    unit: isEventBooking ? "ticket" : (type === "stay" ? "night" : "person"),
    icon: type === "stay" ? Bed : (type === "food" ? ChefHat : Ticket)
  };

  // Compute totals with child pricing split
  const adultSubtotal = parseFloat(extractedPrice || 0) * (isEventBooking ? totalGuests : guests.adults);
  const childSubtotal = !isEventBooking ? (effectiveChildPrice * guests.children) : 0;
  const baseTotal = isEventBooking
    ? parseFloat(data.price || 0) * totalGuests
    : adultSubtotal + childSubtotal;
  const rawBaseTotal = !isEventBooking
    ? (baseAdultPricePerPerson * guests.adults) + (baseChildPricePerChild * guests.children)
    : baseTotal;
  const finalTotal = baseTotal + addOnsTotal;
  const eventBaseTotal = eventGuestPricing.baseUnitPrice * totalGuests;
  const eventDiscountTotal = eventGuestPricing.discountAmount * totalGuests;
  const eventTaxTotal = eventGuestPricing.taxAmount * totalGuests;

  const clampGuestsToSeatLimit = useCallback((nextGuests) => {
    if (bookingGuestLimit === undefined) return nextGuests;

    const seatLimit = Math.max(0, bookingGuestLimit);
    const clamped = {
      ...nextGuests,
      adults: Math.max(0, asNumber(nextGuests?.adults) ?? 0),
      children: Math.max(0, asNumber(nextGuests?.children) ?? 0),
      infants: Math.max(0, asNumber(nextGuests?.infants) ?? 0),
    };

    if (seatLimit === 0) {
      clamped.adults = 0;
      clamped.children = 0;
      clamped.infants = 0;
      return clamped;
    }

    const overLimit = clamped.adults + clamped.children - seatLimit;
    if (overLimit > 0) {
      const childrenReduction = Math.min(clamped.children, overLimit);
      clamped.children -= childrenReduction;
      clamped.adults = Math.max(0, clamped.adults - (overLimit - childrenReduction));
    }

    if (clamped.infants > clamped.adults) clamped.infants = clamped.adults;
    return clamped;
  }, [bookingGuestLimit]);

  useEffect(() => {
    if (bookingGuestLimit === undefined) return;

    setGuests((current) => {
      const clamped = clampGuestsToSeatLimit(current);
      if (
        clamped.adults === current.adults &&
        clamped.children === current.children &&
        clamped.infants === current.infants
      ) {
        return current;
      }
      return clamped;
    });
  }, [bookingGuestLimit, clampGuestsToSeatLimit]);

  useEffect(() => {
    if (isEventBooking || childrenAllowed) return;
    setGuests((current) => (
      current.children === 0 ? current : { ...current, children: 0 }
    ));
  }, [childrenAllowed, isEventBooking]);

  const updateGuestsWithinSeatLimit = useCallback((updater) => {
    setGuests((current) => {
      const nextGuests = typeof updater === "function" ? updater(current) : updater;
      return clampGuestsToSeatLimit(nextGuests);
    });
  }, [clampGuestsToSeatLimit]);

  const adultMax = bookingGuestLimit !== undefined
    ? Math.max(bookingGuestLimit === 0 ? 0 : 1, bookingGuestLimit - (guests.children || 0))
    : undefined;
  const childMax = bookingGuestLimit !== undefined
    ? Math.max(0, bookingGuestLimit - (guests.adults || 0))
    : undefined;

  const handleReserve = async () => {
    if (!startDate) return;
    if (!isEventBooking && guestSeatLimit !== undefined && totalGuests > guestSeatLimit) {
      alert(`Only ${guestSeatLimit} seat${guestSeatLimit === 1 ? "" : "s"} available for this slot.`);
      return;
    }
    if (!isEventBooking && privateBooking && !selectedSlotPrivateBookingAvailable) {
      alert("Private booking is not available for this slot. Choose another slot.");
      return;
    }
    if (!isEventBooking && selectedSlotHasPrivateBooking) {
      alert("This slot already has a private booking. Choose another slot.");
      return;
    }
    localStorage.removeItem("pendingPayment");
    localStorage.removeItem("pendingOrderId");
    localStorage.removeItem("actualPaidAmount");
    localStorage.removeItem("razorpayPaymentSuccess");
    localStorage.removeItem("paymentFailed");

    if (isEventBooking) {
      if (!selectedTicket || selectedEventSlots.length === 0 || totalGuests < 1 || bookingLoading) return;
      if (!ticketSaleWindow.isOpen) {
        alert(ticketSaleWindow.message);
        return;
      }
      if (selectedTicketSoldOut) {
        alert("Ticket sold out.");
        return;
      }
      if (selectedTicketMaxPerBooking !== undefined && totalGuests > selectedTicketMaxPerBooking) {
        alert(`You can book a maximum of ${selectedTicketMaxPerBooking} ticket${selectedTicketMaxPerBooking === 1 ? "" : "s"} at a time.`);
        return;
      }
      if (selectedTicketRemainingTickets !== undefined && totalGuests > selectedTicketRemainingTickets) {
        alert(`Only ${selectedTicketRemainingTickets} ticket${selectedTicketRemainingTickets === 1 ? "" : "s"} remaining for this ticket type.`);
        return;
      }

      const dateStr = startDate.format("YYYY-MM-DD");
      const eventIdNum = asNumber(listing?.eventId ?? listing?.event_id ?? listing?.id ?? listing?.listingId) ?? 0;
      const eventSlotIdNum = getSlotId(selectedEventSlot);
      const eventSlotIds = selectedEventSlots.map((slot) => getSlotId(slot)).filter(Boolean);
      const ticketTypeId = getTicketId(selectedTicket);
      const ticketTypeName = getTicketName(selectedTicket);
      const pricePerTicket = asNumber(effectiveEventPrice.price) ?? 0;
      const customerDetails = (() => {
        const userInfoRaw = localStorage.getItem("userInfo");
        const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : {};
        return {
          firstName: userInfo?.firstName || localStorage.getItem("firstName") || "",
          lastName: userInfo?.lastName || localStorage.getItem("lastName") || "",
          email: userInfo?.email || localStorage.getItem("email") || "",
          phone: userInfo?.customerPhone || userInfo?.phoneNumber || userInfo?.phone || localStorage.getItem("phone") || localStorage.getItem("phoneNumber") || "",
        };
      })();

      if (!eventIdNum || !eventSlotIdNum || !ticketTypeId) {
        alert("Unable to book: event ticket or slot information is missing.");
        return;
      }

      const payload = {
        eventId: eventIdNum,
        eventSlotId: eventSlotIdNum,
        eventSlotIds,
        bookingDate: dateStr,
        numberOfGuests: totalGuests,
        customerDetails,
        tickets: [{
          ticketTypeId,
          ticketTypeName,
          quantity: totalGuests,
          pricePerTicket: Number(pricePerTicket.toFixed(2)),
        }],
        appliedDiscountCode: null,
        notes: null,
      };

      try {
        if (isMountedRef.current) setBookingLoading(true);
        const res = await createEventOrder(payload);
        const order = res?.order || res;
        const payment = res?.payment || res?.data?.payment || res?.order?.payment || order?.payment || null;
        const orderId = order?.orderId || order?.id || res?.orderId || res?.id;
        
        const extractedRZP = extractRazorpayCredentials(res);

        const razorpayOrderId = payment?.razorpayOrderId || order?.razorpayOrderId || res?.razorpayOrderId || order?.razorpay_order_id || res?.razorpay_order_id || extractedRZP.razorpayOrderId;
        const currency = listing?.currency || payment?.currency || "INR";
        const amountInPaise = payment?.amount || Math.round(finalTotal * 100);
        const razorpayKeyId =
          payment?.razorpayKeyId ||
          payment?.razorpay_key_id ||
          payment?.keyId ||
          order?.razorpayKeyId ||
          res?.razorpayKeyId ||
          order?.razorpay_key_id ||
          res?.razorpay_key_id ||
          order?.razorpayKey ||
          res?.razorpayKey ||
          order?.keyId ||
          res?.keyId ||
          extractedRZP.razorpayKeyId ||
          process.env.REACT_APP_RAZORPAY_KEY_ID ||
          getRazorpayKeyFromCache() ||
          "rzp_test_RaBjdu0Ed3p1gN";

        if (!razorpayOrderId) {
          console.error("❌ Razorpay Order ID missing from response:", res);
          alert("Payment initialization failed. Please contact support.");
          if (isMountedRef.current) setBookingLoading(false);
          return;
        }

        if (razorpayKeyId) {
          try { localStorage.setItem("lastRazorpayKeyId", razorpayKeyId); } catch (e) {}
        }

        const bookingData = {
          eventId: eventIdNum,
          eventSlotId: eventSlotIdNum,
          eventSlotIds,
          listingTitle: listing?.title || "Event Booking",
          listingImage: listing?.coverPhotoUrl || listing?.listingMedia?.[0]?.url || "",
          returnTo: `/event-details?id=${eventIdNum}`,
          bookingSummary: {
            date: dateStr,
            time: selectedEventSlots.map((slot) => slot.startTime || slot.slotName).filter(Boolean).join(", "),
            guestCount: totalGuests,
          },
          guests,
          priceDetails: {
            pricePerPerson: eventGuestPricing.finalUnitPrice,
            basePricePerTicket: pricePerTicket,
            totalPrice: finalTotal,
          },
          pricing: {
            currency,
            pricePerPerson: eventGuestPricing.finalUnitPrice,
            basePrice: eventBaseTotal,
            discount: eventDiscountTotal,
            discountRate: eventGuestPricing.discountRate,
            tax: eventTaxTotal,
            taxRate: eventGuestPricing.customerTaxRate,
            total: finalTotal,
            guestCount: totalGuests,
          },
          receipt: [
            {
              title: `${currency} ${eventGuestPricing.finalUnitPrice.toFixed(2)} x ${totalGuests} ${totalGuests === 1 ? "ticket" : "tickets"}`,
              content: `${currency} ${finalTotal.toFixed(2)}`,
            },
            {
              title: "Total",
              content: `${currency} ${finalTotal.toFixed(2)}`,
            },
          ],
          currency,
          finalTotal,
          ticketType: ticketTypeName,
          ticketTypeId,
          selectedSlot: selectedEventSlot,
          selectedSlots: selectedEventSlots,
        };

        const paymentData = {
          orderId,
          razorpayOrderId,
          razorpayKeyId,
          amount: amountInPaise,
          currency: payment?.currency || currency,
          paymentMethod: "razorpay",
          eventId: eventIdNum,
          eventSlotId: eventSlotIdNum,
          eventSlotIds,
          discount: payment?.discount || res?.discount || 0,
          finalAmount: payment?.finalAmount || amountInPaise,
        };

        localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
        localStorage.setItem("pendingPayment", JSON.stringify(paymentData));
        if (orderId) localStorage.setItem("pendingOrderId", String(orderId));
        localStorage.removeItem("razorpayPaymentSuccess");
        localStorage.removeItem("paymentFailed");

        history.replace("/experience-checkout", {
          bookingData,
          paymentData,
        });
      } catch (e) {
        console.error("Event booking failed:", e?.response?.data || e?.message || e);
        alert(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Booking failed. Please try again.");
      } finally {
        if (isMountedRef.current) setBookingLoading(false);
      }
      return;
    }
    
    const dateStr = startDate.format("YYYY-MM-DD");
    const slotId = getSlotId(selectedSlotData);
    const bookingTime = normalizeBookingTime(
      selectedSlotData?.startTime ||
      selectedSlotData?.slotStartTime ||
      selectedSlotData?.time ||
      startTime
    );

    if (!listingId || !slotId || !bookingTime) {
      alert("Unable to book: experience slot information is missing.");
      return;
    }

    const guestsObj = { ...guests, guests: totalGuests };
    const addOnQuantities = {};
    const receipt = [];
    
    // Adult row
    if (guests.adults > 0) {
      const adultLineTotal = parseFloat(extractedPrice || 0) * guests.adults;
      receipt.push({
        title: `₹${Number(extractedPrice || 0).toFixed(2)} × ${guests.adults} adult${guests.adults > 1 ? 's' : ''}`,
        content: `₹${adultLineTotal.toFixed(2)}`,
        kind: "base",
        showInCheckout: true
      });
    }
    // Child row (if children selected and child pricing applies)
    if (guests.children > 0) {
      const childLineTotal = effectiveChildPrice * guests.children;
      receipt.push({
        title: `₹${Number(effectiveChildPrice || 0).toFixed(2)} × ${guests.children} child${guests.children > 1 ? 'ren' : ''}`,
        content: `₹${childLineTotal.toFixed(2)}`,
        kind: "base-child",
        showInCheckout: true
      });
    }
    
    selectedAddOns.forEach(item => {
      const addon = item.addon || item;
      const id = addon.addonId || addon.id;
      const quantity = item.quantity || 1;
      addOnQuantities[id] = quantity;
      receipt.push({
        title: `${addon.title || "Add-on"} × ${quantity}`,
        content: `₹${((parseFloat(addon.price) || 0) * quantity).toFixed(2)}`,
        kind: "addon",
        showInCheckout: false
      });
    });

    receipt.push({
      title: "Total",
      content: `₹${finalTotal}`,
      kind: "total",
      showInCheckout: true
    });
    
    const bookingData = {
      listingId: listingId,
      listingTitle: listing?.title || listing?.name || "Experience",
      listingImage: listing?.coverPhotoUrl || listing?.listingMedia?.[0]?.url || "",
      hostName: listing?.host?.firstName ? `${listing?.host?.firstName} ${listing?.host?.lastName || ""}`.trim() : "Host",
      hostAvatar: listing?.host?.profilePhotoUrl || "/images/content/avatar.jpg",
      selectedDate: dateStr,
      selectedTimeSlot: startTime,
      guests: guestsObj,
      selectedAddOns: selectedAddOns.map(a => (a.addon?.addonId || a.addonId || a.id)),
      addOnQuantities: addOnQuantities,
      receipt: receipt,
      finalTotal: finalTotal,
      pricing: {
        currency: "INR",
        basePrice: rawBaseTotal,
        // Adult/child split for checkout page
        allowChildPricing: hasChildPricing,
        adultsCount: guests.adults,
        childrenCount: guests.children,
        pricePerPerson: parseFloat(extractedPrice || 0),
        basePricePerPerson: baseAdultPricePerPerson,
        adultBasePricePerPerson: baseAdultPricePerPerson,
        childPricePerChild: hasChildPricing ? effectiveChildPrice : 0,
        baseChildPricePerChild,
        discount: (experienceGuestPricing?.discountAmount ?? 0) * guests.adults
          + (childGuestPricing ? (childGuestPricing.discountAmount * guests.children) : 0),
        discountRate: experienceGuestPricing?.discountRate ?? 0,
        tax: (experienceGuestPricing?.taxAmount ?? 0) * guests.adults
          + (childGuestPricing ? (childGuestPricing.taxAmount * guests.children) : 0),
        taxRate: experienceGuestPricing?.customerTaxRate ?? 0,
        addonsTotal: addOnsTotal,
        subtotal: rawBaseTotal + addOnsTotal,
        total: finalTotal,
        guestCount: totalGuests,
      },
      bookingSummary: {
        date: dateStr,
        time: startTime,
        guestCount: totalGuests,
        billableGuestCount: totalGuests
      }
    };
    if (privateBooking) bookingData.privateBooking = true;

    const addons = selectedAddOns.map((item) => {
      const addon = item.addon || item;
      const addonId = addon.addonId || addon.id;
      if (!addonId) return null;
      return {
        addonId,
        addonName: addon.title || addon.name || addon.addonName || "Add-on",
        addonPrice: parseFloat(addon.price || addon.addonPrice || 0),
        quantity: addon.quantity || 1,
      };
    }).filter(Boolean);

    const userInfo = (() => {
      try {
        return JSON.parse(localStorage.getItem("userInfo") || "{}");
      } catch {
        return {};
      }
    })();

    const orderData = {
      listingId: Number(listingId),
      bookingDate: dateStr,
      bookingTime,
      bookingSlotId: Number(slotId),
      guestCount: totalGuests,
      childCount: guests.children || 0,
      childPricePerChild: Number(listing?.childPricePerChild || listing?.childPrice || 0),
      customer: {
        name: userInfo.name || (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") || "Guest User",
        email: userInfo.email || userInfo.customerEmail || "guest@example.com",
        phone: userInfo.customerPhone || userInfo.phoneNumber || userInfo.phone || "+911234567890",
      },
      specialRequests: "",
      paymentMethod: "razorpay",
      addons,
      guestAnswers: [],
    };
    if (privateBooking) orderData.privateBooking = true;

    try {
      if (isMountedRef.current) setBookingLoading(true);
      console.log("Creating experience order from BookingSystem:", orderData);
      const res = await createOrder(orderData);
      console.log("Experience order created from BookingSystem:", res);

      const order = res?.order || res?.data?.order || res;
      const payment = res?.payment || res?.data?.payment || order?.payment || null;
      const orderId = order?.orderId || order?.id || res?.orderId || res?.id || res?.data?.orderId || res?.data?.id;
      
      const extractedRZP = extractRazorpayCredentials(res);

      const razorpayOrderId =
        payment?.razorpayOrderId ||
        payment?.razorpay_order_id ||
        order?.razorpayOrderId ||
        order?.razorpay_order_id ||
        res?.razorpayOrderId ||
        res?.razorpay_order_id ||
        extractedRZP.razorpayOrderId;

      const razorpayKeyId =
        payment?.razorpayKeyId ||
        payment?.razorpay_key_id ||
        payment?.keyId ||
        order?.razorpayKeyId ||
        order?.razorpay_key_id ||
        res?.razorpayKeyId ||
        res?.razorpay_key_id ||
        extractedRZP.razorpayKeyId ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        getRazorpayKeyFromCache() ||
        "rzp_test_RaBjdu0Ed3p1gN";
      const currency = payment?.currency || order?.currency || res?.currency || "INR";
      const amountInPaise = payment?.amount || order?.amount || res?.amount || Math.round(finalTotal * 100);

      if (!razorpayOrderId) {
        alert("Payment order was not created. Please try booking again.");
        return;
      }

      const paymentData = {
        orderId,
        razorpayOrderId,
        razorpayKeyId,
        amount: amountInPaise,
        currency,
        paymentMethod: "razorpay",
        discount: payment?.discount || res?.discount || 0,
        finalAmount: payment?.finalAmount || amountInPaise,
        paidAmount: payment?.paidAmount || payment?.finalAmount || amountInPaise,
      };

      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));
      localStorage.setItem("pendingPayment", JSON.stringify(paymentData));
      if (orderId) localStorage.setItem("pendingOrderId", String(orderId));
      if (razorpayKeyId) localStorage.setItem("lastRazorpayKeyId", razorpayKeyId);

      history.push({
        pathname: "/experience-checkout",
        search: `?listingId=${listingId}&startDate=${dateStr}&guests=${totalGuests}${startTime ? `&startTime=${encodeURIComponent(startTime)}` : ""}`,
        state: {
          addOns: selectedAddOns.map(item => item.addon || item),
          bookingData,
          paymentData,
        }
      });
    } catch (e) {
      console.error("Experience booking failed:", e?.response?.data || e?.message || e);
      alert(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Booking failed. Please try again.");
    } finally {
      if (isMountedRef.current) setBookingLoading(false);
    }
  };

  const IconComp = data.icon;
  const canReserve = isEventBooking
    ? Boolean(ticketSaleWindow.isOpen && startDate && selectedTicket && selectedEventSlots.length > 0 && getSlotId(selectedEventSlots[0]) && totalGuests >= 1 && (selectedTicketMaxPerBooking === undefined || totalGuests <= selectedTicketMaxPerBooking) && (selectedTicketRemainingTickets === undefined || totalGuests <= selectedTicketRemainingTickets) && !selectedTicketSoldOut && !eventAvailabilityLoading && !bookingLoading)
    : Boolean(startDate && selectedSlotData && startTime && totalGuests >= 1 && (guestSeatLimit === undefined || totalGuests <= guestSeatLimit) && (!privateBooking || selectedSlotPrivateBookingAvailable) && !selectedSlotHasPrivateBooking && !bookingLoading);
  const triggerDisabled = isEventBooking && !ticketSaleWindow.isOpen;

  const handleOpenBooking = useCallback(() => {
    if (triggerDisabled) return;
    setShow(true);

    if (isEventBooking || !listingId || !slotsLookupEndDate) return;

    const todayKey = getDateKey(new Date());
    getListingSlots(listingId, todayKey, slotsLookupEndDate)
      .then((payload) => {
        if (!isMountedRef.current || selectedDateKey !== todayKey) return;
        const normalized = normalizeExperienceSlots(unwrapSlotsPayload(payload), todayKey);
        setDateFilteredSlots(normalized);
        setDateFilteredSlotsLoaded(true);
      })
      .catch((error) => {
        console.warn("Could not preload slots on reserve click:", error?.response?.data || error?.message || error);
      });
  }, [isEventBooking, listingId, selectedDateKey, slotsLookupEndDate, triggerDisabled]);

  // Check if all experience dates/slots are in the past
  const isExperienceClosed = useMemo(() => {
    if (isEventBooking) return false;
    if (experienceAvailableDateKeys.size === 0) return false; // no date info, don't block
    const todayKey = moment().format("YYYY-MM-DD");
    // If every available date key is strictly before today, it's closed
    return [...experienceAvailableDateKeys].every(key => key < todayKey);
  }, [isEventBooking, experienceAvailableDateKeys]);

  return (
    <>
      <style>{`
        .SingleDatePicker_picker,
        .SingleDatePickerPortal,
        .DateRangePicker_picker,
        .DateRangePickerPortal,
        .ReactDatesPortal {
          z-index: 99999 !important;
        }
      `}</style>
      {/* Floating Trigger */}
      <motion.button
        onClick={handleOpenBooking}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={triggerDisabled ? undefined : { scale: 1.05 }}
        whileTap={triggerDisabled ? undefined : { scale: 0.95 }}
        disabled={triggerDisabled}
        title={triggerDisabled ? ticketSaleWindow.message : undefined}
        style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          background: A,
          color: "#FFF",
          padding: "12px 24px",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
          border: "none",
          cursor: triggerDisabled ? "not-allowed" : "pointer",
          zIndex: 1000,
          fontWeight: 600,
          fontSize: 14,
          opacity: triggerDisabled ? 0.76 : 1
        }}
      >
        <IconComp size={18} />
        {triggerDisabled ? (ticketSaleWindow.status === "upcoming" ? "Booking Not Open" : "Booking Closed") : triggerLabel}
      </motion.button>
      {triggerDisabled && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 30,
            maxWidth: 320,
            background: BG,
            color: FG,
            border: `1px solid ${B}`,
            borderRadius: 16,
            padding: "12px 16px",
            boxShadow: "0 15px 35px rgba(0,0,0,0.14)",
            zIndex: 1000,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.45,
          }}
        >
          {ticketSaleWindow.message}
        </div>
      )}

      <AnimatePresence>
        {show && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }} 
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                position: "relative",
                width: "95%",
                maxWidth: 850,
                background: BG,
                borderRadius: 32,
                boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
                border: `1px solid ${B}`,
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <div style={{ padding: "32px 40px", borderBottom: `1px solid ${B}88`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: A, marginBottom: 8 }}>
                    {isEventBooking ? "Reserve Your Event" : "Reserve Your Experience"}
                  </h2>
                  {isEventBooking && ticketSaleWindow.message && (
                    <p style={{ fontSize: 12, color: ticketSaleWindow.isOpen ? M : "#d14343", fontWeight: 700, marginBottom: 8 }}>
                      {ticketSaleWindow.message}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    {(() => {
                      const gp = isEventBooking ? eventGuestPricing : experienceGuestPricing;
                      const hasDiscount = gp && gp.discountRate > 0;
                      const baseDisplayPrice = gp ? gp.baseUnitPrice : Number(data.price || 0);
                      const discountedDisplayPrice = gp ? gp.priceAfterDiscount : Number(data.price || 0);
                      return (
                        <>
                          {hasDiscount && baseDisplayPrice != null && (
                            <span style={{ fontSize: 20, fontWeight: 600, color: M, textDecoration: "line-through" }}>
                              ₹{Number(baseDisplayPrice).toFixed(2)}
                            </span>
                          )}
                          <span style={{ fontSize: 32, fontWeight: 800, color: FG }}>₹{Number(discountedDisplayPrice || 0).toFixed(2)}</span>
                          <span style={{ fontSize: 14, color: M, fontWeight: 500 }}>per {data.unit}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <button onClick={() => setShow(false)} style={{ background: S, border: `1px solid ${B}`, padding: 12, borderRadius: 100, cursor: "pointer", color: FG, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s" }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Closed state — all dates have passed */}
              {isExperienceClosed ? (
                <div style={{ padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${B}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Clock size={32} color={M} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: FG }}>This experience is closed</div>
                  <div style={{ fontSize: 14, color: M, fontWeight: 500, maxWidth: 340, lineHeight: 1.6 }}>
                    All available dates and time slots for this experience have passed. Please check back later or contact the host for upcoming schedules.
                  </div>
                  <button
                    onClick={() => setShow(false)}
                    style={{ marginTop: 8, padding: "12px 32px", background: A, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 1, background: B }}>
                {/* Left Column: Date & Ticket */}
                <div style={{ padding: "40px", background: BG, display: "flex", flexDirection: "column", gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.1em" }}>01. Select Date</div>
                    {isEventBooking ? (
                      <EventInlineCalendar
                        selectedDate={startDate}
                        onDateSelect={setStartDate}
                        availableDateKeys={eventAvailableDateKeys}
                        tokens={{ A, AL, BG, FG, M, B, S, W }}
                        emptyMessage="No available dates for this event."
                      />
                    ) : (
                      <EventInlineCalendar
                        selectedDate={startDate}
                        onDateSelect={setStartDate}
                        availableDateKeys={experienceAvailableDateKeys}
                        tokens={{ A, AL, BG, FG, M, B, S, W }}
                        emptyMessage="No available dates for this experience."
                      />
                    )}
                  </div>

                  {isEventBooking && (
                    <div>
                      <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.1em" }}>02. Ticket Type</div>
                      {eventTickets.length > 0 ? (
                        <div style={{ position: "relative" }}>
                          <select
                            value={selectedTicketTypeId}
                            onChange={(e) => {
                              setSelectedTicketTypeId(e.target.value);
                              setSelectedEventSlotIds([]);
                              setStartTime(null);
                            }}
                            style={{
                              width: "100%",
                              appearance: "none",
                              padding: "16px 20px",
                              borderRadius: 16,
                              border: `1px solid ${B}`,
                              background: S,
                              color: FG,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                              outline: "none"
                            }}
                          >
                            {eventTickets.map((ticket, index) => {
                              const ticketId = String(ticket.id ?? ticket.ticketTypeId ?? ticket.typeId ?? `ticket-${index}`);
                              const ticketBasePrice = getTicketPrice(ticket, 0);
                              const ticketEffectivePrice = getEffectiveTicketPrice(ticket, totalGuests, ticketBasePrice).price;
                              const ticketGuestPrice = calculateEventGuestPricing(ticketEffectivePrice, listing?.pricing).finalUnitPrice;
                              return (
                                <option key={ticketId} value={ticketId}>
                                  {getTicketName(ticket, index)} - ₹{Number(ticketGuestPrice || 0).toFixed(2)}
                                </option>
                              );
                            })}
                          </select>
                          <ChevronDown size={18} color={M} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          {eventAvailabilityLoading && (
                            <div style={{ marginTop: 10, fontSize: 12, color: M, fontWeight: 700 }}>
                              Checking ticket availability...
                            </div>
                          )}
                          {!eventAvailabilityLoading && selectedTicketSoldOut && (
                            <div style={{ marginTop: 10, fontSize: 12, color: "#d14343", fontWeight: 800 }}>
                              Ticket sold out.
                            </div>
                          )}
                          {!eventAvailabilityLoading && !selectedTicketSoldOut && (selectedTicketAvailabilityTotal !== undefined || selectedTicketRemainingTickets !== undefined) && (
                            <div style={{ marginTop: 10, fontSize: 12, color: M, fontWeight: 700 }}>
                              {selectedTicketRemainingTickets !== undefined ? `Remaining tickets: ${selectedTicketRemainingTickets}` : "Remaining tickets: --"}
                              {selectedTicketAvailabilityTotal !== undefined ? ` / Total tickets: ${selectedTicketAvailabilityTotal}` : ""}
                            </div>
                          )}
                          {eventAvailabilityError && (
                            <div style={{ marginTop: 4, fontSize: 12, color: "#d14343", fontWeight: 600 }}>
                              {eventAvailabilityError}
                            </div>
                          )}
                          {selectedTicketMaxPerBooking !== undefined && (
                            <div style={{ marginTop: 4, fontSize: 12, color: M, fontWeight: 600 }}>
                              Maximum {selectedTicketMaxPerBooking} per booking.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: "16px", background: S, borderRadius: 16, fontSize: 13, color: M }}>No ticket types available.</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Slots & Guests */}
                <div style={{ padding: "40px", background: S, display: "flex", flexDirection: "column", gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.1em" }}>{isEventBooking ? "03. Choose Slot" : "02. Select Time"}</div>
                    
                    {isEventBooking ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {eventSlots.length > 0 ? eventSlots.map((slot, index) => {
                          const slotId = String(slot.eventSlotId ?? slot.id);
                          const slotKeys = new Set();
                          addDateRangeKeys(slotKeys, slot.slotStartDate || slot.slotDate || slot.date || slot.eventDate || slot.startDate, slot.slotEndDate || slot.endDate || slot.end_date);
                          const isDateValid = slotKeys.size === 0 || slotKeys.has(selectedDateKey);
                          const isDisabled = !isEventSlotAccessible(slot, index) || !isDateValid;
                          const isSelected = selectedEventSlotIds.includes(slotId);
                          return (
                            <button
                              key={slotId}
                              disabled={isDisabled}
                              onClick={() => {
                                if (isDisabled) return;
                                if (canSelectMultipleEventSlots) {
                                  setSelectedEventSlotIds(cur => cur.includes(slotId) ? cur.filter(id => id !== slotId) : [...cur, slotId]);
                                } else {
                                  setSelectedEventSlotIds([slotId]);
                                  setStartTime(slot.slotName);
                                }
                              }}
                              style={{
                                padding: "14px",
                                borderRadius: 16,
                                border: `1.5px solid ${isSelected ? A : B}`,
                                background: isSelected ? AL : BG,
                                color: isSelected ? A : FG,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.4 : 1,
                                textAlign: "center",
                                transition: "0.2s"
                              }}
                            >
                              {slot.slotName}
                              {slot.endTime && <span style={{ display: "block", fontSize: 10, opacity: 0.7, marginTop: 2 }}>{slot.endTime}</span>}
                            </button>
                          );
                        }) : <div style={{ gridColumn: "span 2", padding: "20px", textAlign: "center", color: M }}>No slots available</div>}
                      </div>
                    ) : (
                      <div style={{ position: "relative" }}>
                        <div 
                          onClick={() => setShowTimePicker(!showTimePicker)}
                          style={{ padding: "16px 20px", background: BG, border: `1px solid ${B}`, borderRadius: 16, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 600, color: startTime ? FG : M }}>{startTime || "Select Time"}</span>
                          <ChevronDown size={18} color={M} />
                        </div>
                        {showTimePicker && (
                          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 100, background: BG, border: `1px solid ${B}`, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", padding: "8px" }}>
                            <TimeSlotsPicker 
                              visible={true}
                              onClose={() => setShowTimePicker(false)}
                              onTimeSelect={(t) => { setStartTime(t); setShowTimePicker(false); }}
                              selectedTime={startTime}
                              timeSlots={timeSlots}
                              selectedDate={startDate}
                              plain
                            />
                          </div>
                        )}
                        {slotsLoading && (
                          <div style={{ marginTop: 10, fontSize: 12, color: M, fontWeight: 700 }}>
                            Checking slot availability...
                          </div>
                        )}
                        {slotsError && (
                          <div style={{ marginTop: 10, fontSize: 12, color: "#d14343", fontWeight: 700 }}>
                            {slotsError}
                          </div>
                        )}
                        {!slotsLoading && !slotsError && privateBookingMessage && (
                          <div style={{ marginTop: 10, fontSize: 12, color: M, fontWeight: 700 }}>
                            {privateBookingMessage}
                          </div>
                        )}
                        {showPrivateBookingToggle && (
                          <button
                            type="button"
                            onClick={() => setPrivateBooking((value) => !value)}
                            style={{
                              marginTop: 12,
                              width: "100%",
                              padding: "14px 16px",
                              borderRadius: 16,
                              border: `1px solid ${privateBooking ? A : B}`,
                              background: privateBooking ? AL : BG,
                              color: privateBooking ? A : FG,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              fontSize: 13,
                              fontWeight: 800
                            }}
                          >
                            <span>Private booking</span>
                            <span
                              style={{
                                width: 42,
                                height: 24,
                                borderRadius: 999,
                                background: privateBooking ? A : B,
                                padding: 3,
                                display: "flex",
                                justifyContent: privateBooking ? "flex-end" : "flex-start",
                                transition: "0.2s"
                              }}
                            >
                              <span style={{ width: 18, height: 18, borderRadius: "50%", background: W, display: "block" }} />
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.1em" }}>{isEventBooking ? "04. Guests" : "03. Guests"}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>Adults</span>
                        <Counter
                          value={guests.adults}
                          setValue={(v) => updateGuestsWithinSeatLimit(p => ({ ...p, adults: v }))}
                          min={0}
                          max={adultMax}
                        />
                      </div>
                      {(isEventBooking || childrenAllowed) && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>Children</span>
                          <Counter
                            value={guests.children}
                            setValue={(v) => updateGuestsWithinSeatLimit(p => ({ ...p, children: v }))}
                            min={0}
                            max={childMax}
                          />
                        </div>
                      )}
                    </div>
                    {guestSeatLimit !== undefined && (
                      <div style={{ marginTop: 10, fontSize: 12, color: M, fontWeight: 600 }}>
                        Maximum {guestSeatLimit} seat{guestSeatLimit === 1 ? "" : "s"} for this slot.
                      </div>
                    )}
                    {isEventBooking && selectedTicketMaxPerBooking !== undefined && (
                      <div style={{ marginTop: 10, fontSize: 12, color: M, fontWeight: 600 }}>
                        Maximum {selectedTicketMaxPerBooking} ticket{selectedTicketMaxPerBooking === 1 ? "" : "s"} per booking.
                      </div>
                    )}
                    {isEventBooking && effectiveEventPrice.tier && (
                      <div style={{ marginTop: 8, fontSize: 12, color: A, fontWeight: 800 }}>
                        Group price applied: ₹{Number(effectiveEventPrice.price || 0).toFixed(2)} base per ticket.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Button */}
              <div style={{ padding: "32px 40px", background: BG, borderTop: `1px solid ${B}88`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 11, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Total amount</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: FG }}>₹{Number(finalTotal || 0).toFixed(2)}</span>
                  <span style={{ marginTop: 4, fontSize: 11, color: M, fontWeight: 600 }}>Including all taxes.</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!canReserve || bookingLoading}
                  onClick={handleReserve}
                  style={{
                    padding: "18px 48px",
                    background: canReserve ? A : B,
                    color: "#FFF",
                    borderRadius: 16,
                    border: "none",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: canReserve ? "pointer" : "not-allowed",
                    boxShadow: canReserve ? `0 10px 30px ${A}44` : "none",
                    transition: "0.3s"
                  }}
                >
                  {bookingLoading ? "Processing..." : reserveLabel}
                </motion.button>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 40px 32px", color: M, fontSize: 12, background: BG }}>
                <ShieldCheck size={14} />
                <span>Secure payment processed by Little Known Planet</span>
              </div>
              </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
