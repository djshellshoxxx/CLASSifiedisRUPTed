# PS-005-05 — Authorization and capabilities: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-05.R01** Vault policy: only the giver's principal defines terms, selects, declines and confirms; only the requester's principal creates or withdraws a request.
- **PS-005-05.R02** Incoming statements are accepted only if signed by the stated requester or, for selection, by the listing owner key (CAP-8); otherwise quarantined with a reason.
- **PS-005-05.R03** Relay policy: mailbox access for the encrypted envelopes is authorized by the relay for signed requests from the recipient's registered device key; the relay cannot read request contents.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.giveaway_terms.define | owner | listing.ownerId = local principal; listing kind giveaway; status draft, published or unpublished |
| bazaar.giveaway_request.create | owner | local principal is the requester; not blocked by the giver; one live request per giveaway |
| bazaar.giveaway_request.receive | peer | statement signed by the requester key; signature verified; giveaway owned by local principal |
| bazaar.giveaway_request.decide | owner | request.giverId = local principal |
| bazaar.giveaway_request.read_as_giver | owner | listing.ownerId = local principal |
| bazaar.giveaway_request.read_own | owner | request.requesterId = local principal |
| bazaar.giveaway_request.relay_mailbox | relay-member | relay policy: request signed by the recipient device key; ciphertext only; mailbox quota default 10 MiB |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T08 | integration | PS-005-04.R02, PS-005-05.R02 | statement with wrong signer, tampered body, unknown schema | all quarantined with reasons; none queued |
| TEST-PS-005-09.T09 | abuse | PS-005-05.R01, PS-005-05.R03 | non-giver selects; relay reads mailbox | FORBIDDEN; relay holds ciphertext only |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
