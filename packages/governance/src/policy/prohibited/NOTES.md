# F18.S01.M02 Prohibited items (PS-146)

## Implemented
- Commands: `governance.prohibited_rule.draft`, `retire`, `release_pack`, `apply_pack` (idempotent, `module: F18.S01.M02`).
- Queries: `governance.prohibited_rule.evaluate`, `get`, `list_active`.
- Event: `governance.prohibited_rule.changed` (P0). Error codes defined here: `GOVERNANCE_RULE_SCOPE_INVALID`, `_PROPOSAL_REQUIRED`, `_EMERGENCY_INVALID`, `_PACK_REJECTED`.
- Statement handler: `prohibitedDefinitions(opts).statementHandlers['classrup.governance.rule_pack/v1'](ctx, { envelope, provenance, trustPublisher? })`.
- Sweep: `expireEmergencyRules(ctx)` retires expired emergency rules and emits `emergency_expired`; the root calls it inside a command transaction every 5 minutes and at start (apply and release call it too). Evaluation ignores expired emergency rules regardless of the sweep.
- Adapter for bazaar: `readRuleSetView(tx)` plus `categoryPolicyFrom({ taxonomy, rules, now, profileIds? })` returns `(categoryId) => boolean`: taxonomy gate from F18.S01.M03 (fails closed) and no active category-only block rule covering the category for all kinds. Keyword rules are evaluated at publish via `evaluate`.
- Pure helpers: `normalizeText`, `evaluateRules`, `inScope`.
- Imports `../goods/index.ts` (category mirror, alias resolution); no other module.

## Ports the composition root must supply (`ProhibitedOptions`)
- `localPublisherId()`, `signPack(type, payload, version, previousCid)`, `verifyPack(envelope)`: as in F18.S01.M03.
- `proposalApproved(proposalId, ruleKeys): boolean | Promise<boolean>` port to F18.S02.M01 (V05); also applied on `apply_pack` for every non-emergency changed rule.
- Rate limits (600 evaluations per minute) belong to the bus `RateLimitPort` (N18); the module declares none.

## Deviations and decisions
- Untrusted publisher: pending, `ok({ applied: false, pendingReason })`; signature, size and version failures are `GOVERNANCE_RULE_PACK_REJECTED`; unknown schema version `UNSUPPORTED_SCHEMA_VERSION`.
- Rules are strict: no first-pack baseline; every non-emergency activation needs a verified proposal.
- Sensitive rules: draft keywords are plaintext only in the draft record; the released pack and every active record hold salted SHA-256 hashes of normalized phrases (`keywordHashes`, matched as token n-grams, so `whole_word` only). The publisher vault also stores only hashes after release.
- Normalization maps Cyrillic/Greek look-alikes and the digits 0,1,3,4,5,7 to letters, folds diacritics for all scripts, and does not defeat spacing evasion (honest limit, T01 of the threat table).
- Jurisdiction scope: when `jurisdictionProfileIds` is omitted on `evaluate`, only rules without jurisdiction scope apply.
- `rulesetVersion` in results is the highest applied pack version over all publishers; merging is by strictest action, one match per ruleKey.
- Consumed event `governance.category.changed` has no subscriber: category scopes are resolved through `mergedInto` at evaluation time, so no stored data needs rewriting.
- `retire` on a draft discards it (draft to retired); on an active rule it stages `retirementStaged` which `release_pack` applies; a draft for the same key supersedes the staged retirement. Nothing to release gives `PRECONDITION_FAILED`.
- More than 5 active emergency rules in a release: `GOVERNANCE_RULE_EMERGENCY_INVALID`; on apply: `GOVERNANCE_RULE_PACK_REJECTED`.
- Hardening: at most 10 pending packs, 10 trusted publishers, 20 applied packs per day; relay actors cannot apply packs.
- Retired rule versions stay stored (no purge; retention port is not available).

## Test rows
Claimed: T01, T02, T03, T05, T06, T09, T11.
Not claimed (tests for parts exist without the id): T04 (no property test over random lifecycles; lifecycle covered by examples), T08 (relay removal not implementable), T12 (rate limit is bus-level; the 100 000 code point and 2 001 rule cases are tested inside T02), T10 (chaos with failing consumer not written), T07 (needs F01.S01.M03), T13, T14, T15.
Not implemented: relay read/publish endpoints, export/import sections, deletion/retention ports (N6), metrics and the 20 ms evaluation budget measurement.

## Open questions
- Should `evaluate` apply jurisdiction-scoped rules when the caller passes no profile ids?
- Who feeds `readRuleSetView` and `readTaxonomyView` caches in the composition root (event-driven refresh)?

## Status at pause (2026-11-11)

Implemented and self-validated by the implementing agent. **Not independently reviewed:** the owner paused the project before the review, fix and verification stages ran. Re-run on the implementation commit by the integration lane: `typecheck`, `deps:check` and `spec:check` pass (0 errors); this lane's tests: 28 passed, 0 failed, 0 skipped. The module is not yet exported from the package entry point and is not wired into the PWA.
