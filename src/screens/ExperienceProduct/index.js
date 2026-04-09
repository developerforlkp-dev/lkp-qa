import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import cn from "classnames";
import styles from "./ExperienceProduct.module.sass";
import Product from "../../components/Product";
import Description from "./Description";
import Itinerary from "../../components/Itinerary";
import TabSection from "./TabSection";
import CommentsProduct from "../../components/CommentsProduct";
import Browse from "../../components/Browse";
import Loader from "../../components/Loader";
import { browse2 } from "../../mocks/browse";
import {
  DEFAULT_API_BASE_URL,
  getListing,
  getHost,
  getLeadDetails,
} from "../../utils/api";

// Helper function to format image URLs (from Azure blob storage or full URLs)
const formatImageUrl = (url) => {
  if (!url) return null;
  
  // Already a full URL
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Azure blob storage path (e.g., "leads/3/listings/6/cover-photo/image.jpg")
  if (url.startsWith("leads/")) {
    return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
  }
  
  // Relative path - prepend base URL if needed
  if (url.startsWith("/")) {
    return url;
  }
  
  // Otherwise assume it's a blob storage path
  return `https://lkpleadstoragedev.blob.core.windows.net/lead-documents/${url}`;
};

// Helper function to build options from listing data
const buildOptionsFromListing = (listing, hostData) => {
  const options = [];
  
  // 1. Superhost - check if host is superhost
  if (hostData?.isSuperhost || listing?.host?.isSuperhost) {
    options.push({
      title: "Superhost",
      icon: "home",
    });
  }
  
  // 2. Location - prioritize meeting location fields, then fallback to other location fields
  const locationParts = [];
  
  // First try meeting location fields (meetingCity, meetingState, meetingCountry)
  if (listing?.meetingCity) locationParts.push(listing.meetingCity);
  if (listing?.meetingState) locationParts.push(listing.meetingState);
  if (listing?.meetingCountry) locationParts.push(listing.meetingCountry);
  
  // If no meeting location, try regular location fields
  if (locationParts.length === 0) {
    if (listing?.city) locationParts.push(listing.city);
    if (listing?.state) locationParts.push(listing.state);
    if (listing?.country) locationParts.push(listing.country);
  }
  
  // If still no location, try location field or meetingAddress
  if (locationParts.length === 0) {
    if (listing?.location) {
      locationParts.push(listing.location);
    } else if (listing?.meetingAddress) {
      locationParts.push(listing.meetingAddress);
    }
  }
  
  if (locationParts.length > 0) {
    options.push({
      title: locationParts.join(", "),
      icon: "flag",
    });
  }
  
  // 3. Category/Tags - use category, tags, or categoryName
  if (listing?.category) {
    options.push({
      title: listing.category,
      icon: "route",
    });
  } else if (listing?.categoryName) {
    options.push({
      title: listing.categoryName,
      icon: "route",
    });
  } else if (Array.isArray(listing?.tags) && listing.tags.length > 0) {
    // Use first tag as category
    options.push({
      title: listing.tags[0],
      icon: "route",
    });
  }
  
  // 4. Activity/Experience type - from keyActivities or activityType
  if (listing?.activityType) {
    options.push({
      title: listing.activityType,
      icon: "car",
    });
  } else if (Array.isArray(listing?.keyActivities) && listing.keyActivities.length > 0) {
    // Use first key activity
    const firstActivity = listing.keyActivities[0];
    if (firstActivity?.title) {
      options.push({
        title: firstActivity.title,
        icon: "car",
      });
    }
  }
  
  // Return default options if no listing data
  if (options.length === 0) {
    return [
      {
        title: "Superhost",
        icon: "home",
      },
      {
        title: "Location",
        icon: "flag",
      },
    ];
  }
  
  return options;
};

// Build parametersUser dynamically from listing data
const buildParametersUser = (listing, hostData) => {
  const params = [];
  
  // Add Superhost if applicable
  if (hostData?.isSuperhost || listing?.host?.isSuperhost) {
    params.push({
      title: "Superhost",
      icon: "home",
    });
  }
  
  // Add reviews count if available
  const reviewCount = listing?.totalReviews || listing?.reviewCount || listing?.reviews || 0;
  if (reviewCount > 0) {
    params.push({
      title: `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`,
      icon: "star-outline",
    });
  }
  
  // Return default if no data
  if (params.length === 0) {
    return [
      {
        title: "Superhost",
        icon: "home",
      },
    ];
  }
  
  return params;
};

const socials = [
  {
    title: "twitter",
    url: "https://twitter.com/ui8",
  },
  {
    title: "instagram",
    url: "https://www.instagram.com/ui8net/",
  },
  {
    title: "facebook",
    url: "https://www.facebook.com/ui8.net/",
  },
];

const ExperienceProduct = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const idParam = params.get("id");
  const id = idParam ? idParam : "2"; // default to 2 as requested

  const [listing, setListing] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publicExperiences, setPublicExperiences] = useState([]);

useEffect(() => {
  let mounted = true;
  
  // ✅ Immediately reset state when ID changes to prevent showing old data
  setListing(null);
  setHostData(null);
  setGalleryItems([]);
  setLoading(true);
  
  const load = async () => {
    try {
      // ✅ Fetch listing data first (critical path)
      const data = await getListing(id);
      if (!mounted) return;

      if (data) {
        // ✅ Set listing immediately for progressive rendering
        setListing(data);

        // ✅ Build gallery dynamically from API (optimized with for loops)
        const galleryImages = [];

        // 1️⃣ Add cover photo (if exists)
        if (data.coverPhotoUrl) {
          const formattedUrl = formatImageUrl(data.coverPhotoUrl);
          if (formattedUrl) galleryImages.push(formattedUrl);
        }

        // 2️⃣ Add listingMedia images
        if (Array.isArray(data.listingMedia)) {
          for (const media of data.listingMedia) {
            const imageUrl = formatImageUrl(media.url || media.fileUrl);
            if (imageUrl) galleryImages.push(imageUrl);
          }
        }

        // 3️⃣ Add keyActivities images
        if (Array.isArray(data.keyActivities)) {
          for (const activity of data.keyActivities) {
            if (Array.isArray(activity.images)) {
              for (const img of activity.images) {
                const imageUrl = formatImageUrl(img.url || img.imageUrl);
                if (imageUrl) galleryImages.push(imageUrl);
              }
            }
          }
        }

        setGalleryItems(galleryImages.length ? galleryImages : []);

        // ✅ Fetch host data in parallel (non-blocking)
        const leadUserId = data.leadUserId || data.host?.leadUserId;
        if (leadUserId) {
          getHost(leadUserId)
            .then((hostResponse) => {
              if (mounted) setHostData(hostResponse || null);
            })
            .catch((hostErr) => {
              console.warn("⚠️ Failed to fetch host data:", hostErr);
            });
        }

        // ✅ Fetch lead details (address, contact, etc.) - get leadId from listing
        // Try multiple possible properties for lead ID
        const leadId = data.leadId || data.lead_id || data.host?.leadId || data.leadUserId;
        if (leadId) {
          getLeadDetails(leadId)
            .then((leadResponse) => {
              if (mounted) setLeadData(leadResponse || null);
            })
            .catch((leadErr) => {
              console.warn("⚠️ Failed to fetch lead details:", leadErr);
            });
        }
        
        // ✅ Mark loading as complete once listing is ready
        setLoading(false);
      } else {
        setListing(null);
        setGalleryItems([]);
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to load listing", e);
      setListing(null);
      setGalleryItems([]);
      setLoading(false);
    } 
  };

  load();

  // New fetch logic for Explore Kerala
  const fetchKeralaListings = async () => {
    try {
      const resp = await fetch(
        `${DEFAULT_API_BASE_URL}/public/listings/filter?businessInterestId=1&categoryType=States&limit=12&offset=0&sortBy=newest`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true"
          }
        }
      );
      const data = await resp.json();
      if (Array.isArray(data?.listings)) {
        setPublicExperiences(
          data.listings.map((item) => ({
            title: item.title || "Experience",
            counter: item.city || item.location || "Kerala",
            category: "black",
            categoryText: item.basePrice ? `from ₹${item.basePrice}` : item.individualPrice ? `from ₹${item.individualPrice}` : "",
            src: item.coverPhotoUrl ? formatImageUrl(item.coverPhotoUrl) : "/images/content/browse-pic-1.jpg",
            srcSet: item.coverPhotoUrl ? formatImageUrl(item.coverPhotoUrl) : "/images/content/browse-pic-1@2x.jpg",
            url: `/experience-product?id=${item.listingId || item.id}`,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch Kerala listings", err);
    }
  };
  fetchKeralaListings();

  return () => {
    mounted = false;
  };
}, [id, location.search]); // ✅ Also depend on location.search to ensure effect runs on route changes

  // Build options dynamically from listing and host data
  const listingOptions = useMemo(() => {
    return buildOptionsFromListing(listing, hostData);
  }, [listing, hostData]);
  
  // Build parametersUser dynamically from listing and host data
  const parametersUser = useMemo(() => {
    return buildParametersUser(listing, hostData);
  }, [listing, hostData]);

  // Get rating and reviews from listing
  const rating = listing?.averageRating || listing?.rating || null;
  const reviews = listing?.totalReviews || listing?.reviewCount || listing?.reviews || null;
  
  // Get host avatar - try multiple possible fields and format URL
  const getHostAvatar = () => {
    const avatarUrl = hostData?.profilePhotoUrl || 
                      hostData?.avatar || 
                      hostData?.profileImage ||
                      hostData?.image ||
                      listing?.host?.profilePhotoUrl ||
                      listing?.host?.avatar ||
                      listing?.host?.profileImage ||
                      listing?.host?.image ||
                      null;
    
    // Format the avatar URL if it exists
    if (avatarUrl) {
      return formatImageUrl(avatarUrl);
    }
    
    return null;
  };
  
  const hostAvatar = getHostAvatar();
  
  // ✅ Build the host description with lead details (address, contact, etc.)
  const hostDescription = useMemo(() => {
    if (!leadData) return "";
    
    // Extract details from lead API response
    const address = leadData.address || leadData.businessAddress || leadData.meetingAddress;
    const contact = leadData.contactNumber || leadData.phone || leadData.mobileNumber || leadData.businessContact;
    const email = leadData.email || leadData.businessEmail;
    
    const details = [];
    if (address) details.push(`Address: ${address}`);
    if (contact) details.push(`Contact: ${contact}`);
    if (email) details.push(`Email: ${email}`);
    
    return details.join(" | ");
  }, [leadData]);

  // ✅ Progressive rendering: Show content as soon as listing data is available
  // Don't wait for host data to render the main content
  if (loading && !listing) {
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
        title={listing?.title || "Spectacular views of Queenstown"}
        options={listingOptions}
        gallery={galleryItems && galleryItems.length > 0 ? galleryItems : []}
        listingId={listing?.listingId || listing?.id}
        type="experience"
        rating={rating}
        reviews={reviews}
        hostAvatar={hostAvatar}
        mapLocation={listing?.meetingAddress || listing?.location || listing?.city}
      />

      {listing && (
        <>
          <Description classSection="section" listing={listing} hostData={hostData} />
          <Itinerary classSection="section" listing={listing} />
          <TabSection classSection="section" listing={listing} />
          <CommentsProduct
            className={cn("section", styles.comment)}
            parametersUser={parametersUser}
            info={hostDescription}
            socials={socials}
            buttonText="Contact"
            hostData={hostData}
          />
        </>
      )}
      
      {publicExperiences.length > 0 && (
        <Browse
          classSection="section"
          headSmall
          classTitle="h4"
          title="Explore Kerala"
          items={publicExperiences}
        />
      )}
    </>
  );
};

export default ExperienceProduct;
