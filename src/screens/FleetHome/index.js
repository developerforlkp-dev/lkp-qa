import React, { useState, useEffect, useRef } from "react";
import cn from "classnames";
import moment from "moment";
import styles from "./FleetHome.module.sass";
import Icon from "../../components/Icon";
import { getHomepageSections, getHomepageSectionListings, getEventListings, getStayListings } from "../../utils/api";
import { HomepageSectionCard } from "./CardStyles";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";
import HeroSection from "./HeroSection";

const filterOptions = [
  { id: "experience", label: "Experience", icon: "star" },
  { id: "events", label: "Events", icon: "calendar" },
  { id: "stays", label: "Stays", icon: "home" },
  { id: "food", label: "Food", icon: "burger" },
  { id: "places", label: "Places", icon: "marker" },
];


/// Business Interest IDs
// Experience → 1, Events → 2, Stays → 4
const getBusinessInterestId = (filterId) => {
  if (filterId === "experience") return 1;
  if (filterId === "events") return 2;
  if (filterId === "stays") return 4;
  return null;
};

const FleetHome = () => {
  const [activeFilter, setActiveFilter] = useState("experience");
  const [sectionsData, setSectionsData] = useState([]); // Array of { section, listings }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state
  const [selectedDate, setSelectedDate] = useState(null);
  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const dateItemRef = useRef(null);
  const guestItemRef = useRef(null);

  // Determine if calendar should be shown (for Experience and Events)
  const showCalendar = activeFilter === "experience" || activeFilter === "events" || activeFilter === "stays";
  
  // Format selected date for display
  const formattedDate = selectedDate
    ? moment(selectedDate).format("MMM DD, YYYY")
    : "Select date";

  // Format guest count for display
  const guestCountText = (() => {
    const total = guests.adults + guests.children;
    if (total === 0) return "Add guests";
    if (total === 1) return "1 guest";
    return `${total} guests`;
  })();

  // Handle date selection
  const handleDateSelect = (startDateStr, endDateStr) => {
    if (startDateStr) {
      const parsedDate = moment(startDateStr, "MMM DD, YYYY");
      if (parsedDate.isValid()) {
        setSelectedDate(parsedDate.toDate());
      }
    }
  };

  // Handle guest change
  const handleGuestChange = (newGuests) => {
    setGuests(newGuests);
  };

  // Close pickers when filter changes
  useEffect(() => {
    setShowDatePicker(false);
    setShowGuestPicker(false);
  }, [activeFilter]);
  
  // Fetch homepage sections and their listings (by business interest: 1=Experience, 2=Events, 3=Stays)
  // On refresh, Experience is selected by default → always call with businessInterestId=1
  useEffect(() => {
    if (activeFilter === "stays") {
      const loadStays = async () => {
        setLoading(true);
        setError(null);

        try {
          const stayListings = await getStayListings(20, 0);
          setSectionsData([
            {
              section: {
                sectionId: "stays",
                sectionTitle: "Stays",
              },
              listings: Array.isArray(stayListings) ? stayListings : [],
            },
          ]);
        } catch (err) {
          console.error("❌ Error loading stays listings:", err);
          setSectionsData([]);
          setError(err.message || "Failed to load stays");
        } finally {
          setLoading(false);
        }
      };

      loadStays();
      return;
    }

    const businessInterestId = getBusinessInterestId(activeFilter) ?? (activeFilter === "experience" ? 1 : null);
    if (businessInterestId == null) {
      // Any other filter that doesn't have a dedicated fetch block or businessInterestId
      return;
    }

    const loadHomepageData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch sections for the selected business interest (1=Experience, 2=Events)
        const fetchedSections = await getHomepageSections(businessInterestId);
        console.log("✅ Fetched homepage sections (businessInterestId=" + businessInterestId + "):", fetchedSections);

        // Sort sections by sortOrder
        const sortedSections = [...fetchedSections].sort((a, b) => {
          const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
          const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
          return orderA - orderB;
        });

        // Step 2: Fetch listings for each section in parallel
        const sectionPromises = sortedSections.map(async (section) => {
          try {
            const sectionData = await getHomepageSectionListings(section.sectionId, 12, 0);
            console.log(`✅ Section ${section.sectionId} data:`, sectionData);

            // Handle different response structures
            let listings = sectionData?.listings || sectionData?.data?.listings || [];
            const sectionInfo = sectionData?.section || section;
        
            // Fallback: if this is an Events/Stays section and the section listings endpoint returns empty,
            // fetch from the dedicated public endpoint.
            const sectionTitle = sectionInfo?.sectionTitle || section?.sectionTitle || "";
            const isEventsSection = typeof sectionTitle === "string" && sectionTitle.toLowerCase().includes("events");
            if (isEventsSection && (!listings || listings.length === 0)) {
              try {
                const eventListings = await getEventListings(12, 0);
                if (Array.isArray(eventListings) && eventListings.length > 0) {
                  listings = eventListings;
                }
              } catch (eventErr) {
                console.warn("⚠️ Failed to fetch event listings fallback:", eventErr);
              }
            }

            console.log(`✅ Section ${section.sectionId} has ${listings.length} listings`);

            return {
              section: sectionInfo,
              listings: listings,
            };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch listings for section ${section.sectionId}:`, err);
            return {
              section: section,
              listings: [], // Return empty listings array if fetch fails
            };
          }
        });

        const sectionsWithListings = await Promise.allSettled(sectionPromises);
        const resolvedSections = sectionsWithListings.map((result) => {
          if (result.status === "fulfilled") {
            return result.value;
          }
          console.warn("⚠️ Section promise rejected:", result.reason);
          return { section: {}, listings: [] };
        });

        console.log("✅ Loaded all sections with listings:", resolvedSections);
        console.log(`✅ Total sections: ${resolvedSections.length}, Sections with listings: ${resolvedSections.filter(s => s.listings && s.listings.length > 0).length}`);

        setSectionsData(resolvedSections);

      } catch (err) {
        console.error("❌ Error loading homepage data:", err);
        // Check if it's a connection/network error
        const isConnectionError = err.message?.includes("proxy") ||
          err.message?.includes("ECONNREFUSED") ||
          err.message?.includes("504") ||
          err.code === "ECONNREFUSED";

        if (isConnectionError) {
          setError("Backend server is not running. Please start the backend server on port 5000.");
        } else {
          setError(err.message || "Failed to load homepage data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadHomepageData();
  }, [activeFilter]);

  return (
    <div className={cn("section", styles.section)}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <HeroSection />
      </div>

      <div className={cn("container", styles.container)}>
        <div className={styles.glassContainer}>
          <div className={styles.searchBar}>
            <div className={styles.searchField}>
              <Icon name="arrow-right" size="16" />
              <div className={styles.searchFieldContent}>
                <div className={styles.searchLabel}>Where to?</div>
                <input type="text" placeholder="Search Destination" className={styles.searchInput} />
              </div>
            </div>
            {showCalendar && (
              <>
                <div className={styles.searchDivider}></div>
                <div
                  className={styles.searchField}
                  ref={dateItemRef}
                  style={{ position: "relative" }}
                >
                  <Icon name="calendar" size="16" />
                  <div
                    className={styles.searchFieldContent}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.searchLabel}>Check-in</div>
                    <div className={styles.searchInput}>
                      {formattedDate}
                    </div>
                  </div>
                  <InlineDatePicker
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onDateSelect={handleDateSelect}
                    selectedDate={selectedDate}
                    className={styles.datePicker}
                  />
                </div>
              </>
            )}
            <div className={styles.searchDivider}></div>
            <div
              className={styles.searchField}
              ref={guestItemRef}
              style={{ position: "relative" }}
            >
              <Icon name="user" size="16" />
              <div
                className={styles.searchFieldContent}
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.searchLabel}>Guest Count</div>
                <div className={styles.searchInput}>{guestCountText}</div>
              </div>
              <GuestPicker
                visible={showGuestPicker}
                onClose={() => setShowGuestPicker(false)}
                onGuestChange={handleGuestChange}
                initialGuests={guests}
                className={styles.guestPicker}
              />
            </div>
            <button className={styles.searchButton}>Search</button>
          </div>

          <div className={styles.filtersContainer}>
            <div className={styles.filtersGrid}>
              {filterOptions.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={cn(styles.filterCard, {
                    [styles.filterCardActive]: activeFilter === filter.id,
                  })}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  <div className={styles.filterCardContent}>
                    <Icon name={filter.icon} size="18" />
                    <span>{filter.label}</span>
                  </div>
                  {!["experience", "events", "stays"].includes(filter.id) && (
                    <div className={styles.comingSoonBadge}>Coming Soon</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Sections from API */}
        {loading && (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>Loading homepage sections...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "#fee", color: "#c33" }}>
            <p>⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && sectionsData.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>No sections available</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Check browser console for API response details
            </p>
          </div>
        )}

        {!loading && !error && sectionsData.length > 0 && sectionsData.every(s => !s.listings || s.listings.length === 0) && (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p>Sections loaded but no listings found</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              {sectionsData.length} section(s) found. Check browser console for details.
            </p>
          </div>
        )}

        {!loading &&
          sectionsData.map((sectionData, index) => {
            if (!sectionData || !sectionData.section) {
              console.warn(`⚠️ Skipping invalid section data at index ${index}:`, sectionData);
              return null;
            }

            if (!sectionData.listings || sectionData.listings.length === 0) {
              console.log(`ℹ️ Section "${sectionData.section.sectionTitle || sectionData.section.sectionId}" has no listings, skipping`);
              return null; // Skip sections with no listings
            }

            return (
              <HomepageSectionCard
                key={sectionData.section.sectionId || index}
                section={sectionData.section}
                listings={sectionData.listings}
              />
            );
          })}
      </div>
    </div>
  );
};

export default FleetHome;

