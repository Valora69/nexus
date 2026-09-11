/**
 * @jest-environment node
 *
 * The post-login return path only ever points back into this app, and the
 * invite email never renders user-controlled HTML.
 */
import { describe, it, expect } from '@jest/globals';

import { safeReturnPath } from '../lib/server/google-oauth';

describe('safeReturnPath', () => {
  it('keeps same-origin paths with their query', () => {
    expect(safeReturnPath('/friends/accept?token=abc-123')).toBe(
      '/friends/accept?token=abc-123',
    );
  });

  it.each([
    'https://evil.example/phish',
    '//evil.example/phish',
    '/\\evil.example',
    'javascript:alert(1)',
    'friends/accept',
    '',
    null,
  ])('rejects %p', (value) => {
    expect(safeReturnPath(value)).toBeNull();
  });
});

describe('friend request email', () => {
  it('escapes the sender name', async () => {
    const { buildFriendRequestHtml } = await import('../lib/server/email');
    const html = buildFriendRequestHtml({
      senderName: '<img src=x onerror=alert(1)>',
      inviteUrl: 'https://moneyapp.click/friends/accept?token=t',
      isNewUser: false,
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
