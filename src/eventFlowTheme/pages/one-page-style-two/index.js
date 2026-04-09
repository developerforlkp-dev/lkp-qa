import React, { useEffect, useState } from 'react';
import HomeTwoMain from './HomeTwoMain';
import FooterTwo from '../../components/Layout/Footer/FooterStyleTwo';
import BackToTop from '../../components/elements/BackToTop';
import HeaderStyleSix from '../../components/Layout/Header/HeaderStyleSix';

const HomeTwo = () => {
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
		<div className="body-bg-color-2">
		<React.Fragment>
            <HeaderStyleSix />
            <HomeTwoMain/>
            <BackToTop scroll={isVisible} />
            <FooterTwo />
		</React.Fragment>
		</div>
	);
}

export default HomeTwo;
