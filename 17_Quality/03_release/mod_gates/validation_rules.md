# PS-143-02 — Validation rules: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-02.R01** Traceability is 100 percent: every requirement PS-NNN-PP.Rnn is covered by at least one passing test whose title starts with TEST-PS-NNN-PP.Tnn and whose spec row lists the requirement (for level manual rows, a signed checklist entry instead of a JUnit result), or by an active waiver or quarantine entry, or has a documented untested reason (CTR-TST-001 TST-4).
- **PS-143-02.R02** The audit gate fails on any critical or high production vulnerability reported by pnpm audit --prod and fails closed when the audit cannot run.
- **PS-143-02.R03** The a11y, budget and compat gates fail when any report is missing, older than 24 hours, from another commit SHA, or shows a violation, exceeded budget or compatibility failure.
- **PS-143-02.R04** The spec gate runs node tools/specgen/specgen.mjs check --strict --report for this commit and passes only with 0 errors and GO; the compat gate reads reports/compat.json for this commit and passes only when no QUALITY_COMPAT_* failure is present and every browser cell passes or is policy-unsupported, including the manual Safari and iOS checklist cells.
- **PS-143-02.R05** Manual tests count only through a signed checklist file gates/manual/<version>/<testId>.yaml with result pass, approver handle, date, device, OS and engine version, and the release commit SHA, committed with code-owner approval; it replaces JUnit only for rows with level manual, and waiver and checklist commits print their approver from git metadata.
- **PS-143-02.R06** Mapping relevance: each covers entry counts only when the test text (scenario and expected cells of the spec row plus the code test title after its ID) and the requirement text share at least one key term, where key terms are the lowercase tokens split on characters other than letters, digits and underscore, at least 4 characters long, not in the fixed stopword list tools/gates/stopwords.txt, with a trailing s, es, ed or ing removed; otherwise it counts only through an entry in gates/mapping-reviews.yaml with testId, requirementId, reviewer handle, date and the SHA-256 of both normalized texts, committed with code-owner approval; a review whose hash no longer matches is stale, and a mapping without overlap or a valid review fails with QUALITY_GATE_TRACE_MAPPING.
- **PS-143-02.R07** Governance bundles: gates/governance-bundles.yaml holds projectPublisherDid (the release-pinned project publisher did:key) and, per release version, one review entry for each of the three required bundled packs (taxonomy pack core-1, the bundled rule pack, the generic jurisdiction profile) with statement type, file path in the release commit, packCid, reviewer handle and date, committed with code-owner approval; the gate passes only when every required pack has an entry, its file exists, the recomputed cid equals the reviewed packCid, the Ed25519 signature over JCS bytes verifies (CTR-FED-001 FED-2, FED-7), and author and payload.publisherId equal projectPublisherDid; a missing manifest, entry or file fails closed.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | Every requirement has a passing test with a matching title and covers entry, or a documented untested reason | QUALITY_GATE_TRACE_GAP |
| V02 | No test ID is used twice and every test title refers to an existing requirement | QUALITY_GATE_TRACE_DUPLICATE |
| V03 | pnpm audit --prod reports zero critical and zero high findings | QUALITY_GATE_VULNERABLE |
| V04 | Audit can run and returns a result | QUALITY_GATE_AUDIT_UNAVAILABLE |
| V05 | Accessibility report shows zero serious and zero critical violations and is under 24 h old for this commit | QUALITY_GATE_A11Y |
| V06 | Load and PWA budgets from OBS-4 and OBS-5 are met in reports for this commit | QUALITY_GATE_BUDGET |
| V07 | CHANGELOG.md has a non-empty section for the release version | QUALITY_GATE_CHANGELOG |
| V08 | Waivers (gates/waivers.yaml and tests/quarantine.yaml entries) are unexpired and at most 14 days long | QUALITY_GATE_WAIVER_EXPIRED |
| V09 | node tools/specgen/specgen.mjs check --strict --report reports GO with 0 errors for this commit | QUALITY_GATE_SPEC |
| V10 | reports/compat.json for this commit shows no QUALITY_COMPAT_* failure and every browser cell passes or is policy-unsupported | QUALITY_GATE_COMPAT |
| V11 | Every waiver, quarantine, manual checklist, mapping review and governance bundle manifest commit is approved by a code owner and its approver is printed from git metadata | QUALITY_GATE_WAIVER_UNAPPROVED |
| V12 | Every level manual test row has a signed checklist entry with result pass, approver and this release commit SHA under gates/manual/<version>/ | QUALITY_GATE_MANUAL_MISSING |
| V13 | Every covers entry shares a key term between test text and requirement text or has an approved mapping review with a matching text hash in gates/mapping-reviews.yaml | QUALITY_GATE_TRACE_MAPPING |
| V14 | Each required bundled governance seed pack has a reviewed entry for this release version, a valid signature, author and publisherId equal to the release-pinned projectPublisherDid, and a cid equal to the reviewed packCid | QUALITY_GATE_GOVERNANCE_BUNDLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T02 | unit | PS-143-01.R02, PS-143-02.R01, PS-143-09.R02 | synthetic repos: gap, skipped test, duplicate ID | QUALITY_GATE_TRACE_GAP and QUALITY_GATE_TRACE_DUPLICATE; skipped test not counted |
| TEST-PS-143-09.T03 | unit | PS-143-02.R02, PS-143-09.R03 | recorded audit JSON: critical, high, moderate, unavailable | critical and high fail; moderate passes; unavailable fails closed |
| TEST-PS-143-09.T04 | unit | PS-143-02.R03, PS-143-06.R02 | a11y, load, pwa-budgets and compat reports - missing, 25 h old, other commit SHA, with violations (including INP 250 ms) | each fails with its code |
| TEST-PS-143-09.T15 | unit | PS-143-02.R04 | synthetic repo with one undefined error code, and a recorded SPEC_COMPLETENESS_REPORT.md saying NO-GO | spec gate fails with QUALITY_GATE_SPEC in both cases; the clean repo passes |
| TEST-PS-143-09.T16 | unit | PS-143-02.R04 | compat reports - QUALITY_COMPAT_BREAKING_CHANGE present, a failed automated cell, a missing manual Safari checklist cell, no compat.json at all | each fails with QUALITY_GATE_COMPAT; a clean report with a policy-unsupported cell passes |
| TEST-PS-143-09.T17 | unit | PS-143-02.R05 | a manual test row with a signed passing checklist for this commit, one with a checklist for another commit, and one without any | first counts as covered; the other two fail with QUALITY_GATE_MANUAL_MISSING |
| TEST-PS-143-09.T18 | abuse | PS-143-05.R02, PS-143-02.R05 | a waiver commit and a checklist commit without code-owner approval, then the same with approval | unapproved commits fail with QUALITY_GATE_WAIVER_UNAPPROVED naming the committer; approved ones pass and the report prints the approver from git metadata |
| TEST-PS-143-09.T19 | unit | PS-143-02.R01, PS-143-03.R03 | an active tests/quarantine.yaml entry for a failing test, then the same entry after its expiresAt | active entry listed as waived and the gate passes; expired entry fails with QUALITY_GATE_WAIVER_EXPIRED |
| TEST-PS-143-09.T20 | unit | PS-143-02.R06 | test rows covering a requirement with a shared key term, with no shared key term and no review, with no shared key term and an approved mapping review, and with a review whose text hash is stale after the requirement text changed | shared key term counts; no overlap without review and stale review fail with QUALITY_GATE_TRACE_MAPPING and do not count; approved matching review counts and is listed in the report |
| TEST-PS-143-09.T21 | unit | PS-143-02.R06 | key term extraction on texts with stopwords, short tokens, plural and ing forms, error codes and mixed case | only tokens of 4 or more characters outside tools/gates/stopwords.txt remain, case-folded and with the trailing s, es, ed or ing removed; error codes stay single tokens; same input gives the same terms |
| TEST-PS-143-09.T22 | abuse | PS-143-02.R06, PS-143-05.R02 | mapping review commit without code-owner approval, then the same review with approval | unapproved review fails with QUALITY_GATE_WAIVER_UNAPPROVED and the mapping is not counted; approved review counts and its approver is printed from git metadata |
| TEST-PS-143-09.T23 | unit | PS-143-02.R07 | governance bundle fixtures: three packs signed by KP with reviewed cids, rule pack edited after review, generic profile signed by KD, broken signature, manifest without the release review entry, manifest listing two packs, no manifest | clean set passes and the report lists each pack with its cid and reviewer; every other case fails with QUALITY_GATE_GOVERNANCE_BUNDLE, the missing manifest, entry and pack cases with exit 2 |
| TEST-PS-143-09.T24 | abuse | PS-143-02.R07, PS-143-05.R02 | a commit changing projectPublisherDid to KD and re-recording the review entries without code-owner approval, then the same commit with approval | unapproved commit fails with QUALITY_GATE_WAIVER_UNAPPROVED naming the committer and the packs are not accepted; the approved commit is printed with its approver from git metadata |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03, CTR-FED-001, F18.S01.M01, F18.S01.M02, F18.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
