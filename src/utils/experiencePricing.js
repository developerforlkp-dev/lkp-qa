import moment from "moment";

const toRate = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getExperienceGuestTaxRate = (listing) =>
  toRate(
    listing?.pricing?.tax?.customer ??
    listing?.pricing?.tax?.guest ??
    listing?.pricing?.customerTaxRate ??
    listing?.pricing?.customerTax ??
    listing?.pricing?.taxRate
  );

export const getExperienceGuestDiscountRate = (listing) =>
  toRate(
    listing?.pricing?.discount?.total ??
    listing?.pricing?.discount?.customer ??
    listing?.pricing?.discount?.guest ??
    listing?.pricing?.discountRate ??
    listing?.pricing?.discount
  );

export const getExperienceEarlyBirdDiscountRate = (listing, bookingDate = null) => {
  if (!bookingDate) return 0;
  const earlyBirdDiscounts =
    listing?.earlyBirdDiscounts ||
    listing?.early_bird_discounts ||
    listing?.pricing?.earlyBirdDiscounts ||
    listing?.pricing?.early_bird_discounts;

  if (!Array.isArray(earlyBirdDiscounts) || earlyBirdDiscounts.length === 0) return 0;

  const today = moment().startOf("day");
  const bDate = moment(bookingDate).startOf("day");
  if (!bDate.isValid()) return 0;

  const daysInAdvance = bDate.diff(today, "days");
  if (daysInAdvance < 0) return 0;

  const applicableDiscounts = earlyBirdDiscounts.filter((d) =>
    (d.isActive !== false && d.is_active !== false) &&
    daysInAdvance >= (toRate(d.daysInAdvance ?? d.days_in_advance))
  );

  if (applicableDiscounts.length === 0) return 0;

  const bestDiscount = applicableDiscounts.reduce((prev, current) =>
    (toRate(current.percentage) > toRate(prev.percentage)) ? current : prev
  );

  return toRate(bestDiscount.percentage);
};

export const getExperienceCommissionRate = (listing) =>
  toRate(
    listing?.pricing?.commission ??
    listing?.pricing?.commissionRate
  );

export const calculateExperienceGuestPricing = (unitPrice, listing, bookingDate = null) => {
  const baseUnitPrice = toRate(unitPrice);
  const promoDiscountRate = getExperienceGuestDiscountRate(listing);
  const earlyBirdDiscountRate = getExperienceEarlyBirdDiscountRate(listing, bookingDate);
  const discountRate = promoDiscountRate + earlyBirdDiscountRate;
  const customerTaxRate = getExperienceGuestTaxRate(listing);
  const commissionRate = getExperienceCommissionRate(listing);

  const discountAmount = baseUnitPrice * (discountRate / 100);
  const promoDiscountAmount = baseUnitPrice * (promoDiscountRate / 100);
  const earlyBirdDiscountAmount = baseUnitPrice * (earlyBirdDiscountRate / 100);

  const priceAfterDiscount = Math.max(0, baseUnitPrice - discountAmount);
  const taxAmount = priceAfterDiscount * (customerTaxRate / 100);
  const finalUnitPrice = priceAfterDiscount + taxAmount;

  return {
    baseUnitPrice,
    discountRate,
    discountAmount,
    promoDiscountRate,
    promoDiscountAmount,
    earlyBirdDiscountRate,
    earlyBirdDiscountAmount,
    priceAfterDiscount,
    customerTaxRate,
    taxAmount,
    finalUnitPrice,
    commissionRate,
  };
};
