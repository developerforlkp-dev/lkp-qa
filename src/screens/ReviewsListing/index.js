import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import styles from "./ReviewsListing.module.sass";
import Control from "../../components/Control";
import Icon from "../../components/Icon";
import {
  getEventDetails,
  getEventReviews,
  getListing,
  getListingReviews,
  getStayDetails,
  getStayReviews,
} from "../../utils/api";

const asNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getLocationText = (item) => {
  if (!item || typeof item !== "object") return "Location unavailable";
  const city = item.city || item.locationCity || item.town || "";
  const state = item.state || item.region || "";
  const country = item.country || "";
  const fallback =
    item.locationName ||
    item.location ||
    item.addressLine ||
    item.fullAddress ||
    item.address;
  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : (fallback || "Location unavailable");
};

const getCoverPhoto = (item) => {
  if (!item || typeof item !== "object") return "/images/content/slider-pic-1.jpg";
  return (
    item.coverPhotoUrl ||
    item.coverImageUrl ||
    item.imageUrl ||
    item.photoUrl ||
    item.thumbnailUrl ||
    item.bannerImageUrl ||
    item.listingMedia?.[0]?.url ||
    item.listingMedia?.[0]?.blobName ||
    item.images?.[0]?.url ||
    item.images?.[0] ||
    "/images/content/slider-pic-1.jpg"
  );
};

const toReviewsArray = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.reviews)) return payload.reviews;
  if (Array.isArray(payload.data?.reviews)) return payload.data.reviews;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const getSummary = (payload, reviewsArray) => {
  const summary =
    payload?.ratingSummary ||
    payload?.summary ||
    payload?.data?.ratingSummary ||
    payload?.data?.summary ||
    {};
  const avg =
    asNum(summary.averageRating) ??
    asNum(summary.average_rating) ??
    asNum(payload?.averageRating) ??
    asNum(payload?.average_rating) ??
    asNum(payload?.avgRating) ??
    asNum(payload?.avg_rating);
  const total =
    asNum(summary.totalReviews) ??
    asNum(summary.total_reviews) ??
    asNum(payload?.totalReviews) ??
    asNum(payload?.total_reviews) ??
    reviewsArray.length;

  const derivedAvg = (() => {
    if (avg != null) return avg;
    if (!reviewsArray.length) return 0;
    const ratings = reviewsArray
      .map((r) => asNum(r?.rating ?? r?.reviewRating ?? r?.stars))
      .filter((r) => r != null);
    if (!ratings.length) return 0;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  })();

  return { averageRating: derivedAvg, totalReviews: total || 0 };
};

const ReviewsListing = () => {
  const history = useHistory();
  const { type = "listing", id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entity, setEntity] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const normalizedType = String(type || "listing").toLowerCase();
        const isEvent = normalizedType === "event";
        const isStay = normalizedType === "stay";

        const [detailRes, reviewsRes] = await Promise.all([
          isEvent
            ? getEventDetails(id)
            : isStay
              ? getStayDetails(id)
              : getListing(id),
          isEvent
            ? getEventReviews(id)
            : isStay
              ? getStayReviews(id)
              : getListingReviews(id),
        ]);

        if (!mounted) return;
        const detailObj = detailRes?.data || detailRes || {};
        const reviewsArray = toReviewsArray(reviewsRes);
        setEntity(detailObj);
        setReviews(reviewsArray);
        setSummary(getSummary(reviewsRes, reviewsArray));
        setPage(1);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load reviews.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (id) {
      load();
    } else {
      setLoading(false);
      setError("Missing listing identifier.");
    }
    return () => {
      mounted = false;
    };
  }, [type, id]);

  const title = entity?.title || entity?.listingTitle || entity?.name || "Listing Reviews";
  const locationText = getLocationText(entity);
  const coverPhoto = getCoverPhoto(entity);
  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const start = (page - 1) * pageSize;
  const pagedReviews = reviews.slice(start, start + pageSize);

  const breadcrumbs = useMemo(() => ([
    { title: title.length > 40 ? `${title.slice(0, 40)}...` : title },
    { title: "Reviews" },
  ]), [title]);

  return (
    <div className={cn("section-mb80", styles.section)}>
      <div className={cn("container", styles.container)}>
        <Control className={styles.control} breadcrumbs={breadcrumbs} />
        <div className={styles.card}>
          <div className={styles.coverWrap}>
            <img src={coverPhoto} alt={title} className={styles.cover} />
          </div>

          <div className={styles.head}>
            <div>
              <h2 className={styles.title}>{title}</h2>
              <div className={styles.location}>
                <Icon name="marker" size="16" />
                <span>{locationText}</span>
              </div>
            </div>
            <div className={styles.ratingBubble}>
              <div className={styles.ratingValue}>{Number(summary.averageRating || 0).toFixed(1)}</div>
              <div className={styles.ratingMeta}>
                <Icon name="star" size="16" />
                <span>{summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"}</span>
              </div>
            </div>
          </div>

          {loading && <div className={styles.message}>Loading reviews...</div>}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && reviews.length === 0 && (
            <div className={styles.message}>No reviews yet for this listing.</div>
          )}

          {!loading && !error && reviews.length > 0 && (
            <>
              <div className={styles.list} key={`page-${page}`}>
                {pagedReviews.map((rev, idx) => {
                  const globalIdx = start + idx;
                  const sideClass = globalIdx % 2 === 0 ? styles.itemLeft : styles.itemRight;
                  const name = rev?.customerName || rev?.userName || rev?.author || rev?.name || "Guest User";
                  const comment = rev?.comment || rev?.review || rev?.text || "No comment provided.";
                  const rating = Number(rev?.rating ?? rev?.reviewRating ?? rev?.stars ?? 0);
                  const when = rev?.createdAt || rev?.reviewDate || rev?.time;
                  return (
                    <div
                      key={`${name}-${globalIdx}`}
                      className={cn(styles.item, sideClass)}
                      style={{ animationDelay: `${Math.min(idx * 70, 350)}ms` }}
                    >
                      <div className={styles.avatar}>{String(name).charAt(0).toUpperCase()}</div>
                      <div className={styles.content}>
                        <div className={styles.rowTop}>
                          <div className={styles.name}>{name}</div>
                          <div className={styles.time}>{when ? moment(when).format("MMM YYYY") : "Recently"}</div>
                        </div>
                        <div className={styles.rowRating}>
                          <Icon name="star" size="14" />
                          <span>{Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}</span>
                        </div>
                        <p className={styles.comment}>&ldquo;{comment}&rdquo;</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <div className={styles.pageDots}>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          type="button"
                          className={cn(styles.pageDot, { [styles.pageDotActive]: p === page })}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          <button className={styles.backBtn} onClick={() => history.goBack()}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsListing;
