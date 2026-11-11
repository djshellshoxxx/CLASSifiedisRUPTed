# PS-092-07 — Privacy, retention and abuse: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-07.R01** Appeals and decisions are P2, readable only by the appellant and the relay's assigned reviewer and operators, and never federated or sent in plain notifications.
- **PS-092-07.R02** Appeal records follow RET-EVIDENCE with the action, and the appellant may keep the signed decision in their vault regardless of relay deletion.
- **PS-092-07.R03** Appeal abuse (spam appeals, reviewer harassment, deadline gaming) is limited by one appeal per action, size caps and reviewer anonymity.

## Specification

**Data classification**
- Appeal: P2 (appellant, relay reviewer, relay operators).
- Attachments: P2 files stored encrypted on the relay under the per-object key scheme of F12.S01.M02.
- Reviewer key: P3 on the relay, hidden from the appellant.

**Retention**
- Decided and withdrawn appeals: RET-EVIDENCE (2 years after last related activity) on the relay.
- Vault copy: kept until the user deletes it; deletion does not recall the relay copy.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Decider reviews own decision | reviewer key must differ from decider key; enforced in assignment and in decide; audited |
| T02 | Relay forges or backdates the statement of reasons to close the window | the statement is relay-signed and the appellant's vault stores it on receipt with its own clock; mismatch between vault receipt time and relay time greater than 24 h is flagged to the user |
| T03 | Appeal flooding to overload moderators | one appeal per action, size caps, relay rate limits 5 appeals per day per key |
| T04 | Reviewer harassment | reviewer key hidden from appellant; decision statement is signed by the relay key |
| T05 | Forged decision statement shows 'overturned' in the vault | vault accepts decisions only with valid relay signature bound to appealId; others quarantined |

**Abuse controls**
- Per-key cap of 5 appeals per day and 20 per 30 days on a relay (F12.S03.M03).
- Appeals whose statement is empty after trimming or duplicates a previous one by hash are rejected with VALIDATION_FAILED.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T08 | abuse | PS-092-07.R01, PS-092-07.R03 | forged decision signature; 6th appeal in a day | decision quarantined, vault never shows decided; 6th returns RATE_LIMITED |
| TEST-PS-092-09.T11 | integration | PS-092-07.R02 | appellant deletes vault copy | relay copy retained for RET-EVIDENCE; UI states relay copy remains |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
