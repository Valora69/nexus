import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
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
  SETTLE_FLIGHT_MS,
  SETTLE_TOAST_MS,
  SettleSlingshot,
} from '../components/features/landing/settle-slingshot';
import { demoSplitStatus, pullAmount } from '../lib/landing/demo';

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  jest.useRealTimers();
});

function renderSlingshot(
  onEvent: (event: DemoActivityEvent) => void = () => {},
) {
  function Listener() {
    useDemoActivityListener(onEvent);
    return null;
  }
  return render(
    <DemoActivityProvider>
      <Listener />
      <SettleSlingshot />
    </DemoActivityProvider>,
  );
}

const sendButton = () =>
  screen.getByRole('button', { name: 'Send ₱400 via GCash' });
const verifyButton = () =>
  screen.getByRole('button', { name: 'Verify payment' });
const resetButton = () => screen.getByRole('button', { name: 'Reset' });
const badge = () => document.querySelector<HTMLElement>('[data-status]')!;
const live = () => screen.getByRole('status');

describe('pullAmount', () => {
  it('grows with the pull in ₱10 steps and caps at the share', () => {
    expect(pullAmount(0, 160, 400)).toBe(0);
    expect(pullAmount(-30, 160, 400)).toBe(0);
    expect(pullAmount(80, 160, 400)).toBe(200);
    expect(pullAmount(83, 160, 400)).toBe(210);
    expect(pullAmount(160, 160, 400)).toBe(400);
    expect(pullAmount(900, 160, 400)).toBe(400);
  });
});

describe('demoSplitStatus with a smaller payment', () => {
  it('stays partial, like the real splitStatus', () => {
    expect(demoSplitStatus('pending', 400, 200)).toBe('partial');
    expect(demoSplitStatus('paid', 400, 200)).toBe('partial');
    expect(demoSplitStatus('pending', 400)).toBe('pending');
  });
});

describe('SettleSlingshot', () => {
  it('renders the scene, the rule and the accessible controls', () => {
    renderSlingshot();

    expect(
      screen.getByRole('heading', { name: 'Settle with a flick.' }),
    ).toBeTruthy();
    expect(screen.getByText('Mika owes you')).toBeTruthy();
    expect(screen.getByText('₱400.00')).toBeTruthy();
    expect(screen.getByText('pull back & let go')).toBeTruthy();
    expect(
      screen.getByText(
        'Payments stay pending until the person who paid confirms.',
      ),
    ).toBeTruthy();
    expect(badge().textContent).toBe('Unpaid');
    expect(verifyButton().hasAttribute('disabled')).toBe(true);
    expect(resetButton().hasAttribute('disabled')).toBe(true);
  });

  it('sends, verifies and resets through the buttons', async () => {
    jest.useFakeTimers();
    const events: DemoActivityEvent[] = [];
    renderSlingshot((event) => events.push(event));

    fireEvent.click(sendButton());

    // Mid-flight: nothing lands yet and nothing can be pressed twice.
    expect(badge().textContent).toBe('Unpaid');
    expect(sendButton().hasAttribute('disabled')).toBe(true);
    expect(verifyButton().hasAttribute('disabled')).toBe(true);
    expect(live().textContent).toBe('Sending ₱400.00 to Mika…');
    expect(events).toEqual([]);

    act(() => {
      jest.advanceTimersByTime(SETTLE_FLIGHT_MS);
    });

    expect(badge().textContent).toBe('Pending');
    expect(badge().dataset.status).toBe('pending');
    expect(screen.getByText('Payment Sent')).toBeTruthy();
    expect(live().textContent).toBe(
      'Payment sent: ₱400.00 from Mika via GCash. Status: Pending, waiting for you to verify.',
    );
    expect(events).toEqual([{ type: 'paymentSent', amount: 400 }]);
    expect(sendButton().hasAttribute('disabled')).toBe(true);
    expect(verifyButton().hasAttribute('disabled')).toBe(false);

    fireEvent.click(verifyButton());

    expect(badge().textContent).toBe('Paid');
    expect(badge().dataset.status).toBe('paid');
    expect(screen.getByText('Split Confirmed')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Payment Sent')).toBeNull());
    expect(live().textContent).toBe(
      'Payment verified. Split confirmed: Mika paid ₱400.00. Status: Paid.',
    );
    expect(verifyButton().hasAttribute('disabled')).toBe(true);

    act(() => {
      jest.advanceTimersByTime(SETTLE_TOAST_MS);
    });
    await waitFor(() =>
      expect(screen.queryByText('Split Confirmed')).toBeNull(),
    );

    fireEvent.click(resetButton());

    expect(badge().textContent).toBe('Unpaid');
    expect(live().textContent).toBe(
      'Reset. Mika owes you ₱400.00. Status: Unpaid.',
    );
    expect(sendButton().hasAttribute('disabled')).toBe(false);
    expect(resetButton().hasAttribute('disabled')).toBe(true);
    expect(events).toHaveLength(1);
  });

  it('clears pending timers on unmount', () => {
    jest.useFakeTimers();
    const { unmount } = renderSlingshot();
    fireEvent.click(sendButton());
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
