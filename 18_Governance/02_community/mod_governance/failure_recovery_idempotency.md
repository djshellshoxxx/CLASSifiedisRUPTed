# PS-147-06 — Failure recovery and idempotency: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-06.R01** All commands are idempotent per CTR-IDM-001 and statements are deduplicated by cid.
- **PS-147-06.R02** State change, signed statement and outbox entry commit in one IndexedDB transaction of the signing vault only; transport is retried separately and no guarantee spans two vaults.
- **PS-147-06.R03** Contradicting signed statements (two decisions with different outcomes or content, or a decision and a withdrawal, for one proposal cid) are detected in any receiving vault, marked conflicted and never resolved by last writer or by timestamps.
- **PS-147-06.R04** Comment delivery states follow IDM-7: the relay's signed acceptance is transport_acknowledged and labelled 'accepted for hosting by relay R', and peer_accepted is shown only when a verified decision by the publisher's delegated decider lists the comment cid in acknowledgedCommentCids.

## Specification

- **idempotency:** Idempotency-Key required on commands, kept 24 h; relay accept and relay_upload deduplicate by statement cid; verify and receive are naturally idempotent; trusted_publisher.add for an already trusted publisher and scope set returns the stored entry.
- **concurrency:** expectedRevision applies only in the authoring vault (draft, request_cosign, open, withdraw, authority_list draft and release); decide binds the proposal statement cid instead of a revision. A decision and a withdrawal are signed in different vaults and nothing orders them (ADR-0016 §5): any vault that verifies both, in either order, marks the proposal conflicted, verify returns conflicted and the publisher must open a new proposal. Two decisions with different outcomes are handled the same way.
- **retries:** Transport retries follow IDM-4 (base 500 ms, cap 30 s, 6 attempts); comment posting retries only network errors and RATE_LIMITED after retryAfterMs; a decision whose receipt cannot be fetched is retried by fetching relay_get, and verify returns decision_unavailable until then.
- **offline:** Drafting, deciding, co-signing and posting a comment can be prepared offline; each signed statement stays prepared until a relay receipt exists (transport_acknowledged), and a proposal's anchored comment period starts only at that receipt.
- **partial failure:** A failed relay upload leaves the local state committed and retries; a relay refusing a comment returns a signed refusal reason and the comment stays local with state relay_rejected; a pending statement whose owner module rejects it on apply stays pending with the new reason.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T09 | integration | PS-147-06.R01, PS-147-06.R02 | replay decide with the same key; crash after signing in the decider vault | one decision statement; consistent state after restart; no other vault changed |
| TEST-PS-147-09.T10 | integration | PS-147-06.R03, PS-147-03.R04 | two conflicting decisions delivered to a receiver | proposal marked conflicted; verify returns false with reason conflicted; decided event with outcome conflicted |
| TEST-PS-147-09.T11 | chaos | PS-147-06.R04 | relay down while a comment is posted and a decision is queued; relay recovers; later decision lists the comment cid | states prepared, then transport_acknowledged labelled 'accepted for hosting by relay R' on the receipt, then peer_accepted only after the verified decision lists the cid |
| TEST-PS-147-09.T17 | integration | PS-147-03.R04, PS-147-06.R02, PS-147-06.R03 | publisher P withdraws while decider D, offline, approves; deliver both to third vault V in both orders | V marks conflicted with both cids in either order; verify returns conflicted; a new proposal is required |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
