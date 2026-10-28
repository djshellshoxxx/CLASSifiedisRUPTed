# @classrup/moderation (F12)

Moderation and safety: reports and cases, evidence, enforcement with strikes, appeals, spam and abuse controls, and antifraud (signals, risk, rate limits, trust-tier limits). Area `moderation`, factory `createModeration(deps, ports, options?)`. Depends only on `@classrup/kernel` and `@classrup/security`.

## Module map

| Module | Code | Flag |
|---|---|---|
| F12.S01.M01 flags | `src/reporting/{flags,cases,priority}.ts` | `moderation.flags` |
| F12.S01.M02 evidence | `src/reporting/evidence.ts` | `moderation.evidence` |
| F12.S01.M03 appeals | `src/reporting/appeals.ts` | `moderation.appeals` |
| F12.S02.M01 enforcement | `src/policy/{enforcement,strikes}.ts` | `moderation.enforcement` |
| F12.S02.M02 spam | `src/policy/spam.ts` | `moderation.spam` |
| F12.S02.M03 abuse | `src/policy/abuse.ts` | `moderation.abuse` |
| F12.S03.M01 risk | `src/antifraud/risk.ts` | `moderation.risk` |
| F12.S03.M02 signals | `src/antifraud/signals.ts` | `moderation.signals` |
| F12.S03.M03 rate | `src/antifraud/rate.ts` | `moderation.rate` |
| F12.S03.M04 limits | `src/antifraud/limits.ts` | `moderation.limits` |

## Operations (31)

`kind`: C command (idempotent through `runCommand`), Q query. Permissions are granted by `POLICIES`; none is public.

| Operation | Kind | Permission |
|---|---|---|
| moderation.report.submit | C | moderation.report:create |
| moderation.report.list (reports of a case, with reporter) | Q | moderation.report:read |
| moderation.report.mine | Q | moderation.report:read_own |
| moderation.case.list / .get | Q | moderation.case:read |
| moderation.case.claim / .release | C | moderation.case:claim |
| moderation.case.assign | C | moderation.case:assign (admin) |
| moderation.evidence.add | C | moderation.evidence:add |
| moderation.evidence.list / .verify | Q | moderation.evidence:read |
| moderation.enforcement.decide | C | moderation.enforcement:decide |
| moderation.enforcement.approve / .reject | C | moderation.enforcement:approve |
| moderation.enforcement.list | Q | moderation.enforcement:read |
| moderation.enforcement.mine | Q | moderation.enforcement:read_own |
| moderation.enforcement.expire_due (sweeper) | C | moderation.enforcement:expire (system) |
| moderation.appeal.submit | C | moderation.appeal:create |
| moderation.appeal.claim / .decide / .list | C / C / Q | moderation.appeal:review |
| moderation.appeal.mine | Q | moderation.appeal:read_own |
| moderation.spam.assess | C | moderation.spam:assess (system) |
| moderation.block.create / .remove | C | moderation.block:create / :remove |
| moderation.block.list | Q | moderation.block:read_own |
| moderation.signal.record | C | moderation.signal:record (system) |
| moderation.signal.list | Q | moderation.signal:read |
| moderation.risk.assess | Q | moderation.risk:assess (staff, system) |
| moderation.limits.mine | Q | moderation.limits:read_own |
| moderation.limits.check | Q | moderation.limits:check (system) |

## Events

`moderation.report.{submitted,merged}`, `moderation.case.{opened,escalated,claimed,assigned,released,resolved}`, `moderation.evidence.added`, `moderation.enforcement.{applied,pending_approval,approval_rejected,expired,reversed}`, `moderation.strike.threshold_reached`, `moderation.appeal.{submitted,claimed,decided}`, `moderation.spam.flagged`, `moderation.block.{created,removed}`, `moderation.signal.recorded`. Payloads carry ids and policy data only: no reason text, report details, excerpts or reporter ids. Report and block commands run under the neutral actor `moderation.anonymous`, so the event envelope does not reveal who reported or blocked.

## Collections

`moderation_reports`, `moderation_cases`, `moderation_reporter_stats`, `moderation_evidence`, `moderation_evidence_heads`, `moderation_enforcements`, `moderation_appeals`, `moderation_content_fingerprints`, `moderation_post_activity`, `moderation_blocks`, `moderation_block_index`, `moderation_signals`, `moderation_buckets`.

## Ports

Provided (wired by the relay): `blocks` (BlockPort), `risk` (RiskPort), `rateLimiter` (RateLimitPort, also `policyFor` and `available`).

Consumed (all optional, no-op defaults, see `src/ports.ts`):

- `SubjectActionsPort`: `removeContent`, `restoreContent`, `suspendAccount(accountId, until | null, reason)`, `reinstateAccount`. Called inside the decision transaction, so a failure rolls the decision back. Calls must be idempotent.
- `NotifyPort` (kernel): subject notice `moderation.action_taken`, reporter `moderation.report_closed`, appellant `moderation.appeal_decided`. Sent after commit; data holds ids, action, clause and the moderator's reason, never reporter identity.
- `SubjectOwnerPort`: `ownerOf(subjectType, subjectId)` so strikes attach to the owning account. When unresolved, the deciding moderator supplies `subjectAccountId`.
- `AccountLookup` (kernel): only for `moderation.limits.mine`.

`RecordingSubjectActions` is exported for relay wiring tests.

## Hooks for the relay

`assessContent({accountId, accountAgeMs, textHash, text})` before publishing; `recordSignal(ctx, ...)` for payment failures, lost disputes, tx hash reuse; `restrictionsOf` / `assertNotRestricted(accountId, feature)` before publishing, messaging, offers, bidding, trading; `limitFor` / `checkLimit` before accepting new work; schedule `moderation.enforcement.expire_due` with a system actor.

## Behaviour summary

- Reports: one open report per (reporter, subject), repeats merged and counted; reporters limited by the `report:` bucket (5, +1 per hour). Message reports must carry the excerpt the reporter decrypted; it is visible to staff only and only its hash enters the evidence chain.
- Cases: one active case per subject. Priority 0..100 = reason severity + volume bonus (reporter trust weighted), raised by the harassment pattern (3 distinct reporters on an account within 7 days). SLA 4 h (>=80), 24 h (>=50), 72 h; only ever tightens.
- Enforcement: dismiss, warn, remove_content, restrict, suspend, ban, each with policy clause and reason. Every non-dismiss action is a strike; strikes decay after 180 days; the third active strike marks `suspensionRecommended`. Bans and every decision on a case with a `minor_safety` report wait for approval by a different moderator.
- Appeals: the subject, once per decision, within 14 days; reviewer must not be the decider, approver or appellant; outcome upheld, overturned (reversal via port, strike and signals dropped) or modified (strictly milder replacement, not appealable).
- Risk: score = decayed signal total (half-life 30 days) x action sensitivity; allow < 40 <= challenge < 75 <= deny.
- Limits: tiers new (< 7 days), established, trusted (>= 90 days, no active strike, decayed risk < 20). Auction cap is bigint USD cents.

## Limits

Collections are scanned (no secondary indexes); the SQLite adapter should index reporter/subject/account lookups. Rate limiting assumes a single writer per store. `RiskInput.amount` is not used. Spam heuristics are exact-hash and count based. Restrictions are enforced where the relay calls `assertNotRestricted`; they are not pushed into feature packages. Blocks are not federated. Retention of stored excerpts and evidence refs is governed by F10 privacy.
