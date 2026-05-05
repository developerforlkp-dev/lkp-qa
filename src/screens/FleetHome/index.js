import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import styles from "./FleetHome.module.sass";
import Icon from "../../components/Icon";
import { getHomepageSections, getHomepageSectionListings, getEventListings, getStayListings, getFoodMenus, getPlaces } from "../../utils/api";
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
// Experience → 1, Events → 2, Stays → 3, Places → 4, Food → 5
const getBusinessInterestId = (filterId) => {
  if (filterId === "experience") return 1;
  if (filterId === "events") return 2;
  if (filterId === "stays") return 3;
  if (filterId === "food") return 5;
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
  const [searchQuery, setSearchQuery] = useState("");
  const history = useHistory();
  const dateItemRef = useRef(null);
  const guestItemRef = useRef(null);


  // Determine if calendar should be shown (for Experience and Events)
  const showCalendar = activeFilter === "experience" || activeFilter === "events" || activeFilter === "stays";

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

  // Handle Search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedDate) params.append("date", moment(selectedDate).format("YYYY-MM-DD"));
    
    const guestTotal = guests.adults + guests.children;
    if (guestTotal > 0) params.append("guests", guestTotal);

    // Map activeFilter to backend business interest string
    const interestMap = {
      experience: "EXPERIENCE",
      events: "EVENT",
      stays: "STAY",
      food: "FOOD",
      places: "PLACE"
    };
    
    params.append("businessInterest", interestMap[activeFilter] || "EXPERIENCE");

    history.push(`/listings?${params.toString()}`);
  };


  // Close pickers when filter changes
  useEffect(() => {
    setShowDatePicker(false);
    setShowGuestPicker(false);
  }, [activeFilter]);

  // Fetch homepage sections and their listings
  // Business interest IDs: 1=Experience, 2=Events, 3=Stays, 4=Places, 5=Food
  useEffect(() => {

    if (activeFilter === "places") {
      const loadPlaces = async () => {
        setLoading(true);
        setError(null);

        try {
          const result = await getPlaces(20, 0);
          // result is now { section, listings }; use backend section info if available
          const backendSection = result?.section;
          const listings = Array.isArray(result?.listings) ? result.listings : [];
          console.log("📍 Places result from API:", result);
          const newSections = [
            {
              section: {
                sectionId: backendSection?.sectionId || backendSection?.id || "places",
                sectionTitle: backendSection?.sectionTitle || backendSection?.title || backendSection?.name || "Places Nearby",
              },
              listings,
            },
          ];
          console.log("📍 Setting sectionsData for places:", newSections);
          setSectionsData(newSections);
        } catch (err) {
          console.error("❌ Error loading places nearby:", err);
          setSectionsData([]);
          setError(err.message || "Failed to load places");
        } finally {
          setLoading(false);
        }
      };

      loadPlaces();
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
        // Step 1: Fetch sections for the selected business interest
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
          // Use cardStyle exactly as provided by API (case-sensitive)
          const cardStyle = section.cardStyle || "CARD_RECT_VERTICAL_DETAIL";

          // Log section card style for debugging
          console.log(`📋 Section: "${section.sectionTitle}" → Card Style: ${cardStyle}`);
          console.log(`💰 Price displayed check: "${section.priceStartingFrom}"`);
          console.log(`📦 Full section object:`, section);
          console.log(`🔍 Section ${section.sectionId} - "${section.sectionTitle}" full data:`, section);
          console.log(`💰 priceStartingFrom for section ${section.sectionId}:`, section.priceStartingFrom);
          try {
            const sectionData = await getHomepageSectionListings(section.sectionId, 12, 0);
            console.log(`✅ Section ${section.sectionId} data:`, sectionData);


            // Handle different response structures
            let listings = sectionData?.listings || sectionData?.data?.listings || [];
            const sectionInfo = sectionData?.section || section;

            // Fallback: if the section listings endpoint returns empty, try the dedicated public endpoints.
            const sectionTitle = sectionInfo?.sectionTitle || section?.sectionTitle || "";
            const isEventsSection = activeFilter === "events" || (typeof sectionTitle === "string" && sectionTitle.toLowerCase().includes("event"));
            const isStaysSection = activeFilter === "stays" || (typeof sectionTitle === "string" && sectionTitle.toLowerCase().includes("stay"));
            const isFoodSection = activeFilter === "food" || (typeof sectionTitle === "string" && (sectionTitle.toLowerCase().includes("food") || sectionTitle.toLowerCase().includes("menu")));
            
            if (isEventsSection && (!listings || listings.length === 0)) {
              try {
                const eventResult = await getEventListings(12, 0);
                const eventListingsArray = Array.isArray(eventResult?.events) ? eventResult.events : (Array.isArray(eventResult) ? eventResult : []);
                if (eventListingsArray.length > 0) {
                  listings = eventListingsArray;
                }
              } catch (eventErr) {
                console.warn("⚠️ Failed to fetch event listings fallback:", eventErr);
              }
            }
            if (isStaysSection && (!listings || listings.length === 0)) {
              try {
                const stayResult = await getStayListings(12, 0);
                const stayListings = Array.isArray(stayResult?.listings) ? stayResult.listings : (Array.isArray(stayResult?.stays) ? stayResult.stays : (Array.isArray(stayResult) ? stayResult : []));
                if (stayListings.length > 0) {
                  listings = stayListings;
                }
              } catch (stayErr) {
                console.warn("⚠️ Failed to fetch stay listings fallback:", stayErr);
              }
            }
            if (isFoodSection && (!listings || listings.length === 0)) {
              try {
                const foodResult = await getFoodMenus(12, 0);
                const foodListings = Array.isArray(foodResult?.listings) ? foodResult.listings : (Array.isArray(foodResult?.menus) ? foodResult.menus : (Array.isArray(foodResult) ? foodResult : []));
                if (foodListings.length > 0) {
                  listings = foodListings;
                }
              } catch (foodErr) {
                console.warn("⚠️ Failed to fetch food listings fallback:", foodErr);
              }
            }



            console.log(`✅ Section ${section.sectionId} has ${listings.length} listings`);

            // Filter out expired experience listings: if an experience has an end
            // date and that date is before today, remove it from homepage display.
            if (activeFilter === "experience" && Array.isArray(listings) && listings.length > 0) {
              const now = moment();
              const dateFields = [
                'endDate', 'end_date', 'eventEndDate', 'event_end_date',
                'availableUntil', 'availabilityEnd', 'availability_end',
                'bookingEndDate', 'booking_end_date', 'endsAt', 'endAt',
                'eventDate', 'event_date'
              ];

              const beforeCount = listings.length;
              listings = listings.filter((listing) => {
                if (!listing || typeof listing !== 'object') return true;
                for (const f of dateFields) {
                  const raw = listing[f];
                  if (!raw) continue;
                  const m = moment(String(raw));
                  if (!m.isValid()) continue;
                  // exclude if end date is strictly before today
                  if (m.isBefore(now, 'day')) return false;
                  // if valid and not before today, keep it
                  return true;
                }
                // no date field found — keep listing
                return true;
              });
              const afterCount = listings.length;
              if (beforeCount !== afterCount) {
                console.log(`ℹ️ Filtered ${beforeCount - afterCount} expired experience listing(s) from section ${section.sectionId}`);
              }
            }

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
                <input
                  type="text"
                  placeholder="Search Destination"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
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
                    <div className={styles.searchLabel}>
                      {activeFilter === "stays" ? "Check-in" : "Date"}
                    </div>
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
            {showCalendar && (
              <>
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
              </>
            )}
            <button className={styles.searchButton} onClick={handleSearch}>Search</button>
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
                  {!["experience", "events", "stays", "food", "places"].includes(filter.id) && (
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

