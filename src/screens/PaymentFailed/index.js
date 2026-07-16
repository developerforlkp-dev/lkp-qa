import React from "react";
import StatusLayout from "../../components/StatusLayout";
import Icon from "../../components/Icon";
import styles from "./PaymentFailed.module.sass";

const PaymentFailed = () => {
  const graphic = (
    <div className={styles.graphic}>
      <div className={styles.card}>
        <div className={styles.chip}></div>
        <div className={styles.cardNumber}>
          <span>4242</span><span>4242</span><span>4242</span><span className={styles.faded}>4242</span>
        </div>
      </div>
      <div className={styles.errorBadge}>
        <Icon name="close" size="24" className={styles.errorIcon} />
      </div>
    </div>
  );

  const description = (
    <>
      We couldn't process your payment. Don't worry, no charges were made.<br />
      Please try again with a different payment method or verify your details.
    </>
  );

  return (
    <StatusLayout
      graphic={graphic}
      title="Payment Failed"
      description={description}
      primaryAction={{ label: "Try Again", to: "/checkout" }}
      secondaryAction={{ label: "Go to Home", to: "/", icon: "home" }}
      supportProps={{ title: "Need Help?", description: "If the problem persists, our support team is here to help." }}
    >
      <div className={styles.securityBox}>
        <div className={styles.securityIconContainer}>
          <Icon name="shield" size="24" className={styles.securityIcon} />
        </div>
        <div className={styles.securityText}>
          <strong>Your payment is safe with us.</strong>
          <span>We use industry-standard security to protect your data.</span>
        </div>
      </div>
    </StatusLayout>
  );
};

export default PaymentFailed;
