import React, { useMemo, useState } from "react";
import cn from "classnames";
import styles from "./HeadOptions.module.sass";

const HeadOptions = ({ className, image, title, hostName, hostAvatar }) => {
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
    </div>
  );
};

export default HeadOptions;
