# PS-144-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-144-05. **Owner:** [18_Governance/01_policy/mod_goods](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_goods. **Consumers:** F01 listings (service identity), F12 moderation (reviewer console), F18 compliance (auditor access). **Upstream:** F07 identity, F16 security (capability model). Capability model is owned by CTR-CAP-001 (owner F16 with F07). See [CONTRACTS](../../../planning/CONTRACTS.md).

## Purpose and scope
**Business outcome.** Each goods action is allowed only for the actor types that need it, with the least data needed. Operators configure policy; reviewers decide cases; the listing service evaluates; participants see only the outcome for their own subject.

**Exclusions.** Identity proofing and credential issuance (F07). Key management (F16). Participant-facing listing permissions (F01).

## Capabilities
| Capability | Grants |
|---|---|
| `goods.category.write` | Create and update categories |
| `goods.category.read` | Read categories (full for operators, public fields otherwise) |
| `goods.rule.draft` | Draft, update and cancel rules in `EDITING` |
| `goods.rule.activate` | Activate rules (activator must differ from drafter) |
| `goods.rule.retire` | Retire rules |
| `goods.rule.read` | Read rule summaries and full rule records |
| `goods.decision.evaluate` | Call EvaluateGoods for a subject |
| `goods.decision.read` | Read decisions |
| `goods.review.claim` | Claim, release cases |
| `goods.review.decide` | Decide cases |
| `goods.review.read` | Read cases and reviewer notes |
| `goods.review.withdraw` | Withdraw a case as subject owner |
| `goods.import.write` | Run import batches |
| `goods.export.read` | Export policy and audit data |

## Actors
- **OPS:** goods operator (configures catalog and rules).
- **PRV:** policy reviewer (decides cases). Senior PRV is a PRV with the escalation role (A-goods-14).
- **SVC:** listing service identity of F01, scoped to `goods.decision.evaluate` and `goods.rule.read` only.
- **PTY:** participant acting on their own subject (listing, offer or proposal owner).
- **AUD:** auditor (read-only compliance access).
- **PUB:** unauthenticated public caller.

## Actor × action matrix
Legend: Y = allowed; N = refused (GOODS_NOT_AUTHORIZED); Own = only for a subject the caller owns; Summary = reduced fields.

| Action | Capability | OPS | PRV | SVC | PTY | AUD | PUB |
|---|---|---|---|---|---|---|---|
| CreateGoodsCategory, UpdateGoodsCategory | goods.category.write | Y | N | N | N | N | N |
| GetGoodsCategory, ListGoodsCategories | goods.category.read | Y | Y | Y | Y | Y | Summary (ACTIVE only) |
| DraftGoodsPolicyRule, UpdateGoodsPolicyRule, CancelScheduledGoodsRule | goods.rule.draft | Y | N | N | N | N | N |
| ActivateGoodsPolicyRule | goods.rule.activate | Y | N | N | N | N | N |
| RetireGoodsPolicyRule | goods.rule.retire | Y | N | N | N | N | N |
| GetEffectiveGoodsRules | goods.rule.read | Y | Y | Y | Summary | Y | Summary |
| GetGoodsPolicyRuleFull (drafter, activator refs) | goods.rule.read | Y | Y | N | N | Y | N |
| EvaluateGoods | goods.decision.evaluate | N | N | Y | N | N | N |
| GetGoodsDecision | goods.decision.read | Y | Y | N | Own (outcome, reason_code only) | Y | N |
| ClaimGoodsReviewCase, ReleaseGoodsReviewCase | goods.review.claim | N | Y | N | N | N | N |
| DecideGoodsReviewCase | goods.review.decide | N | Y | N | N | N | N |
| ListGoodsReviewCases | goods.review.read | Y | Y | N | N | Y | N |
| WithdrawGoodsReviewCase | goods.review.withdraw | N | N | N | Own | N | N |
| ImportGoodsPolicyBatch | goods.import.write | Y | N | N | N | N | N |
| Export (policy and audit) | goods.export.read | Y | N | N | N | Y | N |

Reviewer notes are visible only to PRV and AUD, never to PTY, SVC or PUB.

## Rules
- **Default deny.** An action not in the matrix is refused.
- **Separation of duties.** Activator ≠ drafter (GOODS_SEPARATION_OF_DUTIES). A PRV who holds a case may not decide a case whose subject they own (GOODS_CONFLICT_OF_INTEREST).
- **Scope checks.** SVC calls are limited to subjects that F01 presents; SVC cannot read decisions for subjects it did not evaluate.
- **Capability checks precede field checks.** A caller without capability gets GOODS_NOT_AUTHORIZED even for invalid payloads, so the response reveals nothing about validation.
- **Revocation.** Capability changes take effect within 60 s (A-goods-14). Active review leases of a revoked PRV are released by the lease sweep.
- **Audit.** Every allowed or refused state change writes an audit event with actor_ref, capability, action and result.

## Relation to CTR-CAP-001
This module consumes capabilities as named above. Capability names are proposals until CTR-CAP-001 publishes its vocabulary; mapping changes are made here only.

## Assumptions
- **A-goods-14.** Role names OPS, PRV, SVC, PTY, AUD and the senior PRV escalation role are provisional. Capability cache TTL is 60 s, which bounds revocation delay.

## Open decisions
- **OD-GOODS-05.** Whether PUB may read ACTIVE rule summaries, which could let participants learn policy classes. Default: yes for summary fields only (no conditions detail); needs privacy review under F10.
