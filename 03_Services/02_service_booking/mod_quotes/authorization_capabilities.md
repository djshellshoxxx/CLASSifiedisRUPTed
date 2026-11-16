# PS-032-05 — Authorization and capabilities: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-05.R01** Vault policy - requests and acceptances can be created only by the local principal acting as client; quotes, confirmations and withdrawals only by the local principal who is the offering provider.
- **PS-032-05.R02** Inbound statements are accepted only when the signer matches the role required for that statement type for this request; otherwise quarantine with a reason code.
- **PS-032-05.R03** No relay role is involved; relays only carry ciphertext and cannot create, alter or confirm any record.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| services.quote.request | principal | local principal is not the provider; not blocked with provider locally; fewer than 5 open requests |
| services.quote.issue | principal | local principal is the offering provider and the request was received from a verified client |
| services.quote.accept | principal | local principal is the request author; quote is issued and unexpired |
| services.quote.decline | principal | local principal is client of the request or provider of the quote |
| services.booking.confirm | principal | local principal is the quote provider |
| services.booking.cancel | principal | local principal is client or provider of the booking |
| services.statement.receive | principal | any envelope; acceptance depends on signature and signer role |
| services.quote.read_own | principal | local principal is client or provider of the request |
| services.booking.read_own | principal | local principal is client or provider of the booking |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T07 | abuse | PS-032-05.R01, PS-032-05.R02, PS-032-05.R03, PS-032-07.R01 | acceptance signed by a third key; confirmation signed by the client; relay tries to alter ciphertext | all quarantined with SERVICES_STATEMENT_INVALID; no state change; relay cannot read descriptions |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F09.S01.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
