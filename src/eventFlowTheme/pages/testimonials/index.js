import React, { useEffect, useState } from 'react';
import BackToTop from '../../components/elements/BackToTop';
import Header from '../../components/Layout/Header';
import navImg1 from '../../assets/images/resources/logo-1.png';
import Footer from '../../components/Layout/Footer';
import SiteBreadcrumb from '../../components/Common/Breadcumb';
import bannerbg from '../../assets/images/backgrounds/page-header-bg.jpg';
import CtaTwo from '../../components/Common/CtaSection/CtaTwo';
import TestimonialsMain from './TestimonialsMain';


// Breadcrumbs Background Image

const Testimonials = () => {

    const [isVisible, setIsVisible] = useState(false);

    const handleScroll = () => {
        const scrollTop = window.scrollY;
        if (scrollTop > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener("scroll", handleScroll);
        return () => document.removeEventListener("scroll", handleScroll);
    }, []);
    return (
        <React.Fragment>
        <Header
            navImg={navImg1}
            parentMenu='testimonials'
            activeMenu="/testimonials"
        />
        {/* SiteBreadcrumb */}
        <SiteBreadcrumb
            pageTitle="Testimonials"
            pageName="Testimonials"
            breadcrumbsImg={bannerbg}
        />
        {/* SiteBreadcrumb */}
        <TestimonialsMain/>
        {/*cta-section */}
        <CtaTwo/>
        {/*cta-section end */}
        <BackToTop scroll={isVisible} />
        <Footer />
    </React.Fragment>
    );
}

export default Testimonials;