# PS-072-07 — Privacy, retention and abuse: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-07.R01** Reports reference P2 records and stay in the vault; they contain IDs and kinds only, never amounts, notes or addresses.
- **PS-072-07.R02** Reports are kept 30 days and are regenerated on demand, so deletion of source data removes the underlying subject at the next run.
- **PS-072-07.R03** Alert fatigue and misleading alarms are limited by severity levels, dedupe by key and dismissal.
- **PS-072-07.R04** The module registers ExportSectionPort (section commerce.reconciliation), DeletionPort (reports of a deleted principal are deleted, since they are derived) and RetentionPurgePort (RET-SHORT, 30 days) with F10 (N6), annotates every report field with its F10.S02.M02 class, and consumes privacy.deletion.completed.

## Specification

**Data classification**
- ReconciliationReport: P2, IDs and kinds only; field classes annotated per F10.S02.M02.

**Retention**
- RET-SHORT (30 days) through the RetentionPurgePort; derived and recomputable.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Report used to infer a counterparty's data | reports contain only the principal's own records and IDs, no cross-vault data |
| T02 | False reassurance from a clean report | UI states the check only compares local records and cannot see the counterparty or the money |

**Abuse controls**
- Manual run limited to 1 per 5 minutes; incremental runs coalesced to at most 1 per 30 s per deal.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T10 | abuse | PS-072-07.R03, PS-072-02.R02 | 2 manual runs within 5 minutes | second returns RATE_LIMITED |
| TEST-PS-072-09.T11 | integration | PS-072-07.R01, PS-072-07.R02, PS-072-01.R03 | inspect report contents and age 31 days | IDs and kinds only; report purged after 30 days |
| TEST-PS-072-09.T16 | integration | PS-072-07.R04 | export, deletion and retention purge driven by F10 | section commerce.reconciliation exports the latest report; privacy.deletion.completed deletes the principal's reports; RetentionPurgePort purges reports older than 30 days; every field carries an F10.S02.M02 class |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
