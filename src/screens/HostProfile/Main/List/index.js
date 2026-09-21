import React, { useMemo, useState, useEffect } from "react";
import cn from "classnames";
import styles from "./List.module.sass";
import Card from "../../../../components/Card";
import { buildExperienceUrl } from "../../../../utils/experienceUrl";

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("data:")) return url;
  if (url.includes("/") && !url.startsWith("/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  if (url.startsWith("/")) return url;
  return null;
};

const hasRenderableCover = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/")) return true;
  if (url.startsWith("data:")) return true;
  if (!(url.startsWith("http://") || url.startsWith("https://"))) return false;
  if (!url.includes("lkpleadstoragedev.blob.core.windows.net")) return true;
  return url.includes("sig=") && url.includes("sv=");
};

const getIdByType = (listing, type) => {
  const commonId = listing?.itemId ?? listing?.id ?? listing?._id;
  if (type === "events") return listing?.eventId ?? listing?.event_id ?? commonId;
  if (type === "stays") return listing?.stayId ?? listing?.stay_id ?? commonId;
  if (type === "places") return listing?.placeId ?? listing?.place_id ?? commonId;
  if (type === "foodMenus") return listing?.foodMenuId ?? listing?.food_menu_id ?? commonId;
  return listing?.experienceId ?? listing?.listingId ?? listing?.listing_id ?? commonId;
};

const getTitleByType = (listing, type) => {
  if (type === "stays") return listing?.propertyName || listing?.title || "Stay";
  if (type === "places") return listing?.placeName || listing?.title || "Place";
  if (type === "foodMenus") return listing?.menuName || listing?.title || "Food Menu";
  return listing?.title || "Listing";
};

const getPriceByType = (listing) => (
  listing?.individualPrice ?? listing?.startingPrice ?? listing?.price ?? 0
);

const getUrlByType = (listing, type) => {
  const id = getIdByType(listing, type);
  if (!id && id !== 0) return "/listings";
  if (type === "events") return `/event?id=${id}`;
  if (type === "stays") return `/stay-details?id=${id}`;
  if (type === "places") return `/place-details?id=${id}`;
  if (type === "foodMenus") return `/food-details?id=${id}`;
  return buildExperienceUrl(getTitleByType(listing, type), id);
};

const transformListingToCard = (listing, type, index) => {
  const rawId = getIdByType(listing, type);
  const id = (rawId !== undefined && rawId !== null) ? rawId : `idx-${index}`;
  const rawCover =
    listing?.coverImageUrl ||
    listing?.coverPhotoUrl ||
    listing?.cover_image_url ||
    listing?.cover_photo_url ||
    listing?.imageUrl ||
    listing?.image ||
    listing?.thumbnailUrl ||
    listing?.photoUrl ||
    (Array.isArray(listing?.images) && listing.images[0]) ||
    (Array.isArray(listing?.photos) && listing.photos[0]);

  const formattedCover = formatImageUrl(rawCover);
  const coverPhotoUrl = hasRenderableCover(formattedCover)
    ? formattedCover
    : (formattedCover || "/images/content/card-pic-1.jpg");

  const location = [listing?.location, listing?.state, listing?.country]
    .filter(Boolean)
    .join(", ");

  const price = Number(getPriceByType(listing)) || 0;
  const hasPrice = price > 0;
  const priceDisplay = hasPrice ? `₹${price.toLocaleString("en-IN")}` : null;

  const itemTypeMap = {
    events: "event",
    stays: "stay",
    places: "place",
    foodMenus: "food",
    experiences: "listing",
  };
  const itemType = itemTypeMap[type] || "listing";

  const isClosed =
    String(listing?.badge || "").trim().toLowerCase() === "closed" ||
    listing?.isClosed === true ||
    String(listing?.status || "").trim().toLowerCase() === "closed";

  return {
    id: `${type}-${id}`,
    listingId: id,
    itemId: id,
    itemType,
    badge: listing?.badge || (isClosed ? "closed" : null),
    isClosed,
    title: getTitleByType(listing, type),
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getUrlByType(listing, type),
    location,
    priceActual: priceDisplay,
    hasPrice,
    rating: Number(listing?.averageRating ?? listing?.rating ?? 0),
    reviews: Number(listing?.totalReviews ?? listing?.reviewCount ?? listing?.numberOfReviews ?? listing?.reviews ?? 0),
    briefDescription: listing?.description || listing?.briefDescription,
    priceOld: null,
    cost: priceDisplay,
    options: [],
    categoryText: null,
    comment: null,
    avatar: null,
  };
};

const tabs = [
  { key: "experiences", title: "Experiences" },
  { key: "events", title: "Events" },
  { key: "stays", title: "Stays" },
  { key: "places", title: "Places" },
  { key: "foodMenus", title: "Food" },
];

const List = ({ className, listingsByType = {}, hostName = "Host" }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-switch to first non-empty category tab when listings load
  useEffect(() => {
    const firstNonEmptyIndex = tabs.findIndex(
      (tab) => Array.isArray(listingsByType?.[tab.key]) && listingsByType[tab.key].length > 0
    );
    if (firstNonEmptyIndex !== -1) {
      setActiveIndex((current) => {
        const currentHasListings =
          Array.isArray(listingsByType?.[tabs[current]?.key]) &&
          listingsByType[tabs[current]?.key].length > 0;
        return currentHasListings ? current : firstNonEmptyIndex;
      });
    }
  }, [listingsByType]);

  const activeTab = tabs[activeIndex] || tabs[0];
  const activeRawListings = Array.isArray(listingsByType?.[activeTab.key])
    ? listingsByType[activeTab.key]
    : [];

  const transformedListings = useMemo(
    () => activeRawListings
      .map((listing, index) => transformListingToCard(listing, activeTab.key, index))
      .filter(Boolean),
    [activeRawListings, activeTab.key]
  );

  return (
    <div className={cn(className, styles.list)}>
      <div className={styles.title}>{hostName}'s listings</div>
      <div className={styles.nav}>
        {tabs.map((tab, index) => {
          const count = Array.isArray(listingsByType?.[tab.key]) ? listingsByType[tab.key].length : 0;
          return (
            <button
              className={cn(styles.link, { [styles.active]: index === activeIndex })}
              onClick={() => setActiveIndex(index)}
              key={tab.key}
            >
              {tab.title}{count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>
      <div className={styles.wrapper}>
        {transformedListings.length > 0 ? (
          <div className={styles.grid}>
            {transformedListings.map((item) => (
              <Card className={styles.card} item={item} key={item.id} hideWishlist={true} hidePrice={isMobile} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>No {activeTab.title.toLowerCase()} available</div>
        )}
      </div>
    </div>
  );
};

export default List;


