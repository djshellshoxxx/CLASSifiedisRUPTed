# PS-101-02 — Validation rules: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-02.R01** Manual signal input is validated strictly with bounded weight and a required reason.
- **PS-101-02.R02** Ingestion from events validates the mapping table and ignores events lacking a verified signature in the vault case.
- **PS-101-02.R03** Every violation maps to one stable error code.
- **PS-101-02.R04** Mappings use only fields present in the producer payload; a mapping whose subject cannot be resolved records nothing, and a vault never records a signal about its own local principal.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | weight is an integer in -100..100 and halfLifeDays in 7..180 | VALIDATION_FAILED |
| V02 | kind is in the enum and manual kinds are only manual_concern, manual_positive or compensation | VALIDATION_FAILED |
| V03 | supersedesSignalId exists in this store, belongs to the same subject and is not itself a compensation | NOT_FOUND |
| V04 | a signal with the same (kind, sourceEventId) does not exist | MODERATION_SIGNAL_DUPLICATE_SOURCE |
| V05 | manual signals carry a reason of 10..500 code points and the author is the local principal or a relay moderator | FORBIDDEN |
| V06 | total manual weight per subject within 30 days is at most 20 in absolute value | MODERATION_SIGNAL_MANUAL_CAP |
| V07 | the subject of an event-derived signal comes from a named payload field of the source event and differs from the vault's local principal | VALIDATION_FAILED |
| V08 | SignalPort.record names a kind of the module table registered for the calling module (proximity_pattern for F06.S02.M03), a did:key subjectKey, a sourceRef of 1..128 characters and an evidenceRef without location cells, and runs on a relay | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T01 | unit | PS-101-01.R01, PS-101-02.R01, PS-101-02.R02 | record valid manual signals; invalid weight and kind | stored with expiry = observedAt + 5 half-lives; documented errors otherwise |
| TEST-PS-101-09.T03 | unit | PS-101-02.R03 | compensation referencing a missing signal, another subject, or a compensation | NOT_FOUND |
| TEST-PS-101-09.T14 | integration | PS-101-02.R04, PS-101-01.R02 | commerce.deal.completed with parties [P, B]; payment.disputed where P is the payer; auctions.result.voided without subjectKeys in a vault | deal_completed recorded only for B; no signal about P; nothing recorded for the void; unresolved_subject metric increments |
| TEST-PS-101-09.T17 | abuse | PS-101-07.R01, PS-101-02.R04 | F12 privacy suite: scan federation payloads, public projections, notifications, relay and vault logs after ingesting every mapped event | no Signal field, subject key, source key or weight appears in any of them |
| TEST-PS-101-09.T19 | integration | PS-101-02.R04 | commerce.dispute.resolved refund_claimed, then no_fault_close for another case, then withdrawn for a third | refund_agreed against the respondent of the matching dispute_opened signal; compensations for the other two; no dispute_lost kind exists |
| TEST-PS-101-09.T20 | contract | PS-101-04.R06, PS-101-02.R04 | F06.S02.M03 contract fixture calls SignalPort.record with proximity_pattern for a token caller twice with one sourceRef, for an anonymous caller without did:key, with an unregistered kind, with a cell in evidenceRef, and over HTTP | one signal weight 10 half-life 7 days and duplicate true on the repeat, moderation.signal.recorded once; VALIDATION_FAILED three times; no route |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
