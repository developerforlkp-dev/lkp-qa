import React, { useState, useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import cn from "classnames";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Ticket, Home, Utensils, MapPin } from "lucide-react";
import { getBusinessInterests } from "../../utils/api";
import styles from "./MobileBottomNavbar.module.sass";

const filterOptions = [
  { id: "experience", label: "Experience" },
  { id: "events", label: "Events" },
  { id: "stays", label: "Stays" },
  { id: "food", label: "Food" },
  { id: "places", label: "Places" },
];

const mapBusinessInterestCodeToFilterId = (code) => {
  const normalized = String(code || "").toUpperCase().trim();
  if (normalized === "EVENT" || normalized === "EVENTS") return "events";
  if (normalized === "STAY" || normalized === "STAYS") return "stays";
  if (normalized === "FOOD") return "food";
  if (normalized === "PLACE" || normalized === "PLACES") return "places";
  return "experience";
};

const getActiveFilterFromPath = (pathname, search) => {
  const normalizedPath = pathname.toLowerCase().replace(/\/$/, "");

  // Check listings page query parameters
  if (normalizedPath.includes("/listings")) {
    const params = new URLSearchParams(search);
    const interest = params.get("businessInterest");
    if (interest) {
      const normalizedInterest = interest.toUpperCase().trim();
      if (normalizedInterest === "EXPERIENCE") return "experience";
      if (normalizedInterest === "EVENT") return "events";
      if (normalizedInterest === "STAY") return "stays";
      if (normalizedInterest === "FOOD") return "food";
      if (normalizedInterest === "PLACE") return "places";
    }
  }

  // Fallback/matching simple paths
  if (normalizedPath === "/events" || normalizedPath === "/event") return "events";
  if (normalizedPath === "/stays") return "stays";
  if (normalizedPath === "/food") return "food";
  if (normalizedPath === "/places") return "places";

  return "experience"; // default is experience (which is root "/")
};

const shouldShowNavbar = (pathname, search) => {
  const path = pathname.toLowerCase().replace(/\/$/, "");
  
  // Stays detail page is rendered on /stays when there is an 'id' query param
  if (path === "/stays") {
    const params = new URLSearchParams(search);
    if (params.has("id")) {
      return false;
    }
  }

  const allowedPaths = [
    "",
    "/",
    "/experience",
    "/experiences",
    "/events",
    "/event",
    "/stays",
    "/food",
    "/places",
    "/listings"
  ];

  return allowedPaths.includes(path);
};

export default function MobileBottomNavbar() {
  const history = useHistory();
  const location = useLocation();
  
  const [businessInterestAvailability, setBusinessInterestAvailability] = useState({});
  const [businessInterestActiveMap, setBusinessInterestActiveMap] = useState({});
  
  // Scroll and visibility state
  const [visible, setVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const loadBusinessInterests = async () => {
      try {
        const interests = await getBusinessInterests();
        const availabilityMap = {};
        const activeMap = {};
        interests.forEach((interest) => {
          const filterId = mapBusinessInterestCodeToFilterId(interest?.code);
          availabilityMap[filterId] = Boolean(interest?.isEnabledForListings);
          activeMap[filterId] = Boolean(interest?.isActive);
        });
        setBusinessInterestAvailability(availabilityMap);
        setBusinessInterestActiveMap(activeMap);
      } catch (err) {
        console.warn("Failed to load business interests for global mobile navbar:", err?.message || err);
      }
    };

    loadBusinessInterests();
  }, []);

  // Reset visibility to true on route change
  useEffect(() => {
    setVisible(true);
  }, [location.pathname]);

  // Set up scroll direction and footer visibility tracking
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const lastScrollY = lastScrollYRef.current;

          // 1. If we are near the top of the page, always show the navbar
          if (currentScrollY < 10) {
            setVisible(true);
            lastScrollYRef.current = currentScrollY;
            ticking = false;
            return;
          }

          // 2. Check if footer is visible in the viewport
          const footer = document.querySelector(".cinematic-footer");
          if (footer) {
            const rect = footer.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
              setVisible(false);
              lastScrollYRef.current = currentScrollY;
              ticking = false;
              return;
            }
          }

          // 3. Compare scroll positions to decide visibility (threshold of 5px)
          if (Math.abs(currentScrollY - lastScrollY) > 5) {
            if (currentScrollY > lastScrollY) {
              setVisible(false); // scrolling down -> hide
            } else {
              setVisible(true);  // scrolling up -> show
            }
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Set up MutationObserver to monitor open modals or body scroll locks
  useEffect(() => {
    if (typeof document === "undefined") return;

    const checkModal = () => {
      const open = (
        document.body.style.overflow === "hidden" ||
        !!document.querySelector('[class*="Modal_modal"]') ||
        !!document.querySelector('[class*="PhotoView_modal"]')
      );
      setModalOpen(open);

      // Detect mobile search sheet via body class set by MobileCinematicSearch
      const sheetOpen = document.body.classList.contains("mcsh-search-open");
      setSearchSheetOpen(sheetOpen);
    };

    checkModal();

    const observer = new MutationObserver(() => {
      checkModal();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!shouldShowNavbar(location.pathname, location.search)) {
    return null;
  }

  const activeFilter = getActiveFilterFromPath(location.pathname, location.search);

  const handleFilterClick = (filterId) => {
    if (businessInterestActiveMap[filterId] === false) return;
    if (businessInterestAvailability[filterId] === false) return;

    const targetPath = filterId === "experience" ? "/" : `/${filterId}`;
    
    if (location.pathname !== targetPath) {
      history.push(targetPath);
    }
  };

  const visibleFilterOptions = filterOptions.filter(
    (filter) => businessInterestActiveMap[filter.id] !== false
  );

  // Navbar is hidden when: scrolled down, a modal is open, or the mobile search sheet is open
  const isNavbarVisible = visible && !modalOpen && !searchSheetOpen;

  return (
    <div className={cn(styles.mobileNavbarContainer, { [styles.hidden]: !isNavbarVisible })}>
      <div className={styles.mobileNavbar}>
        {visibleFilterOptions.map((filter) => {
          const isEnabledForListings = businessInterestAvailability[filter.id] !== false;
          const isActive = activeFilter === filter.id;

          let IconComponent;
          switch (filter.id) {
            case "experience":
              IconComponent = Compass;
              break;
            case "events":
              IconComponent = Ticket;
              break;
            case "stays":
              IconComponent = Home;
              break;
            case "food":
              IconComponent = Utensils;
              break;
            case "places":
              IconComponent = MapPin;
              break;
            default:
              IconComponent = Compass;
          }

          return (
            <motion.button
              key={filter.id}
              type="button"
              className={cn(styles.mobileNavItem, {
                [styles.mobileNavItemActive]: isActive,
                [styles.mobileNavItemDisabled]: !isEnabledForListings,
              })}
              onClick={() => handleFilterClick(filter.id)}
              disabled={!isEnabledForListings}
              whileTap={isEnabledForListings ? { scale: 0.92 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {/* Sliding active capsule background */}
              {isActive && (
                <motion.div
                  layoutId="activeGlobalMobileTabBg"
                  className={styles.mobileActiveBg}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <div className={styles.mobileNavItemInner}>
                <IconComponent
                  size={isActive ? 22 : 18}
                  className={cn(styles.mobileNavIcon, {
                    [styles.mobileNavIconActive]: isActive,
                  })}
                />
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, scale: 0.8 }}
                      animate={{ opacity: 1, width: "auto", scale: 1 }}
                      exit={{ opacity: 0, width: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className={styles.mobileNavLabel}
                    >
                      {filter.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

