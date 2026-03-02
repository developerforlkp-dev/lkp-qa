import React, { useState, useMemo } from "react";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./TimeSlotsPicker.module.sass";

// Helper function to format time from "HH:mm" to "HH:mm AM/PM"
const formatTime = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to format time range with cleaner display
const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return "";
  return {
    start: formatTime(startTime),
    end: formatTime(endTime),
    full: `${formatTime(startTime)} - ${formatTime(endTime)}`
  };
};

// Day-of-week mappings (JS getDay() returns 0=Sun ... 6=Sat)
const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_FLAGS = ['isSunday', 'isMonday', 'isTuesday', 'isWednesday', 'isThursday', 'isFriday', 'isSaturday'];

/**
 * Return true if the slot is offered on the given JS weekday index (0=Sun...6=Sat).
 * Checks three possible data shapes:
 *   1. selected_days: ["MON", "TUE", ...]
 *   2. isMonday / isTuesday / ... boolean flags
 *   3. No day data at all -- always show
 */
const isSlotAvailableOnDay = (slot, dayIndex) => {
  if (dayIndex === null || dayIndex === undefined) return true;

  const dayCode = DAY_CODES[dayIndex];
  const dayFlag = DAY_FLAGS[dayIndex];

  // Shape 1: selected_days array
  if (Array.isArray(slot.selected_days) && slot.selected_days.length > 0) {
    return slot.selected_days.includes(dayCode);
  }

  // Shape 2: explicit boolean flags on the raw slot object
  if (slot[dayFlag] !== undefined) {
    return slot[dayFlag] === true;
  }

  // No day restriction info -- show slot
  return true;
};

const TimeSlotsPicker = ({
  visible,
  onClose,
  onTimeSelect,
  selectedTime,
  times = [],
  timeSlots = [], // Array of timeSlot objects with startTime and endTime
  selectedDate,   // moment object, Date, or ISO string for the chosen date
  className,
}) => {
  // Resolve the weekday index from selectedDate (null when no date chosen)
  const selectedDayIndex = useMemo(() => {
    if (!selectedDate) return null;
    try {
      // Support moment objects (.toDate()), native Date, or ISO strings
      const d = typeof selectedDate.toDate === 'function'
        ? selectedDate.toDate()
        : new Date(selectedDate);
      return isNaN(d.getTime()) ? null : d.getDay(); // 0=Sun ... 6=Sat
    } catch {
      return null;
    }
  }, [selectedDate]);

  // Use timeSlots if provided, otherwise fall back to times array, then filter by selected day
  const slots = useMemo(() => {
    let rawSlots;
    if (timeSlots && timeSlots.length > 0) {
      rawSlots = timeSlots.map((slot) => {
        const timeRange = slot.startTime && slot.endTime
          ? formatTimeRange(slot.startTime, slot.endTime)
          : null;
        return {
          id: slot.slotId || slot.slotName,
          display: timeRange ? timeRange.full : slot.slotName,
          timeRange: timeRange,
          slotName: slot.slotName,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slot: slot, // Keep full slot object for day-check
          selected_days: slot.selected_days,
        };
      });
    } else {
      // Fallback to simple time strings
      rawSlots = times.map((t) => ({
        id: t,
        display: t,
        timeRange: null,
        slotName: t,
        startTime: null,
        endTime: null,
        slot: null,
        selected_days: undefined,
      }));
    }

    // Filter by the selected day of week
    if (selectedDayIndex !== null) {
      rawSlots = rawSlots.filter((s) =>
        isSlotAvailableOnDay(s.slot || s, selectedDayIndex)
      );
    }

    // If the selected date is TODAY, filter out time slots that have already passed
    if (selectedDate) {
      try {
        const selected = typeof selectedDate.toDate === 'function'
          ? selectedDate.toDate()
          : new Date(selectedDate);

        const now = new Date();
        const isToday =
          selected.getFullYear() === now.getFullYear() &&
          selected.getMonth() === now.getMonth() &&
          selected.getDate() === now.getDate();

        if (isToday) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          rawSlots = rawSlots.filter((s) => {
            if (!s.startTime) return true; // no time info — keep it
            const [h, m] = s.startTime.split(':').map(Number);
            const slotMinutes = h * 60 + m;
            return slotMinutes > currentMinutes;
          });
        }
      } catch {
        // Ignore date parsing errors — show all slots
      }
    }

    return rawSlots;
  }, [timeSlots, times, selectedDayIndex]);

  const [time, setTime] = useState(selectedTime || (slots[0]?.id || slots[0]?.slotName));

  const handleTimeClick = (slot) => {
    setTime(slot.id || slot.slotName);
    // Pass the slotName or the formatted display string
    onTimeSelect?.(slot.slotName || slot.display);
    // Close the picker immediately after selection
    onClose?.();
  };

  if (!visible) return null;

  return (
    <OutsideClickHandler onOutsideClick={onClose}>
      <div className={cn(styles.picker, className)}>
        <div className={styles.header}>
          <div className={styles.title}>Available times</div>
        </div>
        <div className={styles.timesGrid}>
          {slots.length === 0 ? (
            <div className={styles.noSlots}>No time slots available for the selected date.</div>
          ) : (
            slots.map((slot) => (
              <button
                key={slot.id}
                className={cn(styles.timeBtn, {
                  [styles.active]: time === slot.id || time === slot.slotName || selectedTime === slot.slotName
                })}
                onClick={() => handleTimeClick(slot)}
              >
                {slot.timeRange ? (
                  <div className={styles.timeRange}>
                    <span className={styles.timeStart}>{slot.timeRange.start}</span>
                    <span className={styles.timeSeparator}>–</span>
                    <span className={styles.timeEnd}>{slot.timeRange.end}</span>
                  </div>
                ) : (
                  <span>{slot.display}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default TimeSlotsPicker;
