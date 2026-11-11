# PS-067-07 — Privacy, retention and abuse: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-07.R01** Cash terms are P2 and never leave the vault except inside end-to-end encrypted envelopes to the other party.
- **PS-067-07.R02** The handover hint is public-place guidance only; the UI warns against sharing a home address (P3) and rejects hints that match the user's stored private address.
- **PS-067-07.R03** Pressure tactics are limited by the proposal rate limit and by the dispute path.
- **PS-067-07.R04** The module registers ExportSectionPort (section commerce.cash_terms), DeletionPort (pseudonymization of retained terms) and RetentionPurgePort (RET-EVIDENCE) with F10 (N6), annotates every CashTerms field with its F10.S02.M02 class, and consumes privacy.deletion.completed.
- **PS-067-07.R05** Ingest drops statements from blocked dids silently (N7) and uses the bounded quarantine of F09.S01.M01 (500 entries or 5 MiB, oldest-first eviction); once it is full, statements from dids that are party to no known Deal are dropped.

## Specification

**Data classification**
- CashTerms: P2 (parties); handoverHint is P2 free text; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE (2 years after last related activity) through the RetentionPurgePort; pseudonymized on account deletion.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Counterparty pressures an unsafe private meeting for cash | guidance card, public-place hint field, safe-spot link (F08.S03), no home address prompt |
| T02 | Payee claims cash was never handed over after signing a receipt | signed receipts are assertions both parties hold; dispute path preserves them; platform states it cannot verify cash |
| T03 | Fake terms statement from a non-party | signer-role check at ingest; quarantine |
| T04 | Payee silently replaces terms the payer already accepted | accepted terms stay in force until the payer signs acceptance of newer terms; each claim signs its termsCid |
| T05 | Sybil flood of terms statements from fresh dids | shared bounded quarantine; non-party statements dropped once full |

**Abuse controls**
- Proposal limit of 1 per obligation per hour and 20 per day per vault; ingest limit 20 statements per hour per known party; statements from dids that are party to no known Deal share the bounded quarantine and are dropped once it is full; blocked senders dropped silently.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T09 | abuse | PS-067-07.R01, PS-067-07.R02, PS-067-07.R03 | hint equal to stored private address; 2 proposals in an hour | hint rejected with COMMERCE_CASH_HINT_PRIVATE; second proposal RATE_LIMITED |
| TEST-PS-067-09.T19 | integration | PS-067-07.R04 | export, deletion and retention purge driven by F10 | section commerce.cash_terms exported; privacy.deletion.completed pseudonymizes the principal; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-067-09.T20 | abuse | PS-067-07.R05 | blocked payee sends a terms statement; 10 000 fresh dids send terms statements | blocked statement dropped silently; quarantine stays within 500 entries or 5 MiB and non-party statements are dropped once it is full |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
