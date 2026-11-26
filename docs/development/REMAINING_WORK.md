# Remaining development work

This register accompanies the [comprehensive branch consolidation](BRANCH_CONSOLIDATION.md).
It is based on the current runtime, retained unique branch changes, actual test
coverage and existing contracts. Specifications and generated source-path counts
do not establish completion. The owner has authorized continued incomplete-
feature work and successive independent audits. See the [current handoff](cycles/20261124-combined-vault-recovery/HANDOFF.md).

## Completed slices to preserve

PR #63 has since merged as `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`,
preserving the PR #58–#62 histories. Actual main-push Alpha `44713847841`
and CLI `44713847763` passed. The inspected Alpha log records 78 passed
product browser journeys at that exact main. Earlier source-specific local
results and pending-gate statements below remain historical evidence; they
must not be substituted for the new PR #64–#68 consolidation's qualification.

- Reviewed local alpha and encrypted persistence from PRs #37 and #38.
- Owner listing history from PR #39, plus later archive/recovery, pagination,
  closure, expiry, session locking, location preferences and matching-worker work.
- Exact-money, currency-registry and consent foundations; production composition
  and hardware acceptance remain distinct below.
- Feature-registry extraction from PR #8 through PR #48, including strict safe
  generation and read-only catalog queries. Runtime activation is still pending.
- Main now includes PR #51 test improvements and PR #53's F1a public-record
  verification command through the verified source merge in PR #54. Its exact
  main qualification and documentation-closeout status belongs to the linked
  consolidation record; broader CLI phases remain open.
- The [November 19 feature continuation](FEATURE_COMPLETION_20261119.md) adds
  F1b listing/show/search over explicit signed files, explicit declared-value
  removal in local listing edits, transaction-handle lifetime enforcement and
  safe rejection of malformed paired price bounds. Qualification for this
  continuation belongs to its own evidence, not the earlier main checks.
- PRs #56 and #57 are merged after their own qualification. PR #57 adds
  principal-scoped backup coverage, rejection of unsupported
  record omissions, shared export/recovery preflight, storage input/value
  isolation and stable submitted barter selections. Its actual main merge is
  `137d88e36cc6b1611b062daa33cf84c3d29c86b3`; separate main-push Alpha
  `44671014883` and CLI `44671014863` workflows both completed successfully.
  Original candidate evidence remains in the
  [engineering cycle](cycles/20261119/HANDOFF.md).
- Draft PR #58 extracts the unchanged production PWA backup-codec registry and
  adds mixed-record, generated legacy-subset, and rollback/retry acceptance.
  Its qualification is separate from PR #57; see the
  [round 4 handoff](cycles/20261120/HANDOFF-ROUND4.md).
- The separate [notification/barter recovery candidate](cycles/20261120-next-recovery/HANDOFF.md)
  adds continued local inbox recovery, signed barter recovery with manual
  review, canonical want/coordination keys and accurate freeze explanations.
  Its integrated source passed 127 selected cases plus compiler/static/build
  checks. The three realistic recovery scenarios populate the union of all
  15 production codec types in separate archives. Hosted qualification is
  pending; this does not establish complete database or device recovery.
- The [freeze-reason continuation](cycles/20261120-freeze-reasons/QUALIFICATION.md)
  preserves the distinct expired-reservation and lost-local-hold explanations
  through reconstruction. Full TypeScript, 39 selected persistence/recovery
  cases, setup and build passed at its own source. Hosted qualification remains
  separate. Two existing lifecycle cases gained repeated-refresh/reopen and
  normalization assertions; no case count or timeout changed.
- The [historical readiness reconciliation](cycles/20261120-readiness/READINESS-RECONCILIATION.md)
  maps all 51 existing findings to inspected current controls, unresolved
  boundaries and next acceptance steps. All 51 remain OPEN; original audits,
  severities, provisional gates and owner roles are unchanged.
- The [combined freeze-recovery candidate](cycles/20261120-combined-freeze/QUALIFICATION.md)
  retains both PR #60 and PR #61 histories, the reviewed production implementation,
  both test sets and both original handoffs. Its own source passed TypeScript,
  the 39 affected cases, setup and build, including ordinary owner hold loss,
  separate peer expiry and authenticated withdrawal precedence. This is a new
  source-specific qualification of overlapping cases, not an increased distinct
  test total or hosted/browser completion.
- The [full-registry recovery acceptance](cycles/20261120-full-registry-recovery/QUALIFICATION.md)
  now exercises all 15 current production record types together in one archive,
  with real accepted barter evidence driving local notifications. Complete
  records and ordinary readers survive restore/reopen under the two documented
  normalization policies; repeated refresh preserves inbox/dedupe/counters and
  ordinary mark-read/archive-republish actions continue. Full TypeScript and
  nine selected cases passed at its own source. Production bytes are unchanged
  from PR #62; hosted qualification and excluded-store/device recovery remain
  separate.

## Priority and dependency register

Effort is an engineering estimate, not measured duration or a commitment: S = a focused change and validation, M = several coordinated components, L = substantial cross-domain work, XL = a separate milestone. External browser fixes, hardware tests and policy decisions have independent lead times. Dependencies below identify an implementable next step without beginning unrelated development during consolidation.

| Priority | Work item and affected components | Dependencies / next concrete step | Estimated effort |
|---|---|---|---|
| P1 | BlindMatch confidential economic discovery (LocalBazaar, LocalMutiny, vault, consent, discovery) | Owner priority 2026-11-26: start BM-A ownership/spec reconciliation, then private intents, scoped consent and local matching; qualify confidential bilateral/price/cycle providers in dependency order. Preserve existing P1 safety work, no mandatory provider or plaintext fallback. [Spec](../blindmatch/SPEC.md), [diagrams](../blindmatch/DIAGRAMS.md), [roadmap and acceptance](../blindmatch/ROADMAP.md). | XL (split into independently reviewable slices) |
| P1 | Native WebKit identity import compatibility (`packages/identity`, vault, `tests/compat/browser-crypto`) | Current bounded new-key generation retries mitigate creation availability only. Requalify reviewed upstream fixed-width engine repair using the unchanged leading-zero/all-zero import vectors, deterministic signatures and native stress probe; then validate create/unlock/restore in product. Never rotate existing identity on unlock failure. | M plus external engine availability |
| P1 | Encrypted-storage recovery/rotation/load and backup completeness (`packages/vault`, kernel storage) | Record coverage and shared recovery preflight are qualified through merged PR #57. Full-registry recovery merged through PR #63 with passing main-push qualification. Complete the later combined PR #72 current-head hosted gates; its attachment diagnostic and persisted-state rejection acceptance do not supply portable attachment recovery. Local acceptance now populates all 15 codec types together in one archive with real barter-to-inbox routing and ordinary post-recovery actions. Attachment/reference recovery, delivery/lease rules, rotation, whole-database rollback and actual interrupted-device/load acceptance remain separate. | L |
| P1 | Canonical identity/device/recovery authority (`packages/identity`, federation, consent) | Resolve root/device roles, authenticated delegation, revocation and recovery/notice/dispute contracts; implement real owner-authorized handlers and end-to-end adversarial tests before depending on recovered signature helpers. | XL |
| P1 | Canonical federation and compatible signed-file migration (`packages/federation`, discovery, vault restore) | Select explicit protocol version boundary; preserve alpha CID/signature bytes and per-subject histories; independent canonical vectors, author-stream gap/quarantine, delegated signer validity and old-backup acceptance. | XL; depends on identity authority |
| P1 | Retention, purge, deletion and evidence lifecycle (`bazaar`, privacy, vault) | Define one cross-domain hold/evidence/tombstone/backup policy; implement bounded resumable purge with idempotency and recovery tests. Current archive/recovery and signed withdrawals are already implemented but do not erase peer copies. | L |
| P1 | Security findings and release evidence (`planning/SECURITY_FINDINGS_TRACKER.md`, tools/gates, CI) | The 51-row current-source reconciliation now links implemented alpha controls, unresolved boundaries and next acceptance. All historical rows remain open; they are planning/readiness findings, not 51 confirmed current runtime vulnerabilities. Complete accountable control acceptance and full release/dependency/security evidence separately from spec completeness. | M for release aggregation; L/XL for remaining controls |
| P2 | Consent production composition (`packages/comms`, owning domains, PWA, backup) | Implement trusted subject/revision resolver, immutable wording UI and confirmation, key validity, codec validation and revocation-preserving backup; add dependency quarantine/replay before enabling new consent domain for users. | L; identity/federation dependencies for delegated mode |
| P2 | Currency registry PWA composition (`commerce/valuation`, PWA, vault) | Provide authentic signed release snapshot with documented authority, production vault/usage adapters, migration/preflight and immutable binding tests. Do not invent the missing authenticated snapshot. | M after snapshot is available |
| P2 | Money and matching target-device qualification (`commerce/precision`, matching worker) | Run the specified performance workloads on the actual target hardware, profile memory/latency at full caps, preserve existing limits and cancellation assertions. Pure arithmetic/vector and host tests do not establish mobile budgets. | M plus device availability |
| P2 | Listings, inventory and publication completion (`packages/bazaar`, PWA) | Owner history and explicit local value removal are implemented. Add published editing and material-change reconsent, quantity/variants, kind-specific terms, media admission, renewal/conflict recovery and real signed reservation release as distinct tested slices. | L/XL; consent/attachment boundaries needed |
| P2 | Broader public CLI distribution and retained-cache access (`tools/cli`, retained public discovery) | F1a verification and F1b explicit-file listing/show/search are implemented. A packaged executable/version interface and a supported persisted retained-cache adapter remain separate; do not read browser IndexedDB implicitly. Private phases remain below. | M |
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

The current continuation is [draft PR #72](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/72), combining PR #70's explicit PWA attachment diagnostic and PR #71's
persisted restore-rejection proof. Both histories and their contributed source
blobs are preserved. The combined source passed 30 selected integration cases,
TypeScript/static checks, 27 tooling tests, 46 CLI tests and setup/build. Added
browser assertions remain unexecuted locally. Complete actual current-head
hosted qualification before merge; the [publication checkpoint](cycles/20261120-pwa-recovery-consolidation/PUBLICATION.md)
records its exact source and dated queued workflow observations.

Preceding PR #69 combines independent codec compatibility candidates
#64–#66 with the attachment scope and diagnostic candidates #67–#68. It adds
a tenant-indexed holder query and ordinary acceptance for rollback, encrypted
reopen, lock revocation and compatible retry into a previously rejected restore
destination. Complete this candidate's exact-source qualification before merge.
The [attachment source inventory](cycles/20261120-recovery-consolidation/ATTACHMENT-SOURCE-INVENTORY.md)
identifies the next substantive dependencies: an owning media domain with a
canonical authenticated parent/revision contract, production admission and
retention, followed by a separately versioned portable format and atomic
destination persistence. Existing holder labels and arbitrary record fields
must not be promoted into attachment authority.

The preceding recommendation and qualification history follows for provenance.

The merged [backup implementation](BACKUP_SCOPE.md) provides the previously
recommended shared recovery preflight and record inventory. Its focused acceptance checks
cover foreign ownership, canonical-key normalization, detached original data,
unchanged identity/signatures, asynchronous lock and a destination that remains
uninitialized after a failed restore and reopen. PR #57's own main-push workflows
passed. Current-source hosted qualification and independent review of the subsequent candidates remain
separate gates.

The production PWA codec registry now has executed realistic listing/location,
notification and barter recovery scenarios: export, restore into a new encrypted
vault, reopen, compare normal readers and identity, and continue ordinary owner
actions. Generated subset compatibility and memory transaction rollback/retry
remain separate existing fixtures. Complete the actual current-source hosted
qualification before marking these candidates integrated. Keep the full
production registry shared rather than copying its rules into test-only code.

Combined PR #62 preserves documented expired-reservation and lost-local-
reservation causes through reconstruction and retains both independently
developed acceptance sets. Its test-only follow-on executes one full-registry
archive with genuine barter-to-inbox routing, complete recovery snapshots and
continued owner actions. Complete the actual current-source hosted gates before
integration. Keep each pending source stable and preserve signed terminal
outcomes and the prohibition on automatic recommit.

Attachments/blob references and delivery/queue/lease state remain excluded.
Their recovery policy, compatible authenticated manifest, atomic persistence,
rotation and copied-vault semantics need separate complete slices. Inventory
limits bound returned counts and export admission, not every row-counting cost.
Native WebKit existing-key compatibility and the other P1 items remain open.
Choose each subsequent slice against fresh main, current PRs and worker activity.
