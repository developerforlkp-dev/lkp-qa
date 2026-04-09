import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';
import MenuItems from './MenuItems';
import MobileMenu from './MobileMenu';
import SearchPopup from './SearchPopup';
import navImg from "../../../assets/images/resources/logo-1.png";

const HeaderStyleFour = (props) => {
    const { parentMenu, secondParentMenu, activeMenu } = props;
    const [isVisible, setIsVisible] = useState(false);
    const [isMobileMenu, setMobileMenu] = useState(false);
    const [isPopup, setIsPopup] = useState(false);

    const handleMobileMenu = () => {
        setMobileMenu(!isMobileMenu);
        if (!isMobileMenu) {
            document.body.classList.add("mobile-menu-visible");
        } else {
            document.body.classList.remove("mobile-menu-visible");
        }
    }

    const handlePopup = () => {
        setIsPopup(!isPopup);
    }


    const handleScroll = () => {
            setIsVisible(window.scrollY > 100);
        };
    
        useEffect(() => {
            document.addEventListener("scroll", handleScroll);
            return () => document.removeEventListener("scroll", handleScroll);
        }, []);

    return (
        <React.Fragment>
            <header className={`main-header-three ${isVisible ? "fixed-header" : ""}`}>
            <nav className="main-menu main-menu-four">
                <div className="main-menu-four__wrapper">
                    <div className="container">
                        <div className="main-menu-four__wrapper-inner">
                            <div className="main-menu-four__left">
                                <div className="main-menu-four__logo">
                                    <Link to="/">
                                        <img src={navImg} alt="Logo" />
                                    </Link>
                                </div>
                            </div>
                            <div className="main-menu-four__main-menu-box">
                                <div className="mobile-nav__toggler" onClick={handleMobileMenu}>
                                    <i className="fa fa-bars"></i>
                                </div>
                                <ul className="main-menu__list">
                                    <MenuItems
                                        parentMenu={parentMenu}
                                        secondParentMenu={secondParentMenu}
                                        activeMenu={activeMenu}
                                    />
                                </ul>
                            </div>
                            <div className="main-menu-four__right">
                                <div className="main-menu-four__btn-box">
                                    <Link to="/contact" className="thm-btn-two main-menu-four__btn">
                                        Get a quote<span className="icon-dubble-arrow-right"></span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
                
            <div className={`stricky-header stricked-menu main-menu main-menu-four ${isVisible ? "stricky-fixed" : ""}`}>
                <div className="sticky-header__content" />
                <nav className="main-menu main-menu-four">
                    <div className="main-menu-four__wrapper">
                        <div className="container">
                            <div className="main-menu-four__wrapper-inner">
                                <div className="main-menu-four__left">
                                    <div className="main-menu-four__logo">
                                        <Link to="/">
                                            <img src={navImg} alt="Logo" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="main-menu-four__main-menu-box">
                                    <div className="mobile-nav__toggler" onClick={handleMobileMenu}>
                                        <i className="fa fa-bars"></i>
                                    </div>
                                    <ul className="main-menu__list">
                                        <MenuItems
                                            parentMenu={parentMenu}
                                            secondParentMenu={secondParentMenu}
                                            activeMenu={activeMenu}
                                        />
                                    </ul>
                                </div>
                                <div className="main-menu-four__right">
                                    <div className="main-menu-four__btn-box">
                                        <Link to="/contact" className="thm-btn-two main-menu-four__btn">
                                            Get a quote<span className="icon-dubble-arrow-right"></span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

                <MobileMenu handleMobileMenu={handleMobileMenu} />
            </header>
            <SearchPopup isPopup={isPopup} handlePopup={handlePopup} />
        </React.Fragment>
    );
}

export default HeaderStyleFour;
