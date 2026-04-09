"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GalleryImg1 from '../../assets/images/gallery/gallery-1-1.jpg';
import GalleryImg2 from '../../assets/images/gallery/gallery-1-2.jpg';
import GalleryImg3 from '../../assets/images/gallery/gallery-1-3.jpg';
import GalleryImg4 from '../../assets/images/gallery/gallery-1-4.jpg';
import GalleryImg5 from '../../assets/images/gallery/gallery-1-5.jpg';
import GalleryImg6 from '../../assets/images/gallery/gallery-1-6.jpg';
import GalleryImg7 from '../../assets/images/gallery/gallery-1-7.jpg';
import GalleryImg8 from '../../assets/images/gallery/gallery-1-8.jpg';
import GalleryImg9 from '../../assets/images/gallery/gallery-1-9.jpg';
import { getEventDetails } from '../../../utils/api';

const fallbackGalleryItems = [
  GalleryImg1,
  GalleryImg2,
  GalleryImg3,
  GalleryImg4,
  GalleryImg5,
  GalleryImg6,
  GalleryImg7,
  GalleryImg8,
  GalleryImg9,
].map((src, index) => ({
  src,
  alt: `Gallery ${index + 1}`,
  title: "Dream Makers Event Planning",
  subtitle: "Gala Affairs",
  href: "/gallery-details",
}));

export default function GalleryOne() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get('id') || '3';
  const [event, setEvent] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      try {
        const data = await getEventDetails(eventId);
        if (mounted) {
          setEvent(data);
        }
      } catch (error) {
        console.error("Failed to fetch gallery images:", error);
      }
    };

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    if (url.startsWith("leads/")) {
      return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }
    return url;
  };

  const galleryItems = useMemo(() => {
    const rawImages = [
      event?.coverImageUrl,
      event?.coverImage,
      ...(Array.isArray(event?.gallery) ? event.gallery : []),
      ...(Array.isArray(event?.images) ? event.images : []),
      ...(Array.isArray(event?.photos) ? event.photos : []),
      ...(Array.isArray(event?.media) ? event.media : []),
    ];

    const normalizedImages = rawImages
      .map((item) => {
        if (typeof item === 'string') return formatImageUrl(item);
        if (item && typeof item === 'object') {
          return formatImageUrl(item.url || item.src || item.imageUrl || item.mediaUrl);
        }
        return null;
      })
      .filter(Boolean);

    const uniqueImages = [...new Set(normalizedImages)];

    if (uniqueImages.length === 0) {
      return fallbackGalleryItems;
    }

    return uniqueImages.map((src, index) => ({
      src,
      alt: `${event?.title || 'Gallery'} ${index + 1}`,
      title: event?.title || "Dream Makers Event Planning",
      subtitle: event?.category || "Latest Moments",
      href: `/event-product?id=${eventId}`,
    }));
  }, [event, eventId]);

  return (
    <section className="gallery-one">
      <div className="container">
        <div className="section-title text-center">
          <div className="section-title__tagline-box">
            <span className="section-title__tagline">Latest Gallery</span>
          </div>
          <h2 className="section-title__title">
            {event?.title ? event.title : <>An evening for creator & art <br /> lover meet together</>}
          </h2>
        </div>
        <div className="row masonary-layout">
          {galleryItems.map((item, index) => (
            <div key={index} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
              <div className="gallery-one__single">
                <div className="gallery-one__img">
                  <img src={item.src} alt={item.alt} />
                  <div className="gallery-one__content">
                    <div className="gallery-one__sub-title-box">
                      <div className="gallery-one__sub-title-shape"></div>
                      <p className="gallery-one__sub-title">{item.subtitle}</p>
                    </div>
                    <h4 className="gallery-one__title">
                      <Link to={item.href}>{item.title}</Link>
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
