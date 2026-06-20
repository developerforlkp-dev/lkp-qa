import React, { useState, useEffect, useMemo, useRef } from "react";
import { useHistory } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Bed, X, Star, ShieldCheck, ChevronDown, Plus, Minus, Info, AlertCircle, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { useTheme } from "../../components/JUI/Theme";
import { createStayOrder, getStayRoomAvailability } from "../../utils/api";
import Counter from "../../components/Counter";
import LoginPromptModal from "../../components/LoginPromptModal";

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
    <div style={{ background: S, borderRadius: 24, padding: "16px", border: `1px solid ${B}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          disabled={year === new Date().getFullYear() && month <= new Date().getMonth()}
          style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${B}`, background: BG, color: FG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: (year === new Date().getFullYear() && month <= new Date().getMonth()) ? 0.3 : 1 }}
        >
          <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 800, color: FG }}>
          {viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${B}`, background: BG, color: FG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: M, marginBottom: 8 }}>{d}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const isRangeComplete = checkInDate && checkOutDate;
          let disabled = cell.isPast;
          if (!disabled) {
            if (isRangeComplete && selectionMode === "done") {
              // Completely disable calendar interaction once range is complete
              disabled = true;
            } else if (selectionMode === "check-out") {
              // In check-out mode, disable dates on or before check-in, and the blocked day itself and beyond.
              disabled =
                (checkInKey && cell.key <= checkInKey) ||
                cell.isBlocked ||
                (nextBlockedKey && cell.key >= nextBlockedKey);
            } else {
              // In check-in mode, only block globally blocked dates
              disabled = cell.isBlocked;
            }
          }

          // Determine color: highlight selected and range, fade out visually disabled
          const textColor = cell.isSelected 
            ? "#FFF" 
            : (disabled && !cell.isInRange) 
              ? `${M}44` 
              : FG;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => !disabled && onDateSelect(cell.mDate)}
              disabled={disabled}
              style={{
                aspectRatio: "1/1",
                border: "none",
                borderRadius: cell.isSelected ? 10 : 6,
                background: cell.isSelected ? A : cell.isInRange ? AL : "transparent",
                color: textColor,
                fontSize: 12,
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
                <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: cell.isSelected ? "#FFF" : M }} />
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

const formatPricePrecise = (price) => {
  return Number(price).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
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

const distributeGuests = (selectedRooms, stayRoomsCatalog, adults, children) => {
  const roomInstances = [];
  selectedRooms.forEach(sel => {
    const catalogRoom = stayRoomsCatalog.find(
      r => String(r.roomId ?? r.id ?? r.roomTypeId ?? r.room_type_id) === String(sel.roomId)
    );
    if (catalogRoom) {
      const maxAdults = catalogRoom.maxAdults || 2;
      const maxExtraAdults = Number(
        catalogRoom.maxExtraAdults ??
        catalogRoom.maxExtraAdultsAllowed ??
        catalogRoom.maxExtraBeds ??
        0
      );
      const maxExtraChildren = Number(
        catalogRoom.maxExtraChildren ??
        catalogRoom.maxExtraChildrenAllowed ??
        0
      );
      const maxGuests = maxAdults + (catalogRoom.maxChildren || 0);
      const maxChildren = catalogRoom.maxChildren !== undefined ? catalogRoom.maxChildren : 0;

      for (let i = 0; i < sel.count; i++) {
        roomInstances.push({
          instanceId: `${sel.roomId}-${i}`,
          roomId: sel.roomId,
          roomName: catalogRoom.roomName || catalogRoom.name || "Room",
          maxAdults,
          maxChildren,
          maxExtraAdults,
          maxExtraChildren,
          maxGuests,
          allocatedAdults: 0,
          allocatedChildren: 0
        });
      }
    }
  });

  if (roomInstances.length === 0) {
    return { success: false, allocations: [] };
  }

  let remainingAdults = adults;
  let remainingChildren = children;

  // Allocate 1 adult per room first if adults are available
  roomInstances.forEach(inst => {
    if (remainingAdults > 0) {
      inst.allocatedAdults += 1;
      remainingAdults -= 1;
    }
  });

  // Fill standard adults up to maxAdults
  for (let inst of roomInstances) {
    const standardAdultSpace = Math.max(0, inst.maxAdults - inst.allocatedAdults);
    const toAllocate = Math.min(remainingAdults, standardAdultSpace);
    if (toAllocate > 0) {
      inst.allocatedAdults += toAllocate;
      remainingAdults -= toAllocate;
    }
  }

  // Fill extra adults up to maxExtraAdults
  for (let inst of roomInstances) {
    const extraAdultSpace = inst.maxExtraAdults;
    const toAllocate = Math.min(remainingAdults, extraAdultSpace);
    if (toAllocate > 0) {
      inst.allocatedAdults += toAllocate;
      remainingAdults -= toAllocate;
    }
  }

  // Fill standard children up to maxChildren
  for (let inst of roomInstances) {
    const standardChildSpace = Math.max(0, inst.maxChildren - inst.allocatedChildren);
    const toAllocate = Math.min(remainingChildren, standardChildSpace);
    if (toAllocate > 0) {
      inst.allocatedChildren += toAllocate;
      remainingChildren -= toAllocate;
    }
  }

  // Fill extra children up to maxExtraChildren
  for (let inst of roomInstances) {
    const extraChildSpace = inst.maxExtraChildren;
    const toAllocate = Math.min(remainingChildren, extraChildSpace);
    if (toAllocate > 0) {
      inst.allocatedChildren += toAllocate;
      remainingChildren -= toAllocate;
    }
  }

  const success = (remainingAdults === 0 && remainingChildren === 0);
  return {
    success,
    allocations: roomInstances.map(inst => ({
      roomId: inst.roomId,
      roomName: inst.roomName,
      adults: inst.allocatedAdults,
      children: inst.allocatedChildren,
      extraAdults: Math.max(0, inst.allocatedAdults - inst.maxAdults),
      extraChildren: Math.max(0, inst.allocatedChildren - inst.maxChildren)
    }))
  };
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
  setSelectedRooms,
  onRoomsCountChange,
  selectedAddOns = [],
  addOnQuantities = {},
  onAddOnQuantityChange
}) => {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W, E, EL } } = useTheme();
  const [show, setShow] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [selectionMode, setSelectionMode] = useState("check-in");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingErrorPopup, setBookingErrorPopup] = useState({ visible: false, title: "", message: "", isSameDay: false });

  const handleRoomCountChangeWithReset = (roomId, count) => {
    onRoomsCountChange(roomId, count);
  };

  const handleAddAnotherRoom = () => {
    if (selectedRooms.length === 0) return;

    for (const selRoom of selectedRooms) {
      const roomId = selRoom.roomId;
      const currentCount = selRoom.count || 0;
      const catalogRoom = stayRoomsCatalog.find(
        r => String(r.roomId ?? r.id ?? r.roomTypeId ?? r.room_type_id) === String(roomId)
      );
      const maxLimit = catalogRoom
        ? Number(catalogRoom.units || catalogRoom.totalRooms || catalogRoom.availableRooms || 99)
        : 99;

      if (currentCount < maxLimit) {
        handleRoomCountChangeWithReset(roomId, currentCount + 1);
        setValidationError("Another room has been added to accommodate extra guests.");
        return;
      }
    }

    setValidationError("No additional rooms are available for the selected room type.");
  };

  // Automatically reopen the modal if state was hydrated after auth redirect
  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem("frontendPendingBookingState");
      if (storedRaw) {
        const stored = JSON.parse(storedRaw);
        const token = localStorage.getItem("jwtToken");
        const isLoggedIn = !!token && token !== "undefined" && token !== "null";

        if (stored?.listingId === String(stay?.stayId || stay?.id) && stored?.type === "stay" && isLoggedIn) {
          setShow(true);
          localStorage.removeItem("frontendPendingBookingState");
        }
      }
    } catch (e) {}
  }, [stay?.stayId, stay?.id]);

  useEffect(() => {
    if (show) {
      setSelectionMode((checkInDate && checkOutDate) ? "done" : "check-in");
      setValidationError("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
    const isBlocked = isBlockedDay(date);
    
    if (selectionMode === "check-in") {
      // 1. Check-in Selection / Editing
      if (isBlocked) return;
      
      const isSameAsCheckIn = checkInDate && date.isSame(checkInDate, "day");
      if (isSameAsCheckIn) {
        setCheckInDate(null);
        setCheckOutDate(null);
      } else {
        setCheckInDate(date);
        // Reset checkout if it becomes invalid
        if (checkOutDate && date.isSameOrAfter(checkOutDate, 'day')) {
          setCheckOutDate(null);
          setSelectionMode("check-out");
        } else if (checkOutDate) {
          // If checkout is still valid after changing check-in, finalize again
          setSelectionMode("done");
        } else {
          // STEP 2: Automatic switch to Check-out mode
          setSelectionMode("check-out");
        }
      }
    } else {
      // 2. Check-out Selection / Editing
      const isSameAsCheckIn = checkInDate && date.isSame(checkInDate, "day");
      const isSameAsCheckOut = checkOutDate && date.isSame(checkOutDate, "day");

      if (isSameAsCheckIn) {
        setCheckInDate(null);
        setCheckOutDate(null);
        setSelectionMode("check-in");
        return;
      }

      if (isSameAsCheckOut) {
        setCheckOutDate(null);
      } else {
        // Selection must be after Check-in
        if (checkInDate && date.isAfter(checkInDate, 'day')) {
          // Boundary check
          if (nextBlockedDate && date.isAfter(nextBlockedDate, 'day')) return;
          setCheckOutDate(date);
          setSelectionMode("done");
        } else {
          // If clicked date is before check-in, treat as new Check-in
          if (isBlocked) return;
          setCheckInDate(date);
          setCheckOutDate(null);
          setSelectionMode("check-out");
        }
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


  useEffect(() => {
    if (!stay || !setSelectedRooms) return;
    const isPropertyBased = stay?.bookingScope === "Property-Based";
    if (isPropertyBased) return;

    if (stayRoomsCatalog.length === 0) return;

    // Default to first room type if nothing selected
    if (selectedRooms.length === 0) {
      const firstRoom = stayRoomsCatalog[0];
      const firstRoomId = String(firstRoom.roomId ?? firstRoom.id ?? firstRoom.roomTypeId ?? firstRoom.room_type_id);
      setSelectedRooms([{ roomId: firstRoomId, mealPlan: "EP", count: 1 }]);
    }
  }, [selectedRooms, stay, stayRoomsCatalog, setSelectedRooms]);

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
    let totalExtraAdultsAllocated = 0;
    let totalExtraChildrenAllocated = 0;

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
        totalExtraAdultsLimit += Number(
          room.maxExtraAdults ??
          room.maxExtraAdultsAllowed ??
          room.maxExtraBeds ??
          0
        ) * room.count;
        totalExtraChildrenLimit += Number(
          room.maxExtraChildren ??
          room.maxExtraChildrenAllowed ??
          0
        ) * room.count;

        // Store per-room rates for extra guest calc below
        room._resolvedExtraAP = roomExtraAP;
        room._resolvedExtraCP = roomExtraCP;
      });

      // Use the exact distribution logic to count extra adults and children!
      const distribution = distributeGuests(selectedRooms, stayRoomsCatalog, guests.adults || 1, guests.children || 0);
      totalExtraAdultsAllocated = 0;
      totalExtraChildrenAllocated = 0;
      let extraAdultsChargePerNight = 0;
      let extraChildrenChargePerNight = 0;

      if (distribution.success) {
        distribution.allocations.forEach(alloc => {
          const room = resolvedSelectedRooms.find(r => String(r.roomId || r.id) === String(alloc.roomId));
          const extraAP = room?._resolvedExtraAP || 0;
          const extraCP = room?._resolvedExtraCP || 0;
          
          extraAdultsChargePerNight += alloc.extraAdults * extraAP;
          extraChildrenChargePerNight += alloc.extraChildren * extraCP;
          totalExtraAdultsAllocated += alloc.extraAdults;
          totalExtraChildrenAllocated += alloc.extraChildren;
        });
      } else {
        // Fallback if distribution fails or check capacity bounds
        const exA = Math.max(0, (guests?.adults || 1) - totalBaseAdultsLimit);
        const exC = Math.max(0, (guests?.children || 0) - totalBaseChildrenLimit);
        const avgExtraAP = resolvedSelectedRooms.length > 0
          ? resolvedSelectedRooms.reduce((acc, r) => acc + (r._resolvedExtraAP || 0), 0) / resolvedSelectedRooms.length
          : parseFloat(stay.extraAdultPrice || 0);
        const avgExtraCP = resolvedSelectedRooms.length > 0
          ? resolvedSelectedRooms.reduce((acc, r) => acc + (r._resolvedExtraCP || 0), 0) / resolvedSelectedRooms.length
          : parseFloat(stay.extraChildPrice || 0);

        extraAdultsChargePerNight = exA * avgExtraAP;
        extraChildrenChargePerNight = exC * avgExtraCP;
        totalExtraAdultsAllocated = exA;
        totalExtraChildrenAllocated = exC;
      }

      totalOriginalPerNight += extraAdultsChargePerNight + extraChildrenChargePerNight;

      // Weighted average for receipt display
      const avgExtraAP = resolvedSelectedRooms.length > 0
        ? resolvedSelectedRooms.reduce((acc, r) => acc + (r._resolvedExtraAP || 0), 0) / resolvedSelectedRooms.length
        : parseFloat(stay.extraAdultPrice || 0);
      const avgExtraCP = resolvedSelectedRooms.length > 0
        ? resolvedSelectedRooms.reduce((acc, r) => acc + (r._resolvedExtraCP || 0), 0) / resolvedSelectedRooms.length
        : parseFloat(stay.extraChildPrice || 0);

      finalExtraAP = totalExtraAdultsAllocated > 0 ? extraAdultsChargePerNight / totalExtraAdultsAllocated : avgExtraAP;
      finalExtraCP = totalExtraChildrenAllocated > 0 ? extraChildrenChargePerNight / totalExtraChildrenAllocated : avgExtraCP;
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
      const allowedAdults = totalBaseAdultsLimit + totalExtraAdultsLimit;
      const allowedChildren = totalBaseChildrenLimit + totalExtraChildrenLimit;

      if (currentAdults > allowedAdults) {
        isOver = true;
        warning = "Adult limit reached even with extra adults. Please add another room.";
      } else if (currentChildren > allowedChildren) {
        isOver = true;
        warning = "Children limit reached even with extra guests. Please add another room.";
      } else {
        if (!isPropertyBased && resolvedSelectedRooms.length > 0) {
          const distribution = distributeGuests(selectedRooms, stayRoomsCatalog, currentAdults, currentChildren);
          if (!distribution.success) {
            isOver = true;
            warning = "Selected room cannot accommodate all guests";
          }
        }
      }

      if (!isOver && (currentAdults > totalBaseAdultsLimit || currentChildren > totalBaseChildrenLimit)) {
        warning = "Base occupants reached. Additional guests will incur extra charges.";
      }
    }

    // Long-stay discount tiers
    let appliedDiscountPercent = 0;
    if (nightsCount > 0 && Array.isArray(stay.discountTiers)) {
      const tier = stay.discountTiers.find(t => nightsCount >= (t.minimumDays || 0) && nightsCount <= (t.maximumDays || 999));
      if (tier) appliedDiscountPercent = parseFloat(tier.discountPercentage || 0);
    }

    // Billing-config discounts (if provided by stay configuration)
    const billingConfigDiscountRate = (() => {
      const discounts = stay?.billingConfig?.discounts || stay?.billing_config?.discounts || [];
      if (!Array.isArray(discounts) || discounts.length === 0) return 0;
      const totalRate = discounts.reduce((sum, discount) => {
        const rate = Number(discount?.currentRate ?? discount?.current_rate ?? 0);
        return sum + (Number.isFinite(rate) ? rate : 0);
      }, 0);
      return Math.max(0, Math.min(100, totalRate));
    })();

    // Early Bird Discount Calculation
    let earlyBirdDiscountPercent = 0;
    let appliedEarlyBirdDiscountTier = null;
    const ebDiscounts = stay?.earlyBirdDiscounts || stay?.early_bird_discounts || [];
    if (checkInDate && Array.isArray(ebDiscounts)) {
      const today = moment().startOf('day');
      const checkInDay = moment(checkInDate).startOf('day');
      const daysDiff = checkInDay.diff(today, 'days');
      
      const eligibleTiers = ebDiscounts.filter(t => t.isActive && daysDiff >= t.daysInAdvance);
        
      if (eligibleTiers.length > 0) {
        eligibleTiers.sort((a, b) => parseFloat(b.percentage || 0) - parseFloat(a.percentage || 0));
        appliedEarlyBirdDiscountTier = eligibleTiers[0];
        earlyBirdDiscountPercent = parseFloat(appliedEarlyBirdDiscountTier.percentage || 0);
      }
    }

    const nights = Math.max(1, nightsCount);
    const grossSubtotal = totalOriginalPerNight * nights;
    const longStayDiscountAmount = grossSubtotal * (appliedDiscountPercent / 100);
    const billingConfigDiscountAmount = grossSubtotal * (billingConfigDiscountRate / 100);
    const earlyBirdDiscountAmount = grossSubtotal * (earlyBirdDiscountPercent / 100);

    let addonsTotal = 0;
    if (Array.isArray(stay?.addons) && Array.isArray(selectedAddOns) && selectedAddOns.length > 0) {
      selectedAddOns.forEach(addonId => {
        const addonObj = stay.addons.find(a => String(a.addonId || a.assignmentId || a.id) === String(addonId));
        if (addonObj) {
          const isIndividual = addonObj.pricingType === "Individual";
          const qty = isIndividual ? (addOnQuantities[addonId] || 1) : 1;
          addonsTotal += parseFloat(addonObj.price || 0) * qty;
        }
      });
    }

    const preTaxSubtotal = Math.max(0, grossSubtotal - longStayDiscountAmount - billingConfigDiscountAmount - earlyBirdDiscountAmount) + addonsTotal;
    const discountAmount = longStayDiscountAmount + billingConfigDiscountAmount + earlyBirdDiscountAmount;
    const discountedPerNight = Math.max(0, preTaxSubtotal - addonsTotal) / nights;

    // Taxes from stay config; fallback to legacy 18% GST + 2% service charge
    const configuredTaxRate = Array.isArray(stay?.taxes)
      ? stay.taxes.reduce((sum, t) => sum + Number(t?.currentRate ?? t?.appliedPercentage ?? t?.rate ?? 0), 0)
      : 0;
    const effectiveTaxRate = configuredTaxRate > 0 ? configuredTaxRate : 20;

    const totalTax = preTaxSubtotal * (effectiveTaxRate / 100);
    const gst = preTaxSubtotal * 0.18;
    const serviceFee = preTaxSubtotal * 0.02;
    const finalTotalWithTax = preTaxSubtotal + totalTax;

    const extraAdultsCount = isPropertyBased
      ? Math.max(0, (guests?.adults || 1) - totalBaseAdultsLimit)
      : totalExtraAdultsAllocated;
    const extraChildrenCount = isPropertyBased
      ? Math.max(0, (guests?.children || 0) - totalBaseChildrenLimit)
      : totalExtraChildrenAllocated;

    const normalAdultsCount = Math.max(0, (guests?.adults || 1) - extraAdultsCount);
    const normalChildrenCount = Math.max(0, (guests?.children || 0) - extraChildrenCount);

    return {
      perNight: discountedPerNight,
      originalPerNight: totalOriginalPerNight,
      subtotal: preTaxSubtotal,
      finalTotal: finalTotalWithTax,
      nightsCount,
      discount: discountAmount,
      discountPercent: appliedDiscountPercent,
      earlyBirdDiscountAmount,
      earlyBirdDiscountPercent,
      warning,
      isOver,
      gst: configuredTaxRate > 0 ? totalTax : gst,
      serviceFee: configuredTaxRate > 0 ? 0 : serviceFee,
      taxRate: effectiveTaxRate,
      baseAdultsLimit: totalBaseAdultsLimit,
      extraAdultsLimit: totalExtraAdultsLimit,
      baseChildrenLimit: totalBaseChildrenLimit,
      extraChildrenLimit: totalExtraChildrenLimit,
      activeExtraAdultPrice: finalExtraAP,
      activeExtraChildPrice: finalExtraCP,
      extraAdultsCount,
      extraChildrenCount,
      normalAdultsCount,
      normalChildrenCount,
      addonsTotal
    };
  }, [stay, resolvedSelectedRooms, checkInDate, guests, nightsCount, selectedRooms, stayRoomsCatalog, selectedAddOns, addOnQuantities]);

  const capacityFeedback = useMemo(() => {
    const isPropertyBased = stay?.bookingScope === "Property-Based";
    
    let totalBaseAdultsLimit = 0;
    let totalBaseChildrenLimit = 0;
    let totalExtraAdultsLimit = 0;
    let totalExtraChildrenLimit = 0;

    if (isPropertyBased) {
      totalBaseAdultsLimit = stay.maxAdults || stay.maxGuests || 1;
      totalBaseChildrenLimit = stay.maxChildren || 0;
      totalExtraAdultsLimit = stay.maxExtraAdults || stay.maxExtraAdultsAllowed || stay.maxExtraBeds || 0;
      totalExtraChildrenLimit = stay.maxExtraChildren || stay.maxExtraChildrenAllowed || 0;
    } else {
      resolvedSelectedRooms.forEach(room => {
        totalBaseAdultsLimit += (room.maxAdults || 1) * room.count;
        totalBaseChildrenLimit += (room.maxChildren || 0) * room.count;
        totalExtraAdultsLimit += Number(
          room.maxExtraAdults ??
          room.maxExtraAdultsAllowed ??
          room.maxExtraBeds ??
          0
        ) * room.count;
        totalExtraChildrenLimit += Number(
          room.maxExtraChildren ??
          room.maxExtraChildrenAllowed ??
          0
        ) * room.count;
      });
    }

    const allowedAdults = totalBaseAdultsLimit + totalExtraAdultsLimit;
    const allowedChildren = totalBaseChildrenLimit + totalExtraChildrenLimit;

    if (guests.adults > allowedAdults) {
      return {
        text: "Adult limit reached even with extra adults. Add another room.",
        type: "error",
        exceeded: true
      };
    }

    if (guests.children > allowedChildren) {
      return {
        text: "Children limit reached even with extra guests. Add another room.",
        type: "error",
        exceeded: true
      };
    }

    if (!isPropertyBased) {
      const distribution = distributeGuests(selectedRooms, stayRoomsCatalog, guests.adults, guests.children);
      if (!distribution.success) {
        return {
          text: "Selected room cannot accommodate all guests",
          type: "warning",
          exceeded: true
        };
      }
    }

    const extraAdultsCount = pricing?.extraAdultsCount || 0;
    const extraChildrenCount = pricing?.extraChildrenCount || 0;
    const extraAdultsCharge = extraAdultsCount * (pricing?.activeExtraAdultPrice || 0);
    const extraChildrenCharge = extraChildrenCount * (pricing?.activeExtraChildPrice || 0);

    if (extraAdultsCount > 0 && extraChildrenCount > 0) {
      return {
        text: "Extra adult price added & Extra child price added",
        type: "success"
      };
    } else if (extraAdultsCount > 0) {
      return {
        text: "Extra adult price added",
        type: "success"
      };
    } else if (extraChildrenCount > 0) {
      return {
        text: "Extra child price added",
        type: "success"
      };
    }

    return null;
  }, [guests, selectedRooms, stay, stayRoomsCatalog, resolvedSelectedRooms, pricing]);

  const blockedDateKeys = useMemo(() => {
    const isPropertyBased = stay?.bookingScope === "Property-Based" || stay?.bookingScope === "Property Based";
    const keys = new Set();
    const normalizeId = (value) => {
      if (value === null || value === undefined) return "";
      const raw = String(value).trim();
      if (!raw) return "";
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? String(numeric) : raw.toLowerCase();
    };
    const addBlockedEntry = (entry) => {
      if (!entry) return;

      if (typeof entry === "string" || entry instanceof Date) {
        const singleDate = moment(entry).startOf("day");
        if (singleDate.isValid()) {
          keys.add(singleDate.format("YYYY-MM-DD"));
        }
        return;
      }

      const start = moment(
        entry?.checkInDate ||
        entry?.check_in_date ||
        entry?.startDate ||
        entry?.start_date ||
        entry?.date
      ).startOf("day");
      const end = moment(
        entry?.checkOutDate ||
        entry?.check_out_date ||
        entry?.endDate ||
        entry?.end_date
      ).startOf("day");

      if (start.isValid() && end.isValid()) {
        const cursor = start.clone();
        while (cursor.isBefore(end, "day")) {
          keys.add(cursor.format("YYYY-MM-DD"));
          cursor.add(1, "day");
        }
        return;
      }

      if (start.isValid()) {
        keys.add(start.format("YYYY-MM-DD"));
      }
    };

    if (isPropertyBased) {
      const propertyRanges = stay?.bookedDateRanges || stay?.stay?.bookedDateRanges || [];
      if (!Array.isArray(propertyRanges) || propertyRanges.length === 0) return new Set();
      propertyRanges.forEach(addBlockedEntry);
      return keys;
    }

    const selectedRoomIds = new Set(
      (selectedRooms || [])
        .map((room) => normalizeId(room?.roomId ?? room?.room_id ?? room?.id))
        .filter(Boolean)
    );

    if (selectedRoomIds.size === 0) return new Set();

    stayRoomsCatalog.forEach((room) => {
      const roomId = normalizeId(room?.roomId ?? room?.room_id ?? room?.id);
      if (!roomId || !selectedRoomIds.has(roomId)) return;

      const roomRanges = room?.roomBookedDateRanges || [];
      if (!Array.isArray(roomRanges) || roomRanges.length === 0) return;
      roomRanges.forEach(addBlockedEntry);
    });

    return keys;
  }, [stay, selectedRooms, stayRoomsCatalog]);

  const nextBlockedDate = useMemo(() => {
    if (!checkInDate || !blockedDateKeys || blockedDateKeys.size === 0) return null;
    const checkInKey = checkInDate.format("YYYY-MM-DD");
    const nextDateKey = Array.from(blockedDateKeys)
      .filter(k => k > checkInKey)
      .sort()[0];
    return nextDateKey ? moment(nextDateKey) : null;
  }, [checkInDate, blockedDateKeys]);

  useEffect(() => {
    if (checkInDate && checkOutDate && nextBlockedDate) {
      if (checkOutDate.isAfter(nextBlockedDate, 'day')) {
        setCheckOutDate(null);
      }
    }
  }, [checkInDate, nextBlockedDate, checkOutDate, setCheckOutDate]);

  const isBlockedDay = (day) => blockedDateKeys.has(moment(day).format("YYYY-MM-DD"));

  const handleReserve = async () => {
    if (loading) return;
    if (pricing.isOver) {
      handleAddAnotherRoom();
      return;
    }

    const token = localStorage.getItem("jwtToken");
    const isLoggedIn = !!token && token !== "undefined" && token !== "null";
    if (!isLoggedIn) {
      const listingIdToSave = stay?.stayId || stay?.id;
      if (listingIdToSave) {
        const stateToStore = {
          listingId: String(listingIdToSave),
          type: "stay",
          checkInDate: checkInDate ? checkInDate.format("YYYY-MM-DD") : null,
          checkOutDate: checkOutDate ? checkOutDate.format("YYYY-MM-DD") : null,
          guests,
          selectedRooms,
        };
        try {
          localStorage.setItem("frontendPendingBookingState", JSON.stringify(stateToStore));
        } catch (e) {}
      }

      setShowLoginPrompt(true);
      return;
    }

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
    setBookingErrorPopup({ visible: false, title: "", message: "" });
    try {
      const isPropertyBased = stay?.bookingScope === "Property-Based";
      const extraAdultsCount = Math.max(0, (guests.adults || 1) - pricing.baseAdultsLimit);
      const extraChildrenCount = Math.max(0, (guests.children || 0) - pricing.baseChildrenLimit);

      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName = userInfo.name || (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") || userInfo.customerName || "Guest User";
      const customerEmail = userInfo.email || userInfo.customerEmail || "guest@example.com";
      const customerPhone = userInfo.customerPhone || (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") || userInfo.phoneNumber || "";
      const backendAddOns = Array.isArray(selectedAddOns)
        ? selectedAddOns.map((selectedAddOnId) => {
            const addonData = Array.isArray(stay?.addons)
              ? stay.addons.find((addon) => String(addon.addonId || addon.assignmentId || addon.id) === String(selectedAddOnId))
              : null;
            if (!addonData) return null;

            return {
              addonId: Number(addonData.addonId || addonData.assignmentId || addonData.id),
              quantity: Number(addOnQuantities?.[selectedAddOnId] || 1),
            };
          }).filter(Boolean)
        : [];

      const payloadBase = {
        stayId: Number(stay.stayId || stay.id),
        checkInDate: checkInDate.format("YYYY-MM-DD"),
        checkOutDate: checkOutDate.format("YYYY-MM-DD"),
        numberOfGuests: (guests.adults || 1) + (guests.children || 0),
        adults: guests.adults || 1,
        children: guests.children || 0,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests: "",
        paymentMethod: "razorpay",
        addons: backendAddOns,
      };

      const payload = isPropertyBased
        ? {
            ...payloadBase,
            extraAdults: extraAdultsCount,
            extraChildren: extraChildrenCount,
          }
        : {
            ...payloadBase,
            rooms: (() => {
              const distribution = distributeGuests(selectedRooms, stayRoomsCatalog, guests.adults || 1, guests.children || 0);
              const grouped = {};
              if (distribution.success) {
                distribution.allocations.forEach(alloc => {
                  if (!grouped[alloc.roomId]) {
                    grouped[alloc.roomId] = {
                      roomId: alloc.roomId,
                      roomsBooked: 0,
                      adults: 0,
                      children: 0,
                      extraAdults: 0,
                      extraChildren: 0
                    };
                  }
                  const g = grouped[alloc.roomId];
                  g.roomsBooked += 1;
                  g.adults += alloc.adults;
                  g.children += alloc.children;
                  g.extraAdults += alloc.extraAdults;
                  g.extraChildren += alloc.extraChildren;
                });
              }
              
              return resolvedSelectedRooms.map(r => {
                const grp = grouped[r.roomId || r.id] || {
                  roomsBooked: r.count,
                  adults: r.count * (r.maxAdults || 1),
                  children: 0,
                  extraAdults: 0,
                  extraChildren: 0
                };
                return {
                  roomId: r.roomId || r.id,
                  roomsBooked: r.count,
                  adults: grp.adults,
                  children: grp.children,
                  mealPlanCode: r.mealPlan || "EP",
                  extraBeds: Number(r.extraBeds || 0),
                  extraAdults: grp.extraAdults,
                  extraChildren: grp.extraChildren,
                };
              });
            })()
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
      const selectedAddOnsData = selectedAddOns.map(id => {
        const addonData = Array.isArray(stay?.addons) ? stay.addons.find(a => (a.addonId || a.assignmentId || a.id) === id) : null;
        if (!addonData) return null;
        
        const isIndividual = addonData.pricingType === "Individual";
        const quantity = isIndividual ? (addOnQuantities[id] || 1) : 1;
        const unitPrice = parseFloat(addonData.price || 0);
        const priceValue = unitPrice * quantity;
        
        return {
          id: addonData.addonId || addonData.assignmentId || addonData.id,
          title: addonData.title || addonData.name || "Addon",
          name: addonData.title || addonData.name || "Addon",
          price: unitPrice,
          pricePerUnit: unitPrice,
          priceValue: priceValue,
          totalPrice: priceValue,
          currency: addonData.currency || "INR",
          quantity: quantity,
          pricingType: addonData.pricingType || "Individual",
        };
      }).filter(Boolean);

      const addOnsTotalRupees = selectedAddOnsData.reduce((sum, item) => sum + item.priceValue, 0);

      let amountInPaise = firstNumber(
        paymentResponse?.amount,
        orderResponse?.amount,
        response?.amount,
        backendTotalRupees != null ? Math.round(backendTotalRupees * 100) : null,
        Math.round(pricing.finalTotal * 100)
      );

      if (addOnsTotalRupees > 0) {
        amountInPaise = Math.max(
          amountInPaise,
          Math.round(pricing.finalTotal * 100)
        );
      }

      const appOrderId = orderResponse?.orderId || response?.orderId || response?.data?.orderId || null;
      if (appOrderId) {
        localStorage.setItem("pendingOrderId", String(appOrderId));
      }

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
      const nightlyFromOrder = isPropertyBased
        ? (firstNumber(orderResponse?.pricePerNight, pricing.originalPerNight) || 0)
        : (firstNumber(pricing.originalPerNight, orderResponse?.pricePerNight) || 0);
      const totalFromOrder = firstNumber(orderResponse?.totalPrice, orderResponse?.finalPrice, backendTotalRupees, pricing.finalTotal) || 0;
      const nightlyExtraAdults = Number(extraAdultsCount || 0) * Number(pricing.activeExtraAdultPrice || 0);
      const nightlyExtraChildren = Number(extraChildrenCount || 0) * Number(pricing.activeExtraChildPrice || 0);
      const nightlyExtras = nightlyExtraAdults + nightlyExtraChildren;
      const nightlyBaseOnly = Math.max(0, Number(nightlyFromOrder || 0) - nightlyExtras);
      const fallbackBaseStayTotal = Math.max(0, Number(nightlyBaseOnly || 0) * Number(nightsFromOrder || 1));
      const baseStayDisplayTotal = isPropertyBased
        ? (firstNumber(basePrice, fallbackBaseStayTotal) || 0)
        : fallbackBaseStayTotal;

      const frontendReceipt = [
        { title: `Base Stay (${nightsFromOrder} night${nightsFromOrder !== 1 ? "s" : ""})`, content: `${currency} ${Number(baseStayDisplayTotal).toFixed(2)}` },
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

      // Display calculation should use gross stay total = base + extra adults + extra children
      const extraAdultDisplayTotal = Number(extraAdultsCount || 0) * Number(pricing.activeExtraAdultPrice || 0) * Number(nightsFromOrder || 1);
      const extraChildDisplayTotal = Number(extraChildrenCount || 0) * Number(pricing.activeExtraChildPrice || 0) * Number(nightsFromOrder || 1);
      const grossBeforeDiscount = baseStayDisplayTotal + extraAdultDisplayTotal + extraChildDisplayTotal;

      const discountRateForDisplay = Math.max(
        0,
        Number(
          firstNumber(
            pricing.discountPercent,
            stay?.discountTiers?.find(t => nightsFromOrder >= (t.minimumDays || 0) && nightsFromOrder <= (t.maximumDays || 999))?.discountPercentage,
            0
          ) || 0
        )
      );

      const fallbackDiscountFromRate = grossBeforeDiscount * (discountRateForDisplay / 100);
      const inferredDiscountFromTotals = Math.max(
        0,
        grossBeforeDiscount + (grossBeforeDiscount * (taxRate / 100)) - Number(totalFromOrder || 0)
      );
      const discountToShow = Math.max(
        0,
        Number(
          firstNumber(
            fallbackDiscountFromRate,
            discount,
            pricing.discount,
            inferredDiscountFromTotals
          ) || 0
        )
      );

      const subtotalBeforeTax = Math.max(0, grossBeforeDiscount + addOnsTotalRupees - discountToShow);
      const combinedFrontendTax = Math.max(0, subtotalBeforeTax * (taxRate / 100));
      const frontendFinalGuestPrice = subtotalBeforeTax + combinedFrontendTax;

      if (discountToShow > 0) {
        if (pricing.earlyBirdDiscountAmount > 0) {
          frontendReceipt.push({ title: `Early Bird Discount (${pricing.earlyBirdDiscountPercent}%)`, content: `- ${currency} ${Number(pricing.earlyBirdDiscountAmount).toFixed(2)}` });
          const remainingDiscount = discountToShow - pricing.earlyBirdDiscountAmount;
          if (remainingDiscount > 0.01) {
            frontendReceipt.push({ title: "Total Discount", content: `- ${currency} ${Number(remainingDiscount).toFixed(2)}` });
          }
        } else {
          frontendReceipt.push({ title: "Total Discount", content: `- ${currency} ${Number(discountToShow).toFixed(2)}` });
        }
      }
      if (combinedFrontendTax > 0) {
        frontendReceipt.push({ title: `Tax (${Number(taxRate).toFixed(2)}%)`, content: `+ ${currency} ${Number(combinedFrontendTax).toFixed(2)}` });
      }
      if (addOnsTotalRupees > 0) {
        frontendReceipt.push({ title: "Add-ons Total", content: `+ ${currency} ${Number(addOnsTotalRupees).toFixed(2)}` });
      }
      frontendReceipt.push({ title: "Final Guest Price", content: `${currency} ${Number(frontendFinalGuestPrice).toFixed(2)}` });

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
        totalAmount: frontendFinalGuestPrice,
        selectedAddOns: selectedAddOnsData,
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      localStorage.removeItem("frontendPendingBookingState");

      history.push("/checkout");
    } catch (err) {
      console.error(err);
      const backendPayload = err?.response?.data || {};

      if (
        err?.response?.status === 401 ||
        backendPayload?.message === "Invalid or expired token" ||
        backendPayload?.error === "Invalid or expired token"
      ) {
        const listingIdToSave = stay?.stayId || stay?.id;
        if (listingIdToSave) {
          const stateToStore = {
            listingId: String(listingIdToSave),
            type: "stay",
            checkInDate: checkInDate ? checkInDate.format("YYYY-MM-DD") : null,
            checkOutDate: checkOutDate ? checkOutDate.format("YYYY-MM-DD") : null,
            guests,
            selectedRooms,
          };
          try {
            localStorage.setItem("frontendPendingBookingState", JSON.stringify(stateToStore));
          } catch (e) {}
        }

        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userInfo");
        setShowLoginPrompt(true);
        return;
      }

      const title =
        backendPayload?.error ||
        backendPayload?.message ||
        "Booking failed";
      const detailMessage =
        backendPayload?.details ||
        (Array.isArray(backendPayload?.unavailableRooms) && backendPayload.unavailableRooms.length > 0
          ? backendPayload.unavailableRooms.join(", ")
          : null) ||
        "Please try different dates or room selections.";

      let finalTitle = String(title);
      let finalMessage = String(detailMessage);
      let isSameDay = false;

      if (
        finalTitle.toLowerCase().includes("same-day") ||
        finalMessage.toLowerCase().includes("same-day")
      ) {
        finalTitle = "We’re Sorry — Today’s Check-In Window Has Closed";
        finalMessage = "The check-in window for today has already closed. Please try selecting a future date for your stay.";
        isSameDay = true;
      }

      setBookingErrorPopup({
        visible: true,
        title: finalTitle,
        message: finalMessage,
        isSameDay,
      });
    } finally {
      setLoading(false);
    }
  };

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
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .stay-booking-trigger {
            bottom: 30px !important;
            right: 30px !important;
            padding: 16px 36px !important;
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Floating Trigger */}
      <motion.button
        onClick={() => setShow(true)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: isFooterVisible ? 150 : 0, opacity: isFooterVisible ? 0 : 1 }}
        whileHover={{
          scale: 1.04,
          background: AH || A,
          boxShadow: `0 20px 35px -8px rgba(0,0,0,0.15), 0 30px 60px -10px ${A}55, 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.35)`
        }}
        whileTap={{ scale: 0.96 }}
        className="stay-booking-trigger"
        style={{
          position: "fixed",
          bottom: 40,
          right: 40,
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
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: 800,
          fontSize: 17,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          transition: "background-color 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)"
        }}
      >
        <Bed size={22} />
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
              className="booking-modal-container"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: BG,
                borderRadius: 32,
                overflow: "hidden",
                width: "95%",
                maxWidth: 950,
                maxHeight: "calc(100vh - 40px)",
                border: `1px solid ${B}`,
                boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 100px ${A}11`,
                position: "relative",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Header */}
              <div className="booking-modal-header" style={{ padding: "16px 28px", borderBottom: `1px solid ${B}88`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: A, marginBottom: 2, lineHeight: "1.2" }}>
                    Reserve Your Stay
                  </h2>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    {!fetchingAvailability && pricing.discount > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: M, textDecoration: "line-through", opacity: 0.7 }}>
                        {"\u20B9"}{formatPrice(pricing.originalPerNight)}
                      </span>
                    )}
                    <span style={{ fontSize: 22, fontWeight: 800, color: FG }}>
                      {fetchingAvailability ? "..." : `${"\u20B9"}${formatPrice(pricing.perNight)}`}
                    </span>
                    <span style={{ fontSize: 11, color: M, fontWeight: 500 }}>/ night</span>
                  </div>
                </div>
                <button onClick={() => setShow(false)} style={{ background: S, border: `1px solid ${B}`, padding: 8, borderRadius: 100, cursor: "pointer", color: FG }}>
                  <X size={18} />
                </button>
              </div>

              {/* Addons Scrollable Banner */}
              {Array.isArray(stay?.addons) && stay.addons.length > 0 && (
                <div style={{ background: BG, borderBottom: `1px solid ${B}88`, padding: "12px 28px" }}>
                  <style>{`
                    .stay-modal-addon-item {
                      flex: 0 0 auto;
                      width: 260px;
                      border-radius: 16px;
                      padding: 10px;
                      display: flex;
                      gap: 12px;
                      align-items: center;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .stay-modal-addon-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .stay-modal-action-btn {
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border: none;
                      cursor: pointer;
                      transition: 0.2s;
                    }
                    .stay-addon-scroll-btn {
                      position: absolute;
                      top: 50%;
                      transform: translateY(-50%);
                      width: 36px;
                      height: 36px;
                      border-radius: 50%;
                      background: ${BG};
                      border: 1px solid ${B};
                      color: ${FG};
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      cursor: pointer;
                      z-index: 10;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                      transition: all 0.2s;
                    }
                    .stay-addon-scroll-btn:hover {
                      background: ${S};
                      transform: translateY(-50%) scale(1.05);
                    }
                  `}</style>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <button
                      className="stay-addon-scroll-btn"
                      onClick={() => {
                        const container = document.getElementById("stay-header-addons-scroll");
                        if (container) container.scrollBy({ left: -260, behavior: 'smooth' });
                      }}
                      style={{ left: -18 }}
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div id="stay-header-addons-scroll" style={{
                      display: "flex",
                      overflowX: "auto",
                      gap: 16,
                      padding: "4px",
                      margin: "0 4px",
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      width: "100%",
                      maskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
                      WebkitMaskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)"
                    }}>
                      {stay.addons.map((item, i) => {
                        const addon = item.addon || item;
                        const addonId = addon.addonId || addon.id;
                        const pricingType = addon.pricingType || (addon.priceType === "per_booking" ? "Group" : "Individual");
                        const isSelected = selectedAddOns.some(a => String(a.addonId || a.id || a) === String(addonId));
                        const quantity = addOnQuantities[addonId] || 1;
                        const addonImage = addon.imageUrl || (addon.imageUrls && addon.imageUrls[0]) || addon.image;

                        const handleCardClick = () => {
                          if (!onAddOnQuantityChange) return;
                          if (!isSelected) {
                            onAddOnQuantityChange(addonId, 1, addon);
                          } else if (pricingType === "Group") {
                            onAddOnQuantityChange(addonId, 0, addon);
                          }
                        };

                        const priceLabel = addon.price > 0 ? `₹${addon.price}` : "Free";
                        const typeLabel = pricingType === "Group" ? "Group" : "Per Item";

                        return (
                          <div
                            key={i}
                            onClick={handleCardClick}
                            className="stay-modal-addon-item"
                            style={{
                              background: isSelected ? AL : S,
                              border: `1.5px solid ${isSelected ? A : B}`,
                            }}
                          >
                            {addonImage && (
                              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: `1px solid ${B}88` }}>
                                <img src={addonImage} alt={addon.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: isSelected ? A : FG, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                                    onClick={() => onAddOnQuantityChange && onAddOnQuantityChange(addonId, 0, addon)}
                                    className="stay-modal-action-btn"
                                    style={{ background: A, color: "#fff" }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                  </button>
                                ) : (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: BG, padding: "4px", borderRadius: 100, border: `1px solid ${B}` }}>
                                    <button
                                      onClick={() => onAddOnQuantityChange && onAddOnQuantityChange(addonId, quantity - 1, addon)}
                                      className="stay-modal-action-btn"
                                      style={{ width: 24, height: 24, background: S, color: FG }}
                                    >
                                      -
                                    </button>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: FG, minWidth: 16, textAlign: "center" }}>{quantity}</span>
                                    <button
                                      onClick={() => onAddOnQuantityChange && onAddOnQuantityChange(addonId, quantity + 1, addon)}
                                      className="stay-modal-action-btn"
                                      style={{ width: 24, height: 24, background: S, color: FG }}
                                    >
                                      +
                                    </button>
                                  </div>
                                )
                              ) : (
                                <button
                                  onClick={handleCardClick}
                                  className="stay-modal-action-btn"
                                  style={{ background: BG, border: `1px solid ${B}`, color: A }}
                                >
                                  +
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      className="stay-addon-scroll-btn"
                      onClick={() => {
                        const container = document.getElementById("stay-header-addons-scroll");
                        if (container) container.scrollBy({ left: 260, behavior: 'smooth' });
                      }}
                      style={{ right: -18 }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div className="booking-modal-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
                <div className="booking-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: 1, background: B }}>
                  {/* Left Column: Calendar */}
                  <div className="booking-modal-column" style={{ padding: "20px 28px", background: BG, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, lineHeight: "1.2" }}>
                          01. Select Dates
                          <span style={{ fontSize: 10, fontWeight: 700, background: AL, color: A, padding: "2px 8px", borderRadius: 100, border: `1px solid ${A}22` }}>
                            {selectionMode === "check-in" ? "Select Check-in" : selectionMode === "check-out" ? "Select Check-out" : "Dates Selected"}
                          </span>
                        </div>
                      </div>

                      {selectionMode === "check-out" && nextBlockedDate && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ 
                            marginBottom: 10, 
                            padding: "6px 12px", 
                            background: AL, 
                            borderRadius: 12, 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8,
                            border: `1px solid ${A}22`
                          }}
                        >
                          <Info size={12} color={A} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: FG }}>
                            Checkout must be before {nextBlockedDate.format("DD MMM, YYYY")}
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

                  {/* Right Column: Booking Details & Guests */}
                  <div className="booking-modal-column" style={{ padding: "20px 28px", background: S, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Section 02: Booking Details */}
                    <div>
                      <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em", lineHeight: "1.2" }}>
                        02. Booking Details
                      </div>
                      
                      {/* Check-in / Check-out Cards */}
                      <div style={{ marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div 
                          onClick={() => setSelectionMode("check-in")}
                          style={{ 
                            padding: "10px 14px", 
                            background: BG, 
                            borderRadius: 16, 
                            border: `1px solid ${selectionMode === 'check-in' ? A : B}`,
                            cursor: "pointer",
                            transition: "0.2s",
                            boxShadow: selectionMode === 'check-in' ? `0 0 15px ${A}22` : "none"
                          }}
                        >
                          <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Check-in</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: checkInDate ? FG : M }}>{checkInDate ? checkInDate.format("DD MMM, YYYY") : "Select date"}</p>
                        </div>
                        <div 
                          onClick={() => {
                            if (checkInDate) setSelectionMode("check-out");
                          }}
                          style={{ 
                            padding: "10px 14px", 
                            background: BG, 
                            borderRadius: 16, 
                            border: `1px solid ${selectionMode === 'check-out' ? A : B}`,
                            cursor: checkInDate ? "pointer" : "not-allowed",
                            transition: "0.2s",
                            opacity: checkInDate ? 1 : 0.6,
                            boxShadow: selectionMode === 'check-out' ? `0 0 15px ${A}22` : "none"
                          }}
                        >
                          <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Check-out</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: checkOutDate ? FG : M }}>{checkOutDate ? checkOutDate.format("DD MMM, YYYY") : "Select date"}</p>
                        </div>
                      </div>

                      {/* Clear Dates Button */}
                      {(checkInDate || checkOutDate) && (
                        <div>
                          <button 
                            type="button"
                            onClick={() => {
                              setCheckInDate(null);
                              setCheckOutDate(null);
                              setSelectionMode("check-in");
                              setValidationError("");
                            }}
                            style={{ 
                              width: "100%",
                              background: AL, 
                              border: `1px solid ${A}33`, 
                              color: A, 
                              fontSize: 10, 
                              fontWeight: 800, 
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              cursor: "pointer", 
                              padding: "6px 12px", 
                              borderRadius: 100,
                              transition: "0.3s"
                            }}
                          >
                            Clear Dates
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section 03: Guests & Accommodations */}
                    <div>
                      <div style={{ fontSize: 11, color: A, fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.1em", lineHeight: "1.2" }}>
                        03. Guests & Accommodations
                      </div>
                      
                      {(() => {
                        const allowedAdults = (pricing.baseAdultsLimit || 0) + (pricing.extraAdultsLimit || 0);
                        const allowedChildren = (pricing.baseChildrenLimit || 0) + (pricing.extraChildrenLimit || 0);

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: FG }}>Adults</p>
                                  <p style={{ fontSize: 10, color: M, fontWeight: 500, margin: 0 }}>{guestAgeLabels.adults}</p>
                                </div>
                                <Counter 
                                  value={guests.adults} 
                                  setValue={(v) => setGuests(prev => ({...prev, adults: v}))} 
                                  min={1} 
                                  max={allowedAdults}
                                />
                              </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", background: BG, border: `1px solid ${B}`, borderRadius: 16 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: FG }}>Children</p>
                                  <p style={{ fontSize: 10, color: M, fontWeight: 500, margin: 0 }}>{guestAgeLabels.children}</p>
                                </div>
                                <Counter 
                                  value={guests.children} 
                                  setValue={(v) => setGuests(prev => ({...prev, children: v}))} 
                                  min={0} 
                                  max={allowedChildren}
                                />
                              </div>
                            </div>

                            {pricing.earlyBirdDiscountPercent > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: AL, border: `1px solid ${A}33`, borderRadius: 100, width: "fit-content", marginTop: 4 }}>
                                <Sparkles size={14} color={A} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: A }}>EARLY BIRD DISCOUNT APPLIED</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {capacityFeedback && (
                        <div style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          borderRadius: 12,
                          background: capacityFeedback.type === "success" 
                            ? `${A}0c` 
                            : capacityFeedback.type === "warning" || capacityFeedback.type === "error"
                              ? `${E}0c`
                              : `${M}0c`,
                          border: `1px solid ${
                            capacityFeedback.type === "success" 
                              ? `${A}22` 
                              : capacityFeedback.type === "warning" || capacityFeedback.type === "error"
                                ? `${E}22`
                                : `${B}`
                          }`,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          {capacityFeedback.type === "success" ? (
                            <Sparkles size={12} color={A} />
                          ) : capacityFeedback.type === "warning" || capacityFeedback.type === "error" ? (
                            <AlertCircle size={12} color={E} />
                          ) : (
                            <Info size={12} color={M} />
                          )}
                          <span style={{
                            fontSize: 11,
                            fontWeight: 650,
                            color: capacityFeedback.type === "success" 
                              ? FG 
                              : capacityFeedback.type === "warning" || capacityFeedback.type === "error"
                                ? E
                                : M
                          }}>
                            {capacityFeedback.text}
                          </span>
                        </div>
                      )}

                      {capacityFeedback && capacityFeedback.exceeded && (
                        <motion.button
                          whileHover={{ scale: 1.02, background: AL }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddAnotherRoom}
                          style={{
                            marginTop: 8,
                            width: "100%",
                            padding: "10px 16px",
                            borderRadius: 14,
                            border: `1px solid ${A}44`,
                            background: "transparent",
                            color: A,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            transition: "background-color 0.2s ease"
                          }}
                        >
                          <Plus size={14} />
                          Add Another Room
                        </motion.button>
                      )}



                      {/* Selected Rooms */}
                      {resolvedSelectedRooms.length > 0 && (
                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                          {resolvedSelectedRooms.map((room) => (
                            <div key={room.roomId || room.id} style={{ padding: "10px 14px", background: BG, borderRadius: 16, border: `1px solid ${B}` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                  <div style={{ width: 26, height: 26, borderRadius: 8, background: AL, display: "flex", alignItems: "center", justifyContent: "center", color: A }}>
                                    <Bed size={13} />
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: FG }}>{room.roomName || room.name}</p>
                                    <p style={{ fontSize: 10, fontWeight: 500, color: M }}>{room.mealPlan || "EP"}</p>
                                  </div>
                                </div>
                                <Counter 
                                  value={room.count} 
                                  setValue={(v) => handleRoomCountChangeWithReset(room.roomId || room.id, v)} 
                                  min={1} 
                                  max={Number(room.units || room.totalRooms || room.availableRooms || 99)} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stay Allocation Summary */}
                    {(() => {
                      const isPropertyBased = stay?.bookingScope === "Property-Based";
                      if (isPropertyBased) return null;

                      const totalGuestsCount = (guests.adults || 0) + (guests.children || 0);
                      const totalRoomsCount = resolvedSelectedRooms.reduce((sum, r) => sum + (r.count || 0), 0);
                      if (totalRoomsCount === 0) return null;

                      // Chip style helpers
                      const chipStyle = {
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 8px",
                        borderRadius: 100,
                        background: `${A}12`,
                        border: `1px solid ${A}28`,
                        color: A,
                        fontSize: 10,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      };

                      // Build compact capacity chips: "[EP • 3 Guests]" per room
                      const capacityChips = resolvedSelectedRooms.map((r) => {
                        const cap = r.maxGuests || (r.maxAdults ? r.maxAdults + (r.maxChildren || 0) : 2);
                        const plan = r.mealPlan || "EP";
                        return `${plan} • ${cap} Guests`;
                      });

                      // Build compact room-type chips: "[1x RoomName]"
                      const roomTypeChips = resolvedSelectedRooms.map((r) => {
                        const label = r.roomName || r.name || "Room";
                        return `${r.count}x ${label}`;
                      });

                      // Full room name(s) for tooltip
                      const fullRoomNamesTitle = resolvedSelectedRooms
                        .map((r) => `${r.count}x ${r.roomName || r.name || "Room"}`)
                        .join(", ");

                      return (
                        <div style={{
                          padding: "14px",
                          borderRadius: "18px",
                          background: `linear-gradient(135deg, ${AL}12, ${AL}22)`,
                          border: `1px solid ${A}22`,
                          marginTop: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          minWidth: 0,
                          overflow: "hidden",
                        }}>
                          {/* Title */}
                          <div style={{ fontSize: 11, fontWeight: 800, color: A, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: "1.2" }}>
                            Stay Allocation Summary
                          </div>

                          {/* 2-column info grid — minWidth:0 prevents overflow */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>

                            {/* Guests */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                              <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Guests</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>
                                {totalGuestsCount} {totalGuestsCount === 1 ? "Guest" : "Guests"}
                              </span>
                            </div>

                            {/* Rooms Required */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                              <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Rooms Required</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>
                                {totalRoomsCount} {totalRoomsCount === 1 ? "Room" : "Rooms"}
                              </span>
                            </div>

                            {/* Room Capacity — compact chips */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                              <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Room Capacity</span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, minWidth: 0 }}>
                                {capacityChips.map((chip, i) => (
                                  <span key={i} style={chipStyle}>{chip}</span>
                                ))}
                              </div>
                            </div>

                            {/* Room Type — compact chips with truncation */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                              <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Room Type</span>
                              <div
                                style={{ display: "flex", flexWrap: "wrap", gap: 4, minWidth: 0 }}
                                title={fullRoomNamesTitle}
                              >
                                {roomTypeChips.map((chip, i) => (
                                  <span key={i} style={{ ...chipStyle, maxWidth: "100%" }}>{chip}</span>
                                ))}
                              </div>
                            </div>

                          </div>

                          {/* Occupancy & Extra Pricing Breakdown */}
                          {(pricing.extraAdultsCount > 0 || pricing.extraChildrenCount > 0) && (
                            <>
                              <div style={{ height: 1, background: `${A}22`, margin: "12px 0 8px" }} />
                              
                              {/* Occupancy Summary */}
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: A, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                  Occupancy Summary
                                </span>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Normal Adults</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>{pricing.normalAdultsCount} / {pricing.baseAdultsLimit}</span>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Extra Adults</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: A }}>{pricing.extraAdultsCount} / {pricing.extraAdultsLimit}</span>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Normal Children</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: FG }}>{pricing.normalChildrenCount} / {pricing.baseChildrenLimit}</span>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 9, color: M, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>Extra Children</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Add-ons Pricing Breakdown */}
                          {pricing.addonsTotal > 0 && (
                            <>
                              <div style={{ height: 1, background: `${A}22`, margin: "12px 0 8px" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: A, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                  Add-ons Total
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: FG }}>
                                  + ₹{pricing.addonsTotal.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </>
                          )}

                        </div>
                      );
                    })()}

                    {/* Warnings */}
                    {pricing.warning && (
                      <div style={{ 
                        padding: "8px 12px", borderRadius: 12, 
                        background: pricing.isOver ? EL : AL, 
                        border: `1px solid ${pricing.isOver ? E + '33' : A + '33'}`,
                        display: "flex", gap: 10, alignItems: "center"
                      }}>
                        <AlertCircle size={14} color={pricing.isOver ? E : A} />
                        <p style={{ fontSize: 10, color: pricing.isOver ? E : FG, lineHeight: 1.4, fontWeight: 600, margin: 0 }}>
                          {pricing.warning}
                        </p>
                      </div>
                    )}
                    

                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="booking-modal-footer" style={{ padding: "16px 28px", background: BG, borderTop: `1px solid ${B}88`, display: "flex", flexDirection: "column", gap: 8, zIndex: 10 }}>
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{ width: "100%" }}
                    >
                      <div style={{
                        padding: "8px 12px",
                        background: EL,
                        border: `1px solid ${E}33`,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: E,
                        fontSize: 11,
                        fontWeight: 700
                      }}>
                        <AlertCircle size={14} />
                        <span>{validationError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 10, color: M, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Total amount</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: FG }}>₹{formatPricePrecise(pricing.finalTotal)}</span>
                    <span style={{ marginTop: 1, fontSize: 10, color: M, fontWeight: 600 }}>Inc. all taxes</span>
                  </div>
                  {(() => {
                    const isPropertyBased = stay?.bookingScope === "Property-Based";
                    const hasSelection = isPropertyBased || resolvedSelectedRooms.length > 0;
                    const isCapacityExceeded = pricing.isOver && !loading;
                    const isDisabled = loading;
                    const buttonText = loading ? "Processing..." : (pricing.isOver ? "Add Another Room" : (hasSelection ? "Reserve Stay" : "Select Room"));

                    return (
                      <motion.button
                        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                        onClick={handleReserve}
                        disabled={isDisabled}
                        style={{
                          padding: "12px 32px",
                          background: loading ? B : A,
                          color: "#FFF",
                          borderRadius: 16,
                          border: "none",
                          fontSize: 15,
                          fontWeight: 800,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          boxShadow: isDisabled ? "none" : `0 10px 20px ${A}33`,
                          transition: "0.3s",
                          opacity: isCapacityExceeded ? 0.6 : (loading ? 0.7 : 1)
                        }}
                      >
                        {buttonText}
                      </motion.button>
                    );
                  })()}
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 28px 12px", color: M, fontSize: 10, background: BG }}>
                <ShieldCheck size={12} />
                <span style={{ fontWeight: 600 }}>Secure booking & payment powered by Little Known Planet</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingErrorPopup.visible && (
          <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingErrorPopup({ visible: false, title: "", message: "", isSameDay: false })}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 520,
                background: BG,
                color: FG,
                borderRadius: bookingErrorPopup.isSameDay ? 28 : 22,
                border: bookingErrorPopup.isSameDay ? `1px solid ${A}44` : `1px solid ${E}44`,
                boxShadow: bookingErrorPopup.isSameDay 
                  ? `0 30px 70px rgba(0,0,0,0.35), 0 0 50px ${A}15` 
                  : "0 24px 64px rgba(0,0,0,0.35)",
                padding: bookingErrorPopup.isSameDay ? "32px 32px 24px" : "22px 22px 18px",
                zIndex: 1,
                overflow: "hidden"
              }}
            >
              {bookingErrorPopup.isSameDay && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(90deg, ${A}, ${AL || '#A0AEC0'})`
                }} />
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: bookingErrorPopup.isSameDay ? 18 : 12 }}>
                <div style={{ 
                  width: bookingErrorPopup.isSameDay ? 46 : 34, 
                  height: bookingErrorPopup.isSameDay ? 46 : 34, 
                  borderRadius: bookingErrorPopup.isSameDay ? 14 : 10, 
                  background: bookingErrorPopup.isSameDay ? AL : EL, 
                  border: bookingErrorPopup.isSameDay ? `1px solid ${A}33` : `1px solid ${E}33`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: bookingErrorPopup.isSameDay ? A : E, 
                  flexShrink: 0 
                }}>
                  {bookingErrorPopup.isSameDay ? <Calendar size={22} /> : <AlertCircle size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: bookingErrorPopup.isSameDay ? 19 : 17, 
                    fontWeight: 800, 
                    color: FG,
                    lineHeight: 1.3
                  }}>{bookingErrorPopup.title}</h3>
                  <p style={{ 
                    margin: "10px 0 0", 
                    fontSize: bookingErrorPopup.isSameDay ? 14 : 13, 
                    lineHeight: 1.6, 
                    color: M 
                  }}>{bookingErrorPopup.message}</p>
                </div>
              </div>
              <div style={{ marginTop: bookingErrorPopup.isSameDay ? 24 : 16, display: "flex", justifyContent: "flex-end" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setBookingErrorPopup({ visible: false, title: "", message: "", isSameDay: false })}
                  style={{
                    background: A,
                    color: "#FFF",
                    border: "none",
                    borderRadius: bookingErrorPopup.isSameDay ? 12 : 10,
                    padding: bookingErrorPopup.isSameDay ? "12px 28px" : "10px 18px",
                    fontSize: bookingErrorPopup.isSameDay ? 13 : 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    boxShadow: bookingErrorPopup.isSameDay ? `0 8px 16px ${A}22` : "none"
                  }}
                >
                  Okay
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
};

export default StayBookingSystem;




