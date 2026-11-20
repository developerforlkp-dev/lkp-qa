import moment from "moment";

export function getListingSearchUrl(url, search, isStay) {
  if (!url) return "";
  const source = new URLSearchParams(search);
  const keys = ["date", "guests", "adults", "children"];
  if (isStay) keys.push("endDate", "search", "location", "placeId");
  if (!keys.some((key) => source.get(key))) return url;

  try {
    const destination = new URL(url, "http://localhost");
    keys.forEach((key) => {
      const value = source.get(key);
      if (value) destination.searchParams.set(key, value);
    });
    return url.startsWith("http")
      ? destination.toString()
      : destination.pathname + destination.search + destination.hash;
  } catch {
    return url;
  }
}

export function readStaySearch(search) {
  const params = new URLSearchParams(search);
  const start = moment(params.get("date"), "YYYY-MM-DD", true);
  const end = moment(params.get("endDate"), "YYYY-MM-DD", true);
  const hasCheckIn = start.isValid() && !start.isBefore(moment(), "day");
  const adults = Number(params.get("adults") ?? params.get("guests"));
  const children = Number(params.get("children"));

  return {
    checkInDate: hasCheckIn ? start : null,
    checkOutDate: hasCheckIn && end.isValid() && end.isAfter(start, "day") ? end : null,
    guests: {
      adults: Number.isSafeInteger(adults) && adults > 0 ? adults : 1,
      children: Number.isSafeInteger(children) && children > 0 ? children : 0,
    },
  };
}
