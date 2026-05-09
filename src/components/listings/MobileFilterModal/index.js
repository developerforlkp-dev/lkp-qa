import React from "react";
import styles from "./MobileFilterModal.module.sass";
import Modal from "../../Modal";
import FilterSidebar from "../FilterSidebar";

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
}) => {
  return (
    <Modal visible={visible} onClose={onClose} outerClassName={styles.modal}>
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
        />
      </div>
    </Modal>
  );
};

export default MobileFilterModal;

