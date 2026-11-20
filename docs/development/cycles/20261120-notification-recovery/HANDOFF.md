# Production notification recovery acceptance

## Source and ownership

This separate continuation starts from integrated local source
`d92f20bcdba146cd5d3d482ee830210e2bdb1ae2`, tree
`0238e6ad6a9add7d712e3b5bf5ff0eabf993d870`. The local branch is
`codex/classrup-notification-recovery-20261120`. Root owns integration,
publication and any hosted qualification. Read the current remote candidate
and its latest handoff before combining this local history with published
commits whose source trees may match but whose commit IDs differ.

The worker owns only the new
`tests/integration/production-notification-recovery.test.ts` and this note.
Production code, backup formats, registered codecs, normalization policy,
cryptographic parameters, test limits and CI configuration are unchanged.

## Acceptance purpose

Earlier production-registry tests populate archive, publication, location,
listing history and retained listing records. Existing notification backup
coverage uses a memory-backed preference subset. This continuation exercises
all six existing notification-domain codecs through the production encrypted
IndexedDB adapter, the complete `productionBackupCodecs` registry, and normal
inbox/preference readers after a close and reopen.

The scenario creates its records through `localNotificationDefinitions`, the
kernel command bus, and its local owner authorization context. It uses the
vault-internal `notify.notification.create` command for already accepted local
inbox data. It does not manufacture records through raw writes, and it does
not claim to verify an upstream signed barter producer or implement new alert
sources.

The source has three notification rows: an earlier read cycle notice with two
collapsed source events, an unread security notice, and a newer unread cycle
notice. An offers preference is disabled, producing a hidden source event.
The seven category preferences are materialized. The resulting 18 domain
records populate these six registered types:

| Domain record type | Source count | Purpose |
|---|---:|---|
| `notify.notification` | 3 | Read/unread inbox rows and collapse state |
| `notify.notification_seen` | 5 | Ordinary source-event deduplication |
| `notify.notification_day` | 1 | Current source's local daily count |
| `notify.notification_diag` | 1 | Local created/collapsed/read/hidden totals |
| `notify.preference` | 7 | All category preferences, including locked security |
| `notify.pref_counter` | 1 | Local preference-edit count |

The test establishes nonempty expected results before comparing the normal
paginated inbox, unread/category filters, unread counts and preference matrix
after export, after restoration and after encrypted connection reopen.
Supplementary record checks preserve dedupe/counter keys, values and row
metadata. The signing principal and a deterministic signature are preserved.
Export preflight must leave the source views and counters unchanged.

## Continued behavior after reopen

The restored local handlers must continue ordinary work:

1. A repeated accepted source ID returns the existing duplicate-state result
   without changing domain counters. The invocation uses a fresh command
   idempotency key, so this specifically checks the restored notification
   dedupe record rather than relying on the excluded kernel idempotency store.
2. A fresh cycle update collapses into the recovered unread row, exercising
   the rebuilt collapse index and continuing its count.
3. Turning cycle preferences off uses the real local outbox dispatcher to run
   the preference-change subscriber. Only unread cycle rows are removed;
   the earlier read cycle notice remains.
4. A further disabled-category update is hidden. Bulk mark-read handles the
   remaining security notice and reports zero unread rows. Domain daily,
   preference-edit, dedupe and diagnostic counters continue from their saved
   values.

## Recovery-policy boundaries

The six codecs preserve notification-domain data; none has a delivery-state
reset normalizer. Their local dedupe and counters are domain records, distinct
from excluded kernel outbox/inbox, sync queues, idempotency, leases and dead
letters. The test does not change those exclusions or claim delivery recovery.
New post-recovery commands legitimately emit fresh local events.

Normal preference queries continue to report inactive push/email channels and
no mirror reference, and no sync delivery is enqueued. No channel-grant,
relay-destination, mirror or unsubscribe fixture is introduced. Restoring local
preference flags does not establish external-delivery authority.

The test uses `fake-indexeddb` with actual production vault encryption and
normal close/reopen. It does not qualify native browsers, device persistence,
crash/interruption recovery, copied-vault coordination, attachments or key
rotation. It retains the existing 30-second integration-test cap.

## Verification and next worker

At preparation, root's full candidate qualification was running in serial
groups. This worker performed source inspection and staged whitespace checks
without starting a compiler or test process. The new scenario remains
unexecuted until root records an explicit runner result. A separate recovery
policy reviewer found no fixture blocker by source inspection, including the
18-record count, counter transitions, preference subscriber and authority
exclusions. Its complete findings belong to its own review note.

Run the focused new test and full repository typecheck when the serial runner
is available. Inspect any mismatch before changing production behavior. Record
the exact source/tree, commands, outcomes, timing and actual review evidence.
Keep this independently scoped continuation separate while its predecessor
awaits qualification. Never substitute the predecessor's passing checks for
this new test's execution or current-source hosted gates.
