import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { disableBodyScroll, enableBodyScroll } from "body-scroll-lock";
import styles from "./MobileFilterModal.module.sass";
import FilterSidebar from "../FilterSidebar";
import Icon from "../../Icon";
import cn from "classnames";

const MobileFilterModal = ({
  visible,
  onClose,
  filters,
  onFilterChange,
  onReset,
  sorting,
  setSorting,
  sortingOptions,
  businessInterest,
  businessInterestFilters,
  activeFilterCount = 0,
}) => {
  const drawerRef = useRef(null);
  const scrollContentRef = useRef(null);

  // ESC key to close
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, handleKeyDown]);

  // Body scroll lock — lock to the drawer's scrollable content area
  useEffect(() => {
    const el = scrollContentRef.current;
    if (visible && el) {
      disableBodyScroll(el, { reserveScrollBarGap: true });
    }
    return () => {
      if (el) enableBodyScroll(el);
    };
  }, [visible]);

  const handleReset = () => {
    onReset();
  };

  return createPortal(
    <>
      {/* Overlay — fade in/out */}
      <div
        className={cn(styles.overlay, { [styles.overlayVisible]: visible })}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — slides from right */}
      <div
        ref={drawerRef}
        className={cn(styles.drawer, { [styles.drawerOpen]: visible })}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        {/* ── Sticky Header ── */}
        <div className={styles.header}>
          <div className={styles.headerRow}>
            {/* Title block */}
            <div className={styles.titleBlock}>
              <h3 className={styles.title}>Filters</h3>
              {activeFilterCount > 0 && (
                <span className={styles.subtitle}>
                  {activeFilterCount} active
                </span>
              )}
            </div>

            {/* Clear All */}
            <button
              className={cn(styles.resetBtn, {
                [styles.resetBtnActive]: activeFilterCount > 0,
              })}
              onClick={handleReset}
            >
              {activeFilterCount > 0 ? "Clear all" : "Clear"}
            </button>

            {/* Close */}
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close filters"
            >
              <Icon name="close" size="16" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Filter Content ── */}
        <div className={styles.content} ref={scrollContentRef}>
          <FilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onReset}
            sorting={sorting}
            setSorting={setSorting}
            sortingOptions={sortingOptions}
            businessInterest={businessInterest}
            businessInterestFilters={businessInterestFilters}
            hideHeader
          />
        </div>

        {/* ── Sticky Footer CTA ── */}
        <div className={styles.footer}>
          <div className={styles.footerInner}>
            {activeFilterCount > 0 && (
              <span className={styles.resultCount}>
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} applied
              </span>
            )}
            <button className={styles.applyBtn} onClick={onClose}>
              Show Results
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default MobileFilterModal;
