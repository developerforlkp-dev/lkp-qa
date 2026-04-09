import React, { useEffect, useState } from 'react';
import '../../assets/css/eventflow.css';
import { useLocation } from 'react-router-dom';
import BackToTop from '../../components/elements/BackToTop';
import Header from '../../components/Layout/Header';
import navImg1 from '../../assets/images/resources/logo-1.png';
import Footer from '../../components/Layout/Footer';
import SiteBreadcrumb from '../../components/Common/Breadcumb';
import bannerbg from '../../assets/images/backgrounds/page-header-bg.jpg';
import CtaTwo from '../../components/Common/CtaSection/CtaTwo';
import EventMain from './EventDetails';


// Breadcrumbs Background Image

const Event = () => {
    const location = useLocation();

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

    // Add a marker class to <body> while this page is mounted so
    // the eventflow CSS rules can be scoped to this page only.
    useEffect(() => {
        document.body.classList.add('eventflow-theme');
        return () => {
            document.body.classList.remove('eventflow-theme');
        };
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname, location.search]);

    return (
        <React.Fragment>
{/* <Header
            navImg={navImg1}
            parentMenu='event-details'
            activeMenu="/event-details"
        /> */}
        {/* SiteBreadcrumb */}
        <SiteBreadcrumb
            pageTitle="Event Details"
            pageName="Event Details"
            breadcrumbsImg={bannerbg}
        />
        {/* SiteBreadcrumb */}
        <EventMain/>
        {/*cta-section */}
        <CtaTwo/>
        {/*cta-section end */}
        <BackToTop scroll={isVisible} />
        <Footer />
    </React.Fragment>
    );
}

export default Event;
