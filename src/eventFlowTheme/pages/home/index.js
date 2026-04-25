import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EventDetails from '../event-details/EventDetails';

const Home = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [location.pathname, location.search]);

    return (
        <React.Fragment>
             <EventDetails />
        </React.Fragment>
    );
}

export default Home;
