# PS-145-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-09.R01 | Every published rule has a source reference and an approver distinct from the proposer. | MVP |
| PS-145-09.R02 | Region fields reject precision beyond approved granularity. | MVP |

## Tests
- TEST-PS-145-09-01 (unit): coordinate-like value in region field → JURIS.PRECISION_FIELD_FORBIDDEN.
- TEST-PS-145-09-02 (negative): proposer publishes own rule → SYS.FORBIDDEN.
- TEST-PS-145-09-03 (integration): rule effective on a future date is not applied before that date.
- TEST-PS-145-09-04 (contract): event payloads match CTR-EVT-001 envelope.
- TEST-PS-145-09-05 (lint): JURIS codes pass CTR-ERR-001 registry lint.

## Acceptance criteria
1. All TEST-PS-145-09-01 to -05 pass.
2. No stored field contains point location or postal code.

## Assumptions & open decisions
- ASSUMPTION: test rules are synthetic and not legal content.
- D05 default: PROVISIONAL (D05 default, unapproved).
