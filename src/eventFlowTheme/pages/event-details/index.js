import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EventMain from './EventDetails';

const Event = () => {
    const location = useLocation();

    // Add a marker class to <body> while this page is mounted so
    // any global CSS rules can be scoped to this page if needed.
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
            <EventMain />
        </React.Fragment>
    );
}

export default Event;
