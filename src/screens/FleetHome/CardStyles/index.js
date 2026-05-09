import React from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import Card from "../../../components/Card";
import BrowseItem from "../../../components/Browse/Item";
import DestinationCard from "../DestinationCard";
import Destination from "../../../components/Destination";
import HorizontalScroll from "../../../components/HorizontalScroll";
import styles from "../FleetHome.module.sass";
import { buildExperienceUrl } from "../../../utils/experienceUrl";

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
  return (
    listing.listingId ??
    listing.listing_id ??
    listing.experienceId ??
    listing.experience_id ??
    listing.eventId ??
    listing.event_id ??
    listing.stayId ??
    listing.stay_id ??
    listing.propertyId ??
    listing.property_id ??
    listing.foodMenuId ??
    listing.food_menu_id ??
    listing.placeId ??
    listing.place_id ??
    listing.id ??
    listing._id
  );
};

const getEntityType = (listing) => {
  if (!listing || typeof listing !== "object") return "experience";

  // Prefer explicit IDs first
  if (listing.eventId != null || listing.event_id != null) return "event";
  if (listing.stayId != null || listing.stay_id != null || listing.propertyId != null || listing.property_id != null) return "stay";
  if (listing.foodMenuId != null || listing.food_menu_id != null) return "food";
  if (listing.placeId != null || listing.place_id != null) return "place";

  // Fallback to interest/category hints from search APIs
  const hint = String(
    listing.businessInterestCode ??
    listing.businessInterest ??
    listing.interestCode ??
    listing.categoryCode ??
    ""
  ).toUpperCase();

  if (hint.includes("EVENT")) return "event";
  if (hint.includes("STAY")) return "stay";
  if (hint.includes("FOOD")) return "food";
  if (hint.includes("PLACE")) return "place";
  return "experience";
};

const getEntityIdByType = (listing, entityType) => {
  if (!listing || typeof listing !== "object") return undefined;

  if (entityType === "event") {
    return listing.eventId ?? listing.event_id ?? listing.id ?? listing._id;
  }
  if (entityType === "stay") {
    return listing.stayId ?? listing.stay_id ?? listing.propertyId ?? listing.property_id ?? listing.id ?? listing._id;
  }
  if (entityType === "food") {
    return listing.foodMenuId ?? listing.food_menu_id ?? listing.id ?? listing._id;
  }
  if (entityType === "place") {
    return listing.placeId ?? listing.place_id ?? listing.id ?? listing._id;
  }
  // experience
  return listing.listingId ?? listing.listing_id ?? listing.experienceId ?? listing.experience_id ?? listing.id ?? listing._id;
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
  if (listing?.isCategoryCard) {
    const businessInterestId = listing?.businessInterestId ?? listing?.sectionBusinessInterestId;
    const businessInterest = listing?.businessInterest || "EXPERIENCE";
    const categoryType = listing?.categoryType || "Primary Category";
    const normalizedCategoryType = String(categoryType).toUpperCase();
    const shouldUseId =
      normalizedCategoryType.includes("PRIMARY") || normalizedCategoryType.includes("SUB");

    const categoryValue = shouldUseId
      ? (listing?.categoryId ?? listing?.id ?? listing?.listingId ?? listing?.title)
      : (listing?.title ?? listing?.categoryName ?? "");

    const params = new URLSearchParams();
    if (businessInterest) params.set("businessInterest", businessInterest);
    if (businessInterestId != null) params.set("businessInterestId", String(businessInterestId));
    if (categoryType) params.set("categoryType", categoryType);
    if (categoryValue != null && String(categoryValue).trim()) {
      params.set("categoryValues", String(categoryValue));
    }
    if (listing?.title) params.set("selectedCategoryLabel", listing.title);

    return `/listings?${params.toString()}`;
  }

  if (!listing || typeof listing !== "object") return buildExperienceUrl("experience", id);
  const entityType = getEntityType(listing);
  const resolvedId = getEntityIdByType(listing, entityType) ?? id;

  if (entityType === "event") return resolvedId != null ? `/event?id=${resolvedId}` : "/events";
  if (entityType === "stay") return resolvedId != null ? `/stay-details?id=${resolvedId}` : "/stays";
  if (entityType === "food") return resolvedId != null ? `/food-details?id=${resolvedId}` : "/food";
  if (entityType === "place") return resolvedId != null ? `/place-details?id=${resolvedId}` : "/places";

  return buildExperienceUrl(listing.title || "experience", resolvedId);
};

// Transform API listing to Card component format
const transformListingToCard = (listing, section) => {
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
    url: getEntityUrl(listing, id, section),
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
const transformListingToBrowse = (listing, section) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Listing",
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id, section),
    categoryText: null, // Remove location/address from carousel cards
    category: null,
    counter: listing.totalReviews || 0,
  };
};

// Transform API listing to DestinationCard format
const transformListingToDestination = (listing, section) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Destination",
    location: null, // Remove location/address from destination cards
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id, section),
  };
};

// Transform API listing to Destination component format (for horizontal rectangular cards)
const transformListingToDestinationHorizontal = (listing, section) => {
  const id = getEntityId(listing);
  const coverPhotoUrl = formatImageUrl(getEntityImageUrl(listing));

  return {
    id: `listing-${id}`,
    listingId: id,
    title: listing.title || listing.propertyName || listing.menuName || listing.placeName || "Destination",
    content: "", // Not displayed - matches other card styles
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getEntityUrl(listing, id, section),
    categoryText: null, // Optional category badge
    category: null,
  };
};

const isShowCategoriesOnly = (section) =>
  section?.displayMode === "SHOW_CATEGORIES_ONLY";

const getSectionListingsUrl = (section) => {
  const params = new URLSearchParams();

  const businessInterestId =
    section?.businessInterestId ??
    section?.business_interest_id;
  const businessInterest =
    section?.businessInterestCode ??
    section?.businessInterest ??
    "EXPERIENCE";

  if (businessInterest) params.set("businessInterest", String(businessInterest));
  if (businessInterestId != null) params.set("businessInterestId", String(businessInterestId));

  const categoryType = section?.categoryType;
  if (categoryType) {
    params.set("categoryType", String(categoryType));

    const normalizedCategoryType = String(categoryType).toUpperCase();
    const shouldUseId =
      normalizedCategoryType.includes("PRIMARY") || normalizedCategoryType.includes("SUB");

    const selectedCategories = Array.isArray(section?.selectedCategories)
      ? section.selectedCategories
      : [];

    const categoryValues = selectedCategories
      .map((category) => {
        if (!category) return null;
        if (shouldUseId) return category?.id;
        return category?.name;
      })
      .filter((value) => value != null && String(value).trim().length > 0);

    categoryValues.forEach((value) => {
      params.append("categoryValues", String(value));
    });
  }

  return `/listings?${params.toString()}`;
};

const transformCategoryToListing = (category, section) => {
  const businessInterestId =
    section?.businessInterestId ??
    section?.business_interest_id;

  const businessInterest =
    section?.businessInterestCode ??
    section?.businessInterest ??
    "EXPERIENCE";

  return {
    id: category?.id,
    listingId: category?.id,
    title: category?.name || "Category",
    imageUrl: category?.imageUrl,
    coverImageUrl: category?.imageUrl,
    coverPhotoUrl: category?.imageUrl,
    categoryText: category?.name || "Category",
    categoryId: category?.id,
    categoryName: category?.name,
    categoryType: section?.categoryType,
    sectionBusinessInterestId: businessInterestId,
    businessInterestId,
    businessInterest,
    isCategoryCard: true,
  };
};

const getRenderListings = (section, listings) => {
  if (!isShowCategoriesOnly(section)) {
    return Array.isArray(listings) ? listings : [];
  }

  const selectedCategories = Array.isArray(section?.selectedCategories)
    ? section.selectedCategories
    : [];

  return selectedCategories.map((category) => transformCategoryToListing(category, section));
};

/**
 * CARD_SQUARE_HORIZONTAL_NODETAIL - Square image cards with horizontal scrolling, no detailed info
 */
export const CardCarousel = ({ section, listings, className }) => {
  const browseItems = listings.map((listing) => transformListingToBrowse(listing, section));
  const sectionListingsUrl = getSectionListingsUrl(section);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <Link to={sectionListingsUrl} className={styles.sectionTitleLink}>
            <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
          </Link>
          {section.priceStartingFrom && (
            <div className={styles.priceStarting}>
              Starts from <span>₹{section.priceStartingFrom}</span>
            </div>
          )}
        </div>
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
  const cardItems = listings.map((listing) => transformListingToCard(listing, section));
  const sectionListingsUrl = getSectionListingsUrl(section);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <Link to={sectionListingsUrl} className={styles.sectionTitleLink}>
            <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
          </Link>
          {section.priceStartingFrom && (
            <div className={styles.priceStarting}>
              Starts from <span>₹{section.priceStartingFrom}</span>
            </div>
          )}
        </div>
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
  const destinationItems = listings.map((listing) => transformListingToDestination(listing, section));
  const sectionListingsUrl = getSectionListingsUrl(section);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <Link to={sectionListingsUrl} className={styles.sectionTitleLink}>
            <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
          </Link>
          {section.priceStartingFrom && (
            <div className={styles.priceStarting}>
              Starts from <span>₹{section.priceStartingFrom}</span>
            </div>
          )}
        </div>
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
  const destinationItems = listings.map((listing) => transformListingToDestinationHorizontal(listing, section));
  const sectionListingsUrl = getSectionListingsUrl(section);

  return (
    <section className={cn(styles.categorySection, className)}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleWrapper}>
          <Link to={sectionListingsUrl} className={styles.sectionTitleLink}>
            <h2 className={cn("h2", styles.sectionTitle)}>{section.sectionTitle}</h2>
          </Link>
          {section.priceStartingFrom && (
            <div className={styles.priceStarting}>
              Starts from <span>₹{section.priceStartingFrom}</span>
            </div>
          )}
        </div>
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
  const renderListings = getRenderListings(section, listings);

  if (!section || renderListings.length === 0) {
    return null;
  }

  // Use cardStyle exactly as provided by API (case-sensitive)
  const cardStyle = section.cardStyle || "CARD_RECT_VERTICAL_DETAIL";

  // Log section details for debugging the "Starting From" price
  console.log(`[CardStyles] 📋 Rendering Section: "${section.sectionTitle}"`);
  console.log(`[CardStyles] 💰 priceStartingFrom:`, section.priceStartingFrom);
  console.log(`[CardStyles] 🎨 Applied Card Style:`, cardStyle);
  console.log(`[CardStyles] 📦 Section Data:`, section);

  // Map API cardStyle values to component card styles (case-sensitive matching)
  // Supports both new descriptive names and old names for backward compatibility
  switch (cardStyle) {
    // New descriptive names
    case "CARD_RECT_VERTICAL_DETAIL":
      return <CardGrid section={section} listings={renderListings} className={className} />;


    case "CARD_SQUARE_HORIZONTAL_NODETAIL":
      return <CardCarousel section={section} listings={renderListings} className={className} />;


    case "CARD_OVAL_VERTICAL_NODETAIL":
      return <CardDestination section={section} listings={renderListings} className={className} />;


    case "CARD_RECT_HORIZONTAL_NODETAIL":
      return <CardDestinationHorizontal section={section} listings={renderListings} className={className} />;


    // Backward compatibility: Old names
    case "CARD_GRID":
      return <CardGrid section={section} listings={renderListings} className={className} />;


    case "CARD_CAROUSEL":
      return <CardCarousel section={section} listings={renderListings} className={className} />;


    case "CARD_LIST":
      return <CardDestination section={section} listings={renderListings} className={className} />;


    default:
      // Default to rectangular vertical detail layout
      return <CardGrid section={section} listings={renderListings} className={className} />;
  }
};

// Export helper functions for use in other components
export { transformListingToCard, transformListingToBrowse, transformListingToDestination, transformListingToDestinationHorizontal, formatImageUrl };

