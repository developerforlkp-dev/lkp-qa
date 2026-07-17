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
          {/* Leaf decorations */}
          <svg className={styles.leafIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8.17 20C12.17 20 15.87 16.64 17.47 14.36C20.37 10.16 21.07 5 21.07 5C21.07 5 17.07 5 17 8Z" fill="#0097B2" opacity="0.7"/>
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8.17 20C12.17 20 15.87 16.64 17.47 14.36C20.37 10.16 21.07 5 21.07 5C21.07 5 17.07 5 17 8Z" fill="none" stroke="#0097B2" strokeWidth="0.5" opacity="0.3"/>
          </svg>
          <div className={styles.verifiedCount}>
            <span className={styles.countNumber}>25+</span>
            <span className={styles.countLabel}>Verified Partners</span>
          </div>
          <svg className={styles.leafIconRight} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 8C16 10 18.1 16.17 20.18 21.34L18.29 22L17.34 19.7C16.86 19.87 16.36 20 15.83 20C11.83 20 8.13 16.64 6.53 14.36C3.63 10.16 2.93 5 2.93 5C2.93 5 6.93 5 7 8Z" fill="#0097B2" opacity="0.7"/>
            <path d="M7 8C16 10 18.1 16.17 20.18 21.34L18.29 22L17.34 19.7C16.86 19.87 16.36 20 15.83 20C11.83 20 8.13 16.64 6.53 14.36C3.63 10.16 2.93 5 2.93 5C2.93 5 6.93 5 7 8Z" fill="none" stroke="#0097B2" strokeWidth="0.5" opacity="0.3"/>
          </svg>
        </div>
        <div className={styles.trustDivider} />
        <div className={styles.trustRight}>
          {/* Shield / Check Icon */}
          <div className={styles.shieldIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(0,151,178,0.08)"/>
              <path d="M9 12L11 14L15 10" stroke="#0097B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
