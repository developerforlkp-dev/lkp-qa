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

    const loadHostData = async () => {
      if (!hostId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getHost(hostId);
        if (!mounted) return;
        setHostData(data || null);
      } catch (err) {
        console.error("Failed to load host data:", err);
        if (!mounted) return;
        setError(err.message || "Failed to load host profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHostData();

    return () => {
      mounted = false;
    };
  }, [hostId]);

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

    const loadTabListings = async () => {
      if (!hostId) return;
      try {
        const contentRes = await getHostContent(hostId);
        //console.log("📦 Host content API response:", { hostId, contentRes });

        if (!mounted) return;

        const grouped = {
          experiences: [],
          events: [],
          stays: [],
          places: [],
          foodMenus: [],
        };

        const directExperiences = normalizeArray(contentRes, ["experiences", "experience", "listings"]);
        const directEvents = normalizeArray(contentRes, ["events", "eventListings", "event_listings"]);
        const directStays = normalizeArray(contentRes, ["stays", "stayListings", "stay_listings"]);
        const directPlaces = normalizeArray(contentRes, ["places", "placeListings", "place_listings"]);
        const directFood = normalizeArray(contentRes, ["foods", "foodMenus", "food_menus", "food", "menus"]);
        const genericListings = normalizeArray(contentRes, ["content", "listings", "items", "data"]);

        if (directExperiences.length || directEvents.length || directStays.length || directPlaces.length || directFood.length) {
          grouped.experiences = directExperiences;
          grouped.events = directEvents;
          grouped.stays = directStays;
          grouped.places = directPlaces;
          grouped.foodMenus = directFood;
        } else {
          genericListings.forEach((item) => {
            const code = getInterestCode(item);
            if (code === "EVENT" || code === "EVENTS") grouped.events.push(item);
            else if (code === "STAY" || code === "STAYS") grouped.stays.push(item);
            else if (code === "PLACE" || code === "PLACES") grouped.places.push(item);
            else if (code === "FOOD") grouped.foodMenus.push(item);
            else grouped.experiences.push(item);
          });
        }

        setTabListings({
          experiences: grouped.experiences,
          events: grouped.events,
          stays: grouped.stays,
          places: grouped.places,
          foodMenus: grouped.foodMenus,
        });
      } catch (err) {
        console.error("Failed to load host profile tab listings:", err);
      }
    };

    loadTabListings();
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
                <div className={styles.avatarPlaceholder}>
                  <Icon name="user" size="40" />
                </div>
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

