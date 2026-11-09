# Local alpha integration — 2026-11-09

Status: implementation in progress; not a completed milestone or release.

Baseline: `3694395272e880d929fcb53693ddd70e14bc47bf` (Stage 3/4 implementation).
Main: `95c46be41233520382566360e7135011412e8e6e`. Isolated task branch: `codex/local-alpha-20261109`.
The live PR #8 metadata still reports its parent `1a6ca83`; both fetched git and branch API confirm `3694395`. This work does not update another contributor's branch.

## Dependencies and ownership

Kernel → identity/signatures + persistent vault → listings/retained discovery → admitted matching → explicit signed coordination → PWA journeys.
Coordinator owns root manifests, lockfile, PWA, integration, baseline repairs and this ledger.
Foundation implementer owns identity/federation/vault; independent security reviewer owns integration security tests.
Bazaar implementer owns bazaar/discovery, reviewed by security reviewer.
Mutiny implementer owns matching/proposals; independent oracle reviewer owns exhaustive graph checks and trace-tool correction.
CLI implementer owns tools/cli, tests/cli, setup guide and OS workflow; coordinator independently exercises it.
All agents work on disjoint paths in the isolated task checkout; existing remote contributor branches remain intact.

## Source reuse decisions

- Stage 3/4 supplies canonical YAML contracts and the real kernel.
- `continuation/classrup-20261101` (`fa0cf0c`) includes browser verification `25fa6f0`. Its four-file storage-fallback diff was inspected. Memory fallback is appropriate for the explicitly mocked demo, but cannot silently substitute for durable real vault writes. Preserve that branch unchanged.
- Mock branch and Stage 3/4 share main `95c46be`; wholesale merge would overwrite conflicting contracts. Adapt UX conventions only.
- Separate TS workspace `34a6892` has different dependency/runtime assumptions. Do not mechanically merge it.
- Consolidation audit `59324a4` is evidence/navigation only; its server-rendered wording is superseded by ADR-0016.
- Other drafts stay open until unique work and their explicit merge gates are resolved.

## Baseline evidence

Node 24.22.1, Corepack pnpm 10.28.0, Linux. Clean baseline frozen install succeeded.
`pnpm test`: 21 files / 93 tests passed. `pnpm deps:check`: zero errors.
`pnpm typecheck`: failed on premature exports to absent submodules.
`pnpm spec:check`: failed on unquoted mapping text in F02.S03.M02 YAML, 44 warnings.
`trace` inspection: source IDs incorrectly counted as passing without execution results; independent reviewer assigned correction.

## Acceptance gates (all required; no blanket completion claim)

- Real browser identities, persistent local records, strict signed peer admission, restart, lock/unlock and encrypted export/import.
- Bounded cycle enumeration against independent oracle; explicit consent, revision invalidation, expiry, reservations and conflicting commitments.
- Real multi-principal 2/3/4-party browser journeys including failure and restart cases.
- CLI clean/repeat setup, doctor negative paths, development and production preview; Linux/macOS/Windows evidence individually recorded.
- Build, typecheck, relevant domain tests, spec and dependency checks, executed trace evidence, independent security findings resolved.
- Current-source CI and review gates before merging. No production deployment or release authorized by this milestone.

Terminal interface correction: `pnpm setup` is a built-in pnpm operation; project setup must be `pnpm run setup`.

## Integration decisions and unresolved contracts

- Removed only premature exports whose referenced files do not exist. Untargeted specification-only packages now explicitly advertise no runtime implementation; no empty modules were fabricated.
- Corrected YAML quoting without changing the reservation specification semantics. Current spec validation: 148/148 specified, zero errors, 33 warnings; warnings still require contract reconciliation.
- Actual runtime protocol is explicitly an alpha subset: per-subject publication streams, exact-item wants, single-item holds and `classrup.alpha.*` statements. Full global-author federation buffering, device rotation/revocation, encrypted cross-party transport, quantity inventory and canonical target-scope closure are not complete.
- Identity uses Ed25519, scrypt and XChaCha20-Poly1305; underlying pinned noble dependencies are MIT. esbuild is MIT; Playwright is Apache-2.0. No additional runtime service introduced.
- Domain records remain plaintext in the existing IndexedDB adapter. Signing keys and exported record backups are encrypted. Full private-record encryption is a remaining foundation task, not implied by lock UI.
- Backup uses async domain signature validation before atomic restore; restored prior barter commitments must freeze for explicit review rather than trust cached feasibility. Backup remains a registered-record alpha format, excluding media and outbox/device-recovery closure.
- Runtime matching cutoffs retain original limits. Count-limited output is deterministic; time-limited output is honestly reported as machine-dependent. Explicit signed wants age 15 minutes before admission.
- Initial executed trace report: 99/4510 requirements covered, source-linked tests in 3/148 modules. New alpha tests have not established full canonical requirement coverage. Non-strict trace success does not satisfy the milestone release gate.

## Browser environment evidence

Firefox 157 installed through Playwright's supported fallback mirror. Four real journeys passed for isolated peer signing/import/tamper handling, restart/offline reload, wrong credentials/lock clearing, encrypted backup restore and concurrent writer exclusion. A fifth mobile 390 journey passed with no horizontal overflow, visible button targets >=44px and focused error feedback; screenshot inspected.
Chromium system binary failed before app launch: Unix socket creation EPERM. Full/headless-shell CDN downloads returned corrupt 0 MiB archives after built-in retries. WebKit installed, but runtime libraries are missing; `playwright install-deps webkit` failed with `su: System error`. These engines are unverified, not passing. Windows/macOS CI is defined but not yet executed.

## Final reviewed implementation checkpoint

Implementation local commit: `de20626fd26087007836c947627d92457cebb8cf`.
Equivalent published commit: `6ca0323bfcceaba55c0b2398884b398d04841a87`.
Both have exact tree `bb08f42d40086a000ba5435b1744f52242936e67` (verified locally and through GitHub). Shell Git push had no credential; the authorized GitHub connector published the identical tree. Subsequent checkpoint changes are browser-test selector/evidence updates and CI concurrency, not product behavior changes.
PR: https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/10 (draft, stacked on the Stage 3/4 implementation branch). Nothing merged, deployed or released. Existing PRs #1–#9 remain intact.

| Check | Environment | Result |
|---|---|---|
| `corepack pnpm install --frozen-lockfile` | Linux Node 24.22.1 / pnpm 10.28.0 | Passed; lockfile current |
| `corepack pnpm typecheck` | Same | Passed |
| `corepack pnpm test --reporter=json --outputFile=…` | Same | 162/162 passed across 29 files |
| `corepack pnpm run test:cli` | Same | 15/15 passed, including service-worker cache boundaries |
| `corepack pnpm run test:tooling` | Same | 4/4 passed |
| `corepack pnpm spec:check` | Same | 148/148 specified, zero errors, 33 warnings unresolved |
| `corepack pnpm deps:check` | Same | Zero errors; shared signing primitives moved to security layer |
| `corepack pnpm trace --results …` | Same | 99/4510 canonical requirements covered; not milestone closure |
| `corepack pnpm run setup --non-interactive` repeated | Same | Preserved configuration byte-for-byte |
| `corepack pnpm run doctor` / `corepack pnpm build` | Same | Passed after final integration |
| `corepack pnpm exec playwright test --project=firefox` | Firefox 157 / Linux | **8/8 passed**, final combined run 1.5 min |
| Chromium / WebKit local journeys | Linux | Blocked before application assertions as described above |
| Windows/macOS and full GitHub browser matrix | GitHub Actions | Defined; final-head status must be checked, not claimed passed |

Firefox evidence includes real separate principals, signed-file listing/want/proposal/reservation/consent exchange, 2/3/4-party commitment and restart, signed dropout broadcast with cancelled coordination and released holds, unanswered proposal timeout, peer tamper rejection, repeated upload, encrypted backup restore, wrong passphrase, offline reload, concurrent-tab writer exclusion and mobile 390 layout/error focus. Barter tests explicitly advance virtual browser Date 16 minutes for the specified want aging interval; production does not bypass that interval. Domain persistence tests use the production adapter with fake-indexeddb; Firefox tests use native IndexedDB.

Independent reviewers covered graph oracle correctness, cryptographic boundaries, transaction rollback, recovery normalization and local reservation/consent authorization. This is scoped engineering review, not formal certification or full specification approval.

## Remaining work in dependency order

1. **Foundation/protocol** (`packages/security`, `identity`, `federation`, `vault`): complete private-record encryption, delegated device/rotation/revocation/recovery contracts, complete IOX backup scope and migrations; implement canonical global-author streams/gap buffering plus encrypted participant exchange. Preserve the explicitly marked alpha protocol until tested migrations exist.
2. **Canonical domain closure** (`packages/bazaar`, `discovery`, `mutiny`, relevant YAML): reconcile 33 specification warnings; category/profile wants, quantities, compensation, signed releases, full lifecycle/recovery semantics; map new executed tests to stable requirement IDs. Do not reinterpret the current 99/4510 trace as broad completion.
3. **Product workflows** (`apps/pwa`): draft editing UI, counteroffer/revision editor, explicit frozen-conflict recovery, handover/receipt evidence, complete accessibility/localization and usability checks. Current UI supports signed exact-item proposal, reserve, consent, dropout and viewing frozen recovery states.
4. **Release evidence** (`tests/browser`, `.github/workflows`): inspect PR #10 current-head CI; resolve any failures without weakening assertions. Run Chromium/WebKit and Windows/macOS matrix; add service-worker upgrade, storage-denial/eviction and migration journeys. Manual assistive-technology testing remains unpassed.
5. **Consolidation**: review the complete Stage 3/4 base plus this alpha with current heads. Merge only eligible dependency-ordered changes; preserve unique mock/storage continuation work and other contributor branches. No superseded PR has been closed without preservation proof.

Next reproducible commands are README's frozen install/setup/doctor/dev and validation block. Focused browser command: `corepack pnpm exec playwright test --project=firefox`. No agents remain responsible for background work after this handoff.
