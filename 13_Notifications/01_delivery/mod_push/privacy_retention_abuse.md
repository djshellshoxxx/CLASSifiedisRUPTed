# PS-104-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-07.R01 | Push payloads carry no PRIVATE_PERSONAL, FINANCIAL_EVIDENCE or LOCATION_PRECISE content. Notification text on the lock screen is a generic string (`New activity`). | MVP |
| PS-104-07.R02 | Provider sees endpoint, timing and payload size. Records of this exposure are listed in the privacy notice (Future: user-facing text). | MVP |
| PS-104-07.R03 | `p256dh` and `auth` are encrypted at rest and purged 30 days after revocation or expiry (RET-SEC). | MVP |
| PS-104-07.R04 | Server never POSTs to a URL that is not an allowlisted push host (SSRF control, see PS-104-02.R01). | MVP |
| PS-104-07.R05 | Limit 60 dispatches per account per hour; excess is dropped with `PUSH.RATE_LIMITED` (ASSUMPTION). | MVP |

## Data / schema
| Field | Data class | Retention |
|---|---|---|
| psb_ metadata (status, created_at, device label) | PSEUDONYMOUS | RET-ACC while account exists |
| endpoint | PSEUDONYMOUS (logged only as salted hash) | RET-ACC while active |
| p256dh, auth | SECRET | RET-SEC: until revoked, purged 30 days later |
| pda_ rows | PSEUDONYMOUS | RET-OPS, 30 days |
| dec_ dispatcher decisions | PSEUDONYMOUS | RET-AUD, 12 months |

## Commands / queries / events
Payload allowed keys: `ntf_id`, `category`, `schema_version` (validation_rules PS-104-02.R03). No event carries endpoint or keys.

## States & transitions
Account deletion (mod_delete) and device revocation both transition subscriptions to `revoked` and schedule key purge.

## Validation & errors
`PUSH.PAYLOAD_FORBIDDEN_FIELD` blocks any payload text field. Error diagnostics contain no endpoint.

## Authorization
Only the owner and dispatcher can cause sends (authorization_capabilities). Operators cannot read keys (CTR-CAP-001 R12).

## Failure, idempotency, concurrency, offline
Key purge is idempotent and retried daily until verified.

## Privacy, retention, abuse
- Abuse: subscription flooding (limit 10), endpoint spoofing (allowlist), push spam (60 per hour), enumeration of other users via error timing (uniform NOT_FOUND).
- Pseudonyms do not hide that a device exists; `prf_` views do not expose `psb_` IDs.
- Legal hold (CTR-PRV-001 RET-LEGAL) can pause purge for records under hold only.

## Observability & budgets
Logs: code, module, salted hashes of `ntf_id` and `psb_id`. Never endpoint, keys or payload (CTR-ERR-001 R10).

## Tests
- TEST-PS-104-07-01 (unit): payload with `title` containing user text is rejected.
- TEST-PS-104-07-02 (integration): log scan finds no endpoint or key substrings across a dispatch run.
- TEST-PS-104-07-03 (negative): endpoint `https://169.254.169.254/` is rejected before any request.
- TEST-PS-104-07-04 (integration): purge job removes key columns 30 days after revocation in simulated clock.

## Acceptance criteria
1. Zero key or endpoint strings in logs in automated scan.
2. SSRF negative test passes for internal and link-local addresses.
3. Purge verified by automated retention test.

## Assumptions & open decisions
- ASSUMPTION: 30-day key purge and 60-per-hour limit.
- Retention defaults: D07 default, PROVISIONAL (D07 default, unapproved).
- Privacy review by Privacy Lead is future gate; no audit is claimed.
