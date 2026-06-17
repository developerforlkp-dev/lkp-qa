import React, { useState } from "react";
import cn from "classnames";
import styles from "./Favorite.module.sass";
import Icon from "../Icon";

const Favorite = ({ className }) => {
  const [visible, setVisible] = useState(false);
  return (
    <button
      className={cn(
        styles.button,
        {
          [styles.active]: visible,
        },
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        setVisible(!visible);
      }}
    >
      <div className={styles.inner}>
        <Icon name={visible ? "check" : "star"} size="12" />
        <span className={styles.text}>{visible ? "Saved" : "Save"}</span>
      </div>
    </button>
  );
};

export default Favorite;
