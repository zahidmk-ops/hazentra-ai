import {uid} from './utils.js';
const day=(shift=0)=>{const d=new Date();d.setDate(d.getDate()+shift);return d.toISOString().slice(0,10)};
const ago=(months)=>{const d=new Date();d.setMonth(d.getMonth()-months);return d.toISOString().slice(0,10)};
const S1='demo-site-1', S2='demo-site-2', S3='demo-site-3', O='demo-org';
export const seed=()=>({
 organization:{id:O,name:'GulfWorks Industrial Group',country:'Saudi Arabia'},
 role:'admin', profile:{email:'demo@hazentra.ai',display_name:'Demo Administrator'},
 sites:[
 {id:S1,organization_id:O,name:'Riyadh Processing Plant',name_ar:'مصنع الرياض للمعالجة',code:'RYD-01',location:'Riyadh, Saudi Arabia'},
 {id:S2,organization_id:O,name:'Jeddah Logistics Hub',name_ar:'مركز جدة اللوجستي',code:'JED-02',location:'Jeddah, Saudi Arabia'},
 {id:S3,organization_id:O,name:'Karachi Warehouse',name_ar:'مستودع كراتشي',code:'KHI-03',location:'Karachi, Pakistan'}],
 members:[{user_id:'demo-u1',display_name:'Sara Ahmed',email:'sara@example.com',role:'admin'},
 {user_id:'demo-u2',display_name:'Omar Al-Farsi',email:'omar@example.com',role:'manager'},
 {user_id:'demo-u3',display_name:'Ayesha Khan',email:'ayesha@example.com',role:'officer'},
 {user_id:'demo-u4',display_name:'Bilal Hussain',email:'bilal@example.com',role:'viewer'}],
 incidents:[
 {id:'demo-i1',organization_id:O,site_id:S1,title:'Unsecured maintenance access hatch',title_ar:'فتحة صيانة غير مؤمنة',description:'Maintenance access hatch found open during the morning inspection.',kind:'near_miss',severity:'high',status:'in_progress',occurred_on:day(-1),created_at:day(-1)},
 {id:'demo-i2',organization_id:O,site_id:S2,title:'Minor slip near loading bay',title_ar:'انزلاق بسيط قرب منطقة التحميل',description:'An operator slipped on a damp surface without injury.',kind:'incident',severity:'medium',status:'open',occurred_on:day(-3),created_at:day(-3)},
 {id:'demo-i3',organization_id:O,site_id:S3,title:'Pallet stack instability observed',title_ar:'ملاحظة عدم استقرار رص المنصات',description:'Unstable stock was isolated before an incident occurred.',kind:'near_miss',severity:'medium',status:'closed',occurred_on:day(-7),created_at:day(-7)},
 {id:'demo-i4',organization_id:O,site_id:S1,title:'Guardrail impact reported',title_ar:'الإبلاغ عن صدمة لحاجز الحماية',description:'Forklift contacted a protective railing; no injury.',kind:'incident',severity:'low',status:'closed',occurred_on:day(-14),created_at:day(-14)},
 {id:'demo-i5',organization_id:O,site_id:S2,title:'Fire door temporarily obstructed',title_ar:'إعاقة مؤقتة لباب الحريق',description:'Access restored following intervention.',kind:'near_miss',severity:'high',status:'open',occurred_on:ago(1),created_at:ago(1)},
 {id:'demo-i6',organization_id:O,site_id:S3,title:'Emergency light failure',title_ar:'تعطل مصباح الطوارئ',description:'Light replaced after defect identification.',kind:'near_miss',severity:'low',status:'closed',occurred_on:ago(2),created_at:ago(2)},
 {id:'demo-i7',organization_id:O,site_id:S1,title:'Minor hand abrasion during handling',title_ar:'خدش بسيط في اليد أثناء المناولة',description:'First aid administered, PPE reminder delivered.',kind:'incident',severity:'low',status:'closed',occurred_on:ago(3),created_at:ago(3)},
 {id:'demo-i8',organization_id:O,site_id:S2,title:'Oil drip contained',title_ar:'احتواء تسرب بسيط للزيت',description:'Spill kit deployed immediately.',kind:'near_miss',severity:'medium',status:'closed',occurred_on:ago(4),created_at:ago(4)},
 {id:'demo-i9',organization_id:O,site_id:S3,title:'Damaged ladder removed',title_ar:'إزالة سلم تالف',description:'Ladder tagged and removed before use.',kind:'near_miss',severity:'low',status:'closed',occurred_on:ago(5),created_at:ago(5)}],
 inspections:[
 {id:'demo-n1',organization_id:O,site_id:S1,title:'Weekly housekeeping walkthrough',title_ar:'جولة النظافة والترتيب الأسبوعية',category:'housekeeping',result:'needs_attention',status:'completed',inspected_on:day(-1),description:'Minor walkways need additional clearance.'},
 {id:'demo-n2',organization_id:O,site_id:S2,title:'Fire exits and evacuation routes',title_ar:'مخارج الحريق ومسارات الإخلاء',category:'fire_safety',result:'pass',status:'completed',inspected_on:day(-2),description:'Exits unobstructed.'},
 {id:'demo-n3',organization_id:O,site_id:S3,title:'Forklift operating areas',title_ar:'مناطق تشغيل الرافعات الشوكية',category:'machinery',result:'pass',status:'completed',inspected_on:day(-4),description:'Barriers compliant with local procedures.'},
 {id:'demo-n4',organization_id:O,site_id:S1,title:'PPE compliance review',title_ar:'مراجعة الالتزام بمعدات الوقاية',category:'ppe',result:'needs_attention',status:'completed',inspected_on:day(-6),description:'Two observers require refresher training.'},
 {id:'demo-n5',organization_id:O,site_id:S2,title:'Warehouse safety checklist',title_ar:'قائمة التحقق من سلامة المستودع',category:'general_safety',result:'pass',status:'completed',inspected_on:day(-8),description:'Inspected storage lanes and aisles.'}],
 risks:[
 {id:'demo-r1',organization_id:O,site_id:S1,title:'Maintenance at height',title_ar:'أعمال الصيانة على ارتفاع',likelihood:4,impact:5,controls:'Restricted access; training',mitigation:'Install fixed barriers and verify fall protection',status:'open',assessed_on:day(-2)},
 {id:'demo-r2',organization_id:O,site_id:S2,title:'Loading-bay pedestrian movement',title_ar:'حركة المشاة في منطقة التحميل',likelihood:3,impact:4,controls:'Marked walkways',mitigation:'Install better segregation and speed control',status:'in_progress',assessed_on:day(-4)},
 {id:'demo-r3',organization_id:O,site_id:S3,title:'Manual lifting of goods',title_ar:'رفع البضائع يدوياً',likelihood:2,impact:3,controls:'Toolbox talk and lifting aids',mitigation:'Refresh handling training',status:'closed',assessed_on:day(-9)},
 {id:'demo-r4',organization_id:O,site_id:S1,title:'Hot work area housekeeping',title_ar:'النظافة في منطقة الأعمال الساخنة',likelihood:3,impact:5,controls:'Fire watch',mitigation:'Introduce pre-start housekeeping checklist',status:'open',assessed_on:day(-6)}],
 actions:[
 {id:'demo-a1',organization_id:O,site_id:S1,title:'Secure service hatch before restart',source_type:'incident',source_id:'demo-i1',title_ar:'تأمين فتحة الخدمة قبل إعادة التشغيل',action_type:'corrective',status:'in_progress',assigned_to:'Omar Al-Farsi',due_date:day(-1),description:'Fit temporary barrier and replace latch.'},
 {id:'demo-a2',organization_id:O,site_id:S2,title:'Clear all fire-door approach routes',source_type:'incident',source_id:'demo-i5',title_ar:'إخلاء ممرات أبواب الحريق',action_type:'corrective',status:'open',assigned_to:'Ayesha Khan',due_date:day(2),description:'Remove stored materials and inspect twice daily.'},
 {id:'demo-a3',organization_id:O,site_id:S1,title:'Refresh housekeeping briefings',source_type:'inspection',source_id:'demo-n1',title_ar:'تحديث إحاطات النظافة والترتيب',action_type:'preventive',status:'open',assigned_to:'Sara Ahmed',due_date:day(5),description:'Deliver a site-wide briefing to shift teams.'},
 {id:'demo-a4',organization_id:O,site_id:S3,title:'Replace damaged inspection signage',source_type:'risk',source_id:'demo-r3',title_ar:'استبدال لافتات التفتيش التالفة',action_type:'corrective',status:'completed',assigned_to:'Bilal Hussain',due_date:day(-3),description:'Complete signage replacement.'},
 {id:'demo-a5',organization_id:O,site_id:S2,title:'Review traffic segregation controls',source_type:'risk',source_id:'demo-r2',title_ar:'مراجعة ضوابط فصل حركة المرور',action_type:'preventive',status:'in_progress',assigned_to:'Omar Al-Farsi',due_date:day(8),description:'Walkthrough and improvement plan.'}]
});
const config=()=>globalThis.HAZENTRA_CONFIG||{};
export const isLiveConfigured=()=>Boolean(config().supabaseUrl && config().supabasePublishableKey);
const SESSION='hazentra-auth-v1', DEMO='hazentra-demo-v1';
const parse=(s)=>{try{return JSON.parse(s)}catch{return null}};
export const demoStore={
 load(){let state=parse(localStorage.getItem(DEMO));if(!state||!state.organization||!Array.isArray(state.incidents))state=seed();return state;},
 write(data){localStorage.setItem(DEMO,JSON.stringify(data));},
 reset(){localStorage.removeItem(DEMO);return seed();}
};
const cfgUrl=()=>String(config().supabaseUrl).replace(/\/+$/,'');
const headers=(token,more={})=>({'apikey':config().supabasePublishableKey, 'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{'Authorization':`Bearer ${config().supabasePublishableKey}`}), ...more});
let session=parse(globalThis.sessionStorage?.getItem(SESSION));
export const auth={
 get session(){return session;},
 async request(endpoint,payload){let response=await fetch(`${cfgUrl()}/auth/v1/${endpoint}`,{method:'POST',headers:headers(null),body:JSON.stringify(payload)});let value=await response.json().catch(()=>({}));if(!response.ok)throw new Error(value.msg||value.error_description||value.message||'Authentication failed');return value;},
 async signIn(email,password){session=await this.request('token?grant_type=password',{email,password});sessionStorage.setItem(SESSION,JSON.stringify(session));return session;},
 async signUp(email,password,name){return this.request('signup',{email,password,data:{display_name:name||email.split('@')[0]}});},
 async token(){if(!session)return null; if(Date.now()>((session.expires_at||0)*1000-65000)){
   try{const fresh=await this.request('token?grant_type=refresh_token',{refresh_token:session.refresh_token});session=fresh;sessionStorage.setItem(SESSION,JSON.stringify(session));}catch{this.logout();return null;}
  }return session.access_token;},
 async user(){const token=await this.token();if(!token)return null;let response=await fetch(`${cfgUrl()}/auth/v1/user`,{headers:headers(token)});if(!response.ok){this.logout();return null}return response.json();},
 logout(){session=null;sessionStorage.removeItem(SESSION);}
};
export const db={
 async request(path,options={}){const token=await auth.token();if(!token)throw new Error('Session expired. Sign in again.');const response=await fetch(`${cfgUrl()}/rest/v1/${path}`,{...options,headers:headers(token,{'Accept':'application/json',...(options.headers||{})})});if(!response.ok){const error=await response.json().catch(()=>({message:'Database request failed'}));throw new Error(error.message||error.details||`Request failed (${response.status})`)}if(response.status===204||response.status===201&&!response.headers.get('content-length'))return null;const body=await response.text();return body?JSON.parse(body):null;},
 async list(table,orgId){return (await this.request(`${table}?organization_id=eq.${encodeURIComponent(orgId)}&select=*&order=created_at.desc`,{}))||[];},
 async insert(table,record){return this.request(table,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(record)});},
 async update(table,id,orgId,patch){return this.request(`${table}?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(orgId)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});},
 async rpc(name,args){return this.request(`rpc/${name}`,{method:'POST',body:JSON.stringify(args)});},
 async memberships(userId){const rows=await this.request(`org_members?user_id=eq.${encodeURIComponent(userId)}&select=*`);return rows||[];},
 async organization(id){const rows=await this.request(`organizations?id=eq.${encodeURIComponent(id)}&select=*`);return rows?.[0]||null;},
 async load(user){const memberships=await this.memberships(user.id);if(!memberships.length)return {onboarding:true,profile:{email:user.email,display_name:user.user_metadata?.display_name||user.email},role:'viewer'};
 const membership=memberships[0],orgId=membership.organization_id;
 const [organization,sites,incidents,inspections,risks,actions,members]=await Promise.all([
 this.organization(orgId),...['sites','incidents','inspections','risks','actions','org_members'].map(x=>this.list(x,orgId))]);
 return {organization,sites,incidents,inspections,risks,actions,members,role:membership.role,profile:{email:user.email,display_name:membership.display_name||user.email},onboarding:false};
 },
 async bootstrap(name,country){return this.rpc('bootstrap_organization',{p_name:name,p_country:country});},
 async addMember(organization_id,email,role){return this.rpc('add_organization_member',{p_organization_id:organization_id,p_email:email,p_role:role});}
};
export const newRow=(data,fields)=>({id:uid(),organization_id:data.organization.id,...fields,created_at:new Date().toISOString()});