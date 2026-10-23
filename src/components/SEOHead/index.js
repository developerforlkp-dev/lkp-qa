import React from "react";
import { Helmet } from "react-helmet";

const DEFAULT_SITE_NAME = "Little Known Planet";
const DEFAULT_DOMAIN = "https://littleknownplanet.com";
const DEFAULT_OG_IMAGE = "https://littleknownplanet.com/images/default-og.jpg";

/**
 * Universal SEO & AEO & GEO metadata component.
 * Fallbacks safely to actual item details if custom SEO fields are not provided by admin.
 */
export default function SEOHead({
  seoSlug,
  seoTitle,
  seoDescription,
  fallbackTitle = "",
  fallbackDescription = "",
  fallbackId = "",
  category = "places", // "places" | "stays" | "events" | "experiences" | "food"
  image = "",
  location = "",
  schema = null,
  schemas = [],
}) {
  // 1. Resolve Final Title (Prioritize admin seoTitle, then fallbackTitle + brand)
  const resolvedTitle = seoTitle?.trim()
    ? seoTitle.trim()
    : fallbackTitle?.trim()
    ? `${fallbackTitle.trim()} | ${DEFAULT_SITE_NAME}`
    : DEFAULT_SITE_NAME;

  // 2. Resolve Final Description (Admin seoDescription, or clean excerpt of listing description)
  let resolvedDescription = seoDescription?.trim();
  if (!resolvedDescription) {
    if (fallbackDescription) {
      // Strip HTML tags and limit to 155 chars
      resolvedDescription = fallbackDescription
        .replace(/<[^>]*>?/gm, "")
        .replace(/\s+/g, " ")
        .slice(0, 155)
        .trim();
      if (fallbackDescription.length > 155) {
        resolvedDescription += "...";
      }
    } else {
      resolvedDescription = "Discover unique stays, hidden gems, scenic places and experiences on Little Known Planet.";
    }
  }

  // 3. Resolve Clean Canonical URL
  const pathSegment = category ? `/${category}` : "";
  const identifier = seoSlug?.trim() || fallbackId || "";
  const canonicalUrl = identifier
    ? `${DEFAULT_DOMAIN}${pathSegment}/${identifier}`
    : `${DEFAULT_DOMAIN}${pathSegment}`;

  // 4. Resolve Image
  const resolvedImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph (Facebook, WhatsApp, LinkedIn, iMessage) */}
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* AEO / GEO Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      {Array.isArray(schemas) && schemas.filter(Boolean).map((s, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
