# PS-111-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-05. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F07 identity and F16 security per [dependency matrix](../../../DEPENDENCY_MATRIX.md); capability model per CTR-CAP-001 (owner F16 with F07).

## Purpose and scope
**Business outcome:** each action on a WCAG record is allowed only for the actor role that owns it, with a second actor for waivers. A revoked role stops working within a bounded time.

**Exclusions:** authentication mechanics and credential storage (F07); the capability registry and its UI (F16); end-user permissions for the ClassRup product itself (no end user has any action in this module).

## Requirements
- PS-111-05.R01 — Outcome and actors as stated above.
- PS-111-05.R02 — Adversarial cases covered: forged `release_bot` token, reviewer approving own waiver, requester replaying approval, IDOR on `check_run_id` or `finding_id`, revoked role writing during an in-flight batch, actor ID spoofed in body.
- PS-111-05.R03 — Budget: capability check adds under 10 ms p95 per request.
- PS-111-05.R04 — Actor definitions.
- PS-111-05.R05 — Capability matrix (actor x action).
- PS-111-05.R06 — Separation of duties.
- PS-111-05.R07 — Revocation and token lifetime.

## Actors
| Actor | Identity | Notes |
|---|---|---|
| `release_bot` | Service identity from F07, one per CI environment | Writes automated results; never a reviewer |
| `a11y_reviewer` | Human account with reviewer role | Confirms manual results, approves waivers |
| `release_manager` | Human account with release role | Requests waivers, reads gate, cancels runs |
| `operator` | Human account with platform role | Configures profiles; no review rights |
| `auditor` | Human account, read-only | Reads everything except note text of waivers marked restricted |
| `anonymous` | No credential | Denied everywhere in this module |

## Capabilities
Names follow CTR-CAP-001 form `<module>.<resource>.<verb>`:
`wcag.profile.read`, `wcag.profile.write`, `wcag.criteria.read`, `wcag.run.start`, `wcag.run.write_results`, `wcag.run.complete`, `wcag.run.cancel`, `wcag.finding.review`, `wcag.waiver.request`, `wcag.waiver.approve`, `wcag.waiver.revoke`, `wcag.gate.read`, `wcag.audit.read`.

## Capability matrix (actor x action x resource)
Legend: `Y` allowed, `Y*` allowed only on resources the actor created or owns, `N` denied, `2P` allowed only when a second distinct actor approves.

| Action (capability) | Resource | release_bot | a11y_reviewer | release_manager | operator | auditor | anonymous |
|---|---|---|---|---|---|---|---|
| read profile (`wcag.profile.read`) | wcag_profile | N | Y | Y | Y | Y | N |
| write profile (`wcag.profile.write`) | wcag_profile | N | N | N | Y | N | N |
| read criteria (`wcag.criteria.read`) | wcag_criterion | Y | Y | Y | Y | Y | N |
| start run (`wcag.run.start`) | wcag_check_run | Y | Y | Y | N | N | N |
| write results (`wcag.run.write_results`) | wcag_finding | Y* | Y | N | N | N | N |
| complete run (`wcag.run.complete`) | wcag_check_run | Y* | Y | N | N | N | N |
| cancel run (`wcag.run.cancel`) | wcag_check_run | N | N | Y | Y | N | N |
| review finding (`wcag.finding.review`) | wcag_finding | N | Y | N | N | N | N |
| request waiver (`wcag.waiver.request`) | wcag_waiver | N | Y | Y | N | N | N |
| approve waiver (`wcag.waiver.approve`) | wcag_waiver | N | 2P | N | N | N | N |
| revoke waiver (`wcag.waiver.revoke`) | wcag_waiver | N | Y | Y | Y | N | N |
| read gate (`wcag.gate.read`) | wcag_gate (derived) | Y | Y | Y | Y | Y | N |
| read audit export (`wcag.audit.read`) | all | N | N | N | N | Y | N |

`Y*` for `release_bot` means the run's `release_bot` identity matches the one that started the run. Human reviewers may write results for any run in MANUAL or MIXED method.

## Separation of duties
- Waiver approver must differ from the requester (`WCAG_WAIVER_SELF_APPROVAL`).
- Waiver approver must hold `wcag.waiver.approve`. Only `a11y_reviewer` holds it, so a `release_manager` request is always approved by a reviewer.
- A finding confirmed by a human must name a reviewer that is not the `release_bot` identity.
- No actor can both start a run and complete a run that it did not start, unless it holds the reviewer role.

## Scope and tenancy
- All actors see records for all `scope_key` values in MVP. Scope partitioning is future work (see Open decisions).
- `check_run_id`, `finding_id` and `waiver_id` checks happen after the capability check. A denied actor gets `WCAG_CAPABILITY_DENIED` regardless of whether the ID exists, so IDs cannot be probed.

## Revocation
- Access tokens last at most 15 minutes. Capability checks use the current role grant from F16 with a cache of at most 60 seconds.
- A revoked role is rejected at commit time as well as at request time, so a batch in flight cannot write after revocation. The batch is rolled back with `WCAG_CAPABILITY_DENIED`.
- Revoking a `release_bot` identity does not delete its past rows. Its open RUNNING runs move to FAILED with reason `tool_error` after the sweeper timeout.

## Adversarial cases
- Forged bot token: rejected by F07 signature check before this module runs.
- Body contains `reviewer_actor_id` of another person: the reviewer field must equal the authenticated actor for `finding.review`, else `WCAG_CAPABILITY_DENIED`.
- Approver replays a previously approved request: rejected by the idempotency key and by the single-use request ticket (A-wcag-08).
- Probing IDs by enumeration: all reads of non-visible records return `WCAG_CAPABILITY_DENIED` with constant timing budget (no early exit that differs by existence).

## Open decisions
- A-wcag-08: waiver approval uses two distinct actors, single-use request tickets and a 90 day maximum expiry. Ticket format owned by F16 and not yet published.
- A-wcag-15: scope partitioning per `scope_key` for reviewers is deferred. MVP assumes all reviewers can see all scopes.

## Testing expectations
- Matrix tests `TEST-PS-111-05-T01` to `TEST-PS-111-05-T06`: one test per row group (profile, run, finding, waiver, gate, audit) plus separation-of-duties and revocation tests. Defined in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).

## Acceptance criteria
- Every cell in the matrix has a test that asserts the allowed or denied result.
- Revoked role is denied within 60 seconds in a test environment.
- No response reveals whether a hidden record exists.
