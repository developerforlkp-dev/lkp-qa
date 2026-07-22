import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowUp, Star, Home, Ticket, Users, ChevronDown, ChevronUp, Instagram, Linkedin, Mail, Phone, Headphones, User, MessageCircle, Heart, CheckCircle2 } from "lucide-react";
import styles from "./Footer.module.sass";
import HostingApplicationForm from "../HostingApplicationForm";
import Modal from "../Modal";
import { getSupportGuest } from "../../utils/api";


function FooterCol({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.linkCol}>
      <h4 onClick={() => setIsOpen(!isOpen)} className={`${styles.colTitle} ${isOpen ? styles.colTitleOpen : ''}`}>
        {title}
        <span className={`${styles.colIcon} ${isOpen ? styles.colIconOpen : ''}`}>
          <ChevronDown size={16} />
        </span>
      </h4>
      <div className={`${styles.colContent} ${isOpen ? styles.colContentOpen : ''}`}>
        {children}
      </div>
    </div>
  );
}

export function Footer() {
  const [isHostingFormVisible, setIsHostingFormVisible] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);

  React.useEffect(() => {
    const fetchSupport = async () => {
      try {
        const data = await getSupportGuest();
        if (data && data.contacts) {
          setContacts(data.contacts);
        }
      } catch (err) {
        console.error("Failed to fetch support contacts", err);
      }
    };
    fetchSupport();
  }, []);

  const handleExploreClick = () => {
    setTimeout(() => {
      const target = document.getElementById("listings-scroll-target");
      if (target) {
        const isMobile = window.innerWidth <= 1023;
        const offset = target.getBoundingClientRect().top + window.scrollY - (isMobile ? 80 : 120);
        window.scrollTo({ top: offset, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <footer id="main-footer" className={styles.footer}>
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
                <li><Link to="/experiences" onClick={handleExploreClick}>Experiences</Link></li>
                <li><Link to="/events" onClick={handleExploreClick}>Events</Link></li>
                <li><Link to="/stays" onClick={handleExploreClick}>Stays</Link></li>
                <li><Link to="/food" onClick={handleExploreClick}>Food</Link></li>
                <li><Link to="/places" onClick={handleExploreClick}>Places</Link></li>
                <li><Link to="/blog">Blog</Link></li>
              </ul></FooterCol>

            <FooterCol title="Company"><ul>
                <li><Link to="/about">About Little Known Planet</Link></li>
                <li><button onClick={() => setIsHostingFormVisible(true)} className={styles.linkButton}>Become a Host</button></li>
                <li><button onClick={() => setIsContactModalVisible(true)} className={styles.linkButton}>Contact Us</button></li>
                <li><Link to="/support">Raise a Ticket</Link></li>
              </ul></FooterCol>
            
            <FooterCol title="Support"><ul>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/support">Support Ticket</Link></li>
                <li><Link to="/cancellation-policy">Cancellation Policy</Link></li>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service">Terms & Conditions</Link></li>
              </ul></FooterCol>
          </div>

        </div>
      </div>

      <HostingApplicationForm 
        visible={isHostingFormVisible} 
        onClose={() => setIsHostingFormVisible(false)} 
      />

      <Modal visible={isContactModalVisible} onClose={() => setIsContactModalVisible(false)} outerClassName={styles.customModalOuter}>
        <div className={styles.contactModalContainer}>
          <div className={styles.contactModalHeader}>
            <div className={styles.headerIconWrapper}>
              <Headphones size={40} strokeWidth={1.5} />
            </div>
            <div className={styles.headerTextContent}>
              <h2 className={styles.contactModalTitle}>Contact Support</h2>
              <p className={styles.contactModalDesc}>We're here to help! Reach out to us through any of the channels below.</p>
            </div>
          </div>
          
          <div className={styles.contactCardsList}>
            {contacts.length > 0 ? contacts.map((contact, index) => {
              // Cycle through 3 theme colors for cards
              const colors = [
                { border: '#06b6d4', bg: '#ecfeff', text: '#0891b2' }, // Cyan
                { border: '#8b5cf6', bg: '#f5f3ff', text: '#7c3aed' }, // Purple
                { border: '#f59e0b', bg: '#fffbeb', text: '#d97706' }  // Orange
              ];
              const theme = colors[index % colors.length];

              return (
                <div key={contact.supportContactId} className={styles.contactCard} style={{ borderLeftColor: theme.border }}>
                  <div className={styles.contactCardTop}>
                    <div className={styles.contactProfile}>
                      <div className={styles.contactAvatar} style={{ backgroundColor: theme.bg, color: theme.text }}>
                        <User size={24} />
                      </div>
                      <div className={styles.contactProfileText}>
                        <h3 className={styles.contactCardTitle}>{contact.name}</h3>
                        <p className={styles.contactCardSubtitle}>Support Team</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.contactActionsGrid}>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className={styles.contactActionPill}>
                        <div className={styles.pillIconWrapper} style={{ backgroundColor: theme.bg, color: theme.text }}>
                          <Mail size={16} />
                        </div>
                        {contact.email}
                      </a>
                    )}
                    {contact.phoneNumber && (
                      <a href={`tel:${contact.phoneNumber}`} className={styles.contactActionPill}>
                        <div className={styles.pillIconWrapper} style={{ backgroundColor: theme.bg, color: theme.text }}>
                          <Phone size={16} />
                        </div>
                        {contact.phoneNumber}
                      </a>
                    )}
                  </div>
                </div>
              );
            }) : (
              <p style={{ color: '#666', textAlign: 'center' }}>Loading contact details...</p>
            )}
          </div>

          <div className={styles.helpFooterBox}>
            <div className={styles.helpIconBox}>
              <MessageCircle size={24} />
            </div>
            <div className={styles.helpTextContent}>
              <h4 className={styles.helpTitle}>Still need help?</h4>
              <p className={styles.helpDesc}>We usually respond within <strong style={{color: '#0284c7', fontWeight: 600}}>24 hours</strong>.</p>
            </div>
          </div>

          <div className={styles.thankYouMessage}>
            <Heart size={16} color="#0ea5e9" />
            Thank you for reaching out!
          </div>
        </div>
      </Modal>
    </footer>
  );
}
