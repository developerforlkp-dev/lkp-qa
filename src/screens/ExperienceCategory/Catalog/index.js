import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./Catalog.module.sass";
import Sorting from "../../../components/Sorting";
import Browse from "../../../components/Browse";
import Card from "../../../components/Card";
import Loader from "../../../components/Loader";

// data
import { browse2 } from "../../../mocks/browse";
import { experience } from "../../../mocks/experience";
import { getListings } from "../../../utils/api";
import { buildExperienceUrl } from "../../../utils/experienceUrl";

const breadcrumbs = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Experience",
    url: "/",
  },
  {
    title: "New Zealand",
    url: "/experience-category",
  },
  {
    title: "South Island",
  },
];

const navigation = [
  "Entire homes",
  "Cancellation flexibility",
  "Closest beach",
  "For long experiences",
];

const saleOptions = ["On sales", "On delivery", "In exchange"];

const Catalog = () => {
  const [sale, setSale] = useState(saleOptions[0]);
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getListings("EXPERIENCE", 50, 0);
        const adapted = (Array.isArray(data) ? data : []).map((l) => ({
          ...l, // Keep original data for filtering
          title: l.title || "",
          src: l.coverPhotoUrl || "",
          srcSet: l.coverPhotoUrl || "",
          url: buildExperienceUrl(l.title || "experience", l.listingId || l.id || 2),
          priceOld: "",
          priceActual: "",
          options: [],
          comment: "",
          avatar: "",
          cost: "",
          rating: "",
          reviews: "",
        }));
        if (mounted) setAllListings(adapted);
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Failed to load listings", e);
        }
        if (mounted) setAllListings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const query = params.get("search")?.toLowerCase() || "";
    
    if (!query) {
      setFilteredListings(allListings);
    } else {
      const filtered = allListings.filter(l => 
        l.title?.toLowerCase().includes(query) || 
        l.categoryTitle?.toLowerCase().includes(query) ||
        l.city?.toLowerCase().includes(query)
      );
      setFilteredListings(filtered);
    }
  }, [allListings, search]);

  const searchParams = new URLSearchParams(search);
  const displayDate = searchParams.get("date") || "May 1 - 14";
  const displayGuests = searchParams.get("guests") ? `${searchParams.get("guests")} guests` : "2 guests";
  const searchTitle = searchParams.get("search") ? `Results for "${searchParams.get("search")}"` : "Places to experience";

  return (
    <div className={cn("section", styles.section)}>
      <Sorting
        className={styles.sorting}
        urlHome="/"
        breadcrumbs={breadcrumbs}
        navigation={navigation}
        title={searchTitle}
        sale={`${filteredListings.length > 0 ? filteredListings.length : '300+'} experiences`}
        details={`${displayDate}, ${displayGuests}`}
        sorting={sale}
        setSorting={setSale}
        sortingOptions={saleOptions}
      />
      <Browse
        classSection="section-mb80"
        headSmall
        classTitle="h4"
        title="Explore mountains in New Zealand"
        items={browse2}
      />
      <div className={styles.body}>
        <div className={cn("container", styles.container)}>
          <h4 className={cn("h4", styles.title)}>Experience</h4>
          <div className={styles.list}>
            {loading ? (
              <Loader className={styles.loader} />
            ) : filteredListings.length > 0 ? (
              filteredListings.map((x, index) => (
                <Card className={styles.card} item={x} key={index} />
              ))
            ) : allListings.length > 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", width: "100%" }}>
                <p>No results found for your search.</p>
              </div>
            ) : (
              experience.map((x, index) => (
                <Card className={styles.card} item={x} key={index} />
              ))
            )}
          </div>
          <div className={styles.btns}>
            <button className={cn("button-stroke", styles.button)}>
              <Loader className={styles.loader} />
              <span>Show more</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
