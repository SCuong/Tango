/**
 * Resources loaded before the service worker controlled the page (first visit) are handed to it
 * for caching, so the next launch works offline (docs/ARCHITECTURE.md §5). Covers the built
 * JS/CSS, fonts, the manifest, and bundled images such as the brand wordmark (.webp).
 */
const FIRST_VISIT_ASSET = /\.(js|css|woff2?|svg|webp|png|webmanifest)(\?|$)|fonts\.googleapis\.com/;

/** True for a resource URL the page should report to the service worker on first visit. */
export function isFirstVisitAsset(url: string): boolean {
  return FIRST_VISIT_ASSET.test(url);
}
