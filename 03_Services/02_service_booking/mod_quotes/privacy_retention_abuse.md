# PS-032-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-07. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines data classes, storage location, retention, disclosure, deletion and abuse controls for quotes. Business outcome: quote records reveal no exact home address or precise location, participants are identified only by pseudonymous participant IDs, and spam or harassment through quotes is rate-limited, reportable and holdable.

Exclusions: network metadata, counterparty identity beyond participant IDs, and legal process. Pseudonyms give no anonymity guarantee against these (PROJECT_SPEC trust boundaries).

## Requirements
- PS-032-07.R01: Every field is assigned a data class in Section 1. Fields without a class are not stored.
- PS-032-07.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial privacy and abuse cases are listed in Section 5 and tested in TEST-PS-032-07-T01 to T05.
- PS-032-07.R03: Free text is user content, is never rendered as links in v1, and is never written to logs or events. Accessibility: notes are presented with a plain-text label and length counter.
- PS-032-07.R04: Retention periods in Section 2 apply per record class. Legal hold suspends deletion.
- PS-032-07.R05: Disclosure to non-parties is limited to the QUOTES_NOT_FOUND response and aggregate metrics without identifiers.
- PS-032-07.R06: Abuse controls in Section 3 are enforced server-side. Client-side limits are advisory only.
- PS-032-07.R07: Deletion and anonymization in Section 4 remove or tombstone personal references in all quote records and outbox payloads.

## 1. Data classes (CTR-PRV-001 labels, requested from F10)
| Field group | Class label | Storage location | Disclosure |
|---|---|---|---|
| provider_participant_id, requester_participant_id | pseudonymous party reference | Primary store, region as deployed | Parties and operators with case |
| service_ref, request_ref | opaque reference | Primary store | Parties |
| line items, totals, currency, valid_until | commerce evidence | Primary store | Parties; operators with case |
| notes, description, counter_note | user text | Primary store only | Parties only; never in events or logs |
| region_code (if operator enables it) | coarse location | Primary store | Parties; never precise |
| content_hash, decision timestamps | commerce evidence | Primary store | Parties |
| audit records of operator access | operational audit | Audit store | Operators and auditors |

No field holds a home address, precise coordinates, contact details or real name. A quote carries no precise location. Where a service needs precise location, that is handled by a separate disclosure flow owned by F10 and is out of scope here (D05).

## 2. Retention
| Record | Default period | Trigger | Notes |
|---|---|---|---|
| Composing quote, untouched | 30 days, then WITHDRAWN (STALE_COMPOSING) | `updated_at` | Then retained as a closed quote |
| Closed non-accepted quote (DECLINED, WITHDRAWN, EXPIRED) | 180 days, then anonymized | `closed_at` | Commerce evidence minimized (Section 4) |
| ACCEPTED quote | 2555 days under commerce evidence class | `closed_at` | Period is a default pending F10 (D07) |
| Idempotency records | 24 hours | `created_at` | Section 4 of commands file |
| Outbox events | 14 days after `published_at` | `published_at` | Payloads contain no free text |
| Operator audit records | 365 days | write time | Audit store |

Legal hold overrides all rows: no deletion or anonymization while a hold is recorded against the quote or party.

## 3. Abuse controls
| Control | Limit (A-quotes-13) | On exceed |
|---|---|---|
| Create per provider | 30 per hour | QUOTES_RATE_LIMITED with `retry_after` |
| Revise per provider | 120 per hour | QUOTES_RATE_LIMITED |
| Respond per requester | 60 per hour | QUOTES_RATE_LIMITED |
| Open quotes per provider | 200 in ISSUED or COUNTER_PROPOSED | QUOTES_OPEN_QUOTE_LIMIT_REACHED |
| Counters per quote | 3 | QUOTES_COUNTER_LIMIT_REACHED |
| List per participant | 60 requests per minute | QUOTES_RATE_LIMITED |
| Duplicate open quote per pair | 1 non-terminal | QUOTES_DUPLICATE_OPEN_QUOTE |

Other controls:
- Block: a block between parties prevents create, issue and ACCEPT (A-quotes-12).
- Report: any party can report a quote through the moderation feature. A report references the quote ID and a reason code only. No free text is forwarded.
- Hold: operator sets moderation_hold (C6). Issue and ACCEPT are blocked while held (A-quotes-11).
- Enumeration: non-party access returns QUOTES_NOT_FOUND. List endpoints return only caller's own quotes.
- Scraping: list pagination capped at 50 with opaque cursors.
- Fraud signal: a provider issuing many quotes that are declined or withdrawn within 1 minute of issue generates a `FRAUD_SIGNAL` for moderation review. The module does not block automatically in v1.

## 4. Deletion and anonymization
- Participant deletion request: party references in closed quotes are replaced by the tombstone token `deleted_participant`. Free text fields (`description`, `notes`, `counter_note`) are erased. Amounts and timestamps remain for ACCEPTED quotes as commerce evidence.
- Open quotes (COMPOSING, ISSUED, COUNTER_PROPOSED) of a deleting participant are WITHDRAWN with `closed_reason` WITHDRAWN_BY_PROVIDER (provider deletion) or DECLINED (requester deletion), before anonymization.
- Outbox payloads are not rewritten. They contain no free text and carry participant IDs only until the outbox retention expires.
- Export before deletion follows import_export_backup_rollback.md.

## 5. Privacy and abuse cases
| Class | Case | Expected result | Test |
|---|---|---|---|
| normal | Quote created and accepted; payloads scanned | No free text or personal field in events or logs | T01 |
| invalid | Notes containing an address-like string | Accepted as user text; not logged; no location field created | T01 |
| expired | Anonymization job runs on quote in 180-day window | Only quotes past window are touched | T04 |
| duplicate | Two create attempts for the same pair | Second rejected by uniqueness rule | T03 |
| concurrent | Hold and issue race | Serialized; issue blocked if hold committed first | T03 |
| adversarial | Burst of 31 creates in one hour from one provider | 31st returns QUOTES_RATE_LIMITED | T02 |
| adversarial | Non-party probes IDs | QUOTES_NOT_FOUND only | T05 |
| adversarial | Requester in block list tries ACCEPT | QUOTES_PARTY_BLOCKED | T03 |

## Assumptions and open decisions
- A-quotes-13: Rate limits and open-quote cap as in Section 3.
- A-quotes-17: Non-accepted closed quotes anonymized 180 days after closure. ACCEPTED quotes retained 2555 days as commerce evidence.
- A-quotes-18: Free text is plain text, not rendered as links in v1, and not scanned by this module.
- A-quotes-19: Location is at most an operator-defined coarse region code (ISO 3166-2 subdivision or geohash of precision 4 or lower). No precise location field exists.
- D05 (open, DECISIONS.md): coarse public regions and user-initiated precision disclosure. This module takes only the coarse class.
- D07 (open, DECISIONS.md): retention defaults in Section 2 are recommended values, not approved policy.
