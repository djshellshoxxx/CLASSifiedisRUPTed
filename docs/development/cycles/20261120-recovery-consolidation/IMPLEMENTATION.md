# Recovery consolidation: implementation and preserved intent

Frozen source: `d55bb48117c0f9e4579b01fd6c12030585601d68`.
Tree: `7c2a8e3c341498f54e57489a31b2711c9034d3e5`.
Qualified main: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.

## Consolidated sources

The initial merge `29daa061b4ad8b2899f6a8eaa910d12c80c93671` preserved all
21 contributed paths from independent PRs #64–#68 exactly. During review,
PR #68 advanced normally to `7a3a962400e44a3d7bb2a6834c869f97bae88ee4`.
The final merge preserves that later history and its additional handoff too.
The [merge receipt](MERGE-PRESERVATION.json) verifies all five current source
heads are ancestors: 20 of their 22 contributed paths retain exact source blobs;
two tests have stronger acceptance. Every original handoff is unchanged.

- PR #64 supplies a valid signed/encrypted mixed current/future-codec backup,
  compatible-receiver positive control and older-registry rejection.
- PR #65 checks that an older registry blocks lossy export of newer owner data,
  and a later compatible reopen preserves records, identity and export ability.
- PR #66 checks that foreign future records neither block owner export nor enter
  its restored vault, while remaining intact in the source database.
- PR #67 supplies the staged attachment/reference scope and specification.
- PR #68 supplies the diagnostic, interface fixtures, lifecycle acceptance and
  later tenant-index repair.

## Corrected lifecycle acceptance

Three independent initial reviews found the same oracle error: the new test
expected bytes to survive final-holder detach. Existing storage deliberately
deletes a blob with its last holder. The initial combined source's executed
four-file selection passed seven cases and failed precisely those three adapter
variants. Its full TypeScript check passed.

The corrected tests separately verify that coverage preserves bytes and that
explicit final detach returns `{ deleted: true, shred: false }` for the plaintext
fixture and removes the blob. Production deletion/shredding behavior is
unchanged. Original failures and historical handoff wording remain preserved.

## Tenant-index repair and concurrent work

The original memory query scanned all holder rows before tenant filtering, so
its cap did not bound complete traversal. A concurrent PR #68 worker independently
implemented the same tenant-index repair. The final merge selects its complete
production memory-driver blob `56d93ed22056f8cd215882df97a3732ea1b5b213`.

`MemoryState.write` maintains a tenant-to-holder-key index for insertion,
replacement and removal; empty tenant sets disappear. Snapshot loading and both
callback and persistence rollback use that same write path. Coverage checks
indexed cardinality before row reads. Overflow immediately yields null counts;
accepted queries inspect at most the requested owner limit. SQLite retains its
tenant-prefixed limit-plus-one query. The public maximum stays 10,000 holders.

This bounds the diagnostic query, not whole-vault snapshot loading, decryption,
resident index memory or native-device latency. No durable table, schema version,
backup wire format, cryptographic setting or migration changes.

The incoming exception-rollback block and complete plain IndexedDB reopen case
remain present exactly. Additional acceptance covers foreign-only bytes,
exact/overflow and invalid limits, error rollback/retry, retained-method lifetime,
failed persistence, encrypted reopen, v1 exclusion and queued-lock rejection.
The attachment file has 17 cases; three codec files add one each. Their 20 cases
overlap the complete domain selection and must not be counted again.

The future-codec test now retries the same valid backup into the same previously
rejected destination with the compatible registry. Complete records captured
from original writes, coverage and signatures must match immediately and after
encrypted lock/reopen. This proves reusability and final-state preservation.
The preceding negative assertions establish uninitialized identity state; they
do not directly enumerate physical rows between rejection and retry.

## Authority and completion boundary

The diagnostic binds to the unlocked principal and returns frozen scalar counts,
with no tenant, content reference, holder label or bytes. Both
`holderAuthorityVerified` and `includedInV1Backup` remain `false`. Stored-but-unheld
blobs are outside its counts, and the issued v1 backup remains record-only.

The [source inventory](ATTACHMENT-SOURCE-INVENTORY.md) finds no current production
media domain or attachment extractor among the 15 production codecs. Kernel
ports and arbitrary holder labels do not establish authenticated parent linkage
or portable recovery. Domain admission, canonical parent/revision authority,
a separately versioned manifest, bounded transfer and atomic destination
persistence remain subsequent work. All 51 historical readiness findings remain
open. See [qualification](QUALIFICATION.md) and [handoff](HANDOFF.md) for actual
execution, publication and hosted integration gates.
