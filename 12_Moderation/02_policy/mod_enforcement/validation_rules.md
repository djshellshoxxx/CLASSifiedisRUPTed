# PS-096-02 — Validation rules: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-02.R01** Action input is validated strictly, and rule references, facts summary and expiry are mandatory.
- **PS-096-02.R02** Role limits (moderator versus operator) and last-admin protection are checked before persistence.
- **PS-096-02.R03** Every violation maps to one stable error code.
- **PS-096-02.R04** Rule references must be versions in force at the decision time, and restricted capabilities may never include the appeal, own-action read, subject evidence read, export or deletion capabilities.
- **PS-096-02.R05** A host-policy record is accepted only for a registered source and kind (auction_review with remove_from_index), with two different moderators whose principals differ from the subject, and is not refused because the target is no longer in the relay index.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kind is allowed and ruleRefs has 1..5 rule versions that F12.S02.M03 moderation.policyrule.check_citable reports in force at the decision time | MODERATION_RULE_REQUIRED |
| V02 | factsSummary 50..2000 code points and contains no reporter identity or internal note text | VALIDATION_FAILED |
| V03 | expiresAt within limits: restrict ≤ 365 days, suspend by moderator ≤ 90 days, permanent only for operator | MODERATION_ACTION_LIMIT |
| V04 | the subject key is not the relay's last admin or operator key | MODERATION_LAST_ADMIN_PROTECTED |
| V05 | case is open or assigned and expectedRevision matches | CONFLICT_REVISION |
| V06 | decider is an assigned moderator whose principal (F07.S02.M01 key set and the relay moderator registry) is neither the case subject nor the reporter of any linked report (F12.S01.M01 moderation.report.ledger_for_case) | FORBIDDEN |
| V07 | remove_from_index targets content currently in this relay's index (F06.S01.M01); host-policy records (caseSource auction_review) are exempt and their index effect is a no-op when no document exists | NOT_FOUND |
| V08 | restrictedCapabilities lists 1..20 capabilities of this relay and none of moderation.appeal.receive, moderation.appeal.withdraw, moderation.appeal.read_status_own, moderation.action.read_own, moderation.evidence.read_as_subject or any privacy export or deletion capability | MODERATION_CAPABILITY_PROTECTED |
| V09 | a replacement for an appeal outcome reduced has a kind no more severe and an expiry no later than the contested action | VALIDATION_FAILED |
| V10 | case.open has a did:key subjectKey, a targetType in the enum (account allowed), a reason of 10..500 code points and at most 20 snapshotIds | VALIDATION_FAILED |
| V11 | case.close with outcome actioned requires at least one action on the case; no_action, duplicate and content_removed_by_owner require none to be active | CONFLICT_STATE |
| V12 | record_host_policy has source auction_review, kind remove_from_index, targetRef.type auction with a uuidv7 id, a did:key subjectKey, a hostRef, and deciderKey and proposerKey of two relay moderators whose principals (F07.S02.M01 key set) differ from each other and from the subject | VALIDATION_FAILED |
| V13 | an action targetRef has type equal to targetType and id equal to targetId, and cid, when present, is a sha256- content id | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T01 | unit | PS-096-01.R01, PS-096-01.R02, PS-096-02.R01 | apply remove_from_index with a valid in-force rule and facts | action stored with ruleRefs, target fields, statement CID and reasonsIssuedAt; case stays assigned |
| TEST-PS-096-09.T02 | unit | PS-096-02.R02, PS-096-02.R03, PS-096-02.R04 | each rule V02–V13 violated, and a citation of POL-FRAUD-001@2 before its effective date | documented error code, nothing stored, no effect on index; MODERATION_RULE_REQUIRED for the scheduled version |
| TEST-PS-096-09.T23 | abuse | PS-096-05.R05, PS-096-02.R04 | suspended key files an appeal, reads its appeal status, its own action and its evidence; apply with restrictedCapabilities containing moderation.appeal.receive or moderation.appeal.read_status_own | appeal accepted and reads allowed; MODERATION_CAPABILITY_PROTECTED for both |
| TEST-PS-096-09.T27 | integration | PS-096-01.R06, PS-096-04.R08, PS-096-02.R05, PS-096-05.R06 | F04.S02.M03 contract fixture confirms a void (seller_fraud) for auction A with no open case and for auction B with a report case open; a record whose proposer equals the decider; an HTTP request to record_host_policy | A: case opened with source auction_review and assigned to the confirming moderator, remove_from_index with targetRef { auction, A }, subject the seller, reasons statement queued, actionId returned, case resolved actioned; B: action attached to the open case; VALIDATION_FAILED; no route |
| TEST-PS-096-09.T28 | chaos | PS-096-06.R04, PS-096-02.R05 | record_host_policy retried with the same hostRef after a crash before commit and after a successful commit; the auction document already left the index at close | one action only, the retry returns the stored actionId with created false; the record is accepted without NOT_FOUND and the index effect is a no-op |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
