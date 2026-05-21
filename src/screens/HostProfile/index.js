import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Main from "./Main";
import Testimonials from "../../components/Testimonials";

const HostProfile = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hostIdParam = params.get("id");
  const hostId = hostIdParam || null;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      window.scrollTo(0, 0);
    }
  }, [loading]);

  return (
    <>
      <Main hostId={hostId} onLoadingChange={setLoading} />
      {!loading && <Testimonials classSection="section-pd section-mb0" />}
    </>
  );
};

export default HostProfile;
