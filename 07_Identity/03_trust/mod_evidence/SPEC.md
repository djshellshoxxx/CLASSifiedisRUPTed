# F07.S03.M02 — Trust evidence

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S03](../SPEC.md). **Process IDs:** PS-057-01…PS-057-10. **Code:** `packages/identity/src/trust/evidence`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Trust attestations are small signed claims about a DID - self-declared labels, 'met in person' statements by a peer, 'verified email' statements signed by a relay operator, and generic claims signed by any third-party DID. Each is a signed statement (classrup.identity.attestation/v1) that evidences that the signer asserted the claim, not that it is true, and the interface always shows who signed it. The module stores no identity documents, no email addresses and no phone numbers (no KYC data). Subjects control whether a claim about them is shown publicly, to contacts, or not at all.

## Responsibilities

- Define the attestation kinds and their default validity - self_claim 365 days, peer_met_in_person 180 days, relay_verified_email 365 days, third_party 365 days.
- Issue attestations as the local principal (self, peer, third party), receive and verify attestations from others, and revoke them with a signed revocation statement by the issuer.
- Let a relay operator issue a relay_verified_email attestation signed with the relay's key after an out-of-band check, storing only the fact and the date, never the email.
- Show attestations with issuer provenance and keep subject-controlled visibility (public, contacts, private) for display and re-publication.

## Not responsible for

- Reputation from reviews (F07.S03.M01) and account recovery (F07.S01.M03).
- Performing email or phone verification flows; MVP relies on an operator's out-of-band check, and automated verification via notification channels is Future.
- Collecting, storing or evaluating identity documents (KYC); explicitly out of scope.
- Future: automated email proof flow through F13, web-of-trust path display, attestation revocation lists distributed by relays.

## User stories

- As a user, I add a self-declared label such as 'Member of the Elm Street repair cafe' and it is shown as self-declared.
- As a buyer who just met a seller, I can sign 'met in person' about them, and they can show it on their profile.
- As a relay operator, I can attest that I checked control of an email for a member without storing the email.
- As a viewer, I can see exactly who signed each claim and whether I know or trust the signer.

## Edge cases

- An attestation's signature is valid but the issuer is a brand-new DID; it is shown with the issuer's pseudonym and 'new signer' and carries no extra weight.
- The issuer revokes after the subject republished it; viewers who receive the revocation mark it revoked, viewers who do not stay unaware, and the UI shows 'last checked' time.
- Relay key is later compromised; the operator publishes a signed revocation or key retirement; attestations from the old key show 'signer key retired' once viewers learn of it.
- A peer tries to attest 'met in person' for someone they never completed a meetup with; the issuing vault warns when no local meetup evidence exists and the statement then says 'no local evidence' in a field.
- A subject receives an unwanted claim about them (for example an insulting label); they set visibility private and can report it to the relay, but they cannot delete the issuer's statement.
- 21 attestations exist for one subject; only the 20 newest valid ones are displayed and the rest are kept in history.
- The claimed expiry is 10 years ahead; it is clamped to the kind's maximum validity from local receipt time.
- An attestation label contains links, or looks like an official claim ('Verified by government'); free text is plain text, linkless, and labels with reserved official words are refused for self_claim.

## UX and accessibility

- Profile > Trust: list of attestations with signer pseudonym, DID fingerprint, kind badge (Self-declared, Met in person, Verified by relay, Signed claim), date, validity, and a 'Signed by' detail sheet.
- Issue attestation sheet: kind selector, claim label (80 chars), optional context, explanation of what the signature means, Sign button.
- Operator console: issue relay attestation for a DID after an out-of-band check, with a checklist and a note that the email is not stored.

**States:** loading; empty; active; expired; revoked; pending-offline; error

**Accessibility:** Kind badges have text labels and the signer detail is reachable by keyboard with a modal dialog that traps focus correctly.; Revoked and expired states are text and announced via aria-live polite.; All actions are buttons at least 44 by 44 px with accessible names including the claim label.

## Owned data

- `TrustAttestation` (classrup.identity.attestation/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `identity.attestation.issue`, `identity.attestation.receive`, `identity.attestation.revoke`, `identity.attestation.set_visibility`, `identity.attestation.issue_relay`
- Queries: `identity.attestation.list_for_subject`, `identity.attestation.list_issued`
- Emits: `identity.attestation.added`, `identity.attestation.revoked`
- Consumes: `federation.tombstone.applied`, `identity.device_key.revoked`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-057-01 | [Domain schema](domain_schema.md) | 3 |
| PS-057-02 | [Validation rules](validation_rules.md) | 3 |
| PS-057-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-057-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-057-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-057-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-057-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-057-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-057-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-057-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/trust/evidence/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- No KYC, email, phone or document data is stored or logged by this module (privacy suite).
- Every displayed attestation shows its signer and the wording that it evidences an assertion, not truth.
