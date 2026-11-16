# PS-005-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (verbs, scopes, default deny, privileged access), CTR-ERR-001 R08, CTR-PRV-001 R02. Identity: F07 (`acc_`, `prf_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-05.R01 | Default deny. Only the rules in the matrix below allow an action. | MVP |
| PS-005-05.R02 | Module verbs (subset of CTR-CAP-001 R03): `create`, `read`, `withdraw`, `accept`, `reject`, `attest`, `export`, `moderate`. | MVP |
| PS-005-05.R03 | Giver sees claimant's `prf_` display view, never `acc_`. Non-giver claimants see no other claimant. | MVP |
| PS-005-05.R04 | Privileged access to claim records (PRIVATE_PERSONAL) requires dual control, purpose and expiry ≤ 72 h (CTR-CAP-001 R06, R07). | MVP |
| PS-005-05.R05 | Operator (`ope`) global read of claim content is denied by default. | MVP |
| PS-005-05.R06 | Non-participants receive `SYS.NOT_FOUND` for claims they cannot read. | MVP |
| PS-005-05.R07 | Authorization uses the authenticated `acc_` only; `claimant_ref` or `giver_ref` in request bodies are ignored. | MVP |

## Data / schema
Capability IDs: `giveaway_claim.create`, `.read`, `.withdraw`, `.accept`, `.reject`, `.attest`, `.export`, `.moderate`. Field visibility (CTR-CAP-001 R10): `state`, `listing_id`, `revision`, timestamps = `participant`; `pickup_region` = `participant`; `claimant_ref` = `never` for giver (shown as `prf_`); `reason_code` = `participant`.

## Commands / queries / events
Mapping to commands in [commands_queries_events](commands_queries_events.md).

## States & transitions
Relation rules (giver, claimant) are derived from state at decision time, not stored as grants (CTR-CAP-001 R05).

## Validation & errors
Forbidden actions return `SYS.FORBIDDEN` only when the object is visible; otherwise `SYS.NOT_FOUND`.

## Authorization
| Actor | Action | Scope | Result |
|---|---|---|---|
| user (not giver), listing visible | giveaway_claim.create | self | ALLOW |
| user (claimant) | giveaway_claim.withdraw | participant | ALLOW |
| user (giver) | giveaway_claim.accept, reject, attest | participant (listing owner) | ALLOW |
| user (giver) | giveaway_claim.read (own listing) | participant | ALLOW, masked per R03 |
| user (claimant) | giveaway_claim.read (own claim) | self | ALLOW |
| user (other) | giveaway_claim.read | — | `SYS.NOT_FOUND` |
| user (claimant) | giveaway_claim.export | self | ALLOW (own claims) |
| mod (`mod_`) | giveaway_claim.moderate | case:`cas_` | ALLOW with purpose, ≤ 72 h, dual control |
| ope (`ope_`) | giveaway_claim.read | global | DENY (CTR-CAP-001 R04) |
| sys (`sys_`) | timer transitions | named job | ALLOW only for named timers |

## Failure, idempotency, concurrency, offline
Grant or revocation is effective at next decision; writes use zero decision-cache TTL (CTR-CAP-001 R09). See [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Every privileged read writes an `aud_` record with resource ID and purpose, no content (CTR-CAP-001 R08). Pseudonyms do not guarantee anonymity; authorization still uses `acc_` only.

## Observability & performance
Authorization decision p95 ≤ 20 ms (ASSUMPTION). Deny counts per action, no IDs as labels.

## Tests
- TEST-PS-005-05-01: each matrix row, positive and negative.
- TEST-PS-005-05-02: non-giver read returns identical `SYS.NOT_FOUND` for missing and forbidden claims.
- TEST-PS-005-05-03: forged `giver_ref` in body does not change decision.

## Acceptance criteria
1. Matrix rows are exhaustive for module verbs; undefined combinations deny.
2. Giver never receives `acc_` of a claimant in any response.
3. Operator global read of claim content is denied without dual-control grant.

**Assumptions and open decisions:** Grant model is PROVISIONAL (CTR-CAP-001 ASSUMPTION, unapproved). D10 (PROVISIONAL default: user-controlled keys with documented recovery, unapproved) governs identity keys. See [DECISIONS.md](../../../DECISIONS.md).
