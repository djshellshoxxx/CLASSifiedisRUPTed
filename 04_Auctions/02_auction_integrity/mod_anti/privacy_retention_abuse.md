# PS-036-07 — Privacy, retention and abuse: Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M01 Anti-shill controls](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/anti` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-036-07.R01** Linkage evidence and scores are P3 on the host and visible only to host moderators and operators; they are never sent to sellers, bidders or federated peers.
- **PS-036-07.R02** The generic denial prevents using the bid endpoint to probe who is linked to whom.
- **PS-036-07.R03** Scoring uses only the host-local auction events of shill-v1 and linkage uses only the evidence named in 02.R04 - no device fingerprinting, IP addresses, location or telemetry.
- **PS-036-07.R04** ShillChecks are host operator data - the module registers ExportSectionPort for the operator audit scope only (section auctions.shill_checks, excluded from user exports), DeletionPort and RetentionPurgePort with F10 (N6), annotates fields with their F10.S02.M02 class, pseudonymizes subject keys on deletion, and purges denied and confirmed checks after RET-EVIDENCE and dismissed or expired checks after RET-SHORT.

## Specification

**Data classification**
- ShillCheck: P3 host-only.
- Linkage cache: P3 host-only, entries hold key hashes, evidence ids and revocation times.

**Retention**
- Denied and confirmed ShillChecks: RET-EVIDENCE per host policy (default 1 year after closure); dismissed and expired ShillChecks: RET-SHORT (30 days).
- Linkage cache entries are refreshed every 24 h; revoked-key and revoked-attestation links are kept for 30 days, or for the life of auctions scheduled before the revocation.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Probing the bid endpoint to map seller-linked keys | denial is generic and constant-time within 5 ms of an allow path, per-key rate limits apply |
| T02 | Seller shills with a fresh unlinked key | linkage cannot see it; heuristics flag patterns for review; documented limitation shown on the auction page |
| T03 | False accusations through crafted attestations | only same_owner attestations signed by both keys count (F07.S03.M02); a revocation stops linkage only after 30 days and never for auctions scheduled before it; host moderator can inspect the evidence |
| T04 | Host operator misuses the review queue to harass a bidder | actions are logged in the host audit (CTR-CAP-001 CAP-7), decisions are statements with reasons, and bidders can choose another host |
| T05 | Score gaming by an adversary mimicking benign patterns | scores only flag, never deny; human review decides; the scoring table is versioned (shill-v1) |
| T06 | Seller revokes a linked key or attestation and then bids with it | revoked keys are rejected (V07) and kept linked (01.R04); host registration evidence is never dropped |
| T07 | Operator allow-list used to let the seller bid | the allow-list never overrides V01, V02 or V07, covers only two reasons, and every entry is logged in the host audit |

**Abuse controls**
- Per-key denial counter: 10 denials in an hour on a host raises a host operator alert.
- Allow-list entries expire at the auction end.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-036-09.T09 | abuse | PS-036-07.R01, PS-036-07.R02 | compare response time and body for denial and allow paths | identical error body family and timing within 5 ms; no reason leaked |
| TEST-PS-036-09.T16 | unit | PS-036-07.R03, PS-036-02.R04 | allowlist test of the scorer and linkage inputs; two keys bid from one IP address in the same second; two keys in one relay access-token session | scorer reads only the shill-v1 event fields and linkage only the listed evidence; the same-IP bidders are both allowed; the session pair is denied as linked_host_registration |
| TEST-PS-036-09.T19 | integration | PS-036-07.R04 | operator export, export of the subject's user vault, deletion applied on the host, retention sweep | checks only in the operator export; subject pseudonymized; dismissed checks purged after 30 days, confirmed after RET-EVIDENCE |

## Dependencies

Module depends on: F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
