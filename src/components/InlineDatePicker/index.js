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
  
  // Always add all days of the month (display all dates)
  for (let d = 1; d <= daysInMonth; d++) {
    calendar.push(new Date(year, month, d));
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

  // eslint-disable-next-line no-unused-vars
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
    
    // Format date in local timezone to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD format in local timezone
    
    // If availability data is provided, only enable dates that are in the API response
    if (availabilityData && availabilityData.length > 0) {
      const availability = availabilityData.find(av => {
        // Handle both string dates and date objects in availability data
        let avDateStr = av.date;
        if (!avDateStr) return false;
        
        if (typeof avDateStr !== 'string') {
          // If it's a date object, convert to local date string
          const avDate = new Date(avDateStr);
          const avYear = avDate.getFullYear();
          const avMonth = String(avDate.getMonth() + 1).padStart(2, '0');
          const avDay = String(avDate.getDate()).padStart(2, '0');
          avDateStr = `${avYear}-${avMonth}-${avDay}`;
        }
        return avDateStr === dateStr;
      });
      // Disable if no availability data for this date, not available, or no seats available
      return !availability || 
             availability.is_available !== true || 
             (availability.available_seats !== undefined && availability.available_seats <= 0);
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
            // Format date in local timezone to match isDateDisabled logic
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const isAvailable = availabilityData && availabilityData.length > 0 && 
              availabilityData.some(av => {
                // Handle both string dates and date objects in availability data
                let avDateStr = av.date;
                if (avDateStr && typeof avDateStr !== 'string') {
                  // If it's a date object, convert to string
                  avDateStr = new Date(avDateStr);
                  const avYear = avDateStr.getFullYear();
                  const avMonth = String(avDateStr.getMonth() + 1).padStart(2, '0');
                  const avDay = String(avDateStr.getDate()).padStart(2, '0');
                  avDateStr = `${avYear}-${avMonth}-${avDay}`;
                }
                return avDateStr === dateStr && 
                       av.available_seats > 0 && 
                       av.is_available === true;
              }) &&
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

