import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import cn from "classnames";
import styles from "./StickyHeaderController.module.sass";
import Icon from "../../components/Icon";
import InlineDatePicker from "../../components/InlineDatePicker";
import GuestPicker from "../../components/GuestPicker";

/**
 * StickyHeaderController
 *
 * Premium compact sticky navigation injected into the global Header via React Portal.
 * Features an expanding search dropdown when the search icon is clicked.
 */
const StickyHeaderController = ({
  heroRef,
  // Category data
  visibleFilterOptions,
  activeFilter,
  handleFilterClick,
  businessInterestAvailability,
  businessInterestActiveMap,
  // Search state
  searchQuery,
  setSearchQuery,
  selectedDestination,
  setSelectedDestination,
  selectedDate,
  guests,
  showCalendar,
  formattedDate,
  guestCountText,
  handleSearch,
  handleDateSelect,
  handleGuestChange,
  destinationSuggestions,
  selectDestinationSuggestion,
  destinationRef,
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  
  // Automatically show suggestions when they arrive from the parent component
  useEffect(() => {
    if (destinationSuggestions && destinationSuggestions.length > 0) {
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
    }
  }, [destinationSuggestions]);

  const searchPanelRef = useRef(null);
  const searchIconBtnRef = useRef(null);
  const stickyDestinationRef = useRef(null);
  const dateFieldRef = useRef(null);
  const guestFieldRef = useRef(null);

  // Find the portal target in the DOM
  useEffect(() => {
    // Only search for it after mounting
    const target = document.getElementById("header-center-portal");
    if (target) {
      setPortalTarget(target);
    }
  }, []);

  // ─── Intersection Observer: hero section ─────────────────────────────────
  useEffect(() => {
    if (!heroRef?.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
        if (entry.isIntersecting) {
          // Close search panel if scrolling back to top
          setIsSearchPanelOpen(false);
        }
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "-72px 0px 0px 0px", // Account for existing header height
      }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [heroRef]);

  // ─── Close search panel and dropdowns on outside click or Escape ────────
  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Close destination suggestions if clicking outside destination field
      if (
        stickyDestinationRef.current &&
        !stickyDestinationRef.current.contains(event.target)
      ) {
        setShowDestinationSuggestions(false);
        setActiveSuggestionIndex(-1);
      }

      // Close the entire search panel if clicking outside the panel and not on the toggle button
      if (
        isSearchPanelOpen &&
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target) &&
        searchIconBtnRef.current &&
        !searchIconBtnRef.current.contains(event.target)
      ) {
        // Only close if we didn't click inside a picker (like date or guest picker)
        // Since pickers are rendered inline but might overlap, checking searchPanelRef.current.contains is usually enough
        setIsSearchPanelOpen(false);
        setShowDatePicker(false);
        setShowGuestPicker(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSearchPanelOpen(false);
        setShowDatePicker(false);
        setShowGuestPicker(false);
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [
    isSearchPanelOpen,
    setShowDestinationSuggestions,
    setActiveSuggestionIndex,
    setShowDatePicker,
    setShowGuestPicker
  ]);

  // ─── Handle search input keyboard navigation ────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        if (destinationSuggestions.length === 0) return;
        e.preventDefault();
        setShowDestinationSuggestions(true);
        setActiveSuggestionIndex((prev) =>
          prev < destinationSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        if (destinationSuggestions.length === 0) return;
        e.preventDefault();
        setShowDestinationSuggestions(true);
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : destinationSuggestions.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (
          showDestinationSuggestions &&
          activeSuggestionIndex >= 0 &&
          destinationSuggestions[activeSuggestionIndex]
        ) {
          selectDestinationSuggestion(
            destinationSuggestions[activeSuggestionIndex]
          );
        } else {
          handleSearch();
          setIsSearchPanelOpen(false);
        }
      }
    },
    [
      destinationSuggestions,
      showDestinationSuggestions,
      activeSuggestionIndex,
      setShowDestinationSuggestions,
      setActiveSuggestionIndex,
      selectDestinationSuggestion,
      handleSearch,
    ]
  );

  const toggleSearchPanel = () => {
    setIsSearchPanelOpen((prev) => !prev);
  };

  const executeSearch = () => {
    handleSearch();
    setIsSearchPanelOpen(false);
  };

  // If we don't have the portal target yet, render nothing
  if (!portalTarget) return null;

  // The content to inject into the Header
  const compactHeaderContent = (
    <>
      <div
        className={cn(styles.portalContainer, {
          [styles.visible]: isSticky,
        })}
      >
        {/* Category pills row */}
        <div className={styles.categoryRow}>
          {visibleFilterOptions.map((filter) => {
            const isEnabledForListings =
              businessInterestAvailability[filter.id] !== false;
            return (
              <button
                key={filter.id}
                className={cn(styles.categoryPill, {
                  [styles.categoryPillActive]: activeFilter === filter.id,
                  [styles.categoryPillDisabled]: !isEnabledForListings,
                })}
                onClick={() => {
                  if (isEnabledForListings) {
                    handleFilterClick(filter.id);
                  }
                }}
                disabled={!isEnabledForListings}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className={styles.divider} />

        {/* Search Icon Button */}
        <button
          ref={searchIconBtnRef}
          className={styles.searchIconButton}
          onClick={toggleSearchPanel}
          aria-label="Toggle search"
        >
          <Icon name={isSearchPanelOpen ? "close" : "search"} size={isSearchPanelOpen ? "16" : "20"} color="#fff" />
        </button>
      </div>

      {/* Expanding Search Panel Dropdown */}
      {isSticky && (
        <div className={styles.searchPanelOverlay}>
          <div 
            ref={searchPanelRef}
            className={cn(styles.searchPanel, {
              [styles.visible]: isSearchPanelOpen,
            })}
          >
            {/* Destination field */}
            <div
              className={styles.searchField}
              ref={stickyDestinationRef}
            >
              <div className={styles.searchFieldContent}>
                <div className={styles.searchLabel}>Where</div>
                <input
                  type="text"
                  placeholder="Search destinations..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    if (
                      !selectedDestination ||
                      value !== selectedDestination.description
                    ) {
                      setSelectedDestination(null);
                    }
                  }}
                  onFocus={() => {
                    if (destinationSuggestions.length > 0) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                />
                {showDestinationSuggestions &&
                  destinationSuggestions.length > 0 && (
                    <div className={styles.destinationSuggestions}>
                      {destinationSuggestions.map((suggestion, index) => (
                        <button
                          key={
                            suggestion.place_id ||
                            suggestion.description ||
                            index
                          }
                          type="button"
                          className={cn(styles.suggestionItem, {
                            [styles.suggestionItemActive]:
                              index === activeSuggestionIndex,
                          })}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            selectDestinationSuggestion(suggestion)
                          }
                        >
                          {suggestion.description}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Date field — conditional */}
            {showCalendar && (
              <>
                <div className={styles.searchDivider} />
                <div
                  className={styles.searchField}
                  ref={dateFieldRef}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <div className={styles.searchFieldContent}>
                    <div className={styles.searchLabel}>When</div>
                    <div className={styles.searchInput}>
                      {formattedDate === "Add dates"
                        ? "Add dates"
                        : formattedDate}
                    </div>
                  </div>
                  <InlineDatePicker
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onDateSelect={handleDateSelect}
                    selectedDate={selectedDate}
                    className={styles.datePickerContainer}
                  />
                </div>
              </>
            )}

            {/* Guest field — conditional */}
            {showCalendar && (
              <>
                <div className={styles.searchDivider} />
                <div
                  className={styles.searchField}
                  ref={guestFieldRef}
                  onClick={() => setShowGuestPicker(!showGuestPicker)}
                >
                  <div className={styles.searchFieldContent}>
                    <div className={styles.searchLabel}>Who</div>
                    <div className={styles.searchInput}>{guestCountText}</div>
                  </div>
                  <GuestPicker
                    visible={showGuestPicker}
                    onClose={() => setShowGuestPicker(false)}
                    onGuestChange={handleGuestChange}
                    initialGuests={guests}
                    className={styles.guestPickerContainer}
                  />
                </div>
              </>
            )}

            {/* Search button inside dropdown */}
            <button
              className={styles.searchButton}
              onClick={executeSearch}
              aria-label="Search"
            >
              <Icon name="search" size="20" color="#fff" />
              Search
            </button>
          </div>
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(compactHeaderContent, portalTarget);
};

export default StickyHeaderController;
