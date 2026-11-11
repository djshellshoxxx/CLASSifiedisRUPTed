#!/usr/bin/env node
// CLI: node tools/specgen/specgen.mjs check [--strict] [--only ID,ID] [--report] | render
import { loadCatalog, loadSpecs } from './model.mjs';
import { validateAll } from './validate.mjs';
import { renderModule, renderRollups, renderReport } from './render.mjs';

const [cmd = 'check', ...rest] = process.argv.slice(2);
const flag = (f) => rest.includes(f);
const onlyArg = rest[rest.indexOf('--only') + 1];
const only = rest.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : null;

const catalog = loadCatalog();
const specs = loadSpecs(catalog);
const v = validateAll(specs, catalog, { strict: flag('--strict') });
const scope = (list) => (only ? list.filter((m) => [...only].some((id) => m.startsWith(id + ':') || m.includes(` ${id}`))) : list);
const errs = scope(v.errors); const warns = scope(v.warnings);

if (cmd === 'check') {
  for (const e of errs) console.log(`ERROR ${e}`);
  if (!flag('--quiet')) for (const w of warns) console.log(`WARN  ${w}`);
  console.log(`specified ${specs.size - v.missing}/${specs.size} modules; ${errs.length} errors; ${warns.length} warnings`);
  if (flag('--report')) console.log(renderReport(specs, v) ? 'GO' : 'NO-GO');
  process.exit(errs.length ? 1 : 0);
} else if (cmd === 'render') {
  let n = 0;
  for (const [id, e] of specs) {
    if (!e.spec || (only && !only.has(id))) continue;
    if (v.results.get(id).errors.length) { console.log(`skip ${id}: ${v.results.get(id).errors.length} errors`); continue; }
    renderModule(id, e); n++;
  }
  if (!only) { renderRollups(specs, catalog, v); renderReport(specs, v); }
  console.log(`rendered ${n} modules`);
} else { console.error('usage: specgen check|render [--strict] [--only IDS] [--report]'); process.exit(2); }
