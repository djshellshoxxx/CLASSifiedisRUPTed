import YAML from 'yaml';
import {readFileSync} from 'fs';
const [a,b]=process.argv.slice(2);
const A=YAML.parse(readFileSync(a,'utf8')), B=YAML.parse(readFileSync(b,'utf8'));
for (const k of Object.keys(A.processes)) {
  const ra=A.processes[k].requirements||[], rb=B.processes[k].requirements||[];
  ra.forEach((r,i)=>{ if (rb[i]!==r) console.log(`${k}[${i}]\n  OLD: ${r}\n  NEW: ${rb[i]}`); });
  if (rb.length>ra.length) rb.slice(ra.length).forEach((r,i)=>console.log(`${k}[+${ra.length+i}] APPENDED: ${r}`));
}
