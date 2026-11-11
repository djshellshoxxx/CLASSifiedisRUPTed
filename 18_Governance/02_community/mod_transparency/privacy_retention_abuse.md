# PS-148-07 — Privacy, retention and abuse: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-07.R01** Reports reveal only suppressed aggregate counts and contain no user, listing, case or request identities and no free text.
- **PS-148-07.R02** Counters are deleted 90 days after publication; published reports are kept as public record (RET-STANDARD) and as evidence in the operator vault.
- **PS-148-07.R03** Small-number suppression and complementary suppression prevent inference of individual cases from differences between rows, totals or periods.

## Specification

**Data classification**
- TransparencyReport: P0 signed aggregate.
- TransparencyCounter: P3 operator-private, closed vocabulary, no identifiers.

**Retention**
- TransparencyCounter: RET-SHORT, deleted 90 days after publication of the period.
- TransparencyReport: RET-STANDARD, kept indefinitely as public record while the publisher exists.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Re-identification from small counts or differencing across rows and periods | cells under 10 suppressed, complementary suppression, no overlapping periods, totals hidden when under 10 |
| T02 | Operator cherry-picks or edits numbers | two-key publication, deterministic compute from counters, contentCid and signature, corrections as visible new versions |
| T03 | Counter inflation or deflation by event replay | eventId deduplication, coverage percent stated, counters frozen after publication |
| T04 | Legal request tally leaks case details | closed vocabulary only, no free text field, increments only |
| T05 | Reader mistakes the report for global figures | scope statement key shown on every table and in the signed body |

**Abuse controls**
- Legal request increments limited to 100 commands per day per operator key.
- Relay uploads limited to 5 reports per day per operator key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T11 | abuse | PS-148-07.R01, PS-148-07.R02, PS-148-07.R03 | scan report, counters, logs for identifiers; delete after 90 days | no identifiers or free text; counters purged 90 days after publication |
| TEST-PS-148-09.T12 | abuse | PS-148-07.R03 | legal request with free text; 101 increments in a day | rejected by schema; RATE_LIMITED; scope key present in body |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
