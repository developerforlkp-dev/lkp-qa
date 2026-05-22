import React from "react";
import cn from "classnames";
import styles from "./Details.module.sass";
import Icon from "../../../../components/Icon";

const Details = ({ className, host, businessInterests }) => {
  const hostBio = typeof host?.bio === "string" ? host.bio.trim() : "";

  // Build options from host data
  const options = [];
  
  if (host?.location) {
    options.push({
      title: "Lives in",
      content: host.location,
      icon: "home",
    });
  }
  
  if (Array.isArray(businessInterests) && businessInterests.length > 0) {
    options.push({
      title: "Interests",
      content: businessInterests.join(", "),
      icon: "route",
    });
  }

  // If no options, provide defaults
  if (options.length === 0) {
    options.push({
      title: "Location",
      content: "Location not specified",
      icon: "home",
    });
  }

  return (
    <div className={cn(className, styles.details)}>
      <div className={styles.title}>About Host</div>
      {hostBio && <div className={styles.content}>{hostBio}</div>}
      {options.length > 0 && (
        <div className={styles.options}>
          {options.map((x, index) => (
            <div className={styles.option} key={index}>
              <div className={styles.category}>
                <Icon name={x.icon} size="20" />
                {x.title}
              </div>
              <div className={styles.text}>{x.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Details;
