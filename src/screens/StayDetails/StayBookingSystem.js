import React, { useState, useEffect, useMemo, useRef } from "react";
import { useHistory } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Bed, X, Star, ShieldCheck, ChevronDown, Plus, Minus, Info, AlertCircle } from "lucide-react";
import moment from "moment";
import { useTheme } from "../../components/JUI/Theme";
import { createStayOrder, getStayRoomAvailability } from "../../utils/api";
import Counter from "../../components/Counter";

const StayInlineCalendar = ({ 
  checkInDate, 
  checkOutDate, 
  onDateSelect, 
  isBlockedDay, 
  tokens, 
  selectionMode,
  nextBlockedDate
}) => {
  const { A, AL, BG, FG, M, B, S, W } = tokens;
  const [viewDate, setViewDate] = useState(() => (checkInDate ? checkInDate.toDate() : new Date()));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayKey = moment().startOf('day').format("YYYY-MM-DD");
  const checkInKey = checkInDate ? checkInDate.format("YYYY-MM-DD") : null;
  const checkOutKey = checkOutDate ? checkOutDate.format("YYYY-MM-DD") : null;
  const nextBlockedKey = nextBlockedDate ? nextBlockedDate.format("YYYY-MM-DD") : null;

  const isRange = checkInDate && checkOutDate;

  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const mDate = moment([year, month, day]);
      const key = mDate.format("YYYY-MM-DD");
      const isPast = key < todayKey;
      const isBlocked = isBlockedDay(mDate);
      const isSelected = key === checkInKey || key === checkOutKey;
      const isInRange = isRange && key > checkInKey && key < checkOutKey;
      
      return { day, key, mDate, isPast, isBlocked, isSelected, isInRange };
    }),
  ];

  return (
    <div style={{ background: S, borderRadius: 24, padding: "24px", border: `1px solid ${B}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          disabled={year === new Date().getFullYear() && month <= new Date().getMonth()}
          style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${B}`, background: BG, color: FG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: (year === new Date().getFullYear() && month <= new Date().getMonth()) ? 0.3 : 1 }}
        >
          <ChevronDown size={18} style={{ transform: "rotate(90deg)" }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: FG }}>
          {viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${B}`, background: BG, color: FG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronDown size={18} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: M, marginBottom: 12 }}>{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const isSelectingCheckOut = selectionMode === "check-out" && checkInDate && !checkOutDate;
          const disabled = cell.isPast || (
            isSelectingCheckOut
              ? (
                // Checkout Selection Mode:
                // 1. Disable dates on or before check-in
                (checkInKey && cell.key <= checkInKey) || 
                // 2. Disable dates strictly after the next blocked date
                // (nextBlockedKey itself is allowed as checkout morning)
                (nextBlockedKey && cell.key > nextBlockedKey)
              )
              : cell.isBlocked
          );
          
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => !disabled && onDateSelect(cell.mDate)}
              disabled={disabled}
              style={{
                aspectRatio: "1/1",
                border: "none",
                borderRadius: cell.isSelected ? 12 : 8,
                background: cell.isSelected ? A : cell.isInRange ? AL : "transparent",
                color: cell.isSelected ? "#FFF" : disabled ? `${M}44` : FG,
                fontSize: 13,
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "0.2s",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {cell.day}
              {cell.isBlocked && !cell.isPast && (
                <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: cell.isSelected ? "#FFF" : M }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const formatPrice = (price) => {
  return Number(price).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

const getSeasonIdCandidates = (season) => (
  [
    season?.tempId,
    season?.seasonalPeriodId,
    season?.seasonId,
    season?.id,
  ]
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
    .map((v) => String(v))
);

const resolveSeasonalNode = (source, season) => {
  if (!source || !season) return null;
  const keys = getSeasonIdCandidates(season);
  if (keys.length === 0) return null;

  if (Array.isArray(source)) {
    return source.find((item) =>
      getSeasonIdCandidates(item).some((id) => keys.includes(id))
    ) || null;
  }

  if (typeof source === "object") {
    for (const key of keys) {
      if (source[key] != null) return source[key];
      if (source[String(key)] != null) return source[String(key)];
    }
  }

  return null;
};

const isInSeasonRange = (dateValue, season) => {
  if (!dateValue || !season) return false;
  const check = moment(dateValue).startOf("day");
  const start = moment(season?.startDate || season?.start_date).startOf("day");
  const end = moment(season?.endDate || season?.end_date).startOf("day");
  if (!check.isValid() || !start.isValid() || !end.isValid()) return false;
  return check.isSameOrAfter(start, "day") && check.isSameOrBefore(end, "day");
};

const StayBookingSystem = ({
  stay,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guests,
  setGuests,
  selectedRooms, // Array of {roomId, mealPlan, count}
  onRoomsCountChange
}) => {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W, E, EL } } = useTheme();
  const [show, setShow] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [selectionMode, setSelectionMode] = useState("check-in");

  useEffect(() => {
    if (show) {
      setSelectionMode("check-in");
      setValidationError("");
    }
  }, [show]);

  const lastDeps = useRef("");
  useEffect(() => {
    const currentDeps = `${checkInDate?.format("YYYY-MM-DD") || ""}-${checkOutDate?.format("YYYY-MM-DD") || ""}-${guests.adults}-${guests.children}`;
    if (lastDeps.current && lastDeps.current !== currentDeps) {
      setValidationError("");
    }
    lastDeps.current = currentDeps;
  }, [checkInDate, checkOutDate, guests]);

  const handleDateSelect = (date) => {
    // If the date is blocked, it can ONLY be selected as a check-out date
    const isBlocked = isBlockedDay(date);

    // If we have a complete range and click again, start a fresh selection
    if (checkInDate && checkOutDate) {
      if (isBlocked) return;
      setCheckInDate(date);
      setCheckOutDate(null);
      setSelectionMode("check-out");
      return;
    }

    if (selectionMode === "check-in") {
      if (isBlocked) return;
      setCheckInDate(date);
      setCheckOutDate(null);
      setSelectionMode("check-out");
    } else {
      if (date && checkInDate && date.isAfter(checkInDate, 'day')) {
        setCheckOutDate(date);
      } else {
        if (isBlocked) return;
        setCheckInDate(date);
        setCheckOutDate(null);
        setSelectionMode("check-out");
      }
    }
  };
  const [loading, setLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const stayRoomsCatalog = useMemo(
    () => (stay?.rooms || stay?.roomTypes || stay?.room_types || []),
    [stay]
  );

  // Dynamic Guest Age Labels based on Child Age Policy
  const guestAgeLabels = useMemo(() => {
    const policies = stay?.childAgePolicy || stay?.child_age_policy;
    const childRate = Array.isArray(policies) 
      ? policies.find(p => p.policyType === "child_rate" || p.policy_type === "child_rate")
      : null;

    if (childRate) {
      const fromAge = childRate.fromAge ?? childRate.from_age;
      const toAge = childRate.toAge ?? childRate.to_age;
      
      if (fromAge !== undefined && toAge !== undefined) {
        return {
          adults: `Age ${Number(toAge) + 1}+`,
          children: `Ages ${fromAge}–${toAge}`
        };
      }
    }
    
    // Fallback defaults
    return {
      adults: "Age 13+",
      children: "Ages 2–12"
    };
  }, [stay]);

  // Fetch real-time availability and pricing when modal opens or dates change
  useEffect(() => {
    if (show && (stay?.stayId || stay?.id) && checkInDate && checkOutDate) {
      let cancelled = false;
      const load = async () => {
        if (!cancelled) setFetchingAvailability(true);
        try {
          const data = await getStayRoomAvailability(
            stay.stayId || stay.id,
            checkInDate.format("YYYY-MM-DD"),
            checkOutDate.format("YYYY-MM-DD")
          );
          if (!cancelled && data) setAvailabilityData(data);
        } catch (e) {
          console.error("❌ Failed to fetch real-time room pricing:", e);
        } finally {
          if (!cancelled) setFetchingAvailability(false);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }
  }, [show, stay?.stayId, stay?.id, checkInDate, checkOutDate]);

  const resolvedSelectedRooms = useMemo(() => {
    if (!stay || !Array.isArray(selectedRooms)) return [];
    
    // Prioritize rooms from availabilityData as they have real-time pricing for the selected dates
    const rawRoomsSource = (availabilityData?.roomAvailability || availabilityData?.rooms || stay.rooms || stay.roomTypes || stay.room_types || []);
    const catalogById = new Map(
      stayRoomsCatalog.map((r) => [
        String(r?.roomId ?? r?.id ?? r?.roomTypeId ?? r?.room_type_id),
        r,
      ])
    );
    const roomsSource = rawRoomsSource.map((room) => {
      const key = String(room?.roomId ?? room?.id ?? room?.roomTypeId ?? room?.room_type_id);
      const base = catalogById.get(key);
      if (!base) return room;
      return {
        ...base,
        ...room,
        mealPlanSeasonalPricing: room?.mealPlanSeasonalPricing || base?.mealPlanSeasonalPricing,
        seasonalPeriods: room?.seasonalPeriods || base?.seasonalPeriods,
        mealPlanPricing: room?.mealPlanPricing || base?.mealPlanPricing,
      };
    });

    // Find active season based on check-in date (room.seasonalPeriods first, then stay.seasonalPeriods)
    const checkInStr = checkInDate ? (typeof checkInDate === 'string' ? checkInDate : checkInDate.format('YYYY-MM-DD')) : null;
    
    return selectedRooms.map(sel => {
      const room = roomsSource.find(r => String(r.roomId || r.id) === String(sel.roomId));
      if (!room) return null;

      const mealPlan = sel.mealPlan || "EP";

      // Find season that matches check-in date
      const activeSeasonObj = checkInStr ? (
        (room.seasonalPeriods || []).find((p) => isInSeasonRange(checkInStr, p)) ||
        (stay.seasonalPeriods || []).find((p) => isInSeasonRange(checkInStr, p))
      ) : null;

      // ✅ Correct: seasonal meal plan price lives in mealPlanSeasonalPricing[mealPlan][tempId]
      const mealSeasonData = activeSeasonObj
        ? resolveSeasonalNode((room.mealPlanSeasonalPricing || {})[mealPlan], activeSeasonObj)
        : null;
      
      let roomBasePrice = 0;

      // In-season: use mealPlanSeasonalPricing b2cPrice
      if (mealSeasonData && parseFloat(mealSeasonData.b2cPrice || 0) > 0) {
        roomBasePrice = parseFloat(mealSeasonData.b2cPrice);
      } else if (room.mealPlanPricing && room.mealPlanPricing[mealPlan]) {
        // Regular: use mealPlanPricing b2cPrice
        const mp = room.mealPlanPricing[mealPlan];
        roomBasePrice = parseFloat(mp.b2cPrice || mp.price || 0);
      } else {
        // Fallback: b2cMealPlanPricing array or flat meal key
        const mealPricing = (Array.isArray(room.b2cMealPlanPricing)
          ? room.b2cMealPlanPricing.find(p => String(p.mealPlan).toUpperCase() === String(mealPlan).toUpperCase())
          : null);
        if (mealPricing) {
          roomBasePrice = parseFloat(mealPricing.b2cPrice || mealPricing.price || 0);
        } else {
          const mealKey = { EP: "epPrice", BB: "bbPrice", CP: "cpPrice", MAP: "mapPrice", AP: "apPrice" }[mealPlan];
          roomBasePrice = parseFloat(room[mealKey] || room.b2cPrice || room.price || 0);
        }
      }

      // Store seasonal extra prices on the resolved room for use in pricing calc
      const seasonalExtraAdultPrice = mealSeasonData?.extraAdultPrice
        ? parseFloat(mealSeasonData.extraAdultPrice)
        : null;
      const seasonalExtraChildPrice = mealSeasonData?.extraChildPrice
        ? parseFloat(mealSeasonData.extraChildPrice)
        : null;

      return { ...room, ...sel, calculatedPrice: roomBasePrice, seasonalExtraAdultPrice, seasonalExtraChildPrice };
    }).filter(Boolean);
  }, [stay, selectedRooms, availabilityData, checkInDate, stayRoomsCatalog]);

  const nightsCount = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.max(1, moment(checkOutDate).diff(moment(checkInDate), "days"));
  }, [checkInDate, checkOutDate]);

  // Price Calculation Logic
  const pricing = useMemo(() => {
    if (!stay) return { perNight: 0, subtotal: 0, discount: 0, warning: null, isOver: false };
    
    let totalOriginalPerNight = 0;
    let totalBaseAdultsLimit = 0;
    let totalBaseChildrenLimit = 0;
    let totalExtraAdultsLimit = 0;
    let totalExtraChildrenLimit = 0;

    const activeSeason = checkInDate ? (stay.seasonalPeriods || []).find(p => 
      moment(checkInDate).isSameOrAfter(p.startDate, 'day') &&
      moment(checkInDate).isSameOrBefore(p.endDate, 'day')
    ) : null;
    const seasonId = activeSeason?.tempId || activeSeason?.id || activeSeason?.seasonalPeriodId;

    const isPropertyBased = stay?.bookingScope === "Property-Based";

    let finalExtraAP = 0;
    let finalExtraCP = 0;

    if (isPropertyBased) {
      totalBaseAdultsLimit = stay.maxAdults || stay.maxGuests || 1;
      totalBaseChildrenLimit = stay.maxChildren || 0;
      totalExtraAdultsLimit = stay.maxExtraAdults || stay.maxExtraAdultsAllowed || stay.maxExtraBeds || 0;
      totalExtraChildrenLimit = stay.maxExtraChildren || stay.maxExtraChildrenAllowed || 0;
      
      let basePrice = parseFloat(stay.fullPropertyB2cPrice || stay.b2cPrice || stay.price || 0);
      let extraAP = parseFloat(stay.fullPropertyExtraAdultPrice || stay.extraAdultPrice || 0);
      let extraCP = parseFloat(stay.fullPropertyExtraChildPrice || stay.extraChildPrice || 0);

      if (seasonId) {
        const propSeasonData = (stay.propertySeasonalPricing || {})[seasonId] || stay[seasonId];
        if (propSeasonData) {
          basePrice = parseFloat(propSeasonData.fullPropertyHikePrice || propSeasonData.hikePrice || propSeasonData.fullPropertyB2cPrice || propSeasonData.b2cPrice || basePrice);
          extraAP = parseFloat(propSeasonData.fullPropertyExtraAdultPrice || propSeasonData.extraAdultPrice || extraAP);
          extraCP = parseFloat(propSeasonData.fullPropertyExtraChildPrice || propSeasonData.extraChildPrice || extraCP);
        }
      }

      finalExtraAP = extraAP;
      finalExtraCP = extraCP;

      const exA = Math.max(0, (guests?.adults || 1) - totalBaseAdultsLimit);
      const exC = Math.max(0, (guests?.children || 0) - totalBaseChildrenLimit);
      totalOriginalPerNight = basePrice + (exA * extraAP) + (exC * extraCP);
    } else {
      // Room-Based: Sum up for all selected rooms
      // Note: calculatedPrice & seasonalExtraAdultPrice are pre-resolved in resolvedSelectedRooms
      resolvedSelectedRooms.forEach(room => {
        const roomBasePrice = room.calculatedPrice || 0;

        // ✅ Extra prices: seasonal first (already resolved), then room-level, then stay-level
        const roomExtraAP = parseFloat(
          room.seasonalExtraAdultPrice ??
          room.extraAdultPrice ??
          (room.mealPlanPricing?.[room.mealPlan || 'EP']?.extraAdultPrice) ??
          stay.extraAdultPrice ?? 0
        );
        const roomExtraCP = parseFloat(
          room.seasonalExtraChildPrice ??
          room.extraChildPrice ??
          (room.mealPlanPricing?.[room.mealPlan || 'EP']?.extraChildPrice) ??
          stay.extraChildPrice ?? 0
        );

        totalOriginalPerNight += roomBasePrice * room.count;
        totalBaseAdultsLimit += (room.maxAdults || 1) * room.count;
        totalBaseChildrenLimit += (room.maxChildren || 0) * room.count;
        totalExtraAdultsLimit += (room.maxExtraAdults || room.maxExtraAdultsAllowed || room.maxExtraBeds || 0) * room.count;
        totalExtraChildrenLimit += (room.maxExtraChildren || room.maxExtraChildrenAllowed || 0) * room.count;

        // Accumulate extra rates for overflow guests across all rooms
        // (weighted by room count for multi-room bookings)
        totalOriginalPerNight += 0; // extra guest overflow added below after limits are summed

        // Store per-room rates for extra guest calc below
        room._resolvedExtraAP = roomExtraAP;
        room._resolvedExtraCP = roomExtraCP;
      });

      const exA = Math.max(0, (guests?.adults || 1) - totalBaseAdultsLimit);
      const exC = Math.max(0, (guests?.children || 0) - totalBaseChildrenLimit);
      
      // ✅ Use resolved extra prices (seasonal-aware) for overflow guests
      const avgExtraAP = resolvedSelectedRooms.length > 0
        ? resolvedSelectedRooms.reduce((acc, r) => acc + (r._resolvedExtraAP || 0), 0) / resolvedSelectedRooms.length
        : parseFloat(stay.extraAdultPrice || 0);
      const avgExtraCP = resolvedSelectedRooms.length > 0
        ? resolvedSelectedRooms.reduce((acc, r) => acc + (r._resolvedExtraCP || 0), 0) / resolvedSelectedRooms.length
        : parseFloat(stay.extraChildPrice || 0);

      finalExtraAP = avgExtraAP;
      finalExtraCP = avgExtraCP;

      totalOriginalPerNight += (exA * avgExtraAP) + (exC * avgExtraCP);
    }

    // Occupancy & Stay Warnings
    let warning = null;
    let isOver = false;
    
    const currentAdults = guests?.adults || 1;
    const currentChildren = guests?.children || 0;

    // 1. Check Maximum Stay Limit
    const maxNights = stay.maximumStayNights || 0;
    if (maxNights > 0 && nightsCount > maxNights) {
      isOver = true;
      warning = `Maximum stay allowed is ${maxNights} nights.`;
    }
    
    // 2. Check Capacity
    if (!isOver) {
      const typeLabel = isPropertyBased ? "Property" : "Selected Rooms";
      if (currentAdults > (totalBaseAdultsLimit + totalExtraAdultsLimit)) {
        isOver = true;
        warning = `${typeLabel} adult capacity reached (${totalBaseAdultsLimit + totalExtraAdultsLimit} max).`;
      } else if (currentChildren > (totalBaseChildrenLimit + totalExtraChildrenLimit)) {
        isOver = true;
        warning = `${typeLabel} children capacity reached (${totalBaseChildrenLimit + totalExtraChildrenLimit} max).`;
      } else if (currentAdults > totalBaseAdultsLimit || currentChildren > totalBaseChildrenLimit) {
        warning = `Base occupants reached. Additional guests will incur extra charges.`;
      }
    }

    // Discount Tiers
    let appliedDiscountPercent = 0;
    if (nightsCount > 0 && Array.isArray(stay.discountTiers)) {
      const tier = stay.discountTiers.find(t => nightsCount >= (t.minimumDays || 0) && nightsCount <= (t.maximumDays || 999));
      if (tier) appliedDiscountPercent = parseFloat(tier.discountPercentage || 0);
    }

    const discountedPerNight = totalOriginalPerNight * (1 - (appliedDiscountPercent / 100));
    const preTaxSubtotal = discountedPerNight * Math.max(1, nightsCount);
    const discountAmount = (totalOriginalPerNight * Math.max(1, nightsCount)) - preTaxSubtotal;

    const gst = preTaxSubtotal * 0.18;
    const serviceFee = preTaxSubtotal * 0.02;
    const finalTotalWithTax = preTaxSubtotal + gst + serviceFee;

    return {
      perNight: discountedPerNight,
      originalPerNight: totalOriginalPerNight,
      subtotal: preTaxSubtotal,
      finalTotal: finalTotalWithTax,
      nightsCount,
      discount: discountAmount,
      discountPercent: appliedDiscountPercent,
      warning,
      isOver,
      gst,
      serviceFee,
      baseAdultsLimit: totalBaseAdultsLimit,
      extraAdultsLimit: totalExtraAdultsLimit,
      baseChildrenLimit: totalBaseChildrenLimit,
      extraChildrenLimit: totalExtraChildrenLimit,
      activeExtraAdultPrice: finalExtraAP,
      activeExtraChildPrice: finalExtraCP
    };
  }, [stay, resolvedSelectedRooms, checkInDate, guests, nightsCount]);

  const blockedDateKeys = useMemo(() => {
    const ranges = stay?.bookedDateRanges || stay?.stay?.bookedDateRanges || [];
    if (!Array.isArray(ranges) || ranges.length === 0) return new Set();

    const normalizeId = (value) => {
      if (value === null || value === undefined) return "";
      const raw = String(value).trim();
      if (!raw) return "";
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? String(numeric) : raw.toLowerCase();
    };

    const isPropertyBased = stay?.bookingScope === "Property-Based" || stay?.bookingScope === "Property Based";
    const selectedRoomIds = new Set(
      (selectedRooms || [])
        .map((r) => normalizeId(r?.roomId ?? r?.room_id ?? r?.roomTypeId ?? r?.room_type_id ?? r?.id))
        .filter(Boolean)
    );

    const keys = new Set();
    ranges.forEach((range) => {
      const rangeRoomId = normalizeId(range?.roomId ?? range?.room_id ?? range?.roomTypeId ?? range?.room_type_id ?? range?.id);
      if (!isPropertyBased) {
        if (selectedRoomIds.size === 0) return;
        if (!rangeRoomId || !selectedRoomIds.has(rangeRoomId)) return;
      }

      const start = moment(range?.checkInDate || range?.check_in_date || range?.startDate || range?.start_date);
      const end = moment(range?.checkOutDate || range?.check_out_date || range?.endDate || range?.end_date);
      if (!start.isValid() || !end.isValid()) return;

      // Block occupied nights: [check-in, checkout)
      const cursor = start.clone().startOf("day");
      const endDay = end.clone().startOf("day");
      while (cursor.isBefore(endDay, "day")) {
        keys.add(cursor.format("YYYY-MM-DD"));
        cursor.add(1, "day");
      }
    });

    return keys;
  }, [stay, selectedRooms]);

  const nextBlockedDate = useMemo(() => {
    if (!checkInDate || blockedDateKeys.size === 0) return null;
    const checkInKey = checkInDate.format("YYYY-MM-DD");
    const nextDateKey = Array.from(blockedDateKeys)
      .filter(k => k > checkInKey)
      .sort()[0];
    return nextDateKey ? moment(nextDateKey) : null;
  }, [checkInDate, blockedDateKeys]);

  const isBlockedDay = (day) => blockedDateKeys.has(moment(day).format("YYYY-MM-DD"));

  const handleReserve = async () => {
    if (!checkInDate) {
      setValidationError("Please select a check-in date.");
      return;
    }
    if (!checkOutDate) {
      setValidationError("Please select a check-out date.");
      return;
    }
    if (!checkOutDate.isAfter(checkInDate, 'day')) {
      setValidationError("Checkout date must be after check-in date.");
      return;
    }
    if ((guests.adults || 0) + (guests.children || 0) === 0) {
      setValidationError("Please add at least 1 guest.");
      return;
    }
    if ((guests.adults || 0) === 0) {
      setValidationError("At least 1 adult is required.");
      return;
    }

    setLoading(true);
    try {
      const isPropertyBased = stay?.bookingScope === "Property-Based";
      const extraAdultsCount = Math.max(0, (guests.adults || 1) - pricing.baseAdultsLimit);
      const extraChildrenCount = Math.max(0, (guests.children || 0) - pricing.baseChildrenLimit);

      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName = userInfo.name || (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") || userInfo.customerName || "Guest User";
      const customerEmail = userInfo.email || userInfo.customerEmail || "guest@example.com";
      const customerPhone = userInfo.customerPhone || (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") || userInfo.phoneNumber || "+911234567890";

      const payload = {
        stayId: Number(stay.stayId || stay.id),
        checkInDate: checkInDate.format("YYYY-MM-DD"),
        checkOutDate: checkOutDate.format("YYYY-MM-DD"),
        numberOfGuests: (guests.adults || 1) + (guests.children || 0),
        adults: guests.adults || 1,
        children: guests.children || 0,
        extraAdults: extraAdultsCount,
        extraChildren: extraChildrenCount,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests: "",
        amount: pricing.finalTotal,
        paymentMethod: "razorpay",
        rooms: isPropertyBased
          ? [] // Property-based: no individual rooms, extras tracked at top level
          : resolvedSelectedRooms.map(r => {
              // Per-room: distribute base adults/children from this room's capacity
              const roomBaseAdults = (r.maxAdults || 1) * r.count;
              const roomBaseChildren = (r.maxChildren || 0) * r.count;
              const roomExtraAdults = Math.max(0, (guests.adults || 1) - roomBaseAdults);
              const roomExtraChildren = Math.max(0, (guests.children || 0) - roomBaseChildren);
              return {
                roomId: r.roomId || r.id,
                roomsBooked: r.count,
                adults: guests.adults || 1,
                children: guests.children || 0,
                extraAdults: roomExtraAdults,
                extraChildren: roomExtraChildren,
                mealPlanCode: r.mealPlan || "EP"
              };
            })
      };

      const response = await createStayOrder(payload);
      const paymentResponse = response?.payment || response?.data?.payment || response;
      const orderResponse = response?.order || response?.data?.order || response;
      const pricingResponse = response?.guestPricing || response?.pricing || response?.priceBreakdown || response?.data?.guestPricing || {};
      
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
              if (!orderId && val.startsWith("order_")) orderId = val;
              if (!keyId && val.startsWith("rzp_")) keyId = val;
            } else if (typeof val === "object") search(val);
          }
        };
        search(res);
        return { razorpayOrderId: orderId, razorpayKeyId: keyId };
      };

      const getFieldByAliases = (obj, aliases = []) => {
        if (!obj || typeof obj !== "object") return null;
        const aliasSet = new Set(aliases.map((k) => String(k).toLowerCase()));
        let found = null;

        const walk = (node) => {
          if (!node || typeof node !== "object" || found) return;
          for (const [k, v] of Object.entries(node)) {
            if (found) return;
            const keyLower = String(k).toLowerCase();
            if (aliasSet.has(keyLower) && v != null && v !== "") {
              found = v;
              return;
            }
            if (v && typeof v === "object") walk(v);
          }
        };

        walk(obj);
        return found;
      };

      const extractedRZP = extractRazorpayCredentials(response);
      
      const razorpayOrderId = 
        paymentResponse.razorpayOrderId || 
        paymentResponse.razorpayorderid ||
        paymentResponse.razorpay_order_id || 
        orderResponse?.razorpayOrderId ||
        orderResponse?.razorpayorderid ||
        orderResponse?.razorpay_order_id ||
        response?.razorpayOrderId ||
        response?.razorpayorderid ||
        response?.razorpay_order_id ||
        getFieldByAliases(response, ["razorpayOrderId", "razorpay_order_id", "razorpayorderid"]) ||
        extractedRZP.razorpayOrderId;
        
      const razorpayKeyId = 
        paymentResponse.razorpayKeyId || 
        paymentResponse.razorpaykeyid || 
        paymentResponse.razorpay_key_id || 
        paymentResponse.razorpayKey ||
        paymentResponse.razorpaykey ||
        paymentResponse.keyId || 
        paymentResponse.keyid ||
        orderResponse?.razorpayKeyId ||
        orderResponse?.razorpaykeyid ||
        orderResponse?.razorpay_key_id ||
        orderResponse?.razorpayKey ||
        orderResponse?.razorpaykey ||
        orderResponse?.keyId ||
        orderResponse?.keyid ||
        response?.razorpayKeyId ||
        response?.razorpaykeyid ||
        response?.razorpay_key_id ||
        response?.razorpayKey ||
        response?.razorpaykey ||
        response?.keyId ||
        response?.keyid ||
        getFieldByAliases(response, ["razorpayKeyId", "razorpay_key_id", "razorpaykeyid", "razorpayKey", "keyId", "keyid"]) ||
        extractedRZP.razorpayKeyId ||
        localStorage.getItem("lastRazorpayKeyId") ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        "rzp_test_RaBjdu0Ed3p1gN";

      if (!razorpayOrderId) {
        const appOrderId = orderResponse?.orderId || response?.orderId || response?.data?.orderId || null;
        console.error("❌ Razorpay Order ID missing from response:", {
          appOrderId,
          razorpayOrderId,
          razorpayKeyId,
          response
        });
        alert(`Payment initialization failed: Razorpay order was not generated${appOrderId ? ` (Order #${appOrderId})` : ""}.`);
        return;
      }

      const asNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      };
      const firstNumber = (...values) => {
        for (const value of values) {
          const parsed = asNumber(value);
          if (parsed !== null) return parsed;
        }
        return null;
      };

      const backendTotalRupees = firstNumber(
        response?.totalAmount,
        response?.data?.totalAmount,
        orderResponse?.totalPrice,
        orderResponse?.finalPrice,
        orderResponse?.amount,
        orderResponse?.totalAmount,
        pricingResponse?.finalGuestPrice,
        pricingResponse?.totalGuestPrice,
        response?.finalGuestPrice,
        response?.data?.finalGuestPrice
      );
      const amountInPaise = firstNumber(
        paymentResponse?.amount,
        orderResponse?.amount,
        response?.amount,
        backendTotalRupees != null ? Math.round(backendTotalRupees * 100) : null,
        Math.round(pricing.finalTotal * 100)
      );

      localStorage.setItem("pendingPayment", JSON.stringify({
        paymentMethod: "razorpay",
        razorpayOrderId,
        razorpayKeyId,
        amount: amountInPaise,
        currency: paymentResponse.currency || response?.currency || "INR"
      }));
      
      if (razorpayKeyId) {
        localStorage.setItem("lastRazorpayKeyId", razorpayKeyId);
      }

      const currency = paymentResponse.currency || response?.currency || "INR";
      const formatMoney = (value) => `${currency} ${Number(value || 0).toFixed(2)}`;
      const isPresent = (v) => v !== null && v !== undefined && v !== "";
      const receipt = [];

      const basePrice = firstNumber(pricingResponse?.totalBasePrice, pricingResponse?.basePrice, pricingResponse?.totalBaseAmount);
      const discount = firstNumber(pricingResponse?.totalGuestDiscount, pricingResponse?.guestDiscount, pricingResponse?.discountAmount);
      const afterDiscount = firstNumber(pricingResponse?.priceAfterDiscounts, pricingResponse?.priceAfterDiscount, pricingResponse?.subtotalAfterDiscount);
      const tourismTax = firstNumber(pricingResponse?.tourismTax, pricingResponse?.tourismTaxAmount);
      const serviceTax = firstNumber(pricingResponse?.serviceTax, pricingResponse?.serviceTaxAmount, pricingResponse?.serviceFee);
      const gst = firstNumber(pricingResponse?.gst, pricingResponse?.gstAmount);
      const finalGuestPrice = firstNumber(
        pricingResponse?.finalGuestPrice,
        pricingResponse?.totalGuestPrice,
        response?.totalAmount,
        response?.data?.totalAmount,
        orderResponse?.totalPrice,
        orderResponse?.finalPrice,
        backendTotalRupees
      );
      if (isPresent(basePrice)) receipt.push({ title: "Total Base Price", content: formatMoney(basePrice) });
      if (isPresent(discount)) receipt.push({ title: "Total Discount", content: `- ${formatMoney(Math.abs(discount))}` });
      if (isPresent(afterDiscount)) receipt.push({ title: "Price After Discounts", content: formatMoney(afterDiscount) });
      const combinedBackendTax = (tourismTax || 0) + (serviceTax || 0) + (gst || 0);
      if (combinedBackendTax > 0) receipt.push({ title: "Tax", content: `+ ${formatMoney(combinedBackendTax)}` });
      if (isPresent(finalGuestPrice)) receipt.push({ title: "Final Guest Price", content: formatMoney(finalGuestPrice) });

      const nightsFromOrder = firstNumber(orderResponse?.numberOfNights, pricing.nightsCount) || 1;
      const nightlyFromOrder = firstNumber(orderResponse?.pricePerNight, pricing.originalPerNight) || 0;
      const totalFromOrder = firstNumber(orderResponse?.totalPrice, orderResponse?.finalPrice, backendTotalRupees, pricing.finalTotal) || 0;
      const frontendReceipt = [
        { title: `Base Stay (${nightsFromOrder} night${nightsFromOrder !== 1 ? "s" : ""})`, content: `${currency} ${Number(nightlyFromOrder * nightsFromOrder).toFixed(2)}` },
        { title: "Adults", content: `${guests.adults || 0}` },
        { title: "Children", content: `${guests.children || 0}` },
      ];
      if (extraAdultsCount > 0) {
        frontendReceipt.push({
          title: `Extra Adult Charges (${extraAdultsCount} × ${currency} ${Number(pricing.activeExtraAdultPrice || 0).toFixed(2)} × ${nightsFromOrder} night${nightsFromOrder !== 1 ? "s" : ""})`,
          content: `${currency} ${Number(extraAdultsCount * (pricing.activeExtraAdultPrice || 0) * nightsFromOrder).toFixed(2)}`,
        });
      }
      if (extraChildrenCount > 0) {
        frontendReceipt.push({
          title: `Extra Child Charges (${extraChildrenCount} × ${currency} ${Number(pricing.activeExtraChildPrice || 0).toFixed(2)} × ${nightsFromOrder} night${nightsFromOrder !== 1 ? "s" : ""})`,
          content: `${currency} ${Number(extraChildrenCount * (pricing.activeExtraChildPrice || 0) * nightsFromOrder).toFixed(2)}`,
        });
      }
      const taxRate = Array.isArray(stay?.taxes)
        ? stay.taxes.reduce((sum, t) => sum + Number(t?.currentRate ?? t?.appliedPercentage ?? t?.rate ?? 0), 0)
        : 0;
      const combinedFrontendTax = (pricing.subtotal || 0) * (taxRate / 100);
      const inferredDiscountFromTotals = Math.max(
        0,
        Number((nightlyFromOrder * nightsFromOrder) || 0) +
          Number(combinedFrontendTax || 0) -
          Number(totalFromOrder || 0)
      );
      const discountToShow = firstNumber(
        pricing.discount,
        discount,
        inferredDiscountFromTotals
      ) || 0;
      if (discountToShow > 0) {
        frontendReceipt.push({ title: "Total Discount", content: `- ${currency} ${Number(discountToShow).toFixed(2)}` });
      }
      if (combinedFrontendTax > 0) {
        frontendReceipt.push({ title: `Tax (${Number(taxRate).toFixed(2)}%)`, content: `+ ${currency} ${Number(combinedFrontendTax).toFixed(2)}` });
      }
      frontendReceipt.push({ title: "Final Guest Price", content: `${currency} ${Number(totalFromOrder).toFixed(2)}` });

      // Frontend-calculated breakdown should be shown in Confirm & Pay.
      // Keep backend breakdown only as a fallback.
      const finalReceipt = frontendReceipt.length > 0 ? frontendReceipt : receipt;

      const roomSummary = isPropertyBased
        ? "Full Property"
        : resolvedSelectedRooms.map(r => `${r.count}x ${r.roomName || r.name}`).join(", ");

      const bookingData = {
        stayId: payload.stayId,
        leadUserId: stay?.leadUserId,
        listingTitle: stay.propertyName || stay.title || "Stay",
        listingImage: stay.coverPhotoUrl || stay.coverImageUrl || "",
        isStay: true,
        checkInDate: checkInDate.format("MMM DD, YYYY"),
        checkOutDate: checkOutDate.format("MMM DD, YYYY"),
        roomType: roomSummary,
        guests: guests,
        extraAdults: extraAdultsCount,
        extraChildren: extraChildrenCount,
        receipt: finalReceipt,
        totalAmount: backendTotalRupees ?? pricing.finalTotal,
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

      history.push("/checkout");
    } catch (err) {
      console.error(err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        
        .booking-modal-container::-webkit-scrollbar {
          width: 6px;
        }
        .booking-modal-container::-webkit-scrollbar-thumb {
          background: ${B};
          border-radius: 10px;
        }

        @media(max-width: 900px) {
          .booking-modal-container { 
            width: 100% !important; 
            height: 100% !important; 
            max-height: 100vh !important; 
            border-radius: 0 !important; 
            margin: 0 !important;
          }
          .booking-grid { grid-template-columns: 1fr !important; }
          .booking-modal-header { padding: 24px 20px !important; }
          .booking-modal-column { padding: 32px 20px !important; }
          .booking-modal-footer { 
            flex-direction: column !important; 
            gap: 24px !important; 
            padding: 24px 20px !important; 
            align-items: stretch !important;
            text-align: center !important;
            position: sticky !important;
            bottom: 0 !important;
            background: ${BG} !important;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.1) !important;
          }
          .booking-modal-footer button { width: 100% !important; }
          
          .stay-booking-trigger {
            bottom: 20px !important;
            right: 20px !important;
            left: 20px !important;
            width: calc(100% - 40px) !important;
          }
        }
      `}</style>

      {/* Floating Trigger */}
      <motion.button
        onClick={() => setShow(true)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="stay-booking-trigger"
        style={{
          position: "fixed",
          bottom: 40,
          right: 40,
          background: A,
          color: "#FFF",
          padding: "18px 36px",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "0.02em"
        }}
      >
        <Bed size={20} />
        Reserve
      </motion.button>

      <AnimatePresence>
        {show && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: window.innerWidth <= 768 ? 0 : 20, overflow: "auto" }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }} 
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
                maxWidth: 850,
                maxHeight: "calc(100vh - 40px)",
                background: BG,
                borderRadius: 32,
                boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
                border: `1px solid ${B}`,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Header */}
              <div className="booking-modal-header" style={{ padding: "32px 40px", borderBottom: `1px solid ${B}88`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: A, marginBottom: 8 }}>
                    Reserve Your Stay
                  </h2>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: FG }}>
                      {fetchingAvailability ? "..." : `₹${formatPrice(pricing.perNight)}`}
                    </span>
                    {!fetchingAvailability && pricing.discount > 0 && (
                      <span style={{ fontSize: 18, color: M, textDecoration: "line-through", opacity: 0.6 }}>₹{formatPrice(pricing.originalPerNight)}</span>
                    )}
                    <span style={{ fontSize: 14, color: M, fontWeight: 500 }}>/ night</span>
                  </div>
                </div>
                <button onClick={() => setShow(false)} style={{ background: S, border: `1px solid ${B}`, padding: 12, borderRadius: 100, cursor: "pointer", color: FG }}>
                  <X size={20} />
                </button>
              </div>

              <div className="booking-modal-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
                <div className="booking-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 1, background: B }}>
                  {/* Left Column: Calendar */}
                  <div className="booking-modal-column" style={{ padding: "40px", background: BG, display: "flex", flexDirection: "column", gap: 32 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
                          01. Select Dates
                          <span style={{ fontSize: 10, fontWeight: 700, background: AL, color: A, padding: "2px 8px", borderRadius: 100, border: `1px solid ${A}22` }}>
                            {selectionMode === "check-in" ? "Select Check-in" : "Select Check-out"}
                          </span>
                        </div>
                        {(checkInDate || checkOutDate) && (
                          <button 
                            type="button"
                            onClick={() => {
                              setCheckInDate(null);
                              setCheckOutDate(null);
                              setSelectionMode("check-in");
                              setValidationError("");
                            }}
                            style={{ 
                              background: AL, 
                              border: `1px solid ${A}33`, 
                              color: A, 
                              fontSize: 10, 
                              fontWeight: 800, 
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              cursor: "pointer", 
                              padding: "6px 14px", 
                              borderRadius: 100,
                              transition: "0.3s",
                              boxShadow: `0 4px 12px ${A}11`
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = A;
                              e.target.style.color = "#FFF";
                              e.target.style.boxShadow = `0 6px 16px ${A}33`;
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = AL;
                              e.target.style.color = A;
                              e.target.style.boxShadow = `0 4px 12px ${A}11`;
                            }}
                          >
                            Clear Dates
                          </button>
                        )}
                      </div>

                      <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ padding: "12px 16px", background: S, borderRadius: 16, border: `1px solid ${selectionMode === 'check-in' ? A : B}` }}>
                          <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", marginBottom: 4 }}>Check-in</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: checkInDate ? FG : M }}>{checkInDate ? checkInDate.format("DD MMM, YYYY") : "Select date"}</p>
                        </div>
                        <div style={{ padding: "12px 16px", background: S, borderRadius: 16, border: `1px solid ${selectionMode === 'check-out' ? A : B}` }}>
                          <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", marginBottom: 4 }}>Check-out</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: checkOutDate ? FG : M }}>{checkOutDate ? checkOutDate.format("DD MMM, YYYY") : "Select date"}</p>
                        </div>
                      </div>

                      {selectionMode === "check-out" && nextBlockedDate && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ 
                            marginBottom: 20, 
                            padding: "10px 14px", 
                            background: AL, 
                            borderRadius: 12, 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8,
                            border: `1px solid ${A}22`
                          }}
                        >
                          <Info size={14} color={A} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: FG }}>
                            Checkout available only until {nextBlockedDate.format("DD MMM, YYYY")}
                          </span>
                        </motion.div>
                      )}

                      <StayInlineCalendar 
                        checkInDate={checkInDate}
                        checkOutDate={checkOutDate}
                        onDateSelect={handleDateSelect}
                        isBlockedDay={isBlockedDay}
                        tokens={{ A, AL, BG, FG, M, B, S, W }}
                        selectionMode={selectionMode}
                        nextBlockedDate={nextBlockedDate}
                      />
                    </div>
                  </div>

                  {/* Right Column: Guests & Accommodations */}
                  <div className="booking-modal-column" style={{ padding: "40px", background: S, display: "flex", flexDirection: "column", gap: 32 }}>
                    <div>
                      <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, letterSpacing: "0.1em" }}>
                        02. Guests & Accommodations
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: FG }}>Adults</p>
                            <p style={{ fontSize: 11, color: M, fontWeight: 500 }}>{guestAgeLabels.adults}</p>
                          </div>
                          <Counter 
                            value={guests.adults} 
                            setValue={(v) => setGuests(prev => ({...prev, adults: v}))} 
                            min={1} 
                            max={pricing.baseAdultsLimit + pricing.extraAdultsLimit}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: FG }}>Children</p>
                            <p style={{ fontSize: 11, color: M, fontWeight: 500 }}>{guestAgeLabels.children}</p>
                          </div>
                          <Counter 
                            value={guests.children} 
                            setValue={(v) => setGuests(prev => ({...prev, children: v}))} 
                            min={0} 
                            max={pricing.baseChildrenLimit + pricing.extraChildrenLimit}
                          />
                        </div>
                      </div>

                      {/* Selected Rooms */}
                      {resolvedSelectedRooms.length > 0 && (
                        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                          {resolvedSelectedRooms.map((room) => (
                            <div key={room.roomId || room.id} style={{ padding: "16px 20px", background: BG, borderRadius: 16, border: `1px solid ${B}` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: AL, display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
                                    <Bed size={16} />
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: FG }}>{room.roomName || room.name}</p>
                                    <p style={{ fontSize: 11, color: M }}>{room.mealPlan || "EP"} Plan</p>
                                  </div>
                                </div>
                                <Counter 
                                  value={room.count} 
                                  setValue={(v) => onRoomsCountChange(room.roomId || room.id, v)} 
                                  min={1} 
                                  max={Number(room.units || room.totalRooms || room.availableRooms || 99)} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {pricing.warning && (
                      <div style={{ 
                        padding: "16px 20px", borderRadius: 16, 
                        background: pricing.isOver ? "#FFF5F5" : AL, 
                        border: `1px solid ${pricing.isOver ? "#FEB2B2" : A + '33'}`,
                        display: "flex", gap: 12, alignItems: "flex-start"
                      }}>
                        <AlertCircle size={18} color={pricing.isOver ? "#F56565" : A} style={{ marginTop: 2 }} />
                        <p style={{ fontSize: 13, color: pricing.isOver ? "#C53030" : FG, lineHeight: 1.5, fontWeight: 600 }}>
                          {pricing.warning}
                        </p>
                      </div>
                    )}
                    
                    {/* Price Summary */}
                    {nightsCount > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px", background: BG, borderRadius: 16, border: `1px dashed ${B}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: M, fontSize: 14, fontWeight: 500 }}>
                          <span>Base Price ({nightsCount} night{nightsCount !== 1 ? 's' : ''})</span>
                          <span>₹{formatPrice(pricing.originalPerNight * nightsCount)}</span>
                        </div>

                        {pricing.discount > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#10B981", fontSize: 14, fontWeight: 700 }}>
                            <span>Discount ({pricing.discountPercent}%)</span>
                            <span>- ₹{formatPrice(pricing.discount)}</span>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTop: `1px solid ${B}` }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>Subtotal</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: A }}>₹{formatPrice(pricing.subtotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="booking-modal-footer" style={{ padding: "32px 40px", background: BG, borderTop: `1px solid ${B}88`, display: "flex", flexDirection: "column", gap: 24, zIndex: 10 }}>
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{ width: "100%" }}
                    >
                      <div style={{
                        padding: "14px 16px",
                        background: EL,
                        border: `1px solid ${E}33`,
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        color: E,
                        fontSize: 13,
                        fontWeight: 700,
                        boxShadow: `0 4px 20px ${E}14`
                      }}>
                        <AlertCircle size={18} />
                        <span>{validationError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 11, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Total amount</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: FG }}>₹{formatPrice(pricing.subtotal)}</span>
                    <span style={{ marginTop: 4, fontSize: 11, color: M, fontWeight: 500 }}>Including all taxes.</span>
                  </div>
                  {(() => {
                    const isPropertyBased = stay?.bookingScope === "Property-Based";
                    const hasSelection = isPropertyBased || resolvedSelectedRooms.length > 0;
                    const isDisabled = loading || pricing.isOver; // We allow clicking even if dates are missing to show validation
                    const buttonText = loading ? "Processing..." : (pricing.isOver ? "Capacity Exceeded" : (hasSelection ? "Reserve Stay" : "Select Room"));

                    return (
                      <motion.button
                        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                        onClick={handleReserve}
                        disabled={isDisabled}
                        style={{
                          padding: "18px 48px",
                          background: isDisabled ? B : A,
                          color: "#FFF",
                          borderRadius: 16,
                          border: "none",
                          fontSize: 16,
                          fontWeight: 800,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          boxShadow: isDisabled ? "none" : `0 10px 30px ${A}44`,
                          transition: "0.3s"
                        }}
                      >
                        {buttonText}
                      </motion.button>
                    );
                  })()}
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 40px 32px", color: M, fontSize: 12, background: BG }}>
                <ShieldCheck size={14} />
                <span>Secure payment processed by Little Known Planet</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StayBookingSystem;
