# PS-002-04 — Public API and domain event contract

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-04.R01: POST /api/v1/listings with authenticated actor, session CSRF proof, Idempotency-Key:UUIDv7 and command_id:UUIDv7; JSON body kind/title/description/condition/public_area_id/price/quantity/price_on_request. Response 201 data {id:UUIDv7,revision:1,state:"draft"} and meta {request_id:UUIDv7}.
- PS-002-04.R02: Standard error application/problem+json fields type,title,status,code,request_id,field_errors,retryable as canonical CORE contract; 401/403/409/413/422/429/503 stable mapping, including 409 IDEMPOTENCY_MISMATCH on changed payload for same key.
- PS-002-04.R03: listing.created event version 1 contains listing_id, kind and coarse public_area_id if provided; no description/message/home address/payment data. Envelope references aggregate_revision=1, tenant ID, correlation and causation ID.
## Example
POST body {"command_id":"018f2077-58a7-7c00-b63f-90b5c2df1271","kind":"sell","title":"Amplifier","public_area_id":"region-bc-vancouver","price":{"currency":"CAD","amount_minor":"4500"}}
201 body {"data":{"id":"018f2077-58a7-7c00-b63f-90b5c2df1272","revision":1,"state":"draft"},"meta":{"request_id":"018f2077-58a7-7c00-b63f-90b5c2df1273"}}
## Acceptance
TEST-PS-002-04 validates JSON/OpenAPI generated contract, type-safe consumer and no draft search event. Current OpenAPI not generated.
