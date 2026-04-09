import React from 'react';
import FooterStyleTwo from '../../components/Layout/Footer/FooterStyleTwo';

const footerProps = {
    newsletterUrl: "https://yourdomain.com/newsletter-signup",
    logoSrc: "/assets/images/logo.png",
    aboutText: "We are committed to providing the best services to our clients and ensuring their satisfaction.",
    socialLinks: [
        { icon: "facebook", url: "https://facebook.com/yourpage" },
        { icon: "twitter", url: "https://twitter.com/yourprofile" },
        { icon: "linkedin", url: "https://linkedin.com/in/yourprofile" },
        { icon: "instagram", url: "https://instagram.com/yourprofile" }
    ],
    services: [
        { name: "Web Development", link: "/services/web-development" },
        { name: "SEO Optimization", link: "/services/seo-optimization" },
        { name: "Digital Marketing", link: "/services/digital-marketing" }
    ],
    contactInfo: [
        { icon: "phone", text: "+1 (555) 123-4567" },
        { icon: "envelope", text: "info@yourdomain.com", link: "mailto:info@yourdomain.com" },
        { icon: "map-marker", text: "123 Main St, City, Country" }
    ],
    bottomMenu: [
        { text: "Privacy Policy", link: "/privacy-policy" },
        { text: "Terms of Service", link: "/terms-of-service" },
        { text: "Contact Us", link: "/contact" }
    ],
    copyrightText: "© 2024 Your Company Name. All rights reserved."
};

const FooterTwo = () => {
    return (
        <div>
            {/* Other components can be added here if needed */}
            <FooterStyleTwo {...footerProps} />
        </div>
    );
};

export default FooterTwo;
