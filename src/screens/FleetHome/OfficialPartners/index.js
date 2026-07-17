import React from "react";
import styles from "./OfficialPartners.module.sass";

// Hardcoded partner data — will later be replaced with API fetch for real logos (webp) and names
const partners = [
  {
    id: 1,
    name: "Taj",
    logo: "/images/partners/taj.webp",
  },
  {
    id: 2,
    name: "StayVista",
    logo: "/images/partners/stayvista.webp",
  },
  {
    id: 3,
    name: "CGH Earth",
    logo: "/images/partners/cghearth.webp",
  },
  {
    id: 4,
    name: "Marriott",
    logo: "/images/partners/marriott.webp",
  },
  {
    id: 5,
    name: "Airbnb",
    logo: "/images/partners/airbnb.webp",
  },
  {
    id: 6,
    name: "Club Mahindra",
    logo: "/images/partners/clubmahindra.webp",
  },
  {
    id: 7,
    name: "The Leela",
    logo: "/images/partners/theleela.webp",
  },
  {
    id: 8,
    name: "Hyatt",
    logo: "/images/partners/hyatt.webp",
  },
];

const OfficialPartners = () => {
  // Double the partners array for seamless marquee loop
  const marqueePartners = [...partners, ...partners];

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
          {marqueePartners.map((partner, index) => (
            <div key={`${partner.id}-${index}`} className={styles.logoCard}>
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
            <span className={styles.countNumber}>25+</span>
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

