# TODO: F10 Privacy and data rights

**Status:** IMPLEMENTED

## Implemented
- [x] Package @classrup/privacy (packages/privacy): 20 operations, 7 modules, 17 policies, 15 event types
- [x] Tests: packages/privacy/test (consent, retention, export, delete, boundaries, contract)
- [x] See packages/privacy/README.md and traceability.json

## Remaining
- [ ] Relay wiring: register exporters/erasers for every feature, schedule export.expire_due and deletion.process_due.
- [ ] Other packages adopt hasConsent, assertNotHeld and the metadata utilities.
