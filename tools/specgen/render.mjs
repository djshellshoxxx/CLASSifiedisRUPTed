// Renders module specs (ADR-0015) into process documents, module/subfeature/feature SPEC.md and registries.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, PROCESSES, FEATURES, cells, reqId, featureOf, subfeatureOf } from './model.mjs';

const GEN = '> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.';
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const bullets = (a) => (a || []).map((x) => `- ${x}`).join('\n');
const table = (head, rows) => rows.length ? `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map(esc).join(' | ')} |`).join('\n')}` : '_None._';
const ctrLinks = (deps, up) => (deps || []).filter((d) => d.startsWith('CTR-')).map((d) => `[${d}](${up}planning/contracts/${d}.md)`).join(', ') || 'none beyond defaults';
const UP = '../../../';

function processBody(key, p) {
  switch (key) {
    case 'domain_schema': return [
      ...(p.entities || []).map((e) => `### ${e.name}\n\nSchema \`${e.schema}\` · storage **${e.storage}** · privacy **${e.privacy}** · retention **${e.retention}**\n\n${table(['Field', 'Type and constraints'], (e.fields || []).map((f) => { const i = f.indexOf(':'); return [f.slice(0, i).trim(), f.slice(i + 1).trim()]; }))}\n\n**Invariants**\n${bullets(e.invariants)}`),
      p.note ? `**Note:** ${p.note}` : '', p.sql ? `### Storage DDL\n\n\`\`\`sql\n${p.sql.trim()}\n\`\`\`` : ''].filter(Boolean).join('\n\n');
    case 'validation_rules': return `${table(['Rule', 'Check', 'Error'], (p.rules || []).map(cells))}${p.notes ? `\n\n${p.notes}` : ''}`;
    case 'workflow_state_machine': return [
      ...(p.machines || []).map((m) => `### ${m.entity} lifecycle\n\nInitial **${m.initial}**; terminal ${(m.terminal || []).map((t) => `**${t}**`).join(', ')}.\n\n${table(['Transition', 'Trigger', 'Guard / effect'], (m.transitions || []).map(cells))}\n\n\`\`\`mermaid\nstateDiagram-v2\n  [*] --> ${m.initial}\n${(m.transitions || []).map((t) => { const [ft, trig] = cells(t); const [a, b] = ft.split('->').map((s) => s.trim()); return `  ${a} --> ${b}: ${trig.replace(/[:;]/g, ' ')}`; }).join('\n')}\n${(m.terminal || []).map((t) => `  ${t} --> [*]`).join('\n')}\n\`\`\``),
      p.note ? `**Note:** ${p.note}` : '', `### Timeouts and scheduled transitions\n\n${bullets(p.timeouts) || '_None._'}`].filter(Boolean).join('\n\n');
    case 'commands_queries_events': return [
      `### Commands\n\n${table(['Command', 'Capability', 'Input', 'Output', 'Errors', 'Emits', 'Idempotent'], (p.commands || []).map((c) => [`\`${c.name}\``, c.capability, c.input, c.output, (c.errors || []).join(', '), (c.emits || []).join(', '), c.idempotent ? 'yes (Idempotency-Key)' : 'no']))}`,
      `### Queries\n\n${table(['Query', 'Capability', 'Input', 'Output', 'Errors'], (p.queries || []).map((q) => [`\`${q.name}\``, q.capability, q.input, q.output, (q.errors || []).join(', ')]))}`,
      `### Events produced\n\n${table(['Type', 'Privacy', 'Payload'], (p.events_produced || []).map((e) => [`\`${e.type}\``, e.privacy, e.payload]))}`,
      `### Events consumed\n\n${table(['Type', 'Effect'], (p.events_consumed || []).map((e) => [`\`${e.type}\``, e.effect]))}`,
      `### Module errors\n\n${table(['Code', 'HTTP', 'Retryable', 'Meaning'], (p.errors || []).map(cells))}\n\nCommon codes per [CTR-ERR-001](${UP}planning/contracts/CTR-ERR-001.md).`,
      p.note ? `**Note:** ${p.note}` : '', `### Example\n\n\`\`\`\n${String(p.example || '').trim()}\n\`\`\``].filter(Boolean).join('\n\n');
    case 'authorization_capabilities': return `${table(['Capability', 'Granted to', 'Conditions'], (p.capabilities || []).map(cells))}${p.notes ? `\n\n${p.notes}` : ''}\n\nDefault deny; evaluation and audit per [CTR-CAP-001](${UP}planning/contracts/CTR-CAP-001.md).`;
    case 'failure_recovery_idempotency': return ['idempotency', 'concurrency', 'retries', 'offline', 'partial_failure'].map((k) => `- **${k.replace('_', ' ')}:** ${p[k]}`).join('\n') + `\n\nBaseline per [CTR-IDM-001](${UP}planning/contracts/CTR-IDM-001.md).`;
    case 'privacy_retention_abuse': return `**Data classification**\n${bullets(p.data)}\n\n**Retention**\n${bullets(p.retention)}\n\n**Threats and controls**\n\n${table(['ID', 'Threat', 'Control'], (p.threats || []).map(cells))}\n\n**Abuse controls**\n${bullets(p.abuse_controls)}\n\nClasses per [CTR-PRV-001](${UP}planning/contracts/CTR-PRV-001.md).`;
    case 'observability_performance': return `**Metrics**\n${bullets(p.metrics)}\n\n**Logs**\n${bullets(p.logs)}\n\n**Budgets**\n${bullets(p.budgets)}\n\nConventions per [CTR-OBS-001](${UP}planning/contracts/CTR-OBS-001.md).`;
    case 'contract_and_acceptance_tests': return `See the module test table below (all processes).${p.fixtures ? `\n\n**Fixtures:** ${p.fixtures}` : ''}`;
    case 'import_export_backup_rollback': return ['export', 'import', 'backup', 'migration_rollback'].map((k) => `- **${k.replace('_', ' ')}:** ${p[k]}`).join('\n') + `\n\nBaseline per [CTR-IOX-001](${UP}planning/contracts/CTR-IOX-001.md).`;
    default: return '';
  }
}

function testRows(spec, ps, filterPp) {
  const ct = spec.processes.contract_and_acceptance_tests;
  return (ct.tests || []).map(cells).filter(([, , covers]) => !filterPp || covers.split(',').some((c) => c.trim().startsWith(filterPp + '.')))
    .map(([tid, level, covers, scen, exp]) => [`TEST-${ps}-09.${tid}`, level, covers.split(',').map((c) => `${ps}-${c.trim()}`).join(', '), scen, exp]);
}

export function renderModule(id, entry) {
  const { cat, spec } = entry; const dir = join(ROOT, cat.path); const ps = cat.ps;
  const P = spec.processes;
  const head = (pp, title) => `# ${ps}-${pp} — ${title}: ${cat.title}\n\n**Status:** SPECIFIED (Stage 3). **Module:** [${id} ${cat.title}](SPEC.md) · **Scope:** ${spec.scope} · **Code:** \`${cat.code}\` · **Contracts:** ${ctrLinks(spec.depends_on, UP)}\n\n${GEN}\n`;
  for (const [pp, key, title] of PROCESSES) {
    const p = P[key];
    const reqs = (p.requirements || []).map((r, i) => `- **${reqId(ps, pp, i)}** ${r}`).join('\n');
    const tests = testRows(spec, ps, pp);
    const body = `${head(pp, title)}\n## Requirements\n\n${reqs}\n\n## Specification\n\n${processBody(key, p)}\n\n## Verification\n\n${table(['Test', 'Level', 'Covers', 'Scenario', 'Expected'], key === 'contract_and_acceptance_tests' ? testRows(spec, ps) : tests)}\n${key === 'contract_and_acceptance_tests' ? `\n## Acceptance criteria\n\n${bullets(P.contract_and_acceptance_tests.acceptance)}\n` : ''}\n## Dependencies\n\nModule depends on: ${(spec.depends_on || []).join(', ') || 'none'}. Predecessor: ${pp === '01' ? '[module SPEC](SPEC.md)' : '[domain_schema.md](domain_schema.md)'}.\n`;
    writeFileSync(join(dir, `${key}.md`), body);
  }
  const ds = P.domain_schema; const cq = P.commands_queries_events;
  const specMd = `# ${id} — ${cat.title}\n\n**Status:** SPECIFIED (Stage 3). **Scope:** ${spec.scope}${spec.deferral ? ` — deferral: ${spec.deferral}` : ''}. **Parent:** [${subfeatureOf(id)}](../SPEC.md). **Process IDs:** ${ps}-01…${ps}-10. **Code:** \`${cat.code}\`.\n\n${GEN}\n\n## Purpose\n\n${spec.summary.trim()}\n\n## Responsibilities\n\n${bullets(spec.responsibilities)}\n\n## Not responsible for\n\n${bullets(spec.non_responsibilities)}\n\n## User stories\n\n${bullets(spec.user_stories)}\n\n## Edge cases\n\n${bullets(spec.edge_cases)}\n\n## UX and accessibility\n\n${spec.ux.screens ? bullets(spec.ux.screens) : ''}${spec.ux.states ? `\n\n**States:** ${spec.ux.states.join('; ')}` : ''}${spec.ux.a11y ? `\n\n**Accessibility:** ${spec.ux.a11y.join('; ')}` : ''}${spec.ux.notes ? `\n\n${spec.ux.notes}` : ''}\n\n## Owned data\n\n${(ds.entities || []).map((e) => `- \`${e.name}\` (${e.schema}, ${e.privacy}, ${e.retention})`).join('\n') || '_No persisted entities (library/view module)._'}\n\n## Interfaces\n\n- Commands: ${(cq.commands || []).map((c) => `\`${c.name}\``).join(', ') || 'none'}\n- Queries: ${(cq.queries || []).map((c) => `\`${c.name}\``).join(', ') || 'none'}\n- Emits: ${(cq.events_produced || []).map((c) => `\`${c.type}\``).join(', ') || 'none'}\n- Consumes: ${(cq.events_consumed || []).map((c) => `\`${c.type}\``).join(', ') || 'none'}\n\n## Dependencies\n\n${(spec.depends_on || []).join(', ') || 'none'}\n\n## Process specifications and aggregation\n\n${table(['ID', 'Process', 'Requirements'], PROCESSES.map(([pp, key, title]) => [`${ps}-${pp}`, `[${title}](${key}.md)`, String(P[key].requirements.length)]))}\n\nAggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is \`${cat.code}/index.ts\`.\n\n## Acceptance criteria\n\n${bullets(P.contract_and_acceptance_tests.acceptance)}\n`;
  writeFileSync(join(dir, 'SPEC.md'), specMd);
  writeFileSync(join(dir, 'PROCESS_CHECKLIST.md'), `# Process checklist — ${id} ${cat.title}\n\n**Status:** SPECIFIED. ${GEN}\n\n${PROCESSES.map(([pp, key, title]) => `- [x] [${ps}-${pp} ${title}](${key}.md) — ${P[key].requirements.length} requirements, tests mapped`).join('\n')}\n\n## Integration gates\n\n- [x] Ownership and dependencies declared (validated by \`pnpm spec:check\`).\n- [x] Typed errors, capabilities, events and schema names validated.\n- [x] Rollback, backup/restore, import/export and retention covered.\n- [ ] Implementation landed with tests (Stage 4).\n`);
  const todoPath = join(dir, 'TODO.md');
  const implDone = existsSync(todoPath) && /\[x\] Implement/.test(readFileSync(todoPath, 'utf8'));
  writeFileSync(todoPath, `# TODO — ${id} ${cat.title}\n\n**Status:** ${implDone ? 'IMPLEMENTED' : 'SPECIFIED — implementation pending'}.\n\n- [x] Define ownership and directory contract.\n- [x] Specify all ten processes (module.spec.yaml).\n- [x] Validate cross-module contracts (spec:check).\n- [${implDone ? 'x' : ' '}] Implement in \`${cat.code}\`.\n- [${implDone ? 'x' : ' '}] Tests for every requirement pass (tools/trace).\n`);
}

export function renderRollups(specs, catalog, validation) {
  // Subfeature and feature SPEC.md aggregation.
  const bySub = new Map(); const byFeat = new Map();
  for (const [id, e] of specs) {
    (bySub.get(subfeatureOf(id)) || bySub.set(subfeatureOf(id), []).get(subfeatureOf(id))).push([id, e]);
    (byFeat.get(featureOf(id)) || byFeat.set(featureOf(id), []).get(featureOf(id))).push([id, e]);
  }
  const evRows = (list) => {
    const ids = new Set(list.map(([id]) => id)); const rows = [];
    for (const [id, e] of list) for (const c of e.spec?.processes?.commands_queries_events?.events_consumed || []) {
      const prod = validation.producers.get(c.type); rows.push([c.type, prod || 'unresolved', id, ids.has(prod) ? 'internal' : 'external']);
    }
    return rows;
  };
  for (const [sub, list] of bySub) {
    const dir = join(ROOT, list[0][1].cat.path, '..');
    const rows = list.map(([id, e]) => [id, `[${e.cat.title}](${e.cat.path.split('/').pop()}/SPEC.md)`, e.spec ? 'SPECIFIED' : 'DRAFT', e.cat.resp]);
    writeFileSync(join(dir, 'SPEC.md'), `# ${sub} — ${dir.split('/').pop()}\n\n**Status:** ${list.every(([, e]) => e.spec) ? 'SPECIFIED' : 'IN PROGRESS'}. **Parent:** [${featureOf(sub)}](../SPEC.md).\n\n${GEN}\n\n## Modules\n\n${table(['Module', 'Name', 'Status', 'Responsibility'], rows)}\n\n## Aggregation\n\nModules in this subfeature share the feature package \`packages/${FEATURES[featureOf(sub)][0]}\` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.\n\n### Event dependencies\n\n${table(['Event', 'Producer', 'Consumer', 'Scope'], evRows(list))}\n`);
  }
  for (const [f, list] of byFeat) {
    const dir = join(ROOT, list[0][1].cat.path, '..', '..');
    const subs = [...new Set(list.map(([id]) => subfeatureOf(id)))];
    const deps = new Set(); for (const [, e] of list) for (const d of e.spec?.depends_on || []) if (!d.startsWith('CTR-') && featureOf(d) !== f) deps.add(featureOf(d));
    writeFileSync(join(dir, 'SPEC.md'), `# ${f} — ${FEATURES[f][1]}\n\n**Status:** ${list.every(([, e]) => e.spec) ? 'SPECIFIED' : 'IN PROGRESS'}. **Parent:** [ClassRup](../PROJECT_SPEC.md). **Package slug:** \`${FEATURES[f][0]}\`.\n\n${GEN}\n\n## Subfeatures\n\n${subs.map((s) => { const d = list.find(([id]) => subfeatureOf(id) === s)[1].cat.path.split('/')[1]; return `- [${s} ${d}](${d}/SPEC.md) — ${list.filter(([id]) => subfeatureOf(id) === s).length} modules`; }).join('\n')}\n\n## Aggregation\n\nThe feature is enabled by flag \`${f}\` (CTR-FLG-001); each module can be disabled independently when no enabled module depends on it. Upstream features: ${[...deps].sort().join(', ') || 'kernel only'}.\n\n### Cross-subfeature and external events\n\n${table(['Event', 'Producer', 'Consumer', 'Scope'], evRows(list).filter((r) => r[3] === 'external' || subfeatureOf(r[1]) !== subfeatureOf(r[2])))}\n`);
  }
  // Registries
  const csv = ['id,path,owner_module,implementing_module,consuming_modules,predecessor_spec,future_test,status'];
  const md = ['# Process specification registry', '', `${GEN}`, '', '| ID | Process specification | Owner | Status |', '|---|---|---|---|'];
  const reqs = [];
  for (const [id, e] of [...specs].sort((a, b) => a[1].cat.ps.localeCompare(b[1].cat.ps))) {
    for (const [pp, key, title] of PROCESSES) {
      const pid = `${e.cat.ps}-${pp}`; const st = e.spec ? 'SPECIFIED' : 'DRAFT'; const path = `${e.cat.path}/${key}.md`;
      const consumers = [...new Set([...(validation.results.get(id)?.facts.produced || [])].flatMap((ev) => [...validation.results].filter(([, r]) => r.facts.consumed.has(ev)).map(([cid]) => cid)))].join('|');
      csv.push([pid, path, e.cat.path, e.cat.code, consumers, pp === '01' ? '' : `${e.cat.path}/domain_schema.md`, `TEST-${pid}`, st].join(','));
      md.push(`| ${pid} | [${path}](../${path}) | ${id} | ${st} |`);
      (e.spec?.processes?.[key]?.requirements || []).forEach((r, i) => reqs.push({ id: reqId(e.cat.ps, pp, i), module: id, spec: path, status: 'SPECIFIED', text: r }));
    }
  }
  writeFileSync(join(ROOT, 'planning', 'SPEC_REGISTRY.csv'), csv.join('\n') + '\n');
  writeFileSync(join(ROOT, 'planning', 'SPEC_REGISTRY.md'), md.join('\n') + '\n');
  writeFileSync(join(ROOT, 'planning', 'REQUIREMENTS_CHECKLIST.json'), JSON.stringify({ phase: 'Prompt 3', status: validation.missing ? 'IN PROGRESS' : 'SPECIFIED', module_count: specs.size, process_spec_count: specs.size * 10, requirement_count: reqs.length, requirements: reqs }, null, 1) + '\n');
}

export function renderReport(specs, validation) {
  const done = [...specs.values()].filter((e) => e.spec).length;
  const go = validation.errors.length === 0 && validation.missing === 0;
  const fut = [...specs].filter(([, e]) => e.spec?.scope === 'FUTURE').map(([id, e]) => `- ${id} ${e.cat.title}: ${e.spec.deferral}`);
  const body = `# Specification completeness report\n\n**Generated:** by \`pnpm spec:check --strict --report\`. **Decision:** ${go ? '**GO** — every in-scope module and process is specified and cross-module references resolve.' : '**NO-GO** — see gap register.'}\n\n## Summary\n\n- Modules specified: ${done} / ${specs.size}\n- Process specifications: ${done * 10} / ${specs.size * 10}\n- Errors: ${validation.errors.length}; warnings: ${validation.warnings.length}\n- Contracts: [planning/CONTRACTS.md](planning/CONTRACTS.md); decisions: [DECISIONS.md](DECISIONS.md) (all ACCEPTED)\n\n## Checks performed\n\n- Every module has ten processes with ≥ 3 stable requirement IDs each; no TBD/TODO/placeholder wording.\n- Every catalog-owned entity specified once with schema name, storage, privacy and retention class.\n- Every command names a declared capability, defined errors and produced events; every consumed event has exactly one producer.\n- Every requirement is covered by at least one test case (TST-4); state machines have reachable initial and terminal states.\n- Module dependency graph is acyclic (feature-flag dependency rule CTR-FLG-001).\n\n## Deferred (FUTURE) modules\n\n${fut.join('\n') || '_None: all modules are MVP scope; future sub-scopes are documented inside each module._'}\n\n## Gap register\n\n${validation.errors.length ? validation.errors.map((e) => `- ERROR ${e}`).join('\n') : '_No blocking gaps._'}\n\n### Warnings\n\n${validation.warnings.slice(0, 200).map((w) => `- ${w}`).join('\n') || '_None._'}\n\n## Implementation order\n\nkernel (F15.S02 bus/storage, F15.S03.M01 observability) → security (F16) → privacy (F10.S02) → platform configuration (F15.S04) → commerce valuation (F09.S03) → identity (F07) → governance (F18) → moderation (F12) → discovery (F06) → bazaar (F01) → commerce payments/settlement (F09.S01–S02) → comms (F08) → mutiny (F02) → services/auctions/rentals (F03–F05) → notify (F13) → privacy data controls (F10.S01) → federation (F11) → relay app (F15.S02.M01, F15.S03) → PWA (F15.S01, F14) → quality gates (F17).\n`;
  writeFileSync(join(ROOT, 'SPEC_COMPLETENESS_REPORT.md'), body);
  return go;
}
