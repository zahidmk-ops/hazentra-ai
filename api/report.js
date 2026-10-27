/**
 * Secure server-side AI report generator for Vercel Node runtime (no npm deps).
 * OPENAI_API_KEY, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be server-side
 * environment variables. This endpoint never trusts operational data from clients.
 */
const SAFE_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function send(res,status,payload){res.writeHead(status,JSON_HEADERS);res.end(JSON.stringify(payload));}
async function fromSupabase(path,token){
 const url=`${process.env.SUPABASE_URL?.replace(/\/$/,'')}/rest/v1/${path}`;
 const resp=await fetch(url,{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,Accept:'application/json',Prefer:'count=exact'}});
 if(!resp.ok)throw new Error(`Operational data unavailable (${resp.status})`);
 const rows=await resp.json();
 const range=resp.headers.get('content-range')||'';
 const count=Number(range.split('/')[1]);
 if(Number.isFinite(count)&&count>1000)throw new Error('The selected dataset exceeds the safe reporting limit. Narrow the site scope.');
 return rows;
}
function countActive(rows){return rows.filter(r=>!['closed','completed','resolved'].includes(r.status)).length;}
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Method not allowed'});}
 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey||!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)return send(res,503,{error:'AI reporting is not configured'});
 const authorization=req.headers.authorization||'';
 if(!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization))return send(res,401,{error:'Authentication required'});
 const token=authorization.slice(7);
 const {organization_id,site_id=null,language='en',focus='executive'}=req.body||{};
 if(!SAFE_UUID.test(organization_id||'')||(site_id&&!SAFE_UUID.test(site_id))||!['en','ar'].includes(language)||!['executive','operational','siteReport'].includes(focus))return send(res,400,{error:'Invalid request'});
 try{
  const authResp=await fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});
  if(!authResp.ok)return send(res,401,{error:'Session invalid or expired'});
  // Check membership under RLS; a fake organization ID must never reach the AI provider.
  const memberships=await fromSupabase(`org_members?organization_id=eq.${organization_id}&select=organization_id&limit=1`,token);
  if(!memberships.length)return send(res,403,{error:'Workspace access denied'});
  if(site_id){const sites=await fromSupabase(`sites?organization_id=eq.${organization_id}&id=eq.${site_id}&select=id&limit=1`,token);if(!sites.length)return send(res,403,{error:'Site access denied'});}
  // Consume one database-enforced quota unit, atomically, before model invocation.
  const quota=await fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/rpc/consume_ai_quota`,{
   method:'POST',headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
   body:JSON.stringify({p_organization_id:organization_id})
  });
  if(!quota.ok)return send(res,503,{error:'AI quota service unavailable'});
  if(await quota.json()!==true)return send(res,429,{error:'Daily AI report limit reached (20 per account)'});
  const where=`organization_id=eq.${organization_id}${site_id?`&site_id=eq.${site_id}`:''}`;
  const [incidents,inspections,risks,actions]=await Promise.all([
   fromSupabase(`incidents?${where}&select=kind,severity,status&limit=1000`,token),
   fromSupabase(`inspections?${where}&select=result,status&limit=1000`,token),
   fromSupabase(`risks?${where}&select=likelihood,impact,status&limit=1000`,token),
   fromSupabase(`actions?${where}&select=status,due_date&limit=1000`,token)]);
  const today=new Date().toISOString().slice(0,10);
  const aggregate={scope:site_id?'one selected site':'all organization sites',date:today,incidentTotal:incidents.length,nearMisses:incidents.filter(r=>r.kind==='near_miss').length,activeIncidents:countActive(incidents),highSeverityIncidents:incidents.filter(r=>['high','critical'].includes(r.severity)).length,inspectionTotal:inspections.length,inspectionFollowUps:inspections.filter(r=>['needs_attention','fail'].includes(r.result)).length,criticalOpenRisks:risks.filter(r=>r.likelihood*r.impact>=16&&!['closed','completed'].includes(r.status)).length,openActions:countActive(actions),overdueActions:actions.filter(r=>!['closed','completed'].includes(r.status)&&r.due_date<today).length};
  const instruction=`You create concise operational HSE summaries for senior industrial management. Use only supplied counts. Never claim legal compliance, incident causation, injury outcomes, or verified field conditions. Do not invent source facts. Be practical and neutral. Language: ${language==='ar'?'Modern Standard Arabic':'professional English'}. Report focus: ${focus}. Respond as valid JSON only, with keys summary (string), findings (array of 3-5 short strings), recommendations (array of exactly 3 actionable strings). Do not include markdown or personal data. Human approval required.`;
  const ai=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',store:false,max_output_tokens:900,instructions:instruction,input:JSON.stringify(aggregate),text:{format:{type:'json_schema',name:'hse_operational_briefing',strict:true,schema:{type:'object',properties:{summary:{type:'string'},findings:{type:'array',items:{type:'string'}},recommendations:{type:'array',items:{type:'string'}}},required:['summary','findings','recommendations'],additionalProperties:false}}}})});
  if(!ai.ok)return send(res,502,{error:'AI provider unavailable'});
  const output=await ai.json();
  const raw=output.output_text||output.output?.flatMap(x=>(x.content||[]).filter(c=>c.type==='output_text').map(c=>c.text)).join('')||'';
  let parsed;try{parsed=JSON.parse(raw)}catch{return send(res,502,{error:'AI output could not be validated'});}
  const valid=v=>typeof v==='string'&&v.length>15&&v.length<3000;
  if(!valid(parsed.summary)||!Array.isArray(parsed.findings)||!Array.isArray(parsed.recommendations)||parsed.findings.length<1||parsed.findings.length>7||parsed.recommendations.length!==3||![...parsed.findings,...parsed.recommendations].every(valid))return send(res,502,{error:'AI output failed validation'});
  return send(res,200,{summary:parsed.summary,findings:parsed.findings,recommendations:parsed.recommendations,source:'ai'});
 }catch(err){console.error('Hazentra reporting failed:',err.message);return send(res,503,{error:'Reporting service unavailable. Use the operational fallback.'});}
}