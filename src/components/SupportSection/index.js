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
        <Link to="/support" className={styles.chatButton}>
          <Icon name="comment" size="16" className={styles.chatIcon} />
          Raise a ticket
        </Link>
        <div className={styles.emailContact}>
          <Icon name="email" size="20" className={styles.emailIcon} />
          <div className={styles.emailText}>
            <strong>Email us</strong>
            <a href="mailto:support@littleplanet.com">support@littleplanet.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportSection;
