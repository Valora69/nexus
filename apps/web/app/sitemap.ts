import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://moneyapp.click';

  // Only the public homepage belongs in the sitemap. /login is noindex'd
  // (it's an auth gate), and the app routes are behind auth + robots-blocked.
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
