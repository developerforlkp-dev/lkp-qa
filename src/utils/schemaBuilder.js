/**
 * JSON-LD Schema Generator for SEO, AEO, and GEO.
 * Conforms to schema.org standards for Rich Snippets and AI Answer Engines.
 */

const DEFAULT_DOMAIN = "https://littleknownplanet.com";
const ORGANIZATION = {
  "@type": "Organization",
  "name": "Little Known Planet",
  "url": DEFAULT_DOMAIN,
  "logo": {
    "@type": "ImageObject",
    "url": `${DEFAULT_DOMAIN}/images/logo.png`
  }
};

/**
 * 1. Tourist Attraction / Place Schema
 */
export const buildPlaceSchema = ({
  name,
  description,
  url,
  images = [],
  location,
  latitude,
  longitude,
  openingHours,
  entryFee,
  rating,
  reviewCount,
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "name": name,
    "description": description,
    "url": url,
    "provider": ORGANIZATION,
    "publicAccess": true,
  };

  if (images && images.length) {
    schema.image = images;
  }

  if (entryFee !== undefined && entryFee !== null) {
    const isFree = entryFee === 0 || String(entryFee).toLowerCase().includes("free");
    schema.isAccessibleForFree = isFree;
    if (!isFree) {
      schema.offers = {
        "@type": "Offer",
        "price": String(entryFee).replace(/[^0-9.]/g, "") || "0",
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock"
      };
    }
  }

  if (openingHours) {
    schema.openingHours = openingHours;
  }

  if (location || latitude || longitude) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": location || "India",
      "addressCountry": "IN"
    };
    if (latitude && longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": Number(latitude),
        "longitude": Number(longitude)
      };
    }
  }

  if (rating && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(rating),
      "reviewCount": String(reviewCount),
      "bestRating": "5"
    };
  }

  return schema;
};

/**
 * 2. Lodging / Stay Schema (Hotels, Villas, Homestays)
 */
export const buildStaySchema = ({
  name,
  description,
  url,
  images = [],
  location,
  latitude,
  longitude,
  price,
  priceCurrency = "INR",
  amenities = [],
  checkinTime,
  checkoutTime,
  rating,
  reviewCount,
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": name,
    "description": description,
    "url": url,
    "provider": ORGANIZATION,
  };

  if (images && images.length) {
    schema.image = images;
  }

  if (price) {
    schema.priceRange = `₹${price}`;
    schema.makesOffer = {
      "@type": "Offer",
      "price": String(price),
      "priceCurrency": priceCurrency,
      "availability": "https://schema.org/InStock"
    };
  }

  if (location || latitude || longitude) {
    schema.address = {
      "@type": "PostalAddress",
      "addressLocality": location || "India",
      "addressCountry": "IN"
    };
    if (latitude && longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        "latitude": Number(latitude),
        "longitude": Number(longitude)
      };
    }
  }

  if (amenities && amenities.length) {
    schema.amenityFeature = amenities.map((item) => ({
      "@type": "LocationFeatureSpecification",
      "name": typeof item === "string" ? item : item.name,
      "value": true
    }));
  }

  if (checkinTime) schema.checkinTime = checkinTime;
  if (checkoutTime) schema.checkoutTime = checkoutTime;

  if (rating && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(rating),
      "reviewCount": String(reviewCount),
      "bestRating": "5"
    };
  }

  return schema;
};

/**
 * 3. Event Schema (Festivals, Gatherings, Camps)
 */
export const buildEventSchema = ({
  name,
  description,
  url,
  images = [],
  startDate,
  endDate,
  locationName,
  locationAddress,
  price,
  priceCurrency = "INR",
  performer,
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": name,
    "description": description,
    "url": url,
    "organizer": ORGANIZATION,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  };

  if (images && images.length) schema.image = images;
  if (startDate) schema.startDate = startDate;
  if (endDate) schema.endDate = endDate;

  schema.location = {
    "@type": "Place",
    "name": locationName || "Location TBA",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": locationAddress || locationName || "India",
      "addressCountry": "IN"
    }
  };

  if (price !== undefined && price !== null) {
    schema.offers = {
      "@type": "Offer",
      "url": url,
      "price": String(price),
      "priceCurrency": priceCurrency,
      "availability": "https://schema.org/InStock"
    };
  }

  if (performer) {
    schema.performer = {
      "@type": "Person",
      "name": performer
    };
  }

  return schema;
};

/**
 * 4. FAQ Schema for AEO (Perplexity, SearchGPT, Google AI Overview)
 */
export const buildFaqSchema = (faqs = []) => {
  if (!faqs || !faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question || faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer || faq.a
      }
    }))
  };
};

/**
 * 5. BreadcrumbList Schema (Hierarchy in Google Search Results)
 */
export const buildBreadcrumbSchema = (crumbs = []) => {
  if (!crumbs || !crumbs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url ? (crumb.url.startsWith("http") ? crumb.url : `${DEFAULT_DOMAIN}${crumb.url}`) : undefined
    }))
  };
};
