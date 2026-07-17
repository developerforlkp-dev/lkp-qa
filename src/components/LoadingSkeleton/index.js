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
 *   "experience"— Experience/Event product page
 *   "completed" — Completed orders inside bookings tab
 *   "cards"     — Just a row of card skeletons (generic)
 *
 * Props:
 *   variant  — string (default "homepage")
 *   count    — number of repeating items (cards/bookings/reviews)
 *   sections — number of homepage sections to show (default 3)
 */

// ─── Shimmer Box Primitive ────────────────────────────────────────────────────

const Shimmer = ({ className, style }) => (
  <div className={`${styles.shimmer} ${className || ""}`} style={style} />
);

// ─── Homepage Skeleton ────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className={styles.cardSkeleton}>
    <Shimmer className={styles.cardImage} />
    <div className={styles.cardBody}>
      <Shimmer className={styles.cardLine} />
      <Shimmer className={styles.cardLine} />
      <Shimmer className={styles.cardLine} />
    </div>
  </div>
);

const SkeletonSection = ({ cardCount = 4 }) => (
  <div className={styles.sectionSkeleton}>
    <div className={styles.sectionHeader}>
      <Shimmer className={styles.sectionTitleBar} />
      <Shimmer className={styles.sectionSubtitleBar} />
    </div>
    <div className={styles.cardsRow}>
      {Array.from({ length: cardCount }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

const HomepageSkeleton = ({ sections = 3, cardCount = 4 }) => (
  <div className={styles.homepageSkeleton}>
    {Array.from({ length: sections }).map((_, i) => (
      <SkeletonSection key={i} cardCount={cardCount} />
    ))}
  </div>
);

// ─── Bookings List Skeleton ───────────────────────────────────────────────────

const SkeletonBookingCard = () => (
  <div className={styles.bookingCardSkeleton}>
    <Shimmer className={styles.bookingCardImage} />
    <div className={styles.bookingCardBody}>
      <div className={styles.bookingMeta}>
        <Shimmer className={styles.bookingMetaChip} />
        <Shimmer className={styles.bookingMetaChip} />
        <Shimmer className={styles.bookingMetaChip} />
      </div>
      <Shimmer className={styles.bookingCardTitle} />
      <Shimmer className={styles.bookingCardLine} />
      <Shimmer className={styles.bookingCardLine} />
      <div className={styles.bookingActions}>
        <Shimmer className={styles.bookingActionBtn} />
        <Shimmer className={styles.bookingActionBtn} />
      </div>
    </div>
  </div>
);

// Full skeleton: title + tabs + cards — used only on initial full-page load
const BookingsSkeleton = ({ count = 3 }) => (
  <div className={styles.bookingsSkeleton}>
    <div className={styles.bookingsHeader}>
      <Shimmer className={styles.bookingsTitle} />
    </div>
    <div className={styles.bookingsTabs}>
      <Shimmer className={styles.bookingsTabItem} />
      <Shimmer className={styles.bookingsTabItem} />
      <Shimmer className={styles.bookingsTabItem} />
      <Shimmer className={styles.bookingsTabItem} />
    </div>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBookingCard key={i} />
    ))}
  </div>
);

// Lean skeleton: cards only — used inline inside the tab panel where title/tabs are already visible
const BookingsListSkeleton = ({ count = 3 }) => (
  <div className={styles.bookingsListSkeleton}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBookingCard key={i} />
    ))}
  </div>
);

const CompletedSkeleton = ({ count = 3 }) => (
  <div className={styles.bookingsListSkeleton}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonBookingCard key={i} />
    ))}
  </div>
);

// ─── Booking Detail Page Skeleton ─────────────────────────────────────────────
// Mirrors the actual ViewDetails page layout:
// [back btn] → [title] → [rating] → [banner] → [summary card grid] → [info cards]

const DetailSkeleton = () => (
  <div className={styles.detailSkeleton}>
    {/* Back button */}
    <Shimmer className={styles.detailBackBtn} />

    {/* Title */}
    <Shimmer className={styles.detailTitle} />
    <Shimmer className={styles.detailTitleShort} />

    {/* Rating row */}
    <Shimmer className={styles.detailRating} />

    {/* Full-width banner image */}
    <Shimmer className={styles.detailBanner} />

    {/* Summary card - grid of label/value pairs */}
    <div className={styles.detailSummaryCard}>
      <Shimmer className={styles.detailSummaryTitle} />
      <div className={styles.detailSummaryGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div className={styles.detailSummaryItem} key={i}>
            <Shimmer className={styles.detailSummaryLabel} />
            <Shimmer className={styles.detailSummaryValue} />
          </div>
        ))}
      </div>
    </div>

    {/* Two side-by-side detail cards */}
    <div className={styles.detailCardsRow}>
      <div className={styles.detailCard}>
        <Shimmer className={styles.detailCardTitle} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div className={styles.detailCardRow} key={i}>
            <Shimmer className={styles.detailCardLabel} />
            <Shimmer className={styles.detailCardValue} />
          </div>
        ))}
      </div>
      <div className={styles.detailCard}>
        <Shimmer className={styles.detailCardTitle} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div className={styles.detailCardRow} key={i}>
            <Shimmer className={styles.detailCardLabel} />
            <Shimmer className={styles.detailCardValue} />
          </div>
        ))}
        {/* Action buttons area */}
        <div className={styles.detailActions}>
          <Shimmer className={styles.detailActionBtn} />
          <Shimmer className={styles.detailActionBtn} />
        </div>
      </div>
    </div>
  </div>
);

// ─── Stay Product Page Skeleton ───────────────────────────────────────────────
// Mirrors: title/subtitle → gallery grid → content+sidebar layout

const StaySkeleton = () => (
  <div className={styles.staySkeleton}>
    <div className={styles.stayHeader}>
      <div>
        <Shimmer className={styles.stayTitle} />
        <Shimmer className={styles.staySubtitle} />
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
          <Shimmer className={styles.stayTabItem} />
          <Shimmer className={styles.stayTabItem} />
          <Shimmer className={styles.stayTabItem} />
        </div>
        <div className={styles.stayParagraph}>
          <Shimmer className={styles.stayTextLine} />
          <Shimmer className={styles.stayTextLine} />
          <Shimmer className={styles.stayTextLine} />
          <Shimmer className={styles.stayTextLine} />
        </div>
        <div className={styles.stayParagraph}>
          <Shimmer className={styles.stayTextLine} />
          <Shimmer className={styles.stayTextLine} />
          <Shimmer className={styles.stayTextLine} />
        </div>
      </div>
      <div className={styles.staySidebar}>
        <Shimmer className={styles.staySidebarPrice} />
        <Shimmer className={styles.staySidebarField} />
        <Shimmer className={styles.staySidebarField} />
        <Shimmer className={styles.staySidebarField} />
        <Shimmer className={styles.staySidebarBtn} />
      </div>
    </div>
  </div>
);

// ─── Experience / Event Product Page Skeleton ─────────────────────────────────
// Mirrors: big banner/image → title + tags → content+sidebar

const ExperienceSkeleton = () => (
  <div className={styles.experienceSkeleton}>
    {/* Hero banner */}
    <Shimmer className={styles.experienceBanner} />
    <div className={styles.experienceContent}>
      {/* Left: title, tags, description */}
      <div className={styles.experienceMain}>
        <div className={styles.experienceTags}>
          <Shimmer className={styles.experienceTag} />
          <Shimmer className={styles.experienceTag} />
        </div>
        <Shimmer className={styles.experienceTitle} />
        <Shimmer className={styles.experienceRating} />
        <div className={styles.experienceParagraph}>
          <Shimmer className={styles.experienceTextLine} />
          <Shimmer className={styles.experienceTextLine} />
          <Shimmer className={styles.experienceTextLine} />
          <Shimmer className={styles.experienceTextLine} />
        </div>
        {/* Info pills row */}
        <div className={styles.experienceInfoRow}>
          <Shimmer className={styles.experienceInfoPill} />
          <Shimmer className={styles.experienceInfoPill} />
          <Shimmer className={styles.experienceInfoPill} />
        </div>
        {/* More text */}
        <div className={styles.experienceParagraph}>
          <Shimmer className={styles.experienceTextLine} />
          <Shimmer className={styles.experienceTextLine} />
          <Shimmer className={styles.experienceTextLine} />
        </div>
      </div>
      {/* Right sidebar: booking card */}
      <div className={styles.experienceSidebar}>
        <Shimmer className={styles.experienceSidebarPrice} />
        <Shimmer className={styles.experienceSidebarField} />
        <Shimmer className={styles.experienceSidebarField} />
        <Shimmer className={styles.experienceSidebarField} />
        <Shimmer className={styles.experienceSidebarBtn} />
      </div>
    </div>
  </div>
);

// ─── Host Profile Skeleton ────────────────────────────────────────────────────

const HostSkeleton = () => (
  <div className={styles.hostSkeleton}>
    <Shimmer className={styles.hostAvatar} />
    <Shimmer className={styles.hostName} />
    <Shimmer className={styles.hostBio} />
    <div className={styles.hostCards}>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// ─── Reviews Skeleton ─────────────────────────────────────────────────────────

const SkeletonReviewItem = () => (
  <div className={styles.reviewItem}>
    <Shimmer className={styles.reviewAvatar} />
    <div className={styles.reviewBody}>
      <Shimmer className={styles.reviewName} />
      <Shimmer className={styles.reviewStars} />
      <Shimmer className={styles.reviewText} />
      <Shimmer className={styles.reviewText} />
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

// ─── Cards Skeleton ───────────────────────────────────────────────────────────

const CardsSkeleton = ({ count = 4 }) => (
  <div className={styles.homepageSkeleton}>
    <div className={styles.cardsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// ─── NEW DYNAMIC SKELETONS ───────────────────────────────────────────────────

const PlaceSkeleton = () => (
  <div className={styles.placeSkeleton}>
    <Shimmer className={styles.placeHeroBanner} />
    <Shimmer className={styles.placeMarquee} />
    <div className={styles.placeContent}>
      <Shimmer className={styles.placeTitle} />
      <Shimmer className={styles.placeTextLine} />
      <Shimmer className={styles.placeTextLine} />
      <Shimmer className={styles.placeTextLine} />
    </div>
  </div>
);

const FoodSkeleton = () => (
  <div className={styles.foodSkeleton}>
    <Shimmer className={styles.foodHeroBanner} />
    <div className={styles.foodContentGrid}>
      <div className={styles.foodMainContent}>
         <Shimmer className={styles.foodTitle} />
         <Shimmer className={styles.foodTextLine} />
         <Shimmer className={styles.foodTextLine} />
         <Shimmer className={styles.foodTextLine} />
      </div>
      <div className={styles.foodSidebar}>
         <Shimmer className={styles.foodSidebarCard} />
      </div>
    </div>
  </div>
);

const EventSkeleton = () => (
  <div className={styles.eventSkeleton}>
    <Shimmer className={styles.eventHeroBanner} />
    <div className={styles.eventContentGrid}>
      <div className={styles.eventMainContent}>
         <Shimmer className={styles.eventTitle} />
         <Shimmer className={styles.eventTextLine} />
         <Shimmer className={styles.eventTextLine} />
         <Shimmer className={styles.eventTextLine} />
      </div>
      <div className={styles.eventSidebar}>
         <Shimmer className={styles.eventSidebarCard} />
      </div>
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
      case "bookingsList":
        return <BookingsListSkeleton count={count || 3} />;
      case "detail":
        return <DetailSkeleton />;
      case "host":
        return <HostSkeleton />;
      case "reviews":
        return <ReviewsSkeleton count={count || 4} />;
      case "stay":
        return <StaySkeleton />;
      case "experience":
        return <ExperienceSkeleton />;
      case "place":
        return <PlaceSkeleton />;
      case "food":
        return <FoodSkeleton />;
      case "event":
        return <EventSkeleton />;
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
