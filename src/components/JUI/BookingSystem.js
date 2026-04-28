import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Ticket, ChefHat, Bed, X, Sparkles, Clock, Users, Star, Plus, Minus, CheckCircle2, ShieldCheck, ChevronDown } from "lucide-react";
import { useTheme } from "./Theme";
import { Rev, Chars } from "./UI";

// Original functional components
import DateSingle from "../DateSingle";
import TimeSlotsPicker from "../TimeSlotsPicker";
import Counter from "../Counter";

export function BookingSystem({ listing, type = "experience", selectedAddOns = [] }) {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W } } = useTheme();
  const [show, setShow] = useState(false);
  
  // Real State management
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const totalGuests = guests.adults + guests.children;
  const [showTimePicker, setShowTimePicker] = useState(false);

  const listingId = listing?.listingId;

  // Calculate addon total
  const addOnsTotal = selectedAddOns.reduce((sum, item) => {
    const addon = item.addon || item;
    return sum + (parseFloat(addon.price) || 0);
  }, 0);

  // Extract time slots from listing
  const timeSlots = listing?.timeSlots || [];
  
  // Extract proper price depending on whether a time slot is selected
  const selectedSlotData = timeSlots.find(s => s.slotName === startTime || s.startTime === startTime) || timeSlots[0];
  const extractedPrice = selectedSlotData?.pricePerPerson 
    || listing?.timeSlots?.[0]?.pricePerPerson
    || listing?.pricing?.basePrice
    || listing?.basePrice
    || listing?.price 
    || listing?.b2cPrice 
    || "0";
  
  const data = {
    price: extractedPrice,
    unit: type === "stay" ? "night" : "person",
    icon: type === "stay" ? Bed : (type === "food" ? ChefHat : Ticket)
  };

  const baseTotal = parseFloat(data.price) * totalGuests;
  const finalTotal = baseTotal + addOnsTotal;

  const handleReserve = () => {
    if (!startDate) return;
    
    const dateStr = startDate.format("YYYY-MM-DD");
    let url = `/experience-checkout?listingId=${listingId}&startDate=${dateStr}&guests=${totalGuests}`;
    if (startTime) url += `&startTime=${startTime}`;

    const guestsObj = { ...guests, guests: totalGuests };
    const addOnQuantities = {};
    const receipt = [];
    
    receipt.push({
      title: `₹${data.price} x ${totalGuests} ${data.unit}${totalGuests > 1 ? 's' : ''}`,
      content: `₹${baseTotal}`,
      kind: "base",
      showInCheckout: true
    });
    
    selectedAddOns.forEach(item => {
      const addon = item.addon || item;
      const id = addon.addonId || addon.id;
      addOnQuantities[id] = 1;
      receipt.push({
        title: addon.title || "Add-on",
        content: `₹${addon.price || 0}`,
        kind: "addon",
        showInCheckout: false
      });
    });

    receipt.push({
      title: "Total",
      content: `₹${finalTotal}`,
      kind: "total",
      showInCheckout: true
    });
    
    const bookingData = {
      listingId: listingId,
      listingTitle: listing?.title || listing?.name || "Experience",
      listingImage: listing?.coverPhotoUrl || listing?.listingMedia?.[0]?.url || "",
      hostName: listing?.host?.firstName ? `${listing?.host?.firstName} ${listing?.host?.lastName || ""}`.trim() : "Host",
      hostAvatar: listing?.host?.profilePhotoUrl || "/images/content/avatar.jpg",
      selectedDate: dateStr,
      selectedTimeSlot: startTime,
      guests: guestsObj,
      selectedAddOns: selectedAddOns.map(a => (a.addon?.addonId || a.addonId || a.id)),
      addOnQuantities: addOnQuantities,
      receipt: receipt,
      finalTotal: finalTotal,
      pricing: {
        currency: "INR",
        basePrice: baseTotal,
        addonsTotal: addOnsTotal,
        subtotal: baseTotal + addOnsTotal,
        discount: 0,
        tax: 0,
        total: finalTotal,
        guestCount: totalGuests,
        pricePerPerson: parseFloat(extractedPrice || 0)
      },
      bookingSummary: {
        date: dateStr,
        time: startTime,
        guestCount: totalGuests,
        billableGuestCount: totalGuests
      }
    };
    
    // Pass selected addons and full bookingData to the checkout page
    history.push({
      pathname: "/experience-checkout",
      search: url.split("?")[1] ? "?" + url.split("?")[1] : "",
      state: { 
        addOns: selectedAddOns.map(item => item.addon || item),
        bookingData: bookingData
      }
    });
  };

  const IconComp = data.icon;

  return (
    <>
      <style>{`
        .SingleDatePicker_picker,
        .SingleDatePickerPortal,
        .DateRangePicker_picker,
        .DateRangePickerPortal,
        .ReactDatesPortal {
          z-index: 99999 !important;
        }
      `}</style>
      {/* Floating Trigger */}
      <motion.button
        onClick={() => setShow(true)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: 40,
          right: 40,
          background: A,
          color: "#FFF",
          padding: "16px 32px",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: 600,
          fontSize: 15
        }}
      >
        <IconComp size={20} />
        Reserve Now
      </motion.button>

      <AnimatePresence>
        {show && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }} 
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 420,
                background: BG,
                borderRadius: 24,
                boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
                border: `1px solid ${B}`
              }}
            >
              {/* Header */}
              <div style={{ padding: "32px 32px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: FG }}>₹{data.price}</span>
                      <span style={{ fontSize: 13, color: M }}>/{data.unit}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Star size={12} fill={A} color={A} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: FG }}>4.9</span>
                      <span style={{ fontSize: 12, color: M }}>(124 reviews)</span>
                    </div>
                  </div>
                  <button onClick={() => setShow(false)} style={{ background: S, border: "none", padding: 8, borderRadius: 100, cursor: "pointer", color: FG }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Selector Grid */}
              <div style={{ padding: "0 32px 32px" }}>
                <div style={{ 
                  border: `1px solid ${B}`, 
                  borderRadius: 20, 
                  background: S 
                }}>
                  {/* Date Picker Integration */}
                  <div style={{ borderBottom: `1px solid ${B}`, padding: "16px 20px" }}>
                    <div style={{ fontSize: 10, color: M, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Select Date</div>
                    <DateSingle 
                      withPortal={true}
                      date={startDate}
                      onDateChange={(date) => setStartDate(date)}
                      placeholder="Pick a date"
                      id="jui-booking-date"
                      plain
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    {/* Time Slot Integration */}
                    <div 
                      onClick={() => setShowTimePicker(true)}
                      style={{ borderRight: `1px solid ${B}`, padding: "16px 20px", cursor: "pointer", position: "relative" }}
                    >
                      <div style={{ fontSize: 10, color: M, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.05em" }}>Time</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: FG, display: "flex", alignItems: "center", gap: 8 }}>
                        {startTime || "Select Time"}
                        <ChevronDown size={14} color={M} />
                      </div>
                      
                      <TimeSlotsPicker 
                        visible={showTimePicker}
                        onClose={() => setShowTimePicker(false)}
                        onTimeSelect={(t) => setStartTime(t)}
                        selectedTime={startTime}
                        timeSlots={timeSlots}
                        selectedDate={startDate}
                        style={{ position: "absolute", top: "100%", left: 0, zIndex: 10, width: "200%" }}
                      />
                    </div>

                    <div style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 10, color: M, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.05em" }}>Guests</div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: FG, fontWeight: 600 }}>Adults</span>
                          <Counter 
                            value={guests.adults} 
                            setValue={(val) => setGuests(prev => ({ ...prev, adults: val }))} 
                            min={1} 
                          />
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: FG, fontWeight: 600 }}>Children</span>
                          <Counter 
                            value={guests.children} 
                            setValue={(val) => setGuests(prev => ({ ...prev, children: val }))} 
                            min={0} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total & Summary */}
                <div style={{ marginTop: 24, padding: "20px 0", borderTop: `1px solid ${B}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ color: M, fontSize: 13 }}>₹{data.price} x {totalGuests} {data.unit}{totalGuests > 1 ? 's' : ''}</span>
                    <span style={{ color: FG, fontWeight: 600, fontSize: 13 }}>₹{baseTotal}</span>
                  </div>

                  {selectedAddOns.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ color: M, fontSize: 13 }}>Add-ons ({selectedAddOns.length})</span>
                      <span style={{ color: FG, fontWeight: 600, fontSize: 13 }}>+₹{addOnsTotal}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ color: M, fontSize: 13 }}>Service fee</span>
                    <span style={{ color: FG, fontWeight: 600, fontSize: 13 }}>₹0</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${B}` }}>
                    <span style={{ color: FG, fontWeight: 700, fontSize: 16 }}>Total</span>
                    <span style={{ color: A, fontWeight: 700, fontSize: 16 }}>₹{finalTotal}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReserve}
                  disabled={!startDate || !startTime}
                  style={{
                    width: "100%",
                    background: (!startDate || !startTime) ? M : A,
                    color: "#FFF",
                    padding: "16px",
                    borderRadius: 14,
                    border: "none",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: (!startDate || !startTime) ? "not-allowed" : "pointer",
                    marginTop: 4,
                    boxShadow: `0 10px 30px ${AL}`
                  }}
                >
                  Reserve Experience
                </motion.button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, color: M, fontSize: 12 }}>
                  <ShieldCheck size={14} />
                  <span>Secure payment processed by Little Known Planet</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
