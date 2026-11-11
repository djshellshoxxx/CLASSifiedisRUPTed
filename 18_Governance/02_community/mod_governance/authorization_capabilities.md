# PS-147-05 — Authorization and capabilities: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-05.R01** Vault policy: authoring and publishing require the publisher key; deciding and co-signing require a key delegated in the publisher's verified authority list and different from the publisher; commenting requires any local principal; receiving verifies signer roles (CAP-8).
- **PS-147-05.R02** Relay policy (CAP-9): the publisher's relay accepts comments from registered device keys within its quota, serves comments only to holders of a valid relay access token (CAP-8, CAP-10) because they are P1, honours author tombstones and lets its own moderator hide comments; a relay role has no power over other relays or vaults.
- **PS-147-05.R03** There is no global governance role; trust is per publisher and chosen by each user.
- **PS-147-05.R04** A delegated decider or co-signer shows that a different key acted, not that a different person did; the UI, threat model and changelog say so.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.policy_proposal.author | owner | local principal holds the publisher key; proposal status draft |
| governance.policy_proposal.publish | owner | local principal is the proposal publisher; status draft, open_for_comment or decision_pending; signing key unrevoked |
| governance.policy_proposal.cosign | owner | local principal is the proposal's coSignerId and is listed with role cosigner or decider in the publisher's verified authority list; differs from publisherId |
| governance.policy_proposal.decide | owner | local principal is listed with role decider in the publisher's verified authority list at least 14 days before the proposal receipt and differs from publisherId and coSignerId; verified mirror status decision_pending |
| governance.policy_proposal.receive | peer | statement signed by the registered role for its type (publisher, delegated decider or co-signer); signature, key status and role verified |
| governance.policy_proposal.read | owner | vault unlocked; reads proposals from trusted publishers and public changelog |
| governance.policy_proposal.verify | system | caller is F18.S01.M01, F18.S01.M02, F18.S01.M03 or F18.S02.M02 inside the vault or relay |
| governance.policy_proposal.relay_publish | relay-member | relay policy: request signed by the statement author's device key; publisher is this relay's operator key or the author is delegated in that operator's verified authority list; 50 uploads per day per key |
| governance.policy_proposal.relay_read | relay-anonymous | relay policy: public read of proposals, decisions, co-signatures and authority lists with their receipts; 60 requests per minute per IP prefix |
| governance.authority_list.author | owner | local principal holds the publisher key; signing key unrevoked |
| governance.authority_list.apply | owner | vault unlocked; statement signed by the publisher principal |
| governance.policy_comment.create | owner | vault unlocked; proposal open_for_comment by the anchored period; fewer than 5 visible comments |
| governance.policy_comment.withdraw | owner | local principal is the comment author |
| governance.policy_comment.receive | owner | vault unlocked; comment authors filtered through filterBlocked and dropped silently when blocked (N7) |
| governance.policy_comment.relay_accept | relay-member | relay policy: request signed by a registered device key; RateLimitPort per key and per /24 or /48 prefix and the new-key cap of V15 |
| governance.policy_comment.relay_tombstone | relay-member | relay policy: tombstone signed by the comment's author principal (FED-9) |
| governance.policy_comment.relay_hide | relay-moderator | relay policy: moderator of the publisher's relay; reason key required; affects only that relay |
| governance.policy_comment.relay_list | relay-member | relay policy: valid relay access token from challenge-response (CAP-8, CAP-10); anonymous requests refused; 60 requests per minute per key |
| governance.trusted_publisher.manage | owner | vault unlocked; add only from the owner's trust dialog with the confirmed fingerprint; internal callers and sync ingestion denied |
| governance.trusted_publisher.read | owner | vault unlocked; internal callers F18.S01.M01, F18.S01.M02, F18.S01.M03 and F18.S02.M02 |
| governance.pending_statement.manage | owner | vault unlocked; owner action from the pending inbox |
| governance.pending_statement.hold | system | internal callers F18.S01.M01, F18.S01.M02, F18.S01.M03 and F18.S02.M02 on the inbound path |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T07 | abuse | PS-147-05.R01, PS-147-05.R03, PS-147-01.R05 | proposer decides own proposal; KL decides; an unlisted key decides; untrusted publisher decision | GOVERNANCE_PROPOSAL_SELF_DECISION or decider_unauthorized; statements quarantined |
| TEST-PS-147-09.T08 | abuse | PS-147-05.R02, PS-147-07.R03 | non-registered key comments; sixth comment; 11 comments in an hour; moderator hides; anonymous relay_list | relay refuses; GOVERNANCE_COMMENT_LIMIT; RATE_LIMITED; hide affects that relay only; relay_list returns UNAUTHENTICATED; notifications carry only reference and template key |
| TEST-PS-147-09.T22 | unit | PS-147-01.R05, PS-147-05.R04 | expedited proposal without co-signature, with a co-signature by KC, with a co-signature by an unlisted key; inspect the proposal detail UI string | GOVERNANCE_PROPOSAL_PERIOD_INVALID, accepted, rejected; UI shows 'a different key, not proof of a different person' |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
