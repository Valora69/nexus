import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  LandingShell,
  TRACK_MEDIA_QUERY,
  type LandingPanel,
} from '../components/features/landing/landing-shell';

// Lenis is ESM-only; the shell loads it lazily and only in track mode.
jest.mock('../components/features/landing/smooth-scroll', () => ({
  SmoothScroll: () => null,
}));

const PANELS: LandingPanel[] = [
  { key: 'hero', label: 'Start', content: <p>Hero content</p> },
  {
    key: 'features',
    label: 'Features',
    width: 'content',
    content: <section id="features">Feature cards</section>,
  },
  { key: 'how', label: 'How it works', content: <p>Steps</p> },
];

type MatchMediaStub = {
  matches: boolean;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};

function stubMatchMedia(matches: boolean): MatchMediaStub {
  const query: MatchMediaStub = {
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  window.matchMedia = jest.fn(
    () => query,
  ) as unknown as typeof window.matchMedia;
  return query;
}

async function renderShell() {
  const result = render(
    <LandingShell header={<header>Nav</header>} panels={PANELS}>
      <footer>Footer</footer>
    </LandingShell>,
  );
  // Let the lazily loaded SmoothScroll settle inside act().
  await act(async () => {});
  return result;
}

const shellMode = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-mode]')?.dataset.mode;

afterEach(() => {
  delete (window as { matchMedia?: unknown }).matchMedia;
  jest.restoreAllMocks();
});

describe('LandingShell', () => {
  it('stacks panels vertically where matchMedia is unavailable', async () => {
    const { container } = await renderShell();

    expect(shellMode(container)).toBe('vertical');
    expect(
      screen.queryByRole('navigation', { name: 'Page sections' }),
    ).toBeNull();
    expect(
      [...container.querySelectorAll('[data-landing-panel]')].map((el) =>
        el.getAttribute('data-landing-panel'),
      ),
    ).toEqual(['Start', 'Features', 'How it works']);
    expect(screen.getByText('Footer')).toBeTruthy();
  });

  it('stays vertical on small screens, coarse pointers, or reduced motion', async () => {
    stubMatchMedia(false);
    const { container } = await renderShell();

    expect(window.matchMedia).toHaveBeenCalledWith(TRACK_MEDIA_QUERY);
    expect(TRACK_MEDIA_QUERY).toContain('(min-width: 1024px)');
    expect(TRACK_MEDIA_QUERY).toContain('(pointer: fine)');
    expect(TRACK_MEDIA_QUERY).toContain(
      '(prefers-reduced-motion: no-preference)',
    );
    expect(shellMode(container)).toBe('vertical');
    expect(container.querySelector('main')?.getAttribute('style')).toBeNull();
  });

  it('runs the sideways track with a labeled progress rail when the query matches', async () => {
    stubMatchMedia(true);
    const scrollTo = jest.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    const { container } = await renderShell();

    expect(shellMode(container)).toBe('track');
    const rail = screen.getByRole('navigation', { name: 'Page sections' });
    const dots = rail.querySelectorAll('button');
    expect([...dots].map((b) => b.textContent)).toEqual([
      'Start',
      'Features',
      'How it works',
    ]);
    expect(dots[0]?.getAttribute('aria-current')).toBe('step');

    fireEvent.click(screen.getByRole('button', { name: 'How it works' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: expect.any(Number) });
  });

  it('removes its media listener on unmount', async () => {
    const query = stubMatchMedia(true);
    const { unmount } = await renderShell();
    const onChange = query.addEventListener.mock.calls[0]?.[1];

    unmount();
    expect(query.removeEventListener).toHaveBeenCalledWith('change', onChange);
  });
});
