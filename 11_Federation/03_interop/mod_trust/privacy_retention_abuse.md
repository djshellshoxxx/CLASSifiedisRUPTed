# PS-091-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_trust. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R07, R09, R12), CTR-FED-001 (R08, R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-091-07.R01 | Trust rows carry no PRIVATE_PERSONAL, FINANCIAL_EVIDENCE, LOCATION_PRECISE or SECRET data. | MVP |
| PS-091-07.R02 | `reason_code` and `evidence_ref` are visible only to operators with case scope (CTR-PRV-001 disclosure matrix). | MVP |
| PS-091-07.R03 | Peer-facing `peer.*` events contain `peer_id`, states and `revision` only; `reason_code` is withheld from the peer. | MVP |
| PS-091-07.R04 | Admissions per operator account ≤ 2 per 24 h (ASSUMPTION) to limit Sybil peer creation. | MVP |
| PS-091-07.R05 | Automated restriction cannot quarantine or revoke (anti-weaponization). | MVP |

## Data / schema
Retention classes (CTR-PRV-001 R06):

| Record | Default retention (D07, PROVISIONAL) | Deletion behavior |
|---|---|---|
| `fed_peer_trust` | until `revoked` + 24 months | row removed; `peer_id` tombstone kept |
| `trs_assessment` | 24 months after revocation; 5 years when `reason_code` = EQUIVOCATION (RET-EVD) | redaction keeps envelope, replaces reason and evidence with digest |
| Idempotency rows | 7 days | hard delete |

Legal holds (CTR-PRV-001 R07) extend only the matching `peer_id` records.

## Commands / queries / events
Export to federation peers uses per-audience pseudonyms and omits `idempotency_key` (CTR-FED-001 R08). `trs_` rows are never exported in bulk to peers.

## States & transitions
Deletion or retention expiry does not change trust state; it removes historical rows only. A revoked peer stays revoked.

## Validation & errors
Requests with PRIVATE_PERSONAL data in a reason field are impossible by schema (PS-091-02 R06).

## Authorization
Export of `trs_` requires `ope_` with case scope and dual control.

## Failure, idempotency, concurrency, offline
Retention jobs are idempotent and resumable by `peer_id` cursor.

## Privacy, retention, abuse
- Metadata: peers learn their own state changes, not which local users were affected.
- Abuse 1: Sybil peers forcing restrictions of a legitimate peer — threshold counts only signed failures from distinct `key_id`s.
- Abuse 2: state flapping — restore cooldown 1 h (PS-091-03).
- Abuse 3: operator misuse — dual control for admit, restore and revoke (PS-091-05 R03).
- Geolocation is not used by this module.

## Observability & budgets
Logs carry `peer_id` and `reason_code` only. Fingerprints are logged as `key_id` only.

## Tests
- `TEST-PS-091-07-01` privacy: schema scan finds no column above PSEUDONYMOUS except declared fields.
- `TEST-PS-091-07-02` negative: quarantine event payload to a peer omits `reason_code`.
- `TEST-PS-091-07-03` abuse: automated actor attempts quarantine → denied.
- `TEST-PS-091-07-04` retention: EQUIVOCATION rows survive 24 months; non-equivocation rows purge on schedule.

## Acceptance criteria
1. No trust record field exceeds PSEUDONYMOUS.
2. Peer exports contain zero `reason_code` values.
3. Admission rate cap enforced in test.

## Assumptions & open decisions
- ASSUMPTION: 5-year EQUIVOCATION retention is a placeholder pending Privacy Lead review (F10).
- D07 (retention), PROVISIONAL default: minimal per-category defaults with legal-hold exceptions (unapproved).
- D01 (federated protocol), PROVISIONAL default: per-audience pseudonyms and explicit opt-in (unapproved).
