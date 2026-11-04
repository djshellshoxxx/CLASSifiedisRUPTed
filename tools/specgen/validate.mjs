// Validation of module specs: per-module structure + cross-module references (ADR-0015).
import { PROCESSES, COMMON_ERRORS, TEST_LEVELS, cells, slugOf, contractIds } from './model.mjs';

const FORBIDDEN = /\b(TBD|TODO|FIXME|XXX|to be determined|to be decided|placeholder)\b/i;
const RE = {
  schema: /^classrup\.([a-z0-9]+)\.[a-z0-9_]+\/v\d+$/,
  event: /^([a-z0-9]+)\.[a-z0-9_]+\.[a-z0-9_]+$/,
  command: /^([a-z0-9]+)\.[a-z0-9_]+\.[a-z0-9_]+$/,
  error: /^[A-Z][A-Z0-9_]+$/,
  field: /^[a-zA-Z_][a-zA-Z0-9_]*\??\s*:\s*\S.*/,
  transition: /^[a-z_]+\s*->\s*[a-z_]+$/,
  covers: /^(0[1-9]|10)\.R\d\d$/,
};
const PRIVACY = /^P[0-4]$/;
const STORAGE = new Set(['relay', 'device', 'relay+device', 'derived']);

function nonEmptyStr(v) { return typeof v === 'string' && v.trim().length >= 8; }
function arr(v, min = 1) { return Array.isArray(v) && v.length >= min; }

/** Validates one module; returns {errors[], warnings[], facts} where facts feed cross-module checks. */
export function validateModule(id, entry, catalog) {
  const errors = []; const warnings = [];
  const E = (m) => errors.push(`${id}: ${m}`);
  const { cat, spec, parseError } = entry;
  const facts = { produced: new Set(), consumed: new Set(), errors: new Map(), caps: new Set(), deps: [], reqs: [] };
  if (parseError) { E(`YAML parse error: ${parseError}`); return { errors, warnings, facts }; }
  if (!spec) return { errors, warnings, facts, missing: true };
  const raw = JSON.stringify(spec);
  const bad = raw.match(FORBIDDEN); if (bad) E(`forbidden placeholder word "${bad[0]}"`);
  if (spec.id !== id) E(`id must be ${id}`);
  if (!['MVP', 'FUTURE'].includes(spec.scope)) E('scope must be MVP or FUTURE');
  if (spec.scope === 'FUTURE' && !nonEmptyStr(spec.deferral)) E('FUTURE scope requires deferral reason');
  if (!nonEmptyStr(spec.summary)) E('summary required');
  if (!arr(spec.responsibilities, 2)) E('responsibilities: >= 2');
  if (!arr(spec.non_responsibilities, 1)) E('non_responsibilities: >= 1');
  if (!Array.isArray(spec.depends_on)) E('depends_on must be a list (may be empty)');
  if (!arr(spec.user_stories, 2)) E('user_stories: >= 2');
  if (!arr(spec.edge_cases, 4)) E('edge_cases: >= 4');
  if (!spec.ux || (!arr(spec.ux.screens) && !nonEmptyStr(spec.ux.notes))) E('ux.screens or ux.notes required');
  const ctrs = contractIds();
  for (const d of spec.depends_on || []) {
    if (/^CTR-/.test(d)) { if (!ctrs.has(d)) E(`depends_on unknown contract ${d}`); }
    else if (!catalog.has(d)) E(`depends_on unknown module ${d}`);
    else if (d === id) E('depends_on self');
    else facts.deps.push(d);
  }
  const P = spec.processes || {};
  const slug = slugOf(id);
  for (const [pp, key] of PROCESSES) {
    const p = P[key];
    if (!p) { E(`processes.${key} missing`); continue; }
    if (!arr(p.requirements, 3)) E(`${key}.requirements: >= 3`);
    (p.requirements || []).forEach((r, i) => {
      if (!nonEmptyStr(r) || r.length < 20) E(`${key}.requirements[${i}] too short`);
      facts.reqs.push(`${pp}.R${String(i + 1).padStart(2, '0')}`);
    });
  }
  // 01 domain schema
  const ds = P.domain_schema || {};
  const ents = ds.entities || [];
  if (!Array.isArray(ds.entities)) E('domain_schema.entities must be a list');
  if (ents.length === 0 && !nonEmptyStr(ds.note)) E('domain_schema: empty entities requires note');
  const entNames = new Set(ents.map((e) => e.name));
  for (const o of cat.owns || []) if (!entNames.has(o)) E(`catalog-owned entity ${o} not specified`);
  for (const e of ents) {
    const where = `entity ${e.name}`;
    if (!(cat.owns || []).includes(e.name)) warnings.push(`${id}: ${where} not in catalog owns (add to planning/modules.yaml or rename)`);
    const m = RE.schema.exec(e.schema || ''); if (!m) E(`${where}: schema name invalid`); else if (m[1] !== slug) E(`${where}: schema slug must be ${slug}`);
    if (!STORAGE.has(e.storage)) E(`${where}: storage must be one of ${[...STORAGE]}`);
    if (!PRIVACY.test(e.privacy || '')) E(`${where}: privacy P0..P4`);
    if (!/^RET-[A-Z-]+$/.test(e.retention || '')) E(`${where}: retention class RET-*`);
    if (!arr(e.fields, 3)) E(`${where}: fields >= 3`);
    for (const f of e.fields || []) if (!RE.field.test(f)) E(`${where}: field "${f}" must be "name: type — constraint"`);
    if (!arr(e.invariants, 1)) E(`${where}: invariants >= 1`);
  }
  // 04 commands/queries/events (first, to collect error codes)
  const cq = P.commands_queries_events || {};
  for (const k of ['commands', 'queries', 'events_produced', 'events_consumed', 'errors']) if (!Array.isArray(cq[k])) E(`commands_queries_events.${k} must be a list`);
  if (!nonEmptyStr(cq.example)) E('commands_queries_events.example required');
  for (const row of cq.errors || []) {
    const [code, http, retry, meaning] = cells(row);
    if (!RE.error.test(code)) E(`error code ${code} invalid`);
    if (!/^[1-5]\d\d$/.test(http)) E(`error ${code}: http status`);
    if (!['yes', 'no'].includes(retry)) E(`error ${code}: retryable yes|no`);
    if (!nonEmptyStr(meaning)) E(`error ${code}: meaning`);
    facts.errors.set(code, meaning);
  }
  const knownErr = (c) => COMMON_ERRORS.has(c) || facts.errors.has(c);
  for (const ev of cq.events_produced || []) {
    const m = RE.event.exec(ev.type || ''); if (!m) { E(`event ${ev.type} invalid`); continue; }
    if (m[1] !== slug) E(`event ${ev.type}: must start with ${slug}.`);
    if (!PRIVACY.test(ev.privacy || '')) E(`event ${ev.type}: privacy`);
    if (!nonEmptyStr(ev.payload)) E(`event ${ev.type}: payload`);
    facts.produced.add(ev.type);
  }
  for (const e of cat.emits || []) if (!facts.produced.has(e)) E(`catalog event ${e} not in events_produced`);
  for (const ev of cq.events_consumed || []) {
    if (!RE.event.test(ev.type || '')) E(`consumed event ${ev.type} invalid`);
    if (!nonEmptyStr(ev.effect)) E(`consumed event ${ev.type}: effect`);
    facts.consumed.add(ev.type);
  }
  const caps = new Set();
  const az = P.authorization_capabilities || {};
  for (const row of az.capabilities || []) {
    const [cap, who, cond] = cells(row);
    if (!RE.command.test(cap)) E(`capability ${cap} invalid`);
    else if (!cap.startsWith(`${slug}.`)) E(`capability ${cap} must start with ${slug}.`);
    if (!who || !cond) E(`capability ${cap}: roles and conditions required`);
    caps.add(cap);
  }
  facts.caps = caps;
  const ops = [...(cq.commands || []).map((c) => ['command', c]), ...(cq.queries || []).map((q) => ['query', q])];
  if (ops.length && !arr(az.capabilities, 1)) E('authorization_capabilities.capabilities required when commands/queries exist');
  if (!ops.length && !nonEmptyStr(cq.note)) E('no commands/queries: commands_queries_events.note required (library module)');
  for (const [kind, c] of ops) {
    if (!RE.command.test(c.name || '') || !c.name.startsWith(`${slug}.`)) E(`${kind} ${c.name}: name must be ${slug}.<entity>.<verb>`);
    if (!caps.has(c.capability)) E(`${kind} ${c.name}: capability ${c.capability} not declared`);
    if (!nonEmptyStr(c.input) || !nonEmptyStr(c.output)) E(`${kind} ${c.name}: input and output required`);
    for (const er of c.errors || []) if (!knownErr(er)) E(`${kind} ${c.name}: error ${er} not defined`);
    if (kind === 'command') {
      if (!arr(c.errors, 1)) E(`command ${c.name}: errors >= 1`);
      for (const ev of c.emits || []) if (!facts.produced.has(ev)) E(`command ${c.name}: emits ${ev} not produced`);
      if (typeof c.idempotent !== 'boolean') E(`command ${c.name}: idempotent true|false`);
    }
  }
  // 02 validation
  const vr = P.validation_rules || {};
  if (!arr(vr.rules, 3)) E('validation_rules.rules >= 3');
  for (const row of vr.rules || []) {
    const [vid, text, code] = cells(row);
    if (!/^V\d\d$/.test(vid)) E(`rule ${vid}: id Vnn`);
    if (!nonEmptyStr(text)) E(`rule ${vid}: text`);
    if (!knownErr(code)) E(`rule ${vid}: error ${code} not defined`);
  }
  // 03 state machine
  const wf = P.workflow_state_machine || {};
  if (!Array.isArray(wf.machines)) E('workflow_state_machine.machines must be a list');
  if ((wf.machines || []).length === 0 && !nonEmptyStr(wf.note)) E('workflow: empty machines requires note');
  if (!Array.isArray(wf.timeouts)) E('workflow_state_machine.timeouts must be a list (may be empty)');
  for (const m of wf.machines || []) {
    const states = new Set(); const from = new Set();
    for (const row of m.transitions || []) {
      const [ft, trig, guard] = cells(row);
      if (!RE.transition.test(ft)) { E(`machine ${m.entity}: transition "${ft}" must be "a -> b"`); continue; }
      const [a, b] = ft.split('->').map((s) => s.trim()); states.add(a); states.add(b); from.add(a);
      if (!trig) E(`machine ${m.entity}: transition ${ft} trigger`);
      if (!guard) E(`machine ${m.entity}: transition ${ft} guard/effect`);
    }
    if (!arr(m.transitions, 1)) E(`machine ${m.entity}: transitions >= 1`);
    if (!states.has(m.initial)) E(`machine ${m.entity}: initial ${m.initial} not in transitions`);
    for (const t of m.terminal || []) { if (!states.has(t)) E(`machine ${m.entity}: terminal ${t} unused`); if (from.has(t)) E(`machine ${m.entity}: terminal ${t} has outgoing transition`); }
    if (!arr(m.terminal, 1)) E(`machine ${m.entity}: terminal >= 1`);
  }
  // 06..10 narrative keys
  const need = {
    failure_recovery_idempotency: ['idempotency', 'concurrency', 'retries', 'offline', 'partial_failure'],
    import_export_backup_rollback: ['export', 'import', 'backup', 'migration_rollback'],
  };
  for (const [k, keys] of Object.entries(need)) for (const kk of keys) if (!nonEmptyStr((P[k] || {})[kk])) E(`${k}.${kk} required`);
  const pr = P.privacy_retention_abuse || {};
  for (const k of ['data', 'retention', 'abuse_controls']) if (!arr(pr[k], 1)) E(`privacy_retention_abuse.${k} >= 1`);
  if (!arr(pr.threats, 2)) E('privacy_retention_abuse.threats >= 2');
  for (const row of pr.threats || []) { const c = cells(row); if (c.length < 3 || !/^T\d\d$/.test(c[0])) E(`threat "${row}" must be "Tnn | threat | control"`); }
  const ob = P.observability_performance || {};
  for (const k of ['metrics', 'logs', 'budgets']) if (!arr(ob[k], 1)) E(`observability_performance.${k} >= 1`);
  // 09 tests + coverage
  const ct = P.contract_and_acceptance_tests || {};
  if (!arr(ct.tests, 6)) E('tests >= 6');
  if (!arr(ct.acceptance, 3)) E('acceptance >= 3');
  const covered = new Set();
  for (const row of ct.tests || []) {
    const [tid, level, covers, scenario, expected] = cells(row);
    if (!/^T\d\d$/.test(tid)) E(`test ${tid}: id Tnn`);
    if (!TEST_LEVELS.has(level)) E(`test ${tid}: level ${level}`);
    for (const c of (covers || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!RE.covers.test(c)) E(`test ${tid}: covers "${c}" must be "pp.Rnn"`); else covered.add(c);
    }
    if (!nonEmptyStr(scenario) || !nonEmptyStr(expected)) E(`test ${tid}: scenario and expected`);
  }
  const untested = ct.untested || {};
  for (const r of facts.reqs) if (!covered.has(r) && !nonEmptyStr(untested[r])) E(`requirement ${r} not covered by a test`);
  for (const c of covered) if (!facts.reqs.includes(c)) E(`test covers unknown requirement ${c}`);
  return { errors, warnings, facts };
}

/** Cross-module checks over all loaded specs. */
export function validateAll(specs, catalog, { strict = false } = {}) {
  const errors = []; const warnings = []; const results = new Map(); let missing = 0;
  for (const [id, entry] of specs) {
    const r = validateModule(id, entry, catalog); results.set(id, r);
    if (r.missing) missing++;
    errors.push(...r.errors); warnings.push(...r.warnings);
  }
  if (missing && strict) errors.push(`${missing} module(s) without module.spec.yaml`);
  const producers = new Map(); const errOwners = new Map(); const capOwners = new Map();
  for (const [id, r] of results) {
    for (const e of r.facts.produced) { if (producers.has(e)) errors.push(`event ${e} produced by ${producers.get(e)} and ${id}`); producers.set(e, id); }
    for (const c of r.facts.errors.keys()) { if (errOwners.has(c)) warnings.push(`error ${c} defined in ${errOwners.get(c)} and ${id} (define once, reference elsewhere)`); else errOwners.set(c, id); }
    for (const c of r.facts.caps) { if (capOwners.has(c)) errors.push(`capability ${c} defined in ${capOwners.get(c)} and ${id}`); capOwners.set(c, id); }
  }
  for (const [id, r] of results) for (const e of r.facts.consumed) if (!producers.has(e)) (strict ? errors : warnings).push(`${id}: consumes ${e} but no module produces it`);
  // depends_on acyclic (FLG-2)
  const graph = new Map([...results].map(([id, r]) => [id, r.facts.deps]));
  const state = new Map(); const cyc = [];
  const visit = (n, path) => {
    if (state.get(n) === 2) return; if (state.get(n) === 1) { cyc.push([...path, n].join(' -> ')); return; }
    state.set(n, 1); for (const d of graph.get(n) || []) visit(d, [...path, n]); state.set(n, 2);
  };
  for (const n of graph.keys()) visit(n, []);
  for (const c of cyc.slice(0, 10)) (strict ? errors : warnings).push(`depends_on cycle: ${c}`);
  return { errors, warnings, results, missing, producers };
}
