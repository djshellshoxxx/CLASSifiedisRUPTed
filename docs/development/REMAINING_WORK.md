# Remaining development work

This register accompanies the [comprehensive branch consolidation](BRANCH_CONSOLIDATION.md).
It is based on the current runtime, retained unique branch changes, actual test
coverage and existing contracts. Specifications and generated source-path counts
do not establish completion. This consolidation performs integration and bounded
repairs; unrelated feature implementation belongs in subsequent work.

## Completed slices to preserve

- Reviewed local alpha and encrypted persistence from PRs #37 and #38.
- Owner listing history from PR #39, plus later archive/recovery, pagination,
  closure, expiry, session locking, location preferences and matching-worker work.
- Exact-money, currency-registry and consent foundations; production composition
  and hardware acceptance remain distinct below.
- Feature-registry extraction from PR #8 through PR #48, including strict safe
  generation and read-only catalog queries. Runtime activation is still pending.
- The consolidation branch preserves PR #51 test improvements and PR #53's F1a
  public-record verification command. Its main-merge/qualification status belongs
  to the linked consolidation record; broader CLI phases remain open.

## Priority and dependency register

Effort is an engineering estimate, not measured duration or a commitment: S = a focused change and validation, M = several coordinated components, L = substantial cross-domain work, XL = a separate milestone. External browser fixes, hardware tests and policy decisions have independent lead times. Dependencies below identify an implementable next step without beginning unrelated development during consolidation.

| Priority | Work item and affected components | Dependencies / next concrete step | Estimated effort |
|---|---|---|---|
| P1 | Native WebKit identity import compatibility (`packages/identity`, vault, `tests/compat/browser-crypto`) | Current bounded new-key generation retries mitigate creation availability only. Requalify reviewed upstream fixed-width engine repair using the unchanged leading-zero/all-zero import vectors, deterministic signatures and native stress probe; then validate create/unlock/restore in product. Never rotate existing identity on unlock failure. | M plus external engine availability |
| P1 | Encrypted-storage recovery/rotation/load and backup completeness (`packages/vault`, kernel storage) | Define storage key/passphrase rotation, supported backup record coverage and complete-database rollback model; add large working-set/device measurements and interrupted migration/recovery acceptance. Current backup excludes blobs, inbox/outbox, lease and delivery state. | L |
| P1 | Canonical identity/device/recovery authority (`packages/identity`, federation, consent) | Resolve root/device roles, authenticated delegation, revocation and recovery/notice/dispute contracts; implement real owner-authorized handlers and end-to-end adversarial tests before depending on recovered signature helpers. | XL |
| P1 | Canonical federation and compatible signed-file migration (`packages/federation`, discovery, vault restore) | Select explicit protocol version boundary; preserve alpha CID/signature bytes and per-subject histories; independent canonical vectors, author-stream gap/quarantine, delegated signer validity and old-backup acceptance. | XL; depends on identity authority |
| P1 | Retention, purge, deletion and evidence lifecycle (`bazaar`, privacy, vault) | Define one cross-domain hold/evidence/tombstone/backup policy; implement bounded resumable purge with idempotency and recovery tests. Current archive/recovery and signed withdrawals are already implemented but do not erase peer copies. | L |
| P1 | Security findings and release evidence (`planning/SECURITY_FINDINGS_TRACKER.md`, tools/gates, CI) | Reconcile each historical finding with current owning workflow, remaining negative acceptance and accountable closure. All 51 historical rows remain open; they are planning/readiness findings, not 51 confirmed current runtime vulnerabilities. Build full release aggregation and dependency/security audit evidence separately from spec completeness. | M for evidence reconciliation; L/XL for remaining controls |
| P2 | Consent production composition (`packages/comms`, owning domains, PWA, backup) | Implement trusted subject/revision resolver, immutable wording UI and confirmation, key validity, codec validation and revocation-preserving backup; add dependency quarantine/replay before enabling new consent domain for users. | L; identity/federation dependencies for delegated mode |
| P2 | Currency registry PWA composition (`commerce/valuation`, PWA, vault) | Provide authentic signed release snapshot with documented authority, production vault/usage adapters, migration/preflight and immutable binding tests. Do not invent the missing authenticated snapshot. | M after snapshot is available |
| P2 | Money and matching target-device qualification (`commerce/precision`, matching worker) | Run the specified performance workloads on the actual target hardware, profile memory/latency at full caps, preserve existing limits and cancellation assertions. Pure arithmetic/vector and host tests do not establish mobile budgets. | M plus device availability |
| P2 | Listings, inventory and publication completion (`packages/bazaar`, PWA) | Owner history is already integrated. Add published editing and material-change reconsent, optional-value removal, quantity/variants, kind-specific terms, media admission, renewal/conflict recovery and real signed reservation release as distinct tested slices. | L/XL; consent/attachment boundaries needed |
| P2 | Public CLI F1b (`tools/cli`, retained public discovery) | Read-only explicit-file/local-retained listing/show/search with stable versioned output, bounded pagination, no implicit network/private keys and shared domain rules. F1a record verify is supplied by PR #53. | M |
| P2 | Feature settings/activation (`platform/configuration`, PWA) | Use recovered immutable registry but keep runtime availability separate; implement real per-user flags, dependency closure, disabled path checks and backup unknown-module diagnostics. | M |
| P2 | Public-ID privacy migration (PR #8 helpers, kernel, public records) | Define new-public-record boundary and compatibility for prior signatures/references. Then integrate tested hour precision without using public IDs as private order. | M; contract/migration decision first |
| P2 | Hosted module wiring (`governance`, moderation, notifications) | Implement production enforcement at actual callers, notification consent/reconfirmation UI, report-from-notification, mirror purge scheduler, policy selection and import/export support. A collection of helpers is not end-to-end completion. | L; optional relay items depend on real relay composition |
| P3 | Private CLI file-vault/parity phases F2-F3 | Implement encrypted file-vault adapter, single-writer/crash safety, PWA backup round trip and forked-working-copy detection before adding mutation/signing commands. Then expose supported owner/barter operations through shared handlers. | L/XL |
| P3 | Private messaging and meetup workflow (`packages/comms`, identity, transport) | Authenticated recipient-key discovery, encryption/addressing, consent/revocation, attachment boundary, retention, safe-meetup UX and actual transport. Preserve client ownership; do not import relay assertions as sender authority. | XL |
| P3 | Purchase offers, Deals, claims, receipts and barter execution (`bazaar`, commerce, mutiny) | Complete authenticated participants, revision/consent and payment-evidence authority, handover/recovery state machines and backup/import acceptance. Claims cannot imply settlement. | XL |
| P3 | Services, auctions, rentals and reputation | Use existing requirements as references; add real domain implementations after listings/inventory, identity, consent, commerce and ordering/host authority prerequisites. Unique old specification branches contain no runtime completion. | XL per feature family |
| Cross-cutting | Requirement semantics, fuzzing, manual a11y and independent acceptance | Map actual assertions to requirements and test exposed journeys across supported platforms; preserve manual, hardware and operational gates as uncompleted until performed. Generated path counts are traceability, not a completion percentage. | Continuous; defined gates per milestone |


## Source-preservation and integration boundaries

PR #8 remains the source for selectively reusable IDs, canonical signatures,
relay-secret adapters and storage/settings proposals. The already recovered
registry must not be counted again as a new recovery. The remaining runtime
checkpoint has incompatible contracts and missing dependencies; use the
[selective recovery review](evidence/20261118/recovery-review.md) to define one
complete, tested slice at a time.

Keep `claude/busy-cerf-vg3hz3`, `claude/happy-newton-4yttpa`,
`claude/wonderful-cori-ynhlsb` and the WebKit diagnostic branch as preserved
references. Their existence does not establish implementation or qualification.
For specification adoption, edit canonical source `module.spec.yaml` and
regenerate, preserving accepted architecture and versioned compatibility.

There were no open non-PR GitHub issues at discovery. Draft PR #8 is tracked
separately from the 51 open historical planning/security-readiness findings;
those findings require evidence reconciliation and are not 51 newly confirmed
runtime vulnerabilities. No release or deployment was performed.

## Recommended next bounded milestone

Complete and independently verify public CLI F1b (explicit-file/local-retained
listing/show/search) after this consolidation is merged, while treating native
WebKit existing-key compatibility and the other P1 items as release-readiness
blockers. Choose the next milestone against the latest main and current worker
activity; do not mutate another worker's branch or silently substitute a new
identity to work around an import failure.
