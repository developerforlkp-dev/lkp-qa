import React, { useState, useMemo } from "react";
import cn from "classnames";
import styles from "./List.module.sass";
import Card from "../../../../components/Card";
import Icon from "../../../../components/Icon";
import Slider from "react-slick";
import { buildExperienceUrl } from "../../../../utils/experienceUrl";

// Helper to format image URL from API
const formatImageUrl = (url) => {
  if (!url) return "/images/content/card-pic-13.jpg";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.includes("/") && !url.startsWith("/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }

  if (url.startsWith("/")) {
    return url;
  }

  return "/images/content/card-pic-13.jpg";
};

// Transform API listing to Card component format
const transformListingToCard = (listing) => {
  const coverPhotoUrl = formatImageUrl(listing.coverPhotoUrl);
  const location = [listing.location, listing.state, listing.country]
    .filter(Boolean)
    .join(", ") || "";

  const price = listing.individualPrice || 0;
  const hasPrice = price > 0;
  const priceDisplay = hasPrice ? `₹${price.toLocaleString("en-IN")}` : null;

  return {
    id: `listing-${listing.listingId}`,
    listingId: listing.listingId,
    title: listing.title || "Listing",
    src: coverPhotoUrl,
    srcSet: coverPhotoUrl,
    url: buildExperienceUrl(listing.title || "experience", listing.listingId),
    location: location,
    priceActual: priceDisplay, // Only show price if individualPrice exists
    hasPrice: hasPrice,
    rating: listing.averageRating || 0,
    reviews: listing.totalReviews || 0,
    briefDescription: listing.description || listing.briefDescription,
    // Card component expects these optional fields
    priceOld: null,
    cost: priceDisplay, // Only show price if individualPrice exists
    options: [],
    categoryText: null,
    comment: null,
    avatar: null,
  };
};

const defaultLocations = [
  {
    title: "Experience",
    list: [
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$356",
        priceActual: "$267",
        categoryText: "superhost",
        rating: "4.8",
        reviews: "12",
        cost: "$200 total",
        src: "/images/content/card-pic-1.jpg",
        srcSet: "/images/content/card-pic-1@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$245",
        priceActual: "$167",
        categoryText: "superhost",
        rating: "4.9",
        reviews: "24",
        cost: "$100 total",
        src: "/images/content/card-pic-2.jpg",
        srcSet: "/images/content/card-pic-2@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$356",
        priceActual: "$267",
        categoryText: "superhost",
        rating: "5.0",
        reviews: "102",
        cost: "$333 total",
        src: "/images/content/card-pic-3.jpg",
        srcSet: "/images/content/card-pic-3@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$156",
        priceActual: "$267",
        categoryText: "superhost",
        rating: "4.5",
        reviews: "5",
        cost: "$230 total",
        src: "/images/content/card-pic-4.jpg",
        srcSet: "/images/content/card-pic-4@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
    ],
  },
  {
    title: "Experiences",
    list: [
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$245",
        priceActual: "$167",
        categoryText: "superhost",
        rating: "4.9",
        reviews: "24",
        cost: "$100 total",
        src: "/images/content/card-pic-2.jpg",
        srcSet: "/images/content/card-pic-2@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$356",
        priceActual: "$267",
        categoryText: "superhost",
        rating: "5.0",
        reviews: "102",
        cost: "$333 total",
        src: "/images/content/card-pic-3.jpg",
        srcSet: "/images/content/card-pic-3@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
      {
        title: "Entire serviced classy moutain house",
        priceOld: "$156",
        priceActual: "$267",
        categoryText: "superhost",
        rating: "4.5",
        reviews: "5",
        cost: "$230 total",
        src: "/images/content/card-pic-4.jpg",
        srcSet: "/images/content/card-pic-4@2x.jpg",
        url: "/experience-product",
        options: [
          {
            title: "Free wifi",
            icon: "modem",
          },
          {
            title: "Breakfast included",
            icon: "burger",
          },
        ],
      },
    ],
  },
];

const SlickArrow = ({ currentSlide, slideCount, children, ...props }) => (
  <button {...props}>{children}</button>
);

const List = ({ className, listings = [], hostName = "Host" }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Transform listings to card format
  const transformedListings = useMemo(() => {
    if (!Array.isArray(listings) || listings.length === 0) {
      return [];
    }
    return listings.map(transformListingToCard);
  }, [listings]);

  // Build locations array from listings
  const locations = useMemo(() => {
    if (transformedListings.length > 0) {
      return [
        {
          title: "Listings",
          list: transformedListings,
        },
      ];
    }
    return defaultLocations;
  }, [transformedListings]);

  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    nextArrow: (
      <SlickArrow>
        <Icon name="arrow-next" size="14" />
      </SlickArrow>
    ),
    prevArrow: (
      <SlickArrow>
        <Icon name="arrow-prev" size="14" />
      </SlickArrow>
    ),
  };

  // Don't show if no listings
  if (!transformedListings.length && listings.length === 0) {
    return (
      <div className={cn(className, styles.list)}>
        <div className={styles.title}>{hostName}'s listings</div>
        <div className={styles.content}>No listings available</div>
      </div>
    );
  }

  return (
    <div className={cn(className, styles.list)}>
      <div className={styles.title}>{hostName}'s listings</div>
      {locations.length > 1 && (
        <div className={styles.nav}>
          {locations.map((x, index) => (
            <button
              className={cn(styles.link, {
                [styles.active]: index === activeIndex,
              })}
              onClick={() => setActiveIndex(index)}
              key={index}
            >
              {x.title}
            </button>
          ))}
        </div>
      )}
      <div className={styles.wrapper}>
        {transformedListings.length > 0 ? (
          <Slider className="profile-slider" {...settings}>
            {transformedListings.map((x, index) => (
              <Card className={styles.card} item={x} key={x.id || index} />
            ))}
          </Slider>
        ) : (
          <div>No listings to display</div>
        )}
      </div>
    </div>
  );
};

export default List;
