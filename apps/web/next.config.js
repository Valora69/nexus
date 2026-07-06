/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ['@repo/ui'],
  async headers() {
    // App routes live behind auth — emit `noindex` via HTTP header. These are
    // client components, so Next's `metadata` export isn't available to them.
    // The pages must stay crawlable (not robots-disallowed) for Google to
    // actually fetch this header and drop them from the index.
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    const appPaths = [
      'home',
      'groups',
      'expenses',
      'payments',
      'profile',
      'friends',
    ];
    return appPaths.flatMap((path) => [
      { source: `/${path}`, headers: noindex },
      { source: `/${path}/:rest*`, headers: noindex },
    ]);
  },
};
