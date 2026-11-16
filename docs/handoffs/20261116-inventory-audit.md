# Feature and branch audit handoff — November 16, 2026

## Checkpoint

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Implementation baseline reviewed: `560b328dd335aebdc12de01ec339c43ebd164be3`, PR #41, `codex/classrup-features-20261116`.
- Working continuation: `codex/parallel-completion-20261116`.
- This report reviews the baseline Git tree. Concurrent lifecycle, vault, commerce, notification and application changes must provide their own handoffs and verification; they are not counted as complete here.
- No runtime files, remote branches or pull requests were modified by this audit. The audit did not run runtime tests and does not establish release qualification.

## Review result

The repository has a functioning local alpha with substantial incomplete product scope. The newest history/archive branch preserves its predecessors' work. Most parked feature branches have already been integrated by content and should not be merged again simply because their original commit IDs are not ancestors. The largest remaining gaps are absent implementations or absent integration boundaries, not undiscovered finished branches.

The baseline generated inventory (`docs/status/FEATURE_STATUS.md`) reports 31/148 modules with runtime paths, 13/688 exact specified command/query names and 442/4510 requirements with mapped passing tests. These are traceability counts, not completion percentages. For example, identity, federation and cryptography have genuine alpha runtime files even where the inventory reports no canonical module implementation. Conversely, finding source at a canonical path does not establish every contract or application journey.

## Consolidation evidence

`git diff HEAD...<branch>` describes changes since a common ancestor, not work missing from HEAD. The audit additionally compared each candidate path's current blob with the branch blob and checked whether the path exists at HEAD.

| Branch / head | Evidence at baseline | Required action |
|---|---|---|
| `codex/classrup-features-20261116` — `560b328dd335aebdc12de01ec339c43ebd164be3` | Current baseline; archive recovery and pagination. | Continue from this head, retaining its pending qualification limits. |
| `codex/verified-status-20261116` — `edcb583afc2cba40f32b0cbdbce765d65febbd21`; `codex/listing-history-20261116` — `3f814c03a8c09652c79312959d0225ee0742457b` | Both are ancestors of baseline. | Preserve PR #39 → #40 → #41 history; no reimplementation or duplicate integration. |
| `codex/encrypted-domain-storage-20261116` — `afa6952b50d97e46e8e54d950db92a3593f1e5bd`; `codex/classrup-completion-20261116` — `a189787ab6cc0741743da0cd0cf8b0a9cd2e39dc` | Ancestors; storage protection and earlier content consolidation present. | Validate only subsequent changes against this implementation. |
| `main` — `32c9d7e010000ca72fddfe64233459daca3c06fa` | Not a commit ancestor because of merge history; common-ancestor-to-main runtime/tooling/test diff is empty. Direct main-to-baseline changes are the expected listing-history/archive work and associated vault/UI/tests. | No independent newer runtime to import from main at this snapshot. |
| `agents/discovery/ranking` — `de8f44d52cfccf4f1496a885cd4ac70894ff3847`; `agents/i18n/languages-currencies` — `a0f9422d91b91d147405c17730d49350e87fc3ce` | Commit ancestors through `d16abeef4dfab4f6376436f944f88a25d5a1bf8f`. | Already integrated. |
| `agents/discovery/coarse-filters` — `4f60ff9fa121435b962801d6594d9fca413d5bb7` | All 9 changed runtime/test/note paths exist; 5 are identical and 4 carry later changes. | Already integrated by content; retain newer bounds fixes. |
| `agents/governance/taxonomy-prohibited` — `997249164e4b32df443dbbe2e07f729311c9cdeb` | All 14 paths exist; 12 identical; only 2 notes differ. | Already integrated by content. Remaining application policy is separate work. |
| `agents/privacy/classification-metadata-consent` — `2752f04dd27c6df90ffa5d22d479e77ae2688a86` | All 19 paths exist; 14 identical; 5 changed, including later format/test fixes. | Already integrated by content. Branch name does not mean privacy consent is implemented. |
| `agents/moderation/rate-limits-signals` — `c098f1bf91759afd8ab0519ba04fa27671605de5` | All 10 paths exist; 4 identical; 6 carry notes or corrective changes. | Already integrated by content; preserve fail-closed rate-limit fixes. |
| `agents/notify/prefs-inapp` — `d6076d18621e16ec5b6a87e210f99bd305cf6243` | All 10 paths exist; 1 identical; 9 include later application/backup/revocation work or notes. | Already integrated by content. Do not overwrite with older notification code. |
| `agents/ci/trim-workflows` — `3f41b81accf062b2031504bd2e98d2913fb17fb8` | All 4 workflow/planner/test paths are byte-identical. | Already integrated by content. |
| `claude/bold-mccarthy-qklhl6` — `a403614bb34d3d176d4693730e512e14959718b8` | 34 runtime paths differ from common ancestor; partial registry, security and storage work. Prior review documents missing generated registry and missing imported security index files. | Selective port only after dependencies, exports, vectors and transaction tests exist. A wholesale merge would replace working contracts with incomplete foundations. |
| `claude/busy-cerf-vg3hz3` — `34a6892cff8babb01c41f42d04df85bf6860fa34` | 256 runtime/tooling/test paths from a different TypeScript/relay architecture. Has messaging, consent, meetup and relay source. Services, rentals, auctions and commerce entrypoints are literally `export {};`. | Use behavior/test cases as porting references; current `defineCommand`/repository APIs differ from its `Operation`/`runCommand`/collection APIs. No hidden finished services/rentals/auctions implementation exists there. |
| `claude/difficult-project-parts-dcqlup` — `566778cdf72399df4696e1d6f6675412813e6d5a`; `claude/wonderful-cori-ynhlsb` — `3a5c9e36e22a635104dfecf41641b438c95fa239` | No unique runtime changes in `packages`, `apps`, `tools`, `tests` or `.github` after their common ancestors. | Preserve planning/security content; not an implementation completion source. |
| `continuation/classrup-20261101` — `fa0cf0c33c80e71787539b964a03c0e8a561c718` | Preserves the old `app/` mock-demo line and browser workflow. Its runtime/storage contract is incompatible with active `apps/pwa`. | Adapt useful UX individually; do not install mock-backed flows beside real flows. |
| `planning/future-cli-specs-20261110` — `af4dcc546e6342fb34d717d4050b52b8ffe7ffa3` | No runtime changes. | Real domain CLI parity remains distinct from existing setup/build/serve commands. |

Older corrective branches for outbox isolation, symlink handling, diagnostic privacy, barter status, noscript protection and sync-expiry bounds are ancestors of the baseline. Earlier wiki/audit/hourly-note branches do not contain additional current runtime under the active runtime paths.

## Remaining feature groups and prerequisites

This table covers all 18 declared feature groups. It is an actionable gap map, not a claim that every one of 4,510 requirements was independently reviewed.

| Group | Baseline runtime | Main unfinished behavior | Dependency or next concrete slice |
|---|---|---|---|
| F01 LocalBazaar | `packages/bazaar/src/listings/`; listing editor/history/archive UI | Expiry/closure/purge; published edits and reconfirmation; sell/wanted/giveaway terms; quantities/variants; media; purchase offers and negotiation | Lifecycle team owns safe state transitions. Terms and offers need authoritative exact Money, participant consent and transaction-scoped holds. Add service/auction/rental kinds only with their real behavior. |
| F02 LocalMutiny | `cycle_matching/`, `trade_proposals/`, `apps/pwa/src/barter*` | Canonical matching profiles/category wants; compensation and per-party tolerances; responsive full-cap browser execution; handover/recovery; signed release notices | Preserve exact-item signed alpha protocol. Add authenticated execution evidence only after commerce/consent interfaces exist. Worker offload can be an independent bounded slice. |
| F03 Services | Package metadata only | Offering catalog, calendar/holds, quotes/bookings, milestones and disputes | Canonical catalog requires a published **service** listing, currency registry, taxonomy and signing. Current listing kind schema only admits sell/wanted/giveaway. Calendar requires pinned IANA database and explicit DST handling. |
| F04 Auctions | Package metadata only | Seller terms, host acceptance, ordered bids, close, anti-sniping, shill/fraud controls | A chosen relay host is an explicit ordering/time authority in the spec. Without a real host/acceptance protocol, enabling auctions would violate the fail-closed contract. Local device time is not a substitute. |
| F05 Rentals | Package metadata only | Offering/calendar capacity, request/confirmation, deposits, handoff/return/damage | Requires **rental** listing, transaction-scoped Deal creation, payment claims, authenticated participant transport and exact pricing. Half-open UTC overlap arithmetic is a reusable bounded foundation, not a completed rental workflow. |
| F06 Discovery | Retained verified listings, coarse cells, filters/ranking | Full index/query semantics, persistent user location preferences, proximity query contract, canonical query names | Add owner-scoped coarse location preferences without exact-coordinate persistence; preserve explicit regional-overlap UI meaning. Current `local-options.ts` expressly states no FTS index exists. |
| F07 Identity/reputation | `packages/identity/src/identity.ts` plus vault | Canonical account/session profiles, delegated-device rotation, revocation, recovery, reputation and trust evidence | Current root-key identity must not be described as complete device lifecycle. Recovery needs authenticated key lineage and conflict handling; reputation needs actual signed transaction evidence. |
| F08 Communications | No current package runtime at baseline | Private messages/threads/attachments, structured offers, consent and meetups | Do not call signed plaintext file exchange private messaging. Requires current recipient encryption keys, participant authorization, revocation, attachment sanitation and retention. Historical comms branch is a behavior reference only. |
| F09 Commerce | Package metadata; kernel Money shape and i18n formatting elsewhere | Canonical arithmetic, currency registry, FX, deals, payment claims, receipts, reconciliation and disputes | Pure F09.S03.M03 Money library is the smallest dependency-ready foundation. Complete exact amount semantics before signed offer/deal commitments. Payment claims are not settlement verification. |
| F10 Privacy | Classification and metadata libraries | Consent, retention/legal holds, comprehensive export and deletion | Couple lifecycle to vault/backup/federation evidence retention. Do not promise deleting other users' copies or physical erasure. Sanitizers still require real media upload wiring. |
| F11 Federation | Strict bounded signed alpha envelopes | Canonical per-author streams, device revocation, relay transport/acks, trust/blocklists, migration and import preflight | `packages/federation/README.md` explicitly excludes these. Authentic signatures alone do not establish domain authority, replay admission or delivery. |
| F12 Moderation | Rate-limit, limits and signal helpers | Flags/evidence/appeals, enforcement, spam/abuse policy, risk application wiring | Build local report/evidence access boundaries first; authorization and privacy need negative tests. Helper presence is not actual caller enforcement. |
| F13 Notifications | Local in-app routing, inbox, preferences, opt-ins and backup | Quiet hours/schedules; push/email configuration and delivery | Quiet hours are a dependency-ready local slice. External channels need explicit configured providers and real acknowledgement evidence. Revocation must remain available at saturation. |
| F14 Accessibility/i18n | Language/currency libraries and accessible alpha markup | Fully localized PWA, complete keyboard/screen-reader journeys and manual WCAG assessment | Reuse catalog APIs; avoid calling four small seed catalogs complete product translations. Native/manual assistive technology evidence remains separate from browser assertions. |
| F15 Platform | Kernel bus/storage/outbox/observability; vault protection; static PWA/CLI | Canonical offline commands and relay service; full backups/recovery/media/outbox coverage; feature registry/flags/tenant contracts | Keep encrypted rows, backup codecs and migration atomic. Do not import incomplete registry generated-file references. Full CLI domain actions are still missing. |
| F16 Security | Crypto primitives and kernel authorization/logging | Canonical resource authorization, key management/revocation, incident records/response, threat assurance | Map each historical security finding to current runtime evidence individually. Do not infer entire finding closure from one helper or passing test. |
| F17 Quality | Domain/property/integration/browser tooling and CI definitions | Requirement-level acceptance, fuzz/security/chaos/load/offline matrices, final-head browsers/OS, release evidence | Run final combined source, retain failures and platform limits, then refresh generated status using actual passing results. Prior-head CI cannot qualify new code. |
| F18 Governance | Goods taxonomy/prohibited policy helpers | Jurisdiction packs, complete caller enforcement, governance decisions and transparency reporting | Runtime dependencies and human policy decisions are distinct. No silent allow-all fallback when a required pack is unavailable. |

## Dependency order for fresh implementation teams

1. Finish and independently review the already active lifecycle, vault and notification slices. Integrate UI, backups and startup/refresh handling before claiming a usable feature.
2. Implement F09.S03.M03 exact Money arithmetic as a pure library. Its spec depends only on CTR-MNY/ERR/TST and explicitly excludes storage, network and clock. Required tests include positive/negative half-even ties, final 38-digit overflow, rational conversion with one rounding step, and largest-remainder allocation preserving totals.
3. Implement currency registry with explicit immutable decimals/chain bindings, authoritative snapshot provenance, enabled/new-use versus readable-existing-use semantics and fail-closed usage checks. Existing `@classrup/i18n` formatting does not replace the registry.
4. Complete sale terms and offers on those Money foundations. Admission must bind signer, participant role, exact listing/terms revision, expiry and previous evidence. Integrate accepted-offer local holds and reconfirmation before published editing.
5. Add Deal/payment-claim/receipt state with authenticated counterparty evidence. Do not manufacture confirmation from a local user's declaration.
6. Complete canonical identity/recipient-key and federation boundaries before private messaging, then thread-bound consent/meetups and service/rental negotiation.
7. Implement service/rental listing kinds and calendars only when the referenced listing, currency, Deal and transport ports exist. Auctions additionally require an actual selected host authority and explicit host acceptance.

Parallel work that can proceed without bypassing these dependencies: coarse location preferences, full PWA translation coverage, catalogue-backed UI errors, retention UI for existing alpha records, barter matcher worker offload, dependency-independent arithmetic/calendar algorithms, and stronger browser/platform/negative-test coverage. Each is a bounded slice until integrated with its product workflow.

## Security audit disposition

`planning/SECURITY_FINDINGS_TRACKER.md` contains 51 **OPEN planning/readiness findings**, not 51 proven exploitable defects in this runtime. The tracker states its severity-to-gate assignments are provisional. No historical finding was closed by this audit.

Some baseline controls now exist: authenticated vault row encryption and inventory, owner checks, capability dispatch, strict bounded signature verification, replay/revision checks, payload-free notifications and privacy redaction. These are useful evidence for a later finding-by-finding review. They do not settle whole-store rollback, delegated-device compromise/recovery, cross-party revocation, canonical federation, complete retention/deletion, private communications, operational response or manual qualification.

Keep `SECURITY_*.md` and the historical tracker intact. A runtime control matrix should cite the exact implementation, negative test and final candidate SHA for each proposed disposition; preserve unresolved subrequirements rather than setting an entire finding to closed from partial overlap.

## Fresh reviewer handoff

- Read all sibling `docs/handoffs/20261116-*.md` files and the actual combined diff.
- Confirm every exposed feature has production composition, owner/participant authorization, encrypted backup inclusion where appropriate, and meaningful test coverage.
- Check signer failures and persistence failures leave no partial records/events; check stale revisions, wrong authors, duplicate imports, expiry boundaries and capacity saturation.
- Check startup/refresh sweeps cannot modify another principal's records or silently republish restored content.
- Inspect final resource-bounded domain, CLI/tooling, type, build, spec and dependency check results; browser definitions loading is not a browser pass.
- Record final candidate SHA separately from inherited PR #39/#40/#41 verification. Do not claim all features complete while the matrix above remains open.

## Audit reproduction

Read-only commands used: `git for-each-ref refs/remotes/origin`, `git merge-base --is-ancestor`, `git diff --name-only HEAD...<ref> -- packages apps tools tests .github`, direct `git rev-parse <ref>:<path>` blob comparisons, `git diff --name-status origin/main HEAD`, and `git show <ref>:<path>` for historical entrypoints/communications implementations. Source inventory used `rg --files` and direct reading of canonical `module.spec.yaml`, package entrypoints, current status, branch ledger and security tracker.

No package count or branch count is used as a product completion percentage.
