import React from "react";
import cn from "classnames";
import styles from "./Actions.module.sass";
import { useHistory } from "react-router-dom";
import Icon from "../Icon";
import Map from "../Map";
import Share from "../Share";
import Favorite from "../Favorite";

const Actions = ({ className, mapLocation }) => {
  const history = useHistory();

  const handleClose = (e) => {
    e.preventDefault();
    // Check if there's history to go back to
    if (window.history.length > 1) {
      history.goBack();
    } else {
      // Fallback to experience-category if no history
      history.push("/experience-category");
    }
  };

  return (
    <div className={cn(className, styles.actions)}>
      <div className={styles.list}>
        <Map location={mapLocation} />
        <Share />
        <Favorite className={styles.favorite} />
        <button
          type="button"
          className={cn("button-circle-stroke button-small", styles.button)}
          onClick={handleClose}
        >
          <Icon name="close" size="24" />
        </button>
      </div>
    </div>
  );
};

export default Actions;
