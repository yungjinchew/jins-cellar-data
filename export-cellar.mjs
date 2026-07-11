#!/usr/bin/env node
// Exports Jin's cellar from Supabase to cellar.json + cellar.md
// Env vars: SUPABASE_URL, SUPABASE_KEY (publishable, read-only)
const URL = process.env.SUPABASE_URL || "https://ahofommkgdrpedivuxai.supabase.co";
const KEY = process.env.SUPABASE_KEY || "";

async function getJSON(path){
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers:{ apikey:KEY, Authorization:`Bearer ${KEY}` }});
  if(!r.ok) throw new Error(`${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}
const fmt = n => "S$"+Math.round(n||0).toLocaleString("en-US");
const vint = w => w.is_nv ? "NV" : (w.vintage==null?"":String(w.vintage));
const STATUS = {"drink-now":"Drink now","hold":"Hold","past-peak":"Past peak"};
function critLabel(cs){ if(!cs) return ""; const order=["WA","JS","JG","WS","CW","VM","JD","RP"]; const ks=Object.keys(cs); const k=order.find(o=>ks.includes(o))||ks[0]; return k?`${k} ${cs[k]}`:""; }

export function buildOutputs(cellar, consumed, critics, refresh, syncState){
  const critMap={}; (critics||[]).forEach(c=>{ critMap[c.iwine]=c.critic_scores; critMap["n:"+c.wine]=c.critic_scores; });
  const rbi={},rbd={}; (consumed||[]).forEach(h=>{ if(h.is_rated&&h.rating!=null&&h.iwine&&(h.consume_date||"")>=(rbd[h.iwine]||"")){ rbi[h.iwine]=h.rating; rbd[h.iwine]=h.consume_date||""; } });
  const C = (cellar||[]).map(w=>({...w, vint: vint(w),
    myRating: (w.pscore!=null)?w.pscore:(rbi[w.iwine]!=null?rbi[w.iwine]:null),
    critic: critMap[w.iwine]||critMap["n:"+w.wine]||null }));
  const date = (refresh&&refresh.ran_at?refresh.ran_at:new Date().toISOString()).slice(0,10);
  const lastChange = (syncState && syncState.last_inventory_change) ? String(syncState.last_inventory_change).slice(0,10) : null;
  const bottles = C.reduce((s,w)=>s+(w.quantity||1),0);
  const value = C.reduce((s,w)=>s+((w.value||0)*(w.quantity||1)),0);
  const reds=C.filter(w=>w.color==="Red").length, whites=C.filter(w=>w.color==="White"&&w.category!=="Sparkling").length, spark=C.filter(w=>w.category==="Sparkling").length;
  const order={"drink-now":0,"hold":1,"past-peak":2};
  C.sort((a,b)=>(order[a.drink_status]??3)-(order[b.drink_status]??3) || String(a.producer||a.wine).localeCompare(String(b.producer||b.wine)));
  const json = { generated_at:new Date().toISOString(), source:"CellarTracker via Supabase", refresh_ran_at: refresh?refresh.ran_at:null, last_inventory_change: lastChange,
    summary:{bottles,total_value_sgd:Math.round(value),reds,whites,sparkling:spark},
    cellar: C.map(w=>({iwine:w.iwine,vintage:w.is_nv?"NV":w.vintage,wine:w.wine,producer:w.producer,color:w.color,category:w.category,varietal:w.varietal,region:w.region,country:w.country,quantity:w.quantity,value_sgd:w.value,drink_from:w.begin_consume,drink_to:w.end_consume,status:w.drink_status,my_rating_10:w.myRating,community_score_100:(w.cscore!=null?Math.round(w.cscore*10)/10:null),critics:w.critic})),
    consumed:(consumed||[]).map(h=>({wine:h.wine,vintage:h.is_nv?"NV":h.vintage,color:h.color,varietal:h.varietal,date:h.consume_date,my_rating_10:h.rating,rated:h.is_rated})) };
  let md = `# Jin's Wine Cellar — snapshot ${date}\n\n`;
  md += `_Auto-exported from CellarTracker via Supabase, refreshed weekly. ${bottles} bottles, ${fmt(value)} total (${reds} red, ${whites} white, ${spark} sparkling)._\n\n`;
  if(lastChange) md += `_Inventory last changed ${lastChange}. A steady bottle count between weekly refreshes is normal — it means the cellar hasn't changed since then, not that the sync is stale._\n\n`;
  md += `Legend: **Status** = Drink now / Hold / Past peak (drinking window vs current year). **My /10** = Jin's personal score. **CT** = CellarTracker community score (out of 100). **NV** = non-vintage.\n\n`;
  md += `## Current cellar (${bottles} bottles)\n\n`;
  md += `| Vintage | Wine | Producer | Colour | Varietal | Region | Window | Status | Value | My /10 | CT |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
  C.forEach(w=>{ const win=(w.begin_consume&&w.end_consume)?`${w.begin_consume}-${w.end_consume}`:"";
    md += `| ${w.vint} | ${w.wine} | ${w.producer||""} | ${w.color||""} | ${w.varietal||""} | ${w.region||w.country||""} | ${win} | ${STATUS[w.drink_status]||""} | ${w.value?fmt(w.value):""} | ${w.myRating!=null?w.myRating:""} | ${w.cscore!=null?Math.round(w.cscore*10)/10:""}${w.critic?(" "+critLabel(w.critic)):""} |\n`; });
  const soon = C.filter(w=>w.drink_status==="past-peak"||(w.drink_status==="drink-now"&&w.end_consume&&w.end_consume<=new Date().getFullYear()+1)).sort((a,b)=>(a.end_consume||9999)-(b.end_consume||9999));
  if(soon.length){ md += `\n## Drink soon\n\n`; soon.forEach(w=>{ md += `- ${w.vint} ${w.wine} (${w.producer||""}) — ${w.drink_status==="past-peak"?"past peak, drink up":"window closes "+w.end_consume}\n`; }); }
  const rated=(consumed||[]).filter(h=>h.is_rated&&h.rating!=null).sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,20);
  if(rated.length){ md += `\n## Recently tasted, top rated (Jin's /10)\n\n| My /10 | Wine | Vintage | Varietal | Date |\n|---|---|---|---|---|\n`;
    rated.forEach(h=>{ md += `| ${h.rating} | ${h.wine} | ${h.is_nv?"NV":h.vintage} | ${h.varietal||""} | ${h.consume_date||""} |\n`; }); }
  return {json: JSON.stringify(json,null,2), md};
}
async function main(){
  if(!KEY) throw new Error("SUPABASE_KEY env var required");
  const [cellar, consumed, critics, refreshArr] = await Promise.all([
    getJSON("v_drink_status?select=*"), getJSON("v_consumed_history?select=*"),
    getJSON("v_cellar_critics?select=*"), getJSON("refresh_log?select=*&order=ran_at.desc&limit=1") ]);
  let syncState=null;
  try{ const s=await getJSON("sync_state?select=last_inventory_change&limit=1"); syncState=(s&&s[0])||null; }catch(e){ syncState=null; }
  const {json, md} = buildOutputs(cellar, consumed, critics, refreshArr&&refreshArr[0], syncState);
  const fs = await import("node:fs");
  fs.writeFileSync("cellar.json", json); fs.writeFileSync("cellar.md", md);
  console.log(`Wrote cellar.json (${cellar.length} wines) and cellar.md`);
}
import { fileURLToPath } from "node:url";
if(process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e=>{ console.error(e); process.exit(1); });
