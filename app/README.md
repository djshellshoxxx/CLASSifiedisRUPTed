# ClassRup framework demo (app/)

Mock-backed PWA shell with zero runtime dependencies. Synthetic data only. Not production: no auth, no server, no payments, nothing is published.

## Run

    cd app
    npm ci
    npx playwright install chromium firefox webkit
    npm test
    npm run verify:browser

The managed verification command starts its own server on port 4173 (the port must be free), runs all eight
journey check files plus smoke on Chromium, Firefox and WebKit, and stops the server afterwards. Each script
has a 150-second timeout; the full run has a 15-minute limit and no automatic retries. Missing browsers,
script errors and assertion failures fail the command. HTML reports and per-script output attachments are
written to playwright-report/ and test-results/ (ignored by Git). Existing explicit SKIP lines remain in the
attachments and are not assertion passes. This is browser-engine coverage, not real-device or screen-reader certification.

For one engine: npm run verify:browser -- --project=firefox. On Linux, install system dependencies with
npx playwright install --with-deps chromium firefox webkit. Playwright Test is an exact locked development
dependency; the application itself remains static and has no runtime dependencies.

For an interactive demo, run npm start. To run a standalone journey against that server, set BASE and BROWSER
in your shell, then run npm run check:browser or npm run smoke. BROWSER defaults to chromium; invalid values fail.
PowerShell example:

    $env:BROWSER='firefox'
    $env:BASE='http://localhost:4173/'
    npm run check:browser

On sandboxed systems, set PLAYWRIGHT_BROWSERS_PATH and npm's --cache option to writable directories before
installing. Use the same PLAYWRIGHT_BROWSERS_PATH when running checks. Do not commit binaries or caches.

Status and historical evidence: [STATUS.md](STATUS.md). Current scope and acceptance criteria:
[VERIFICATION_PLAN.md](VERIFICATION_PLAN.md). CI targets the documented demo integration branch
work/classrup-haiku-framework; it does not deploy or approve specifications.

## Layout

- `src/domain/listings.js`: validation, filter, sort, pagination (pure, tested).
- `src/lib/money.js`: integer minor-unit parsing and formatting.
- `src/data/repositories.js`: replaceable repository interfaces (listings, saved, drafts). Swap these for real service adapters.
- `src/data/storage.js`: never-throwing storage adapter with in-memory fallback.
- `src/data/fixtures.js`: synthetic listings, demo profile, read-only barter fixtures.
- `src/views/*`: browse, listing detail, editor (draft + simulated submit), saved, account, barter (read-only).
- `src/lib/dom.js`, `src/lib/dialog.js`: DOM helpers, shared loading/error/empty states, confirm dialog.

## Mock boundaries

- Submitted listings live in memory for the page session only.
- "Message seller" is simulated; nothing is sent.
- Barter views show fixtures; no matching, consent, expiry or settlement exists.
- No real authentication or permissions; the account page is a fixed demo profile.
- No service worker: installable manifest only, no offline behaviour.
- Localization: English strings only; no i18n framework was added.

Tooling references: [Playwright browsers](https://playwright.dev/docs/browsers), [managed web server](https://playwright.dev/docs/test-webserver), and [CI setup](https://playwright.dev/docs/ci-intro).
