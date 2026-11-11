# PS-070-05 — Authorization and capabilities: Disputes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M02 Disputes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/disputes` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-070-05.R01** Under vault policy (CAP-8) only the unlocked principal acts in its vault; party-only commands check membership in the case, and mediator commands check that the mediator did was accepted by every party of the case in signed statements.
- **PS-070-05.R02** Incoming statements are accepted only when signed by a party or the accepted mediator for that statement type; otherwise they are quarantined.
- **PS-070-05.R03** Relay policy only governs the mediator directory a relay publishes; relay moderators have no authority over a case unless every party of the case selected them, and then only the power to sign statements.
- **PS-070-05.R04** A mediator's link to the relay it claims to moderate is proved only by a directory entry signed by that relay's key and verified by each vault; a self-declared mediator cannot decide a mediator-only outcome.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| commerce.dispute.open | local-principal | principal is a party returned by DisputeContextPort.resolve; vault unlocked; allowed against a blocked party |
| commerce.dispute.add_evidence | local-principal | principal is a party of the case; case not terminal |
| commerce.dispute.respond | local-principal | principal is a respondent of the case |
| commerce.dispute.select_mediator | local-principal | principal is a party of the case; no active mediator |
| commerce.dispute.accept_mediator | local-principal | principal is a party of the case (opener or respondent) that has not yet signed acceptance of the proposed mediator |
| commerce.dispute.propose_outcome | local-principal | principal is a party, or the mediator accepted by every party with mediator status active |
| commerce.dispute.accept_outcome | local-principal | principal is a party of the case and a proposal is pending |
| commerce.dispute.withdraw | local-principal | principal is the opener |
| commerce.dispute.ingest | local-principal | internal ingest pipeline; signer authorized for the statement type |
| commerce.dispute.read | local-principal | principal is a party of the case or the active mediator for the evidence items shared with it |
| commerce.dispute.mediator_list | anonymous, relay-device-key | relay policy row mediation_directory enabled; read-only; entries signed by the relay key |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-070-09.T09 | integration | PS-070-04.R02, PS-070-05.R01, PS-070-07.R02 | every party selects and accepts relay-verified mediator M; A shares two of five evidence items; M proposes no_fault_close | M receives only the two shared items; case resolved without acceptance |
| TEST-PS-070-09.T10 | abuse | PS-070-05.R01, PS-070-05.R02, PS-070-05.R03 | non-party signer, mediator not accepted by every party, relay moderator without selection | quarantined or FORBIDDEN; relay sees only ciphertext |
| TEST-PS-070-09.T19 | abuse | PS-070-05.R04, PS-070-01.R05 | B selects a mediator did with no directory entry, then one with an entry signed by a different relay key, and that mediator proposes no_fault_close | both labelled self_declared; the mediator-only outcome is refused with COMMERCE_DISPUTE_MEDIATOR_UNVERIFIED; the same outcome resolves only after every party accepts |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F15.S02.M03, F10.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
