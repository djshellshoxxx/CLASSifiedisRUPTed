# PS-092-06 — Failure recovery and idempotency: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-092-06.R02** Concurrent assignment attempts serialize on appeal revision within the relay store; there is no cross-vault lock.
- **PS-092-06.R03** Decision and event are written in one relay transaction, and a vault that misses the decision statement can refetch it by appeal ID.
- **PS-092-06.R04** Relay deduplication on appealId lasts as long as the relay retains the appeal, and a retry with the same statement digest always returns the stored signed receipt.

## Specification

- **idempotency:** Local Idempotency-Key on vault commands. On the relay the IDM-1 24 h key cache serves only HTTP replays; appeal dedupe on (relayId, appealId) lasts as long as the relay retains the appeal: same appealId and statementDigest returns the stored signed receipt at any later day, same appealId with a different digest returns IDEMPOTENCY_KEY_REUSED, and another appealId for the same action returns MODERATION_APPEAL_DUPLICATE; decide replays the stored decision statement; vault intake of relay statements dedupes on statement cid.
- **concurrency:** expectedRevision on decide, reassign and withdraw; unique (tenant_id, action_id) index enforces one appeal per action under races; assignment and reassignment use compare-and-set on status and revision; a moot closure and a decide racing on one appeal serialize on revision and the loser gets CONFLICT_STATE.
- **retries:** Sync outbox retries delivery for up to 7 days with CTR-IDM-001 backoff; the vault polls moderation.appeal.status_for_appellant every 15 min while the appeal is open and online.
- **offline:** File and withdraw can be queued offline; the window is decided by the relay's receive time against the relay-signed reasons time, so offline delay can consume the window, and the UI shows the remaining days before the user goes offline.
- **partial failure:** If the relay accepts the appeal but the receipt is lost, the retry returns the stored receipt; if a decision or moot statement fails to deliver, the status query returns it; sync state never shows peer_accepted without a verified relay signature. Privacy ports (N6): ExportSectionPort, DeletionPort and RetentionPurgePort run resumably and idempotently per appeal id.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T09 | integration | PS-092-06.R01, PS-092-06.R02 | same Idempotency-Key replayed; concurrent assign and withdraw | original receipt replayed; consistent final state by revision |
| TEST-PS-092-09.T10 | chaos | PS-092-06.R03, PS-092-03.R03 | decision committed, then the mailbox delivery of the decision statement fails | event and decision stored in one transaction; vault fetches the decision through status_for_appellant; sync state advances honestly |
| TEST-PS-092-09.T21 | integration | PS-092-02.R04, PS-092-06.R04 | first delivery on day 29 with the receipt lost and a retry on day 32; same appealId with a changed digest; appeal forwarded to relay Y | stored receipt returned on day 32; IDEMPOTENCY_KEY_REUSED; relay Y refuses with FORBIDDEN |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
