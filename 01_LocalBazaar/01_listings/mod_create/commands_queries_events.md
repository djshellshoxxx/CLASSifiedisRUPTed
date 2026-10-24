# PS-002-04 — Local interface and domain event contract

**Status:** SPECIFIED_REVIEW_PENDING — architecture/security/protocol review outstanding; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Inherits [client-owned architecture](../../../planning/CLIENT_SIDE_ARCHITECTURE.md), [core commands/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md) and [listing contract](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md). These contracts supersede conflicting backend assumptions in historical parent text. Stable requirement/test IDs retained with explicitly revised local semantics.

## Requirements
- PS-002-04.R01: `execute({vault_id,principal_id,command_id,operation:"listing.create",input})` derives owning principal from unlocked vault context. UUIDv4 command ID allocated once and reused. Success receipt `{command_id,object_id,revision:1,local_status:"committed",event_ids,committed_at}`; local commit needs no cookie/CSRF/API. Input cannot choose ownership/state. `queryCommand(command_id)` resolves unknown outcome, `listing.getOwn(id)` and paged `listing.listOwn` query only active vault; list pages <=100 by local stable ID, snapshot cursor returns CURSOR_STALE after mutation.
- PS-002-04.R02: Return CR-002 Problem `{code,request_id,field_errors,retryable,retry_after_ms?}`. VAULT_LOCKED/FORBIDDEN/FEATURE_DISABLED, IDEMPOTENCY_MISMATCH, validation/storage/local quota codes are stable. Query hidden/foreign object returns NOT_FOUND. Peer adapter errors never rewrite a committed local result.
- PS-002-04.R03: listing.created v1 envelope has local vault/principal/aggregate refs, revision1, client occurred_at, correlation/causation refs and payload `{listing_id,kind,public_area_id?}`. No title/description/contact/payment/keys. Event never implies publication/export; outbound public records are separately allowlisted and protocol-gated.

## Example
`execute({vault_id:"<local-vault>",principal_id:"<unlocked-principal>",command_id:"<uuidv4>",operation:"listing.create",input:{kind:"sell",title:"Amplifier",price:{currency:"CAD",amount_minor:"4500"}}})` returns local committed draft receipt after transaction complete, including offline. Angle-bracket placeholders are illustrative, not schema-valid IDs.

## Acceptance
TEST-PS-002-04 validates typed input/result/event schemas and forbidden fields, snapshot cursor invalidation, query authorization and no draft sharing. No OpenAPI/server contract required; no generated schema or executed test yet.
