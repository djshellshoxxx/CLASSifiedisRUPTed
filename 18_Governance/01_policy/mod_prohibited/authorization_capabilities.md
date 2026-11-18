# PS-146-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-05. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [12_Moderation](../../../12_Moderation). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-05.R01: Business outcome. Every action on catalogue, decision, hold and evidence records is allowed only for an actor holding the named capability on that resource, with separation of duties between authoring, approving and reviewing. Participants can learn why their subject was held without learning how the rule matches.
- Exclusions: identity proofing and credential issuance (F07); capability registry, revocation and role assignment (CTR-CAP-001, owner F16 with F07). This spec consumes those and does not define them.
- Assumption A-prohibited-03: capability names below are module-proposed for CTR-CAP-001 and are not yet registered.

## Actors
| Code | Actor | Identified by |
|---|---|---|
| P | Participant (subject owner) | account credential; subject ownership checked by owner service and passed as `owner_actor_id` in snapshot only for display |
| S | Owner service principal | service credential bound to `caller_service_id` |
| A | Policy author | role grant `prohibited.policy.author` |
| V | Approver | role grant `prohibited.policy.approver`; never the same actor as author for one version |
| R | Reviewer | role grant `prohibited.hold.reviewer` |
| D | Auditor | role grant `prohibited.audit.reader` |
| X | Anonymous | no credential |

## Capability matrix (actor x action x resource)
| Action | Resource | P | S | A | V | R | D | X |
|---|---|---|---|---|---|---|---|---|
| Read public policy summary | PolicyVersion (ACTIVE) | Y | Y | Y | Y | Y | Y | Y |
| Read version metadata | PolicyVersion | N | N | Y | Y | Y | Y | N |
| Create EDITING version | PolicyVersion | N | N | Y | N | N | N | N |
| Edit EDITING version | PolicyVersion | N | N | Y (author only) | N | N | N | N |
| Approve version | PolicyVersion | N | N | N | Y (not author) | N | N | N |
| Discard EDITING version | PolicyVersion | N | N | Y (author only) | N | N | N | N |
| Read internal rules (terms, flags) | ProhibitionRule | N | N | Y | Y | Y | N | N |
| Evaluate subject | PolicyDecision | N | Y (own service) | N | N | N | N | N |
| Read own decision | PolicyDecision | Y (own subject) | N | N | N | N | N | N |
| Read any decision | PolicyDecision | N | N | N | N | Y | Y | N |
| Assign hold | PolicyHold | N | N | N | N | Y (scheduler assigns) | N | N |
| Resolve hold | PolicyHold | N | N | N | N | Y (not owner, not author) | N | N |
| Escalate hold | PolicyHold | N | N | N | N | Y | N | N |
| Withdraw hold | PolicyHold | N | Y (for its own subject only) | N | N | N | N | N |
| Read open hold queue | PolicyHold | N | N | N | N | Y | N | N |
| Read audit log | PolicyAuditEntry | N | N | N | N | N | Y | N |
| Export evidence | PolicyDecision, PolicyAuditEntry | N | N | N | N | N | Y (with EVIDENCE_EXPORT audit entry) | N |

Y means allowed by capability; "(...)" narrows scope; N means denied with PROHIBITED_FORBIDDEN (or PROHIBITED_UNAUTHENTICATED for X).

## Capability names (A-prohibited-03)
| Capability | Grants |
|---|---|
| `prohibited.policy.read_public` | get_active_public |
| `prohibited.policy.draft.create` | create and edit EDITING versions, own versions only |
| `prohibited.policy.approve` | approve versions authored by others |
| `prohibited.policy.discard` | discard own EDITING versions |
| `prohibited.rule.internal.read` | read match_terms and structured_flag values |
| `prohibited.decision.evaluate` | evaluate, for the calling service principal only |
| `prohibited.decision.read.own` | read decisions where subject owner equals caller |
| `prohibited.decision.read.any` | read any decision |
| `prohibited.hold.review` | list, assign, resolve |
| `prohibited.hold.escalate` | escalate |
| `prohibited.hold.withdraw.service` | withdraw holds for own subject |
| `prohibited.audit.read` | read audit log and export |

## Separation of duties
- PS-146-05.R02: Approver != author on approve (PROHIBITED_APPROVER_NOT_INDEPENDENT).
- PS-146-05.R03: Reviewer != subject owner and != policy author for the subject's active rule set (PROHIBITED_HOLD_REVIEWER_CONFLICT).
- PS-146-05.R04: A service principal may evaluate only snapshots whose `caller_service_id` matches its credential. Mismatch returns PROHIBITED_FORBIDDEN.
- PS-146-05.R05: Capabilities are checked at the server for every request. Client hints (UI visibility) are not authorization.
- PS-146-05.R06: Revocation of a role takes effect on the next request; cached grants live at most 60 seconds (per CTR-CAP-001, pending).

## Abuse and disclosure controls
- PS-146-05.R07: Participants cannot read internal match terms. This prevents probing for prohibited wording.
- PS-146-05.R08: Public summary lists category titles and public_title_key only.
- PS-146-05.R09: Decisions visible to a participant exclude hold resolution reviewer identity; reviewer identity is visible to auditors only.
- PS-146-05.R10: Every grant or denial on decision, hold and version resources writes a PolicyAuditEntry for administrative actions (not for each denied read, which is rate-limited instead).

## Open decisions
- A-prohibited-03 (capability names pending CTR-CAP-001 registration; roles may be merged by F16).
- A-prohibited-11 (two-person activation; a single-admin deployment in MVP would require a documented exception, none defined here).
- Mapping of role grants to existing identity roles is owned by F07 and is not defined here.
