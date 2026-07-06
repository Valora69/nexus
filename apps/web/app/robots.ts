import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/home',
          '/groups',
          '/expenses',
          '/payments',
          '/profile',
          '/friends',
        ],
      },
    ],
    sitemap: 'https://moneyapp.click/sitemap.xml',
  };
}
