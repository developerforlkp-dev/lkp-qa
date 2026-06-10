import React from "react";
import { Globe, ArrowUp, Star, Home, Ticket, Users } from "lucide-react";
import styles from "./Footer.module.sass";

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

            <div className={styles.newsletter}>
              <input 
                type="email" 
                placeholder="Get updates on experiences, events & hidden destinations" 
                className={styles.newsInput}
              />
              <button className={styles.newsBtn}>
                Join The Journey
              </button>
            </div>

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
          </div>

          {/* Links Sections */}
          <div className={styles.rightSection}>
            <div className={styles.linkCol}>
              <h4>Explore</h4>
              <ul>
                <li><a href="#">Experiences</a></li>
                <li><a href="#">Stays</a></li>
                <li><a href="#">Food</a></li>
                <li><a href="#">Events</a></li>
                <li><a href="#">Places</a></li>
              </ul>
            </div>

            <div className={styles.linkCol}>
              <h4>Discover</h4>
              <ul>
                <li><a href="#">Trending Experiences</a></li>
                <li><a href="#">Featured Stays</a></li>
                <li><a href="#">Local Food Trails</a></li>
                <li><a href="#">Upcoming Events</a></li>
                <li><a href="#">Travel Stories</a></li>
                <li><a href="#">Collections</a></li>
              </ul>
            </div>

            <div className={styles.linkCol}>
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Little Known Planet</a></li>
                <li><a href="#">Become a Host</a></li>
                <li><a href="#">Partner With Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
            
            <div className={styles.linkCol}>
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Bookings</a></li>
                <li><a href="#">Cancellation Policy</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms & Conditions</a></li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomContainer}>
          
          {/* Icons Grid */}
          <div className={styles.featuresGrid}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}><Star size={24} strokeWidth={1.5} /></div>
              <div>
                <p className={styles.featureTitle}>Handpicked Experiences</p>
                <p className={styles.featureDesc}>Curated and verified<br/>by our team</p>
              </div>
            </div>
            
            <div className={`${styles.featureItem} ${styles.borderLeft}`}>
              <div className={styles.featureIcon}><Home size={24} strokeWidth={1.5} /></div>
              <div>
                <p className={styles.featureTitle}>Unique Local Stays</p>
                <p className={styles.featureDesc}>Authentic places<br/>across World</p>
              </div>
            </div>

            <div className={`${styles.featureItem} ${styles.borderLeft}`}>
              <div className={styles.featureIcon}><Ticket size={24} strokeWidth={1.5} /></div>
              <div>
                <p className={styles.featureTitle}>Easy Booking</p>
                <p className={styles.featureDesc}>Secure and seamless<br/>reservations</p>
              </div>
            </div>

            <div className={`${styles.featureItem} ${styles.borderLeft}`}>
              <div className={styles.featureIcon}><Users size={24} strokeWidth={1.5} /></div>
              <div>
                <p className={styles.featureTitle}>Local Communities</p>
                <p className={styles.featureDesc}>Supporting local<br/>hosts and creators</p>
              </div>
            </div>
          </div>

          {/* Stamp and Back to top */}
          <div className={styles.bottomActions}>
            <div className={styles.stamp}>
               <p>Discover</p>
               <p>The</p>
               <p>Hidden</p>
               <p>World</p>
            </div>
            <div className={styles.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <p>Back to<br/>top</p>
              <div className={styles.iconWrap}>
                <ArrowUp size={14} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Very Bottom */}
        <div className={styles.copyright}>
          <div className={styles.copyrightLogo}>
            LKP
          </div>
          <div className={styles.copyrightText}>
            © 2026 Little Known Planet. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
