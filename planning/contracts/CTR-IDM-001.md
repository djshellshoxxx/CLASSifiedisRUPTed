# CTR-IDM-001 — Idempotency, concurrency, retries and offline writes

**Status:** APPROVED. **Owner:** F15.S02.M02 (mod_api) with F15.S01.M01 (mod_offline).

- **IDM-1** Every state-changing command carries `Idempotency-Key` (UUIDv7, client-generated). Relay stores `(tenantId, actorId, command, key) → (requestHash, response, status)` for 24 h. Same key + same hash ⇒ stored response replayed (HTTP status preserved, header `Idempotent-Replay: true`). Same key + different hash ⇒ `IDEMPOTENCY_KEY_REUSED`.
- **IDM-2** Commands mutating an existing aggregate carry `expectedRevision`; mismatch ⇒ `CONFLICT_REVISION` with `currentRevision`. No last-writer-wins for user content.
- **IDM-3** Leases (cycle locks, auction close, inventory holds): `{resourceId, holder, expiresAt}` acquired atomically with compare-and-set; default TTL 15 min, renewable; expiry releases automatically; holder ID is the proposal/cycle ID, never a user session.
- **IDM-4** Client retry: only `retryable=true` errors and network failures; exponential backoff with full jitter, base 500 ms, cap 30 s, max 6 attempts; respect `retryAfterMs`.
- **IDM-5** Offline (D08): the PWA writes commands into an IndexedDB outbox with their idempotency key; UI shows *pending* until relay acknowledgement; on reconnect the outbox replays in creation order; `CONFLICT_*` responses surface a resolve-or-discard prompt; never auto-merge. Outbox entries expire after 7 days (user prompted).
- **IDM-6** Sagas for multi-step real-world flows (cycle execution, rentals, bookings) are explicit state machines with compensating transitions; no step assumes another party's physical action happened without that party's attestation.

## ADR-0016 amendment (local-first)
- **IDM-7** Vault commands commit locally first (state `local committed`). Statements to other parties go through a per-destination **sync outbox** with states `prepared → transport_acknowledged (relay receipt) → peer_accepted (signed peer acknowledgement)`; UI never shows more certainty than the reached state.
- **IDM-8** IDM-3 leases are local reservations inside one vault (or within one relay for relay-hosted resources such as auctions). Cross-vault coordination uses signed reservation statements with expiry; there is no distributed lock.
