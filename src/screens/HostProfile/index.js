import React from "react";
import { useLocation } from "react-router-dom";
import Main from "./Main";
import Testimonials from "../../components/Testimonials";

const HostProfile = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hostIdParam = params.get("id");
  const hostId = hostIdParam || null;

  return (
    <>
      <Main hostId={hostId} />
      <Testimonials classSection="section-pd section-mb0" />
    </>
  );
};

export default HostProfile;
