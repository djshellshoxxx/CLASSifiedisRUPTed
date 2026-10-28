# PS-103-07 — privacy, retention and abuse controls

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-07 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-07.R01 — minimization

Store only notice IDs, local owner scope, source event ID/type/version, aggregate ID/revision, fixed category/message key, optional authorized local target, advisory created/read times and read state. Never copy event payload, free text, private messages, exact location, payment details, credentials, keys, contact data, consent evidence, or correlation/causation IDs into a notice. The UI preview and accessibility announcement use the same generic allowlisted localized copy. No dynamic payload interpolation or public projection.

The opt-in preference decision is evaluated before persistence. Missing/unavailable policy suppresses creation. Quiet hours suppress live banners while leaving an explicitly enabled inbox item available without interruption. A notice never triggers an OS notification, remote request, external adapter, analytics upload or automatic export.

## PS-103-07.R02 — retention and deletion

F10 owns the user-facing retention/erase policy; the proposed age cleanup is 30 advisory local days for read rows and the count cap is 1,000/vault. Read rows may be automatically removed by age only when local clock validity/order is available. Unread rows are never removed automatically by age or to make room; the user must explicitly delete them. Clock uncertainty pauses age cleanup and is never evidence of expiry or deadline. Keep no content after deletion; retain only the F15 consumer dedupe marker while its source event can be replayed. Default public export excludes both notice content and targets. User-initiated local deletion is scoped to this vault and cannot erase copies in a separately chosen backup.

F15 protected persistence is not approved here. No plaintext persistence fallback is allowed. If F15 supplies volatile mode, show “This session only; not saved”, never place content in browser notification surfaces, and clear it on lock, reload, close, or principal switch. User should be able to disable the feature and clear its local rows through the approved F10/F15 controls.

## PS-103-07.R03 — abuse cases and response

- Forged or imported events: accept only F15-validated local event records from the current vault; otherwise suppress/quarantine.
- Event flooding: process at most 100 events per transaction, enforce the 1,000-row and 4,096-byte caps, and leave the cursor pending when full; never evict unread rows without explicit user action.
- Payload injection/XSS: render only fixed message keys as text; no HTML, markdown, URL or untrusted attribute interpolation.
- Cross-principal snooping: bind every query to current vault/principal/capability and return uniform `NOT_FOUND`.
- Misleading semantics: all messages state local scope; never say delivered, accepted by peers, paid, settled, globally locked, or read by another person.
- Correlation leakage: do not expose source IDs, correlation IDs, or hidden object existence in previews, logs or public interchange.

## Acceptance mapping

- `TEST-PS-103-07`: private-content canaries through all four event types; unexpected fields; XSS strings; cross-vault lookup; flood/cap; quiet/opt-out; export exclusions; deleted row retention and no remote calls. No privacy test evidence exists yet.
