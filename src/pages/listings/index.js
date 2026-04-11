import React, { useState, useRef } from "react";
import { useLocation, useHistory } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import styles from "./Listings.module.sass";
import { useListings } from "../../hooks/useListings";
import FilterSidebar from "../../components/listings/FilterSidebar";
import ListingsGrid from "../../components/listings/ListingsGrid";
import MobileFilterModal from "../../components/listings/MobileFilterModal";
import Icon from "../../components/Icon";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";

const Listings = () => {
  const location = useLocation();
  const history = useHistory();
  
  // Get search params from URL or location state
  const searchParams = new URLSearchParams(location.search);
  const locationState = location.state || {};

  // Search state
  const [searchLocation, setSearchLocation] = useState(
    searchParams.get("location") || searchParams.get("search") || locationState.location || ""
  );
  
  // Track the actual search query that has been submitted
  const [activeSearch, setActiveSearch] = useState(searchLocation);
  
  const initialDate = searchParams.get("date") 
    ? moment(searchParams.get("date")).toDate() 
    : (locationState.dateRange?.startDate ? moment(locationState.dateRange.startDate).toDate() : null);
    
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  const initialGuests = searchParams.get("guests")
    ? { adults: parseInt(searchParams.get("guests")), children: 0, infants: 0, pets: 0 }
    : (locationState.guests || { adults: 1, children: 0, infants: 0, pets: 0 });

  const [guests, setGuests] = useState(initialGuests);
  
  const businessInterest = searchParams.get("businessInterest") || locationState.businessInterest || "EXPERIENCE";
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const dateItemRef = useRef(null);
  const guestItemRef = useRef(null);

  // Convert selectedDate to dateRange format for API
  const dateRange = selectedDate ? {
    startDate: moment(selectedDate).format("YYYY-MM-DD"),
    endDate: moment(selectedDate).add(1, "days").format("YYYY-MM-DD"),
  } : null;

  // Filter state
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 10000 },
    propertyTypes: [],
    amenities: [],
    ratings: [],
    categories: [],
  });

  // UI state
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Relevance");

  const sortOptions = ["Relevance", "Price: Low to High", "Price: High to Low", "Rating", "Newest"];

  // Use listings hook - only re-renders when activeSearch or other filters change
  const { data: listings, loading, error, hasMore, fetchMore } = useListings({
    location: activeSearch,
    dateRange,
    guests,
    filters,
    limit: 20,
    businessInterest: businessInterest,
  });
  
  // eslint-disable-next-line no-unused-vars
  const totalCount = listings.length;

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

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

  // Handle search button click or Enter key
  const handleSearch = () => {
    // Update the active search state to trigger a re-fetch
    setActiveSearch(searchLocation);
    
    const newState = {
      location: searchLocation,
      dateRange: dateRange,
      guests: guests,
    };
    history.replace({
      pathname: "/listings",
      search: searchLocation ? `?search=${encodeURIComponent(searchLocation)}` : "",
      state: newState,
    });
  };



  const resetFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 10000 },
      propertyTypes: [],
      amenities: [],
      ratings: [],
      categories: [],
    });
  };

  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        {/* Search Bar Section */}
        <div className={styles.searchBar}>
          <div className={styles.searchField}>
            <Icon name="arrow-right" size="20" />
            <div className={styles.searchFieldContent}>
              <div className={styles.searchLabel}>Where to?</div>
              <input 
                type="text" 
                placeholder="Search Destination" 
                className={styles.searchInput}
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>
          <div className={styles.searchDivider}></div>
          <div 
            className={styles.searchField}
            ref={dateItemRef}
            style={{ position: "relative" }}
          >
            <Icon name="calendar" size="20" />
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
          <div className={styles.searchDivider}></div>
          <div 
            className={styles.searchField}
            ref={guestItemRef}
            style={{ position: "relative" }}
          >
            <Icon name="user" size="20" />
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
          <button className={styles.searchButton} onClick={handleSearch}>Search</button>
        </div>
      </div>
      
      <div className={styles.body}>
        <div className={cn("container", styles.container)}>
          <div className={cn(styles.layout, { [styles.withMap]: showMap })}>
            {/* Filter Sidebar - Desktop */}
            <aside className={styles.sidebar}>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                sorting={sortBy}
                setSorting={setSortBy}
                sortingOptions={sortOptions}
              />
            </aside>
            
            {/* Main Content Area */}
            <main className={styles.main}>
              {/* Mobile Filter Button */}
              <button
                className={cn("button-stroke", styles.mobileFilterButton, "mobile-show")}
                onClick={() => setShowMobileFilters(true)}
              >
                <Icon name="more" size="16" />
                <span>Filters</span>
              </button>
              
              {/* Desktop Map Toggle */}
              <button
                className={cn("button-stroke", styles.mapToggleButton, "desktop-show")}
                onClick={() => setShowMap(!showMap)}
              >
                <Icon name="location" size="16" />
                <span>{showMap ? "Hide map" : "Show map"}</span>
              </button>
              
              {/* Listings Grid */}
              <ListingsGrid
                listings={listings}
                loading={loading}
                error={error}
                hasMore={hasMore}
                onLoadMore={fetchMore}
              />
            </main>
            
            {/* Map View - Right Side (Desktop) */}
            {showMap && (
              <aside className={cn(styles.mapSidebar, "desktop-show")}>
                <div className={styles.mapContainer}>
                  <iframe
                    title="Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63817.0803287881!2d168.63234961382247!3d-45.04173987887954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa9d51df1d7a8de5f%3A0x500ef868479a600!2z0JrRg9C40L3RgdGC0LDRg9C9LCDQndC-0LLQsNGPINCX0LXQu9Cw0L3QtNC40Y8!5e0!3m2!1sru!2sua!4v1624887132616!5m2!1sru!2sua"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Filter Modal */}
      <MobileFilterModal
        visible={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        sorting={sortBy}
        setSorting={setSortBy}
        sortingOptions={sortOptions}
      />
      
      {/* Mobile Map View */}
      {showMap && (
        <div className={cn(styles.mobileMap, "mobile-show")}>
          <div className={styles.mobileMapHeader}>
            <button
              className={styles.mobileMapClose}
              onClick={() => setShowMap(false)}
            >
              <Icon name="close" size="24" />
            </button>
            <span>Map View</span>
          </div>
          <div className={styles.mobileMapContainer}>
            <iframe
              title="Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63817.0803287881!2d168.63234961382247!3d-45.04173987887954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa9d51df1d7a8de5f%3A0x500ef868479a600!2z0JrRg9C40L3RgdGC0LDRg9C9LCDQndC-0LLQsNGPINCX0LXQu9Cw0L3QtNC40Y8!5e0!3m2!1sru!2sua!4v1624887132616!5m2!1sru!2sua"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Listings;



