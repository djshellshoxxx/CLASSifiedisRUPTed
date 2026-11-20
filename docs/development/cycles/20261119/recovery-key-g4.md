# G4 retained and publication backup record keys

## Source identity and scope

This is a bounded defensive consistency repair. It connects the existing vault
record-key admission check to the canonical keys already used by normal retained
listing and publication storage.

| Source | Exact identity |
| --- | --- |
| Base commit | `eeee923adbd4dee3634898d035c74072803ea2f0` |
| Retained source/test commit | `5c916f7e7779119d9230fd13f5297d67b78e7640` |
| Retained source tree | `395fb2d7dc41bbb29f901aff93020b03786f6955` |
| Publication source/test commit | `19a3b5985fa8afa4a75187586d061b010201a878` |
| Combined tested source tree | `e33bf57c19dc6df3df56cc7f2beb34c876dce965` |
| Worktree | `/workspace/scratch/06c5fd0c70c0/classrup-recovery-key-g4` |
| Branch | `codex/recovery-key-g4` |

The retained patch was frozen first. The integration owner then authorized the
adjacent publication-key repair identified by the independent static review. The
second source commit contains only that addition. This handoff and its evidence
are committed separately from both source/test commits.

No changes were made to the root checkout or another worker's checkout. No
external probing, remote actions, attack demonstration, vulnerable-baseline run,
or execution of the interrupted preflight-security worker's scripts was part of
this task.

## Changed behavior

### Retained listings

`packages/discovery/src/search/index.ts` now exports
`retainedListingId(ownerId, listingId)`. Its result is the existing
`ownerId/listingId` storage key, with no rewriting, normalization, or new encoding.
Normal `discovery.listing.retain` uses that helper for its lookup and write.

`apps/pwa/src/retained-backup.ts` is a headless production codec module following
the existing archive-codec composition. It parses through
`retainedListingRepo.schema`, derives `recordId` through the same helper, and
retains the original `validateRetainedRecord(input, verifyEnvelope)` callback.
`main.ts` registers this codec in place of its inline composition.

### Publications

Normal publication writers in `packages/bazaar/src/listings/index.ts` and
`lifecycle.ts` already use the signed envelope CID as the storage key. The current
publication reader also resolves that CID. Their source is unchanged.

`apps/pwa/src/publication-backup.ts` now declares that same key through
`publicationRepo.schema.parse(input).envelope.cid`. It retains the original
`validatePublicationRecord(input, verifyEnvelope)` callback. `main.ts` registers
this headless codec in place of its inline composition.

### Admission and compatibility

The existing vault implementation checks a codec's `recordId` against the stored
or incoming record ID during export and shared recovery preflight. With these
codecs registered, a retained/publication record whose ID disagrees with its
canonical data key is rejected with the existing `Backup record key mismatch`
error. This patch does not rename a row, discard evidence, or migrate data.

Records produced under the existing normal keys retain those same keys. The
retained-listing and publication schemas, repository indexes, signed-envelope
verifiers, evidence validators, backup manifest, sealed format, and identity
handling are unchanged. The new key checks are additional consistency checks;
they do not replace signature or provenance validation. Retained peer records
remain associated with their peer owner rather than being rewritten to the
backup principal.

## Focused validation

The single-worker run started at `2026-11-20T02:37:58.184Z` against the combined
source commit `19a3b5985fa8afa4a75187586d061b010201a878`. It passed **14 of 14 tests
across five files**, with zero failed or pending tests. Reported duration was
17.62 seconds. Runtime: Node `v24.22.3`, Vitest `5.1.0`, 512 MiB Node heap limit.

| Test file | Tests | What this run establishes |
| --- | ---: | --- |
| `packages/discovery/src/search/retained-key.test.ts` | 2 | Existing literal key format and distinct normal owner/listing pairs. |
| `tests/integration/retained-backup.test.ts` | 1 | Normal retention through the real command and real signature verification, then production-codec encrypted backup/restore, preserving key, record metadata, owner index, signed evidence, and signing identity. |
| `tests/integration/publication-backup.test.ts` | 1 | Valid signed listing, tombstone, and reservation records stored under their existing CIDs, then production-codec encrypted backup/restore, preserving records, listing index, signed evidence, and signing identity. |
| `packages/discovery/src/search/local-search.test.ts` | 7 | Existing local retention/search behavior remains passing. |
| `packages/vault/src/backup-preflight.test.ts` | 3 | Existing detached-data, generic canonical-key normalization, and session-lock preflight behavior remains passing. |

The publication fixture uses the real signer and production backup codec with
ordinary valid records. It does not execute publication lifecycle commands; the
existing writer/reader CID convention was checked by source inspection.

Exact test command, from the repair worktree:

```sh
NODE_OPTIONS=--max-old-space-size=512 node node_modules/vitest/vitest.mjs run \
  packages/discovery/src/search/retained-key.test.ts \
  tests/integration/retained-backup.test.ts \
  tests/integration/publication-backup.test.ts \
  packages/discovery/src/search/local-search.test.ts \
  packages/vault/src/backup-preflight.test.ts \
  --maxWorkers=1 --no-file-parallelism \
  --reporter=verbose --reporter=json \
  --outputFile=docs/development/cycles/20261119/evidence/recovery-key-g4-tests.json \
  > docs/development/cycles/20261119/evidence/recovery-key-g4-tests.log 2>&1
```

The report's `success` flag, total file count, and passed/failed/pending counts were
read independently after the runner exited with status zero. `git diff --check`
also passed. No TypeScript compiler qualification is claimed by this worker. The
integration owner explicitly reserved repository typechecking and the remaining
combined qualification for the integrated source.

## Setup results, kept separate from test evidence

1. `pnpm install --offline --ignore-scripts --frozen-lockfile` exited 1 during
   supply-chain metadata verification: `ERR_PNPM_NO_OFFLINE_META` for optional
   `@esbuild/aix-ppc64` metadata. The lockfile was unchanged.
2. The first attempt to copy the existing installed dependencies with Node
   `cpSync` exited 1 on an existing namespace directory (`EEXIST`). This setup
   failure is preserved separately; it was not a test failure.
3. Copying those already-installed dependency directories with `cp -a` succeeded.
   Relative workspace links were retained, and Vitest, discovery, kernel, and
   Zod resolution were checked to stay inside this repair worktree. The test run
   used the local Vitest JavaScript entry directly. No package policy, lockfile,
   registry setting, or network restriction was changed to complete setup.

Evidence files are in the adjacent `evidence/` directory:

- `recovery-key-g4-setup.log`: frozen offline install failure.
- `recovery-key-g4-setup-reuse.log`: first dependency-copy failure.
- `recovery-key-g4-setup-reuse-2.log`: successful reuse of installed dependencies.
- `recovery-key-g4-dependency-resolution.log`: checked local resolution paths.
- `recovery-key-g4-tests.log`: complete focused runner output.
- `recovery-key-g4-tests.json`: machine-readable focused runner results.

| Artifact | SHA-256 |
| --- | --- |
| Unchanged `pnpm-lock.yaml` | `d72caa3b730141025fcbb083eedea8d5c1bf6774c5f2b7ed3e8e145f10308773` |
| Focused test JSON | `c351576630806bb7138091b79facd0bdd2fd056dc87e0638a19b9cedcdd172a4` |
| Focused test log | `b367f06c8f50f5c615f477414145c0e3e1f83ef5fdc753a2d6123215063d57dd` |

## Limits and remaining qualification

- Tests ran against the repaired source only. No malformed retained/publication
  backup fixture or vulnerable baseline was constructed or executed here.
- The round trips use the vault's memory-storage composition with the real
  signing, sealing, verification, and production codecs. They do not establish
  browser UI behavior, native IndexedDB reopening, full PWA packaging, or
  large-vault performance.
- Existing generic preflight tests cover their declared validation boundaries;
  this focused run is not exhaustive security qualification.
- Independent static review and the separate positive old-format compatibility
  check belong to their respective G4 handoffs. They should not be represented
  as executions by this worker.
- The integration owner owns repository TypeScript and any remaining combined
  functional gates. The worker's serial test slot was released after the focused
  run, and no background test process remains.
