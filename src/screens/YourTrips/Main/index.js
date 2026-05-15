import React from "react";
import cn from "classnames";
import styles from "./Main.module.sass";
import Control from "../../../components/Control";
import Card from "../../../components/Card";
import Loader from "../../../components/Loader";

import { experience } from "../../../mocks/experience";

const breadcrumbs = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Your bookings",
  },
];

const Main = () => {
  return (
    <div className={cn("section-mb64", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control
          className={styles.control}
          urlHome="/"
          breadcrumbs={breadcrumbs}
        />
        <h1 className={cn("h2", styles.title)}>Your bookings</h1>
        <div className={styles.list}>
          {experience.map((x, index) => (
            <Card className={styles.card} item={x} key={index} />
          ))}
        </div>
        <div className={styles.btns}>
          <button className={cn("button-stroke", styles.button)}>
            <Loader className={styles.loader} />
            <span>Show more</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Main;
