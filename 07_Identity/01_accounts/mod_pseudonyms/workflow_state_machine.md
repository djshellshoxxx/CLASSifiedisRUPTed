# PS-052-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, envelope), CTR-CAP-001 (R05 relation rules), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-03.R01 | `prf_` has two states: `active` (initial) and `retired` (terminal). No other state exists in MVP. | MVP |
| PS-052-03.R02 | Retirement is irreversible. A new `prf_` is required to return to use. | MVP |
| PS-052-03.R03 | Handle change keeps state `active`; old handle moves to `handle_reservations` for 90 days (ASSUMPTION). | MVP |
| PS-052-03.R04 | Retirement blocked while the `prf_` is an unresolved party to a non-terminal exchange (`trx_`, `cyc_`, `rnt_`, `auc_`, `dsp_`). Guard evaluated from owning modules' events. | MVP |
| PS-052-03.R05 | Session "active pseudonym" selection is session state, not a `prf_` state change, and emits no event. | MVP |
| PS-052-03.R06 | Account deletion retires all `prf_` of the `acc_` in one saga; R04 guard does not apply and disputes are handled by owning modules. | MVP |
| PS-052-03.R07 | Automated retirement on inactivity. | Future |

## Data / schema
State enum and `state_changed_at` per [domain_schema.md](domain_schema.md).

## Commands / queries / events
Transitions are triggered by `CreatePseudonym`, `ChangeHandle`, `RetirePseudonym`, and by account deletion (see [commands_queries_events.md](commands_queries_events.md)).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `CreatePseudonym` | R04 cap check (PS-052-02) and handle free | `active` | insert `prf`; event `pseudonym.created` |
| `active` | `ChangeHandle` | new handle free and valid | `active` | old handle to `handle_reservations`; event `pseudonym.handle_changed` |
| `active` | `RetirePseudonym` | no open participation (R04) | `retired` | handle reserved 90 days; event `pseudonym.retired`; listings and offers owned by `prf_` are closed by owning modules |
| `active` | account deletion saga | R06 | `retired` | as above; reason `account_deleted` |
| `retired` | any write | — | `retired` (reject) | `PSEUD.RETIRED_IMMUTABLE` |

## Validation & errors
| Code | Trigger | `retryable` | `message_key` |
|---|---|---|---|
| `PSEUD.RETIRED_IMMUTABLE` | write on `retired` | false | `err.pseud.retired_immutable` |
| `PSEUD.HAS_OPEN_PARTICIPATION` | R04 guard fails | true (after exchange ends) | `err.pseud.open_participation` |

## Authorization
Transitions require `pseudonym.update` or `pseudonym.retire` on `self` (PS-052-05). Saga transitions require `sys` principal with `account.delete` grant (CTR-CAP-001 R02).

## Failure, idempotency, concurrency, offline
- Each transition checks `expected_revision`; mismatch returns `EVT.REVISION_CONFLICT` (CTR-EVT-001 R02).
- Retirement is a compare-and-set on `state = active`; a second retire returns the stored result (idempotent by key).
- Participation guard reads a projection that may lag; retirement is rejected if the projection is stale beyond 5 s, with retryable error (ASSUMPTION).
- Saga step failure retries; compensation is not needed because retirement is terminal and idempotent.

## Privacy, retention, abuse
Retirement event carries `prf_id`, `reason` enum and revision only. No handle or label in the retirement event. Retired row content purged per PS-052-07.

## Observability & budgets
Metric `pseud_transition_total{from,to,event}`. Alert when `HAS_OPEN_PARTICIPATION` rate exceeds 5% of retire attempts over 1 h (ASSUMPTION; possible abuse pattern).

## Tests
- TEST-PS-052-03-01 (unit): every row in the transition table; all other pairs rejected.
- TEST-PS-052-03-02 (property): no sequence of commands leaves `retired` for `active`.
- TEST-PS-052-03-03 (integration): retirement blocked by open `trx_` fixture; allowed after terminal event.
- TEST-PS-052-03-04 (integration): account deletion saga retires all `prf_` even when one owning-module call times out.

## Acceptance criteria
1. Only the listed transitions occur; the state table is the complete set.
2. `retired` is terminal; handle reservation lasts 90 days.
3. Participation guard blocks retirement while any listed non-terminal exchange references the `prf_`.
4. Saga is idempotent under duplicate delivery.

## Assumptions & open decisions
- ASSUMPTION: 90-day handle reservation after retirement or change.
- ASSUMPTION: participation guard uses owning-module events; exact producer list resolved in PS-052-04.
- PROVISIONAL (D10 default, unapproved): no reactivation of retired pseudonyms.
