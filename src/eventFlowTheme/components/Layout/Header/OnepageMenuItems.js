import React, { useState } from 'react';

const OnepageMenuItems = (props) => {
    const { menuItem1, menuItem2, menuItem3, menuItem4, menuItem5, menuItem6, menuItem7, menuItem8 } = props;

    const [activeMenu, setActiveMenu] = useState('home');

    const addActiveClass = (menu) => {
        setActiveMenu(menu);
        const sectionId = `th-${menu}`;
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <React.Fragment>
            {menuItem1 && (
                <li className={activeMenu === 'home' ? 'current-menu-item' : ''}>
                    <a 
                        href="#home"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('home');
                        }}
                    >
                        {menuItem1}
                    </a>
                </li>
            )}
            {menuItem2 && (
                <li className={activeMenu === 'about' ? 'current-menu-item' : ''}>
                    <a 
                        href="#about"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('about');
                        }}
                    >
                        {menuItem2}
                    </a>
                </li>
            )}
            {menuItem3 && (
                <li className={activeMenu === 'service' ? 'current-menu-item' : ''}>
                    <a 
                        href="#service"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('service');
                        }}
                    >
                        {menuItem3}
                    </a>
                </li>
            )}
            {menuItem4 && (
                <li className={activeMenu === 'portfolio' ? 'current-menu-item' : ''}>
                    <a 
                        href="#portfolio"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('portfolio');
                        }}
                    >
                        {menuItem4}
                    </a>
                </li>
            )}
            {menuItem5 && (
                <li className={activeMenu === 'team' ? 'current-menu-item' : ''}>
                    <a 
                        href="#team"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('team');
                        }}
                    >
                        {menuItem5}
                    </a>
                </li>
            )}
            {menuItem6 && (
                <li className={activeMenu === 'event' ? 'current-menu-item' : ''}>
                    <a 
                        href="#event"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('event');
                        }}
                    >
                        {menuItem6}
                    </a>
                </li>
            )}
            {menuItem7 && (
                <li className={activeMenu === 'blog' ? 'current-menu-item' : ''}>
                    <a 
                        href="#blog"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('blog');
                        }}
                    >
                        {menuItem7}
                    </a>
                </li>
            )}
            {menuItem8 && (
                <li className={activeMenu === 'contact' ? 'current-menu-item' : ''}>
                    <a 
                        href="#contact"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('contact');
                        }}
                    >
                        {menuItem8}
                    </a>
                </li>
            )}
        </React.Fragment>
    );
};

export default OnepageMenuItems;
