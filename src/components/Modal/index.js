import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import OutsideClickHandler from "react-outside-click-handler";
import cn from "classnames";
import styles from "./Modal.module.sass";
import Icon from "../Icon";

const Modal = ({ outerClassName, visible, onClose, children }) => {
  const escFunction = useCallback(
    (e) => {
      if (e.keyCode === 27) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);
    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, [escFunction]);

  const scrollRef = useRef(null);

  useEffect(() => {
    const targetElement = scrollRef.current;
    if (visible && targetElement) {
      disableBodyScroll(targetElement);
    }
    return () => {
      if (targetElement) {
        enableBodyScroll(targetElement);
      }
    };
  }, [visible]);

  return createPortal(
    visible && (
      <div className={styles.modal} ref={scrollRef}>
        <div className={cn(styles.outer, outerClassName)}>
          <OutsideClickHandler onOutsideClick={(e) => {
            if (e && e.target && (
              e.target.closest?.('#credential_picker_container') || 
              e.target.closest?.('#google-one-tap-container') ||
              e.target.closest?.('.S311be-ayS03d') // Common Google GSI class
            )) return;
            onClose();
          }}>
            {children}
            <button className={styles.close} onClick={onClose}>
              <Icon name="close" size="24" />
            </button>
          </OutsideClickHandler>
        </div>
      </div>
    ),
    document.body
  );
};

export default Modal;
