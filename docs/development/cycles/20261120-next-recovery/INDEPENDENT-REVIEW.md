# Independent review of notification and barter recovery

## Conclusion and scope

No blocking source, fixture or compatibility issue was identified in the two
isolated continuations below. The notification scenario exercises the six
existing local notification codecs through ordinary readers and continued
commands. The barter scenario exercises a real local commitment through the
production encrypted recovery path, including the existing manual-review
boundary. Its three narrow production changes agree with the current writer
keys and recovery policy.

This is an independent static review. The reviewer inspected production
writers, readers, codecs, reconstruction, the new tests and their handoffs;
the reviewer did not author those changes or execute a compiler or product
test. At the workers' commit checkpoint, the new acceptance cases and
typecheck remain unexecuted. The integration owner owns subsequent serial
execution, integrated-source qualification and publication. Earlier-candidate
results do not establish a result for these new cases.

## Exact reviewed sources

Both worker commits have parent
`d92f20bcdba146cd5d3d482ee830210e2bdb1ae2`, tree
`0238e6ad6a9add7d712e3b5bf5ff0eabf993d870`.

| Slice | Commit | Tree |
|---|---|---|
| Notification | `61c0e5eeaafe2361d100b4eddb2c9a970d48a18f` | `23602b6a0489104cb85221f532250c7048230d3a` |
| Barter | `355ea87578d25c2b7278290f0ced5dedde142bdb` | `c3b7fc258eeaeb4d4765fa2f05bb9ce252f72772` |

The following final commit blobs match the independently reviewed content:

| File | Blob |
|---|---|
| `tests/integration/production-notification-recovery.test.ts` | `d57531e6b1b6605568bba5ae2ca8dee5c4f5a1fe` |
| `apps/pwa/src/barter-runtime.ts` | `d5c76677707f0e848d12bd1c9dc4bd7714208a1d` |
| `apps/pwa/src/barter.ts` | `74dc6bd94f0205f3270b03749119d59b9332b490` |
| `packages/mutiny/src/trade_proposals/repository.ts` | `e765e11a82abd1c787a6e2e02f9c94037a9f3e2a` |
| `tests/integration/production-barter-recovery.test.ts` | `88933d6ad3d504f4961064824e366b8d6b5f0604` |

The commits are independent siblings, not a combined tested tree. This review
does not assign their results to a later integration commit or hosted head.
Worker scope and preparation details are recorded in
`docs/development/cycles/20261120-notification-recovery/HANDOFF.md` and
`docs/development/cycles/20261120-barter-recovery/HANDOFF.md`.

## Notification policy and acceptance

`packages/notify/src/local.ts` registers notification, preference, seen, day,
diagnostic and preference-counter records. The first two codecs verify the
local principal and preserve the parsed data. The other four use the ordinary
domain codec. There is no reset normalizer for these six types. Their saved
deduplication and local counters therefore belong in the recovered domain
state.

The test creates that state through the actual local notification composition,
kernel bus and owner authorization context. It uses the internal local create
command for already accepted inbox data. It does not claim to verify a signed
upstream producer. The source metadata naming a peer is sufficient for this
bounded local notification scenario.

The asserted source contains 18 records:

| Type | Count | Expected state |
|---|---:|---|
| `notify.notification` | 3 | One read collapsed cycle, one unread security notice, one newer unread cycle |
| `notify.preference` | 7 | Materialized category cells, offers disabled and security locked on |
| `notify.notification_seen` | 5 | Five accepted source identifiers, including the hidden offer |
| `notify.notification_day` | 1 | Peer-source daily count of three |
| `notify.notification_diag` | 1 | Created 3, collapsed 1, read 1, dropped 0, hidden 1, total 3 |
| `notify.pref_counter` | 1 | One preference edit |

Those counts follow `packages/notify/src/delivery/inapp/index.ts` and
`packages/notify/src/preferences/in/index.ts`: a hidden disabled-category
source records deduplication before returning, a collapse contributes to the
daily source count, and the security notice without an actor does not add to
that peer's daily row. The source has two unread notices, one cycle and one
security notice. The full inbox is explicitly checked in two pages, with
three nonempty expected rows; category and unread filters are also checked.

The same normal inbox and preference matrix readers are compared after export,
restore and encrypted close/reopen. Supplementary checks compare domain
deduplication, counters and metadata. An unchanged deterministic signature
checks the restored identity. Export must leave the source views and counters
unchanged.

The continued-command portion tests distinct ordinary behaviors. A duplicate
source uses a new kernel idempotency key and remains suppressed by the restored
domain deduplication row. A new source collapses into the recovered unread
cycle. Disabling cycle notifications then drains the real local outbox
dispatcher so that the preference subscriber removes the unread cycle while
preserving the earlier read cycle. Another disabled update is hidden, and
bulk mark-read processes the remaining security notice. The final expected
counts follow the handlers: seen 7, daily peer count 4, preference edits 2,
and diagnostics created 3, collapsed 2, read 2, dropped 1, hidden 2, total 2.

The dispatcher expectation of one delivered local preference event is
consistent with the registered subscriber. It is necessary to exercise that
subscriber; the synchronous preference command alone does not remove old
unread rows.

### Delivery and authority boundary

The same production composition omits channel grants/consents, relay mirrors,
destinations and unsubscribe tokens. The test introduces none. Preference
flags are local settings; their restoration does not establish external
delivery authority. The normal matrix must continue to show inactive
push/email channels and no mirror reference, and the external sync list must
remain empty.

Kernel outbox/inbox state, delivery queues, idempotency, infrastructure leases
and dead letters remain outside the backup contract. Newly issued commands
can legitimately emit fresh local outbox events. The test correctly does not
require an empty outbox after continued work or describe preserved domain
counters as restored transport state.

## Barter source corrections and compatibility

### Manual-review reason through reconstruction

The current policy in `packages/mutiny/README.md`, under Persistence and
composition, requires restored prior commitments to become frozen with
`restore_requires_review`, with explicit recovery or renegotiation. The
terminal-state logic in `packages/mutiny/src/trade_proposals/index.ts`
includes frozen states, and `evaluateCoordination` can commit only a proposed
state. The old planning map's statement that refresh recommits is historical
and conflicts with this current policy.

The pre-change reconstruction already kept a restored commitment frozen, but
reconstructing that frozen record could replace its review reason with
`conflicting_promise`. The reviewed change retains `restore_requires_review`
only when the cached record has that reason and replayed signed evidence is
still proposed or committed. It explicitly clears the local commit time and
feasibility verdict. If replay produces cancellation, decline or a freeze,
the existing terminal result remains authoritative through `freezeConflict`.

This corrects the recovery reason without introducing a status transition or
automatic recommit. The signed-evidence replay, proposal digest comparison,
owner and participant checks retain their existing paths. Other pre-existing
local freeze-reason reconstruction behavior is outside this narrow change.

### Canonical storage keys

The ordinary want-retention writer stores at `envelope.cid`. The coordination
ingest writer stores at `state.proposal.snapshot.subjectId`. Both are in
`packages/mutiny/src/trade_proposals/repository.ts`.

The two new `recordId` functions in `apps/pwa/src/barter-runtime.ts` parse the
same schemas and return those same keys. This binds existing legitimate
writer-produced records without renaming a type, migrating a key or changing
the backup wire format. The existing preflight in
`packages/vault/src/vault.ts` applies declared key bindings before and after
normalization. Schema, signature and ownership checks remain in effect.

The admission gap and correction were assessed from source. No malformed
archive, negative key-substitution fixture or exploitation procedure was
constructed or executed in this review.

### Frozen-state presentation

`apps/pwa/src/barter.ts` now selects text for recovery review, expired signed
reservations, missing local holds, conflicting promises, proposal forks and
an unknown-reason fallback. The text accurately describes the supplied reason
and directs the owner to review evidence with participants and negotiate a
new proposal. The recovery-marker correction above ensures that the recovery
explanation survives subsequent reconstruction.

The view change alters one explanatory paragraph and adds its helper. It
does not change the status conditions controlling consent, reservation or
withdrawal. Frozen records continue to offer signed-evidence download while
those proposal actions remain unavailable.

## Barter acceptance assessment

The main case builds an encrypted owner vault using the complete production
codec registry. The peer supplies genuine native Ed25519 signatures through
a memory-only identity and storage. Peer key encryption is explicitly outside
this owner's recovery scenario.

Both participants create and publish ordinary listings, retain the other's
signed listing, and retain two signed wants through the actual commands.
After the normal aging interval, graph admission and discovery produce a
two-participant cycle. Both participants create actual inventory holds and
sign consent through the real runtime. The owner receives both reservations
and consents and reaches a genuine local commitment with fresh feasibility.
The fixture does not write an arbitrary committed cache directly.

The source assertions establish nonempty wants, active own inventory,
committed coordination, and seven populated types: listing, listing revision,
publication, inventory hold, retained listing, want and coordination.
Canonical-key checks compare the codecs against actual rows returned by the
ordinary writers and readers. Export must preserve the live source commitment.

Restore and close/reopen must preserve signed evidence and ordinary want and
barter-input reads while changing the coordination to frozen/manual-review
with no local verdict. The deterministic identity signature remains equal.
Calling the actual coordination codec normalizer again must leave that
recovered record and its canonical key unchanged. This specifically covers
the reason-drift correction.

The recovered runtime then explicitly enables matching and invokes the
ordinary coordination refresh. The expected result remains frozen for review,
increments the coordination row revision, and releases the restored local
inventory hold through the existing terminal-state transaction. Want readers
remain unchanged. The assertion of a released hold follows the normal refresh
handler; this is a domain inventory reservation, not an infrastructure lease.

The six additional cases mount the actual barter view with schema-valid
display fixtures. Inspection confirmed that the shared `NodeStub` supports
the operations used, and background matching is not started by constructing
the view. The cases check each explanatory text, evidence-download visibility,
absence of consent/reservation/withdrawal controls, and no signing during
refresh. They accurately claim presentation acceptance only. Their mock
envelopes are not presented as signed domain-admission evidence.

## Qualification limits and next evidence

The new scenarios use the production encrypted vault adapter over
`fake-indexeddb`, followed by normal close/reopen. They do not establish native
browser/device persistence, disk-crash or interrupted-commit recovery, copied
live-vault behavior, clock migration, key rotation, attachment recovery,
external transport or real trades. The existing 30-second main-case caps are
unchanged; static review is not a timing result.

Together with `tests/integration/production-recovery-readers.test.ts`, the
designed scenarios populate the union of all 15 currently registered production
record types across separate archives. That is a coverage design observation
pending execution of the new cases, not a claim that one backup contains all
15 types or that the whole database is recoverable. It also does not establish
every status, expiry, conflict or authorization boundary for each type.

The integration owner must record the actual tested source, focused new-case
results, compiler result and any required integrated gates. This review must
not be used as their substitute. Worker commits and final reviewed blobs were
read back from Git; no later source identity is assumed. This lane wrote only
this review artifact, left source and tests unchanged, and made no remote
writes.
