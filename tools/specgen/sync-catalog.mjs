#!/usr/bin/env node
// Folds entities and produced events declared in module specs back into planning/modules.yaml
// (union; never removes catalog entries). Preserves comment lines and module order.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadCatalog, loadSpecs } from './model.mjs';

const file = join(ROOT, 'planning', 'modules.yaml');
const catalog = loadCatalog();
const specs = loadSpecs(catalog);
const q = (s) => JSON.stringify(String(s));
const list = (a) => `[${a.join(', ')}]`;
const out = readFileSync(file, 'utf8').split('\n').map((line) => {
  const m = /^- \{id: (F\d\d\.S\d\d\.M\d\d),/.exec(line);
  if (!m) return line;
  const c = catalog.get(m[1]); const s = specs.get(m[1])?.spec;
  const owns = [...new Set([...(c.owns || []), ...((s?.processes?.domain_schema?.entities || []).map((e) => e.name))])];
  const emits = [...new Set([...(c.emits || []), ...((s?.processes?.commands_queries_events?.events_produced || []).map((e) => e.type))])];
  return `- {id: ${c.id}, ps: ${c.ps}, path: ${c.path}, title: ${q(c.title)}, code: ${c.code}, owns: ${list(owns)}, emits: ${list(emits)}, resp: ${q(c.resp)}}`;
});
writeFileSync(file, out.join('\n'));
console.log('catalog synced');
