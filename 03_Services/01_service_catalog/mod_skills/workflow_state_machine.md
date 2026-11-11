# PS-029-03 — Workflow state machine: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-03.R01** Offerings follow draft, published, withdrawn; withdrawn is terminal and a new offering is created to return to market.
- **PS-029-03.R02** Publish re-runs all validation, requires a published service listing, a calendar from F03.S01.M02 and federation_publish consent for each selected relay, has the projection signed and stored through StatementPublisherPort.publish and writes the local event in the same IndexedDB transaction; a revision of a published offering republishes the projection with seq+1 and prev in the same way.
- **PS-029-03.R03** Withdrawal is automatic when the linked listing is unpublished or expired; relay-side refusal or removal never changes the local status and is recorded only in that relay's sync state.

## Specification

### ServiceOffering lifecycle

Initial **draft**; terminal **withdrawn**.

| Transition | Trigger | Guard / effect |
|---|---|---|
| draft -> draft | services.offering.revise by provider | vault-local edit, revision+1; emits services.offering.revised |
| draft -> published | services.offering.publish by provider | full validation, published listing, calendar present, consent per relay; projection seq 1 signed through StatementPublisherPort.publish, projectionCid = returned cid; emits services.offering.published |
| draft -> withdrawn | services.offering.withdraw by provider or the 90-day draft sweep | vault-local only, reason provider or draft_expired; no statement, no tombstone and no event |
| published -> published | services.offering.revise by provider | re-validate, publish a new classrup.services.offering/v1 projection with seq+1 and prev = projectionCid through StatementPublisherPort.publish, queue it to the sync outbox of every consented relay; emits services.offering.revised and services.offering.published with the new projectionCid |
| published -> published | identity.device_key.revoked consumed for the key that signed the projection | same content republished through StatementPublisherPort.publish, which signs with a current key, seq+1 and prev; emits services.offering.published |
| published -> withdrawn | services.offering.withdraw by provider, or bazaar.listing.unpublished or bazaar.listing.expired consumed | records withdrawReason provider or listing_unavailable; emits services.offering.withdrawn, from which F11.S01.M02 issues the tombstone |

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> draft: services.offering.revise by provider
  draft --> published: services.offering.publish by provider
  draft --> withdrawn: services.offering.withdraw by provider or the 90-day draft sweep
  published --> published: services.offering.revise by provider
  published --> published: identity.device_key.revoked consumed for the key that signed the projection
  published --> withdrawn: services.offering.withdraw by provider, or bazaar.listing.unpublished or bazaar.listing.expired consumed
  withdrawn --> [*]
```

### Timeouts and scheduled transitions

- Draft offerings untouched for 90 days are withdrawn with reason draft_expired by a local sweep that runs at app start and every 60 minutes while the PWA is open; the withdrawal is vault-local only; without the app open nothing runs and the sweep catches up at next start.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T03 | property | PS-029-03.R01 | random command sequences on one offering | only declared transitions succeed; withdrawn never leaves terminal state |
| TEST-PS-029-09.T04 | integration | PS-029-03.R02 | publish with the listing unpublished; publish with no calendar | first returns SERVICES_LISTING_NOT_SERVICE, second returns PRECONDITION_FAILED; neither signs a statement or emits an event |
| TEST-PS-029-09.T05 | integration | PS-029-03.R03, PS-029-04.R03 | bazaar.listing.unpublished (reason policy_changed) delivered twice, then a relay refusal with a statement of reasons | offering withdrawn once with reason listing_unavailable; refusal stored only as syncState[relay] refused with the relay statement |
| TEST-PS-029-09.T14 | e2e | PS-029-03.R02, PS-029-09.R03 | mobile provider creates and publishes an offering and a client views it | credentials show self-attested; screen passes axe with zero serious issues |
| TEST-PS-029-09.T17 | integration | PS-029-03.R01, PS-029-04.R02 | revise the rate of a published offering, then revoke the signing key | new projection with seq+1 and prev = old cid; relay and client views carry the new projectionCid and rate; after revocation the same content is re-signed with a current key |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F03.S01.M02, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
