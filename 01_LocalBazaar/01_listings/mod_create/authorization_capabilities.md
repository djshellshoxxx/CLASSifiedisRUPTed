# PS-002-05 — Local authorization and capabilities

**Status:** SPECIFIED_REVIEW_PENDING — architecture/security/protocol review outstanding; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Inherits [client-owned architecture](../../../planning/CLIENT_SIDE_ARCHITECTURE.md), [core commands/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md) and [listing contract](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md). These contracts supersede conflicting backend assumptions in historical parent text. Stable requirement/test IDs retained with explicitly revised local semantics.

## Requirements
- PS-002-05.R01: Only unlocked active principal of selected vault with local listing:create capability creates its own draft. Deny locked vault, imported peer identity, read-only snapshot and foreign-key context; no central registration/account or global suspended-member status.
- PS-002-05.R02: F16 checks principal/key handle, local feature/policy and vault ownership before validation and again within commit transaction. Never honor input owner/vault claims. Advisory peer/moderator/publisher has no write authority. Delegated/on-behalf creation is disabled pending reviewed scoped capability/revocation protocol.
- PS-002-05.R03: Draft queries remain local to owner; other vaults/peers cannot enumerate/export it. No blanket moderator/operator access; voluntary evidence disclosure requires explicit preview/consent. Same-origin malicious code/device compromise remains a trust limitation, not solved by a permission table.

## Errors and key lifecycle
VAULT_LOCKED, FORBIDDEN or FEATURE_DISABLED without mutation. Foreign/hidden lookup NOT_FOUND. Locally known revoked key blocks applicable actions; offline clients may not know revocations. Lost key has no product reset/escrow. Unlock/rotation/recovery and protected key storage require independent review; unavailable crypto/protection fails closed for affected key use and sensitive persistence. Diagnostics omit key handles and identities.

## Acceptance
TEST-PS-002-05 covers principal × vault × lock/capability/policy table, revocation while pending, guessed IDs, read-only import and unauthorized delegation. No global ban/tenant test substituted silently: these revised local cases retain the test ID. Pending independent review/execution.
