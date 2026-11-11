# F10.S02.M02 Data classification model (PS-081)

Implemented: library only, no commands, queries or events. Entry `index.ts`: PrivacyClass P0..P4, LocationLevel L0..L4, Sink, `classOf`, `maxClass`, `canFlow`/`canFlowTo`, `capLocation`, `labelKey`,
`redactForLog|Event|Federation|Notification|Projection|Export` and generic `redactFor(sink, ...)`, `assertSinkSafe`, `loadClassification`/`registerClassification`/`createClassificationRegistry`,
`parseClassificationMap`, `validateCoverage` (V01, V06), `checkEventClass` (V02), `fieldPathsOfZod`, `lintClassification`, `geohashEncode`/`geohashBounds`.
Error codes defined here: PRIVACY_CLASSIFICATION_MISSING, PRIVACY_SINK_FORBIDDEN, PRIVACY_LOCATION_TOO_PRECISE.

Ports for the composition root: none. A `hash` callback may be passed in `RedactionContext` for the `hash` strategy (without it hash fields are dropped).

Deviations and decisions
- Redaction returns `{ value, dropped, refused?, error?, class }` (value null when refused) instead of a bare value, so refusal and fail-closed cases are explicit.
- Unannotated paths are dropped for every sink including the owner (stricter than "non-owner sinks"), N6 fail-closed.
- Federation always requires `ctx.optIn === true`; otherwise the result is refused (spec: "refused if opt-in is missing"). P2 to event/notification/export needs `owner` or `encrypted` (V05); P3 to event/export needs `owner`.
- Matrix choices not spelled out in CTR-PRV-001: P1 and P2 may reach event, notification, export, ui_participant and ui_owner; P4 never flows through these helpers.
- The `hash` and `truncate` strategies apply only to classes below P4; truncate handles IP literals and RFC 3339 timestamps, anything else is dropped.
- Free-text scrubbing (log sink) is hand-written and linear (emails, phone numbers, full IPv4 addresses) because regexes backtrack quadratically on hostile strings.
- Bounds: depth 32, 1 MiB per record (string and key lengths), 50 000 nodes, 10 000 paths per map; violations return PAYLOAD_TOO_LARGE with no values.
- The spec example geohash `u336y` does not match the cell computed for 52.5208, 13.4095; the implementation computes the real cell.
- The process-wide default registry is mutable module state (registration at load time, like the schema registry); explicit registries can be passed in the context.

Test rows not covered
- T12 (CI lint on the repository schemas): lint is implemented and unit tested on fixtures, but no repository schema has a classification map yet, so the row is not claimed.
- T13 (load and gzip size): not claimed; the 8 KiB gzip budget is not met by this implementation and no bundler check exists.
- T14 (traceability tool run): left to the tool.

Open questions
- Whether `export` should drop P1 of other users (spec text says "P2 and higher"; implemented as P2 and higher).
