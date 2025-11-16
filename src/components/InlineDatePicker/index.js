import React, { useMemo, useState, useEffect } from "react";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./InlineDatePicker.module.sass";

const getMonthLabel = (d) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const buildCalendarGrid = (year, month, availabilityData = []) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
  
  const calendar = [];
  
  // Always start with the first day of the month's day of week
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendar.push(null);
  }
  
  // If availability data is provided, only show dates from the API
  if (availabilityData && availabilityData.length > 0) {
    // Get all dates from availability data for this month
    const availableDatesMap = new Map();
    availabilityData.forEach(av => {
      if (!av.date || av.available_seats <= 0) return;
      const date = new Date(av.date + 'T00:00:00'); // Add time to avoid timezone issues
      if (date.getFullYear() === year && date.getMonth() === month) {
        const dateStr = av.date; // Use original date string
        availableDatesMap.set(dateStr, date);
      }
    });
    
    // Add all days of the month, but only mark available dates
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if this date is in the availability data
      if (availableDatesMap.has(dateStr)) {
        calendar.push(currentDate);
      } else {
        calendar.push(null);
      }
    }
  } else {
    // No availability data, show all dates (fallback to original behavior)
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      calendar.push(new Date(year, month, d));
    }
  }
  
  return calendar;
};

const InlineDatePicker = ({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  timeSlots = [],
  availabilityData = [],
  className,
}) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  const calendarGrid = useMemo(() => buildCalendarGrid(currentYear, currentMonth, availabilityData), [currentYear, currentMonth, availabilityData]);
  const monthLabel = getMonthLabel(new Date(currentYear, currentMonth));

  // Initialize dates when picker opens or selectedDate changes
  useEffect(() => {
    if (visible && selectedDate) {
      try {
        const parsedDate = new Date(selectedDate);
        if (!isNaN(parsedDate.getTime())) {
          setStartDate(parsedDate);
          setCurrentMonth(parsedDate.getMonth());
          setCurrentYear(parsedDate.getFullYear());
          return;
        }
      } catch {
        // Invalid date, fall through
      }
      setStartDate(null);
      setEndDate(null);
    }
  }, [visible, selectedDate]);

  const isDateInRange = (date) => {
    if (!date || !startDate) return false;
    if (!endDate) return false;
    const dateTime = date.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };

  const isDateStart = (date) => {
    if (!date || !startDate) return false;
    return date.toDateString() === startDate.toDateString();
  };

  const isDateEnd = (date) => {
    if (!date || !endDate) return false;
    return date.toDateString() === endDate.toDateString();
  };

  const isDateInMiddle = (date) => {
    return isDateInRange(date) && !isDateStart(date) && !isDateEnd(date);
  };

  const isDateSelected = (date) => {
    return isDateStart(date) || isDateEnd(date);
  };

  const isDatePast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck.getTime() < today.getTime();
  };

  const isDateDisabled = (date) => {
    if (!date) return true; // Disable null dates (they're not in availability data)
    
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If availability data is provided, only enable dates that are in the API response
    if (availabilityData && availabilityData.length > 0) {
      const availability = availabilityData.find(av => av.date === dateStr);
      // Disable if no availability data for this date or if available_seats is 0
      return !availability || (availability.available_seats !== undefined && availability.available_seats <= 0);
    }
    
    // Fallback to timeSlots logic if no availability data
    if (timeSlots.length === 0) return false;
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNames = ['isSunday', 'isMonday', 'isTuesday', 'isWednesday', 'isThursday', 'isFriday', 'isSaturday'];
    const dayFlag = dayNames[dayOfWeek];
    
    const isInAnySlotRange = timeSlots.some((slot) => {
      const startDate = new Date(slot.startDate);
      const endDate = new Date(slot.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      const inDateRange = checkDate >= startDate && checkDate <= endDate;
      const isDayAvailable = slot[dayFlag] === true;
      const isActive = slot.isActive !== false;
      
      return inDateRange && isDayAvailable && isActive;
    });
    
    // If date is in a slot range but the day flag is false, disable it
    const isInSlotRange = timeSlots.some((slot) => {
      const startDate = new Date(slot.startDate);
      const endDate = new Date(slot.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
    
    // Disable if in range but day flag is false
    if (isInSlotRange && !isInAnySlotRange) {
      return true;
    }
    
    return false;
  };

  const handleDateClick = (date) => {
    if (!date || isDatePast(date) || isDateDisabled(date)) return;
    
    // For single date selection, select immediately and close
    setStartDate(date);
    setEndDate(date);
    
    // Format and call onDateSelect immediately
    const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    onDateSelect?.(formattedDate, formattedDate);
    
    // Close picker after a short delay to show selection
    setTimeout(() => {
      onClose?.();
    }, 100);
  };

  const handleDateHover = (date) => {
    if (!date || isDatePast(date) || isDateDisabled(date)) return;
    if (startDate && !endDate) {
      setHoveredDate(date);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  if (!visible) return null;

  return (
    <OutsideClickHandler onOutsideClick={onClose}>
      <div className={cn(styles.picker, className)}>
        <div className={styles.calendarHeader}>
          <button className={styles.monthNav} onClick={handlePrevMonth} aria-label="Previous month">
            ‹
          </button>
          <div className={styles.monthLabel}>{monthLabel}</div>
          <button className={styles.monthNav} onClick={handleNextMonth} aria-label="Next month">
            ›
          </button>
        </div>
        <div className={styles.calendarGrid}>
          {daysOfWeek.map((day, idx) => (
            <div key={idx} className={styles.dayHeader}>{day}</div>
          ))}
          {calendarGrid.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className={styles.calendarDay} />;
            }
            
            const isPast = isDatePast(date);
            const isDisabled = isDateDisabled(date);
            const isStart = isDateStart(date);
            const isEnd = isDateEnd(date);
            const isMiddle = isDateInMiddle(date);
            const isSingleDate = isStart && isEnd; // Same date selected as start and end
            const isHovered = hoveredDate && startDate && !endDate && 
              date.getTime() >= Math.min(startDate.getTime(), hoveredDate.getTime()) &&
              date.getTime() <= Math.max(startDate.getTime(), hoveredDate.getTime());
            
            // Check if date is available (from availability data)
            const dateStr = date.toISOString().split('T')[0];
            const isAvailable = availabilityData && availabilityData.length > 0 && 
              availabilityData.some(av => av.date === dateStr && av.available_seats > 0) &&
              !isPast && !isDisabled;
            
            return (
              <button
                key={idx}
                className={cn(styles.calendarDay, {
                  [styles.past]: isPast,
                  [styles.disabled]: isDisabled,
                  [styles.start]: isStart && !isSingleDate,
                  [styles.end]: isEnd && !isSingleDate,
                  [styles.middle]: isMiddle,
                  [styles.hovered]: isHovered && !isStart && !isEnd,
                  [styles.selected]: isSingleDate,
                  [styles.available]: isAvailable && !isStart && !isEnd && !isMiddle && !isSingleDate,
                })}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => handleDateHover(date)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isPast || isDisabled}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default InlineDatePicker;

