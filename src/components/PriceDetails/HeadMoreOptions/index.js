import React, { useMemo, useState } from "react";
import cn from "classnames";
import styles from "./HeadMoreOptions.module.sass";
import Icon from "../../Icon";

const parameters = ["1 bedroom", "1 private bath"];

const HeadMoreOptions = ({ className, image, title, hostName, hostAvatar, rating, reviewsCount }) => {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const normalizedHostName = (hostName || "Host").trim();
  const hostInitial = useMemo(() => normalizedHostName.charAt(0).toUpperCase(), [normalizedHostName]);
  const avatarSrc = useMemo(() => {
    if (!hostAvatar) return null;
    const raw = String(hostAvatar).trim();
    if (!raw) return null;
    if (raw.includes("/images/content/avatar.jpg")) return null;
    return raw;
  }, [hostAvatar]);
  const showLetterAvatar = avatarLoadFailed || !avatarSrc;

  return (
    <div className={cn(className, styles.head)}>
      <div className={styles.preview}>
        <img src={image} alt="Nature" />
      </div>
      <div className={styles.details}>
        <div className={styles.title}>{title}</div>
        <div className={styles.author}>
          <div className={styles.text}>Hosted by</div>
          <div className={styles.avatar}>
            {showLetterAvatar ? (
              <div className={styles.avatarLetter}>{hostInitial}</div>
            ) : (
              <img
                src={avatarSrc}
                alt={normalizedHostName}
                onError={() => setAvatarLoadFailed(true)}
              />
            )}
          </div>
          <div className={styles.man}>{normalizedHostName}</div>
        </div>
        {/* <div className={styles.parameters}>
          {parameters.map((x, index) => (
            <div className={styles.parameter} key={index}>
              {x}
            </div>
          ))}
        </div> */}
        <div className={styles.rating}>
          <Icon name="star" size="20" />
          <div className={styles.number}>{rating != null ? Number(rating).toFixed(1) : "0.0"}</div>
          <div className={styles.reviews}>({reviewsCount || 0} reviews)</div>
        </div>
      </div>
    </div>
  );
};

export default HeadMoreOptions;
