import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
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
import { getBusinessInterestFilters } from "../../utils/api";
import { Compass, Ticket, Home, Utensils, MapPin } from "lucide-react";
import Loader from "../../components/Loader";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const categoryOptions = [
  { id: "EXPERIENCE", label: "Experiences", IconComponent: Compass },
  { id: "EVENT", label: "Events", IconComponent: Ticket },
  { id: "STAY", label: "Stays", IconComponent: Home },
  { id: "FOOD", label: "Food", IconComponent: Utensils },
  { id: "PLACE", label: "Places", IconComponent: MapPin },
];

const buildCategoryFilterState = ({
  categoryType,
  categoryValues,
  selectedCategoryLabel,
}) => {
  if (!categoryType || !Array.isArray(categoryValues) || categoryValues.length === 0) {
    return null;
  }

  const normalizedLabels =
    categoryValues.length === 1 && selectedCategoryLabel
      ? [selectedCategoryLabel]
      : categoryValues.map((value) => String(value));

  return {
    activeKeys: categoryValues.map((value) => `${categoryType}-${value}`),
    selectedCategoryLabels: normalizedLabels,
    selectedCategoryLabel: normalizedLabels.join(", "),
    categoryType,
    categoryValues,
  };
};

const isSearchCategoryType = (categoryType) => {
  const normalized = String(categoryType || "").trim().toUpperCase();
  return (
    normalized.includes("LOCATION") ||
    normalized.includes("DISTRICT") ||
    normalized.includes("STATE")
  );
};

const Listings = () => {
  const location = useLocation();
  const history = useHistory();
  const categoryNavRef = useRef(null);

  // Get search params from URL or location state
  const searchParams = new URLSearchParams(location.search);
  const locationState = location.state || {};

  // Search state
  const [searchLocation, setSearchLocation] = useState(
    searchParams.get("location") || searchParams.get("search") || locationState.location || ""
  );
  const [selectedDestination, setSelectedDestination] = useState(() => {
    const placeId = searchParams.get("placeId") || "";
    const description = searchParams.get("search") || searchParams.get("location") || locationState.location || "";
    return placeId && description ? { description, placeId } : null;
  });
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Track the actual search query that has been submitted
  const [activeSearch, setActiveSearch] = useState(searchLocation);

  const initialDate = searchParams.get("date")
    ? moment(searchParams.get("date")).toDate()
    : (locationState.dateRange?.startDate ? moment(locationState.dateRange.startDate).toDate() : null);

  const [selectedDate, setSelectedDate] = useState(initialDate);

  const initialGuestsStr = searchParams.get("guests");
  const initialAdultsStr = searchParams.get("adults");
  const initialChildrenStr = searchParams.get("children");

  const initialGuests = initialAdultsStr || initialChildrenStr
    ? { adults: parseInt(initialAdultsStr) || 0, children: parseInt(initialChildrenStr) || 0, infants: 0, pets: 0 }
    : (initialGuestsStr
      ? { adults: parseInt(initialGuestsStr), children: 0, infants: 0, pets: 0 }
      : (locationState.guests || { adults: 1, children: 0, infants: 0, pets: 0 }));

  const [guests, setGuests] = useState(initialGuests);

  const businessInterest = searchParams.get("businessInterest") || locationState.businessInterest || "EXPERIENCE";
  const businessInterestIdParam = searchParams.get("businessInterestId");
  const categoryTypeParam = searchParams.get("categoryType") || "";
  const selectedCategoryLabel = searchParams.get("selectedCategoryLabel") || "";

  const categoryValues = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const valuesFromParams = params.getAll("categoryValues");
    const fallbackValues = params.get("categoryValues");

    return valuesFromParams.length > 0
      ? valuesFromParams
      : (fallbackValues ? fallbackValues.split(",").map((v) => v.trim()).filter(Boolean) : []);
  }, [location.search]);

  const derivedCategorySearchText = useMemo(() => {
    if (!isSearchCategoryType(categoryTypeParam)) return "";
    if (selectedCategoryLabel) return selectedCategoryLabel;
    return categoryValues[0] ? String(categoryValues[0]) : "";
  }, [categoryTypeParam, selectedCategoryLabel, categoryValues]);

  const hasExplicitSearchText = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Boolean(
      params.get("location") ||
      params.get("search") ||
      locationState.location
    );
  }, [location.search, locationState.location]);

  const categoryFilter = useMemo(() => {
    if (!categoryTypeParam || categoryValues.length === 0) return null;
    return {
      businessInterestId: businessInterestIdParam ? Number(businessInterestIdParam) : null,
      categoryType: categoryTypeParam,
      categoryValues,
      sortBy: "newest",
    };
  }, [businessInterestIdParam, categoryTypeParam, categoryValues]);

  const routeCategoryFilterState = useMemo(() => buildCategoryFilterState({
    categoryType: categoryTypeParam,
    categoryValues,
    selectedCategoryLabel,
  }), [categoryTypeParam, categoryValues, selectedCategoryLabel]);

  const resolvedBusinessInterestId = useMemo(() => {
    if (businessInterestIdParam) return Number(businessInterestIdParam);
    const normalized = String(businessInterest || "").toUpperCase();
    if (normalized.includes("EVENT")) return 2;
    if (normalized.includes("STAY")) return 3;
    if (normalized.includes("PLACE")) return 4;
    if (normalized.includes("FOOD")) return 5;
    return 1;
  }, [businessInterest, businessInterestIdParam]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const dateItemRef = useRef(null);
  const guestItemRef = useRef(null);
  const destinationRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const autocompleteSessionTokenRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isUserTyping = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadBusinessInterestFilters = async () => {
      try {
        if (!resolvedBusinessInterestId) return;
        const response = await getBusinessInterestFilters(resolvedBusinessInterestId);
        if (!mounted) return;
        setBusinessInterestFilters(response || null);
        /*console.log(
          `[Listings] business-interest-filters response (businessInterestId=${resolvedBusinessInterestId}):`,
          response
        );*/
      } catch (error) {
        console.warn(
          `[Listings] Failed to fetch business-interest-filters for businessInterestId=${resolvedBusinessInterestId}:`,
          error?.message || error
        );
      }
    };

    loadBusinessInterestFilters();
    return () => {
      mounted = false;
    };
  }, [resolvedBusinessInterestId]);

  // Convert selectedDate to dateRange format for API
  const dateRange = useMemo(() => (
    selectedDate ? {
      startDate: moment(selectedDate).format("YYYY-MM-DD"),
      endDate: moment(selectedDate).add(1, "days").format("YYYY-MM-DD"),
    } : null
  ), [selectedDate]);

  // Filter state
  const createDefaultFilters = () => ({
    priceRange: { min: "", max: "" },
    pricePresetMax: null,
    propertyTypes: [],
    amenities: [],
    mealPlan: [],
    ratings: [],
    categories: [],
    tags: [],
    specialLabels: [],
    apiCategoryFilter: routeCategoryFilterState,
    dateRange: { startDate: "", endDate: "" },
  });

  const [filters, setFilters] = useState(createDefaultFilters);

  // UI state
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [businessInterestFilters, setBusinessInterestFilters] = useState(null);
  const [isCategoryDerivedSearch, setIsCategoryDerivedSearch] = useState(
    Boolean(!hasExplicitSearchText && derivedCategorySearchText)
  );

  // Mobile sticky search scroll state
  const [isScrolled, setIsScrolled] = useState(false);
  const searchBarRef = useRef(null);

  const [portalTarget, setPortalTarget] = useState(null);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth > 1023 : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsDesktop(window.innerWidth > 1023);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const target = document.getElementById("header-center-portal");
    if (target) {
      setPortalTarget(target);
    }
  }, []);

  useEffect(() => {
    setFilters((prev) => {
      const currentCategoryType = prev.apiCategoryFilter?.categoryType || null;
      const currentCategoryValues = Array.isArray(prev.apiCategoryFilter?.categoryValues)
        ? prev.apiCategoryFilter.categoryValues.map(String)
        : [];
      const nextCategoryType = routeCategoryFilterState?.categoryType || null;
      const nextCategoryValues = Array.isArray(routeCategoryFilterState?.categoryValues)
        ? routeCategoryFilterState.categoryValues.map(String)
        : [];

      if (
        currentCategoryType === nextCategoryType &&
        currentCategoryValues.length === nextCategoryValues.length &&
        currentCategoryValues.every((value, index) => value === nextCategoryValues[index])
      ) {
        return prev;
      }

      return {
        ...prev,
        apiCategoryFilter: routeCategoryFilterState,
      };
    });
  }, [routeCategoryFilterState]);

  useEffect(() => {
    if (hasExplicitSearchText || !derivedCategorySearchText) {
      setIsCategoryDerivedSearch(false);
      return;
    }

    setSearchLocation(derivedCategorySearchText);
    setActiveSearch("");
    setSelectedDestination(null);
    setIsCategoryDerivedSearch(true);
  }, [derivedCategorySearchText, hasExplicitSearchText]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!categoryNavRef.current) return;
    // We use a small timeout to ensure the DOM has updated with the active class
    const timer = setTimeout(() => {
      if (categoryNavRef.current) {
        const activeTab = categoryNavRef.current.querySelector(`[class*="categoryNavItemActive"]`);
        if (activeTab) {
          activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [businessInterest]);

  // Sort chip quick-filter options
  const sortChips = [
    { label: "Newest", value: "newest" },
    { label: "Top Rated", value: "rating" },
  ];

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.pricePresetMax) count++;
    if (filters.priceRange?.min || filters.priceRange?.max) count++;
    if (filters.propertyTypes?.length) count++;
    if (filters.amenities?.length) count++;
    if (filters.mealPlan?.length) count++;
    if (filters.ratings?.length) count++;
    if (filters.apiCategoryFilter) count++;
    if (filters.dateRange?.startDate) count++;
    return count;
  }, [filters]);

  const getListingTerm = (interest, count) => {
    const normalized = String(interest || "").toUpperCase();
    const isPlural = count !== 1;
    if (normalized.includes("EXPERIENCE")) return isPlural ? "experiences" : "experience";
    if (normalized.includes("EVENT")) return isPlural ? "events" : "event";
    if (normalized.includes("STAY")) return isPlural ? "stays" : "stay";
    if (normalized.includes("FOOD")) return isPlural ? "food listings" : "food listing";
    if (normalized.includes("PLACE")) return isPlural ? "places" : "place";
    return isPlural ? "properties" : "property";
  };

  const sortOptions = ["newest", "rating"];
  const isEventInterest = String(businessInterest || "").toUpperCase().includes("EVENT");
  const isFoodOrPlace = String(businessInterest || "").toUpperCase().includes("FOOD") || String(businessInterest || "").toUpperCase().includes("PLACE");
  const showDateAndGuest = !isFoodOrPlace;

  const emptyMessage = isEventInterest && selectedDate
    ? "No events in this date."
    : `No ${getListingTerm(businessInterest, 2)} found. Try adjusting your filters.`;

  const effectiveCategoryFilter = useMemo(() => {
    if (
      filters.apiCategoryFilter?.categoryType &&
      Array.isArray(filters.apiCategoryFilter?.categoryValues) &&
      filters.apiCategoryFilter.categoryValues.length > 0
    ) {
      return {
        businessInterestId: resolvedBusinessInterestId,
        categoryType: filters.apiCategoryFilter.categoryType,
        categoryValues: filters.apiCategoryFilter.categoryValues,
        sortBy,
      };
    }

    if (categoryFilter) {
      return {
        ...categoryFilter,
        businessInterestId: categoryFilter.businessInterestId || resolvedBusinessInterestId,
        sortBy,
      };
    }

    return null;
  }, [categoryFilter, filters.apiCategoryFilter, resolvedBusinessInterestId, sortBy]);

  // Use listings hook - only re-renders when activeSearch or other filters change
  const { data: listings, loading, error, hasMore, fetchMore } = useListings({
    location: isCategoryDerivedSearch ? "" : activeSearch,
    dateRange,
    guests,
    filters,
    limit: 8,
    businessInterest: businessInterest,
    categoryFilter: effectiveCategoryFilter,
  });

  // eslint-disable-next-line no-unused-vars
  const totalCount = listings.length;

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (filterType === "apiCategoryFilter") {
      syncCategoryFilterToUrl(value);
    }

    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));

    // Scroll to top of the page when a filter is applied
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildBaseSearchParams = ({
    nextBusinessInterest = businessInterest,
    includeRouteCategoryFilter = false,
  } = {}) => {
    const params = new URLSearchParams();

    if (searchLocation && !isCategoryDerivedSearch) params.set("search", searchLocation);
    if (selectedDestination?.placeId) params.set("placeId", selectedDestination.placeId);
    if (selectedDate) params.set("date", moment(selectedDate).format("YYYY-MM-DD"));

    const guestTotal = guests.adults + guests.children;
    if (guestTotal > 0) {
      params.set("guests", String(guestTotal));
      params.set("adults", String(guests.adults || 0));
      params.set("children", String(guests.children || 0));
    }

    if (nextBusinessInterest) params.set("businessInterest", nextBusinessInterest);

    const resolvedIdByInterest = (() => {
      const normalized = String(nextBusinessInterest || "").toUpperCase();
      if (normalized.includes("EVENT")) return 2;
      if (normalized.includes("STAY")) return 3;
      if (normalized.includes("PLACE")) return 4;
      if (normalized.includes("FOOD")) return 5;
      return 1;
    })();
    params.set("businessInterestId", String(resolvedIdByInterest));

    if (includeRouteCategoryFilter && categoryTypeParam && categoryValues.length > 0) {
      params.set("categoryType", categoryTypeParam);
      categoryValues.forEach((value) => params.append("categoryValues", value));
      if (selectedCategoryLabel) params.set("selectedCategoryLabel", selectedCategoryLabel);
    }

    return params;
  };

  const resetFiltersState = (nextCategoryFilter = null) => {
    setFilters({
      priceRange: { min: "", max: "" },
      pricePresetMax: null,
      propertyTypes: [],
      amenities: [],
      mealPlan: [],
      ratings: [],
      categories: [],
      tags: [],
      specialLabels: [],
      apiCategoryFilter: nextCategoryFilter,
      dateRange: { startDate: "", endDate: "" },
    });
  };

  const syncCategoryFilterToUrl = (nextCategoryFilter, nextBusinessInterest = businessInterest) => {
    const params = buildBaseSearchParams({
      nextBusinessInterest,
      includeRouteCategoryFilter: false,
    });

    if (
      nextCategoryFilter?.categoryType &&
      Array.isArray(nextCategoryFilter?.categoryValues) &&
      nextCategoryFilter.categoryValues.length > 0
    ) {
      params.set("categoryType", nextCategoryFilter.categoryType);
      nextCategoryFilter.categoryValues.forEach((value) => {
        params.append("categoryValues", String(value));
      });

      if (nextCategoryFilter.selectedCategoryLabel) {
        params.set("selectedCategoryLabel", nextCategoryFilter.selectedCategoryLabel);
      }
    }

    history.replace({
      pathname: "/listings",
      search: params.toString() ? `?${params.toString()}` : "",
      state: {
        location: searchLocation,
        dateRange,
        guests,
      },
    });
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

  const selectDestinationSuggestion = (suggestion) => {
    if (!suggestion) return;
    const description = suggestion.description || "";
    const placeId = suggestion.place_id || suggestion.placeId || "";
    setIsCategoryDerivedSearch(false);
    setSearchLocation(description);
    setSelectedDestination({ description, placeId });
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  // Handle category switch
  const handleCategorySwitch = (newBusinessInterest) => {
    resetFiltersState(null);
    setSortBy("newest");
    setIsCategoryDerivedSearch(false);

    const newState = {
      location: searchLocation,
      dateRange: dateRange,
      guests: guests,
    };
    const params = buildBaseSearchParams({ nextBusinessInterest: newBusinessInterest });

    history.push({
      pathname: "/listings",
      search: params.toString() ? `?${params.toString()}` : "",
      state: newState,
    });
  };

  // Handle search button click or Enter key
  const handleSearch = () => {
    setIsCategoryDerivedSearch(false);
    setActiveSearch(searchLocation);

    const newState = {
      location: searchLocation,
      dateRange: dateRange,
      guests: guests,
    };
    const params = buildBaseSearchParams({
      nextBusinessInterest: businessInterest,
      includeRouteCategoryFilter: Boolean(routeCategoryFilterState),
    });

    history.replace({
      pathname: "/listings",
      search: params.toString() ? `?${params.toString()}` : "",
      state: newState,
    });
  };

  useEffect(() => {
    if (window.google?.maps?.places?.AutocompleteService) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      autocompleteSessionTokenRef.current = window.google.maps.places.AutocompleteSessionToken
        ? new window.google.maps.places.AutocompleteSessionToken()
        : null;
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) return;

    const initAutocompleteService = () => {
      if (!window.google?.maps?.places?.AutocompleteService) return;
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      autocompleteSessionTokenRef.current = window.google.maps.places.AutocompleteSessionToken
        ? new window.google.maps.places.AutocompleteSessionToken()
        : null;
    };

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", initAutocompleteService);
      return () => existingScript.removeEventListener("load", initAutocompleteService);
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.addEventListener("load", initAutocompleteService);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initAutocompleteService);
    };
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!searchLocation?.trim()) {
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

    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchLocation.trim(),
          types: ["geocode"],
          sessionToken: autocompleteSessionTokenRef.current || undefined,
        },
        (predictions, status) => {
          if (status === "OK" && Array.isArray(predictions) && predictions.length > 0) {
            setDestinationSuggestions(predictions);
            if (isUserTyping.current) {
              setShowDestinationSuggestions(true);
            }
            setActiveSuggestionIndex(-1);
          } else {
            setDestinationSuggestions([]);
            setShowDestinationSuggestions(false);
            setActiveSuggestionIndex(-1);
          }
        }
      );
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [searchLocation]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!destinationRef.current) return;
      if (!destinationRef.current.contains(event.target)) {
        setShowDestinationSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const resetFilters = () => {
    resetFiltersState(null);
    setSortBy("newest");

    const newState = {
      location: searchLocation,
      dateRange: dateRange,
      guests: guests,
    };
    const params = buildBaseSearchParams({
      nextBusinessInterest: businessInterest,
    });

    history.replace({
      pathname: "/listings",
      search: params.toString() ? `?${params.toString()}` : "",
      state: newState,
    });
  };

  const displayCategoryTitle = useMemo(() => {
    const defaultTitle = filters.apiCategoryFilter?.selectedCategoryLabel || selectedCategoryLabel;
    
    if (!filters.apiCategoryFilter?.categoryValues || filters.apiCategoryFilter.categoryValues.length === 0) {
      return defaultTitle;
    }
    
    if (businessInterestFilters) {
      const type = filters.apiCategoryFilter.categoryType;
      let options = [];
      if (type === "Primary Category" || type === "PRIMARY") {
        options = businessInterestFilters.primaryCategories || [];
      } else if (type === "Sub Category" || type === "SUB") {
        options = businessInterestFilters.secondaryCategories || [];
      } else if (type === "Tags" || type === "TAGS") {
        options = businessInterestFilters.tags || [];
      } else if (type === "Special Labels" || type === "SPECIAL") {
        options = businessInterestFilters.specialLabels || [];
      }
      
      if (options.length > 0) {
        const labels = filters.apiCategoryFilter.categoryValues.map(val => {
          const found = options.find(opt => {
            const optId = opt.id ?? opt.name ?? opt;
            return String(optId) === String(val);
          });
          return found ? (found.name || found) : val;
        });
        return labels.join(", ");
      }
    }
    
    return defaultTitle;
  }, [filters.apiCategoryFilter, businessInterestFilters, selectedCategoryLabel]);

  return (
    <div className={cn("section", styles.section)}>
      {/* Mobile sticky search header — shown on scroll, mobile only */}
      <div className={cn(styles.mobileStickySearch, { [styles.mobileStickySearchVisible]: isScrolled })}>
        <button
          className={styles.mobileStickyContent}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Icon name="search" size="16" />
          <span className={styles.mobileStickyText}>
            {searchLocation || "Search destination"}
          </span>
          {selectedDate && (
            <span className={styles.mobileStickyMeta}>{formattedDate}</span>
          )}
        </button>
        <button
          className={cn(styles.mobileStickyFilter, { [styles.mobileStickyFilterActive]: activeFilterCount > 0 })}
          onClick={() => setShowMobileFilters(true)}
        >
          <Icon name="more" size="16" />
          {activeFilterCount > 0 && (
            <span className={styles.mobileStickyFilterBadge}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className={cn("container", styles.container)}>
        {/* Category Navigation Header inside Portal */}
        {(portalTarget && isDesktop) ? ReactDOM.createPortal(
          <div className={styles.categoryNav}>
            {categoryOptions.map((opt) => {
              const isActive = String(businessInterest || "").toUpperCase().includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cn(styles.categoryPill, {
                    [styles.categoryPillActive]: isActive,
                  })}
                  onClick={() => handleCategorySwitch(opt.id)}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>,
          portalTarget
        ) : (
          <div className={styles.categoryNav} ref={categoryNavRef}>
            {categoryOptions.map((opt) => {
              const isActive = String(businessInterest || "").toUpperCase().includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cn(styles.categoryNavItem, {
                    [styles.categoryNavItemActive]: isActive,
                  })}
                  onClick={() => handleCategorySwitch(opt.id)}
                >
                  <opt.IconComponent size={18} strokeWidth={2} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search Bar Section */}
        <div className={styles.searchBar} ref={searchBarRef}>
          <div className={styles.searchField} ref={destinationRef}>
            <Icon name="arrow-right" size="20" />
            <div className={styles.searchFieldContent}>
              <div className={styles.searchLabel}>Where would you like to go?</div>
              <input
                type="text"
                placeholder="Search Destination"
                className={styles.searchInput}
                value={searchLocation}
                onChange={(e) => {
                  isUserTyping.current = true;
                  const value = e.target.value;
                  setIsCategoryDerivedSearch(false);
                  setSearchLocation(value);
                  if (!selectedDestination || value !== selectedDestination.description) {
                    setSelectedDestination(null);
                  }
                }}
                onFocus={() => {
                  if (destinationSuggestions.length > 0) {
                    setShowDestinationSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    if (destinationSuggestions.length === 0) return;
                    e.preventDefault();
                    setShowDestinationSuggestions(true);
                    setActiveSuggestionIndex((prev) => (
                      prev < destinationSuggestions.length - 1 ? prev + 1 : 0
                    ));
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    if (destinationSuggestions.length === 0) return;
                    e.preventDefault();
                    setShowDestinationSuggestions(true);
                    setActiveSuggestionIndex((prev) => (
                      prev > 0 ? prev - 1 : destinationSuggestions.length - 1
                    ));
                    return;
                  }
                  if (e.key === "Escape") {
                    setShowDestinationSuggestions(false);
                    setActiveSuggestionIndex(-1);
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showDestinationSuggestions && activeSuggestionIndex >= 0 && destinationSuggestions[activeSuggestionIndex]) {
                      selectDestinationSuggestion(destinationSuggestions[activeSuggestionIndex]);
                    } else {
                      handleSearch();
                    }
                  }
                }}
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className={styles.destinationSuggestions}>
                  {destinationSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.place_id || suggestion.description || index}
                      type="button"
                      className={cn(styles.destinationSuggestionItem, {
                        [styles.destinationSuggestionItemActive]: index === activeSuggestionIndex,
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
                  <div className={styles.searchLabel}>When?</div>
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
                  adultsSubtitle={null}
                  childrenSubtitle={null}
                  infantsSubtitle={null}
                  className={styles.guestPicker}
                />
              </div>
            </>
          )}
          <button className={styles.searchButton} onClick={handleSearch} disabled={loading}>
            Search
          </button>
        </div>
      </div>

      {/* Mobile Sort & Filter Chips Row — hidden on desktop */}
      <div className={styles.mobileSortChipsWrap}>
        <div className={styles.mobileSortChips}>
          {/* Filters button with active badge */}
          <button
            className={cn(styles.mobileFilterChip, styles.mobileFilterChipFilters, {
              [styles.mobileFilterChipActive]: activeFilterCount > 0,
            })}
            onClick={() => setShowMobileFilters(true)}
          >
            <Icon name="more" size="14" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
          {/* Quick sort chips */}
          {sortChips.map((chip) => (
            <button
              key={chip.value}
              className={cn(styles.mobileFilterChip, {
                [styles.mobileFilterChipActive]: sortBy === chip.value,
              })}
              onClick={() => setSortBy(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <div className={cn("container", styles.container)}>
          <div className={cn(styles.layout, { [styles.withMap]: showMap })}>
            {/* Filter Sidebar - Desktop only */}
            <aside className={styles.sidebar}>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                sorting={sortBy}
                setSorting={setSortBy}
                sortingOptions={sortOptions}
                businessInterest={businessInterest}
                businessInterestFilters={businessInterestFilters}
              />
            </aside>

            {/* Main Content Area */}
            <main className={styles.main}>
              {displayCategoryTitle && (
                <div className={styles.categoryFilterTitle}>
                  Filtered by category: {displayCategoryTitle}
                </div>
              )}

              {/* Results Toolbar */}
              <div className={styles.resultsToolbar}>
                <span className={styles.resultCount}>
                  {loading && listings.length === 0
                    ? "Loading..."
                    : `${listings.length} ${getListingTerm(businessInterest, listings.length)} found`
                  }
                </span>
                <div className={styles.viewToggle}>
                  <button
                    className={cn(styles.viewToggleBtn, { [styles.viewToggleBtnActive]: viewMode === "grid" })}
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="6" height="6" rx="1.5" />
                      <rect x="9" y="1" width="6" height="6" rx="1.5" />
                      <rect x="1" y="9" width="6" height="6" rx="1.5" />
                      <rect x="9" y="9" width="6" height="6" rx="1.5" />
                    </svg>
                  </button>
                  <button
                    className={cn(styles.viewToggleBtn, { [styles.viewToggleBtnActive]: viewMode === "list" })}
                    onClick={() => setViewMode("list")}
                    title="List view"
                    aria-label="List view"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="2" width="14" height="2" rx="1" />
                      <rect x="1" y="7" width="14" height="2" rx="1" />
                      <rect x="1" y="12" width="14" height="2" rx="1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Listings Grid */}
              <ListingsGrid
                listings={listings}
                loading={loading}
                error={error}
                hasMore={hasMore}
                onLoadMore={fetchMore}
                emptyMessage={emptyMessage}
                listView={viewMode === "list"}
              />
            </main>

            {/* Map View - Right Side (Desktop) */}
            {showMap && (
              <aside className={cn(styles.mapSidebar, "desktop-show")}>
                <div className={styles.mapContainer}>
                  <iframe
                    title="Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63817.0803287881!2d168.63234961382247!3d-45.04173987887954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa9d51df1d7a8de5f%3A0x500ef868479a600!2z0JrRg9C40L3RgdGC0LLQsNGPINCX0LXQu9Cw0L3QtNC40Y8!5e0!3m2!1sru!2sua!4v1624887132616!5m2!1sru!2sua"
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

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterModal
        visible={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
        sorting={sortBy}
        setSorting={setSortBy}
        sortingOptions={sortOptions}
        businessInterest={businessInterest}
        businessInterestFilters={businessInterestFilters}
        activeFilterCount={activeFilterCount}
      />


    </div>
  );
};

export default Listings;
