import React, { useState, useMemo, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";
import moment from "moment";
import cn from "classnames";
import axios from "axios";
import styles from "./Description.module.sass";
import receiptStyles from "../../../components/Receipt/Receipt.module.sass";
import Icon from "../../../components/Icon";
import Details, { addOns } from "./Details";
import Receipt from "../../../components/Receipt";
import InlineDatePicker from "../../../components/InlineDatePicker";
import TimeSlotsPicker from "../../../components/TimeSlotsPicker";
import GuestPicker from "../../../components/GuestPicker";
import LoginModal from "../../../components/LoginModal";
import { getBillingConfiguration, getAvailability, createOrder } from "../../../utils/api";

const basePrice = 833;
const discount = 125;

const Description = ({ classSection, listing }) => {
  const history = useHistory();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [addOnQuantities, setAddOnQuantities] = useState({}); // Track quantities for Group pricing addons
  // default values
  const defaultDate = listing?.timeSlots?.[0]?.startDate
    ? new Date(listing.timeSlots[0].startDate)
    : new Date();
  const formattedDefaultDate = defaultDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  // Helper function to format time from "HH:mm" to "HH:mm AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to format time range with cleaner display
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return "";
    return `${formatTime(startTime)} – ${formatTime(endTime)}`;
  };

  const [selectedDate, setSelectedDate] = useState(moment(defaultDate));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    listing?.timeSlots?.[0]?.slotName || null
  );
  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [billingConfig, setBillingConfig] = useState(null);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const dateItemRef = useRef(null);
  const timeItemRef = useRef(null);
  const guestItemRef = useRef(null);

  const guestCountText = useMemo(() => {
    // Infants don't count toward total for display (matching Airbnb style)
    const total = guests.adults + guests.children;
    if (total === 0) return "Add guests";
    if (total === 1) return "1 guest";
    return `${total} guests`;
  }, [guests]);

  // Find the selected timeSlot object to get maxSeats and for display
  const selectedTimeSlotData = useMemo(() => {
    if (!listing?.timeSlots || !selectedTimeSlot) return null;
    return listing.timeSlots.find(
      (slot) => slot.slotName === selectedTimeSlot || slot.slotId?.toString() === selectedTimeSlot
    );
  }, [listing?.timeSlots, selectedTimeSlot]);

  // Get availability data for selected date
  const selectedDateAvailability = useMemo(() => {
    if (!selectedDate || !availabilityData.length) return null;
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return availabilityData.find(av => av.date === dateStr);
  }, [selectedDate, availabilityData]);

  // Get the selected timeSlot object for display
  const selectedTimeSlotDisplay = useMemo(() => {
    // Use availability data if available, otherwise fallback to timeSlot data
    if (selectedDateAvailability) {
      const { start_time, end_time } = selectedDateAvailability;
      if (start_time && end_time) {
        return formatTimeRange(start_time, end_time);
      }
    }
    
    if (!selectedTimeSlotData) {
      return selectedTimeSlot || "Select time";
    }
    const { startTime, endTime, slotName } = selectedTimeSlotData;
    if (startTime && endTime) {
      return formatTimeRange(startTime, endTime);
    }
    return slotName || selectedTimeSlot || "Select time";
  }, [selectedTimeSlotData, selectedTimeSlot, selectedDateAvailability]);

  const items = [
    {
      title: selectedDate ? selectedDate.format("MMM DD, YYYY") : formattedDefaultDate,
      category: "Select date",
      icon: "calendar",
    },
    {
      title: selectedTimeSlotDisplay,
      category: "Time slot",
      icon: "clock",
    },
    {
      title: guestCountText,
      category: "Guest",
      icon: "user",
    },
  ];

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem("jwtToken");
    // Check if token exists and is not empty/null
    return !!(token && token.trim() !== "");
  };

  const handleToggleAddOn = (addOnId, pricingType) => {
    if (pricingType === "Group") {
      // For Group pricing, toggle selection and initialize quantity to 1
      setSelectedAddOns((prev) => {
        if (prev.includes(addOnId)) {
          // Remove from selection
          setAddOnQuantities((qty) => {
            const newQty = { ...qty };
            delete newQty[addOnId];
            return newQty;
          });
          return prev.filter((id) => id !== addOnId);
        } else {
          // Add to selection with quantity 1
          setAddOnQuantities((qty) => ({
            ...qty,
            [addOnId]: 1,
          }));
          return [...prev, addOnId];
        }
      });
    } else {
      // For Individual pricing, simple toggle
      setSelectedAddOns((prev) =>
        prev.includes(addOnId)
          ? prev.filter((id) => id !== addOnId)
          : [...prev, addOnId]
      );
    }
  };

  const handleAddOnQuantityChange = (addOnId, newQuantity) => {
    setAddOnQuantities((prev) => ({
      ...prev,
      [addOnId]: newQuantity,
    }));
  };

  const { addOnsTotal, finalTotal, receipt } = useMemo(() => {
    // Calculate addons price based on pricing type
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      // Find addon from listing data
      const listingAddon = listing?.addons?.find(
        (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
      );
      
      if (listingAddon) {
        const price = parseFloat(listingAddon.addon?.price || 0);
        const pricingType = listingAddon.addon?.pricingType || "Individual";
        const quantity = pricingType === "Group" ? (addOnQuantities[id] || 1) : 1;
        return sum + (price * quantity);
      }
      
      // Fallback to static addons
      const addOn = addOns.find((a) => a.id === id);
      return sum + (addOn?.priceValue || 0);
    }, 0);
    
    // Calculate base price based on guest count and price type
    const guestCount = guests.adults + guests.children; // Infants don't count
    // Use availability data if available, otherwise fallback to listing data
    const pricePerPerson = selectedDateAvailability?.price_per_person
      ? parseFloat(selectedDateAvailability.price_per_person)
      : (listing?.timeSlots?.[0]?.pricePerPerson 
          ? parseFloat(listing.timeSlots[0].pricePerPerson) 
          : null);
    const pricePerNight = selectedDateAvailability?.b2b_rate
      ? parseFloat(selectedDateAvailability.b2b_rate)
      : (listing?.timeSlots?.[0]?.b2bRate
          ? parseFloat(listing.timeSlots[0].b2bRate)
          : 119);
    const currency = listing?.currency || "INR";
    
    // Calculate nights (assuming 1 night for now, can be enhanced with date range)
    const nights = 1; // Default to 1 night, can be calculated from date range
    
    let basePriceAmount;
    let priceDescription;
    
    if (pricePerPerson) {
      // Price per person
      basePriceAmount = pricePerPerson * guestCount * nights;
      priceDescription = `${currency} ${pricePerPerson.toFixed(2)} × ${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}${nights > 1 ? ` × ${nights} nights` : ''}`;
    } else {
      // Price per night
      basePriceAmount = pricePerNight * nights;
      priceDescription = `${currency} ${pricePerNight.toFixed(2)}${nights > 1 ? ` × ${nights} nights` : ''}`;
    }
    
    const subtotal = basePriceAmount + addOnsPrice;
    
    const receiptData = [
      {
        title: priceDescription,
        content: `${currency} ${basePriceAmount.toFixed(2)}`,
      },
    ];

    // Add individual addon entries
    if (selectedAddOns.length > 0) {
      selectedAddOns.forEach((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );
        
        if (listingAddon) {
          const price = parseFloat(listingAddon.addon?.price || 0);
          const pricingType = listingAddon.addon?.pricingType || "Individual";
          const quantity = pricingType === "Group" ? (addOnQuantities[id] || 1) : 1;
          const addonTotal = price * quantity;
          const addonTitle = listingAddon.addon?.title || "Add-on";
          
          if (pricingType === "Group") {
            receiptData.push({
              title: `${addonTitle} × ${quantity}`,
              content: `${currency} ${addonTotal.toFixed(2)}`,
            });
          } else {
            receiptData.push({
              title: addonTitle,
              content: `${currency} ${addonTotal.toFixed(2)}`,
            });
          }
        } else {
          // Fallback to static addons
          const addOn = addOns.find((a) => a.id === id);
          if (addOn) {
            receiptData.push({
              title: addOn.title,
              content: `${currency} ${addOn.priceValue.toFixed(2)}`,
            });
          }
        }
      });
    }

    // Calculate and add taxes
    let totalTaxAmount = 0;
    if (billingConfig?.taxes && Array.isArray(billingConfig.taxes)) {
      const enabledTaxes = billingConfig.taxes.filter(tax => tax.isEnabled);
      enabledTaxes.forEach(tax => {
        const taxAmount = (subtotal * parseFloat(tax.currentRate || 0)) / 100;
        totalTaxAmount += taxAmount;
        receiptData.push({
          title: tax.name,
          content: `${currency} ${taxAmount.toFixed(2)}`,
        });
      });
    }

    const total = subtotal + totalTaxAmount;

    receiptData.push({
      title: "Total",
      content: `${currency} ${total.toFixed(2)}`,
    });

    return {
      addOnsTotal: addOnsPrice,
      finalTotal: addOnsPrice,
      receipt: receiptData,
    };
  }, [selectedAddOns, addOnQuantities, guests, listing, billingConfig, selectedDateAvailability]);

  // Save booking data to localStorage
  const saveBookingData = () => {
    const selectedAddOnsData = selectedAddOns
      .map((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );
        if (listingAddon) {
          return {
            id: listingAddon.addon?.addonId ?? listingAddon.addonId ?? listingAddon.assignmentId,
            title: listingAddon.addon?.title,
            price: listingAddon.addon?.price,
            currency: listingAddon.addon?.currency,
            pricingType: listingAddon.addon?.pricingType,
            quantity: listingAddon.addon?.pricingType === "Group" ? (addOnQuantities[id] || 1) : 1,
          };
        }
        return addOns.find((a) => a.id === id);
      })
      .filter(Boolean);

    // derive booking time and slot id for summary
    const summaryBookingTime =
      (selectedDateAvailability?.start_time
        ? selectedDateAvailability.start_time
        : selectedTimeSlotData?.startTime) || "";
    const summarySlotId =
      selectedTimeSlotData?.slotId ||
      selectedTimeSlotData?.slot_id ||
      selectedTimeSlotData?.id ||
      null;

    const guestsCount = guests.adults + guests.children;

    const bookingData = {
      listingId: listing?.listingId || listing?.id,
      listingTitle: listing?.title || listing?.name || listing?.listingTitle || "",
      listingImage: listing?.images?.[0]?.url || listing?.coverImage || listing?.image || "",
      selectedDate: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      selectedTimeSlot: selectedTimeSlot,
      guests: guests,
      selectedAddOns: selectedAddOnsData,
      addOnQuantities: addOnQuantities,
      receipt: receipt,
      finalTotal: finalTotal,
      // extra fields to help checkout display
      bookingSummary: {
        date: selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
        time: summaryBookingTime, // "HH:mm" or "HH:mm:ss" depending on source
        slotId: summarySlotId,
        guestCount: guestsCount,
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
  };

  // Load booking data from localStorage and proceed to checkout
  const proceedToCheckout = () => {
    const savedBooking = localStorage.getItem("pendingBooking");
    if (savedBooking) {
      const bookingData = JSON.parse(savedBooking);
      const selectedAddOnsData = bookingData.selectedAddOns || [];
      
      history.push({
        pathname: "/stays-checkout",
        state: { 
          addOns: selectedAddOnsData,
          bookingData: bookingData,
        },
      });
      
      // Clear saved booking data after using it
      localStorage.removeItem("pendingBooking");
    } else {
      // Fallback to current state if no saved data
      const selectedAddOnsData = selectedAddOns
        .map((id) => addOns.find((a) => a.id === id))
        .filter(Boolean);
      
      history.push({
        pathname: "/stays-checkout",
        state: { addOns: selectedAddOnsData },
      });
    }
  };

  const handleReserveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always save booking data first
    saveBookingData();
    
    // Check if user is logged in
    const loggedIn = isLoggedIn();
    
    if (!loggedIn) {
      // Show login modal - prevent any navigation
      setShowLoginModal(true);
      return;
    }
    
    // User is logged in, create order
    try {
      // Get customer info from localStorage or user profile
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName = userInfo.name || 
                           (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") || 
                           userInfo.customerName || "";
      const customerEmail = userInfo.email || userInfo.customerEmail || "";
      // Phone number should include country code if available
      const customerPhone = userInfo.customerPhone || 
                           (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") ||
                           userInfo.phoneNumber || 
                           userInfo.phone || "";
      // Try to derive customerId from stored user info (various possible keys)
      const customerId =
        userInfo.customerId ||
        userInfo.customer_id ||
        userInfo.id ||
        userInfo.userId ||
        userInfo.customerID ||
        null;
      
      // Get special requests (if any input field exists in future)
      const specialRequests = "";
      
      // Get listing ID
      const listingId = listing?.listingId || listing?.id || 0;
      
      // Format booking date (YYYY-MM-DD)
      const bookingDate = selectedDate ? selectedDate.format("YYYY-MM-DD") : new Date().toISOString().split('T')[0];
      
      // Get booking time from availability or timeSlot
      let bookingTime = "00:00";
      if (selectedDateAvailability?.start_time) {
        bookingTime = selectedDateAvailability.start_time;
      } else if (selectedTimeSlotData?.startTime) {
        bookingTime = selectedTimeSlotData.startTime;
      }
      
      // Get booking slot ID
      const bookingSlotId = selectedTimeSlotData?.slotId || 
                            selectedTimeSlotData?.slot_id || 
                            selectedTimeSlotData?.id || 
                            0;
      
      // Get number of guests
      const numberOfGuests = guests.adults + guests.children;
      
      // Calculate base price amount
      const guestCount = guests.adults + guests.children;
      const pricePerPerson = selectedDateAvailability?.price_per_person
        ? parseFloat(selectedDateAvailability.price_per_person)
        : (listing?.timeSlots?.[0]?.pricePerPerson 
            ? parseFloat(listing.timeSlots[0].pricePerPerson) 
            : null);
      const pricePerNight = selectedDateAvailability?.b2b_rate
        ? parseFloat(selectedDateAvailability.b2b_rate)
        : (listing?.timeSlots?.[0]?.b2bRate
            ? parseFloat(listing.timeSlots[0].b2bRate)
            : 0);
      const nights = 1; // Default to 1 night
      
      let pricingBaseAmount = 0;
      if (pricePerPerson) {
        pricingBaseAmount = pricePerPerson * guestCount * nights;
      } else {
        pricingBaseAmount = pricePerNight * nights;
      }
      
      // Calculate pricing values
      const pricingAddonsTotal = addOnsTotal || 0;
      const pricingSubtotal = pricingBaseAmount + pricingAddonsTotal;
      
      // Calculate platform commission (from billing config)
      let pricingPlatformCommission = 0;
      if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
        const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
        if (platformFee) {
          pricingPlatformCommission = (pricingSubtotal * parseFloat(platformFee.currentRate || 0)) / 100;
        }
      }
      
      // Calculate tax amount
      let pricingTaxAmount = 0;
      if (billingConfig?.taxes && Array.isArray(billingConfig.taxes)) {
        const enabledTaxes = billingConfig.taxes.filter(tax => tax.isEnabled);
        enabledTaxes.forEach(tax => {
          const taxAmount = (pricingSubtotal * parseFloat(tax.currentRate || 0)) / 100;
          pricingTaxAmount += taxAmount;
        });
      }
      
      // Calculate discount (from billing config or default 0)
      const pricingDiscountAmount = 0; // Can be enhanced with discount codes
      
      // Calculate total price (subtotal + taxes - discounts, excluding platform commission)
      const pricingTotal = pricingSubtotal + pricingTaxAmount - pricingDiscountAmount;
      
      // Calculate host earnings (what the host receives: subtotal - platform commission)
      const calculatedHostEarnings = (pricingSubtotal || 5500) - (pricingPlatformCommission || 550);
      const hostEarnings = isNaN(calculatedHostEarnings) ? 4950 : calculatedHostEarnings;
      
      // Calculate price per unit (price per person or price per night)
      const pricePerUnit = pricePerPerson || pricePerNight || 0;
      
      // Order ID for new order (0 indicates new order, will be set by backend)
      const orderId = 0;
      
      // Build addons array per new API: [{ addonId, quantity }]
      const addonsArray = selectedAddOns.map((id) => {
        const listingAddon = listing?.addons?.find(
          (a) => (a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId) === id
        );
        
        if (listingAddon) {
          const pricingType = listingAddon.addon?.pricingType || "Individual";
          const quantity = pricingType === "Group" ? (addOnQuantities[id] || 1) : 1;
          
          return {
            addonId: listingAddon.addon?.addonId ?? listingAddon.addonId ?? listingAddon.assignmentId,
            quantity: quantity,
          };
        }
        return null;
      }).filter(Boolean);
      // Guest answers placeholder (extend when questions UI exists)
      const guestAnswers = [];
      // Build order data - new API format
      const orderData = {
        listingId: listingId || 0,
        bookingDate: bookingDate,
        bookingTime: bookingTime, // "HH:mm"
        bookingSlotId: bookingSlotId || 0,
        guestCount: numberOfGuests || 1,
        ...(customerId ? { customerId } : {}),
        customer: {
          name: customerName || "Guest User",
          email: customerEmail || "guest@example.com",
          phone: customerPhone || "+911234567890",
        },
        specialRequests: specialRequests || "",
        addons: addonsArray,
        guestAnswers: guestAnswers,
        paymentMethod: "razorpay",
      };
      
      console.log("📦 Creating order:", orderData);
      
      // Create the order
      const orderResponse = await createOrder(orderData);
      console.log("✅ Order created:", orderResponse);
      
      // Save payment details for checkout (e.g., Razorpay) - handle multiple response shapes
      try {
        const payment =
          orderResponse?.payment ||
          orderResponse?.data?.payment ||
          orderResponse?.order?.payment ||
          (orderResponse?.razorpayOrderId && {
            paymentMethod: "razorpay",
            razorpayOrderId: orderResponse.razorpayOrderId,
            razorpayKeyId: orderResponse.razorpayKeyId,
            amount: orderResponse.amount,
            currency: orderResponse.currency || "INR",
          }) ||
          null;
        if (payment) {
          localStorage.setItem("pendingPayment", JSON.stringify(payment));
        } else {
          console.warn("No payment payload found on orderResponse:", orderResponse);
        }
      } catch (e) {
        console.warn("Failed to persist payment payload:", e);
      }
      
      // Redirect to checkout or success page
      proceedToCheckout();
      
    } catch (error) {
      console.error("❌ Error creating order:", error);
      alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
    }
  };

  // Handle Google OAuth callback - receives idToken from Google
  const handleGoogleCallback = useRef(async (response) => {
    try {
      if (!response.credential) {
        throw new Error("No credential received from Google");
      }

      // Call API with idToken
      const apiResponse = await axios.post("/api/customers/auth/google", {
        idToken: response.credential,
      });

      // Save JWT token to localStorage
      if (apiResponse.data?.token || apiResponse.data?.jwtToken || apiResponse.data?.accessToken) {
        const token = apiResponse.data.token || apiResponse.data.jwtToken || apiResponse.data.accessToken;
        localStorage.setItem("jwtToken", token);
        
        // Store user info from Google response
        const userInfo = {
          email: apiResponse.data?.email || apiResponse.data?.user?.email || "",
          name: apiResponse.data?.name || apiResponse.data?.user?.name || "",
          firstName: apiResponse.data?.firstName || apiResponse.data?.user?.firstName || "",
          lastName: apiResponse.data?.lastName || apiResponse.data?.user?.lastName || "",
          ...(apiResponse.data?.user || {})
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        console.log("✅ User info stored from Google login:", userInfo);
        
        // Close modal
        setShowLoginModal(false);
        
        // Check if we have pending booking data and create order
        const savedBooking = localStorage.getItem("pendingBooking");
        if (savedBooking) {
          // Create order after login
          try {
            await createOrderFromPendingBooking();
          } catch (error) {
            console.error("Error creating order after Google login:", error);
            alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
          }
        } else {
          // Fallback to current state if no saved data
          proceedToCheckout();
        }
      } else {
        throw new Error("No token received from API");
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert(error.response?.data?.message || "Login failed. Please try again.");
    }
  });

  // Load Google Sign-In script
  useEffect(() => {
    if (!window.google && process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback.current,
          });
        }
      };
      document.body.appendChild(script);
    }
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Handle Google login button click
  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // Trigger Google Sign-In button click
      const buttonContainer = document.getElementById("google-signin-button");
      if (buttonContainer) {
        const googleButton = buttonContainer.querySelector("div[role='button']");
        if (googleButton) {
          googleButton.click();
        } else {
          // Render button if not already rendered
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
          });
          // Wait a bit then click
          setTimeout(() => {
            const btn = buttonContainer.querySelector("div[role='button']");
            if (btn) btn.click();
          }, 100);
        }
      } else {
        alert("Google Sign-In button container not found.");
      }
    } else {
      alert("Google Sign-In is not available. Please configure REACT_APP_GOOGLE_CLIENT_ID.");
    }
  };

  // Create order from pending booking data (used after login)
  const createOrderFromPendingBooking = async () => {
    const savedBooking = localStorage.getItem("pendingBooking");
    if (!savedBooking) {
      console.warn("No pending booking data found");
      return;
    }

    const bookingData = JSON.parse(savedBooking);
    
    // Get customer info from localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const customerName = userInfo.name || 
                         (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}`.trim() : "") || 
                         userInfo.customerName || "";
    const customerEmail = userInfo.email || userInfo.customerEmail || "";
    const customerPhone = userInfo.customerPhone || 
                         (userInfo.phone ? (userInfo.countryCode || "+91") + userInfo.phone : "") ||
                         userInfo.phoneNumber || 
                         userInfo.phone || "";
    const customerId =
      userInfo.customerId ||
      userInfo.customer_id ||
      userInfo.id ||
      userInfo.userId ||
      userInfo.customerID ||
      null;
    
    // Get special requests (if any input field exists in future)
    const specialRequests = "";

    // Get listing ID
    const listingId = bookingData.listingId || listing?.listingId || listing?.id || 0;
    
    // Format booking date
    const bookingDate = bookingData.selectedDate || 
                       (selectedDate ? selectedDate.format("YYYY-MM-DD") : new Date().toISOString().split('T')[0]);
    
    // Get booking time
    let bookingTime = "00:00";
    if (selectedDateAvailability?.start_time) {
      bookingTime = selectedDateAvailability.start_time;
    } else if (selectedTimeSlotData?.startTime) {
      bookingTime = selectedTimeSlotData.startTime;
    }
    
    // Get booking slot ID
    const bookingSlotId = selectedTimeSlotData?.slotId || 
                          selectedTimeSlotData?.slot_id || 
                          selectedTimeSlotData?.id || 
                          bookingData.selectedTimeSlot || 
                          0;
    
    // Get number of guests
    const numberOfGuests = bookingData.guests ? 
                          (bookingData.guests.adults + bookingData.guests.children) : 
                          (guests.adults + guests.children);
    
    // Calculate base price amount
    const guestCount = numberOfGuests;
    const pricePerPerson = selectedDateAvailability?.price_per_person
      ? parseFloat(selectedDateAvailability.price_per_person)
      : (listing?.timeSlots?.[0]?.pricePerPerson 
          ? parseFloat(listing.timeSlots[0].pricePerPerson) 
          : null);
    const pricePerNight = selectedDateAvailability?.b2b_rate
      ? parseFloat(selectedDateAvailability.b2b_rate)
      : (listing?.timeSlots?.[0]?.b2bRate
          ? parseFloat(listing.timeSlots[0].b2bRate)
          : 0);
    const nights = 1;
    
    let pricingBaseAmount = 0;
    if (pricePerPerson) {
      pricingBaseAmount = pricePerPerson * guestCount * nights;
    } else {
      pricingBaseAmount = pricePerNight * nights;
    }
    
    // Calculate addons total - simplified structure matching API format
    let pricingAddonsTotal = 0;
    const addonsArray = [];
    if (bookingData.selectedAddOns && Array.isArray(bookingData.selectedAddOns)) {
      bookingData.selectedAddOns.forEach((addonData) => {
        const addonPrice = parseFloat(addonData.price || addonData.addonPrice || 0);
        const quantity = addonData.quantity || 1;
        pricingAddonsTotal += addonPrice * quantity;
        addonsArray.push({
          addonId: addonData.id || addonData.addonId,
          quantity: quantity,
        });
      });
    }
    
    const pricingSubtotal = pricingBaseAmount + pricingAddonsTotal;
    
    // Calculate platform commission
    let pricingPlatformCommission = 0;
    if (billingConfig?.commissions && Array.isArray(billingConfig.commissions)) {
      const platformFee = billingConfig.commissions.find(c => c.type === "Platform Fee" && c.isEnabled);
      if (platformFee) {
        pricingPlatformCommission = (pricingSubtotal * parseFloat(platformFee.currentRate || 0)) / 100;
      }
    }
    
    // Calculate tax amount
    let pricingTaxAmount = 0;
    if (billingConfig?.taxes && Array.isArray(billingConfig.taxes)) {
      const enabledTaxes = billingConfig.taxes.filter(tax => tax.isEnabled);
      enabledTaxes.forEach(tax => {
        const taxAmount = (pricingSubtotal * parseFloat(tax.currentRate || 0)) / 100;
        pricingTaxAmount += taxAmount;
      });
    }
    
    const pricingDiscountAmount = 0;
    // Calculate total price (subtotal + taxes - discounts, excluding platform commission)
    const pricingTotal = pricingSubtotal + pricingTaxAmount - pricingDiscountAmount;
    
    // Calculate host earnings (what the host receives: subtotal - platform commission)
    const calculatedHostEarnings = (pricingSubtotal || 5500) - (pricingPlatformCommission || 550);
    const hostEarnings = isNaN(calculatedHostEarnings) ? 4950 : calculatedHostEarnings;
    
    // Guest answers placeholder (extend when questions UI exists)
    const guestAnswers = [];
    
    // Build order data - new API format
    const orderData = {
      listingId: listingId || 0,
      bookingDate: bookingDate,
      bookingTime: bookingTime, // "HH:mm"
      bookingSlotId: bookingSlotId || 0,
      guestCount: numberOfGuests || 1,
      ...(customerId ? { customerId } : {}),
      customer: {
        name: customerName || "Guest User",
        email: customerEmail || "guest@example.com",
        phone: customerPhone || "+911234567890",
      },
      specialRequests: specialRequests || "",
      addons: addonsArray,
      guestAnswers: guestAnswers,
      paymentMethod: "razorpay",
    };
    
    console.log("📦 Creating order after login:", orderData);
    
    // Create the order
    const orderResponse = await createOrder(orderData);
    console.log("✅ Order created:", orderResponse);
    
    // Save payment details for checkout (e.g., Razorpay)
    try {
      const payment =
        orderResponse?.payment ||
        orderResponse?.data?.payment ||
        orderResponse?.order?.payment ||
        (orderResponse?.razorpayOrderId && {
          paymentMethod: "razorpay",
          razorpayOrderId: orderResponse.razorpayOrderId,
          razorpayKeyId: orderResponse.razorpayKeyId,
          amount: orderResponse.amount,
          currency: orderResponse.currency || "INR",
        }) ||
        null;
      if (payment) {
        localStorage.setItem("pendingPayment", JSON.stringify(payment));
      } else {
        console.warn("No payment payload found on orderResponse:", orderResponse);
      }
    } catch (e) {
      console.warn("Failed to persist payment payload:", e);
    }
    
    // Clear pending booking data
    localStorage.removeItem("pendingBooking");
    
    // Redirect to checkout
    proceedToCheckout();
  };

  // Handle phone login callback (called after successful OTP verification)
  const handlePhoneLogin = async (phoneNumber, response) => {
    console.log("Phone login successful:", phoneNumber, response);
    // JWT token and user info are already stored in localStorage by LoginModal
    // Now create the order if we have pending booking data
    try {
      await createOrderFromPendingBooking();
    } catch (error) {
      console.error("Error creating order after login:", error);
      alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
    }
  };

  // Check for successful login after modal closes (for Google login fallback)
  useEffect(() => {
    // Only proceed if modal was just closed AND user is now logged in AND we have saved booking
    // Note: Phone login handles order creation directly in handlePhoneLogin
    // This is a fallback for Google login if createOrderFromPendingBooking wasn't called
    if (!showLoginModal && isLoggedIn()) {
      const savedBooking = localStorage.getItem("pendingBooking");
      if (savedBooking) {
        // Small delay to ensure modal is fully closed, then create order
        setTimeout(async () => {
          try {
            await createOrderFromPendingBooking();
          } catch (error) {
            console.error("Error creating order after login:", error);
            alert(error.response?.data?.message || error.message || "Failed to create order. Please try again.");
          }
        }, 100);
      }
    }
  }, [showLoginModal]);

  const handleOpenDateTime = (index) => {
    // Show date picker when clicking date item (index 0)
    if (index === 0) {
      setShowDatePicker(true);
      setShowTimeSlots(false);
      setShowGuestPicker(false);
    }
    // Show time slots when clicking time slot item (index 1)
    else if (index === 1) {
      setShowTimeSlots(true);
      setShowDatePicker(false);
      setShowGuestPicker(false);
    }
    // Show guest picker when clicking guest item (index 2)
    else if (index === 2) {
      setShowGuestPicker(true);
      setShowDatePicker(false);
      setShowTimeSlots(false);
    }
  };

  const handleDateSelect = (startDateText, endDateText) => {
    if (startDateText) {
      setSelectedDate(moment(new Date(startDateText)));
    }
    // Handle end date if provided (for date range)
    setShowDatePicker(false);
  };

  const handleTimeSelect = (timeText) => {
    setSelectedTimeSlot(timeText);
    setShowTimeSlots(false);
  };

  // Get maxSeats from availability data if available, otherwise from selected timeSlot, fallback to listing maxGuests
  const maxSeats = selectedDateAvailability?.available_seats ?? 
                   selectedDateAvailability?.max_seats ?? 
                   selectedTimeSlotData?.maxSeats ?? 
                   listing?.maxGuests;

  // Fetch billing configuration when listing is available
  useEffect(() => {
    const fetchBillingConfig = async () => {
      const listingId = listing?.listingId || listing?.id;
      if (listingId) {
        try {
          const config = await getBillingConfiguration(listingId);
          setBillingConfig(config);
        } catch (error) {
          console.error("Failed to fetch billing configuration:", error);
          // Set to null on error so we don't show taxes
          setBillingConfig(null);
        }
      }
    };

    fetchBillingConfig();
  }, [listing?.listingId, listing?.id]);

  // Fetch availability when slot is selected
  useEffect(() => {
    const fetchAvailability = async () => {
      const listingId = listing?.listingId || listing?.id;
      // Try multiple possible slotId field names
      const slotId = selectedTimeSlotData?.slotId || 
                     selectedTimeSlotData?.slot_id || 
                     selectedTimeSlotData?.id;
      
      if (listingId && slotId) {
        setLoadingAvailability(true);
        try {
          // Calculate date range (current month + next month)
          const now = new Date();
          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
          
          // Format dates as YYYY-MM-DD
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          console.log("📅 Fetching availability:", {
            listingId,
            slotId,
            startDate: startDateStr,
            endDate: endDateStr
          });
          
          const availability = await getAvailability(listingId, startDateStr, endDateStr, slotId);
          console.log("✅ Availability data received:", availability);
          setAvailabilityData(Array.isArray(availability) ? availability : []);
        } catch (error) {
          console.error("❌ Failed to fetch availability:", error);
          setAvailabilityData([]);
        } finally {
          setLoadingAvailability(false);
        }
      } else {
        console.warn("⚠️ Missing parameters for availability fetch:", { listingId, slotId, selectedTimeSlotData });
        setAvailabilityData([]);
      }
    };

    fetchAvailability();
  }, [listing?.listingId, listing?.id, selectedTimeSlotData?.slotId, selectedTimeSlotData?.slot_id, selectedTimeSlotData?.id, selectedTimeSlot]);

  // Ensure guest count doesn't exceed maxSeats when timeSlot changes
  React.useEffect(() => {
    if (maxSeats !== undefined && maxSeats > 0) {
      const currentTotal = guests.adults + guests.children;
      if (currentTotal > maxSeats) {
        // Adjust guests to not exceed maxSeats
        const excess = currentTotal - maxSeats;
        setGuests((prev) => {
          const newGuests = { ...prev };
          // Reduce children first, then adults if needed
          if (newGuests.children >= excess) {
            newGuests.children = newGuests.children - excess;
          } else {
            const remainingExcess = excess - newGuests.children;
            newGuests.children = 0;
            newGuests.adults = Math.max(1, newGuests.adults - remainingExcess);
          }
          return newGuests;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSeats]);

  return (
    <>
      <div className={cn(classSection, styles.section)}>
        <div className={cn("container", styles.container)}>
          <div className={styles.wrapper}>
            <Details 
              className={styles.details}
              listing={listing}
              selectedAddOns={selectedAddOns}
              addOnQuantities={addOnQuantities}
              onToggleAddOn={handleToggleAddOn}
              onAddOnQuantityChange={handleAddOnQuantityChange}
            />
            <Receipt
              className={styles.receipt}
              items={items}
              priceActual={
                listing?.timeSlots?.[0]?.pricePerPerson
                  ? `${listing?.currency || "INR"} ${listing.timeSlots[0].pricePerPerson}`
                  : listing?.timeSlots?.[0]?.b2bRate
                  ? `${listing?.currency || "INR"} ${listing.timeSlots[0].b2bRate}`
                  : "$119"
              }
              time={
                listing?.timeSlots?.[0]?.pricePerPerson
                  ? "person"
                  : "night"
              }
              avatar={listing?.hostAvatar || listing?.avatar}
              onItemClick={handleOpenDateTime}
              renderItem={(item, index) => {
                if (index === 0) {
                  return (
                    <div ref={dateItemRef} style={{ position: 'relative' }}>
                      <div
                        className={receiptStyles.item}
                        onClick={() => handleOpenDateTime(0)}
                        role="button"
                      >
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>{item.title}</div>
                        </div>
                      </div>
                      <InlineDatePicker
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onDateSelect={handleDateSelect}
                        selectedDate={selectedDate ? selectedDate.toDate().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : formattedDefaultDate}
                        timeSlots={listing?.timeSlots || []}
                        availabilityData={availabilityData}
                      />
                    </div>
                  );
                }
                if (index === 1) {
                  return (
                    <div ref={timeItemRef} style={{ position: 'relative' }}>
                      <div
                        className={receiptStyles.item}
                        onClick={() => handleOpenDateTime(1)}
                        role="button"
                      >
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>{item.title}</div>
                        </div>
                      </div>
                      <TimeSlotsPicker
                        visible={showTimeSlots}
                        onClose={() => setShowTimeSlots(false)}
                        onTimeSelect={handleTimeSelect}
                        selectedTime={selectedTimeSlot}
                        timeSlots={listing?.timeSlots || []}
                      />
                    </div>
                  );
                }
                if (index === 2) {
                  return (
                    <div ref={guestItemRef} style={{ position: 'relative' }}>
                      <div
                        className={receiptStyles.item}
                        onClick={() => handleOpenDateTime(2)}
                        role="button"
                      >
                        <div className={receiptStyles.icon}>
                          <Icon name={item.icon} size="24" />
                        </div>
                        <div className={receiptStyles.box}>
                          <div className={receiptStyles.category}>{item.category}</div>
                          <div className={receiptStyles.subtitle}>{item.title}</div>
                        </div>
                      </div>
                      <GuestPicker
                        visible={showGuestPicker}
                        onClose={() => setShowGuestPicker(false)}
                        onGuestChange={setGuests}
                        initialGuests={guests}
                        maxGuests={listing?.maxGuests || 4}
                        maxSeats={maxSeats}
                        allowPets={listing?.allowPets || false}
                        childrenAllowed={listing?.childrenAllowed !== false}
                        infantsAllowed={listing?.infantsAllowed !== false}
                      />
                    </div>
                  );
                }
                return null;
              }}
            >
              <div className={styles.btns}>
                <button className={cn("button-stroke", styles.button)}>
                  <span>Save</span>
                  <Icon name="plus" size="16" />
                </button>
                <button
                  type="button"
                  className={cn("button", styles.button)}
                  onClick={handleReserveClick}
                >
                  <span>Reserve</span>
                  <Icon name="bag" size="16" />
                </button>
              </div>
              <div className={styles.table}>
                {receipt.map((x, index) => (
                  <div className={styles.line} key={index}>
                    <div className={styles.cell}>{x.title}</div>
                    <div className={styles.cell}>{x.content}</div>
                  </div>
                ))}
              </div>
              <div className={styles.foot}>
                <button className={styles.report}>
                  <Icon name="flag" size="12" />
                  Report this property
                </button>
              </div>
            </Receipt>
          </div>
        </div>
      </div>
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onGoogleLogin={handleGoogleLogin}
        onPhoneLogin={handlePhoneLogin}
      />
    </>
  );
};

export default Description;
