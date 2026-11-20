# Full production-registry recovery interaction acceptance

## Source and bounded change

Base: published PR #62 `4fc8e9c8aab75dec89d77677b4b25c50bd749632`, tree
`5917e4b60a2c41c0d462843c27355399e7c7a10d`.
Branch: `codex/classrup-full-registry-recovery-20261120`.
Prepared test blob: `aa0078f19382a45842c7346a2173f161c79eb2d9`.

The only executable change extends the existing genuine lifecycle case and
test-local runtime in
[production-barter-recovery.test.ts](../../../../tests/integration/production-barter-recovery.test.ts).
It retains all seven cases, all original assertions, the original cleanup and
the existing 30-second lifecycle limit. The six view cases are byte-identical.
No production, dependency, workflow, protocol or product-limit change is made.

## Concrete interaction covered

Existing scenarios recovered the 15 production codec types as separate
six-, six- and seven-type populations. The new assertion scope puts their
complete union in one command-created owner archive and checks the interaction
between real signed barter evidence, local notification delivery and recovery
normalization. A type-count assertion alone would not cover that interaction.

The test-local registry composes the existing factories used by
[PWA connect](../../../../apps/pwa/src/main.ts): bazaar, discovery, location,
barter and local notifications. Notifications use `barter.isBlocked`. The bus
and real outbox dispatcher share the session storage, clock, IDs and owner
origin. A post-commit collecting sink observes real emitted source events;
it neither constructs nor injects events.

| Populated types | Ordinary producer |
|---|---|
| `bazaar.listing`, `bazaar.listing_revision`, `bazaar.publication`, `bazaar.archive_record` | Existing barter listing commands plus create/publish/archive of one separate owner listing |
| `discovery.retained_listing`, `discovery.location_setting` | Retain the real peer publication and set a coarse home preference |
| `mutiny.want`, `mutiny.coordination`, `bazaar.inventory_hold` | Existing signed want, proposal, reservation and consent lifecycle |
| `notify.preference`, `notify.pref_counter` | Ordinary unrelated offers preference edit; cycles remain enabled |
| `notify.notification`, `notify.notification_seen`, `notify.notification_day`, `notify.notification_diag` | Real notification subscriber handling accepted peer reservation and consent observations |

The inbox must contain one unread cycle item with count two, the actual subject
and the two observed peer event IDs. Its domain dedupe rows must have those
same IDs; the day count is two, preference edit count one, and diagnostics
record one creation and one collapse. There is no direct notification-create
call or new raw domain-record insertion. All records use one local tenant;
peer-owned signed evidence remains peer-owned evidence inside that tenant.

Coverage must match all 15 explicit types and the complete
[production registry](../../../../apps/pwa/src/backup-codecs.ts), with positive
counts, no unsupported type and no exceeded inventory limit. Bounded reads
capture every domain row; equality with the coverage count detects truncation.

## Independent recovery expectations

The case captures a complete domain-record snapshot, ordinary listing/history,
archive/search/location/inbox/preference views, and notification counters.
The expected restored records are derived from that snapshot with exactly two
explicit exceptions, without invoking a restore codec to compute the oracle:

- Coordination becomes `frozen` with `restore_requires_review` and null local
  commitment/feasibility fields.
- Location keeps the saved coarse setting but resets `changeCount24h` to zero,
  empties `changeTimes` and removes `lastChangedAt`, following its documented
  import policy.

Export must leave the live commitment, location window, complete record set,
views and counters unchanged. Restore and subsequent lock/reopen must preserve
the signing identity, complete expected records, ordinary views, notification
counters and coverage. The original signed cancellation, real owner hold-loss,
independent peer expiry and repeated codec-normalization assertions remain.

After reopen, two matching-enabled refreshes must keep coordination frozen and
preserve the complete notification records, counters and views. The existing
hold-release assertion remains. Continued ordinary actions mark the recovered
notification read, restore the separate archived listing and republish it with
the expected signed predecessor CID/sequence. Those actions must leave the
frozen coordination and unrelated notification state intact.

## Delivery completion and qualification limits

The case uses the production
[drainNotificationDelivery](../../../../apps/pwa/src/notification-delivery.ts)
helper and requires its outstanding-work result to be false before export,
after restore, after each recovered refresh and after the continuation actions.
The underlying [dispatcher](../../../../packages/kernel/src/outbox/dispatcher.ts)
has a bounded default of 100 passes and can stop when no delivery/dead-letter
progress occurs even though delayed work exists. The production helper also
checks oldest undelivered work and dead letters, so a quiet drain cannot by
itself satisfy the assertion. No background dispatcher timer is started.

This acceptance covers domain records in a signed encrypted archive. Kernel
outbox/inbox/idempotency state remains excluded; the source delivery is drained
before export. It does not establish native-browser behavior, external
notification delivery, whole-database recovery, process-crash durability or
every possible state of every codec. The independent peer is still the
existing memory-backed signing fixture.

The implementation author ran no compiler or product tests and made no commit.
Only diff/whitespace, source-readback and assertion/cleanup preservation checks
were performed. The integration owner will execute the prepared serial
TypeScript and nine-case production recovery selection and record its exact
source and results separately. Earlier source results are not assigned to this
changed test.
