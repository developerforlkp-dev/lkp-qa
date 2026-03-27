import React, { useMemo, useState } from "react";
import cn from "classnames";
import styles from "./TabSection.module.sass";
import Icon from "../../../components/Icon";


const tabs = [
  {
    id: "meeting-point",
    label: "Meeting Point",
    icon: "location",
  },
  {
    id: "what-to-bring",
    label: "What to Bring",
    icon: "bag",
  },
  {
    id: "rules-policies",
    label: "Rules & Policies",
    icon: "lock",
  },
  {
    id: "cancellation-policy",
    label: "Cancellation Policy",
    icon: "close",
  },
];

const tabContent = {
  "meeting-point": {
    title: "Meeting Point",
    isCard: true,
    address: "Queenstown Gardens, Beach Street, Queenstown 9300",
    instructions: "We'll meet at the main entrance of Queenstown Gardens. Look for our guide wearing a bright blue jacket. Free parking is available nearby.",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2830.5!2d168.6614!3d-45.0312!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa9d51df1d7a8e5fb%3A0x500ef868479a1c00!2sQueenstown%20Gardens!5e0!3m2!1sen!2sus!4v1234567890",
  },
  "what-to-bring": {
    title: "What to Bring",
    content: [
      "Comfortable outdoor clothing suitable for the weather",
      "Sturdy closed-toe shoes or hiking boots",
      "Sunscreen and hat for sun protection",
      "Water bottle (refill stations available)",
      "Camera or smartphone for photos",
      "Any personal medications you may need",
    ],
  },
  "rules-policies": {
    title: "Rules & Policies",
    content: [
      "Minimum age requirement: 12 years old. Participants under 18 must be accompanied by an adult.",
      "Weather policy: Activities may be rescheduled or refunded in case of severe weather conditions.",
      "Health requirements: Participants must be in good physical health. Please inform us of any medical conditions.",
      "Safety first: All participants must follow the guide's instructions at all times.",
      "No smoking or alcohol consumption during the activity.",
    ],
  },
  "cancellation-policy": {
    title: "Cancellation Policy",
    content: [],
  },
};

const TabSection = ({ classSection, listing }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  const dynamicMeetingPoint = useMemo(() => {
    const title = "Meeting Point";
    // Per request: address should show meetingLocationName, instructions should show meetingAddress
    const address = listing?.meetingLocationName || tabContent["meeting-point"].title;
    const instructions = listing?.meetingAddress || tabContent["meeting-point"].address;
    const lat = listing?.meetingLatitude;
    const lng = listing?.meetingLongitude;
    const query = lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(listing?.meetingAddress || "");
    const mapUrl = query
      ? `https://www.google.com/maps?q=${query}&z=14&output=embed`
      : tabContent["meeting-point"].mapUrl;
    return {
      title,
      isCard: true,
      address,
      instructions,
      mapUrl,
    };
  }, [listing]);

  const dynamicWhatToBring = useMemo(() => {
    const base = tabContent["what-to-bring"];
    const setting = Array.isArray(listing?.guestRequirements)
      ? listing.guestRequirements.find(
        (gr) => gr?.setting?.settingId === 4 && gr?.setting?.isActive
      )
      : null;
    const items = setting && Array.isArray(setting.questions)
      ? setting.questions
        .filter((q) => q?.question?.isActive)
        .map((q) => q.question.title)
      : base.content;
    return {
      title: base.title,
      content: items,
    };
  }, [listing]);

  const dynamicRulesPolicies = useMemo(() => {
    const base = tabContent["rules-policies"];
    const setting = Array.isArray(listing?.guestRequirements)
      ? listing.guestRequirements.find(
        (gr) => gr?.setting?.settingId === 6 && gr?.setting?.isActive
      )
      : null;
    const items = setting && Array.isArray(setting.questions)
      ? setting.questions
        .filter((q) => q?.question?.isActive)
        .map((q) => q.question.title)
      : base.content;
    return {
      title: base.title,
      content: items,
    };
  }, [listing]);

  const dynamicCancellationPolicy = useMemo(() => {
    const base = tabContent["cancellation-policy"];

    // Use listing payload (fetched via GET /public/listings/{id}) as the backend source.
    // ViewDetails already expects listingData.cancellationPolicyText.
    const textFromListing =
      typeof listing?.cancellationPolicyText === "string"
        ? listing.cancellationPolicyText.trim()
        : "";

    const text = textFromListing || (listing ? "N/A" : "Loading...");

    return {
      title: base.title,
      content: [text],
    };
  }, [listing]);

  const contentMap = {
    "meeting-point": dynamicMeetingPoint,
    "what-to-bring": dynamicWhatToBring,
    "rules-policies": dynamicRulesPolicies,
    "cancellation-policy": dynamicCancellationPolicy,
  };

  const currentContent = contentMap[activeTab];

  return (
    <div className={cn(classSection, styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(styles.tab, {
                [styles.active]: activeTab === tab.id,
                [styles.tabCompact]: tab.id === "cancellation-policy",
              })}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} size="16" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.content}>
          {currentContent.isCard ? (
            <div className={styles.card}>
              <div className={styles.addressSection}>
                <div className={styles.addressRow}>
                  <Icon name="location" size="20" className={styles.locationIcon} />
                  <span className={styles.address}>{currentContent.address}</span>
                </div>
                <p className={styles.instructions}>{currentContent.instructions}</p>
              </div>
              <div className={styles.mapContainer}>
                <iframe
                  src={currentContent.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className={styles.map}
                  title="Meeting point map"
                ></iframe>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.list}>
                {currentContent.content.map((item, index) => (
                  <div key={index} className={styles.item}>
                    <Icon name="check" size="16" className={styles.checkIcon} />
                    <p className={styles.text}>{item}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabSection;

