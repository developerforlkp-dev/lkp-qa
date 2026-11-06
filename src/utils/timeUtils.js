import moment from "moment";

/**
 * Format a time string into 12-hour format with AM/PM (e.g. "08:00 AM", "12:00 PM").
 *
 * @param {string} timeStr - Raw time string like "08:00", "08:00:00", "12:00", "16:30", "8:00 AM", etc.
 * @param {string} [fallback=""] - Fallback string if invalid or empty.
 * @returns {string} Formatted 12-hour time string with AM/PM.
 */
export function formatTime12h(timeStr, fallback = "") {
  if (!timeStr || typeof timeStr !== "string") {
    if (typeof timeStr === "number") timeStr = String(timeStr);
    else return fallback;
  }

  const trimmed = timeStr.trim();
  if (!trimmed || trimmed.toLowerCase() === "not specified") {
    return fallback;
  }

  // 1. Check if string already contains AM/PM (e.g., "8:00 AM", "08:00AM", "8 AM", "8am")
  const matchWithAmPm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([aApP][mM])$/);
  if (matchWithAmPm) {
    const hours = parseInt(matchWithAmPm[1], 10);
    const minutes = matchWithAmPm[2] || "00";
    const ampm = matchWithAmPm[3].toUpperCase();
    const hour12 = hours % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${minutes} ${ampm}`;
  }

  // 2. Check standard 24-hour pattern "HH:mm" or "HH:mm:ss" (e.g., "08:00", "8:00", "14:30:00")
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2];
    if (hours >= 0 && hours <= 23 && parseInt(minutes, 10) >= 0 && parseInt(minutes, 10) <= 59) {
      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${String(hour12).padStart(2, "0")}:${minutes} ${ampm}`;
    }
  }

  // 3. Fallback to moment parser for ISO date-time or other representations
  const parsed = moment(
    trimmed,
    [
      "HH:mm:ss",
      "HH:mm",
      "H:mm",
      "h:mm A",
      "hh:mm A",
      "h:mmA",
      "hh:mmA",
      "YYYY-MM-DDTHH:mm:ss",
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
      "YYYY-MM-DD HH:mm:ss",
    ],
    true
  );

  if (parsed.isValid()) {
    return parsed.format("hh:mm A");
  }

  return trimmed;
}

/**
 * Format opening and closing times into a consistent range string with AM/PM.
 * Example output: "08:00 AM – 12:00 PM"
 *
 * @param {string} [openingTime] - Opening time (e.g. "08:00" or "08:00:00")
 * @param {string} [closingTime] - Closing time (e.g. "12:00" or "17:00:00")
 * @param {string} [rawTimings] - Optional fallback string if opening/closing are not separate
 * @param {string} [fallback="Not Specified"] - Default when no times available
 * @returns {string} Formatted range string
 */
export function formatTimingsRange(openingTime, closingTime, rawTimings, fallback = "Not Specified") {
  const formattedOpen = formatTime12h(openingTime);
  const formattedClose = formatTime12h(closingTime);

  if (formattedOpen && formattedClose) {
    return `${formattedOpen} – ${formattedClose}`;
  }
  if (formattedOpen) return formattedOpen;
  if (formattedClose) return formattedClose;

  if (rawTimings && typeof rawTimings === "string" && rawTimings.trim()) {
    const trimmed = rawTimings.trim();
    if (trimmed.toLowerCase() === "not specified") {
      return fallback;
    }

    // Check if rawTimings is a composite range like "08:00 - 12:00" or "08:00 to 18:00"
    const rangeMatch = trimmed.match(/^([^-–—to]+)\s*(?:[-–—]|to)\s*([^-–—to]+)$/i);
    if (rangeMatch) {
      const p1 = formatTime12h(rangeMatch[1]);
      const p2 = formatTime12h(rangeMatch[2]);
      if (p1 && p2) {
        return `${p1} – ${p2}`;
      }
    }

    const single = formatTime12h(trimmed);
    if (single && single !== trimmed) {
      return single;
    }

    return trimmed;
  }

  return fallback;
}
