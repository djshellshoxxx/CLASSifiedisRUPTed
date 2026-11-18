# PS-013-05 — authorization and capabilities
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-05.R01 | Default deny (CTR-CAP-001 R01). Capabilities listed below are the only grants this module declares. | MVP |
| PS-013-05.R02 | Only the slot's `acc_` may create, submit or withdraw revisions for that slot. Authorization uses `acc_`, never `prf_`. | MVP |
| PS-013-05.R03 | `note` is visible to the owner only. Give and want lines are visible to cycle participants (`participant` scope) only. | MVP |
| PS-013-05.R04 | No operator grant reads `note` content without a `case:` scope and dual control (CTR-CAP-001 R07). | MVP |

## Data / schema
Capability IDs: `offer.create`, `offer.submit`, `offer.withdraw`, `offer.read`, `offer.lock` (system), `offer.moderate` (case scope). Field visibility per CTR-CAP-001 R10:

| Field | Visibility |
|---|---|
| ofr_id, revision_no, status, par_id, cyc_id | participant |
| give_lines, want_lines | participant |
| valuation.qte_id | participant |
| note | owner |
| content_digest, schema_version | participant |

## Commands / queries / events
| Action | Actor | Resource scope | Rule |
|---|---|---|---|
| offer.create / offer.submit | acc_ owning slot | self | slot status = accepted |
| offer.withdraw | acc_ owning slot | self | status = submitted |
| offer.read | cycle participant | participant | cycle not closed for non-owners |
| offer.lock | sys_ (F02.S01.M01) | global | system principal only |
| offer.moderate | mod_ | case:cas_ | case open; purpose recorded |

## States & transitions
Authorization is re-evaluated at each transition (CTR-CAP-001 R05). Loss of participation (slot removed) ends `offer.read` for that party at the next decision.

## Validation & errors
Unauthorized or nonexistent objects both return `SYS.NOT_FOUND` (CTR-ERR-001 R08). No `OFFER.*` code reveals existence to non-participants.

## Authorization
Decision records in CTR-CAP-001 `dec_` store outcome and reason code only. Decision cache TTL 0 for writes and for `note` reads (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Grant or revoke is effective at next decision. Offline clients hold no grants; queued writes re-authorize on replay (PS-013-06).

## Privacy, retention, abuse
Privileged reads of `note` write an `aud_` record with resource ID and purpose, no content (CTR-CAP-001 R08).

## Observability & budgets
Count of denials per action; alert when denials for one `acc_` exceed 50 per hour (ASSUMPTION; probing signal).

## Tests
- TEST-PS-013-05-01 (unit): matrix of actor × action × scope; default deny for all unlisted pairs.
- TEST-PS-013-05-02 (integration): removed slot loses `offer.read` on next request.
- TEST-PS-013-05-03 (security): non-participant gets identical response for existing and nonexistent `ofr_id`.

## Acceptance criteria
1. Matrix test covers 100% of declared actions; zero allowed pairs outside the matrix.
2. `note` is absent from every non-owner response in fixture corpus.

## Assumptions & open decisions
- ASSUMPTION: owner may read own revisions after cycle closure.
- D10 PROVISIONAL (Dxx default, unapproved): `acc_` key rotation does not change slot authorization; recovery follows F07 proofs.
