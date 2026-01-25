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
        />
      </div>
    </Modal>
  );
};

export default MobileFilterModal;

