# PS-145-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-145-03. **Owner:** [18_Governance/01_policy/mod_jurisdictions](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_jurisdictions. **Consumers:** mod_prohibited, mod_goods, 01_LocalBazaar/01_listings/mod_publish, 06_Discovery, 11_Federation, 12_Moderation (see A-jurisdictions-17).

## Purpose and scope
Define the lifecycle of a jurisdiction revision: who may move it, what must be true first, what happens on timers, and which states are terminal. Every transition is explicit, authorized, audited and recoverable. There is no implied activation: nothing takes effect until the activation job runs at `effective_from`. Do not assume implementation or successful external settlement.

## Requirements to specify
- PS-145-03.R01: Business outcome: a jurisdiction change moves through draft, four-eyes review, scheduled activation and supersession, and every state is visible to the operator console. Exclusions: no automatic creation of jurisdictions; no change to rule content; no retroactive effect on past resolutions.
- PS-145-03.R02: Cases: normal path (DRAFT, PENDING_REVIEW, APPROVED, ACTIVE, SUPERSEDED); invalid transitions (approve from DRAFT, submit from APPROVED); expired (PENDING_REVIEW older than 14 days); duplicate (second submit of the same revision); concurrent (approve racing withdraw; activation racing withdraw; two drafts for one jurisdiction); offline (no client-side state transitions); adversarial (self-approval, approval by a revoked capability, approval after ruleset deactivation).
- PS-145-03.R03: Accessibility and budgets: state labels in the operator console are text, not colour alone, and are localized via state keys. Transition commands complete within the command budget in the observability file (300 ms p95). Activation lag from effective_from to ACTIVE is at most 60 s p95 (A-jurisdictions-10).
- PS-145-03.R04: Single writer: every transition takes a row lock on the parent `jurisdiction` row, checks the current state and `expected_row_version`, then writes the revision change, `governance_event` and outbox row in one transaction.
- PS-145-03.R05: Four-eyes: the approver must hold the approve capability and must differ from the submitter. RETIREMENT and EMERGENCY_CORRECTION approvals require the policy_owner role.
- PS-145-03.R06: Terminal states and retirement: REJECTED, WITHDRAWN, SUPERSEDED and RETIRED are terminal for the revision. A RETIRED jurisdiction accepts no new revisions (JURISDICTIONS_RETIRED).
- PS-145-03.R07: Derived jurisdiction status (read model only, not stored): DRAFT_ONLY (no ACTIVE revision and an open revision exists), SCHEDULED (APPROVED revision with future effective_from), IN_FORCE (ACTIVE revision covers now), RETIRED (retired_at set), NOT_YET_IN_FORCE (no revision has reached ACTIVE).

## State table: jurisdiction_revision
| State | Entry event | Allowed transitions (command or job) | Guard for each transition | Terminal |
|---|---|---|---|---|
| DRAFT | `create_draft` (new revision_no), `return_revision` from PENDING_REVIEW, `expire_review` job | submit to PENDING_REVIEW; withdraw to WITHDRAWN | submit: validation passes; actor holds submit capability; no other open revision for this jurisdiction; jurisdiction not RETIRED | no |
| PENDING_REVIEW | `submit_revision` | approve to APPROVED; reject to REJECTED; return to DRAFT; withdraw to WITHDRAWN; expire to DRAFT (job) | approve: actor != submitted_by; actor holds approve capability; validation and ruleset check re-run; lead time and overlap rules hold; reject and return require reason_code | no |
| REJECTED | `reject_revision` | none | none | yes |
| WITHDRAWN | `withdraw_revision` from DRAFT, PENDING_REVIEW or APPROVED; `activation_blocked` job | none | withdraw from APPROVED only while server time < effective_from | yes |
| APPROVED | `approve_revision` | activate (job) to ACTIVE or RETIRED; withdraw to WITHDRAWN; activation_blocked (job) to WITHDRAWN | activate: state still APPROVED, server time >= effective_from, ruleset refs still ACTIVE; activation_blocked: ruleset ref no longer ACTIVE at activation time | no |
| ACTIVE | activation job (non-RETIREMENT revision) | supersede to SUPERSEDED (performed by the activation of the successor) | successor activation sets this revision's effective_until to successor effective_from in the same transaction | no |
| SUPERSEDED | successor activation | none | none | yes |
| RETIRED | activation job for a RETIREMENT revision | none | sets jurisdiction.retired_at = effective_from; previous ACTIVE revision goes to SUPERSEDED in the same transaction | yes |

Note: a RETIREMENT revision never passes through ACTIVE; it activates directly into RETIRED (A-jurisdictions-09). Its `region_codes` is empty, so after retirement the jurisdiction matches no region.

## Transition commands and events
| From | To | Command or job | Emitted event |
|---|---|---|---|
| (none) | DRAFT | jurisdiction.create_draft | jurisdiction.created (new profile) and jurisdiction.revision_drafted |
| DRAFT | PENDING_REVIEW | jurisdiction.submit_revision | jurisdiction.revision_submitted |
| PENDING_REVIEW | APPROVED | jurisdiction.approve_revision | jurisdiction.revision_approved |
| PENDING_REVIEW | REJECTED | jurisdiction.reject_revision | jurisdiction.revision_rejected |
| PENDING_REVIEW | DRAFT | jurisdiction.return_revision | jurisdiction.revision_returned |
| PENDING_REVIEW | DRAFT | expire_review job | jurisdiction.revision_expired |
| DRAFT, PENDING_REVIEW, APPROVED | WITHDRAWN | jurisdiction.withdraw_revision | jurisdiction.revision_withdrawn |
| APPROVED | ACTIVE, SUPERSEDED (prior) | activation job | jurisdiction.revision_activated, jurisdiction.revision_superseded, jurisdiction.coverage_changed (when region_codes differ) |
| APPROVED | RETIRED, SUPERSEDED (prior) | activation job (RETIREMENT) | jurisdiction.revision_activated, jurisdiction.revision_superseded, jurisdiction.retired |
| APPROVED | WITHDRAWN | activation job (ruleset not ACTIVE) | jurisdiction.activation_blocked |

Full command signatures and event payloads are in commands_queries_events.md.

## Timers and jobs
- Lead time: approve rejects effective_from < approval time + 24 h (normal) or + 1 h (EMERGENCY_CORRECTION) (A-jurisdictions-06).
- Review expiry: a PENDING_REVIEW revision older than 14 days returns to DRAFT with reason EXPIRED_REVIEW (A-jurisdictions-07). The job runs every 15 minutes.
- Activation job: runs every 30 seconds on the F15 scheduler (A-jurisdictions-10). Selects APPROVED revisions with effective_from <= server time, processes each in its own transaction in ascending effective_from order, and is idempotent: the update is conditional on state = APPROVED and row_version.
- Activation alarm: any APPROVED revision still unprocessed 300 s after effective_from raises an operator alert.

## Concurrency rules
- Two open revisions for one jurisdiction cannot exist (partial unique index). A second create_draft returns JURISDICTIONS_STATE_CONFLICT.
- Withdraw and activation both take the jurisdiction row lock. If activation commits first, a later withdraw returns JURISDICTIONS_STATE_CONFLICT; if withdraw commits first, the activation job finds no APPROVED revision and does nothing.
- Approve and reject racing on the same revision: the second writer sees a changed row_version and gets JURISDICTIONS_REVISION_STALE.

## Preconditions, postconditions and compensation
- Preconditions for ACTIVE: APPROVED, effective_from reached, ruleset refs ACTIVE in owner modules, no concurrent open revision that would violate ordering.
- Postconditions: exactly one ACTIVE revision per jurisdiction at any instant; the successor's effective_from is strictly after the predecessor's.
- Compensation: none automatic for ACTIVE. Mistaken activation is corrected by a new revision (EMERGENCY_CORRECTION or RULESET_UPDATE). Activation is never rolled back in place.
- Consent and revocation: no participant consent is involved. Revoking a drafter's capability blocks further submits; open DRAFT revisions remain and can be withdrawn by the owner.

## Open decisions
- A-jurisdictions-06: Lead time of 24 h for normal changes and 1 h for emergency corrections. Alternative: 72 h. Owner: policy_owner.
- A-jurisdictions-07: PENDING_REVIEW expires to DRAFT after 14 days, non-destructively.
- A-jurisdictions-09: Retirement is a revision with empty region_codes that activates into RETIRED.
- A-jurisdictions-10: Activation is driven by the F15 scheduler at 30 s cadence; activation lag budget is 60 s p95.
- Cross-reference: A-jurisdictions-17 (consumers) and D04 (partial execution, not applicable to this module but retained as a platform rule) in [DECISIONS.md](../../../DECISIONS.md).

## Acceptance criteria
- [ ] Every row of the state table is exercised by a transition test (TEST-PS-145-03-T01 to T06).
- [ ] Property test: no sequence of generated commands yields two ACTIVE revisions for one jurisdiction with overlapping windows (TEST-PS-145-03-T04).
- [ ] Security and architecture review approval (future gate).
