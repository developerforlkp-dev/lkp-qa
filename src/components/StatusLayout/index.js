import React from "react";
import { Link } from "react-router-dom";
import cn from "classnames";
import styles from "./StatusLayout.module.sass";
import Icon from "../Icon";
import SupportSection from "../SupportSection";

const StatusLayout = ({
  graphic,
  title,
  description,
  primaryAction,
  secondaryAction,
  showSupport = true,
  supportProps = {},
  showTrustBadges = false,
  children
}) => {
  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.content}>
          
          {graphic && <div className={styles.graphicContainer}>{graphic}</div>}

          {title && <h2 className={styles.title}>{title}</h2>}
          
          {description && <div className={styles.text}>{description}</div>}

          {(primaryAction || secondaryAction) && (
            <div className={styles.mainActions}>
              {primaryAction && (
                primaryAction.to ? (
                  <Link className={cn("button", styles.buttonPrimary)} to={primaryAction.to} onClick={primaryAction.onClick}>
                    {primaryAction.icon && <Icon name={primaryAction.icon} size="16" className={styles.btnIcon} />}
                    {primaryAction.label}
                  </Link>
                ) : (
                  <button className={cn("button", styles.buttonPrimary)} onClick={primaryAction.onClick}>
                    {primaryAction.icon && <Icon name={primaryAction.icon} size="16" className={styles.btnIcon} />}
                    {primaryAction.label}
                  </button>
                )
              )}
              {secondaryAction && (
                secondaryAction.to ? (
                  <Link className={cn("button-stroke", styles.buttonSecondary)} to={secondaryAction.to} onClick={secondaryAction.onClick}>
                    {secondaryAction.icon && <Icon name={secondaryAction.icon} size="16" className={styles.btnIconDark} />}
                    {secondaryAction.label}
                  </Link>
                ) : (
                  <button className={cn("button-stroke", styles.buttonSecondary)} onClick={secondaryAction.onClick}>
                    {secondaryAction.icon && <Icon name={secondaryAction.icon} size="16" className={styles.btnIconDark} />}
                    {secondaryAction.label}
                  </button>
                )
              )}
            </div>
          )}

          {children}

          {showSupport && (
            <div className={styles.supportWrapper}>
              <SupportSection {...supportProps} />
            </div>
          )}

          {showTrustBadges && (
            <div className={styles.trustBadges}>
              <div className={styles.trustItem}>
                <Icon name="lock" size="14" />
                <span>Secure & Safe Checkout</span>
              </div>
              <div className={styles.trustItem}>
                <Icon name="shield" size="14" />
                <span>100% Safe Payments</span>
              </div>
              <div className={styles.trustItem}>
                <Icon name="check" size="14" />
                <span>Trusted by Thousands</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StatusLayout;
