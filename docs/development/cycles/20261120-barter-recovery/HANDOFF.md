# Production barter recovery acceptance

## Source and ownership

This bounded continuation starts from local candidate
`d92f20bcdba146cd5d3d482ee830210e2bdb1ae2` (tree
`0238e6ad6a9add7d712e3b5bf5ff0eabf993d870`). The isolated local branch is
`codex/classrup-barter-recovery-20261120`. It is separate from the candidate
being qualified by the integration owner. This worker does not publish, merge,
rewrite remote branches or deploy.

The scope is the existing owner barter record recovery contract, its canonical
storage keys and its frozen-state explanation. There are no wire-format,
signature, matching, consent, reservation or recovery-resolution contract
changes. Existing product limits and the integration test's 30-second cap stay
unchanged.

## Why this continuation is needed

The earlier production-registry acceptance covers listing, history, archive,
publication, peer-retention and location readers. It does not exercise retained
wants or a genuinely committed coordination through encrypted backup and
restore. Static inspection also found two narrow gaps in the existing recovery
contract:

- The want and coordination codecs did not supply the canonical record-key
  binding already supported by vault preflight. The normal
  `mutiny.want.retain` writer stores at `envelope.cid`; the normal coordination
  writer stores at `state.proposal.snapshot.subjectId`.
- Restoring a committed record correctly produced
  `frozen / restore_requires_review`, but reconstructing that already-restored
  record changed its reason to `conflicting_promise`. Its frozen status was
  retained. The generic frozen UI also described every cause as conflicting
  signed commitments, including recovery and reservation expiry.

These findings come from the local writer, codec, reconstruction and view
implementations. They were not established by malformed-backup or offensive
reproduction.

## Production corrections

`apps/pwa/src/barter-runtime.ts` supplies a `recordId` function for each barter
codec using the normal writer keys above. The existing vault preflight applies
these bindings before and after normalization. Signed evidence, schema parsing,
owner validation and participant validation remain in their existing paths.

`packages/mutiny/src/trade_proposals/repository.ts` retains
`restore_requires_review` when reconstructing an already-restored frozen
record, provided replayed signed evidence is still nonterminal. The local
commit time and feasibility verdict remain cleared. A signed cancellation,
decline or freeze produced during replay keeps its own terminal result. Normal
refresh cannot recommit a restored frozen record, even after the owner explicitly
enables matching. This is a correction to the recovery reason; it does not
redefine reconstruction of every other local freeze reason.

`apps/pwa/src/barter.ts` explains the existing reasons separately:

| Stored reason | Explanation |
|---|---|
| `restore_requires_review` | Backup recovery needs manual review; automatic recommit is unavailable. |
| `reservation_expired` | A signed inventory reservation expired. |
| `local_reservation_lost` | The required local inventory reservation is no longer available. |
| `conflicting_promise` | Signed commitments conflict; no winner is chosen automatically. |
| `fork_detected` | Signed proposal revisions conflict; no revision is chosen automatically. |
| Other or absent reason | The coordination is frozen. |

Every explanation directs the owner to review signed evidence with participants
and explicitly negotiate a new proposal. Action conditions remain unchanged.
Frozen records retain the evidence-download control and do not expose consent,
reservation or withdrawal actions.

## Acceptance scenario

`tests/integration/production-barter-recovery.test.ts` uses the exact
`productionBackupCodecs` registry and the production encrypted vault over
`fake-indexeddb`. The owner's listing, publication, peer-retention, want,
reservation, consent and coordination records are created through actual
handlers and their normal command bus. A second local participant supplies
genuine Ed25519 signatures using a native in-memory identity; that participant's
key encryption is outside this owner's recovery case.

Two published listings and two retained, sufficiently aged wants produce an
admitted two-participant cycle. Each participant reserves their own item and
signs consent through the real runtime. The owner reaches a real local
commitment with fresh feasibility and an active inventory hold. Canonical
want-CID and coordination-subject record keys are checked against the rows
returned by the normal writers and readers.

Seven populated record types cross the encrypted backup boundary: listing,
listing revision, publication, inventory hold, retained listing, want and
coordination. Export must leave the live source commitment unchanged. Restore
must preserve the signed evidence and record metadata while normalizing the
coordination to frozen/manual-review with no cached local verdict. The normal
want and barter-input readers, plus a deterministic identity signature, must
remain equal after restore and after close/reopen. Repeating the production
coordination codec's normalization must preserve the review reason and key.

Finally, the recovered owner explicitly enables matching and runs the real
coordination refresh. The coordination must remain frozen for review and its
normal transaction must release the restored local domain inventory hold.
Want readers must remain unchanged. This tests the existing manual-review
boundary; it does not introduce a recovery resolution operation.

Six separate view cases mount the actual barter view against schema-valid
display fixtures for the reasons in the table. They check explanation text,
the evidence-download control, absence of consent/reservation/withdrawal
controls, and that rendering does not sign anything. Those fixtures qualify
presentation behavior only; they are not claims of signed domain admission.

## Historical clarification

`planning/hard-slices-20261111/maps/mutiny.md` contains the historical statement
that a restored commitment stays frozen "until a refresh re-commits." That is
not the current recovery contract. The current policy in
`packages/mutiny/README.md`, under Persistence and composition, explicitly
requires recovery/renegotiation for `restore_requires_review` and excludes
automatic recommit. This continuation follows that policy and leaves the old
map intact as historical evidence.

## Qualification boundary

The three production corrections and all seven new acceptance cases have
received independent static review with no blocker identified. The new
acceptance and repository typecheck have not executed in this worker's lane.
The integration owner has reserved serial execution and will repair the
worktree's dependency links before running them. No passing runtime result is
claimed here. Later qualification must record exact commands, tested source
identity and outcomes before this branch is integrated.

This is record-level recovery over the production encrypted adapter and
`fake-indexeddb`. It does not qualify a native browser engine, physical device,
disk crash, interrupted IndexedDB commit, key rotation or copied live vault.
The restored inventory hold is an existing domain record; it is not a delivery
or infrastructure lease. No attachment blobs, delivery queues, leases,
whole-database recovery, real trades or external transactions are included.

## Next worker

Run the compiler and focused acceptance after the shared runner window opens,
without increasing time limits. Review any ordinary fixture failure against
the current domain policy before changing runtime behavior. Keep this slice
separate from the earlier candidate until the integration owner qualifies its
actual source.
