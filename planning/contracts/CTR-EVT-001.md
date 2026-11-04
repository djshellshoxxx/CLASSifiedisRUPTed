# CTR-EVT-001 — Domain event envelope and delivery

**Status:** APPROVED. **Owner:** F15.S02.M02 (mod_api).

## Envelope
```json
{ "eventId": "<uuidv7>", "type": "bazaar.listing.published", "version": 1,
  "tenantId": "<uuidv7>", "aggregate": { "type": "listing", "id": "<uuidv7>" }, "revision": 4,
  "actor": { "kind": "user", "id": "<actorId>" }, "occurredAt": "2026-11-04T10:15:30.123Z",
  "correlationId": "<uuidv7>", "causationId": "<eventId|commandId>", "privacy": "P0",
  "payload": { }, "provenance": { "origin": "relay:<relayId>", "sig": null } }
```
## Rules
- **EVT-1** Type naming `<featureSlug>.<entity>.<pastTenseVerb>` in lower snake/dot form (`mutiny.cycle.consent_recorded`). `version` increments only on breaking payload change; consumers must accept the current and previous version.
- **EVT-2** Events are written in the same SQLite transaction as the state change (transactional outbox table `outbox`). A dispatcher delivers at-least-once in `(aggregate.id, revision)` order per aggregate. No global ordering guarantee.
- **EVT-3** Consumers are idempotent: they record `(consumer, eventId)` in `inbox` before side effects; a duplicate is acknowledged and skipped.
- **EVT-4** Payload privacy class (CTR-PRV-001) is declared per event type. Events with class ≥ P2 are never federated or sent to notification channels in plain form; notifications carry only a reference and a localized template key.
- **EVT-5** Payloads contain IDs and minimal changed fields, never secrets (P4) or exact location (L4).
- **EVT-6** Consumer failure: retry with CTR-IDM-001 backoff; after 8 attempts the event moves to `dead_letter` with error code; operators replay via `platform.events.replay` (operator capability).
- **EVT-7** `actor.kind` ∈ `user | system | relay | federated | operator`. `federated` events require verified `provenance.sig`.

## ADR-0016 amendment (local-first)
- **EVT-8** Domain events are written to the vault's local outbox in the same IndexedDB transaction as the state change and drive local consumers (notifications, search index, reputation). Events never leave the device by themselves.
- **EVT-9** What leaves the device is a **signed statement** (CTR-FED-001 envelope) produced by an explicit command (publish, send offer, sign consent, attest handover). Receiving vaults verify, store with provenance, and derive their own local events (`actor.kind = federated`).
