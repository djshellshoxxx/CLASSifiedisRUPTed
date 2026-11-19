import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createPrivateKey, createPublicKey, createHash, sign } from 'node:crypto';
import { readPublicRecord, verifyPublicRecord, runRecordCommand, RECORD_LIMITS } from '../../../../tools/cli/records.mjs';

const key = createPrivateKey({format:'der',type:'pkcs8',key:Buffer.from('302e020100300506032b6570042204209d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60','hex')});
const raw = createPublicKey(key).export({format:'der',type:'spki'}).subarray(-32);
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
let integer=BigInt('0x'+Buffer.concat([Buffer.from([0xed,1]),raw]).toString('hex')), encoded='';
while(integer){encoded=alphabet[Number(integer%58n)]+encoded;integer/=58n;}
const author='did:key:z'+encoded;
const now=Date.now();
function canonical(v){return v===null || typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';}
function signed(changes={}){
 const payload={listingId:'019a87d0-0000-7000-8000-000000000001',ownerId:author,revision:1,kind:'giveaway',title:'Independent review fixture',description:'Public deterministic review fixture.',categoryId:'019a87d0-0000-7000-8000-000000000002',condition:'good',tags:[],locale:'en',regionCell:'c2b2',barterOptIn:true,availability:'available',expiresAt:new Date(now+86400000).toISOString(),...changes};
 const content={v:1,type:'classrup.bazaar.listing/v1',author,createdAt:new Date(now-60000).toISOString(),seq:1,prev:null,payload,ext:{}};
 const cid='sha256-'+createHash('sha256').update(canonical(content)).digest('hex');
 const unsigned={...content,cid};
 return {...unsigned,sig:sign(null,Buffer.from(canonical(unsigned)),key).toString('base64url')};
}
async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'classrup-independent-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const record=signed(); const selected=path.join(root,'selected.json');
 await fs.writeFile(selected,JSON.stringify(record));
 return {root,record,selected};
}
test('exact 1 MiB file is accepted and one extra byte is refused',async t=>{
 const {record,selected}=await fixture(t);
 const json=JSON.stringify(record);
 await fs.writeFile(selected,json+' '.repeat(RECORD_LIMITS.bytes-Buffer.byteLength(json)));
 assert.equal((await verifyPublicRecord(await readPublicRecord(selected),now)).ok,true);
 await fs.appendFile(selected,' ');
 await assert.rejects(readPublicRecord(selected),e=>e.code==='FILE_TOO_LARGE');
});
test('regular file replaced between lstat and open is rejected',async t=>{
 const {selected,root}=await fixture(t);
 const replacement=path.join(root,'replacement.json');
 await fs.writeFile(replacement,JSON.stringify(signed({listingId:'019a87d0-0000-7000-8000-000000000009'})));
 const original=fs.open;
 t.mock.method(fs,'open',async(...args)=>{
  await fs.rename(selected,path.join(root,'original.json'));
  await fs.rename(replacement,selected);
  return original(...args);
 });
 await assert.rejects(readPublicRecord(selected),e=>e.code==='FILE_INVALID');
});
test('final symlink substituted after lstat cannot redirect the read',async t=>{
 const {selected,root}=await fixture(t);
 const replacement=path.join(root,'replacement.json');
 await fs.writeFile(replacement,JSON.stringify(signed({listingId:'019a87d0-0000-7000-8000-000000000009'})));
 const original=fs.open;
 t.mock.method(fs,'open',async(...args)=>{
  await fs.rename(selected,path.join(root,'original.json'));
  await fs.symlink(replacement,selected);
  return original(...args);
 });
 await assert.rejects(readPublicRecord(selected),e=>['FILE_INVALID','FILE_UNREADABLE'].includes(e.code));
});
test('rename and replacement after open still reads the original descriptor',async t=>{
 const {selected,root,record}=await fixture(t);
 const original=fs.open;
 t.mock.method(fs,'open',async(...args)=>{
  const h=await original(...args);
  await fs.rename(selected,path.join(root,'original.json'));
  await fs.writeFile(selected,JSON.stringify(signed({listingId:'019a87d0-0000-7000-8000-000000000009'})));
  return h;
 });
 assert.deepEqual(await readPublicRecord(selected),record);
});
test('multiple short reads reconstruct the record without truncation',async t=>{
 const {selected,record}=await fixture(t);
 const original=fs.open;
 t.mock.method(fs,'open',async(...args)=>{
  const h=await original(...args);
  return {stat:()=>h.stat(),close:()=>h.close(),read:(buffer,offset,length,position)=>h.read(buffer,offset,Math.min(length,7),position)};
 });
 assert.deepEqual(await readPublicRecord(selected),record);
});
test('opened descriptor closes if metadata verification fails',async t=>{
 const {selected}=await fixture(t);let closed=false;
 const original=fs.open;
 t.mock.method(fs,'open',async(...args)=>{
  const h=await original(...args);
  return {stat:async()=>{throw new Error('private metadata detail');},close:async()=>{closed=true;await h.close();},read:()=>{throw new Error('unexpected read');}};
 });
 await assert.rejects(readPublicRecord(selected),e=>e.code==='FILE_UNREADABLE'&&!e.message.includes('private metadata'));
 assert.equal(closed,true);
});
test('verification detaches mutable caller input before asynchronous crypto',async()=>{
 const input=signed();const cid=input.cid;const listingId=input.payload.listingId;
 const pending=verifyPublicRecord(input,now);
 input.payload.listingId='019a87d0-0000-7000-8000-000000000009';input.payload.ownerId='changed';
 const result=await pending;
 assert.equal(result.record.cid,cid);assert.equal(result.record.listingId,listingId);
});
test('signed public metadata with terminal-control injection fails closed',async()=>{
 for(const changes of [{listingId:'019a87d0-0000-7000-8000-000000000001\u001b[31m'},{ownerId:author+'\nspoof'},{title:'Valid title\u001b[31m'}]){
  await assert.rejects(verifyPublicRecord(signed(changes),now));
 }
});
test('malformed multi-document JSON and truncated UTF8 are rejected before verification',async t=>{
 const {selected,record}=await fixture(t);
 await fs.writeFile(selected,JSON.stringify(record)+'{}');
 await assert.rejects(readPublicRecord(selected),e=>e.code==='INVALID_JSON');
 await fs.writeFile(selected,Buffer.concat([Buffer.from(JSON.stringify(record)),Buffer.from([0xe2,0x82])]));
 await assert.rejects(readPublicRecord(selected),e=>e.code==='INVALID_JSON');
});
test('invalid repeated options fail before any filesystem lookup',async t=>{
 let lookups=0;
 t.mock.method(fs,'lstat',async()=>{lookups++;throw new Error('unexpected filesystem access');});
 const result=await runRecordCommand(['verify','--file','selected.json','--json','--json']);
 assert.equal(result.exitCode,2);assert.equal(result.result.error.code,'USAGE');assert.equal(lookups,0);
});

