# F13.S02.M03 (PS-107) Channel opt-in/opt-out

## Implemented
- Vault commands: `notify.channel.opt_in`, `notify.channel.opt_out` (signed `classrup.notify.channel_consent/v1`, queued to the relay with `ctx.tx.sync.enqueue`).
- Relay commands (surface `relay`): `notify.channel.register` (verifies signer == userDid, relay id, channel offered, expiry window), `notify.channel.unsubscribe` (public, token).
- Query: `notify.channel.get_mine` (adds derived `needsReconfirmation` 14 days before expiry; expired shown as `expired` even before a sweep).
- Events: `notify.channel.opted_in`, `notify.channel.opted_out` (via includes `expired`).
- Subscribers: `notify.channel_privacy_withdrawn` (privacy.consent.withdrawn), `notify.channel_deletion_requested` (privacy.deletion.requested). Both sign and queue relay withdrawals.
- Statement handler for the composition-root inbound router: `defs.statementHandlers['classrup.notify.channel_consent/v1']` (relay-signed withdrawals only; a relay-signed grant is FORBIDDEN).
- Helpers: `hasActiveConsent` / `activeConsent` (the send gate for F13.S02.M01, also used by F13.S02.M04), `defs.sweepExpiredConsents(ctx)` (relay 5-minute sweep), `defs.mintUnsubscribeToken(ctx, consentId)` (relay send path).
- Errors owned here: `NOTIFY_CHANNEL_UNSUPPORTED`, `NOTIFY_UNSUBSCRIBE_TOKEN_INVALID`.

## Ports the composition root must supply (`ChannelOptions`)
- `localPrincipal(): string`; `relayChannels(relayId): string[]`; `privacy.check({purpose: 'notify_push'|'notify_email', consentId?}): {granted, consentId?}` (privacy.consent.check, N6).
- `signStatement(type, payload, seq, previousCid): Promise<SignedEnvelope>`; `verifyStatement(envelope): Promise<{author,type,payload,cid,seq}>` (throws when invalid); `isRelaySigner(relayId, author)`.
- Relay process only: `relay: { relayId, offers, signReceipt(payload), randomBytes(n), returnDestination?(userDid) }`.
- Scheduling: the relay calls `sweepExpiredConsents` every 5 minutes inside a transaction.

## Deviations
- Unsubscribe errors: unknown, malformed, expired or otherwise-withdrawn tokens all return `NOTIFY_UNSUBSCRIBE_TOKEN_INVALID` (404, detail-free); `NOT_FOUND` is never returned (the spec lists both for the same situation).
- The token hash is kept on a record withdrawn by its own link (needed for the idempotent second click) although the retention text says hashes are deleted when the consent ends; it is cleared on every other end of the consent.
- Register returns `CONFLICT_STATE` (common code, not in the spec list) when a different granted consent already holds the slot.
- Register output carries no unsubscribe token; tokens are minted by `mintUnsubscribeToken` in the send path and re-minting rotates the token (one hash per consent field). Open question below.
- Extra stored field `withdrawalCid` (additive) keeps the withdrawal statement CID.
- In-module rate counter (20 changes per day per user and relay) counts only successful changes; failed attempts roll back with their transaction. The 10 unsubscribe calls per minute per IP limit is the kernel `RateLimitPort` of the relay (it sees the network prefix); the module cannot see the IP.
- Relay consent record id is the statement's `consentId`; a consentId already used by another user answers `CONFLICT_STATE`.

## Test rows not covered
- T10 load (50 req/s for 2 minutes, sweep of 100 000): not deterministic under 3 s.
- T11 traceability run, T13 a11y: tooling and PWA.
- T12 export/import/backup: the ExportSectionPort and IOX section machinery of F10/F15 do not exist yet; no export or import code is provided.
- T09 uses the exported `hasActiveConsent` as the send gate; the real dispatch gate belongs to F13.S02.M01.
- Not implemented: 30-day re-prompt suppression after refusal and the 14-day reconfirmation prompt UI (only the `needsReconfirmation` flag exists); relay-side backup/restore; privacy.consent.granted (UI-only effect, no state).

## Open questions
- How the relay send path obtains the plaintext unsubscribe token for footers if only a hash is stored (stable per-consent token vs per-message tokens).
- Exact payload shape of `privacy.consent.withdrawn` (read as `{consentId}`) and `privacy.deletion.requested`.
