import React, { useEffect, useMemo, useRef, useState } from "react";
import cn from "classnames";
import styles from "./FilterSidebar.module.sass";
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

const mealPlans = [
  { id: "ep", label: "EP" },
  { id: "cp", label: "CP" },
  { id: "map", label: "MAP" },
  { id: "ap", label: "AP" },
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

// ─── Accordion Section — collapsible filter group header ──────────────────────
const AccordionSection = ({ label, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.accordionSection}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setIsOpen((p) => !p)}
        aria-expanded={isOpen}
      >
        <span className={styles.accordionLabel}>{label}</span>
        <svg
          className={cn(styles.chevron, { [styles.chevronOpen]: isOpen })}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
};

// ─── Collapsible Chip Section — shows show-more/less for large chip lists ──────
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
    <AccordionSection label={label}>
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
    </AccordionSection>
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
  hideHeader = false,
}) => {
  const activeChips = useMemo(() => {
    const chips = [];

    // Ratings
    if (Array.isArray(filters?.ratings)) {
      filters.ratings.forEach((rId) => {
        const found = ratings.find((r) => r.id === rId);
        if (found) {
          const cleanLabel = found.label.replace(/\bstars?\b/gi, "Stars");
          chips.push({
            type: "ratings",
            value: rId,
            label: cleanLabel,
          });
        }
      });
    }

    // Property Types
    if (Array.isArray(filters?.propertyTypes)) {
      filters.propertyTypes.forEach((pId) => {
        const found = propertyTypes.find((p) => p.id === pId);
        if (found) {
          chips.push({
            type: "propertyTypes",
            value: pId,
            label: found.label,
          });
        }
      });
    }

    // Amenities
    if (Array.isArray(filters?.amenities)) {
      filters.amenities.forEach((aId) => {
        const found = amenities.find((a) => a.id === aId);
        if (found) {
          chips.push({
            type: "amenities",
            value: aId,
            label: found.label,
          });
        }
      });
    }

    // Meal Plan
    if (Array.isArray(filters?.mealPlan)) {
      filters.mealPlan.forEach((mId) => {
        const found = mealPlans.find((m) => m.id === mId);
        if (found) {
          chips.push({
            type: "mealPlan",
            value: mId,
            label: `Meal: ${found.label}`,
          });
        }
      });
    }

    // API Category Filter
    if (filters?.apiCategoryFilter) {
      const { activeKeys, selectedCategoryLabels } = filters.apiCategoryFilter;
      if (Array.isArray(activeKeys) && Array.isArray(selectedCategoryLabels)) {
        activeKeys.forEach((key, idx) => {
          const label = selectedCategoryLabels[idx];
          if (label) {
            chips.push({
              type: "apiCategoryFilter",
              value: key,
              label: label,
            });
          }
        });
      }
    }

    // Date range
    if (filters?.dateRange?.startDate) {
      chips.push({
        type: "dateRange",
        value: "startDate",
        label: `In: ${filters.dateRange.startDate}`,
      });
    }
    if (filters?.dateRange?.endDate) {
      chips.push({
        type: "dateRange",
        value: "endDate",
        label: `Out: ${filters.dateRange.endDate}`,
      });
    }

    return chips;
  }, [filters]);

  const handleRemoveChip = (chip) => {
    if (chip.type === "ratings") {
      const updated = (filters.ratings || []).filter((x) => x !== chip.value);
      onFilterChange("ratings", updated);
    } else if (chip.type === "propertyTypes") {
      const updated = (filters.propertyTypes || []).filter((x) => x !== chip.value);
      onFilterChange("propertyTypes", updated);
    } else if (chip.type === "amenities") {
      const updated = (filters.amenities || []).filter((x) => x !== chip.value);
      onFilterChange("amenities", updated);
    } else if (chip.type === "mealPlan") {
      const updated = (filters.mealPlan || []).filter((x) => x !== chip.value);
      onFilterChange("mealPlan", updated);
    } else if (chip.type === "apiCategoryFilter") {
      const current = filters.apiCategoryFilter;
      if (current && Array.isArray(current.activeKeys)) {
        const idx = current.activeKeys.indexOf(chip.value);
        if (idx > -1) {
          const nextKeys = current.activeKeys.filter((k) => k !== chip.value);
          const nextLabels = current.selectedCategoryLabels.filter((_, i) => i !== idx);
          const nextValues = (current.categoryValues || []).filter((_, i) => i !== idx);
          
          if (nextKeys.length === 0) {
            onFilterChange("apiCategoryFilter", null);
          } else {
            onFilterChange("apiCategoryFilter", {
              ...current,
              activeKeys: nextKeys,
              selectedCategoryLabels: nextLabels,
              selectedCategoryLabel: nextLabels.join(", "),
              categoryValues: nextValues,
            });
          }
        }
      }
    } else if (chip.type === "dateRange") {
      const current = filters.dateRange || { startDate: "", endDate: "" };
      onFilterChange("dateRange", {
        ...current,
        [chip.value]: "",
      });
    }
  };

  const normalizedInterest = String(businessInterest || "").toUpperCase();
  const isStayInterest = normalizedInterest === "STAY" || normalizedInterest === "STAYS";
  const isPriceRangeEnabled = true;
  const pricePresetOptions = ["Any", "Under 15000", "Under 10000", "Under 5000", "Under 1000"];
  const presetToMaxMap = {
    "Under 10000": 10000,
    "Under 15000": 15000,
    "Under 5000": 5000,
    "Under 1000": 1000,
  };

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

  const selectedPricePresetLabel = useMemo(() => {
    const max = Number(filters?.pricePresetMax);
    if (!Number.isFinite(max) || max <= 0) return "Any";
    const match = Object.entries(presetToMaxMap).find(([, value]) => value === max);
    return match ? match[0] : "Any";
  }, [filters?.pricePresetMax]);

  const handlePricePresetChange = (presetLabel) => {
    const selectedMax = presetToMaxMap[presetLabel] ?? null;
    onFilterChange("pricePresetMax", selectedMax);
  };

  const handleCustomPriceChange = (key, value) => {
    const normalized = value === "" ? "" : Number(value);
    const current = filters.priceRange || { min: "", max: "" };
    onFilterChange("priceRange", {
      ...current,
      [key]: Number.isFinite(normalized) ? normalized : "",
    });
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

  const handleMealPlanChange = (id) => {
    const current = filters.mealPlan || [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onFilterChange("mealPlan", updated);
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

  return (
    <div className={styles.sidebar}>
      {!hideHeader && (
        <div className={styles.header}>
          <h3 className={styles.title}>Filters</h3>
          <button className={styles.clearAllButton} onClick={onReset}>
            Clear all
          </button>
        </div>
      )}

      {!hideHeader && activeChips.length > 0 && (
        <div className={styles.activeFiltersSection}>
          <div className={styles.activeFiltersTitle}>Active Filters</div>
          <div className={styles.activeChipsList}>
            {activeChips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                className={styles.activeChip}
                onClick={() => handleRemoveChip(chip)}
                type="button"
              >
                <span>{chip.label}</span>
                <span className={styles.removeIcon}>✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* Sort By */}
        {sortingOptions && sortingOptions.length > 0 && (
          <AccordionSection label="Sort by">
            <Dropdown
              className={styles.sortDropdown}
              value={displaySortingValue}
              setValue={handleSortingChange}
              options={displaySortingOptions}
            />
          </AccordionSection>
        )}

        {/* Date Range — Experience / Events only */}
        {/* Rating */}
        <AccordionSection label="Rating">
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
        </AccordionSection>

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

        {/* Amenities — Stays only */}
        {isStayInterest && (
          <AccordionSection label="Amenities">
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
          </AccordionSection>
        )}

        {/* Property Type — Stays only */}
        {isStayInterest && (
          <AccordionSection label="Property type">
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
          </AccordionSection>
        )}

        {/* Meal Plan — Stays only */}
        {isStayInterest && (
          <AccordionSection label="Meal plan">
            <div className={styles.checkboxList}>
              {mealPlans.map((plan) => (
                <Checkbox
                  key={plan.id}
                  className={styles.checkbox}
                  content={plan.label}
                  value={(filters.mealPlan || []).includes(plan.id)}
                  onChange={() => handleMealPlanChange(plan.id)}
                />
              ))}
            </div>
          </AccordionSection>
        )}
      </div>
    </div>
  );
};

export default FilterSidebar;
