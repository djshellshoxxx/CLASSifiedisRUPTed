# PS-010-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model, decision records, grants), CTR-PRV-001 (classes), CTR-ERR-001 (`SYS.NOT_FOUND` for hidden objects), CTR-ID-001.

**Decision labels:** Grant and decision model is PROVISIONAL (ASSUMPTION, unapproved, per CTR-CAP-001). Default deny is required, not provisional.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-05.R01 | Capabilities: `negotiation.create`, `.propose`, `.accept`, `.reject`, `.withdraw`, `.read`, `.execute` (system only), `.administer` (operator flag only). All are in the CTR-CAP-001 verb vocabulary. | MVP |
| PS-010-05.R02 | Authorization is evaluated on `acc_`. A `prf_` pseudonym request resolves to its `acc_` before any check. | MVP |
| PS-010-05.R03 | Participant scope: the initiator and the listing's seller `acc_` at decision time. No other principal gets participant rights. | MVP |
| PS-010-05.R04 | A non-participant reading a negotiation receives `SYS.NOT_FOUND`, identical to a nonexistent ID (CTR-ERR-001 R08). | MVP |
| PS-010-05.R05 | `negotiation.execute` is granted only to the expiry and void scheduler (`sys_`). No user, `ope` or `mod` principal may execute transitions. | MVP |
| PS-010-05.R06 | Moderator access to a negotiation requires `negotiation.read` under a `case` grant bound to a `cas_` that cites the negotiation, purpose set, expiry ≤ 72 h (CTR-CAP-001 R06). Terms are PSEUDONYMOUS, so single approval suffices (ASSUMPTION). | MVP |
| PS-010-05.R07 | Operators hold `negotiation.administer` for the feature flag only. They get no `read` on negotiation content by default. | MVP |
| PS-010-05.R08 | Federation peers (`fpr_`) have no `negotiation.*` capability. Inbound negotiation events are rejected (CTR-FED-001 R02). | MVP |

## Data / schema
Action matrix (normative for this module; extends CTR-CAP-001 examples):

| Principal | Action | Resource / state | Outcome | Reason code |
|---|---|---|---|---|
| user, not listing owner, listing visible | `negotiation.create` | `lst_` active | ALLOW | ALLOW_PARTICIPANT |
| user, listing owner | `negotiation.create` | own `lst_` | DENY `NEG.SELF_FORBIDDEN` | SCOPE_MISMATCH |
| user, initiator | `negotiation.propose` | own `neg_`, initiator was last proposer | DENY `NEG.NOT_YOUR_TURN` | STATE_FORBIDS |
| user, seller | `negotiation.accept` | `neg_` awaiting seller | ALLOW | ALLOW_PARTICIPANT |
| user, other buyer on same listing | `negotiation.read` | another buyer's `neg_` | DENY `SYS.NOT_FOUND` | NO_RELATION |
| user | `negotiation.execute` | any | DENY `SYS.FORBIDDEN` | NO_GRANT |
| sys (scheduler) | `negotiation.execute` | `neg_` past deadline | ALLOW | ALLOW_GRANT |
| mod, case grant | `negotiation.read` | `neg_` cited by `cas_` | ALLOW | ALLOW_GRANT |
| mod, no grant | `negotiation.read` | any | DENY `SYS.NOT_FOUND` | NO_GRANT |
| ope | `negotiation.read` | any | DENY `SYS.NOT_FOUND` | NO_GRANT |
| ope (2 approvers) | `negotiation.administer` | flag | ALLOW (dual control) | ALLOW_GRANT |
| fpr | any `negotiation.*` | any | DENY `FED.PEER_NOT_TRUSTED` or `SYS.NOT_FOUND` | NO_GRANT |

Field visibility (CTR-CAP-001 R10):

| Field | Visible to |
|---|---|
| `terms`, `round`, `state`, `response_deadline`, `terminal_reason` | participant |
| `initiator_id` | seller: initiator's active `prf_` view only, never `acc_`; initiator: own `acc_` |
| `seller_id` | initiator only |
| other buyers' IDs or count | never |
| `listing_version` | participant |

## States & transitions
Authorization does not transition state. Relation rules are re-evaluated on each command (CTR-CAP-001 R05).

## Validation & errors
Authorization runs before validation of state-dependent fields. Hidden objects return `SYS.NOT_FOUND`. Visible objects with a denied action return `SYS.FORBIDDEN`. Decision records store reason codes only (CTR-CAP-001 R13).

## Authorization
This section is the module matrix above. Grants used: `case`-scoped `negotiation.read` (moderator), `sys` execute grant (scheduler), operator `administer` (dual control per CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
- Policy store unavailable → DENY with `SYS.UNAVAILABLE` (retryable), no data returned (CTR-CAP-001).
- Offline clients never decide. Queued commands are re-authorized at commit (CTR-CAP-001 S3-10).
- Seller loses relation (listing transfer): next decision uses current owner; open negotiations keep `seller_id` per PS-010-01 R02, so the old seller may still accept. ASSUMPTION: this is blocked by voiding the negotiation on listing transfer (see PS-010-03).

## Privacy, retention, abuse
- Decision records: RET-AUD, no content (CTR-CAP-001 R13).
- Repeated `SYS.NOT_FOUND` probing from one principal raises a CAP alert (threshold ASSUMPTION).
- Privileged reads emit an `aud_` record with `neg_` ID, purpose and decision ID, no content (CTR-CAP-001 R08).

## Observability & budgets
`authz_decisions_total{outcome,reason_code}` filtered to `negotiation.*`. Decision p95 ≤ 5 ms (CTR-CAP-001).

## Tests
- TEST-PS-010-05-01 (default deny): every action in the vocabulary with no relation → DENY.
- TEST-PS-010-05-02 (matrix): every row of the matrix yields the stated outcome and code.
- TEST-PS-010-05-03 (enumeration): other buyer's `neg_` ID, guessed IDs and `prf_` of a non-participant all return identical `SYS.NOT_FOUND` bodies.
- TEST-PS-010-05-04 (scheduler): user principal calling `negotiation.execute` is denied.
- TEST-PS-010-05-05 (field visibility): seller view contains no initiator `acc_`; absent fields are not null.
- TEST-PS-010-05-06 (revocation): case grant revoked → next read DENY within 60 s.

## Acceptance criteria
1. No `negotiation.*` action is allowed without a relation rule or active grant.
2. Field visibility matches the table in every query response.
3. TEST-PS-010-05-01 through -06 pass.

## Assumptions & open decisions
- ASSUMPTION: negotiation terms are PSEUDONYMOUS, so moderator and operator access uses single approval; revisit if F10 classifies terms higher.
- ASSUMPTION: listing transfer voids open negotiations.
- OPEN: purpose registry values for `case` grants (owner F16).
- Related: D10 (user-controlled keys; no effect on this matrix).
