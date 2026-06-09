import React from "react";
import cn from "classnames";
import styles from "./Main.module.sass";
import Panel from "../../../components/Panel";
import Location from "../../../components/Location";
import DateRange from "../../../components/DateRange";
import Travelers from "../../../components/Travelers";

const Main = () => {
  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.preview}>
          <img src="" alt="" />
          <div className={styles.wrap}>
            <h1 className={cn("hero", styles.title)}>South Island</h1>
            <div className={cn("info", styles.info)}>
              <span role="img" aria-label="Flag New Zealand">
                🇳🇿
              </span>{" "}
              New Zealand
            </div>
          </div>
        </div>
        <Panel
          className={styles.panel}
          classBody={styles.body}
          onSearch={() => console.log("Search")}
        >
          <div className={styles.row}>
            <Location
              className={styles.location}
              icon="location"
              placeholder="Location"
              small
            />
            <DateRange
              className={styles.date}
              icon="calendar"
              startDatePlaceholderText="Check in"
              endDatePlaceholderText="Check out"
              displayFormat="MMM DD"
              small
            />
            <Travelers
              className={styles.travelers}
              title="Travelers"
              icon="user"
              small
            />
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default Main;

