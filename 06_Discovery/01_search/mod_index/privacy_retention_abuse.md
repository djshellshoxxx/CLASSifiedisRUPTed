# PS-045-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R03, R04, R06, R09), CTR-FED-001 (R02, R03), CTR-ERR-001 (R06); PENDING CTR-DSC-001.

**Decision labels:** Field allowlist and cell-only location are PROVISIONAL (D05 default, unapproved). Retention is PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-07.R01 | Index documents contain no field above LOCATION_COARSE; CI check `PRV.UNCLASSIFIED_FIELD` fails on any new field. | MVP |
| PS-045-07.R02 | Deletion or withdrawal propagates to index copies within 24 h (CTR-PRV-001 R06, ASSUMPTION); target 60 s for query exclusion (PS-045-03 R04). | MVP |
| PS-045-07.R03 | Federated listings are indexed only when `federate` = true and class is PUBLIC (CTR-FED-001 R02). | Future |
| PS-045-07.R04 | Index tokens must not contain full home addresses or phone numbers; a regex-based redaction rejects tokens matching phone (E.164-like) and postal-address patterns (ASSUMPTION). | MVP |
| PS-045-07.R05 | Index docs are removed on legal hold release or deletion, whichever is later, with no retention beyond RET-ACC. | MVP |

## Data / schema
Retention class per field: index doc = same class as the source listing (`RET-ACC` for listings; ASSUMPTION). `removed` docs purged 24 h. DLQ entries RET-OPS.

## Commands / queries / events
Redaction runs inside `index.apply_event` before persistence (PS-045-04).

## States & transitions
Deletion event moves doc to `removed` (PS-045-03). Purge is a separate background job with its own audit record.

## Validation & errors
Redaction rejection counts as dropped field (PS-045-02 R07), not an error to the publisher.

## Authorization
Only `sys_` consumer reads source events; no user can query raw index docs (PS-045-05).

## Failure, idempotency, concurrency, offline
If purge fails, doc stays `removed` (not query-visible) and purge retries hourly; purge failure raises a privacy alert.

## Privacy, retention, abuse
Abuse controls: spam listings flood the index; ranking-independent rate limit on `index.apply_event` per seller `lst_` source (≤ 20 new listings per 24 h per owner, ASSUMPTION, enforced upstream by F12 rate module). Token stuffing capped at 64 tokens per doc (PS-045-01). Backups: index is excluded from backups (rebuildable), so deletions need no backup replay.

## Observability & budgets
Count of redacted tokens and dropped fields per day (aggregate only, K_MIN = 5). No title or token content in logs (CTR-PRV-001 R09).

## Tests
- TEST-PS-045-07-01 (unit): field classification check fails on added unclassified field.
- TEST-PS-045-07-02 (integration): withdraw then query → doc absent; purge job removes row within 24 h fixture clock.
- TEST-PS-045-07-03 (abuse): 1 000 spam listings with phone numbers in title are rejected or redacted.

## Acceptance criteria
1. Static field audit shows zero fields above LOCATION_COARSE.
2. Deletion fixture: zero residual rows after purge job run.
3. Redaction test suite passes with zero false negatives on the fixture set (ASSUMPTION: 200 fixtures).

## Assumptions & open decisions
- ASSUMPTION: privacy and abuse controls are design-level, not security-audited.
- D05 PROVISIONAL, D07 PROVISIONAL (see header).
