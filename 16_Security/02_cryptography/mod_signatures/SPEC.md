# F16.S02.M03 — signatures

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Security Lead (F16). **Parent:** F16.S02.

## Purpose and business behavior
Signs and verifies the bytes that ClassRup must prove later: event envelopes (CTR-EVT-001), signed statements such as receipts (D06), and federation bundles (CTR-FED-001). Uses one canonical signing input per subject type (domain tag plus RFC 8785 JCS) so that a signature made here verifies identically on every node. Does not store private keys (`mod_key`) and does not decide what is trusted (federation `mod_trust`, moderation).

## User stories
- As a federation node, I verify each inbound event signature before deduplication, so forged events are never stored.
- As a participant, I can check that a receipt or statement I hold was signed by the key it claims.
- As a Security Lead, I can see how many signatures failed per peer, so quarantine decisions are evidence-based.

## Scope
- Ed25519 sign and verify for event, statement and bundle subjects (ASSUMPTION: Ed25519 only at MVP).
- Signature record format and verification result states.
- Excludes: key generation and storage (F16.S02.M01), trust and quarantine (F11), receipt semantics (F09).

## Public interfaces
`signature.sign`, `signature.verify`, `signature.get`, event `signature.verification_failed`. Errors `SIG.*`. Detail in PS-130-04.

## Relationships, dependencies and integration
Upstream: F16.S02.M01 (`mod_key`), which supplies key validity windows. Downstream: F07.S02.M01, F07.S03.M02, F09.S02.M01, F11.S01.M03, F11.S03.M01, F12.S01.M02, F16.S03.M01 (`mod_threats`). Contracts: CTR-SCH-001, CTR-EVT-001.

## Data ownership
Canonical owner of the signature-record class: `16_Security/02_cryptography/mod_signatures` (this module, full ID). Consumers reference that full ID only (B-06, PROVISIONAL until recorded in CONTRACTS.md). `11_Federation/01_protocol/mod_signatures` consumes verification results and does not own records. Private keys are not owned here.

## Risk considerations
Forged signatures through algorithm confusion or non-canonical input; signing oracle misuse by a compromised producer; cross-domain or cross-audience replay; canonicalization mismatch making valid events fail or invalid ones pass; verification using a key after compromise; unsigned fallback when key service is down. Mitigations: closed algorithm enum, domain tags, audience in signed bytes, `compromised_at` checks, no unsigned fallback. No platform custody of money. Pseudonyms do not guarantee anonymity of signers.

## Completion criteria
10 process specs approved; RFC vector and interop tests passing; `sig`, `stt`, `bnd` prefixes registered; D01 and D06 resolved; security review passed.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-130-01 (SPEC-DRAFT-COMPLETE)
- [x] [validation_rules.md](validation_rules.md) — PS-130-02 (SPEC-DRAFT-COMPLETE)
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-130-03 (SPEC-DRAFT-COMPLETE)
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-130-04 (SPEC-DRAFT-COMPLETE)
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-130-05 (SPEC-DRAFT-COMPLETE)
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-130-06 (SPEC-DRAFT-COMPLETE)
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-130-07 (SPEC-DRAFT-COMPLETE)
- [x] [observability_performance.md](observability_performance.md) — PS-130-08 (SPEC-DRAFT-COMPLETE)
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-130-09 (SPEC-DRAFT-COMPLETE)
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-130-10 (SPEC-DRAFT-COMPLETE)
