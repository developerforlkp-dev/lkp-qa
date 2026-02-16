import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import styles from "./StayProduct.module.sass";
import Icon from "../../components/Icon";
import Loader from "../../components/Loader";
import { getStayDetails, getStayRoomAvailability, createStayOrder } from "../../utils/api";

// Helper to format image URLs
const formatImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("leads/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  if (url.startsWith("/")) return url;
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
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
  onSelectRoom,
  selectedRoom,
  discountPercentage,
  onBooking,
  numberOfNights
}) => {
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const checkInInputRef = useRef(null);
  const checkOutInputRef = useRef(null);

  const isRoomBased = stay?.rooms?.length > 0 || stay?.roomTypes?.length > 0;

  const basePrice = parseFloat(stay?.fullPropertyB2cPrice || stay?.startingPrice || stay?.pricePerNight || stay?.price || 0);
  const discountedBasePrice = discountPercentage > 0
    ? basePrice * (1 - discountPercentage / 100)
    : basePrice;

  const extraAdults = Math.max(0, (guests?.adults || 0) - (stay?.maxAdults || 0));
  const extraChildren = Math.max(0, (guests?.children || 0) - (stay?.maxChildren || 0));

  const extraAdultPrice = parseFloat(stay?.extraAdultPrice || 0);
  const extraChildPrice = parseFloat(stay?.extraChildPrice || 0);

  const totalExtraPrice = (extraAdults * extraAdultPrice) + (extraChildren * extraChildPrice);

  const originalPrice = basePrice + totalExtraPrice;
  const price = discountedBasePrice + totalExtraPrice;

  const currency = stay?.currency || "INR";

  const formatPrice = (amount) => {
    if (currency === "INR") return `₹${Number(amount).toLocaleString("en-IN")}`;
    return `${currency} ${amount}`;
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

  const openDatePicker = (ref) => {
    const el = ref?.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch (e) {
      // ignore
    }
    try {
      el.focus();
      el.click();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <div className={styles.priceGroup}>
            {discountPercentage > 0 && (
              <div className={styles.oldPrice}>
                <span className={styles.strikedPart}>{formatPrice(basePrice)}</span>
                {totalExtraPrice > 0 && (
                  <span className={styles.plusPart}> + {formatPrice(totalExtraPrice)}</span>
                )}
              </div>
            )}
            <div className={styles.currentPriceRow}>
              <span className={styles.price}>{formatPrice(price)}</span>
              <span className={styles.perNight}>/ night</span>
              {discountPercentage > 0 && (
                <span className={styles.discountBadge}>{discountPercentage}% OFF</span>
              )}
            </div>
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
            onClick={() => openDatePicker(checkInInputRef)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDatePicker(checkInInputRef);
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
            <input
              className={styles.dateInputOverlay}
              ref={checkInInputRef}
              type="date"
              value={checkInDate || ""}
              onChange={(e) => setCheckInDate(e.target.value)}
              min={moment().format("YYYY-MM-DD")}
              aria-label="Check-in"
            />
          </div>

          <div
            className={styles.dateCard}
            role="button"
            tabIndex={0}
            onClick={() => openDatePicker(checkOutInputRef)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDatePicker(checkOutInputRef);
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
            <input
              className={styles.dateInputOverlay}
              ref={checkOutInputRef}
              type="date"
              value={checkOutDate || ""}
              onChange={(e) => setCheckOutDate(e.target.value)}
              min={checkInDate || moment().format("YYYY-MM-DD")}
              aria-label="Check-out"
            />
          </div>
        </div>

        <div className={styles.guestField}>
          <div
            className={styles.guestSelector}
            onClick={() => setShowGuestPicker(!showGuestPicker)}
            role="button"
          >
            <div className={styles.guestLabel}>GUESTS</div>
            <div className={styles.guestValueRow}>
              <div className={styles.guestValue}>{guestText()}</div>
              <div className={styles.guestIcon}>
                <Icon name="user" size="16" />
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

        <button
          className={styles.checkBtn}
          onClick={() => {
            if (isRoomBased && !availabilityChecked) {
              onCheckAvailability();
            } else {
              onBooking({ pricePerNight: price, totalNights: numberOfNights });
            }
          }}
          disabled={!checkInDate || !checkOutDate || availabilityLoading || (isRoomBased && availabilityChecked && !selectedRoom)}
        >
          {availabilityLoading
            ? (isRoomBased && !availabilityChecked ? "Checking..." : "Processing...")
            : (isRoomBased && !availabilityChecked ? "Check Availability" : "Book Now")}
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

  const originalPrice = basePrice + totalExtraPrice;
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
            <span>Max {room.maxAdults || 2} Guests</span>
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
  if (!rooms || rooms.length === 0) {
    return (
      <div className={styles.roomsSection}>
        <h2>Available Rooms</h2>
        <p className={styles.noRooms}>
          {availabilityChecked
            ? "No rooms available for the selected dates. Try different dates or guests."
            : "Select dates and check availability to see rooms"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.roomsSection}>
      <div className={styles.roomsHeader}>
        <h2>Available Rooms</h2>
        <span className={styles.roomsCount}>{rooms.length} room type{rooms.length !== 1 ? 's' : ''} found</span>
      </div>
      <p className={styles.roomsSubtext}>Select your perfect accommodation</p>
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

  // Reset availability when dates change
  useEffect(() => {
    setAvailabilityChecked(false);
    if (stay) {
      setAvailableRooms(stay.rooms || stay.roomTypes || []);
    }
  }, [checkInDate, checkOutDate, stay]);

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
      alert("Please select dates and guests first.");
      return;
    }

    const { pricePerNight, totalNights } = bookingInfo;

    const bookingData = {
      stayId: stayId,
      checkInDate,
      checkOutDate,
      adults: guests.adults,
      children: guests.children,
      totalPrice: pricePerNight * totalNights,
      roomId: selectedRoom?.id || selectedRoom?.roomId || null,
      currency: stay?.currency || "INR",
      paymentMethod: "Reception", // Default for now
    };

    setAvailabilityLoading(true);
    try {
      const response = await createStayOrder(bookingData);
      console.log("Booking result:", response);
      alert("Your booking has been placed successfully!");
      // Optional: reset state or redirect
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

  const isRoomBased = stay?.rooms?.length > 0 || stay?.roomTypes?.length > 0;

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
                rooms={availableRooms}
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
              onSelectRoom={handleSelectRoom}
              selectedRoom={selectedRoom}
              discountPercentage={discountPercentage}
              numberOfNights={numberOfNights}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StayProduct;
