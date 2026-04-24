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

export function BookingSystem({ listing, type = "experience" }) {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W } } = useTheme();
  const [show, setShow] = useState(false);
  
  // Real State management
  const [startDate, setStartDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [guests, setGuests] = useState(1);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const listingId = listing?.listingId;

  const handleReserve = () => {
    if (!startDate) return;
    
    const dateStr = startDate.format("YYYY-MM-DD");
    let url = `/experience-checkout?listingId=${listingId}&startDate=${dateStr}&guests=${guests}`;
    if (startTime) url += `&startTime=${startTime}`;
    
    history.push(url);
  };

  // Extract time slots from listing
  const timeSlots = listing?.timeSlots || [];
  
  const data = {
    price: listing?.price || "0",
    unit: type === "stay" ? "night" : "person",
    icon: type === "stay" ? Bed : (type === "food" ? ChefHat : Ticket)
  };

  const IconComp = data.icon;

  return (
    <>
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
                maxWidth: 480,
                background: BG,
                borderRadius: 32,
                overflow: "hidden",
                boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
                border: `1px solid ${B}`
              }}
            >
              {/* Header */}
              <div style={{ padding: "40px 40px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: FG }}>${data.price}</span>
                      <span style={{ fontSize: 14, color: M }}>/{data.unit}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                      <Star size={14} fill={A} color={A} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>4.9</span>
                      <span style={{ fontSize: 13, color: M }}>(124 reviews)</span>
                    </div>
                  </div>
                  <button onClick={() => setShow(false)} style={{ background: S, border: "none", padding: 8, borderRadius: 100, cursor: "pointer", color: FG }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Selector Grid */}
              <div style={{ padding: "0 40px 40px" }}>
                <div style={{ 
                  border: `1px solid ${B}`, 
                  borderRadius: 20, 
                  overflow: "hidden",
                  background: S 
                }}>
                  {/* Date Picker Integration */}
                  <div style={{ borderBottom: `1px solid ${B}`, padding: "16px 20px" }}>
                    <div style={{ fontSize: 10, color: M, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>Select Date</div>
                    <DateSingle 
                      plain 
                      date={startDate}
                      onDateChange={(date) => setStartDate(date)}
                      placeholder="Pick a date"
                      id="jui-booking-date"
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
                      <div style={{ fontSize: 10, color: M, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.05em" }}>Guests</div>
                      <Counter 
                        value={guests} 
                        setValue={setGuests} 
                        min={1} 
                        iconMinus="minus" 
                        iconPlus="plus" 
                      />
                    </div>
                  </div>
                </div>

                {/* Total & Summary */}
                <div style={{ marginTop: 32, padding: "24px 0", borderTop: `1px solid ${B}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: M, fontSize: 14 }}>${data.price} x {guests} {data.unit}{guests > 1 ? 's' : ''}</span>
                    <span style={{ color: FG, fontWeight: 600, fontSize: 14 }}>${parseFloat(data.price) * guests}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: M, fontSize: 14 }}>Service fee</span>
                    <span style={{ color: FG, fontWeight: 600, fontSize: 14 }}>$0</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${B}` }}>
                    <span style={{ color: FG, fontWeight: 700, fontSize: 18 }}>Total</span>
                    <span style={{ color: A, fontWeight: 700, fontSize: 18 }}>${parseFloat(data.price) * guests}</span>
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
                    padding: "20px",
                    borderRadius: 16,
                    border: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: (!startDate || !startTime) ? "not-allowed" : "pointer",
                    marginTop: 8,
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
