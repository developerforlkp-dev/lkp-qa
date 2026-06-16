import React from "react";
import styles from "./LoadingSkeleton.module.sass";

/**
 * LoadingSkeleton — A reusable shimmer skeleton loader component.
 *
 * Variants:
 *   "homepage"  — Hero + card grid sections (FleetHome)
 *   "bookings"  — Booking list with tabs and cards
 *   "detail"    — Booking detail / view-details page
 *   "host"      — Host profile page
 *   "reviews"   — Reviews listing page
 *   "stay"      — Stay product page
 *   "completed" — Completed orders inside bookings tab
 *   "cards"     — Just a row of card skeletons (generic)
 *
 * Props:
 *   variant  — string (default "homepage")
 *   count    — number of repeating items (cards/bookings/reviews)
 *   sections — number of homepage sections to show (default 3)
 */

// ─── Individual skeleton elements ─────────────────────────────────────────────

const SkeletonCard = () => (
  <div className={styles.cardSkeleton}>
    <div className={styles.cardImage} />
    <div className={styles.cardBody}>
      <div className={styles.cardLine} />
      <div className={styles.cardLine} />
      <div className={styles.cardLine} />
    </div>
  </div>
);

const SkeletonSection = ({ cardCount = 4 }) => (
  <div className={styles.sectionSkeleton}>
    <div className={styles.sectionHeader}>
      <div className={styles.sectionTitleBar} />
      <div className={styles.sectionSubtitleBar} />
    </div>
    <div className={styles.cardsRow}>
      {Array.from({ length: cardCount }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

const SkeletonBookingCard = () => (
  <div className={styles.bookingCardSkeleton}>
    <div className={styles.bookingCardImage} />
    <div className={styles.bookingCardBody}>
      <div className={styles.bookingMeta}>
        <div className={styles.bookingMetaChip} />
        <div className={styles.bookingMetaChip} />
        <div className={styles.bookingMetaChip} />
      </div>
      <div className={styles.bookingCardTitle} />
      <div className={styles.bookingCardLine} />
      <div className={styles.bookingCardLine} />
      <div className={styles.bookingActions}>
        <div className={styles.bookingActionBtn} />
        <div className={styles.bookingActionBtn} />
      </div>
    </div>
  </div>
);

const SkeletonReviewItem = () => (
  <div className={styles.reviewItem}>
    <div className={styles.reviewAvatar} />
    <div className={styles.reviewBody}>
      <div className={styles.reviewName} />
      <div className={styles.reviewStars} />
      <div className={styles.reviewText} />
      <div className={styles.reviewText} />
    </div>
  </div>
);

// ─── Variant renderers ────────────────────────────────────────────────────────

const HomepageSkeleton = ({ sections = 3, cardCount = 4 }) => (
  <div className={styles.homepageSkeleton}>
    {Array.from({ length: sections }).map((_, i) => (
      <SkeletonSection key={i} cardCount={cardCount} />
    ))}
  </div>
);

const BookingsSkeleton = ({ count = 3 }) => (
  <div className={styles.bookingsSkeleton}>
    <div className={styles.bookingsHeader}>
      <div className={styles.bookingsBackBtn} />
      <div className={styles.bookingsTitle} />
    </div>
    <div className={styles.bookingsTabs}>
      <div className={styles.bookingsTabItem} />
      <div className={styles.bookingsTabItem} />
      <div className={styles.bookingsTabItem} />
    </div>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBookingCard key={i} />
    ))}
  </div>
);

const DetailSkeleton = () => (
  <div className={styles.detailSkeleton}>
    <div className={styles.detailBackBtn} />
    <div className={styles.detailTitle} />
    <div className={styles.detailRating} />
    <div className={styles.detailBanner} />
    <div className={styles.detailGrid}>
      <div className={styles.detailCard}>
        <div className={styles.detailCardTitle} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div className={styles.detailCardRow} key={i}>
            <div className={styles.detailCardLabel} />
            <div className={styles.detailCardValue} />
          </div>
        ))}
      </div>
      <div className={styles.detailCard}>
        <div className={styles.detailCardTitle} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div className={styles.detailCardRow} key={i}>
            <div className={styles.detailCardLabel} />
            <div className={styles.detailCardValue} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HostSkeleton = () => (
  <div className={styles.hostSkeleton}>
    <div className={styles.hostAvatar} />
    <div className={styles.hostName} />
    <div className={styles.hostBio} />
    <div className={styles.hostCards}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

const ReviewsSkeleton = ({ count = 4 }) => (
  <div className={styles.reviewsSkeleton}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonReviewItem key={i} />
    ))}
  </div>
);

const StaySkeleton = () => (
  <div className={styles.staySkeleton}>
    <div className={styles.stayHeader}>
      <div>
        <div className={styles.stayTitle} />
        <div className={styles.staySubtitle} />
      </div>
    </div>
    <div className={styles.stayGallery}>
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
    <div className={styles.stayContentGrid}>
      <div className={styles.stayMainContent}>
        <div className={styles.stayTabsBar}>
          <div className={styles.stayTabItem} />
          <div className={styles.stayTabItem} />
          <div className={styles.stayTabItem} />
        </div>
        <div className={styles.stayParagraph}>
          <div className={styles.stayTextLine} />
          <div className={styles.stayTextLine} />
          <div className={styles.stayTextLine} />
          <div className={styles.stayTextLine} />
        </div>
        <div className={styles.stayParagraph}>
          <div className={styles.stayTextLine} />
          <div className={styles.stayTextLine} />
          <div className={styles.stayTextLine} />
        </div>
      </div>
      <div className={styles.staySidebar}>
        <div className={styles.staySidebarPrice} />
        <div className={styles.staySidebarField} />
        <div className={styles.staySidebarField} />
        <div className={styles.staySidebarField} />
        <div className={styles.staySidebarBtn} />
      </div>
    </div>
  </div>
);

const CompletedSkeleton = ({ count = 3 }) => (
  <div className={styles.completedSkeleton}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBookingCard key={i} />
    ))}
  </div>
);

const CardsSkeleton = ({ count = 4 }) => (
  <div className={styles.homepageSkeleton}>
    <div className={styles.cardsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const LoadingSkeleton = ({ variant = "homepage", count, sections }) => {
  const renderVariant = () => {
    switch (variant) {
      case "homepage":
        return <HomepageSkeleton sections={sections || 3} cardCount={count || 4} />;
      case "bookings":
        return <BookingsSkeleton count={count || 3} />;
      case "detail":
        return <DetailSkeleton />;
      case "host":
        return <HostSkeleton />;
      case "reviews":
        return <ReviewsSkeleton count={count || 4} />;
      case "stay":
        return <StaySkeleton />;
      case "completed":
        return <CompletedSkeleton count={count || 3} />;
      case "cards":
        return <CardsSkeleton count={count || 4} />;
      default:
        return <HomepageSkeleton sections={sections || 3} cardCount={count || 4} />;
    }
  };

  return <div className={styles.container}>{renderVariant()}</div>;
};

export default LoadingSkeleton;
