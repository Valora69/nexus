import { act, render, waitFor } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  DemoActivityProvider,
  useDemoActivity,
} from '../components/features/landing/demo-activity-provider';
import { QUICK_ADDS_ENDPOINT } from '../lib/landing/quick-adds';

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
    }: {
      value: number;
      locales?: string;
      format?: Intl.NumberFormatOptions;
    }) =>
      createElement(
        'span',
        null,
        new Intl.NumberFormat(locales, format).format(value),
      ),
  };
});

// Required after the mock is registered: static imports would load first.
/* eslint-disable @typescript-eslint/no-var-requires */
const { NavCounter } =
  require('../components/features/landing/nav-counter') as typeof import('../components/features/landing/nav-counter');
/* eslint-enable @typescript-eslint/no-var-requires */

/** A fake endpoint holding the shared total. */
let shared = 0;
const fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
  if (init?.method === 'POST') {
    shared += (JSON.parse(init.body as string) as { presses: number }).presses;
  }
  return { ok: true, json: async () => ({ count: shared }) };
});

beforeEach(() => {
  shared = 0;
  fetchMock.mockClear();
  (window as unknown as { fetch: unknown }).fetch = fetchMock;
});

afterEach(() => {
  delete (window as unknown as { fetch?: unknown }).fetch;
});

function renderCounter() {
  let activity: ReturnType<typeof useDemoActivity> | null = null;
  function Grab() {
    activity = useDemoActivity();
    return null;
  }
  render(
    <DemoActivityProvider>
      <Grab />
      <NavCounter />
    </DemoActivityProvider>,
  );
  return { activity: () => activity! };
}

const counterText = () =>
  document.querySelector<HTMLElement>('[data-nav-counter]')!.textContent;

describe('NavCounter', () => {
  it('starts at zero, then shows the shared total with no demo label', async () => {
    shared = 41;
    renderCounter();
    expect(counterText()).toContain('0quick adds');

    await waitFor(() => expect(counterText()).toContain('41quick adds'));
    expect(fetchMock).toHaveBeenCalledWith(QUICK_ADDS_ENDPOINT, {
      cache: 'no-store',
    });
    expect(counterText()).not.toMatch(/demo|split|₱/i);
  });

  it('counts each quick add right away and sends the presses in one batch', async () => {
    shared = 41;
    const { activity } = renderCounter();
    await waitFor(() => expect(counterText()).toContain('41quick adds'));

    act(() => {
      activity().quickAdded();
      activity().quickAdded();
      activity().quickAdded();
    });
    expect(counterText()).toContain('44quick adds');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        QUICK_ADDS_ENDPOINT,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ presses: 3 }),
        }),
      ),
    );
    await waitFor(() => expect(shared).toBe(44));
    expect(counterText()).toContain('44quick adds');
  });

  it('ignores expenses and payments, and says "quick add" for one', async () => {
    const { activity } = renderCounter();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    act(() => {
      activity().expenseAdded(1200);
      activity().paymentSent(400);
    });
    expect(counterText()).toContain('0quick adds');

    act(() => {
      activity().quickAdded();
    });
    expect(counterText()).toContain('1quick add');
    expect(counterText()).not.toContain('1quick adds');
  });
});
