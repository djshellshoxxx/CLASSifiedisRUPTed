# PS-146-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-06. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [12_Moderation](../../../12_Moderation). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-06.R01: Business outcome. A checkpoint evaluation is either fully recorded with its outbox events or not recorded at all. A caller that retries after a timeout receives the same decision, never a second decision for the same checkpoint. Owners fail closed: no subject becomes public or cycle-eligible without an ALLOW.
- Exclusions: owner-side compensation (owner must reverse its own state if it applied a decision and later loses the evidence). Physical or financial settlement is never implied by any outcome here.

## Timeouts and retries
- Caller deadline for evaluate: 1500 ms total, including retries. Server-side deadline: 800 ms; expiry returns PROHIBITED_TIMEOUT before commit.
- Retry policy for callers: retry only on PROHIBITED_TIMEOUT, PROHIBITED_UNAVAILABLE, PROHIBITED_RATE_LIMITED (honor `retry_after_s`), PROHIBITED_NO_ACTIVE_POLICY. Backoff: base 150 ms, factor 2, full jitter, cap 800 ms, max 3 attempts within the 1500 ms budget.
- Non-retryable errors (validation, conflicts, forbidden) are never retried with the same payload.
- Hold escalation scheduler: retries each failed transition up to 5 times with 1 min, 2 min, 4 min, 8 min, 16 min delays, then pages operators (no silent drop).
- Outbox relay: retries publish indefinitely with exponential backoff capped at 60 s; undelivered events are visible in the operator dashboard after 5 minutes.

## Idempotency
- PS-146-06.R02: Evaluate idempotency key is `{subject_type}:{subject_id}:{subject_revision}:{checkpoint}`, unique per caller_service_id. Record stores the request digest (HMAC of canonical snapshot) and the decision_id.
- PS-146-06.R03: Same key and same digest returns the stored decision with HTTP 200 and `replayed: true`. Same key and different digest returns PROHIBITED_IDEMPOTENCY_CONFLICT (409) and records nothing.
- PS-146-06.R04: Idempotency records are retained 7 days (A-prohibited-10). After expiry, a repeated key is treated as new; the subject_revision guard still rejects stale revisions, so duplication is bounded.
- PS-146-06.R05: Policy creation uses `client_token`; replay within the window returns the same EDITING version.
- PS-146-06.R06: Hold transitions and version transitions are idempotent by `expected_row_version`: a replay after success returns PROHIBITED_REVISION_CONFLICT with the current row, and the caller treats a row already in the target state as success.

## Concurrency control
- PS-146-06.R07: Optimistic locking via `row_version` on PolicyVersion, ProhibitionRule (EDITING only), PolicyHold. Mismatch returns PROHIBITED_REVISION_CONFLICT (409) and includes current row_version in `details`.
- PS-146-06.R08: Activation runs in one serializable transaction: lock the active row, check no other ACTIVE exists, retire old, activate new, write audit entry, write outbox. Two concurrent approvals of different versions: one succeeds; the other returns PROHIBITED_POLICY_STATE_INVALID or PROHIBITED_REVISION_CONFLICT.
- PS-146-06.R09: Two concurrent evaluations for the same subject at the same revision with different idempotency keys: both may record a decision; the later one supersedes the earlier one when the outcomes differ, and both events are emitted. Owners apply the decision matching their current revision only.
- PS-146-06.R10: Hold resolve and escalate race: whichever commits first wins; the other receives PROHIBITED_REVISION_CONFLICT. Escalation never overrides a resolution.

## Partial failure recovery
- PS-146-06.R11: Decision write, hold write and outbox write share one transaction. There is no state in which a HOLD decision exists without its hold, or a decision exists without its outbox record.
- PS-146-06.R12: If the commit succeeds and the response is lost, the caller retries the evaluate; it receives the stored decision (R03).
- PS-146-06.R13: If the owner applied an outcome and the decision is later superseded, the owner receives `prohibited.decision.superseded.v1` and reconciles its state. This module does not call owners to compel changes.
- PS-146-06.R14: Re-evaluation batches store a cursor after each committed batch of 500. A crash resumes from the cursor; batch items are idempotent by `reeval:{policy_version_id}:{subject_id}:{subject_revision}`.
- PS-146-06.R15: If the active version is swapped while a batch runs, the batch continues against the version it started with, and its results are recorded with that version_id. A new batch for the new version starts after the swap.

## Degraded modes
- PS-146-06.R16: No ACTIVE version: evaluate returns PROHIBITED_NO_ACTIVE_POLICY and records nothing. Owners keep subjects out of public states. No default ALLOW.
- PS-146-06.R17: Storage unavailable: PROHIBITED_UNAVAILABLE (503). No in-memory decision is returned to the caller.
- PS-146-06.R18: Outbox or event broker unavailable: decisions still commit; events queue in the outbox. Owners that depend on events poll `decision.get` on timeout.
- PS-146-06.R19: Offline clients never call evaluate directly. Pending local writes in owner features wait for server acknowledgment before evaluation (D08).

## Open decisions
- A-prohibited-10 (7-day idempotency retention), A-prohibited-07 (escalation and scheduler retry policy), A-prohibited-12 (re-evaluation batch behavior).
- Caller deadline values (1500 ms, 800 ms) are proposed defaults; they are validated against the budgets in observability_performance.md.
