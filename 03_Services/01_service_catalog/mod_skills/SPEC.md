# F03.S01.M01 — Service skills catalog

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S01](../SPEC.md). **Process IDs:** PS-029-01…PS-029-10. **Code:** `packages/services/src/service_catalog/skills`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Providers keep service offerings in their local vault (skills from the shared taxonomy, an hourly or fixed rate, a coarse service area, self-attested credentials) attached to a service-type listing. Publishing signs a public projection (statement classrup.services.offering/v1) that the provider hands to any user-selected relay for indexing; withdrawing signs a tombstone. Credentials are claims by the provider and are always labelled self-attested; nobody verifies licences. Scheduling is F03.S01.M02, quotes and bookings F03.S02.M01. Per ADR-0016 the vault is authoritative; a relay only hosts the signed projection and may refuse it by policy.

## Responsibilities

- Own the ServiceOffering record in the provider vault and its lifecycle draft, published, withdrawn; sign the public projection and the tombstone with the provider device key.
- Validate skill codes against the taxonomy (F18.S01.M03), rate Money against the currency registry (F09.S03.M01) and the service area against coarse regions (maximum L2, geohash 5).
- Store credentials as self-attested claims with an optional evidence attachment reference; never mark them verified.
- Enforce local limits - 10 skills, 10 credentials, 20 published offerings per provider vault.
- Track per-relay delivery of the projection through the sync states local committed, prepared, transport_acknowledged, peer_accepted and never claim more than the state reached.

## Not responsible for

- Listing text, photos and category (F01.S01.M01); the offering references one service-type Listing.
- Weekly slots, exceptions and holds (F03.S01.M02 availability).
- Quotes, bookings and milestones (F03.S02.M01, F03.S02.M02).
- Search ranking and indexing (F06.S01.M01 consumes services.offering.published).
- Future: third-party credential verification and licence registry lookups.

## User stories

- As a provider, I can describe my service, choose up to 10 skills, set an hourly or fixed rate and a service area, and publish it.
- As a client, I can read an offering and see which credentials are self-attested rather than verified.
- As a provider, I can withdraw an offering and open quotes on it are closed cleanly.

## Edge cases

- Provider publishes an offering whose rate currency is not in the registry; rejected with VALIDATION_FAILED and a field path.
- Provider changes the rate of a published offering while quote requests are open; existing quotes keep their own amount, only new requests use the new rate.
- Service area is submitted at geohash 6 or finer; rejected with SERVICES_AREA_TOO_PRECISE, never silently truncated.
- The linked service listing is unpublished or expired by F01; the offering is withdrawn with reason listing_unavailable.
- Two devices of one provider edit the same offering; the second write fails with CONFLICT_REVISION.
- A relay refuses or removes the projection by hosting policy; the local offering stays published locally, the sync state shows relay refused, and the provider may choose another relay.
- Provider revokes the device key that signed the projection; the projection is re-signed with a current key and the old signature is no longer shown as valid.
- Credential text contains an HTML tag or a link; it is stored as plain text and never rendered as markup.

## UX and accessibility

- Offering editor: skills multi-select (max 10) with taxonomy search, rate type toggle hourly or fixed, amount with currency, minimum billable minutes, service area picker limited to L2 cells, remote-capable switch.
- Credentials editor: label, issuer, year, optional evidence photo; every row shows a self-attested badge.
- Public offering page: skills chips, rate, region name, credential list with self-attested labels, provider pseudonym and reputation summary link.

**States:** loading; empty; draft; published; withdrawn; validation-error; conflict; pending-offline

**Accessibility:** Rate input has a visible label that includes the currency and uses inputmode=decimal.; Skills multi-select is a listbox operable by keyboard with a live count announcement (for example 3 of 10 selected).; The self-attested badge is text, not colour alone, and is part of the credential row accessible name.

## Owned data

- `ServiceOffering` (classrup.services.offering/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `services.offering.create`, `services.offering.revise`, `services.offering.publish`, `services.offering.withdraw`
- Queries: `services.offering.get`, `services.offering.list_mine`
- Emits: `services.offering.published`, `services.offering.withdrawn`, `services.offering.revised`
- Consumes: `bazaar.listing.unpublished`, `bazaar.listing.expired`

## Dependencies

F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-029-01 | [Domain schema](domain_schema.md) | 3 |
| PS-029-02 | [Validation rules](validation_rules.md) | 3 |
| PS-029-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-029-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-029-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-029-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-029-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-029-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-029-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-029-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_catalog/skills/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No credential is ever displayed without the self-attested label and no verified flag exists in any payload.
- No public payload carries a service area finer than geohash 5.
