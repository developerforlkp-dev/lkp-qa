import React, { useState } from "react";
import cn from "classnames";
import styles from "./Filters.module.sass";
import { Range, getTrackBackground } from "react-range";
import Option from "./Option";
import Checkbox from "../../../../components/Checkbox";
import Icon from "../../../../components/Icon";

const times = [
  {
    title: "Take-off",
    location: "South Island (SIZ)",
  },
  {
    title: "Landing",
    location: "South Island (SIZ)",
  },
  {
    title: "Take-off",
    location: "South Island (SIZ)",
  },
  {
    title: "Landing",
    location: "South Island (SIZ)",
  },
];

const filters = [
  {
    id: 0,
    content: "Nonstop",
    note: "₹2,568",
  },
  {
    id: 1,
    content: "1 stop",
    note: "₹2,568",
  },
  {
    id: 2,
    content: "2+ stops",
    note: "₹2,568",
  },
];

const Filters = ({ className }) => {
  const [values, setValues] = useState([3000]);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const handleChange = (id) => {
    if (selectedFilters.includes(id)) {
      setSelectedFilters(selectedFilters.filter((x) => x !== id));
    } else {
      setSelectedFilters((selectedFilters) => [...selectedFilters, id]);
    }
  };

  const stepPrice = 50;
  const minPrice = 1000;
  const maxPrice = 5000;

  return (
    <div className={cn(className, styles.filters)}>
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.label}>Price range</div>
          <Range
            values={values}
            step={stepPrice}
            min={minPrice}
            max={maxPrice}
            onChange={(values) => setValues(values)}
            renderTrack={({ props, children }) => (
              <div
                onMouseDown={props.onMouseDown}
                onTouchStart={props.onTouchStart}
                style={{
                  ...props.style,
                  height: "36px",
                  display: "flex",
                  width: "100%",
                }}
              >
                <div
                  ref={props.ref}
                  style={{
                    height: "8px",
                    width: "100%",
                    borderRadius: "4px",
                    background: getTrackBackground({
                      values,
                      colors: ["#3772FF", "#B1B5C3"],
                      min: minPrice,
                      max: maxPrice,
                    }),
                    alignSelf: "center",
                  }}
                >
                  {children}
                </div>
              </div>
            )}
            renderThumb={({ props, isDragged }) => (
              <div
                {...props}
                style={{
                  ...props.style,
                  height: "24px",
                  width: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#3772FF",
                  border: "4px solid #FCFCFD",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-33px",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "14px",
                    lineHeight: "18px",
                    fontFamily: "Poppins",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    backgroundColor: "#141416",
                  }}
                >
                  ₹{values[0].toLocaleString('en-IN')}
                </div>
              </div>
            )}
          />
          <div className={styles.scale}>
            <div className={styles.number}>₹1,000</div>
            <div className={styles.number}>₹5,000</div>
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>Times</div>
          <div className={styles.group}>
            {times.map((x, index) => (
              <Option className={styles.option} item={x} key={index} />
            ))}
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.label}>stops</div>
          <div className={styles.variants}>
            {filters.map((x, index) => (
              <Checkbox
                className={styles.checkbox}
                content={x.content}
                note={x.note}
                value={selectedFilters.includes(x.id)}
                onChange={() => handleChange(x.id)}
                key={index}
              />
            ))}
          </div>
        </div>
      </div>
      <button className={styles.reset}>
        <Icon name="close-circle-fill" size="24" />
        Reset filter
      </button>
    </div>
  );
};

export default Filters;
