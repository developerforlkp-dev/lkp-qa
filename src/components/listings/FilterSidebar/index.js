import React, { useState } from "react";
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

const categories = [
  "Adventure",
  "Offbeat",
  "Nature",
  "Camps",
  "Family",
  "Luxury",
  "Eco",
  "Pet Friendly",
];

const FilterSidebar = ({
  filters,
  onFilterChange,
  onReset,
  sorting,
  setSorting,
  sortingOptions,
  businessInterest,
}) => {
  const normalizedInterest = String(businessInterest || "").toUpperCase();
  const isStayInterest = normalizedInterest === "STAY" || normalizedInterest === "STAYS";
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

  const handleCategoryChange = (category) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter((x) => x !== category)
      : [...current, category];
    onFilterChange("categories", updated);
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
        {isStayInterest && sortingOptions && sortingOptions.length > 0 && (
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
        {isStayInterest && (
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

        {/* Property Types */}
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

        {/* Categories */}
        <div className={styles.section}>
          <div className={styles.label}>Categories</div>
          <div className={styles.categoriesScroll}>
            {categories.map((category) => (
              <button
                key={category}
                className={cn(styles.categoryChip, {
                  [styles.active]: (filters.categories || []).includes(category),
                })}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;

