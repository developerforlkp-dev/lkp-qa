import { useState, useEffect, useCallback } from "react";
import {
  getFilteredListings,
  searchNearbyListings,
  filterFoodMenus,
  filterPlaces,
  filterEventListings,
  filterStayListings,
} from "../utils/api";

/**
 * Custom hook for fetching listings with filters and pagination
 * @param {Object} params - Search and filter parameters
 * @param {string} params.location - Location search query
 * @param {Object} params.dateRange - { startDate, endDate }
 * @param {Object} params.guests - { adults, children, infants, pets }
 * @param {Object} params.filters - Filter object with priceRange, propertyTypes, amenities, ratings, categories
 * @param {number} params.limit - Number of listings per page
 * @param {number} params.offset - Offset for pagination
 * @param {string} params.businessInterest - Business interest type (EXPERIENCE, etc.)
 */
export const useListings = ({
  location = "",
  dateRange = null,
  guests = { adults: 1, children: 0, infants: 0, pets: 0 },
  filters = {},
  limit = 20,
  offset = 0,
  businessInterest = "EXPERIENCE",
  categoryFilter = null,
} = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const mapToNearbyBusinessInterest = useCallback((value) => {
    const normalized = String(value || "").toUpperCase();
    if (normalized === "EVENT" || normalized === "EVENTS") return "EVENTS";
    if (normalized === "STAY" || normalized === "STAYS") return "STAYS";
    if (normalized === "PLACE" || normalized === "PLACES") return "PLACES";
    if (normalized === "FOOD") return "FOOD";
    return "EXPERIENCE";
  }, []);

  const mapBusinessInterestId = useCallback((value) => {
    const normalized = String(value || "").toUpperCase();
    if (normalized.includes("EVENT")) return 2;
    if (normalized.includes("STAY")) return 3;
    if (normalized.includes("PLACE")) return 4;
    if (normalized.includes("FOOD")) return 5;
    return 1;
  }, []);

  const fetchListings = useCallback(async (currentOffset = 0, reset = false) => {
    try {
      if (reset) {
        setData([]);
      }
      setLoading(true);
      setError(null);

      const nextOffset = reset ? 0 : currentOffset;
      const hasLocationSearch = Boolean(location && String(location).trim());
      const mappedNearbyInterest = mapToNearbyBusinessInterest(businessInterest);

      let listings = [];
      let totalCount = null;
      let hasMoreFromAPI = null;

      const hasRatingFilter = Array.isArray(filters.ratings) && filters.ratings.length > 0;
      const hasCustomMin = filters?.priceRange?.min !== "" && filters?.priceRange?.min !== null && filters?.priceRange?.min !== undefined;
      const hasCustomMax = filters?.priceRange?.max !== "" && filters?.priceRange?.max !== null && filters?.priceRange?.max !== undefined;
      const customMin = hasCustomMin ? Number(filters.priceRange.min) : undefined;
      const customMax = hasCustomMax ? Number(filters.priceRange.max) : undefined;
      const presetMax = filters?.pricePresetMax !== null && filters?.pricePresetMax !== undefined
        ? Number(filters.pricePresetMax)
        : undefined;
      const shouldUseCustomPrice = (hasCustomMin && Number.isFinite(customMin) && customMin >= 0)
        || (hasCustomMax && Number.isFinite(customMax) && customMax >= 0);
      const shouldUsePresetPrice = !shouldUseCustomPrice && Number.isFinite(presetMax) && presetMax > 0;
      const effectiveMinPrice = shouldUseCustomPrice
        ? (Number.isFinite(customMin) && customMin >= 0 ? customMin : undefined)
        : (shouldUsePresetPrice ? 0 : undefined);
      const effectiveMaxPrice = shouldUseCustomPrice
        ? (Number.isFinite(customMax) && customMax >= 0 ? customMax : undefined)
        : (shouldUsePresetPrice ? presetMax : undefined);

      if (!hasLocationSearch) {
        const mappedBusinessInterestId =
          categoryFilter?.businessInterestId || mapBusinessInterestId(businessInterest);
        const filterPayload = {
          limit,
          offset: nextOffset,
          sortBy: categoryFilter?.sortBy || "newest",
        };

        if (categoryFilter?.categoryType) {
          filterPayload.categoryType = categoryFilter.categoryType;
        }
        if (Array.isArray(categoryFilter?.categoryValues) && categoryFilter.categoryValues.length > 0) {
          filterPayload.categoryValues = categoryFilter.categoryValues.join(",");
        }
        if (hasRatingFilter) {
          filterPayload.ratingFilter = Math.max(...filters.ratings);
        }
        if (effectiveMinPrice !== undefined) {
          filterPayload.minPrice = effectiveMinPrice;
        }
        if (effectiveMaxPrice !== undefined) {
          filterPayload.maxPrice = effectiveMaxPrice;
        }
        if (Array.isArray(filters.mealPlan) && filters.mealPlan.length > 0) {
          filterPayload.mealPlan = filters.mealPlan.join(",");
        }

        if (mappedNearbyInterest === "FOOD" || mappedNearbyInterest === "PLACES") {
          delete filterPayload.categoryValues;

          if (categoryFilter?.categoryType === "Primary Category") {
            filterPayload.primaryCategoryId = categoryFilter.categoryValues.join(",");
          } else if (categoryFilter?.categoryType === "Sub Category") {
            filterPayload.subcategoryId = categoryFilter.categoryValues.join(",");
          } else if (
            categoryFilter?.categoryType === "Tags" ||
            categoryFilter?.categoryType === "Special Labels"
          ) {
            filterPayload.tags = categoryFilter.categoryValues.join(",");
          }

          if (filters.tags && filters.tags.length > 0) {
            filterPayload.tags = filterPayload.tags
              ? `${filterPayload.tags},${filters.tags.join(",")}`
              : filters.tags.join(",");
          }

          const response = mappedNearbyInterest === "FOOD"
            ? await filterFoodMenus(filterPayload)
            : await filterPlaces(filterPayload);

          listings = response.listings || [];
          totalCount = response.totalCount ?? null;
          hasMoreFromAPI = response.hasMore ?? null;
        } else if (mappedNearbyInterest === "EVENTS") {
          const response = await filterEventListings(filterPayload);
          listings = response.listings || [];
          totalCount = response.totalCount ?? null;
          hasMoreFromAPI = response.hasMore ?? null;
        } else if (mappedNearbyInterest === "STAYS") {
          const response = await filterStayListings(filterPayload);
          listings = response.listings || [];
          totalCount = response.totalCount ?? null;
          hasMoreFromAPI = response.hasMore ?? null;
        } else {
          const response = await getFilteredListings({
            businessInterestId: mappedBusinessInterestId,
            categoryType: categoryFilter?.categoryType,
            categoryValues: categoryFilter?.categoryValues || [],
            ratingFilter: hasRatingFilter ? Math.max(...filters.ratings) : undefined,
            minPrice: effectiveMinPrice,
            maxPrice: effectiveMaxPrice,
            limit,
            offset: nextOffset,
            sortBy: categoryFilter?.sortBy || "newest",
          });

          listings = response.listings || [];
          totalCount = response.totalCount ?? null;
          hasMoreFromAPI = response.hasMore ?? null;
        }
      } else if (hasLocationSearch) {
        // Nearby search flow
        const nearbyResponse = await searchNearbyListings({
          businessInterest: mappedNearbyInterest,
          locationName: location,
          date: mappedNearbyInterest === "EVENTS" ? dateRange?.startDate : undefined,
          limit,
          offset: nextOffset,
        });

        listings = nearbyResponse.listings || [];
        totalCount = nearbyResponse.totalCount ?? null;
        hasMoreFromAPI = nearbyResponse.hasMore ?? null;
      }

      // Determine if there are more results
      // Priority: 1. API metadata (hasMore flag), 2. Total count comparison, 3. Array length check
      let shouldHaveMore = false;
      
      if (hasMoreFromAPI !== null) {
        // Use explicit API flag if available
        shouldHaveMore = hasMoreFromAPI;
      } else if (totalCount !== null) {
        // If we have total count, check if current offset + listings length is less than total
        const currentTotal = reset ? listings.length : currentOffset + listings.length;
        shouldHaveMore = currentTotal < totalCount;
      } else {
        // Fallback logic:
        // - If we got exactly the limit, assume there might be more
        // - If we got fewer than limit, assume no more (unless it's the first page and we got results)
        // - Only set to false if we got 0 items
        if (listings.length === 0) {
          shouldHaveMore = false;
        } else if (listings.length === limit) {
          // Got exactly what we asked for - likely more available
          shouldHaveMore = true;
        } else {
          // Got fewer than requested
          // On first page (offset 0), if we got some results, try fetching more
          // On subsequent pages, if we got fewer than requested, assume no more
          shouldHaveMore = (reset || currentOffset === 0) && listings.length > 0;
        }
      }
      
      setHasMore(shouldHaveMore);
      
      // Log pagination info for debugging
      console.log("📄 Pagination info:", {
        requested: limit,
        received: listings.length,
        offset: nextOffset,
        totalCount,
        hasMoreFromAPI,
        shouldHaveMore,
        reset,
      });

      // Client-side filtering as an extra layer for non-nearby flow.
      // Nearby endpoint is already location-specific and sorted by distance.
      let processedListings = listings;
      if (location && !hasLocationSearch) {
        const query = location.toLowerCase();
        processedListings = listings.filter(l => 
          (l.title && l.title.toLowerCase().includes(query)) ||
          (l.name && l.name.toLowerCase().includes(query)) ||
          (l.city && l.city.toLowerCase().includes(query)) ||
          (l.categoryTitle && l.categoryTitle.toLowerCase().includes(query)) ||
          (l.propertyName && l.propertyName.toLowerCase().includes(query)) ||
          (l.description && l.description.toLowerCase().includes(query)) ||
          (l.host?.displayName && l.host.displayName.toLowerCase().includes(query)) ||
          (l.host?.name && l.host.name.toLowerCase().includes(query))
        );
        
        // If we filtered out everything, but API returned results, 
        // fallback to API results to avoid showing nothing
        if (processedListings.length === 0 && listings.length > 0) {
          processedListings = listings;
        }
      }

      if (reset || currentOffset === 0) {
        setData(processedListings);
      } else {
        setData((prev) => [...prev, ...processedListings]);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err.message || "Failed to fetch listings");
      if (reset || currentOffset === 0) {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [location, dateRange, guests, filters, limit, businessInterest, categoryFilter, mapBusinessInterestId, mapToNearbyBusinessInterest]);

  useEffect(() => {
    fetchListings(0, true);
  }, [location, dateRange, guests, filters, businessInterest, categoryFilter, fetchListings]);

  const fetchMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextOffset = data.length;
      fetchListings(nextOffset, false);
    }
  }, [loading, hasMore, data.length, fetchListings]);

  return {
    data,
    loading,
    error,
    hasMore,
    fetchMore,
    refetch: () => fetchListings(true),
  };
};

