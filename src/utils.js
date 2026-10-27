export const uid = () => (globalThis.crypto?.randomUUID?.() || `demo-${Math.random().toString(36).slice(2)}-${Date.now()}`);
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])); }
export const clamp = (n, a, b) => Math.max(a,Math.min(b,Number(n) || 0));
export const riskScore = (likelihood, impact) => clamp(likelihood,1,5)*clamp(impact,1,5);
export const riskBand = (score) => score>=16?'critical':score>=10?'high':score>=5?'medium':'low';
export const active = (item) => !['closed','resolved','completed'].includes(item.status);
export function stats(data) {
 const incidents=data.incidents||[], inspections=data.inspections||[], actions=data.actions||[], risks=data.risks||[];
 return { incidents:incidents.filter(active).length, nearMiss:incidents.filter(x=>x.kind==='near_miss').length,
 inspections:inspections.filter(x=>x.status==='completed').length,
 actions:actions.filter(active).length,
 overdue:actions.filter(x=>active(x) && x.due_date && x.due_date < new Date().toISOString().slice(0,10)).length,
 critical:risks.filter(x=>riskScore(x.likelihood,x.impact)>=16 && active(x)).length,
 observations:inspections.filter(x=>x.result==='needs_attention').length };
}
export function aggregate(data) {
 const s=stats(data); return { ...s, totalIncidents:data.incidents.length, totalInspections:data.inspections.length, totalRisks:data.risks.length, totalActions:data.actions.length };
}
export function safeDate(value, lang='en') { if(!value)return '—'; const date=new Date(`${String(value).slice(0,10)}T12:00:00Z`);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat(lang==='ar'?'ar-SA':'en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(date); }