import React, { useState } from "react";
import cn from "classnames";
import styles from "./DateSingle.module.sass";
import "react-dates/initialize";
import { SingleDatePicker } from "react-dates";
import Icon from "../Icon";

const DateSingle = ({
  className,
  icon,
  description,
  placeholder,
  displayFormat,
  small,
  bodyDown,
  date: controlledDate,
  onDateChange,
  id,
  plain,
  withPortal,
  openDirection,
}) => {
  const [internalDate, setInternalDate] = useState(null);
  const [focused, setFocused] = useState(false);
  
  // Use controlled date if provided, otherwise use internal state
  const date = controlledDate !== undefined ? controlledDate : internalDate;
  const handleDateChange = (newDate) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  if (plain) {
    return (
      <div
        className={cn(
          className,
          { small: small },
          { bodyDown: bodyDown },
          { [styles.small]: small },
          styles.date
        )}
      >
        <SingleDatePicker
          placeholder={placeholder}
          date={date}
          onDateChange={handleDateChange}
          focused={focused}
          onFocusChange={({ focused }) => setFocused(focused)}
          id={id || "date-single"}
          displayFormat={displayFormat}
          readOnly
          noBorder
          numberOfMonths={1}
          withPortal={withPortal}
          openDirection={openDirection}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        className,
        { small: small },
        { bodyDown: bodyDown },
        { [styles.small]: small },
        styles.date
      )}
    >
      <div className={styles.head}>
        <div className={styles.box}>
          <div className={styles.icon}>
            <Icon name={icon} size="24" />
          </div>
          {description && (
            <div className={styles.description}>{description}</div>
          )}
        </div>
        <SingleDatePicker
          placeholder={placeholder}
          date={date}
          onDateChange={handleDateChange}
          focused={focused}
          onFocusChange={({ focused }) => setFocused(focused)}
          id={id || "date-single"}
          displayFormat={displayFormat}
          readOnly
          noBorder
          numberOfMonths={1}
          withPortal={withPortal}
          openDirection={openDirection}
        />
      </div>
    </div>
  );
};

export default DateSingle;
