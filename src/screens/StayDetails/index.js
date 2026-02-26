import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./StayDetails.module.sass";
import Product from "../../components/Product";
// Reuse components from ExperienceProduct if possible, or create simplified versions
import Description from "../ExperienceProduct/Description";
import TabSection from "../ExperienceProduct/TabSection";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";
import Loader from "../../components/Loader";
import { browse2 } from "../../mocks/browse";
import { getStayDetails, getHost } from "../../utils/api";

const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("leads/")) {
        return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }
    if (url.startsWith("/")) return url;
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
};

const StayDetails = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    const [stay, setStay] = useState(null);
    const [hostData, setHostData] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                if (!id) return;
                setLoading(true);
                const data = await getStayDetails(id);
                if (!mounted) return;

                if (data) {
                    // Normalize data for components that expect 'description'
                    const normalizedData = {
                        ...data,
                        description: data.details || data.propertyDescription || data.description,
                    };
                    setStay(normalizedData);

                    const galleryImages = [];
                    if (data.coverPhotoUrl) {
                        galleryImages.push(formatImageUrl(data.coverPhotoUrl));
                    }
                    if (Array.isArray(data.media)) {
                        data.media.forEach(m => {
                            if (m.url && m.url !== data.coverPhotoUrl) {
                                galleryImages.push(formatImageUrl(m.url));
                            }
                        });
                    } else if (Array.isArray(data.images)) {
                        data.images.forEach(img => {
                            const url = typeof img === 'string' ? img : (img.url || img.imageUrl);
                            if (url && url !== data.coverPhotoUrl) galleryImages.push(formatImageUrl(url));
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
                console.error("Failed to load stay details", e);
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

    const stayOptions = useMemo(() => {
        const options = [];
        if (stay?.propertyType) {
            options.push({ title: toDisplayString(stay.propertyType), icon: "home" });
        }
        if (stay?.city || stay?.location) {
            options.push({ title: stay.city || stay.location, icon: "flag" });
        }
        if (stay?.category) {
            options.push({ title: toDisplayString(stay.category), icon: "route" });
        }
        return options.length ? options : [{ title: "Stay", icon: "home" }, { title: "Location", icon: "flag" }];
    }, [stay]);

    const hostAvatar = useMemo(() => {
        const avatarUrl = hostData?.profilePhotoUrl || stay?.host?.profilePhotoUrl;
        return avatarUrl ? formatImageUrl(avatarUrl) : null;
    }, [hostData, stay]);

    if (loading && !stay) {
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
                title={stay?.propertyName || stay?.title || "Stay Details"}
                options={stayOptions}
                gallery={galleryItems}
                type="experience"
                rating={stay?.rating || stay?.averageRating}
                reviews={stay?.totalReviews || stay?.reviewCount}
                hostAvatar={hostAvatar}
            />

            {stay && (
                <>
                    <Description classSection="section" listing={stay} hostData={hostData} />
                    <TabSection classSection="section" listing={stay} />
                    <CommentsProduct
                        className={cn("section")}
                        parametersUser={[]}
                        info={stay?.description || stay?.propertyDescription || stay?.details || "Experience comfort and luxury in this beautiful stay."}
                        socials={[]}
                        buttonText="Contact Host"
                        hostData={hostData}
                    />
                </>
            )}

            <Browse
                classSection="section"
                headSmall
                classTitle="h4"
                title="More stays to explore"
                items={browse2}
            />
        </>
    );
};

export default StayDetails;
