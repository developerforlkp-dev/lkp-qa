export const slugifyTitle = (title) => {
  const raw = typeof title === "string" ? title : "";
  const normalized = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "experience";
};

export const buildExperienceUrl = (title, id) => {
  const idStr = id != null ? String(id).trim() : "";
  if (!idStr) return "/experience-product";
  return `/experience/${slugifyTitle(title)}-${idStr}`;
};

export const extractExperienceIdFromSlugAndId = (slugAndId) => {
  if (slugAndId == null) return null;
  const value = String(slugAndId).trim();
  if (!value) return null;
  const match = value.match(/-(\d+)(?:\/)?$/);
  return match?.[1] || null;
};
