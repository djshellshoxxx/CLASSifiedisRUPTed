# Verified blob capture consistency — qualification

Frozen direct parent draft PR #135, head `a26339a1c611a04a9db60fa4f3889347e9af323d`, tree `f868339d29f5715d34f9ede03bf9ba85e8773ee7`. This child is isolated from that remote commit. Preserve prior review and CI records; never attribute ancestor qualification to this source.

| Gate | Observation |
|---|---|
| #135 Alpha 45126884542 | Completed success (plan, typecheck, domain, build, Chromium/Firefox/WebKit); 963 domain assertions and 78 native browser journeys reported in the domain job |
| #135 CLI 45126884643 | Completed success (plan and Ubuntu Node 22/24 clean-install jobs) |
| Local checkout/worktree | Failed: `Could not resolve host: github.com` during `git ls-remote` |
| Local TypeScript, unit, integration and browser product tests | Not executed; source-level tests are unqualified until this child's exact-head CI |
| This child Alpha and CLI | Not yet observed at publication; inspect by actual head SHA |
| Genuine independent code/functional/security reviews | Not executed; no workers accessible through current toolset |
| Merge/main qualification | Not performed; requires current-source gates, independent reviews, qualified ancestors and main-push checks |

Historical failures, including #57's exit 137 without a final report, #56's cancelled main-push Alpha, and earlier candidate failures, remain separate. No weakened test limits, old signatures or runtime caps.
