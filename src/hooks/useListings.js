import { useState, useEffect, useCallback } from "react";
import { ListingsAPI } from "../utils/api";

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
} = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = useCallback(async (currentOffset = 0, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        businessInterest,
        limit,
        offset: reset ? 0 : currentOffset,
      };

      // Add search/keyword if provided
      if (location) {
        params.search = location;
        params.location = location;
      }

      // Add date range if provided
      if (dateRange?.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange?.endDate) {
        params.endDate = dateRange.endDate;
      }

      // Add guest count
      if (guests.adults) {
        params.adults = guests.adults;
      }
      if (guests.children) {
        params.children = guests.children;
      }
      if (guests.infants) {
        params.infants = guests.infants;
      }
      if (guests.pets) {
        params.pets = guests.pets;
      }

      // Add filters
      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          params.minPrice = filters.priceRange.min;
        }
        if (filters.priceRange.max !== undefined) {
          params.maxPrice = filters.priceRange.max;
        }
      }

      if (filters.propertyTypes && filters.propertyTypes.length > 0) {
        params.propertyTypes = filters.propertyTypes.join(",");
      }

      if (filters.amenities && filters.amenities.length > 0) {
        params.amenities = filters.amenities.join(",");
      }

      if (filters.ratings && filters.ratings.length > 0) {
        params.minRating = Math.min(...filters.ratings);
      }

      if (filters.categories && filters.categories.length > 0) {
        params.categories = filters.categories.join(",");
      }

      const endpoint = businessInterest === "EVENT" ? "/public/events" : "/public/listings";
      const response = await ListingsAPI.get(endpoint, { params });
      
      // Normalize response to always return an array
      let listings = [];
      let totalCount = null;
      let hasMoreFromAPI = null;
      const payload = response.data;
      
      if (Array.isArray(payload)) {
        listings = payload;
      } else if (payload && typeof payload === "object") {
        // Extract listings array
        if (Array.isArray(payload.data)) {
          listings = payload.data;
        } else if (Array.isArray(payload.items)) {
          listings = payload.items;
        } else if (Array.isArray(payload.listings)) {
          listings = payload.listings;
        }
        
        // Extract pagination metadata if available
        if (payload.totalCount !== undefined) {
          totalCount = payload.totalCount;
        } else if (payload.total !== undefined) {
          totalCount = payload.total;
        } else if (payload.count !== undefined) {
          totalCount = payload.count;
        }
        
        // Check for explicit hasMore flag
        if (payload.hasMore !== undefined) {
          hasMoreFromAPI = payload.hasMore;
        } else if (payload.has_more !== undefined) {
          hasMoreFromAPI = payload.has_more;
        }
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
        offset: reset ? 0 : currentOffset,
        totalCount,
        hasMoreFromAPI,
        shouldHaveMore,
        reset,
      });

      // Client-side filtering as an extra layer to ensure name/title matches
      let processedListings = listings;
      if (location) {
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
  }, [location, dateRange, guests, filters, limit, businessInterest]);

  useEffect(() => {
    fetchListings(0, true);
  }, [location, dateRange, guests, filters, businessInterest, fetchListings]);

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

