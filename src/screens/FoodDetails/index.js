import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./FoodDetails.module.sass";
import Product from "../../components/Product";
import Description from "../ExperienceProduct/Description";
import TabSection from "../ExperienceProduct/TabSection";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";
import Loader from "../../components/Loader";
import { browse2 } from "../../mocks/browse";
import { getFoodDetails, getHost } from "../../utils/api";

const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("leads/")) {
        return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
    }
    if (url.startsWith("/")) return url;
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
};

const FoodDetails = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    const [food, setFood] = useState(null);
    const [hostData, setHostData] = useState(null);
    const [galleryItems, setGalleryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                if (!id) return;
                setLoading(true);
                const data = await getFoodDetails(id);
                if (!mounted) return;

                if (data) {
                    // Normalize data for components that expect 'description'
                    const normalizedData = {
                        ...data,
                        description: data.detailedDescription || data.shortDescription || data.description,
                    };
                    setFood(normalizedData);

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
                console.error("Failed to load food details", e);
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

    const foodOptions = useMemo(() => {
        const options = [];
        if (food?.cuisineType || food?.cuisine) {
            options.push({ title: toDisplayString(food.cuisineType || food.cuisine), icon: "burger" });
        }
        if (food?.city || food?.location) {
            options.push({ title: food.city || food.location, icon: "flag" });
        }
        if (food?.category) {
            options.push({ title: toDisplayString(food.category), icon: "route" });
        }
        return options.length ? options : [{ title: "Food", icon: "burger" }, { title: "Location", icon: "flag" }];
    }, [food]);

    const hostAvatar = useMemo(() => {
        const avatarUrl = hostData?.profilePhotoUrl || food?.host?.profilePhotoUrl;
        return avatarUrl ? formatImageUrl(avatarUrl) : null;
    }, [hostData, food]);

    if (loading && !food) {
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
                title={food?.menuName || food?.title || "Food Details"}
                options={foodOptions}
                gallery={galleryItems}
                type="experience"
                rating={food?.rating || food?.averageRating}
                reviews={food?.totalReviews || food?.reviewCount}
                hostAvatar={hostAvatar}
            />

            {food && (
                <>
                    <Description classSection="section" listing={food} hostData={hostData} />
                    <TabSection classSection="section" listing={food} />
                    <CommentsProduct
                        className={cn("section")}
                        parametersUser={[]}
                        info={food?.description || food?.detailedDescription || food?.shortDescription || "Enjoy delicious meals and exceptional service."}
                        socials={[]}
                        buttonText="Order Now"
                        hostData={hostData}
                    />
                </>
            )}

            <Browse
                classSection="section"
                headSmall
                classTitle="h4"
                title="More food menus to explore"
                items={browse2}
            />
        </>
    );
};

export default FoodDetails;
