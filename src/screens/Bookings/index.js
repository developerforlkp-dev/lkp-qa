import React, { useState, useEffect } from "react";
import Page from "../../components/Page";
import Main from "./Main";
import { getCustomerOrders, getCompletedOrders } from "../../utils/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const Bookings = ({ bookingData = null }) => {
  const [orders, setOrders] = useState(null);
  const [completedOrders, setCompletedOrders] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Static browser tab title
  useDocumentTitle("My Bookings");
  // test
  useEffect(() => {
    // If bookingData is provided as prop, use it directly
    if (bookingData) {
      // Handle both single booking and array of bookings
      const bookingsArray = Array.isArray(bookingData) ? bookingData : [bookingData];
      setOrders(bookingsArray);
      setCompletedOrders([]); // Empty for prop-based data
      setLoading(false);
      
      return;
    }

    // Otherwise, fetch all orders from API
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      // Check if user is authenticated before making API calls
      const isAuthenticated = typeof window !== "undefined" && !!localStorage.getItem("jwtToken");
      
      if (!isAuthenticated) {
        // If not authenticated, show empty state instead of error
        setOrders([]);
        setCompletedOrders([]);
        setCompletedCount(0);
        setLoading(false);
        return;
      }
      
      // Fetch both APIs in parallel for better performance
      // Handle errors independently so one failure doesn't block the other
      const [ordersResult, completedOrdersResult] = await Promise.allSettled([
        getCustomerOrders(100, 1),
        getCompletedOrders(1, 100)
      ]);
      
      // Handle regular orders result
      let fetchedOrders = [];
      if (ordersResult.status === 'fulfilled') {
        fetchedOrders = ordersResult.value;
        console.log("✅ Fetched orders:", fetchedOrders);
      } else {
        const errorReason = ordersResult.reason;
        // Check if it's an authentication error (401/403)
        const isAuthError = errorReason?.response?.status === 401 || errorReason?.response?.status === 403;
        
        if (isAuthError) {
          // For auth errors, clear token and show empty state
          console.warn("⚠️ Authentication error - showing empty state");
          if (typeof window !== "undefined") {
            localStorage.removeItem("jwtToken");
          }
          setOrders([]);
        } else {
          console.error("❌ Error fetching regular orders:", errorReason);
          // Only show error for non-auth errors
          setError(errorReason?.message || "Failed to fetch orders");
        }
      }
      setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);

      // Handle completed result
      let fetchedCompletedCount = 0;
      let fetchedCompletedOrders = [];
      if (completedOrdersResult.status === 'fulfilled') {
        fetchedCompletedOrders = Array.isArray(completedOrdersResult.value) ? completedOrdersResult.value : [];
        fetchedCompletedCount = fetchedCompletedOrders.length;
        console.log("✅ Fetched completed orders count:", fetchedCompletedCount);
      } else {
        const errorReason = completedOrdersResult.reason;
        // Check if it's an authentication error
        const isAuthError = errorReason?.response?.status === 401 || errorReason?.response?.status === 403;
        
        if (!isAuthError) {
          console.warn("⚠️ Failed to fetch completed orders:", errorReason);
        }
      }
      setCompletedCount(fetchedCompletedCount);
      
      // Set completed orders
      setCompletedOrders(fetchedCompletedOrders);
      
      setLoading(false);
    };

    fetchOrders();
  }, [bookingData]);

  // Always render Main immediately — it manages its own skeleton state.
  // This prevents the blank white screen flash between parent loading and Main mounting.
  return (
    <Page separatorHeader fooferHide={loading}>
      {error && error !== "" && (
        <div style={{ padding: "1rem", textAlign: "center", backgroundColor: "#fee", color: "#c33" }}>
          <p>⚠️ {error}</p>
        </div>
      )}
      <Main 
        bookingData={loading ? null : (orders || [])} 
        completedOrders={loading ? null : (completedOrders || [])} 
        completedCount={completedCount}
        setCompletedOrders={setCompletedOrders}
      />
    </Page>
  );
};

export default Bookings;
