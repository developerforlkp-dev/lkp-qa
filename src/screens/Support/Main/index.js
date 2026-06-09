import React, { useState } from "react";
import cn from "classnames";
import styles from "./Main.module.sass";
import Image from "../../../components/Image";
import Form from "../../../components/Form";

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

const Main = () => {
  const [search, setSearch] = useState("");

  const handleSubmit = (e) => {
    alert();
  };

  return (
    <div className={styles.section}>
      <div className={cn("container", styles.container)}>
        <div className={styles.gallery}>
          {gallery.map((x, index) => (
            <div className={styles.preview} key={index}>
              <Image
                srcSet={`${x.srcSet} 2x`}
                srcSetDark={`${x.srcSetDark} 2x`}
                src={x.src}
                srcDark={x.srcDark}
                alt="Support"
              />
            </div>
          ))}
        </div>
        <h1 className={cn("hero", styles.title)}>Support</h1>
        <div className={styles.info}>
          Stacks is a production-ready library of stackable content blocks built
          in React Native.
        </div>
        <Form
          className={styles.form}
          big
          value={search}
          setValue={setSearch}
          onSubmit={() => handleSubmit()}
          placeholder="Search anything"
          type="text"
          name="search"
          icon="search"
        />
      </div>
    </div>
  );
};

export default Main;

