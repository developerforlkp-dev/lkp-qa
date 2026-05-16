import React, { useState, useMemo, useEffect } from "react";
import styles from "./List.module.sass";
import Rating from "../../Rating";
import Dropdown from "../../Dropdown";

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
const PAGE_SIZE = 3;

const getReviewerName = (review) => {
  const candidates = [
    review?.customerName,
    review?.reviewerName,
    review?.author,
    [review?.customerFirstName, review?.customerLastName].filter(Boolean).join(" "),
    [review?.firstName, review?.lastName].filter(Boolean).join(" "),
  ];
  const found = candidates.find((name) => typeof name === "string" && name.trim());
  return found ? found.trim() : "Anonymous";
};

const getInitial = (name) => {
  const safe = String(name || "").trim();
  return safe ? safe.charAt(0).toUpperCase() : "A";
};

const List = ({ reviews = [] }) => {
  const [date, setDate] = useState(dateOptions[0]);
  const [page, setPage] = useState(1);

  // Transform API reviews to component format
  const transformedReviews = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return [];
    }
    
    return reviews.map((review) => ({
      author: getReviewerName(review),
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

  const totalPages = Math.max(1, Math.ceil(sortedReviews.length / PAGE_SIZE));
  const pagedReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedReviews.slice(start, start + PAGE_SIZE);
  }, [page, sortedReviews]);

  useEffect(() => {
    setPage(1);
  }, [date, reviews]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
        {pagedReviews.map((review, index) => (
          <div className={styles.item} key={index}>
            <div className={styles.avatarInitial}>
              {getInitial(review.author)}
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
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className={styles.pageInfo}>
            Page {page} of {totalPages}
          </div>
          <button
            className={styles.pageBtn}
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default List;
