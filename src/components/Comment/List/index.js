import React, { useState, useMemo } from "react";
import { useHistory } from "react-router-dom";
import styles from "./List.module.sass";
import Rating from "../../Rating";
import Dropdown from "../../Dropdown";

// Helper to format image URL from API
const formatImageUrl = (url) => {
  if (!url) return "/images/content/avatar-1.jpg";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.includes("/") && !url.startsWith("/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }

  if (url.startsWith("/")) {
    return url;
  }

  return "/images/content/avatar-1.jpg";
};

// Format date to relative time
const formatDate = (dateString) => {
  if (!dateString) return "Recently";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recently";
  }
};

const dateOptions = ["Newest", "Popular"];

const List = ({ reviews = [] }) => {
  const [date, setDate] = useState(dateOptions[0]);
  const history = useHistory();

  // Transform API reviews to component format
  const transformedReviews = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return [];
    }
    
    return reviews.map((review) => ({
      author: review.customerName || review.author || "Anonymous",
      avatar: formatImageUrl(review.customerAvatar || review.avatar),
      rating: review.rating || review.ratingScore || "5",
      time: formatDate(review.createdAt || review.reviewDate || review.time),
      content: review.comment || review.content || review.reviewText || "",
    }));
  }, [reviews]);

  // Sort reviews based on selected option
  const sortedReviews = useMemo(() => {
    if (date === "Popular") {
      return [...transformedReviews].sort((a, b) => {
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      });
    }
    return transformedReviews;
  }, [transformedReviews, date]);

  // Don't show dropdown and sorting if no reviews
  if (reviews.length === 0) {
    return (
      <div className={styles.list}>
        <div className={styles.head}>
          <div className={styles.title}>No reviews yet</div>
        </div>
        <div className={styles.empty}>
          <p>This host hasn't received any reviews yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <div className={styles.head}>
        <div className={styles.title}>
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </div>
        {reviews.length > 1 && (
          <Dropdown
            className={styles.dropdown}
            value={date}
            setValue={setDate}
            options={dateOptions}
          />
        )}
      </div>
      <div className={styles.group}>
        {sortedReviews.slice(0, 2).map((review, index) => (
          <div className={styles.item} key={index}>
            <div className={styles.avatar}>
              <img src={review.avatar} alt={review.author} onError={(e) => {
                e.target.src = "/images/content/avatar-1.jpg";
              }} />
            </div>
            <div className={styles.details}>
              <div className={styles.top}>
                <div className={styles.author}>{review.author}</div>
                <Rating
                  className={styles.rating}
                  readonly
                  initialRating={review.rating}
                />
              </div>
              {review.content && (
                <div className={styles.content}>{review.content}</div>
              )}
              <div className={styles.foot}>
                <div className={styles.time}>{review.time}</div>
                <div className={styles.actions}>
                  <button className={styles.action}>Like</button>
                  <button className={styles.action}>Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {sortedReviews.length > 2 && (
        <button 
          className="button-stroke" 
          style={{ marginTop: '32px', width: '100%', borderRadius: '100px', padding: '12px 24px', fontWeight: 700, transition: '0.2s', border: '2px solid #E6E8EC' }}
          onClick={() => history.push("/reviews")}
        >
          See more
        </button>
      )}
    </div>
  );
};

export default List;
