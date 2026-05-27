import React from "react";
import styles from "./MobileFilterModal.module.sass";
import Modal from "../../Modal";
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
  const handleReset = () => {
    onReset();
  };

  return (
    <Modal visible={visible} onClose={onClose} outerClassName={styles.modal}>
      <div className={styles.sheet}>

        {/* Drag Handle */}
        <div className={styles.handle} />

        {/* Sticky Header */}
        <div className={styles.header}>
          <div className={styles.headerRow}>
            {/* Close */}
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close filters"
            >
              <Icon name="close" size="16" />
            </button>

            {/* Title + subtitle */}
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
              {activeFilterCount > 0 ? `Clear all` : "Clear"}
            </button>
          </div>
        </div>

        {/* Scrollable Filter Content */}
        <div className={styles.content}>
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

        {/* Sticky Footer CTA */}
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
    </Modal>
  );
};

export default MobileFilterModal;
