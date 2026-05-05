import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import cn from "classnames";
import styles from "./CommentsProduct.module.sass";
import Profile from "../Profile";
import Icon from "../Icon";
import Rating from "../Rating";
import { useTheme } from "../JUI/Theme";
import { motion, AnimatePresence } from "framer-motion";
import { submitOrderReview } from "../../utils/api";

const CommentsProduct = ({
  className,
  parametersUser,
  socials,
  info,
  buttonText,
  hostData,
  reviews = [],
  listingId,
  type,
  eligibleBookings = [],
  onReviewSubmitted,
}) => {
  const history = useHistory();
  const { tokens: { A, B, M } } = useTheme();

  const handleProfileClick = () => {
    const hostId = hostData?.host?.leadUserId;
    if (hostId) {
      history.push(`/host-profile?id=${hostId}`);
    } else {
      history.push("/host-profile");
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (eligibleBookings.length === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Use the first eligible booking
      const booking = eligibleBookings[0];
      await submitOrderReview(booking.orderId, {
        rating: reviewRating,
        comment: comment.trim(),
        listingId: type === "experience" || !type ? listingId : undefined,
        eventId: type === "event" ? listingId : undefined,
        stayId: type === "stay" ? listingId : undefined,
      });

      setComment("");
      setReviewRating(5);
      setShowForm(false);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract host information from hostData
  const host = hostData?.host || null;
  const statistics = hostData?.statistics || null;

  // Format host name
  const hostName = host
    ? `${host.firstName || ""} ${host.lastName || ""}`.trim() || "Host"
    : "Zoe towne";

  // Get rating and reviews count
  const rating = statistics?.averageRating || 0;
  const reviewCount = statistics?.totalReviews || 0;
  const ratingDisplay = rating > 0 ? rating.toFixed(1) : "0.0";
  const reviewsText = reviewCount === 1 ? "1 review" : `${reviewCount} reviews`;

  // Build parametersUser from host data if available
  const displayParametersUser = hostData
    ? [
      { title: host?.companyName || "Host", icon: "home" },
      {
        title: reviewCount > 0 ? `${reviewCount} reviews` : "No reviews yet",
        icon: "star-outline",
      },
    ]
    : parametersUser;

  // ── Normalise reviews ──
  // API may return { ratingSummary, reviews:[...] } or a plain array or { data: { reviews: [...] } }
  const normalizedReviews = React.useMemo(() => {
    if (!reviews) return [];
    if (Array.isArray(reviews)) return reviews;
    if (Array.isArray(reviews?.reviews)) return reviews.reviews;
    if (Array.isArray(reviews?.data?.reviews)) return reviews.data.reviews;
    if (Array.isArray(reviews?.data)) return reviews.data;
    if (Array.isArray(reviews?.items)) return reviews.items;
    return [];
  }, [reviews]);

  const ratingSummary = React.useMemo(() => {
    if (!reviews || Array.isArray(reviews)) return null;
    const s = reviews.ratingSummary || reviews.summary || reviews.data?.ratingSummary || reviews.data?.summary || null;
    if (!s) return null;

    // Normalize ratingDistribution if it's an object
    if (s.ratingDistribution && typeof s.ratingDistribution === "object" && !Array.isArray(s.ratingDistribution)) {
      const distArray = Object.entries(s.ratingDistribution).map(([rating, count]) => ({
        rating: Number(rating),
        count: Number(count)
      }));
      return { ...s, ratingDistribution: distArray };
    }
    return s;
  }, [reviews]);

  const displayReviews = normalizedReviews.slice(0, 2);
  const hasMore = normalizedReviews.length > 2;

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const diffDays = Math.floor((Date.now() - date) / 86400000);
      if (diffDays < 1) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className={cn(className, styles.section)}>
      <div className={cn("container", styles.container)}>
        {/* ── Left: Meet the Host ── */}
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

        {/* ── Right: Reviews (replaces "More from host") ── */}
        <div className={styles.wrapper}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#777E90", fontWeight: 700 }}>Guest Reviews</span>
              <div style={{ flex: 1, height: 1, background: "#E6E8EC" }} />
              {eligibleBookings.length > 0 && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    background: A, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 100,
                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer"
                  }}
                >
                  Write a Review
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
              <div style={{
                background: A,
                color: "#fff",
                padding: "20px 24px",
                borderRadius: 20,
                textAlign: "center",
                minWidth: 110,
                boxShadow: `0 8px 24px ${A}40`
              }}>
                <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
                  {ratingSummary && Number(ratingSummary.averageRating) > 0 ? Number(ratingSummary.averageRating).toFixed(1) : "0.0"}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 2, margin: "8px 0" }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: 10, color: i < Math.round(ratingSummary?.averageRating || 0) ? "#FFC107" : "rgba(0,151,178,0.15)" }}>★</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>
                  {ratingSummary?.totalReviews || 0} reviews
                </div>
              </div>

              {ratingSummary?.ratingDistribution && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const dist = ratingSummary.ratingDistribution.find(d => d.rating === star) || { count: 0 };
                    const percent = (ratingSummary.totalReviews > 0) ? (dist.count / ratingSummary.totalReviews) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#777E90", width: 8 }}>{star}</span>
                        <div style={{ flex: 1, height: 6, background: `${A}10`, borderRadius: 3, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ height: "100%", background: A, borderRadius: 3 }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: M, width: 20, textAlign: "right", fontWeight: 600 }}>{dist.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ background: "#F4F5F7", padding: 24, borderRadius: 16, marginBottom: 32, border: `1px solid ${B}` }}
              >
                <h4 style={{ fontSize: 18, fontWeight: 700, color: "#23262F", marginBottom: 4 }}>How was it?</h4>
                <p style={{ fontSize: 12, color: M, marginBottom: 20 }}>Share your honest feedback with others.</p>

                <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#777E90", marginBottom: 8, textTransform: "uppercase" }}>Rating</p>
                    <Rating rating={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#777E90", marginBottom: 8, textTransform: "uppercase" }}>Comment</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about your experience..."
                      required
                      style={{
                        width: "100%", height: 80, background: "#fff", border: `1px solid ${B}`,
                        borderRadius: 12, padding: 12, fontSize: 13, color: "#23262F", resize: "none", outline: "none"
                      }}
                    />
                  </div>
                  {error && <p style={{ color: "#FF4D4D", fontSize: 11, fontWeight: 600 }}>{error}</p>}
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        background: A, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 100,
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.7 : 1
                      }}
                    >
                      {isSubmitting ? "Posting..." : "Post"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{ background: "none", border: `1px solid ${B}`, padding: "10px 20px", borderRadius: 100, fontSize: 11, fontWeight: 700, color: "#23262F", textTransform: "uppercase", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>


          {displayReviews.length === 0 ? (
            <div style={{
              padding: "48px 0",
              textAlign: "center",
              background: `${A}05`,
              borderRadius: 24,
              border: `1px dashed ${A}30`,
              marginTop: 24
            }}>
              <Icon name="star-outline" size="32" style={{ color: A, opacity: 0.5, marginBottom: 16 }} />
              <p style={{ fontSize: 15, color: M, margin: 0, fontWeight: 500 }}>No testimonials shared yet.</p>
              <p style={{ fontSize: 12, color: M, opacity: 0.7, marginTop: 8 }}>Be the first to share your experience!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {displayReviews.map((rev, i) => {
                const author =
                  rev.customerName || rev.author || "Guest";
                const comment =
                  rev.comment || rev.content || rev.reviewText || "";
                const reviewRating = Number(
                  rev.rating || rev.ratingScore || 0
                );
                const time = formatDate(
                  rev.createdAt || rev.reviewDate || rev.time
                );

                return (
                  <div
                    key={i}
                    style={{
                      padding: "20px 0",
                      borderBottom:
                        i < displayReviews.length - 1
                          ? "1px solid #E6E8EC"
                          : "none",
                    }}
                  >
                    {/* Row: avatar + name + stars + time */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: comment ? 10 : 0,
                      }}
                    >
                      {/* Avatar initial circle */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: A,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 700,
                          flexShrink: 0,
                          boxShadow: `0 4px 12px ${A}30`
                        }}
                      >
                        {author[0].toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#23262F",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {author}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span style={{ fontSize: 12, letterSpacing: 1 }}>
                            {[...Array(5)].map((_, si) => (
                              <span
                                key={si}
                                style={{
                                  color:
                                    si < reviewRating ? "#FFC107" : "#D1D5DB",
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </span>
                          <span
                            style={{ fontSize: 12, color: "#777E90" }}
                          >
                            {time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comment text */}
                    {comment && (
                      <p
                        style={{
                          fontSize: 14,
                          color: "#353945",
                          lineHeight: 1.6,
                          margin: 0,
                          paddingLeft: 48,
                        }}
                      >
                        {comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* See more – only appears when there are more than 2 reviews */}
          {hasMore && (
            <button
              className="button-stroke"
              style={{
                marginTop: 32,
                width: "100%",
                borderRadius: 12,
                padding: "16px 24px",
                fontWeight: 700,
                fontSize: 14,
                color: A,
                border: `2px solid ${B}`,
                background: "transparent",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${A}10`;
                e.currentTarget.style.borderColor = A;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = B;
              }}
              onClick={() => {
                const targetId = listingId || "";
                if (type === "event") {
                  history.push(`/reviews/event/${targetId}`);
                } else if (type === "stay") {
                  history.push(`/reviews/stay/${targetId}`);
                } else {
                  history.push(`/reviews/listing/${targetId}`);
                }
              }}
            >
              See More
              <Icon name="arrow-next" size="16" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsProduct;
