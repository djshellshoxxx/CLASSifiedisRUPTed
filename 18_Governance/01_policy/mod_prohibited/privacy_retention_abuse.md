# PS-146-07 — Privacy, retention and abuse: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-07.R01** Evaluated listing text is processed only in memory in the user's vault; the module stores no copy and logs no matched text.
- **PS-146-07.R02** Rule packs are public signed configuration; sensitive keyword lists are published only as salted hashes, which hides them from casual reading but does not resist dictionary search, and anyone can test text against the pack; the UI says so.
- **PS-146-07.R03** Rule versions are retained RET-STANDARD with the last 3 packs kept locally; decisions that created them are RET-EVIDENCE in F18.S02.M01.
- **PS-146-07.R04** A signed change from a trusted but compromised or malicious publisher never removes a user's publications by itself: block verdicts caused by a pack change hold the publication for its owner with a grace of at least 7 days before a reminder, and a tombstone is signed only after the owner confirms.

## Specification

**Data classification**
- ProhibitedRule: P0 signed configuration; plaintext of sensitive keywords only in the publisher vault (P3 there).
- Evaluation input and result: P3, memory only; the result summary (verdict, rule references, packsDigest) is stored in the PublicationRecord by F01.S01.M03.

**Retention**
- ProhibitedRule mirror and last 3 packs: RET-STANDARD; older packs purged.
- Emergency history: 30 days after effective expiry.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Evasion with look-alike characters, spacing or misspelling | normalization pipeline, whole-word and phrase modes, publishers can add variants; honest limit stated in the UI |
| T02 | Overblocking and censorship through broad rules | proposal and comment period for activation, decisions verified by receivers, public rule list, strictest-wins reporting with reason keys, user can choose another publisher |
| T03 | Rule pack tampering or downgrade | signature over JCS, version monotonic, trusted publishers only |
| T04 | Denial of service with huge input or pathological rules | 8 000 code-point input limit, 1 MiB pack limit, literal phrase matching without regular expressions, n-grams of at most 5 tokens, evaluation budget |
| T05 | Emergency rule abused as permanent control | review-level only, effective expiry at most 7 days after first sight, one emergency activation per rule key per 30 days and 7 cumulative days per 30 days, automatic retirement and public announcement |
| T06 | Sensitive keyword list recovered or used as an evasion oracle | stated honestly: hashes hide terms from casual reading only; local evaluation lets anyone test text; publishers choose sensitive only to avoid spreading harmful terms |
| T07 | Publisher key compromise or malicious pack used as a takedown of users' publications | F07 key status quarantines revoked keys, pause-trust command in F18.S02.M01, block verdicts only hold publications for owner decision, no automatic tombstones (ADR-0016 §3 and §8) |

**Abuse controls**
- Local resource protection (not an abuse control, it runs on the user's own device): evaluate limited to 600 calls per minute per vault; pack applications limited to 20 per day.
- Publisher limit of 2 000 active rules; emergency rules limited to 5 active at once.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T07 | integration | PS-146-03.R04, PS-146-07.R04 | apply a pack that blocks an active publication in the F01.S01.M03 fixture; advance 7 days; owner confirms Unpublish | publication held as policy_attention with owner notice, renewals and unchanged re-publication stopped, an edit that clears the verdict resolves it; no tombstone signed before confirmation; reminder after 7 days; tombstone only after confirmation |
| TEST-PS-146-09.T11 | abuse | PS-146-07.R01, PS-146-07.R02 | scan logs, storage and events after evaluating text; inspect the operator editor and settings strings | no listing text or keywords stored or logged; sensitive keywords only as hashes in the pack; UI states hashes do not resist dictionary search |
| TEST-PS-146-09.T16 | integration | PS-146-07.R03 | apply 5 successive packs | the vault keeps exactly the last 3 packs; older ones purged under RET-STANDARD |
| TEST-PS-146-09.T22 | unit | PS-146-01.R02, PS-146-07.R02 | sensitive whole-word rule with a 3-token phrase; phrase-mode sensitive rule; relay serves the pack | n-gram hashing matches the phrase; phrase-mode sensitive rule rejected; pack contains no plaintext and its signature still verifies as served |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
