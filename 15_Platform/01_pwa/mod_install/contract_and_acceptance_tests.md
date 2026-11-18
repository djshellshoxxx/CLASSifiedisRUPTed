# PS-115-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_install. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-115-09.R01 | Contract tests cover manifest fields, icon sizes and the INSTALL message keys. | MVP |
| PS-115-09.R02 | Install control is a native button with visible text "Install app" (localized) and focus returns to it after the dialog closes. | MVP |
| PS-115-09.R03 | iOS instructions are a numbered list with text, not only images; images have alt text. | MVP |
| PS-115-09.R04 | Browser matrix: Chromium (prompt path), Safari iOS (instructions path), Firefox (no prompt, no control). | MVP |

## Data / schema
Fixtures: manifest variants (missing field), icon sizes, simulated prompt event, iOS user agent, private-mode storage.

## Commands / queries / events
Not applicable beyond local operations.

## States & transitions
All rows of workflow_state_machine.

## Validation & errors
One failing fixture per PS-115-02 rule.

## Authorization
Permission non-request fixture (PS-115-05).

## Failure, idempotency, concurrency, offline
Fault fixtures from PS-115-06.

## Privacy, retention, abuse
Network scan and no-fingerprint scan (PS-115-07).

## Observability & budgets
Suite ≤ 10 min.

## Tests
- TEST-PS-115-09-01 (contract): manifest and icon checks.
- TEST-PS-115-09-02 (e2e): Chromium install path with simulated prompt.
- TEST-PS-115-09-03 (a11y): keyboard path and focus return; iOS instruction list semantics.
- TEST-PS-115-09-04 (integration): update notice and draft guard.

## Acceptance criteria
1. Contract suite green.
2. Browser matrix run before MVP gate (not yet run).
3. Accessibility checks pass.

## Assumptions & open decisions
- ASSUMPTION: Firefox shows no install control.
- No Dxx blocks test scope.
