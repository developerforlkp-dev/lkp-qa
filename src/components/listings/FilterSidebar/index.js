import React, { useEffect, useMemo, useRef, useState } from "react";
import cn from "classnames";
import styles from "./FilterSidebar.module.sass";
import { Range, getTrackBackground } from "react-range";
import Checkbox from "../../Checkbox";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";

const propertyTypes = [
  { id: "entire_place", label: "Entire place" },
  { id: "private_room", label: "Private room" },
  { id: "shared_room", label: "Shared room" },
  { id: "hotel", label: "Hotel" },
  { id: "apartment", label: "Apartment" },
  { id: "house", label: "House" },
];

const amenities = [
  { id: "wifi", label: "WiFi" },
  { id: "kitchen", label: "Kitchen" },
  { id: "parking", label: "Parking" },
  { id: "pool", label: "Pool" },
  { id: "air_conditioning", label: "Air Conditioning" },
  { id: "heating", label: "Heating" },
  { id: "tv", label: "TV" },
  { id: "washer", label: "Washer" },
];

const ratings = [
  { id: 5, label: "5 stars" },
  { id: 4, label: "4+ stars" },
  { id: 3, label: "3+ stars" },
];

const defaultPrimaryCategories = [
  { key: "primary-1", label: "Adventure", value: 1, categoryType: "Primary Category" },
];

const defaultSecondaryCategories = [
  { key: "sub-1", label: "Offbeat", value: 1, categoryType: "Sub Category" },
];

const defaultTags = ["Trending", "Weekend", "Family"];
const defaultSpecialLabels = ["Featured"];

const toText = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if (typeof value.label === "string") return value.label;
    if (typeof value.name === "string") return value.name;
    if (typeof value.value === "string" || typeof value.value === "number") return String(value.value);
  }
  return "";
};

const formatSortLabel = (value) => {
  const raw = toText(value).trim();
  if (!raw) return "";
  return raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const CollapsibleChipSection = ({ label, options, activeKeys, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateOverflow = () => {
      const el = containerRef.current;
      if (!el) {
        setHasOverflow(false);
        return;
      }

      const rowTops = Array.from(el.children)
        .map((child) => child.offsetTop)
        .filter((top, idx, arr) => arr.indexOf(top) === idx)
        .sort((a, b) => a - b);

      setHasOverflow(rowTops.length > 3);
    };

    const rafId = requestAnimationFrame(updateOverflow);
    window.addEventListener("resize", updateOverflow);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [options]);

  useEffect(() => {
    if (!hasOverflow && isExpanded) {
      setIsExpanded(false);
    }
  }, [hasOverflow, isExpanded]);

  return (
    <div className={styles.section}>
      <div className={styles.label}>{label}</div>
      <div
        ref={containerRef}
        className={cn(styles.categoriesScroll, {
          [styles.categoriesScrollCollapsed]: hasOverflow && !isExpanded,
        })}
      >
        {options.map((option) => (
          <button
            key={option.key}
            className={cn(styles.categoryChip, {
              [styles.active]: Array.isArray(activeKeys) && activeKeys.includes(option.key),
            })}
            onClick={() => onSelect(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {hasOverflow && (
        <button
          type="button"
          className={styles.toggleMoreLess}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

const FilterSidebar = ({
  filters,
  onFilterChange,
  onReset,
  sorting,
  setSorting,
  sortingOptions,
  businessInterest,
  businessInterestFilters,
}) => {
  const normalizedInterest = String(businessInterest || "").toUpperCase();
  const isStayInterest = normalizedInterest === "STAY" || normalizedInterest === "STAYS";
  const isEventInterest = normalizedInterest === "EVENT" || normalizedInterest === "EVENTS";
  const isExperienceInterest = normalizedInterest === "EXPERIENCE" || normalizedInterest === "EXPERIENCES";
  const isExpEventOrStay = isStayInterest || isEventInterest || isExperienceInterest;
  const isPriceRangeEnabled = false;

  const primaryCategoryOptions = useMemo(() => {
    const primary = Array.isArray(businessInterestFilters?.primaryCategories)
      ? businessInterestFilters.primaryCategories.map((item) => ({
          key: `primary-${item.id}`,
          label: item.name,
          value: item.id,
          categoryType: "Primary Category",
        }))
      : [];
    const normalized = primary
      .map((item) => ({
        ...item,
        label: toText(item.label),
      }))
      .filter((item) => item.label);
    return normalized.length > 0 ? normalized : defaultPrimaryCategories;
  }, [businessInterestFilters]);

  const secondaryCategoryOptions = useMemo(() => {
    const secondary = Array.isArray(businessInterestFilters?.secondaryCategories)
      ? businessInterestFilters.secondaryCategories.map((item) => ({
          key: `secondary-${item.id}`,
          label: item.name,
          value: item.id,
          categoryType: "Sub Category",
        }))
      : [];
    const normalized = secondary
      .map((item) => ({
        ...item,
        label: toText(item.label),
      }))
      .filter((item) => item.label);
    return normalized.length > 0 ? normalized : defaultSecondaryCategories;
  }, [businessInterestFilters]);

  const tagOptions = useMemo(() => {
    const dynamicTags = Array.isArray(businessInterestFilters?.tags)
      ? businessInterestFilters.tags
          .map((tag) => {
            const name = typeof tag === "string" ? tag : tag?.name;
            return name
              ? {
                  key: `tag-${name}`,
                  label: name,
                  value: name,
                  categoryType: "Tags",
                }
              : null;
          })
          .filter(Boolean)
      : [];
    return (dynamicTags.length > 0
      ? dynamicTags
      : defaultTags.map((tag) => ({
          key: `tag-${tag}`,
          label: tag,
          value: tag,
          categoryType: "Tags",
        })))
      .map((item) => ({
        ...item,
        label: toText(item.label),
      }))
      .filter((item) => item.label);
  }, [businessInterestFilters]);

  const specialLabelOptions = useMemo(() => {
    const dynamicLabels = Array.isArray(businessInterestFilters?.specialLabels)
      ? businessInterestFilters.specialLabels
          .map((label) => {
            const id = typeof label === "object" ? label?.id : null;
            const name = typeof label === "string" ? label : label?.name;
            return name
              ? {
                  key: `special-${id ?? name}`,
                  label: name,
                  value: id ?? name,
                  categoryType: "Special Labels",
                }
              : null;
          })
          .filter(Boolean)
      : [];
    return (dynamicLabels.length > 0
      ? dynamicLabels
      : defaultSpecialLabels.map((label) => ({
          key: `special-${label}`,
          label,
          value: label,
          categoryType: "Special Labels",
        })))
      .map((item) => ({
        ...item,
        label: toText(item.label),
      }))
      .filter((item) => item.label);
  }, [businessInterestFilters]);
  const [priceValues, setPriceValues] = useState([
    filters.priceRange?.min || 0,
    filters.priceRange?.max || 10000,
  ]);

  const sortDisplayPairs = useMemo(() => (
    Array.isArray(sortingOptions)
      ? sortingOptions
          .map((option) => {
            const raw = toText(option).trim();
            if (!raw) return null;
            return { raw, display: formatSortLabel(raw) };
          })
          .filter(Boolean)
      : []
  ), [sortingOptions]);

  const displayToRawSort = useMemo(() => (
    sortDisplayPairs.reduce((acc, item) => {
      acc[item.display] = item.raw;
      return acc;
    }, {})
  ), [sortDisplayPairs]);

  const displaySortingOptions = useMemo(
    () => sortDisplayPairs.map((item) => item.display),
    [sortDisplayPairs]
  );

  const displaySortingValue = useMemo(() => {
    const raw = toText(sorting).trim();
    return formatSortLabel(raw);
  }, [sorting]);

  const handleSortingChange = (selectedDisplayValue) => {
    const mappedRaw = displayToRawSort[selectedDisplayValue] || selectedDisplayValue;
    setSorting(mappedRaw);
  };

  const handlePriceChange = (values) => {
    setPriceValues(values);
    onFilterChange("priceRange", { min: values[0], max: values[1] });
  };

  const handlePropertyTypeChange = (id) => {
    const current = filters.propertyTypes || [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onFilterChange("propertyTypes", updated);
  };

  const handleAmenityChange = (id) => {
    const current = filters.amenities || [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onFilterChange("amenities", updated);
  };

  const handleRatingChange = (rating) => {
    const current = filters.ratings || [];
    const updated = current.includes(rating) ? [] : [rating];
    onFilterChange("ratings", updated);
  };

  const handleApiFilterChange = (option) => {
    const current = filters.apiCategoryFilter || null;
    const isSameType = current?.categoryType === option.categoryType;

    let nextFilter;

    if (!current || !isSameType) {
      nextFilter = {
        activeKeys: [option.key],
        selectedCategoryLabels: [option.label],
        selectedCategoryLabel: option.label,
        categoryType: option.categoryType,
        categoryValues: [option.value],
      };
    } else {
      const currentKeys = Array.isArray(current.activeKeys)
        ? current.activeKeys
        : (current.activeKey ? [current.activeKey] : []);
      const currentLabels = Array.isArray(current.selectedCategoryLabels)
        ? current.selectedCategoryLabels
        : (current.selectedCategoryLabel ? [current.selectedCategoryLabel] : []);
      const currentValues = Array.isArray(current.categoryValues) ? current.categoryValues : [];

      const isSelected = currentKeys.includes(option.key);
      const nextKeys = isSelected
        ? currentKeys.filter((key) => key !== option.key)
        : [...currentKeys, option.key];
      const nextLabels = isSelected
        ? currentLabels.filter((label) => label !== option.label)
        : [...currentLabels, option.label];
      const nextValues = isSelected
        ? currentValues.filter((value) => String(value) !== String(option.value))
        : [...currentValues, option.value];

      if (nextValues.length === 0) {
        nextFilter = null;
      } else {
        nextFilter = {
          activeKeys: nextKeys,
          selectedCategoryLabels: nextLabels,
          selectedCategoryLabel: nextLabels.join(", "),
          categoryType: option.categoryType,
          categoryValues: nextValues,
        };
      }
    }

    console.log("[FilterSidebar] Category filter selected:", nextFilter);
    onFilterChange("apiCategoryFilter", nextFilter);
  };

  const handleDateFieldChange = (key, value) => {
    const current = filters.dateRange || { startDate: "", endDate: "" };
    onFilterChange("dateRange", {
      ...current,
      [key]: value,
    });
  };

  const minPrice = 0;
  const maxPrice = 10000;
  const stepPrice = 50;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h3 className={cn("h4", styles.title)}>Filters</h3>
        <button className={styles.resetButton} onClick={onReset}>
          <Icon name="close-circle-fill" size="20" />
          Reset
        </button>
      </div>

      <div className={styles.content}>
        {/* Sort Dropdown */}
        {sortingOptions && sortingOptions.length > 0 && (
          <div className={styles.section}>
            <div className={styles.label}>Sort by</div>
            <Dropdown
              className={styles.sortDropdown}
              value={displaySortingValue}
              setValue={handleSortingChange}
              options={displaySortingOptions}
            />
          </div>
        )}

        {/* Price Range */}
        {isPriceRangeEnabled && isExpEventOrStay && (
          <div className={styles.section}>
            <div className={styles.label}>Price range</div>
            <div className={styles.priceRange}>
              <Range
                values={priceValues}
                step={stepPrice}
                min={minPrice}
                max={maxPrice}
                onChange={handlePriceChange}
                renderTrack={({ props, children }) => (
                  <div
                    onMouseDown={props.onMouseDown}
                    onTouchStart={props.onTouchStart}
                    style={{
                      ...props.style,
                      height: "36px",
                      display: "flex",
                      width: "100%",
                    }}
                  >
                    <div
                      ref={props.ref}
                      style={{
                        height: "8px",
                        width: "100%",
                        borderRadius: "4px",
                        background: getTrackBackground({
                          values: priceValues,
                          colors: ["#B1B5C3", "#3772FF", "#B1B5C3"],
                          min: minPrice,
                          max: maxPrice,
                        }),
                        alignSelf: "center",
                      }}
                    >
                      {children}
                    </div>
                  </div>
                )}
                renderThumb={({ index, props, isDragged }) => (
                  <div
                    {...props}
                    style={{
                      ...props.style,
                      height: "24px",
                      width: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#3772FF",
                      border: "4px solid #FCFCFD",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-33px",
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "14px",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        backgroundColor: "#141416",
                      }}
                    >
                      ₹{priceValues[index].toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              />
              <div className={styles.priceScale}>
                <span>₹{minPrice.toLocaleString('en-IN')}</span>
                <span>₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Date Range for Experience/Events */}
        {(isExperienceInterest || isEventInterest) && (
          <div className={styles.section}>
            <div className={styles.label}>Date range</div>
            <div className={styles.dateGrid}>
              <label className={styles.dateField}>
                <span>Start</span>
                <input
                  type="date"
                  value={filters.dateRange?.startDate || ""}
                  onChange={(e) => handleDateFieldChange("startDate", e.target.value)}
                />
              </label>
              <label className={styles.dateField}>
                <span>End</span>
                <input
                  type="date"
                  value={filters.dateRange?.endDate || ""}
                  onChange={(e) => handleDateFieldChange("endDate", e.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        {/* Amenities */}
        {isStayInterest && (
          <div className={styles.section}>
            <div className={styles.label}>Amenities</div>
            <div className={styles.amenitiesGrid}>
              {amenities.map((amenity) => (
                <button
                  key={amenity.id}
                  className={cn(styles.amenityChip, {
                    [styles.active]: (filters.amenities || []).includes(amenity.id),
                  })}
                  onClick={() => handleAmenityChange(amenity.id)}
                >
                  {amenity.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        <div className={styles.section}>
          <div className={styles.label}>Rating</div>
          <div className={styles.ratingsList}>
            {ratings.map((rating) => (
              <button
                key={rating.id}
                className={cn(styles.ratingChip, {
                  [styles.active]: (filters.ratings || []).includes(rating.id),
                })}
                onClick={() => handleRatingChange(rating.id)}
              >
                <Icon name="star" size="16" />
                {rating.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Category */}
        <CollapsibleChipSection
          label="Main category"
          options={primaryCategoryOptions}
          activeKeys={filters.apiCategoryFilter?.activeKeys || (filters.apiCategoryFilter?.activeKey ? [filters.apiCategoryFilter.activeKey] : [])}
          onSelect={handleApiFilterChange}
        />

        {/* Sub Category */}
        <CollapsibleChipSection
          label="Sub category"
          options={secondaryCategoryOptions}
          activeKeys={filters.apiCategoryFilter?.activeKeys || (filters.apiCategoryFilter?.activeKey ? [filters.apiCategoryFilter.activeKey] : [])}
          onSelect={handleApiFilterChange}
        />

        {/* Tags */}
        <CollapsibleChipSection
          label="Tags"
          options={tagOptions}
          activeKeys={filters.apiCategoryFilter?.activeKeys || (filters.apiCategoryFilter?.activeKey ? [filters.apiCategoryFilter.activeKey] : [])}
          onSelect={handleApiFilterChange}
        />

        {/* Special Labels */}
        <CollapsibleChipSection
          label="Special labels"
          options={specialLabelOptions}
          activeKeys={filters.apiCategoryFilter?.activeKeys || (filters.apiCategoryFilter?.activeKey ? [filters.apiCategoryFilter.activeKey] : [])}
          onSelect={handleApiFilterChange}
        />

        {/* Property Types (stays only) */}
        {isStayInterest && (
          <div className={styles.section}>
            <div className={styles.label}>Property type</div>
            <div className={styles.checkboxList}>
              {propertyTypes.map((type) => (
                <Checkbox
                  key={type.id}
                  className={styles.checkbox}
                  content={type.label}
                  value={(filters.propertyTypes || []).includes(type.id)}
                  onChange={() => handlePropertyTypeChange(type.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;

