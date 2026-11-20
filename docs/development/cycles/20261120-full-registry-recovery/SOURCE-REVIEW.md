# Full production-registry recovery: source review

## Result and source identity

**No blocking source, functional-design, or defensive issue was identified in this bounded acceptance change.** The fixture exercises the intended interaction between accepted signed barter evidence, real local inbox delivery, complete registered-record recovery, and ordinary owner actions after reopening. Its assertions distinguish recovery normalization from retained local state and detect both an extra inbox row and an unintended collapsed update.

This report reviews source and assertion design. It does not report compiler or test execution results; the integration lane records those separately for the exact source below.

| Reviewed item | Exact identity |
| --- | --- |
| Commit | `99cce1075e066acaefd863d59d23a6fea51f988c` |
| Tree | `ba98ba4ef99f35a32068b1adc5725a4204c76ed9` |
| Parent, PR62 | `4fc8e9c8aab75dec89d77677b4b25c50bd749632` |
| Changed executable file | [production-barter-recovery.test.ts](../../../../tests/integration/production-barter-recovery.test.ts) |
| Test Git blob | `aa0078f19382a45842c7346a2173f161c79eb2d9` |
| Test SHA-256 | `31028c11a3abd3c46fb79a284b71826fe8dbac7bd687dbfa058d98e32a5c3612` |
| Test size | 35,132 bytes |
| Review date | 2026-11-20 |

The complete committed diff contains the test and [implementation notes](IMPLEMENTATION.md). It changes no production, dependency, workflow, or configuration file. Direct comparison against the parent found no difference under `apps/` or `packages/`; the reviewed working-tree source matched the commit. The implementation notes were checked against the test and the cited production paths rather than treated as execution evidence.

## Findings against the acceptance design

| Review boundary | Finding and concrete evidence | Assessment |
| --- | --- | --- |
| Production composition | The test-local `runtime` adds the existing `localNotificationDefinitions` and `locationDefinitions`, uses `barter.isBlocked`, shares the owner storage/clock/IDs between the normal command bus and real dispatcher, and uses the production `drainNotificationDelivery` helper. These are the factories and local notification options used by [PWA connection](../../../../apps/pwa/src/main.ts). [Local notification composition](../../../../packages/notify/src/local.ts). | Domain wiring is exercised directly. The test does not mount the complete PWA connection/session UI. |
| Signed evidence to captured event | The existing real-signature listing/want/proposal/reservation/consent setup is retained. The owner bus collecting sink captures successful command events; it does not inject events. `makeEmitter` appends those envelopes to the outbox, and the bus publishes the collected events after successful non-replayed command completion. The coordination handler emits `mutiny.coordination.observed` only for newly accepted evidence, with `actorId` taken from the verified envelope. [Emitter](../../../../packages/kernel/src/bus/emit.ts), [bus](../../../../packages/kernel/src/bus/bus.ts), [collecting sink](../../../../packages/kernel/src/events/envelope.ts), [coordination ingestion](../../../../packages/mutiny/src/trade_proposals/repository.ts). | The two captured peer event IDs come from the actual accepted reservation and consent path. The new code uses ordinary commands and read-only record snapshots, with no direct notification creation or domain-record insertion. |
| Subscriber result and provenance | The fixture requires two peer observations with the owner's tenant and proposal subject, then one unread cycles notification with count two, the coordination template, the cycle reference, and exactly those source event IDs. Its dedupe row IDs must match the same events. Day count two, preference edit count one, and diagnostics with one creation/one collapse are explicit assertions. The [router](../../../../packages/notify/src/delivery/inapp/routing.ts) and [inbox producer](../../../../packages/notify/src/delivery/inapp/index.ts) explain why local actions are skipped and the two peer updates collapse. | Notification records are meaningful derived state, rather than merely six additional populated type names. The bounded dedupe-pointer qualification is recorded below. |
| Preference and independent archive setup | A normal offers preference change leaves cycles enabled and materializes all seven local preference cells plus the edit counter. A separate, non-barter giveaway listing is created, published, and archived through the owner commands, preserving the cycle's promised item and hold. The fixture checks the returned archive identity and its listing/owner/status relationship. [Preference commands](../../../../packages/notify/src/preferences/in/index.ts), [listing lifecycle](../../../../packages/bazaar/src/listings/lifecycle.ts), [archive commands/queries](../../../../packages/bazaar/src/listings/archive.ts). | The added population does not substitute an archived item for the signed cycle's live inventory. External notification channels remain inactive in the asserted preference view. |
| Full registry and complete record snapshot | The 15 explicitly named types must equal the [production registry](../../../../apps/pwa/src/backup-codecs.ts), have positive coverage counts, and report no unsupported type or exceeded coverage limit. `domainRecords` reads each type in a stable order with limit 100, then requires its total length to equal the coverage record count. Restore and reopen compare the entire record list to an explicitly constructed expectation. | The count equality prevents an unnoticed per-type read truncation in this fixture. Full-record equality covers IDs, tenant, type, revision, timestamps, and payloads, beyond ordinary view equality. |
| Export and restore oracle | Export must leave the source commitment, location window, all domain rows, views, and notification counters unchanged. The restored expectation changes only coordination verdict fields and location-window fields; it does not invoke a codec to derive the expected full record set. The pre-existing direct codec call remains a separate idempotence/key assertion after the independent restore comparison. [Vault export/preflight/restore](../../../../packages/vault/src/vault.ts), [barter codecs](../../../../apps/pwa/src/barter-runtime.ts), [location codec](../../../../packages/discovery/src/geoprivacy/location/index.ts). | The recovery expectation can detect a different normalization result instead of reproducing the codec's answer as its oracle. Record reads deserialize stored JSON into returned data, supporting the captured snapshot comparisons. [Record conversion](../../../../packages/kernel/src/storage/tx.ts). |
| Healthy drain and duplicate-collapse detection | The production drain helper must return false before export, after restore, after each of two reopened coordination refreshes, and after continuation actions. Each refresh checks the frozen coordination and compares ordinary views, counters, and every `notify.*` record to the pre-export snapshot. [Drain helper](../../../../apps/pwa/src/notification-delivery.ts), [dispatcher](../../../../packages/kernel/src/outbox/dispatcher.ts). | A duplicate that merely increments the existing notification count, source IDs, revisions, or counters would fail the comparisons even if the unread total stayed one. The helper checks outstanding work and dead letters in addition to the bounded drain. |
| Ordinary continuation | The recovered owner marks the preserved notification read with its expected revision. The fixture checks the new read state, zero unread total, unchanged dedupe/day/preference rows, and the one-read diagnostic. It then restores the separate archive and republishes the listing, verifying the real signature, owner, sequence three, prior tombstone CID, and listing revision five. The normal publication query must return that envelope; archive status becomes restored. Final draining must leave the read inbox/counters and frozen coordination unchanged. [Inbox commands](../../../../packages/notify/src/delivery/inapp/index.ts), [archive restore](../../../../packages/bazaar/src/listings/archive.ts), [publication commands](../../../../packages/bazaar/src/listings/index.ts), [envelope verification](../../../../packages/federation/src/envelope.ts). | The recovered records remain usable through normal owner operations while retaining the coordination's recovery restriction. |

## Explicit recovery exceptions and authority boundary

The fixture's full-record expectation includes these two transformations and otherwise retains the captured rows:

| Record | Explicit expected difference | Retained meaning |
| --- | --- | --- |
| `mutiny.coordination` | Status becomes `frozen`, reason becomes `restore_requires_review`, and both `committedLocallyAt` and `commitFeasibility` become null. | Signed evidence, proposal identity and consent/reservation references remain available for review. Restoring them does not restore the historical local feasibility verdict. |
| `discovery.location_setting` | Remove `lastChangedAt`, set `changeCount24h` to zero, and set `changeTimes` to an empty array. | Owner/key, setting identity, coarse home cell, visibility, entry mode, and stored record metadata are retained. The public query still omits the private home-cell field. |

All six local notification record types are compared without such resets. This matches [their codecs](../../../../packages/notify/src/local.ts), which preserve the local counters and dedupe data while checking ownership on notification and preference rows. The [location codec](../../../../packages/discovery/src/geoprivacy/location/index.ts) expressly resets only its local change window.

The underlying [coordination reconstruction](../../../../packages/mutiny/src/trade_proposals/repository.ts) continues to verify durable evidence and disable replay of cached commitment authority at restore. Its normal refresh emits `mutiny.coordination.changed`, while the notification route for this flow consumes `mutiny.coordination.observed`. The fixture asserts the resulting state and notification stability after real hold cleanup. No production change expands consent, signing, restore, or inventory-release authority in this commit.

## Preservation checks

Static comparison with the parent confirmed:

- The file still contains one lifecycle case and the six frozen-view cases. The entire suffix beginning with the six-reason table is byte-identical; its SHA-256 is `1af43bab5d895968cb0f80438c31c45b1d90a593f49d3ba50a0ce0a8f37e69be`.
- No original assertion line is removed by the diff. The original signed-withdrawal replay, genuine local hold loss, independent peer-clock expiry, signing-identity continuity, repeated normalization, and recovered hold-release assertions remain.
- The original lifecycle `finally` block still locks the peer identity, closes peer storage, and closes every opened vault. The 30-second case limit is unchanged. Global stub cleanup and view destruction remain in the unchanged view cases.
- No background dispatcher is started. The added drains are awaited, so the new helper introduces no background timer to the existing cleanup sequence.

The held backup is still created before the original owner's later local hold loss and the independent peer's expiry. The peer's advanced clock remains separate from the owner/recovery clock; it does not age the new owner's notification or location snapshot.

## Functional and defensive limits

The assertion design supports the named interaction at one ordinary fixture population. It does not establish every state of every codec, large-volume pagination behavior, long-term retention, asynchronous delivery failure handling, or concurrent/crash recovery.

The captured source IDs and dedupe row keys have independent expected values. The complete dedupe payloads are preserved across recovery, but the test does not separately assert each pre-export `notification_seen.data.notificationId` equals the expected inbox row ID. That relationship was checked in the actual inbox producer source. This is a narrow limit of the fixture's semantic oracle, not a blocking defect in the recovery interaction.

The owner uses the real encrypted vault implementation over fake IndexedDB; the independent peer remains memory-backed with real Ed25519 signing. Ordinary views here are normal domain queries. The six existing DOM-stub cases concern barter display only. The extension does not execute native IndexedDB, browser lifecycle behavior, notification/location DOM flows, or the complete PWA `connect` session guard.

The archive carries registered domain records. Kernel outbox, delivery-inbox acknowledgments, idempotency rows, and other unregistered storage tables are not restored by this test. The source is drained before export, so preserved domain dedupe records plus no new inbox updates after normal recovery refresh must not be described as migration of delivery queues or whole-database recovery. [Vault archive scope](../../../../packages/vault/src/vault.ts), [dispatcher storage](../../../../packages/kernel/src/outbox/dispatcher.ts).

This review performed read-only source/Git inspection and static preservation checks. It ran no compiler, product tests, browser runs, probes, or vulnerability reproduction. Only this review document was written. The integration lane's serial TypeScript and nine-case recovery selection remains separate execution evidence; earlier-source results are not attributed to this commit by this report.

The [historical security findings tracker](../../../../planning/SECURITY_FINDINGS_TRACKER.md) is unchanged: **51 findings remain OPEN**. This review changes no owner, severity, readiness status, or release gate.
