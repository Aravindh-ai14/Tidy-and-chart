const $=s=>document.querySelector(s),CH="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
const NA=/^(na|n\/a|null|none|nan|-|--|\?|undefined)$/i;
let RAW=null,OUT=null,name="data",CUSTOM=[],FILT=null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const numOf=v=>{const s=String(v).replace(/[$€£₹,%\s]/g,"");return s!==""&&isFinite(s)?+s:NaN};
const say=t=>$("#msg").textContent=t;
const q=(a,p)=>{const i=(a.length-1)*p,l=Math.floor(i);return a[l]+(a[Math.ceil(i)]-a[l])*(i-l)};

function load(rows,n){
  rows=rows.filter(r=>r.length);
  if(rows.length<2)return say("Add a header row and at least one data row.");
  say("");RAW={h:rows[0].map(String),r:rows.slice(1)};name=n;CUSTOM=[];FILT=null;$("#f-col").innerHTML="";$("#c-x").innerHTML="";$("#c-y").innerHTML="";$("#f-min").value=$("#f-max").value="";
  $("#work").hidden=false;run();
}
function run(){
  if(!RAW)return;
  const o={hdr:$("#o-hdr").checked,trim:$("#o-trim").checked,cs:$("#o-case").checked,empty:$("#o-empty").checked,dup:$("#o-dup").checked,out:$("#o-out").checked,miss:$("#o-miss").value};
  const used={};
  const H=RAW.h.map(x=>{x=o.hdr?x.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""):x.trim();x=x||"column";if(used[x])x+="_"+(++used[x]);else used[x]=1;return x});
  let R=RAW.r.map(r=>H.map((_,i)=>{let v=r[i]==null?"":String(r[i]);if(o.trim)v=v.replace(/\s+/g," ").trim();if(NA.test(v.trim()))v="";return v}));
  const rep={dups:0,empty:0,outl:0,fixed:0,removed:0};const n0=R.length;
  if(o.empty){const k=R.length;R=R.filter(r=>r.some(v=>v!==""));rep.empty=k-R.length}
  const T=H.map((_,i)=>{const f=R.map(r=>r[i]).filter(v=>v!=="");return f.length&&f.filter(v=>!isNaN(numOf(v))).length/f.length>=.8?"n":"c"});
  R=R.map(r=>r.map((v,i)=>{if(v==="")return v;if(T[i]==="n"){const x=numOf(v);return isNaN(x)?"":x}return v}));
  if(o.cs)H.forEach((_,i)=>{if(T[i]!=="c")return;if(new Set(R.map(r=>r[i].toLowerCase())).size<=20)R.forEach(r=>{r[i]=r[i].toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())})});
  if(o.dup){const s=new Set,k=R.length;R=R.filter(r=>{const j=r.join("\u0001");if(s.has(j))return false;s.add(j);return true});rep.dups=k-R.length}
  const miss=R.reduce((s,r)=>s+r.filter(v=>v==="").length,0);
  if(o.miss==="drop"){const k=R.length;R=R.filter(r=>!r.includes(""));rep.fixed=miss;rep.dropped=k-R.length}
  else if(o.miss==="fill"){
    H.forEach((_,i)=>{const f=R.map(r=>r[i]).filter(v=>v!=="");if(!f.length)return;let fill;
      if(T[i]==="n")fill=+(f.reduce((s,x)=>s+x,0)/f.length).toFixed(2);
      else{const m={};f.forEach(x=>m[x]=(m[x]||0)+1);fill=Object.entries(m).sort((a,b)=>b[1]-a[1])[0][0]}
      R.forEach(r=>{if(r[i]===""){r[i]=fill;rep.fixed++}})});
  }
  if(o.out){
    const b=H.map((_,i)=>{if(T[i]!=="n")return null;const a=R.map(r=>r[i]).filter(v=>v!=="").sort((x,y)=>x-y);if(a.length<8)return null;const q1=q(a,.25),q3=q(a,.75),k=1.5*(q3-q1);return[q1-k,q3+k]});
    const k=R.length;R=R.filter(r=>b.every((x,i)=>!x||r[i]===""||(r[i]>=x[0]&&r[i]<=x[1])));rep.outl=k-R.length;
  }
  rep.removed=n0-R.length;
  OUT={title:name,headers:H,rows:R,types:T,rep};
  $("#rep").innerHTML=[[R.length,"rows kept of "+RAW.r.length],[rep.empty+rep.dups+rep.outl+(rep.dropped||0),"rows removed (blank, duplicate, outlier, missing)"],[rep.fixed,o.miss==="drop"?"missing cells found":"missing cells filled"],[T.filter(t=>t==="n").length,"numeric columns detected"]].map(([n,l])=>`<li><b>${n}</b> ${l}</li>`).join("");
  rep.removed=n0-R.length;
  $("#prev").innerHTML="<table><tr>"+H.map(h=>`<th>${esc(h)}</th>`).join("")+"</tr>"+R.slice(0,8).map(r=>"<tr>"+r.map(v=>`<td>${esc(v)}</td>`).join("")+"</tr>").join("")+"</table>";
  fillBuilder();
  redraw();
}

function dash(root,d){
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  (root._c||[]).forEach(c=>c.destroy());root._c=[];
  const cs=getComputedStyle(document.documentElement),v=n=>cs.getPropertyValue(n).trim(),P=["--a","--b","--c","--d"].map(v),PX=P.concat(["#8d6a9f","#5c946e","#c08552","#6b7a8f"]);
  const f=x=>Math.abs(x)>=1000?Math.round(x).toLocaleString():+x.toFixed(2);
  const H=d.headers,fl=d.filter;
  const rows=d.rows.filter(r=>{if(!fl)return true;const x=r[fl.i];if(fl.val!=null)return String(x)===fl.val;if(x==="")return false;return(fl.min==null||x>=fl.min)&&(fl.max==null||x<=fl.max)});
  if(!rows.length){root.innerHTML="<p>No rows to show. Loosen the filter or the cleaning options.</p>";return}
  const num=[],cat=[];
  d.types.forEach((t,i)=>{if(t==="n"){if(!/(^|_|\s)id$/i.test(H[i]))num.push(i)}else cat.push(i)});
  const col=i=>rows.map(r=>r[i]).filter(x=>x!=="");
  const med=a=>{a=a.slice().sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2};
  const st=i=>{const a=col(i).sort((x,y)=>x-y),n=a.length;return{a,min:a[0],max:a[n-1],mean:a.reduce((s,x)=>s+x,0)/n,med:med(a)}};
  const cnt=i=>{const m={};col(i).forEach(x=>m[x]=(m[x]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])};
  const hist=i=>{const s=st(i),k=10,w=(s.max-s.min)/k||1,c=Array(k).fill(0);s.a.forEach(x=>c[Math.min(k-1,Math.floor((x-s.min)/w))]++);
    return{t:"Distribution of "+H[i],cfg:{type:"bar",data:{labels:c.map((_,j)=>f(s.min+j*w)),datasets:[{data:c,backgroundColor:P[0],borderRadius:2}]}}}};
  const sc=(x,y)=>({t:H[y]+" vs "+H[x],cfg:{type:"scatter",data:{datasets:[{data:rows.slice(0,1000).filter(r=>r[x]!==""&&r[y]!=="").map(r=>({x:r[x],y:r[y]})),backgroundColor:P[2]}]},options:{scales:{x:{title:{display:true,text:H[x]}},y:{title:{display:true,text:H[y]}}}}}});
  const AG={count:a=>a.length,sum:a=>a.reduce((s,x)=>s+x,0),mean:a=>a.reduce((s,x)=>s+x,0)/a.length,min:a=>Math.min(...a),max:a=>Math.max(...a),median:med};
  const mk=c=>{
    if(c.type==="histogram")return hist(c.x);
    if(c.type==="scatter")return sc(c.x,c.y);
    const g=new Map;
    rows.forEach(r=>{const k=r[c.x];if(k===""||(c.agg!=="count"&&r[c.y]===""))return;if(!g.has(k))g.set(k,[]);g.get(k).push(c.agg==="count"?1:r[c.y])});
    let e=[...g].map(([k,a])=>[String(k),+AG[c.agg](a).toFixed(2)]);
    if(c.sort==="hi")e.sort((a,b)=>b[1]-a[1]);else if(c.sort==="lo")e.sort((a,b)=>a[1]-b[1]);else if(c.sort==="az")e.sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}));
    if(c.top)e=e.slice(0,c.top);
    const pie=c.type==="pie";
    return{t:(c.agg==="count"?"Count":c.agg[0].toUpperCase()+c.agg.slice(1)+" of "+H[c.y])+" by "+H[c.x],
      cfg:{type:c.type,data:{labels:e.map(x=>x[0]),datasets:[{data:e.map(x=>x[1]),backgroundColor:pie?e.map((_,i)=>PX[i%PX.length]):P[0],borderColor:P[0]}]},options:pie?{plugins:{legend:{display:true,position:"right"}}}:{}}};
  };
  let h='<div class="kpis">'+[[rows.length,fl?"rows (filtered)":"rows"],[H.length,"columns"],[num.length,"numeric columns"],[d.rep.removed,"rows removed in cleaning"]].map(([n,l])=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join("")+"</div>";
  if(num.length)h+='<div class="card"><h3>Numeric summary</h3><div class="scroll"><table><tr><th>Column</th><th>Min</th><th>Mean</th><th>Median</th><th>Max</th></tr>'+num.map(i=>{const s=st(i);return`<tr><td>${esc(H[i])}</td><td>${f(s.min)}</td><td>${f(s.mean)}</td><td>${f(s.med)}</td><td>${f(s.max)}</td></tr>`}).join("")+"</table></div></div>";
  const sp=(d.custom||[]).map((c,i)=>{try{const s=mk(c);s.rm=i;return s}catch(e){return null}}).filter(Boolean);
  if(d.auto!==false){
    num.slice(0,3).forEach(i=>sp.push(hist(i)));
    const good=cat.filter(i=>{const n=cnt(i).length;return n>=2&&n<=12});
    good.slice(0,3).forEach(i=>{const e=cnt(i).slice(0,8);
      sp.push({t:"Count by "+H[i],cfg:{type:"bar",data:{labels:e.map(x=>x[0]),datasets:[{data:e.map(x=>x[1]),backgroundColor:P[1]}]},options:{indexAxis:"y"}}})});
    if(good.length&&num.length)sp.push(mk({type:"bar",x:good[0],y:num[0],agg:"mean",sort:"hi",top:0}));
    if(num.length>1)sp.push(sc(num[0],num[1]));
  }
  h+='<div class="grid">'+sp.map((s,i)=>`<div class="card"><h3>${esc(s.t)}${s.rm!=null&&d.edit?` <button class="ghost rm noprint" data-rm="${s.rm}">Remove</button>`:""}</h3><div class="cv"><canvas id="ch${i}"></canvas></div></div>`).join("")+"</div>";
  if(!sp.length)h+="<p>No charts yet. Turn on automatic charts or add your own above.</p>";
  root.innerHTML=h;
  if(typeof Chart==="undefined")return;
  Chart.defaults.color=v("--mut");Chart.defaults.borderColor=v("--line");
  sp.forEach((s,i)=>{s.cfg.options=Object.assign({responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}},s.cfg.options);
    root._c.push(new Chart(root.querySelector("#ch"+i),s.cfg))});
}

async function save(filename,data,type){
  say("");
  try{
    const dl=window.claude?await claude.use("downloads"):null;
    if(dl){await dl.save({filename,data});return}
  }catch(e){if(e&&e.code==="declined")return;say("Couldn't save the file ("+(e&&e.code||"error")+").");return}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=filename;a.click();
}
const base=()=>name.replace(/\.[^.]+$/,"")||"data";
$("#dcsv").onclick=()=>OUT&&save(base()+"_clean.csv",Papa.unparse({fields:OUT.headers,data:OUT.rows}),"text/csv");
$("#dhtml").onclick=()=>{if(!OUT)return;
  const j=JSON.stringify({...OUT,edit:false}).replace(/</g,"\\u003c");
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(base())} dashboard</title><style>${$("#st").textContent}</style></head><body><main class="dashpage"><h1>${esc(base())}</h1><div id="r"></div></main><script src="${CH}"><\/script><script>const D=${j};${dash.toString()};dash(document.getElementById("r"),D)<\/script></body></html>`;
  save(base()+"_dashboard.html",html,"text/html")};
$("#prt").onclick=()=>window.print();
["o-hdr","o-trim","o-case","o-empty","o-dup","o-out","o-miss"].forEach(id=>$("#"+id).onchange=run);

function parse(file){
  if(!file)return;
  Papa.parse(file,{skipEmptyLines:"greedy",complete:r=>load(r.data,file.name),error:()=>say("That file couldn't be read as a CSV.")});
}
$("#file").onchange=e=>parse(e.target.files[0]);
const dz=$("#drop");
["dragenter","dragover"].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add("on")}));
["dragleave","drop"].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove("on")}));
dz.addEventListener("drop",e=>parse(e.dataTransfer.files[0]));
$("#smp").onclick=()=>{
  const reg=["North","South","East","west ","  East","NA"],prod=["Laptop","Phone","Tablet","Monitor"];
  let s=7;const rnd=()=>(s=(s*9301+49297)%233280)/233280;
  const rows=[["Order ID","Region ","Product","Units Sold","Revenue ($)","Rating"]];
  for(let i=1;i<=60;i++){const u=Math.ceil(rnd()*20);
    rows.push([i,reg[Math.floor(rnd()*6)],prod[Math.floor(rnd()*4)],rnd()<.07?"":u,rnd()<.05?"N/A":"$"+(u*(300+Math.floor(rnd()*500))).toLocaleString("en-US"),rnd()<.06?"":(3+rnd()*2).toFixed(1)])}
  rows.push(rows[5].slice(),["","","","","",""],[61,"North","Laptop",400,"$900000","4.5"]);
  load(rows,"sample_sales.csv");
};

const bsay=t=>$("#bmsg").textContent=t;
function fillBuilder(){
  const keep={f:$("#f-col").value,x:$("#c-x").value,y:$("#c-y").value};
  const H=OUT.headers,all=H.map((_,i)=>i),ni=all.filter(i=>OUT.types[i]==="n");
  const opt=a=>a.map(i=>`<option value="${i}">${esc(H[i])}</option>`).join("");
  $("#f-col").innerHTML='<option value="">No filter</option>'+opt(all);
  $("#c-x").innerHTML=opt(all);
  $("#c-y").innerHTML=opt(ni)||'<option value="">No numeric columns</option>';
  [["#f-col",keep.f],["#c-x",keep.x],["#c-y",keep.y]].forEach(([s,k])=>{if(k&&$(s).querySelector(`option[value="${k}"]`))$(s).value=k});
  filtUI();
}
function filtUI(){
  const i=$("#f-col").value;
  $("#f-val-wrap").hidden=true;$("#f-rng").hidden=true;
  if(i===""){FILT=null;return}
  const ix=+i;
  if(OUT.types[ix]==="c"){
    const u=[...new Set(OUT.rows.map(r=>r[ix]).filter(x=>x!==""))].sort().slice(0,300);
    $("#f-val").innerHTML=u.map(x=>`<option>${esc(x)}</option>`).join("");
    if(FILT&&FILT.i===ix&&FILT.val!=null&&u.includes(FILT.val))$("#f-val").value=FILT.val;
    $("#f-val-wrap").hidden=false;
  }else $("#f-rng").hidden=false;
  readFilt();
}
function readFilt(){
  const i=$("#f-col").value;if(i===""){FILT=null;return}
  const ix=+i;
  if(OUT.types[ix]==="c")FILT={i:ix,val:$("#f-val").value};
  else{const a=$("#f-min").value,b=$("#f-max").value;FILT={i:ix,min:a===""?null:+a,max:b===""?null:+b}}
}
function redraw(){OUT.filter=FILT;OUT.custom=CUSTOM;OUT.edit=true;OUT.auto=$("#auto").checked;dash($("#dash"),OUT)}
$("#f-col").onchange=()=>{FILT=null;$("#f-min").value=$("#f-max").value="";filtUI();redraw()};
["f-val","f-min","f-max","auto"].forEach(id=>$("#"+id).onchange=()=>{readFilt();redraw()});
$("#c-add").onclick=()=>{
  if(!OUT)return;
  const type=$("#c-type").value,x=+$("#c-x").value,yv=$("#c-y").value,agg=$("#c-agg").value;
  if((type==="histogram"||type==="scatter")&&OUT.types[x]!=="n")return bsay("That chart needs a numeric column for X.");
  if((type==="scatter"||(type!=="histogram"&&agg!=="count"))&&yv==="")return bsay("Pick a numeric column for Y, or set the calculation to count.");
  bsay("");CUSTOM.push({type,x,y:yv===""?null:+yv,agg,top:+$("#c-top").value,sort:$("#c-sort").value});redraw();
};
$("#c-clear").onclick=()=>{CUSTOM=[];redraw()};
$("#dash").addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(b){CUSTOM.splice(+b.dataset.rm,1);redraw()}});
