import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useHistory } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import styles from "../../screens/FleetHome/StickyHeaderController.module.sass";
import Icon from "../Icon";
import InlineDatePicker from "../InlineDatePicker";
import GuestPicker from "../GuestPicker";
import { useTheme } from "../../components/JUI/Theme";

/**
 * DetailPageNavPortal
 *
 * An Airbnb-style search pill injected into the global Header via React Portal.
 * When clicked, it opens the full Where/When/Who search panel like the homepage.
 */

const DetailPageNavPortal = ({ heroRef, activeCategory = "experience" }) => {
  const { theme, tokens: { FG, W, B, A, M, BG } } = useTheme();
  const [isSticky, setIsSticky] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  
  const showDateAndGuest = !['food', 'place', 'places'].includes(activeCategory);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const searchPanelRef = useRef(null);
  const searchPillRef = useRef(null);
  const stickyDestinationRef = useRef(null);
  const dateFieldRef = useRef(null);
  const guestFieldRef = useRef(null);
  
  const history = useHistory();

  // ─── Setup Portal Target ───────────────────────────────────────────────
  useEffect(() => {
    const target = document.getElementById("header-center-portal");
    if (target) {
      setPortalTarget(target);
    }
  }, []);

  // ─── Intersection Observer ─────────────────────────────────────────────
  // (Removed since we want the search pill visible at all times)

  const autocompleteServiceRef = useRef(null);
  const autocompleteSessionTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // ─── Initialize Autocomplete Service ───────────────────────────────────
  useEffect(() => {
    if (window.google?.maps?.places?.AutocompleteService) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      autocompleteSessionTokenRef.current = window.google.maps.places.AutocompleteSessionToken
        ? new window.google.maps.places.AutocompleteSessionToken()
        : null;
    }
  }, []);

  // ─── Destination Autocomplete ──────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery?.trim()) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (!autocompleteServiceRef.current) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchQuery.trim(),
          types: ["geocode"],
          sessionToken: autocompleteSessionTokenRef.current || undefined,
        },
        (predictions, status) => {
          if (status === "OK" && Array.isArray(predictions) && predictions.length > 0) {
            setDestinationSuggestions(predictions);
            setShowDestinationSuggestions(true);
            setActiveSuggestionIndex(-1);
          } else {
            setDestinationSuggestions([]);
            setShowDestinationSuggestions(false);
            setActiveSuggestionIndex(-1);
          }
        }
      );
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const selectDestinationSuggestion = (suggestion) => {
    setSelectedDestination(suggestion);
    setSearchQuery(suggestion.description);
    setShowDestinationSuggestions(false);
    setActiveSuggestionIndex(-1);
    setShowDatePicker(true); // auto advance
  };

  // ─── Outside Click / Escape Handling ───────────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (stickyDestinationRef.current && !stickyDestinationRef.current.contains(event.target)) {
        setShowDestinationSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
      if (
        isSearchPanelOpen &&
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target) &&
        searchPillRef.current &&
        !searchPillRef.current.contains(event.target)
      ) {
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
  }, [isSearchPanelOpen]);

  // ─── Keyboard Navigation for Suggestions ───────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") {
      if (destinationSuggestions.length === 0) return;
      e.preventDefault();
      setShowDestinationSuggestions(true);
      setActiveSuggestionIndex(prev => prev < destinationSuggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
      if (destinationSuggestions.length === 0) return;
      e.preventDefault();
      setShowDestinationSuggestions(true);
      setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : destinationSuggestions.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showDestinationSuggestions && activeSuggestionIndex >= 0 && destinationSuggestions[activeSuggestionIndex]) {
        selectDestinationSuggestion(destinationSuggestions[activeSuggestionIndex]);
      } else {
        executeSearch();
      }
    }
  }, [destinationSuggestions, showDestinationSuggestions, activeSuggestionIndex]);

  // ─── Helpers ───────────────────────────────────────────────────────────
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleGuestChange = (newGuests) => {
    setGuests(newGuests);
  };

  const formattedDate = selectedDate
    ? moment(selectedDate).format("MMM DD, YYYY")
    : "Add dates";

  const totalGuests = (guests.adults || 0) + (guests.children || 0);
  const guestCountText = totalGuests > 0 
    ? `${totalGuests} guest${totalGuests > 1 ? 's' : ''}`
    : "Add guests";

  const executeSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    if (selectedDestination?.place_id) params.append("placeId", selectedDestination.place_id);
    if (selectedDate) params.append("date", moment(selectedDate).format("YYYY-MM-DD"));
    
    if (totalGuests > 0) params.append("guests", totalGuests);

    const interestMap = {
      experience: "EXPERIENCE",
      events: "EVENT",
      stays: "STAY",
      food: "FOOD",
      places: "PLACE"
    };
    params.append("businessInterest", interestMap[activeCategory] || "EXPERIENCE");

    setIsSearchPanelOpen(false);
    history.push(`/listings?${params.toString()}`);
  };

  if (!portalTarget) return null;

  const content = (
    <>
      <div className={cn(styles.portalContainer, styles.visible)}>
        {/* Category pills row */}
        <div className={styles.categoryRow}>
          {[
            { id: "experience", label: "Experiences", path: "/" },
            { id: "events", label: "Events", path: "/events" },
            { id: "stays", label: "Stays", path: "/stays" },
            { id: "food", label: "Food", path: "/food" },
            { id: "places", label: "Places", path: "/places" },
          ].map((filter) => (
            <button
              key={filter.id}
              className={cn(styles.categoryPill, {
                [styles.categoryPillActive]: activeCategory === filter.id,
              })}
              onClick={() => history.push(filter.path)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className={styles.divider} />

        {/* Search Icon Button */}
        <button
          ref={searchPillRef}
          className={styles.searchIconButton}
          onClick={() => setIsSearchPanelOpen(!isSearchPanelOpen)}
          aria-label="Toggle search"
        >
          <Icon name={isSearchPanelOpen ? "close" : "search"} size={isSearchPanelOpen ? "16" : "20"} color="#fff" />
        </button>
      </div>

      {/* Expanding Search Panel Dropdown */}
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
                    if (!selectedDestination || value !== selectedDestination.description) {
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
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className={styles.destinationSuggestions}>
                    {destinationSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.place_id || suggestion.description || index}
                        type="button"
                        className={cn(styles.suggestionItem, {
                          [styles.suggestionItemActive]: index === activeSuggestionIndex,
                        })}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectDestinationSuggestion(suggestion)}
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {showDateAndGuest && (
              <>
                <div className={styles.searchDivider} />

                {/* Date field */}
                <div
                  className={styles.searchField}
                  ref={dateFieldRef}
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowGuestPicker(false);
                  }}
                >
                  <div className={styles.searchFieldContent}>
                    <div className={styles.searchLabel}>When</div>
                    <div className={styles.searchInput}>
                      {formattedDate}
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

                <div className={styles.searchDivider} />

                {/* Guest field */}
                <div
                  className={styles.searchField}
                  ref={guestFieldRef}
                  onClick={() => {
                    setShowGuestPicker(!showGuestPicker);
                    setShowDatePicker(false);
                  }}
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
    </>
  );

  return ReactDOM.createPortal(content, portalTarget);
};

export default DetailPageNavPortal;
