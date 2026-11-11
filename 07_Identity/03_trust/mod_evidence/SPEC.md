# F07.S03.M02 — Trust evidence

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S03](../SPEC.md). **Process IDs:** PS-057-01…PS-057-10. **Code:** `packages/identity/src/trust/evidence`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Trust attestations are small signed claims about a DID - self-declared labels, 'met in person' statements by a peer, 'email check claimed' statements signed by a relay operator, same-owner links signed by both DIDs, and generic claims signed by any third-party DID. Each is a signed statement (classrup.identity.attestation/v1) that evidences that the signer asserted the claim, not that it is true, and the interface always shows who signed it and the words 'this shows they said so'. The module stores no identity documents, no email addresses and no phone numbers (no KYC data). Subjects decide whether claims about them are shown publicly - every claim about another person is issued only to the subject, end-to-end encrypted, and becomes public only when the subject republishes it with an endorsement countersignature. A relay key is recognised only from the relay's own signed descriptor and the viewer's chosen relays and peers. The module also answers the same-owner linkage read used for anti-shill checks (N11).

## Responsibilities

- Define the attestation kinds and their default validity - self_claim 365 days, peer_met_in_person 180 days, relay_email_check 365 days, third_party 365 days, same_owner 365 days.
- Issue attestations as the local principal (self, peer, third party, same owner), receive and verify attestations from others, and revoke them with a signed revocation statement by the issuer.
- Let a relay operator issue a relay_email_check attestation signed with the relay's key after an out-of-band check, naming the relay origin and delivered only to the subject, storing only the fact and the date, never the email.
- Keep the relay key set - keys from the signed descriptors of the viewer's chosen relays and peers (F15.S02.M01, F11.S03.M01, F16.S02.M02) - and re-check relay_email_check attestations whenever it changes.
- Let the subject endorse a claim about itself so it can be shown publicly, co-sign same_owner links, and set local visibility; show attestations with issuer provenance.
- Answer identity.attestation.list_linkage with the same_owner links of a DID, which both the issuer's and the subject's device keys signed, for in-process host relay anti-shill checks (F04.S02.M01 V03, N11, PT-15), and implement SameOwnerLinkPort for the F07.S02.M01 KeyLinkagePort.
- Sign and store attestations, revocations and endorsements only through the F11.S01.M01 StatementPublisherPort (implemented by F11.S01.M02).

## Not responsible for

- Reputation from reviews (F07.S03.M01) and account recovery (F07.S01.M03).
- Performing email or phone verification flows; MVP relies on an operator's out-of-band check, and automated email proof through notification channels is Future.
- Collecting, storing or evaluating identity documents (KYC); explicitly out of scope.
- Relay identity keys and their rotation (F15.S02.M01, F11.S03.M01); this module only reads them.
- Future: automated email proof flow through F13, web-of-trust path display, attestation revocation lists distributed by relays.

## User stories

- As a user, I add a self-declared label such as 'Member of the Elm Street repair cafe' and it is shown as self-declared.
- As a buyer who just met a seller, I can sign 'met in person' about them and send it to them, and they can endorse it to show it on their profile.
- As a relay operator, I can state that I checked control of an email for a member without storing the email, and the member decides whether to show it.
- As a viewer, I can see exactly who signed each claim and whether I know or trust the signer.
- As a user with two identities, I can link them with a same-owner attestation that both identities sign, so a host relay can treat them as one bidder.

## Edge cases

- An attestation's signature is valid but the issuer is a brand-new DID; it is shown with the issuer's pseudonym and 'new signer' and carries no extra weight.
- The issuer revokes after the subject republished it; viewers who receive the revocation mark it revoked, viewers who do not stay unaware, and the UI shows 'last checked' time.
- A relay key is later compromised; the operator rotates it with classrup.federation.key_rotation/v1 and the descriptor lists the old key as retired; attestations from the old key show 'signer key retired' once viewers re-check the relay key set.
- A peer tries to attest 'met in person' for someone they never completed a meetup with; the issuing vault warns when no local meetup evidence exists and the statement then says 'no local evidence' in a field.
- A subject receives an unwanted claim about them (for example an insulting label); it arrives subject-only, the subject simply does not endorse it, can report it to the relay, and cannot delete the issuer's statement.
- 21 attestations exist for one subject; only the 20 newest valid ones are displayed and the rest are kept in history.
- The claimed expiry is 10 years ahead; it is clamped to the kind's maximum validity from local receipt time.
- An attestation label contains links, or looks like an official claim ('Verified by government'); free text is plain text, linkless, and labels with reserved official words are refused for self_claim.
- A user DID signs a relay_email_check naming relay R; R's descriptor is fetched and does not list the key, so the statement is rejected with IDENTITY_ATTESTATION_KIND_INVALID.
- R's descriptor cannot be fetched; the relay_email_check is shown only as a 'Signed claim' without the relay badge and re-checked when the relay key set changes.
- An issuer publishes a 'met in person' claim about someone straight to a public relay without the subject's endorsement; viewers store it but do not display it.
- A same_owner attestation carries only the issuer's signature; rejected with IDENTITY_ATTESTATION_KIND_INVALID.
- A relay signs a tombstone for someone's attestation; the attestation stays active and only that relay is dropped from provenance.

## UX and accessibility

- Profile > Trust: list of attestations with signer pseudonym, DID fingerprint, kind badge (Self-declared, Met in person - claimed by signer, Email check claimed by relay <host>, Same owner - both signed, Signed claim), 'this shows they said so', date, validity, endorsement state, and a 'Signed by' detail sheet.
- Issue attestation sheet: kind selector, claim label (80 chars), optional context, explanation of what the signature means and that the claim goes only to its subject, Sign button.
- Claims about me: received claims with Endorse and show publicly, Keep private, Report-to-relay; same-owner requests with Co-sign.
- Operator console: issue a relay email check for a DID after an out-of-band check, with a checklist and a note that the email is not stored and that the member decides whether to show it.

**States:** loading; empty; active; endorsed; not-endorsed; relay-key-unverifiable; expired; revoked; pending-offline; error

**Accessibility:** Kind badges have text labels and the signer detail is reachable by keyboard with a modal dialog that traps focus correctly.; Revoked and expired states are text and announced via aria-live polite.; All actions are buttons at least 44 by 44 px with accessible names including the claim label.

## Owned data

- `TrustAttestation` (classrup.identity.attestation/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `identity.attestation.issue`, `identity.attestation.receive`, `identity.attestation.endorse`, `identity.attestation.revoke`, `identity.attestation.set_visibility`, `identity.attestation.issue_relay`
- Queries: `identity.attestation.list_for_subject`, `identity.attestation.list_issued`, `identity.attestation.list_linkage`
- Emits: `identity.attestation.added`, `identity.attestation.revoked`
- Consumes: `federation.tombstone.applied`, `identity.portable_doc.published`, `identity.device_key.revoked`, `federation.peer.added`, `federation.peer.removed`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-057-01 | [Domain schema](domain_schema.md) | 3 |
| PS-057-02 | [Validation rules](validation_rules.md) | 5 |
| PS-057-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-057-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-057-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-057-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-057-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-057-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-057-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-057-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/trust/evidence/index.ts`.

## Acceptance criteria

- All tests T01-T25 pass in CI.
- No KYC, email, phone or document data is stored or logged by this module (privacy suite).
- Every displayed attestation shows its signer and the wording that it evidences an assertion, not truth, and no UI string calls a claim verified.
- A claim about another person is never displayed publicly without the subject's endorsement, and a relay badge appears only for keys listed in the named relay's descriptor.
