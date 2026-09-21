import React, { useEffect, useState } from "react";
import cn from "classnames";
import styles from "./Main.module.sass";
import Profile from "../../../components/Profile";
import Icon from "../../../components/Icon";
import Details from "./Details";
import List from "./List";
import Loader from "../../../components/Loader";
import LoadingSkeleton from "../../../components/LoadingSkeleton";
import {
  getHost,
  getHostContent,
} from "../../../utils/api";



const Main = ({ hostId, onLoadingChange }) => {
  const [hostData, setHostData] = useState(null);
  const [tabListings, setTabListings] = useState({
    experiences: [],
    events: [],
    stays: [],
    places: [],
    foodMenus: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  useEffect(() => {
    let mounted = true;

    const normalizeArray = (payload, keys = []) => {
      if (Array.isArray(payload)) return payload;
      if (!payload || typeof payload !== "object") return [];
      for (const key of keys) {
        if (Array.isArray(payload[key])) return payload[key];
      }
      if (payload.data && typeof payload.data === "object") {
        for (const key of keys) {
          if (Array.isArray(payload.data[key])) return payload.data[key];
        }
      }
      return [];
    };

    const getInterestCode = (item) => {
      const raw =
        item?.itemType ||
        item?.businessInterestCode ||
        item?.businessInterest ||
        item?.business_interest_code ||
        item?.business_interest;
      return String(raw || "").toUpperCase().trim();
    };

    const loadAllHostData = async () => {
      if (!hostId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let fetchedHostData = null;
      let hostLoadError = null;

      // 1. Fetch host profile if available
      try {
        const data = await getHost(hostId);
        if (data) fetchedHostData = data;
      } catch (err) {
        // Non-blocking: will fallback to getHostContent
        hostLoadError = err;
      }

      // 2. Fetch host public content (GET /api/public/hosts/:leadUserId/content)
      try {
        const contentRes = await getHostContent(hostId);

        if (!mounted) return;

        // If host object is returned inside contentRes, merge it
        if (contentRes?.host) {
          fetchedHostData = {
            ...(fetchedHostData || {}),
            host: {
              ...(contentRes.host || {}),
              ...(fetchedHostData?.host || {}),
            },
            businessInterests:
              fetchedHostData?.businessInterests ||
              contentRes?.businessInterests ||
              [],
          };
        }

        const directExperiences = normalizeArray(contentRes, ["experiences", "experience", "listings"]);
        const directEvents = normalizeArray(contentRes, ["events", "eventListings", "event_listings"]);
        const directStays = normalizeArray(contentRes, ["stays", "stayListings", "stay_listings"]);
        const directPlaces = normalizeArray(contentRes, ["places", "placeListings", "place_listings"]);
        const directFood = normalizeArray(contentRes, ["foods", "foodMenus", "food_menus", "food", "menus"]);
        const genericListings = normalizeArray(contentRes, ["content", "listings", "items", "data"]);

        const grouped = {
          experiences: directExperiences.length
            ? directExperiences
            : genericListings.filter((item) => {
                const code = getInterestCode(item);
                return !code || code === "EXPERIENCE" || code === "EXPERIENCES";
              }),
          events: directEvents.length
            ? directEvents
            : genericListings.filter((item) => {
                const code = getInterestCode(item);
                return code === "EVENT" || code === "EVENTS" || item?.businessInterestId === 2;
              }),
          stays: directStays.length
            ? directStays
            : genericListings.filter((item) => {
                const code = getInterestCode(item);
                return code === "STAY" || code === "STAYS";
              }),
          places: directPlaces.length
            ? directPlaces
            : genericListings.filter((item) => {
                const code = getInterestCode(item);
                return code === "PLACE" || code === "PLACES";
              }),
          foodMenus: directFood.length
            ? directFood
            : genericListings.filter((item) => {
                const code = getInterestCode(item);
                return code === "FOOD" || code === "FOODS";
              }),
        };

        setTabListings(grouped);
      } catch (err) {
        console.error("Failed to load host profile tab listings:", err);
      }

      if (mounted) {
        if (fetchedHostData) {
          setHostData(fetchedHostData);
          setError(null);
        } else if (hostLoadError) {
          setError(hostLoadError.message || "Failed to load host profile");
        }
        setLoading(false);
      }
    };

    loadAllHostData();

    return () => {
      mounted = false;
    };
  }, [hostId]);

  // Extract host information
  const host = hostData?.host || null;
  const businessInterests = hostData?.businessInterests || [];

  // Format host name - ensure it's a single line string
  const hostName = host
    ? `${(host.firstName || "").trim()} ${(host.lastName || "").trim()}`.trim() || "Host"
    : "Host";

  // Format joined date
  const formatJoinedDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const joinedDate = host?.joinedDate
    ? formatJoinedDate(host.joinedDate)
    : "Mar 15, 2021";
  const hostPhone =
    host?.phoneNumber ||
    hostData?.phoneNumber ||
    host?.phone ||
    host?.mobile ||
    host?.contactNumber ||
    hostData?.contactNumber ||
    "";
  const hostEmail =
    host?.email ||
    hostData?.email ||
    host?.emailAddress ||
    hostData?.emailAddress ||
    "";

  // Build parametersUser from host data
  const parametersUser = [];

  // Loading state
  if (loading && hostId) {
    return (
      <div className={cn("section", styles.section)}>
        <div className={cn("container", styles.container)}>
          <LoadingSkeleton variant="host" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && hostId) {
    return (
      <div className={cn("section", styles.section)}>
        <div className={cn("container", styles.container)}>
          <div>Error loading host profile: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("section", styles.section)}>
      <div className={cn("container", styles.container)}>
        <div className={styles.hero}>
          <div className={styles.heroGlowOne} />
          <div className={styles.heroGlowTwo} />
          <div className={styles.heroContent}>
            <div className={styles.heroEyebrow}>Host Profile</div>
            <h1 className={styles.heroTitle}>{hostName}</h1>
          </div>
        </div>
        <div className={styles.row}>
          <Profile
            className={styles.profile}
            parametersUser={parametersUser}
            hideContactButton={true}
            hideReportButton={true}
            info={host?.bio || ""}
            joinedDate={joinedDate}
            siteUrl={null}
            phoneNumber={hostPhone}
            email={hostEmail}
          >
            <div className={styles.headStack}>
              <div className={styles.avatar}>
                {host?.profilePhotoUrl || host?.profileImageUrl || hostData?.profilePhotoUrl || hostData?.profileImageUrl || host?.avatar ? (
                  <img 
                    src={host?.profilePhotoUrl || host?.profileImageUrl || hostData?.profilePhotoUrl || hostData?.profileImageUrl || host?.avatar}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    alt={hostName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hostName)}&backgroundColor=0097B2&color=ffffff`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(hostName)}&backgroundColor=0097B2&color=ffffff`}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    alt={hostName}
                  />
                )}
                <div className={styles.check}>
                  <Icon name="tick" size="24" />
                </div>
              </div>
              <div className={styles.descriptionRow}>
                <div className={styles.man}>{hostName}</div>
              </div>
            </div>
          </Profile>
          <div className={styles.wrapper}>
            <Details
              className={styles.details}
              host={host}
              businessInterests={businessInterests}
            />
            <List className={styles.list} listingsByType={tabListings} hostName={hostName} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;

