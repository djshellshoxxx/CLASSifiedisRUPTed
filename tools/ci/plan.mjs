#!/usr/bin/env node
// Decides which CI matrices a change needs. First-party tooling only: the workflow pipes
// `git diff --name-only <base> HEAD` into this script instead of using a path-filter action.
// Usage: git diff --name-only BASE HEAD | node tools/ci/plan.mjs <event-name>
// Prints GITHUB_OUTPUT lines: os=<json array>, browsers=<space list>, projects=<playwright flags>, key=<cache key part>.
//
// Policy: pushes to main and manual runs get every OS and every browser. A pull request gets
// the Linux gate, plus the other operating systems only when it touches what differs per OS
// (CLI, build, toolchain), plus Firefox and WebKit only when it touches what differs per engine
// (the PWA, browser storage, cryptography, signed-envelope code). An empty or unreadable
// change list means "unknown", which is treated as "everything".
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const ALL_OS = ['ubuntu-latest', 'windows-latest', 'macos-latest'];
export const ALL_BROWSERS = ['chromium', 'firefox', 'webkit'];

const SHARED = [/^\.github\/workflows\//, /^tools\/ci\//, /^package\.json$/, /^pnpm-lock\.yaml$/, /^pnpm-workspace\.yaml$/, /^\.npmrc$/, /^playwright\.config\.ts$/];
const OS_SENSITIVE = [...SHARED, /^tools\/cli\//, /^tests\/cli\//, /^apps\/pwa\/public\//];
const ENGINE_SENSITIVE = [...SHARED, /^apps\/pwa\//, /^tests\/browser\//, /^tools\/cli\//,
  /^packages\/(?:vault|identity|security|federation)\//, /^packages\/kernel\/src\/storage\//, /^packages\/kernel\/src\/browser\.ts$/];

const touches = (files, patterns) => files.some((file) => patterns.some((pattern) => pattern.test(file)));

export function plan({ event, files }) {
  const changed = files.map((file) => file.trim().replaceAll('\\', '/')).filter(Boolean);
  const everything = event !== 'pull_request' || changed.length === 0;
  const os = everything || touches(changed, OS_SENSITIVE) ? ALL_OS : ['ubuntu-latest'];
  const browsers = everything || touches(changed, ENGINE_SENSITIVE) ? ALL_BROWSERS : ['chromium'];
  return { os, browsers, projects: browsers.map((name) => `--project=${name}`).join(' '), key: browsers.join('-') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = process.argv[2];
  if (!event) throw new Error('Usage: node tools/ci/plan.mjs <event-name> < changed-files');
  const decided = plan({ event, files: readFileSync(0, 'utf8').split('\n') });
  console.log(`os=${JSON.stringify(decided.os)}`);
  console.log(`browsers=${decided.browsers.join(' ')}`);
  console.log(`projects=${decided.projects}`);
  console.log(`key=${decided.key}`);
}
