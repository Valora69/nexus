import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Allow crawling everything. De-indexing of private pages is handled by
  // noindex signals — X-Robots-Tag header (app routes, see next.config.js) and
  // `metadata.robots` (auth pages) — so Google can fetch them, see noindex,
  // and drop them. A robots.txt `Disallow` would block crawling and leave the
  // stale URLs stuck in the index instead.
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://moneyapp.click/sitemap.xml',
  };
}
