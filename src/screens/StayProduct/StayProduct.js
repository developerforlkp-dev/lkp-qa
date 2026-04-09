import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useHistory } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import styles from "./StayProduct.module.sass";
import Icon from "../../components/Icon";
import InlineDatePicker from "../../components/InlineDatePicker";
import Loader from "../../components/Loader";
import { getStayDetails, getStayRoomAvailability, createStayOrder } from "../../utils/api";

// Helper to format image URLs
const formatImageUrl = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;

  // If already a full URL, return as is
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  // Relative path - return as is
  if (raw.startsWith("/")) {
    return raw;
  }

  // Azure blob storage path (e.g., "leads/Events/10/CoverPhoto/..." or an already-encoded "leads%2FEvents%2F...")
  // Keep any query string intact and ensure the path is safely encoded.
  const [pathPart, queryPart] = raw.split("?");
  const normalizedPath = String(pathPart).replaceAll("%2F", "/");
  const encodedPath = encodeURI(normalizedPath);
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodedPath}${queryPart ? `?${queryPart}` : ""}`;
};

const toDisplayString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    return (
      value.displayName ??
      value.name ??
      value.facilityName ??
      value.amenityName ??
      value.title ??
      value.code ??
      value.label ??
      ""
    );
  }
  return "";
};

const formatTimeTo12hr = (timeStr) => {
  if (!timeStr) return "";
  const m = moment(timeStr, ["HH:mm", "h:mm A", "HH:mm:ss"], true);
  return m.isValid() ? m.format("h:mm A") : timeStr;
};

// Gallery Component
const Gallery = ({ images }) => {
  if (!images || images.length === 0) {
    return (
      <div className={styles.galleryEmpty}>
        <Icon name="image" size="48" />
        <span>No images available</span>
      </div>
    );
  }

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        <img src={formatImageUrl(mainImage)} alt="Main" />
      </div>
      <div className={styles.thumbnails}>
        {thumbnails.map((img, idx) => (
          <div key={idx} className={styles.thumb}>
            <img src={formatImageUrl(img)} alt={`Thumbnail ${idx + 1}`} />
          </div>
        ))}
        {thumbnails.length < 4 &&
          Array.from({ length: 4 - thumbnails.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className={cn(styles.thumb, styles.thumbEmpty)}>
              <Icon name="image" size="24" />
            </div>
          ))
        }
      </div>
    </div>
  );
};

// Header Component
const Header = ({ stay, onShare, onSave }) => {
  const tags = [];
  {
    const propertyTypeLabel = toDisplayString(stay?.propertyType);
    if (propertyTypeLabel) tags.push(propertyTypeLabel);
  }
  {
    const categoryLabel = toDisplayString(stay?.category);
    if (categoryLabel) tags.push(categoryLabel);
  }

  // Add rating tag if available
  const rating = stay?.rating || stay?.averageRating;
  if (rating && rating >= 4.5) tags.push(`${rating} Star`);

  return (
    <div className={styles.header}>
      <div className={styles.tags}>
        {tags.map((tag, idx) => (
          <span key={idx} className={styles.tag}>{tag}</span>
        ))}
      </div>
      <h1 className={styles.title}>{stay?.propertyName || stay?.title || "Stay"}</h1>
      <div className={styles.locationRow}>
        <span className={styles.location}>
          <Icon name="marker" size="16" />
          {stay?.fullAddress || stay?.cityArea || stay?.location || stay?.address || stay?.city || "Location not available"}
        </span>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={onShare}>
            <Icon name="share" size="16" />
            Share
          </button>
          <button className={styles.actionBtn} onClick={onSave}>
            <Icon name="heart" size="16" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Tabs Component
const Tabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "amenities", label: "Amenities" },
    { id: "policies", label: "Policies" },
  ];

  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(styles.tab, { [styles.tabActive]: activeTab === tab.id })}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// Booking Sidebar Component
const BookingSidebar = ({
  stay,
  checkInDate,
  setCheckInDate,
  checkOutDate,
  setCheckOutDate,
  guests,
  setGuests,
  onCheckAvailability,
  availabilityLoading,
  availabilityChecked,
  availableRooms,
  filteredRoomsByGuests,
  onSelectRoom,
  selectedRoom,
  discountPercentage,
  onBooking,
  numberOfNights,
  roomsNeeded,
  roomCapacityMessage
}) => {
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showRoomTypeDropdown, setShowRoomTypeDropdown] = useState(false);
  const [showStayDatePicker, setShowStayDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState("checkin");

  const isPropertyBased = stay?.bookingScope === "Property-Based" || stay?.bookingScope === "Property Based";
  const isRoomBased = !isPropertyBased && (
    stay?.rooms?.length > 0 ||
    stay?.roomTypes?.length > 0 ||
    availableRooms?.length > 0
  );

  // ─── Price resolution ────────────────────────────────────────────────────
  // For property-based: use fullPropertyB2cPrice.
  // For room-based: use the selected room's mealPlanPricing b2cPrice (MAP key
  //   falls back to other meal plans, then b2cPrice field, then stay b2cPrice).
  // Shown at the top as a "starting from" price before selection.
  const getMealPlanPriceForRoom = (room) => {
    if (!room) return 0;
    const mp = room.mealPlanPricing;
    if (mp) {
      // Try each plan in priority order
      for (const code of ["MAP", "CP", "BB", "AP", "EP"]) {
        const plan = mp[code];
        if (plan) {
          const p = parseFloat(plan.b2cPrice || plan.b2bPrice || plan.price || 0);
          if (p > 0) return p;
        }
      }
    }
    return parseFloat(room.b2cPrice || room.mapPrice || room.cpPrice || room.bbPrice || room.apPrice || room.epPrice || room.price || 0);
  };

  // startingFromPricePerNight — shown at top even before room selection
  // Uses availableRooms prop to reliably detect room-based pricing
  // (stay.rooms may be empty on initial render before API re-populates rooms)
  const startingFromPricePerNight = useMemo(() => {
    if (isPropertyBased) {
      return parseFloat(
        stay?.fullPropertyB2cPrice ||
        stay?.b2cPrice ||
        stay?.startingPrice ||
        stay?.pricePerNight ||
        stay?.price ||
        0
      );
    }
    if (isRoomBased) {
      if (selectedRoom) return getMealPlanPriceForRoom(selectedRoom);
      // Use availableRooms (from API) for computing starting price
      const roomList = availableRooms?.length > 0 ? availableRooms : (stay?.rooms || stay?.roomTypes || []);
      if (roomList.length === 0) return 0;
      const prices = roomList.map((r) => getMealPlanPriceForRoom(r)).filter((p) => p > 0);
      return prices.length > 0 ? Math.min(...prices) : 0;
    }
    return 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stay, isPropertyBased, isRoomBased, selectedRoom, availableRooms]);

// basePrice is what we use for the active price line and total calculation
const basePrice = isRoomBased
  ? getMealPlanPriceForRoom(selectedRoom) || startingFromPricePerNight
  : parseFloat(
    (isPropertyBased ? stay?.fullPropertyB2cPrice : null) ||
    stay?.b2cPrice ||
    stay?.fullPropertyB2cPrice ||
    stay?.startingPrice ||
    stay?.pricePerNight ||
    stay?.price ||
    0
  );

const discountedBasePrice = discountPercentage > 0
  ? basePrice * (1 - discountPercentage / 100)
  : basePrice;

const extraAdults = Math.max(0, (guests?.adults || 0) - (stay?.maxAdults || 0));
const extraChildren = Math.max(0, (guests?.children || 0) - (stay?.maxChildren || 0));

const extraAdultPrice = parseFloat(stay?.fullPropertyExtraAdultPrice || stay?.extraAdultPrice || 0);
const extraChildPrice = parseFloat(stay?.fullPropertyExtraChildPrice || stay?.extraChildPrice || 0);

const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);

const price = discountedBasePrice + totalExtraPrice;

// ─── Show total only when enough info is selected ────────────────────────
const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
// For room-based: need a selected room AND guest count > 0
// For property-based: always show after dates are selected
const showTotal = isRoomBased
  ? totalGuests > 0 && !!selectedRoom
  : totalGuests > 0;

const totalPerStay = price * (roomsNeeded || 1) * numberOfNights;

// Always display stay prices in INR (₹) for this booking flow
const formatPrice = (amount) => {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const guestText = () => {
  const total = (guests?.adults || 0) + (guests?.children || 0);
  if (total === 0) return "Add guests";
  if (total === 1) return "1 guest";
  return `${total} guests`;
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "Add date";
  const m = moment(dateStr, "YYYY-MM-DD", true);
  if (!m.isValid()) return "Add date";
  return m.format("MMM DD, YYYY");
};

const openDatePicker = (field) => {
  setActiveDateField(field);
  setShowStayDatePicker(true);
};

const handleStayDateSelect = (startDateText) => {
  if (!startDateText) return;

  const parsed = moment(startDateText, ["MMM DD, YYYY", "YYYY-MM-DD", "MM/DD/YYYY"], true);
  if (!parsed.isValid()) return;

  const nextValue = parsed.format("YYYY-MM-DD");

  if (activeDateField === "checkout") {
    setCheckOutDate(nextValue);
    setShowStayDatePicker(false);
    return;
  }

  setCheckInDate(nextValue);
  if (checkOutDate && moment(nextValue).isAfter(moment(checkOutDate), "day")) {
    setCheckOutDate("");
  }
  setShowStayDatePicker(false);
};

return (
  <div className={styles.sidebar}>
    <div className={styles.priceCard}>
      {/* Base price per night - always visible, even before selecting dates/guests */}
      {startingFromPricePerNight > 0 && (
        <div className={styles.startingFromRow}>
          <span className={styles.startingFromLabel}>{isRoomBased && !selectedRoom ? "From" : ""}</span>
          <span className={styles.startingFromPrice}>{formatPrice(startingFromPricePerNight)}</span>
          <span className={styles.startingFromSuffix}>/ night</span>
        </div>
      )}
      <div className={styles.priceRow}>
        <div className={styles.priceGroup}>
          {discountPercentage > 0 && showTotal && (
              <div className={styles.oldPrice}>
                <span className={styles.strikedPart}>{formatPrice(basePrice)}</span>
                {totalExtraPrice > 0 && (
                  <span className={styles.plusPart}> + {formatPrice(totalExtraPrice)}</span>
                )}
              </div>
          )}
          {showTotal && (
            <div className={styles.currentPriceRow}>
              <span className={styles.price}>{formatPrice(price)}</span>
              <span className={styles.perNight}>/ night</span>
              {discountPercentage > 0 && (
                <span className={styles.discountBadge}>{discountPercentage}% OFF</span>
              )}
            </div>
          )}
        </div>
        {stay?.rating > 0 && (
          <div className={styles.ratingBadge}>
            <Icon name="star" size="14" />
            <span>{stay.rating}</span>
          </div>
        )}
      </div>

      <div className={styles.datesSection}>
        <div
          className={styles.dateCard}
          role="button"
          tabIndex={0}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => openDatePicker("checkin")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDatePicker("checkin");
            }
          }}
        >
          <div className={styles.dateCardTop}>CHECK-IN</div>
          <div className={styles.dateCardBottom}>
            <div className={styles.dateValue}>{formatDateLabel(checkInDate)}</div>
            <div className={styles.dateIcon}>
              <Icon name="calendar" size="16" />
            </div>
          </div>
        </div>

        <div
          className={styles.dateCard}
          role="button"
          tabIndex={0}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => openDatePicker("checkout")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openDatePicker("checkout");
            }
          }}
        >
          <div className={styles.dateCardTop}>CHECK-OUT</div>
          <div className={styles.dateCardBottom}>
            <div className={styles.dateValue}>{formatDateLabel(checkOutDate)}</div>
            <div className={styles.dateIcon}>
              <Icon name="calendar" size="16" />
            </div>
          </div>
        </div>
      </div>
      {showStayDatePicker && (
        <div
          className={styles.stayDatePickerWrap}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <InlineDatePicker
            visible={showStayDatePicker}
            onClose={() => setShowStayDatePicker(false)}
            onDateSelect={handleStayDateSelect}
            selectedDate={activeDateField === "checkout" ? checkOutDate : checkInDate}
            timeSlots={[]}
            availabilityData={[]}
            className={styles.stayDatePicker}
          />
        </div>
      )}

      <div className={styles.guestField}>
        <div
          className={cn(styles.guestSelector, showGuestPicker && styles.guestSelectorOpen)}
          onClick={() => setShowGuestPicker(!showGuestPicker)}
          role="button"
          tabIndex={0}
          aria-expanded={showGuestPicker}
          aria-haspopup="listbox"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowGuestPicker(!showGuestPicker);
            }
          }}
        >
          <div className={styles.guestLabel}>GUESTS</div>
          <div className={styles.guestValueRow}>
            <div className={styles.guestValue}>{guestText()}</div>
            <div className={styles.guestIconGroup}>
              <Icon name="user" size="16" />
              <span className={cn(styles.guestChevron, showGuestPicker && styles.guestChevronOpen)}>
                <Icon name="arrow-down" size="14" />
              </span>
            </div>
          </div>
        </div>
        {showGuestPicker && (
          <div className={styles.guestPicker}>
            <div className={styles.guestType}>
              <div className={styles.guestTypeInfo}>
                <span className={styles.guestTypeName}>Adults</span>
                <div className={styles.guestTypeDetails}>
                  {stay?.maxAdults && <span className={styles.includedLabel}>Included: {stay.maxAdults}</span>}
                  {(stay?.maxExtraAdultsAllowed > 0 || parseFloat(stay?.extraAdultPrice) > 0) && (
                    <span className={styles.extraLabel}>
                      + {stay?.maxExtraAdultsAllowed || 0} Extra (₹{stay?.extraAdultPrice}/night)
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.counter}>
                <button
                  onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, (g.adults || 0) - 1) }))}
                  disabled={(guests?.adults || 0) <= 1}
                >-</button>
                <span>{guests?.adults || 0}</span>
                <button
                  onClick={() => setGuests(g => ({ ...g, adults: Math.min((stay?.maxAdults || 0) + (stay?.maxExtraAdultsAllowed || 0), (g.adults || 0) + 1) }))}
                  disabled={(guests?.adults || 0) >= ((stay?.maxAdults || 0) + (stay?.maxExtraAdultsAllowed || 0))}
                >+</button>
              </div>
            </div>
            <div className={styles.guestType}>
              <div className={styles.guestTypeInfo}>
                <span className={styles.guestTypeName}>Children</span>
                <div className={styles.guestTypeDetails}>
                  {stay?.maxChildren !== undefined && <span className={styles.includedLabel}>Included: {stay.maxChildren}</span>}
                  {(stay?.maxExtraChildrenAllowed > 0 || parseFloat(stay?.extraChildPrice) > 0) && (
                    <span className={styles.extraLabel}>
                      + {stay?.maxExtraChildrenAllowed || 0} Extra (₹{stay?.extraChildPrice}/night)
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.counter}>
                <button
                  onClick={() => setGuests(g => ({ ...g, children: Math.max(0, (g.children || 0) - 1) }))}
                  disabled={(guests?.children || 0) <= 0}
                >-</button>
                <span>{guests?.children || 0}</span>
                <button
                  onClick={() => setGuests(g => ({ ...g, children: Math.min((stay?.maxChildren || 0) + (stay?.maxExtraChildrenAllowed || 0), (g.children || 0) + 1) }))}
                  disabled={(guests?.children || 0) >= ((stay?.maxChildren || 0) + (stay?.maxExtraChildrenAllowed || 0))}
                >+</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Room type selector - always visible for room-based stays; options from availability API (auto-called when dates set) */}
      {isRoomBased && (
        <div className={styles.roomTypeField}>
          <div
            className={cn(
              styles.roomTypeSelector,
              showRoomTypeDropdown && styles.roomTypeSelectorOpen,
              (availabilityLoading || !(filteredRoomsByGuests?.length > 0)) && styles.roomTypeSelectorDisabled
            )}
            onClick={() => {
              if (availabilityLoading || !(filteredRoomsByGuests?.length > 0)) return;
              setShowRoomTypeDropdown(!showRoomTypeDropdown);
            }}
            role="button"
            tabIndex={filteredRoomsByGuests?.length > 0 ? 0 : -1}
            aria-expanded={showRoomTypeDropdown}
            aria-haspopup="listbox"
            aria-disabled={availabilityLoading || !(filteredRoomsByGuests?.length > 0)}
            onKeyDown={(e) => {
              if (availabilityLoading || !(filteredRoomsByGuests?.length > 0)) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowRoomTypeDropdown(!showRoomTypeDropdown);
              }
            }}
          >
            <div className={styles.guestLabel}>ROOM TYPE</div>
            <div className={styles.guestValueRow}>
              <div className={styles.guestValue}>
                {availabilityLoading
                  ? "Checking availability..."
                  : selectedRoom
                    ? (selectedRoom.roomName || selectedRoom.name || selectedRoom.roomTypeName || `Room ${selectedRoom.roomId || selectedRoom.id}`)
                    : (filteredRoomsByGuests?.length > 0
                      ? "Select room"
                      : (checkInDate && checkOutDate ? "Loading rooms..." : "Select dates first"))}
              </div>
              <span className={cn(styles.guestChevron, showRoomTypeDropdown && styles.guestChevronOpen)}>
                <Icon name="arrow-down" size="14" />
              </span>
            </div>
          </div>
          {showRoomTypeDropdown && Array.isArray(filteredRoomsByGuests) && filteredRoomsByGuests.length > 0 && (
            <div className={styles.roomTypeDropdown} role="listbox">
              {filteredRoomsByGuests.map((room) => {
                const roomLabel = room.roomName || room.name || room.roomTypeName || `Room ${room.roomId || room.id}`;
                const maxG = room.maxGuests != null
                  ? Number(room.maxGuests)
                  : (Number(room.maxAdults) || 0) + (Number(room.maxChildren) || 0);
                const roomDisplayPrice = getMealPlanPriceForRoom(room);
                const isSelected = selectedRoom && (selectedRoom.roomId === room.roomId || selectedRoom.id === room.id);
                return (
                  <div
                    key={room.roomId || room.id}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(styles.roomTypeOption, isSelected && styles.roomTypeOptionSelected)}
                    onClick={() => {
                      onSelectRoom(room);
                      setShowRoomTypeDropdown(false);
                    }}
                  >
                    <span className={styles.roomTypeOptionName}>
                      {roomLabel}{maxG > 0 ? ` (Max ${maxG})` : ""}
                    </span>
                    <span className={styles.roomTypeOptionPrice}>
                      {roomDisplayPrice > 0 ? `${formatPrice(roomDisplayPrice)}/night` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Room capacity message – add another room or no room available */}
      {roomCapacityMessage && (
        <div className={cn(
          styles.roomCapacityMsg,
          roomCapacityMessage.type === "warning" ? styles.roomCapacityWarn : styles.roomCapacityInfo
        )}>
          <Icon name={roomCapacityMessage.type === "warning" ? "alert-circle" : "info"} size="14" />
          <span>{roomCapacityMessage.text}</span>
        </div>
      )}

      {/* Total breakdown - shown only when selection is complete */}
      {showTotal && numberOfNights > 0 && (
        <div className={styles.totalBreakdown}>
          <div className={styles.totalRow}>
            <span>{formatPrice(price)} × {numberOfNights} night{numberOfNights !== 1 ? "s" : ""}{roomsNeeded > 1 ? ` × ${roomsNeeded} rooms` : ""}</span>
            <span>{formatPrice(totalPerStay)}</span>
          </div>
          <div className={cn(styles.totalRow, styles.totalRowFinal)}>
            <span>Total</span>
            <span>{formatPrice(totalPerStay)}</span>
          </div>
        </div>
      )}

      {/* CTA button: 'Check Availability' only when dates set but rooms not yet fetched.
            Once rooms are available (availableRooms.length > 0), always 'Book Now'.
            Guest count changes do NOT affect this button. */}
      <button
        className={styles.checkBtn}
        onClick={() => {
          if (isRoomBased && !availabilityChecked && availableRooms?.length === 0) {
            onCheckAvailability();
          } else {
            onBooking({ pricePerNight: price, totalNights: numberOfNights });
          }
        }}
        disabled={
          !checkInDate || !checkOutDate ||
          availabilityLoading ||
          (isRoomBased && availableRooms?.length > 0 && !selectedRoom)
        }
      >
        {availabilityLoading
          ? "Checking..."
          : (isRoomBased && !availabilityChecked && availableRooms?.length === 0
            ? "Check Availability"
            : "Book Now")}
      </button>

      <p className={styles.noCharge}>You won&apos;t be charged yet</p>
    </div>

    <div className={styles.contactCard}>
      <h4>Contact Property</h4>
      <div className={styles.hostInfo}>
        <div className={styles.hostAvatar}>
          {stay?.host?.profilePhotoUrl ? (
            <img src={formatImageUrl(stay.host.profilePhotoUrl)} alt="Host" />
          ) : (
            <span className={styles.avatarInitial}>
              {(stay?.host?.name || stay?.host?.firstName || "Sarah")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className={styles.hostDetails}>
          <span className={styles.hostLabel}>Managed by</span>
          <span className={styles.hostName}>
            {stay?.host?.displayName || stay?.host?.name || stay?.host?.firstName || "Sarah Jenkins"}
          </span>
        </div>
      </div>

      <div className={styles.contactDivider}></div>

      <div className={styles.contactActions}>
        <a href={`tel:${stay?.host?.phone || "+9601234567"}`} className={styles.contactBox}>
          <Icon name="phone" size="16" />
          <span>{stay?.host?.phone || "+960 123 4567"}</span>
        </a>
        <a href={`mailto:${stay?.host?.email || "reservations@azurehorizon.com"}`} className={styles.contactBox}>
          <Icon name="email" size="16" />
          <span>{stay?.host?.email || "reservations@azurehorizon.com"}</span>
        </a>
        <a
          href={stay?.host?.website || stay?.propertyWebsite || "https://azurehorizon.com"}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactBox}
        >
          <Icon name="globe" size="16" />
          <span>{stay?.host?.website || stay?.propertyWebsite ? "Visit Website" : "Visit Website"}</span>
        </a>
      </div>
    </div>
  </div>
);
};

// Property Details Table
const PropertyDetails = ({ stay }) => {
  const details = [
    { label: "Type", value: toDisplayString(stay?.propertyType) || "Stay" },
    { label: "Check-in", value: formatTimeTo12hr(stay?.checkInTime) || "2:00 PM" },
    { label: "Check-out", value: formatTimeTo12hr(stay?.checkOutTime) || "11:00 AM" },
    { label: "Rooms", value: stay?.totalRooms || stay?.roomTypes?.length || "-" },
  ];

  return (
    <div className={styles.detailsTable}>
      {details.map((detail, idx) => (
        <div key={idx} className={styles.detailItem}>
          <span className={styles.detailLabel}>{detail.label}</span>
          <span className={styles.detailValue}>{detail.value}</span>
        </div>
      ))}
    </div>
  );
};

// Room Card Component
const RoomCard = ({ room, onSelect, discountPercentage, guests, stay }) => {
  const images = room?.roomImages || room?.images || [];
  const image = room?.imageUrl || images[0] || room?.coverImageUrl;
  const roomTags = room?.roomAmenities || room?.amenities || [];
  const displayTags = roomTags.slice(0, 3);
  const remainingTags = roomTags.length - displayTags.length;

  const maxGuestsDisplay = room.maxGuests != null
    ? Number(room.maxGuests)
    : (Number(room.maxAdults) || 0) + (Number(room.maxChildren) || 0) || 2;

  const basePrice = parseFloat(room.b2cPrice || room.price || 0);
  const discountedBasePrice = discountPercentage > 0
    ? basePrice * (1 - discountPercentage / 100)
    : basePrice;

  // Calculate extra guest fees for this specific room
  // Use room-specific max if available, otherwise fallback to stay-level max
  const maxAdults = room.maxAdults || stay?.maxAdults || 0;
  const maxChildren = room.maxChildren || stay?.maxChildren || 0;

  const extraAdults = Math.max(0, (guests?.adults || 0) - maxAdults);
  const extraChildren = Math.max(0, (guests?.children || 0) - maxChildren);

  const extraAdultPrice = parseFloat(room.extraAdultPrice || stay?.extraAdultPrice || 0);
  const extraChildPrice = parseFloat(room.extraChildPrice || stay?.extraChildPrice || 0);

  const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);

  const price = discountedBasePrice + totalExtraPrice;

  return (
    <div className={styles.roomCard}>
      <div className={styles.roomImage}>
        {image ? (
          <img src={formatImageUrl(image)} alt={room.roomName || room.name} />
        ) : (
          <div className={styles.roomImagePlaceholder}>
            <Icon name="home" size="32" />
          </div>
        )}
        {room?.roomCategory && (
          <div className={styles.roomCategoryTag}>
            {toDisplayString(room.roomCategory)}
          </div>
        )}
      </div>
      <div className={styles.roomInfo}>
        <h3 className={styles.roomName}>{room.roomName || room.name || "Room"}</h3>

        <div className={styles.roomMetaRow}>
          <div className={styles.metaItem}>
            <Icon name="user" size="14" />
            <span>Max {maxGuestsDisplay} Guests</span>
          </div>
          <span className={styles.metaDivider}>•</span>
          <div className={styles.metaItem}>
            <Icon name="grid" size="14" />
            <span>{room.units || 10} Units</span>
          </div>
        </div>

        <p className={styles.roomDescription}>
          {room.roomDescription || room.description || "Indulge in luxury with this well-appointed room featuring modern amenities and breathtaking views."}
        </p>

        <div className={styles.roomTagsRow}>
          {displayTags.map((tag, idx) => (
            <span key={idx} className={styles.roomTagBadge}>
              {toDisplayString(tag)}
            </span>
          ))}
          {remainingTags > 0 && <span className={styles.moreTags}>+ {remainingTags} more</span>}
        </div>

        <div className={styles.mealPlansRow}>
          {Number(room.epPrice) > 0 && (
            <div className={styles.mealPlanItem}>
              <span className={styles.mealPlanName}>EP (Room Only)</span>
              <span className={styles.mealPlanPrice}>₹{Number(room.epPrice).toLocaleString("en-IN")}</span>
            </div>
          )}
          {Number(room.cpPrice) > 0 && (
            <div className={styles.mealPlanItem}>
              <span className={styles.mealPlanName}>CP (Breakfast)</span>
              <span className={styles.mealPlanPrice}>₹{Number(room.cpPrice).toLocaleString("en-IN")}</span>
            </div>
          )}
          {Number(room.mapPrice) > 0 && (
            <div className={styles.mealPlanItem}>
              <span className={styles.mealPlanName}>MAP (Half Board)</span>
              <span className={styles.mealPlanPrice}>₹{Number(room.mapPrice).toLocaleString("en-IN")}</span>
            </div>
          )}
          {Number(room.apPrice) > 0 && (
            <div className={styles.mealPlanItem}>
              <span className={styles.mealPlanName}>AP (Full Board)</span>
              <span className={styles.mealPlanPrice}>₹{Number(room.apPrice).toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>

        <div className={styles.roomPriceRow}>
          <div className={styles.priceColumn}>
            <div className={styles.roomPrice}>
              {discountPercentage > 0 && (
                <div className={styles.oldPrice}>
                  <span className={styles.strikedPart}>₹{Number(basePrice).toLocaleString("en-IN")}</span>
                  {totalExtraPrice > 0 && (
                    <span className={styles.plusPart}> + ₹{Number(totalExtraPrice).toLocaleString("en-IN")}</span>
                  )}
                </div>
              )}
              <div className={styles.currentPriceRow}>
                <span className={styles.priceValue}>₹{Number(price).toLocaleString("en-IN")}</span>
                <span className={styles.perNight}>/night</span>
                {discountPercentage > 0 && (
                  <span className={styles.discountBadge}>{discountPercentage}% OFF</span>
                )}
              </div>
            </div>
          </div>
          <button className={styles.selectRoomBtn} onClick={() => onSelect(room)}>
            Select Room
            <Icon name="arrow-right" size="14" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Available Rooms Section
const AvailableRooms = ({ rooms, availabilityChecked, onSelectRoom, selectedRoom, discountPercentage, guests, stay }) => {
  const totalGuests = (guests?.adults || 0) + (guests?.children || 0);

  if (!rooms || rooms.length === 0) {
    return (
      <div className={styles.roomsSection}>
        <h2>Available Rooms</h2>
        <p className={styles.noRooms}>
          {availabilityChecked
            ? totalGuests > 0
              ? "No rooms available for the selected dates and guest count. Try different dates or fewer guests."
              : "No rooms available for the selected dates. Try different dates or guests."
            : "Select dates and check availability to see rooms"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.roomsSection}>
      <div className={styles.roomsHeader}>
        <h2>Available Rooms</h2>
        <span className={styles.roomsCount}>
          {rooms.length} room type{rooms.length !== 1 ? "s" : ""} found
          {totalGuests > 0 ? ` for ${totalGuests} guest${totalGuests !== 1 ? "s" : ""}` : ""}
        </span>
      </div>
      <p className={styles.roomsSubtext}>
        {totalGuests > 0
          ? "Rooms that accommodate your group size. Prices update based on guest count."
          : "Select your perfect accommodation"}
      </p>
      <div className={styles.roomsList}>
        {rooms.map((room) => (
          <RoomCard
            key={room.roomId || room.id}
            room={room}
            onSelect={onSelectRoom}
            discountPercentage={discountPercentage}
            guests={guests}
            stay={stay}
          />
        ))}
      </div>
    </div>
  );
};

// Map Section
const MapSection = ({ location, address }) => {
  return (
    <div className={styles.mapSection}>
      <h3>Where you&apos;ll be</h3>
      <div className={styles.mapContainer}>
        <div className={styles.mapPlaceholder}>
          <Icon name="marker" size="48" />
          <span>Map view</span>
          <p>{address || location}</p>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Content
const OverviewTab = ({ stay }) => {
  return (
    <div className={styles.overviewTab}>
      <section className={styles.aboutSection}>
        <h2>About this property</h2>
        <p>{stay?.description || stay?.shortDescription || "No description available"}</p>
      </section>

      <PropertyDetails stay={stay} />
    </div>
  );
};

// Amenities Tab Content
const AmenitiesTab = ({ stay }) => {
  const propertyAmenities = stay?.amenities || [];
  const facilitiesServices = stay?.facilities || [];

  // If one list is empty and the other isn't, handle gracefully 
  // (maybe it's all in one list).
  const hasBoth = propertyAmenities.length > 0 && facilitiesServices.length > 0;

  let leftList = propertyAmenities;
  let rightList = facilitiesServices;

  if (!hasBoth && propertyAmenities.length > 4) {
    // Split the single list if it's long to maintain the UI layout
    const mid = Math.ceil(propertyAmenities.length / 2);
    leftList = propertyAmenities.slice(0, mid);
    rightList = propertyAmenities.slice(mid);
  }

  return (
    <div className={styles.amenitiesTab}>
      <div className={styles.amenitiesRow}>
        <div className={styles.amenitiesCol}>
          <div className={styles.amenityHeader}>
            <Icon name="circle-and-square" size="18" />
            <h3>Property Amenities</h3>
          </div>
          <div className={styles.amenityList}>
            {leftList.length > 0 ? leftList.map((amenity, idx) => (
              <div key={idx} className={styles.amenityItemCell}>
                <div className={styles.checkCircleGreen}>
                  <Icon name="tick" size="14" />
                </div>
                <span>{toDisplayString(amenity)}</span>
              </div>
            )) : <p className={styles.emptyText}>Not available</p>}
          </div>
        </div>
        <div className={styles.amenitiesCol}>
          <div className={styles.amenityHeader}>
            <Icon name="receipt" size="18" />
            <h3>Facilities & Services</h3>
          </div>
          <div className={styles.amenityList}>
            {rightList.length > 0 ? rightList.map((amenity, idx) => (
              <div key={idx} className={styles.amenityItemCell}>
                <div className={styles.checkCircleBlue}>
                  <Icon name="tick" size="14" />
                </div>
                <span>{toDisplayString(amenity)}</span>
              </div>
            )) : <p className={styles.emptyText}>Not available</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Policies Tab Content
const PoliciesTab = ({ stay }) => {
  return (
    <div className={styles.policiesTab}>
      <div className={styles.policiesGrid}>
        <div className={styles.policySection}>
          <div className={styles.policyHeader}>
            <Icon name="clock" size="20" />
            <h4>Check-in / Check-out</h4>
          </div>
          <div className={styles.policyCardInner}>
            <div className={styles.policyTableRow}>
              <span className={styles.policyLabel}>Check-in</span>
              <span className={styles.policyValueBold}>{formatTimeTo12hr(stay?.checkInTime) || "2:00 PM"}</span>
            </div>
            <div className={styles.policyTableRow}>
              <span className={styles.policyLabel}>Check-out</span>
              <span className={styles.policyValueBold}>{formatTimeTo12hr(stay?.checkOutTime) || "11:00 AM"}</span>
            </div>
            <div className={styles.policyTableRow}>
              <span className={styles.policyLabel}>Method</span>
              <span className={styles.policyValueBold}>Reception</span>
            </div>
          </div>
        </div>

        <div className={styles.policySection}>
          <div className={styles.policyHeader}>
            <Icon name="shield" size="20" />
            <h4>Cancellation Policy</h4>
          </div>
          <div className={styles.policyCardInner}>
            <p className={styles.policyText}>
              {stay?.cancellationPolicy || "Free cancellation up to 7 days before check-in. 50% charge for cancellations within 7 days. No-show charged 100%."}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.policySectionFull}>
        <div className={styles.policyHeader}>
          <Icon name="info" size="20" />
          <h4>House Rules</h4>
        </div>
        <div className={styles.policyCardWide}>
          <p className={styles.policyText}>
            {stay?.houseRules || "No smoking inside the villas. Quiet hours from 10 PM to 7 AM. Drone photography requires prior permission."}
          </p>
        </div>
      </div>

      <div className={styles.policySectionFull}>
        <div className={styles.policyHeader}>
          <Icon name="marker" size="20" />
          <h4>Arrival Instructions</h4>
        </div>
        <div className={styles.policyCardWide}>
          <p className={styles.policyText}>
            {stay?.arrivalInstructions || "Please present your passport and booking confirmation at the front desk upon arrival. A welcome drink awaits you."}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main StayProduct Component
const StayProduct = () => {
  const location = useLocation();
  const history = useHistory();
  const params = new URLSearchParams(location.search);
  const stayId = params.get("id");

  const [stay, setStay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Booking state
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const numberOfNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = moment(checkInDate);
    const end = moment(checkOutDate);
    const nights = end.diff(start, "days");
    return nights > 0 ? nights : 0;
  }, [checkInDate, checkOutDate]);

  const isPropertyBased = stay?.bookingScope === "Property-Based" || stay?.bookingScope === "Property Based";
  const isRoomBased = !isPropertyBased && (stay?.rooms?.length > 0 || stay?.roomTypes?.length > 0);

  // Don't filter rooms by capacity — show ALL rooms.
  // The roomCapacityMessage / extra-room logic will guide the user when
  // guests exceed the selected room's capacity.
  const filteredRoomsByGuests = availableRooms;

  // Extra-room logic: if selected room's max capacity < totalGuests, suggest more rooms
  const { roomsNeeded, roomCapacityMessage } = useMemo(() => {
    if (!selectedRoom || !isRoomBased) return { roomsNeeded: 1, roomCapacityMessage: null };
    const totalGuests = (guests?.adults || 0) + (guests?.children || 0);

    const roomCapacity = selectedRoom.maxGuests != null
      ? Number(selectedRoom.maxGuests)
      : (Number(selectedRoom.maxAdults) || 0) + (Number(selectedRoom.maxChildren) || 0) || 2;
    if (totalGuests <= roomCapacity) return { roomsNeeded: 1, roomCapacityMessage: null };

    const needed = Math.ceil(totalGuests / roomCapacity);
    // Check if that many rooms are available (units field)
    const availableUnits = Number(selectedRoom.units || selectedRoom.availableRooms || selectedRoom.availableUnits || 99);
    if (availableUnits >= needed) {
      return {
        roomsNeeded: needed,
        roomCapacityMessage: {
          type: "info",
          text: `Your group of ${totalGuests} needs ${needed} room${needed > 1 ? "s" : ""} (max ${roomCapacity} guests/room). ${needed} rooms will be booked.`
        }
      };
    } else {
      return {
        roomsNeeded: availableUnits,
        roomCapacityMessage: {
          type: "warning",
          text: `Only ${availableUnits} room${availableUnits !== 1 ? "s" : ""} available for this type. Please reduce guest count or choose a different room.`
        }
      };
    }
  }, [selectedRoom, guests, isRoomBased]);

  // Clear selected room if it no longer fits the current guest count
  useEffect(() => {
    if (!selectedRoom) return;
    const stillInList = filteredRoomsByGuests.some(
      (r) => (r.roomId || r.id) === (selectedRoom.roomId || selectedRoom.id)
    );
    if (!stillInList) setSelectedRoom(null);
  }, [filteredRoomsByGuests, selectedRoom]);

  const discountPercentage = useMemo(() => {
    if (!stay?.discountTiers || numberOfNights <= 0) return 0;

    const tiers = stay.discountTiers;
    let applicableTier = null;
    for (const tier of tiers) {
      if (numberOfNights >= tier.minimumDays) {
        if (
          !applicableTier ||
          Number(tier.minimumDays) > Number(applicableTier.minimumDays)
        ) {
          applicableTier = tier;
        }
      }
    }

    return applicableTier ? parseFloat(applicableTier.discountPercentage) : 0;
  }, [stay?.discountTiers, numberOfNights]);

  useEffect(() => {
    const loadStay = async () => {
      if (!stayId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getStayDetails(stayId);
        setStay(data);
        // Initialize rooms from stay data if available
        if (data?.rooms || data?.roomTypes) {
          setAvailableRooms(data.rooms || data.roomTypes);
        }
      } catch (err) {
        console.error("Failed to load stay:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStay();
  }, [stayId]);

  // When dates change: clear stale rooms, room selection, and availability flag
  useEffect(() => {
    setAvailableRooms([]);
    setSelectedRoom(null);
    setAvailabilityChecked(false);
  }, [checkInDate, checkOutDate]);

  // Auto-call room availability API when user has selected check-in + check-out
  useEffect(() => {
    if (!stayId || !checkInDate || !checkOutDate || !stay) return;
    const isRoomBasedStay =
      (stay?.bookingScope !== "Property-Based" && stay?.bookingScope !== "Property Based") &&
      (stay?.rooms?.length > 0 || stay?.roomTypes?.length > 0);
    if (!isRoomBasedStay) return;

    let cancelled = false;
    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const result = await getStayRoomAvailability(stayId, checkInDate, checkOutDate);
        if (cancelled) return;
        const fetchedRooms = result?.rooms || [];
        setAvailableRooms(fetchedRooms);
        setAvailabilityChecked(true);
      } catch (err) {
        if (!cancelled) {
          console.error("Availability check failed:", err);
          setAvailabilityChecked(false);
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };
    fetchAvailability();
    return () => { cancelled = true; };
  }, [stayId, checkInDate, checkOutDate, stay]);

  const handleCheckAvailability = async () => {
    if (!stayId || !checkInDate || !checkOutDate) return;

    setAvailabilityLoading(true);
    try {
      const result = await getStayRoomAvailability(stayId, checkInDate, checkOutDate);
      console.log("Stay availability result:", result);

      if (result?.rooms) {
        setAvailableRooms(result.rooms);
      }
      setAvailabilityChecked(true);
    } catch (err) {
      console.error("Availability check failed:", err);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleBooking = async (bookingInfo) => {
    if (!stayId || !checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates first.");
      return;
    }

    // Room-based stays require a selected room
    if (isRoomBased && !selectedRoom) {
      alert("Please select a room before booking.");
      return;
    }

    let bookingPayload;

    if (isRoomBased && selectedRoom) {
      // Room-based stay: include rooms array with roomId, roomsBooked, mealPlanCode
      const getMealPlanCode = (room) => {
        if (Number(room.bbPrice) > 0) return "BB";
        if (Number(room.cpPrice) > 0) return "CP";
        if (Number(room.mapPrice) > 0) return "MAP";
        if (Number(room.apPrice) > 0) return "AP";
        if (Number(room.epPrice) > 0) return "EP";
        return "EP";
      };

      const mealPlanCode = selectedRoom.selectedMealPlan || getMealPlanCode(selectedRoom);

      // Calculate B2C price for the selected room based on meal plan, as the room's base b2cPrice could be null in the API
      let basePrice = 0;
      let extraAdultPrice = parseFloat(selectedRoom.extraAdultPrice || stay?.extraAdultPrice || 0);
      let extraChildPrice = parseFloat(selectedRoom.extraChildPrice || stay?.extraChildPrice || 0);

      if (selectedRoom.mealPlanPricing && selectedRoom.mealPlanPricing[mealPlanCode]) {
        const mp = selectedRoom.mealPlanPricing[mealPlanCode];
        basePrice = parseFloat(mp.b2cPrice || mp.b2bPrice || mp.price || 0);
        if (mp.extraAdultPrice) extraAdultPrice = parseFloat(mp.extraAdultPrice);
        if (mp.extraChildPrice) extraChildPrice = parseFloat(mp.extraChildPrice);
      } else {
        if (mealPlanCode === "BB" && Number(selectedRoom.bbPrice) > 0) basePrice = parseFloat(selectedRoom.bbPrice);
        else if (mealPlanCode === "CP" && Number(selectedRoom.cpPrice) > 0) basePrice = parseFloat(selectedRoom.cpPrice);
        else if (mealPlanCode === "MAP" && Number(selectedRoom.mapPrice) > 0) basePrice = parseFloat(selectedRoom.mapPrice);
        else if (mealPlanCode === "AP" && Number(selectedRoom.apPrice) > 0) basePrice = parseFloat(selectedRoom.apPrice);
        else if (mealPlanCode === "EP" && Number(selectedRoom.epPrice) > 0) basePrice = parseFloat(selectedRoom.epPrice);
        else basePrice = parseFloat(selectedRoom.b2cPrice || selectedRoom.price || selectedRoom.b2bPrice || 0);
      }

      const maxAdults = selectedRoom.maxAdults || stay?.maxAdults || 0;
      const maxChildren = selectedRoom.maxChildren || stay?.maxChildren || 0;

      const extraAdults = Math.max(0, (guests?.adults || 0) - maxAdults);
      const extraChildren = Math.max(0, (guests?.children || 0) - maxChildren);

      const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);
      const amountPerNight = basePrice + totalExtraPrice;
      const nightsCount = checkInDate && checkOutDate ? Math.max(1, moment(checkOutDate).diff(moment(checkInDate), "days")) : 1;
      const calculatedAmount = amountPerNight * nightsCount;

      bookingPayload = {
        stayId: Number(stayId),
        checkInDate,
        checkOutDate,
        numberOfGuests: (guests.adults || 1) + (guests.children || 0),
        amount: calculatedAmount * roomsNeeded, // Multiply by rooms needed for group bookings
        paymentMethod: "razorpay", // Explicitly request Razorpay
        rooms: [
          {
            roomId: selectedRoom.roomId || selectedRoom.id,
            roomsBooked: roomsNeeded,
            mealPlanCode: mealPlanCode,
          },
        ],
      };
    } else {
      // Property-based stay: no rooms array needed
      const propertyBasePrice = parseFloat(stay?.fullPropertyB2cPrice || stay?.b2cPrice || stay?.startingPrice || stay?.pricePerNight || stay?.price || 0);
      const extraAdultPrice = parseFloat(stay?.fullPropertyExtraAdultPrice || stay?.extraAdultPrice || 0);
      const extraChildPrice = parseFloat(stay?.fullPropertyExtraChildPrice || stay?.extraChildPrice || 0);

      const extraAdults = Math.max(0, (guests?.adults || 0) - (stay?.maxAdults || 0));
      const extraChildren = Math.max(0, (guests?.children || 0) - (stay?.maxChildren || 0));

      const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);
      const amountPerNight = propertyBasePrice + totalExtraPrice;
      const nightsCount = checkInDate && checkOutDate ? Math.max(1, moment(checkOutDate).diff(moment(checkInDate), "days")) : 1;
      const calculatedAmountProperty = amountPerNight * nightsCount;

      bookingPayload = {
        stayId: Number(stayId),
        checkInDate,
        checkOutDate,
        numberOfGuests: (guests.adults || 1) + (guests.children || 0),
        amount: calculatedAmountProperty,
        paymentMethod: "razorpay",
      };
    }

    console.log("📤 Stay booking payload:", bookingPayload);

    setAvailabilityLoading(true);
    try {
      const response = await createStayOrder(bookingPayload);
      console.log("✅ Stay order created:", response);

      // Save Razorpay payment data (even if order ID is missing, so Razorpay can still trigger)
      const paymentResponse = response?.payment || response?.data?.payment || response?.order?.payment || response;
      const rzpOrderId = paymentResponse?.razorpayOrderId || response?.razorpayOrderId || response?.order?.razorpayOrderId;
      const rzpKeyId = paymentResponse?.razorpayKeyId || response?.razorpayKeyId || response?.order?.razorpayKeyId || "rzp_test_RaBjdu0Ed3p1gN";

      // Always use our frontend-calculated amount (b2cPrice × nights × rooms).
      // The backend Razorpay order may include extra surcharges; we display our total
      // so it stays consistent with the receipt breakdown shown to the user.
      const amountInPaise = Math.round((bookingPayload.amount || 0) * 100);

      const currency = paymentResponse?.currency || response?.currency || response?.order?.currency || "INR";

      localStorage.setItem("pendingPayment", JSON.stringify({
        paymentMethod: "razorpay",
        razorpayOrderId: rzpOrderId,
        razorpayKeyId: rzpKeyId,
        amount: amountInPaise,
        currency: currency,
      }));

      // Save booking summary for the checkout page display
      const getMealLabel = (code) => ({
        EP: "EP (Room Only)", CP: "CP (Breakfast)", BB: "BB (Bed & Breakfast)",
        MAP: "MAP (Half Board)", AP: "AP (Full Board)"
      }[code] || code);

      const roomLabel = selectedRoom
        ? (selectedRoom.roomName || selectedRoom.name || selectedRoom.roomTypeName || `Room ${selectedRoom.roomId || selectedRoom.id}`)
        : null;

      const mealCode = isRoomBased && selectedRoom
        ? (selectedRoom.selectedMealPlan || (Number(selectedRoom.bbPrice) > 0 ? "BB" : Number(selectedRoom.cpPrice) > 0 ? "CP" : Number(selectedRoom.mapPrice) > 0 ? "MAP" : "EP"))
        : null;

      // Get cover image — formatImageUrl handles relative blob paths (e.g. "leads/...")
      const rawCoverImg =
        stay?.coverImageUrl ||
        stay?.coverPhotoUrl ||
        (Array.isArray(stay?.listingMedia) && stay.listingMedia[0]
          ? (stay.listingMedia[0].url || stay.listingMedia[0].blobName || stay.listingMedia[0].fileUrl)
          : null) ||
        (Array.isArray(stay?.media) && stay.media[0]
          ? (stay.media[0].url || stay.media[0].blobName || stay.media[0].fileUrl)
          : null) ||
        (Array.isArray(stay?.images) && stay.images[0]
          ? (stay.images[0].url || stay.images[0].blobName || stay.images[0].fileUrl || (typeof stay.images[0] === "string" ? stay.images[0] : null))
          : null) ||
        (Array.isArray(stay?.propertyImages) && stay.propertyImages[0]
          ? (stay.propertyImages[0].url || stay.propertyImages[0].blobName || stay.propertyImages[0].fileUrl || (typeof stay.propertyImages[0] === "string" ? stay.propertyImages[0] : null))
          : null) ||
        "";
      const coverImg = formatImageUrl(rawCoverImg) || "";

      // Room-specific image (prefer room photo, fall back to property cover)
      const rawRoomImg = selectedRoom
        ? (selectedRoom.photoUrl || selectedRoom.imageUrl || selectedRoom.coverPhotoUrl ||
          (Array.isArray(selectedRoom.images) && selectedRoom.images[0]
            ? (selectedRoom.images[0].url || selectedRoom.images[0].blobName || selectedRoom.images[0].fileUrl || (typeof selectedRoom.images[0] === "string" ? selectedRoom.images[0] : null))
            : null))
        : null;
      const roomImg = formatImageUrl(rawRoomImg) || coverImg;

      const stayBookingData = {
        stayId: Number(stayId),
        listingTitle: stay?.propertyName || stay?.title || stay?.name || "Stay",
        listingImage: coverImg,
        roomImage: roomImg,
        isStay: true,
        checkInDate: checkInDate ? new Date(checkInDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : null,
        roomType: roomLabel,
        roomsBooked: bookingInfo?.roomsNeeded || 1,
        mealPlan: mealCode ? getMealLabel(mealCode) : null,
        guests: guests,
        bookingSummary: {
          guestCount: (guests?.adults || 0) + (guests?.children || 0),
        },
        receipt: response?.totalAmount ? [
          { title: "Stay total", content: `${response.currency || "INR"} ${Number(response.totalAmount).toFixed(2)}` },
          { title: "Total", content: `${response.currency || "INR"} ${Number(response.totalAmount).toFixed(2)}` },
        ] : [],
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("pendingBooking", JSON.stringify(stayBookingData));



      // Navigate to checkout page where Razorpay button lives
      history.push("/checkout");
    } catch (err) {
      console.error("Booking error:", err);
      alert(err.response?.data?.message || "Something went wrong while booking. Please try again.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: stay?.propertyName || "Stay",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleSave = () => {
    alert("Saved to favorites!");
  };

  // Build gallery images
  const galleryImages = useMemo(() => {
    const images = [];
    if (stay?.coverImageUrl) images.push(stay.coverImageUrl);
    if (stay?.coverPhotoUrl) images.push(stay.coverPhotoUrl);
    if (stay?.images) images.push(...stay.images);
    if (stay?.propertyImages) images.push(...stay.propertyImages);
    [stay?.media, stay?.listingMedia].forEach(source => {
      if (Array.isArray(source)) {
        source.forEach(m => {
          const url = typeof m === 'string' ? m : (m.blobName || m.url || m.fileUrl || m.imageUrl);
          if (url) images.push(url);
        });
      }
    });
    if (stay?.coverImageBlobName) images.push(stay.coverImageBlobName);

    // Deduplicate and filter non-strings
    return [...new Set(images.filter(img => img && typeof img === 'string'))];
  }, [stay]);


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader />
      </div>
    );
  }

  if (!stay) {
    return (
      <div className={styles.errorContainer}>
        <Icon name="alert" size="48" />
        <h2>Stay not found</h2>
        <p>We couldn&apos;t load this property. Please try again.</p>
      </div>
    );
  }

  return (
    <div className={styles.outer}>
      <div className={styles.container}>
        <Header stay={stay} onShare={handleShare} onSave={handleSave} />
        <Gallery images={galleryImages} />

        <div className={styles.contentWrapper}>
          <div className={styles.mainContent}>
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "overview" && (
              <OverviewTab stay={stay} />
            )}
            {activeTab === "amenities" && <AmenitiesTab stay={stay} />}
            {activeTab === "policies" && <PoliciesTab stay={stay} />}

            {isRoomBased && (
              <AvailableRooms
                rooms={filteredRoomsByGuests}
                availabilityChecked={availabilityChecked}
                onSelectRoom={handleSelectRoom}
                discountPercentage={discountPercentage}
                guests={guests}
                stay={stay}
              />
            )}

            <MapSection
              location={stay?.fullAddress || stay?.location || stay?.city || stay?.cityArea}
              address={stay?.fullAddress || stay?.address || stay?.meetingAddress}
            />
          </div>

          <div className={styles.sidebarWrapper}>
            <BookingSidebar
              stay={stay}
              checkInDate={checkInDate}
              setCheckInDate={setCheckInDate}
              checkOutDate={checkOutDate}
              setCheckOutDate={setCheckOutDate}
              guests={guests}
              setGuests={setGuests}
              onCheckAvailability={handleCheckAvailability}
              onBooking={handleBooking}
              availabilityLoading={availabilityLoading}
              availabilityChecked={availabilityChecked}
              availableRooms={availableRooms}
              filteredRoomsByGuests={filteredRoomsByGuests}
              onSelectRoom={handleSelectRoom}
              selectedRoom={selectedRoom}
              discountPercentage={discountPercentage}
              numberOfNights={numberOfNights}
              roomsNeeded={roomsNeeded}
              roomCapacityMessage={roomCapacityMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StayProduct;
