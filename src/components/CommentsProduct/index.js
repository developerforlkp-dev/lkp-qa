import React from "react";
import { useHistory } from "react-router-dom";
import cn from "classnames";
import styles from "./CommentsProduct.module.sass";
import Profile from "../Profile";
import Comment from "../Comment";
import Icon from "../Icon";

const CommentsProduct = ({
  className,
  parametersUser,
  socials,
  info,
  buttonText,
  hostData,
}) => {
  const history = useHistory();

  const handleProfileClick = () => {
    // Navigate to host profile with hostId if available
    const hostId = hostData?.host?.leadUserId;
    if (hostId) {
      history.push(`/host-profile?id=${hostId}`);
    } else {
      history.push("/host-profile");
    }
  };

  // Extract host information from hostData
  const host = hostData?.host || null;
  const statistics = hostData?.statistics || null;
  
  // Format host name
  const hostName = host
    ? `${host.firstName || ""} ${host.lastName || ""}`.trim() || "Host"
    : "Zoe towne";
  
  // Get rating and reviews
  const rating = statistics?.averageRating || 0;
  const reviewCount = statistics?.totalReviews || 0;
  const ratingDisplay = rating > 0 ? rating.toFixed(1) : "0.0";
  const reviewsText = reviewCount === 1 ? "1 review" : `${reviewCount} reviews`;

  // Build parametersUser from host data if available
  const displayParametersUser = hostData
    ? [
        {
          title: host?.companyName || "Host",
          icon: "home",
        },
        {
          title: reviewCount > 0 ? `${reviewCount} reviews` : "No reviews yet",
          icon: "star-outline",
        },
      ]
    : parametersUser;

  return (
    <div className={cn(className, styles.section)}>
      <div className={cn("container", styles.container)}>
        <div onClick={handleProfileClick} style={{ cursor: "pointer" }}>
          <Profile
            className={styles.profile}
            parametersUser={displayParametersUser}
            info={info}
            socials={socials}
            buttonText={buttonText}
          >
            <div className={styles.line}>
              <div className={styles.avatar}>
                <div className={styles.avatarPlaceholder}>
                  <Icon name="user" size="32" />
                </div>
                <div className={styles.check}>
                  <Icon name="check" size="12" />
                </div>
              </div>
              <div className={styles.details}>
                <div className={styles.man}>{hostName}</div>
                <div className={styles.rating}>
                  <Icon name="star" size="20" />
                  <div className={styles.number}>{ratingDisplay}</div>
                  <div className={styles.reviews}>
                    ({reviewCount > 0 ? reviewsText : "No reviews"})
                  </div>
                </div>
              </div>
            </div>
          </Profile>
        </div>
        <div className={styles.wrapper}>
          <Comment />
        </div>
      </div>
    </div>
  );
};

export default CommentsProduct;
