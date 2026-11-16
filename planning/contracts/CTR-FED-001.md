# CTR-FED-001 — Federated envelope, provenance and trust

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F11 Federation (named owner UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-FED-001 (this file). **Depends on:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-SCH-001, CTR-COM-001 (financial evidence deferred). **Consumed by:** F11 relay sync and interoperability modules, F12 moderation (peer quarantine, blocklists), F16 key management.

**Decision label:** D01 default (versioned signed envelopes, explicit opt-in) is PROVISIONAL (unapproved). Algorithm, canonicalization and timing values are ASSUMPTION. Standards evaluation for D01 is OPEN.

## Scope

Wire format and verification rules for events exchanged between nodes: batch envelope, per-event signature and audience, dedupe, equivocation detection, tombstones, peer trust states, key revocation, rate limits and rejection codes. Local-only events are out of scope.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-FED-001.R01 | Federation is opt-in and off by default. A node federates only when an admin enables it (feature flag) and a peer is in state `trusted` (or `restricted` for inbound only). | MVP |
| CTR-FED-001.R02 | Items are not federated by default. Each item carries `federate` (default false). Only PUBLIC items federate without per-item opt-in. PSEUDONYMOUS items require per-item opt-in. LOCATION_COARSE federates only as an approved cell (CTR-PRV-001). | MVP |
| CTR-FED-001.R03 | Never federated: PRIVATE_PERSONAL, LOCATION_PRECISE, SECRET. FINANCIAL_EVIDENCE is deferred for MVP (no federation of financial evidence until a separate decision). Inbound events of these classes → `FED.DATA_CLASS_NOT_ALLOWED`. | MVP |
| CTR-FED-001.R04 | Each event in a batch is independently signed (CTR-EVT-001 R05) over the domain-prefixed JCS of the envelope, including `audience` and `expires_at`. Batch-level transport fields are not signed and are validated only for size and rate. | MVP |
| CTR-FED-001.R05 | Dedupe key = (`provenance.origin_node`, `event_id`). Duplicates are acknowledged with status `duplicate` and not reprocessed. | MVP |
| CTR-FED-001.R06 | Equivocation: two events with the same (`origin_node`, `aggregate_id`, `revision`) and different `event_id` or `payload_digest` → `FED.EQUIVOCATION`. Both are retained as evidence (RET-EVD); the peer moves to `quarantined`. | MVP |
| CTR-FED-001.R07 | Tombstones are events of type `<aggregate_type>.tombstoned`. Only the origin node of the target (or a moderation action by that origin, signed with its moderator key) may tombstone. Receivers drop the payload, keep the tombstone (RET-FED), and reject later copies of the target with status `accepted` and code `FED.TOMBSTONE_ON_ARRIVAL` (not stored). Tombstones are irreversible; republication requires a new `event_id` and `aggregate_id`. | MVP |
| CTR-FED-001.R08 | Export re-keys `correlation_id`, omits `idempotency_key`, replaces `actor_ref.ref` with a per-audience pseudonym (keyed HMAC of the account ID with an audience-specific key, ASSUMPTION), and sets `provenance.origin_node` to the exporting node. | MVP |
| CTR-FED-001.R09 | Keys: each node has signing keys with `key_id`, `valid_from`, optional `valid_until`, optional `revoked_at` and optional `compromised_at`. Events signed with a key when `occurred_at ≥ compromised_at` are rejected. Events before `compromised_at` are accepted as historical with a visible "signer key later compromised" marker (S3-03, ASSUMPTION). | MVP |
| CTR-FED-001.R10 | Each inbound batch ≤ 100 events and ≤ 1 MiB (ASSUMPTION). Each event ≤ 64 KiB and depth ≤ 8 (CTR-EVT-001 R12). Limits are enforced before signature verification. | MVP |
| CTR-FED-001.R11 | Per-peer rate limit: ≤ 600 events per minute and ≤ 10 MiB per hour (ASSUMPTION). Exceeding returns `FED.RATE_LIMITED` with retry-after. | MVP |
| CTR-FED-001.R12 | Outbound batches are sent after a random delay of 0–60 s (ASSUMPTION) to reduce timing correlation (R06 partial mitigation). | MVP |
| CTR-FED-001.R13 | Each event result is returned: `accepted`, `duplicate`, `rejected` (with code), or `deferred` (with code). Retry rules in Failure section. | MVP |

## Data / schema

Batch (transport):

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-FED-001:batch:1.0.0",
  "type": "object",
  "required": ["fed_version","batch_id","sender_node","sent_at","events"],
  "additionalProperties": false,
  "properties": {
    "fed_version": {"const": "1.0.0"},
    "batch_id": {"type": "string", "pattern": "^dlv_[0-9A-HJKMNP-TV-Z]{26}$"},
    "sender_node": {"type": "string", "pattern": "^nod_[0-9A-HJKMNP-TV-Z]{26}$"},
    "sent_at": {"type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$"},
    "events": {"type": "array", "minItems": 1, "maxItems": 100, "items": {"$ref": "urn:classrupt:contract:CTR-EVT-001:envelope:1.0.0"}}
  }
}
```

Federated event requirements (on top of CTR-EVT-001 envelope):
- `audience`: REQUIRED. `nod_` of the recipient, or `public` (PUBLIC class only; any node may accept).
- `expires_at`: REQUIRED. ≤ `occurred_at` + 30 days (ASSUMPTION). Expired events are rejected.
- `provenance.source_kind`: `federated_import` on receipt; the exporting node sends the original kind.
- `signature`: REQUIRED. `alg` = Ed25519; signing input = `CLASSRUPT-FED-SIG-v1\n` ‖ JCS(event without `signature`).
- `max_data_class`: must be PUBLIC, PSEUDONYMOUS, LOCATION_COARSE, or (deferred) none. Others rejected (R03).

Ack (response):

```json
{
  "batch_id": "dlv_01HZX3Q7R9S1T3V5W7X9Y1Z3AB",
  "results": [
    {"event_id": "evt_01HZX3K9Q7M2V8T4W6Y0B5N1CD", "status": "accepted"},
    {"event_id": "evt_01HZX3M0J4R8S2A6C9E3F5G7H1", "status": "rejected", "code": "FED.SIGNATURE_INVALID"}
  ]
}
```

Peer record (registry, F11):

| Field | Type | Notes |
|---|---|---|
| `fpr_id` | `fpr_` ID | CTR-ID-001. |
| `node_id` | `nod_` ID | Peer node. |
| `trust_state` | enum | `pending`, `trusted`, `restricted`, `quarantined`, `revoked`. |
| `protocol_versions` | array of SemVer | Supported `fed_version`. |
| `keys` | array | `key_id`, `valid_from`, `valid_until`, `revoked_at`, `compromised_at`. |
| `last_successful_sync_at` | timestamp | Health signal (BT-09). |
| `capability_scope` | array | Allowed `aggregate_type` and max data class (CTR-CAP-001 `fpr` principal). |

Trust-state transitions:

| From | Event | Guard | To |
|---|---|---|---|
| (none) | peer.proposed | Signed peer metadata; out-of-band fingerprint confirmed by admin (ASSUMPTION) | pending |
| pending | peer.admitted | Admin and fingerprint confirmation | trusted |
| trusted | peer.restricted | Admin or automated threshold (Abuse) | restricted |
| trusted, restricted | peer.quarantined | Equivocation, repeated signature failures, or moderation case | quarantined |
| quarantined | peer.restored | Review record; new keys if compromise suspected | trusted or restricted |
| any | peer.revoked | Admin decision or compromise | revoked (queued outbound discarded; inbound refused) |

Quarantine stops new inbound and outbound sync without modifying local records (BT-09).

## Commands / queries / events

| Operation | Event | Notes |
|---|---|---|
| `fed.receive_batch` | per-event envelopes accepted | Verification order below. |
| `fed.send_batch` | `dlv.sent` | Outbound batch record with event IDs only. |
| `peer.*` (above) | `peer.admitted`, `peer.restricted`, `peer.quarantined`, `peer.restored`, `peer.revoked` | Admin and F12 actions; audited (CTR-CAP-001 R08). |
| key lifecycle | `key.revoked`, `key.compromised` | Signed by the key owner or the peer's trust root. |

## Verification order (inbound, per event)

1. Batch size and rate (R10, R11). Failure → `FED.SIZE_EXCEEDED` or `FED.RATE_LIMITED` for the whole batch.
2. Peer state: `trusted` or `restricted` (inbound). Otherwise `FED.PEER_NOT_TRUSTED` (`quarantined`, `revoked`) or `FED.PEER_UNKNOWN`.
3. Event size, depth, `fed_version` support. Failures: `FED.SIZE_EXCEEDED`, `FED.VERSION_UNSUPPORTED`.
4. Envelope schema (CTR-EVT-001) and CTR-ID-001 prefix rules. Failure: `FED.ENVELOPE_MALFORMED`.
5. Unknown `aggregate_type` or `schema_version` MAJOR → `FED.VERSION_UNSUPPORTED` (CTR-SCH-001).
6. `origin_node` equals `sender_node` of the batch or is a node the sender is authorized to relay for (ASSUMPTION: relays may forward only their own origin events in MVP). Else `FED.PEER_NOT_TRUSTED`.
7. Key: `key_id` known for `origin_node`. Unknown → `FED.KEY_UNKNOWN` (deferred up to 24 h, then rejected). Revoked before `occurred_at` or `compromised_at ≤ occurred_at` → `FED.KEY_REVOKED`.
8. Signature verifies. Failure → `FED.SIGNATURE_INVALID`.
9. Audience is local `nod_` or `public`. Else `FED.AUDIENCE_MISMATCH`.
10. `expires_at` not passed; `occurred_at` ≤ receipt time + 5 min (ASSUMPTION). Else `FED.EXPIRED` or `FED.CLOCK_SKEW`.
11. Data class allowed for peer (R02, R03) and capability scope (CTR-CAP-001). Else `FED.DATA_CLASS_NOT_ALLOWED`.
12. Dedupe (R05): duplicate → `duplicate`. Equivocation check (R06) → `FED.EQUIVOCATION` and quarantine.
13. Tombstone check (R07): if target tombstoned → `accepted` with `FED.TOMBSTONE_ON_ARRIVAL` (not stored).
14. Commit as an aggregate revision of the origin (CTR-EVT-001 R02), set `recorded_at`, return `accepted`.

Ordering: steps 1–13 run before any database write. Cryptographic work runs after cheap checks (R10).

## States & transitions

Trust-state transitions above. Event-level outcomes:

| Input | Outcome | Retry |
|---|---|---|
| Valid, new | accepted | n/a |
| Valid, already stored | duplicate | n/a |
| Tombstoned target | accepted (not stored) | n/a |
| Unknown key within 24 h | deferred | Yes, with backoff |
| Rate limited | rejected `FED.RATE_LIMITED` | Yes, after retry-after |
| Clock skew | rejected `FED.CLOCK_SKEW` | No; sender must re-sign with corrected time |
| All other rejections | rejected | No |

## Validation and errors

| Code | Retryable | Category / HTTP | Batch or event |
|---|---|---|---|
| FED.ENVELOPE_MALFORMED | false | validation / 400 | Event |
| FED.SIZE_EXCEEDED | false | payload_too_large / 413 | Batch or event |
| FED.VERSION_UNSUPPORTED | false | validation / 400 | Event |
| FED.PEER_UNKNOWN | false | forbidden / 403 | Batch |
| FED.PEER_NOT_TRUSTED | false | forbidden / 403 | Batch or event |
| FED.KEY_UNKNOWN | true | precondition_failed / 412 | Event (deferred up to 24 h) |
| FED.KEY_REVOKED | false | unprocessable_state / 422 | Event |
| FED.SIGNATURE_INVALID | false | unprocessable_state / 422 | Event |
| FED.AUDIENCE_MISMATCH | false | unprocessable_state / 422 | Event |
| FED.EXPIRED | false | gone / 410 | Event |
| FED.CLOCK_SKEW | false | unprocessable_state / 422 | Event |
| FED.DATA_CLASS_NOT_ALLOWED | false | forbidden / 403 | Event |
| FED.EQUIVOCATION | false | conflict / 409 | Event (peer quarantined) |
| FED.RATE_LIMITED | true | rate_limited / 429 | Batch |
| FED.TOMBSTONE_ON_ARRIVAL | n/a (status, not error) | n/a | Event (accepted, not stored) |

Batch-level errors use the CTR-ERR-001 envelope. Per-event codes appear in `results[].code`.

## Authorization

Peers act only through the `fpr` principal with scope from `capability_scope` (CTR-CAP-001). Peers cannot read local private data, cannot enumerate users, and cannot request events outside their scope. Admin actions on peers require `ope` principal with dual control for trust restoration after quarantine (ASSUMPTION).

## Failure, idempotency, concurrency, offline

- Inbound processing is idempotent per (origin_node, event_id). Batch retries are safe.
- Outbound: each event is retried only on retryable results or transport failure. Backoff: exponential with full jitter, base 1 min, cap 6 h (ASSUMPTION). Events past `expires_at` are dropped from the outbound queue.
- Partition and recovery: on resync, the receiver requests missing revisions per aggregate. A revision gap holds that aggregate (CTR-EVT-001 R02) without blocking others.
- Revocation of a peer discards queued outbound events. Inbound events already accepted remain; the peer's future events are refused.
- Offline nodes or clients are not peers. Offline client writes never federate directly.

## Privacy, retention, abuse

- Metadata exposure (R06 of RISK_REGISTER.md): the envelope exposes `origin_node`, `aggregate_type`, `aggregate_id`, `revision`, timing and event type. Mitigations: R08 re-keying, R12 timing jitter, batch size minimum (ASSUMPTION: send only full batches or after 60 s).
- Data classes per CTR-PRV-001 federation column. Per-item opt-in is recorded as an `aud_` record.
- RET-FED for tombstones and dedupe state. Quarantine evidence (equivocating events, bad signatures) RET-EVD.
- Abuse controls: per-peer rate limits (R11), quarantine (BT-09), blocklist distribution by F12 as signed events (ASSUMPTION), malicious payload size and depth limits (R10).

## Observability and budgets

- Metrics: `fed_events_total{status,code}`, `fed_signature_failures_total{peer}`, `fed_equivocation_total`, `fed_queue_depth{peer}`, `fed_last_sync_age_seconds{peer}`, `fed_verify_latency_ms` p95 ≤ 2 ms per event (ASSUMPTION).
- Alerts: signature failure rate > 1% per peer over 15 min; any equivocation; queue growth > 10,000 events; peer silent > 24 h (BT-09).
- Logs: `batch_id`, `event_id`, `origin_node`, codes. Never payloads, never `audience` pseudonyms linked to accounts.

## Tests

- TEST-CTR-FED-001-01 (opt-in): federation off by default; enabling without a `trusted` peer sends nothing.
- TEST-CTR-FED-001-02 (classes): PRIVATE_PERSONAL, LOCATION_PRECISE, SECRET and FINANCIAL_EVIDENCE events are never exported; inbound ones rejected with `FED.DATA_CLASS_NOT_ALLOWED`.
- TEST-CTR-FED-001-03 (signature): tampering any signed byte (including `audience`, `expires_at`, unknown fields) → `FED.SIGNATURE_INVALID`.
- TEST-CTR-FED-001-04 (cross-audience replay): event signed for node A rejected by node B with `FED.AUDIENCE_MISMATCH`.
- TEST-CTR-FED-001-05 (duplicate and reorder): duplicate batch → all `duplicate`; reordered revisions held until gap closes, then applied in order.
- TEST-CTR-FED-001-06 (equivocation): two payloads for same revision → `FED.EQUIVOCATION`, peer quarantined, both retained.
- TEST-CTR-FED-001-07 (tombstones): tombstone before event → event accepted not stored; tombstone after event → payload dropped and tombstone kept; republication with same ID rejected.
- TEST-CTR-FED-001-08 (keys): event signed after `compromised_at` rejected; before accepted as historical with marker; revoked-key event rejected.
- TEST-CTR-FED-001-09 (malicious peer): oversized batch, 1,000-deep JSON, malformed UTF-8 and 101-event batch rejected before signature work; rate limit triggers `FED.RATE_LIMITED`.
- TEST-CTR-FED-001-10 (clock skew): event with `occurred_at` 6 min in future → `FED.CLOCK_SKEW`; sender re-signs with corrected time → accepted.
- TEST-CTR-FED-001-11 (quarantine and resync): quarantined peer's queued and new events are refused; restoration resumes from last revision without loss or duplicates.
- TEST-CTR-FED-001-12 (export privacy): exported batch contains no `idempotency_key`, no local `correlation_id`, no account IDs; per-audience pseudonyms differ across two audiences for the same account.
- TEST-CTR-FED-001-13 (unknown version): unknown MAJOR schema → `FED.VERSION_UNSUPPORTED`; no partial write.
- TEST-CTR-FED-001-14 (relay partition): partition for 72 h, then reconnect; all non-expired events delivered once; expired events dropped with logs.

## Acceptance criteria

1. Federation is off by default and no batch is sent without a trusted peer (TEST-01).
2. No event of a never-federated class is exported (TEST-02, zero tolerance).
3. Every rejection code in the table is reachable by a test (TEST-03 through -13).
4. Equivocation quarantines the peer and preserves evidence (TEST-06).
5. TEST-CTR-FED-001-01 through -14 pass in CI and in the federation abuse simulation (BT-09).

## Assumptions & open decisions

- PROVISIONAL (D01 default, unapproved): versioned signed envelopes, explicit opt-in. Standards evaluation (for example, ActivityPub-style or other existing protocols) is OPEN for F11 and must be recorded as an ADR before implementation.
- ASSUMPTION: Ed25519 with JCS canonicalization; to be reviewed by F16 cryptographic review (S3-03, S3-04).
- ASSUMPTION: 30-day maximum `expires_at`; 100-event and 1 MiB batch caps; 600 events/min per peer; 5-minute future skew tolerance; 24 h key deferral; 6 h backoff cap.
- ASSUMPTION: relays forward only events they originated in MVP. Relay-forwarding of third-party events is OPEN and requires a separate signed-relay design.
- OPEN: peer admission proof (out-of-band fingerprint method).
- OPEN: blocklist distribution format (signed events vs separate feed); default signed events.
- Related: S3-04, S3-09, CR-16, R06 (federation metadata leakage), BT-09; CTR-PRV-001 federation column; CTR-COM-001 (financial evidence deferred).
