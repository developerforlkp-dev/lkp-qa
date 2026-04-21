import React, { useState, useMemo } from "react";
import cn from "classnames";
import styles from "./Details.module.sass";
import Icon from "../../../../components/Icon";
import Switch from "../../../../components/Switch";
import Counter from "../../../../components/Counter";
import Modal from "../../../../components/Modal";
import RoomCards from "../../../StayDetails/RoomCards";

const facts = [
  {
    heading: "Duration",
    value: "3 hours",
    icon: "stopwatch",
  },
  {
    heading: "Difficulty Level",
    value: "Moderate",
    icon: "lightning",
  },
  {
    heading: "Minimum Age",
    value: "12+",
    icon: "user",
  },
  {
    heading: "Group Size",
    value: "Up to 8",
    icon: "user",
  },
  {
    heading: "Private Option",
    value: "Available",
    icon: "lock",
  },
];

const options = [
  {
    title: "Free wifi 24/7",
    icon: "modem",
  },
  {
    title: "Free clean bathroom",
    icon: "toilet-paper",
  },
  {
    title: "Free computer",
    icon: "monitor",
  },
  {
    title: "Breakfast included",
    icon: "burger",
  },
  {
    title: "Free wifi 24/7",
    icon: "medical-case",
  },
  {
    title: "ATM",
    icon: "credit-card",
  },
  {
    title: "Free wifi 24/7",
    icon: "modem",
  },
  {
    title: "Nearby city",
    icon: "building",
  },
];

const Details = ({ className, listing, selectedAddOns, addOnQuantities, onToggleAddOn, onAddOnQuantityChange, onRoomSelect, selectedRoomId, roomsCount, onRoomsCountChange }) => {
  const [selectedAddonModal, setSelectedAddonModal] = useState(null);

  const displayAddOns = Array.isArray(listing?.addons) && listing.addons.length
    ? listing.addons.map((a) => {
      const addonId = a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId;
      const price = parseFloat(a?.addon?.price || 0);
      const currency = a?.addon?.currency || "";
      const pricingType = a?.addon?.pricingType || "Individual";
      const quantity = pricingType === "Individual" ? (addOnQuantities?.[addonId] || 1) : 1;
      const totalPrice = price * quantity;

      const isSelected = selectedAddOns?.includes(addonId);

      // Get description or use lorem ipsum placeholder
      const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
      const description = a?.addon?.briefDescription ||
        a?.addon?.description ||
        a?.addon?.fullDescription ||
        loremIpsum;

      return {
        id: addonId,
        title: a?.addon?.title || "Addon",
        description: description,
        price: pricingType === "Individual" && isSelected
          ? `${currency} ${price.toFixed(2)}${quantity > 1 ? ` × ${quantity} = ${currency} ${totalPrice.toFixed(2)}` : ` = ${currency} ${totalPrice.toFixed(2)}`}`
          : `${currency} ${price.toFixed(2)}`,
        priceValue: price,
        currency: currency,
        pricingType: pricingType,
        isPopular: false,
        originalAddon: a, // Keep reference to original addon data
      };
    })
    : [];

  // Helper function to format image URLs (from Azure blob storage or full URLs)
  const formatImageUrl = (url) => {
    if (!url) return null;

    // Already a full URL with SAS token - use directly
    if ((url.startsWith("http://") || url.startsWith("https://")) &&
      (url.includes("sig=") || url.includes("sv="))) {
      return url;
    }

    // Already a full URL without SAS token
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // Azure blob storage path (e.g., "leads/3/listings/6/cover-photo/image.jpg")
    if (url.startsWith("leads/")) {
      return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }

    // Relative path - prepend base URL if needed
    if (url.startsWith("/")) {
      return url;
    }

    // Otherwise assume it's a blob storage path
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  };

  // Helper function to get addon image URL
  const getAddonImageUrl = (addon) => {
    if (!addon?.originalAddon) return null;

    const addonDetails = addon.originalAddon?.addon;
    if (!addonDetails) return null;

    // Try imageUrls array first (from API)
    if (Array.isArray(addonDetails.imageUrls) && addonDetails.imageUrls.length > 0) {
      return formatImageUrl(addonDetails.imageUrls[0]);
    }

    // Fallback to other image fields
    const imageUrl = addonDetails.imageUrl ||
      addonDetails.image ||
      addonDetails.photoUrl ||
      (addonDetails.images && addonDetails.images[0]?.url) ||
      (addonDetails.images && addonDetails.images[0]?.imageUrl);

    return formatImageUrl(imageUrl);
  };

  const handleAddonCardClick = (addon, e) => {
    // Don't open modal if clicking on switch or counter
    if (e.target.closest(`.${styles.addOnControls}`) ||
      e.target.closest(`.${styles.addOnSwitch}`) ||
      e.target.closest(`.${styles.addOnCounter}`)) {
      return;
    }
    setSelectedAddonModal(addon);
  };

  // Only show the 'What's Included' setting (settingId = 7)
  // Aggregate all active guest requirements for the 'What\'s Included' / Rules section
  const requirementItems = useMemo(() => {
    if (!Array.isArray(listing?.guestRequirements)) return [];
    
    return listing.guestRequirements
      .filter((gr) => gr?.setting?.isActive && Array.isArray(gr.questions))
      .flatMap((gr) => {
        const settingTitle = gr.setting.title || "Requirement";
        return gr.questions
          .filter((q) => q?.question?.isActive)
          .map((q) => ({
            title: `${settingTitle}: ${q.question.title}`,
            icon: "check",
          }));
      });
  }, [listing]);

  // Determine section title based on listing type
  const isStayLocal = Boolean(listing?.propertyName || listing?.propertyType === "STAY" || listing?.stayId || listing?.stay_id);
  const isFoodLocal = Boolean(listing?.menuName || listing?.cuisineType || listing?.foodId || listing?.menuId);
  const isPlaceLocal = Boolean(listing?.placeName || listing?.placeType || listing?.placeId);

  let aboutTitle = "About The Experience";
  if (isStayLocal) aboutTitle = "About The Stay";
  else if (isFoodLocal) aboutTitle = "About The Food";
  else if (isPlaceLocal) aboutTitle = "About The Place";

  return (
    <div className={cn(className, styles.details)}>
      <h4 className={cn("h4", styles.title)}>{aboutTitle}</h4>
      <div className={styles.content}>
        {listing?.description ? (
          <>
            <p>{listing.description}</p>
            {listing.meetingInstructions && <p>{listing.meetingInstructions}</p>}
          </>
        ) : (
          <>
            <p>
              Described by Queenstown House & Garden magazine as having 'one of the
              best views we've ever seen' you will love relaxing in this newly
              built, architectural house sitting proudly on Queenstown Hill.
            </p>
            <p>
              Enjoy breathtaking 180' views of Lake Wakatipu from your well
              appointed & privately accessed bedroom with modern en suite and
              floor-to-ceiling windows.
            </p>
            <p>
              Your private patio takes in the afternoon sun, letting you soak up
              unparalleled lake and mountain views by day and the stars & city
              lights by night.
            </p>
          </>
        )}
      </div>
      <RoomCards 
        listing={listing} 
        onRoomSelect={onRoomSelect} 
        selectedRoomId={selectedRoomId} 
        roomsCount={roomsCount}
        onRoomsCountChange={onRoomsCountChange}
        noContainer 
      />
      <div className={styles.facts}>
        {(
          (() => {
            if (!listing) return facts;
            const minP = typeof listing.minParticipants === "number" ? listing.minParticipants : undefined;
            const durationUnitRaw = listing.durationUnit;
            const durationUnitNormalized =
              typeof durationUnitRaw === "string" && durationUnitRaw.trim()
                ? (() => {
                  const u = durationUnitRaw.trim().toLowerCase();
                  if (u === "hour" || u === "hours" || u === "hr" || u === "hrs") return "hrs";
                  return durationUnitRaw;
                })()
                : "hrs";

            const computed = [
              {
                heading: "Duration",
                value: listing.duration ? `${listing.duration} ${durationUnitNormalized}` : "",
                icon: "stopwatch",
              },
              {
                heading: "Difficulty Level",
                value: listing.difficultyLevel,
                icon: "lightning",
              },
              {
                heading: "Minimum Age",
                value: listing.minimumAge ? `${listing.minimumAge}+` : "",
                icon: "user",
              },
              {
                heading: "Group Size",
                value: typeof minP === "number" ? `${minP}+` : "",
                icon: "user",
              },
              {
                heading: "Private Option",
                value:
                  typeof listing.privateOptionAvailable === "boolean"
                    ? listing.privateOptionAvailable
                      ? "Available"
                      : "N/A"
                    : "",
                icon: "lock",
              },
              {
                heading: "Languages",
                value: Array.isArray(listing.languagesOffered) ? listing.languagesOffered.join(", ") : "",
                icon: "flag",
              },
            ].filter((i) => i.value);

            return computed.length ? computed : facts;
          })()
        ).map((x, index) => (
          <div className={styles.fact} key={index}>
            <div className={styles.factIcon}>
              <Icon name={x.icon} size="20" />
            </div>
            <div className={styles.factContent}>
              <div className={styles.factHeading}>{x.heading}</div>
              <div className={styles.factValue}>{x.value}</div>
            </div>
          </div>
        ))}
      </div>
      {displayAddOns.length > 0 && (
        <div className={styles.enhanceSection}>
          <h4 className={styles.enhanceTitle}>Enhance Your Experience</h4>
          <div className={styles.addOnsList}>
            {displayAddOns.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              const isIndividualPricing = addOn.pricingType === "Individual";
              const quantity = isIndividualPricing ? (addOnQuantities?.[addOn.id] || 1) : 1;

              const addonImageUrl = getAddonImageUrl(addOn);

              return (
                <div
                  key={addOn.id}
                  className={cn(styles.addOnCard, styles.addOnCardRow, {
                    [styles.addOnCardSelected]: isSelected,
                  })}
                  onClick={(e) => handleAddonCardClick(addOn, e)}
                >
                  <div className={styles.addOnPreview}>
                    {addonImageUrl ? (
                      <img
                        src={addonImageUrl}
                        alt={addOn.title}
                        className={styles.addOnImg}
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          if (!e.target.src.includes("/images/content/card-pic-13.jpg")) {
                            e.target.src = "/images/content/card-pic-13.jpg";
                            e.target.onerror = null;
                          }
                        }}
                      />
                    ) : (
                      <div className={styles.addOnPreviewPlaceholder}>
                        <Icon name="image" size="48" />
                      </div>
                    )}
                  </div>
                  <div className={styles.addOnBody}>
                    <div className={styles.addOnHeader}>
                      <div className={styles.addOnTitleRow}>
                        <h5 className={styles.addOnTitle}>{addOn.title}</h5>
                        {addOn.isPopular && (
                          <span className={styles.popularBadge}>Popular</span>
                        )}
                      </div>
                      <div className={styles.addOnPrice}>{addOn.price}</div>
                    </div>
                    <div className={styles.addOnFoot}>
                      <div className={styles.addOnControls}>
                        {isIndividualPricing && isSelected ? (
                          <Counter
                            className={styles.addOnCounter}
                            value={quantity}
                            setValue={(newValue) => onAddOnQuantityChange(addOn.id, newValue)}
                            iconMinus="minus"
                            iconPlus="plus"
                            min={0}
                          />
                        ) : (
                          <div className={styles.addOnSwitch}>
                            <Switch
                              value={isSelected}
                              onChange={() => onToggleAddOn(addOn.id, addOn.pricingType)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {requirementItems.length > 0 && (
        <div className={styles.requirementsSection} style={{ marginTop: "32px", paddingTop: "32px", borderTop: "1px solid #E6E8EC" }}>
          <div className={styles.info} style={{ marginBottom: "24px" }}>Guest Requirements & Instructions</div>
          <div className={styles.optionsWrapper}>
            <div className={styles.options}>
              {requirementItems.map((x, index) => (
                <div className={styles.option} key={index}>
                  <Icon name={x.icon} size="24" />
                  {x.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Addon Detail Modal */}
      <Modal
        visible={selectedAddonModal !== null}
        onClose={() => setSelectedAddonModal(null)}
        outerClassName={styles.addonModalOuter}
      >
        {selectedAddonModal && (
          <div className={styles.addonModalContent}>
            <div className={styles.addonModalImage}>
              {(() => {
                const imageUrl = getAddonImageUrl(selectedAddonModal);
                return imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={selectedAddonModal.title}
                    className={styles.addonModalImg}
                  />
                ) : (
                  <div className={styles.addonModalPlaceholder}>
                    <Icon name="image" size="48" />
                    <p>No image available</p>
                  </div>
                );
              })()}
            </div>
            <div className={styles.addonModalDescription}>
              <div className={styles.addonModalDescText}>
                {selectedAddonModal.description || "No description available for this addon."}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Details;
