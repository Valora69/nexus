import { render } from '@testing-library/react';
import { describe, it, expect, jest, afterAll } from '@jest/globals';

// @number-flow/react pulls in ESM-only packages Jest can't load; render the
// formatted value as plain text instead.
jest.mock('@number-flow/react', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: ({
      value,
      locales,
      format,
      className,
    }: {
      value: number;
      locales?: string;
      format?: Intl.NumberFormatOptions;
      className?: string;
    }) =>
      createElement(
        'span',
        { className },
        new Intl.NumberFormat(locales, format).format(value),
      ),
  };
});

// Required after the mock is registered: static imports would load first.
/* eslint-disable @typescript-eslint/no-var-requires */
const RootPage = (require('../app/page') as typeof import('../app/page'))
  .default;
/* eslint-enable @typescript-eslint/no-var-requires */

(window as unknown as { fetch: typeof fetch }).fetch = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => [],
    }),
  ) as unknown as typeof fetch;

describe('Root page', () => {
  const { container, unmount } = render(<RootPage />);

  it('should match the snapshot', () => {
    expect(container).toMatchSnapshot();
  });

  it('should have the correct tree parent', () => {
    expect(container).toBeInstanceOf(HTMLDivElement);
  });

  afterAll(() => {
    unmount();
  });
});
