import React, { useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./ListingsGrid.module.sass";
import Card from "../../Card";
import Loader from "../../Loader";
import Icon from "../../Icon";
import { transformListingToCard } from "../../../screens/FleetHome/CardStyles";

// Redesigned horizontal split-layout list view card
const ListCard = ({ item, listing }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const defaultImage = "/images/content/card-pic-13.jpg";
  const imageSrc = item.src || defaultImage;

  const isStay = item.url && item.url.includes("stay-details");
  const isEvent = item.url && item.url.includes("event");
  const pricePeriod = isStay ? " / night" : (isEvent ? " / ticket" : " / person");

  const locationText = [
    listing?.city || listing?.locationName || listing?.location,
    listing?.state
  ].filter(Boolean).join(", ");

  const maxGuests = listing?.maxGuests || listing?.maxAdults || listing?.capacity || listing?.totalCapacity || listing?.maxSeats;

  const images = listing?.images || listing?.photos || listing?.gallery || [];
  const imagesCount = Array.isArray(images) ? images.length : 0;

  return (
    <div className={styles.listCard}>
      {/* Left side: Property Cover Image */}
      <div className={cn(styles.imageSection, { [styles.imageLoaded]: imageLoaded })}>
        <img
          src={imageSrc}
          alt={item.title || "Listing Cover"}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            if (!e.target.src.includes(defaultImage)) {
              e.target.src = defaultImage;
              e.target.onerror = null;
            }
            setImageLoaded(true);
          }}
        />
        {item.categoryText && (
          <div className={styles.categoryBadge}>{item.categoryText}</div>
        )}
        {imagesCount > 1 && (
          <div className={styles.imageBadge}>
            <Icon name="image" size="12" />
            <span>1/{imagesCount}</span>
          </div>
        )}
      </div>

      {/* Right side: Detailed structured content */}
      <div className={styles.contentSection}>
        {/* TOP: Location, ratings/reviews, title */}
        <div className={styles.topLayer}>
          <div className={styles.metaRow}>
            {locationText && <span className={styles.locationText}>{locationText}</span>}
            <div className={styles.ratingRow}>
              <Icon name="star" className={styles.starIcon} size="14" />
              {item.rating > 0 ? (
                <>
                  <span className={styles.ratingVal}>{item.rating.toFixed(1)}</span>
                  <span className={styles.reviewsCount}>({item.reviews} reviews)</span>
                </>
              ) : (
                <span className={styles.ratingVal}>New</span>
              )}
            </div>
          </div>
          <h3 className={styles.title}>{item.title}</h3>
        </div>

        {/* MIDDLE: Description, guests limit, category/tags */}
        <div className={styles.middleLayer}>
          {item.briefDescription && (
            <p className={styles.description}>{item.briefDescription}</p>
          )}
          
          <div className={styles.middleFooter}>
            {maxGuests && (
              <div className={styles.capacityInfo}>
                <Icon name="user" size="14" />
                <span>Up to {maxGuests} guest{maxGuests > 1 ? 's' : ''}</span>
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {item.tags.slice(0, 2).map((tag, idx) => {
                  const tagText = typeof tag === 'string' ? tag : (tag?.name || tag?.title);
                  return tagText ? (
                    <span className={styles.tagChip} key={idx}>{tagText}</span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM: Pricing and CTA Action button */}
        <div className={styles.bottomLayer}>
          {item.priceActual && (
            <div className={styles.priceContainer}>
              <span className={styles.priceValue}>{item.priceActual}</span>
              <span className={styles.pricePeriod}>{pricePeriod}</span>
            </div>
          )}
          
          <div className={styles.ctaButton}>
            {isStay ? "Reserve" : "View Details"}
          </div>
        </div>
      </div>
    </div>
  );
};

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

const ListingsGrid = ({ listings, loading, error, hasMore, onLoadMore, emptyMessage = "No listings found. Try adjusting your filters.", listView = false }) => {
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
      <div className={cn(styles.grid, { [styles.listGrid]: listView })}>
        {cardItems.map((item, index) => {
          const originalListing = listings[index];
          return listView ? (
            <Link to={item.url} key={item.id} className={styles.listCardLink}>
              <ListCard item={item} listing={originalListing} />
            </Link>
          ) : (
            <Card className={styles.gridCard} item={item} key={item.id} />
          );
        })}
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
            <span>Explore More</span>
          </button>
        </div>
      )}
    </>
  );
};

export default ListingsGrid;
