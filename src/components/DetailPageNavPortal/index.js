import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useHistory, useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "../../screens/FleetHome/StickyHeaderController.module.sass";

/**
 * DetailPageNavPortal
 *
 * A lightweight sticky navigation that injects category pills into the global
 * Header via React Portal — identical to the homepage StickyHeaderController,
 * but without the search panel.  Used on Experience / Event / Stay / Food detail pages.
 */

const navItems = [
  { id: "experience", label: "Experiences", route: "/experience" },
  { id: "events",     label: "Events",      route: "/events" },
  { id: "stays",      label: "Stays",       route: "/stays" },
  { id: "food",       label: "Food",        route: "/food" },
  { id: "places",     label: "Places",      route: "/places" },
];

const DetailPageNavPortal = ({ heroRef, activeCategory }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const history = useHistory();
  const location = useLocation();

  // Find the portal target in the DOM
  useEffect(() => {
    const target = document.getElementById("header-center-portal");
    if (target) {
      setPortalTarget(target);
    }
  }, []);

  // Intersection Observer: show nav when hero section is scrolled past
  useEffect(() => {
    if (!heroRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "-72px 0px 0px 0px",
      }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [heroRef]);

  if (!portalTarget) return null;

  const content = (
    <div
      className={cn(styles.portalContainer, {
        [styles.visible]: isSticky,
      })}
    >
      {/* Category pills row */}
      <div className={styles.categoryRow}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={cn(styles.categoryPill, {
              [styles.categoryPillActive]: activeCategory === item.id,
            })}
            onClick={() => history.push(item.route)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, portalTarget);
};

export default DetailPageNavPortal;
