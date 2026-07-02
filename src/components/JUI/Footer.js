import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowUp, Star, Home, Ticket, Users, ChevronDown, ChevronUp, Instagram, Linkedin } from "lucide-react";
import styles from "./Footer.module.sass";


function FooterCol({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.linkCol}>
      <h4 onClick={() => setIsOpen(!isOpen)} className={styles.colTitle}>
        {title}
        <span className={styles.colIcon}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </h4>
      <div className={`${styles.colContent} ${isOpen ? styles.colContentOpen : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Background Image on Left */}
      <div className={styles.bgImage} style={{ backgroundImage: "url('/images/footerimage.webp')" }} />

      {/* Wave Mask (White) */}
      <div className={styles.waveMask}>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,32 C720,128 288,-32 0,32 Z" />
        </svg>
      </div>

      {/* Main Footer Content */}
      <div className={styles.mainContent}>
        <div className={styles.container}>
          
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
                <a href="https://www.instagram.com/littleknownplanet?igsh=MWR4bWd3ZjBlbWQwMw==" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                  <Instagram size={14} />
                </a>
                <a href="https://www.linkedin.com/company/little-known-planet/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                  <Linkedin size={14} />
                </a>
              </div>
            </div>

            <div className={styles.upperCopyrightText}>
              © 2026 Little Known Planet. All Rights Reserved.
            </div>
          </div>

          {/* Links Sections */}
          <div className={styles.rightSection}>
            <FooterCol title="Explore"><ul>
                <li><Link to="/experiences">Experiences</Link></li>
                <li><Link to="/events">Events</Link></li>
                <li><Link to="/stays">Stays</Link></li>
                <li><Link to="/food">Food</Link></li>
                <li><Link to="/places">Places</Link></li>
                <li><Link to="/blog">Blog</Link></li>
              </ul></FooterCol>

            <FooterCol title="Company"><ul>
                <li><Link to="/">About Little Known Planet</Link></li>
                <li><Link to="/host-profile">Become a Host</Link></li>
                <li><a href="mailto:support@littleknownplanet.com">Contact Us</a></li>
              </ul></FooterCol>
            
            <FooterCol title="Support"><ul>
                <li><Link to="/support">Help Center</Link></li>
                <li><Link to="/terms-of-service">Cancellation Policy</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service">Terms & Conditions</Link></li>
              </ul></FooterCol>
          </div>

        </div>
      </div>


    </footer>
  );
}
