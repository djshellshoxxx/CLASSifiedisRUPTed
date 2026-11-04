# CTR-CAP-001 — Capabilities and authorization

**Status:** APPROVED. **Owner:** F16.S01.M01 (mod_authorization) with F07.S01 identity.

## Model
- **CAP-1** Capability ID `<featureSlug>.<resource>.<action>` (e.g. `bazaar.listing.publish`). Every command declares exactly one capability; every query declares one read capability.
- **CAP-2** Decision function `authorize(actor, capability, resource?, context) → Allow | Deny(code)`, default deny, pure and side-effect free. Evaluated by the command bus before the handler runs; handlers re-check resource-relationship guards inside the transaction.
- **CAP-3** Roles (per tenant): `anonymous`, `member`, `moderator`, `operator`, `admin`. Relationship predicates: `owner(resource)`, `participant(resource)`, `counterparty(resource)`, `blockedWith(other)`, `notSuspended`.
- **CAP-4** Default grants: anonymous → public read capabilities only (`*.*.read_public`); member → own-resource and participant capabilities; moderator → `moderation.*` plus read of reported content; operator → `platform.*` configuration/ops; admin → role assignment. No role can read P3/P4 data of another user except under logged legal-hold export by admin with two-person approval (F10.S01.M02 retention).
- **CAP-5** Suspended members keep read access to their own data and export/deletion rights; all other member capabilities deny with `FORBIDDEN` and `params.reason="suspended"`.
- **CAP-6** Revocation: session revocation and role changes take effect on next request (sessions are checked per request; no cached grants > 60 s).
- **CAP-7** Every Allow/Deny for a state-changing command is written to the audit log (F16.S03) with actor, capability, resource ID and decision; never with payload content.

## Sessions (D10)
Challenge–response login: relay issues 32-byte random nonce (TTL 120 s); client signs `classrup-login:v1:<relayId>:<nonce>` with its device Ed25519 key; relay verifies against the account's registered device keys and issues an opaque 256-bit session token (stored as SHA-256 hash). Idle timeout 7 days, absolute 30 days, rotate on privilege change. Token sent as `Authorization: Bearer`; never in URLs or logs.

## ADR-0016 amendment (local-first)
- **CAP-8** Two layers. *Vault policy*: commands run in the user's vault with `actor = unlocked local principal`; only that principal mutates its records. Incoming signed statements are accepted only when signed by a key authorized for the role (author of the listing, listed proposal participant, etc.); otherwise the statement is quarantined with reason. *Relay policy*: a relay authorizes its own resources (index writes, mailbox access, auction hosting, push subscriptions) for requests signed by a registered device key or bearing a relay access token from the challenge–response below.
- **CAP-9** Roles `moderator`, `operator`, `admin` exist per relay and affect only what that relay hosts. There is no global role and no global suspension; "suspended" means suspended on that relay.
- **CAP-10** The session section above describes **relay access tokens** only; the vault itself is unlocked locally (passphrase-derived key or platform-protected non-extractable key) and never requires a server.
