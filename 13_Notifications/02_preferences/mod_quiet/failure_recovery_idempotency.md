# PS-108-06 — Failure recovery and idempotency: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-06.R01** Dispatch is idempotent on dispatchId for sealed requests, on (userDid, channel, templateKey, ref, collapseKey) within 10 minutes for hook calls, and on sourceEventId in the vault, so retries never double-send.
- **PS-108-06.R02** Release is idempotent per deferred item; a crash after the send but before the status update causes at most one repeated send which the push Topic and email Message-ID collapse.
- **PS-108-06.R03** The gate never fails open - if consent, preference or schedule cannot be read, the item is re-deferred for 5 minutes, and after 3 failures it is dropped for push and email and kept in the inbox; when no preference mirror exists the relay applies the versioned default matrix, so urgent security is never dropped for lack of a mirror.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with a 24 h replay window; sealed dispatch dedupes on dispatchId, hook dispatch on (userDid, channel, templateKey, ref, collapseKey) for 10 minutes, vault decisions on sourceEventId; cancel is idempotent per dispatchId; release is idempotent on deferredId.
- **concurrency:** Each decision runs in one SQLite transaction on the relay (BEGIN IMMEDIATE) and one IndexedDB transaction in the vault; release and cancel use compare-and-set on status deferred; tabs and the service worker serialize the vault gate with a Web Lock; no distributed lock is used.
- **retries:** Vault requests to the relay go through the F15.S01.M01 sync outbox with backoff base 1 s, factor 2, cap 60 s, max 6 attempts for live alerts; the send step retries per F13.S01.M01 and F13.S01.M02 rules; unreadable gate input re-defers every 5 minutes up to 3 times.
- **offline:** In the vault the os_alert gate works offline; push and email depend on the relay, and if the relay is unreachable the inbox still shows everything, deferred push and email wait in the sync outbox and delivery status for those channels is unknown.
- **partial failure:** If push succeeds but the status update fails, the item is sent again once and collapsed by Topic; if release finds the relay channel down the item is re-deferred and dropped after 24 hours without losing the inbox entry; if a cancel cannot reach the relay before releaseAt, the alert may still be sent and the inbox already shows it read.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02, PS-108-06.R03 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent; relay with no preference mirror for a hook | first sent immediately; second downgraded to normal, counted and deferred; third not pushed; hook decided by the default matrix |
| TEST-PS-108-09.T09 | integration | PS-108-06.R01, PS-108-06.R02 | same sealed dispatch retried 5 times with one dispatchId; crash after send before status update | one send, or one repeated send collapsed by Topic and Message-ID |
| TEST-PS-108-09.T10 | chaos | PS-108-06.R03 | preference store unavailable during a vault decision | re-deferred 5 minutes, dropped after 3 attempts; inbox entry unaffected |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
