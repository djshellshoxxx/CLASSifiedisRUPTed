# PS-036-07 — Privacy, retention and abuse: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-07.R01** Linkage evidence and scores are P3 on the host and visible only to host moderators and operators; they are never sent to sellers, bidders or federated peers.
- **PS-036-07.R02** The generic denial prevents using the bid endpoint to probe who is linked to whom.
- **PS-036-07.R03** Scoring uses only host-held ledger and registration data and no device fingerprinting, location or telemetry.

## Specification

**Data classification**
- ShillCheck: P3 host-only.
- Linkage cache: P3 host-only, entries hold key hashes and evidence ids.

**Retention**
- ShillChecks: RET-EVIDENCE per host policy, default 1 year after closure; linkage cache entries 24 h.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Probing the bid endpoint to map seller-linked keys | denial is generic and constant-time within 5 ms of an allow path, per-key rate limits apply |
| T02 | Seller shills with a fresh unlinked key | linkage cannot see it; heuristics flag patterns for review; documented limitation shown on the auction page |
| T03 | False accusations through crafted attestations | only attestations signed by both keys count (F07.S03.M02), revocation takes effect at next check, host moderator can inspect the evidence |
| T04 | Host operator misuses the review queue to harass a bidder | actions are logged in the host audit (CTR-CAP-001 CAP-7), decisions are statements with reasons, and bidders can choose another host |
| T05 | Score gaming by an adversary mimicking benign patterns | scores only flag, never deny; human review decides; thresholds in this specification are versioned |

**Abuse controls**
- Per-key denial counter: 10 denials in an hour on a host raises a host operator alert.
- Allow-list entries expire at the auction end.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T09 | abuse | PS-036-07.R01, PS-036-07.R02 | compare response time and body for denial and allow paths | identical error body family and timing within 5 ms; no reason leaked |
| TEST-PS-036-09.T10 | integration | PS-036-01.R02, PS-036-07.R03, PS-036-09.R03 | run synthetic dataset | precision at least 0.7 and recall at least 0.5 at threshold 60, report stored; no deny from heuristics |
| TEST-PS-036-09.T14 | integration | PS-036-07.R03, PS-036-03.R01 | identity attestation revoked after denial | next check allows; past denial kept as history |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
