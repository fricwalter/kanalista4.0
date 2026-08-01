const ALLOWED_HOSTS = new Set([
  "51.158.145.100",
  "103.176.90.92",
  "103.176.90.95",
  "103.176.90.118",
  "picons.cmshulk.com",
  "logo.protv.cc",
  "images.seeklogo.com",
]);

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const runtime = "edge";

function errorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const source = new URL(request.url).searchParams.get("url");
  if (!source) return errorResponse("Missing image URL", 400);

  let imageUrl: URL;
  try {
    imageUrl = new URL(source);
  } catch {
    return errorResponse("Invalid image URL", 400);
  }

  if (!ALLOWED_HOSTS.has(imageUrl.hostname.toLowerCase())) {
    return errorResponse("Image host is not allowed", 403);
  }
  if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
    return errorResponse("Unsupported image protocol", 400);
  }

  try {
    const deliveryUrl = new URL("https://wsrv.nl/");
    deliveryUrl.searchParams.set("url", imageUrl.toString().replace(/^http:\/\//, ""));
    deliveryUrl.searchParams.set("w", "320");
    deliveryUrl.searchParams.set("h", "320");
    deliveryUrl.searchParams.set("fit", "inside");
    deliveryUrl.searchParams.set("output", "png");

    const upstream = await fetch(deliveryUrl.toString(), {
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5" },
    });
    if (!upstream.ok) return errorResponse("Image unavailable", 502);

    const contentType = (upstream.headers.get("Content-Type") || "").split(";", 1)[0].toLowerCase();
    const contentLength = Number(upstream.headers.get("Content-Length") || "0");
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) return errorResponse("Unsupported image type", 415);
    if (contentLength > MAX_IMAGE_BYTES) return errorResponse("Image is too large", 413);
    const imageBytes = await upstream.arrayBuffer();
    if (imageBytes.byteLength > MAX_IMAGE_BYTES) return errorResponse("Image is too large", 413);

    return new Response(imageBytes, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorResponse("Image fetch failed", 504);
  }
}
