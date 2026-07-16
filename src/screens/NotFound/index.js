import React from "react";
import { Link } from "react-router-dom";
import StatusLayout from "../../components/StatusLayout";
import Icon from "../../components/Icon";
import styles from "./NotFound.module.sass";

const NotFound = () => {
  const graphic = (
    <div className={styles.graphic}>
      <img src="/images/404_illustration.png" alt="404 Not Found" className={styles.illustrationImage} />
      <h1 className={styles.huge404}>404</h1>
    </div>
  );

  const description = (
    <>
      Looks like this page went on a little adventure<br />
      and got lost in space.
    </>
  );

  return (
    <StatusLayout
      graphic={graphic}
      title="Oops! Page not found"
      description={description}
      primaryAction={{ label: "Back to Home", to: "/", icon: "home" }}
      secondaryAction={{ label: "About LittleKnown Planet", to: "/about", icon: "info" }}
      supportProps={{ title: "Still lost?", description: "Our support team is here to help you find your way." }}
    >
      <div className={styles.divider}>
        <span>Looking for something?</span>
      </div>

      <div className={styles.quickLinks}>
        <Link to="/experiences" className={styles.quickCard}>
          <Icon name="search" size="20" className={styles.cardIcon} />
          <div className={styles.cardText}>
            <strong>Explore</strong>
            <span>Find Experiences</span>
          </div>
        </Link>
        <Link to="/wishlists" className={styles.quickCard}>
          <Icon name="heart-outline" size="20" className={styles.cardIcon} />
          <div className={styles.cardText}>
            <strong>Your Wishlist</strong>
            <span>View Saved Items</span>
          </div>
        </Link>
        <Link to="/blog" className={styles.quickCard}>
          <Icon name="receipt" size="20" className={styles.cardIcon} />
          <div className={styles.cardText}>
            <strong>Read Blog</strong>
            <span>Explore Our Stories</span>
          </div>
        </Link>
        <button onClick={() => alert("Support popup triggered")} className={styles.quickCard} style={{ textAlign: 'left' }}>
          <Icon name="phone" size="20" className={styles.cardIcon} />
          <div className={styles.cardText}>
            <strong>Need Help?</strong>
            <span>Contact Support</span>
          </div>
        </button>
      </div>
    </StatusLayout>
  );
};

export default NotFound;
