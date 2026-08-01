const DIRECT_HTTPS_HOSTS = new Set(["picons.cmshulk.com"]);

export function getChannelImageUrl(value: string): string {
  const image = value.trim();
  if (!image) return "";
  if (image.startsWith("data:image/")) return image;

  const normalized = image.startsWith("//") ? `https:${image}` : image;

  try {
    const url = new URL(normalized);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol !== "http:") return "";

    if (DIRECT_HTTPS_HOSTS.has(url.hostname.toLowerCase())) {
      url.protocol = "https:";
      return url.toString();
    }

    return `/api/channel-icon?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return "";
  }
}
