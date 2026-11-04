# PS-147-05 — Authorization and capabilities: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-05.R01** Vault policy: authoring and publishing require the publisher key; deciding requires a different key from the publisher's authority list; commenting requires any local principal; receiving verifies signer roles (CAP-8).
- **PS-147-05.R02** Relay policy (CAP-9): the publisher's relay accepts comments from registered device keys within its quota and lets its own moderator hide comments; a relay role has no power over other relays or vaults.
- **PS-147-05.R03** There is no global governance role; trust is per publisher and chosen by each user.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.policy_proposal.author | owner | local principal holds the publisher key; proposal status draft |
| governance.policy_proposal.publish | owner | local principal is the proposal publisher; status draft, open_for_comment or decision_pending |
| governance.policy_proposal.decide | owner | local key is in the publisher's authority list and differs from publisherId; status decision_pending |
| governance.policy_proposal.receive | peer | statement signed by a trusted publisher or decider key; signature and role verified |
| governance.policy_proposal.read | owner | vault unlocked; reads proposals from trusted publishers and public changelog |
| governance.policy_proposal.verify | system | caller is F18.S01.M01, F18.S01.M02 or F18.S01.M03 inside the vault |
| governance.policy_comment.create | owner | vault unlocked; proposal open_for_comment; fewer than 5 visible comments |
| governance.policy_comment.relay_accept | relay-member | relay policy: request signed by a registered device key; 10 comments per hour per key |
| governance.policy_comment.relay_hide | relay-moderator | relay policy: moderator of the publisher's relay; reason key required; affects only that relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T07 | abuse | PS-147-05.R01, PS-147-05.R03 | proposer decides own proposal; untrusted publisher decision; third key signs | GOVERNANCE_PROPOSAL_SELF_DECISION; statements quarantined |
| TEST-PS-147-09.T08 | abuse | PS-147-05.R02, PS-147-07.R03 | non-registered key comments; sixth comment; 11 comments in an hour; moderator hides | relay refuses; GOVERNANCE_COMMENT_LIMIT; RATE_LIMITED; hide affects that relay only |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
