import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { MotionGlobalConfig } from 'motion/react';

import {
  DemoActivityProvider,
  useDemoActivityListener,
  type DemoActivityEvent,
} from '../components/features/landing/demo-activity-provider';
import {
  HERO_MAX_ROWS,
  HERO_MAX_TOASTS,
  HERO_TOAST_MS,
  HeroStage,
} from '../components/features/landing/hero-stage';
import { formatPeso } from '../lib/landing/demo';
import { createDemoRng, randomDemoExpense } from '../lib/landing/simulated';

// Finish enter/exit animations immediately so list lengths settle.
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  jest.useRealTimers();
});

function renderStage(onEvent: (event: DemoActivityEvent) => void = () => {}) {
  function Listener() {
    useDemoActivityListener(onEvent);
    return null;
  }
  return render(
    <DemoActivityProvider>
      <Listener />
      <HeroStage />
    </DemoActivityProvider>,
  );
}

const ledger = () => screen.getByRole('region', { name: 'Group ledger' });
const panel = () => screen.getByRole('region', { name: 'Add Expense' });
const ledgerRows = () => within(ledger()).getAllByRole('listitem');
const toastCount = () => screen.queryAllByText('New Expense Added').length;
const coinKey = () =>
  screen.getByRole('button', { name: 'Add a demo expense' });
const chip = (name: string) =>
  within(screen.getByRole('group', { name: 'Split with Members' })).getByRole(
    'button',
    { name },
  );

describe('HeroStage', () => {
  it('renders the group ledger and an Add Expense panel that mirrors the modal', () => {
    renderStage();

    expect(screen.getByText('Barkada · BGC')).toBeTruthy();
    expect(ledgerRows()).toHaveLength(3);
    for (const label of [
      'Expense Name *',
      'Amount (₱) *',
      'Split Type',
      'Split Preview',
    ]) {
      expect(within(panel()).getByText(label)).toBeTruthy();
    }
    expect(chip('Sid (You)').getAttribute('aria-pressed')).toBe('true');
    expect(
      within(panel())
        .getByRole('button', { name: 'Divide Equally' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('adds the next seeded demo expense to the ledger, toasts, announcer and demo activity', () => {
    const expected = randomDemoExpense(createDemoRng());
    const events: DemoActivityEvent[] = [];
    renderStage((event) => events.push(event));

    fireEvent.click(coinKey());

    const rows = ledgerRows();
    expect(rows).toHaveLength(4);
    expect(within(rows[0]!).getByText(expected.name)).toBeTruthy();
    expect(within(panel()).getByText(expected.name)).toBeTruthy();
    expect(toastCount()).toBe(1);
    expect(
      screen.getByText(
        `Added ${expected.name} ${formatPeso(expected.total).replace(/\.00$/, '')}`,
      ),
    ).toBeTruthy();
    expect(events).toEqual([
      { type: 'expenseAdded', amount: expected.total },
      { type: 'quickAdded' },
    ]);
  });

  it('keeps at most 5 ledger rows and 3 toasts', async () => {
    renderStage();

    for (let i = 0; i < 6; i++) fireEvent.click(coinKey());

    await waitFor(() => expect(ledgerRows()).toHaveLength(HERO_MAX_ROWS));
    await waitFor(() => expect(toastCount()).toBe(HERO_MAX_TOASTS));
  });

  it('dismisses toasts after a few seconds', async () => {
    jest.useFakeTimers();
    renderStage();

    fireEvent.click(coinKey());
    expect(toastCount()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(HERO_TOAST_MS);
    });
    await waitFor(() => expect(toastCount()).toBe(0));
  });

  it('toggles member chips and recomputes the equal split preview', () => {
    renderStage();
    // Pizza night ₱1,200 across all five members.
    expect(within(panel()).getAllByText('₱240.00')).toHaveLength(5);

    fireEvent.click(chip('Job'));

    expect(chip('Job').getAttribute('aria-pressed')).toBe('false');
    expect(within(panel()).queryAllByText('₱240.00')).toHaveLength(0);
    expect(within(panel()).getAllByText('₱300.00')).toHaveLength(4);
  });

  it('shows the modal custom-split checks under Custom Amounts', () => {
    renderStage();

    fireEvent.click(
      within(panel()).getByRole('button', { name: 'Custom Amounts' }),
    );

    expect(
      within(panel()).getByText('Total assigned: ₱1,200.00 / ₱1,200.00'),
    ).toBeTruthy();
    expect(within(panel()).getByText('Excluded')).toBeTruthy();
    expect(
      within(panel()).getByText('1 member excluded (zero amount)'),
    ).toBeTruthy();

    fireEvent.click(chip('Ced'));

    expect(
      within(panel()).getByText(/Total assigned: .* — amounts must match/),
    ).toBeTruthy();
  });

  it('asks for at least one member when every chip is off', () => {
    renderStage();

    for (const name of ['Sid (You)', 'Ced', 'Glenn', 'Migs', 'Job']) {
      fireEvent.click(chip(name));
    }

    expect(
      within(panel()).getByText('Select at least one member'),
    ).toBeTruthy();
  });

  it('presses the coin key down for Enter and Space too', () => {
    renderStage();

    fireEvent.keyDown(coinKey(), { key: 'Enter' });
    expect(coinKey().getAttribute('data-pressed')).toBe('true');
    fireEvent.keyUp(coinKey(), { key: 'Enter' });
    expect(coinKey().getAttribute('data-pressed')).toBe('false');
  });

  it('shows a Q keycap that the physical Q key presses', () => {
    renderStage();

    expect(within(coinKey()).getByText('Q')).toBeTruthy();
    expect(coinKey().getAttribute('aria-keyshortcuts')).toBe('Q');

    fireEvent.keyDown(window, { key: 'q' });
    expect(coinKey().getAttribute('data-pressed')).toBe('true');
    expect(ledgerRows()).toHaveLength(4);
    fireEvent.keyUp(window, { key: 'q' });
    expect(coinKey().getAttribute('data-pressed')).toBe('false');

    // Held keys, shortcuts, and typing in a field don't add expenses.
    fireEvent.keyDown(window, { key: 'q', repeat: true });
    fireEvent.keyDown(window, { key: 'q', metaKey: true });
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'q' });
    input.remove();
    expect(ledgerRows()).toHaveLength(4);
  });
});
