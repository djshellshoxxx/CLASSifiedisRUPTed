# PS-112-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-05. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); capability vocabulary follows CTR-CAP-001 (owner F16 with F07).

## Purpose and scope
Defines who may perform which action on which currencies resource. Business outcome: catalog and FX data are changed only by operators or allowlisted importers; valuation pins and conversions are visible only to the parties of the subject and to explicitly ticketed auditors; display preferences are visible only to their owner. Exclusions: identity proofing, party membership of a subject (owned by the subject module), and authentication mechanics (owned by F07).

## Requirements
- PS-112-05.R01: Every command and query is checked against the matrix below before any read of a restricted row or any write. Actors: public, participant, subject-owning service, FX importer service, operator, auditor, scheduler.
- PS-112-05.R02: Unauthorized and unknown subject references produce the same response, CURRENCIES_PERMISSION_DENIED, so that callers cannot enumerate subjects.
- PS-112-05.R03: Capability checks are evaluated per request. Accessibility of error text follows validation_rules.md; no authorization error reveals which capability is missing.
- PS-112-05.R04: Operator dual control: any action on a DISABLED code re-enable, any outlier override, and any import with more than 50 quotes requires two distinct operator refs.
- PS-112-05.R05: Resource-scoped conditions (C-PARTY, C-SELF, C-TICKET) are evaluated against the owning module's answer, not against a copy held here.
- PS-112-05.R06: Revocation takes effect for writes within 5 s and for cached reads within 60 s (A-currencies-11).

## Actors
| Code | Actor | Typical principal |
|---|---|---|
| PUB | Public, unauthenticated or any authenticated user reading public data | anonymous client |
| PART | Participant (pseudonymous user) | user_ref from F07 |
| SVC_SUBJ | Subject-owning service (listings, proposals, cycles) | service principal |
| SVC_FX | FX importer, allowlisted sources only | service principal |
| OPS | Currency operator | operator principal with dual control |
| AUD | Auditor, read-only evidence, ticket required | auditor principal |
| SCH | Scheduler (expiry sweeps, invalidation jobs) | internal principal |

## Permission matrix
Legend: `Y` allowed; `N` denied; `C-PARTY` allowed only if the caller is a party to the subject, confirmed by the subject module; `C-SELF` allowed only for the caller's own `user_ref`; `C-TICKET` allowed only with an auditor ticket reference and reason code, logged; `SCH` means scheduler principal only.

| Action | Resource | PUB | PART | SVC_SUBJ | SVC_FX | OPS | AUD | SCH |
|---|---|---|---|---|---|---|---|---|
| Read catalog | currency_definition | Y | Y | Y | Y | Y | Y | N |
| Register or change status | currency_definition | N | N | N | N | Y (dual control on re-enable) | N | N |
| Import or export catalog | currency_definition | N | N | N | N | Y | N | N |
| Read active quote | fx_quote | Y | Y | Y | Y | Y | Y | N |
| Publish quote | fx_quote | N | N | N | Y (allowlisted source) | Y | N | N |
| Withdraw quote | fx_quote | N | N | N | N | Y | N | N |
| Expire quote | fx_quote | N | N | N | N | N | N | Y |
| Pin | valuation_pin | N | N | Y | N | N | N | N |
| Read pin | valuation_pin | N | C-PARTY | Y | N | N | C-TICKET | N |
| Release pin | valuation_pin | N | N | Y | N | N | N | N |
| Invalidate pin (quote withdrawn) | valuation_pin | N | N | N | N | N | N | Y |
| Expire pin | valuation_pin | N | N | N | N | N | N | Y |
| Convert and record | conversion_record | N | N | Y | N | N | N | N |
| Read or list conversions | conversion_record | N | C-PARTY | Y | N | N | C-TICKET | N |
| Read preference | display_preference | N | C-SELF | N | N | N | N | N |
| Set preference | display_preference | N | C-SELF | N | N | N | N | N |
| Run quote import | fx_quote | N | N | N | Y | Y (second approver above 50 rows) | N | N |

Notes:
- OPS may not read conversion records or preferences. Operational visibility uses aggregates from observability_performance.md.
- SVC_SUBJ may act only on subjects of its own type (LISTING, PROPOSAL or CYCLE, per its registration); a cross-type call is denied.
- SVC_FX cannot withdraw quotes and cannot approve its own outlier override.

## Capability names (provisional, CTR-CAP-001)
| Capability | Grants |
|---|---|
| `currencies.catalog.read` | Read catalog (public set is granted to PUB by default) |
| `currencies.catalog.admin` | Register, set status, catalog import and export |
| `currencies.fx.read` | Read quotes (public by default) |
| `currencies.fx.publish` | Publish quotes from allowlisted sources |
| `currencies.fx.withdraw` | Withdraw quotes |
| `currencies.valuation.pin` | Pin and release on own subject type |
| `currencies.valuation.convert` | Convert against own pins |
| `currencies.evidence.read` | Read pins and conversions (C-PARTY or C-TICKET) |
| `currencies.preference.manage` | Read and set own preference |
| `currencies.override.approve` | Second approval for outlier override or dual-control action |

## Checks in order
1. Authenticate (F07). Failure gives CURRENCIES_UNAUTHENTICATED.
2. Capability present for the action (table above). Failure gives CURRENCIES_PERMISSION_DENIED.
3. Resource condition (C-PARTY, C-SELF, C-TICKET) evaluated through the owning module. Unknown or unauthorized subject gives the same CURRENCIES_PERMISSION_DENIED.
4. Dual control, where required, checks that the second approver's `actor_ref` differs from the initiator's.
5. Business validation (validation_rules.md).

## Revocation and staleness
- Writes re-check capabilities on every request. A revoked importer or operator principal fails within 5 s.
- Reads may use a capability cache up to 60 s old.
- Emergency kill switch: an operator can disable a `source_id` in one action; publish from that source fails within 5 s.
- In-flight commands complete or fail with CURRENCIES_PERMISSION_DENIED; they do not partially apply (see failure_recovery_idempotency.md).

## Open decisions
- A-currencies-11: Capability names above are provisional until CTR-CAP-001 is approved by F16 with F07. Mapping changes must not change the matrix.
- Related: D10 (user-controlled keys and recovery affect how PART and OPS principals are issued), D07 (retention of auditor-visible evidence).
