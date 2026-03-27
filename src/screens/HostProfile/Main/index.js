import React, { useEffect, useState } from "react";
import cn from "classnames";
import styles from "./Main.module.sass";
import Profile from "../../../components/Profile";
import Icon from "../../../components/Icon";
import Details from "./Details";
import List from "./List";
import Comment from "../../../components/Comment";
import { getHost } from "../../../utils/api";

const socials = [
  {
    title: "twitter",
    url: "https://twitter.com/ui8",
  },
  {
    title: "instagram",
    url: "https://www.instagram.com/ui8net/",
  },
  {
    title: "facebook",
    url: "https://www.facebook.com/ui8.net/",
  },
];

const Main = ({ hostId }) => {
  const [hostData, setHostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Extract host information
  const host = hostData?.host || null;
  const statistics = hostData?.statistics || null;
  const businessInterests = hostData?.businessInterests || [];
  const listings = hostData?.listings || [];
  const recentReviews = hostData?.recentReviews || [];

  // Format host name - ensure it's a single line string
  const hostName = host
    ? `${(host.firstName || "").trim()} ${(host.lastName || "").trim()}`.trim() || "Host"
    : "Host";

  // Get rating and reviews
  const rating = statistics?.averageRating || 0;
  const reviewCount = statistics?.totalReviews || 0;
  const ratingDisplay = rating > 0 ? rating.toFixed(1) : "0.0";
  const reviewsText =
    reviewCount === 0
      ? "No reviews"
      : reviewCount === 1
      ? "1 review"
      : `${reviewCount} reviews`;

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

  // Build parametersUser from host data
  const parametersUser = hostData
    ? [
        {
          title: host?.companyName || "Host",
          icon: "home",
        },
        {
          title:
            reviewCount > 0
              ? `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
              : "No reviews yet",
          icon: "star-outline",
        },
      ]
    : [
        {
          title: "Host",
          icon: "home",
        },
        {
          title: "No reviews yet",
          icon: "star-outline",
        },
      ];

  // Loading state
  if (loading && hostId) {
    return (
      <div className={cn("section", styles.section)}>
        <div className={cn("container", styles.container)}>
          <div>Loading host profile...</div>
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
        <div className={styles.photo}>
          <img src="/images/content/bg-profile-host.jpg" alt="Nature" />
        </div>
        <div className={styles.row}>
          <Profile
            className={styles.profile}
            parametersUser={parametersUser}
            socials={socials}
            buttonText="Contact"
            info={host?.bio || ""}
            joinedDate={joinedDate}
          >
            <div className={styles.line}>
              <div className={styles.avatar}>
                <div className={styles.avatarPlaceholder}>
                  <Icon name="user" size="40" />
                </div>
                <div className={styles.check}>
                  <Icon name="tick" size="24" />
                </div>
              </div>
              <div className={styles.description}>
                <div className={styles.man}>{hostName}</div>
                <div className={styles.rating}>
                  <Icon name="star" size="20" />
                  <div className={styles.number}>{ratingDisplay}</div>
                  <div className={styles.reviews}>({reviewsText})</div>
                </div>
              </div>
            </div>
          </Profile>
          <div className={styles.wrapper}>
            <Details
              className={styles.details}
              host={host}
              businessInterests={businessInterests}
            />
            <List className={styles.list} listings={listings} hostName={hostName} />
            <Comment reviews={recentReviews} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
