export const getShareText = (listing, type) => {
  let userName = "Someone";
  try {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      userName = userInfo.name || userInfo.firstName || userName;
    }
  } catch (e) {
    console.error("Error reading userInfo from localStorage", e);
  }

  const title = listing?.title || listing?.propertyName || listing?.placeName || listing?.menuName || listing?.name || "this";
  let location = listing?.location?.address || listing?.address || listing?.fullAddress || listing?.locationName || listing?.location || listing?.city || "";
  let description = listing?.shortDescription || listing?.detailedDescription || listing?.description || listing?.aboutListing || "";
  if (description.length > 100) {
    description = description.substring(0, 97) + "...";
  }

  let text = "";

  switch (type?.toLowerCase()) {
    case "stay":
      text = `*${userName} shared an Exclusive Stay with you!* 🏡\n\n✨ *${title}*\n${location ? `📍 ${location}\n` : ""}\n_${description}_\n\nExplore this stay here:\n`;
      break;
    case "experience":
      text = `*${userName} thinks you'd love this Curated Experience!* 🌍\n\n✨ *${title}*\n${location ? `📍 ${location}\n` : ""}\n_${description}_\n\nDiscover the experience here:\n`;
      break;
    case "event":
      text = `*${userName} invited you to an Exclusive Event!* 🎫\n\n✨ *${title}*\n${location ? `📍 ${location}\n` : ""}\n_${description}_\n\nSecure your spot here:\n`;
      break;
    case "food":
      text = `*${userName} found a Culinary Gem for you!* 🍽️\n\n✨ *${title}*\n${location ? `📍 ${location}\n` : ""}\n_${description}_\n\nCheck out the menu here:\n`;
      break;
    case "place":
      text = `*${userName} shared a Must-Visit Destination with you!* 🗺️\n\n✨ *${title}*\n${location ? `📍 ${location}\n` : ""}\n_${description}_\n\nSee why you should visit here:\n`;
      break;
    default:
      text = `*${userName} shared ${title} with you!*\n\n_${description}_\n\nCheck it out here:\n`;
      break;
  }

  return text;
};
