# PS-148-07 — Privacy, retention and abuse: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-07.R01** Reports reveal only suppressed aggregate counts and contain no user, listing, case or request identities and no free text.
- **PS-148-07.R02** Counters are kept under RET-AUDIT and purged exactly 90 days after the period's report is published through RetentionPurgePort; published reports are kept as public record (RET-STANDARD) and as evidence in the operator vault.
- **PS-148-07.R03** Small-number suppression and complementary suppression prevent inference of individual cases from differences between rows, totals or periods.
- **PS-148-07.R04** Differencing across periods and versions is blocked by one period granularity per relay, by withholding totals of metrics with suppressed cells and by suppressing every cell whose change from the superseded version is 1 to 9.

## Specification

**Data classification**
- TransparencyReport: P0 signed aggregate.
- TransparencyCounter: P2 relay-local operational data for the relay's operator role (IOX-7), closed vocabulary, no identifiers; leaves the relay only as a sealed snapshot.

**Retention**
- TransparencyCounter: RET-AUDIT (bounded 1 year), purged exactly 90 days after publication of the period through RetentionPurgePort; counters of a period are never purged before it is published unless the 1-year bound is reached.
- TransparencyReport: RET-STANDARD, kept indefinitely as public record while the relay exists.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Re-identification from small counts or differencing across rows, periods and versions | cells under 10 suppressed, complementary suppression, no totals for metrics with suppressed cells, one granularity per relay (V10), cross-version suppression (V11), totals hidden when under 10 |
| T02 | Operator cherry-picks or edits numbers | counts come from a relay-signed snapshot, deterministic compute, compiler and reviewer signatures over one contentCid verified by receivers, corrections as visible new versions; two keys are not proof of two people and the report says so |
| T03 | Counter inflation or deflation by event replay or vault-derived copies | eventId and (proposalId, statementCid) deduplication, origin and mode filters, coverage measured from checkpoints, counters frozen after periodEnd + 24 h |
| T04 | Legal request tally leaks case details | closed vocabulary only, no free text field, increments only |
| T05 | Reader mistakes the report for global figures | scope statement key shown on every table and in the signed body |
| T06 | Self-review with a key outside the operator list | receivers check both keys against the relay's signed tenant configuration and quarantine with GOVERNANCE_TRANSPARENCY_SELF_REVIEW |

**Abuse controls**
- Legal request increments limited to 100 commands per day per operator key.
- Relay uploads limited to 5 reports per day per operator key; snapshots limited to 20 requests per day per key.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T03 | property | PS-148-07.R03, PS-148-02.R05 | random counter tables, month and quarter series and v1/v2 correction pairs | no published cell between 1 and 9; complementary suppression and withheld totals prevent recovery; differencing across granularities is impossible because V10 rejects the second granularity; v1/v2 differences never reveal a value 1..9 |
| TEST-PS-148-09.T11 | abuse | PS-148-07.R01, PS-148-07.R02 | scan report, counters and logs for identifiers; advance the relay clock through a quarter, publication and 90 days | no identifiers or free text; counters survive until compile time and are purged exactly 90 days after publication |
| TEST-PS-148-09.T12 | abuse | PS-148-02.R01, PS-148-07.R01 | legal request with free text; 101 increments in a day | rejected by schema; RATE_LIMITED; scope key present in body |
| TEST-PS-148-09.T20 | abuse | PS-148-07.R04, PS-148-02.R05 | publish quarterly 2026-Q3 then compute 2026-08; publish a correction where one cell changes from 15 to 12 | monthly compute rejected with GOVERNANCE_TRANSPARENCY_PERIOD_INVALID; the changed cell is suppressed in v2 |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
