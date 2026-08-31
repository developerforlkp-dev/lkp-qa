const toRate = (value) => {
  const rate = Number(value);
  return Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 0;
};

// The public stay-detail API already resolves enabled taxes by payer. Use that
// summary as the single source of truth so host-paid taxes are never charged to
// the guest and disabled configuration rows cannot leak into the total.
export const getStayGuestTaxRate = (stay) =>
  toRate(stay?.pricing?.tax?.customer);

// `pricing.discount.total` is the discount the detail API exposes to guests. It
// includes the host- and LKP-sponsored portions, but not long-stay tiers.
export const getStayGuestDiscountRate = (stay) =>
  toRate(stay?.pricing?.discount?.total);

export const getStayLongStayDiscount = (stay, nights) => {
  const nightCount = Number(nights);
  if (!Number.isFinite(nightCount) || nightCount <= 0) return null;

  const tiers = Array.isArray(stay?.discountTiers) ? stay.discountTiers : [];
  return tiers.find((tier) => {
    const minimumDays = Number(tier?.minimumDays ?? 0);
    const maximumDays = Number(tier?.maximumDays ?? Number.MAX_SAFE_INTEGER);
    return nightCount >= minimumDays && nightCount <= maximumDays;
  }) || null;
};

export const getStayLongStayDiscountRate = (stay, nights) =>
  toRate(getStayLongStayDiscount(stay, nights)?.discountPercentage);
