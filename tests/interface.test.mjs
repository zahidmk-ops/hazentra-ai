import test from 'node:test';
import assert from 'node:assert/strict';

// Runtime rendering smoke test without a browser or external dependencies.
class Store{#v=new Map();getItem(k){return this.#v.get(k)||null}setItem(k,v){this.#v.set(k,v)}removeItem(k){this.#v.delete(k)}}
const app={innerHTML:''}, events={};
globalThis.localStorage=new Store();globalThis.sessionStorage=new Store();
globalThis.HAZENTRA_CONFIG={supabaseUrl:'',supabasePublishableKey:''};
globalThis.document={documentElement:{},title:'',querySelector(q){return q==='#app'?app:null},getElementById(){return null},addEventListener(e,cb){events[e]=cb}};
globalThis.window={scrollTo(){}};
await import('../src/app.js');
await new Promise(r=>setTimeout(r,50));
function click(dataset){events.click({target:{classList:{contains(){return false}},closest(){return {dataset,classList:{contains(){return false}},tagName:'BUTTON'}}}})}
test('interactive demo renders all seven navigation destinations',()=>{
 assert.ok(app.innerHTML.includes('Hazentra AI'));
 assert.ok(app.innerHTML.includes('Safer Operations. Smarter Decisions.'));
 for(const page of ['incidents','inspections','risks','actions','reports','organization','dashboard']){
  click({page});assert.ok(app.innerHTML.includes('main-content'),`Failed page ${page}`);
 }
});
test('switching to Arabic applies dir=rtl and Arabic navigation',()=>{
 click({lang:'ar'});
 assert.equal(document.documentElement.dir,'rtl');
 assert.ok(app.innerHTML.includes('لوحة التحكم') || app.innerHTML.includes('نظرة عامة'));
 click({page:'incidents'});
 assert.ok(app.innerHTML.includes('الحوادث والوقائع الوشيكة'));
});
test('report UI and modal render when requested',()=>{
 click({page:'reports'});
 assert.ok(app.innerHTML.includes('إنشاء التقرير'));
 click({page:'incidents'});click({action:'new:incidents'});
 assert.ok(app.innerHTML.includes('role="dialog"'));
 click({action:'close'});
});