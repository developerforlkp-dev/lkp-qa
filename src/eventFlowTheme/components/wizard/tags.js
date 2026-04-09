import React from 'react';
import { Link } from 'react-router-dom'; // Use react-router-dom for routing

export default function Tags() {
  return (
    <>
      <div className="sidebar__single sidebar__tags">
        <div className="sidebar__title-box">
          <div className="sidebar__title-shape">
            <img
              src="assets/images/shapes/sidebar-title-shape.png"
              alt=""
            />
          </div>
          <h3 className="sidebar__title">Tags</h3>
        </div>
        <div className="sidebar__tags-list">
          <Link to="#">
            Roof Renewal
          </Link>
          <Link to="#">
            Roof Pros
          </Link>
          <Link to="#">
            Solutions
          </Link>
          <Link to="#">
            Roofing Services
          </Link>
          <Link to="#">
            Repair
          </Link>
          <Link to="#">
            Roof Revive
          </Link>
        </div>
      </div>
    </>
  );
}
