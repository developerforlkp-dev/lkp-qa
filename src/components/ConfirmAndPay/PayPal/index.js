import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./PayPal.module.sass";
import TextInput from "../../TextInput";
import Checkbox from "../../Checkbox";

const PayPal = ({ className, buttonUrl }) => {
  const [save, setSave] = useState(true);

  return (
    <div className={cn(className, styles.paypal)}>
      <div className={styles.line}>
        <div className={styles.subtitle}>Login to Paypal</div>
        <div className={styles.logo}>
          <img src="" alt="" />
        </div>
      </div>
      <div className={styles.fieldset}>
        <TextInput
          className={styles.field}
          label="email or phone number"
          name="login"
          type="text"
          required
        />
        <TextInput
          className={styles.field}
          label="Password"
          name="password"
          type="password"
          required
        />
      </div>
      <div className={styles.control}>
        <Link className={cn("button", styles.button)} to={buttonUrl} replace>
          Confirm and pay
        </Link>
        <div className={styles.verified}>
          <img src="" alt="" />
        </div>
      </div>
      <Checkbox
        className={styles.checkbox}
        value={save}
        onChange={() => setSave(!save)}
        content="Save Paypal Account"
      />
    </div>
  );
};

export default PayPal;

