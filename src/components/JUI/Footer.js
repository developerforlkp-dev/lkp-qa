import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";
import { Instagram, Facebook, Youtube, Linkedin } from "lucide-react";

const WhatsAppIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.56 0 .24 5.32.24 11.84c0 2.08.54 4.12 1.58 5.92L0 24l6.41-1.68a11.78 11.78 0 0 0 5.67 1.45h.01c6.52 0 11.84-5.32 11.84-11.84 0-3.16-1.23-6.13-3.41-8.45ZM12.09 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.8 1 1.01-3.71-.23-.38a9.86 9.86 0 0 1-1.52-5.28C2.15 6.41 6.66 1.9 12.09 1.9c2.63 0 5.1 1.02 6.95 2.88a9.78 9.78 0 0 1 2.9 6.96c0 5.43-4.42 9.86-9.85 9.86Zm5.41-7.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5a9.1 9.1 0 0 1-1.68-2.08c-.18-.3-.02-.47.14-.62.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.23-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
  </svg>
);

const PinterestIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/>
  </svg>
);

export function Footer() {
  const { tokens: { A, AH }, theme } = useTheme();
  const footerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"]
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
        zIndex: 10
      }}
    >


      <div style={{ padding: "80px 0", textAlign: "center", borderBottom: "1px solid #222" }}>
        <motion.h1 
          className="font-display"
          style={{ 
            fontSize: "clamp(4rem, 15vw, 18rem)", fontWeight: 900, color: "#FFFFFF", margin: 0, lineHeight: 0.8,
            scaleX, letterSpacing, opacity, transformOrigin: "center center"
          }}
        >
          LITTLE KNOWN PLANET
        </motion.h1>
      </div>

      <div className="bottom-footer-bar">
        <div className="bottom-footer-inner">
          <div className="bottom-footer-links">
            <Link to="/privacy-policy" className="bottom-footer-link">Privacy</Link>
            <span className="bottom-footer-dot">•</span>
            <Link to="/terms-of-service" className="bottom-footer-link">Terms & Conditions</Link>
            <span className="bottom-footer-dot">•</span>
            <span className="bottom-footer-text">Call Us: +91 8104 954 254</span>
          </div>
          
          {/* Newsletter & Left Section */}
          <div className={styles.leftSection}>
            <div className={styles.brandTitle}>
              <div className={styles.brandIcon}>
                <Globe size={32} strokeWidth={2} />
              </div>
              <div>
                <h3 className={styles.brandHeading}>Explore World.<br />Experience More.</h3>
              </div>
            </div>
            <p className={styles.brandDesc}>
              Discover handpicked experiences, unique stays, local food, cultural events and hidden places across World.
            </p>



            <div className={styles.socials}>
              <span className={styles.socialText}>Follow the adventure</span>
              <div className={styles.socialIcons}>
                <a href="#" className={styles.socialIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" className={styles.socialIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className={styles.socialIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
              </div>
            </div>

            <div className={styles.upperCopyrightText}>
              © 2026 Little Known Planet. All Rights Reserved.
            </div>
          </div>

          {/* Links Sections */}
          <div className={styles.rightSection}>
            <div className={styles.linkCol}>
              <h4>Explore</h4>
              <ul>
                <li><Link to="/experiences">Experiences</Link></li>
                <li><Link to="/events">Events</Link></li>
                <li><Link to="/stays">Stays</Link></li>
                <li><Link to="/food">Food</Link></li>
                <li><Link to="/places">Places</Link></li>
              </ul>
            </div>

            <div className={styles.linkCol}>
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

            <div className={styles.linkCol}>
              <h4>Company</h4>
              <ul>
                <li><Link to="/">About Little Known Planet</Link></li>
                <li><Link to="/host-profile">Become a Host</Link></li>
                <li><Link to="/">Partner With Us</Link></li>
                <li><Link to="/">Careers</Link></li>
                <li><a href="mailto:support@littleknownplanet.com">Contact Us</a></li>
              </ul>
            </div>
            
            <div className={styles.linkCol}>
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
