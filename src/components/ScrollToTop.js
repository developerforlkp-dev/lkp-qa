import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const homepagePaths = ["/", "/experience", "/experiences", "/events", "/stays", "/food", "/places"];

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const prevPathname = useRef(pathname);
  const prevSearch = useRef(search);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Determine if this is a transition between homepage tabs
    const isHomepage = (p, s) => {
      if (!homepagePaths.includes(p)) return false;
      // Stays with an ID is a detail page, not the homepage tab
      if (p === "/stays" && new URLSearchParams(s).get("id")) return false;
      return true;
    };

    const isPrevHomepage = isHomepage(prevPathname.current, prevSearch.current);
    const isCurrentHomepage = isHomepage(pathname, search);

    const isHomepageTabSwitch = isPrevHomepage && isCurrentHomepage;

    if (!isHomepageTabSwitch) {
      window.scrollTo(0, 0);
    }
    
    prevPathname.current = pathname;
    prevSearch.current = search;
  }, [pathname, search]);

  return null;
}
