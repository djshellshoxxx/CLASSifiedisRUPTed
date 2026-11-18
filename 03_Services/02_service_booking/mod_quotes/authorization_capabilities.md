# PS-032-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-05. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines who may perform which quote action on which quote, using the capability model in CTR-CAP-001 (owner F16, with F07 identity). Business outcome: a participant can act only on quotes where they are a named party, operators act only under a recorded case, and revoked capability takes effect quickly.

Exclusions: identity proofing, credential issuance and key recovery (F07, D10); moderation case workflow (moderation feature); payment authority (none exists in this module).

## Requirements
- PS-032-05.R01: The actor × action × resource matrix in Section 1 is complete. Any cell not listed is denied.
- PS-032-05.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial authorization cases are listed in Section 4 and tested in TEST-PS-032-05-T01 to T05.
- PS-032-05.R03: Accessibility and budgets: permission-denied messages are localizable and never reveal whether a non-party quote exists. Authorization check latency is in observability_performance.md.
- PS-032-05.R04: A non-party participant or anonymous caller receives `QUOTES_NOT_FOUND` for any quote ID, identical to the response for an absent quote, to prevent enumeration.
- PS-032-05.R05: Capability revocation takes effect within 60 seconds for new commands. In-flight commands complete under the capability they started with.
- PS-032-05.R06: Every operator read of full quote content and every hold change is recorded with the case reference, operator ID and timestamp in the audit stream.

## 1. Capability and permission matrix
Resource scope: `quote`. Revision and response reads inherit the quote's scope. Cell values: Y = allowed; Y(own) = allowed only if caller is the named party; Y(case) = allowed only with a valid `case_ref`; N = denied.

| Action | Capability ID | Provider | Requester | Operator | System | Non-party | Anonymous |
|---|---|---|---|---|---|---|---|
| create (C1) | quotes:create | Y(own as provider) | N | N | N | N | N |
| revise (C2) | quotes:revise | Y(own) in COMPOSING or COUNTER_PROPOSED | N | N | N | N | N |
| issue (C3) | quotes:issue | Y(own) | N | N | N | N | N |
| withdraw (C5) | quotes:withdraw | Y(own), non-terminal | N | N | N | N | N |
| respond ACCEPT / DECLINE / COUNTER (C4) | quotes:respond | N | Y(own), state ISSUED | N | N | N | N |
| read full quote (Q1, Q2) | quotes:read | Y(own) | Y(own) | Y(case), audited | N | N | N |
| list own quotes (Q3) | quotes:read | Y(own) | Y(own) | N | N | N | N |
| set or clear hold (C6) | quotes:hold | N | N | Y(case) | N | N | N |
| export own quotes | quotes:export | Y(own) | Y(own) | N | N | N | N |
| expire (job) | quotes:system_expire | N | N | N | Y | N | N |
| stale composing timeout (job) | quotes:system_expire | N | N | N | Y | N | N |

Operator release of a hold requires a case reference whose status is closed. The system does not verify this; the moderation feature does. Dual control (two operators) is not required in v1 (see Open decisions).

## 2. Capability definitions
- `quotes:create`: may create a quote whose provider is the caller. Requires caller is not blocked by requester.
- `quotes:issue` and `quotes:withdraw`: scoped to quote whose `provider_participant_id` equals caller.
- `quotes:respond`: scoped to quote whose `requester_participant_id` equals caller.
- `quotes:read`: scoped to parties. Operator variant requires `quotes:read` plus `case_ref`.
- `quotes:hold`: operator only; each use requires `case_ref`.
- `quotes:export`: scoped to parties; exports only rows where caller is a named party.
- `quotes:system_expire`: granted to the scheduler identity only. Not grantable to humans.

Capability names are provisional until CTR-CAP-001 expands. The module uses colon-separated names.

## 3. Party and block rules
- Party check precedes capability check. A non-party receives QUOTES_NOT_FOUND before any capability evaluation (R04).
- Block check: if requester has blocked provider (or the reverse), create, issue and ACCEPT return QUOTES_PARTY_BLOCKED (A-quotes-12). DECLINE and withdraw are not blocked.
- Self-quote (provider equal to requester) is rejected at validation (QUOTES_SELF_QUOTE).

## 4. Authorization cases
| Class | Case | Expected result | Test |
|---|---|---|---|
| normal | Provider issues own quote | 200 | T01 |
| invalid | Requester calls C3 issue | QUOTES_NOT_AUTHORIZED | T01 |
| adversarial | Third participant GETs a valid quote ID | QUOTES_NOT_FOUND, same body as absent ID | T02 |
| adversarial | Operator reads full quote without `case_ref` | QUOTES_NOT_AUTHORIZED; no content returned | T03 |
| expired | Capability revoked 61 seconds before command | Command denied on new request | T04 |
| concurrent | Hold set while requester sends ACCEPT | Serialized by row lock; accept returns QUOTES_MODERATION_HOLD if hold committed first | T05 |

## Assumptions and open decisions
- A-quotes-12: Block status is read from identity (F07) with 500 ms timeout; fails closed for create, issue and ACCEPT.
- D10 (open, DECISIONS.md): user-controlled keys and recovery. A recovered account keeps its participant ID only if F07 binds recovery to the same ID. This module does not decide that.
- Open decision OD-quotes-01: whether operator hold release requires dual control. Default for v1 is single operator with `case_ref`.
- Operator access audit retention follows the observability record policy in privacy_retention_abuse.md.
