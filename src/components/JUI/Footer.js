import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

const styles = {
  leftSection: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "100%",
    maxWidth: "360px",
  },
  brandTitle: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  brandIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "1px solid #2D2D2D",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#FFFFFF",
    flexShrink: 0,
  },
  brandHeading: {
    margin: 0,
    color: "#FFFFFF",
    fontSize: "1.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  brandDesc: {
    margin: 0,
    color: "#B3B3B3",
    fontSize: "0.98rem",
    lineHeight: 1.7,
  },
  socials: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  socialText: {
    color: "#D0D0D0",
    fontSize: "0.92rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  socialIcons: {
    display: "flex",
    gap: "12px",
  },
  socialIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "1px solid #2D2D2D",
    color: "#FFFFFF",
    textDecoration: "none",
  },
  upperCopyrightText: {
    color: "#8C8C8C",
    fontSize: "0.88rem",
  },
  rightSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "32px",
    width: "100%",
    flex: 1,
  },
  linkCol: {
    minWidth: 0,
  },
};

export function Footer() {
  const footerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  const scaleX = useTransform(scrollYProgress, [0, 0.4, 1], [0.85, 0.95, 1]);
  const letterSpacing = useTransform(scrollYProgress, [0, 1], ["0.5em", "-0.02em"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 1], [0, 1, 1]);

  return (
    <footer
      ref={footerRef}
      className="cinematic-footer"
      style={{
        background: "#080808",
        color: "#FFFFFF",
        borderTop: "1px solid #222",
        overflow: "hidden",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div style={{ padding: "80px 0", textAlign: "center", borderBottom: "1px solid #222" }}>
        <motion.h1
          className="font-display"
          style={{
            fontSize: "clamp(4rem, 15vw, 18rem)",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: 0,
            lineHeight: 0.8,
            scaleX,
            letterSpacing,
            opacity,
            transformOrigin: "center center",
          }}
        >
          LITTLE KNOWN PLANET
        </motion.h1>
      </div>

      <div className="bottom-footer-bar">
        <div className="bottom-footer-inner">
          <div className="bottom-footer-links">
            <Link to="/privacy-policy" className="bottom-footer-link">
              Privacy
            </Link>
            <span className="bottom-footer-dot">&bull;</span>
            <Link to="/terms-of-service" className="bottom-footer-link">
              Terms & Conditions
            </Link>
            <span className="bottom-footer-dot">&bull;</span>
            <span className="bottom-footer-text">Call Us: +91 8104 954 254</span>
          </div>

          <div style={styles.leftSection}>
            <div style={styles.brandTitle}>
              <div style={styles.brandIcon}>
                <Globe size={32} strokeWidth={2} />
              </div>
              <div>
                <h3 style={styles.brandHeading}>
                  Explore World.
                  <br />
                  Experience More.
                </h3>
              </div>
            </div>

            <p style={styles.brandDesc}>
              Discover handpicked experiences, unique stays, local food, cultural events and hidden
              places across World.
            </p>

            <div style={styles.socials}>
              <span style={styles.socialText}>Follow the adventure</span>
              <div style={styles.socialIcons}>
                <a
                  href="https://www.instagram.com/"
                  style={styles.socialIcon}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/"
                  style={styles.socialIcon}
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/"
                  style={styles.socialIcon}
                  aria-label="Twitter"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
              </div>
            </div>

            <div style={styles.upperCopyrightText}>
              {"\u00A9"} 2026 Little Known Planet. All Rights Reserved.
            </div>
          </div>

          <div style={styles.rightSection}>
            <div style={styles.linkCol}>
              <h4>Explore</h4>
              <ul>
                <li><Link to="/experiences">Experiences</Link></li>
                <li><Link to="/events">Events</Link></li>
                <li><Link to="/stays">Stays</Link></li>
                <li><Link to="/food">Food</Link></li>
                <li><Link to="/places">Places</Link></li>
              </ul>
            </div>

            <div style={styles.linkCol}>
              <h4>Discover</h4>
              <ul>
                <li><Link to="/experiences">Trending Experiences</Link></li>
                <li><Link to="/events">Upcoming Events</Link></li>
                <li><Link to="/stays">Featured Stays</Link></li>
                <li><Link to="/food">Local Food Trails</Link></li>
                <li><Link to="/places">Travel Stories</Link></li>
                <li><Link to="/experiences">Collections</Link></li>
              </ul>
            </div>

            <div style={styles.linkCol}>
              <h4>Company</h4>
              <ul>
                <li><Link to="/">About Little Known Planet</Link></li>
                <li><Link to="/host-profile">Become a Host</Link></li>
                <li><Link to="/">Partner With Us</Link></li>
                <li><Link to="/">Careers</Link></li>
                <li><a href="mailto:support@littleknownplanet.com">Contact Us</a></li>
              </ul>
            </div>

            <div style={styles.linkCol}>
              <h4>Support</h4>
              <ul>
                <li><Link to="/support">Help Center</Link></li>
                <li><Link to="/bookings">Bookings</Link></li>
                <li><Link to="/terms-of-service">Cancellation Policy</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
