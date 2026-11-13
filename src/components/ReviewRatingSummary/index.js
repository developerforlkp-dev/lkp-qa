import React, { useMemo } from "react";
import { Star } from "lucide-react";

const firstNumber = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value >= 0);

const ReviewRatingSummary = ({ reviews = [], summary, averageRating, totalReviews, accentColor = "#009DB8", foregroundColor = "#111827", mutedColor = "#64748B", borderColor = "#E2E8F0", backgroundColor = "#FFFFFF", style }) => {
  const values = useMemo(() => {
    const reviewList = Array.isArray(reviews) ? reviews : [];
    const data = summary?.ratingSummary || summary?.reviewSummary || summary?.summary || summary?.data?.ratingSummary || summary || {};
    const explicitAverage = firstNumber(averageRating, data?.averageRating, data?.average, data?.rating, data?.averageRatingValue);
    const ratings = reviewList.map((review) => firstNumber(review?.rating, review?.averageRating, review?.stars)).filter((value) => Number.isFinite(value) && value > 0);
    const calculatedAverage = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : undefined;
    const count = firstNumber(totalReviews, data?.totalReviews, data?.reviewCount, data?.totalCount, data?.count);
    return { rating: explicitAverage > 0 ? Math.min(explicitAverage, 5) : calculatedAverage, count: count > 0 ? count : reviewList.length };
  }, [averageRating, reviews, summary, totalReviews]);

  if (!Number.isFinite(values.rating) || values.rating <= 0) return null;
  const roundedRating = Math.round(values.rating);

  return (
    <div aria-label={`${values.rating.toFixed(1)} out of 5 from ${values.count} reviews`} style={{ width: "100%", maxWidth: 240, boxSizing: "border-box", margin: "0 auto 24px", padding: "16px 24px", border: `1px solid ${borderColor}`, borderRadius: 18, background: backgroundColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, textAlign: "center", ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", color: foregroundColor, lineHeight: 1 }}>
        <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em" }}>{values.rating.toFixed(1)}</span>
        <span style={{ marginLeft: 4, fontSize: 15, fontWeight: 700, color: mutedColor }}>/5</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 3 }} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < roundedRating;
          return <Star key={index} size={17} color={filled ? "#F59E0B" : borderColor} fill={filled ? "#F59E0B" : "transparent"} />;
        })}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: mutedColor }}>{values.count} {values.count === 1 ? "Review" : "Reviews"}</span>
      <span aria-hidden="true" style={{ width: 28, height: 2, borderRadius: 999, background: accentColor, opacity: 0.8 }} />
    </div>
  );
};

export default ReviewRatingSummary;
