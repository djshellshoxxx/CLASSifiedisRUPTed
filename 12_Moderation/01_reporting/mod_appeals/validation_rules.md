# PS-092-02 — Validation rules: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-02.R01** Appeal input is validated strictly and the appellant must be the subject of the contested action.
- **PS-092-02.R02** The 30-day window is computed from the relay-signed statement of reasons time, never from the appellant's clock.
- **PS-092-02.R03** Decisions require a reviewer whose principal differs from the decider, the subject and every reporter of linked reports, a reasoned text and at least one policy rule ID.
- **PS-092-02.R04** The relay accepts an appeal only when its signed relayId is the receiving relay, and deduplicates appealId for as long as it retains the appeal.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement length 20..2000 code points, at most 3 attachments of at most 5 MiB, no unknown fields | VALIDATION_FAILED |
| V02 | appellantKey equals the subject key of the action and a verified statement of reasons exists | NOT_FOUND |
| V03 | the relay's receive time of the first delivery is ≤ deadlineAt (reasonsIssuedAt + 30 days on the relay clock); the appellant's createdAt is ignored | MODERATION_APPEAL_WINDOW_CLOSED |
| V04 | no appeal with a different appealId exists for the action | MODERATION_APPEAL_DUPLICATE |
| V05 | the reviewer's principal (F07.S02.M01 identity.portable_doc.key_set and find_by_key, relay moderator registry) differs from the decider's and the subject's principal and from every reporter in F12.S01.M01 moderation.report.ledger_for_case | MODERATION_APPEAL_REVIEWER_CONFLICT |
| V06 | decision reasons 50..2000 code points and at least one decisionRuleId that F12.S02.M03 moderation.policyrule.check_citable reports in force at the decision time | VALIDATION_FAILED |
| V07 | the signature on the appeal or withdrawal statement verifies against appellantKey | FORBIDDEN |
| V08 | reducedTo has a kind no more severe than the contested action, an expiresAt no later than its expiry, restrictedCapabilities that are a subset of its own and none of the capabilities protected by F12.S02.M01 V08 | VALIDATION_FAILED |
| V09 | receive side: the signed relayId equals the receiving relay DID | FORBIDDEN |
| V10 | receive side: an appealId already held with a different statementDigest is refused; the same digest returns the stored receipt | IDEMPOTENCY_KEY_REUSED |
| V11 | reassign targets an appeal in_review whose reviewer was unassigned by an operator, lost the moderator role or passed the day-10 escalation, and any named new reviewer passes V05 | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T02 | unit | PS-092-02.R01, PS-092-02.R02, PS-092-02.R03 | unknown field; relay receives on day 30 and day 31; arrival on day 32 with createdAt backdated to day 29; duplicate; reviewer conflict; short reasons | VALIDATION_FAILED; accepted on day 30; MODERATION_APPEAL_WINDOW_CLOSED for day 31 and for the backdated day-32 arrival; documented error codes otherwise |
| TEST-PS-092-09.T18 | abuse | PS-092-05.R04, PS-092-02.R03 | assign M1 via second key K1b; assign M3 who filed report R; assign a moderator whose key set lists the subject's key | MODERATION_APPEAL_REVIEWER_CONFLICT in each case; M2 assigned |
| TEST-PS-092-09.T21 | integration | PS-092-02.R04, PS-092-06.R04 | first delivery on day 29 with the receipt lost and a retry on day 32; same appealId with a changed digest; appeal forwarded to relay Y | stored receipt returned on day 32; IDEMPOTENCY_KEY_REUSED; relay Y refuses with FORBIDDEN |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M01, F12.S01.M02, F12.S02.M03, F07.S02.M01, F08.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
