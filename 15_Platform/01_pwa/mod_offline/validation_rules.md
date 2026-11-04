# PS-116-02 — Validation rules: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-02.R01** Enqueue validates destination, delivery eligibility, size, quota and signature presence before writing; nothing is stored on a violation.
- **PS-116-02.R02** Delivery classifies every relay response into receipt, retryable, conflict or failed using only the code, status and retryable flag from CTR-ERR-001.
- **PS-116-02.R03** A peer acknowledgement is accepted only as a reference to an already verified signed statement from the expected counterparty role; otherwise it is ignored.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kind is statement with a CTR-FED-001 envelope whose signature the local principal made, or relay_command registered deliveryEligible by its owning module | PLATFORM_OUTBOX_NOT_DELIVERABLE |
| V02 | JSON.stringify(payload) is ≤ 262144 bytes | PAYLOAD_TOO_LARGE |
| V03 | principal entry count is < 200 and payload bytes + new payload ≤ 5242880 | PLATFORM_OUTBOX_FULL |
| V04 | relay_command idempotencyKey is a UUIDv7 unique in the store; statement cid is unique per destination | VALIDATION_FAILED |
| V05 | destination matches relay:<id> of a relay the user selected, or direct:<did> | VALIDATION_FAILED |
| V06 | the vault is unlocked and entry principal equals the unlocked principal | UNAUTHENTICATED |
| V07 | IndexedDB opened and the write transaction committed | PLATFORM_OUTBOX_STORAGE_UNAVAILABLE |
| V08 | unsent entry is not older than 7 days at send time | EXPIRED |
| V09 | peer acknowledgement references an entry in transport_acknowledged and its signer role matches the counterparty named in the statement | PLATFORM_OUTBOX_ACK_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T01 | unit | PS-116-01.R01, PS-116-01.R03, PS-116-02.R01 | enqueue a locally signed offer statement for relay:r1 and a relay command with expectedRevision 4 | entries stored in state prepared, attempts 0, seq 1 and 2, cid set, expiresAt = createdAt + 7 d |
| TEST-PS-116-09.T02 | unit | PS-116-02.R01, PS-116-01.R03 | enqueue violating V01, V02, V03, V04, V05 in turn | each returns its documented code and nothing is stored |
| TEST-PS-116-09.T05 | integration | PS-116-03.R02, PS-116-02.R03 | relay receipt arrives, then a forged acknowledgement signed by a non-counterparty key, then the real one | forged ack rejected with PLATFORM_OUTBOX_ACK_MISMATCH; entry stays transport_acknowledged until the real ack gives peer_accepted |
| TEST-PS-116-09.T06 | integration | PS-116-03.R03, PS-116-02.R02 | entry 3 gets 409 CONFLICT_REVISION; entries 4 (same aggregate) and 5 (other aggregate) queued | 3 becomes conflict, 4 waits, 5 is sent; nothing merged |
| TEST-PS-116-09.T07 | integration | PS-116-06.R02, PS-116-02.R02 | stub relay returns network error, 429 retryAfterMs 3000, then 200 | delays follow full-jitter bounds, wait at least 3000 ms, delivered on third attempt; after 6 failures entry is failed |
| TEST-PS-116-09.T09 | contract | PS-116-04.R03, PS-116-02.R02 | stub returns an unknown error code with status 409 retryable false | classified as failed without code changes and shown with messageKey |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
