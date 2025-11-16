import React, { useState } from "react";
import cn from "classnames";
import styles from "./ConfirmAndPay.module.sass";
import CreditCard from "./CreditCard";
import Icon from "../Icon";

const ConfirmAndPay = ({ className, guests, title, buttonUrl }) => {
  // keep minimal local state if needed later

  return (
    <div className={cn(className, styles.confirm)}>
      <div className={cn("h2", styles.title)}>Confirm and pay</div>
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.box}>
            <div className={styles.category}>{title}</div>
            <div className={styles.group}>
              <div className={styles.option}>
                <div className={styles.info}>Dates</div>
                <input className={styles.input} type="text" />
                <div className={styles.value}>May 15 - 22, 2021</div>
                <button className={styles.edit}>
                  <Icon name="edit" size="24" />
                </button>
              </div>
              {guests && (
                <div className={styles.option}>
                  <div className={styles.info}>Guests</div>
                  <input className={styles.input} type="text" />
                  <div className={styles.value}>2 guest</div>
                  <button className={styles.edit}>
                    <Icon name="edit" size="24" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.item}>
          <CreditCard className={styles.credit} buttonUrl={buttonUrl} hidePaymentFields />
        </div>
      </div>
    </div>
  );
};

export default ConfirmAndPay;
