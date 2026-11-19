# Local qualification and execution limits

Candidate `a111eefb907a9f039f56777715e20b4976ea3d87` has the same publication tree as local `5d8c789`, and the same runtime as qualified source PR #53. The [machine-readable record](local-qualification.json) preserves actual counts, commands, hashes, and archive mappings.

| Check | Actual result |
|---|---|
| Typecheck | Retry passed without source changes; original exit 137 remains preserved. |
| Strict specifications / dependency boundaries / registry | Passed; 148 modules, 18 features and 565 registry edges. |
| Independent money vectors / bundle budget | Passed. |
| Locked dependency audit | No advisories reported. |
| Tooling / CLI sequential retries | 27/27 and 32/32 passed, zero skips; original unsuccessful concurrent attempts remain preserved. |
| Full domain invocation | 699 passed, 2 timed out, 0 skipped; 71 of 73 files passed. Not a clean full-suite result. |
| Isolated encrypted-backup retry | 1 passed in 15,016 ms, 18 cases filtered out; original 20-second test limit unchanged. |
| Isolated withdrawal-budget retry | 1 passed in 58,565 ms, 15 cases filtered out; original 60-second test limit unchanged. |
| Additional independent adversarial probes | 10 passed. |
| Setup / production build | Passed. |
| Local Chromium | 24 cases failed in browser launch; zero application journeys executed. |

The timed-out cases pass individually without a code, assertion or timeout change. That supports a local execution-timing explanation, but does not rewrite the full invocation as green. The earlier threaded attempts were interrupted without completed reports. The final forked full report and each isolated report are retained separately.

Pinned browser download responses were invalid/truncated ZIP files. System Chromium 156.0.8078.79 was available, but its required local socket was denied by the command sandbox before a page opened. The standard escalation attempt was rejected because this environment disables escalated commands. No sandbox restriction was bypassed. Hosted pinned-engine and platform checks remain the browser qualification gate.

Original failure/incomplete evidence: [download log](browser-install.log), [complete Chromium launch failures](browser-chromium.log), [first domain attempt](domain-initial-incomplete.log), [first serial attempt](domain-serial-incomplete.log), [sequential threaded attempt](domain-sequential-incomplete.log), [full forked run](domain-forks.log), [original triage](local-qualification-triage.md). The JSON record maps the original scratch paths in that historical triage to their durable archives. Current successful evidence: [tooling](tooling-sequential.log), [CLI](cli-sequential.log), [backup retry](isolated-backup.log), [withdrawal retry](isolated-withdrawal.log), [build](build.log).

No product source, test assertion, configured timeout or security control changed during this qualification. No deployment or release occurred.
