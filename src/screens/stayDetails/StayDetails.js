import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";

import Product from "../../components/Product";
import Description from "../ExperienceProduct/Description";
import TabSection from "../ExperienceProduct/TabSection";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";
import Loader from "../../components/Loader";

import { browse2 } from "../../mocks/browse";
import { getStayDetails, getHost } from "../../utils/api";

// Match other details screens: accept either absolute URLs or our blob paths.
const formatImageUrl = (url) => {
  if (!url) return null;

  const raw =
    typeof url === "string"
      ? url
      : url?.url ?? url?.src ?? url?.imageUrl ?? null;

  if (!raw) return null;

  const str = String(raw).trim();
  if (!str) return null;

  if (str.startsWith("http://") || str.startsWith("https://")) return str;
  if (str.startsWith("/")) return str;

  // Keep any existing query string intact.
  const [pathPart, queryPart] = str.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/");
  const encodedPath = encodeURI(normalizedPath);

  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${
    queryPart ? `?${queryPart}` : ""
  }`;
};

const toDisplayString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      value.displayName ??
      value.name ??
      value.facilityName ??
      value.amenityName ??
      value.title ??
      value.code ??
      value.label ??
      ""
    );
  }
  return "";
};

const StayDetails = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const [stay, setStay] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!id) return;

        setLoading(true);
        const data = await getStayDetails(id);
        if (!mounted) return;

        if (data) {
          setStay(data);

          // Build gallery for the shared <Product/> component.
          const galleryImages = [];
          const cover =
            data.coverPhotoUrl ||
            data.coverImageUrl ||
            data.coverPhoto ||
            data.coverImage ||
            data.cover;

          if (cover) galleryImages.push(formatImageUrl(cover));

          const collectFromArray = (arr) => {
            if (!Array.isArray(arr)) return;
            arr.forEach((m) => {
              const url = typeof m === "string" ? m : m?.url ?? m?.src ?? m?.imageUrl;
              if (url) galleryImages.push(formatImageUrl(url));
            });
          };

          // Common fields used across the repo for listing media.
          collectFromArray(data.media);
          collectFromArray(data.images);
          collectFromArray(data.stayMedia);

          // De-dupe while preserving order.
          const seen = new Set();
          const deduped = galleryImages.filter((u) => {
            if (!u) return false;
            if (seen.has(u)) return false;
            seen.add(u);
            return true;
          });

          setGalleryItems(deduped);

          const hostId = data.hostId || data.host?.hostId || data.leadUserId || data.userId;
          if (hostId) {
            getHost(hostId)
              .then((hostResponse) => {
                if (mounted) setHostData(hostResponse || null);
              })
              .catch((err) => console.warn("Failed to fetch host data:", err));
          }
        }

        setLoading(false);
      } catch (e) {
        console.error("Failed to load stay details", e);
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const options = useMemo(() => {
    const opts = [];

    const propertyTypeLabel = toDisplayString(stay?.propertyType || stay?.property_type || stay?.type);
    if (propertyTypeLabel) opts.push({ title: propertyTypeLabel, icon: "building" });

    const cityOrLocation = toDisplayString(stay?.city || stay?.location || stay?.fullAddress || stay?.address);
    if (cityOrLocation) opts.push({ title: cityOrLocation, icon: "flag" });

    const categoryLabel = toDisplayString(stay?.category);
    if (categoryLabel && !propertyTypeLabel) opts.push({ title: categoryLabel, icon: "route" });

    if (!opts.length) {
      opts.push({ title: "Stay", icon: "building" });
    }

    return opts;
  }, [stay]);

  const hostAvatar = useMemo(() => {
    const avatarUrl =
      hostData?.host?.profilePhotoUrl ||
      hostData?.host?.profilePhoto ||
      stay?.host?.profilePhotoUrl ||
      stay?.host?.profilePhoto;

    return avatarUrl ? formatImageUrl(avatarUrl) : null;
  }, [hostData, stay]);

  if (loading && !stay) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Loader />
      </div>
    );
  }

  return (
    <>
      <Product
        classSection="section-mb64"
        title={stay?.propertyName || stay?.title || "Stay Details"}
        options={options}
        gallery={galleryItems}
        type="experience"
        rating={stay?.rating || stay?.averageRating}
        reviews={stay?.totalReviews || stay?.reviewCount}
        hostAvatar={hostAvatar}
      />

      {stay && (
        <>
          <Description classSection="section" listing={stay} hostData={hostData} />
          <TabSection classSection="section" listing={stay} />
          <CommentsProduct
            className={cn("section")}
            parametersUser={[]}
            socials={[]}
            info={stay?.description || stay?.detailedDescription || stay?.shortDescription || "Enjoy your stay."}
            buttonText="Book Now"
            hostData={hostData}
          />
        </>
      )}

      <Browse
        classSection="section"
        headSmall
        classTitle="h4"
        title="More stays to explore"
        items={browse2}
      />
    </>
  );
};

export default StayDetails;

