import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import Product from "../../components/Product";
import Description from "../ExperienceProduct/Description";
import TabSection from "../ExperienceProduct/TabSection";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";
import Loader from "../../components/Loader";
import { browse2 } from "../../mocks/browse";
import { getPlaceDetails, getHost } from "../../utils/api";

const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("leads/")) {
        return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }
    if (url.startsWith("/")) return url;
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
};

const PlaceDetails = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    const [place, setPlace] = useState(null);
    const [hostData, setHostData] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                if (!id) return;
                setLoading(true);
                const data = await getPlaceDetails(id);
                if (!mounted) return;

                if (data) {
                    // Normalize data for components that expect 'description'
                    const normalizedData = {
                        ...data,
                        description: data.placeDescription || data.description,
                    };
                    setPlace(normalizedData);

                    const galleryImages = [];
                    if (data.coverImageUrl) {
                        galleryImages.push(formatImageUrl(data.coverImageUrl));
                    }
                    if (Array.isArray(data.media)) {
                        data.media.forEach(m => {
                            if (m.url && m.url !== data.coverImageUrl) {
                                galleryImages.push(formatImageUrl(m.url));
                            }
                        });
                    } else if (Array.isArray(data.images)) {
                        data.images.forEach(img => {
                            const url = typeof img === 'string' ? img : (img.url || img.imageUrl);
                            if (url && url !== data.coverImageUrl) galleryImages.push(formatImageUrl(url));
                        });
                    }

                    setGalleryItems(galleryImages.length ? galleryImages : []);

                    const hostId = data.hostId || data.host?.hostId || data.leadUserId;
                    if (hostId) {
                        getHost(hostId)
                            .then((hostResponse) => {
                                if (mounted) setHostData(hostResponse || null);
                            })
                            .catch((err) => console.warn("Failed to fetch host data:", err));
                    }
                }
                setLoading(false);
            } catch (e) {
                console.error("Failed to load place details", e);
                setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [id]);

    const toDisplayString = (value) => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") {
            return value.displayName || value.name || value.title || value.code || "";
        }
        return String(value);
    };

    const placeOptions = useMemo(() => {
        const options = [];
        if (place?.placeType) {
            options.push({ title: toDisplayString(place.placeType), icon: "marker" });
        }
        if (place?.city || place?.location) {
            options.push({ title: place.city || place.location, icon: "flag" });
        }
        if (place?.category) {
            options.push({ title: toDisplayString(place.category), icon: "route" });
        }
        return options.length ? options : [{ title: "Place", icon: "marker" }, { title: "Location", icon: "flag" }];
    }, [place]);

    const hostAvatar = useMemo(() => {
        const avatarUrl = hostData?.profilePhotoUrl || place?.host?.profilePhotoUrl;
        return avatarUrl ? formatImageUrl(avatarUrl) : null;
    }, [hostData, place]);

    if (loading && !place) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader />
            </div>
        );
    }

    return (
        <>
            <Product
                classSection="section-mb64"
                title={place?.placeName || place?.title || "Place Details"}
                options={placeOptions}
                gallery={galleryItems}
                type="experience"
                rating={place?.rating || place?.averageRating}
                reviews={place?.totalReviews || place?.reviewCount}
                hostAvatar={hostAvatar}
            />

            {place && (
                <>
                    <Description classSection="section" listing={place} hostData={hostData} />
                    <TabSection classSection="section" listing={place} />
                    <CommentsProduct
                        className={cn("section")}
                        parametersUser={[]}
                        info={place?.description || place?.placeDescription || "Discover interesting places and experiences."}
                        socials={[]}
                        buttonText="Learn More"
                        hostData={hostData}
                    />
                </>
            )}

            <Browse
                classSection="section"
                headSmall
                classTitle="h4"
                title="More places to explore"
                items={browse2}
            />
        </>
    );
};

export default PlaceDetails;
