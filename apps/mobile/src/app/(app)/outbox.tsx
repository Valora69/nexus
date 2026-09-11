/**
 * Sync-queue detail screen — tapped from the `SyncStatusStrip`.
 *
 * Lists every outbox row belonging to the current user with its status
 * badge, retry count, and last error. Each `failed` row gets a Retry
 * button (returns it to `pending` for the next drain pass) and a
 * Discard button (deletes it — the write is lost, but any resulting
 * server-side inconsistency would only be with rows the *user* chose
 * to abandon). `pending` / `syncing` rows only expose Discard, since
 * retry is already implicit.
 */

import { OutboxScreen } from '../../components/features/outbox/outbox-screen';

export default function Outbox() {
  return <OutboxScreen />;
}
