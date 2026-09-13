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
const { AddExpensePlayground, PLAYGROUND_TOAST_MS, RECEIPT_PRINT_MS } =
  require('../components/features/landing/add-expense-playground') as typeof import('../components/features/landing/add-expense-playground');
/* eslint-enable @typescript-eslint/no-var-requires */

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  jest.useRealTimers();
});

function renderPlayground(
  onEvent: (event: DemoActivityEvent) => void = () => {},
) {
  function Listener() {
    useDemoActivityListener(onEvent);
    return null;
  }
  return render(
    <DemoActivityProvider>
      <Listener />
      <AddExpensePlayground />
    </DemoActivityProvider>,
  );
}

const amount = () => screen.getByRole('status', { name: 'Amount' });
const keypad = () => screen.getByRole('group', { name: 'Amount keypad' });
const key = (name: string) => within(keypad()).getByRole('button', { name });
const tapKeys = (...names: string[]) =>
  names.forEach((name) => fireEvent.click(key(name)));
const chip = (name: string) =>
  within(screen.getByRole('group', { name: 'Split with Members' })).getByRole(
    'button',
    { name },
  );
const addButton = () => screen.getByRole('button', { name: 'Add Expense' });
const ledgerRows = () =>
  within(screen.getByRole('region', { name: 'Group ledger' })).getAllByRole(
    'listitem',
  );

describe('AddExpensePlayground', () => {
  it('renders the panel with the modal labels', () => {
    renderPlayground();

    expect(
      screen.getByRole('heading', {
        name: 'Add it before the bill hits the table.',
      }),
    ).toBeTruthy();
    expect(document.getElementById('how-it-works')).toBeTruthy();
    for (const label of [
      'Expense Name *',
      'Amount (₱) *',
      'Split Type',
      'Split Preview',
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(
      screen
        .getByRole('button', { name: 'Divide Equally' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('fills the name from a scenario chip', () => {
    renderPlayground();
    const scenarios = screen.getByRole('group', { name: 'Scenario' });

    fireEvent.click(
      within(scenarios).getByRole('button', { name: 'Groceries' }),
    );

    expect(
      screen.getByLabelText<HTMLInputElement>('Expense Name *').value,
    ).toBe('Groceries');
    expect(
      within(scenarios)
        .getByRole('button', { name: 'Groceries' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('builds the amount from keypad taps, 00 and delete', () => {
    renderPlayground();
    expect(amount().textContent).toBe('₱0.00');

    tapKeys('1', '2', '00');
    expect(amount().textContent).toBe('₱1,200.00');

    tapKeys('Delete');
    expect(amount().textContent).toBe('₱120.00');

    // Leading zeros don't stick, and the amount stops at five digits.
    tapKeys('Delete', 'Delete', 'Delete', '0', '00', '9');
    expect(amount().textContent).toBe('₱9.00');
    tapKeys('9', '9', '9', '9', '9', '9');
    expect(amount().textContent).toBe('₱99,999.00');
  });

  it('limits custom shares to two decimals and the bill total', () => {
    renderPlayground();
    tapKeys('1', '2', '00');
    fireEvent.click(screen.getByRole('button', { name: 'Custom Amounts' }));
    const sid = () => screen.getByLabelText<HTMLInputElement>('Sid amount');

    fireEvent.change(sid(), { target: { value: '450.5' } });
    expect(sid().value).toBe('450.5');
    fireEvent.change(sid(), { target: { value: '450.555' } });
    fireEvent.change(sid(), { target: { value: '1200.01' } });
    fireEvent.change(sid(), { target: { value: '12a' } });
    expect(sid().value).toBe('450.5');
    fireEvent.change(sid(), { target: { value: '1200' } });
    expect(sid().value).toBe('1200');
  });

  it('takes typed digits and Backspace only while the keypad has focus', () => {
    renderPlayground();

    fireEvent.keyDown(window, { key: '5' });
    fireEvent.keyDown(document.body, { key: '5' });
    expect(amount().textContent).toBe('₱0.00');

    keypad().focus();
    for (const k of ['3', '9', '0', '0'])
      fireEvent.keyDown(keypad(), { key: k });
    expect(amount().textContent).toBe('₱3,900.00');
    expect(key('0').dataset.pressed).toBe('true');
    fireEvent.keyUp(keypad(), { key: '0' });
    expect(key('0').dataset.pressed).toBe('false');

    fireEvent.keyDown(keypad(), { key: 'Backspace' });
    expect(amount().textContent).toBe('₱390.00');

    // Shortcuts and non-digits are left alone.
    fireEvent.keyDown(keypad(), { key: '1', metaKey: true });
    fireEvent.keyDown(keypad(), { key: 'a' });
    expect(amount().textContent).toBe('₱390.00');
  });

  it('toggles members and recomputes the equal split', () => {
    renderPlayground();
    tapKeys('1', '2', '00');
    const preview = () => screen.getByText('Split Preview').parentElement!;

    expect(within(preview()).getAllByText('₱240.00')).toHaveLength(5);

    fireEvent.click(chip('Job'));

    expect(chip('Job').getAttribute('aria-pressed')).toBe('false');
    expect(within(preview()).queryAllByText('₱240.00')).toHaveLength(0);
    expect(within(preview()).getAllByText('₱300.00')).toHaveLength(4);
  });

  it('disables Add Expense with the modal messages until the form is valid', () => {
    renderPlayground();
    expect(addButton().hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Tap an amount on the keypad')).toBeTruthy();

    tapKeys('1', '2', '00');
    expect(addButton().hasAttribute('disabled')).toBe(false);

    for (const name of ['Sid', 'Ced', 'Glenn', 'Migs', 'Job'])
      fireEvent.click(chip(name));
    expect(addButton().hasAttribute('disabled')).toBe(true);
    expect(
      screen.getAllByText('Select at least one member').length,
    ).toBeGreaterThan(0);

    fireEvent.click(chip('Sid'));
    fireEvent.click(chip('Ced'));
    fireEvent.click(screen.getByRole('button', { name: 'Custom Amounts' }));

    expect(
      screen.getByText(
        'Total assigned: ₱0.00 / ₱1,200.00 — amounts must match',
      ),
    ).toBeTruthy();
    expect(addButton().hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Sid amount'), {
      target: { value: '700' },
    });
    expect(screen.getByText('1 member excluded (zero amount)')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Ced amount'), {
      target: { value: '500' },
    });

    expect(
      screen.getByText('Total assigned: ₱1,200.00 / ₱1,200.00'),
    ).toBeTruthy();
    expect(addButton().hasAttribute('disabled')).toBe(false);
  });

  it('confirms, prints a receipt into the ledger, toasts and reports the expense', async () => {
    jest.useFakeTimers();
    const events: DemoActivityEvent[] = [];
    renderPlayground((event) => events.push(event));
    tapKeys('1', '2', '00');
    fireEvent.click(chip('Job'));

    fireEvent.click(addButton());

    expect(
      screen.getByText(
        'You paid ₱1,200.00 for "Pizza night". This will be split among 4 members.',
      ),
    ).toBeTruthy();
    // Mid-print: nothing filed yet, and no double submits.
    expect(addButton().hasAttribute('disabled')).toBe(true);
    expect(ledgerRows()).toHaveLength(2);
    expect(events).toEqual([]);

    act(() => {
      jest.advanceTimersByTime(RECEIPT_PRINT_MS);
    });

    const rows = ledgerRows();
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByText('Pizza night')).toBeTruthy();
    expect(within(rows[0]!).getByText('New')).toBeTruthy();
    expect(screen.getByText('Expense added')).toBeTruthy();
    expect(
      screen.getByText('Expense added: Pizza night ₱1,200.00'),
    ).toBeTruthy();
    expect(events).toEqual([{ type: 'expenseAdded', amount: 1200 }]);
    expect(amount().textContent).toBe('₱0.00');

    act(() => {
      jest.advanceTimersByTime(PLAYGROUND_TOAST_MS);
    });
    await waitFor(() => expect(screen.queryByText('Expense added')).toBeNull());
  });

  it('drops the "split among" sentence for a single member, like the modal', () => {
    renderPlayground();
    tapKeys('2', '4', '0');
    for (const name of ['Ced', 'Glenn', 'Migs', 'Job'])
      fireEvent.click(chip(name));

    fireEvent.click(addButton());

    expect(
      screen.getByText('You paid ₱240.00 for "Pizza night".'),
    ).toBeTruthy();
  });
});
