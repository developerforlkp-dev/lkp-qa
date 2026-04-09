"use client";
import React from 'react';
import { Link } from 'react-router-dom';
import { useState } from "react";
import MobileLogo from '../../..//assets/images/resources/logo-1.png'

const MobileMenu = ({ isSidebar, handleMobileMenu, handleSidebar }) => {
  const [isActive, setIsActive] = useState({
    status: false,
    key: "",
    subMenuKey: "",
  });

  const handleToggle = (key, subMenuKey = "") => {
    if (isActive.key === key && isActive.subMenuKey === subMenuKey) {
      setIsActive({
        status: false,
        key: "",
        subMenuKey: "",
      });
    } else {
      setIsActive({
        status: true,
        key,
        subMenuKey,
      });
    }
  };
  return (
    <>
      {/*End Mobile Menu */}
      <div className="mobile-nav__wrapper">
        <div
          className="mobile-nav__overlay mobile-nav__toggler"
          onClick={handleMobileMenu}
        />
        {/* /.mobile-nav__overlay */}
        <div className="mobile-nav__content">
          <span
            className="mobile-nav__close mobile-nav__toggler"
            onClick={handleMobileMenu}
          >
            <i className="fa fa-times" />
          </span>
          <div className="logo-box">
            <Link to="/" aria-label="logo image">
            <img src={MobileLogo} alt="Logo" />
            </Link>
          </div>
          {/* /.logo-box */}
          <div className="mobile-nav__container">
          <ul className="main-menu__list">
  <li className={isActive.key === 1 ? "dropdown current" : "dropdown"}>
    <Link to="/" onClick={handleMobileMenu}>
      Home{" "}
    </Link>
    <ul style={{ display: `${isActive.key === 1 ? "block" : "none"}` }}>
      <li>
        <Link to="/" onClick={handleMobileMenu}>
          Home One
        </Link>
      </li>
      <li>
        <Link to="/index-2" onClick={handleMobileMenu}>
          Home Two
        </Link>
      </li>
      <li>
        <Link to="/index-3" onClick={handleMobileMenu}>
          Home Three
        </Link>
      </li>
      <li className={isActive.subMenuKey === 2 ? "dropdown current" : "dropdown"}>
        <Link to="#" onClick={handleMobileMenu}>
          Header Styles
        </Link>
        <ul style={{ display: `${isActive.subMenuKey === 2 ? "block" : "none"}` }}>
          <li>
            <Link to="/header-one" onClick={handleMobileMenu}>
              Header One
            </Link>
          </li>
          <li>
            <Link to="/header-two" onClick={handleMobileMenu}>
              Header Two
            </Link>
          </li>
          <li>
            <Link to="/header-three" onClick={handleMobileMenu}>
              Header Three
            </Link>
          </li>
        </ul>
        <div
          className={isActive.subMenuKey === 2 ? "dropdown-btn open" : "dropdown-btn"}
          onClick={() => handleToggle(1, 2)}
        >
          <span className="fa fa-angle-right" />
        </div>
      </li>
      <li className={isActive.subMenuKey === 3 ? "dropdown current" : "dropdown"}>
        <Link to="#" onClick={handleMobileMenu}>
          One Page Styles
        </Link>
        <ul style={{ display: `${isActive.subMenuKey === 3 ? "block" : "none"}` }}>
          <li>
            <Link to="/one-page-style-one" onClick={handleMobileMenu}>
              One Page Styles One
            </Link>
          </li>
          <li>
            <Link to="/one-page-style-two" onClick={handleMobileMenu}>
              One Page Styles Two
            </Link>
          </li>
          <li>
            <Link to="/one-page-style-three" onClick={handleMobileMenu}>
              One Page Styles Three
            </Link>
          </li>
        </ul>
        <div
          className={isActive.subMenuKey === 3 ? "dropdown-btn open" : "dropdown-btn"}
          onClick={() => handleToggle(1, 3)}
        >
          <span className="fa fa-angle-right" />
        </div>
      </li>
    </ul>
    <div
      className={isActive.key === 1 ? "dropdown-btn open" : "dropdown-btn"}
      onClick={() => handleToggle(1)}
    >
      <span className="fa fa-angle-right" />
    </div>
  </li>

  <li className={isActive.key === 2 ? "dropdown current" : "dropdown"}>
    <Link to="#" onClick={handleMobileMenu}>
      Pages
    </Link>
    <ul style={{ display: `${isActive.key === 2 ? "block" : "none"}` }}>
      <li>
        <Link to="/about" onClick={handleMobileMenu}>
          About Us
        </Link>
      </li>
      <li>
        <Link to="/team" onClick={handleMobileMenu}>
          Team
        </Link>
      </li>
      <li>
        <Link to="/team-details" onClick={handleMobileMenu}>
          Team Details
        </Link>
      </li>
      <li>
        <Link to="/testimonials" onClick={handleMobileMenu}>
          Testimonials
        </Link>
      </li>
      <li>
        <Link to="/pricing" onClick={handleMobileMenu}>
          Pricing
        </Link>
      </li>
      <li>
        <Link to="/gallery" onClick={handleMobileMenu}>
          Gallery
        </Link>
      </li>
      <li>
        <Link to="/gallery-details" onClick={handleMobileMenu}>
          Gallery Details
        </Link>
      </li>
      <li>
        <Link to="/faq" onClick={handleMobileMenu}>
          FAQ
        </Link>
      </li>
      <li>
        <Link to="/404" onClick={handleMobileMenu}>
          404 Error
        </Link>
      </li>
    </ul>
    <div
      className={isActive.key === 2 ? "dropdown-btn open" : "dropdown-btn"}
      onClick={() => handleToggle(2)}
    >
      <span className="fa fa-angle-right" />
    </div>
  </li>

  <li className={isActive.key === 3 ? "dropdown current" : "dropdown"}>
    <Link to="#" onClick={handleMobileMenu}>
      Services
    </Link>
    <ul style={{ display: `${isActive.key === 3 ? "block" : "none"}` }}>
      <li>
        <Link to="/services" onClick={handleMobileMenu}>
          Services
        </Link>
      </li>
      <li>
        <Link to="/event-prodigy" onClick={handleMobileMenu}>
          Event Prodigy
        </Link>
      </li>
      <li>
        <Link to="/stellar-events-co" onClick={handleMobileMenu}>
          Stellar Events Co
        </Link>
      </li>
      <li>
        <Link to="/elite-event-management" onClick={handleMobileMenu}>
          Elite Event Management
        </Link>
      </li>
      <li>
        <Link to="/infinite-occasions" onClick={handleMobileMenu}>
          Infinite Occasions
        </Link>
      </li>
      <li>
        <Link to="/dream-event-planners" onClick={handleMobileMenu}>
          Dream Event Planners
        </Link>
      </li>
    </ul>
    <div
      className={isActive.key === 3 ? "dropdown-btn open" : "dropdown-btn"}
      onClick={() => handleToggle(3)}
    >
      <span className="fa fa-angle-right" />
    </div>
  </li>

  <li className={isActive.key === 4 ? "dropdown current" : "dropdown"}>
    <Link to="#" onClick={handleMobileMenu}>
      Event
    </Link>
    <ul style={{ display: `${isActive.key === 4 ? "block" : "none"}` }}>
      <li>
        <Link to="/event" onClick={handleMobileMenu}>
          Event
        </Link>
      </li>
      <li>
        <Link to="/event-details" onClick={handleMobileMenu}>
          Event Details
        </Link>
      </li>
    </ul>
    <div
      className={isActive.key === 4 ? "dropdown-btn open" : "dropdown-btn"}
      onClick={() => handleToggle(4)}
    >
      <span className="fa fa-angle-right" />
    </div>
  </li>

  <li className={isActive.key === 5 ? "dropdown current" : "dropdown"}>
    <Link to="#" onClick={handleMobileMenu}>
      Blog
    </Link>
    <ul style={{ display: `${isActive.key === 5 ? "block" : "none"}` }}>
      <li>
        <Link to="/blog" onClick={handleMobileMenu}>
          Blog
        </Link>
      </li>
      <li>
        <Link to="/blog-list" onClick={handleMobileMenu}>
          Blog List
        </Link>
      </li>
      <li>
        <Link to="/blog-details" onClick={handleMobileMenu}>
          Blog Details
        </Link>
      </li>
    </ul>
    <div
      className={isActive.key === 5 ? "dropdown-btn open" : "dropdown-btn"}
      onClick={() => handleToggle(5)}
    >
      <span className="fa fa-angle-right" />
    </div>
  </li>

  <li>
    <Link to="/contact" onClick={handleMobileMenu}>
      Contact
    </Link>
  </li>
</ul>
          </div>
          <ul className="mobile-nav__contact list-unstyled">
            <li>
              <i className="fa fa-envelope" />
              <a href="mailto:needhelp@packageName__.com">
                needhelp@eventflow.com
              </a>
            </li>
            <li>
              <i className="fa fa-phone-alt" />
              <a href="tel:666-888-0000">666 888 0000</a>
            </li>
          </ul>
          {/* /.mobile-nav__contact */}
          <div className="mobile-nav__top">
            <div className="mobile-nav__social">
              <Link to="#" className="fab fa-twitter" />
              <Link to="#" className="fab fa-facebook-square" />
              <Link to="#" className="fab fa-pinterest-p" />
              <Link to="#" className="fab fa-instagram" />
            </div>
            {/* /.mobile-nav__social */}
          </div>
          {/* /.mobile-nav__top */}
        </div>
        {/* /.mobile-nav__content */}
      </div>

      <div
        className="nav-overlay"
        style={{ display: `${isSidebar ? "block" : "none"}` }}
        onClick={handleSidebar}
      />
    </>
  );
};
export default MobileMenu;
