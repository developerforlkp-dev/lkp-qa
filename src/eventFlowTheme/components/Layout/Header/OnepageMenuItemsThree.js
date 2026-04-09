import React, { useState } from 'react';

const OnepageMenuItemsThree = (props) => {
    const { menuItem1, menuItem2, menuItem3, menuItem4, menuItem5, menuItem6 } = props;

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
                <li className={activeMenu === 'services' ? 'current-menu-item' : ''}>
                    <a 
                        href="#services"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('services');
                        }}
                    >
                        {menuItem2}
                    </a>
                </li>
            )}
            {menuItem3 && (
                <li className={activeMenu === 'event' ? 'current-menu-item' : ''}>
                    <a 
                        href="#event"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('event');
                        }}
                    >
                        {menuItem3}
                    </a>
                </li>
            )}
            {menuItem4 && (
                <li className={activeMenu === 'team' ? 'current-menu-item' : ''}>
                    <a 
                        href="#team"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('team');
                        }}
                    >
                        {menuItem4}
                    </a>
                </li>
            )}
            
            {menuItem5 && (
                <li className={activeMenu === 'pricing' ? 'current-menu-item' : ''}>
                    <a 
                        href="#pricing"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('pricing');
                        }}
                    >
                        {menuItem5}
                    </a>
                </li>
            )}
            {menuItem6 && (
                <li className={activeMenu === 'blog' ? 'current-menu-item' : ''}>
                    <a 
                        href="#blog"
                        onClick={(e) => {
                            e.preventDefault();
                            addActiveClass('blog');
                        }}
                    >
                        {menuItem6}
                    </a>
                </li>
            )}
        </React.Fragment>
    );
};

export default OnepageMenuItemsThree;
