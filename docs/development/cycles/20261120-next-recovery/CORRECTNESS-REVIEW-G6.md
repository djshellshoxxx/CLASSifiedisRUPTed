# Integrated recovery correctness review — G6

## Result and reviewed source

No blocking functional defect introduced by this change was identified in the
three production edits or the two new recovery suites. The canonical keys
agree with ordinary writers, recovered commitments retain the intended
manual-review state, and the new view text respects existing action gates.
This conclusion is a fresh source review of the integrated candidate, not a
substitute for its execution results or hosted qualification.

| Identity | Value |
|---|---|
| Checkout | `/workspace/scratch/e0ea2385d962/ClassRup-recovery-next` |
| Reviewed commit | `796c16520365c57562c1328a73d313f3fa614ae4` |
| Reviewed tree | `07a135e30d47c5284d120d4dad76f648c26e8444` |
| Published parent/base | `25b4708191f04516cab74371c84a15663cc6f6a6` |

The diff from that base contains the three production files, two integration
test files and their two worker handoffs. The following blobs were read back
from the integrated commit:

| File | Blob |
|---|---|
| `apps/pwa/src/barter-runtime.ts` | `d5c76677707f0e848d12bd1c9dc4bd7714208a1d` |
| `apps/pwa/src/barter.ts` | `74dc6bd94f0205f3270b03749119d59b9332b490` |
| `packages/mutiny/src/trade_proposals/repository.ts` | `e765e11a82abd1c787a6e2e02f9c94037a9f3e2a` |
| `tests/integration/production-barter-recovery.test.ts` | `88933d6ad3d504f4961064824e366b8d6b5f0604` |
| `tests/integration/production-notification-recovery.test.ts` | `d57531e6b1b6605568bba5ae2ca8dee5c4f5a1fe` |

I read `INDEPENDENT-REVIEW.md` as prior context, then independently traced the
changed functions to writer keys, shared backup preflight, coordination
reconstruction, state transitions, notification handlers and the actual view
conditions. Production and test files were left unchanged. No compiler or
product test was run in this review lane; the integration owner owns those
results. `git diff --check` against the published base produced no finding.

## Canonical barter keys and compatibility

`mutiny.want.retain` verifies the envelope and writes each retained want at
`envelope.cid`. `mutiny.coordination.ingest` reads by the supplied subject and
writes the reconstructed coordination at
`state.proposal.snapshot.subjectId`. These are the same values selected by
the two new `recordId` functions in `apps/pwa/src/barter-runtime.ts`.

This preserves current writer-produced keys and the backup wire shape. The
patch introduces no type rename, identifier migration or changed schema.
Existing ordinary archives with those keys remain compatible. The shared
preflight in `packages/vault/src/vault.ts` checks an explicit key binding on
parsed input and again after recovery normalization. The latter matters for
coordination because normalization reconstructs its proposal from verified
evidence. Ownership and participant checks remain in the existing codec
paths.

A retained peer want is correctly owned by the local vault principal while
its signed envelope remains authored by the peer. The key binding does not
incorrectly require those identities to be the same. The new barter fixture
uses this ordinary arrangement and checks the binders against actual rows
returned by the normal commands and queries.

This was a source review of admission and a positive-path assessment of the
new test. No malformed archive, key-substitution reproduction or exploitation
procedure was created or executed.

## Recovery state and terminal precedence

The current policy is stated in `packages/mutiny/README.md`, under
Persistence and composition: a recovered prior commitment must be frozen
with `restore_requires_review`, with its cached local feasibility no longer
authorizing commitment. The new code in
`packages/mutiny/src/trade_proposals/repository.ts` preserves that reason when
the recovered record is reconstructed again.

The changed branch is reached only when the cached status is already
`frozen`. It applies the review marker only when the cached reason is
`restore_requires_review` and signed-evidence replay remains `proposed` or
`committed`. In that branch it also clears both the local commitment time and
cached feasibility. It does not create consent, reservation evidence or a
new commitment.

| Replayed state at the changed branch | Result for a cached recovery freeze |
|---|---|
| `proposed` | Frozen for recovery review; local verdict cleared |
| `committed` | Frozen for recovery review; local verdict cleared |
| `cancelled` | Existing terminal state retained |
| `declined` | Existing terminal state retained |
| `frozen` | Existing terminal state and its reason retained |

The terminal cases fall through to the existing `freezeConflict`, which
returns terminal states unchanged. The final `evaluateCoordination` cannot
commit a frozen state: `tick` retains terminal status, and commitment is
restricted to `proposed`. This supports the claim that a matching-enabled
refresh cannot automatically recommit the restored record. Ordinary refresh
still releases local domain holds when the resulting coordination is frozen.

The review-marker preservation therefore corrects reason drift without
changing the existing status boundary. The earlier restore path that first
converts a cached committed record to frozen remains unchanged. This review
does not claim to redesign all historical replay, clock or evidence-order
semantics; the terminal-precedence table describes the exact new branch.

### Existing limitation outside this correction

Other local freeze reasons are not newly preserved by this patch. For
example, reconstruction may still relabel a previously persisted
`local_reservation_lost` or `reservation_expired` freeze as
`conflicting_promise` when replay itself has not reproduced that terminal
cause before the cached-freeze branch. The old code had this behavior. The
new exception is deliberately limited to `restore_requires_review`.

Consequently, the six view cases establish correct rendering for supplied
reasons. They do not establish that every reason survives every later domain
refresh. This existing limitation is not a regression introduced by the
candidate and should remain visible if a later continuation broadens the
reason-preservation work.

## Frozen-state presentation

`apps/pwa/src/barter.ts` changes one explanatory paragraph and adds a helper
selecting text for recovery review, signed-reservation expiry, loss of the
local hold, conflicting promises, proposal forks and a generic fallback.
The recovery text accurately states that restoration needs manual review
and does not recommit automatically. All variants lead to evidence review
and a new negotiated proposal, consistent with frozen states being terminal.

The existing DOM helper assigns `textContent`. The change introduces no raw
HTML or render-time signing. Reservation and consent controls still require
`proposed`; withdrawal still requires `proposed` or `committed`. Signed
evidence download remains available for frozen records. The view fixtures
call the actual `mountBarter` and `refresh`, assert the text and those control
conditions, and check that signing was not invoked.

The fixtures explicitly use view-only envelopes and a stubbed DOM. They
exercise presentation and control visibility, not signed domain admission,
native browser interaction, evidence-download execution or real exchange.

## New acceptance suites

### Barter

The main barter case constructs an actual local commitment through ordinary
listing publication, retention, signed wants, graph admission, proposal
ingestion, local reservations and consent commands. Both participants use
real signatures. Only the owner uses the encrypted vault under test; peer
key encryption is explicitly outside this case.

The test asserts nonempty state before export, including two wants, an active
owner hold, a genuinely committed coordination and seven populated record
types. It checks the normal-reader result before and after encrypted restore
and reopen, preserves the signing identity, and verifies that export itself
leaves the live source committed. The expected restored row preserves its
evidence and metadata while clearing the local verdict and changing status
and reason to the documented recovery state.

Repeated normalization and a subsequent matching-enabled command refresh
exercise the corrected branch. The refresh must leave the review state
unchanged, increase the coordination revision once and release the domain
hold. This provides meaningful regression coverage for the new reason
behavior; it is not merely a direct assertion of the helper implementation.
The remaining six cases cover the presentation variants described above.

### Notifications

The notification case uses the production local notification composition,
kernel bus and owner context. Its internal create command represents already
accepted local inbox data; it does not pretend to validate a signed upstream
producer. All six local notification codecs contain real command-produced
rows before export:

| Type | Before export |
|---|---:|
| Notification | 3 |
| Preference | 7 |
| Seen source event | 5 |
| Per-source day counter | 1 |
| Diagnostic counter | 1 |
| Preference edit counter | 1 |
| Total | 18 |

Those counts follow the current handlers. Disabling offers hides their next
source and still records its deduplication row. A collapse increments the
peer daily counter. The security notice has no actor and does not increment
that peer counter. The first collapsed cycle is marked read, so a later
cycle creates a separate unread row. The test checks the nonempty inbox
through pagination, unread/category filters, unread counters and the normal
preference matrix before and after restoration and reopen.

The continued operations use fresh command idempotency keys. Duplicate
source rejection therefore exercises recovered domain deduplication.
Disabling cycles drains the actual preference subscriber, which removes
the unread cycle while retaining the read cycle. Further collapse, hidden
delivery and bulk-read assertions agree with the resulting counter values.

`localNotificationBackupCodecs` preserves these six domain record types; it
does not restore channel consents, external destinations or relay state.
The test continues to assert inactive push/email channels, no mirror
reference and an empty external sync list. Local outbox events newly emitted
by continued commands are distinct from excluded kernel delivery history.

## Evidence limits

Both main cases use production encrypted vault storage over `fake-indexeddb`
and normal lock/reopen. Neither establishes native-browser persistence,
interrupted transaction or process-crash recovery, external delivery,
clock migration, identity rotation, attachment recovery or a whole database
snapshot. The existing main-case timeouts remain 30 seconds.

Together with the existing production-reader scenario, the populated types
cover the union of the 15 currently registered production codecs across
separate scenarios. This does not mean a single archive contains all 15
types, or that every state and boundary of each type has been exercised.
Worker-source test reports and the integration owner's later affected-suite
results must retain their own exact source identities. No execution result
was generated or reassigned by this review.

Only this review artifact was written. Production, tests, dependency state
and remote branches were not modified by this review lane.
