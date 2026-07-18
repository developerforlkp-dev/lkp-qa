import React, { useState, useEffect } from "react";
import styles from "./OfficialPartners.module.sass";
import { ListingsAPI, DEFAULT_API_BASE_URL, normalizePublicImageUrl } from "../../../utils/api";

const OfficialPartners = () => {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await ListingsAPI.get("/public/lkp-partner-documents");
        
        let data = response.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (Array.isArray(data.data)) data = data.data;
          else if (Array.isArray(data.documents)) data = data.documents;
        }
        
        if (Array.isArray(data)) {
          const baseUrl = DEFAULT_API_BASE_URL.replace(/\/api\/?$/, "");
          
          const formattedPartners = data.map(item => {
            const id = item.documentId || item.id || item._id;
            
            // If the API gives a relative path like "/api/public/...", make it absolute
            let logoUrl = "";
            if (item.documentUrl || item.downloadUrl) {
              const relUrl = item.documentUrl || item.downloadUrl;
              logoUrl = relUrl.startsWith("/") ? `${baseUrl}${relUrl}` : relUrl;
            } else if (item.logo) {
              logoUrl = normalizePublicImageUrl(item.logo);
            }
            
            return {
              id: id,
              name: item.title || item.documentName || item.name || "Partner",
              logo: logoUrl
            };
          });
          setPartners(formattedPartners);
        }
      } catch (error) {
        console.error("Failed to fetch partner documents:", error);
      }
    };
    
    fetchPartners();
  }, []);

  if (partners.length === 0) return null;

  // Split partners if there are more than 10
  let topPartners = partners;
  let bottomPartners = [];
  
  if (partners.length > 10) {
    const mid = Math.ceil(partners.length / 2);
    topPartners = partners.slice(0, mid);
    bottomPartners = partners.slice(mid);
  }

  // Repeat the partners array enough times to ensure seamless infinite marquee loop
  // even if the API only returns a few partners.
  const marqueeTop = Array(10).fill(topPartners).flat();
  const marqueeBottom = bottomPartners.length > 0 ? Array(10).fill(bottomPartners).flat() : [];

  return (
    <section className={styles.partnersSection} id="official-partners">
      {/* Decorative Diamond */}
      <div className={styles.diamondIcon}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6L8 0Z"
            fill="#C8CDD5"
          />
        </svg>
      </div>

      {/* Pre-title */}
      <div className={styles.preTitle}>OFFICIAL PARTNERS</div>

      {/* Main Heading */}
      <h2 className={styles.mainHeading}>
        Trusted by Leading Hospitality Brands
      </h2>

      {/* Subtitle */}
      <p className={styles.subtitle}>
        We proudly collaborate with renowned hospitality, travel
        <br />
        and experience partners across India.
      </p>

      {/* Partners Logo Marquee */}
      <div className={styles.marqueeContainer}>
        {/* Left fade edge */}
        <div className={styles.fadeLeft} />
        {/* Right fade edge */}
        <div className={styles.fadeRight} />

        <div className={styles.marqueeTrack}>
          {marqueeTop.map((partner, index) => (
            <div key={`top-${partner.id}-${index}`} className={styles.logoCard}>
              <div className={styles.logoWrapper}>
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className={styles.logoImage}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className={styles.logoFallback} style={{ display: "none" }}>
                  {partner.name}
                </div>
              </div>
              <span className={styles.brandName}>{partner.name}</span>
            </div>
          ))}
        </div>

        {marqueeBottom.length > 0 && (
          <div className={`${styles.marqueeTrack} ${styles.marqueeTrackReverse}`}>
            {marqueeBottom.map((partner, index) => (
              <div key={`bottom-${partner.id}-${index}`} className={styles.logoCard}>
                <div className={styles.logoWrapper}>
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={styles.logoImage}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className={styles.logoFallback} style={{ display: "none" }}>
                    {partner.name}
                  </div>
                </div>
                <span className={styles.brandName}>{partner.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Badge Row */}
      <div className={styles.trustBadge}>
        <div className={styles.trustLeft}>
          {/* Left laurel wreath */}
          <svg className={styles.laurelLeft} width="32" height="56" viewBox="0 0 32 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M28 4C28 4 22 8 20 14C18 20 20 26 20 26" stroke="#0097B2" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M26 6C24 8 22 12 22 16" stroke="#0097B2" strokeWidth="1" fill="none" opacity="0.4"/>
            <ellipse cx="24" cy="8" rx="4" ry="2.5" transform="rotate(-30 24 8)" fill="#0097B2" opacity="0.5"/>
            <ellipse cx="21" cy="14" rx="4" ry="2.5" transform="rotate(-20 21 14)" fill="#0097B2" opacity="0.45"/>
            <ellipse cx="19" cy="21" rx="4" ry="2.5" transform="rotate(-10 19 21)" fill="#0097B2" opacity="0.4"/>
            <ellipse cx="18" cy="28" rx="3.5" ry="2.2" transform="rotate(-5 18 28)" fill="#0097B2" opacity="0.35"/>
            <ellipse cx="18" cy="35" rx="3.5" ry="2.2" transform="rotate(0 18 35)" fill="#0097B2" opacity="0.3"/>
            <ellipse cx="19" cy="42" rx="3.5" ry="2.2" transform="rotate(10 19 42)" fill="#0097B2" opacity="0.3"/>
            <path d="M20 26C20 26 18 32 18 38C18 44 20 50 22 52" stroke="#0097B2" strokeWidth="1.2" fill="none" opacity="0.5"/>
          </svg>

          <div className={styles.verifiedCount}>
            <span className={styles.countNumber}>{partners.length}</span>
            <span className={styles.countLabel}>Verified Partners</span>
          </div>

          {/* Right laurel wreath */}
          <svg className={styles.laurelRight} width="32" height="56" viewBox="0 0 32 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4C4 4 10 8 12 14C14 20 12 26 12 26" stroke="#0097B2" strokeWidth="1.2" fill="none" opacity="0.6"/>
            <path d="M6 6C8 8 10 12 10 16" stroke="#0097B2" strokeWidth="1" fill="none" opacity="0.4"/>
            <ellipse cx="8" cy="8" rx="4" ry="2.5" transform="rotate(30 8 8)" fill="#0097B2" opacity="0.5"/>
            <ellipse cx="11" cy="14" rx="4" ry="2.5" transform="rotate(20 11 14)" fill="#0097B2" opacity="0.45"/>
            <ellipse cx="13" cy="21" rx="4" ry="2.5" transform="rotate(10 13 21)" fill="#0097B2" opacity="0.4"/>
            <ellipse cx="14" cy="28" rx="3.5" ry="2.2" transform="rotate(5 14 28)" fill="#0097B2" opacity="0.35"/>
            <ellipse cx="14" cy="35" rx="3.5" ry="2.2" transform="rotate(0 14 35)" fill="#0097B2" opacity="0.3"/>
            <ellipse cx="13" cy="42" rx="3.5" ry="2.2" transform="rotate(-10 13 42)" fill="#0097B2" opacity="0.3"/>
            <path d="M12 26C12 26 14 32 14 38C14 44 12 50 10 52" stroke="#0097B2" strokeWidth="1.2" fill="none" opacity="0.5"/>
          </svg>
        </div>

        <div className={styles.trustDivider} />

        <div className={styles.trustRight}>
          {/* Shield check icon — filled cyan circle */}
          <div className={styles.shieldIcon}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#0097B2" opacity="0.12"/>
              <circle cx="18" cy="18" r="14" fill="#0097B2" opacity="0.08"/>
              <path d="M18 28C18 28 25 24.5 25 18.5V12.5L18 10L11 12.5V18.5C11 24.5 18 28 18 28Z" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(0,151,178,0.1)"/>
              <path d="M14.5 18.5L17 21L22 16" stroke="#0097B2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className={styles.trustText}>
            Ensuring unforgettable experiences
            <br />
            with trusted and verified partners.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OfficialPartners;

