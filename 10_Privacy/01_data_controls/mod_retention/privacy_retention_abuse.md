# PS-079-07 — Privacy, retention and abuse: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-07.R01** Run records contain counts and kinds only, never record contents or identifiers of users.
- **PS-079-07.R02** Holds are the only way to keep relay-held data past policy, require two operators, are audited under RET-AUDIT and reviewed every 180 days.
- **PS-079-07.R03** Abuse of holds by a rogue operator is limited by separation of duties, mandatory reference, review reminders and visibility to all relay operators.

## Specification

**Data classification**
- RetentionPolicy: P1. LegalHold: P3 operator record; the reference must not contain personal data.
- Run records: counts per kind and class.

**Retention**
- Run records RET-AUDIT (1 year); LegalHold RET-AUDIT for 1 year after release; policies retained while effective plus 1 year.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue operator places a hold to retain a user's data | two different operators required, reason code, reference, audit trail visible to all operators, 180-day review, user data in vaults unaffected |
| T02 | Hold used to resurrect tombstoned content | held content is sealed and withdrawn from public serving; only operators can access it |
| T03 | Sweep deletes records under dispute or hold | purge re-checks hold inside the deleting transaction; disputes are protected by RET-EVIDENCE duration |
| T04 | Policy manipulation to shorten audit retention | AUDIT bounds 180 to 2555 days enforced in code; changes audited |

**Abuse controls**
- Hold requests limited to 10 per operator per day; sweep runs limited to 6 per day per scope.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T12 | abuse | PS-079-07.R02, PS-079-07.R03 | 11 hold requests in a day by one operator; check audit entries | 11th RATE_LIMITED; every step audited with actor |
| TEST-PS-079-09.T13 | integration | PS-079-07.R01, PS-079-07.R03 | inspect run records and logs | counts and kinds only; no record contents |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
