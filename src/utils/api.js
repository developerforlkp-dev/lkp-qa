import axios from "axios";

// ✅ Create axios instance with relative path (proxy will handle the domain)
export const ListingsAPI = axios.create({
  baseURL: "/api", // proxy will forward to http://69.62.77.33/api
  headers: { "Content-Type": "application/json" },
});

// ✅ Automatically attach JWT if available
ListingsAPI.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

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

// ✅ Function to get single listing by id
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

// ✅ Phone Authentication API functions
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

// ✅ Get billing configuration for a listing
export const getBillingConfiguration = async (listingId) => {
  try {
    const response = await ListingsAPI.get(`/public/listings/${listingId}/billing-configuration`);
    console.log("✅ Billing configuration fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching billing configuration:", error);
    throw error;
  }
};

// ✅ Get availability for a listing slot
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

// ✅ Create an order
export const createOrder = async (orderData) => {
  try {
    const response = await ListingsAPI.post("/orders", orderData);
    console.log("✅ Order created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating order:", error.response?.data || error.message);
    throw error;
  }
};
