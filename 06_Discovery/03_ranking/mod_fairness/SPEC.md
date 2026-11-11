# F06.S03.M02 — Ranking fairness

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S03](../SPEC.md). **Process IDs:** PS-050-01…PS-050-10. **Code:** `packages/discovery/src/ranking/fairness`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Pure re-ranking library applied after relevance scoring, identically in the vault and on a relay. It limits any one author to 3 results per page, reserves exposure slots for newly seen authors, caps promoted results at 20 percent of a page, and attaches to every result an explanation made of localizable message keys. It works over sliding candidate windows of 200 that cover the full query depth of 500, carrying deferred results from one window into the next so no result is dropped. It also provides auditPage, which a vault runs on every relay page to check the same rules, because a relay's ranking is only that relay's claim. It is deterministic and uses only public document fields and local first-seen times; it cannot see user identity, history or protected attributes.

## Responsibilities

- Re-rank scored candidate windows of 200 results (window starts 0, 200 and 400, covering query depth 500) into pages of 20 (limit 1..50) with a maximum of 3 results per author per page, carrying results deferred by the caps from window n into window n+1 through carry state stored in the caller's cursor as a bitmap of deferred window positions (at most 200 bits) resolved against the 15-minute query snapshot.
- Reserve 2 exposure slots per 20-result page for new authors (first seen locally less than 30 days ago) when candidates with a score of at least 50 percent of the page's top score exist.
- Enforce that promoted results are at most floor(20 percent of page size), each labelled 'Promoted', and demote excess promoted results to the next page.
- Produce an explanation per result - ordered message keys with parameters such as text match, posted age, distance bucket, promoted, new author slot - never free text.
- Accept promoted candidates only when pageParams.promotionEnabled is true (always false for a vault's own ranking) and otherwise refuse with FAIRNESS_PROMOTION_NOT_ALLOWED.
- Provide auditPage(page, constants) so a vault can check a relay page (at most 3 per author, promoted at most floor(20 percent), every promoted item labelled) and label a relay that breaks the rules.

## Not responsible for

- Scoring and configuration (F06.S03.M01).
- Persisting any state; cursors carry the window position and the carry set (F06.S01.M02, F06.S02.M03).
- Judging author trustworthiness or reputation; reputation is not an input in MVP.
- Future: seller-size neutral exposure experiments, category-level diversity, reputation-aware exposure with Sybil dampening.

## User stories

- As a buyer, my first page is not filled by one prolific seller's items.
- As a new seller, my good listing gets a fair chance to appear on a results page.
- As a buyer, I can see why a result is shown, including whether it is promoted or a new-author slot.
- As a relay operator, I know promotion sold on my relay can never exceed one fifth of a page.

## Edge cases

- Only one author has matching items; the 3 per page cap would leave pages short, so the cap relaxes only when fewer than 20 items from other authors remain, and the explanation states 'only seller available'.
- Candidate window has fewer than 20 items; the page is returned as is, no filler.
- There are no qualifying new-author candidates; reserved slots are released to normal ranking, never filled with low-score items.
- A promoted item is also a new-author item; it counts once for the promoted cap and the slot is not consumed.
- Many accounts are created by one person to game the new-author slots; the library cannot detect it and the spec states the limit; slots are 2 per page and bounded by the 50 percent score threshold.
- Page size 7; promoted cap is floor(1.4) = 1 and new-author slots are 1 (at least 1 for pages of 5 or more).
- Two results tie on score and author; order falls back to the newer recency anchor then the lexicographically smaller projectionCid, never random and never a locally generated documentId.
- An author-capped or promoted result is pushed past the end of window 0; it is carried into window 200 and appears on a later page, never dropped.
- A promoted flag is supplied while promotionEnabled is false; rerank returns FAIRNESS_PROMOTION_NOT_ALLOWED and no page.
- A relay page has 5 results of one author; auditPage reports max_per_author and the vault labels the relay 'ranking policy not followed'.

## UX and accessibility



Library module. The search screen (F06.S01.M02) renders the explanation keys as localized text and shows a 'Promoted' label and a 'New seller' label as text badges.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-050-01 | [Domain schema](domain_schema.md) | 3 |
| PS-050-02 | [Validation rules](validation_rules.md) | 3 |
| PS-050-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-050-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-050-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-050-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-050-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-050-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-050-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-050-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/ranking/fairness/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI (T15 is a release checklist item).
- Constraint properties hold on 10 000 random corpora (nightly).
- Explanation keys exist in every shipped locale catalog (i18n coverage test).
