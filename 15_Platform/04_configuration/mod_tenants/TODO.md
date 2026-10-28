# TODO: F15.S04.M03 tenants

**Status:** IMPLEMENTED; enforcement is relay wiring.

## Implemented
- [x] `TenantService`: CRUD with expectedVersion, active/suspended machine, limit overrides, `assertTenantActive` (`packages/platform/src/config/tenants.ts`; `packages/platform/test/config.test.ts`)
- [x] Ops create/update/suspend/reactivate/get/list (`packages/platform/src/config/operations.ts`)

## Remaining
- [ ] Relay calls `assertTenantActive` on the request path and feeds `operatorAccountId` to paid promotions
- [ ] Tenant deletion/export (privacy package)

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
