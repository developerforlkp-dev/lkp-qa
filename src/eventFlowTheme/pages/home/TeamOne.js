"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getEventDetails } from "../../../utils/api";
import teamImg1 from "../../assets/images/team/team-1-1.jpg";
import teamImg2 from "../../assets/images/team/team-1-2.jpg";
import teamImg3 from "../../assets/images/team/team-1-3.jpg";

const fallbackImages = [teamImg1, teamImg2, teamImg3];

const getArtistName = (artist, index) => {
  return (
    artist?.name ||
    artist?.title ||
    artist?.artistName ||
    artist?.artist_name ||
    `Artist ${index + 1}`
  );
};

const getArtistDetails = (artist) => {
  return (
    artist?.description ||
    artist?.about ||
    artist?.bio ||
    artist?.artistDescription ||
    artist?.artist_description ||
    artist?.role ||
    artist?.designation ||
    "Featured artist"
  );
};

const getArtistImage = (artist, index, coverImageUrl) => {
  return (
    artist?.image ||
    artist?.imageUrl ||
    artist?.photoUrl ||
    artist?.avatarUrl ||
    coverImageUrl ||
    fallbackImages[index % fallbackImages.length]
  );
};

export default function TeamOne() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("id") || "3";

  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchEventData = async () => {
      try {
        const data = await getEventDetails(eventId);
        if (!mounted) return;
        setEventInfo(data);
      } catch (error) {
        console.error("Failed to fetch event artists:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEventData();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const artists = useMemo(() => {
    if (!Array.isArray(eventInfo?.artists)) return [];

    return eventInfo.artists.map((artist, index) => ({
      id: artist?.id || artist?.artistId || artist?.artist_id || `${eventId}-${index}`,
      name: getArtistName(artist, index),
      details: getArtistDetails(artist),
      image: getArtistImage(artist, index, eventInfo?.coverImageUrl),
      link: `/event-details?id=${eventId}`,
    }));
  }, [eventId, eventInfo]);

  if (!loading && artists.length === 0) {
    return null;
  }

  return (
    <section id="th-team" className="team-one">
      <div className="container">
        <div className="section-title text-center">
          <div className="section-title__tagline-box">
            <span className="section-title__tagline">Event Artists</span>
          </div>
          <h2 className="section-title__title">Meet The Featured Artists</h2>
        </div>

        {loading ? (
          <p style={{ color: "#aaa", textAlign: "center", padding: "20px 0" }}>
            Loading artists...
          </p>
        ) : (
          <div
            className="row"
            style={{
              justifyContent: artists.length === 1 ? "center" : "flex-start",
            }}
          >
            {artists.map((artist, index) => (
              <div
                key={artist.id}
                className={`col-xl-4 col-md-6 col-12 wow fadeIn${
                  index % 3 === 0 ? "Left" : index % 3 === 1 ? "Up" : "Right"
                }`}
                data-wow-delay={`${(index + 1) * 100}ms`}
                style={{
                  marginBottom: "30px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div className="team-one__single">
                  <div
                    className="team-one__img-box"
                    style={{
                      width: "100%",
                      maxWidth: "410px",
                    }}
                  >
                    <div className="team-one__img">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        style={{
                          width: "100%",
                          height: "455px",
                          objectFit: "cover",
                          objectPosition: "center",
                        }}
                      />
                      <div className="team-one__content">
                        <h4 className="team-one__name">
                          <Link to={artist.link}>{artist.name}</Link>
                        </h4>
                        <p className="team-one__sub-title">{artist.details}</p>
                      </div>
                      <div className="team-one__content-hover">
                        <h4 className="team-one__name-hover">
                          <Link to={artist.link}>{artist.name}</Link>
                        </h4>
                        <p className="team-one__sub-title-hover">Artist Details</p>
                        <p className="team-one__text-hover">{artist.details}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
