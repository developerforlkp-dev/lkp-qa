import React from "react";
import cn from "classnames";
import styles from "./Profile.module.sass";
import Icon from "../Icon";
import Share from "../Share";

const Profile = ({
  className,
  parametersUser,
  info,
  socials,
  buttonText,
  children,
  joinedDate,
  siteUrl = "https://ui8.net",
  phoneNumber,
  email,
  hideContactButton = false,
  hideReportButton = false,
}) => {
  const displayJoinedDate = joinedDate || "Mar 15, 2021";

  return (
    <div className={cn(className, styles.profile)}>
      <div className={styles.head}>{children}</div>
      <div className={styles.body}>
        {parametersUser && parametersUser.length > 0 && (
          <div className={styles.parameters}>
            {parametersUser.map((x, index) => (
              <div className={styles.parameter} key={index}>
                <Icon name={x.icon} size="20" />
                {x.title}
              </div>
            ))}
          </div>
        )}
        {info && <div className={styles.info}>{info}</div>}
        {siteUrl ? (
          <a
            className={styles.site}
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="globe" size="16" />
            <span>{siteUrl}</span>
          </a>
        ) : null}

        <div className={styles.control}>
          <div className={styles.btns}>
            {!hideContactButton && (
              <button className={cn("button-stroke button-small", styles.button)}>
                {buttonText}
              </button>
            )}
            <Share openUp />
            {/* <button
              className={cn("button-circle-stroke button-small", styles.button)}
            >
              <Icon name="more" size="20" />
            </button> */}
          </div>
        </div>
        <div className={styles.socials}>
          {(socials || []).map((x, index) => (
            <a
              className={styles.social}
              href={x.url}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
            >
              <Icon name={x.title} size="20" />
            </a>
          ))}
        </div>
        <div className={styles.note}>Member since {displayJoinedDate}</div>
        {!hideReportButton && (
          <button className={styles.report}>
            <Icon name="flag" size="12" />
            Report this property
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
