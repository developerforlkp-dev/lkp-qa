import React, { useState } from "react";
import cn from "classnames";
import styles from "./PaymentsMethod.module.sass";
import TextInput from "../../../components/TextInput";
import Checkbox from "../../../components/Checkbox";

const cards = [
  {
    image: "",
    alt: "Visa",
  },
  {
    image: "",
    alt: "Master Card",
  },
];

const PaymentsMethod = () => {
  const [save, setSave] = useState(true);

  return (
    <div className={styles.section}>
      <div className={cn("h2", styles.title)}>Payment methods</div>
      <div className={styles.box}>
        <div className={styles.category}>Credit card</div>
        <div className={styles.item}>
          <div className={styles.details}>
            <div className={styles.label}>Visa ••••••1667</div>
            <div className={styles.text}>Expiration: 03/2026</div>
          </div>
          <button className={cn("button-small", styles.button)}>
            Add payment method
          </button>
        </div>
        <div className={styles.line}>
          <div className={styles.subtitle}>Add new credit card</div>
          <div className={styles.cards}>
            {cards.map((x, index) => (
              <div className={styles.card} key={index}>
                <img src={x.image} alt={x.alt} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.fieldset}>
          <TextInput
            className={styles.field}
            label="card number"
            name="card"
            type="tel"
            placeholder="XXXX XXXX XXXX XXXX"
            required
          />
          <TextInput
            className={styles.field}
            label="card holder"
            name="holder"
            type="text"
            placeholder="TRAN MAU TRI TAM"
            required
          />
          <div className={styles.row}>
            <TextInput
              className={styles.field}
              label="EXPIRATION DATE"
              name="date"
              type="tel"
              placeholder="MM / YY"
              required
            />
            <TextInput
              className={styles.field}
              label="CVC"
              name="cvc"
              type="tel"
              placeholder="CVC"
              required
            />
          </div>
        </div>
        <Checkbox
          className={styles.checkbox}
          value={save}
          onChange={() => setSave(!save)}
          content="Save Card"
        />
      </div>
      <div className={styles.box}>
        <div className={styles.category}>Coupons</div>
        <div className={styles.flex}>
          <div className={styles.item}>
            <div className={styles.details}>
              <div className={styles.label}>Coupons</div>
              <div className={styles.text}>No coupon added</div>
            </div>
            <button className={cn("button-stroke button-small", styles.button)}>
              Add
            </button>
          </div>
          <div className={styles.item}>
            <div className={styles.details}>
              <div className={styles.label}>Gift credit</div>
              <div className={styles.text}>No gift credit added</div>
            </div>
            <button className={cn("button-stroke button-small", styles.button)}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsMethod;


