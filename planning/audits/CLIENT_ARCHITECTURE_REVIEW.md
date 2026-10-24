# Independent client architecture review — 2026-10-24

Reviewer: independent Codex architecture/security review agent `/root/architecture_review`, separate from document authors. Documentation review only, against baseline `39ac847870746e14b466d5706ebe5b00dddbaadb` on `docs/client-owned-foundations-20261024`. No application tests, penetration testing, cryptographic approval, or production certification performed.

Scope: `PROJECT_SPEC.md`; `planning/CLIENT_SIDE_ARCHITECTURE.md`, `ADR_PROVISIONAL_DECISIONS.md`, `INTEGRATION_DEPENDENCIES.md`; all four `planning/contracts/*.md`; the ten `01_LocalBazaar/01_listings/mod_create` process contracts and their module SPEC. Reviewed actual baseline diff for existing contracts and current new architecture text. The 1,470 DRAFT process placeholders were **not reviewed**. Root's other in-progress threat/gate/roadmap/handoff documents were excluded from initial review. No AGENTS.md found by workspace search.

## Initial findings

| ID / severity | Exact contract / defect | Concrete required correction and remaining limit |
|---|---|---|
| CAR-01 / High | `planning/contracts/CYCLE_BARTER_EXECUTION.md` CB-001/003 binds consent to listing revisions, while `CLASSIFIED_LISTING_CONTRACT.md` CL-002 transitions the same listing to reserved_local using its revision. A successful hold can stale the proposal that authorized it. | Separate immutable economic offer revision/digest from local reservation coordination revision, or define an equally explicit non-circular rule. Test two parties holding sequentially without invalidating unchanged terms, and economic edits invalidating consent. Holds still cannot establish cross-vault exclusivity. |
| CAR-02 / Medium | `planning/contracts/MESSAGING_PAYMENTS_FEDERATION.md` MPF-001 disables message creation, but ARCH dependency matrix / INT-002 promise local drafts. | Explicitly permit local composition, memory-only until reviewed storage protection; keep send/receive/relay blocked. Local composition is not encrypted delivery. |
| CAR-03 / Medium | `planning/contracts/CORE_API_EVENTS_DATA.md` CR-003 names payment.verified/moderation.actioned, while `planning/INTEGRATION_DEPENDENCIES.md` INT-004 consumes payment.observed/payment.verification_revoked/moderation.local_hidden. | Establish matching canonical event names and migration/rejection rules for old names. An event must never imply settlement or global moderation. |
| CAR-04 / Medium | `planning/contracts/CYCLE_BARTER_EXECUTION.md` CB-001/004 declares an MVP restricted to one listing, k<=8 and same-currency fiat, with other work deferred; INT-005 disclaims any approved scope deferral. | Identify bounded provisional implementation/search profiles and retain >8/multiasset/FX/crypto requirements as unresolved tracked scope, without declaring owner-approved exclusions. Bounded search cannot certify no larger cycle exists. |
| CAR-05 / Medium | `01_LocalBazaar/01_listings/mod_create/privacy_retention_abuse.md` PS-002-07.R03 limits create attempts to 10/hour; PS-002-06/09 require 100 identical replays and PS-002-08 measures 100 serialized new creates. | Resolve committed command receipts before new-mutation quotas; identical replay must not consume creation quota. Declare a separate reproducible performance-test quota profile and test production quota behavior separately. Local quotas do not prevent Sybils. |
| CAR-06 / Medium | `planning/contracts/CORE_API_EVENTS_DATA.md` CR-002/004 stores canonical request bytes containing private draft text; CR-006 and PS-002-07.R02 only name minimal deletion markers, leaving body scrubbing and replay-after-delete unclear. | Specify atomic removal of request/body copies and minimal marker behavior, plus exact response when a deleted command is retried. Avoid retained plaintext or unsalted low-entropy content fingerprints represented as harmless metadata. Physical erasure/remote purge remain impossible guarantees. |
| CAR-07 / Medium | `01_LocalBazaar/01_listings/mod_create/SPEC.md` Acceptance still requires F07 identity FK and OpenAPI generation, conflicting with local principal semantics and PS-002-04. | Replace stale database/network-specific gates with local principal/key-storage design, typed in-process schemas and browser/reviewer evidence; no mandatory backend gate. |
| CAR-08 / Medium, protocol gate | `planning/contracts/CYCLE_BARTER_EXECUTION.md` CB-001 evidence includes decisions plus advisory observed_at; CB-003 does not explicitly define old acceptance replay after known revoke/decline. | Require order-independent revoke/decline dominance for the same proposal digest or a reviewed authenticated causal alternative; conflicting histories quarantine. Add replay/reorder fixtures. Leave peer execution disabled until the profile is reviewed; unseen offline revocation remains possible. |

## Recommendation and limits

**Initial architecture-only recommendation: changes requested** for the contradictions above. The fundamental direction respects client-owned authority: no required product account/backend or server-held secrets; transaction boundaries are local; imports require signature/trust validation; optional transports do not confer consent; messages cannot fall back to remote plaintext; global locks/time/deletion/moderation are explicitly disclaimed. No critical issue or mandatory-backend dependency was found in the reviewed architecture direction.

**Whole-suite recommendation: NO-GO.** This review cannot approve the 1,470 DRAFT placeholders or replace unresolved crypto, key/storage, recovery, dependency, legal/policy, protocol and integration contracts. Documented disabled behavior is a temporary fail-closed gate, not completed feature scope. Independent review and executable test evidence remain required at their respective stages. Architectural review may precede implementation; runtime evidence must not be falsely required as already passing evidence for a documentation-only architecture decision.

## Follow-up disposition

Re-read the corrected contracts/processes and expanded review to the threat model, release gates, end-to-end flows, decisions, roadmap, project TODO, README, contract map and module TODO. HANDOFF and the refreshed completeness report were read for context only: their author-reported structural counts, remote evidence and tooling tests were not independently reproduced here. Mutable handoff/audit/status reports are excluded from the fingerprint.

| Finding | Final documentation disposition |
|---|---|
| CAR-01 | Resolved: CR-001/CL-002/CB-003 separate local CAS revision from signed economic revision/digest. Hold preserves economic consent; material edits require cancellation/new consent. CL-007/CB-006 add required fixtures. |
| CAR-02 | Resolved: CR-001/MPF-001 explicitly permit memory-only unsent drafts; protected persistence and every transport path remain gated. |
| CAR-03 | Resolved: CR-003 registry matches INT-004 payment/moderation consumers, includes principal.deletion_requested, and forbids historical alias emission without migration. |
| CAR-04 | Resolved: CB-001/002/004 identify provisional bounded profiles; larger/multiasset/FX/crypto scope remains unresolved and tracked, not approved excluded scope. |
| CAR-05 | Resolved: receipt/marker lookup precedes new-command quota; PS-002-08 documents test-only 1000/hour/day limits and PS-002-09 separates replay/stress/default-quota fixtures. |
| CAR-06 | Resolved: CR-002 and PS-002-06/07/10 scrub private body/history copies on deletion; retain no request fingerprint; every deleted-scope/ID replay returns OBJECT_DELETED. SEC-05 agrees. |
| CAR-07 | Resolved: module SPEC requires local principal/key protection and typed in-process schemas; obsolete SQL FK/OpenAPI gates removed. |
| CAR-08 | Resolved as a gated design obligation: same-digest negative consent dominates acceptance regardless of order/time; contradictory histories quarantine. Fresh-proposal binding/causal fixtures still require reviewed protocol design. |

**Final architecture-only recommendation: APPROVE THE CLIENT-OWNED DIRECTION, subject to the explicit protocol/design gates below.** No unresolved high/critical finding remains in this limited documentation review. All eight findings are resolved at specification-text level; this does not establish implemented behavior or approved process contracts. QG-003 distinguishes specification approval from later executable product tests, avoiding a circular implementation gate.

Required before affected specifications/capabilities are accepted: reviewed canonical encoding and signature/identity/trust/rotation/consent-causality profiles with interoperability vectors; vault unlock/protected persistence/key wrapping/recovery/restore design; messaging device/member/key/metadata/replay protocol; selected payment/FX/chain/time-source and media/notification/transport policies; explicit owner decisions on auction/paid-audience promises and relevant jurisdiction/source gaps. Known offline revocations, dishonest double promises, compromised code/devices, data loss, physical handoff, copied data and absent external services retain the stated limits.

**Whole-suite NO-GO remains unchanged.** No review of the 1,470 DRAFT placeholders, no whole-suite semantic approval, no product tests/build, and no cryptographic/security certification were performed. No permission or tool action was denied; remaining blockers are unfinished specifications and review/owner/source decisions, not an execution-access failure.

## Artwork descriptor follow-up

Rechecked the owner-requested software-artwork descriptor added immediately after the titles in `README.md` and `PROJECT_SPEC.md`. Removing that exact paragraph reproduces each previously reviewed file's SHA256; all other 26 reviewed files remain byte-identical. This is a branding-only change, with no functional, licensing, security or acceptance change. Architecture-direction approval and whole-suite NO-GO remain unchanged. The manifest below is refreshed for these two files.

## M1 historical reviewed checkpoint

The following SHA256 manifest binds the 28 substantive reviewed files to their bytes on the working branch after corrections. It excludes this review, mutable HANDOFF/audit reports, completeness status report and unrelated files. Later substantive edits require re-review. Aggregate SHA256 is computed from UTF-8 lines `sha256 + two spaces + relative path + newline`, sorted by path.


Aggregate manifest SHA256: `082f0b162a83b68df34d9569c1a5df3d2d252d53a3fda41592f78f5b873dd61e`.

```text
48889e892895de5428211ff23202f6c24f1b6d9b9e4ae84ede4b78b3e6575913  01_LocalBazaar/01_listings/mod_create/SPEC.md
bbfdca974d0b49f0eb2618eecee6bda6f343980c7a19620e313783c29e770e8b  01_LocalBazaar/01_listings/mod_create/TODO.md
9d51e4c0de4395af308521269afcb2840ab445a9f37f96a7e5f6049c2444ed0b  01_LocalBazaar/01_listings/mod_create/authorization_capabilities.md
22a3fce054ce9dce5e0d22a05d99900a1f1d27ca1372e5c882e740bc1a1f51e7  01_LocalBazaar/01_listings/mod_create/commands_queries_events.md
b35fa19aa49c9a8a1eabcc57f583b0dc4e9e2572dcae39acda0a3d3737948248  01_LocalBazaar/01_listings/mod_create/contract_and_acceptance_tests.md
b0d6f7b928ab8d2f21df4898c0b4ac61d79b58975555ffb1c872044c6189d962  01_LocalBazaar/01_listings/mod_create/domain_schema.md
7b176bde9441a5a11c19edb4431dfde7bce1b108f5f836001f7a5614185a9daf  01_LocalBazaar/01_listings/mod_create/failure_recovery_idempotency.md
1ad404de5a126dddcbd647a1c1c8cb7aea12a3e6ae04ae558fcb54597b0a09cb  01_LocalBazaar/01_listings/mod_create/import_export_backup_rollback.md
1da8806da5522a5d003b7e855766e2c322dc8e08e3fe87e21a271bc9c81a7bc1  01_LocalBazaar/01_listings/mod_create/observability_performance.md
cfa672eec89d96eb16b62ae11f57ec0b2a8a37cc52e2ac87ffd41b5afc15b52f  01_LocalBazaar/01_listings/mod_create/privacy_retention_abuse.md
58816cd43b3b9b97ff2cb84f2d0d62a490ca09ac9e4e6ac3daefb1499ca9fe03  01_LocalBazaar/01_listings/mod_create/validation_rules.md
1bcc9c4ea8b6eba389e203b52c1189c5b2bba4ef77f402cdd0a4331c7b28a012  01_LocalBazaar/01_listings/mod_create/workflow_state_machine.md
f0849b186fb63a2fa783bf5811bebe367f5fd501b32200d2aa2f27105ebfeb71  DECISIONS.md
74e7206090c0d1fefd9c09ea30d5b6e8f09b441e32acc07c2dbc55f0daf0956f  PROJECT_SPEC.md
7d146b45b9111b04d1a13a429b0ffe2d64ab6af59ea733d5107faabbb0e7c790  PROJECT_TODO.md
c28eaaa69ae737723efb36c96e5890a32cf1eafa00d2f2df126f4d088849c575  README.md
b6aec4335cc58317784508cd405e742934f7980e4a2b6c71527afc4d06b472f3  ROADMAP.md
12e074633ace3ea952d4f009f12cc4b283543797bc0918d3f06384e37666cb76  planning/ADR_PROVISIONAL_DECISIONS.md
236a34f5778332c33b3e8d046d7f5cc03e057a57f86350ddcc9ed78f06de178f  planning/CLIENT_SIDE_ARCHITECTURE.md
a7be5667e7ec2bb25bec30d43d880081b6fa2f030aa212ec6b771de9523df9d4  planning/CONTRACTS.md
ba88204ace85dbf3442282d9bb54fe509c4da7308bddda58d3afe09683286e8f  planning/END_TO_END_FLOWS.md
b441c5c389f04ab2e31d27934648deedb19fa4b53cb64959e5b77f864545fc75  planning/INTEGRATION_DEPENDENCIES.md
5270dcf8f8900b106281163534f0ee91fe3db9fd829185ef09d74d6066e6499e  planning/RELEASE_AND_TEST_GATES.md
41c8b9e70c93a156775079e41cc3cfa3d1c82664a532dcb46e999c6cc49909e0  planning/SECURITY_PRIVACY_THREAT_MODEL.md
602e78b9ee63e6665816b371a9e675c356ce4580914839d48ec8519241ccbe3b  planning/contracts/CLASSIFIED_LISTING_CONTRACT.md
f17e750e65cd3cbffe1b56179ebdc67409429223243190d53bc3b5f6dde41054  planning/contracts/CORE_API_EVENTS_DATA.md
6de0f9e229f75bb503089bb525a39717c2743a7e501f848574aaefe4e0156523  planning/contracts/CYCLE_BARTER_EXECUTION.md
040899b16973bb76dae7e0f573cc223de8715674329b3f3d81d24c948124add4  planning/contracts/MESSAGING_PAYMENTS_FEDERATION.md
```

## M2 limited source and guarantee-gate review — 2026-10-24

Reviewed seven changed M1 files (`DECISIONS.md`, `PROJECT_SPEC.md`, `PROJECT_TODO.md`, architecture, flows, integration dependencies and CL-004), plus new `planning/REQUIREMENT_PROVENANCE.md` and `planning/contracts/SHARED_GUARANTEE_GATES.md`. Compared changes against the published M1 working base at `b92a8814b80099b4a8845a13ce22d6b711f597a8` and the retained M1 file manifest. The other 21 M1-manifest files are byte-identical. The changed source paragraph in THIRD_PARTY_RESEARCH was read as context; no external candidate protocol or source claim was independently verified. Notification/offline worker leaves, registry status changes, and the remaining process specifications are excluded.

**M2 architecture-only disposition: approve this source/gate reconciliation, subject to the existing protocol/design gates. No new blocking architecture finding.** This is documentation review, not approval to implement, enable shared guarantees or release the artwork.

- Provenance is explicitly a parent-supplied partial user-message summary with links, not a transcript or independently recovered conversation. Omitted assistant descriptions remain a coverage gap. I did not access the private conversation or certify the summaries against original messages. The summary cannot independently authorize missing product or security requirements.
- GG-001 specifies three disabled local facade operations, a stable FEATURE_DISABLED result, and no signing, network, payment, reservation, promotion, winner/finality event or state transition. GG-002/004 reject caller assertions, local flags and stale/malformed/revoked/unvalidated evidence as enablement authority. No mandatory product backend/account/secret custody is introduced.
- Strong auction/global-winner/trusted-close and paid-audience scope remains tracked. Local timestamps, sorting, claims, display preferences and receipts cannot quietly replace the requested guarantee. Candidate external consensus/witness/publisher protocols are expressly unselected and unvalidated; listing them is not selection, audited safety or evidence of feasibility.
- Future eligible state requires a separate full reviewed protocol and explicit owner acceptance with exact audience/market, trust/time/consensus, source authentication, failure/reorg, privacy, evidence and policy boundaries. No candidate can establish universal truth, human attention or physical exchange. If no profile validates the requested guarantee, activation remains disabled pending explicit resolution.
- T-GG-01..05 define fail-closed oracles; none was executed. Protocol validation and whole-spec GO remain prerequisites for implementation/enablement at the stated stages. The gate does not prevent independent documentation work.

**Whole-suite NO-GO remains.** Existing CAR-01..08 dispositions are historical and unchanged; this follow-up does not review or approve any notice/offline leaf or the previously unreviewed placeholders. Remaining blockers are complete feature/process contracts, selected and independently validated external/cryptographic/storage protocols, actual policy/jurisdiction choices, and missing source descriptions for exhaustive idea coverage. No tool action was denied and no new access blocker was encountered.

## M2 status synchronization follow-up

Rechecked changes only to README planning counts and PROJECT_TODO milestone checkboxes/counts: 30 proposals awaiting dependency/independent approval, 1,450 DRAFT, CAR-01..08 resolved at architecture-document level and twenty additional offline/notice contracts drafted without process approval. All other 28 files in the M2 manifest remain byte-identical. Counts reflect the integration owner's reported structural audit; this reviewer did not semantically review the new leaf contracts or independently rerun that audit. No functional, security, protocol or acceptance rule changed. Architecture-only disposition and whole-suite NO-GO remain unchanged. The current M2 manifest below is refreshed; M1 historical evidence remains intact.

## M2 current reviewed checkpoint

This 30-file manifest extends the M1 set with the two reviewed source/gate files. M1 hashes above remain historical. Mutable handoff/audit/completeness reports, third-party research source verification and unrelated worker leaves are excluded. Hash method is unchanged: SHA256 of UTF-8 lines `file SHA256 + two spaces + relative path + newline`, sorted by path. Later substantive changes require scoped re-review.

M2 aggregate manifest SHA256: `9da416578557e2b034d577b1dcff21701c652e644ceba9fe75950b2c22c68af9`.

```text
48889e892895de5428211ff23202f6c24f1b6d9b9e4ae84ede4b78b3e6575913  01_LocalBazaar/01_listings/mod_create/SPEC.md
bbfdca974d0b49f0eb2618eecee6bda6f343980c7a19620e313783c29e770e8b  01_LocalBazaar/01_listings/mod_create/TODO.md
9d51e4c0de4395af308521269afcb2840ab445a9f37f96a7e5f6049c2444ed0b  01_LocalBazaar/01_listings/mod_create/authorization_capabilities.md
22a3fce054ce9dce5e0d22a05d99900a1f1d27ca1372e5c882e740bc1a1f51e7  01_LocalBazaar/01_listings/mod_create/commands_queries_events.md
b35fa19aa49c9a8a1eabcc57f583b0dc4e9e2572dcae39acda0a3d3737948248  01_LocalBazaar/01_listings/mod_create/contract_and_acceptance_tests.md
b0d6f7b928ab8d2f21df4898c0b4ac61d79b58975555ffb1c872044c6189d962  01_LocalBazaar/01_listings/mod_create/domain_schema.md
7b176bde9441a5a11c19edb4431dfde7bce1b108f5f836001f7a5614185a9daf  01_LocalBazaar/01_listings/mod_create/failure_recovery_idempotency.md
1ad404de5a126dddcbd647a1c1c8cb7aea12a3e6ae04ae558fcb54597b0a09cb  01_LocalBazaar/01_listings/mod_create/import_export_backup_rollback.md
1da8806da5522a5d003b7e855766e2c322dc8e08e3fe87e21a271bc9c81a7bc1  01_LocalBazaar/01_listings/mod_create/observability_performance.md
cfa672eec89d96eb16b62ae11f57ec0b2a8a37cc52e2ac87ffd41b5afc15b52f  01_LocalBazaar/01_listings/mod_create/privacy_retention_abuse.md
58816cd43b3b9b97ff2cb84f2d0d62a490ca09ac9e4e6ac3daefb1499ca9fe03  01_LocalBazaar/01_listings/mod_create/validation_rules.md
1bcc9c4ea8b6eba389e203b52c1189c5b2bba4ef77f402cdd0a4331c7b28a012  01_LocalBazaar/01_listings/mod_create/workflow_state_machine.md
f99d442937f98680f55876a2926851d075428dea6220e8131fb0bb96c40411c0  DECISIONS.md
99942fa9f43ba75b102a1e2898252871080bc69e5d2d01d5cc67dbc1b4f241d6  PROJECT_SPEC.md
5aaea9cecef193f85f8069e8577a3297d4b5f518413f442afd78e2aaa97a39ff  PROJECT_TODO.md
5de15e5cee2393ca7da7cfb59d596bd54c84b65c60009e09a533b56fe33e19c7  README.md
b6aec4335cc58317784508cd405e742934f7980e4a2b6c71527afc4d06b472f3  ROADMAP.md
12e074633ace3ea952d4f009f12cc4b283543797bc0918d3f06384e37666cb76  planning/ADR_PROVISIONAL_DECISIONS.md
ddb23c0292b345ca9cc7c4d892cf67488fe45c3e50c125f0ffb99fa788a7092f  planning/CLIENT_SIDE_ARCHITECTURE.md
a7be5667e7ec2bb25bec30d43d880081b6fa2f030aa212ec6b771de9523df9d4  planning/CONTRACTS.md
7aa55a56c21c5f9dfc194307a8802ca958a37c860979862bed3be273932e3211  planning/END_TO_END_FLOWS.md
d0e4f740b5cb46347a7f588fe9a5d888855d815215deef687960bf511ba6334a  planning/INTEGRATION_DEPENDENCIES.md
5270dcf8f8900b106281163534f0ee91fe3db9fd829185ef09d74d6066e6499e  planning/RELEASE_AND_TEST_GATES.md
f65c7397430fe0555ea7c3bc8e60a8bd3f45c595d2d60f055e4d1aa0ee4f80c0  planning/REQUIREMENT_PROVENANCE.md
41c8b9e70c93a156775079e41cc3cfa3d1c82664a532dcb46e999c6cc49909e0  planning/SECURITY_PRIVACY_THREAT_MODEL.md
54a78525b8ddb440f3d77032335d1a16a9fbfe58f70f7d9936d41850ddf64624  planning/contracts/CLASSIFIED_LISTING_CONTRACT.md
f17e750e65cd3cbffe1b56179ebdc67409429223243190d53bc3b5f6dde41054  planning/contracts/CORE_API_EVENTS_DATA.md
6de0f9e229f75bb503089bb525a39717c2743a7e501f848574aaefe4e0156523  planning/contracts/CYCLE_BARTER_EXECUTION.md
040899b16973bb76dae7e0f573cc223de8715674329b3f3d81d24c948124add4  planning/contracts/MESSAGING_PAYMENTS_FEDERATION.md
97b71487acf6c9339dfa8eb3f4d60466ab7ad48686ee41cc6d8855b217b40c21  planning/contracts/SHARED_GUARANTEE_GATES.md
```
