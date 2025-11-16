import React, { useMemo, useRef, useState, useEffect } from "react";
import cn from "classnames";
import Modal from "../Modal";
import styles from "./DateTimeModal.module.sass";

const getMonthLabel = (d) =>
  d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const buildCalendarGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
  
  const calendar = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendar.push(null);
  }
  
  // Add all days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendar.push(new Date(year, month, d));
  }
  
  return calendar;
};

const defaultTimes = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
];

const DateTimeModal = ({
  visible,
  onClose,
  onConfirm,
  selectedDate,
  selectedTime,
  datesCount = 30, // not used in month mode but kept for API compatibility
  times = defaultTimes,
  dateOnly = false, // If true, only show date picker and auto-close on selection
}) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [internalSelectedDate, setInternalSelectedDate] = useState(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [time, setTime] = useState(selectedTime || times[0]);

  const calendarGrid = useMemo(() => buildCalendarGrid(currentYear, currentMonth), [currentYear, currentMonth]);
  const monthLabel = getMonthLabel(new Date(currentYear, currentMonth));

  // Initialize dates when modal opens
  useEffect(() => {
    if (visible) {
      // Try to parse selectedDate prop
      if (selectedDate) {
        try {
          const parsedDate = new Date(selectedDate);
          if (!isNaN(parsedDate.getTime())) {
            setInternalSelectedDate(parsedDate);
            setCurrentMonth(parsedDate.getMonth());
            setCurrentYear(parsedDate.getFullYear());
            setShowTimeSlots(true);
            return;
          }
        } catch {
          // Invalid date, fall through
        }
      }
      setInternalSelectedDate(null);
      setShowTimeSlots(false);
    }
  }, [visible, selectedDate]);

  const isDateSelected = (date) => {
    if (!date || !internalSelectedDate) return false;
    return date.toDateString() === internalSelectedDate.toDateString();
  };

  const isDatePast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck.getTime() < today.getTime();
  };

  const handleDateClick = (date) => {
    if (!date || isDatePast(date)) return;
    setInternalSelectedDate(date);
    setShowTimeSlots(true);
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

  const handleConfirm = () => {
    if (!internalSelectedDate) return;
    const formatted = internalSelectedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    onConfirm?.(formatted, time);
    onClose?.();
  };

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <Modal visible={visible} onClose={onClose} outerClassName={styles.modalOuter}>
      <div className={styles.container}>
        <div className={styles.header}>
          {internalSelectedDate && (
            <div className={styles.dateRangeInfo}>
              <div className={styles.selectedDateLabel}>Selected date</div>
              <div className={styles.dateRange}>
                {internalSelectedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
              </div>
            </div>
          )}
          {!internalSelectedDate && (
            <>
              <div className={styles.title}>{dateOnly ? "Select date" : "Select date & time"}</div>
              <div className={styles.subtitle}>{dateOnly ? "Choose your date" : "Choose your check-in schedule"}</div>
            </>
          )}
        </div>
        <div className={styles.section}>
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
              const isSelected = isDateSelected(date);
              
              return (
                <button
                  key={idx}
                  className={cn(styles.calendarDay, {
                    [styles.past]: isPast,
                    [styles.selected]: isSelected,
                  })}
                  onClick={() => handleDateClick(date)}
                  disabled={isPast}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        {showTimeSlots && !dateOnly && (
          <div className={styles.timeSlotsContainer}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Available times</div>
              <div className={styles.timesGrid}>
                {times.map((t) => (
                  <button
                    key={t}
                    className={cn(styles.timeBtn, { [styles.active]: time === t })}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className={styles.footer}>
          <button className={cn("button-stroke", styles.btn)} onClick={onClose}>Cancel</button>
          {!dateOnly && (
            <button 
              className={cn("button", styles.btn)} 
              onClick={handleConfirm}
              disabled={!internalSelectedDate}
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DateTimeModal;


