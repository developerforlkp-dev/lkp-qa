import React from "react";
import cn from "classnames";
import styles from "./Control.module.sass";
import { useHistory } from "react-router-dom";
import Icon from "../Icon";
import Breadcrumbs from "../Breadcrumbs";

const Control = ({ className, urlHome, breadcrumbs, backUrl }) => {
  const history = useHistory();

  const handleBack = (e) => {
    e.preventDefault();
    if (backUrl) {
      history.push(backUrl);
      return;
    }
    // Check if there's history to go back to
    if (window.history.length > 1) {
      history.goBack();
    } else {
      // Fallback to home if no history
      history.push(urlHome || "/");
    }
  };

  return (
    <div className={cn(className, styles.control)}>
      <button
        className={cn("button-stroke button-small", styles.button)}
        onClick={handleBack}
      >
        <Icon name="arrow-left" size="10" />
        <span>Back</span>
      </button>
      <Breadcrumbs className={styles.breadcrumbs} items={breadcrumbs} />
    </div>
  );
};

export default Control;
