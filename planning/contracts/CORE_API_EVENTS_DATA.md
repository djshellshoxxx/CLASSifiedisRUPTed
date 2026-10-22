# Core API, data, event and permission contracts (proposed)
Status: SPECIFIED BASELINE / NOT SECURITY AUDITED. Version: contract-v1, 2026-10-22.
Owners: F15 API/persistence, F07 identity, F16 authorization, F10 privacy. This document defines reusable contracts; downstream process specs must reference it, not fork schema definitions. Unreviewed module integration remains a release blocker.

## Canonical types (CR-001)
- All IDs: UUIDv7 encoded as lowercase canonical 36-character strings, allocated server-side except client-generated command_id. Never recycle IDs. tenant_id is required in every persisted tenant-owned row and every authorized query.
- Timestamp: RFC3339 UTC with millisecond precision on the wire; PostgreSQL timestamptz in storage; server time authoritative; reject dates without timezone offset.
- Money: currency ISO 4217 uppercase three letters; amount_minor signed int64 decimal-string on JSON, BIGINT in SQL; no JSON floating point money. Range -9000000000000000..9000000000000000, with domain-specific nonnegative restrictions; verified currency exponent table pinned by release.
- Geo: public area_id (coarse, controlled vocabulary); no precise coordinates/address in public domain models. Precise details stored in separately encrypted private contact/meetup data, with purpose- and participant-scoped access.
- Text: UTF-8 NFC normalized; reject NUL/control characters other than tab/newline when allowed; limit lengths in each domain schema; preserve display originals after sanitization. Render escaped, never interpret arbitrary HTML.
- Mutating commands: UUIDv7 command_id, Idempotency-Key UUIDv7, If-Match revision header on update; auth actor and tenant derived exclusively from verified session, not trusted request payload.
- Object ownership: exactly one authoritative service/table. Replicas and federation imports are projections and cannot issue authoritative local lifecycle mutations.

## Universal HTTP contract (CR-002)
Base: /api/v1; HTTPS only; Content-Type application/json; request body maximum 256 KiB excluding separately uploaded attachments; unknown request properties rejected.
Authentication: httpOnly Secure SameSite=Lax session cookie with CSRF defense for cookie-authenticated mutation; alternative short-lived bearer token for approved clients; tenant membership checked on every request. Anonymous public GET only when ACL permits. Never include token/precise address in log/event/URL.
Examples:
POST /api/v1/listings
Idempotency-Key: 018f2077-58a7-7c00-b63f-90b5c2df1270
{"command_id":"018f2077-58a7-7c00-b63f-90b5c2df1271","title":"Repairable amplifier","kind":"sell","area_id":"region-bc-vancouver","price":{"currency":"CAD","amount_minor":"4500"}}
201 {"data":{"id":"018f2077-58a7-7c00-b63f-90b5c2df1272","revision":1,"state":"draft"},"meta":{"request_id":"018f2077-58a7-7c00-b63f-90b5c2df1273"}}
All errors: application/problem+json, object {"type":"https://classrup.example/problems/VALIDATION_FAILED","title":"Invalid input","status":422,"code":"VALIDATION_FAILED","request_id":"uuid","field_errors":[{"path":"/title","code":"TOO_LONG"}],"retryable":false}; never leak existence of inaccessible resources.
Status mapping: 400 MALFORMED_JSON; 401 UNAUTHENTICATED; 403 FORBIDDEN; 404 NOT_FOUND (including hidden other-user records); 409 REVISION_CONFLICT or IDEMPOTENCY_MISMATCH or RESOURCE_RESERVED; 410 EXPIRED; 413 PAYLOAD_TOO_LARGE; 422 VALIDATION_FAILED; 423 RESOURCE_LOCKED; 429 RATE_LIMITED with Retry-After; 503 DEPENDENCY_UNAVAILABLE with Retry-After. Same Idempotency-Key+actor+endpoint+canonical payload returns identical status/body for 24h, including a stored domain error; key with changed payload returns 409. Validation failure before idempotency recording is not retained. Network timeouts are treated as unknown until status lookup.

## Event contract (CR-003)
Producer writes state mutation and transactional outbox in a single SQL transaction. Relay/worker delivers at least once; consumers deduplicate per (consumer_id,event_id) transactionally. Events MUST NOT contain exact address, message plaintext, secrets, raw risk scores or wallet credentials.
Envelope:
{"event_id":"UUIDv7","event_type":"listing.published","event_version":1,"aggregate_type":"listing","aggregate_id":"UUIDv7","aggregate_revision":2,"tenant_id":"UUIDv7","occurred_at":"2026-10-22T13:00:00.000Z","producer":"listings","correlation_id":"UUIDv7","causation_id":"UUIDv7","payload":{"listing_id":"UUIDv7","public_area_id":"region-bc-vancouver"}}
Canonical event names for MVP: listing.created, listing.updated, listing.published, listing.archived, reservation.created, reservation.released, offer.proposed, offer.countered, cycle.proposed, cycle.consent_recorded, cycle.locked, cycle.cancelled, handoff.attested, dispute.opened, payment.claimed, payment.verified, moderation.actioned, message.sent, federation.record_imported. Names and versions immutable; breaking change requires new event_version and dual-read migration.

## SQL reference schema (CR-004)
PostgreSQL 17 proposed; all tenant-owned foreign keys must include tenant_id; generate partition strategy only after volume test.
~~~sql
CREATE TABLE command_receipts (
 tenant_id uuid NOT NULL, actor_id uuid NOT NULL, endpoint text NOT NULL,
 idem_key uuid NOT NULL, request_sha256 bytea NOT NULL CHECK(octet_length(request_sha256)=32),
 response_status int NOT NULL CHECK(response_status BETWEEN 200 AND 599),
 response_json jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY (tenant_id, actor_id, endpoint, idem_key)
);
CREATE TABLE domain_outbox (
 event_id uuid PRIMARY KEY, tenant_id uuid NOT NULL, aggregate_id uuid NOT NULL,
 aggregate_revision bigint NOT NULL CHECK(aggregate_revision > 0),
 event_type text NOT NULL, event_version int NOT NULL CHECK(event_version > 0),
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 dispatched_at timestamptz NULL,
 UNIQUE (tenant_id, aggregate_id, aggregate_revision, event_type)
);
CREATE TABLE consumer_inbox (
 consumer_id text NOT NULL, event_id uuid NOT NULL REFERENCES domain_outbox(event_id),
 handled_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (consumer_id,event_id)
);
~~~
Imported federated events require distinct inbox with origin peer and external IDs (never FK to local outbox). Transaction isolation READ COMMITTED plus revision-guarded conditional UPDATE; for multi-row cycle lock, select sorted item IDs with SELECT ... FOR UPDATE in one local database transaction. Compare-and-swap row count must equal expected; retry serialization/deadlocks with bounded jitter (three attempts), then 409/503.

## Capabilities / role resolution (CR-005)
Role scopes: guest read public only; member create own listings/messages/offers; party consent ONLY as a named member of proposal; moderator manage reported content in assigned tenant without reading private messages; operator manage quotas/features but no secret key or content access by default; auditor read redacted audit trails only. RBAC + resource ABAC (owner, participant, tenant, state, visibility, block relationships). Default deny. Implement check after authentication and before identifier lookup to resist enumeration. Explicit creator restrictions: own inventory only, cannot mark own external payment confirmed, cannot impersonate other parties' consent.

## Retention, outage, telemetry (CR-006)
Proposed defaults subject to F10 and local legal review: command receipts 24h; operational event delivery 30d; redacted security audit 90d; unreported deleted public content purge within 30d from operational stores, backup expiration <=90d; disputes/evidence hold via case-scoped access until resolution plus 180d; private message ciphertext up to 1 year unless user deletion or legal hold; reports/evidence export & deletion must enumerate exceptions. No exact location in metrics. P95 API GET <300 ms, write <700 ms in one region at 100 RPS baseline; 99.9% monthly service target; measurable budgets are proposals pending load evidence. If auth/store unavailable fail closed for writes, show cached read-only labeled stale, NEVER synthesize confirmed state offline.
