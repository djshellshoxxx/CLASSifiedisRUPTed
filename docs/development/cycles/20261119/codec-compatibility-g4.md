# Backup codec compatibility review — generation 4

## Source and outcome

**No demonstrated compatibility defect was found in the two reviewed codec key
patches.** This independent pass covers ordinary valid backup records, normal
writer/reader behavior, production composition, unchanged signature validation,
canonical v1 compatibility, indexes and identity preservation. No production
source or established test-suite file was changed by this reviewer.

| Role | Exact source |
| --- | --- |
| Baseline before the two patches | `eeee923adbd4dee3634898d035c74072803ea2f0` |
| Frozen retained-listing patch | `5c916f7e7779119d9230fd13f5297d67b78e7640` |
| Retained-listing source tree | `395fb2d7dc41bbb29f901aff93020b03786f6955` |
| Frozen publication patch, including retained patch | `19a3b5985fa8afa4a75187586d061b010201a878` |
| Combined reviewed source tree | `e33bf57c19dc6df3df56cc7f2beb34c876dce965` |
| Publication patch cherry-picked into this isolated worktree | `fe618df0eaf0a58c433ccc4a6401424b2db64183` |
| Review branch | `codex/codec-compatibility-g4` |

The review worktree was created at the frozen retained-listing patch. The
publication worker then supplied its exact commit; the local cherry-pick has an
identical complete source tree. `git diff --exit-code` between those two combined
source commits returned no differences. The handoff/evidence commit follows that
local cherry-pick; integration should take the handoff rather than applying the
publication change twice.

Read `preflight-code-g3.md` and `coverage-bug-g3.md` for the shared recovery
preflight and PWA coverage contract. Their findings and counts remain historical
evidence. The code-review checklist's standards and behavior axes were assessed
locally within this assigned compatibility scope; no further subagent review or
release qualification is claimed.

## Standards

No documented-standard violation or actionable maintenance issue was identified
in these changed hunks. The review followed the isolated-worktree and bounded
change guidance in `docs/wiki/Developer-Guide.md`, under "Contribution and release
evidence." The extracted codecs retain the existing repository schemas and index
builders. The shared retained key helper removes duplication between normal
retention and backup admission without changing the representation.

## Compatibility findings

| Question | Finding and evidence |
| --- | --- |
| Does the retained key match normal retention? | `retainedListingId(ownerId, listingId)` returns the exact pre-existing `${ownerId}/${listingId}` expression. The normal `discovery.listing.retain` command and `retainedBackupCodec.recordId` now call that helper. No stored key or record field is migrated. Positive checks used normal retention of a peer's signed listing and a subsequent signed withdrawal. |
| Does the publication key match every ordinary writer and reader? | `publicationBackupCodec.recordId` returns the parsed record's `envelope.cid`. Publish, unpublish, reservation and lifecycle withdrawal writers already store records under that CID. The publication reader resolves the listing's `publicationCid` and checks the stored envelope's CID. The probe executed publish, reserve, release and unpublish, then successfully read the restored withdrawal through the normal publication query. Lifecycle source uses the same write expression and was inspected rather than executed. |
| Does production use these exact headless codecs? | `apps/pwa/src/main.ts` imports both new modules and registers them in its single `codecs` array, replacing the previous inline entries in their existing positions. Both normal create/unlock and file-restore `openVault({ name, codecs })` calls receive that array. The production target types and remaining codec entries are unchanged. This wiring is source evidence, not a mounted browser result. |
| Are signature validators preserved? | The bodies of `validateRetainedRecord` and `validatePublicationRecord` are byte-identical to the baseline. Their headless codec callbacks call the same validators with the same production `verifyEnvelope`. The receipt records the body hashes. The complete bazaar, federation, identity and vault source trees are unchanged by these patches. The positive probe exercised real signatures and the production callbacks. |
| Can canonical existing-style v1 records still restore? | The probe copied the two former inline codec definitions from the identified baseline and asserted that those definitions exist in its `main.ts`. Ordinary domain commands produced eight canonical records under a five-codec subset. Its signed/encrypted v1 backup restored through the new production codecs with every stored row unchanged. A subsequent export and restore through the current codecs also preserved those rows. |
| Are indexes and record metadata preserved? | Both codecs still delegate parsing/index rebuilding to `backupCodec` with the same repository definitions. Publication's listing index and retained-listing's owner index remain in slot 1; the other three slots remain null. Indexed queries after both restores returned the original records. Full row comparisons covered IDs, tenant, type, revision, timestamps and data. |
| Are signing identity and wire representation preserved? | Both restored sessions retained the original principal and produced the same signature for the same message. Decrypting and verifying the former-codec backup confirmed the `classrup.vault.alpha_backup/v1` manifest, unchanged declared type set and original records. The sealed wrapper retained `classrup.sealed/v1`, `scrypt-131072-8-1` and `xchacha20poly1305`. Canonical signed target evidence remained equal through both restores. |

The changes add key callbacks and extract existing codec composition. They do
not add normalization, alter record schemas or index definitions, replace a
signature check, reissue identity material, or change the vault's export/restore
implementation. Existing scope, preflight, signature, seal and storage behavior
is supplied by the unchanged modules reviewed in generation 3.

## Executed evidence

The coordinator granted this worker the serial crypto slot after the repair
worker finished. The slot was released immediately after this probe completed;
no Vitest, TypeScript, browser or other heavy process remained running.

| Invocation/check | Observed result |
| --- | --- |
| `corepack pnpm install --offline --frozen-lockfile --ignore-scripts` | Exit 0; pnpm 10.28.0; no downloads and no lockfile change. Vault dependencies resolved to this worktree. |
| `env NODE_OPTIONS=--max-old-space-size=384 timeout 180s node docs/development/cycles/20261119/evidence/codec-compatibility-g4-positive.mjs` | Exit 0 on the first invocation; four positive probe groups completed. Node v24.22.3 reported maximum RSS of 238,720 KiB. |
| Complete source-tree comparison with frozen publication candidate | Exit 0; identical tree `e33bf57c19dc6df3df56cc7f2beb34c876dce965`. |
| Baseline comparison of bazaar/vault/identity/federation/kernel source and lockfile | Exit 0; unchanged. The only production discovery changes are the shared key helper and its normal writer call. |
| Validator-body equality assertions | Both production validator bodies exactly equal the identified baseline. |
| Staged whitespace and production-source check | `git diff --cached --check` and comparison of production paths against the frozen publication candidate: exit 0. |

The four probe groups are:

1. Normal local publication lifecycle, covering the listing, reservation and
   tombstone statement types, unchanged CID keys and publication indexes.
2. Normal retained peer listing and withdrawal, unchanged owner/listing keys,
   owner indexes and production signature validation.
3. Former codec definitions exporting canonical v1 records that the current
   production codecs restore with identical metadata, indexes, signed evidence
   and signing identity.
4. Current codec export/restore, normal restored publication reading, and equal
   final records and identity.

The scenario produced eight records: one listing, one listing revision, one
released inventory hold, three publication records and two retained peer records.
The source's post-export rows also matched its pre-export rows. These are four
native probe groups, **not four Vitest tests**. This worker executed zero Vitest
tests and observed zero probe setup or product-test failures. The repair worker's
separate focused-suite result is not included in these counts.

See [the receipt](evidence/codec-compatibility-g4-receipt.json),
[the positive probe source](evidence/codec-compatibility-g4-positive.mjs),
[the raw probe output](evidence/codec-compatibility-g4-positive.log) and
[the dependency setup output](evidence/codec-compatibility-g4-install.log).
The receipt identifies the exact source and evidence hashes.

## Limits and handoff

The v1 compatibility case uses the identified former target codec definitions
with the unchanged vault implementation. It does not load an artifact generated
by a historical released binary. It registers the five categories needed by its
ordinary commands; the full PWA registry and both production `openVault` call
sites were source-reviewed.

The checks use real cryptography and real memory storage. They do not qualify
IndexedDB persistence, browser scheduling, full application mounting, full-vault
resource use, the complete domain suite, typecheck, build or hosted CI. The
coordinator owns those final-source gates. The positive checks do not make a
broader claim about malformed backups or adversarial admission behavior.

No former admission gap was reproduced, no invalid/corrupt backup fixture was
created, and no interrupted security-worker script was used. No remote state,
deployment, paid API, other worktree or branch deletion was involved.

Review totals: Standards — 0 findings; compatibility/behavior — 0 demonstrated
defects. No production repair is proposed by this reviewer.
