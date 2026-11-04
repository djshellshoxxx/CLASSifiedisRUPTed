# PS-030-02 — Validation rules: Service disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M03 Service disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/disputes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-030-02.R01** Eligibility, scope and statement are validated before any case is requested.
- **PS-030-02.R02** Inbound dispute notices are validated for signature, party role and referenced booking before a link is created.
- **PS-030-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | actor is client or provider of the booking and the booking has a confirmation statement | FORBIDDEN |
| V02 | booking status is confirmed, in_progress, completed or cancelled with a late fee claim, and within 30 days of the window start | SERVICES_DISPUTE_WINDOW_CLOSED |
| V03 | no non-withdrawn link exists for the same scopeKey | SERVICES_DISPUTE_DUPLICATE |
| V04 | at most 3 disputes per booking | SERVICES_DISPUTE_LIMIT |
| V05 | statement 20..2000 code points and at most 5 extra evidence references each with a SHA-256 | VALIDATION_FAILED |
| V06 | scope milestone requires a milestoneId of this booking | VALIDATION_FAILED |
| V07 | dispute notice signature verifies and signer equals the opener party of the booking | SERVICES_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-030-09.T01 | unit | PS-030-01.R01, PS-030-01.R03, PS-030-02.R01, PS-030-02.R02, PS-030-02.R03 | rules V01–V07 each violated | documented code returned and nothing stored; notices with bad signature quarantined |
| TEST-PS-030-09.T15 | e2e | PS-030-01.R01, PS-030-02.R01 | mobile client opens dispute, provider receives notice in second browser | both show linked with case reference; axe zero serious issues |

## Dependencies

Module depends on: F03.S02.M01, F03.S02.M02, F09.S02.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
