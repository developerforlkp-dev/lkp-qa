import React, { useEffect, useState } from "react";
import cn from "classnames";
import styles from "./FullPhoto.module.sass";
import Product from "../../components/Product";
import Icon from "../../components/Icon";
import { useHistory, useLocation } from "react-router-dom";
import PhotoView from "../../components/PhotoView";
import { getListingMedia } from "../../utils/api";

const breadcrumbs = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Experience",
    url: "/",
  },
  {
    title: "New Zealand",
    url: "/experience-category",
  },
  {
    title: "South Island",
  },
];

const defaultGallery = [
  "/images/content/photo-2.1.jpg",
  "/images/content/photo-2.2.jpg",
  "/images/content/photo-2.6.jpg",
  "/images/content/photo-2.3.jpg",
  "/images/content/photo-2.7.jpg",
  "/images/content/photo-2.4.jpg",
  "/images/content/photo-2.8.jpg",
  "/images/content/photo-2.5.jpg",
  "/images/content/photo-2.9.jpg",
];

const defaultOptions = [
  {
    title: "Superhost",
    icon: "home",
  },
  {
    title: "Queenstsssown, Otago, New Zealand",
    icon: "flag",
  },
];

const FullPhoto = () => {
  const history = useHistory();
  const location = useLocation();
  const [initialSlide, setInitialSlide] = useState(0);
  const [visible, setVisible] = useState(false);
  const [gallery, setGallery] = useState(location.state?.gallery || defaultGallery);

  const listingId = location.state?.listingId;
  const title = location.state?.title || "Spectacular views of Queenstown";
  const options = location.state?.options || defaultOptions;

  useEffect(() => {
    let mounted = true;

    const normalizeMediaUrl = (media) => {
      const rawUrl = media?.url || media?.fileUrl || media?.blobName || media;
      if (!rawUrl) return null;
      if (String(rawUrl).startsWith("http://") || String(rawUrl).startsWith("https://")) return rawUrl;
      if (String(rawUrl).startsWith("/")) return rawUrl;
      return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${rawUrl}`;
    };

    const loadMedia = async () => {
      if (!listingId) return;

      try {
        const media = await getListingMedia(listingId);
        if (!mounted) return;

        const apiGallery = media
          .map(normalizeMediaUrl)
          .filter(Boolean);

        if (apiGallery.length > 0) {
          setGallery(apiGallery);
        }
      } catch (error) {
        console.warn("Failed to fetch full photo gallery:", error);
      }
    };

    loadMedia();
    return () => {
      mounted = false;
    };
  }, [listingId]);

  const handleOpen = (index) => {
    setInitialSlide(index);
    setVisible(true);
  };

  const handleClose = (e) => {
    e.preventDefault();
    // Check if there's history to go back to
    if (window.history.length > 1) {
      history.goBack();
    } else {
      // Fallback to experience-product if no history
      history.push("/experience-product");
    }
  };

  return (
    <>
      <Product
        classSection="section-mb64"
        urlHome="/"
        title={title}
        breadcrumbs={breadcrumbs}
        options={options}
      ></Product>
      <div className={cn("section-mb80", styles.section)}>
        <div className={cn("container", styles.container)}>
          <div className={styles.galleryGrid}>
            {gallery.map((x, index) => (
              <div
                key={index}
                className={cn(styles.preview, {
                  [styles.previewLarge]: index === 0 || index === 3,
                })}
                onClick={() => handleOpen(index)}
              >
                <div className={styles.imageWrapper}>
                  <img src={x} alt={`Gallery ${index + 1}`} />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.foot}>
            <button
              type="button"
              className={cn("button-circle-stroke button-small", styles.button)}
              onClick={handleClose}
            >
              <Icon name="close" size="24" />
            </button>
          </div>
        </div>
      </div>
      <PhotoView
        title={title}
        initialSlide={initialSlide}
        visible={visible}
        items={gallery}
        listingId={listingId}
        options={options}
        onClose={() => setVisible(false)}
      />
    </>
  );
};

export default FullPhoto;
