# Classrupted independent security and architecture review

## Evidence boundary

Reviewed canonical `djshellshoxxx/CLASSifiedisRUPTed` main at `c4f733e8f2e13c38844acc84b2401209bedf4e24`. Source under `packages/`, `apps/`, `tools/`, and `.github/` was compared byte-for-byte with the previously qualified integration checkout at `4c393f4`; no differences were found in these paths. The subsequent commits chiefly consolidate documentation and final qualification evidence.

This is a bounded source review plus an executed comparison of a legacy privacy implementation. It is not an exhaustive penetration test, production certification, independent cryptographic audit, or completion claim for all specifications. Root owns full current-main regression execution; that work should be recorded against its exact tested SHA. The WebKit/vault agent owns the PR #37 investigation and browser qualification.

No new high- or critical-severity vulnerability was confirmed in the reviewed, exposed main implementation. A subsequent live dependency audit identified one pre-existing high-severity advisory in the development toolchain; the dated addendum below preserves that unresolved result and its exposure evidence. No main source modifications were made by this reviewer. Existing historical security documents contain 51 **planning/readiness** findings; they must not be relabeled as 51 demonstrated runtime vulnerabilities or silently marked closed.

## Main trust boundaries reviewed

| Boundary | Concrete source evidence | Assessment and remaining limit |
|---|---|---|
| User-held identity and passphrase encryption | `packages/identity/src/identity.ts:51-124` | Fixed-cost scrypt derives the encryption key; random salt/nonce feed XChaCha20-Poly1305; temporary byte buffers are cleared in `finally`; usable signing keys are re-imported nonextractable. Unlock proves the decrypted private key matches the declared DID. This is a source observation, not a timing or secure-erasure guarantee for the JavaScript runtime. |
| Signed-file intake | `packages/federation/src/envelope.ts:37-121` | Bounded JSON depth/node/byte checks reject non-JSON values, accessors, decorated/sparse arrays, invalid Unicode and invalid timestamps. Input is canonicalized and detached before asynchronous cryptographic work. CID, expected author/type and Ed25519 signature are checked before recursively freezing accepted evidence. Alpha statement formats remain distinct from canonical federation. |
| Local resource isolation | `packages/kernel/src/storage/scope.ts:66-122`; `packages/kernel/src/bus/bus.ts` | Scoped repositories, blobs, leases and sync operations consistently carry the tenant. Bus performs feature, authentication, rate, schema and authorization gates before transaction-owned state changes. These primitives do not establish a deployed relay or a complete future-domain authorization matrix. |
| Restore/import authority | `apps/pwa/src/main.ts:22-58`; `apps/pwa/src/archive-backup.ts:5-11`; `apps/pwa/src/barter-runtime.ts:86-110`; `packages/discovery/src/search/index.ts:113-128` | PWA restore codecs verify ownership of local listings, holds, history, archives, wants and coordination records. Signed publications and retained peer projections are reverified, rather than trusting cached derived fields. Coordination restore rebuilds signed evidence and freezes commitments whose historical feasibility cannot be proven. Cross-domain recovery and full device rotation are explicitly unfinished. |
| Browser output and import bounds | `apps/pwa/src/main.ts:82-96,151-169`; `apps/pwa/src/barter.ts`; `apps/pwa/src/matching-worker-protocol.ts` | Visible content uses DOM `textContent`; file intake checks selected file size before JSON parsing. Worker requests have record and serialized-byte caps and repeat signature admission. Keys and vault access are not sent into the matching worker. A byte cap is not a measured memory or mobile-latency guarantee. |
| Static development/preview hosting | `tools/cli/classrup.mjs:158-205,215-240` | Build rejects public-asset symlinks before and after staging. Serving normalizes paths, rejects hidden/traversal segments, checks real paths stay beneath generated output, permits GET/HEAD only, and sends restrictive CSP/no-referrer/nosniff headers. This server is explicitly a development/preview service. |
| Offline cache | `apps/pwa/public/sw.js` | Cache is scoped to service-worker registration scope and versioned public assets. Runtime responses, vault data and imported files never enter its allowlist. Updates wait for old tabs instead of replacing active app code mid-session. |
| CI privilege boundary | `.github/workflows/alpha-checks.yml`; `.github/workflows/cli-setup.yml` | Workflows use `pull_request`, explicit `contents: read`, pinned action SHAs and frozen lockfile installs. No `pull_request_target`, `workflow_run` privilege transition, or direct secrets injection was observed. This is not a current dependency vulnerability database result. |
| Privacy media parsing | `packages/privacy/src/security_boundaries/metadata/formats.ts`; `image.ts`; `NOTES.md` | Main rebuilds allowed image containers and checks structural fields/CRC/dimensions. It explicitly does not claim pixel decoding, re-encoding, full real-file corpus qualification or production upload enforcement. The current parser is stronger than the orphan branch candidate described below. |

## Orphan branch: do not merge its competing architecture wholesale

Reviewed `claude/busy-cerf-vg3hz3` at `34a6892cff8b` (full SHA retained by branch inventory). It contains seven unique commits and a substantial alternate implementation. It is not merely an unmounted feature package compatible with current main.

| Area | Orphan implementation | Current main / integration consequence |
|---|---|---|
| IDs | `packages/kernel/src/ids.ts` uses prefixed ULIDs such as `lst_...`. | Main storage, schemas, PWA and domain contracts use UUIDv7. Direct replacement changes identity and persistence boundaries. |
| Signing identity | `packages/security/src/signatures.ts` uses `ed25519:<base64url-public-key>`. | Main uses `did:key` and current vault-held signing interfaces. |
| Signed wire format | Orphan envelope is `{v, ctx, signer, payload, sig}` with a textual domain prefix. | Main envelope binds CID, author, createdAt, sequence and previous CID. Formats are not interchangeable. |
| Persistence and calls | Synchronous `Deps`, `Collection`, `Operation` and callback `runCommand`. | Main uses async command/query bus, explicit `Result`, tenant-scoped transactions and encrypted browser persistence. |
| Messaging trust | `packages/comms/src/client.ts:1-8` explicitly trusts a relay key directory on first use and relay-asserted sender attribution unless extra plaintext signatures are added. | Current product has no qualified recipient-key, delegated-device or canonical recovery lifecycle. Exposing this transport would require a separate trust-design and integration effort. |
| Recovery | `packages/identity/src/accounts/recovery.ts` maintains relay account recovery codes and device revocation state. | Current browser vault authority and backup format cannot be replaced by relay account state without an explicit migration and new tests. |
| Federation | Orphan uses origin-relay countersignatures, relay trust, record revisions and a different migration protocol. | Main supports explicit signed file exchange and deliberately does not claim canonical relay federation. |

Potential reusable **ideas** include multi-recipient ciphertext tests, recovery-code parsing cases, tenant-negative cases, message membership tests and relay replay tests. None is a ready drop-in runtime implementation. Extraction must target the current interfaces, persistence model and accepted contracts; tests must be adapted to actual current behavior rather than importing the alternate kernel.

### Confirmed legacy privacy regression: embedded thumbnail survives

**Classification:** medium privacy defect in the unmerged candidate; not a vulnerability introduced into main. Secondary low-severity parser-integrity defects were also reproduced. Runtime exploitability in a deployed product is not claimed because the orphan feature is not merged or mounted in the current PWA.

**Source:** `34a6892cff8b:packages/comms/src/messaging/strip.ts:16-21` retains APP0 wholesale. `stripJpegMetadata` does not remove the JFIF embedded thumbnail. Its PNG path copies chunks without checking CRC.

Executed exact orphan `strip.ts`, bundled with the behavior-identical `ok`/`err` result functions, using main's existing synthetic image fixture builders. Results are in `analysis/legacy-image-proof.json`:

| Probe | Orphan result | Main result |
|---|---|---|
| 159-byte JFIF JPEG fixture with a 12-byte thumbnail | Accepted; output byte-identical; independent main analyzer still reports `thumbnail` at `APP0`. | Accepted; rebuilt to 147 bytes; reanalysis has no findings. |
| JPEG containing only SOI and EOI | Accepted. | Rejected as malformed. |
| PNG fixture with invalid IDAT CRC | Accepted. | Rejected as malformed. |

Synthetic fixtures test container behavior, not pixel decoding. Main's existing metadata tests already exercise the relevant protections. The correct consolidation decision is to preserve main's whitelist implementation, not replace it with the orphan parser. No main patch is required to fix an issue absent from main. If messaging is ported later, its attachment pipeline must use the reviewed main parser and fulfill the documented decoder/worker/upload integration requirements.

## PR #8 feature-registry extraction review requirements

Reviewed `claude/bold-mccarthy-qklhl6` at `a403614`, particularly `packages/platform/src/configuration/feature/{rules,generate,commands,registry,schema}.ts`.

The isolated registry is a plausible integration candidate after repair and qualification. These concrete boundaries must be resolved before declaring it complete:

1. **Catalog presence is not runtime readiness.** `rules.ts` maps every known MVP specification to `defaultState: 'on'` and `registered: true`, regardless of implementation presence. Main has many specification-only modules. A port must clearly describe this as catalog policy and must not use it to activate absent or unqualified runtime functionality.
2. **Generator file access must be bounded.** `loadCatalog` passes `module.path` to injected `readText` before the domain checks. The actual filesystem adapter must constrain path resolution to the repository and handle symlinks and cross-platform path variants. A typed path alone does not enforce confinement.
3. **Generated artifact and tests are required.** Historical `registry.ts` imports `registry.generated.ts`, which is absent at that checkpoint. Commit deterministic generation output or an intentional generation lifecycle; verify fresh generation equals committed content and that failed generation does not alter existing output.
4. **Mutation guarantees need executable tests.** `indexRegistry` returns runtime-mutable maps despite `ReadonlyMap` type annotations; typed catalog inputs and `finalizeRegistry` alone do not validate or detach arbitrary callers. Never treat a mutable or injected fixture registry as untrusted authority. Test isolation/detachment where public mutation could affect query results.
5. **Preserve explicit policy prerequisites.** The old generator derives module dependencies and core defaults from a checkpoint that changed many specifications. Do not silently rewrite current dependencies, approved contracts or feature enablement to make the generator pass. Report incompatible specification input with exact evidence, or choose a clearly bounded catalog-only representation.

These are port/review requirements for unmerged code, not claimed current-main vulnerabilities. Root owns implementation choices and final verification. A subsequent independent review should inspect the exact final diff and regenerated artifact.

## Remaining security work

The project remains an alpha. Main documentation identifies unfinished recipient-key lifecycle, identity/device rotation and recovery, canonical federation, production private messaging, cross-domain retention/purge, full media/outbox recovery, and release/operational acceptance. These are separately scoped engineering and evidence tasks; importing old source counts does not complete them.

The live dependency audit and its unresolved advisory are recorded in the addendum below. No external scanning, messages, remote mutations, deployments, releases, branch deletions or history rewrites were performed by this reviewer. Main test counts and browser/OS status belong in the integration owner's final report from current executions and required GitHub checks.

## Independent registry qualification after repairs

Root implemented the isolated opt-in registry port in `classrupted-registry`. This reviewer then added only `packages/platform/src/configuration/feature/feature.test.ts`, without changing implementation files or committing the shared worktree. The repaired source now confines POSIX repository paths, constrains filesystem reads/writes, detaches before hashing, freezes nested values, hides its mutable index implementation and isolates query results from optional metrics exceptions.

Executed against the uncommitted integration candidate:

```sh
./node_modules/.bin/vitest run packages/platform/src/configuration/feature/feature.test.ts --maxWorkers=1 --reporter=json --outputFile=/workspace/scratch/e63b31746a4d/analysis/feature-registry-domain.json
GOMAXPROCS=2 GOMEMLIMIT=256MiB ./node_modules/.bin/tsc -p tsconfig.json --noEmit --singleThreaded
```

Both commands exited 0. Vitest reported **40 passed, 0 failed, 0 pending**. The graph property test additionally checked 120 generated directed graphs against a brute-force permutation oracle. The suite independently checks SHA-256 results, invalid IDs/dependencies/defaults/path forms, asynchronous detachment and deep immutability, query copy isolation, the four query surfaces, caller-supplied capability/rate/feature gates, read transactions, no emitted events and metrics failure containment. Grepping `apps/pwa` and `apps/relay` found no imports or references to platform registry queries; the catalog does not mount those surfaces automatically.

This qualifies the bounded catalog API at the candidate state, not runtime flag mutation, complete feature implementation, unknown-module recovery, a deployed relay or production readiness. Root subsequently recorded the integration as local commit `78d1894df53cb60e277df6b887ea7cc4f99acb78`, confirmed by reading the registry worktree HEAD. The 40-test result above records this reviewer's earlier execution; root owns subsequent expanded-suite results and must verify the exact remote commit and required GitHub checks before merging.

## Live dependency advisory addendum — November 17, 2026 (America/Los_Angeles)

**Disposition: one unresolved high-severity dependency advisory; no production reachability observed within the reviewed application boundaries.** The vulnerable dependency is installed and remains reported by the audit. The feature-registry candidate does not change its version or introduce it. This is not a clean-audit result, a claim that the package is safe, or proof that every possible development-tool invocation is unaffected.

Root reconfirmed the main baseline as `c4f733e8f2e13c38844acc84b2401209bedf4e24` during this assessment. The dependency analysis used the registry worktree at that base plus its uncommitted implementation diff. Comparison against `origin/main:package.json` found identical `dependencies` and `devDependencies` objects; `git diff origin/main -- pnpm-lock.yaml` was empty.

### Confirmed advisory and release state

Root supplied the live audit output in `/workspace/scratch/e63b31746a4d/analysis/dependency-audit.json`. The exact invocation was `corepack pnpm audit --json > /workspace/scratch/e63b31746a4d/analysis/dependency-audit.json`, executed from the registry worktree; it **exited 1**. Its sole advisory is:

| Field | Recorded result |
|---|---|
| Package and installed version | `picomatch@4.0.7` |
| Direct reported dependency path | `. > vitest > picomatch` |
| Identifiers | `GHSA-fc5q-39xc-vjpf`, `CVE-2026-112366`, audit ID `1247710` |
| Audit classification | High; CWE-1333; CVSS 3.1 score 7.5 |
| Affected and patched ranges | Affected `<=4.0.7`; patched `<0.0.0` (no patched version) |
| Audit advisory update | `2026-11-17T15:56:44.000Z` |
| Audit totals | 1 high; 0 critical/moderate/low/info; no muted advisories |

The current [GitHub-reviewed advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), checked during this review, likewise lists no patched version. It describes exponential backtracking for attacker-supplied single-branch repeated extglobs, which can block a Node.js event loop. Its displayed CVSS 4.0 score is 8.7; this is a different scoring version from the audit's CVSS 3.1 value, not an independently measured Classrupted impact rating.

Both the [maintainer's releases page](https://github.com/micromatch/picomatch/releases) and the executed npm metadata lookup identify **4.0.7 as latest**. The advisory-referenced [PR #194](https://github.com/micromatch/picomatch/pull/194) is open and explicitly leaves `+(*a)` behavior outside its fix. A more directly relevant [PR #237](https://github.com/micromatch/picomatch/pull/237) proposes a repeated-extglob rewrite, but it is also open and its review section says no reviews. No released, maintainer-approved remediation was verified. An open contributor patch is not an official fixed release.

### Actual exposure evidence

The candidate `package.json:31-42` places Vitest 5.1.0 in `devDependencies`. The unchanged lockfile records `picomatch@4.0.7` at `pnpm-lock.yaml:1141`, with dependency paths through Vitest (`:1730-1744`), Vite (`:1717-1723`), tinyglobby (`:1687-1690`) and fdir (`:1576-1578`). The audit response's `devDependencies: 0` metadata does not establish product-runtime exposure; the manifest, call sites and bundle closure provide the relevant evidence.

`vitest.config.ts:5` supplies three static, repository-owned include globs. The installed Vitest implementation uses these configuration values in `dist/chunks/index.Di8au7q4.js:6333-6339,6677-6685` when discovering/matching test files; its coverage path likewise compiles configuration patterns in `dist/chunks/cli-api.COfZo8lK.js:7017-7026`. The reviewed application does not pass imported user documents, browser requests, or federation payloads into this toolchain. A contributor able to change executable test configuration already controls code that the test runner executes; this is a development/CI trust boundary, not an observed route from an ordinary application user to the matcher.

Production browser compilation is specified at `tools/cli/classrup.mjs:172-182`: esbuild bundles `apps/pwa/src/main.ts` and `apps/pwa/src/matching-worker.ts`. The CLI uses its own development/preview server. It does not mount Vite as an application server. This reviewer executed those exact browser bundling options with output writing disabled and an esbuild metafile enabled. All **201 inputs** were inspected: **zero** came from picomatch, tinyglobby, Vitest or Vite. Both browser bundle contents, sizes and SHA-256 hashes are recorded in `/workspace/scratch/e63b31746a4d/analysis/picomatch-exposure-proof.json`, together with the full metafile and check timestamp `2026-11-18T07:37:56.183Z`.

This narrows the finding to the present development toolchain under the examined configuration. It does not remove the installed vulnerable dependency, prove universal absence of reachability in arbitrary future tooling, or qualify a future relay/service using user-supplied glob patterns. No timing/denial-of-service experiment was added; the dependency finding rests on the live advisory and actual installed graph, while the product exposure assessment rests on executed bundling and inspected call sites.

### Reproduction commands and evidence

Executed from `/workspace/scratch/e63b31746a4d/classrupted-registry`:

```sh
corepack pnpm view picomatch version dist-tags --json
git diff origin/main -- pnpm-lock.yaml
```

The metadata command exited 0 and returned `{"version":"4.0.7","dist-tags":{"latest":"4.0.7"}}`. The lockfile diff was empty. The exact browser dependency-closure analysis was:

```sh
node --input-type=module <<'NODE'
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const result = await build({ entryPoints: { app: 'apps/pwa/src/main.ts', 'matching-worker': 'apps/pwa/src/matching-worker.ts' }, outdir: '/tmp/classrupted-audit-unused', bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true, sourcemap: false, write: false, metafile: true });
const inputs = Object.keys(result.metafile.inputs).sort();
const evidence = {
  checkedAt: new Date().toISOString(),
  repositoryHead: execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim(),
  method: 'Exact production browser esbuild options from tools/cli/classrup.mjs:182; only write:false and metafile:true added. This is a dependency-closure check, not a deployment.',
  inputCount: inputs.length,
  affectedToolingInputs: inputs.filter(p=>/(?:^|[/@])(picomatch|tinyglobby|vitest|vite)(?:[/@]|$)/.test(p)),
  inputs,
  outputs: result.outputFiles.map(file=>({file:file.path.split('/').at(-1),bytes:file.contents.length,sha256:createHash('sha256').update(file.contents).digest('hex')})),
  metafile: result.metafile
};
await writeFile('/workspace/scratch/e63b31746a4d/analysis/picomatch-exposure-proof.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({checkedAt:evidence.checkedAt,repositoryHead:evidence.repositoryHead,inputCount:evidence.inputCount,affectedToolingInputs:evidence.affectedToolingInputs,outputs:evidence.outputs},null,2));
NODE
```

This command exited 0. It wrote the analysis JSON, and wrote no browser build files. The main audit JSON remains the original integration-owner evidence; this reviewer did not rerun or filter it.

### Remediation decision and precise blocker

Keep the finding visible and preserve the existing lockfile until a reviewed remedy is available. Root accepted this disposition. No dependency, lockfile, audit suppression, severity threshold, or required gate was changed by this review. Downgrading to another affected version cannot meet the advisory's range, and importing an unreviewed fork or changing package identity to remove an audit match would not establish remediation.

The precise blocker to a **zero-high dependency audit** is that the installed toolchain requires picomatch and the currently verified upstream/npm release set contains no fixed version for this advisory. A locally maintained patch would require a separate security and compatibility review, provenance tracking and tests; it would be a local mitigation, not evidence of an official patched release or an automatically clean upstream audit. The narrow registry integration has no dependency regression on this finding. Its merge decision must still disclose this pre-existing unresolved advisory, and release/security acceptance cannot be reported as complete because the browser dependency-closure check passed.
