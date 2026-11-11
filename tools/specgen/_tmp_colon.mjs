import YAML from 'yaml'; import {readFileSync} from 'fs';
for (const f of process.argv.slice(2)) {
  const d = YAML.parse(readFileSync(f,'utf8'));
  const walk=(v,path)=>{ if (Array.isArray(v)) v.forEach((x,i)=>{ if (x && typeof x==='object' && !Array.isArray(x) && Object.keys(x).length===1 && !['type'].includes(Object.keys(x)[0]) && path.match(/requirements|edge_cases|responsibilities|non_responsibilities|user_stories|invariants|threats|abuse_controls|data|retention|metrics|logs|budgets|tests|acceptance|rules|transitions|timeouts|fields|capabilities|screens|a11y|errors/)) console.log(f, path, i, JSON.stringify(x).slice(0,100)); walk(x,path+'.'+i)}); else if (v && typeof v==='object') for (const k of Object.keys(v)) walk(v[k], path+'.'+k); };
  walk(d,'');
}
