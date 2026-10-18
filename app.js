// <core>
const PERIODS={daily:'Daily',weekly:'Weekly',monthly:'Monthly'};
function periodRange(p,now){const d=new Date(now);d.setHours(0,0,0,0);let s,e;
  if(p==='daily'){s=new Date(d);e=new Date(d);e.setDate(e.getDate()+1);}
  else if(p==='weekly'){s=new Date(d);s.setDate(s.getDate()-((s.getDay()+6)%7));e=new Date(s);e.setDate(e.getDate()+7);}
  else{s=new Date(d.getFullYear(),d.getMonth(),1);e=new Date(d.getFullYear(),d.getMonth()+1,1);}
  return{start:s.getTime(),end:e.getTime()};}
function inRange(ts,r){return ts>=r.start&&ts<r.end}
function parseAmount(str){const t=String(str).trim().replace(/\s/g,'').replace(',','.');
  if(!/^\d+(\.\d{1,2})?$/.test(t))return null;const v=Math.round(parseFloat(t)*100);return v>0&&v<=1e11?v:null}
function dayKey(ts){const d=new Date(ts);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function summarize(state,now){const r=periodRange(state.budget.period,now);
  const spent=state.expenses.filter(e=>inRange(e.ts,r)).reduce((a,e)=>a+e.amt,0);
  const total=state.budget.amount,remaining=total-spent,pct=total>0?spent*100/total:0;
  return{range:r,spent,total,remaining,pct,level:pct>100?'over':pct>=80?'warn':'ok'}}
function byCategory(list){const m={};list.forEach(e=>m[e.cat]=(m[e.cat]||0)+e.amt);return Object.entries(m).sort((a,b)=>b[1]-a[1])}
function dailySeries(state,now){const r=periodRange(state.budget.period,now);const t=new Date(now);t.setHours(0,0,0,0);
  let s=new Date(r.start);if(state.budget.period==='daily'){s=new Date(t);s.setDate(s.getDate()-6)}
  const out=[];for(let d=new Date(s);d<=t;d.setDate(d.getDate()+1)){out.push({date:new Date(d),key:dayKey(d.getTime()),total:0})}
  state.expenses.forEach(e=>{const o=out.find(x=>x.key===dayKey(e.ts));if(o)o.total+=e.amt});return out}
// </core>

const CATS=[['food','🍔','Food & drinks'],['transport','🚕','Transport'],['shopping','🛍️','Shopping'],['bills','🧾','Bills'],['health','💊','Health'],['fun','🎬','Fun'],['other','📦','Other']];
const cinfo=k=>CATS.find(c=>c[0]===k)||CATS[6];
const $=s=>document.querySelector(s);
const KEY='wiselys:v1';
let state=load(),editId=null,delId=null,lastCat='food',saveOK=true;
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.budget&&Array.isArray(s.expenses))return s}catch(e){}
  return{budget:{amount:null,period:'monthly',currency:'TRY'},expenses:[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveOK=true}catch(e){saveOK=false}}
const fmt=m=>new Intl.NumberFormat(undefined,{style:'currency',currency:state.budget.currency}).format(m/100);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dshort=ts=>new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short'});
const dtime=ts=>new Date(ts).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const amtStr=m=>(m/100).toFixed(2);
function localDT(ts){const d=new Date(ts);return dayKey(ts)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}

function render(){
  const b=state.budget,now=Date.now();
  $('#note').innerHTML=saveOK?'':'<div class="note">Couldn’t save to this browser — changes may be lost on refresh.</div>';
  if(!b.amount){$('#dash').innerHTML='<div class="card"><h2>Welcome 👋</h2><p class="muted">Set a budget to see what’s left, then log each expense in a couple of taps.</p><button class="btn primary" id="bSet">Set budget</button></div>'}
  else{const s=summarize(state,now),rem=s.remaining,days=Math.max(1,Math.ceil((s.range.end-now)/864e5));
    const lastDay=s.range.end-1,range=b.period==='daily'?dshort(s.range.start):dshort(s.range.start)+' – '+dshort(lastDay);
    let msg='';
    if(s.level==='over')msg=`⚠️ You’re ${fmt(-rem)} over your ${b.period} budget.`;
    else if(s.pct>=100)msg='⚠️ You’ve used your entire budget.';
    else if(s.level==='warn')msg=`⚠️ Heads up: ${Math.round(s.pct)}% used, ${fmt(rem)} left.`;
    $('#dash').innerHTML=`<div class="card ${s.level}">
      <div class="row"><strong>${PERIODS[b.period]} budget</strong><span class="muted">${range}</span></div>
      <div class="big">${fmt(Math.abs(rem))}</div><div class="muted">${rem>=0?'remaining':'over budget'}</div>
      <div class="bar" role="progressbar" aria-label="Budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100,Math.round(s.pct))}"><i style="width:${Math.min(100,s.pct)}%"></i></div>
      <div class="row"><span>${Math.round(s.pct)}% used</span><span>${fmt(s.spent)} spent of ${fmt(s.total)}</span></div>
      ${msg?`<div class="alert" role="status">${msg}</div>`:`<small style="display:block;margin-top:8px">${days} day${days>1?'s':''} left · about ${fmt(rem/days)} per day</small>`}</div>`}
  // insights
  const r=periodRange(b.period,now),per=state.expenses.filter(e=>inRange(e.ts,r));
  if(!per.length)$('#ins').innerHTML='<div class="empty">No spending in this period yet. Insights appear after your first expense.</div>';
  else{const cats=byCategory(per),tot=per.reduce((a,e)=>a+e.amt,0),top=cinfo(cats[0][0]);
    const ser=dailySeries(state,now),max=Math.max(...ser.map(x=>x.total),1),W=320,H=110,bw=W/ser.length,step=Math.ceil(ser.length/8);
    const bars=ser.map((x,i)=>{const h=x.total/max*(H-26);return`<g><title>${dshort(x.date)}: ${fmt(x.total)}</title><rect x="${i*bw+bw*.12}" y="${H-16-h}" width="${bw*.76}" height="${Math.max(h,x.total?2:0)}" rx="3" fill="var(--acc)"/>${i%step===0?`<text x="${i*bw+bw/2}" y="${H-3}" font-size="10" text-anchor="middle" fill="var(--mut)">${x.date.getDate()}</text>`:''}</g>`}).join('');
    $('#ins').innerHTML=`<p style="margin-top:0"><strong>${top[1]} ${top[2]}</strong> is your biggest spend: ${fmt(cats[0][1])} (${Math.round(cats[0][1]/tot*100)}%).</p>
      ${cats.map(([k,v])=>{const c=cinfo(k);return`<div class="catrow"><div class="row"><span>${c[1]} ${c[2]}</span><span class="amt">${fmt(v)}</span></div><div class="bar"><i style="width:${v/tot*100}%"></i></div></div>`}).join('')}
      <h2 style="margin-top:18px">Daily spending</h2><div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily spending bar chart, highest day ${fmt(max)}">${bars}</svg></div>`}
  renderList();
}
function renderList(){
  const c=$('#fCat').value,d=$('#fDate').value,sc=$('#fScope').value,r=periodRange(state.budget.period,Date.now());
  const rows=state.expenses.filter(e=>(!c||e.cat===c)&&(d?dayKey(e.ts)===d:(sc==='all'||inRange(e.ts,r)))).sort((a,b)=>b.ts-a.ts);
  $('#list').innerHTML=!state.expenses.length?'<li class="empty">No expenses yet. Tap “Add expense” after your next coffee ☕</li>'
    :!rows.length?'<li class="empty">No expenses match these filters.</li>'
    :rows.map(e=>{const ci=cinfo(e.cat);return`<li class="tx"><span class="ico" aria-hidden="true">${ci[1]}</span><div class="grow"><strong>${ci[2]}</strong><small>${e.desc?esc(e.desc)+' · ':''}${dtime(e.ts)}</small></div><span class="amt">−${fmt(e.amt)}</span><button class="btn icon" data-edit="${e.id}" aria-label="Edit expense">✏️</button><button class="btn icon" data-del="${e.id}" aria-label="Delete expense">🗑️</button></li>`}).join('');
}

function openExp(id){editId=id;const e=id&&state.expenses.find(x=>x.id===id);
  $('#tExp').textContent=e?'Edit expense':'Add expense';$('#eExp').textContent='';
  $('#iAmt').value=e?amtStr(e.amt):'';$('#iDesc').value=e?e.desc:'';
  $('#dtWrap').hidden=!e;if(e)$('#iDt').value=localDT(e.ts);
  const cat=e?e.cat:lastCat;document.querySelectorAll('#cats input').forEach(i=>i.checked=i.value===cat);
  $('#dExp').showModal();$('#iAmt').focus();}
$('#fExp').addEventListener('submit',ev=>{ev.preventDefault();
  const amt=parseAmount($('#iAmt').value),cat=(document.querySelector('#cats input:checked')||{}).value;
  if(amt===null){$('#eExp').textContent='Enter an amount above 0 with at most 2 decimals, e.g. 45.50';$('#iAmt').focus();return}
  if(!cat){$('#eExp').textContent='Pick a category.';return}
  const desc=$('#iDesc').value.trim();lastCat=cat;
  if(editId){const e=state.expenses.find(x=>x.id===editId),ts=new Date($('#iDt').value).getTime();
    if(isNaN(ts)){$('#eExp').textContent='Enter a valid date and time.';return}
    Object.assign(e,{amt,cat,desc,ts})}
  else state.expenses.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),amt,cat,desc,ts:Date.now()});
  save();$('#dExp').close();render();});

function openBud(){const b=state.budget;$('#bAmt').value=b.amount?amtStr(b.amount):'';$('#bPer').value=b.period;$('#bCur').value=b.currency;$('#eBud').textContent='';$('#dBud').showModal();$('#bAmt').focus()}
$('#fBud').addEventListener('submit',ev=>{ev.preventDefault();const a=parseAmount($('#bAmt').value);
  if(a===null){$('#eBud').textContent='Enter a budget above 0 with at most 2 decimals, e.g. 5000';return}
  state.budget={amount:a,period:$('#bPer').value,currency:$('#bCur').value};save();$('#dBud').close();render();});

document.addEventListener('click',ev=>{const t=ev.target.closest('button');if(!t)return;
  if(t.dataset.close!==undefined)t.closest('dialog').close();
  else if(t.dataset.edit)openExp(t.dataset.edit);
  else if(t.dataset.del){delId=t.dataset.del;const e=state.expenses.find(x=>x.id===delId);$('#pDel').textContent=`${cinfo(e.cat)[2]} · ${fmt(e.amt)}${e.desc?' · '+e.desc:''}`;$('#dDel').showModal()}
  else if(t.id==='bSet')openBud();});
$('#bDel').addEventListener('click',()=>{state.expenses=state.expenses.filter(x=>x.id!==delId);save();$('#dDel').close();render()});
$('#fab').addEventListener('click',()=>openExp(null));
$('#bBudget').addEventListener('click',openBud);
['#fScope','#fCat','#fDate'].forEach(s=>$(s).addEventListener('input',renderList));

$('#cats').innerHTML=CATS.map(c=>`<label class="cat"><input type="radio" name="cat" value="${c[0]}"><span>${c[1]} ${c[2]}</span></label>`).join('');
$('#fCat').innerHTML='<option value="">All categories</option>'+CATS.map(c=>`<option value="${c[0]}">${c[1]} ${c[2]}</option>`).join('');
render();
