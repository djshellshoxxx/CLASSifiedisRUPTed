# PS-028-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-028-02. **Owner:** [03_Services/01_service_catalog/mod_availability](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_availability. **Consumers:** 03_Services/02_service_booking (claim caller); identity F07, privacy F10, platform F15, security F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Defines every check applied before a command changes state, the stable error code returned for each failure, and the order of checks. Field definitions are in [domain_schema.md](domain_schema.md). Error envelope and retryability follow CTR-ERR-001 (F15, OPEN); this module emits the shape defined in [commands_queries_events.md](commands_queries_events.md).

Exclusions: authorization decisions (see [authorization_capabilities.md](authorization_capabilities.md)) and capacity arithmetic under concurrency (see [workflow_state_machine.md](workflow_state_machine.md)).

## Check order
1. Envelope: `schema_version`, `command`, `idempotency_key`, `actor`, `correlation_id`.
2. Authorization (capability check, AVAILABILITY_CAPABILITY_DENIED).
3. Rate limit (AVAILABILITY_RATE_LIMITED).
4. Field validation in the order of the rules below.
5. Idempotency replay check (must run before state checks; see failure spec).
6. State and revision checks.
7. Capacity checks under lock.

The first failing check returns its code. Multiple field errors are returned together in `details.fields` for schedule and window commands only.

## Error code catalogue
Format `AVAILABILITY_<CODE>`. Codes are stable once published. Retryable is `false` for every code below unless stated.

| Code | Trigger | HTTP-style class | Retryable |
|---|---|---|---|
| AVAILABILITY_SCHEMA_VERSION_UNSUPPORTED | schema_version not in {1} | 400 | false |
| AVAILABILITY_IDEMPOTENCY_KEY_INVALID | key not matching `^[A-Za-z0-9_-]{16,64}$` | 400 | false |
| AVAILABILITY_IDEMPOTENCY_KEY_REUSED | same key, different payload hash, within 24 h | 409 | false |
| AVAILABILITY_CAPABILITY_DENIED | actor lacks capability for action and resource | 403 | false |
| AVAILABILITY_RATE_LIMITED | rate limit in A-availability-11 exceeded | 429 | true, after `retry_after_s` |
| AVAILABILITY_TIMEZONE_INVALID | timezone not in IANA database | 422 | false |
| AVAILABILITY_REGION_NOT_ALLOWED | region_code fails pattern or is not an ISO 3166-2 subdivision | 422 | false |
| AVAILABILITY_SERVICE_OFFERING_NOT_OWNED | service_offering_id not owned by actor's provider_ref | 403 | false |
| AVAILABILITY_WEEKDAY_MASK_EMPTY | weekday_mask is 0 or above 127 | 422 | false |
| AVAILABILITY_BLOCK_LIMIT_EXCEEDED | more than 14 blocks | 422 | false |
| AVAILABILITY_BLOCK_END_NOT_AFTER_START | local_end <= local_start in a block | 422 | false |
| AVAILABILITY_BLOCK_OVERLAP | two blocks overlap on the same local day | 422 | false |
| AVAILABILITY_START_NOT_ON_GRANULE | start or end minute not in {0,15,30,45} | 422 | false |
| AVAILABILITY_DURATION_OUT_OF_RANGE | end_at - start_at under 15 min or over 24 h | 422 | false |
| AVAILABILITY_START_IN_PAST | start_at before now + 5 min skew allowance | 422 | false |
| AVAILABILITY_HORIZON_EXCEEDED | start_at beyond now + 180 days | 422 | false |
| AVAILABILITY_CAPACITY_OUT_OF_RANGE | capacity_total or capacity_per_window outside 1..100 | 422 | false |
| AVAILABILITY_CAPACITY_BELOW_COMMITTED | new capacity_total < capacity_held + capacity_confirmed | 409 | false |
| AVAILABILITY_WINDOW_DUPLICATE | active window with same provider, offering, start and end | 409 | false |
| AVAILABILITY_NOTE_TOO_LONG | note over 280 Unicode code points | 422 | false |
| AVAILABILITY_NOTE_CONTAINS_CONTACT_DATA | note matches e-mail, phone, URL or messenger handle pattern | 422 | false |
| AVAILABILITY_SCHEDULE_EXPANSION_LIMIT | schedule would materialize over 1000 windows in 90 days | 422 | false |
| AVAILABILITY_QUANTITY_OUT_OF_RANGE | claim quantity outside 1..10 or above capacity_total | 422 | false |
| AVAILABILITY_WINDOW_NOT_FOUND | window_id unknown or not visible to actor | 404 | false |
| AVAILABILITY_SCHEDULE_NOT_FOUND | schedule_id unknown or not owned by actor | 404 | false |
| AVAILABILITY_CLAIM_NOT_FOUND | claim_id unknown or not visible to actor | 404 | false |
| AVAILABILITY_STATE_CONFLICT | command not allowed in current status (see state table) | 409 | false |
| AVAILABILITY_REVISION_CONFLICT | expected_revision differs from stored revision | 409 | true, after re-read |
| AVAILABILITY_CAPACITY_EXHAUSTED | remaining < quantity at hold time | 409 | false |
| AVAILABILITY_WINDOW_HAS_CONFIRMED_CLAIMS | withdraw requested while capacity_confirmed > 0 | 409 | false |
| AVAILABILITY_CLAIM_EXPIRED | confirm or release attempted after hold_expires_at | 409 | false |
| AVAILABILITY_CLAIM_NOT_HELD | confirm requested on a claim not in HELD | 409 | false |
| AVAILABILITY_TEMPORARILY_UNAVAILABLE | storage or dependency timeout (see failure spec) | 503 | true, with backoff |

## Field rules
### Schedule (create and update)
- R-SCH-01: `provider_ref` must equal the authenticated provider. Mismatch returns AVAILABILITY_CAPABILITY_DENIED.
- R-SCH-02: `timezone` must be a canonical IANA name. Aliases are normalized to canonical name before storage. Unknown returns AVAILABILITY_TIMEZONE_INVALID.
- R-SCH-03: `region_code` pattern `^[A-Z]{2}-[A-Z0-9]{1,3}$`. The subdivision must be in the platform allow-list maintained by F10 (A-availability-06).
- R-SCH-04: `weekday_mask` in 1..127.
- R-SCH-05: `blocks` length 1..14. Each block: local times in 24-hour `HH:MM`, minute in {00,15,30,45}, local_end > local_start. Blocks must not overlap. A block may not cross midnight; split it into two blocks.
- R-SCH-06: `capacity_per_window` in 1..100.
- R-SCH-07: Expansion check runs at create, at update and on each daily rolling extension. Windows that would exceed 1000 over the next 90 days are rejected with AVAILABILITY_SCHEDULE_EXPANSION_LIMIT.
- R-SCH-08: `service_offering_id` must be owned by the provider per mod_skills. Immutable after create.

### Window (create, publish, update)
- R-WIN-01: `start_at` and `end_at` are RFC 3339 UTC strings ending in `Z`. Other offsets are rejected as AVAILABILITY_START_NOT_ON_GRANULE only when the minute fails; a non-UTC offset is normalized before the check.
- R-WIN-02: Minute granularity check (AVAILABILITY_START_NOT_ON_GRANULE).
- R-WIN-03: Duration check (AVAILABILITY_DURATION_OUT_OF_RANGE).
- R-WIN-04: Start must be at or after server time minus 5 minutes skew allowance at create and publish (AVAILABILITY_START_IN_PAST).
- R-WIN-05: Horizon check (AVAILABILITY_HORIZON_EXCEEDED).
- R-WIN-06: Duplicate check against the partial unique index (AVAILABILITY_WINDOW_DUPLICATE).
- R-WIN-07: `capacity_total` in 1..100. On update, must be >= capacity_held + capacity_confirmed (AVAILABILITY_CAPACITY_BELOW_COMMITTED).
- R-WIN-08: `note` at most 280 code points after NFC normalization and trimming. Empty string is stored as NULL.
- R-WIN-09: `note` must not contain an e-mail pattern, phone-number pattern (E.164 or national formats with 7 or more digits), `http://` or `https://` URL, or a messenger handle pattern (`@` followed by 3 or more word characters). Matches return AVAILABILITY_NOTE_CONTAINS_CONTACT_DATA. Rationale: contact data belongs in the booking channel, not in public listings (PROJECT_SPEC trust boundaries).
- R-WIN-10: Window `region_code`, `timezone` and `service_offering_id` are copied from the schedule or request and are immutable after create.

### Claim (hold, confirm, release)
- R-CLM-01: `quantity` in 1..10 and at most `capacity_total` of the window. Otherwise AVAILABILITY_QUANTITY_OUT_OF_RANGE.
- R-CLM-02: `claimant_ref` must match `^clm_[0-9A-HJKMNP-TV-Z]{26}$`. Other formats return AVAILABILITY_CAPABILITY_DENIED because only booking_service may write claims.
- R-CLM-03: `booking_ref` on confirm must be a ULID and must match the booking-side reference recorded at hold (checked by the booking caller contract, A-availability-05).
- R-CLM-04: `idempotency_key` required on every command; see R-ENV-01.

### Envelope
- R-ENV-01: `idempotency_key` required on all state-changing commands, 16 to 64 characters from `[A-Za-z0-9_-]`. Failure returns AVAILABILITY_IDEMPOTENCY_KEY_INVALID.
- R-ENV-02: `schema_version` must be the exact string `1.0.0` or the integer 1 in the envelope. Other values return AVAILABILITY_SCHEMA_VERSION_UNSUPPORTED.
- R-ENV-03: Unknown payload fields are rejected with AVAILABILITY_SCHEMA_VERSION_UNSUPPORTED when `schema_version` is absent, and ignored when present (forward compatibility within a major version). Ignored fields are logged by name only.

## Requirements
- [ ] PS-028-02.R01: Every field rule above has a single error code from the catalogue. No code is reused for a different meaning.
- [ ] PS-028-02.R02: Invalid, expired, duplicate and adversarial inputs are covered by tests in contract_and_acceptance_tests.md (TEST-PS-028-09-T02 and T03).
- [ ] PS-028-02.R03: Validation latency budget is in observability_performance.md.
- [ ] PS-028-02.R04: Validation messages returned to clients use `message_key` identifiers for localization. Raw input is never echoed in messages.
- [ ] PS-028-02.R05: Contact-data pattern list is versioned with the schema; changes are recorded in AvailabilityAudit as configuration events.

## Open decisions
- A-availability-02: 15-minute granularity and 5-minute skew allowance are defaults; both are configurable only by platform operators.
- A-availability-06: The region allow-list source is F10 output. Until CTR-PRV-001 expands, this module treats the list as an input and does not define it.
- Contact-data patterns are a deliberate minimum. Stronger detection (for example, obfuscated handles) is a moderation concern, not a validation concern.
