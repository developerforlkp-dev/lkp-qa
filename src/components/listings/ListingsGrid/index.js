import React from "react";
import cn from "classnames";
import styles from "./ListingsGrid.module.sass";
import Card from "../../Card";
import Loader from "../../Loader";
import Icon from "../../Icon";
import { transformListingToCard } from "../../../screens/FleetHome/CardStyles";

// Skeleton Card Component
const SkeletonCard = () => {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonPreview}></div>
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine}></div>
        <div className={styles.skeletonLine} style={{ width: "60%" }}></div>
        <div className={styles.skeletonLine} style={{ width: "40%", marginTop: "16px" }}></div>
      </div>
    </div>
  );
};

const ListingsGrid = ({ listings, loading, error, hasMore, onLoadMore, emptyMessage = "No listings found. Try adjusting your filters." }) => {
  if (error) {
    return (
      <div className={styles.error}>
        <Icon name="alert-circle" size="48" />
        <p>Failed to load listings. Please try again.</p>
        <button className={cn("button", styles.retryButton)} onClick={onLoadMore}>
          Retry
        </button>
      </div>
    );
  }

  if (loading && listings.length === 0) {
    return (
      <div className={styles.grid}>
        {[...Array(6)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon name="search" size="48" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const cardItems = listings.map(transformListingToCard);

  return (
    <>
      <div className={styles.grid}>
        {cardItems.map((item) => (
          <Card className={styles.gridCard} item={item} key={item.id} />
        ))}
      </div>
      
      {loading && listings.length > 0 && (
        <div className={styles.loadingMore}>
          <Loader />
          <span>Loading more listings...</span>
        </div>
      )}
      
      {hasMore && !loading && (
        <div className={styles.loadMore}>
          <button className={cn("button-stroke", styles.loadMoreButton)} onClick={onLoadMore}>
            <Loader className={styles.loader} />
            <span>Show more</span>
          </button>
        </div>
      )}
    </>
  );
};

export default ListingsGrid;
