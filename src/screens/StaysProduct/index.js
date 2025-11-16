import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./StaysProduct.module.sass";
import Product from "../../components/Product";
import Description from "./Description";
import Itinerary from "../../components/Itinerary";
import TabSection from "./TabSection";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";

// data
import { browse2 } from "../../mocks/browse";

const gallery = [
  "/images/content/photo-1.1.jpg",
  "/images/content/photo-1.2.jpg",
  "/images/content/photo-1.3.jpg",
  "/images/content/photo-1.4.jpg",
  "/images/content/photo-1.1.jpg",
  "/images/content/photo-1.2.jpg",
];

const options = [
  {
    title: "Superhost",
    icon: "home",
  },
  {
    title: "Queenstown, Otago, New Zealand",
    icon: "flag",
  },
  {
    title: "Nature & Adventure",
    icon: "route",
  },
  {
    title: "Off-road Jeep Safari",
    icon: "car",
  },
];

const parametersUser = [
  {
    title: "Superhost",
    icon: "home",
  },
  {
    title: "256 reviews",
    icon: "star-outline",
  },
];

const socials = [
  {
    title: "twitter",
    url: "https://twitter.com/ui8",
  },
  {
    title: "instagram",
    url: "https://www.instagram.com/ui8net/",
  },
  {
    title: "facebook",
    url: "https://www.facebook.com/ui8.net/",
  },
];

const StaysProduct = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const idParam = params.get("id");
  const id = idParam ? idParam : "2"; // default to 2 as requested

  const [listing, setListing] = useState(null);
  const [galleryItems, setGalleryItems] = useState(gallery);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  let mounted = true;
  const load = async () => {
    try {
      setLoading(true);
      const { getListing } = await import("../../utils/api");
      const data = await getListing(id);
      if (!mounted) return;

      setListing(data || null);

      // ✅ Build gallery dynamically from API
      const galleryImages = [];

      // 1️⃣ Add cover photo (if exists)
      if (data?.coverPhotoUrl) {
        galleryImages.push(data.coverPhotoUrl);
      }

      // 2️⃣ Add listingMedia images
      if (Array.isArray(data?.listingMedia)) {
        data.listingMedia.forEach((media) => {
          // Each media object has either 'url' or 'fileUrl'
          const imageUrl =
            media.url ||
            (media.fileUrl?.startsWith("http")
              ? media.fileUrl
              : `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${media.fileUrl}`);
          if (imageUrl) galleryImages.push(imageUrl);
        });
      }

      // 3️⃣ Add keyActivities images (optional, if you want them too)
      if (Array.isArray(data?.keyActivities)) {
        data.keyActivities.forEach((activity) => {
          if (Array.isArray(activity.images)) {
            activity.images.forEach((img) => {
              const imageUrl =
                img.url ||
                (img.imageUrl?.startsWith("http")
                  ? img.imageUrl
                  : `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${img.imageUrl}`);
              if (imageUrl) galleryImages.push(imageUrl);
            });
          }
        });
      }

      // ✅ Final fallback if no images
setGalleryItems(galleryImages.length ? galleryImages : []);
    } catch (e) {
      console.error("Failed to load listing", e);
      setListing(null);
      setGalleryItems([]);
    } finally {
      if (mounted) setLoading(false);
    } 
  };

  load();
  return () => {
    mounted = false;
  };
}, [id]);


  return (
    <>
<Product
  classSection="section-mb64"
  title={listing?.title || "Spectacular views of Queenstown"}
  options={options}
  gallery={galleryItems && galleryItems.length > 0 ? galleryItems : []}
  type="stays"
/>

      <Description classSection="section" listing={listing} />
      <Itinerary classSection="section" listing={listing} />
      <TabSection classSection="section" listing={listing} />
      <CommentsProduct
        className={cn("section", styles.comment)}
        parametersUser={parametersUser}
        info={
          listing?.description ||
          "Described by Queenstown House & Garden magazine as having 'one of the best views we've ever seen' you will love relaxing in this newly built"
        }
        socials={socials}
        buttonText="Contact"
      />
      <Browse
        classSection="section"
        headSmall
        classTitle="h4"
        title="Explore mountains in New Zealand"
        items={browse2}
      />
    </>
  );
};

export default StaysProduct;
