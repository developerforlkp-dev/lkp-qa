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

const TimeSlotsPicker = ({
  visible,
  onClose,
  onTimeSelect,
  selectedTime,
  times = [],
  timeSlots = [], // Array of timeSlot objects with startTime and endTime
  className,
}) => {
  // Use timeSlots if provided, otherwise fall back to times array
  const slots = useMemo(() => {
    if (timeSlots && timeSlots.length > 0) {
      return timeSlots.map((slot) => {
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
          slot: slot, // Keep full slot object
        };
      });
    }
    // Fallback to simple time strings
    return times.map((t) => ({
      id: t,
      display: t,
      timeRange: null,
      slotName: t,
      startTime: null,
      endTime: null,
      slot: null,
    }));
  }, [timeSlots, times]);

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
          {slots.map((slot) => (
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
          ))}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default TimeSlotsPicker;

