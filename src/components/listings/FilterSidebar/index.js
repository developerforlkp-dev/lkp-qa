import React, { useMemo, useState } from "react";
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
                  categoryType: "Tag",
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
          categoryType: "Tag",
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
                  categoryType: "Special Label",
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
          categoryType: "Special Label",
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
    const updated = current.includes(rating)
      ? current.filter((x) => x !== rating)
      : [...current, rating];
    onFilterChange("ratings", updated);
  };

  const handleApiFilterChange = (option) => {
    const currentKey = filters.apiCategoryFilter?.activeKey;
    if (currentKey === option.key) {
      onFilterChange("apiCategoryFilter", null);
      return;
    }

    onFilterChange("apiCategoryFilter", {
      activeKey: option.key,
      selectedCategoryLabel: option.label,
      categoryType: option.categoryType,
      categoryValues: [option.value],
    });
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
              value={sorting}
              setValue={setSorting}
              options={sortingOptions}
            />
          </div>
        )}

        {/* Price Range */}
        {isExpEventOrStay && (
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
                          colors: ["#3772FF", "#B1B5C3"],
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
                      ${priceValues[index].toFixed(0)}
                    </div>
                  </div>
                )}
              />
              <div className={styles.priceScale}>
                <span>${minPrice}</span>
                <span>${maxPrice}</span>
              </div>
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
        <div className={styles.section}>
          <div className={styles.label}>Main category</div>
          <div className={styles.categoriesScroll}>
            {primaryCategoryOptions.map((category) => (
              <button
                key={category.key}
                className={cn(styles.categoryChip, {
                  [styles.active]: filters.apiCategoryFilter?.activeKey === category.key,
                })}
                onClick={() => handleApiFilterChange(category)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Category */}
        <div className={styles.section}>
          <div className={styles.label}>Sub category</div>
          <div className={styles.categoriesScroll}>
            {secondaryCategoryOptions.map((category) => (
              <button
                key={category.key}
                className={cn(styles.categoryChip, {
                  [styles.active]: filters.apiCategoryFilter?.activeKey === category.key,
                })}
                onClick={() => handleApiFilterChange(category)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className={styles.section}>
          <div className={styles.label}>Tags</div>
          <div className={styles.categoriesScroll}>
            {tagOptions.map((tag) => (
              <button
                key={tag.key}
                className={cn(styles.categoryChip, {
                  [styles.active]: filters.apiCategoryFilter?.activeKey === tag.key,
                })}
                onClick={() => handleApiFilterChange(tag)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Special Labels */}
        <div className={styles.section}>
          <div className={styles.label}>Special labels</div>
          <div className={styles.categoriesScroll}>
            {specialLabelOptions.map((label) => (
              <button
                key={label.key}
                className={cn(styles.categoryChip, {
                  [styles.active]: filters.apiCategoryFilter?.activeKey === label.key,
                })}
                onClick={() => handleApiFilterChange(label)}
              >
                {label.label}
              </button>
            ))}
          </div>
        </div>

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

