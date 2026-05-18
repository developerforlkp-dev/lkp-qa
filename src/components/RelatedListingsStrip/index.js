import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getFilteredListings } from "../../utils/api";
import { buildExperienceUrl } from "../../utils/experienceUrl";

const formatImageUrl = (url) => {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  const normalized = raw.replaceAll("%2F", "/").replace(/\\/g, "/");
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${encodeURI(normalized)}`;
};

const getImageUrl = (item) => {
  const candidates = [
    item?.coverPhotoUrl,
    item?.coverImageUrl,
    item?.coverPhoto,
    item?.thumbnailUrl,
    item?.imageUrl,
    item?.listingMedia?.[0]?.url,
    item?.listingMedia?.[0]?.fileUrl,
    item?.media?.[0]?.url,
    item?.images?.[0]?.url,
    item?.images?.[0],
  ];
  const found = candidates.find((v) => v != null && String(v).trim());
  return formatImageUrl(found) || "https://picsum.photos/seed/lkp-related/640/420";
};

const getTitle = (item) =>
  item?.primaryCategoryName ||
  item?.categoryName ||
  item?.title ||
  item?.name ||
  item?.propertyName ||
  item?.menuName ||
  item?.placeName ||
  "Listing";

const getListingId = (item) =>
  item?.listingId ?? item?.listing_id ?? item?.id ?? item?._id;

const getTargetId = (item, businessInterestId) => {
  if (businessInterestId === 2) return item?.eventId ?? item?.id ?? getListingId(item);
  if (businessInterestId === 3) return item?.stayId ?? item?.id ?? getListingId(item);
  if (businessInterestId === 4) return item?.placeId ?? item?.id ?? getListingId(item);
  if (businessInterestId === 5) return item?.foodMenuId ?? item?.foodId ?? item?.id ?? getListingId(item);
  return getListingId(item);
};

const getDetailPath = (item, businessInterestId) => {
  const targetId = getTargetId(item, businessInterestId);
  if (!targetId) return "/listings";
  if (businessInterestId === 2) return `/event-details?id=${targetId}`;
  if (businessInterestId === 3) return `/stay-details?id=${targetId}`;
  if (businessInterestId === 4) return `/place-details?id=${targetId}`;
  if (businessInterestId === 5) return `/food-details?id=${targetId}`;
  return buildExperienceUrl(getTitle(item), targetId);
};

export default function RelatedListingsStrip({
  businessInterestId,
  primaryCategoryId,
  currentListingId,
  fallbackLocationValues = [],
  fallbackTagValues = [],
  fallbackSpecialLabelValues = [],
  title = "More in this category",
  limit = 12,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const railRef = useRef(null);
  const pauseAutoScrollRef = useRef(false);
  const autoTimerRef = useRef(null);
  const [navPulse, setNavPulse] = useState({ left: false, right: false });
  const debugAutoScroll = process.env.NODE_ENV !== "production";

  const normalizeLoopPosition = () => {
    const el = railRef.current;
    if (!el) return;
    const setWidth = el.scrollWidth / 3;
    if (!setWidth || !Number.isFinite(setWidth)) return;

    // Keep viewport inside middle copy so both left and right feel circular.
    if (el.scrollLeft < setWidth * 0.5) {
      if (debugAutoScroll) {
        console.log("[RelatedListingsStrip][normalize] shift +setWidth", {
          leftBefore: el.scrollLeft,
          setWidth,
        });
      }
      el.scrollLeft += setWidth;
    } else if (el.scrollLeft > setWidth * 2.5) {
      if (debugAutoScroll) {
        console.log("[RelatedListingsStrip][normalize] shift -setWidth", {
          leftBefore: el.scrollLeft,
          setWidth,
        });
      }
      el.scrollLeft -= setWidth;
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!businessInterestId) {
        setItems([]);
        return;
      }

      const resolvedCategoryId =
        typeof primaryCategoryId === "object"
          ? (primaryCategoryId?.id ?? primaryCategoryId?.categoryId ?? primaryCategoryId?.value)
          : primaryCategoryId;

      const hasCategory = resolvedCategoryId !== undefined && resolvedCategoryId !== null && String(resolvedCategoryId).trim() !== "";
      const firstLocation = Array.isArray(fallbackLocationValues) ? fallbackLocationValues.find(Boolean) : fallbackLocationValues;
      const firstTag = Array.isArray(fallbackTagValues) ? fallbackTagValues.find(Boolean) : fallbackTagValues;
      const firstSpecialLabel = Array.isArray(fallbackSpecialLabelValues) ? fallbackSpecialLabelValues.find(Boolean) : fallbackSpecialLabelValues;

      const basePayload = {
        businessInterestId,
        limit,
        offset: 0,
      };

      const requestAttempts = hasCategory
        ? [{ ...basePayload, categoryType: "Primary Category", categoryValues: [resolvedCategoryId], _fallbackMode: "Primary Category" }]
        : [
            firstLocation ? { ...basePayload, categoryType: "Locations", categoryValues: [firstLocation], _fallbackMode: "Locations" } : null,
            firstTag ? { ...basePayload, categoryType: "Tags", categoryValues: [firstTag], _fallbackMode: "Tags" } : null,
            firstSpecialLabel ? { ...basePayload, categoryType: "Special Labels", categoryValues: [firstSpecialLabel], _fallbackMode: "Special Labels" } : null,
            { ...basePayload, _fallbackMode: "BusinessInterestOnly" },
          ].filter(Boolean);
      try {
        setLoading(true);
        let resultListings = [];
        let usedMode = "none";
        for (const attempt of requestAttempts) {
          const { _fallbackMode, ...apiPayload } = attempt;
          console.log("[RelatedListingsStrip] Calling /api/public/listings/filter", {
            ...apiPayload,
            mode: _fallbackMode,
          });
          const response = await getFilteredListings(apiPayload);
          const listings = Array.isArray(response?.listings) ? response.listings : [];
          if (listings.length > 0) {
            resultListings = listings;
            usedMode = _fallbackMode;
            break;
          }
        }
        if (!mounted) return;
        console.log("[RelatedListingsStrip] Filter API success", {
          businessInterestId,
          primaryCategoryId: resolvedCategoryId ?? null,
          mode: usedMode,
          received: resultListings.length,
        });
        setItems(resultListings);
      } catch (e) {
        console.error("[RelatedListingsStrip] Filter API error", {
          businessInterestId,
          primaryCategoryId: resolvedCategoryId ?? null,
          message: e?.message,
          response: e?.response?.data,
        });
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [businessInterestId, primaryCategoryId, limit]);

  const filteredItems = useMemo(() => {
    const current = currentListingId == null ? null : String(currentListingId);
    return items.filter((item) => {
      if (current == null) return true;
      return String(getTargetId(item, businessInterestId)) !== current;
    });
  }, [items, currentListingId, businessInterestId]);

  const loopItems = useMemo(() => {
    if (filteredItems.length === 0) return [];
    // Triple buffer for seamless infinite loop.
    return [...filteredItems, ...filteredItems, ...filteredItems];
  }, [filteredItems]);

  useEffect(() => {
    const el = railRef.current;
    if (debugAutoScroll) {
      console.log("[RelatedListingsStrip][effect-enter]", {
        hasElement: !!el,
        filteredItemsLength: filteredItems.length,
      });
    }
    if (!el || filteredItems.length <= 1) {
      if (debugAutoScroll) {
        console.log("[RelatedListingsStrip][effect-exit-early]", {
          reason: !el ? "no-rail-element" : "not-enough-items",
          hasElement: !!el,
          filteredItemsLength: filteredItems.length,
        });
      }
      return undefined;
    }
    const step = 1;
    const intervalMs = 15;
    pauseAutoScrollRef.current = false;

    // Start from middle copy so we can move left/right infinitely.
    const oneSetWidth = el.scrollWidth / 3;
    if (oneSetWidth > 0) {
      el.scrollLeft = oneSetWidth;
      if (debugAutoScroll) {
        console.log("[RelatedListingsStrip][init]", {
          oneSetWidth,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          left: el.scrollLeft,
          canScrollX: el.scrollWidth > el.clientWidth,
        });
      }
    }

    const startAuto = () => {
      if (autoTimerRef.current) window.clearInterval(autoTimerRef.current);
      let debugTickCount = 0;
      if (debugAutoScroll) {
        console.log("[RelatedListingsStrip][startAuto]", {
          intervalMs,
          step,
          left: el.scrollLeft,
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          canScrollX: el.scrollWidth > el.clientWidth,
        });
      }
      autoTimerRef.current = window.setInterval(() => {
        if (pauseAutoScrollRef.current) return;
        if (!el) return;
        const setWidth = el.scrollWidth / 3;
        if (setWidth <= 0) return;
        const before = el.scrollLeft;
        el.scrollLeft = el.scrollLeft + step;
        normalizeLoopPosition();
        if (el.scrollTop !== 0) el.scrollTop = 0;

        if (debugAutoScroll && debugTickCount % 20 === 0) {
          console.log("[RelatedListingsStrip][tick]", {
            leftBefore: before,
            leftAfter: el.scrollLeft,
            step,
            paused: pauseAutoScrollRef.current,
            clientWidth: el.clientWidth,
            scrollWidth: el.scrollWidth,
            canScrollX: el.scrollWidth > el.clientWidth,
            overflowX: window.getComputedStyle(el).overflowX,
          });
        }
        debugTickCount += 1;
      }, intervalMs);
    };

    startAuto();
    if (debugAutoScroll) {
      window.__lkpRelatedAutoScroll = {
        start: () => startAuto(),
        stop: () => {
          if (autoTimerRef.current) {
            window.clearInterval(autoTimerRef.current);
            autoTimerRef.current = null;
          }
        },
        status: () => ({
          paused: pauseAutoScrollRef.current,
          left: el.scrollLeft,
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          canScrollX: el.scrollWidth > el.clientWidth,
        }),
      };
      console.log("[RelatedListingsStrip][debug-helper] window.__lkpRelatedAutoScroll ready");
    }

    const resizeObserver = new ResizeObserver(() => {
      // Restart when dimensions/content width change to keep autoplay alive.
      if (debugAutoScroll) {
        console.log("[RelatedListingsStrip][resize]", {
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          left: el.scrollLeft,
          canScrollX: el.scrollWidth > el.clientWidth,
        });
      }
      startAuto();
    });
    resizeObserver.observe(el);

    return () => {
      if (autoTimerRef.current) {
        window.clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, [loading, loopItems.length, filteredItems.length]);

  if (loading || filteredItems.length === 0) return null;

  const scrollByAmount = 320;
  const scrollLeft = () => {
    const el = railRef.current;
    if (!el) return;
    normalizeLoopPosition();
    setNavPulse({ left: true, right: false });
    pauseAutoScrollRef.current = true;
    el.scrollBy({ left: -scrollByAmount, top: 0, behavior: "smooth" });
    window.setTimeout(() => { normalizeLoopPosition(); pauseAutoScrollRef.current = false; }, 900);
    window.setTimeout(() => { setNavPulse((p) => ({ ...p, left: false })); }, 240);
  };
  const scrollRight = () => {
    const el = railRef.current;
    if (!el) return;
    normalizeLoopPosition();
    setNavPulse({ left: false, right: true });
    pauseAutoScrollRef.current = true;
    el.scrollBy({ left: scrollByAmount, top: 0, behavior: "smooth" });
    window.setTimeout(() => { normalizeLoopPosition(); pauseAutoScrollRef.current = false; }, 900);
    window.setTimeout(() => { setNavPulse((p) => ({ ...p, right: false })); }, 240);
  };

  return (
    <section style={{ padding: "72px 28px", background: "var(--W, #ffffff)" }}>
      <style>{`
        .related-strip-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .related-strip-scroll::-webkit-scrollbar {
          display: none;
        }
        .related-nav-btn {
          transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
        }
        .related-nav-btn:active {
          transform: scale(0.92);
        }
        .related-nav-btn.pulse {
          transform: scale(1.08);
          background-color: rgba(0, 151, 178, 0.08);
          box-shadow: 0 0 0 6px rgba(0, 151, 178, 0.08);
        }
      `}</style>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--FG, #131313)" }}>{title}</h3>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Scroll left"
              className={`related-nav-btn ${navPulse.left ? "pulse" : ""}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid var(--B, #e8e8e8)",
                background: "var(--W, #fff)",
                color: "var(--FG, #131313)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Scroll right"
              className={`related-nav-btn ${navPulse.right ? "pulse" : ""}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid var(--B, #e8e8e8)",
                background: "var(--W, #fff)",
                color: "var(--FG, #131313)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ›
            </button>
          </div>
        </div>
        <div
          ref={railRef}
          onScroll={normalizeLoopPosition}
          className="related-strip-scroll"
          style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 8 }}
        >
          <div style={{ display: "flex", gap: 22, minWidth: "max-content" }}>
            {loopItems.map((item, idx) => (
              <Link
                key={`${getTargetId(item, businessInterestId) || idx}-${idx}`}
                to={getDetailPath(item, businessInterestId)}
                style={{ textDecoration: "none", color: "inherit", width: 260, flex: "0 0 auto" }}
              >
                <div
                  style={{
                    border: "1px solid var(--B, #e8e8e8)",
                    borderRadius: 14,
                    padding: 6,
                    background: "var(--W, #fff)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                >
                  <img
                    src={getImageUrl(item)}
                    alt={getTitle(item)}
                    style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 10, display: "block", background: "#f3f3f3" }}
                  />
                </div>
                <p style={{ margin: "12px 4px 0", fontSize: 17, fontWeight: 600, color: "var(--FG, #161616)" }}>
                  {getTitle(item)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
