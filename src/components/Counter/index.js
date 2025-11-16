import React from "react";
import cn from "classnames";
import styles from "./Counter.module.sass";
import Icon from "../Icon";

const Counter = ({ className, value, setValue, iconPlus = "plus", iconMinus = "minus", min = 0, max }) => {
  const handleDecrement = () => {
    if (value > min) {
      setValue(value - 1);
    }
  };

  const handleIncrement = () => {
    if (max === undefined || value < max) {
      setValue(value + 1);
    }
  };

  return (
    <div className={cn(className, styles.counter)}>
      <button 
        className={cn(styles.button, { [styles.disabled]: value <= min })} 
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <Icon name={iconMinus} size="24" />
      </button>
      <div className={styles.number}>{value}</div>
      <button 
        className={cn(styles.button, { [styles.disabled]: max !== undefined && value >= max })} 
        onClick={handleIncrement}
        disabled={max !== undefined && value >= max}
      >
        <Icon name={iconPlus} size="24" />
      </button>
    </div>
  );
};

export default Counter;
