# PS-093-02 — Validation rules: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-02.R01** Capture input is validated strictly and the caller must hold the target with a verifiable author signature, except for a labelled reporter claim on an unsigned message.
- **PS-093-02.R02** Size limits are enforced before any storage so evidence is never truncated, and they are at least the listing limits (10 media items of 5 MiB each).
- **PS-093-02.R03** Verification and read requests are validated against the accessor's purpose and case context.
- **PS-093-02.R04** A P2 target is captured metadata_only unless the reporter runs the disclosure preview, whose rules redact/1 remove L3/L4 location shares, geohash cells longer than 5 characters, email addresses, phone numbers and attachments before approval.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | targetType is in the allowed list and targetId is a uuidv7 | VALIDATION_FAILED |
| V02 | the store holds the target envelope for targetCid and targetRevision | MODERATION_EVIDENCE_SOURCE_MISSING |
| V03 | canonical body is at most 262144 bytes and media are at most 10 items of at most 5242880 bytes each; P0 media are referenced by blob:sha256 and only P2 media are copied | PAYLOAD_TOO_LARGE |
| V04 | the author signature over the envelope verifies against authorKey, or the capture is an explicitly labelled reporter claim on targetType message | MODERATION_EVIDENCE_SIGNATURE_INVALID |
| V05 | relay read purpose case_review or appeal_review carries a caseId the moderator is assigned to | FORBIDDEN |
| V06 | snapshot lifecycle is not purged | EXPIRED |
| V07 | approve_disclosure carries the digest of the latest preview of this snapshot and redact/1 completed on it | PRECONDITION_FAILED |
| V08 | a P2 target (message, offer, cycle_proposal) is stored with disclosure metadata_only or reporter_claim unless a disclosure reached export_prepared | VALIDATION_FAILED |

Rules redact/1 (deterministic, versioned): location share objects of level L3 or L4 are removed; geohash strings longer than 5 characters are truncated to 5; email addresses (local@domain.tld) become '[email]'; phone numbers (7 or more digits with optional +, spaces, dots or dashes) become '[phone]'; attachments are dropped and replaced by '[attachment n of m]'. Each rule reports its count in redactions.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T01 | unit | PS-093-01.R01, PS-093-02.R01 | capture signed listing revision 3 in a vault | snapshot stored with canonical body, SHA-256 equal to independent recomputation, signature status valid, disclosure public_target |
| TEST-PS-093-09.T03 | unit | PS-093-02.R02, PS-093-02.R03 | each rule V02–V08 violated in turn | documented error code and no row stored; forged author signature refused |
| TEST-PS-093-09.T17 | integration | PS-093-02.R02, PS-093-04.R04 | report listing L with 10 photos of 5 MiB and a message with 2 P2 photos; relay ingests both bundles | listing reportable with 10 blob:sha256 references and no copies; P2 photos copied into evidence blobs; relay re-verifies hashes and resolves P0 media by reference |
| TEST-PS-093-09.T18 | unit | PS-093-02.R04, PS-093-03.R04 | disclosure preview of message M; approve with a stale digest; approve with the latest digest | each item redacted by its redact/1 rule and counted; PRECONDITION_FAILED; export_prepared with disclosure participant_disclosure |

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
