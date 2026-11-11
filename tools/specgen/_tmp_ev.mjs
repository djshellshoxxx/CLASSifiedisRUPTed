import { loadCatalog, loadSpecs } from './model.mjs';
const cat = loadCatalog(); const specs = loadSpecs(cat);
const want = process.argv.slice(2);
for (const [id,{spec}] of specs) {
  const cq = spec?.processes?.commands_queries_events||{};
  for (const ev of cq.events_produced||[]) if (want.some(w=>ev.type.startsWith(w))) console.log(id, ev.type, ev.privacy, '\n   ', ev.payload);
}
