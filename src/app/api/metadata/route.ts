import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { jsonError, jsonSuccess } from "@/lib/utils/response";
import { Logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return jsonError("BAD_REQUEST", "Query parameter 'url' is required.", 400);
  }

  try {
    let urlObj: URL;
    try {
      urlObj = new URL(targetUrl.trim());
    } catch {
      return jsonError("BAD_REQUEST", "Invalid URL provided.", 400);
    }

    const hostname = urlObj.hostname.toLowerCase();
    const isWikimedia =
      hostname.includes("wikimedia.org") ||
      hostname.includes("wikipedia.org") ||
      hostname.includes("commons.wikimedia.org");
    const isFlickr = hostname.includes("flickr.com") || hostname.includes("flic.kr");

    if (!isWikimedia && !isFlickr) {
      return jsonError(
        "BAD_REQUEST",
        "Auto-retrieval is only supported for Wikimedia Commons and Flickr URLs.",
        400
      );
    }

    let imageUrl = targetUrl;
    let author = "Unknown Author";
    let authorUrl = "";
    let license = "Unknown";
    let licenseUrl = "";
    let title = "";
    const source = isWikimedia ? "Wikimedia Commons" : "Flickr";
    let sourceUrl = targetUrl;

    if (isWikimedia) {
      let rawFilename: string | null = null;
      const pathname = decodeURIComponent(urlObj.pathname);

      // 1. Pathname match: /wiki/File:Filename.jpg or /File:Filename.jpg
      const fileMatch = pathname.match(/\/(?:wiki\/)?(?:File|Image):(.+)$/i);
      if (fileMatch?.[1]) {
        rawFilename = fileMatch[1];
      }

      // 2. Hash match for media viewer: #/media/File:Filename.jpg
      if (!rawFilename && urlObj.hash) {
        const hashDecoded = decodeURIComponent(urlObj.hash);
        const hashMatch = hashDecoded.match(/#(?:(?:\/media\/)?)(?:File|Image):(.+)$/i);
        if (hashMatch?.[1]) {
          rawFilename = hashMatch[1];
        }
      }

      // 3. Direct upload URLs and thumbnails
      if (
        !rawFilename &&
        (hostname.includes("upload.wikimedia.org") ||
          hostname.includes("wikimedia.org") ||
          hostname.includes("wikipedia.org"))
      ) {
        const parts = pathname.split("/").filter(Boolean);
        const thumbIdx = parts.indexOf("thumb");
        if (thumbIdx !== -1 && parts.length > thumbIdx + 3) {
          rawFilename = parts[thumbIdx + 3];
        } else if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (/\.(jpe?g|png|gif|svg|webp|tiff?|ogg|ogv)$/i.test(lastPart)) {
            rawFilename = lastPart;
          }
        }
      }

      if (rawFilename) {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|url&titles=File:${encodeURIComponent(
          rawFilename
        )}&format=json`;

        const res = await fetch(apiUrl, {
          headers: { "User-Agent": "DoldFindAdminPortal/1.0 (admin@doldfind.org)" },
        });

        if (res.ok) {
          const data = await res.json();
          const pages = data.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];
            if (page && pageId !== "-1" && page.imageinfo && page.imageinfo.length > 0) {
              const info = page.imageinfo[0];
              if (info.url) imageUrl = info.url.split("?")[0];
              if (info.descriptionurl) sourceUrl = info.descriptionurl;

              if (info.extmetadata) {
                const meta = info.extmetadata;
                if (meta.Artist?.value) {
                  const rawArtist = meta.Artist.value;
                  const $ = cheerio.load(rawArtist);
                  const link = $("a").attr("href");
                  if (link) {
                    if (link.startsWith("//")) {
                      authorUrl = `https:${link}`;
                    } else if (link.startsWith("http")) {
                      authorUrl = link;
                    } else {
                      authorUrl = `https://commons.wikimedia.org${link}`;
                    }
                  }
                  const parsedAuthor = ($.text() || rawArtist.replace(/<[^>]*>?/gm, ""))
                    .replace(/\s+/g, " ")
                    .trim();
                  if (parsedAuthor) {
                    author = parsedAuthor;
                  }
                }

                if (meta.LicenseShortName?.value) {
                  license = meta.LicenseShortName.value.trim();
                } else if (meta.License?.value) {
                  license = meta.License.value.toUpperCase().trim();
                }

                // Check categories for specific CC license tags (e.g., CC-BY-2.0)
                if (meta.Categories?.value) {
                  const ccCatMatch = meta.Categories.value.match(/\b(CC-BY(?:-SA|-NC|-ND)?-[0-9.]+)\b/i);
                  if (ccCatMatch) {
                    license = ccCatMatch[1].replace(/CC-BY/i, "CC BY").replace(/-/g, " ").trim();
                  }
                }

                if (meta.LicenseUrl?.value) {
                  const rawLicUrl = meta.LicenseUrl.value.trim();
                  licenseUrl = rawLicUrl.startsWith("//") ? `https:${rawLicUrl}` : rawLicUrl;
                }

                // Check if Credit contains a Flickr photo URL to retrieve original Flickr license
                const creditHtml = meta.Credit?.value || "";
                const flickrMatch = creditHtml.match(/https?:\/\/[^"'\s<>]*flickr\.com\/photos\/[^"'\s<]+/i);
                if (flickrMatch) {
                  const flickrPhotoUrl = flickrMatch[0];
                  try {
                    const oembedUrl = `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(
                      flickrPhotoUrl
                    )}`;
                    const oembedRes = await fetch(oembedUrl);
                    if (oembedRes.ok) {
                      const oembedData = await oembedRes.json();
                      if (oembedData.license) license = oembedData.license.trim();
                      if (oembedData.license_url) licenseUrl = oembedData.license_url.trim();
                    }
                  } catch (err) {
                    Logger.warn(`Flickr oEmbed lookup from Wikimedia Credit failed: ${err}`);
                  }
                }

                if (meta.ObjectName?.value) {
                  title = meta.ObjectName.value.replace(/\s+/g, " ").trim();
                } else {
                  title = rawFilename.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
                }
              }
            }
          }
        }
      }
    } else if (isFlickr) {
      // Flickr oEmbed & HTML meta extraction
      const oembedUrl = `https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(
        targetUrl
      )}`;
      try {
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.author_name) author = oembedData.author_name.replace(/\s+/g, " ").trim();
          if (oembedData.author_url) authorUrl = oembedData.author_url.trim();
          if (oembedData.title) title = oembedData.title.replace(/\s+/g, " ").trim();
          if (oembedData.url) imageUrl = oembedData.url.split("?")[0];
          else if (oembedData.thumbnail_url) {
            imageUrl = oembedData.thumbnail_url.replace("_q.jpg", "_b.jpg").split("?")[0];
          }
        }
      } catch (err) {
        Logger.warn(`Flickr oEmbed fetch failed: ${err}`);
      }

      try {
        const htmlRes = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const $ = cheerio.load(html);

          const ogImage = $('meta[property="og:image"]').attr("content");
          if (ogImage) imageUrl = ogImage.split("?")[0];

          const ccLink = $('a[rel="license"]').attr("href");
          if (ccLink) {
            licenseUrl = ccLink;
            if (ccLink.includes("licenses/by-sa/")) license = "CC BY-SA 4.0";
            else if (ccLink.includes("licenses/by/")) license = "CC BY 4.0";
            else if (ccLink.includes("licenses/by-nc/")) license = "CC BY-NC 4.0";
            else if (ccLink.includes("licenses/by-nd/")) license = "CC BY-ND 4.0";
            else if (ccLink.includes("publicdomain/")) {
              license = "Public Domain / CC0";
              licenseUrl = "https://creativecommons.org/publicdomain/zero/1.0/";
            }
          }
        }
      } catch (err) {
        Logger.warn(`Flickr HTML cheerio scraping failed: ${err}`);
      }
    }

    if (!licenseUrl && license !== "Unknown") {
      const licUpper = license.toUpperCase();
      if (licUpper.includes("CC BY-SA 4.0")) {
        licenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/";
      } else if (licUpper.includes("CC BY-SA 3.0")) {
        licenseUrl = "https://creativecommons.org/licenses/by-sa/3.0/";
      } else if (licUpper.includes("CC BY-SA 2.0")) {
        licenseUrl = "https://creativecommons.org/licenses/by-sa/2.0/";
      } else if (licUpper.includes("CC BY-SA")) {
        licenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/";
      } else if (licUpper.includes("CC BY 4.0")) {
        licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
      } else if (licUpper.includes("CC BY 3.0")) {
        licenseUrl = "https://creativecommons.org/licenses/by/3.0/";
      } else if (licUpper.includes("CC BY 2.0")) {
        licenseUrl = "https://creativecommons.org/licenses/by/2.0/";
      } else if (licUpper.includes("CC BY")) {
        licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
      } else if (licUpper.includes("PUBLIC DOMAIN") || licUpper.includes("PD")) {
        licenseUrl = "https://creativecommons.org/publicdomain/mark/1.0/";
      }
    }

    // Construct formatted credit string
    const creditString =
      license !== "Unknown"
        ? `${author} (${license})`
        : author !== "Unknown Author"
        ? author
        : "Unattributed";

    return jsonSuccess("Metadata retrieved successfully.", undefined, 200, {
      imageUrl,
      author,
      authorUrl,
      license,
      licenseUrl,
      sourceUrl,
      title,
      source,
      creditString,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    Logger.error("Metadata auto-retrieval failed:", msg);
    return jsonError("INTERNAL_ERROR", "Failed to retrieve metadata from URL.", 500);
  }
}
