# Independent review: selective PR #8 secret-field classification recovery

## Reviewed source

- Candidate commit: `f22e88507ac8f58487d7f125650dad8b0a6ac429`.
- Candidate tree: `9097e5ceaccd28c060db5b776f635764e4a4b1df`.
- Parent: `38ada90037d8176b0e0e319651b712cc396cad5d`, tree
  `8502bd83d5393a7513ee0a939df63d5d3665068d`.
- Preserved reference: PR #8 source `a403614bb34d3d176d4693730e512e14959718b8`,
  `packages/security/src/authz/secrets/redact.ts`.
- Reviewed production blob: `packages/kernel/src/observability/redact.ts`,
  `b6b3fd7aadd54e1638cc94c06f6ea724689151b9`.
- Reviewed test blob: `packages/kernel/src/observability/redact.test.ts`,
  `59f17dc4369068d3dd0e8ec4821946c743e071a2`.

This lane reviewed the existing logger/redactor, the preserved PR #8 source,
current secret-naming specifications, the prepared patch and its final local
commit. Read-only source comparisons verified the unchanged safeguards below.
No product tests, vulnerability reproduction, exploitation or remote writes
were performed by this lane. The implementation lane likewise reported no test
execution before committing this slice; qualification remains separate.

## Conclusion

No blocking issue was identified in this bounded adaptation. It recovers useful
secret-field classification vocabulary into the existing kernel redactor while
preserving the current logger's stronger diagnostic restrictions. It does not
import the unfinished PR #8 secret loader or replace the logging pipeline.

## Classification and metadata review

The added exact aliases are `bearer` and `pwd`. Added suffix families are
`passwd`, `pepper`, `apikey`, `datakey`, `signingkey`, `secretkey`, `accesskey`,
`credential` and `credentials`. A read-only comparison confirmed that no
previous exact key or suffix rule was removed.

The existing lowercasing and underscore/hyphen normalization remain unchanged.
The prepared fixtures exercise uppercase, mixed-case, camel-case, underscore
and hyphen names, nested objects and array entries. The implementation drops
matched fields entirely, retaining the current kernel contract rather than
the preserved PR #8 serializer's replacement-value behavior.

Review found that the current canonical secrets specification names
`CLASSRUP_SECRET_*`, whereas PR #8's implementation names `RELAY_SECRET_*`.
The final patch recognizes both normalized prefixes, including documented
versioned and file-suffixed forms. This reconciles the classification vocabulary
without claiming that either secret-loading workflow is implemented here.

No generic `key` suffix was added. Public references, identifiers, counts and
policy metadata remain outside the new rules: the fixtures explicitly retain
`publicKey`, `keyId`, `tokenCount`, `passwordPolicy`, `authorizationMode`,
`credentialId`, `secretKeyVersion` and the logger's normal correlation/module/
code/duration fields. The documented inventory shape `{ name, source, bytes }`
also remains available. Values attached directly to a reserved secret-namespace
key are suppressed as a deliberate naming policy, even if a caller intended
that particular value as metadata; inventory metadata should use its documented
separate fields.

Existing production logger call sites inspected in the command bus, HTTP
server, outbox dispatcher, sync sender and governance/ranking modules use
metadata names outside the added secret families. No unintended loss of those
observed fields was identified.

## Preserved safeguards

| Safeguard | Source evidence |
|---|---|
| Sensitive fields are omitted at every supported nesting level | The traversal from `isIpKey` onward in `redact.ts` is byte-identical to the parent. Only classification vocabulary changes. |
| IP truncation takes precedence over generic sensitive-address dropping | `walkObject` still checks `isIpKey` first; `ip.ts` is byte-identical to the parent. IPv4 /24 and IPv6 /48 behavior is unchanged. |
| Log messages remain event identifiers | `logger.ts` is byte-identical to the parent. `EVENT_ID` admission and free-text replacement remain in `format`. |
| Error details remain stripped before field redaction | The unchanged logger still calls `withoutErrorDetails` before `redact`; Error messages, stacks and causes are not restored by this adaptation. |
| Caller data remains unmodified | The existing copying traversal is unchanged; the new nested fixture explicitly checks input equality after redaction. |
| Child bindings receive the same classification as event fields | The new source-level test uses actual `createLogger` child bindings and checks emitted ring-buffer records, including retained safe metadata. |
| Existing recursion/string/cycle bounds remain intact | Traversal, depth limit, string clipping and circular-object handling are unchanged. |

The new logger fixture combines secret-field removal with IP truncation,
safe Error-code preservation, free-text message replacement and a zero dropped
line count. These are meaningful assertions in the reviewed test source, not
an execution result from this reviewer.

## Limits and integration follow-through

- This is structured field-name classification. It does not introduce a scanner
  for arbitrary field contents or expand normalization to arbitrary punctuation.
- Direct calls to the generic `redact` helper retain their previous behavior.
  The stronger Error-detail policy belongs to `createLogger`; this change does
  not claim that direct generic redaction acquires that policy.
- The PR #8 `Secret` wrapper, pattern scanner, replacement serializer, redacting
  sink, environment/file loader and relay composition are not imported or
  qualified. This slice does not complete the secrets module or PR #8.
- No new telemetry, sink, dependency or cryptographic behavior is introduced.
- Run the existing and added observability checks, typecheck and applicable
  current-source integration gates. Record their actual source identity and
  outcomes separately. This review does not turn pending or prior-source tests
  into passing candidate qualification.

Only this review note was written by the independent review lane. Production
and test edits remain owned by the implementation lane.
