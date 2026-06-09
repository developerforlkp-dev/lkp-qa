import React, { useState } from "react";
import cn from "classnames";
import styles from "./Newsletter.module.sass";
import Image from "../Image";
import Form from "../Form";

const gallery = [
  {
    src: "",
    srcSet: "",
    srcDark: "",
    srcSetDark: "",
  },
  {
    src: "",
    srcSet: "",
    srcDark: "",
    srcSetDark: "",
  },
  {
    src: "",
    srcSet: "",
    srcDark: "",
    srcSetDark: "",
  },
  {
    src: "",
    srcSet: "",
    srcDark: "",
    srcSetDark: "",
  },
];

const items = [
  {
    title: "Get more discount",
    color: "#0097B2",
  },
  {
    title: "Get premium travel magazine",
    color: "#0097B2",
  },
];

const Newsletter = ({ classSection, title }) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    alert();
  };

  return (
    <div className={cn("section", classSection, styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.wrap}>
          <h2 className={cn("h2", styles.title)}>
            Join our newsletter{" "}
            <span role="img" aria-label="firework">
              🎉
            </span>
          </h2>
          <div className={styles.info}>
            Stacks is a production-ready library of stackable content blocks
            built in React Native.
          </div>
          <div className={styles.list}>
            {items.map((x, index) => (
              <div className={styles.item} key={index}>
                <div
                  className={styles.number}
                  style={{ backgroundColor: x.color }}
                >
                  0{index + 1}
                </div>
                <div className={styles.text}>{x.title}</div>
              </div>
            ))}
          </div>
          <Form
            className={styles.form}
            value={email}
            setValue={setEmail}
            onSubmit={() => handleSubmit()}
            placeholder="Enter your email"
            type="email"
            name="email"
            icon="arrow-next"
          />
        </div>
        <div className={styles.gallery}>
          {gallery.map((x, index) => (
            <div className={styles.preview} key={index}>
              <Image
                srcSet={`${x.srcSet} 2x`}
                srcSetDark={`${x.srcSetDark} 2x`}
                src={x.src}
                srcDark={x.srcDark}
                alt="Newsletter"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Newsletter;

