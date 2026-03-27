import React, { useState } from "react";
import cn from "classnames";
import styles from "./Map.module.sass";
import OutsideClickHandler from "react-outside-click-handler";
import Icon from "../Icon";

const Map = ({ className, location }) => {
  const [visible, setVisible] = useState(false);
  
  let mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63817.0803287881!2d168.63234961382247!3d-45.04173987887954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa9d51df1d7a8de5f%3A0x500ef868479a600!2z0JrRg9C40L3RgdGC0LDRg9C9LCDQndC-0LLQsNGPINCX0LXQu9Cw0L3QtNC40Y8!5e0!3m2!1sru!2sua!4v1624887132616!5m2!1sru!2sua";
  if (location) {
    mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  }

  return (
    <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
      <div className={cn(className, styles.location)}>
        <button
          className={cn("button-circle-stroke button-small", styles.button, {
            [styles.active]: visible,
          })}
          onClick={() => setVisible(!visible)}
        >
          <Icon name="location" size="24" />
        </button>
        <div className={cn(styles.body, { [styles.show]: visible })}>
          <iframe
            title="Map"
            src={mapUrl}
            width="600"
            height="450"
            loading="lazy"
          />
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default Map;
