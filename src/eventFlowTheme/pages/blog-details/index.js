import React, { useEffect, useState } from 'react';
import BackToTop from '../../components/elements/BackToTop';
import Header from '../../components/Layout/Header';
import navImg1 from '../../assets/images/resources/logo-1.png';
import Footer from '../../components/Layout/Footer';
import SiteBreadcrumb from '../../components/Common/Breadcumb';
import bannerbg from '../../assets/images/backgrounds/page-header-bg.jpg';
import CtaTwo from '../../components/Common/CtaSection/CtaTwo';
import BlogDetailsMain from './BlogDetailsMain';

// Breadcrumbs Background Image

const BlogDetails = () => {

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
            parentMenu='blog-list'
            activeMenu="/blog-list"
        />
        {/* SiteBreadcrumb */}
        <SiteBreadcrumb
            pageTitle="Blog list"
            pageName="Blog list"
            breadcrumbsImg={bannerbg}
        />
        {/* SiteBreadcrumb */}
        <BlogDetailsMain/>
        {/*cta-section */}
        <CtaTwo/>
        {/*cta-section end */}
        <BackToTop scroll={isVisible} />
        <Footer />
    </React.Fragment>
    );
}

export default BlogDetails;