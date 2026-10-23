import React from "react";
import { Link } from "react-router-dom";
import styles from "./SupportSection.module.sass";
import Icon from "../Icon";

const SupportSection = ({ title = "Need Help?", description = "Our support team is here to help you." }) => {
  return (
    <div className={styles.supportBox}>
      <div className={styles.supportLeft}>
        <div className={styles.supportPlanet}>
          <Icon name="globe" size="32" className={styles.supportIcon} />
        </div>
        <div className={styles.supportText}>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
      </div>
      <div className={styles.supportRight}>
        <a href="tel:+919895521927" className={styles.chatButton}>
          <Icon name="phone" size="16" className={styles.chatIcon} />
          Call Support
        </a>
        <div className={styles.emailContact}>
          <Icon name="email" size="20" className={styles.emailIcon} />
          <div className={styles.emailText}>
            <strong>Email us</strong>
            <a href="mailto:support@littleknownplanet.com">support@littleknownplanet.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
