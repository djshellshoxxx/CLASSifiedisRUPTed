# PS-058-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R04, R10, R11), CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-05.R01 | Reputation actions are evaluated on the owning `acc_` of the `prf_`; `prf_` is never a principal. | MVP |
| PS-058-05.R02 | Counter fields visible to subject only. Band and status visible to public. | MVP |
| PS-058-05.R03 | Counterparty identifiers never returned by this module to any principal other than the owning module that supplied them. | MVP |
| PS-058-05.R04 | Input writes accepted only from allow-listed `sys_` principals per source. | MVP |
| PS-058-05.R05 | Moderators see band, status and review state under case grant; no counters beyond case scope needs. | MVP |
| PS-058-05.R06 | Default deny. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | subject | sys (source) | case (mod_) | never |
|---|---|---|---|---|---|
| `band`, `status` | Y | Y | Y | Y | |
| counters | | Y | | | |
| `distinct_counterparties` | | Y | | | |
| counterparty identifiers | | | owning module only | | Y otherwise |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `reputation.read_band` | any | public | band, status |
| `reputation.read_own` | `acc_` owner | self | counters and band |
| `reputation.input` | allow-listed `sys_` | source scope | write input |
| `reputation.read_case` | `mod_` | case | band, status, review state |

## States & transitions
Denied requests make no state change; decision records store outcome only.

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |

## Authorization
Relation rules derived at decision time. No grant objects stored for MVP.

## Failure, idempotency, concurrency, offline
Re-authorized each retry. Public reads may serve cached band up to 60 s old (CTR-CAP-001 R09).

## Privacy, retention, abuse
Case reads emit `aud_` with `prf_id` and purpose. Source modules' counterparty identifiers are not copied into this module's responses.

## Observability & budgets
`repute_authz_deny_total{action}`; alert on unusual rate of `reputation.read_own` by one account (scraping of own data is not a threat, but automated polling is).

## Tests
- TEST-PS-058-05-01 (unit): matrix per principal × action × field.
- TEST-PS-058-05-02 (negative): non-allow-listed `sys_` input rejected.
- TEST-PS-058-05-03 (integration): public band response has no counter fields.
- TEST-PS-058-05-04 (negative): counterparty identifier absent from all non-owner responses.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. Counters subject-only.
3. Input allow-list enforced.
4. Counterparty IDs never leaked by this module.

## Assumptions & open decisions
- ASSUMPTION: allow-list of source `sys_` principals maintained by F16.
- PROVISIONAL (D10 default, unapproved): no change to matrix from user-controlled keys in MVP.
