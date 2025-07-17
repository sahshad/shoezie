export function extractPublicId(cloudinaryUrl) {
  const urlParts = cloudinaryUrl.split("/upload/");
  if (urlParts.length < 2) return null;

  const rest = urlParts[1];
  const parts = rest.split("/");

  const withoutVersion = parts.slice(1).join("/");
  return withoutVersion.replace(/\.[^/.]+$/, "");
}
