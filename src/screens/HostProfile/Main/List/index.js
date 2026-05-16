import React, { useMemo, useRef, useState } from "react";
import cn from "classnames";
import styles from "./List.module.sass";
import Card from "../../../../components/Card";
import Icon from "../../../../components/Icon";
import Slider from "react-slick";
import { buildExperienceUrl } from "../../../../utils/experienceUrl";

const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.includes("/") && !url.startsWith("/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  if (url.startsWith("/")) return url;
  return null;
};

const hasRenderableCover = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/")) return true;
  if (!(url.startsWith("http://") || url.startsWith("https://"))) return false;
  if (!url.includes("lkpleadstoragedev.blob.core.windows.net")) return true;
  return url.includes("sig=") && url.includes("sv=");
};

const getIdByType = (listing, type) => {
  if (type === "events") return listing?.eventId ?? listing?.event_id ?? listing?.id;
  if (type === "stays") return listing?.stayId ?? listing?.stay_id ?? listing?.id;
  if (type === "places") return listing?.placeId ?? listing?.place_id ?? listing?.id;
  if (type === "foodMenus") return listing?.foodMenuId ?? listing?.food_menu_id ?? listing?.id;
  return listing?.listingId ?? listing?.listing_id ?? listing?.id;
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

const transformListingToCard = (listing, type) => {
  const id = getIdByType(listing, type);
  const coverPhotoUrl = formatImageUrl(
    listing?.coverPhotoUrl ||
      listing?.coverImageUrl ||
      listing?.imageUrl ||
      listing?.thumbnailUrl
  );
  if (!hasRenderableCover(coverPhotoUrl)) return null;

  const location = [listing?.location, listing?.state, listing?.country]
    .filter(Boolean)
    .join(", ");

  const price = Number(getPriceByType(listing)) || 0;
  const hasPrice = price > 0;
  const priceDisplay = hasPrice ? `₹${price.toLocaleString("en-IN")}` : null;

  return {
    id: `${type}-${id}`,
    listingId: id,
    title: getTitleByType(listing, type),
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: getUrlByType(listing, type),
    location,
    priceActual: priceDisplay,
    hasPrice,
    rating: listing?.averageRating ?? listing?.rating ?? 0,
    reviews: listing?.totalReviews ?? listing?.reviewCount ?? 0,
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
  { key: "foodMenus", title: "Food Menus" },
];

const List = ({ className, listingsByType = {}, hostName = "Host" }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);
  const activeTab = tabs[activeIndex];
  const activeRawListings = Array.isArray(listingsByType?.[activeTab.key])
    ? listingsByType[activeTab.key]
    : [];

  const transformedListings = useMemo(
    () => activeRawListings
      .map((listing) => transformListingToCard(listing, activeTab.key))
      .filter(Boolean),
    [activeRawListings, activeTab.key]
  );

  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: false,
  };

  return (
    <div className={cn(className, styles.list)}>
      <div className={styles.title}>{hostName}'s listings</div>
      <div className={styles.nav}>
        {tabs.map((tab, index) => (
          <button
            className={cn(styles.link, { [styles.active]: index === activeIndex })}
            onClick={() => setActiveIndex(index)}
            key={tab.key}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className={styles.wrapper}>
        {transformedListings.length > 0 ? (
          <Slider ref={sliderRef} className="profile-slider" {...settings}>
            {transformedListings.map((item) => (
              <Card className={styles.card} item={item} key={item.id} />
            ))}
          </Slider>
        ) : (
          <div className={styles.empty}>No {activeTab.title.toLowerCase()} available</div>
        )}
      </div>
      {transformedListings.length > 0 && (
        <div className={styles.carouselNav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => sliderRef.current?.slickPrev()}
          >
            <Icon name="arrow-prev" size="16" />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => sliderRef.current?.slickNext()}
          >
            <Icon name="arrow-next" size="16" />
          </button>
        </div>
      )}
    </div>
  );
};

export default List;
