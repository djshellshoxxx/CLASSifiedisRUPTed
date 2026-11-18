# PS-056-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (R05 relation rules), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-03.R01 | Profile has two lifecycle states: `editable` (while `prf_` is `active`) and `frozen` (while `prf_` is `retired`). | MVP |
| PS-056-03.R02 | Visibility change takes effect for the next read; cached counterparty views are invalidated within 60 s (ASSUMPTION). | MVP |
| PS-056-03.R03 | Disclosure of a private field to a counterparty is a per-counterparty grant with expiry; revocation stops future reads and cannot recall copies. | MVP |
| PS-056-03.R04 | Freeze happens within one event hop of `pseudonym.retired`. | MVP |
| PS-056-03.R05 | Private block purge is a transition `frozen` → `purged` (block emptied, public block retained as tombstone). | MVP |
| PS-056-03.R06 | Reputation-linked profile badges. | Future |

## Data / schema
`profile_state` enum closed: `editable`, `frozen`, `purged`. Stored as derived from `prf_` state plus purge flag.

## Commands / queries / events
Transitions driven by `pseudonym.retired` (mod_pseudonyms), `DisclosePrivateField` and `RevokeDisclosure` commands (PS-056-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| `editable` | `pseudonym.retired` | — | `frozen` | writes rejected; event `profile.frozen` |
| `frozen` | retention job, 30 days | no legal hold | `purged` | private block cleared; event `profile.private_purged` |
| `editable` | `DisclosePrivateField` | counterparty in participant scope, field visibility `participant` | `editable` | grant row created with expiry |
| `editable` | `RevokeDisclosure` | grant exists | `editable` | grant revoked; event `profile.disclosure_revoked` |
| `frozen` / `purged` | any write | — | same | `PROF.PROFILE_FROZEN` |

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `PROF.PROFILE_FROZEN` | false | `err.prof.profile_frozen` |
| `PROF.DISCLOSURE_NOT_ALLOWED` | false | `err.prof.disclosure_not_allowed` |

## Authorization
Disclosure requires owner action plus participant relation (CTR-CAP-001 R05). Relation derived at decision time; not stored as a grant except the disclosure grant itself.

## Failure, idempotency, concurrency, offline
- Freeze is idempotent per `pseudonym.retired` event ID.
- Concurrent edit and freeze: compare-and-set on revision and `prf_` state; loser gets `PROF.PROFILE_FROZEN`.
- Purge job resumable; partial purge re-run clears remaining rows.

## Privacy, retention, abuse
Disclosure grants are PRIVATE_PERSONAL metadata; expire at the earlier of 30 days or relation end (ASSUMPTION). Purge follows RET-PRIV.

## Observability & budgets
`prof_transition_total{from,to}`; purge lag p95 ≤ 24 h after window.

## Tests
- TEST-PS-056-03-01 (unit): every row of the transition table.
- TEST-PS-056-03-02 (integration): retirement freezes profile within 1 s of event in test harness.
- TEST-PS-056-03-03 (integration): disclosure visible to participant; hidden after revocation within 60 s.
- TEST-PS-056-03-04 (property): no sequence yields a write on `frozen` or `purged`.

## Acceptance criteria
1. Transition table is complete; no other transitions exist.
2. Frozen profiles accept no writes.
3. Revocation stops reads at next decision and within the cache bound.
4. Purge verified against retention clock.

## Assumptions & open decisions
- ASSUMPTION: disclosure grants expire at 30 days or relation end.
- ASSUMPTION: cache bound 60 s.
- PROVISIONAL (D05 default, unapproved): user-initiated disclosure model.
- Consent record canonical owner ID: PENDING (duplicate slug `mod_consent`; see PS-056-05).
