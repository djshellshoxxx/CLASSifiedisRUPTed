# PS-146-09 — Contract and acceptance tests: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-09.R01** Every requirement is covered by at least one automated test.
- **PS-146-09.R02** Contract tests validate pack statements, commands, evaluate results and events against the registry and verify signatures.
- **PS-146-09.R03** Evaluation determinism is covered by property tests with at least 200 runs, 10 000 nightly.

## Specification

See the module test table below (all processes).

**Fixtures:** Rule pack version 41 with rules counterfeit_goods (block), age_restricted_goods (review, notice), used_electronics_notice (allow_with_notice), one sensitive rule and one emergency review rule; 200-sensitive-rule load pack; decisions D1 (a year old, for rules first activated in pack 12) and D2 (for pack 41); trusted publisher PK1, untrusted PK2, publisher PB; taxonomy T1 held and T2 not held; F01.S01.M03 publication fixture; relay stub with receipts; clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T01 | unit | PS-146-01.R01, PS-146-01.R02, PS-146-02.R01 | draft valid rule and one with 51 keywords | stored immutable version; invalid rejected with documented code |
| TEST-PS-146-09.T02 | unit | PS-146-02.R03 | violate each rule V01-V14 | documented error code returned; nothing released or applied |
| TEST-PS-146-09.T03 | property | PS-146-01.R02 | random texts with look-alikes and zero-width characters | verdict deterministic and stable under normalization; whole-word mode avoids substring matches |
| TEST-PS-146-09.T04 | property | PS-146-03.R01, PS-146-03.R02 | random lifecycle commands | only declared transitions; one active version per key; new version retires old one atomically; retirement only through a released pack |
| TEST-PS-146-09.T05 | integration | PS-146-03.R03 | emergency rule passes its effective expiry | retired automatically, emergency_expired event emitted, evaluation ignores it |
| TEST-PS-146-09.T06 | contract | PS-146-04.R01, PS-146-04.R02, PS-146-04.R03, PS-146-09.R02 | release, apply, evaluate | pack validates against classrup.governance.rule_pack/v1, signature verifies, result has no matched text and lists packs with publisherId and packsDigest, event valid |
| TEST-PS-146-09.T07 | integration | PS-146-03.R04, PS-146-07.R04 | apply a pack that blocks an active publication in the F01.S01.M03 fixture; advance 7 days; owner confirms Unpublish | publication held as policy_attention with owner notice, renewals and unchanged re-publication stopped, an edit that clears the verdict resolves it; no tombstone signed before confirmation; reminder after 7 days; tombstone only after confirmation |
| TEST-PS-146-09.T08 | abuse | PS-146-05.R01, PS-146-05.R02, PS-146-05.R03 | untrusted publisher pack; non-publisher release; relay removal | pending or FORBIDDEN; relay removal affects only that relay |
| TEST-PS-146-09.T09 | integration | PS-146-06.R01, PS-146-06.R02 | replay release; apply two packs concurrently with evaluate | one packCid; evaluate sees old or new pack only |
| TEST-PS-146-09.T10 | chaos | PS-146-06.R02 | relay down during release; one consumer fails | local state intact; delivery prepared; consumer retries without rolling back the pack |
| TEST-PS-146-09.T11 | abuse | PS-146-07.R01, PS-146-07.R02 | scan logs, storage and events after evaluating text; inspect the operator editor and settings strings | no listing text or keywords stored or logged; sensitive keywords only as hashes in the pack; UI states hashes do not resist dictionary search |
| TEST-PS-146-09.T12 | abuse | PS-146-02.R02 | 100 000-code-point input; 2 001 rules; 601 evaluations in a minute | rejected before matching; pack rejected; RATE_LIMITED as local resource protection |
| TEST-PS-146-09.T13 | load | PS-146-08.R01, PS-146-08.R02, PS-146-08.R03 | 2 000 rules (and the 200-sensitive-rule pack), 8 000 code points on Moto G profile; relay at 50 req/s | evaluate p95 <= 20 ms (<= 30 ms with sensitive rules), apply p95 <= 800 ms, relay p95 <= 100 ms, no telemetry |
| TEST-PS-146-09.T14 | unit | PS-146-09.R01, PS-146-09.R03 | traceability tool run, nightly property seeds | every PS-146 requirement maps to a passing test |
| TEST-PS-146-09.T15 | integration | PS-146-10.R01, PS-146-10.R02, PS-146-10.R03 | export, import to fresh vault, import pack with bad signature | rules round-trip with provenance; bad pack rejected |
| TEST-PS-146-09.T16 | integration | PS-146-07.R03 | apply 5 successive packs | the vault keeps exactly the last 3 packs; older ones purged under RET-STANDARD |
| TEST-PS-146-09.T17 | integration | PS-146-06.R03 | network disabled after pack 41 is applied; evaluate | evaluate succeeds with pack 41 and no network call is attempted |
| TEST-PS-146-09.T18 | abuse | PS-146-01.R03 | network spy during evaluate, apply_pack and policy result display | no request carries evaluation input or results; rules readable through relay_latest anonymously |
| TEST-PS-146-09.T19 | integration | PS-146-02.R04, PS-146-01.R05 | vault offline 45 days applies pack 41; fresh vault applies pack 41 whose rules from pack 12 cite the year-old D1; PB's pack cites D2 of PK1; a rule version whose keywords differ from D2's approved content | both vaults apply pack 41 (asOf from anchors or claimed createdAt, never the vault clock); PB's rule rejected with publisher_mismatch; changed rule rejected with content_mismatch and held at its previous version |
| TEST-PS-146-09.T20 | abuse | PS-146-02.R05, PS-146-03.R03 | emergency rule re-issued under the same key each week; emergency rule with activation dated 30 days in the future | second activation within 30 days rejected with GOVERNANCE_RULE_EMERGENCY_INVALID; future-dated rule expires 7 days after first sight |
| TEST-PS-146-09.T21 | integration | PS-146-01.R04 | pack scoped to T2 applied in a vault that holds only T1; listing with a T2 category id; listing whose text matches a T2-scoped block keyword; T2 arrives later | rules stored scope_unresolved and listed in settings; exact id match applies; keyword match capped at review with viaFallback true; after T2 arrives scopes resolve |
| TEST-PS-146-09.T22 | unit | PS-146-01.R02, PS-146-07.R02 | sensitive whole-word rule with a 3-token phrase; phrase-mode sensitive rule; relay serves the pack | n-gram hashing matches the phrase; phrase-mode sensitive rule rejected; pack contains no plaintext and its signature still verifies as served |
| TEST-PS-146-09.T23 | integration | PS-146-04.R04 | relay_upload by the operator key and by another key; index submission evaluated on the relay | operator pack applied as hosting policy with relay-local changed events consumed by an F12.S02.M01 case fixture; other key FORBIDDEN; intake evaluates against the operator pack; relay_latest byte-identical |
| TEST-PS-146-09.T24 | contract | PS-146-04.R05, PS-146-04.R06 | changed event payload; F11.S01.M01 registry row for rule_pack/v1 | payload has ruleId, publisherId, ruleKey and version; registry row has audience, signer role, resolution and maxAge |

## Acceptance criteria

- All tests T01-T24 pass in CI.
- Blocking and review rules are never activated in any vault without a verified approved decision for that publisher and content, except emergency review rules within their 7-day window and the 30-day emergency limit.
- Evaluation is deterministic, bounded to 20 ms p95 (30 ms with sensitive rules), offline capable, never stores or logs listing text, and a pack change never unpublishes a listing without its owner's confirmation.

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
