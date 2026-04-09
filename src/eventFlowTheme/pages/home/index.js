import React, { useEffect, useState } from 'react';
import '../../assets/css/eventflow.css';
import { useLocation } from 'react-router-dom';
import HomeMain from './HomeMain';
import Footer from '../../components/Layout/Footer';
import BackToTop from '../../components/elements/BackToTop';


const Home = () => {
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

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname, location.search]);

    return (
        <div className="eventflow-home-page">
             <HomeMain />
            <BackToTop scroll={isVisible} />
            <Footer />
        </div>
    );
}

export default Home;
