# F03.S01.M01 — Service skills catalog

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F03.S01](../SPEC.md). **Process IDs:** PS-029-01…PS-029-10. **Code:** `packages/services/src/service_catalog/skills`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Providers keep service offerings in their local vault as P3 records (skills from the shared taxonomy, an hourly or fixed rate, a coarse L2 service area, self-attested credentials) attached to a service-type listing. Publishing checks federation_publish consent for each user-selected relay, signs a public P0 projection (statement classrup.services.offering/v1, fields from the F11.S01.M01 allowlist) and hands it to those relays for indexing; revising a published offering or revoking its signing key re-signs the projection with seq+1 and prev. Withdrawing a published offering emits services.offering.withdrawn, from which F11.S01.M02 issues the single signed tombstone; withdrawing a never-published draft stays inside the vault. Credentials are claims by the provider and are always labelled self-attested; nobody verifies licences. Scheduling is F03.S01.M02 (read at publish for the provider time zone), quotes and bookings F03.S02.M01. Per ADR-0016 the vault is authoritative; a relay only hosts the signed projection and may refuse or remove it by its own policy, which is recorded only as that relay's sync state.

## Responsibilities

- Own the ServiceOffering record in the provider vault and its lifecycle draft, published, withdrawn; sign the public projection with the provider device key and re-sign it on every published revision and on revocation of the signing key.
- Validate skill codes against the taxonomy (F18.S01.M03), rate Money against the currency registry (F09.S03.M01) and the service area as exactly L2 (geohash 5) through F06.S02.M01 assertPublicCell.
- Store credentials as self-attested claims with an optional evidence attachment reference; never mark them verified.
- Enforce local limits - 10 skills, 10 credentials, 20 published offerings per provider vault.
- Track per-relay delivery of the projection through the sync states local committed, prepared, transport_acknowledged, peer_accepted and refused, and never claim more than the state reached.
- Delegate the withdrawal tombstone to F11.S01.M02, which issues it from services.offering.withdrawn; this module never signs a second tombstone.

## Not responsible for

- Listing text, photos and category (F01.S01.M01); the offering references one service-type Listing.
- Weekly slots, exceptions and holds (F03.S01.M02 availability).
- Quotes, bookings and milestones (F03.S02.M01, F03.S02.M02); F03.S02.M01 closes open quotes when it consumes services.offering.withdrawn.
- Search ranking and indexing (F06.S01.M01 consumes services.offering.published).
- Tombstone issuing and relay storage of the projection as a FederatedRecord (F11.S01.M02).
- Central suspension or takedown of providers; none exists (N20, ADR-0016 section 8), and a relay's refusal or removal is recorded only in that relay's sync state.
- Future: third-party credential verification and licence registry lookups.

## User stories

- As a provider, I can describe my service, choose up to 10 skills, set an hourly or fixed rate and a service area, and publish it.
- As a client, I can read an offering and see which credentials are self-attested rather than verified.
- As a provider, I can withdraw an offering and open quotes on it are closed cleanly.

## Edge cases

- Provider publishes an offering whose rate currency is not in the registry; rejected with VALIDATION_FAILED and a field path.
- Provider changes the rate of a published offering while quote requests are open; the revision re-signs the projection with seq+1, existing quotes keep their own amount and only new requests use the new rate.
- Service area is submitted at geohash 6 or finer; rejected with SERVICES_AREA_TOO_PRECISE, never silently truncated; a geohash 4 cell is rejected with VALIDATION_FAILED because the search index stores L2 cells only.
- The linked service listing is unpublished (any reason, including policy_changed) or expired by F01; the offering is withdrawn with reason listing_unavailable.
- Two devices of one provider edit the same offering; the second write fails with CONFLICT_REVISION.
- A relay refuses or removes the projection by hosting policy; the local offering stays published, syncState for that relay becomes refused with that relay's statement of reasons, and the provider may choose another relay.
- Provider revokes the device key that signed the projection; identity.device_key.revoked is consumed, the same content is re-signed with a current key (seq+1, prev) and the old signature is no longer shown as valid.
- Credential text contains an HTML tag or a link; it is stored as plain text and never rendered as markup.
- Provider withdraws a never-published draft, or the 90-day sweep withdraws it; the withdrawal stays in the vault with no tombstone, no outbound statement and no event.
- Publish names a relay without federation_publish consent; publish fails with SERVICES_PUBLISH_CONSENT_MISSING before anything is signed.

## UX and accessibility

- Offering editor: skills multi-select (max 10) with taxonomy search, rate type toggle hourly or fixed, amount with currency, minimum billable minutes, service area picker limited to L2 cells, remote-capable switch.
- Credentials editor: label, issuer, year, optional evidence photo; every row shows a self-attested badge.
- Publish sheet: relay choice (max 5) with consent status per relay, the PRV-6 notice that copies already fetched cannot be recalled, and a preview of exactly the public fields.
- Public offering page: skills chips, rate, region name, credential list with self-attested labels, provider pseudonym and reputation summary link.

**States:** loading; empty; draft; published; withdrawn; validation-error; conflict; pending-offline; relay-refused

**Accessibility:** Rate input has a visible label that includes the currency and uses inputmode=decimal.; Skills multi-select is a listbox operable by keyboard with a live count announcement (for example 3 of 10 selected).; The self-attested badge is text, not colour alone, and is part of the credential row accessible name.

## Owned data

- `ServiceOffering` (classrup.services.offering/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `services.offering.create`, `services.offering.revise`, `services.offering.publish`, `services.offering.withdraw`
- Queries: `services.offering.get`, `services.offering.list_mine`
- Emits: `services.offering.published`, `services.offering.withdrawn`, `services.offering.revised`
- Consumes: `bazaar.listing.unpublished`, `bazaar.listing.expired`, `identity.device_key.revoked`, `privacy.deletion.completed`

## Dependencies

F01.S01.M01, F01.S01.M03, F03.S01.M02, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-029-01 | [Domain schema](domain_schema.md) | 3 |
| PS-029-02 | [Validation rules](validation_rules.md) | 3 |
| PS-029-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-029-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-029-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-029-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-029-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-029-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-029-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-029-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/services/src/service_catalog/skills/index.ts`.

## Acceptance criteria

- All tests T01–T20 pass in CI.
- No credential is ever displayed without the self-attested label and no verified flag exists in any payload.
- No public payload carries a service area other than a geohash 5 cell, and every published revision is re-signed with a higher seq.
