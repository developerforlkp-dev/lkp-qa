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

export const getExperienceCommissionRate = (listing) =>
  toRate(
    listing?.pricing?.commission ??
    listing?.pricing?.commissionRate
  );

export const calculateExperienceGuestPricing = (unitPrice, listing) => {
  const baseUnitPrice = toRate(unitPrice);
  const discountRate = getExperienceGuestDiscountRate(listing);
  const customerTaxRate = getExperienceGuestTaxRate(listing);
  const commissionRate = getExperienceCommissionRate(listing);

  const discountAmount = baseUnitPrice * (discountRate / 100);
  const priceAfterDiscount = Math.max(0, baseUnitPrice - discountAmount);
  const taxAmount = priceAfterDiscount * (customerTaxRate / 100);
  const finalUnitPrice = priceAfterDiscount + taxAmount;

  return {
    baseUnitPrice,
    discountRate,
    discountAmount,
    promoDiscountRate: 0,
    promoDiscountAmount: 0,
    earlyBirdDiscountRate: 0,
    earlyBirdDiscountAmount: 0,
    priceAfterDiscount,
    customerTaxRate,
    taxAmount,
    finalUnitPrice,
    commissionRate,
  };
};
