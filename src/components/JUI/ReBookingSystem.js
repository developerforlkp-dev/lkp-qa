import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import moment from "moment-timezone";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Ticket, ChefHat, Bed, X, Sparkles, Clock, Users, Star, Plus, Minus, CheckCircle2, ShieldCheck, ChevronDown, Info, AlertCircle, ChevronLeft, ChevronRight, Baby } from "lucide-react";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";

import TimeSlotsPicker from "../TimeSlotsPicker";
import Counter from "../Counter";
import Dropdown from "../Dropdown";
import ChildAgeSelect from "../ChildAgeSelect";
import { createEventOrder, createOrder, previewOrderPrice, getEventSlotAvailability, getListingSlots, precheckEventOrder, formatEventPrecheckErrorMessage, finalizeFreeEvent, calculateExperienceTotal, calculateEventTotal } from "../../utils/api";
import LoginPromptModal from "../LoginPromptModal";
import { clearPendingCheckoutState, persistPendingCheckout } from "../../utils/paymentSession";
import { StayInlineCalendar } from "../../screens/StayDetails/StayBookingSystem";
import { calculateExperienceGuestPricing, getExperienceCommissionRate } from "../../utils/experiencePricing";


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

const isSameSlot = (left, right, leftIndex = 0, rightIndex = 0) => {
  if (!left || !right) return false;

  const leftId = getSlotId(left);
  const rightId = getSlotId(right);
  if (leftId != null && rightId != null && String(leftId) === String(rightId)) return true;

  const leftLabel = String(getSlotLabel(left, leftIndex) || "").trim().toLowerCase();
  const rightLabel = String(getSlotLabel(right, rightIndex) || "").trim().toLowerCase();
  if (leftLabel && rightLabel && leftLabel === rightLabel) return true;

  const leftStart = String(left?.startTime || left?.start_time || left?.slotStartTime || left?.time || "").trim().toLowerCase();
  const rightStart = String(right?.startTime || right?.start_time || right?.slotStartTime || right?.time || "").trim().toLowerCase();
  return Boolean(leftStart && rightStart && leftStart === rightStart);
};

const mergeDefinedSlotFields = (baseSlot, overrideSlot) => {
  const merged = { ...(baseSlot || {}) };
  Object.entries(overrideSlot || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      merged[key] = value;
    }
  });
  return merged;
};

const getExperienceBookingCutoffHours = (slot) => {
  if (!slot || typeof slot !== "object") return null;
  const schedule = slot.schedule || {};
  const rawValue =
    slot.bookingCutoffHours ??
    slot.booking_cutoff_hours ??
    schedule.bookingCutoffHours ??
    schedule.booking_cutoff_hours ??
    slot.bookingCutoffTime ??
    slot.booking_cutoff_time ??
    schedule.bookingCutoffTime ??
    schedule.booking_cutoff_time;

  if (rawValue == null || rawValue === "") return null;
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue > 0 ? rawValue : null;
  }

  const text = String(rawValue).trim();
  if (!text) return null;
  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric > 0 ? numeric : null;

  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const BOOKING_TIMEZONE = "Asia/Kolkata";

const getIndiaNow = () => moment().tz(BOOKING_TIMEZONE);

const getIndiaDateKey = (value = null) => (
  (value ? moment(value) : getIndiaNow()).tz(BOOKING_TIMEZONE).format("YYYY-MM-DD")
);

const getSlotStartTimeValue = (slot, fallback = null) => (
  slot?.startTime ??
  slot?.start_time ??
  slot?.slotStartTime ??
  slot?.slot_start_time ??
  slot?.time ??
  fallback
);

const getSlotCutoffMoment = (dateKey, startTime, cutoffConfig) => {
  if (!dateKey || !startTime) return null;

  const [year, month, day] = String(dateKey).split("-").map(Number);
  const normalizedTime = String(startTime).trim().toUpperCase();
  const meridiemMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || !meridiemMatch) {
    return null;
  }

  let hours = Number(meridiemMatch[1] || 0);
  const minutes = Number(meridiemMatch[2] || 0);
  const seconds = Number(meridiemMatch[3] || 0);
  const meridiem = meridiemMatch[4] || null;

  if (meridiem === "AM") {
    hours = hours === 12 ? 0 : hours;
  } else if (meridiem === "PM") {
    hours = hours === 12 ? 12 : hours + 12;
  }

  const slotDateTime = moment.tz(
    {
      year,
      month: Math.max(0, month - 1),
      date: day,
      hour: Number.isFinite(hours) ? hours : 0,
      minute: Number.isFinite(minutes) ? minutes : 0,
      second: Number.isFinite(seconds) ? seconds : 0,
      millisecond: 0,
    },
    BOOKING_TIMEZONE
  );
  if (!slotDateTime.isValid()) return null;

  if (cutoffConfig == null) {
    return slotDateTime;
  }

  const numericCutoff = Number(cutoffConfig);
  if (!Number.isFinite(numericCutoff) || numericCutoff <= 0) {
    return slotDateTime;
  }

  return slotDateTime.clone().subtract(numericCutoff, "hours");
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
    listing?.saleEndDate
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

const getStoredGuestSelection = (storedGuests) => {
  if (!storedGuests || typeof storedGuests !== "object") return null;
  const adults = Number(storedGuests.adults || 0) || 0;
  const children = Number(storedGuests.children || 0) || 0;
  const infants = Number(storedGuests.infants || 0) || 0;
  if (adults + children + infants <= 0) return null;

  return {
    adults,
    children,
    infants,
    childAges: Array.isArray(storedGuests.childAges) ? storedGuests.childAges : [],
  };
};

const resolveStoredExperienceSlot = (slots = [], stored = {}) => {
  if (!Array.isArray(slots) || slots.length === 0 || !stored || typeof stored !== "object") return null;

  const storedSlotId = stored.selectedSlotId != null ? String(stored.selectedSlotId) : "";
  const storedLabel = String(stored.selectedSlotLabel || stored.startTime || "").trim().toLowerCase();
  const storedTime = normalizeBookingTime(stored.selectedTimeValue || stored.startTime || "");

  return slots.find((slot) => {
    const slotId = getSlotId(slot);
    if (storedSlotId && slotId != null && String(slotId) === storedSlotId) return true;

    const slotLabel = String(slot?.slotName || slot?.slot_name || "").trim().toLowerCase();
    if (storedLabel && slotLabel && slotLabel === storedLabel) return true;

    const slotTime = normalizeBookingTime(
      slot?.startTime || slot?.start_time || slot?.slotStartTime || slot?.time || ""
    );
    if (storedTime && slotTime && storedTime === slotTime) return true;

    return false;
  }) || null;
};

const resolveStoredEventSlot = (slots = [], stored = {}) => {
  if (!Array.isArray(slots) || slots.length === 0 || !stored || typeof stored !== "object") return null;

  const storedIds = [
    ...(Array.isArray(stored.selectedEventSlotIds) ? stored.selectedEventSlotIds : []),
    stored.selectedSlotId,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map((value) => String(value));
  const storedLabel = String(stored.selectedSlotLabel || stored.startTime || "").trim().toLowerCase();
  const storedTime = normalizeBookingTime(stored.selectedTimeValue || stored.startTime || "");

  return slots.find((slot) => {
    const slotIds = [
      slot?.eventSlotId,
      slot?.slotId,
      slot?.id,
    ]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value) => String(value));
    if (storedIds.length > 0 && slotIds.some((slotId) => storedIds.includes(slotId))) return true;

    const slotLabel = String(slot?.slotName || slot?.name || slot?.label || "").trim().toLowerCase();
    if (storedLabel && slotLabel && slotLabel === storedLabel) return true;

    const slotTime = normalizeBookingTime(
      slot?.startTime || slot?.start_time || slot?.slotStartTime || slot?.time || slot?.slotName || ""
    );
    if (storedTime && slotTime && storedTime === slotTime) return true;

    return false;
  }) || null;
};

const resolveStoredEventTicketId = (tickets = [], stored = {}) => {
  if (!Array.isArray(tickets) || tickets.length === 0 || !stored || typeof stored !== "object") return "";

  const storedTicketId = stored.selectedTicketTypeId != null ? String(stored.selectedTicketTypeId).trim() : "";
  const storedTicketName = String(stored.selectedTicketTypeName || "").trim().toLowerCase();

  const matchedTicket = tickets.find((ticket, index) => {
    const ticketIds = [
      ticket?.id,
      ticket?.ticketId,
      ticket?.ticketTypeId,
      ticket?.ticket_type_id,
      ticket?.typeId,
    ]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value) => String(value));
    if (storedTicketId && ticketIds.includes(storedTicketId)) return true;

    const ticketName = String(getTicketName(ticket, index) || "").trim().toLowerCase();
    if (storedTicketName && ticketName && (ticketName === storedTicketName || ticketName.includes(storedTicketName) || storedTicketName.includes(ticketName))) return true;

    return false;
  });

  return matchedTicket
    ? String(matchedTicket?.id ?? matchedTicket?.ticketId ?? matchedTicket?.ticketTypeId ?? matchedTicket?.typeId ?? "")
    : "";
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
  const targetSlotId = slot?.slotId ?? slot?.slot_id ?? slot?.id ?? slot?.eventSlotId;
  if (targetSlotId != null) {
    const matched = records.find(
      (item) =>
        getDateKey(item?.date || item?.bookingDate || item?.booking_date) === dateKey &&
        (item?.slotId != null ? String(item.slotId) === String(targetSlotId) : true)
    );
    if (matched) return matched;
  }
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
      const availableSeats = availability?.availableSeats ?? availability?.available_seats ?? slot.availableSeats ?? slot.available_seats;
      const isAvailable = availability?.isAvailable ?? availability?.is_available ?? (availableSeats != null ? availableSeats > 0 : undefined) ?? slot.is_available ?? slot.isAvailable;
      const privateBookingEnabled = availability?.privateBookingEnabled ?? availability?.private_booking_enabled ?? slot.privateBookingEnabled ?? slot.private_booking_enabled ?? false;
      const hasPrivateBooking = availability?.hasPrivateBooking ?? availability?.has_private_booking ?? slot.hasPrivateBooking ?? slot.has_private_booking ?? false;
      const explicitPrivateBookingAvailable = availability?.privateBookingAvailable ?? availability?.private_booking_available ?? slot.privateBookingAvailable ?? slot.private_booking_available;

      const bookedSeatsForDate = availability?.bookedSeats ?? availability?.booked_seats ?? 0;
      const basePrivateAvailable = explicitPrivateBookingAvailable ?? Boolean(privateBookingEnabled && !hasPrivateBooking && isAvailable !== false);
      const privateBookingAvailable = bookedSeatsForDate > 0 ? false : basePrivateAvailable;

      return {
        ...slot,
        id: id ?? slot.id ?? slot.slotId ?? slot.slot_id ?? `slot-${index}`,
        slotId: id ?? slot.slotId ?? slot.slot_id,
        slot_id: id ?? slot.slot_id ?? slot.slotId,
        slotName: availability?.slotName ?? availability?.slot_name ?? slotName,
        slot_name: availability?.slotName ?? availability?.slot_name ?? slot.slot_name ?? slotName,
        startTime: slot.startTime || slot.start_time || schedule.startTime || schedule.start_time || "",
        endTime: slot.endTime || slot.end_time || schedule.endTime || schedule.end_time || "",
        startDate: slot.startDate || slot.start_date || schedule.startDate || schedule.start_date,
        endDate: slot.endDate || slot.end_date || schedule.endDate || schedule.end_date,
        selected_days: slot.selected_days || schedule.selected_days,
        maxSeats: availability?.maxSeats ?? availability?.max_seats ?? slot.maxSeats ?? slot.max_seats ?? capacity.maxSeats ?? capacity.max_seats,
        availableSeats,
        pricePerPerson: availability?.pricePerPerson ?? availability?.price_per_person ?? pricing.price_per_person ?? pricing.pricePerPerson ?? slot.pricePerPerson ?? slot.price_per_person ?? slot.price,
        childPricePerChild:
          pricing.child_price_per_child
          ?? pricing.childPricePerChild
          ?? slot.childPricePerChild
          ?? slot.child_price_per_child
          ?? slot.childPrice
          ?? slot.child_price,
        childPrice:
          pricing.child_price_per_child
          ?? pricing.childPricePerChild
          ?? slot.childPrice
          ?? slot.child_price
          ?? slot.childPricePerChild
          ?? slot.child_price_per_child,
        allowChildPricing:
          pricing.allow_child_pricing
          ?? pricing.allowChildPricing
          ?? slot.allowChildPricing
          ?? slot.allow_child_pricing
          ?? slot.childPricingAllowed
          ?? slot.child_pricing_allowed,
        childPricingAllowed:
          pricing.allow_child_pricing
          ?? pricing.allowChildPricing
          ?? slot.childPricingAllowed
          ?? slot.child_pricing_allowed
          ?? slot.allowChildPricing
          ?? slot.allow_child_pricing,
        childAgeFrom:
          pricing.child_age_from
          ?? pricing.childAgeFrom
          ?? slot.childAgeFrom
          ?? slot.child_age_from,
        childAgeTo:
          pricing.child_age_to
          ?? pricing.childAgeTo
          ?? slot.childAgeTo
          ?? slot.child_age_to,
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

    const todayKey = getIndiaDateKey();
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
  const todayKey = getIndiaDateKey();
  const now = getIndiaNow().toDate();
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

export function BookingSystem({ listing, type = "experience", selectedAddOns = [], triggerLabel = "Reserve Now", reserveLabel = "Reserve Experience", onUpdateAddonQuantity, externalOpen, onExternalOpenChange, hideTrigger = false, hostName: externalHostName, hostAvatar: externalHostAvatar, initialDate, initialGuests }) {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W, E, EL } } = useTheme();
  const isMountedRef = useRef(true);
  const hasHandledUnavailableRef = useRef(false);
  const [show, setShow] = useState(false);
  const [renderContent, setRenderContent] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showLeftAddonArrow, setShowLeftAddonArrow] = useState(false);
  const [showRightAddonArrow, setShowRightAddonArrow] = useState(false);

  const handleAddonsScroll = useCallback(() => {
    const container = document.getElementById("header-addons-scroll");
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftAddonArrow(scrollLeft > 0);
      setShowRightAddonArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  }, []);

  useEffect(() => {
    if (show && Array.isArray(listing?.addons) && listing.addons.length > 0) {
      setTimeout(handleAddonsScroll, 100);
      window.addEventListener("resize", handleAddonsScroll);
    }
    return () => window.removeEventListener("resize", handleAddonsScroll);
  }, [show, listing?.addons, handleAddonsScroll]);

  // Sync external open state
  const externalOpenHandledRef = useRef(false);
  const childrenDetailsRef = useRef(null);
  useEffect(() => {
    if (externalOpen === true && !show && !externalOpenHandledRef.current) {
      externalOpenHandledRef.current = true;
      setShow(true);
    }
  }, [externalOpen, show]);

  useEffect(() => {
    if (externalOpen !== true) {
      externalOpenHandledRef.current = false;
    }
  }, [externalOpen]);

  const closeBookingModal = useCallback(() => {
    externalOpenHandledRef.current = false;
    setShow(false);
    if (onExternalOpenChange) {
      onExternalOpenChange(false);
    }
  }, [onExternalOpenChange]);

  // Removed faulty useEffect that called onExternalOpenChange(show) on mount

  // Real State management
  const [startDate, setStartDate] = useState(() => initialDate ? moment(initialDate) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [guests, setGuests] = useState(() => {
    if (initialGuests && typeof initialGuests === 'object') {
      return { adults: initialGuests.adults || 0, children: initialGuests.children || 0, infants: 0, childAges: [] };
    }
    if (initialGuests && typeof initialGuests === 'number' && initialGuests > 0) {
      return { adults: initialGuests, children: 0, infants: 0, childAges: [] };
    }
    return { adults: 0, children: 0, infants: 0, childAges: [] };
  });
  const totalGuests = guests.adults + guests.children;
  const billableAdults = guests.adults;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTicketPicker, setShowTicketPicker] = useState(false);
  const [dateFilteredSlots, setDateFilteredSlots] = useState([]);
  const [dateFilteredSlotsLoaded, setDateFilteredSlotsLoaded] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [privateBooking, setPrivateBooking] = useState(false);
  const [hasAnyPrivateBookingAvailable, setHasAnyPrivateBookingAvailable] = useState(false);
  const [allFetchedSlots, setAllFetchedSlots] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [showDateWarning, setShowDateWarning] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, title: "", message: "", reason: "", ctaLabel: "Adjust Now" });
  const [apiPayableAmount, setApiPayableAmount] = useState(null);
  const [apiPayableLoading, setApiPayableLoading] = useState(false);
  const pendingRestoreRef = useRef(null);
  const pendingEventTicketRestoreRef = useRef(null);




  const isEventBooking = type === "event";
  const eventScheduleType = String(
    listing?.eventScheduleType ||
    listing?.scheduleType ||
    listing?.event_schedule_type ||
    ""
  ).trim().toLowerCase();
  const lockedSingleEventDate = useMemo(() => {
    if (!isEventBooking || eventScheduleType !== "single") return null;
    const rawDate =
      listing?.startDate ||
      listing?.eventStartDate ||
      listing?.bookingStartDate ||
      listing?.eventDate ||
      listing?.date;
    if (!rawDate) return null;
    const parsed = moment(rawDate);
    return parsed.isValid() ? parsed : null;
  }, [
    eventScheduleType,
    isEventBooking,
    listing?.bookingStartDate,
    listing?.date,
    listing?.eventDate,
    listing?.eventStartDate,
    listing?.startDate,
  ]);
  const isSingleEventSchedule = Boolean(lockedSingleEventDate);

  useEffect(() => {
    if (!isSingleEventSchedule || !lockedSingleEventDate) return;
    setStartDate((current) => {
      if (current && moment(current).isSame(lockedSingleEventDate, "day")) return current;
      return lockedSingleEventDate.clone();
    });
  }, [isSingleEventSchedule, lockedSingleEventDate]);

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

  const getBookingErrorDetails = useCallback((error) => {
    const errorPayload = error?.response?.data;
    if (errorPayload && (errorPayload.results || errorPayload.canBook === false)) {
      return formatEventPrecheckErrorMessage(errorPayload);
    }
    const rawMessage = getBookingErrorMessage(error);
    const availabilityMatch = rawMessage.match(/only\s+(\d+)\s+seat\(s\)\s+available\s+for\s+"([^"]+)"\s+on\s+([0-9-]+)/i);
    const requestedMatch = rawMessage.match(/you\s+requested\s+(\d+)\s+seat\(s\)/i);

    if (availabilityMatch) {
      const availableSeats = Number(availabilityMatch[1] || 0);
      const slotName = availabilityMatch[2] || "this slot";
      const bookingDate = availabilityMatch[3] || "the selected date";
      const requestedSeats = Number(requestedMatch?.[1] || 0);

      if (availableSeats <= 0) {
        return {
          title: "Seats Temporarily Unavailable",
          message: `Sorry, requested seats are not available for "${slotName}" on ${bookingDate}.`,
          reason: "These seats are currently on hold for another booking. Please try again after 10 - 15 minutes, or choose another slot now.",
          ctaLabel: "Choose Another Slot",
        };
      }

      return {
        title: "Limited Availability",
        message: `Only ${availableSeats} seat${availableSeats === 1 ? "" : "s"} are available for "${slotName}" on ${bookingDate}.${requestedSeats > 0 ? ` You requested ${requestedSeats} seat${requestedSeats === 1 ? "" : "s"}.` : ""}`,
        reason: "Please reduce the guest count or choose a different slot to continue.",
        ctaLabel: "Adjust Guests",
      };
    }

    return {
      title: "Booking Error",
      message: rawMessage,
      reason: "",
      ctaLabel: "Adjust Now",
    };
  }, [getBookingErrorMessage]);

  const showErrorPopup = useCallback((message, title = "Booking Error", options = {}) => {
    setErrorPopup({
      visible: true,
      title,
      message: String(message || "Unable to proceed with this booking right now."),
      reason: String(options.reason || ""),
      ctaLabel: String(options.ctaLabel || "Adjust Now"),
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

  // Lock body scroll when modal is open and handle deferred content rendering
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      if (window.innerWidth <= 768) {
        // On mobile, defer the heavy render so the opening animation starts instantly
        const timer = setTimeout(() => setRenderContent(true), 50);
        return () => {
          clearTimeout(timer);
          document.body.style.overflow = "";
        };
      } else {
        setRenderContent(true);
        return () => {
          document.body.style.overflow = "";
        };
      }
    } else {
      document.body.style.overflow = "";
      // Unmount content after exit animation finishes
      const timer = setTimeout(() => setRenderContent(false), 300);
      return () => clearTimeout(timer);
    }
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
          //console.log("🔄 Restoring persistent booking state after auth redirect:", stored);

          pendingRestoreRef.current = stored;
          pendingEventTicketRestoreRef.current = stored;

          if (stored.startDate) {
            const parsedDate = moment(stored.startDate);
            if (parsedDate.isValid()) {
              setStartDate(parsedDate);
            }
          }
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

  const selectedTicket = useMemo(() => {
    if (!isEventBooking) return null;
    if (selectedTicketTypeId) {
      return eventTickets.find(
        (ticket) => String(ticket.id ?? ticket.ticketTypeId ?? ticket.typeId) === String(selectedTicketTypeId)
      ) || null;
    }
    return eventTickets.length === 1 ? eventTickets[0] : null;
  }, [eventTickets, isEventBooking, selectedTicketTypeId]);
  const ticketSaleWindow = useMemo(() => (
    isEventBooking ? getTicketSaleWindow(listing, selectedTicket) : { isOpen: true, status: "open", message: "" }
  ), [isEventBooking, listing, selectedTicket]);
  const eventFallbackSlots = useMemo(() => (
    listing?.eventSlots || listing?.slots || listing?.timeSlots || []
  ), [listing?.eventSlots, listing?.slots, listing?.timeSlots]);
  const baseTimeSlots = useMemo(() => (
    normalizeExperienceSlots(Array.isArray(listing?.timeSlots) ? listing.timeSlots : [])
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
    return sourceSlots.map((slot, index) => {
      const baseMatch = baseTimeSlots.find((baseSlot, baseIndex) => isSameSlot(baseSlot, slot, baseIndex, index));
      return baseMatch ? mergeDefinedSlotFields(baseMatch, slot) : slot;
    }).filter((slot) => {
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

    if (privateBooking) {
      const blockedDates = new Set();
      if (Array.isArray(listing?.availability)) {
        listing.availability.forEach((avail) => {
          const booked = avail?.booked_seats ?? avail?.bookedSeats ?? 0;
          if (booked > 0) {
            const key = getDateKey(avail.date);
            if (key) blockedDates.add(key);
          }
        });
      }
      const allSlots = [
        ...(Array.isArray(listing?.slots) ? listing.slots : []),
        ...(Array.isArray(baseTimeSlots) ? baseTimeSlots : []),
        ...(Array.isArray(allFetchedSlots) ? allFetchedSlots : [])
      ];
      allSlots.forEach(slot => {
        if (Array.isArray(slot?.availability)) {
          slot.availability.forEach(avail => {
            const booked = avail?.booked_seats ?? avail?.bookedSeats ?? 0;
            if (booked > 0) {
              const key = getDateKey(avail.date);
              if (key) blockedDates.add(key);
            }
          });
        }
      });
      blockedDates.forEach((key) => keys.delete(key));
    }

    return keys;
  }, [baseTimeSlots, dateFilteredSlots, isEventBooking, listing, privateBooking, allFetchedSlots]);

  const hasTodayValidSlots = useMemo(() => {
    const indiaNow = getIndiaNow();
    const todayKey = getIndiaDateKey(indiaNow);
    const todayFullyBookedSlotIds = collectFullyBookedSlotIdsForDate(listing, todayKey);

    if (isEventBooking) {
      const validEventSlots = eventSlots.filter((slot, index) => {
        if (!slot || typeof slot !== "object") return false;

        const slotKeys = new Set();
        addDateRangeKeys(
          slotKeys,
          slot.slotStartDate || slot.slotDate || slot.date || slot.eventDate || slot.startDate,
          slot.slotEndDate || slot.endDate || slot.end_date
        );

        if (slotKeys.size > 0 && !slotKeys.has(todayKey)) return false;

        const slotId = getSlotId(slot);
        if (slotId != null && todayFullyBookedSlotIds.has(String(slotId))) return false;

        const isUnavailable = asOptionalBoolean(slot?.isAvailable ?? slot?.is_available) === false;
        if (isUnavailable) return false;

        const availableSeats = asNumber(slot?.availableSeats ?? slot?.available_seats);
        if (availableSeats != null && availableSeats <= 0) return false;

        const startTime = slot.startTime || slot.start_time || slot.slotStartTime || slot.time;
        if (startTime) {
          const slotStartTimeValue = getSlotStartTimeValue(slot, startTime);
          const cutoffMoment = getSlotCutoffMoment(todayKey, String(slotStartTimeValue), getExperienceBookingCutoffHours(slot));
          if (cutoffMoment && indiaNow.isAfter(cutoffMoment)) {
            return false;
          }
        }

        return true;
      });

      return validEventSlots.length > 0;
    }

    const weekday = indiaNow.day();

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
        if (indiaNow.toDate() < start) return false;
      }
      if (slotEnd) {
        const end = makeLocalDate(getDateKey(slotEnd));
        if (indiaNow.toDate() > end) return false;
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
        const slotStartTimeValue = getSlotStartTimeValue(slot, startTime);
        const cutoffMoment = getSlotCutoffMoment(todayKey, String(slotStartTimeValue), getExperienceBookingCutoffHours(slot));
        if (cutoffMoment && indiaNow.isAfter(cutoffMoment)) {
          return false;
        }
      }

      return true;
    });

    return validSlots.length > 0;
  }, [baseTimeSlots, dateFilteredSlots, eventSlots, listing, isEventBooking, privateBookedSlotIds]);



  useEffect(() => {
    if (!isEventBooking || !show || !eventIdForAvailability) return;

    let cancelled = false;
    setEventAvailabilityLoading(true);
    setEventAvailabilityError("");

    getEventSlotAvailability(eventIdForAvailability)
      .then((payload) => {
        if (cancelled || !isMountedRef.current) return;
        const normalized = normalizeEventAvailability(payload);
        //console.log("Event slot availability raw payload:", payload);
        //console.log("Event slot availability normalized records:", normalized);
        setEventAvailabilityRecords(normalized);

        if (pendingRestoreRef.current) {
          const stored = pendingRestoreRef.current;
          pendingRestoreRef.current = null;
          const resolvedStoredSlot = resolveStoredEventSlot(eventSlots, stored);
          if (resolvedStoredSlot) {
            const resolvedSlotId = String(
              resolvedStoredSlot.eventSlotId ??
              resolvedStoredSlot.slotId ??
              resolvedStoredSlot.id
            );
            setSelectedEventSlotIds([resolvedSlotId]);
            setStartTime(
              resolvedStoredSlot.slotName ||
              resolvedStoredSlot.name ||
              resolvedStoredSlot.label ||
              stored.selectedSlotLabel ||
              stored.startTime ||
              null
            );
          } else if (Array.isArray(stored.selectedEventSlotIds) && stored.selectedEventSlotIds.length > 0) {
            setSelectedEventSlotIds(stored.selectedEventSlotIds.map((value) => String(value)));
          }
          pendingEventTicketRestoreRef.current = stored;
          if (!resolvedStoredSlot && stored.startTime !== undefined) setStartTime(stored.startTime);
          const restoredGuests = getStoredGuestSelection(stored.guests);
          if (restoredGuests) setGuests(restoredGuests);
          if (stored.privateBooking !== undefined) setPrivateBooking(stored.privateBooking);
        }
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
      if (!pendingRestoreRef.current) {
        setSelectedEventSlotIds([]);
        setStartTime(null);
      }
      return;
    }

    if (!pendingRestoreRef.current) {
      setStartTime(null);
      setShowTimePicker(false);
    }

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
        /*console.log("[BookingSystem] getListingSlots debug", {
          selectedDateKey,
          listingId,
          rawPayload: payload,
          unwrappedSlots: unwrapSlotsPayload(payload),
          normalizedSlots: normalized,
          baseTimeSlots,
        });*/
        setDateFilteredSlots(normalized);
        setDateFilteredSlotsLoaded(true);

        if (pendingRestoreRef.current) {
          const stored = pendingRestoreRef.current;
          pendingRestoreRef.current = null;

          if (stored.startTime || stored.selectedSlotId || stored.selectedSlotLabel || stored.selectedTimeValue) {
            const targetSlot = resolveStoredExperienceSlot(normalized, stored);
            let isValid = false;

            if (targetSlot && targetSlot.isAvailable !== false) {
              const restoredGuests = getStoredGuestSelection(stored.guests);
              const totalStoredGuests = (restoredGuests?.adults || 0) + (restoredGuests?.children || 0);
              const limit = getSlotSeatLimit(targetSlot);
              if (limit === undefined || limit >= totalStoredGuests) {
                isValid = true;
              }
            }

            if (isValid) {
              setStartTime(targetSlot.slotName || targetSlot.startTime || stored.selectedSlotLabel || stored.startTime);
              const restoredGuests = getStoredGuestSelection(stored.guests);
              if (restoredGuests) setGuests(restoredGuests);
              if (stored.privateBooking !== undefined) setPrivateBooking(stored.privateBooking);
            } else {
              setStartTime(null);
              setErrorPopup({
                visible: true,
                title: "Slot Unavailable",
                message: "The slot you previously selected is no longer available. Please choose another available time slot."
              });
            }
          }
        }
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
    if (pendingEventTicketRestoreRef.current) {
      const availableTickets = ticketsForSelectedSlot.length > 0 ? ticketsForSelectedSlot : eventTickets;
      const restoredTicketId = resolveStoredEventTicketId(
        availableTickets,
        pendingEventTicketRestoreRef.current
      );
      if (restoredTicketId) {
        if (selectedTicketTypeId !== restoredTicketId) {
          setSelectedTicketTypeId(restoredTicketId);
        }
        pendingEventTicketRestoreRef.current = null;
        return;
      }
      if (availableTickets.length > 0) {
        const fallbackTicketId = String(
          availableTickets[0]?.id ??
          availableTickets[0]?.ticketId ??
          availableTickets[0]?.ticketTypeId ??
          availableTickets[0]?.typeId ??
          ""
        );
        if (fallbackTicketId) {
          if (selectedTicketTypeId !== fallbackTicketId) {
            setSelectedTicketTypeId(fallbackTicketId);
          }
          pendingEventTicketRestoreRef.current = null;
          return;
        }
      }
    }
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

    if (hasAnyPrivateBookingAvailable) return true;

    const sourceSlots = [
      ...(Array.isArray(dateFilteredSlots) ? dateFilteredSlots : []),
      ...(Array.isArray(baseTimeSlots) ? baseTimeSlots : []),
    ];

    const anySlotSupportsPrivate = sourceSlots.some((slot) => (
      asOptionalBoolean(slot?.privateBookingEnabled) === true ||
      asOptionalBoolean(slot?.private_booking_enabled) === true
    ));

    if (anySlotSupportsPrivate) return true;

    const listingPrivateSetting =
      asOptionalBoolean(listing?.privateBookingEnabled) ??
      asOptionalBoolean(listing?.private_booking_enabled) ??
      asOptionalBoolean(listing?.privateOptionEnabled) ??
      asOptionalBoolean(listing?.private_option_enabled);

    return listingPrivateSetting === true;
  }, [isEventBooking, listing, dateFilteredSlots, baseTimeSlots, hasAnyPrivateBookingAvailable]);
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
  const baseExperiencePrice = selectedSlotData?.pricePerPerson
    || listing?.timeSlots?.[0]?.pricePerPerson
    || listing?.pricing?.basePrice
    || listing?.basePrice
    || listing?.price
    || listing?.b2cPrice
    || "0";

  const rawExperiencePrice = privateBooking
    ? (selectedSlotData?.privateBookingPrice
      ?? selectedSlotData?.private_booking_price
      ?? listing?.timeSlots?.[0]?.privateBookingPrice
      ?? listing?.timeSlots?.[0]?.private_booking_price
      ?? baseExperiencePrice)
    : baseExperiencePrice;

  // Group pricing: override rawExperiencePrice if guest count matches a tier (not applicable for private bookings)
  const groupPricingRules = !isEventBooking && !privateBooking
    ? (selectedSlotData?.group_booking_pricing || selectedSlotData?.groupBookingPricing || [])
    : [];
  const groupOverridePrice = !privateBooking ? getGroupPricingTierPrice(groupPricingRules, billableAdults) : null;
  // Effective raw base price: group tier wins when matched, else use slot/listing price
  const effectiveRawPrice = (!privateBooking && groupOverridePrice != null && groupOverridePrice > 0)
    ? groupOverridePrice
    : rawExperiencePrice;

  const experienceGuestPricing = !isEventBooking
    ? calculateExperienceGuestPricing(effectiveRawPrice, listing, startDate)
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
    : (
      selectedSlotData?.childPricePerChild
      ?? selectedSlotData?.childPrice
      ?? listing?.childPricePerChild
      ?? listing?.childPrice
      ?? listing?.pricing?.childPricePerChild
      ?? 0
    );
  const eventChildPricingTiers = isEventBooking && selectedTicket
    ? (selectedTicket.childPricingTiers || selectedTicket.child_pricing_tiers || [])
    : [];
  const eventHasExplicitChildPrice = isEventBooking && selectedTicket
    ? Object.prototype.hasOwnProperty.call(selectedTicket, "childPrice") ||
    Object.prototype.hasOwnProperty.call(selectedTicket, "child_price") ||
    eventChildPricingTiers.length > 0
    : false;
  const allowChildPricing = asBoolean(
    isEventBooking
      ? (listing?.allowChildPricing ?? listing?.childPricingAllowed)
      : (
        selectedSlotData?.allowChildPricing
        ?? selectedSlotData?.childPricingAllowed
        ?? listing?.allowChildPricing
        ?? listing?.childPricingAllowed
      ),
    false
  );
  const childGuestPricing = childrenAllowed && rawChildPrice > 0
    ? (isEventBooking
      ? calculateEventGuestPricing(rawChildPrice, listing?.pricing, listing?.earlyBirdDiscounts, startDate)
      : calculateExperienceGuestPricing(rawChildPrice, listing, startDate))
    : null;
  // Effective per-child price (after discount + tax), fallback to adult price if no child price set
  const effectiveChildPrice = childGuestPricing
    ? childGuestPricing.finalUnitPrice
    : (eventHasExplicitChildPrice ? Number(rawChildPrice || 0) : extractedPrice);
  const experienceChildPricingTiers = !isEventBooking
    ? (selectedSlotData?.childPricingTiers || selectedSlotData?.child_pricing_tiers || [])
    : [];
  const childAgeFrom = asNumber(
    selectedSlotData?.childAgeFrom
    ?? listing?.childAgeFrom
    ?? listing?.pricing?.childAgeFrom
  );
  const childAgeTo = asNumber(
    selectedSlotData?.childAgeTo
    ?? listing?.childAgeTo
    ?? listing?.pricing?.childAgeTo
  );
  const hasChildAgeRange = childAgeFrom != null && childAgeTo != null && childAgeTo >= childAgeFrom;
  const showExperienceChildAgeHint = !isEventBooking && allowChildPricing && childrenAllowed && hasChildAgeRange;
  const hasChildPricing = childrenAllowed && rawChildPrice > 0 && guests.children > 0;
  const baseAdultPricePerPerson = parseFloat(effectiveRawPrice || 0);

  let eventChildPriceTotal = 0;
  let experienceChildPriceTotal = 0;
  const childAgeWarnings = {};
  if (isEventBooking && selectedTicket && guests.children > 0) {
    for (let i = 0; i < guests.children; i++) {
      const age = guests.childAges?.[i] ?? 0;
      let matchedPrice = 0; // Default price is 0 if no tier matches
      const tiers = eventChildPricingTiers;
      const tier = tiers.find(t => age >= (t.ageFrom ?? t.age_from ?? 0) && age <= (t.ageTo ?? t.age_to ?? 100));
      if (tier) {
        matchedPrice = Number(tier.pricePerChild ?? tier.price_per_child ?? tier.price ?? 0);
      } else if (tiers.length > 0) {
        const maxAge = Math.max(...tiers.map(t => t.ageTo ?? t.age_to ?? 100));
        const minAge = Math.min(...tiers.map(t => t.ageFrom ?? t.age_from ?? 0));
        if (age > maxAge) {
          matchedPrice = Number(effectiveEventPrice?.price || 0);
          childAgeWarnings[i] = 'adult';
        } else if (age < minAge) {
          matchedPrice = 0;
          childAgeWarnings[i] = 'free';
        }
      } else {
        matchedPrice = (allowChildPricing || eventHasExplicitChildPrice)
          ? Number(rawChildPrice || 0)
          : Number(effectiveEventPrice?.price || 0);
      }
      eventChildPriceTotal += matchedPrice;
    }
  }
  if (!isEventBooking && guests.children > 0) {
    const tiers = Array.isArray(experienceChildPricingTiers) ? experienceChildPricingTiers : [];
    for (let i = 0; i < guests.children; i++) {
      const age = guests.childAges?.[i] ?? 0;
      let matchedPrice = null;

      if (allowChildPricing && age >= 0) {
        if (tiers.length > 0) {
          const tier = tiers.find((item) => {
            const min = asNumber(item?.ageFrom ?? item?.age_from);
            const max = asNumber(item?.ageTo ?? item?.age_to);
            if (min == null || max == null) return false;
            return age >= min && age <= max;
          });
          if (tier) {
            matchedPrice = Number(tier?.pricePerChild ?? tier?.price_per_child ?? tier?.price ?? 0);
          } else {
            const minAge = Math.min(...tiers.map((item) => asNumber(item?.ageFrom ?? item?.age_from) ?? 0));
            const maxAge = Math.max(...tiers.map((item) => asNumber(item?.ageTo ?? item?.age_to) ?? 0));
            if (age > maxAge) {
              matchedPrice = Number(effectiveRawPrice || 0);
              childAgeWarnings[i] = "adult";
            } else if (age < minAge) {
              matchedPrice = 0;
              childAgeWarnings[i] = "free";
            }
          }
        } else if (hasChildAgeRange) {
          if (age > childAgeTo) {
            matchedPrice = Number(effectiveRawPrice || 0);
            childAgeWarnings[i] = "adult";
          } else if (age < childAgeFrom) {
            matchedPrice = 0;
            childAgeWarnings[i] = "free";
          }
        }
      }

      if (matchedPrice == null) {
        matchedPrice = allowChildPricing ? Number(rawChildPrice || 0) : Number(effectiveRawPrice || 0);
      }

      experienceChildPriceTotal += matchedPrice;
    }
  }

  const isEventTieredChildPricing = isEventBooking && guests.children > 0 && eventChildPricingTiers.length > 0;
  const isExperienceTieredChildPricing = !isEventBooking && guests.children > 0 && experienceChildPricingTiers.length > 0;
  const actualHasChildPricing = hasChildPricing || eventHasExplicitChildPrice || isEventTieredChildPricing || isExperienceTieredChildPricing;

  const baseChildPricePerChild = actualHasChildPricing
    ? parseFloat(rawChildPrice || 0)
    : baseAdultPricePerPerson;

  const buildChildReceiptRows = ({ currencySymbol, isEvent, adultUnitPrice, childTiers, allowCP, rawCP }) => {
    const childRows = [];
    if (!guests.children || guests.children <= 0) return childRows;

    const tiers = isEvent
      ? (Array.isArray(eventChildPricingTiers) ? eventChildPricingTiers : [])
      : (Array.isArray(experienceChildPricingTiers) ? experienceChildPricingTiers : []);
    const groups = {};

    for (let i = 0; i < guests.children; i++) {
      const age = guests.childAges?.[i] ?? 0;
      let matchedPrice = 0;
      let ageRange = null;
      let isFree = false;
      let sortOrder = 50;

      if (tiers.length > 0) {
        const tier = tiers.find(t => age >= (t.ageFrom ?? t.age_from ?? 0) && age <= (t.ageTo ?? t.age_to ?? 100));
        if (tier) {
          const from = tier.ageFrom ?? tier.age_from ?? 0;
          const to = tier.ageTo ?? tier.age_to ?? 100;
          ageRange = `${from}–${to} yrs`;
          matchedPrice = Number(tier.pricePerChild ?? tier.price_per_child ?? tier.price ?? 0);
          isFree = matchedPrice === 0;
          sortOrder = from;
        } else {
          const minAge = Math.min(...tiers.map(t => t.ageFrom ?? t.age_from ?? 0));
          const maxAge = Math.max(...tiers.map(t => t.ageTo ?? t.age_to ?? 100));
          if (age < minAge) {
            ageRange = minAge === 1 ? "Under 1 yr" : (minAge > 0 ? `0–${minAge - 1} yrs` : `< ${minAge} yrs`);
            matchedPrice = 0;
            isFree = true;
            sortOrder = -1;
          } else if (age > maxAge) {
            ageRange = `> ${maxAge} yrs`;
            matchedPrice = isEvent ? Number(effectiveEventPrice?.price || adultUnitPrice || 0) : adultUnitPrice;
            isFree = false;
            sortOrder = 900 + maxAge;
          } else {
            ageRange = `Age ${age}`;
            matchedPrice = allowCP ? Number(rawCP || 0) : adultUnitPrice;
            isFree = matchedPrice === 0;
            sortOrder = age;
          }
        }
      } else if (!isEvent && allowCP && hasChildAgeRange) {
        if (age < childAgeFrom) {
          ageRange = childAgeFrom === 1 ? "Under 1 yr" : (childAgeFrom > 0 ? `0–${childAgeFrom - 1} yrs` : `< ${childAgeFrom} yrs`);
          matchedPrice = 0;
          isFree = true;
          sortOrder = -1;
        } else if (age > childAgeTo) {
          ageRange = `> ${childAgeTo} yrs`;
          matchedPrice = adultUnitPrice;
          isFree = false;
          sortOrder = 900 + childAgeTo;
        } else {
          ageRange = `${childAgeFrom}–${childAgeTo} yrs`;
          matchedPrice = Number(rawCP || 0);
          isFree = matchedPrice === 0;
          sortOrder = childAgeFrom;
        }
      } else {
        ageRange = (!isEvent && hasChildAgeRange) ? `${childAgeFrom}–${childAgeTo} yrs` : null;
        matchedPrice = allowCP ? Number(rawCP || 0) : adultUnitPrice;
        isFree = matchedPrice === 0;
        sortOrder = 50;
      }

      const key = `${ageRange || "default"}_${matchedPrice}`;
      if (!groups[key]) {
        groups[key] = { ageRange, price: matchedPrice, isFree, count: 0, sortOrder };
      }
      groups[key].count += 1;
    }

    Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder).forEach((group) => {
      const rangePrefix = group.ageRange ? `${group.ageRange}: ` : "";
      const priceLabel = (group.isFree || group.price === 0) ? "Free" : `${currencySymbol} ${group.price.toFixed(2)}`;
      const countLabel = `${group.count} ${group.count === 1 ? "child" : "children"}`;
      const title = (group.isFree || group.price === 0)
        ? `${rangePrefix}Free × ${countLabel}`
        : `${rangePrefix}${priceLabel} × ${countLabel}`;
      const content = `${currencySymbol} ${(group.price * group.count).toFixed(2)}`;

      childRows.push({
        title,
        content,
        kind: "base-child",
        showInCheckout: true,
      });
    });

    return childRows;
  };

  const data = {
    price: extractedPrice,
    unit: isEventBooking ? "ticket" : (type === "stay" ? "night" : "person"),
    icon: type === "stay" ? Bed : (type === "food" ? ChefHat : Ticket)
  };

  // Compute totals with child pricing split
  // Private experience bookings have a flat price — not multiplied by guest/child count
  const adultSubtotal = (privateBooking && !isEventBooking)
    ? parseFloat(extractedPrice || 0)
    : parseFloat(extractedPrice || 0) * guests.adults;
  const childSubtotal = (privateBooking && !isEventBooking)
    ? 0
    : (isEventBooking ? eventChildPriceTotal : experienceChildPriceTotal);
  const baseTotal = adultSubtotal + childSubtotal;
  const rawBaseTotal = !isEventBooking
    ? (privateBooking
        ? parseFloat(effectiveRawPrice || 0)  // flat private price
        : (baseAdultPricePerPerson * guests.adults) + experienceChildPriceTotal)
    : ((eventGuestPricing.baseUnitPrice * guests.adults) + eventChildPriceTotal);
  const activeGuestPricing = isEventBooking ? eventGuestPricing : experienceGuestPricing;
  const appliedDiscountRate = activeGuestPricing?.discountRate ?? 0;
  const appliedTaxRate = activeGuestPricing?.customerTaxRate ?? 0;
  const subtotalBeforeAdjustments = rawBaseTotal + addOnsTotal;
  const discountableAmount = subtotalBeforeAdjustments;
  const totalDiscountAmount = discountableAmount * (appliedDiscountRate / 100);
  const totalPromoDiscountAmount = discountableAmount * ((activeGuestPricing?.promoDiscountRate || 0) / 100);
  const totalEarlyBirdDiscountAmount = discountableAmount * ((activeGuestPricing?.earlyBirdDiscountRate || 0) / 100);

  const taxableSubtotal = Math.max(0, discountableAmount - totalDiscountAmount);
  const totalTaxAmount = taxableSubtotal * (appliedTaxRate / 100);
  const finalTotal = Math.floor((taxableSubtotal + totalTaxAmount) * 100) / 100;

  useEffect(() => {
    if (!show || isEventBooking) return;
    /*console.log("[BookingSystem] pricing selection debug", {
      selectedDateKey,
      startTime,
      guests,
      selectedSlotData,
      staleSelectedSlotData,
      baseTimeSlots,
      dateFilteredSlots,
      timeSlots,
      rawExperiencePrice,
      rawChildPrice,
      allowChildPricing,
      childrenAllowed,
      hasChildPricing,
      baseAdultPricePerPerson,
      baseChildPricePerChild,
      extractedPrice,
      effectiveChildPrice,
      adultSubtotal,
      childSubtotal,
      rawBaseTotal,
      subtotalBeforeAdjustments,
      totalDiscountAmount,
      totalPromoDiscountAmount,
      totalEarlyBirdDiscountAmount,
      totalTaxAmount,
      finalTotal,
    });*/
  }, [
    show,
    isEventBooking,
    selectedDateKey,
    startTime,
    guests,
    selectedSlotData,
    staleSelectedSlotData,
    baseTimeSlots,
    dateFilteredSlots,
    timeSlots,
    rawExperiencePrice,
    rawChildPrice,
    allowChildPricing,
    childrenAllowed,
    hasChildPricing,
    baseAdultPricePerPerson,
    baseChildPricePerChild,
    extractedPrice,
    effectiveChildPrice,
    adultSubtotal,
    childSubtotal,
    rawBaseTotal,
    subtotalBeforeAdjustments,
    totalDiscountAmount,
    totalPromoDiscountAmount,
    totalEarlyBirdDiscountAmount,
    totalTaxAmount,
    finalTotal,
  ]);

  // Dynamic Experience & Event Pricing API total fetch
  useEffect(() => {
    if (!show) {
      setApiPayableAmount(null);
      return;
    }

    const adultCount = Number(guests?.adults || 0);
    if (adultCount <= 0) {
      setApiPayableAmount(null);
      return;
    }

    const formattedAddons = selectedAddOns.map(item => {
      const addon = item.addon || item;
      const addonId = Number(addon.addonId || addon.id || item.addonId || item.id);
      const quantity = Number(item.quantity || addon.quantity || 1) || 1;
      return { addonId, quantity };
    }).filter(a => Boolean(a.addonId));

    if (isEventBooking) {
      const eventId = Number(listing?.eventId ?? listing?.event_id ?? listing?.id ?? listing?.listingId);
      if (!eventId) return;

      const resolvedSlotId = Number(selectedEventSlot?.eventSlotId ?? selectedEventSlot?.id ?? selectedEventSlot?.slotId ?? selectedEventSlotId) || null;
      const rawDate = startDate || selectedDateKey;
      const bookingDate = rawDate ? moment(rawDate).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
      const bookingTime = selectedEventSlot?.startTime || selectedEventSlot?.slotName || startTime || "";
      const adultCount = Number(guests?.adults || 0);
      const childCount = Number(guests?.children || 0);
      const numberOfGuests = adultCount + childCount;

      let childAges = Array.isArray(guests?.childAges) ? guests.childAges.map(Number).filter(a => Number.isFinite(a)) : [];
      if (childCount > 0) {
        if (childAges.length > childCount) {
          childAges = childAges.slice(0, childCount);
        } else {
          while (childAges.length < childCount) {
            childAges.push(5);
          }
        }
      } else {
        childAges = [];
      }

      const ticketTypeId = Number(selectedTicket?.id ?? selectedTicket?.ticketTypeId ?? selectedTicket?.typeId ?? selectedTicketTypeId) || 1;
      const ticketTypeName = selectedTicket?.ticketName || selectedTicket?.name || selectedTicket?.typeName || "General Admission";
      const quantity = numberOfGuests;
      const childQuantity = childCount;
      const pricePerTicket = Number(effectiveEventPrice?.price ?? eventPrice ?? selectedTicket?.price ?? listing?.price ?? 0);
      const originalPricePerTicket = Number(selectedTicket?.originalPrice ?? selectedTicket?.price ?? listing?.originalPrice ?? listing?.price ?? pricePerTicket);
      const groupDiscountApplied = Boolean(totalEarlyBirdDiscountAmount > 0 || totalDiscountAmount > 0);
      const groupDiscountAmount = Number(totalEarlyBirdDiscountAmount || totalDiscountAmount || 0);

      const tickets = [
        {
          ticketTypeId,
          ticketTypeName,
          quantity,
          childQuantity,
          pricePerTicket,
          originalPricePerTicket,
          groupDiscountApplied,
          groupDiscountAmount,
        }
      ];

      const formattedEventAddons = selectedAddOns.map((item) => {
        const addon = item.addon || item;
        const addonId = Number(addon.addonId || addon.id || item.addonId || item.id);
        if (!addonId) return null;
        return {
          addonId,
          addonName: addon.title || addon.name || addon.addonName || "Add-on",
          addonPrice: parseFloat(addon.price || addon.addonPrice || addon.pricePerUnit || 0),
          quantity: Number(item.quantity || addon.quantity || 1) || 1,
        };
      }).filter(Boolean);

      const payload = {
        booking: {
          eventId,
          ...(resolvedSlotId ? { eventSlotId: resolvedSlotId } : {}),
          bookingDate,
          ...(bookingTime ? { bookingTime } : {}),
          numberOfGuests,
          adultCount,
          childCount,
          childAges,
          tickets,
          addons: formattedEventAddons,
        }
      };

      let cancelled = false;
      setApiPayableLoading(true);

      calculateEventTotal(payload)
        .then((res) => {
          if (cancelled) return;
          const amount = res?.finalPayableAmount ?? res?.data?.finalPayableAmount ?? res?.amount ?? res?.total;
          if (amount != null && Number.isFinite(Number(amount))) {
            setApiPayableAmount(Number(amount));
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn("calculateEventTotal error:", err);
        })
        .finally(() => {
          if (!cancelled) setApiPayableLoading(false);
        });

      return () => {
        cancelled = true;
      };
    } else {
      const listingId = Number(listing?.listingId || listing?.id || listing?.experienceId);
      if (!listingId) return;

      const bookingDate = startDate ? moment(startDate).format("YYYY-MM-DD") : (selectedDateKey || null);
      const bookingTime = selectedSlotData?.startTime || selectedSlotData?.start_time || startTime || null;
      const bookingSlotId = Number(selectedSlotData?.slotId ?? selectedSlotData?.id ?? selectedSlotData?.slot_id) || null;
      const childCount = Number(guests?.children || 0);
      const childAges = Array.isArray(guests?.childAges) ? guests.childAges.map(Number).filter(a => Number.isFinite(a)) : [];
      const isPrivate = Boolean(privateBooking);

      const payload = {
        booking: {
          listingId,
          bookingDate,
          bookingTime,
          bookingSlotId,
          guestCount: adultCount,
          childCount,
          childAges,
          isPrivateBooking: isPrivate,
          addons: formattedAddons,
        }
      };

      let cancelled = false;
      setApiPayableLoading(true);

      calculateExperienceTotal(payload)
        .then((res) => {
          if (cancelled) return;
          const amount = res?.finalPayableAmount ?? res?.data?.finalPayableAmount ?? res?.amount ?? res?.total;
          if (amount != null && Number.isFinite(Number(amount))) {
            setApiPayableAmount(Number(amount));
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn("calculateExperienceTotal error:", err);
        })
        .finally(() => {
          if (!cancelled) setApiPayableLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [
    isEventBooking,
    show,
    listing?.listingId,
    listing?.id,
    listing?.experienceId,
    listing?.eventId,
    listing?.event_id,
    startDate,
    selectedDateKey,
    startTime,
    selectedSlotData,
    selectedEventSlot,
    selectedEventSlotId,
    selectedTicket,
    selectedTicketTypeId,
    effectiveEventPrice,
    eventPrice,
    guests,
    privateBooking,
    selectedAddOns,
  ]);

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
      const clamped = clampGuestsToSeatLimit(nextGuests);

      let nextChildAges = [...(current.childAges || [])];
      if (clamped.children > nextChildAges.length) {
        nextChildAges = [...nextChildAges, ...Array(clamped.children - nextChildAges.length).fill(0)];
      } else if (clamped.children < nextChildAges.length) {
        nextChildAges = nextChildAges.slice(0, clamped.children);
      }

      return { ...clamped, childAges: nextChildAges };
    });
  }, [clampGuestsToSeatLimit]);

  const updateChildAge = useCallback((index, age) => {
    setGuests(current => {
      const nextAges = [...(current.childAges || [])];
      nextAges[index] = Number(age);
      return { ...current, childAges: nextAges };
    });
  }, []);

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

    if (!isEventBooking && startDate && startTime && timeSlots && timeSlots.length > 0) {
      const selectedSlotObj = timeSlots.find(s => (s.slotName === startTime || s.slot_name === startTime || s.startTime === startTime || s.start_time === startTime || s.id?.toString() === startTime || s.slotId?.toString() === startTime));
      const baseSlotObj = (listing?.timeSlots || []).find(s => (s.slotName === startTime || s.slot_name === startTime || s.startTime === startTime || s.start_time === startTime || s.id?.toString() === startTime || s.slotId?.toString() === startTime));
      const cutoffHours = getExperienceBookingCutoffHours(selectedSlotObj) ?? getExperienceBookingCutoffHours(baseSlotObj);
      const selectedDateKey = getIndiaDateKey(startDate);
      const resolvedSlotStartTime = getSlotStartTimeValue(selectedSlotObj, getSlotStartTimeValue(baseSlotObj, startTime));
      const cutoffMoment = getSlotCutoffMoment(selectedDateKey, String(resolvedSlotStartTime), cutoffHours);
      const debugSlot = selectedSlotObj || baseSlotObj || null;



      if (cutoffMoment && getIndiaNow().isAfter(cutoffMoment)) {
        showErrorPopup(
          "Sorry, bookings for this slot have closed.",
          "Booking Closed",
          {
            reason: "Please select a different available slot to continue.",
            ctaLabel: "Select Another Slot"
          }
        );
        return;
      }
    }

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
    if (guests.children > 0) {
      const missingChildAge = Array.from({ length: guests.children }).some((_, index) => {
        const age = guests.childAges?.[index];
        return !Number.isFinite(Number(age)) || Number(age) <= 0;
      });
      if (missingChildAge) {
        errors.children = "Please select the age for each child.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setShowValidation(true);
      
      if (errors.children && childrenDetailsRef.current) {
        childrenDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Scroll to the top of the modal content to see the errors
        const modalContent = document.querySelector(".booking-modal-content");
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // Clear validation on success
    setValidationErrors({});
    setShowValidation(false);

    if (!isEventBooking && guestSeatLimit !== undefined && totalGuests > guestSeatLimit) {
      showErrorPopup(
        guestSeatLimit === 0
          ? "Sorry, the requested seats are not available right now for this slot."
          : `Only ${guestSeatLimit} seat${guestSeatLimit === 1 ? "" : "s"} available for this slot. Please reduce the guest count or choose another time.`,
        guestSeatLimit === 0 ? "Seats Temporarily Unavailable" : "Availability Updated",
        guestSeatLimit === 0
          ? {
            reason: "These seats may currently be on hold for another booking. Please try again after 10 - 15 minutes, or choose a different slot now.",
            ctaLabel: "Choose Another Slot",
          }
          : undefined
      );
      return;
    }

    if (isEventBooking) {
      if (selectedEventSlots.length === 0 || totalGuests < 1 || bookingLoading) return;
      if (!ticketSaleWindow.isOpen) {
        showErrorPopup(ticketSaleWindow.message, "Ticket Window Closed");
        return;
      }
      if (selectedTicketSoldOut) {
        showErrorPopup("This ticket type is sold out for the selected slot. Please choose another ticket or slot.", "Sold Out");
        return;
      }
      if (selectedTicketMaxPerBooking !== undefined && totalGuests > selectedTicketMaxPerBooking) {
        showErrorPopup(
          `You can book a maximum of ${selectedTicketMaxPerBooking} ticket${selectedTicketMaxPerBooking === 1 ? "" : "s"} at a time.`,
          "Booking Limit"
        );
        return;
      }
      if (selectedTicketRemainingTickets !== undefined && totalGuests > selectedTicketRemainingTickets) {
        showErrorPopup(
          `Only ${selectedTicketRemainingTickets} ticket${selectedTicketRemainingTickets === 1 ? "" : "s"} remaining for this ticket type.`,
          "Low Availability"
        );
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

      const eventAddonsPayload = selectedAddOns.map((item) => {
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

      const payload = {
        eventId: eventIdNum,
        eventSlotId: eventSlotIdNum,
        eventSlotIds,
        bookingDate: dateStr,
        numberOfGuests: totalGuests,
        adultCount: guests.adults || 0,
        childCount: guests.children || 0,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        customerDetails,
        paymentMethod: "razorpay",
        specialRequests: "",
        addons: eventAddonsPayload,
        tickets: [{
          ticketTypeId,
          ticketTypeName: selectedTicket?.name || 'General Admission',
          quantity: billableAdults + (guests.children || 0),
          childQuantity: guests.children || 0,
          pricePerTicket: Number(pricePerTicket.toFixed(2)),
        }],
        childAges: guests.childAges || [],
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

        if (precheckRes?.canBook === false || reachedLimit || precheckResults.some((item) => item?.canBook === false)) {
          const formattedError = formatEventPrecheckErrorMessage(precheckRes);
          showErrorPopup(formattedError.message, formattedError.title, {
            reason: formattedError.reason,
            ctaLabel: formattedError.ctaLabel,
          });
          if (isMountedRef.current) setBookingLoading(false);
          return;
        }

        const previewCurrency = listing?.currency || "INR";
        const selectedAddOnsFormatted = selectedAddOns.map((item) => {
          const inner = item?.addon || item || {};
          const addonId = inner.addonId || inner.id || item.addonId || item.id;
          if (!addonId) return null;
          const name = inner.title || inner.name || inner.addonName || item.title || item.name || item.addonName || "Add-on";
          const pricePerUnit = parseFloat(inner.price || inner.addonPrice || inner.pricePerUnit || item.price || item.addonPrice || item.pricePerUnit || 0);
          const quantity = Number(item.quantity || inner.quantity || 1) || 1;
          const totalPrice = pricePerUnit * quantity;
          return {
            addonId, id: addonId, name, addonName: name, title: name, quantity, price: pricePerUnit, addonPrice: pricePerUnit, pricePerUnit, totalPrice, priceValue: totalPrice, image: inner.imageUrl || inner.image || inner.coverImageUrl || item.imageUrl || item.image || item.coverImageUrl || null, addon: { addonId, id: addonId, title: name, name, addonName: name, price: pricePerUnit, addonPrice: pricePerUnit, pricePerUnit }
          };
        }).filter(Boolean);

        const safeAdults = Number(guests?.adults ?? (totalGuests - (guests?.children || 0)) ?? 1) || 1;
        const safeChildren = Number(guests?.children ?? 0) || 0;
        const safeTotalGuests = Number(totalGuests) || (safeAdults + safeChildren) || 1;

        const guestDetailsArray = [];
        for (let i = 0; i < safeAdults; i++) {
          guestDetailsArray.push({
            name: i === 0 ? (customerName || "Guest 1") : `Guest ${i + 1}`,
            age: 30,
          });
        }
        for (let j = 0; j < safeChildren; j++) {
          const childAge = Array.isArray(guests?.childAges) && guests.childAges[j] != null ? Number(guests.childAges[j]) : 10;
          guestDetailsArray.push({
            name: `Child ${j + 1}`,
            age: childAge,
          });
        }

        const localUser = (() => {
          try {
            return JSON.parse(localStorage.getItem("userInfo") || "{}");
          } catch (e) {
            return {};
          }
        })();
        const nameParts = (customerName || localUser?.name || localUser?.firstName || "Guest").trim().split(" ");
        const firstName = localUser?.firstName || nameParts[0] || "Guest";
        const lastName = localUser?.lastName || nameParts.slice(1).join(" ") || firstName;
        const email = localUser?.email || "guest@example.com";
        const mobileNumber = String(localUser?.mobileNumber || localUser?.phone || localUser?.phoneNumber || "9876543210").replace(/\D/g, "");
        const countryCode = localUser?.countryCode || "+91";

        const unitTicketPrice = Number(pricePerTicket || eventGuestPricing?.baseUnitPrice || 0);
        const resolvedSlotId = selectedEventSlot?.id ? Number(selectedEventSlot.id) : (selectedEventSlot?.slotId ? Number(selectedEventSlot.slotId) : (eventSlotIdNum ? Number(eventSlotIdNum) : undefined));

        const previewPricePayload = {
          businessInterest: "EVENT",
          booking: {
            eventId: Number(eventIdNum),
            ...(resolvedSlotId ? { eventSlotId: resolvedSlotId } : {}),
            bookingDate: dateStr,
            bookingTime: selectedEventSlot?.startTime || selectedEventSlot?.slotName || startTime || "19:00:00",
            numberOfGuests: Number(safeTotalGuests),
            adultCount: Number(safeAdults),
            childCount: Number(safeChildren),
            childAges: Array.isArray(guests?.childAges) ? guests.childAges.map(Number) : [],
            paymentMethod: "razorpay",

            tickets: [
              {
                ticketTypeId: Number(ticketTypeId),
                ticketTypeName: ticketTypeName || "General Pass",
                quantity: Number(safeTotalGuests),
                childQuantity: Number(safeChildren),
                pricePerTicket: unitTicketPrice,
                originalPricePerTicket: unitTicketPrice,
                groupDiscountApplied: false,
                groupDiscountAmount: 0,
              },
            ],

            addons: selectedAddOnsFormatted.map((a) => ({
              addonId: Number(a.addonId || a.id),
              addonName: a.addonName || a.name || a.title || "Add-on",
              addonPrice: Number(a.pricePerUnit || a.price || a.addonPrice || 0),
              quantity: Number(a.quantity || 1),
            })),

            guestDetails: {
              title: localUser?.title || "Mr",
              firstName,
              lastName,
              email,
              mobileNumber,
              countryCode,
              additionalGuests: [],
            },
          },
        };

        console.log("📤 [Event ReserveModal -> Checkout] Calling preview-price API with payload:", JSON.stringify(previewPricePayload, null, 2));

        let previewPriceRes = null;
        try {
          if (isMountedRef.current) setBookingLoading(true);
          previewPriceRes = await previewOrderPrice(previewPricePayload);
          console.log("✅ [Event ReserveModal -> Checkout] preview-price response received:", JSON.stringify(previewPriceRes, null, 2));
        } catch (previewErr) {
          console.warn("⚠️ [Event ReserveModal -> Checkout] preview-price request failed (proceeding with fallback calculation):", previewErr);
        } finally {
          if (isMountedRef.current) setBookingLoading(false);
        }

        const apiData = Array.isArray(previewPriceRes?.data) ? previewPriceRes.data : null;
        const amountToBePaidFromData = apiData?.find(d => /amount\s*to\s*be\s*paid/i.test(d?.title || "") || d?.code === "amount_to_be_paid")?.amount;
        const previewPricing = previewPriceRes?.pricing || {
          currency: previewCurrency,
          pricePerPerson: eventGuestPricing.finalUnitPrice,
          basePrice: eventBaseTotal,
          allowChildPricing: actualHasChildPricing,
          adultsCount: guests.adults,
          childrenCount: guests.children,
          childAges: guests.childAges || [],
          childPricingTiers: eventChildPricingTiers,
          basePricePerPerson: eventGuestPricing.baseUnitPrice,
          adultBasePricePerPerson: eventGuestPricing.baseUnitPrice,
          childPricePerChild: actualHasChildPricing
            ? (isEventTieredChildPricing ? (eventChildPriceTotal / guests.children) : effectiveChildPrice)
            : 0,
          baseChildPricePerChild,
          discount: eventDiscountTotal,
          discountAmount: eventDiscountTotal,
          promoDiscount: eventPromoDiscountTotal,
          earlyBirdDiscount: eventEarlyBirdDiscountTotal,
          discountRate: appliedDiscountRate,
          tax: eventTaxTotal,
          taxAmount: eventTaxTotal,
          taxRate: appliedTaxRate,
          addonsTotal: addOnsTotal,
          subtotal: subtotalBeforeAdjustments,
          totalPrice: finalTotal,
          total: finalTotal,
          guestCount: totalGuests,
        };
        const previewPayment = previewPriceRes?.payment;
        const resolvedTotal = amountToBePaidFromData != null
          ? Number(amountToBePaidFromData)
          : ((apiPayableAmount != null && Number.isFinite(apiPayableAmount))
            ? apiPayableAmount
            : (previewPricing?.totalPrice ?? previewPricing?.total ?? finalTotal));

        const previewBookingData = {
          checkoutType: "event",
          businessInterest: "EVENT",
          eventId: previewPriceRes?.eventId ? Number(previewPriceRes.eventId) : eventIdNum,
          eventSlotId: previewPriceRes?.eventSlotId ? Number(previewPriceRes.eventSlotId) : eventSlotIdNum,
          eventSlotIds,
          listingTitle: listing?.title || "Event Booking",
          listingImage: listing?.coverPhotoUrl || listing?.listingMedia?.[0]?.url || "",
          returnTo: `/event?id=${eventIdNum}`,
          bookingSummary: {
            date: previewPriceRes?.bookingDate || dateStr,
            time: previewPriceRes?.bookingTime || selectedEventSlots.map((slot) => slot.startTime || slot.slotName).filter(Boolean).join(", "),
            guestCount: previewPriceRes?.numberOfGuests || totalGuests,
          },
          guests,
          selectedAddOns: selectedAddOnsFormatted,
          addOns: selectedAddOnsFormatted,
          addOnQuantities: selectedAddOns.reduce((acc, a) => {
            const id = a.addon?.addonId || a.addonId || a.id;
            if (id) acc[id] = a.quantity || 1;
            return acc;
          }, {}),
          priceDetails: {
            pricePerPerson: eventGuestPricing.finalUnitPrice,
            basePricePerTicket: pricePerTicket,
            totalPrice: resolvedTotal,
          },
          pricing: previewPriceRes?.pricing ? {
            ...previewPriceRes.pricing,
          } : previewPricing,
          childAges: guests.childAges || [],
          childPricingTiers: eventChildPricingTiers,
          selectedTicket,
          previewPrice: previewPriceRes,
          priceBreakdownData: apiData,
          data: apiData,
          currency: previewPricing?.currency || previewPayment?.currency || previewCurrency,
          finalTotal: resolvedTotal,
          ticketType: ticketTypeName,
          ticketTypeId,
          selectedSlot: selectedEventSlot,
          selectedSlots: selectedEventSlots,
          cancellationPolicySummary: listing?.cancellationPolicySummary || listing?.cancellationPolicy || listing?.cancellationPolicyText,
          orderRequest: {
            ...payload,
            eventId: previewPriceRes?.eventId ? Number(previewPriceRes.eventId) : eventIdNum,
            eventSlotId: previewPriceRes?.eventSlotId ? Number(previewPriceRes.eventSlotId) : eventSlotIdNum,
            bookingDate: previewPriceRes?.bookingDate || payload.bookingDate,
            bookingTime: previewPriceRes?.bookingTime || payload.bookingTime,
          },
        };

        const paymentData = previewPayment ? {
          amount: previewPayment.amount, // amount in paise
          currency: previewPayment.currency || "INR",
          paymentMethod: previewPayment.paymentMethod || "razorpay",
        } : {
          amount: Math.round(resolvedTotal * 100),
          currency: previewPricing?.currency || "INR",
          paymentMethod: "razorpay",
        };

        clearPendingCheckoutState();
        persistPendingCheckout({ bookingData: previewBookingData, session: paymentData, saveCheckoutBooking: true });
        localStorage.removeItem("frontendPendingBookingState");
        
        history.push({
          pathname: "/experience-checkout",
          state: {
            bookingData: previewBookingData,
            paymentData,
            addOns: selectedAddOnsFormatted,
          },
        });
        return;
      } catch (e) {
        console.error("Event booking failed:", e?.response?.data || e?.message || e);
        const errPayload = e?.response?.data || {};
        if (
          e?.response?.status === 401 ||
          errPayload?.message === "Invalid or expired token" ||
          errPayload?.error === "Invalid or expired token"
        ) {
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
            } catch (err) { }
          }
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("userInfo");
          setShowLoginPrompt(true);
          if (isMountedRef.current) setBookingLoading(false);
          return;
        }
        const errorDetails = getBookingErrorDetails(e);
        showErrorPopup(errorDetails.message, errorDetails.title, {
          reason: errorDetails.reason,
          ctaLabel: errorDetails.ctaLabel,
        });
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
      const adultLineTotal = baseAdultPricePerPerson * guests.adults;
      receipt.push({
        title: `₹${Number(baseAdultPricePerPerson || 0).toFixed(2)} × ${guests.adults} adult${guests.adults > 1 ? 's' : ''}`,
        content: `₹${adultLineTotal.toFixed(2)}`,
        kind: "base",
        showInCheckout: true
      });
    }
    // Child rows (if children selected and child pricing applies)
    if (guests.children > 0) {
      const childReceiptRows = buildChildReceiptRows({
        currencySymbol: "₹",
        isEvent: false,
        adultUnitPrice: baseAdultPricePerPerson,
        childTiers: experienceChildPricingTiers,
        allowCP: actualHasChildPricing,
        rawCP: rawChildPrice,
      });
      childReceiptRows.forEach((r) => receipt.push(r));
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

    if (totalEarlyBirdDiscountAmount > 0) {
      receipt.push({
        title: `Early Bird Discount`,
        content: `- ₹${totalEarlyBirdDiscountAmount.toFixed(2)}`,
        kind: "discount-early-bird",
        showInCheckout: true
      });
    }

    if (totalPromoDiscountAmount > 0) {
      receipt.push({
        title: `Promo Discount`,
        content: `- ₹${totalPromoDiscountAmount.toFixed(2)}`,
        kind: "discount-promo",
        showInCheckout: true
      });
    }

    if (totalTaxAmount > 0) {
      receipt.push({
        title: `Taxes & Fees`,
        content: `+ ₹${totalTaxAmount.toFixed(2)}`,
        kind: "tax",
        showInCheckout: true
      });
    }

    const effectiveExperienceFinalTotal = (!isEventBooking && apiPayableAmount != null && Number.isFinite(apiPayableAmount))
      ? apiPayableAmount
      : finalTotal;

    receipt.push({
      title: "Total",
      content: `₹${effectiveExperienceFinalTotal.toFixed(2)}`,
      kind: "total",
      showInCheckout: true
    });

    const bookingData = {
      listingId: listingId,
      listingTitle: listing?.title || listing?.name || "Experience",
      listingImage: listing?.coverPhotoUrl || listing?.listingMedia?.[0]?.url || "",
      hostName: externalHostName || (listing?.host?.firstName ? `${listing?.host?.firstName} ${listing?.host?.lastName || ""}`.trim() : "Host"),
      hostAvatar: externalHostAvatar || listing?.host?.profilePhotoUrl || "/images/content/avatar.jpg",
      selectedDate: dateStr,
      selectedTimeSlot: startTime,
      guests: guestsObj,
      childAges: guests.childAges || [],
      childPricingTiers: experienceChildPricingTiers,
      childAgeFrom,
      childAgeTo,
      selectedSlot: selectedSlotData,
      selectedAddOns: selectedAddOns.map(a => (a.addon?.addonId || a.addonId || a.id)),
      addOnQuantities: addOnQuantities,
      receipt: receipt,
      finalTotal: effectiveExperienceFinalTotal,
      pricing: {
        currency: "INR",
        basePrice: rawBaseTotal,
        // Adult/child split for checkout page
        allowChildPricing: actualHasChildPricing,
        adultsCount: guests.adults,
        childrenCount: guests.children,
        childAges: guests.childAges || [],
        childPricingTiers: experienceChildPricingTiers,
        childAgeFrom,
        childAgeTo,
        pricePerPerson: parseFloat(extractedPrice || 0),
        basePricePerPerson: baseAdultPricePerPerson,
        adultBasePricePerPerson: baseAdultPricePerPerson,
        childPricePerChild: actualHasChildPricing ? (isEventTieredChildPricing ? (eventChildPriceTotal / guests.children) : effectiveChildPrice) : 0,
        baseChildPricePerChild,
        discount: totalDiscountAmount,
        promoDiscount: totalPromoDiscountAmount,
        earlyBirdDiscount: totalEarlyBirdDiscountAmount,
        discountRate: appliedDiscountRate,
        tax: totalTaxAmount,
        taxRate: appliedTaxRate,
        commission: getExperienceCommissionRate(listing),
        addonsTotal: addOnsTotal,
        subtotal: subtotalBeforeAdjustments,
        total: effectiveExperienceFinalTotal,
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
      childPricePerChild: Number(actualHasChildPricing ? baseChildPricePerChild : 0),
      childAges: guests.childAges || [],
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
    if (privateBooking) {
      orderData.privateBooking = true;
      orderData.isPrivateBooking = true;
    }

    try {
      const selectedAddOnsFormatted = selectedAddOns.map((item) => {
        const inner = item?.addon || item || {};
        const addonId = inner.addonId || inner.id || item.addonId || item.id;
        if (!addonId) return null;
        const name = inner.title || inner.name || inner.addonName || item.title || item.name || item.addonName || "Add-on";
        const pricePerUnit = parseFloat(inner.price || inner.addonPrice || inner.pricePerUnit || item.price || item.addonPrice || item.pricePerUnit || 0);
        const quantity = Number(item.quantity || inner.quantity || 1) || 1;
        const totalPrice = pricePerUnit * quantity;
        return {
          addonId, id: addonId, name, addonName: name, title: name, quantity, price: pricePerUnit, addonPrice: pricePerUnit, pricePerUnit, totalPrice, priceValue: totalPrice, image: inner.imageUrl || inner.image || inner.coverImageUrl || item.imageUrl || item.image || item.coverImageUrl || null, addon: { addonId, id: addonId, title: name, name, addonName: name, price: pricePerUnit, addonPrice: pricePerUnit, pricePerUnit }
        };
      }).filter(Boolean);

      const safeAdults = Number(guests?.adults ?? (totalGuests - (guests?.children || 0)) ?? 1) || 1;
      const safeChildren = Number(guests?.children ?? 0) || 0;
      const safeTotalGuests = Number(totalGuests) || (safeAdults + safeChildren) || 1;
      const childAges = Array.isArray(guests?.childAges) ? guests.childAges : [];

      const previewPricePayload = {
        businessInterest: "EXPERIENCE",
        booking: {
          listingId: Number(listingId),
          slotId: Number(slotId),
          bookingSlotId: Number(slotId),
          bookingDate: dateStr,
          bookingTime: bookingTime || startTime || undefined,
          guestCount: safeTotalGuests,
          quantity: safeTotalGuests,
          childCount: safeChildren,
          childAges: childAges,
          guestDetails: {
            adults: safeAdults,
            children: safeChildren,
            adultsCount: safeAdults,
            childrenCount: safeChildren,
            childAges: childAges,
            guestCount: safeTotalGuests,
          },
          addons: addons.map((a) => ({
            addonId: Number(a.addonId),
            quantity: Number(a.quantity || 1),
          })),
          paymentMethod: "razorpay",
        },
      };

      console.log("📤 [ReserveModal -> Checkout] Calling preview-price API with payload:", JSON.stringify(previewPricePayload, null, 2));

      let previewPriceRes = null;
      try {
        if (isMountedRef.current) setBookingLoading(true);
        previewPriceRes = await previewOrderPrice(previewPricePayload);
        console.log("✅ [ReserveModal -> Checkout] preview-price response received:", JSON.stringify(previewPriceRes, null, 2));
      } catch (previewErr) {
        console.warn("⚠️ [ReserveModal -> Checkout] preview-price request failed (proceeding with fallback calculation):", previewErr);
      } finally {
        if (isMountedRef.current) setBookingLoading(false);
      }

      const apiData = Array.isArray(previewPriceRes?.data) ? previewPriceRes.data : null;
      const amountToBePaidFromData = apiData?.find(d => /amount\s*to\s*be\s*paid/i.test(d?.title || "") || d?.code === "amount_to_be_paid")?.amount;
      const previewPricing = previewPriceRes?.pricing || bookingData.pricing;
      const previewPayment = previewPriceRes?.payment;
      const resolvedTotal = amountToBePaidFromData != null
        ? Number(amountToBePaidFromData)
        : (previewPricing?.totalPrice ?? previewPricing?.total ?? finalTotal);

      const previewBookingData = {
        ...bookingData,
        checkoutType: "experience",
        currency: previewPricing?.currency || previewPayment?.currency || "INR",
        orderRequest: orderData,
        selectedAddOns: selectedAddOnsFormatted,
        addOns: selectedAddOnsFormatted,
        previewPrice: previewPriceRes,
        priceBreakdownData: apiData,
        data: apiData,
        pricing: previewPriceRes?.pricing ? {
          ...bookingData.pricing,
          ...previewPriceRes.pricing,
        } : bookingData.pricing,
        finalTotal: resolvedTotal,
      };

      const paymentData = previewPayment ? {
        amount: previewPayment.amount, // amount in paise
        currency: previewPayment.currency || "INR",
        paymentMethod: previewPayment.paymentMethod || "razorpay",
      } : {
        amount: Math.round(resolvedTotal * 100),
        currency: previewPricing?.currency || "INR",
        paymentMethod: "razorpay",
      };

      console.log("🚀 [ReserveModal] Navigating to /experience-checkout with state:", {
        bookingData: previewBookingData,
        paymentData,
      });

      clearPendingCheckoutState();
      persistPendingCheckout({ bookingData: previewBookingData, session: paymentData, saveCheckoutBooking: true });
      localStorage.removeItem("frontendPendingBookingState");
      history.push({
        pathname: "/experience-checkout",
        search: `?listingId=${listingId}&startDate=${dateStr}&guests=${totalGuests}${startTime ? `&startTime=${encodeURIComponent(startTime)}` : ""}`,
        state: {
          addOns: selectedAddOnsFormatted,
          bookingData: previewBookingData,
          paymentData,
        }
      });
      return;

      if (isMountedRef.current) setBookingLoading(true);
      //console.log("Creating experience order from BookingSystem:", orderData);
      const res = await createOrder(orderData);
      //console.log("Experience order created from BookingSystem:", res);

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
        //console.log("ℹ️ Razorpay Order ID not present on order creation; will be initialized on payment checkout.");
      }

      const createdPaymentData = {
        orderId,
        amount: amountInPaise,
        currency,
        paymentMethod: "razorpay",
        discount: payment?.discount || res?.discount || 0,
        finalAmount: payment?.finalAmount || amountInPaise,
        paidAmount: payment?.paidAmount || payment?.finalAmount || amountInPaise,
      };

      persistPendingCheckout({ bookingData, session: createdPaymentData, saveCheckoutBooking: true });
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
            paymentData: createdPaymentData,
          }
        });
      }
    } catch (e) {
      console.error("Experience booking failed:", e?.response?.data || e?.message || e);
      const errPayload = e?.response?.data || {};
      if (
        e?.response?.status === 401 ||
        errPayload?.message === "Invalid or expired token" ||
        errPayload?.error === "Invalid or expired token"
      ) {
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
          } catch (err) { }
        }
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userInfo");
        setShowLoginPrompt(true);
        if (isMountedRef.current) setBookingLoading(false);
        return;
      }
      const errorDetails = getBookingErrorDetails(e);
      showErrorPopup(errorDetails.message, errorDetails.title, {
        reason: errorDetails.reason,
        ctaLabel: errorDetails.ctaLabel,
      });
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

    getListingSlots(listingId, getIndiaDateKey(), slotsLookupEndDate)
      .then((payload) => {
        const slots = unwrapSlotsPayload(payload);
        setAllFetchedSlots(slots);
        const hasPrivate = slots.some((slot) => {
          if (asOptionalBoolean(slot?.privateBookingEnabled) === true || asOptionalBoolean(slot?.private_booking_enabled) === true) return true;
          const avail = slot.availability || slot.availabilities || [];
          return avail.some((a) => a.private_booking_available === true || a.privateBookingAvailable === true);
        });
        if (hasPrivate) setHasAnyPrivateBookingAvailable(true);
      })
      .catch((e) => console.error("[BookingSystem] Error fetching slots for private booking check", e));
  }, [isEventBooking, listingId, selectedDateKey, slotsLookupEndDate, triggerDisabled]);

  // Check if all experience dates/slots are in the past
  const isExperienceClosed = useMemo(() => {
    if (isEventBooking) return false;
    if (experienceAvailableDateKeys.size === 0) return false; // no date info, don't block
    const todayKey = getIndiaDateKey();
    // If every available date key is strictly before today, it's closed
    return [...experienceAvailableDateKeys].every(key => key < todayKey);
  }, [isEventBooking, experienceAvailableDateKeys]);

  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;
        setIsFooterVisible(scrolledToBottom);
      } else {
        setIsFooterVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

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
      {!hideTrigger && (
        <motion.button
          onClick={handleOpenBooking}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: isFooterVisible ? 150 : 0, opacity: isFooterVisible ? 0 : 1 }}
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
      )}
      {!hideTrigger && triggerDisabled && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: isFooterVisible ? 150 : 0, opacity: isFooterVisible ? 0 : 1 }}
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
        </motion.div>
      )}

      <AnimatePresence>
        {show && (
          <div className="booking-modal-wrapper" style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", padding: 20, overflowY: "auto", overflowX: "hidden" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeBookingModal}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="booking-modal-container"
              style={{
                position: "relative",
                margin: "auto",
                width: "95%",
                maxWidth: 480,
                maxHeight: "calc(100vh - 40px)",
                background: BG,
                borderRadius: 32,
                boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 100px ${A}11`,
                border: `1px solid ${B}`,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)"
              }}
            >
              {!renderContent ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 24, height: 24, border: `2px solid ${A}33`, borderTopColor: A, borderRadius: "50%" }}
                  />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="booking-modal-header" style={{ padding: "16px 28px", borderBottom: `1px solid ${B}88`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                    <div style={{ flexShrink: 0 }}>
                      <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: A, marginBottom: 2, lineHeight: "1.2" }}>
                        {isEventBooking ? "Reserve Your Event" : "Reserve Your Experience"}
                      </h2>

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

                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
                      {experienceSupportsPrivateBooking && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>Private Booking</span>
                          <button
                            type="button"
                            onClick={() => setPrivateBooking((value) => !value)}
                            style={{
                              width: 36,
                              height: 20,
                              borderRadius: 999,
                              background: privateBooking ? A : B,
                              padding: 2,
                              display: "flex",
                              justifyContent: privateBooking ? "flex-end" : "flex-start",
                              transition: "0.2s",
                              cursor: "pointer",
                              border: "none",
                              alignItems: "center"
                            }}
                          >
                            <span style={{ width: 16, height: 16, borderRadius: "50%", background: W, display: "block" }} />
                          </button>
                        </div>
                      )}
                      <button type="button" onClick={closeBookingModal} style={{ background: S, border: `1px solid ${B}`, padding: 8, borderRadius: 100, cursor: "pointer", color: FG, display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s" }}>
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
                      flex: 0 0 auto;
                      width: 260px;
                      border-radius: 12px;
                      padding: 0;
                      display: flex;
                      align-items: stretch;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      background: ${S};
                      border: 1.5px solid ${B};
                      overflow: hidden;
                    }
                    .addon-card-item:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
                    }
                    .addon-card-item[data-selected="true"] {
                      background: ${AL};
                      border-color: ${A};
                    }
                    .addon-img-box {
                      width: 50px;
                      flex-shrink: 0;
                      border-right: 1px solid ${B}55;
                    }
                    .addon-content {
                      flex: 1;
                      min-width: 0;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      padding: 6px 10px;
                    }
                    .addon-title-text {
                      font-size: 13px;
                      font-weight: 700;
                      color: ${FG};
                      line-height: 1.3;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      transition: color 0.2s;
                    }
                    .addon-card-item[data-selected="true"] .addon-title-text {
                      color: ${A};
                    }
                    .addon-action-area {
                      display: flex;
                      align-items: center;
                      justify-content: flex-end;
                      width: 88px;
                      flex-shrink: 0;
                      padding-right: 10px;
                    }
                    .addon-action-btn-circle {
                      border: 1.5px solid ${B};
                      border-radius: 50%;
                      width: 28px;
                      height: 28px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      background: ${BG};
                      color: ${FG};
                    }
                    .addon-action-btn-circle:hover {
                      transform: scale(1.08);
                    }
                    .addon-qty-ctrl-panel {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      background: ${BG};
                      border-radius: 100px;
                      padding: 4px;
                      border: 1px solid ${B};
                    }
                    .addon-qty-panel-btn {
                      background: ${S};
                      color: ${FG};
                      border: none;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      cursor: pointer;
                      transition: background 0.2s;
                    }
                  `}</style>

                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        {showLeftAddonArrow && (
                          <button
                            className="addon-scroll-btn"
                            onClick={() => {
                              const container = document.getElementById("header-addons-scroll");
                              if (container) container.scrollBy({ left: -260, behavior: 'smooth' });
                            }}
                            style={{ left: -18 }}
                          >
                            <ChevronLeft size={18} />
                          </button>
                        )}

                        <div id="header-addons-scroll" onScroll={handleAddonsScroll} style={{
                          display: "flex",
                          overflowX: "auto",
                          gap: 16,
                          padding: "8px 0",
                          WebkitOverflowScrolling: "touch",
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          width: "100%",
                          maskImage: "linear-gradient(to right, black, black calc(100% - 16px), transparent)",
                          WebkitMaskImage: "linear-gradient(to right, black, black calc(100% - 16px), transparent)"
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
                                data-selected={isSelected}
                              >
                                {addonImage && (
                                  <div className="addon-img-box">
                                    <img src={addonImage} alt={addon.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                )}
                                <div className="addon-content">
                                  <p className="addon-title-text">
                                    {addon.title}
                                  </p>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: isSelected ? A : M, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span>{priceLabel}</span>
                                    <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                                      • {typeLabel}
                                    </span>
                                  </p>
                                </div>

                                <div className="addon-action-area" onClick={(e) => e.stopPropagation()}>
                                  {isSelected ? (
                                    pricingType === "Group" ? (
                                      <button
                                        onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, -1)}
                                        className="addon-action-btn-circle"
                                        style={{ background: A, color: "#fff", border: "none" }}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      </button>
                                    ) : (
                                      <div className="addon-qty-ctrl-panel">
                                        <button
                                          onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, -1)}
                                          className="addon-qty-panel-btn"
                                        >
                                          -
                                        </button>
                                        <span style={{ fontSize: 12, fontWeight: 800, minWidth: 16, textAlign: "center", color: FG }}>
                                          {quantity}
                                        </span>
                                        <button
                                          onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, 1)}
                                          className="addon-qty-panel-btn"
                                        >
                                          +
                                        </button>
                                      </div>
                                    )
                                  ) : (
                                    <button
                                      onClick={() => onUpdateAddonQuantity && onUpdateAddonQuantity(addon, 1)}
                                      className="addon-action-btn-circle"
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {showRightAddonArrow && (
                          <button
                            className="addon-scroll-btn"
                            onClick={() => {
                              const container = document.getElementById("header-addons-scroll");
                              if (container) container.scrollBy({ left: 260, behavior: 'smooth' });
                            }}
                            style={{ right: -18 }}
                          >
                            <ChevronRight size={18} />
                          </button>
                        )}
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
                          onClick={closeBookingModal}
                          style={{ marginTop: 8, padding: "12px 32px", background: A, color: "#fff", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: "pointer" }}
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <div className="booking-modal-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                        <div className="booking-grid" style={{ display: "flex", flexDirection: "column", gap: 1, background: B }}>
                          <div className="booking-modal-column" style={{ padding: "20px 28px", background: S, display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: "1.2" }}>
                                  01. Booking Details
                                </div>
                                {(startDate || startTime) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isSingleEventSchedule) {
                                        setStartDate(null);
                                      }
                                      setStartTime(null);
                                      setSelectedEventSlotIds([]);
                                      setSelectedTicketTypeId("");
                                      setValidationErrors({});
                                    }}
                                    style={{
                                      background: AL,
                                      border: `1px solid ${A}33`,
                                      color: A,
                                      fontSize: 9,
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                      cursor: "pointer",
                                      padding: "4px 10px",
                                      borderRadius: 100,
                                      transition: "0.3s"
                                    }}
                                  >
                                    Clear Selection
                                  </button>
                                )}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div
                                  onClick={() => {
                                    if (!isSingleEventSchedule) {
                                      setShowDatePicker(true);
                                    }
                                  }}
                                  style={{
                                    padding: "10px 14px",
                                    background: isSingleEventSchedule ? `linear-gradient(135deg, ${BG} 0%, ${B}33 100%)` : BG,
                                    borderRadius: 16,
                                    border: isSingleEventSchedule ? `1px solid ${B}66` : `1px solid ${validationErrors.date ? E : B}`,
                                    cursor: isSingleEventSchedule ? "default" : "pointer",
                                    transition: "0.3s",
                                    boxShadow: isSingleEventSchedule ? "inset 0 2px 8px rgba(0,0,0,0.02)" : "none",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>
                                      <Calendar size={12} strokeWidth={2.5} />
                                      Date
                                    </p>
                                    {isSingleEventSchedule && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 3, background: `${A}11`, padding: "2px 6px", borderRadius: 100 }}>
                                        <CheckCircle2 size={10} color={A} strokeWidth={3} />
                                        <span style={{ fontSize: 9, fontWeight: 800, color: A, letterSpacing: "0.05em" }}>CONFIRMED</span>
                                      </div>
                                    )}
                                  </div>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: startDate ? FG : M, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{startDate ? startDate.format("DD MMM, YYYY") : "Select"}</p>
                                </div>
                                <div
                                  title={!startDate ? "Select date first" : undefined}
                                  onClick={() => {
                                    if (!startDate) {
                                      setShowDateWarning(true);
                                    } else {
                                      setShowTimePicker(true);
                                    }
                                  }}
                                  style={{
                                    padding: "10px 14px",
                                    background: BG,
                                    borderRadius: 16,
                                    border: `1px solid ${validationErrors.slot ? E : B}`,
                                    cursor: "pointer",
                                    transition: "0.2s",
                                    opacity: !startDate ? 0.7 : 1,
                                  }}
                                >
                                  <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Slot</p>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: (isEventBooking ? selectedEventSlotIds.length > 0 : startTime) ? FG : M, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {(() => {
                                      if (isEventBooking && selectedEventSlotIds.length > 0) {
                                        const slotId = selectedEventSlotIds[0];
                                        const slot = eventSlots.find(s => String(s.eventSlotId ?? s.id) === slotId);
                                        if (slot) {
                                          const st = formatTime12h(slot.startTime || slot.slotName);
                                          const et = formatTime12h(slot.endTime);
                                          return et ? `${st} - ${et}` : st;
                                        }
                                      } else if (!isEventBooking && startTime) {
                                        return formatTime12h(startTime);
                                      }
                                      return "Select";
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {showDatePicker && !isSingleEventSchedule && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  style={{
                                    position: "fixed",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    zIndex: 99999,
                                    background: "rgba(0,0,0,0.5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  onClick={() => setShowDatePicker(false)}
                                >
                                  <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      background: BG,
                                      padding: "24px",
                                      borderRadius: 24,
                                      width: "90%",
                                      maxWidth: 420,
                                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: FG }}>
                                        Select Date
                                      </h3>
                                      <button onClick={() => setShowDatePicker(false)} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <X size={20} />
                                      </button>
                                    </div>
                                    <StayInlineCalendar
                                      checkInDate={startDate}
                                      checkOutDate={null}
                                      onDateSelect={(date) => {
                                        setStartDate(date);
                                        setShowDatePicker(false);
                                        setShowDateWarning(false);
                                        setValidationErrors(prev => {
                                          const next = { ...prev };
                                          delete next.date;
                                          return next;
                                        });
                                      }}
                                      isBlockedDay={(date) => {
                                        const key = date.format("YYYY-MM-DD");
                                        const todayKey = getIndiaDateKey();
                                        if (key < todayKey) return true;
                                        const availableKeys = isEventBooking ? eventAvailableDateKeys : experienceAvailableDateKeys;
                                        if (!availableKeys.has(key)) return true;
                                        if (key === todayKey && !hasTodayValidSlots) return true;
                                        return false;
                                      }}
                                      tokens={{ A, AL, BG, FG, M, B, S, W }}
                                      selectionMode="check-in"
                                      nextBlockedDate={null}
                                    />
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <AnimatePresence>
                              {showTimePicker && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  style={{
                                    position: "fixed",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    zIndex: 99999,
                                    background: "rgba(0,0,0,0.5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  onClick={() => setShowTimePicker(false)}
                                >
                                  <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      background: BG,
                                      padding: "24px",
                                      borderRadius: 24,
                                      width: "90%",
                                      maxWidth: 420,
                                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: FG }}>
                                        Select Time Slot
                                      </h3>
                                      <button onClick={() => setShowTimePicker(false)} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <X size={20} />
                                      </button>
                                    </div>

                                    <div style={{ height: 380, overflowY: "auto", paddingRight: 8, margin: "0 -8px 0 0" }}>

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
                                                        setSelectedTicketTypeId("");
                                                        setValidationErrors(prev => {
                                                          const next = { ...prev };
                                                          delete next.slot;
                                                          delete next.ticketType;
                                                          return next;
                                                        });
                                                        setShowTimePicker(false);
                                                        setShowTicketPicker(true);
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
                                        </div>
                                      ) : (
                                        <div style={{ position: "relative" }}>
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
                                              setTimeout(() => {
                                                const guestsSection = document.getElementById("booking-guests-section-exp");
                                                if (guestsSection) {
                                                  guestsSection.classList.add("highlight-next-step");
                                                  setTimeout(() => {
                                                    guestsSection.classList.remove("highlight-next-step");
                                                  }, 2500);
                                                }
                                              }, 300);
                                            }}
                                            selectedTime={startTime}
                                            timeSlots={timeSlots}
                                            selectedDate={startDate}
                                            plain
                                          />
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
                                            </div>)}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <AnimatePresence>
                              {showTicketPicker && isEventBooking && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  style={{
                                    position: "fixed",
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    zIndex: 99999,
                                    background: "rgba(0,0,0,0.5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                  onClick={() => setShowTicketPicker(false)}
                                >
                                  <motion.div
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0.95 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      background: BG,
                                      padding: "24px",
                                      borderRadius: 24,
                                      width: "90%",
                                      maxWidth: 420,
                                      maxHeight: "85vh",
                                      display: "flex",
                                      flexDirection: "column",
                                      boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: FG }}>
                                        Select Ticket
                                      </h3>
                                      <button onClick={() => setShowTicketPicker(false)} style={{ background: "none", border: "none", cursor: "pointer", color: M, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <X size={20} />
                                      </button>
                                    </div>

                                    <div style={{ overflowY: "auto", paddingRight: 8, margin: "0 -8px 0 0", flex: 1 }}>
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
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div style={{ padding: "12px 16px", background: BG, border: `1px solid ${B}`, borderRadius: 16, fontSize: 12, color: M, opacity: 0.65, fontWeight: 600, fontStyle: "italic" }}>
                                          No tickets available for this slot.
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ marginTop: 16 }}>
                                      <button
                                        onClick={() => setShowTicketPicker(false)}
                                        disabled={!selectedTicketTypeId}
                                        style={{
                                          width: "100%",
                                          padding: "14px 20px",
                                          borderRadius: 16,
                                          background: selectedTicketTypeId ? A : B,
                                          color: selectedTicketTypeId ? W : M,
                                          border: "none",
                                          fontSize: 14,
                                          fontWeight: 800,
                                          cursor: selectedTicketTypeId ? "pointer" : "not-allowed",
                                          transition: "0.2s",
                                          opacity: selectedTicketTypeId ? 1 : 0.5
                                        }}
                                      >
                                        Confirm Ticket
                                      </button>
                                    </div>
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div id="booking-guests-section-exp" className="booking-modal-column" style={{ padding: "20px 28px", background: S, display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: "24px" }}>
                            <div style={{ fontSize: 11, color: validationErrors.adults ? E : A, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, lineHeight: "1.2" }}>
                              02. Guests
                              {validationErrors.adults && <span style={{ fontSize: 10, fontWeight: 700, background: EL, color: E, padding: "2px 8px", borderRadius: 100, border: `1px solid ${E}22` }}>Min 1 Adult Required</span>}
                            </div>
                            <div
                              title={!(
                                isEventBooking
                                  ? (startDate && selectedEventSlotIds.length > 0 && selectedTicketTypeId)
                                  : (startDate && startTime)
                              ) ? (isEventBooking ? "Please select slot and ticket first" : "Please select date and time first") : undefined}
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                alignItems: "flex-start",
                                opacity: (
                                  isEventBooking
                                    ? (startDate && selectedEventSlotIds.length > 0 && selectedTicketTypeId)
                                    : (startDate && startTime)
                                ) ? 1 : 0.5,
                                pointerEvents: (
                                  isEventBooking
                                    ? (startDate && selectedEventSlotIds.length > 0 && selectedTicketTypeId)
                                    : (startDate && startTime)
                                ) ? "auto" : "none",
                                transition: "0.3s"
                              }}
                            >
                              <div style={{
                                flex: "1 1 140px",
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
                                <div style={{ flex: "1 1 140px", padding: "10px 14px", background: BG, border: `1px solid ${B}`, borderRadius: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>Children</span>
                                  <Counter
                                    value={guests.children}
                                    setValue={(v) => {
                                      const prevV = guests.children;
                                      updateGuestsWithinSeatLimit(p => ({ ...p, children: v }));
                                      if (v > prevV && v > 0) {
                                        setTimeout(() => {
                                          childrenDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 50);
                                      }
                                    }}
                                    min={0}
                                    max={childMax}
                                  />
                                </div>
                              )}

                              {childrenAllowed && guests.children > 0 && (
                                <div ref={childrenDetailsRef} style={{ flex: "1 1 100%", padding: "16px", background: BG, border: `1px solid ${B}`, borderRadius: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ color: A }}>
                                      <Baby size={20} color={A} />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>
                                        {(isEventBooking && eventChildPricingTiers.length > 0) || hasChildAgeRange ? "Child Age" : "Children details"}
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 400, color: M }}>
                                        {(() => {
                                          if (isEventBooking && eventChildPricingTiers.length > 0) {
                                            const minAge = Math.min(...eventChildPricingTiers.map(t => t.ageFrom ?? t.age_from ?? 0));
                                            const maxAge = Math.max(...eventChildPricingTiers.map(t => t.ageTo ?? t.age_to ?? 100));
                                            return `Ages ${minAge}–${maxAge} use the child rate. Ages below ${minAge} are free.`;
                                          }
                                          if (hasChildAgeRange) {
                                            return `Ages ${childAgeFrom}–${childAgeTo} use the child rate. Ages below ${childAgeFrom} are free.`;
                                          }
                                          return "Please select the age for each child.";
                                        })()}
                                      </span>
                                    </div>
                                  </div>

                                  {validationErrors.children && (
                                    <div style={{ fontSize: 11, color: E, fontWeight: 600 }}>
                                      {validationErrors.children}
                                    </div>
                                  )}

                                  <div className="child-age-grid" style={{ display: "grid", gridTemplateColumns: guests.children === 1 ? "1fr" : "1fr 1fr", gap: 12, marginTop: 12 }}>
                                    {Array.from({ length: guests.children }).map((_, i) => (
                                      <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", gap: 4, background: `${B}22`, border: `1px solid ${B}66`, borderRadius: 12 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: A, flexShrink: 0 }}></div>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: FG, whiteSpace: "nowrap" }}>Child {i + 1}</span>
                                          </div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, background: AL, padding: "4px 8px", borderRadius: 100, border: `1px solid ${A}44` }}>
                                              <span style={{ fontSize: 11, color: A, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: 0.5 }}>AGE</span>
                                            </div>
                                            <ChildAgeSelect
                                              value={guests.childAges?.[i] ?? 0}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                updateChildAge(i, v);
                                                setValidationErrors(prev => {
                                                  const next = { ...prev };
                                                  const nextAges = [...(guests.childAges || [])];
                                                  nextAges[i] = Number(v);
                                                  const hasMissing = Array.from({ length: guests.children }).some((_, index) => {
                                                    const age = nextAges[index];
                                                    return !Number.isFinite(Number(age)) || Number(age) < 0;
                                                  });
                                                  if (!hasMissing) {
                                                    delete next.children;
                                                  }
                                                  return next;
                                                });
                                              }}
                                              options={(() => {
                                                const maxAge = isEventBooking
                                                  ? asNumber(selectedTicket?.childAgeTo ?? selectedTicket?.child_age_to) ?? 17
                                                  : (childAgeTo != null ? childAgeTo : 17);
                                                return Array.from({ length: maxAge + 1 }).map((_, age) => ({ value: age, label: age }));
                                              })()}
                                              style={{
                                                border: `1px solid ${B}44`,
                                                borderRadius: '6px',
                                                padding: '4px 8px',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                color: FG,
                                                backgroundColor: 'transparent',
                                                width: '60px'
                                              }}
                                            />
                                          </div>
                                        </div>
                                        {childAgeWarnings[i] === 'adult' && (
                                          <div style={{ fontSize: 11, color: "#eab308", fontWeight: 500, paddingBottom: 8 }}>
                                            Age exceeds child limits. Adult price applied.
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            {isEventBooking && selectedTicketTypeId && selectedTicketMaxPerBooking !== undefined && (
                              <div style={{ marginTop: 4, fontSize: 10, color: M, fontWeight: 600, lineHeight: 1.2 }}>
                                Max {selectedTicketMaxPerBooking} ticket{selectedTicketMaxPerBooking === 1 ? "" : "s"} per booking.
                              </div>
                            )}
                            {isEventBooking && selectedTicketTypeId && effectiveEventPrice.tier && (
                              <div style={{ marginTop: 4, fontSize: 11, color: A, fontWeight: 800, lineHeight: 1.2 }}>
                                Group price: ₹{Number(effectiveEventPrice.price || 0).toFixed(2)} / ticket.
                              </div>
                            )}

                            {/* Dynamic Pricing Modifier Labels */}
                            {(() => {
                              const isGroupBookingApplied = !privateBooking && ((!isEventBooking && groupOverridePrice != null && groupOverridePrice > 0) || (isEventBooking && effectiveEventPrice?.tier));
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

                            {/* Ticket Applied Details */}
                            {isEventBooking && selectedTicketTypeId && selectedTicket && (
                              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
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
                                  width: "fit-content"
                                }}>
                                  🏷 Ticket Applied : {selectedTicket.ticketName || selectedTicket.name}
                                </span>
                              </div>
                            )}
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
                      {(() => {
                        const gp = isEventBooking ? eventGuestPricing : experienceGuestPricing;
                        const discountedDisplayPrice = gp ? gp.priceAfterDiscount : Number(data.price || 0);
                        const isFreeEvent = Number(discountedDisplayPrice || 0) === 0;
                        if (isFreeEvent) {
                          return <span style={{ fontSize: 22, fontWeight: 800, color: A }}>Free Event</span>;
                        }

                        if (apiPayableLoading) {
                          return (
                            <>
                              <span style={{ fontSize: 16, fontWeight: 700, color: M, marginTop: 2 }}>Calculating...</span>
                              <span style={{ fontSize: 10, color: M, fontWeight: 600 }}>Including all taxes.</span>
                            </>
                          );
                        }

                        if (apiPayableAmount != null && Number.isFinite(apiPayableAmount)) {
                          return (
                            <>
                              <span style={{ fontSize: 22, fontWeight: 800, color: FG }}>₹{Number(apiPayableAmount).toFixed(2)}</span>
                              <span style={{ fontSize: 10, color: M, fontWeight: 600 }}>Including all taxes.</span>
                            </>
                          );
                        }

                        const currentTotalGuests = Number(guests?.adults || 0) + Number(guests?.children || 0);
                        const emptyMsg = (() => {
                          if (isEventBooking) {
                            if (!selectedTicketTypeId && !selectedEventSlotId) return "Select a ticket";
                            if (currentTotalGuests === 0) return "Select guests";
                            return "Select details";
                          }
                          if (!startDate && !selectedDateKey) return "Select a date";
                          if (!startTime && !selectedSlotData) return "Select a slot";
                          if (currentTotalGuests === 0) return "Select guests";
                          return "Select details";
                        })();

                        return (
                          <>
                            <span style={{ fontSize: 15, fontWeight: 700, color: M, marginTop: 2 }}>{emptyMsg}</span>
                            <span style={{ fontSize: 10, color: M, fontWeight: 600 }}>Including all taxes.</span>
                          </>
                        );
                      })()}
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
                </>
              )}
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
              onClick={() => setErrorPopup({ visible: false, title: "", message: "", reason: "", ctaLabel: "Adjust Now" })}
              style={{ position: "absolute", inset: 0, background: "rgba(7,10,18,0.58)", backdropFilter: "blur(8px)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.96 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 540,
                overflow: "hidden",
                background: `linear-gradient(145deg, ${BG} 0%, ${S} 100%)`,
                borderRadius: 28,
                border: `1px solid ${E}26`,
                boxShadow: "0 30px 90px rgba(0,0,0,0.32)",
                zIndex: 1,
              }}
            >
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at top right, ${A}18 0%, transparent 38%), radial-gradient(circle at bottom left, ${E}12 0%, transparent 34%)` }} />
              <div style={{ position: "relative", padding: "22px 22px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${EL} 0%, ${A}22 100%)`, border: `1px solid ${E}22`, display: "flex", alignItems: "center", justifyContent: "center", color: E, flexShrink: 0, boxShadow: `inset 0 1px 0 ${W}33` }}>
                      <AlertCircle size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: E, marginBottom: 4 }}>
                        Booking Update
                      </div>
                      <h3 style={{ margin: 0, fontSize: 22, lineHeight: 1.05, fontWeight: 900, color: FG }}>
                        {errorPopup.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close popup"
                    onClick={() => setErrorPopup({ visible: false, title: "", message: "", reason: "", ctaLabel: "Adjust Now" })}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      border: `1px solid ${B}`,
                      background: `${W}B3`,
                      color: FG,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ marginTop: 18, padding: "16px 16px 15px", borderRadius: 20, background: `${W}C7`, border: `1px solid ${B}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)" }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: FG, fontWeight: 700 }}>
                    {errorPopup.message}
                  </p>
                </div>




                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: M }}>
                    {errorPopup.reason ? "You can wait a few minutes or update your selection now." : "Update your selection to continue."}
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorPopup({ visible: false, title: "", message: "", reason: "", ctaLabel: "Adjust Now" })}
                    style={{
                      border: "none",
                      background: `linear-gradient(135deg, ${A} 0%, ${AH} 100%)`,
                      color: "#FFF",
                      borderRadius: 14,
                      fontSize: 13,
                      fontWeight: 900,
                      padding: "12px 18px",
                      minWidth: 108,
                      cursor: "pointer",
                      boxShadow: `0 14px 30px ${A}33`,
                    }}
                  >
                    {errorPopup.ctaLabel || "Adjust Now"}
                  </button>
                </div>
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
        .child-age-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 24px;
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
          .child-age-grid {
            grid-template-columns: 1fr !important;
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


