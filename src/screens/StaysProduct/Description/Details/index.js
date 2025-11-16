import React from "react";
import cn from "classnames";
import styles from "./Details.module.sass";
import Icon from "../../../../components/Icon";
import Switch from "../../../../components/Switch";
import Counter from "../../../../components/Counter";

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

export const addOns = [
  {
    id: 1,
    title: "Professional Photography Package",
    description: "Professional photographer captures your adventure with high-quality photos delivered digitally",
    price: "$45",
    priceValue: 45,
    isPopular: true,
  },
  {
    id: 2,
    title: "Traditional Kerala Lunch",
    description: "Authentic Kerala-style vegetarian lunch prepared fresh by local chefs using organic ingredients",
    price: "$15 × 2 = $30",
    priceValue: 30,
    isPopular: true,
  },
  {
    id: 3,
    title: "Hotel Pickup & Drop-off",
    description: "Convenient door-to-door transportation from your hotel in comfortable air-conditioned vehicle",
    price: "$25 (per group)",
    priceValue: 25,
    isPopular: false,
  },
  {
    id: 4,
    title: "Premium Binoculars Rental",
    description: "High-quality binoculars (10x42) for enhanced wildlife viewing and bird watching throughout the tour",
    price: "$10 × 2 = $20",
    priceValue: 20,
    isPopular: false,
  },
];

const Details = ({ className, listing, selectedAddOns, addOnQuantities, onToggleAddOn, onAddOnQuantityChange }) => {
  const displayAddOns = Array.isArray(listing?.addons) && listing.addons.length
    ? listing.addons.map((a) => {
        const addonId = a?.addon?.addonId ?? a?.addonId ?? a?.assignmentId;
        const price = parseFloat(a?.addon?.price || 0);
        const currency = a?.addon?.currency || "";
        const pricingType = a?.addon?.pricingType || "Individual";
        const quantity = pricingType === "Group" ? (addOnQuantities?.[addonId] || 1) : 1;
        const totalPrice = price * quantity;
        
        const isSelected = selectedAddOns?.includes(addonId);
        
        return {
          id: addonId,
          title: a?.addon?.title || "Addon",
          description: a?.addon?.briefDescription || "",
          price: pricingType === "Group" && isSelected
            ? `${currency} ${price.toFixed(2)}${quantity > 1 ? ` × ${quantity} = ${currency} ${totalPrice.toFixed(2)}` : ` = ${currency} ${totalPrice.toFixed(2)}`}`
            : `${currency} ${price.toFixed(2)}`,
          priceValue: price,
          currency: currency,
          pricingType: pricingType,
          isPopular: false,
          originalAddon: a, // Keep reference to original addon data
        };
      })
    : addOns.map((a) => ({
        ...a,
        pricingType: "Individual", // Default for static addons
      }));

  // Only show the 'What's Included' setting (settingId = 7)
  const whatsIncludedSetting = Array.isArray(listing?.guestRequirements)
    ? listing.guestRequirements.find((gr) => gr?.setting?.settingId === 7 && gr?.setting?.isActive)
    : null;

  const requirementItems = whatsIncludedSetting && Array.isArray(whatsIncludedSetting.questions)
    ? whatsIncludedSetting.questions
        .filter((q) => q?.question?.isActive)
        .map((q) => ({ title: q.question.title, icon: "flag" }))
    : [];
  return (
    <div className={cn(className, styles.details)}>
      <h4 className={cn("h4", styles.title)}>Private room in house</h4>
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
      <div className={styles.facts}>
        {(
          (() => {
            if (!listing) return facts;
            const minP = typeof listing.minParticipants === "number" ? listing.minParticipants : undefined;

            const computed = [
              {
                heading: "Duration",
                value: [listing.duration, listing.durationUnit].filter(Boolean).join(" "),
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
                      : "Not available"
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
      <div className={styles.enhanceSection}>
        <h4 className={styles.enhanceTitle}>Enhance Your Experience</h4>
        <div className={styles.addOnsList}>
          {displayAddOns.map((addOn) => {
            const isSelected = selectedAddOns.includes(addOn.id);
            const isGroupPricing = addOn.pricingType === "Group";
            const quantity = isGroupPricing ? (addOnQuantities?.[addOn.id] || 1) : 1;
            
            return (
              <div
                key={addOn.id}
                className={cn(styles.addOnCard, {
                  [styles.addOnCardSelected]: isSelected,
                })}
              >
                <div className={styles.addOnContent}>
                  <div className={styles.addOnHeader}>
                    <div className={styles.addOnTitleRow}>
                      <h5 className={styles.addOnTitle}>{addOn.title}</h5>
                      {addOn.isPopular && (
                        <span className={styles.popularBadge}>Popular</span>
                      )}
                    </div>
                    <div className={styles.addOnPrice}>{addOn.price}</div>
                  </div>
                  <p className={styles.addOnDescription}>{addOn.description}</p>
                </div>
                <div className={styles.addOnControls}>
                  {isGroupPricing && isSelected ? (
                    <Counter
                      className={styles.addOnCounter}
                      value={quantity}
                      setValue={(newValue) => onAddOnQuantityChange(addOn.id, newValue)}
                      iconMinus="minus"
                      iconPlus="plus"
                      min={1}
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
            );
          })}
        </div>
      </div>
      <div className={styles.info}>{whatsIncludedSetting?.setting?.title || "What's Included"}</div>
      <div className={styles.optionsWrapper}>
        <div className={styles.options}>
          {(requirementItems.length ? requirementItems : options).map((x, index) => (
            <div className={styles.option} key={index}>
              <Icon name={x.icon} size="24" />
              {x.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Details;
