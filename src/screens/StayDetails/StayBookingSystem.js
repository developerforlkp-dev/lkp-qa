import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Bed, X, Star, ShieldCheck, ChevronDown, Plus, Minus, Info } from "lucide-react";
import moment from "moment";
import { useTheme } from "../../components/JUI/Theme";
import { createStayOrder } from "../../utils/api";
import Counter from "../../components/Counter";
// We'll use a simple date range picker or just two DateSingles for premium look
import DateSingle from "../../components/DateSingle";

const formatPrice = (price) => {
  return Number(price).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
};

const StayBookingSystem = ({
  stay,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guests,
  setGuests,
  selectedRooms, // Array of {roomId, mealPlan, count}
  onRoomsCountChange
}) => {
  const history = useHistory();
  const { tokens: { A, AH, BG, FG, M, S, B, AL, W } } = useTheme();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolvedSelectedRooms = useMemo(() => {
    if (!stay || !Array.isArray(selectedRooms)) return [];
    const rooms = stay.rooms || stay.roomTypes || stay.room_types || [];
    return selectedRooms.map(sel => {
      const room = rooms.find(r => String(r.roomId || r.id) === String(sel.roomId));
      return room ? { ...room, ...sel } : null;
    }).filter(Boolean);
  }, [stay, selectedRooms]);

  const nightsCount = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.max(1, moment(checkOutDate).diff(moment(checkInDate), "days"));
  }, [checkInDate, checkOutDate]);

  // Price Calculation Logic
  const pricing = useMemo(() => {
    if (!stay) return { perNight: 0, subtotal: 0, discount: 0, warning: null, isOver: false };
    
    let totalOriginalPerNight = 0;
    let totalBaseAdultsLimit = 0;
    let totalBaseChildrenLimit = 0;
    let totalExtraAdultsLimit = 0;
    let totalExtraChildrenLimit = 0;

    const activeSeason = checkInDate ? (stay.seasonalPeriods || []).find(p => 
      moment(checkInDate).isSameOrAfter(p.startDate, 'day') &&
      moment(checkInDate).isSameOrBefore(p.endDate, 'day')
    ) : null;
    const seasonId = activeSeason?.tempId || activeSeason?.id || activeSeason?.seasonalPeriodId;

    const isPropertyBased = stay?.bookingScope === "Property-Based";

    if (isPropertyBased) {
      totalBaseAdultsLimit = stay.maxAdults || stay.maxGuests || 1;
      totalBaseChildrenLimit = stay.maxChildren || 0;
      totalExtraAdultsLimit = stay.maxExtraAdultsAllowed || stay.maxExtraBeds || 0;
      totalExtraChildrenLimit = stay.maxExtraChildrenAllowed || 0;
      
      let basePrice = parseFloat(stay.fullPropertyB2cPrice || stay.b2cPrice || stay.price || 0);
      let extraAP = parseFloat(stay.fullPropertyExtraAdultPrice || stay.extraAdultPrice || 0);
      let extraCP = parseFloat(stay.fullPropertyExtraChildPrice || stay.extraChildPrice || 0);

      if (seasonId) {
        const propSeasonData = (stay.propertySeasonalPricing || {})[seasonId] || stay[seasonId];
        if (propSeasonData) {
          basePrice = parseFloat(propSeasonData.fullPropertyHikePrice || propSeasonData.hikePrice || propSeasonData.fullPropertyB2cPrice || basePrice);
          extraAP = parseFloat(propSeasonData.fullPropertyExtraAdultPrice || propSeasonData.extraAdultPrice || extraAP);
          extraCP = parseFloat(propSeasonData.fullPropertyExtraChildPrice || propSeasonData.extraChildPrice || extraCP);
        }
      }

      const exA = Math.max(0, (guests?.adults || 1) - totalBaseAdultsLimit);
      const exC = Math.max(0, (guests?.children || 0) - totalBaseChildrenLimit);
      totalOriginalPerNight = basePrice + (exA * extraAP) + (exC * extraCP);
    } else {
      // Room-Based: Sum up for all selected rooms
      resolvedSelectedRooms.forEach(room => {
        let roomBasePrice = parseFloat(room.epPrice || room.b2cPrice || room.price || 0);
        const mealPlan = room.mealPlan || "EP";
        const mealKey = { EP: "epPrice", BB: "bbPrice", CP: "cpPrice", MAP: "mapPrice", AP: "apPrice" }[mealPlan];
        roomBasePrice = parseFloat(room[mealKey] || roomBasePrice);

        let roomExtraAP = parseFloat(room.extraAdultPrice || stay.extraAdultPrice || 0);
        let roomExtraCP = parseFloat(room.extraChildPrice || stay.extraChildPrice || 0);

        if (seasonId) {
          const roomSeasonData = (room.seasonalPricing || {})[seasonId] || room[seasonId];
          const mealSeasonData = (room.mealPlanSeasonalPricing || {})[seasonId]?.[mealPlan];
          if (mealSeasonData) roomBasePrice = parseFloat(mealSeasonData.hikePrice || mealSeasonData.price || roomBasePrice);
          else if (roomSeasonData) roomBasePrice = parseFloat(roomSeasonData.hikePrice || roomSeasonData.price || roomBasePrice);
          
          if (roomSeasonData) {
            if (roomSeasonData.extraAdultPrice) roomExtraAP = parseFloat(roomSeasonData.extraAdultPrice);
            if (roomSeasonData.extraChildPrice) roomExtraCP = parseFloat(roomSeasonData.extraChildPrice);
          }
        }

        totalOriginalPerNight += roomBasePrice * room.count;
        totalBaseAdultsLimit += (room.maxAdults || 1) * room.count;
        totalBaseChildrenLimit += (room.maxChildren || 0) * room.count;
        totalExtraAdultsLimit += (room.maxExtraAdultsAllowed || room.maxExtraBeds || 0) * room.count;
        totalExtraChildrenLimit += (room.maxExtraChildrenAllowed || 0) * room.count;

        // Note: For multi-room, extra guest calculation is complex. 
        // We'll apply extra fees based on the TOTAL overflow across all selected rooms.
        // This is a common simplification for unified guest pickers.
      } );

      const exA = Math.max(0, (guests?.adults || 1) - totalBaseAdultsLimit);
      const exC = Math.max(0, (guests?.children || 0) - totalBaseChildrenLimit);
      
      // Calculate average extra prices from selected rooms or stay fallbacks
      const avgExtraAP = resolvedSelectedRooms.length > 0 
        ? resolvedSelectedRooms.reduce((acc, r) => acc + parseFloat(r.extraAdultPrice || stay.extraAdultPrice || 0), 0) / resolvedSelectedRooms.length
        : parseFloat(stay.extraAdultPrice || 0);
      const avgExtraCP = resolvedSelectedRooms.length > 0
        ? resolvedSelectedRooms.reduce((acc, r) => acc + parseFloat(r.extraChildPrice || stay.extraChildPrice || 0), 0) / resolvedSelectedRooms.length
        : parseFloat(stay.extraChildPrice || 0);

      totalOriginalPerNight += (exA * avgExtraAP) + (exC * avgExtraCP);
    }

    // Occupancy & Stay Warnings
    let warning = null;
    let isOver = false;
    
    const currentAdults = guests?.adults || 1;
    const currentChildren = guests?.children || 0;

    // 1. Check Maximum Stay Limit
    const maxNights = stay.maximumStayNights || 0;
    if (maxNights > 0 && nightsCount > maxNights) {
      isOver = true;
      warning = `Maximum stay allowed is ${maxNights} nights.`;
    }
    
    // 2. Check Capacity
    if (!isOver) {
      const typeLabel = isPropertyBased ? "Property" : "Selected Rooms";
      if (currentAdults > (totalBaseAdultsLimit + totalExtraAdultsLimit)) {
        isOver = true;
        warning = `${typeLabel} adult capacity reached (${totalBaseAdultsLimit + totalExtraAdultsLimit} max).`;
      } else if (currentChildren > (totalBaseChildrenLimit + totalExtraChildrenLimit)) {
        isOver = true;
        warning = `${typeLabel} children capacity reached (${totalBaseChildrenLimit + totalExtraChildrenLimit} max).`;
      } else if (currentAdults > totalBaseAdultsLimit || currentChildren > totalBaseChildrenLimit) {
        warning = `Base occupants reached. Additional guests will incur extra charges.`;
      }
    }

    // Discount Tiers
    let appliedDiscountPercent = 0;
    if (nightsCount > 0 && Array.isArray(stay.discountTiers)) {
      const tier = stay.discountTiers.find(t => nightsCount >= (t.minimumDays || 0) && nightsCount <= (t.maximumDays || 999));
      if (tier) appliedDiscountPercent = parseFloat(tier.discountPercentage || 0);
    }

    const discountedPerNight = totalOriginalPerNight * (1 - (appliedDiscountPercent / 100));
    const preTaxSubtotal = discountedPerNight * Math.max(1, nightsCount);
    const discountAmount = (totalOriginalPerNight * Math.max(1, nightsCount)) - preTaxSubtotal;

    const gst = preTaxSubtotal * 0.18;
    const serviceFee = preTaxSubtotal * 0.02;
    const finalTotalWithTax = preTaxSubtotal + gst + serviceFee;

    return {
      perNight: discountedPerNight,
      originalPerNight: totalOriginalPerNight,
      subtotal: preTaxSubtotal,
      finalTotal: finalTotalWithTax,
      nightsCount,
      discount: discountAmount,
      discountPercent: appliedDiscountPercent,
      warning,
      isOver,
      gst,
      serviceFee,
      baseAdultsLimit: totalBaseAdultsLimit,
      extraAdultsLimit: totalExtraAdultsLimit,
      baseChildrenLimit: totalBaseChildrenLimit,
      extraChildrenLimit: totalExtraChildrenLimit
    };
  }, [stay, resolvedSelectedRooms, checkInDate, guests, nightsCount]);

  const handleReserve = async () => {
    if (!checkInDate || !checkOutDate) {
      alert("Please select your stay dates.");
      return;
    }

    if (!checkOutDate.isAfter(checkInDate, 'day')) {
      alert("Check-out date must be after Check-in date.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        stayId: Number(stay.stayId || stay.id),
        checkInDate: checkInDate.format("YYYY-MM-DD"),
        checkOutDate: checkOutDate.format("YYYY-MM-DD"),
        numberOfGuests: (guests.adults || 1) + (guests.children || 0),
        amount: pricing.finalTotal,
        paymentMethod: "razorpay",
        rooms: resolvedSelectedRooms.map(r => ({
          roomId: r.roomId || r.id,
          roomsBooked: r.count,
          adults: guests.adults || 1,
          children: guests.children || 0,
          mealPlanCode: r.mealPlan || "EP"
        }))
      };

      const response = await createStayOrder(payload);
      const paymentResponse = response?.payment || response;
      
      localStorage.setItem("pendingPayment", JSON.stringify({
        paymentMethod: "razorpay",
        razorpayOrderId: paymentResponse.razorpayOrderId,
        razorpayKeyId: paymentResponse.razorpayKeyId,
        amount: Math.round(pricing.finalTotal * 100),
        currency: paymentResponse.currency || "INR"
      }));

      const receipt = [
        { title: `Base Stay (${pricing.nightsCount} nights)`, content: `₹${formatPrice(pricing.originalPerNight * pricing.nightsCount)}` }
      ];

      if (pricing.discount > 0) {
        receipt.push({ title: `Discount (${pricing.discountPercent}%)`, content: `- ₹${formatPrice(pricing.discount)}` });
      }

      receipt.push({ title: "GST (18%)", content: `₹${formatPrice(pricing.gst)}` });
      receipt.push({ title: "Service Fee (2%)", content: `₹${formatPrice(pricing.serviceFee)}` });
      receipt.push({ title: "Total", content: `₹${formatPrice(pricing.finalTotal)}` });

      const roomSummary = resolvedSelectedRooms.map(r => `${r.count}x ${r.roomName || r.name}`).join(", ");

      const bookingData = {
        stayId: payload.stayId,
        listingTitle: stay.propertyName || stay.title || "Stay",
        listingImage: stay.coverPhotoUrl || stay.coverImageUrl || "",
        isStay: true,
        checkInDate: checkInDate.format("MMM DD, YYYY"),
        checkOutDate: checkOutDate.format("MMM DD, YYYY"),
        roomType: roomSummary || "Full Property",
        guests: guests,
        receipt: receipt
      };
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

      history.push("/checkout");
    } catch (err) {
      console.error(err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        .DateInput_input {
          font-size: 14px !important;
          padding: 0 !important;
          height: auto !important;
          line-height: 1 !important;
          font-weight: 700 !important;
          background: transparent !important;
          color: ${FG} !important;
        }
        .DateInput {
          width: 100% !important;
          background: transparent !important;
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
          padding: "18px 36px",
          borderRadius: 100,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
          border: "none",
          cursor: "pointer",
          zIndex: 1000,
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "0.02em"
        }}
      >
        <Bed size={20} />
        Reserve
      </motion.button>

      <AnimatePresence>
        {show && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.7)", backdropFilter: "blur(12px)" }} 
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 480,
                background: BG,
                borderRadius: 32,
                boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
                border: `1px solid ${B}`,
                overflow: "hidden"
              }}
            >
              {/* Header */}
              <div style={{ padding: "40px 40px 24px", borderBottom: `1px solid ${B}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: FG, marginBottom: 8 }}>Reserve Stay</h3>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: A }}>₹{formatPrice(pricing.perNight)}</span>
                      {pricing.discount > 0 && (
                        <span style={{ fontSize: 16, color: M, textDecoration: "line-through", opacity: 0.6 }}>₹{formatPrice(pricing.originalPerNight)}</span>
                      )}
                      <span style={{ fontSize: 14, color: M }}>/ night</span>
                    </div>
                  </div>
                  <button onClick={() => setShow(false)} style={{ background: S, border: "none", padding: 10, borderRadius: "50%", cursor: "pointer", color: FG }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 40 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: B, border: `1px solid ${B}`, borderRadius: 20, overflow: "hidden" }}>
                  {/* Check In */}
                  <div style={{ background: S, padding: "20px 24px" }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Check-in</p>
                    <DateSingle 
                      date={checkInDate}
                      onDateChange={(date) => {
                        setCheckInDate(date);
                        // If new check-in is same or after current check-out, clear check-out
                        if (checkOutDate && date && !checkOutDate.isAfter(date, 'day')) {
                          setCheckOutDate(null);
                        }
                      }}
                      placeholder="Add date"
                      plain
                      withPortal
                      displayFormat="DD/MM/YYYY"
                    />
                  </div>
                  {/* Check Out */}
                  <div style={{ background: S, padding: "20px 24px" }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Check-out</p>
                    <DateSingle 
                      date={checkOutDate}
                      onDateChange={setCheckOutDate}
                      placeholder="Add date"
                      plain
                      withPortal
                      displayFormat="DD/MM/YYYY"
                      isOutsideRange={(day) => {
                        const today = moment().startOf('day');
                        if (checkInDate) {
                          // Disable check-in day and everything before it
                          return !day.isAfter(checkInDate, 'day');
                        }
                        return day.isBefore(today, 'day');
                      }}
                    />
                  </div>
                  {/* Guests */}
                  <div style={{ gridColumn: "span 2", background: S, padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>Adults</p>
                        <p style={{ fontSize: 12, color: M }}>Age 13+</p>
                      </div>
                      <Counter 
                        value={guests.adults} 
                        setValue={(v) => setGuests(prev => ({...prev, adults: v}))} 
                        min={1} 
                        max={pricing.baseAdultsLimit + pricing.extraAdultsLimit}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>Children</p>
                        <p style={{ fontSize: 12, color: M }}>Ages 2–12</p>
                      </div>
                      <Counter 
                        value={guests.children} 
                        setValue={(v) => setGuests(prev => ({...prev, children: v}))} 
                        min={0} 
                        max={pricing.baseChildrenLimit + pricing.extraChildrenLimit}
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Rooms List */}
                {resolvedSelectedRooms.length > 0 && (
                  <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.1em" }}>Selected Accommodations</p>
                    {resolvedSelectedRooms.map((room) => (
                      <div key={room.roomId || room.id} style={{ padding: "20px 24px", background: AL, borderRadius: 20, border: `1px solid ${A}33` }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: A, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF" }}>
                              <Bed size={20} />
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: FG }}>{room.roomName || room.name}</p>
                              <p style={{ fontSize: 12, color: M }}>{room.mealPlan || "EP"} Plan</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: M, textTransform: "uppercase", letterSpacing: "0.1em" }}>Rooms</p>
                            <Counter 
                              value={room.count} 
                              setValue={(v) => onRoomsCountChange(room.roomId || room.id, v)} 
                              min={1} 
                              max={Number(room.units || room.totalRooms || room.availableRooms || 99)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings & Messages */}
                {pricing.warning && (
                  <div style={{ 
                    marginTop: 24, padding: "16px 20px", borderRadius: 16, 
                    background: pricing.isOver ? "#FFF5F5" : AL, 
                    border: `1px solid ${pricing.isOver ? "#FEB2B2" : A + '33'}`,
                    display: "flex", gap: 12, alignItems: "flex-start"
                  }}>
                    <Info size={18} color={pricing.isOver ? "#F56565" : A} style={{ marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: pricing.isOver ? "#C53030" : FG, lineHeight: 1.5, fontWeight: 500 }}>
                      {pricing.warning}
                    </p>
                  </div>
                )}

                {/* Price Summary */}
                {nightsCount > 0 && (
                  <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: M, fontSize: 15 }}>
                      <span>Base Price × {nightsCount} nights</span>
                      <span>₹{formatPrice(pricing.originalPerNight * nightsCount)}</span>
                    </div>

                    {pricing.discount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#10B981", fontSize: 15, fontWeight: 600 }}>
                        <span>Discount ({pricing.discountPercent}%)</span>
                        <span>- ₹{formatPrice(pricing.discount)}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 20, borderTop: `1px dashed ${B}` }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: FG }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: A }}>₹{formatPrice(pricing.subtotal)}</span>
                    </div>
                  </div>
                )}

                {(() => {
                  const isPropertyBased = stay?.bookingScope === "Property-Based";
                  const hasSelection = isPropertyBased || resolvedSelectedRooms.length > 0;
                  const isDisabled = loading || !checkInDate || !checkOutDate || !hasSelection || pricing.isOver;
                  const buttonText = loading ? "Processing..." : (pricing.isOver ? "Capacity Exceeded" : (hasSelection ? "Reserve" : "Select Accommodation First"));

                  return (
                    <motion.button
                      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                      onClick={handleReserve}
                      disabled={isDisabled}
                      style={{
                        width: "100%",
                        background: isDisabled ? M : A,
                        color: "#FFF",
                        padding: "20px",
                        borderRadius: 16,
                        border: "none",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        marginTop: 32,
                        boxShadow: isDisabled ? "none" : `0 12px 24px ${A}33`
                      }}
                    >
                      {buttonText}
                    </motion.button>
                  );
                })()}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, color: M, fontSize: 13 }}>
                  <ShieldCheck size={16} />
                  <span>Secure & Private Booking</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StayBookingSystem;
