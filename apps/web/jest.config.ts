import nextJestConfig from '@repo/jest-config/next';

/**
 * Wrap the shared Next.js Jest preset to teach Jest how to resolve `@repo/core`
 * subpaths. Jest uses its own module resolver — not tsconfig `paths` or the
 * bundler's package `exports` map — so we map `@repo/core[/subpath]` straight to
 * the package source. Keeps the shared preset untouched for other packages.
 */
export default async () => {
  const base =
    typeof nextJestConfig === 'function'
      ? await nextJestConfig()
      : await nextJestConfig;
  return {
    ...base,
    moduleNameMapper: {
      ...base.moduleNameMapper,
      '^@repo/core$': '<rootDir>/../../packages/core/src/index.ts',
      '^@repo/core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    },
  };
};
