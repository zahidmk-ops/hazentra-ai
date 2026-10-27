import test from 'node:test';
import assert from 'node:assert/strict';
import {riskScore,riskBand,escapeHtml,stats,aggregate,active} from '../src/utils.js';
import {seed} from '../src/data.js';
import {messages,tr} from '../src/i18n.js';

test('risk matrix bounds and classification',()=>{
 assert.equal(riskScore(5,5),25);assert.equal(riskScore(3,4),12);
 assert.equal(riskBand(20),'critical');assert.equal(riskBand(12),'high');assert.equal(riskBand(6),'medium');assert.equal(riskBand(4),'low');
});
test('HTML output escapes untrusted values',()=>{
 assert.equal(escapeHtml(`<img src=x onerror="alert('x')">`),'&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;');
});
test('demo workstreams have linked valid sites',()=>{
 const d=seed(),ids=new Set(d.sites.map(x=>x.id));
 for(const collection of ['incidents','inspections','risks','actions']){
  assert.ok(d[collection].length>0);
  for(const row of d[collection]){assert.ok(ids.has(row.site_id));assert.equal(row.organization_id,d.organization.id);}
 }
});
test('kpis derive from source data consistently',()=>{
 const d=seed(),s=stats(d),a=aggregate(d);
 assert.equal(s.incidents,d.incidents.filter(active).length);
 assert.equal(s.actions,d.actions.filter(active).length);
 assert.equal(a.totalInspections,d.inspections.length);
 assert.equal(a.totalRisks,d.risks.length);
});

test('CAPA records link only to same-tenant, same-site findings',()=>{
 const d=seed();const tables={incident:'incidents',inspection:'inspections',risk:'risks'};
 for(const action of d.actions){
  if(action.source_type==='general')continue;
  const source=d[tables[action.source_type]].find(r=>r.id===action.source_id);
  assert.ok(source,`Missing linked finding for ${action.id}`);
  assert.equal(source.site_id,action.site_id);
  assert.equal(source.organization_id,action.organization_id);
 }
});

test('English/Arabic translation key coverage',()=>{
 const en=new Set(Object.keys(messages.en)),ar=new Set(Object.keys(messages.ar));
 const missing=[...en].filter(k=>!ar.has(k));
 assert.deepEqual(missing,[]);
 assert.equal(tr('ar','sites'),'المواقع');
});