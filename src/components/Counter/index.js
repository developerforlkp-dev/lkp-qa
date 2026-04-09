import React from "react";
import cn from "classnames";
import styles from "./Counter.module.sass";
import Icon from "../Icon";

const Counter = ({ className, value, setValue, iconPlus = "plus", iconMinus = "minus", min = 0, max }) => {
  const normalizeBound = (bound) => {
    if (bound === undefined || bound === null || bound === "") {
      return undefined;
    }

    const normalized = typeof bound === "number" ? bound : Number(bound);
    return Number.isFinite(normalized) ? normalized : undefined;
  };

  const normalizedMin = normalizeBound(min) ?? 0;
  const normalizedMax = normalizeBound(max);

  const handleButtonMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDecrement = () => {
    if (value > normalizedMin) {
      setValue(value - 1);
    }
  };

  const handleIncrement = () => {
    if (normalizedMax === undefined || value < normalizedMax) {
      setValue(value + 1);
    }
  };

  return (
    <div className={cn(className, styles.counter)}>
      <button 
        type="button"
        className={cn(styles.button, { [styles.disabled]: value <= normalizedMin })} 
        onMouseDown={handleButtonMouseDown}
        onClick={handleDecrement}
        disabled={value <= normalizedMin}
      >
        <Icon name={iconMinus} size="24" />
      </button>
      <div className={styles.number}>{value}</div>
      <button 
        type="button"
        className={cn(styles.button, { [styles.disabled]: normalizedMax !== undefined && value >= normalizedMax })} 
        onMouseDown={handleButtonMouseDown}
        onClick={handleIncrement}
        disabled={normalizedMax !== undefined && value >= normalizedMax}
      >
        <Icon name={iconPlus} size="24" />
      </button>
    </div>
  );
};

export default Counter;
