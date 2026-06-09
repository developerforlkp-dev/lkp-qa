import React, { useState } from "react";
import cn from "classnames";
import styles from "./Background.module.sass";
import Icon from "../../../components/Icon";

const Backgroung = ({ className }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn(className, styles.background)}>
      <div className={cn("container", styles.container)}>
        <div
          className={cn(styles.head, { [styles.active]: visible })}
          style={{
            backgroundImage: "url()",
          }}
        >
          <div className={styles.btns}>
            <button
              className={cn("button-stroke button-small", styles.button)}
              onClick={() => setVisible(true)}
            >
              <Icon name="edit" size="16" />
              <span>Edit cover</span>
            </button>
          </div>
          <div className={styles.file}>
            <input type="file" />
            <div className={styles.wrap}>
              <Icon name="upload-file" size="48" />
              <div className={styles.info}>Drag and drop your photo here</div>
              <div className={styles.text}>or click to browse</div>
            </div>
            <button
              className={cn("button-small", styles.button)}
              onClick={() => setVisible(false)}
            >
              Save photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backgroung;

