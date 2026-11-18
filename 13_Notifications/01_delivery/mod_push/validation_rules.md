# PS-104-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-02.R01 | Endpoint must be `https`, port 443, no userinfo, host in the push-service allowlist (ASSUMPTION: maintained in config, not code). Violations are rejected before any outbound request. | MVP |
| PS-104-02.R02 | `p256dh` and `auth` are validated by decoded length and prefix (0x04 for `p256dh`). | MVP |
| PS-104-02.R03 | Dispatch payload is a JSON object of at most 256 bytes with only the keys `ntf_id`, `category`, `schema_version`. | MVP |
| PS-104-02.R04 | `ttl` is an integer 0–2419200 (28 days). Default 3600 for `transactional`, 86400 for `deadline`. | MVP |
| PS-104-02.R05 | `urgency` is derived from `category` (`security`=high, `deadline`=high, `transactional`=normal, `activity`=low); clients cannot set it. | MVP |
| PS-104-02.R06 | Unknown `category` is rejected; the registry is owned by mod_opt (F13.S02.M03). | MVP |

## Data / schema
Validation inputs are the `push_subscription` and dispatch fields in [domain_schema.md](domain_schema.md).

| Field | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| endpoint | R01 | PUSH.ENDPOINT_HOST_NOT_ALLOWED | false | err.push.endpoint_host_not_allowed |
| endpoint | length 1–2048, parseable URL | PUSH.ENDPOINT_INVALID | false | err.push.endpoint_invalid |
| p256dh, auth | R02 | PUSH.KEY_INVALID | false | err.push.key_invalid |
| account active count | ≤ 10 | PUSH.SUBSCRIPTION_LIMIT | false | err.push.subscription_limit |
| payload | R03 | PUSH.PAYLOAD_FORBIDDEN_FIELD | false | err.push.payload_forbidden_field |
| ttl | R04 | PUSH.TTL_OUT_OF_RANGE | false | err.push.ttl_out_of_range |
| category | R06 | PUSH.CATEGORY_UNKNOWN | false | err.push.category_unknown |
| device_id | active `dev_` owned by same account | SYS.NOT_FOUND | false | err.sys.not_found |
| provider response 429/503 | classify | PUSH.PROVIDER_UNAVAILABLE | true | err.push.provider_unavailable |

## Commands / queries / events
Validation runs before any write and before any outbound call. Validation failures emit no event.

## States & transitions
Not applicable; validation is a guard. See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
- Envelope per CTR-ERR-001. `details[].rule` uses registry enums only.
- Input values, endpoint URLs and key material are never echoed (CTR-ERR-001 R06, R07).
- Message keys are rendered by the client catalog (see mod_languages).

## Authorization
Validation does not grant access. Ownership checks follow [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Validation is deterministic and side-effect free, so retries are safe. Client-side pre-validation is advisory only; the server repeats all checks.

## Privacy, retention, abuse
Rejected endpoint values are not stored. Logs record the rule enum and a salted hash of the endpoint host, never the full URL.

## Observability & budgets
Counter per `code` with labels `module=PUSH`. Validation p95 ≤ 5 ms per request.

## Tests
- TEST-PS-104-02-01 (unit): each rule in the table maps to exactly one code and retryable value.
- TEST-PS-104-02-02 (property): any `endpoint` with `http://` or non-443 port is rejected.
- TEST-PS-104-02-03 (unit): dispatch payload containing `"title"` is rejected with `PUSH.PAYLOAD_FORBIDDEN_FIELD`.
- TEST-PS-104-02-04 (contract): all codes conform to CTR-ERR-001 regex.

## Acceptance criteria
1. 100% of table rows have a passing unit test.
2. No rejected request produces an outbound HTTP call (asserted in integration test).
3. Error responses contain no input echo (automated check).

## Assumptions & open decisions
- ASSUMPTION: push-service host allowlist is operator-maintained.
- Message keys are proposals until mod_languages catalog is approved.
- No Dxx applies directly; retention of rejected data follows D07 default, PROVISIONAL (D07 default, unapproved).
