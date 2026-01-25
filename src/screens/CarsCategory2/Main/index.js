import React from "react";
import cn from "classnames";
import styles from "./Main.module.sass";
import Panel from "../../../components/Panel";
import Location from "../../../components/Location";
import DateRange from "../../../components/DateRange";

const Main = () => {
  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={styles.bg}>
        <img src="/images/content/bg-flight-1.jpg" alt="Flight" />
      </div>
      <div className={cn("container", styles.container)}>
        <Panel
          className={styles.panel}
          classBody={styles.body}
          classButtonSearch={styles.search}
          onSearch={() => console.log("Search")}
        >
          <div className={styles.controls}>
            <button
              className={cn(
                "button-stroke button-small",
                styles.active,
                styles.button
              )}
            >
              Return to same location
            </button>
            <button className={cn("button-stroke button-small", styles.button)}>
              Return to same different location
            </button>
          </div>
          <div className={styles.row}>
            <Location
              className={styles.location}
              icon="marker"
              placeholder="Pickup location"
              small
              bodyDown
            />
            <DateRange
              className={styles.date}
              icon="calendar"
              startDatePlaceholderText="Departure"
              endDatePlaceholderText="Return"
              displayFormat="ddd, MMM DD"
              small
              bodyDown
            />
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default Main;
