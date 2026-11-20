# Independent initial functional review

## Source and review boundary

Reviewed commit `29daa061b4ad8b2899f6a8eaa910d12c80c93671`, tree
`014ab768f786b9170ed4885cb849b85b46117bb1`. The review inspected source and Git
objects only. It ran no compiler, tests, browser or product commands, made no
remote operation and changed no implementation. This report preserves that
completed review; subsequent execution and repairs require separate evidence.
All line numbers refer to the initial source. Its working tree was clean at
the final inspection.

**One blocking test-oracle defect was found. No new production correctness
defect was established by this functional review.**

## F1 — Blocking: final detach deletes the blob

[attachment-reference-coverage.test.ts](../../../../tests/integration/attachment-reference-coverage.test.ts),
line 116, expects blob metadata to remain after detaching its last holder.
Existing [tx.ts](../../../../packages/kernel/src/storage/tx.ts), line 478,
instead removes the holder, retains the blob while another holder exists and
deletes the blob when its final holder disappears. Its public comment at line
532 documents this behavior; the existing
[storage contract suite](../../../../packages/kernel/src/storage/contract-suite.ts)
also exercises it.

All three new lifecycle variants share the wrong assertion: memory, fake
IndexedDB and SQLite. This is a source-level contradiction, not an executed
failure claim. Preserve production behavior. Capture and assert the final
detach result `{ deleted: true, shred: false }` for this unencrypted fixture,
then require `info()` to return `undefined`. Retain the preceding stored-but-
unheld exclusion check. A read-only coverage request should preserve bytes;
the explicitly mutating final detach should delete them.

The historical [round-three handoff](../20261120-attachment-reference-coverage/HANDOFF-ROUND3.md),
line 11, describes "non-deletion of blob bytes." Preserve its original bytes
and supersede that inaccurate expectation in the new closeout.

## F2 — Acceptance gap: foreign-only bytes at an owner missing ref

The attachment fixture places identical bytes under both owner and foreign
tenants, then checks separate holder counts. Its missing owner ref has no
matching blob under either tenant. This proves holder filtering but would
not independently catch a future implementation treating foreign-only bytes
as satisfying the owner's missing ref. Current memory and SQLite source use
the correct tenant/ref pair; this is not a confirmed production defect.

A focused strengthening is to store the missing ref's bytes under the foreign
tenant only, without adding a foreign holder. Owner `missingCount` must remain
one and foreign holder counts must remain unchanged.

## F3 — Scope wording: holder limit does not bound every memory row visited

The original [coverage handoff](../20261120-attachment-reference-coverage/HANDOFF.md),
line 13, states that the read has a 10,000-row upper bound. At the reviewed
source, [memory-driver.ts](../../../../packages/kernel/src/storage/memory-driver.ts),
line 287, iterates the complete `blob_refs` map and skips foreign tenants
before incrementing the bounded owner count. Owner results and the working
set are capped, but foreign rows visited are not. Later handoffs acknowledge
this distinction. New closeout evidence should state the precise boundary or
describe a reviewed repair. Small fixtures do not establish a whole-database
scan-cost bound. No resource stress or vulnerability reproduction was run.

## Codec cases and production paths

- [Future-codec rejection](../../../../tests/integration/production-future-codec-rejection.test.ts)
  creates a genuine signed/encrypted mixed backup, positively restores and
  reopens the same backup under the newer registry, then checks older-registry
  rejection. That positive control prevents a generally invalid fixture from
  making the negative assertion vacuous.
- [Downgrade export](../../../../tests/integration/production-downgrade-export.test.ts)
  reopens the same encrypted database with the older registry, requires the
  owner's unsupported type to block export, then reopens with the newer
  registry and checks both records, identity and export capability.
- [Foreign-codec isolation](../../../../tests/integration/production-foreign-codec-isolation.test.ts)
  requires a foreign unsupported type to leave owner export usable, remain
  absent from the restored owner vault and remain in the original encrypted
  database.

Inspection of [vault.ts](../../../../packages/vault/src/vault.ts) confirms
unsupported-scope admission precedes identity unlock, storage unlock and
restore writes. Export checks unsupported types in the same read snapshot
that captures records. No test changes v1 format, codec admission or restore
behavior. The three scenarios are complementary.

The future-codec negative case directly proves an uninitialized destination
before and after reopening, not encrypted domain-row emptiness. Its historical
round-two handoff discloses this boundary. No partial-write path was found in
the inspected production ordering.

## Lifetimes and ordinary behavior

The attachment vault API uses guarded `storage.read()` and rechecks session
state after awaiting it. [storage.ts](../../../../packages/kernel/src/storage/storage.ts)
dynamically binds every public and driver method to transaction lifetime,
including added methods. The new API inherits those guards by construction.

New tests directly cover post-lock rejection, ordinary counts, overflow,
duplicate attachment and unheld-data exclusion. They do not independently
execute an in-flight lock race, retained `referenceCoverage` method, encrypted
attachment reopen or native-browser path. Existing generic storage/vault
lifetime suites cover related behavior; execution remains separate evidence.

## Parent contribution preservation

Every path changed by each draft relative to main was compared by Git blob
identity against the integrated tree:

| Draft | Source head | Changed paths | Identical paths |
|---|---|---:|---:|
| PR #64 | `f598dc52937449764703b5048ba71a77239c9ded` | 3 | 3 |
| PR #65 | `5a742b5c4f1068f8bbd51d84de6a3de054df57e7` | 2 | 2 |
| PR #66 | `5bae3058bffec53c0fe04700c84232b8d7a5a84a` | 2 | 2 |
| PR #67 | `d1dcd44e839c7c28a33b94553f5cb3270ffc6d6c` | 2 | 2 |
| PR #68 | `259f84204561c82d1138f252771564a02ea5916c` | 12 | 12 |

All 21 contributed paths matched their source blobs. Nothing was dropped or
rewritten by the initial merge. Main `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`
and all five heads above are the merge's actual parents.

## Disposition

Correct F1 before qualification and preserve its original failure if executed.
Independently review any F2 acceptance addition or F3 implementation repair.
Document repaired detach semantics and scan bounds in new evidence, leaving
historical handoffs intact. This static review supplies no test or hosted pass.
