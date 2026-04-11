import React, { useState } from "react";
import cn from "classnames";
import styles from "./Share.module.sass";
import Icon from "../Icon";
import OutsideClickHandler from "react-outside-click-handler";

const Share = ({ className, openUp, darkButton }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    // Professional and amazing message as requested
    const shareMessage = `Check out this incredible experience on Little Known Planet! 🌍 ✨ View details here: ${url}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareMessage).then(() => {
        setCopied(true);
        setVisible(true);
        setTimeout(() => {
          setCopied(false);
          setVisible(false);
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareMessage;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setVisible(true);
        setTimeout(() => {
          setCopied(false);
          setVisible(false);
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
      <div
        className={cn(
          className,
          styles.share,
          { [styles.openUp]: openUp },
          { [styles.darkButton]: darkButton }
        )}
      >
        <button
          className={cn(
            "button-circle-stroke button-small",
            { [styles.active]: visible || copied },
            styles.button
          )}
          onClick={handleCopyLink}
          title="Copy link to clipboard"
        >
          <Icon name={copied ? "check" : "share"} size="24" />
        </button>
        <div className={cn(styles.body, { [styles.show]: visible || copied })}>
          <div className={styles.title}>{copied ? "Copied!" : "Copy link"}</div>
          <div className={styles.text} style={{ fontSize: '12px', color: '#777E90', marginTop: '4px', whiteSpace: 'nowrap' }}>
            Invitation copied with link
          </div>
        </div>
      </div>
    </OutsideClickHandler>
  );
};

export default Share;
