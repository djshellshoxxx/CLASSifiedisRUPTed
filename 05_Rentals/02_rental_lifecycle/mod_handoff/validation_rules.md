# PS-042-02 — validation rules

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-02. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines field, state and actor validation for every handoff command, and the complete typed error catalogue. Error envelopes follow CTR-ERR-001 (owner F15, OPEN). Field types follow [domain_schema.md](domain_schema.md).

## Requirements
- PS-042-02.R01 — Business outcome: every rejected command returns exactly one typed error code, names no other party's private data, and tells the client whether a retry can succeed.
- PS-042-02.R02 — Cases covered: invalid input (malformed IDs, bad enums, bad windows), expired windows, duplicate active handoffs, stale revisions, concurrent confirmations, offline replays, and adversarial input (non-party IDs, oversize payloads, contact details or URLs in notes, evidence refs owned by others).
- PS-042-02.R03 — Presentation: every error maps to a `message_key` (for example `handoff.error.conflict_revision`). Clients render localized text for that key. Error text is announced to screen readers through a live region, and no state is conveyed by colour alone. Touch targets for retry or refresh actions are at least 44 × 44 CSS px.
- PS-042-02.R04 — Validation order is fixed: (1) payload size and JSON syntax; (2) `schema_version`; (3) Idempotency-Key format; (4) authentication; (5) capability check; (6) existence and party check; (7) state guard; (8) business rules. The first failing step returns the error. A non-party gets `HANDOFF_NOT_FOUND` at step 6, not a capability error ([A-handoff-22](authorization_capabilities.md)).

## Field and business rules
| Rule | Applies to | Rule text | Error code on failure |
|---|---|---|---|
| VR-01 | all IDs | 26-char Crockford base32 ULID | `HANDOFF_ID_INVALID` |
| VR-02 | all commands | `schema_version` equals 1 | `HANDOFF_SCHEMA_VERSION_UNSUPPORTED` |
| VR-03 | all mutating commands | `Idempotency-Key` present and valid ULID | `HANDOFF_IDEMPOTENCY_KEY_MISSING` |
| VR-04 | create | `lessor_participant_id` ≠ `renter_participant_id` and both match the agreement | `HANDOFF_PARTICIPANT_NOT_IN_AGREEMENT` |
| VR-05 | create | agreement status is active | `HANDOFF_AGREEMENT_NOT_ACTIVE` |
| VR-06 | create | no other active handoff for the agreement | `HANDOFF_DUPLICATE_ACTIVE` |
| VR-07 | window | `window_end_utc` > `window_start_utc`; duration 15 min to 7 days ([A-handoff-04](#assumptions-and-open-decisions)) | `HANDOFF_WINDOW_INVALID` |
| VR-08 | window | `window_start_utc` ≥ now (create and reschedule); window within agreement period extended by 24 h before its start | `HANDOFF_WINDOW_IN_PAST` or `HANDOFF_WINDOW_INVALID` |
| VR-09 | item | `item_version` ≥ 1 and matches the catalog snapshot the agreement references | `HANDOFF_STALE_ITEM_VERSION` |
| VR-10 | reschedule | `reschedule_count` < 3 ([A-handoff-06](#assumptions-and-open-decisions)) | `HANDOFF_RESCHEDULE_LIMIT_REACHED` |
| VR-11 | respond/withdraw | accept or decline by counterparty only; withdraw by proposer only | `HANDOFF_FORBIDDEN` |
| VR-12 | confirm | `condition_code` in the enum; `not_assessed` allowed | `HANDOFF_CONDITION_CODE_INVALID` |
| VR-13 | confirm | `condition_note` ≤ 500 chars after NFC | `HANDOFF_NOTE_TOO_LONG` |
| VR-14 | meeting_note, condition_note | no `http://`, `https://`, `www.`, email-shaped or phone-shaped tokens (regex set in [privacy_retention_abuse.md](privacy_retention_abuse.md)) | `HANDOFF_NOTE_UNSAFE_CONTENT` |
| VR-15 | meeting_note | ≤ 140 chars after NFC | `HANDOFF_NOTE_TOO_LONG` |
| VR-16 | confirm | `evidence_refs` ≤ 5 items, each owned by the actor and linked to this handoff; hash check passes | `HANDOFF_EVIDENCE_REF_INVALID` |
| VR-17 | dispute | `dispute_reason_code` in enum | `HANDOFF_DISPUTE_REASON_INVALID` |
| VR-18 | confirm | actor's role not already attested | `HANDOFF_ALREADY_CONFIRMED` |
| VR-19 | all | `expected_revision` equals stored `revision` | `HANDOFF_CONFLICT_REVISION` |
| VR-20 | all | request size ≤ 16 KiB ([A-handoff-23](#assumptions-and-open-decisions)) | `HANDOFF_PAYLOAD_TOO_LARGE` |
| VR-21 | all | actor not blocked by counterparty or platform block list | `HANDOFF_PARTICIPANT_BLOCKED` |
| VR-22 | all | feature flag `handoff_enabled` on ([A-handoff-16](import_export_backup_rollback.md)) | `HANDOFF_FEATURE_DISABLED` |

## Error catalogue
| Code | HTTP | Retryable | When | message_key |
|---|---|---|---|---|
| `HANDOFF_ID_INVALID` | 400 | no | malformed ID | `handoff.error.id_invalid` |
| `HANDOFF_IDEMPOTENCY_KEY_MISSING` | 400 | no | no key on mutating call | `handoff.error.key_missing` |
| `HANDOFF_IDEMPOTENCY_KEY_REUSED` | 409 | no | same key, different body hash | `handoff.error.key_reused` |
| `HANDOFF_SCHEMA_VERSION_UNSUPPORTED` | 422 | no | version not 1 | `handoff.error.schema_unsupported` |
| `HANDOFF_PAYLOAD_TOO_LARGE` | 413 | no | > 16 KiB | `handoff.error.too_large` |
| `HANDOFF_NOT_FOUND` | 404 | no | unknown ID or non-party caller | `handoff.error.not_found` |
| `HANDOFF_FORBIDDEN` | 403 | no | capability or role missing | `handoff.error.forbidden` |
| `HANDOFF_PARTICIPANT_BLOCKED` | 403 | no | block list match | `handoff.error.blocked` |
| `HANDOFF_PARTICIPANT_NOT_IN_AGREEMENT` | 422 | no | party IDs do not match agreement | `handoff.error.party_mismatch` |
| `HANDOFF_AGREEMENT_NOT_ACTIVE` | 409 | no | agreement cancelled or closed | `handoff.error.agreement_inactive` |
| `HANDOFF_DUPLICATE_ACTIVE` | 409 | no | second active handoff | `handoff.error.duplicate_active` |
| `HANDOFF_WINDOW_INVALID` | 422 | no | bounds or duration | `handoff.error.window_invalid` |
| `HANDOFF_WINDOW_IN_PAST` | 422 | no | start before now | `handoff.error.window_past` |
| `HANDOFF_STALE_ITEM_VERSION` | 409 | yes (after refetch) | item version mismatch | `handoff.error.item_stale` |
| `HANDOFF_RESCHEDULE_LIMIT_REACHED` | 422 | no | 3 proposals used | `handoff.error.reschedule_limit` |
| `HANDOFF_INVALID_STATE` | 409 | no | command not allowed from state | `handoff.error.invalid_state` |
| `HANDOFF_ALREADY_CONFIRMED` | 409 | no | role already attested | `handoff.error.already_confirmed` |
| `HANDOFF_CONFLICT_REVISION` | 409 | yes (after refetch) | stale `expected_revision` | `handoff.error.conflict_revision` |
| `HANDOFF_EXPIRED` | 409 | no | past window grace end | `handoff.error.expired` |
| `HANDOFF_CONDITION_CODE_INVALID` | 422 | no | bad enum | `handoff.error.condition_invalid` |
| `HANDOFF_NOTE_TOO_LONG` | 422 | no | length limit | `handoff.error.note_long` |
| `HANDOFF_NOTE_UNSAFE_CONTENT` | 422 | no | URL or contact pattern | `handoff.error.note_unsafe` |
| `HANDOFF_EVIDENCE_REF_INVALID` | 422 | no | ref not owned or not linked | `handoff.error.evidence_invalid` |
| `HANDOFF_DISPUTE_REASON_INVALID` | 422 | no | bad enum | `handoff.error.dispute_reason` |
| `HANDOFF_RATE_LIMITED` | 429 | yes (after `Retry-After`) | rate limit ([A-handoff-13](privacy_retention_abuse.md)) | `handoff.error.rate_limited` |
| `HANDOFF_FEATURE_DISABLED` | 503 | yes (after flag on) | flag off | `handoff.error.disabled` |
| `HANDOFF_UPSTREAM_UNAVAILABLE` | 503 | yes | agreement, catalog or evidence dependency timeout | `handoff.error.upstream` |
| `HANDOFF_INTERNAL_ERROR` | 500 | yes | unhandled fault; no internal detail returned | `handoff.error.internal` |

## Assumptions and open decisions
- **Assumption A-handoff-04:** Window duration is 15 minutes to 7 days. The 24-hour pre-start allowance is measured from the agreement start. Default when a client offers no window is not supported in v1; the field is required.
- **Assumption A-handoff-23:** Maximum request payload is 16 KiB, measured on the decoded JSON body.
- Open decisions in this file: none beyond the assumptions above. D04 (partial barter execution) does not apply here.
