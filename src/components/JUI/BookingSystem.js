import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Ticket, ChefHat, Bed, X, Sparkles, Clock, Users, Star, Plus, Minus, CheckCircle2, ShieldCheck, ChevronDown, Info, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";

import TimeSlotsPicker from "../TimeSlotsPicker";
import Counter from "../Counter";
import { createEventOrder, createOrder, getEventSlotAvailability, getListingSlots, precheckEventOrder } from "../../utils/api";
import LoginPromptModal from "../LoginPromptModal";


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

const asOptionalBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
};

const getSlotSeatLimit = (slot) => {
  if (!slot) return undefined;
  const total = asSeatLimit(slot?.maxSeats) ??
    asSeatLimit(slot?.max_seats) ??
    asSeatLimit(slot?.capacity?.maxSeats) ??
    asSeatLimit(slot?.capacity?.max_seats) ??
    asSeatLimit(slot?.totalSeats) ??
    asSeatLimit(slot?.total_seats);

  const avail = slot?.selectedDateAvailability || {};
  const cap = slot?.capacity || {};

  const booked = asNumber(slot?.bookedSeats) ??
    asNumber(slot?.booked_seats) ??
    asNumber(slot?.soldSeats) ??
    asNumber(slot?.sold_seats) ??
    asNumber(slot?.booked) ??
    asNumber(slot?.sold) ??
    asNumber(cap?.bookedSeats) ??
    asNumber(cap?.booked_seats) ??
    asNumber(cap?.booked) ??
    asNumber(avail?.booked_seats) ??
    asNumber(avail?.bookedSeats) ??
    asNumber(avail?.sold_seats) ??
    asNumber(avail?.soldSeats) ??
    asNumber(avail?.booked);

  const explicitRemaining = asSeatLimit(slot?.availableSeats) ??
    asSeatLimit(slot?.available_seats) ??
    asSeatLimit(slot?.remainingSeats) ??
    asSeatLimit(slot?.remaining_seats) ??
    asSeatLimit(avail?.available_seats) ??
    asSeatLimit(avail?.availableSeats) ??
    asSeatLimit(avail?.remaining_seats) ??
    asSeatLimit(avail?.remainingSeats);

  if (total != null && booked != null) {
    return Math.max(0, total - booked);
  }

  if (explicitRemaining != null) {
    return Math.max(0, explicitRemaining);
  }

  return total;
};

const getSlotId = (slot) => {
  if (slot === null || slot === undefined) return null;
  const raw = typeof slot === "object"
    ? (slot.eventSlotId ?? slot.event_slot_id ?? slot.slotId ?? slot.slot_id ?? slot.id)
    : slot;
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
};

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
    .map((value) => {
      if (value == null) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    })
    .filter((value) => value != null);
  const label = String(getSlotLabel(slot, index) || "").trim().toLowerCase();
  return [
    ...ids.map((id) => `id:${id}`),
    label ? `label:${label}` : null,
  ].filter(Boolean);
};

const getTicketId = (ticket) => {
  if (ticket === null || ticket === undefined) return null;
  const raw = ticket.ticketTypeId ?? ticket.ticket_type_id ?? ticket.typeId ?? ticket.id;
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
};

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

  const promoDiscountRate = getRateFromPricing(
    discount.customer,
    discount.guest,
    discount.total,
    pricing?.discountRate,
    pricing?.discount
  );

  let earlyBirdDiscountRate = 0;

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
      earlyBirdDiscountRate = (asNumber(bestDiscount.percentage) ?? 0);
    }
  }

  const discountRate = promoDiscountRate + earlyBirdDiscountRate;
  const customerTaxRate = getRateFromPricing(
    tax.customer,
    tax.guest,
    pricing?.customerTax,
    pricing?.customerTaxRate,
    pricing?.taxRate,
    tax.total
  );

  const discountAmount = baseUnitPrice * (discountRate / 100);
  const promoDiscountAmount = baseUnitPrice * (promoDiscountRate / 100);
  const earlyBirdDiscountAmount = baseUnitPrice * (earlyBirdDiscountRate / 100);

  const priceAfterDiscount = Math.max(0, baseUnitPrice - discountAmount);
  const taxAmount = priceAfterDiscount * (customerTaxRate / 100);
  const finalUnitPrice = priceAfterDiscount + taxAmount;

  return {
    baseUnitPrice,
    discountRate,
    discountAmount,
    promoDiscountRate,
    promoDiscountAmount,
    earlyBirdDiscountRate,
    earlyBirdDiscountAmount,
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

  // Supports: "HH:mm", "HH:mm:ss", "h:mm AM/PM", and ISO datetime strings.
  let hours = null;
  let minutes = null;
  let seconds = 0;

  const ampmMatch = raw.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = Number(ampmMatch[1]);
    const m = Number(ampmMatch[2]);
    const s = Number(ampmMatch[3] || 0);
    const marker = String(ampmMatch[4]).toUpperCase();
    if (marker === "PM" && h < 12) h += 12;
    if (marker === "AM" && h === 12) h = 0;
    hours = h;
    minutes = m;
    seconds = s;
  }

  if (hours == null || minutes == null) {
    const timeOnlyMatch = raw.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (timeOnlyMatch) {
      hours = Number(timeOnlyMatch[1]);
      minutes = Number(timeOnlyMatch[2]);
      seconds = Number(timeOnlyMatch[3] || 0);
    }
  }

  if (hours == null || minutes == null) {
    const isoLikeMatch = raw.match(/T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (isoLikeMatch) {
      hours = Number(isoLikeMatch[1]);
      minutes = Number(isoLikeMatch[2]);
      seconds = Number(isoLikeMatch[3] || 0);
    }
  }

  if (hours == null || minutes == null) return "";

  const hh = String(Math.min(Math.max(Number(hours) || 0, 0), 23)).padStart(2, "0");
  const mm = String(Math.min(Math.max(Number(minutes) || 0, 0), 59)).padStart(2, "0");
  const ss = String(Math.min(Math.max(Number(seconds) || 0, 0), 59)).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

/**
 * Robustly format a "HH:mm[:ss]" string into "h:mm AM/PM".
 * Returns the original string if it doesn't match the time format.
 */
const formatTime12h = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return timeStr;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return timeStr;

  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
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
  const safeSource = source && typeof source === "object" ? source : {};
  const schedule = safeSource.schedule && typeof safeSource.schedule === "object" ? safeSource.schedule : {};
  const selectedDays = safeSource.selected_days || safeSource.selectedDays || schedule.selected_days || schedule.selectedDays;
  if (!Array.isArray(selectedDays) || selectedDays.length === 0) return null;
  return new Set(selectedDays.map((day) => String(day).trim().toUpperCase()).filter(Boolean));
};

const hasWeekdayFlags = (source = {}) => (
  (() => {
    const safeSource = source && typeof source === "object" ? source : {};
    return [
      safeSource.isSunday,
      safeSource.isMonday,
      safeSource.isTuesday,
      safeSource.isWednesday,
      safeSource.isThursday,
      safeSource.isFriday,
      safeSource.isSaturday,
      safeSource.is_sunday,
      safeSource.is_monday,
      safeSource.is_tuesday,
      safeSource.is_wednesday,
      safeSource.is_thursday,
      safeSource.is_friday,
      safeSource.is_saturday,
    ].some((value) => value === true || value === false);
  })()
);

const isWeekdayEnabled = (source = {}, weekday) => {
  const safeSource = source && typeof source === "object" ? source : {};
  const selectedDayCodes = getSelectedDayCodes(safeSource);
  if (selectedDayCodes) return selectedDayCodes.has(WEEKDAY_CODES[weekday]);

  const flags = [
    [safeSource.isSunday, safeSource.is_sunday],
    [safeSource.isMonday, safeSource.is_monday],
    [safeSource.isTuesday, safeSource.is_tuesday],
    [safeSource.isWednesday, safeSource.is_wednesday],
    [safeSource.isThursday, safeSource.is_thursday],
    [safeSource.isFriday, safeSource.is_friday],
    [safeSource.isSaturday, safeSource.is_saturday],
  ];
  const values = flags[weekday] || [];
  const explicit = values.find((value) => value === true || value === false);
  return explicit !== false;
};

const addScheduleDateKeys = (keys, source = {}, fallback = {}) => {
  const safeSource = source && typeof source === "object" ? source : {};
  const safeFallback = fallback && typeof fallback === "object" ? fallback : {};
  const schedule = safeSource.schedule && typeof safeSource.schedule === "object" ? safeSource.schedule : {};
  const startKey = getDateKey(
    safeSource.startDate ||
    safeSource.start_date ||
    safeSource.slotStartDate ||
    safeSource.slot_start_date ||
    safeSource.availableFrom ||
    safeSource.available_from ||
    safeSource.bookingStartDate ||
    safeSource.booking_start_date ||
    schedule.startDate ||
    schedule.start_date ||
    safeFallback.startDate ||
    safeFallback.start_date ||
    safeFallback.bookingStartDate
  );
  const endKey = getDateKey(
    safeSource.endDate ||
    safeSource.end_date ||
    safeSource.slotEndDate ||
    safeSource.slot_end_date ||
    safeSource.availableTo ||
    safeSource.available_to ||
    safeSource.bookingEndDate ||
    safeSource.booking_end_date ||
    schedule.endDate ||
    schedule.end_date ||
    safeFallback.endDate ||
    safeFallback.end_date ||
    safeFallback.bookingEndDate ||
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
  const shouldFilterByWeekday = Boolean(getSelectedDayCodes(safeSource)) || hasWeekdayFlags(safeSource);

  while (current <= last) {
    if (!shouldFilterByWeekday || isWeekdayEnabled(safeSource, current.getDay())) {
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

const collectFullyBookedSlotIdsForDate = (listing, dateKey) => {
  if (!dateKey) return new Set();
  const rows = Array.isArray(listing?.fullyBookedSlots) ? listing.fullyBookedSlots : [];
  const blocked = new Set();

  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    const bookedDates = Array.isArray(row.bookedDates)
      ? row.bookedDates
      : (Array.isArray(row.booked_dates) ? row.booked_dates : []);
    const isBlockedOnDate = bookedDates.some((d) => getDateKey(d) === dateKey);
    if (!isBlockedOnDate) return;
    const slotId = getSlotId(row);
    if (slotId != null) blocked.add(String(slotId));
  });

  return blocked;
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

function EventInlineCalendar({ selectedDate, onDateSelect, availableDateKeys, tokens, emptyMessage = "No available dates.", hasTodayValidSlots }) {
  const { A, AL, BG, FG, M, B, S, W } = tokens;
  const getInitialViewDate = useCallback(() => {
    if (selectedDate && typeof selectedDate.toDate === "function") return selectedDate.toDate();
    if (selectedDate) return makeLocalDate(getDateKey(selectedDate));

    const todayKey = getDateKey(new Date());
    const availableKeys = [...availableDateKeys]
      .filter((key) => {
        if (key < todayKey) return false;
        if (key === todayKey) return Boolean(hasTodayValidSlots);
        return true;
      })
      .sort();
    const currentMonthPrefix = todayKey.slice(0, 7);
    const currentMonthKey = availableKeys.find((key) => key.slice(0, 7) === currentMonthPrefix);
    const firstAvailableKey = currentMonthKey || availableKeys[0];
    return firstAvailableKey ? makeLocalDate(firstAvailableKey) : new Date();
  }, [availableDateKeys, selectedDate, hasTodayValidSlots]);
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
      const isToday = key === todayKey;
      // Mark as unavailable if it's in the past OR if it's today and today has no valid slots
      const isAvailable = !isPast && availableDateKeys.has(key) && (isToday ? Boolean(hasTodayValidSlots) : true);
      return { day, key, isAvailable, isPast, isToday };
    }),
  ];

  return (
    <div style={{ background: S, borderRadius: 16, padding: 8, border: `1px solid ${B}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          disabled={isViewingCurrentOrPastMonth}
          style={{ width: 28, height: 28, borderRadius: 999, border: `1px solid ${B}`, background: BG, color: isViewingCurrentOrPastMonth ? `${M}44` : FG, cursor: isViewingCurrentOrPastMonth ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isViewingCurrentOrPastMonth ? 0.4 : 1 }}
        >
          <ChevronDown size={15} style={{ transform: "rotate(90deg)" }} />
        </button>
        <div style={{ fontSize: 12, fontWeight: 800, color: FG }}>
          {viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ width: 28, height: 28, borderRadius: 999, border: `1px solid ${B}`, background: BG, color: FG, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronDown size={15} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2 }}>
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
              onClick={() => onDateSelect(isSelected ? null : moment(cell.key))}
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

export function BookingSystem({ listing, type = "experience", selectedAddOns = [], triggerLabel = "Reserve Now", reserveLabel = "Reserve Experience", onUpdateAddonQuantity }) {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W, E, EL } } = useTheme();
  const isMountedRef = useRef(true);
  const hasHandledUnavailableRef = useRef(false);
  const [show, setShow] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Real State management
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0 });
  const totalGuests = guests.adults + guests.children;
  const billableAdults = guests.adults;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateFilteredSlots, setDateFilteredSlots] = useState([]);
  const [dateFilteredSlotsLoaded, setDateFilteredSlotsLoaded] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [privateBooking, setPrivateBooking] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, title: "", message: "" });




  const isEventBooking = type === "event";

  const getBusinessInterestLabel = useCallback(() => {
    const normalizedType = String(type || "").trim().toLowerCase();
    const normalizedInterest = String(
      listing?.businessInterestCode ||
      listing?.businessInterest ||
      listing?.business_interest_code ||
      listing?.business_interest ||
      ""
    ).trim().toLowerCase();

    const key = normalizedType || normalizedInterest;
    if (key.includes("event")) return "Event";
    if (key.includes("stay")) return "Stay";
    if (key.includes("food")) return "Food";
    if (key.includes("place")) return "Place";
    if (key.includes("experience")) return "Experience";
    return "Listing";
  }, [listing?.businessInterest, listing?.businessInterestCode, listing?.business_interest, listing?.business_interest_code, type]);

  const getBookingErrorMessage = useCallback((error) => {
    const apiMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "";
    const normalizedMessage = String(apiMessage);

    const hasUnavailableStatus =
      /status\s*:\s*disabled/i.test(normalizedMessage) ||
      /status\s*:\s*draft/i.test(normalizedMessage);

    if (hasUnavailableStatus) {
      return `${getBusinessInterestLabel()} no longer available.`;
    }

    return normalizedMessage || "Booking failed. Please try again.";
  }, [getBusinessInterestLabel]);

  const showErrorPopup = useCallback((message, title = "Booking Error") => {
    setErrorPopup({
      visible: true,
      title,
      message: String(message || "Unable to proceed with this booking right now."),
    });
  }, []);

  useEffect(() => {
    const rawStatus = listing?.status || listing?.listingStatus || listing?.state || "";
    const normalizedStatus = String(rawStatus).trim().toUpperCase();
    const isUnavailable = normalizedStatus === "DISABLED" || normalizedStatus === "DRAFT";

    if (!isUnavailable || hasHandledUnavailableRef.current) return;
    hasHandledUnavailableRef.current = true;

    alert(`${getBusinessInterestLabel()} no longer available.`);
    history.replace("/");
  }, [getBusinessInterestLabel, history, listing?.listingStatus, listing?.state, listing?.status]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const eventTickets = useMemo(() => {
    if (!isEventBooking) return [];
    if (Array.isArray(listing?.ticketTypes)) return listing.ticketTypes;
    if (Array.isArray(listing?.tickets)) return listing.tickets;
    if (Array.isArray(listing?.ticketTiers)) return listing.ticketTiers;
    return [];
  }, [isEventBooking, listing?.ticketTypes, listing?.tickets, listing?.ticketTiers]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [isTicketDropdownOpen, setIsTicketDropdownOpen] = useState(false);
  const [selectedEventSlotIds, setSelectedEventSlotIds] = useState([]);
  const selectedEventSlotId = selectedEventSlotIds[0] || "";

  // Rehydrate booking selection state if returning from successful authentication redirect
  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem("frontendPendingBookingState");
      if (storedRaw) {
        const stored = JSON.parse(storedRaw);
        const currentListingId = String(listing?.listingId || listing?.id || listing?.eventId || listing?.stayId);
        const token = localStorage.getItem("jwtToken");
        const isLoggedIn = !!token && token !== "undefined" && token !== "null";

        if (stored?.listingId === currentListingId && isLoggedIn) {
          console.log("🔄 Restoring persistent booking state after auth redirect:", stored);
          if (stored.startDate) {
            const parsedDate = moment(stored.startDate);
            const todayKey = moment().format("YYYY-MM-DD");
            if (parsedDate.isValid() && parsedDate.format("YYYY-MM-DD") !== todayKey) {
              setStartDate(parsedDate);
            }
          }
          if (stored.startTime !== undefined) setStartTime(stored.startTime);
          if (stored.guests) setGuests(stored.guests);
          if (stored.selectedTicketTypeId !== undefined) setSelectedTicketTypeId(stored.selectedTicketTypeId);
          if (stored.selectedEventSlotIds) setSelectedEventSlotIds(stored.selectedEventSlotIds);
          if (stored.privateBooking !== undefined) setPrivateBooking(stored.privateBooking);

          // Clear so it does not persist across future completely independent user visits
          localStorage.removeItem("frontendPendingBookingState");

          // Open the booking form automatically to deliver a flawless, continuous UX
          setShow(true);
        }
      }
    } catch (e) {
      console.error("Failed to restore booking state:", e);
    }
  }, [listing?.listingId, listing?.id, listing?.eventId, listing?.stayId]);

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
  const allEventTicketsSlots = useMemo(() => {
    const slots = [];
    const seen = new Set();
    eventTickets.forEach(ticket => {
      getTicketSlotRestrictions(ticket).forEach(slot => {
        const id = getSlotId(slot) || slot.slotName || slot.startTime;
        const strId = String(id);
        if (id && !seen.has(strId)) {
          seen.add(strId);
          slots.push(slot);
        }
      });
    });
    return slots;
  }, [eventTickets]);

  const allEventSlotSource = useMemo(() => (
    eventFallbackSlots.length > 0 ? eventFallbackSlots : allEventTicketsSlots
  ), [eventFallbackSlots, allEventTicketsSlots]);
  const eventPrice = getTicketPrice(selectedTicket, asNumber(listing?.ticketPrice) ?? asNumber(listing?.price) ?? asNumber(listing?.basePrice) ?? 0);
  const effectiveEventPrice = useMemo(() => (
    getEffectiveTicketPrice(selectedTicket, billableAdults, eventPrice)
  ), [selectedTicket, billableAdults, eventPrice]);
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
    eventSlots.find((slot) => String(slot.eventSlotId ?? slot.id) === String(selectedEventSlotId)) || null
  ), [eventSlots, selectedEventSlotId]);
  const selectedEventSlots = useMemo(() => (
    eventSlots.filter((slot) => selectedEventSlotIds.includes(String(slot.eventSlotId ?? slot.id)))
  ), [eventSlots, selectedEventSlotIds]);

  // Compute which tickets are applicable to the currently selected slot.
  // Returns [] when no slot is chosen, enforcing the slot-first selection flow.
  const ticketsForSelectedSlot = useMemo(() => {
    if (!isEventBooking) return eventTickets;
    if (selectedEventSlots.length === 0) return []; // No slot selected → hide ticket dropdown
    const activeSlot = selectedEventSlots[0];
    const activeSlotId = getSlotId(activeSlot);
    const activeSlotLabel = String(getSlotLabel(activeSlot) || "").toLowerCase();
    return eventTickets.filter((ticket) => {
      const restrictions = getTicketSlotRestrictions(ticket);
      if (restrictions.length === 0) return true; // No restriction → ticket applies to all slots
      return restrictions.some((item) => {
        const itemId = item?.eventSlotId ?? item?.slotId ?? item?.id ?? item;
        if (itemId != null && activeSlotId != null && String(itemId) === String(activeSlotId)) return true;
        const itemLabel = String(item?.slotName ?? item?.name ?? item?.label ?? item ?? "").toLowerCase();
        if (itemLabel && activeSlotLabel && itemLabel === activeSlotLabel) return true;
        return false;
      });
    });
  }, [isEventBooking, eventTickets, selectedEventSlots]);

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
  const selectedTicketRemainingTickets = selectedTicketAvailability?.remaining ?? (() => {
    if (!selectedTicket) return undefined;
    const total = getTicketAvailabilityTotal(selectedTicket) ?? getTicketTotalTickets(selectedTicket);
    const booked = getTicketAvailabilityBooked(selectedTicket);
    const explicitRemaining = getTicketAvailabilityRemaining(selectedTicket);
    if (explicitRemaining != null) return Math.max(0, explicitRemaining);
    if (total != null && booked != null) return Math.max(0, total - booked);
    return undefined;
  })();
  const selectedTicketAvailabilityTotal = selectedTicketAvailability?.total ?? selectedTicketTotalTickets;
  const selectedTicketSoldOut = Boolean(selectedTicketAvailability?.isSoldOut) || selectedTicketRemainingTickets === 0;
  const eventAvailableDateKeys = useMemo(() => {
    if (!isEventBooking) return new Set();
    const keys = new Set();

    // All slots contribute available dates — no ticket-based filtering here.
    // Slots are always visible; ticket restrictions only apply to the ticket dropdown.
    eventSlots.forEach((slot) => {
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
  }, [eventSlots, isEventBooking, listing?.bookingEndDate, listing?.bookingStartDate, listing?.endDate, listing?.eventEndDate, listing?.eventStartDate, listing?.startDate]);
  const listingId = listing?.listingId;
  const selectedDateKey = useMemo(() => getDateKey(startDate), [startDate]);
  const slotsLookupEndDate = useMemo(() => getLatestExperienceSlotEndDate(listing), [listing]);
  const privateBookedSlotIds = useMemo(() => collectPrivateBookedSlotIds(listing), [listing]);
  const fullyBookedSlotIdsForDate = useMemo(
    () => collectFullyBookedSlotIdsForDate(listing, selectedDateKey),
    [listing, selectedDateKey]
  );
  const timeSlots = useMemo(() => {
    const sourceSlots = selectedDateKey && dateFilteredSlotsLoaded ? dateFilteredSlots : baseTimeSlots;
    return sourceSlots.filter((slot) => {
      const slotId = getSlotId(slot);
      const isPrivatelyBooked = slot?.hasPrivateBooking === true || (slotId != null && privateBookedSlotIds.has(String(slotId)));
      const isFullyBookedByConfig = slotId != null && fullyBookedSlotIdsForDate.has(String(slotId));
      const availableSeats = asNumber(slot?.availableSeats ?? slot?.available_seats);
      const isUnavailable = asOptionalBoolean(slot?.isAvailable ?? slot?.is_available) === false;
      const isFullBySeats = availableSeats != null && availableSeats <= 0;
      return !isPrivatelyBooked && !isFullyBookedByConfig && !isUnavailable && !isFullBySeats;
    });
  }, [baseTimeSlots, dateFilteredSlots, dateFilteredSlotsLoaded, fullyBookedSlotIdsForDate, isEventBooking, privateBookedSlotIds, selectedDateKey]);
  const experienceAvailableDateKeys = useMemo(() => {
    if (isEventBooking) return new Set();
    const keys = new Set();
    const schedules = [
      ...(Array.isArray(baseTimeSlots) ? baseTimeSlots : []),
      ...(Array.isArray(dateFilteredSlots) ? dateFilteredSlots : []),
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
  }, [baseTimeSlots, dateFilteredSlots, isEventBooking, listing]);

  const hasTodayValidSlots = useMemo(() => {
    if (isEventBooking) return false;
    const today = new Date();
    const todayKey = getDateKey(today);
    const weekday = today.getDay();
    const currentMinutes = today.getHours() * 60 + today.getMinutes();
    const todayFullyBookedSlotIds = collectFullyBookedSlotIdsForDate(listing, todayKey);

    const schedules = [
      ...(Array.isArray(baseTimeSlots) ? baseTimeSlots : []),
      ...(Array.isArray(dateFilteredSlots) ? dateFilteredSlots : []),
      ...(Array.isArray(listing?.slots) ? listing.slots : []),
    ];

    const seenSlotIds = new Set();
    const uniqueSlots = [];
    schedules.forEach((slot) => {
      if (!slot || typeof slot !== "object") return;
      const slotId = getSlotId(slot) || slot.slotId || slot.slot_id || slot.slotName || slot.startTime;
      if (slotId && !seenSlotIds.has(slotId)) {
        seenSlotIds.add(slotId);
        uniqueSlots.push(slot);
      }
    });

    const validSlots = uniqueSlots.filter((slot) => {
      if (!slot || typeof slot !== "object") return false;
      const schedule = slot.schedule || {};
      const slotId = getSlotId(slot);

      // 1. Check if active
      if (slot.is_active === false || slot.isActive === false) return false;

      // 2. Check if weekday is enabled
      if (!isWeekdayEnabled(slot, weekday) && !isWeekdayEnabled(schedule, weekday)) return false;

      // 3. Check date range
      const slotStart = slot.startDate || slot.start_date || schedule.startDate || schedule.start_date;
      const slotEnd = slot.endDate || slot.end_date || schedule.endDate || schedule.end_date;
      if (slotStart) {
        const start = makeLocalDate(getDateKey(slotStart));
        if (today < start) return false;
      }
      if (slotEnd) {
        const end = makeLocalDate(getDateKey(slotEnd));
        if (today > end) return false;
      }

      // 4. Check bookings/availability
      const isPrivatelyBooked = slot?.hasPrivateBooking === true || (slotId != null && privateBookedSlotIds.has(String(slotId)));
      if (isPrivatelyBooked) return false;

      const isFullyBookedByConfig = slotId != null && todayFullyBookedSlotIds.has(String(slotId));
      if (isFullyBookedByConfig) return false;

      const availability = getSlotAvailabilityForDate(slot, todayKey);
      const isUnavailable = (availability?.is_available ?? availability?.isAvailable ?? slot.is_available ?? slot.isAvailable) === false;
      if (isUnavailable) return false;

      const seats = availability?.available_seats ?? availability?.availableSeats ?? slot.availableSeats ?? slot.available_seats;
      if (seats != null && seats <= 0) return false;

      // 5. Check time validity (future slots only)
      const startTime = slot.startTime || slot.start_time || schedule.startTime || schedule.start_time;
      if (startTime) {
        const [h, m] = startTime.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        if (slotMinutes <= currentMinutes) {
          return false;
        }
      }

      return true;
    });

    return validSlots.length > 0;
  }, [baseTimeSlots, dateFilteredSlots, listing, isEventBooking, privateBookedSlotIds]);



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
    if (isEventBooking) {
      // For events, also reset selected slots when date changes
      setSelectedEventSlotIds([]);
      setStartTime(null);
      return;
    }

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
    // Only validate that the selected slot still exists in eventSlots.
    // No ticket-based filtering. No auto-selection.
    const validSelectedSlots = eventSlots.filter((slot) =>
      selectedEventSlotIds.includes(String(slot.eventSlotId ?? slot.id))
    );
    if (validSelectedSlots.length > 0) {
      const nextId = String(validSelectedSlots[0].eventSlotId ?? validSelectedSlots[0].id);
      const nextSelection = [nextId];
      if (nextSelection.join("|") !== selectedEventSlotIds.join("|")) {
        setSelectedEventSlotIds(nextSelection);
      }
      setStartTime(validSelectedSlots[0].slotName || null);
      return;
    }
    // Only clear if we had something selected and it's no longer valid
    if (selectedEventSlotIds.length > 0) {
      setSelectedEventSlotIds([]);
      setStartTime(null);
    }
  }, [eventSlots, isEventBooking, selectedEventSlotIds]);

  useEffect(() => {
    if (!isEventBooking) return;
    if (ticketsForSelectedSlot.length === 1) {
      const onlyTicket = ticketsForSelectedSlot[0];
      const onlyTicketId = String(onlyTicket.id ?? onlyTicket.ticketTypeId ?? onlyTicket.typeId ?? "ticket-0");
      if (selectedTicketTypeId !== onlyTicketId) {
        setSelectedTicketTypeId(onlyTicketId);
        setValidationErrors(prev => {
          const next = { ...prev };
          delete next.ticketType;
          return next;
        });
      }
    } else if (ticketsForSelectedSlot.length === 0) {
      if (selectedTicketTypeId !== "") {
        setSelectedTicketTypeId("");
      }
    } else {
      if (selectedTicketTypeId) {
        const isValid = ticketsForSelectedSlot.some(
          (ticket) => String(ticket.id ?? ticket.ticketTypeId ?? ticket.typeId) === selectedTicketTypeId
        );
        if (!isValid) {
          setSelectedTicketTypeId("");
        }
      }
    }
  }, [ticketsForSelectedSlot, isEventBooking, selectedTicketTypeId]);

  const getAddonLineTotal = useCallback((item) => {
    const addon = item?.addon || item || {};
    const addonPrice = parseFloat(addon?.price || addon?.addonPrice || 0) || 0;
    const quantity = Number(item?.quantity || addon?.quantity || 1) || 1;
    return addonPrice * quantity;
  }, []);

  // Calculate addon total
  const addOnsTotal = selectedAddOns.reduce((sum, item) => (
    sum + getAddonLineTotal(item)
  ), 0);

  // Extract proper price depending on whether a time slot is selected
  const selectedSlotData = timeSlots.find(s => s.slotName === startTime || s.startTime === startTime) || null;
  const staleSelectedSlotData = (selectedDateKey ? (dateFilteredSlotsLoaded ? dateFilteredSlots : baseTimeSlots) : []).find(s => s.slotName === startTime || s.startTime === startTime) || null;
  const experienceSupportsPrivateBooking = useMemo(() => {
    if (isEventBooking) return false;

    const listingPrivateSetting =
      asOptionalBoolean(listing?.privateBookingEnabled) ??
      asOptionalBoolean(listing?.private_booking_enabled) ??
      asOptionalBoolean(listing?.privateOptionAvailable) ??
      asOptionalBoolean(listing?.private_option_available) ??
      asOptionalBoolean(listing?.privateOptionEnabled) ??
      asOptionalBoolean(listing?.private_option_enabled) ??
      asOptionalBoolean(listing?.privateOption) ??
      asOptionalBoolean(listing?.private_option);

    if (listingPrivateSetting === false) return false;
    if (listingPrivateSetting === true) return true;

    const sourceSlots = [
      ...(Array.isArray(dateFilteredSlots) ? dateFilteredSlots : []),
      ...(Array.isArray(baseTimeSlots) ? baseTimeSlots : []),
    ];

    return sourceSlots.some((slot) => (
      asOptionalBoolean(slot?.privateBookingEnabled) === true ||
      asOptionalBoolean(slot?.private_booking_enabled) === true ||
      asOptionalBoolean(slot?.privateBookingAvailable) === true ||
      asOptionalBoolean(slot?.private_booking_available) === true
    ));
  }, [isEventBooking, listing, dateFilteredSlots, baseTimeSlots]);
  const selectedSlotHasPrivateBooking = !isEventBooking && Boolean(startTime) && staleSelectedSlotData?.hasPrivateBooking === true;
  const dateHasPrivateBookingAvailable = !isEventBooking && Boolean(selectedDateKey) && dateFilteredSlotsLoaded && timeSlots.some((slot) => slot.privateBookingAvailable === true);
  const selectedSlotPrivateBookingAvailable = !isEventBooking && Boolean(startTime) && selectedSlotData?.privateBookingAvailable === true;
  const showPrivateBookingToggle = experienceSupportsPrivateBooking && selectedSlotPrivateBookingAvailable;
  const privateBookingMessage = experienceSupportsPrivateBooking && !isEventBooking && selectedDateKey && dateFilteredSlotsLoaded
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
  const groupOverridePrice = getGroupPricingTierPrice(groupPricingRules, billableAdults);
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

  // Child pricing: for events prefer ticket.childPrice when configured
  const childrenAllowed = asBoolean(
    listing?.childrenAllowed ?? listing?.childAllowed ?? listing?.allowChildren,
    true
  );
  const rawChildPrice = isEventBooking
    ? (selectedTicket?.childPrice ?? selectedTicket?.child_price ?? 0)
    : (listing?.childPricePerChild || listing?.childPrice || listing?.pricing?.childPricePerChild || 0);
  const allowChildPricing = asBoolean(
    listing?.allowChildPricing ?? listing?.childPricingAllowed,
    false
  );
  const childGuestPricing = childrenAllowed && rawChildPrice > 0
    ? calculateEventGuestPricing(rawChildPrice, listing?.pricing, listing?.earlyBirdDiscounts, startDate)
    : null;
  // Effective per-child price (after discount + tax), fallback to adult price if no child price set
  const effectiveChildPrice = childGuestPricing
    ? childGuestPricing.finalUnitPrice
    : extractedPrice;
  const childAgeFrom = asNumber(listing?.childAgeFrom ?? listing?.pricing?.childAgeFrom);
  const childAgeTo = asNumber(listing?.childAgeTo ?? listing?.pricing?.childAgeTo);
  const hasChildAgeRange = childAgeFrom != null && childAgeTo != null && childAgeTo >= childAgeFrom;
  const showExperienceChildAgeHint = !isEventBooking && allowChildPricing && childrenAllowed && hasChildAgeRange;
  const hasChildPricing = childrenAllowed && rawChildPrice > 0 && guests.children > 0;
  const baseAdultPricePerPerson = parseFloat(effectiveRawPrice || 0);
  const baseChildPricePerChild = hasChildPricing ? parseFloat(rawChildPrice || 0) : baseAdultPricePerPerson;

  const data = {
    price: extractedPrice,
    unit: isEventBooking ? "ticket" : (type === "stay" ? "night" : "person"),
    icon: type === "stay" ? Bed : (type === "food" ? ChefHat : Ticket)
  };

  // Compute totals with child pricing split
  const adultSubtotal = parseFloat(extractedPrice || 0) * guests.adults;
  const childSubtotal = effectiveChildPrice * guests.children;
  const baseTotal = isEventBooking
    ? adultSubtotal + childSubtotal
    : adultSubtotal + childSubtotal;
  const rawBaseTotal = !isEventBooking
    ? (baseAdultPricePerPerson * guests.adults) + (baseChildPricePerChild * guests.children)
    : ((eventGuestPricing.baseUnitPrice * guests.adults) + (baseChildPricePerChild * guests.children));
  const activeGuestPricing = isEventBooking ? eventGuestPricing : experienceGuestPricing;
  const appliedDiscountRate = activeGuestPricing?.discountRate ?? 0;
  const appliedTaxRate = activeGuestPricing?.customerTaxRate ?? 0;
  const subtotalBeforeAdjustments = rawBaseTotal + addOnsTotal;
  const totalDiscountAmount = subtotalBeforeAdjustments * (appliedDiscountRate / 100);
  const totalPromoDiscountAmount = subtotalBeforeAdjustments * ((activeGuestPricing?.promoDiscountRate || 0) / 100);
  const totalEarlyBirdDiscountAmount = subtotalBeforeAdjustments * ((activeGuestPricing?.earlyBirdDiscountRate || 0) / 100);
  const taxableSubtotal = Math.max(0, subtotalBeforeAdjustments - totalDiscountAmount);
  const totalTaxAmount = taxableSubtotal * (appliedTaxRate / 100);
  const finalTotal = taxableSubtotal + totalTaxAmount;
  const eventBaseTotal = rawBaseTotal;
  const eventDiscountTotal = totalDiscountAmount;
  const eventPromoDiscountTotal = totalPromoDiscountAmount;
  const eventEarlyBirdDiscountTotal = totalEarlyBirdDiscountAmount;
  const eventTaxTotal = totalTaxAmount;

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
    if (childrenAllowed) return;
    setGuests((current) => (
      current.children === 0 ? current : { ...current, children: 0 }
    ));
  }, [childrenAllowed]);

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
    // Check if user is logged in
    const token = localStorage.getItem("jwtToken");
    const isLoggedIn = !!token && token !== "undefined" && token !== "null";
    if (!isLoggedIn) {
      const listingIdToSave = listing?.listingId || listing?.id || listing?.eventId || listing?.stayId;
      if (listingIdToSave) {
        const stateToStore = {
          listingId: String(listingIdToSave),
          type,
          startDate: startDate ? startDate.format("YYYY-MM-DD") : null,
          startTime,
          guests,
          selectedTicketTypeId,
          selectedEventSlotIds,
          privateBooking,
          selectedAddOns: selectedAddOns.map(a => a?.addon?.addonId || a?.addonId || a?.id),
        };
        try {
          localStorage.setItem("frontendPendingBookingState", JSON.stringify(stateToStore));
        } catch (e) { }
      }

      setShowLoginPrompt(true);
      return;
    }

    const errors = {};
    if (!startDate) {
      errors.date = "Please select a date to continue.";
    } else {
      // Check if slots exist for this date
      const availableSlots = isEventBooking ? eventSlots : timeSlots;
      if (availableSlots.length === 0) {
        errors.date = "No booking slots are available for the selected date.";
      }
    }

    if (isEventBooking) {
      if (!selectedTicketTypeId && eventTickets.length > 0) errors.ticketType = "Please select a ticket type.";
      if (selectedEventSlotIds.length === 0) errors.slot = "Please select an available time slot to continue.";
    } else {
      if (!startTime) errors.slot = "Please select an available time slot to continue.";
    }

    if (guests.adults < 1) errors.adults = "Please add at least 1 adult.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowValidation(true);
      // Scroll to the top of the modal content to see the errors
      const modalContent = document.querySelector(".booking-modal-content");
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clear validation on success
    setValidationErrors({});
    setShowValidation(false);

    if (!isEventBooking && guestSeatLimit !== undefined && totalGuests > guestSeatLimit) {
      alert(`Only ${guestSeatLimit} seat${guestSeatLimit === 1 ? "" : "s"} available for this slot.`);
      return;
    }

    if (isEventBooking) {
      if (selectedEventSlots.length === 0 || totalGuests < 1 || bookingLoading) return;
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
      const eventSlotIds = selectedEventSlots.map((slot) => getSlotId(slot)).filter(value => value != null && value !== "");
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
      const customerName = `${customerDetails.firstName || ""} ${customerDetails.lastName || ""}`.trim() || "Guest User";
      const customerEmail = customerDetails.email || "guest@example.com";
      const customerPhone = customerDetails.phone || "";
      if (eventIdNum == null || eventIdNum === "" || eventSlotIdNum == null || eventSlotIdNum === "" || ticketTypeId == null || ticketTypeId === "") {
        setValidationErrors({ slot: "Unable to book: event ticket or slot information is missing." });
        setShowValidation(true);
        return;
      }

      const payload = {
        eventId: eventIdNum,
        eventSlotId: eventSlotIdNum,
        eventSlotIds,
        bookingDate: dateStr,
        numberOfGuests: totalGuests,
        childCount: guests.children || 0,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        customerDetails,
        paymentMethod: "razorpay",
        specialRequests: "",
        tickets: [{
          ticketTypeId,
          ticketTypeName,
          quantity: totalGuests,
          childQuantity: guests.children || 0,
          pricePerTicket: Number(pricePerTicket.toFixed(2)),
        }],
        appliedDiscountCode: null,
        notes: null,
      };

      try {
        if (isMountedRef.current) setBookingLoading(true);

        const precheckPayload = {
          eventId: eventIdNum,
          eventSlotId: eventSlotIdNum,
          tickets: [
            {
              ticketTypeId,
              quantity: totalGuests,
            },
          ],
        };
        if (customerEmail) precheckPayload.customerEmail = customerEmail;
        if (customerPhone) precheckPayload.customerPhone = customerPhone;

        const precheckRes = await precheckEventOrder(precheckPayload);
        const precheckResults = Array.isArray(precheckRes?.results) ? precheckRes.results : [];
        const reachedLimit = precheckResults.some(
          (item) => Number(item?.remainingAllowedQuantity) === 0
        );

        if (reachedLimit) {
          showErrorPopup("Booking limit for this event slot has been reached.");
          if (isMountedRef.current) setBookingLoading(false);
          return;
        }

        if (precheckRes?.canBook === false || precheckResults.some((item) => item?.canBook === false)) {
          const firstFailure = precheckResults.find((item) => item?.canBook === false);
          const message =
            firstFailure?.failureReason ||
            precheckRes?.message ||
            "Unable to proceed with this booking right now.";
          showErrorPopup(message);
          if (isMountedRef.current) setBookingLoading(false);
          return;
        }

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

        const isFreeBooking = finalTotal === 0;

        if (!razorpayOrderId && !isFreeBooking) {
          console.error("❌ Razorpay Order ID missing from response:", res);
          alert("Payment initialization failed. Please contact support.");
          if (isMountedRef.current) setBookingLoading(false);
          return;
        }

        if (razorpayKeyId) {
          try { localStorage.setItem("lastRazorpayKeyId", razorpayKeyId); } catch (e) { }
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
            // Adult/child split for checkout page
            allowChildPricing: hasChildPricing,
            adultsCount: guests.adults,
            childrenCount: guests.children,
            basePricePerPerson: eventGuestPricing.baseUnitPrice,
            adultBasePricePerPerson: eventGuestPricing.baseUnitPrice,
            childPricePerChild: hasChildPricing ? effectiveChildPrice : 0,
            baseChildPricePerChild: baseChildPricePerChild,
            discount: eventDiscountTotal,
            promoDiscount: eventPromoDiscountTotal,
            earlyBirdDiscount: eventEarlyBirdDiscountTotal,
            discountRate: appliedDiscountRate,
            tax: eventTaxTotal,
            taxRate: appliedTaxRate,
            addonsTotal: addOnsTotal,
            subtotal: subtotalBeforeAdjustments,
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
          cancellationPolicySummary: listing?.cancellationPolicySummary || listing?.cancellationPolicy || listing?.cancellationPolicyText,
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
        localStorage.removeItem("frontendPendingBookingState");
        localStorage.removeItem("razorpayPaymentSuccess");
        localStorage.removeItem("paymentFailed");

        if (isFreeBooking) {
          // For free bookings, we can go straight to completion
          const freePaymentSuccess = {
            razorpay_payment_id: "FREE_" + (orderId || Date.now()),
            razorpay_order_id: "FREE_ORDER_" + (orderId || Date.now()),
            razorpay_signature: "FREE_SIG"
          };
          localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(freePaymentSuccess));
          localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));

          history.replace("/experience-checkout-complete", {
            bookingData,
            paymentSuccess: freePaymentSuccess
          });
        } else {
          history.replace("/experience-checkout", {
            bookingData,
            paymentData,
          });
        }
      } catch (e) {
        console.error("Event booking failed:", e?.response?.data || e?.message || e);
        alert(getBookingErrorMessage(e));
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
      setValidationErrors({ slot: "Unable to book: experience slot information is missing." });
      setShowValidation(true);
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
      const quantity = Number(item.quantity || addon.quantity || 1) || 1;
      const addonLineTotal = getAddonLineTotal(item);
      addOnQuantities[id] = quantity;
      receipt.push({
        title: `${addon.title || "Add-on"} × ${quantity}`,
        content: `₹${addonLineTotal.toFixed(2)}`,
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
        discount: totalDiscountAmount,
        promoDiscount: totalPromoDiscountAmount,
        earlyBirdDiscount: totalEarlyBirdDiscountAmount,
        discountRate: appliedDiscountRate,
        tax: totalTaxAmount,
        taxRate: appliedTaxRate,
        addonsTotal: addOnsTotal,
        subtotal: subtotalBeforeAdjustments,
        total: finalTotal,
        guestCount: totalGuests,
      },
      bookingSummary: {
        date: dateStr,
        time: startTime,
        guestCount: totalGuests,
        billableGuestCount: totalGuests
      },
      cancellationPolicySummary: listing?.cancellationPolicySummary || listing?.cancellationPolicy || listing?.cancellationPolicyText,
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
        quantity: Number(item.quantity || addon.quantity || 1) || 1,
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
        phone: userInfo.customerPhone || userInfo.phoneNumber || userInfo.phone || "",
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

      const isFreeBooking = finalTotal === 0;

      if (!razorpayOrderId && !isFreeBooking) {
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
      localStorage.removeItem("frontendPendingBookingState");
      if (razorpayKeyId) localStorage.setItem("lastRazorpayKeyId", razorpayKeyId);

      if (isFreeBooking) {
        // For free bookings, we can go straight to completion
        const freePaymentSuccess = {
          razorpay_payment_id: "FREE_" + (orderId || Date.now()),
          razorpay_order_id: "FREE_ORDER_" + (orderId || Date.now()),
          razorpay_signature: "FREE_SIG"
        };
        localStorage.setItem("razorpayPaymentSuccess", JSON.stringify(freePaymentSuccess));
        localStorage.setItem("checkoutBooking", JSON.stringify(bookingData));

        history.replace("/experience-checkout-complete", {
          bookingData,
          paymentSuccess: freePaymentSuccess
        });
      } else {
        history.push({
          pathname: "/experience-checkout",
          search: `?listingId=${listingId}&startDate=${dateStr}&guests=${totalGuests}${startTime ? `&startTime=${encodeURIComponent(startTime)}` : ""}`,
          state: {
            addOns: selectedAddOns.map(item => item.addon || item),
            bookingData,
            paymentData,
          }
        });
      }
    } catch (e) {
      console.error("Experience booking failed:", e?.response?.data || e?.message || e);
      alert(getBookingErrorMessage(e));
    } finally {
      if (isMountedRef.current) setBookingLoading(false);
    }
  };

  const IconComp = data.icon;
  const canReserve = isEventBooking
    ? Boolean(ticketSaleWindow.isOpen && startDate && selectedTicket && selectedEventSlots.length > 0 && getSlotId(selectedEventSlots[0]) != null && totalGuests >= 1 && (selectedTicketMaxPerBooking === undefined || totalGuests <= selectedTicketMaxPerBooking) && (selectedTicketRemainingTickets === undefined || totalGuests <= selectedTicketRemainingTickets) && !selectedTicketSoldOut && !eventAvailabilityLoading && !bookingLoading)
    : Boolean(startDate && selectedSlotData && startTime && totalGuests >= 1 && (guestSeatLimit === undefined || totalGuests <= guestSeatLimit) && (!privateBooking || selectedSlotPrivateBookingAvailable) && !selectedSlotHasPrivateBooking && !bookingLoading);
  const triggerDisabled = isEventBooking && !ticketSaleWindow.isOpen;

  const handleOpenBooking = useCallback(() => {
    if (triggerDisabled) return;
    setShow(true);

    if (isEventBooking || !listingId || !slotsLookupEndDate) return;
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
        whileHover={triggerDisabled ? undefined : {
          scale: 1.04,
          background: AH || A,
          boxShadow: `0 20px 35px -8px rgba(0,0,0,0.15), 0 30px 60px -10px ${A}55, 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.35)`
        }}
        whileTap={triggerDisabled ? undefined : { scale: 0.96 }}
        disabled={triggerDisabled}
        title={triggerDisabled ? ticketSaleWindow.message : undefined}
        className="booking-trigger"
        style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          background: A,
          color: "#FFF",
          padding: "18px 42px",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          boxShadow: `0 12px 24px -6px rgba(0,0,0,0.12), 0 20px 40px -8px ${A}3b, 0 1px 3px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.25)`,
          border: "none",
          cursor: triggerDisabled ? "not-allowed" : "pointer",
          zIndex: 1000,
          fontWeight: 800,
          fontSize: 17,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          opacity: triggerDisabled ? 0.76 : 1,
          transition: "background-color 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)"
        }}
      >
        <IconComp size={22} />
        {triggerDisabled ? (ticketSaleWindow.status === "upcoming" ? "Booking Not Open" : "Booking Closed") : triggerLabel}
      </motion.button>
      {triggerDisabled && (
        <div
          className="booking-trigger-message"
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
          <div className="booking-modal-wrapper" style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflow: "auto" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="booking-modal-container"
              style={{
                position: "relative",
                width: "95%",
                maxWidth: 950,
                maxHeight: "calc(100vh - 40px)",
                background: BG,
                borderRadius: 32,
                boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 100px ${A}11`,
                border: `1px solid ${B}`,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Header */}
              <div className="booking-modal-header" style={{ padding: "16px 28px", borderBottom: `1px solid ${B}88`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                <div style={{ flexShrink: 0 }}>
                  <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: A, marginBottom: 2, lineHeight: "1.2" }}>
                    {isEventBooking ? "Reserve Your Event" : "Reserve Your Experience"}
                  </h2>
                  {isEventBooking && ticketSaleWindow.message && (
                    <p style={{ fontSize: 11, color: ticketSaleWindow.isOpen ? M : "#d14343", fontWeight: 700, marginBottom: 2, lineHeight: 1.2 }}>
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
                            <span style={{ fontSize: 13, fontWeight: 600, color: M, textDecoration: "line-through", opacity: 0.7 }}>
                              ₹{Number(baseDisplayPrice).toFixed(2)}
                            </span>
                          )}
                          <span style={{ fontSize: 22, fontWeight: 800, color: FG }}>₹{Number(discountedDisplayPrice || 0).toFixed(2)}</span>
                          <span style={{ fontSize: 11, color: M, fontWeight: 500 }}>per {data.unit}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  <button onClick={() => setShow(false)} style={{ background: S, border: `1px solid ${B}`, padding: 8, borderRadius: 100, cursor: "pointer", color: FG, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s" }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Add-ons Row */}
              {(listing?.addons || []).length > 0 && (
                <div style={{ padding: "16px 28px", background: BG, borderBottom: `1px solid ${B}88` }}>
                  <style>{`
                    #header-addons-scroll::-webkit-scrollbar {
                      display: none;
                    }
                    .addon-scroll-btn {
                      position: absolute;
                      z-index: 10;
                      background: ${BG} !important;
                      border: 1px solid ${B} !important;
                      border-radius: 50% !important;
                      width: 36px !important;
                      height: 36px !important;
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      cursor: pointer !important;
                      color: ${FG} !important;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                      transition: all 0.2s ease !important;
                    }
                    .addon-scroll-btn:hover {
                      transform: scale(1.1) !important;
                      background: ${S} !important;
                      border-color: ${A} !important;
                      color: ${A} !important;
                    }
                    .addon-card-item {
                      flex-shrink: 0;
                      display: flex;
                      align-items: center;
                      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                      cursor: pointer;
                      position: relative;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    }
                    .addon-card-item:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    }
                    /* Desktop and default */
                    @media (min-width: 1024px) {
                      .addon-card-item {
                        min-width: 250px;
                        max-width: 280px;
                        padding: 12px 16px;
                        border-radius: 16px;
                        gap: 14px;
                      }
                      .addon-img-box {
                        width: 56px;
                        height: 56px;
                        border-radius: 12px;
                      }
                      .addon-title-text {
                        font-size: 13px;
                      }
                    }
                    /* Tablet */
                    @media (min-width: 768px) and (max-width: 1023px) {
                      .addon-card-item {
                        min-width: 210px;
                        max-width: 240px;
                        padding: 10px 14px;
                        border-radius: 14px;
                        gap: 12px;
                      }
                      .addon-img-box {
                        width: 48px;
                        height: 48px;
                        border-radius: 10px;
                      }
                      .addon-title-text {
                        font-size: 12px;
                      }
                    }
                    /* Mobile */
                    @media (max-width: 767px) {
                      .addon-card-item {
                        min-width: 180px;
                        max-width: 210px;
                        padding: 8px 12px;
                        border-radius: 12px;
                        gap: 10px;
                      }
                      .addon-img-box {
                        width: 42px;
                        height: 42px;
                        border-radius: 8px;
                      }
                      .addon-title-text {
                        font-size: 11px;
                      }
                    }
                    .addon-action-btn-circle {
                      border: none;
                      border-radius: 50%;
                      width: 32px;
                      height: 32px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    }
                    @media (max-width: 767px) {
                      .addon-action-btn-circle {
                        width: 28px;
                        height: 28px;
                      }
                    }
                    .addon-action-btn-circle:hover {
                      transform: scale(1.08);
                    }
                    .addon-qty-ctrl-panel {
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      background: ${BG};
                      border-radius: 100px;
                      padding: 2px 4px;
                      border: 1px solid ${A}33;
                    }
                    .addon-qty-panel-btn {
                      background: none;
                      border: none;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      padding: 4px;
                      border-radius: 50%;
                      cursor: pointer;
                      transition: background 0.2s;
                    }
                    .addon-qty-panel-btn:hover {
                      background: ${B}55;
                    }
                  `}</style>

                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <button
                      className="addon-scroll-btn"
                      onClick={() => {
                        const container = document.getElementById("header-addons-scroll");
                        if (container) container.scrollBy({ left: -240, behavior: 'smooth' });
                      }}
                      style={{ left: -18 }}
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div id="header-addons-scroll" style={{
                      display: "flex",
                      overflowX: "auto",
                      gap: 16,
                      padding: "8px 12px",
                      margin: "0 4px",
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      width: "100%",
                      maskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
                      WebkitMaskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)"
                    }}>
                      {listing.addons.map((item, i) => {
                        const addon = item.addon || item;
                        const addonId = addon.addonId || addon.id;
                        const pricingType = addon.pricingType || (addon.priceType === "per_booking" ? "Group" : "Individual");
                        const isSelected = selectedAddOns.some(a => (a.addonId || a.id) === addonId);
                        const quantity = selectedAddOns.find(a => (a.addonId || a.id) === addonId)?.quantity || 1;
                        const addonImage = addon.imageUrl || (addon.imageUrls && addon.imageUrls[0]) || addon.image;

                        const handleCardClick = () => {
                          if (!onUpdateAddonQuantity) return;
                          if (!isSelected) {
                            onUpdateAddonQuantity(addon, 1);
                          } else if (pricingType === "Group") {
                            onUpdateAddonQuantity(addon, -1);
                          }
                        };

                        const priceLabel = addon.price > 0
                          ? `₹${addon.price}`
                          : "Free";

                        const typeLabel = pricingType === "Group" ? "Group" : "Per Item";

                        return (
                          <div
                            key={i}
                            onClick={handleCardClick}
                            className="addon-card-item"
                            style={{
                              background: isSelected ? AL : S,
                              border: `1.5px solid ${isSelected ? A : B}`,
                            }}
                          >
                            {addonImage && (
                              <div className="addon-img-box" style={{ overflow: "hidden", flexShrink: 0, border: `1px solid ${B}88` }}>
                                <img src={addonImage} alt={addon.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                              <p className="addon-title-text" style={{ fontWeight: 700, color: isSelected ? A : FG, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {addon.title}
                              </p>
                              <p style={{ fontSize: 11, fontWeight: 800, color: isSelected ? A : M, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                <span>{priceLabel}</span>
                                <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  • {typeLabel}
                                </span>
                              </p>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                pricingType === "Group" ? (
                                  <button
                                    onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, -1)}
                                    className="addon-action-btn-circle"
                                    style={{ background: A, color: "#fff" }}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                ) : (
                                  <div className="addon-qty-ctrl-panel">
                                    <button
                                      onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, -1)}
                                      className="addon-qty-panel-btn"
                                      style={{ color: A }}
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span style={{ fontSize: 11, fontWeight: 700, minWidth: 12, textAlign: "center", color: A }}>
                                      {quantity}
                                    </span>
                                    <button
                                      onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, 1)}
                                      className="addon-qty-panel-btn"
                                      style={{ color: A }}
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                )
                              ) : (
                                <button
                                  onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, 1)}
                                  className="addon-action-btn-circle"
                                  style={{ background: BG, color: FG, border: `1.5px solid ${B}` }}
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      className="addon-scroll-btn"
                      onClick={() => {
                        const container = document.getElementById("header-addons-scroll");
                        if (container) container.scrollBy({ left: 240, behavior: 'smooth' });
                      }}
                      style={{ right: -18 }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="booking-modal-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>


                {/* Closed state — all dates have passed */}
                {isExperienceClosed ? (
                  <div className="booking-modal-closed" style={{ padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${B}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Clock size={32} color={M} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: FG }}>This experience is closed</div>
                    <div style={{ fontSize: 14, color: M, fontWeight: 500, maxWidth: 340, lineHeight: 1.6 }}>
                      All available dates and time slots for this experience have passed. Please check back later or contact the host for upcoming schedules.
                    </div>
                    <button
                      onClick={() => setShow(false)}
                      style={{ marginTop: 8, padding: "12px 32px", background: A, color: "#fff", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" }}
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="booking-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: 1, background: B }}>
                    {/* Left Column: Date & Ticket */}
                    <div className="booking-modal-column" style={{ padding: "20px 28px", background: BG, display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: validationErrors.date ? E : A, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, lineHeight: "1.2" }}>
                          01. Select Date
                          {validationErrors.date && <span style={{ fontSize: 10, fontWeight: 700, background: EL, color: E, padding: "2px 8px", borderRadius: 100, border: `1px solid ${E}22` }}>Required</span>}
                        </div>
                        <div style={{
                          borderRadius: 20,
                          padding: 4,
                          border: `1px solid ${validationErrors.date ? `${E}44` : "transparent"}`,
                          background: validationErrors.date ? EL : "transparent",
                          transition: "0.3s"
                        }}>
                          {isEventBooking ? (
                            <EventInlineCalendar
                              selectedDate={startDate}
                              onDateSelect={(date) => {
                                setStartDate(date);
                                setGuests({ adults: 0, children: 0, infants: 0 });
                                setShowDateWarning(false);
                                setValidationErrors(prev => {
                                  const next = { ...prev };
                                  delete next.date;
                                  return next;
                                });
                              }}
                              availableDateKeys={eventAvailableDateKeys}
                              tokens={{ A, AL, BG, FG, M, B, S, W }}
                              emptyMessage="No available dates for this event."
                            />
                          ) : (
                            <EventInlineCalendar
                              selectedDate={startDate}
                              onDateSelect={(date) => {
                                setStartDate(date);
                                setGuests({ adults: 0, children: 0, infants: 0 });
                                setShowDateWarning(false);
                                setValidationErrors(prev => {
                                  const next = { ...prev };
                                  delete next.date;
                                  return next;
                                });
                              }}
                              availableDateKeys={experienceAvailableDateKeys}
                              tokens={{ A, AL, BG, FG, M, B, S, W }}
                              emptyMessage="No available dates for this experience."
                              hasTodayValidSlots={hasTodayValidSlots}
                            />
                          )}
                        </div>
                      </div>

                      {/* Removed Ticket Type from Left Column */}
                    </div>

                    {/* Right Column: Slots & Guests */}
                    <div className="booking-modal-column" style={{ padding: "20px 28px", background: S, display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: validationErrors.slot ? E : A, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, lineHeight: "1.2" }}>
                          02. {isEventBooking ? "Choose Slot" : "Select Time"}
                          {validationErrors.slot && <span style={{ fontSize: 10, fontWeight: 700, background: EL, color: E, padding: "2px 8px", borderRadius: 100, border: `1px solid ${E}22` }}>Required</span>}
                        </div>

                        <AnimatePresence>
                          {showDateWarning && !startDate && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: "auto" }}
                              exit={{ opacity: 0, y: -10, height: 0 }}
                              style={{
                                overflow: "hidden"
                              }}
                            >
                              <div style={{
                                marginBottom: 16,
                                padding: "14px 16px",
                                background: EL,
                                border: `1px solid ${E}33`,
                                borderRadius: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                color: E,
                                fontSize: 12,
                                fontWeight: 600,
                                boxShadow: `0 4px 12px ${E}11`
                              }}>
                                <AlertCircle size={16} />
                                <span>Select a date before choosing a time slot.</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {isEventBooking ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                              {(() => {
                                if (!startDate) {
                                  return (
                                    <div style={{
                                      gridColumn: "1 / -1",
                                      padding: "20px 16px",
                                      textAlign: "center",
                                      color: M,
                                      fontWeight: 700,
                                      background: BG,
                                      borderRadius: 16,
                                      border: `1.5px dashed ${B}`,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 8
                                    }}>
                                      <Calendar size={18} color={A} style={{ opacity: 0.85 }} />
                                      <span>Please select a date to view available slots.</span>
                                    </div>
                                  );
                                }

                                const validSlotsForDate = eventSlots.filter((slot) => {
                                  const slotKeys = new Set();
                                  addDateRangeKeys(slotKeys, slot.slotStartDate || slot.slotDate || slot.date || slot.eventDate || slot.startDate, slot.slotEndDate || slot.endDate || slot.end_date);
                                  // All slots are shown — no ticket-based filtering here.
                                  // Ticket dropdown is filtered AFTER the user picks a slot.
                                  return slotKeys.size === 0 || slotKeys.has(selectedDateKey);
                                });

                                if (startDate && validSlotsForDate.length === 0) {
                                  return <div style={{ gridColumn: "span 2", padding: "24px 20px", textAlign: "center", color: E, fontWeight: 700, background: EL, borderRadius: 16, border: `1px solid ${E}22`, fontSize: 13 }}>No booking slots are available for this day</div>;
                                }

                                return validSlotsForDate.map((slot, index) => {
                                  const slotId = String(slot.eventSlotId ?? slot.id);
                                  const isSelected = selectedEventSlotIds.includes(slotId);
                                  const slotLabel = slot.slotName && slot.slotName !== slot.startTime ? slot.slotName : null;
                                  const slotStartTime = formatTime12h(slot.startTime || slot.slotName);
                                  const slotEndTime = formatTime12h(slot.endTime);
                                  const slotTimeDisplay = slotEndTime ? `${slotStartTime} - ${slotEndTime}` : slotStartTime;
                                  return (
                                    <button
                                      key={slotId}
                                      onClick={() => {
                                        // Slots are always clickable — no startDate gate.
                                        // Always enforce single-slot selection.
                                        const alreadySelected = selectedEventSlotIds.includes(slotId);
                                        if (alreadySelected) {
                                          // Deselect
                                          setSelectedEventSlotIds([]);
                                          setStartTime(null);
                                          setSelectedTicketTypeId("");
                                        } else {
                                          // Select this slot
                                          setSelectedEventSlotIds([slotId]);
                                          setStartTime(slot.slotName || null);
                                          setSelectedTicketTypeId(""); // Reset ticket when slot changes
                                          setValidationErrors(prev => {
                                            const next = { ...prev };
                                            delete next.slot;
                                            delete next.ticketType;
                                            return next;
                                          });
                                        }
                                      }}
                                      style={{
                                        padding: "10px 12px",
                                        borderRadius: 16,
                                        border: `1.5px solid ${isSelected ? A : B}`,
                                        background: isSelected ? AL : BG,
                                        color: isSelected ? A : FG,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        textAlign: "center",
                                        transition: "0.2s",
                                        opacity: startDate ? 1 : 0.6,
                                      }}
                                    >
                                      {slotLabel && (
                                        <span style={{ display: "block", marginBottom: 2 }}>{slotLabel}</span>
                                      )}
                                      <span style={{ display: "block", fontSize: 10, opacity: 0.85, marginTop: slotLabel ? 0 : 2 }}>
                                        {slotTimeDisplay}
                                      </span>
                                    </button>
                                  );
                                });
                              })()}
                            </div>

                            {/* Ticket Section directly below the slots grid */}
                            {selectedEventSlotIds.length > 0 && (
                              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ fontSize: 11, color: validationErrors.ticketType ? E : A, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, lineHeight: "1.2" }}>
                                  03. Ticket Option
                                  {validationErrors.ticketType && <span style={{ fontSize: 10, fontWeight: 700, background: EL, color: E, padding: "2px 8px", borderRadius: 100, border: `1px solid ${E}22` }}>Required</span>}
                                </div>

                                {ticketsForSelectedSlot.length > 0 ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {ticketsForSelectedSlot.map((ticket, index) => {
                                      const ticketId = String(ticket.id ?? ticket.ticketTypeId ?? ticket.typeId ?? `ticket-${index}`);
                                      const isSelected = String(selectedTicketTypeId) === ticketId;
                                      const ticketBasePrice = getTicketPrice(ticket, 0);
                                      const ticketEffectivePrice = getEffectiveTicketPrice(ticket, billableAdults, ticketBasePrice).price;
                                      const ticketGuestPrice = calculateEventGuestPricing(ticketEffectivePrice, listing?.pricing).finalUnitPrice;
                                      return (
                                        <div
                                          key={ticketId}
                                          onClick={() => {
                                            setSelectedTicketTypeId(ticketId);
                                            setValidationErrors(prev => {
                                              const next = { ...prev };
                                              delete next.ticketType;
                                              return next;
                                            });
                                          }}
                                          style={{
                                            padding: "12px 16px",
                                            borderRadius: 16,
                                            border: `1.5px solid ${isSelected ? A : B}`,
                                            background: isSelected ? AL : BG,
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            transition: "0.2s",
                                            boxShadow: isSelected ? `0 4px 12px ${A}11` : "none"
                                          }}
                                        >
                                          <div>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? A : FG }}>
                                              {getTicketName(ticket, index)}
                                            </div>
                                            {ticket.description && (
                                              <div style={{ fontSize: 11, color: M, marginTop: 2 }}>
                                                {ticket.description}
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ fontWeight: 800, fontSize: 14, color: isSelected ? A : FG }}>
                                            ₹{Number(ticketGuestPrice || 0).toFixed(2)}
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Selected Ticket Extra Info */}
                                    {selectedTicketTypeId && selectedTicket && (
                                      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                                        {eventAvailabilityLoading && (
                                          <div style={{ fontSize: 11, color: M, fontWeight: 700 }}>
                                            Checking availability...
                                          </div>
                                        )}
                                        {!eventAvailabilityLoading && selectedTicketSoldOut && (
                                          <div style={{ fontSize: 11, color: "#d14343", fontWeight: 800 }}>
                                            Ticket sold out.
                                          </div>
                                        )}
                                        {!eventAvailabilityLoading && !selectedTicketSoldOut && (selectedTicketAvailabilityTotal !== undefined || selectedTicketRemainingTickets !== undefined) && (
                                          <div style={{ padding: "6px 12px", background: AL, borderRadius: 8, border: `1px solid ${A}33`, alignSelf: "flex-start", display: "inline-block" }}>
                                            <span style={{ fontSize: 11, color: A, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                                              <Sparkles size={12} />
                                              {selectedTicketRemainingTickets !== undefined ? `Only ${selectedTicketRemainingTickets} seat${selectedTicketRemainingTickets === 1 ? "" : "s"} left (${selectedTicketRemainingTickets} spot${selectedTicketRemainingTickets === 1 ? "" : "s"} remaining)` : "Available"}
                                              {selectedTicketAvailabilityTotal !== undefined ? ` out of ${selectedTicketAvailabilityTotal} total` : ""}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ padding: "12px 16px", background: BG, border: `1px solid ${B}`, borderRadius: 16, fontSize: 12, color: M, opacity: 0.65, fontWeight: 600, fontStyle: "italic" }}>
                                    No tickets available for this slot.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ position: "relative" }}>
                            <div
                              onClick={startDate ? () => setShowTimePicker(!showTimePicker) : () => setShowDateWarning(true)}
                              title={startDate ? undefined : "Please select a date first"}
                              style={{
                                padding: "10px 14px",
                                background: (validationErrors.slot || (showDateWarning && !startDate)) ? EL : BG,
                                border: `1px solid ${(validationErrors.slot || (showDateWarning && !startDate)) ? `${E}44` : B}`,
                                borderRadius: 16,
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                transition: "0.3s",
                                opacity: startDate ? 1 : 0.6,
                                boxShadow: (showDateWarning && !startDate) ? `0 0 15px ${E}22` : "none",
                              }}
                            >
                              <span style={{ fontSize: 14, fontWeight: 600, color: startTime ? FG : (validationErrors.slot ? E : M) }}>{formatTime12h(startTime) || "Select Time"}</span>
                              <ChevronDown size={18} color={validationErrors.slot ? E : M} />
                            </div>
                            {showTimePicker && (
                              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 100, background: BG, border: `1px solid ${B}`, borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", padding: "8px" }}>
                                <TimeSlotsPicker
                                  visible={true}
                                  onClose={() => setShowTimePicker(false)}
                                  onTimeSelect={(t) => {
                                    if (!startDate) return;
                                    setStartTime(t);
                                    setShowTimePicker(false);
                                    setValidationErrors(prev => {
                                      const next = { ...prev };
                                      delete next.slot;
                                      return next;
                                    });
                                  }}
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
                        <div style={{ fontSize: 11, color: validationErrors.adults ? E : A, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, lineHeight: "1.2" }}>
                          {isEventBooking ? "04. Guests" : "03. Guests"}
                          {validationErrors.adults && <span style={{ fontSize: 10, fontWeight: 700, background: EL, color: E, padding: "2px 8px", borderRadius: 100, border: `1px solid ${E}22` }}>Min 1 Adult Required</span>}
                        </div>
                        <div
                          title={!(startDate && startTime && (isEventBooking ? selectedTicketTypeId : true)) ? (isEventBooking ? "Please select slot and ticket first" : "Please select date and time first") : undefined}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            opacity: (startDate && startTime && (isEventBooking ? selectedTicketTypeId : true)) ? 1 : 0.5,
                            pointerEvents: (startDate && startTime && (isEventBooking ? selectedTicketTypeId : true)) ? "auto" : "none",
                            transition: "0.3s"
                          }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: validationErrors.adults ? EL : BG,
                            border: `1px solid ${validationErrors.adults ? `${E}44` : B}`,
                            borderRadius: 16,
                            transition: "0.3s"
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>Adults</span>
                            <Counter
                              value={guests.adults}
                              setValue={(v) => {
                                updateGuestsWithinSeatLimit(p => ({ ...p, adults: v }));
                                if (v >= 1) {
                                  setValidationErrors(prev => {
                                    const next = { ...prev };
                                    delete next.adults;
                                    return next;
                                  });
                                }
                              }}
                              min={0}
                              max={adultMax}
                            />
                          </div>
                          {childrenAllowed && (
                            <div style={{ padding: "10px 14px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>Children</span>
                                <Counter
                                  value={guests.children}
                                  setValue={(v) => updateGuestsWithinSeatLimit(p => ({ ...p, children: v }))}
                                  min={0}
                                  max={childMax}
                                />
                              </div>
                              {showExperienceChildAgeHint && (
                                <div style={{ marginTop: 6, fontSize: 10, fontWeight: 500, color: M, lineHeight: 1.2 }}>
                                  Child age: {childAgeFrom}-{childAgeTo} years
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {guestSeatLimit !== undefined && (
                          <div style={{ marginTop: 8, padding: "6px 12px", background: AL, borderRadius: 8, border: `1px solid ${A}33`, display: "inline-block" }}>
                            <span style={{ fontSize: 11, color: A, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                              <Sparkles size={12} />
                              {guestSeatLimit > 0 ? `Only ${guestSeatLimit} seat${guestSeatLimit === 1 ? "" : "s"} left (${guestSeatLimit} spot${guestSeatLimit === 1 ? "" : "s"} remaining)` : "No seats remaining"}
                            </span>
                          </div>
                        )}
                        {isEventBooking && selectedTicketMaxPerBooking !== undefined && (
                          <div style={{ marginTop: 4, fontSize: 10, color: M, fontWeight: 600, lineHeight: 1.2 }}>
                            Max {selectedTicketMaxPerBooking} ticket{selectedTicketMaxPerBooking === 1 ? "" : "s"} per booking.
                          </div>
                        )}
                        {isEventBooking && effectiveEventPrice.tier && (
                          <div style={{ marginTop: 4, fontSize: 11, color: A, fontWeight: 800, lineHeight: 1.2 }}>
                            Group price: ₹{Number(effectiveEventPrice.price || 0).toFixed(2)} / ticket.
                          </div>
                        )}

                        {/* Dynamic Pricing Modifier Labels */}
                        {(() => {
                          const isGroupBookingApplied = (!isEventBooking && groupOverridePrice != null && groupOverridePrice > 0) || (isEventBooking && effectiveEventPrice?.tier);
                          const isAddonsApplied = selectedAddOns && selectedAddOns.length > 0;
                          const isEarlyBirdApplied = activeGuestPricing && (activeGuestPricing.earlyBirdDiscountRate > 0 || activeGuestPricing.earlyBirdDiscountAmount > 0);

                          if (!isGroupBookingApplied && !isAddonsApplied && !isEarlyBirdApplied) return null;

                          return (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, width: "100%" }}>
                              {isGroupBookingApplied && (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 10px",
                                  borderRadius: 100,
                                  background: `${A}12`,
                                  border: `1px solid ${A}28`,
                                  color: A,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}>
                                  🏷 Group Booking Applied
                                </span>
                              )}
                              {isAddonsApplied && (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 10px",
                                  borderRadius: 100,
                                  background: `${A}12`,
                                  border: `1px solid ${A}28`,
                                  color: A,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}>
                                  🏷 Add-ons Applied
                                </span>
                              )}
                              {isEarlyBirdApplied && (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 10px",
                                  borderRadius: 100,
                                  background: `${A}12`,
                                  border: `1px solid ${A}28`,
                                  color: A,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}>
                                  🏷 Early Bird Discount Applied
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Price Summary removed to align with Event popup behavior */}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer — outside scrollable content, always pinned at bottom of popup */}
        <div className="booking-modal-footer" style={{ flexShrink: 0, padding: "16px 28px", background: BG, borderTop: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 -4px 20px rgba(0,0,0,0.06)` }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Total amount</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: FG }}>₹{Number(finalTotal || 0).toFixed(2)}</span>
            <span style={{ fontSize: 10, color: M, fontWeight: 600 }}>Including all taxes.</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={bookingLoading}
            onClick={handleReserve}
            style={{
              padding: "12px 32px",
              background: (canReserve || showValidation) ? A : B,
              color: "#FFF",
              borderRadius: 16,
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: (canReserve || showValidation) ? `0 10px 30px ${A}44` : "none",
              transition: "0.3s"
            }}
          >
            {bookingLoading ? "Processing..." : reserveLabel}
          </motion.button>
        </div>

        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 28px 12px", color: M, fontSize: 10, background: BG }}>
          <ShieldCheck size={12} />
          <span style={{ fontWeight: 600 }}>Secure booking & payment powered by Little Known Planet</span>
        </div>
      </motion.div>
    </div >
        )
}
      </AnimatePresence >
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
      <AnimatePresence>
        {errorPopup.visible && (
          <div style={{ position: "fixed", inset: 0, zIndex: 3100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErrorPopup({ visible: false, title: "", message: "" })}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 500,
                background: BG,
                borderRadius: 18,
                border: `1px solid ${E}33`,
                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                padding: "20px 20px 16px",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: EL, border: `1px solid ${E}33`, display: "flex", alignItems: "center", justifyContent: "center", color: E, flexShrink: 0 }}>
                  <AlertCircle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: FG }}>{errorPopup.title}</h3>
                  <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: M, fontWeight: 600 }}>
                    {errorPopup.message}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setErrorPopup({ visible: false, title: "", message: "" })}
                  style={{
                    border: "none",
                    background: A,
                    color: "#FFF",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 800,
                    padding: "9px 16px",
                    cursor: "pointer",
                  }}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <style>{`
        .SingleDatePicker_picker,
        .SingleDatePickerPortal,
        .DateRangePicker_picker,
        .DateRangePickerPortal,
        .ReactDatesPortal {
          z-index: 99999 !important;
        }

        .booking-modal-container::-webkit-scrollbar,
        .booking-modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .booking-modal-container::-webkit-scrollbar-thumb,
        .booking-modal-content::-webkit-scrollbar-thumb {
          background: ${B};
          border-radius: 10px;
        }

        @media(max-width: 900px) {
          .booking-modal-wrapper { padding: 0 !important; align-items: flex-end !important; }
          .booking-modal-container { 
            width: 100% !important; 
            height: 95vh !important; 
            max-height: 100vh !important; 
            border-radius: 24px 24px 0 0 !important; 
            margin: 0 !important;
          }
          .addon-scroll-btn {
            display: none !important;
          }
          .booking-grid { grid-template-columns: 1fr !important; }
          .booking-modal-header { padding: 24px 20px !important; }
          .booking-modal-column { padding: 32px 20px !important; }
          .booking-modal-footer { 
            flex-direction: column !important; 
            gap: 16px !important; 
            padding: 20px !important; 
            align-items: stretch !important;
            text-align: center !important;
            flex-shrink: 0 !important;
            background: ${BG} !important;
            box-shadow: 0 -8px 24px rgba(0,0,0,0.12) !important;
            border-top: 1px solid ${B} !important;
          }
          .booking-modal-footer button { width: 100% !important; padding: 14px 20px !important; font-size: 16px !important; }
          .booking-modal-closed { padding: 40px 20px !important; }
          
          .booking-trigger {
            bottom: 24px !important;
            right: 20px !important;
            left: 20px !important;
            width: calc(100% - 40px) !important;
            justify-content: center !important;
            padding: 16px 32px !important;
            font-size: 16px !important;
            font-weight: 800 !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important;
          }
          
          .booking-trigger-message {
            bottom: 96px !important;
            right: 20px !important;
            left: 20px !important;
            max-width: none !important;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .booking-trigger {
            bottom: 30px !important;
            right: 30px !important;
            padding: 16px 36px !important;
            font-size: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
