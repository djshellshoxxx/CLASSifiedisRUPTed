# PS-122-06 — Failure recovery and idempotency: Disaster recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M03 Disaster recovery](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/recovery` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-122-06.R01** Restore is safe to repeat because it only writes into an empty new directory and never touches the live database.
- **PS-122-06.R02** Replay is idempotent at the consumer level through the inbox (CTR-EVT-001 EVT-3), so duplicate delivery has no duplicate effect, and replay writes only dead_letter and inbox rows.
- **PS-122-06.R03** A failed restore phase is resumable from the report or restartable from scratch within the RTO budget.
- **PS-122-06.R04** Data the relay had receipted inside the lost window is recovered from its senders - the signed restore announcement lets vault outboxes return covered entries to prepared and resend them with the same cid or Idempotency-Key - and relay-hosted auctions with activity in that window are frozen for renegotiation rather than contradicting bid orders or results already signed.

## Specification

- **idempotency:** Restore writes to a new empty directory and finishes by renaming a ready marker; rerunning on a failed directory is refused and the operator starts a new directory. Replay requeues events by eventId through the F15.S02.M03 requeue primitive, changing only dead_letter (replay_count, last_replayed_at) and inbox rows; the inbox suppresses (consumer, eventId) duplicates. A replay call with the same eventIds after success reports them as skipped. The restore announcement is keyed by (relayId, epoch), so a repeated restore of the same target never issues a second announcement for one epoch.
- **concurrency:** One restore per target directory (lock file). Replay holds the dispatcher's single-instance lease of the running relay only to insert requeue rows in one transaction; it does not run a second dispatcher.
- **retries:** Fetch and decrypt retry IO errors with IDM-4 backoff (base 500 ms, cap 30 s, 6 attempts); replayed events retry with the standard consumer backoff and return to dead_letter after 8 attempts.
- **offline:** Restore needs only the backup directory and key, no network. Vaults of members are unaffected; their sync outbox shows deliveries as pending, transport_acknowledged or completed until the relay is back, the restore announcement then returns lost ones to prepared, and users can switch relays.
- **partial failure:** If the target host dies mid-restore the directory is discarded and the process restarts on a new host. If event replay fails for some consumers, the restore still completes and the failures remain dead letters for operator replay; the report counts them. If AuctionHostPort is not registered (auctions disabled), no auction is frozen and the report says so.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-122-09.T04 | integration | PS-122-03.R01, PS-122-06.R03 | delete a middle WAL segment | restore stops at the last contiguous segment, reports reachedTimestamp, applies no later segment |
| TEST-PS-122-09.T08 | integration | PS-122-06.R01, PS-122-06.R02 | rerun restore on a failed directory; replay same eventIds twice | refused with PLATFORM_RECOVERY_TARGET_INVALID; second replay reports skipped; consumer inbox shows one effect |
| TEST-PS-122-09.T09 | chaos | PS-122-06.R03, PS-122-03.R03 | kill the restore process in each phase and the consumer during replay | restart from scratch succeeds; failed consumers leave dead letters, not lost events |
| TEST-PS-122-09.T18 | integration | PS-122-06.R02, PS-122-01.R02 | replay 20 dead letters, let 5 fail again, replay those; diff every relay table before and after | only dead_letter and inbox rows changed; replay_count is 2 for the 5 re-dead-lettered events and last_replayed_at kept |
| TEST-PS-122-09.T19 | integration | PS-122-06.R01, PS-122-10.R02 | restore with --to pointing at RELAY_DATA_DIR and at a directory on the live volume | refused with PLATFORM_RECOVERY_TARGET_INVALID; live database byte-identical afterwards |
| TEST-PS-122-09.T21 | integration | PS-122-03.R05, PS-122-04.R04, PS-122-06.R04 | restore with receipts issued after the restored point and an auction bid in the lost window | signed restore announcement served in the well-known document with lostWindow, lastReceiptSeq and epoch 1; the stub outbox returns covered entries to prepared and resends them once; the auction is frozen through AuctionHostPort |

## Dependencies

Module depends on: F15.S03.M02, F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-EVT-001, CTR-IDM-001, CTR-OBS-001, CTR-CAP-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
