# PS-085-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01 classes, R06 retention, R08 secrets, R09 logs), CTR-FED-001 (R08 per-audience pseudonyms, R09 compromise marker, peer states), CTR-EVT-001 (R06 no names or coordinates in envelopes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-07.R01 | Private signing keys are class `SECRET`. They are held only in the KMS and are never logged, exported, federated or shown after creation (CTR-PRV-001 R08). Scan test covers responses, logs and exports. | MVP |
| PS-085-07.R02 | Signature value and `key_id` are `PUBLIC` in federated events. Key projection metadata is `PUBLIC`. No signature field carries an IP address, device identifier or account ID. | MVP |
| PS-085-07.R03 | Verification logs carry `event_id`, `key_id`, `origin_node`, result code and timing. They never carry payload bytes or the signature value. | MVP |
| PS-085-07.R04 | Abuse threshold: a peer whose invalid-signature ratio exceeds 5% of events over 1 h, or 50 invalid events in 1 h, moves to `restricted` by automated threshold (ASSUMPTION; CTR-FED-001 trust transition). | MVP |
| PS-085-07.R05 | Export signatures are not linkable across audiences: the signed envelope uses the per-audience pseudonym (CTR-FED-001 R08); the key is the node key and is shared by design. | MVP |

## Data / schema
| Data | Class | Retention |
|---|---|---|
| Verification logs | PSEUDONYMOUS | RET-OPS, 30 days |
| Outbox rows (IDs, counters) | PSEUDONYMOUS | until sent or held; held rows 90 days (ASSUMPTION) |
| Key projection metadata | PUBLIC | while key is in force, plus RET-FED window (≥ 90 days beyond max envelope expiry) |
| Compromise and revocation audit records | PSEUDONYMOUS | RET-EVD, 24 months (ASSUMPTION; jurisdiction review OPEN) |
| Private key material | SECRET | KMS lifecycle only |

## Validation & errors
Diagnostics carry code and field path only (CTR-ERR-001 R06).

## Authorization
Log access requires `aud_`-recorded privileged read (PS-085-05 R05).

## Failure, idempotency, concurrency, offline
Deletion or expiry propagates to logs, outbox and caches within 24 h (CTR-PRV-001 R06). Compromise evidence is kept and not deleted early.

## Privacy, retention, abuse
- Threats: forged signatures from a compromised key (mitigated by compromise marker and quarantine); replay of old signed events (mitigated by `expires_at` and dedupe, PS-087); signature-failure flooding (mitigated by R04 and rate limits, CTR-FED-001 R11); metadata correlation through signature bytes (signatures are unique per event but carry no new identifiers).
- Keys are node keys. No user-level key material is stored here (D10 OPEN).

## Observability & budgets
Log redaction test in CI (TEST-PS-085-07-03). Budgets in PS-085-08.

## Tests
- TEST-PS-085-07-01 (unit): key projection and signature objects carry no field outside their allowed class list.
- TEST-PS-085-07-02 (negative): one planted key byte string never appears in logs, responses or exports.
- TEST-PS-085-07-03 (integration): verification log line for a failed event contains only allowed fields.
- TEST-PS-085-07-04 (abuse): peer sending 50 bad signatures in 1 h is moved to `restricted`.

## Acceptance criteria
1. No private key material found by TEST-PS-085-07-02 across logs, responses and exports.
2. Log fields are the allowed set; TEST-PS-085-07-03 passes.
3. Abuse threshold triggers as specified; TEST-PS-085-07-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: 5% ratio and 50-event threshold (F10 to confirm).
- ASSUMPTION: RET-EVD 24 months for compromise evidence; legal review OPEN (R07, RISK_REGISTER.md).
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- OPEN (D10): whether user keys sign federated events.
