import moment from "moment";
import { getListingSearchUrl, readStaySearch } from "./staySearch";

test("retains the submitted destination, dates, and party in the stay result URL", () => {
  const date = moment().add(1, "day").format("YYYY-MM-DD");
  const endDate = moment().add(4, "days").format("YYYY-MM-DD");
  const query = new URLSearchParams({
    search: "Fort Kochi, Kerala",
    placeId: "destination-1",
    date,
    endDate,
    guests: "5",
    adults: "3",
    children: "2",
  });

  const url = new URL(
    getListingSearchUrl("/stay-details?id=42", query, true),
    "http://localhost"
  );
  const booking = readStaySearch(url.search);

  expect(Object.fromEntries(url.searchParams)).toEqual({
    id: "42",
    ...Object.fromEntries(query),
  });
  expect(booking.checkInDate.format("YYYY-MM-DD")).toBe(date);
  expect(booking.checkOutDate.format("YYYY-MM-DD")).toBe(endDate);
  expect(booking.guests).toEqual({ adults: 3, children: 2 });
});

test("leaves an omitted or invalid check-out empty and defaults omitted children to zero", () => {
  const date = moment().add(1, "day").format("YYYY-MM-DD");
  const booking = readStaySearch(`?date=${date}&adults=2`);
  expect(booking.checkInDate.format("YYYY-MM-DD")).toBe(date);
  expect(booking.checkOutDate).toBeNull();
  expect(booking.guests).toEqual({ adults: 2, children: 0 });
  expect(readStaySearch(`?date=${date}&endDate=${date}`).checkOutDate).toBeNull();
});
