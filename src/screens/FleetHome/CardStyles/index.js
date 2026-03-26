import React from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import Card from "../../../components/Card";
import BrowseItem from "../../../components/Browse/Item";
import DestinationCard from "../DestinationCard";
import Destination from "../../../components/Destination";
import HorizontalScroll from "../../../components/HorizontalScroll";
import styles from "../FleetHome.module.sass";

/**
 * Card Styles Components for Homepage Sections
 * These components handle different card style layouts based on API cardStyle
 */

// Helper to format image URL from API
const formatImageUrl = (url) => {
  if (!url) return "/images/content/card-pic-13.jpg";

  // If already a full URL, check if it's an Azure blob with SAS token
  if (url.startsWith("http://") || url.startsWith("https://")) {
    // Check if it's an Azure blob storage URL
    if (url.includes("lkpleadstoragedev.blob.core.windows.net")) {
      // If URL contains SAS token query parameters (sig= indicates SAS token), allow it
      // SAS tokens provide temporary authenticated access to the blob
      if (url.includes("sig=") && url.includes("sv=")) {
        // URL has SAS token, return it as-is (it should work)
        return url;
      }
      // No SAS token, fallback to default image
      return "/images/content/card-pic-13.jpg";
    }
    // Not an Azure blob URL, return as-is
    return url;
  }

  // Skip creating Azure blob URLs without SAS tokens since they require authentication
  // Return default image instead to prevent repeated 409 errors
  if (url.includes("/") && !url.startsWith("/")) {
    // This would create an Azure blob URL which requires auth
    // Return default image instead to prevent failed requests
    return "/images/content/card-pic-13.jpg";
  }

  if (url.startsWith("/")) {
    return url;
  }

  return "/images/content/card-pic-13.jpg";
};

const getEntityId = (listing) => {
  if (!listing || typeof listing !== "object") return undefined;
  return listing.listingId ?? listing.listing_id ?? listing.eventId ?? listing.event_id ?? listing.stayId ?? listing.stay_id ?? listing.foodMenuId ?? listing.placeId ?? listing.id ?? listing._id;
};

const getEntityImageUrl = (listing) => {
  if (!listing || typeof listing !== "object") return undefined;

  const direct =
    listing.coverPhotoUrl ??
    listing.coverImageUrl ??
    listing.imageUrl ??
    listing.bannerUrl ??
    listing.thumbnailUrl;
  if (typeof direct === "string" && direct.trim().length > 0) return direct;

  const images = listing.images ?? listing.photos ?? listing.gallery;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first.trim().length > 0) return first;
    if (first && typeof first === "object") {
      const url = first.url ?? first.src ?? first.imageUrl;
      if (typeof url === "string" && url.trim().length > 0) return url;
    }
  }

  const cover = listing.coverPhoto ?? listing.coverImage;
  if (typeof cover === "string" && cover.trim().length > 0) return cover;
  if (cover && typeof cover === "object") {
    const url = cover.url ?? cover.src ?? cover.imageUrl;
    if (typeof url === "string" && url.trim().length > 0) return url;
  }

  return undefined;
};

const getEntityUrl = (listing, id) => {
  if (!listing || typeof listing !== "object") return `/experience-product?id=${id}`;
  const isEvent = listing.eventId !== undefined || listing.event_id !== undefined;
  const isStay = listing.stayId !== undefined || listing.stay_id !== undefined;
  const isFood = listing.foodMenuId !== undefined;
  const isPlace = listing.placeId !== undefined;

  if (isEvent) return `/event?id=${id}`;
  if (isStay) return `/stay-details?id=${id}`;
  if (isFood) return `/food-details?id=${id}`;
  if (isPlace) return `/place-details?id=${id}`;

  return `/experience-product?id=${id}`;
};

// Transform API listing to Card component format
const transformListingToCard = (listing) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  const price = listing.individualPrice ?? listing.startingPrice ?? 0;
  const hasPrice = price > 0;
  const priceDisplay = hasPrice ? `₹${price.toLocaleString("en-IN")}` : null;

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Listing",
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id),
    location: null, // Remove location/address from cards
    priceActual: priceDisplay, // Only show price if individualPrice exists
    hasPrice: hasPrice,
    rating: listing.averageRating ?? listing.rating ?? 0,
    reviews: listing.totalReviews ?? listing.reviewCount ?? 0,
    briefDescription: listing.briefDescription ?? listing.shortDescription,
    tags: listing.tags || [],
    host: listing.host,
    // Card component expects these optional fields
    priceOld: null,
    cost: priceDisplay, // Only show price if individualPrice exists
    options: [],
    categoryText: null,
    comment: null,
    avatar: null,
  };
};

// Transform API listing to Browse component format (for carousel)
const transformListingToBrowse = (listing) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Listing",
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id),
    categoryText: null, // Remove location/address from carousel cards
    category: null,
    counter: listing.totalReviews || 0,
  };
};

// Transform API listing to DestinationCard format
const transformListingToDestination = (listing) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Destination",
    location: null, // Remove location/address from destination cards
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id),
  };
};

// Transform API listing to Destination component format (for horizontal rectangular cards)
const transformListingToDestinationHorizontal = (listing) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Destination",
    content: "", // Not displayed - matches other card styles
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id),
    categoryText: null, // Optional category badge
    category: null,
  };
};

/**
 * CARD_SQUARE_HORIZONTAL_NODETAIL - Square image cards with horizontal scrolling, no detailed info
 */
export const CardCarousel = ({ section, listings, className }) => {
  const browseItems = listings.map(transformListingToBrowse);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <Link to="/listings" className={styles.sectionTitleLink}>
          <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
        </Link>
        {section.description && (
          <p className={styles.sectionSubtitle}>{section.description}</p>
        )}
      </div>
      <div className={styles.horizontalScrollWrapper}>
        <HorizontalScroll className={styles.horizontalScroll} gap={24}>
          {browseItems.map((item) => (
            <BrowseItem
              className={styles.browseCardSquare}
              item={item}
              key={item.id}
            />
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
};

/**
 * CARD_RECT_VERTICAL_DETAIL - Rectangular vertical cards with detailed information
 */
export const CardGrid = ({ section, listings, className }) => {
  const cardItems = listings.map(transformListingToCard);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <Link to="/listings" className={styles.sectionTitleLink}>
          <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
        </Link>
        {section.description && (
          <p className={styles.sectionSubtitle}>{section.description}</p>
        )}
      </div>
      <div className={styles.horizontalScrollWrapper}>
        <HorizontalScroll className={styles.horizontalScroll} gap={24}>
          {cardItems.map((item) => (
            <Card className={styles.gridCardHorizontal} item={item} key={item.id} />
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
};

/**
 * CARD_OVAL_VERTICAL_NODETAIL - Oval/circular image cards with vertical layout, minimal details
 */
export const CardDestination = ({ section, listings, className }) => {
  const destinationItems = listings.map(transformListingToDestination);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <Link to="/listings" className={styles.sectionTitleLink}>
          <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
        </Link>
        {section.description && (
          <p className={styles.sectionSubtitle}>{section.description}</p>
        )}
      </div>
      <div className={styles.horizontalScrollWrapper}>
        <HorizontalScroll className={styles.horizontalScroll} gap={24}>
          {destinationItems.map((item) => (
            <DestinationCard
              className={styles.destinationCard}
              item={item}
              key={item.id}
            />
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
};

/**
 * CARD_RECT_HORIZONTAL_NODETAIL - Rectangular horizontal cards with image, title, and content, no detailed info
 */
export const CardDestinationHorizontal = ({ section, listings, className }) => {
  const destinationItems = listings.map(transformListingToDestinationHorizontal);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <Link to="/listings" className={styles.sectionTitleLink}>
          <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
        </Link>
        {section.description && (
          <p className={styles.sectionSubtitle}>{section.description}</p>
        )}
      </div>
      <div className={styles.horizontalScrollWrapper}>
        <HorizontalScroll className={styles.horizontalScroll} gap={24}>
          {destinationItems.map((item) => (
            <Destination
              className={styles.destinationCardHorizontal}
              item={item}
              key={item.id}
            />
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
};

/**
 * Main component that renders the appropriate card style based on cardStyle prop
 * Maps API cardStyle values (uppercase format) to frontend card components:
 * - "CARD_RECT_VERTICAL_DETAIL" → CardGrid component (rectangular vertical cards with details)
 * - "CARD_SQUARE_HORIZONTAL_NODETAIL" → CardCarousel component (square image cards, no details)
 * - "CARD_OVAL_VERTICAL_NODETAIL" → CardDestination component (oval/circular cards, minimal details)
 * - "CARD_RECT_HORIZONTAL_NODETAIL" → CardDestinationHorizontal component (rectangular horizontal cards, no details)
 * 
 * Backward compatibility: Also supports old names:
 * - "CARD_GRID" → CARD_RECT_VERTICAL_DETAIL
 * - "CARD_CAROUSEL" → CARD_SQUARE_HORIZONTAL_NODETAIL
 * - "CARD_LIST" → CARD_OVAL_VERTICAL_NODETAIL
 */
export const HomepageSectionCard = ({ section, listings, className }) => {
  if (!section || !listings || listings.length === 0) {
    return null;
  }

  // Use cardStyle exactly as provided by API (case-sensitive)
  const cardStyle = section.cardStyle || "CARD_RECT_VERTICAL_DETAIL";

  // Log section card style for debugging
  console.log(`📋 Section: "${section.sectionTitle}" → Card Style: ${cardStyle}`);

  // Map API cardStyle values to component card styles (case-sensitive matching)
  // Supports both new descriptive names and old names for backward compatibility
  switch (cardStyle) {
    // New descriptive names
    case "CARD_RECT_VERTICAL_DETAIL":
      return <CardGrid section={section} listings={listings} className={className} />;


    case "CARD_SQUARE_HORIZONTAL_NODETAIL":
      return <CardCarousel section={section} listings={listings} className={className} />;


    case "CARD_OVAL_VERTICAL_NODETAIL":
      return <CardDestination section={section} listings={listings} className={className} />;


    case "CARD_RECT_HORIZONTAL_NODETAIL":
      return <CardDestinationHorizontal section={section} listings={listings} className={className} />;


    // Backward compatibility: Old names
    case "CARD_GRID":
      return <CardGrid section={section} listings={listings} className={className} />;


    case "CARD_CAROUSEL":
      return <CardCarousel section={section} listings={listings} className={className} />;


    case "CARD_LIST":
      return <CardDestination section={section} listings={listings} className={className} />;


    default:
      // Default to rectangular vertical detail layout
      return <CardGrid section={section} listings={listings} className={className} />;
  }
};

// Export helper functions for use in other components
export { transformListingToCard, transformListingToBrowse, transformListingToDestination, transformListingToDestinationHorizontal, formatImageUrl };

