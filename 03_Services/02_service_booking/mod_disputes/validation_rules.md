# PS-030-02 — Validation rules: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-02.R01** Eligibility, scope and statement are validated before any case is requested.
- **PS-030-02.R02** Inbound dispute notices are validated for signature and party role and then re-checked against the receiving vault's own records and clock (window with 24 h tolerance, limits, duplicates, milestone and state rules) before a link is created; failures are quarantined and emit nothing.
- **PS-030-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | actor is client or provider of the booking and the booking has a confirmation statement | FORBIDDEN |
| V02 | now is within 30 days of the window start (the later of booking end, last milestone activity and cancellation); a receiving vault allows 24 h tolerance | SERVICES_DISPUTE_WINDOW_CLOSED |
| V03 | no link that is not withdrawn or link_failed exists for the same scopeKey | SERVICES_DISPUTE_DUPLICATE |
| V04 | at most 3 disputes per booking, counting links that are linked or resolved | SERVICES_DISPUTE_LIMIT |
| V05 | statement 20..2000 code points and at most 5 extra evidence references each with a SHA-256 | VALIDATION_FAILED |
| V06 | milestoneId is present if and only if scope is not_delivered, quality or payment_not_received, and then it belongs to this booking; no_show, cancellation_fee, scope_change and other carry none | VALIDATION_FAILED |
| V07 | dispute notice or withdrawal signature verifies and the signer is the other party of the booking (the opener of the referenced notice for a withdrawal) | SERVICES_STATEMENT_INVALID |
| V08 | no open link (pending_link or linked) exists for the booking, except that simultaneous opens are merged by the noticeCid rule | SERVICES_DISPUTE_DUPLICATE |
| V09 | the scope fits the current state - not_delivered and quality need a confirmed, in_progress, completed or cancelled booking and a milestone that is not cancelled; payment_not_received needs an approved, unsettled milestone (the booking may be cancelled); no_show needs startUtc in the past; cancellation_fee needs a cancelled booking with lateFeeClaim; scope_change and other need a confirmed booking or later | SERVICES_DISPUTE_NOT_ELIGIBLE |
| V10 | an inbound notice passes V01–V06, V08 and V09 against the receiving vault's own records and clock and the sender quota of 10 notices per day | SERVICES_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T01 | unit | PS-030-01.R01, PS-030-01.R03, PS-030-02.R01, PS-030-02.R03 | rules V01–V10 each violated | documented code returned and nothing stored; notices with bad signature quarantined |
| TEST-PS-030-09.T15 | e2e | PS-030-01.R01, PS-030-02.R01 | mobile client opens dispute, provider receives notice in second browser | both show linked with case reference; axe zero serious issues |
| TEST-PS-030-09.T17 | abuse | PS-030-02.R02 | inbound notice 60 days after booking end, one over the per-booking limit, and a duplicate scope | each quarantined in the receiving vault; no link, no services.dispute.opened, no freeze |
| TEST-PS-030-09.T19 | integration | PS-030-02.R02, PS-030-03.R03 | counterparty receives a valid notice but no case statement for 7 days | link_failed, nothing frozen, services.dispute.closed with reason link_failed |
| TEST-PS-030-09.T20 | unit | PS-030-02.R01 | payment_not_received on a cancelled booking with an approved unsettled milestone; no_show with a milestoneId; quality without one | first allowed; the other two VALIDATION_FAILED |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F07.S01.M01, F07.S02.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
