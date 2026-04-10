import axios from "axios";

const normalizeBaseUrl = (url) => (url ? url.replace(/\/+$/, "") : url);



const API_BASE_URL = normalizeBaseUrl(process.env.REACT_APP_API_URL) ||
  "https://lkp-qa-backend.azurewebsites.net/api";

export const DEFAULT_API_BASE_URL = (() => {
  return API_BASE_URL;
})();


// Get API base URL from environment variable or use default
// Priority:
// 1. REACT_APP_API_URL environment variable

// 2. Runtime environment-specific base URL
const getApiBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return normalizeBaseUrl(process.env.REACT_APP_API_URL);

  }

  return DEFAULT_API_BASE_URL;
};

const getOrdersApiBaseURL = () => {
  if (process.env.REACT_APP_ORDERS_API_URL) {
    return normalizeBaseUrl(process.env.REACT_APP_ORDERS_API_URL);

  }

  return DEFAULT_API_BASE_URL;
};
// ✅ Create axios instance with base URL
export const ListingsAPI = axios.create({
  baseURL: getApiBaseURL(),
  headers: { "Content-Type": "application/json" },
});

export const OrdersAPI = axios.create({
  baseURL: getOrdersApiBaseURL(),
  headers: { "Content-Type": "application/json" },
});

// ✅ Automatically attach JWT if available
ListingsAPI.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jwtToken");
    const fullURL = `${config.baseURL}${config.url}`;

    console.log("🌐 Axios Request Interceptor:");
    console.log("  - Method:", config.method?.toUpperCase());
    console.log("  - Base URL:", config.baseURL);
    console.log("  - URL:", config.url);
    console.log("  - Full URL:", fullURL);
    console.log("  - Data:", config.data);
    console.log("  - Headers:", config.headers);

    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("🔑 JWT token attached to request:", config.url);
    } else {
      console.warn("⚠️ No JWT token found in localStorage for request:", config.url);
    }
  }
  return config;
});


OrdersAPI.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jwtToken");
    const fullURL = `${config.baseURL}${config.url}`;

    console.log("Orders API Request:");
    console.log("  - Method:", config.method?.toUpperCase());
    console.log("  - Base URL:", config.baseURL);
    console.log("  - URL:", config.url);
    console.log("  - Full URL:", fullURL);
    console.log("  - Data:", config.data);
    console.log("  - Headers:", config.headers);

    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Handle response errors gracefully - prevent unhandled promise rejections
ListingsAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error but don't show alert - let the calling code handle it
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      // Check if this is a non-critical endpoint that can fail silently
      const isNonCriticalEndpoint = error.config?.url?.includes('/orders/complete-expired');

      // Suppress error logging for non-critical endpoints (500 errors)
      // These endpoints are handled gracefully by the calling code
      if (status === 500 && isNonCriticalEndpoint) {
        error.isHandled = true;
        // Don't log as error - silently handle it
        // The calling function (getCompleteExpiredOrders) will handle it gracefully
        return Promise.reject(error);
      }

      // Only log, don't throw for 400 errors (they might be expected)
      if (status === 400) {
        console.warn(`⚠️ API 400 Error: ${message || 'Bad Request'}`, {
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data
        });
        // For 400 errors, we can optionally return a resolved promise with null
        // But we'll still reject so calling code can handle it, but mark it as handled
        error.isHandled = true;
      } else {
        console.error(`❌ API Error ${status}: ${message}`, {
          url: error.config?.url,
          method: error.config?.method,
          data: error.response.data
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("❌ Network Error: No response from server", error.request);
    } else {
      // Something else happened
      console.error("❌ Error:", error.message);
    }

    // Mark error as handled to prevent browser alerts
    error.isHandled = true;

    // Return the error so calling code can handle it
    return Promise.reject(error);
  }
);

// ✅ Function to call listings API
export const getListings = async (
  businessInterest = "EXPERIENCE",
  limit = 50,
  offset = 0
) => {
  try {
    const response = await ListingsAPI.get("/public/listings", {
      params: { businessInterest, limit, offset },
    });
    // Normalize response to always return an array of listings so callers
    // (like the Catalog component) can safely call `.map` without changing
    // the existing UI code.
    const payload = response.data;
    console.log("✅ Listings fetched (raw):", payload);

    // If payload is already an array - return it
    if (Array.isArray(payload)) return payload;

    // If payload is an object, try common array properties or a single item
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.listings)) return payload.listings;

      // If API returned a single listing object, wrap it in an array
      if (payload.listingId || payload.listing_id || payload.id) return [payload];

      // As a last resort, try to find the first array in the object whose
      // elements look like listings (have listingId or id)
      const firstCandidate = Object.values(payload).find(
        (v) =>
          Array.isArray(v) &&
          v.length > 0 &&
          (v[0].listingId || v[0].listing_id || v[0].id)
      );
      if (Array.isArray(firstCandidate)) return firstCandidate;
    }

    // Fallback to empty array to avoid downstream errors
    return [];
  } catch (error) {
    console.error("❌ Error fetching listings:", error);
    throw error;
  }
};

export const getOrderCancelPreview = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error("orderId is required");
    }

    const orderIdNum = Number(orderId);
    const orderIdStr = (!isNaN(orderIdNum) && orderIdNum > 0) ? String(orderIdNum) : String(orderId);

    const response = await ListingsAPI.get(`/orders/${orderIdStr}/cancel-preview`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching cancel preview:", error.response?.data || error.message);
    throw error;
  }
};


// ✅ Create a stay order
export const createStayOrder = async (orderData) => {
  try {
    console.log("📤 Creating stay order:", JSON.stringify(orderData, null, 2));
    // Use ListingsAPI (relative /api path) — the proxy forwards to http://69.62.77.33:8080
    // This avoids direct browser-to-server calls that trigger CORS errors
    const response = await ListingsAPI.post("/orders/stay", orderData);
    console.log("✅ Stay order created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating stay order:", error.response?.data || error.message);
    throw error;
  }
};

// Function to get single listing by id
export const getListing = async (id) => {
  try {
    const response = await ListingsAPI.get(`/public/listings/${id}`);
    const payload = response.data;
    console.log("✅ Listing fetched (raw):", payload);

    // If response is wrapped in an object with a listing property, unwrap
    if (payload && typeof payload === "object") {
      if (payload.listing) return payload.listing;
      if (payload.data && !Array.isArray(payload.data)) return payload.data;
    }

    return payload;
  } catch (error) {
    console.error("❌ Error fetching listing:", error);
    throw error;
  }
};

export const getListingMedia = async (listingId) => {
  try {
    if (!listingId) {
      throw new Error("listingId is required");
    }

    const response = await ListingsAPI.get(`/listings/${listingId}/media`);
    const payload = response.data;
    console.log("✅ Listing media fetched (raw):", payload);

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.media)) return payload.media;

    return [];
  } catch (error) {
    console.error("❌ Error fetching listing media:", error.response?.data || error.message);
    throw error;
  }
};

export const getListingAddons = async (listingId) => {
  try {
    if (!listingId) throw new Error("listingId is required");
    const response = await ListingsAPI.get(`/listings/${listingId}/addons`);
    const payload = response.data;
    console.log("✅ Listing addons fetched (raw):", payload);
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.addons)) return payload.addons;
    return [];
  } catch (error) {
    console.error("❌ Error fetching listing addons:", error.response?.data || error.message);
    return [];
  }
};

// Function to get customer orders
export const getCustomerOrders = async (limit = 20, page = 1) => {
  try {
    const offset = (page - 1) * limit;
    const response = await ListingsAPI.get("/orders/customer/my-orders", {
      params: { limit, offset },
    });
    const payload = response.data;
    console.log("✅ Customer orders fetched (raw):", payload);

    // If payload is already an array - return it
    if (Array.isArray(payload)) return payload;

    // If payload is an object, try common array properties
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.orders)) return payload.orders;
    }

    // Fallback to empty array
    return [];
  } catch (error) {
    console.error("❌ Error fetching customer orders:", error);
    throw error;
  }
};

// Function to get slot details by slot ID
export const getSlotDetails = async (slotId) => {
  try {
    const response = await ListingsAPI.get(`/public/listings/slots/${slotId}`);
    const payload = response.data;
    console.log("✅ Slot details fetched (raw):", payload);

    // If response is wrapped, unwrap it
    if (payload && typeof payload === "object") {
      if (payload.slot) return payload.slot;
      if (payload.data && !Array.isArray(payload.data)) return payload.data;
    }

    return payload;
  } catch (error) {
    console.error("❌ Error fetching slot details:", error);
    throw error;
  }
};

// Phone Authentication API functions
// Send OTP to phone number
export const sendPhoneOTP = async (phone, countryCode = "+91") => {
  try {
    const response = await ListingsAPI.post("/customers/auth/phone/send-otp", {
      phone,
      countryCode,
    });
    console.log("✅ OTP sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    throw error;
  }
};

// Verify OTP and login
export const verifyPhoneOTP = async (phone, otp, countryCode = "+91", firstName = "", lastName = "") => {
  try {
    const response = await ListingsAPI.post("/customers/auth/phone/verify-otp", {
      phone,
      otp,
      countryCode,
      firstName,
      lastName,
    });
    console.log("✅ OTP verified successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    throw error;
  }
};

// Google OAuth login
export const loginWithGoogle = async (idToken) => {
  try {
    const url = "/customers/auth/google";
    const requestData = { idToken: idToken };
    const baseURL = getApiBaseURL();
    const fullURL = baseURL === "/api"
      ? `${window.location.origin}${baseURL}${url}`
      : `${baseURL}${url}`;

    console.log("📤 Making Google login request:");
    console.log("  - Base URL:", baseURL);
    console.log("  - Endpoint:", url);
    console.log("  - Full URL:", fullURL);
    console.log("  - Request data:", { idToken: idToken ? `${idToken.substring(0, 20)}...` : "null" });
    console.log("  - Check Network tab for: POST", fullURL);

    const response = await ListingsAPI.post(url, requestData);

    console.log("✅ Google login successful:");
    console.log("  - Status:", response.status);
    console.log("  - Response data:", response.data);
    console.log("  - Full response:", response);
    return response.data;
  } catch (error) {
    console.error("❌ Error with Google login:");
    console.error("  - Error message:", error.message);
    console.error("  - Status:", error.response?.status);
    console.error("  - Response data:", error.response?.data);
    console.error("  - Full error:", error);
    console.error("  - Check Network tab for failed request");
    throw error;
  }
};

// Get billing configuration for a listing
export const getBillingConfiguration = async (listingId) => {
  try {
    // Validate parameter
    if (!listingId) {
      throw new Error("listingId is required");
    }

    // Ensure listingId is a string (URL parameter)
    // Try to convert to number first, then string to ensure it's valid
    const listingIdNum = Number(listingId);
    const listingIdStr = (!isNaN(listingIdNum) && listingIdNum > 0) ? String(listingIdNum) : String(listingId);

    // Final validation
    if (!listingIdStr || listingIdStr === "undefined" || listingIdStr === "null" || listingIdStr === "NaN") {
      throw new Error(`Invalid listingId: ${listingId} (converted to: ${listingIdStr})`);
    }

    const response = await ListingsAPI.get(`/public/listings/${listingIdStr}/billing-configuration`);
    console.log("✅ Billing configuration fetched:", response.data);
    return response.data;
  } catch (error) {
    const errorDetails = {
      listingId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: error.message,
      responseData: error.response?.data
    };

    console.error("❌ Error fetching billing configuration:", errorDetails);

    // If it's a 400 error, log more details
    if (error.response?.status === 400) {
      console.error("❌ 400 Bad Request Details:", {
        url: `/public/listings/${listingId}/billing-configuration`,
        response: error.response?.data,
        message: error.response?.data?.message || error.message
      });
    }

    throw error;
  }
};

// Get availability for a listing slot
export const getAvailability = async (listingId, startDate, endDate, slotId) => {
  try {
    // Ensure slotId is a number or string
    const slotIdParam = slotId ? String(slotId) : null;

    if (!listingId || !startDate || !endDate || !slotIdParam) {
      throw new Error(`Missing required parameters: listingId=${listingId}, startDate=${startDate}, endDate=${endDate}, slotId=${slotIdParam}`);
    }

    const response = await ListingsAPI.get(`/public/listings/${listingId}/availability`, {
      params: {
        startDate: startDate, // Format: YYYY-MM-DD
        endDate: endDate,     // Format: YYYY-MM-DD
        slotId: slotIdParam,  // Number as string
      },
    });

    console.log("✅ Availability API Response:", {
      url: `/public/listings/${listingId}/availability`,
      params: { startDate, endDate, slotId: slotIdParam },
      data: response.data
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching availability:", {
      listingId,
      startDate,
      endDate,
      slotId,
      error: error.response?.data || error.message
    });
    throw error;
  }
};

// Create an order
export const createOrder = async (orderData) => {
  try {
    console.log("📤 Creating order with data:", JSON.stringify(orderData, null, 2));
    const response = await OrdersAPI.post("/orders", orderData);
    console.log("✅ Order created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating order:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestData: orderData
    });

    // Log detailed error information for 400 errors
    if (error.response?.status === 400) {
      console.error("❌ 400 Bad Request Details:", {
        url: "/orders",
        requestData: orderData,
        errorResponse: error.response?.data,
        errorMessage: error.response?.data?.message || error.response?.data?.error || "Bad Request"
      });
    }

    throw error;
  }
};

export const createEventOrder = async (orderData) => {
  try {
    console.log("📤 Creating event order with data:", JSON.stringify(orderData, null, 2));
    const response = await ListingsAPI.post("/orders/event", orderData);
    console.log("✅ Event order created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating event order:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      requestData: orderData
    });

    // Log detailed error information for 400 errors
    if (error.response?.status === 400) {
      console.error("❌ 400 Bad Request Details:", {
        url: "/event-orders",
        requestData: orderData,
        errorResponse: error.response?.data,
        errorMessage: error.response?.data?.message || error.response?.data?.error || "Bad Request"
      });
    }

    throw error;
  }
};

// Get slots for a listing
export const getListingSlots = async (listingId, startDate, endDate) => {
  try {
    // Validate parameters
    if (!listingId) {
      throw new Error("listingId is required");
    }
    if (!startDate || !endDate) {
      throw new Error("startDate and endDate are required");
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new Error(`Invalid date format. Expected YYYY-MM-DD, got startDate=${startDate}, endDate=${endDate}`);
    }

    // Ensure listingId is a string (URL parameter)
    // Try to convert to number first, then string to ensure it's valid
    const listingIdNum = Number(listingId);
    const listingIdStr = (!isNaN(listingIdNum) && listingIdNum > 0) ? String(listingIdNum) : String(listingId);

    // Final validation
    if (!listingIdStr || listingIdStr === "undefined" || listingIdStr === "null" || listingIdStr === "NaN") {
      throw new Error(`Invalid listingId: ${listingId} (converted to: ${listingIdStr})`);
    }

    const response = await ListingsAPI.get(`/public/listings/${listingIdStr}/slots`, {
      params: {
        startDate: startDate, // Format: YYYY-MM-DD
        endDate: endDate,     // Format: YYYY-MM-DD
      },
    });

    console.log("✅ Slots API Response:", {
      url: `/public/listings/${listingIdStr}/slots`,
      params: { startDate, endDate },
      data: response.data
    });

    return response.data;
  } catch (error) {
    const errorDetails = {
      listingId,
      startDate,
      endDate,
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: error.message,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers
    };

    console.error("❌ Error fetching slots:", errorDetails);

    // If it's a 400 error, log more details
    if (error.response?.status === 400) {
      console.error("❌ 400 Bad Request Details:", {
        url: `/public/listings/${listingId}/slots`,
        requestParams: { startDate, endDate },
        response: error.response?.data,
        message: error.response?.data?.message || error.message
      });
    }

    throw error;
  }
};

// Get order details by ID
export const getOrderDetails = async (orderId) => {
  try {
    // Validate parameter
    if (!orderId) {
      throw new Error("orderId is required");
    }

    // Ensure orderId is a string (URL parameter)
    const orderIdNum = Number(orderId);
    const orderIdStr = (!isNaN(orderIdNum) && orderIdNum > 0) ? String(orderIdNum) : String(orderId);

    const response = await OrdersAPI.get(`/orders/${orderIdStr}`);
    const payload = response.data;
    console.log("✅ Order details fetched (raw):", payload);

    // Return the full response object which contains: order, addons, guestAnswers, history
    // The response structure is:
    // {
    //   order: { ... },
    //   addons: [],
    //   guestAnswers: [],
    //   history: []
    // }
    if (payload && typeof payload === "object") {
      // Return the full payload which contains order and related data
      return payload;
    }

    return payload;
  } catch (error) {
    console.error("❌ Error fetching order details:", error.response?.data || error.message);
    throw error;
  }
};

export const getEventOrderDetails = async (orderId) => {
  try {
    // Validate parameter
    if (!orderId) {
      throw new Error("orderId is required");
    }

    // Ensure orderId is a string (URL parameter)
    const orderIdNum = Number(orderId);
    const orderIdStr = (!isNaN(orderIdNum) && orderIdNum > 0) ? String(orderIdNum) : String(orderId);

    // Prefer Swagger endpoint: GET /api/orders/{orderId}/event-details
    // Keep fallback to legacy endpoint for compatibility.
    let response;
    try {
      response = await ListingsAPI.get(`/orders/${orderIdStr}/event-details`);
    } catch (err) {
      response = await ListingsAPI.get(`/event-orders/${orderIdStr}`);
    }

    const payload = response.data;
    console.log("✅ Event order details fetched (raw):", payload);

    // Normalize common wrappers
    if (payload && typeof payload === "object") {
      return payload;
    }
    return payload;
  } catch (error) {
    console.error("❌ Error fetching event order details:", error.response?.data || error.message);
    throw error;
  }
};

export const getEventDetails = async (eventId) => {
  try {
    // Validate parameter
    if (!eventId) {
      throw new Error("eventId is required");
    }

    // Ensure eventId is a string (URL parameter)
    const eventIdNum = Number(eventId);
    const eventIdStr = (!isNaN(eventIdNum) && eventIdNum > 0) ? String(eventIdNum) : String(eventId);

    // Prefer Swagger "public event details" route: GET /api/events/{id}
    // Keep fallback to legacy public suffix route for compatibility.
    const primaryUrl = `/events/${eventIdStr}`;
    const fallbackUrl = `/events/${eventIdStr}/public`;

    let response;
    try {
      response = await ListingsAPI.get(primaryUrl);
    } catch (err) {
      response = await ListingsAPI.get(fallbackUrl);
    }
    const payload = response.data;
    console.log("✅ Event details fetched (raw):", payload);

    // Backend may wrap the event in an envelope shape like { event: {...} }
    // Unwrap so callers receive the actual event object.
    const unwrapped =
      (payload && typeof payload === "object" &&
        (payload.event || payload.data?.event || payload.data || payload.result)) ||
      payload;

    if (unwrapped && typeof unwrapped === "object" && unwrapped.event) {
      return unwrapped.event;
    }
    return unwrapped;
  } catch (error) {
    console.error("❌ Error fetching event details:", error.response?.data || error.message);
    throw error;
  }
};

// Get completed and expired orders count
export const getCompleteExpiredOrders = async () => {
  try {
    // The interceptor will automatically add JWT token
    const response = await ListingsAPI.get("/orders/complete-expired");
    const payload = response.data;
    console.log("✅ Completed/expired orders count fetched (raw):", payload);

    // Return the full response object which contains completedCount
    if (payload && typeof payload === "object") {
      return payload;
    }

    // Fallback to empty object
    return { completedCount: 0 };
  } catch (error) {
    // This is a non-critical endpoint - handle all errors gracefully
    // The interceptor has already suppressed error logging for 500 errors

    // For 500 errors, silently return default
    if (error.response?.status === 500) {
      return { completedCount: 0 };
    }

    // For other errors, log a brief warning (not error)
    console.warn("⚠️ Error fetching completed/expired orders count (non-blocking):", {
      status: error.response?.status,
      message: error.response?.data?.error || error.response?.data?.message || error.message,
    });

    // Return default object on any error to ensure page can load
    return { completedCount: 0 };
  }
};

// Get completed orders with pagination
export const getCompletedOrders = async (page = 1, limit = 20) => {
  try {
    // The interceptor will automatically add JWT token
    const response = await ListingsAPI.get("/orders", {
      params: {
        orderStatus: "COMPLETED",
        page,
        limit,
      },
    });
    const payload = response.data;
    console.log("✅ Completed orders fetched (raw):", payload);

    // If payload is already an array - return it
    if (Array.isArray(payload)) return payload;

    // If payload is an object, try common array properties
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.orders)) return payload.orders;
    }

    // Fallback to empty array
    return [];
  } catch (error) {
    console.error("❌ Error fetching completed orders:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });

    // Return empty array on error
    return [];
  }
};

// Submit a review for an order
export const submitOrderReview = async (orderId, reviewData) => {
  try {
    // Validate parameters
    if (!orderId) {
      throw new Error("orderId is required");
    }
    if (!reviewData || !reviewData.rating) {
      throw new Error("rating is required in reviewData");
    }

    // Ensure orderId is a number
    const orderIdNum = Number(orderId);
    if (isNaN(orderIdNum) || orderIdNum <= 0) {
      throw new Error("Invalid orderId");
    }

    // Validate rating is between 1 and 5
    const rating = Number(reviewData.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Use the new /reviews endpoint with the specified request body format
    // Include listingId and customerId if provided (backend may require them)
    const requestBody = {
      orderId: orderIdNum,
      rating: rating,
      comment: reviewData.comment || "",
    };

    // Add optional fields if provided
    if (reviewData.listingId) {
      const listingIdNum = Number(reviewData.listingId);
      if (!isNaN(listingIdNum) && listingIdNum > 0) {
        requestBody.listingId = listingIdNum;
      }
    }
    if (reviewData.customerId) {
      const customerIdNum = Number(reviewData.customerId);
      if (!isNaN(customerIdNum) && customerIdNum > 0) {
        requestBody.customerId = customerIdNum;
      }
    }

    console.log("📤 Submitting review with request body:", requestBody);

    const response = await ListingsAPI.post(`/reviews`, requestBody);

    console.log("✅ Review submitted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error submitting review:", error.response?.data || error.message);
    console.error("❌ Full error object:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    throw error;
  }
};

// Get user's reviews
export const getMyReviews = async () => {
  try {
    const response = await ListingsAPI.get(`/reviews/my-reviews`);
    console.log("✅ Fetched user reviews:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user reviews:", error.response?.data || error.message);
    throw error;
  }
};

// Get eligible bookings (completed orders without reviews)
export const getEligibleBookings = async () => {
  try {
    const response = await ListingsAPI.get(`/reviews/eligible-bookings`);
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.items)) return payload.items;
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching eligible bookings:", error.response?.data || error.message);
    throw error;
  }
};

// Admin API (requires Admin JWT in localStorage as "adminToken")
export const AdminAPI = axios.create({
  baseURL: getApiBaseURL(),
  headers: { "Content-Type": "application/json" },
});

AdminAPI.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

AdminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Admin API: Unauthorized (invalid or missing admin token)");
    }
    return Promise.reject(error);
  }
);

// Get homepage hero data
export const getHomepageHero = async () => {
  try {
    const response = await ListingsAPI.get("/homepage/hero");
    const payload = response.data;
    console.log("✅ Homepage hero fetched (raw):", payload);

    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.items)) return payload.items;
      if (Array.isArray(payload.hero)) return payload.hero;
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching homepage hero:", error.response?.data || error.message);
    throw error;
  }
};

// Get homepage sections (requires businessInterestId: 1=Experience, 2=Events)
export const getHomepageSections = async (businessInterestId) => {
  try {
    if (!businessInterestId) {
      throw new Error("businessInterestId is required");
    }

    const response = await ListingsAPI.get("/public/homepage-sections", {
      params: { businessInterestId, _ts: Date.now() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    const payload = response.data;
    console.log("✅ Homepage sections fetched (businessInterestId=" + businessInterestId + "):", payload);

    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) return payload.data;
      if (Array.isArray(payload.sections)) return payload.sections;
    }
    return [];
  } catch (error) {
    console.error("❌ Error fetching homepage sections:", error.response?.data || error.message);
    throw error;
  }
};

// Get listings for a specific homepage section
export const getHomepageSectionListings = async (sectionId, limit = 12, offset = 0) => {
  try {
    if (!sectionId) {
      throw new Error("sectionId is required");
    }

    const response = await ListingsAPI.get(`/public/homepage-sections/${sectionId}/listings`, {
      params: { limit, offset, _ts: Date.now() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    const payload = response.data;
    console.log(`✅ Section ${sectionId} listings fetched (raw):`, payload);

    return payload; // Return the full response object with section info and listings
  } catch (error) {
    console.error(`❌ Error fetching section ${sectionId} listings:`, error.response?.data || error.message);
    throw error;
  }
};

export const getEventListings = async (limit = 12, offset = 0) => {
  try {
    const response = await ListingsAPI.get(`/public/events`, {
      params: { limit, offset },
    });
    const payload = response.data;
    console.log(`✅ Event listings fetched (raw):`, payload);

    return payload; // Return the full response object with event listings
  } catch (error) {
    console.error(`❌ Error fetching event listings:`, error.response?.data || error.message);
    throw error;
  }
};

export const getStayListings = async (limit = 20, offset = 0) => {
  try {
    const response = await ListingsAPI.get(`/public/stays`, {
      params: { limit, offset },
    });
    const payload = response.data;
    console.log(`✅ Stay listings fetched (raw):`, payload);

    // Extract section metadata from backend if present
    const section = payload?.section || null;

    let listings = [];
    if (Array.isArray(payload)) {
      listings = payload;
    } else if (payload && typeof payload === "object") {
      if (Array.isArray(payload.stays)) listings = payload.stays;
      else if (payload.data && Array.isArray(payload.data.stays)) listings = payload.data.stays;
      else if (Array.isArray(payload.data)) listings = payload.data;
      else if (Array.isArray(payload.items)) listings = payload.items;
      else if (Array.isArray(payload.listings)) listings = payload.listings;
    }

    return { section, listings };
  } catch (error) {
    console.error(`❌ Error fetching stay listings:`, error.response?.data || error.message);
    throw error;
  }
};

export const getStayDetails = async (stayId) => {
  try {
    if (!stayId) {
      throw new Error("stayId is required");
    }

    const stayIdNum = Number(stayId);
    const stayIdStr = (!isNaN(stayIdNum) && stayIdNum > 0) ? String(stayIdNum) : String(stayId);

    const response = await ListingsAPI.get(`/public/stays/${stayIdStr}`);
    const payload = response.data;
    console.log("✅ Stay details fetched (raw):", payload);

    if (payload && typeof payload === "object") {
      if (payload.stay) return payload.stay;
      if (payload.data && typeof payload.data === "object") return payload.data;
    }

    return payload;
  } catch (error) {
    console.error("❌ Error fetching stay details:", error.response?.data || error.message);
    throw error;
  }
};

export const getStayRoomAvailability = async (stayId, checkInDate, checkOutDate) => {
  try {
    if (!stayId) {
      throw new Error("stayId is required");
    }
    if (!checkInDate) {
      throw new Error("checkInDate is required");
    }
    if (!checkOutDate) {
      throw new Error("checkOutDate is required");
    }

    const stayIdNum = Number(stayId);
    const stayIdStr = (!isNaN(stayIdNum) && stayIdNum > 0) ? String(stayIdNum) : String(stayId);

    const response = await ListingsAPI.get(`/stays/${stayIdStr}/room-availability`, {
      params: { checkInDate, checkOutDate },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching stay room availability:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get host profile data
export const getHost = async (hostId) => {
  try {
    if (!hostId) {
      throw new Error("hostId is required");
    }

    const hostIdNum = Number(hostId);
    const hostIdStr = (!isNaN(hostIdNum) && hostIdNum > 0) ? String(hostIdNum) : String(hostId);

    const response = await ListingsAPI.get(`/public/hosts/${hostIdStr}`);
    const payload = response.data;

    return payload; // Returns { host, businessInterests, statistics, listings, recentReviews }
  } catch (error) {
    console.error(`❌ Error fetching host ${hostId}:`, error.response?.data || error.message);
    throw error;
  }
};

// ✅ Cancel an order
export const cancelOrder = async (orderId, cancelData) => {
  try {
    // Validate parameters
    if (!orderId) {
      throw new Error("orderId is required");
    }
    if (!cancelData || !cancelData.reason) {
      throw new Error("reason is required in cancelData");
    }

    // Ensure orderId is a string (URL parameter)
    const orderIdNum = Number(orderId);
    const orderIdStr = (!isNaN(orderIdNum) && orderIdNum > 0) ? String(orderIdNum) : String(orderId);

    const response = await ListingsAPI.post(`/orders/${orderIdStr}/cancel`, {
      reason: cancelData.reason,
      adminOverride: cancelData.adminOverride || false,
    });

    console.log("✅ Order cancelled successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error cancelling order:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Cancel an EVENT order (some backends expose a separate event-orders cancellation flow)
export const cancelEventOrder = async (orderId, cancelData) => {
  try {
    if (!orderId) {
      throw new Error("orderId is required");
    }
    if (!cancelData || !cancelData.reason) {
      throw new Error("reason is required in cancelData");
    }

    const orderIdNum = Number(orderId);
    const orderIdStr = (!isNaN(orderIdNum) && orderIdNum > 0) ? String(orderIdNum) : String(orderId);

    const body = {
      reason: cancelData.reason,
      adminOverride: cancelData.adminOverride || false,
    };

    try {
      const response = await ListingsAPI.post(`/event-orders/${orderIdStr}/cancel`, body);
      console.log("✅ Event order cancelled successfully:", response.data);
      return response.data;
    } catch (err) {
      const response = await ListingsAPI.post(`/orders/${orderIdStr}/cancel`, body);
      console.log("✅ Event order cancelled successfully (fallback /orders):", response.data);
      return response.data;
    }
  } catch (error) {
    console.error("❌ Error cancelling event order:", error.response?.data || error.message);
    throw error;
  }
};

export const getFoodMenus = async (limit = 20, offset = 0) => {
  try {
    const response = await ListingsAPI.get("/public/food-menus", {
      params: { limit, offset },
    });
    const payload = response.data;
    console.log(`✅ Food menus fetched (raw):`, payload);

    // Extract section metadata from backend if present
    const section = payload?.section || null;

    let listings = [];
    if (Array.isArray(payload)) {
      listings = payload;
    } else if (payload && typeof payload === "object") {
      listings = payload.foodMenus || payload.food_menus || payload.listings || payload.data || [];
      if (!Array.isArray(listings) && payload.data && typeof payload.data === "object") {
        listings = payload.data.foodMenus || payload.data.food_menus || payload.data.listings || payload.data || [];
      }
      if (!Array.isArray(listings) && Array.isArray(payload.items)) {
        listings = payload.items;
      }
    }

    const finalListings = Array.isArray(listings) ? listings : [];
    console.log(`✅ Food menus normalized:`, finalListings);
    return { section, listings: finalListings };
  } catch (error) {
    console.error(`❌ Error fetching food menus:`, error.response?.data || error.message);
    throw error;
  }
};

export const getPlaces = async (limit = 20, offset = 0) => {
  try {
    const response = await ListingsAPI.get("/public/places", {
      params: { limit, offset },
    });
    const payload = response.data;
    console.log(`✅ Places nearby fetched (raw):`, payload);

    // Extract section metadata from backend if present
    const section = payload?.section || null;

    let listings = [];
    if (Array.isArray(payload)) {
      listings = payload;
    } else if (payload && typeof payload === "object") {
      listings = payload.places || payload.listings || payload.data || [];
      if (!Array.isArray(listings) && payload.data && typeof payload.data === "object") {
        listings = payload.data.places || payload.data.listings || payload.data || [];
      }
      if (!Array.isArray(listings) && Array.isArray(payload.items)) {
        listings = payload.items;
      }
    }

    const finalListings = Array.isArray(listings) ? listings : [];
    console.log(`✅ Places nearby normalized:`, finalListings);
    return { section, listings: finalListings };
  } catch (error) {
    console.error(`❌ Error fetching places:`, error.response?.data || error.message);
    throw error;
  }
};

export const getFoodDetails = async (foodMenuId) => {
  try {
    if (!foodMenuId) {
      throw new Error("foodMenuId is required");
    }

    const response = await ListingsAPI.get(`/public/food-menus/${foodMenuId}`);
    const payload = response.data;
    console.log("✅ Food menu details fetched (raw):", payload);

    if (payload && typeof payload === "object") {
      if (payload.foodMenu) return payload.foodMenu;
      if (payload.data && typeof payload.data === "object") return payload.data;
    }

    return payload;
  } catch (error) {
    console.error("❌ Error fetching food menu details:", error.response?.data || error.message);
    throw error;
  }
};

export const getPlaceDetails = async (placeId) => {
  try {
    if (!placeId) {
      throw new Error("placeId is required");
    }

    const response = await ListingsAPI.get(`/public/places/${placeId}`);
    const payload = response.data;
    console.log("✅ Place details fetched (raw):", payload);

    if (payload && typeof payload === "object") {
      if (payload.place) return payload.place;
      if (payload.data && typeof payload.data === "object") return payload.data;
    }

    return payload;
  } catch (error) {
    console.error("❌ Error fetching place details:", error.response?.data || error.message);
    throw error;
  }
};
// ✅ Get lead details (host details) from leads API
export const getLeadDetails = async (leadId) => {
  try {
    if (!leadId) {
      throw new Error("leadId is required");
    }

    // Ensure leadId is a number or string
    const leadIdNum = Number(leadId);
    const leadIdStr = (!isNaN(leadIdNum) && leadIdNum > 0) ? String(leadIdNum) : String(leadId);

    // Call /api/leads/{id} which should be proxied correctly
    const response = await ListingsAPI.get(`/leads/${leadIdStr}`);
    const payload = response.data;
    console.log("✅ Lead details fetched (raw):", payload);

    return payload; 
  } catch (error) {
    console.error(`❌ Error fetching lead ${leadId}:`, error.response?.data || error.message);
    throw error;
  }
};
