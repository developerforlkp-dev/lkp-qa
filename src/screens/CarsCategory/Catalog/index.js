import React, { useState } from "react";
import cn from "classnames";
import styles from "./Catalog.module.sass";
import Sorting from "../../../components/Sorting";
import Card from "../../../components/Card";
import Loader from "../../../components/Loader";

// data
import { cars } from "../../../mocks/cars";

const breadcrumbs = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Cars",
    url: "/cars",
  },
  {
    title: "New Zealand",
    url: "/cars-category",
  },
  {
    title: "South Island",
  },
];

const navigation = [
  "Sightseeing",
  "Transportation activities",
  "Art and culture",
];

const saleOptions = ["Time of day", "Tomorrow", "This week"];

const Catalog = () => {
  const [sale, setSale] = useState(saleOptions[0]);

  return (
    <div className={cn("section-mb80", styles.section)}>
      <Sorting
        className={styles.sorting}
        urlHome="/cars"
        breadcrumbs={breadcrumbs}
        navigation={navigation}
        title="24 locations found"
        sale="up to 25% off"
        details="May 1 - 14, 2 guests"
        sorting={sale}
        setSorting={setSale}
        sortingOptions={saleOptions}
      />
      <div className={styles.body}>
        <div className={cn("container", styles.container)}>
          <div className={styles.list}>
            {cars.map((x, index) => (
              <Card className={styles.card} item={x} key={index} row />
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
    </div>
  );
};

export default Catalog;
