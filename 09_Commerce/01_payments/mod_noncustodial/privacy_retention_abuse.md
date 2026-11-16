# PS-069-07 — Privacy, retention and abuse: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-07.R01** Deals and claims are P2 and are never in public projections, search, federation or notification payloads; notifications carry a reference and template key only.
- **PS-069-07.R02** Evidence is retained for RET-EVIDENCE (2 years after last activity, jurisdiction override via F18) and pseudonymized on account deletion; signatures are retained as evidence and marked unverifiable-after-pseudonymization.
- **PS-069-07.R03** Claim spam, false claims and acknowledgement pressure are limited by per-vault limits, local blocking and the dispute path; signatures evidence assertions only.

## Specification

**Data classification**
- Deal and PaymentClaim: P2 (parties). txRef and note: P2 free text; never federated.
- The UI and exports state that a claim is an assertion by the payer and an acknowledgement is an assertion by the payee.

**Retention**
- RET-EVIDENCE (2 years after last related activity); expired and cancelled Deals follow the same class.
- On deletion: did replaced with a per-deletion pseudonym in retained records; counterparty copies in other vaults are not altered and cannot be recalled.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Payer claims payment never made to pressure the payee | claims display as claimed (unverified); only payee acknowledgement or chain finality unlocks completion; payee can dispute with one tap |
| T02 | Payee acknowledges then denies receipt | acknowledgement is a signed statement kept by both parties as evidence; receipts (F09.S02.M01) and disputes (F09.S02.M02) use it |
| T03 | Forged statement from a non-party | signature and role check at ingest; quarantine with reason and no state change |
| T04 | Replay of an old statement | cid deduplication and prev-chain check; replays are no-ops |
| T05 | Fork: payer vault signs two conflicting claims | detection by shared prev; claim frozen, both statements retained, user prompted to renegotiate or open a dispute |
| T06 | Claim flooding to harass a payee | local block, per-peer limit of 20 statements per hour accepted at ingest, quarantine of excess |

**Abuse controls**
- Ingest limit 20 statements per hour per sender did and 200 per day; excess goes to quarantine with reason rate_limited.
- Local block (F07.S02.M02) rejects statements from blocked parties with BLOCKED_PARTY and no signal to the sender.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01 | forged statement, wrong-role signer, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T13 | chaos | PS-069-06.R03, PS-069-07.R03, PS-069-09.R03 | vault B receives two claims with the same prev | claim frozen with COMMERCE_STATEMENT_FORK, both retained, no auto-resolution; flood of 21 statements in an hour quarantines the 21st |
| TEST-PS-069-09.T14 | integration | PS-069-07.R02 | principal deletion completes | retained records carry the pseudonym, signatures flagged unverifiable-after-pseudonymization, counterparty copy untouched |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
