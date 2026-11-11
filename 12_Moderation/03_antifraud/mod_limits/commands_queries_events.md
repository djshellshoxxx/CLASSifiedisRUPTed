# PS-098-04 — Commands, queries and events: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-04.R01** The module exposes override, clear-override and completion-submission relay commands, the member's own limits read, and the in-process check used by the relay bus.
- **PS-098-04.R02** Every effective value change emits moderation.limit.changed in the same transaction as the row.
- **PS-098-04.R03** The module consumes risk level rises and drops, enforcement action applied and reverted events and relay session starts to keep multiplier, restriction and first-seen current, and consumes no vault-local deal or account events.
- **PS-098-04.R04** restrictedCapabilities of moderation.action.applied are mapped to limit keys by the documented capability-to-limit table (federation.record.ingest, comms.mailbox.put to a new recipient, auctions.bid.place), and other capabilities never change limits.
- **PS-098-04.R05** Completion submission verifies every party signature on the deal_completion/v1 body, counts it once per key, and never learns amounts or obligations.
- **PS-098-04.R06** The relay bus calls moderation.accountlimit.check in-process before F18.S02.M01 governance.policy_comment.accept (N18) with limitKey new_key_comments_per_proposal and scopeRef the proposal statement cid; for a key first seen less than 7 days ago the check consumes F12.S03.M03 class governance.policy_comment.new_key (per key and proposal, limitOverride the effective value) and, only when that allows, governance.policy_comment.new_key.proposal (25 per proposal); F18.S02.M01 lists no depends_on edge to this module because the bus injects the check.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `moderation.accountlimit.override` | moderation.accountlimit.override | { subjectKey, limitKey, overrideValue, reason, expiresInMs, expectedRevision? } | { accountLimitId, effectiveValue, revision } | VALIDATION_FAILED, CONFLICT_REVISION, FORBIDDEN | moderation.limit.changed | yes (Idempotency-Key) |
| `moderation.accountlimit.clear_override` | moderation.accountlimit.clear_override | { accountLimitId, expectedRevision } | { accountLimitId, effectiveValue, revision } | NOT_FOUND, CONFLICT_REVISION, FORBIDDEN | moderation.limit.changed | yes (Idempotency-Key) |
| `moderation.accountlimit.submit_completion` | moderation.accountlimit.submit_completion | { completion: { dealId, dealCid, completionCid, outcome: completed }, signatures: { did, sig }[] (2..10) } | { counted: boolean, reason?: counterparty_too_new\|pair_counted_recently\|same_principal, completedDeals, tier } | VALIDATION_FAILED, FORBIDDEN, PRECONDITION_FAILED | moderation.limit.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `moderation.accountlimit.check` | moderation.accountlimit.check | { subjectKey, limitKey, cost?: 1, scopeRef?: proposal statement cid (required for new_key_comments_per_proposal) } | { allowed, effectiveValue, used, resetsAt, retryAfterMs?, reasons[] } | VALIDATION_FAILED, MODERATION_ACCOUNT_LIMIT_REACHED, RATE_LIMITED |
| `moderation.accountlimit.list_mine` | moderation.accountlimit.read_own | { includeAdjustments?: boolean } | { items: { limitKey, tier, effectiveValue, used, adjustments[], nextTier? }[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `moderation.limit.changed` | P2 | { accountLimitId, subjectKey, limitKey, previousValue, effectiveValue, cause: tier\|risk\|override\|override_expired\|policy\|action_restriction\|action_reverted\|action_expired } — relay-local |

### Events consumed

| Type | Effect |
|---|---|
| `moderation.risk.elevated` | relay, subjectType key: set riskLevel and riskMultiplier (medium 0.75, high 0.5) on the subject's limits at once |
| `moderation.risk.lowered` | relay, subjectType key: set riskLevel and riskMultiplier for the new level (medium 0.75, low 1.0) at once, restoring the base value immediately at low |
| `moderation.action.applied` | relay origin, kind restrict_feature: map each restrictedCapabilities entry through the capability-to-limit table and set actionRestriction { actionId, until: expiresAt } on the matching limits (effective value 0); unmapped capabilities and other kinds change nothing |
| `moderation.action.reverted` | relay origin: clear actionRestriction for that actionId and recompute; cause action_expired for reason expired, action_reverted otherwise |
| `identity.session.started` | relay, kind relay_token: set firstSeenAt for did if absent; the relay bus's in-process first-observation hook (LimitsPort.observe) does the same on the first verified signed request without a session |
| `privacy.deletion.completed` | vault: delete cached limit snapshots fetched from relays; relay rows of the subject are deleted 30 days after the relay applies the subject's signed deletion request (DeletionPort), override history stays in the audit log |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MODERATION_ACCOUNT_LIMIT_REACHED | 429 | no | the key reached its limit; params.limitKey, params.effectiveValue and params.resetsAt |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): inbound classrup.commerce.deal_completion/v1 (F09.S01.M01 schema; signer role: each party listed in the completion, verified per signature); no statements are produced. Privacy ports (N6): ExportSectionPort (section moderation.limits, the vault's cached snapshots), DeletionPort and RetentionPurgePort are registered with F10.S01.M03, F10.S01.M04 and F10.S01.M02. The relay never trusts counts supplied by the subject's vault; caps on open offers and open cycle proposals are F12.S03.M03 local guards.

### Example

```
query moderation.accountlimit.check  (in-process relay bus call before federation.record.ingest of a hosted vault's signed listing projection)
{ "subjectKey": "did:key:z6MkMemberExample", "limitKey": "index_writes_per_day" }
-> { "allowed": false, "effectiveValue": 5, "used": 5, "resetsAt": "2026-11-05T09:12:00Z", "reasons": ["tier new: 5 per day; becomes 20 after 7 days and 3 counted completed deals"] }
POST https://relay.example/api/v1/cmd/moderation.accountlimit.override  (moderator token)
{ "subjectKey": "did:key:z6MkMemberExample", "limitKey": "index_writes_per_day", "overrideValue": 30, "reason": "Shop with long trading history on this relay", "expiresInMs": 2592000000 }
-> 200 { "accountLimitId": "0192f410-aaaa-7000-8000-00000000000a", "effectiveValue": 30, "revision": 2 }
query moderation.accountlimit.check  (in-process relay bus call before governance.policy_comment.accept from a key first seen 2 days ago)
{ "subjectKey": "did:key:z6MkNewMemberExample", "limitKey": "new_key_comments_per_proposal", "scopeRef": "sha256-Pr0p..." }
-> denied as 429 RATE_LIMITED { "retryAfterMs": 432000000, "reasons": ["new key: 1 comment per proposal until 7 days after first seen; 25 per proposal from new keys"] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T05 | integration | PS-098-03.R02, PS-098-04.R03 | risk.elevated medium, then high, then risk.lowered medium, then risk.lowered low | 0.75×, 0.5×, 0.75× and base, each immediately on its event; one limit.changed per distinct value |
| TEST-PS-098-09.T06 | contract | PS-098-04.R01, PS-098-04.R02, PS-098-09.R02 | commands, queries and event | validate against registry schemas; check output matches the example |
| TEST-PS-098-09.T15 | e2e | PS-098-01.R02, PS-098-04.R01 | mobile member hits the daily index-write limit | limit sheet shows used, allowed, reset time and next tier; axe zero serious issues |
| TEST-PS-098-09.T16 | integration | PS-098-03.R04, PS-098-04.R04 | restrict_feature with restrictedCapabilities [federation.record.ingest, auctions.bid.place, bazaar.offer.receive] for 7 days, overturned after 2 days; another such action reaches expiry | index_writes and bids 0 while active, new recipients unchanged, bazaar.offer.receive ignored; restored with cause action_reverted; second restored with cause action_expired |
| TEST-PS-098-09.T17 | abuse | PS-098-04.R05, PS-098-07.R04 | submit_completion: valid B–C statement; same completionCid again; one signature invalid; submitter not a party; A with counterparty first seen 2 days ago; second B–C completion within 30 days; A–D completion | counted once; duplicate returns the stored result; FORBIDDEN twice; PRECONDITION_FAILED with counterparty_too_new, pair_counted_recently and same_principal; no amount ever stored |
| TEST-PS-098-09.T19 | integration | PS-098-04.R03 | identity.session.started relay_token for a new key delivered twice; a first verified signed request from another key without a session | firstSeenAt set once from the relay's own observation for each; no identity.account.created or commerce.deal.completed consumer exists |
| TEST-PS-098-09.T21 | integration | PS-098-01.R05, PS-098-02.R05, PS-098-04.R06 | key A (first seen 2 days ago) comments twice on proposal P1 and once on P2; 30 keys first seen today comment once each on P3; key B (first seen 40 days ago) comments on P3; a check without scopeRef; clock advanced to A's 7-day mark | A: first on P1 allowed, second RATE_LIMITED with retryAfterMs to the 7-day mark, P2 allowed; P3: 25 allowed and the rest RATE_LIMITED; B neither counted nor capped; VALIDATION_FAILED; after the mark A is not capped by this module |
| TEST-PS-098-09.T22 | contract | PS-098-04.R06, PS-098-01.R04 | F18.S02.M01 accept fixture through the relay bus: 200 fresh keys from one /24 each comment once on one proposal; F18.S02.M01 depends_on inspected | at most 25 accepted and every refusal is RATE_LIMITED; no depends_on edge from F18.S02.M01 to this module |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
