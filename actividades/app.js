
// ===== util =====
const fmt=(v)=>{ if(v==='DNE') return 'DNE'; if(!isFinite(v)) return v>0?'+∞':'−∞'; if(Math.abs(v)<1e-9) return '0'; return (Math.abs(v)>=1e6||Math.abs(v)<1e-4)? v.toExponential(6): (''+Number(v.toFixed(8))).replace(/0+$/,'').replace(/\.$/,''); };
function parseAns(s){ if(!s) return NaN; s=s.trim().toLowerCase().replace(',','.'); if(['+inf','inf','infty','+∞','infinito'].includes(s)) return Infinity; if(['-inf','-infty','-∞'].includes(s)) return -Infinity; if(['dne','no existe','noexiste','indef','indefinido','n/e'].includes(s)) return 'DNE'; if(/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(s)){ const [p,q]=s.split('/').map(Number); if(q===0) return p>0?Infinity:(p<0?-Infinity:NaN); return p/q; } const v=Number(s); return Number.isFinite(v)?v:NaN; }
function cmp(u,c){ if(c==='DNE') return u==='DNE'; if(c===Infinity||c==='inf') return u===Infinity; if(c===-Infinity||c==='-inf') return u===-Infinity; return Number.isFinite(u)&&Number.isFinite(c)&&Math.abs(u-c)<1e-3; }
function robustMean(a){ if(!a||!a.length) return NaN; const s=[...a].sort((x,y)=>x-y); const cut=Math.floor(s.length*0.2); const core=s.slice(cut,s.length-cut); if(!core.length) return NaN; return core.reduce((p,c)=>p+c,0)/core.length; }
function estOne(f,a,side='left',steps=12){ const vals=[]; for(let k=1;k<=steps;k++){ const h=Math.pow(10,-k); const x= side==='left'? a-h: a+h; const y=f(x); if(isFinite(y)) vals.push(y);} return robustMean(vals); }
function expectedForPoint(f,a){ const L=estOne(f,a,'left',12); const R=estOne(f,a,'right',12); let T='DNE'; if(Number.isFinite(L)&&Number.isFinite(R)&&Math.abs(L-R)<1e-4) T=(L+R)/2; else if(L===Infinity&&R===Infinity) T=Infinity; else if(L===-Infinity&&R===-Infinity) T=-Infinity; const V=f(a); return {L,R,T,V}; }

// ===== ejercicios (cada uno con 2 puntos: a y b) =====
const EX=[
  { range:[-10,10], a:-3, b:2,    f:(x)=> (Math.abs(x-2)<1e-12? 5 : x+1), marks:[{x:2,y:3,open:true},{x:2,y:5,open:false}], hint:"Recta y=x+1 con un agujero en x=2 y un valor distinto f(2)=5." },
  { range:[-10,10], a:-1, b:1,    f:(x)=> x<-1 ? -x : -x+2, marks:[{x:-1,y:1,open:true},{x:-1,y:3,open:false}], hint:"Salto en x=-1 (izq y=-x; der y=-x+2)." },
  { range:[-6,6],  a:0,  b:3,    f:(x)=> x===0? 0 : (Math.abs(x)/x), marks:[{x:0,y:-1,open:true},{x:0,y:1,open:true},{x:0,y:0,open:false}], hint:"Función signo y f(0)=0." },
  { range:[-6,6],  a:1,  b:-2,   f:(x)=> (Math.abs(x-1)<1e-12? -2 : (x+1)), marks:[{x:1,y:2,open:true},{x:1,y:-2,open:false}], hint:"Racional típica: y=x+1 salvo f(1)=-2." },
  { range:[-2,6],  a:0,  b:1,    f:(x)=> (Math.abs(x-0)<1e-12? 1 : (x/(Math.sqrt(x+1)-1))), marks:[{x:0,y:2,open:true},{x:0,y:1,open:false}], hint:"Racionalización (cuidado con la indeterminación en 0)." },
  { range:[-6,6],  a:-2, b:2,    f:(x)=> 0.3*x*x*x + 1, marks:[], hint:"Cúbica continua (límite = valor)." },
  { range:[-2,6],  a:1,  b:4,    f:(x)=> (x<1? (x*x) : (2*x-1)), marks:[{x:1,y:1,open:true},{x:1,y:1.5,open:false}], hint:"Por tramos: izq y=x^2, der y=2x-1. f(1)=1.5." },
  { range:[0,6],   a:3,  b:5,    f:(x)=> 1/((x-3)*(x-3)), marks:[], hint:"x→3: ambos lados → +∞ (vertical fuerte)." },
  { range:[-2,6],  a:2,  b:0,    f:(x)=> (x+2)/(x-2), marks:[], hint:"x→2: izq −∞, der +∞. En 0 es continuo." },
  { range:[-6,6],  a:0,  b:-3,   f:(x)=> x<0? -1 : (x>0? 1 : 0), marks:[{x:0,y:-1,open:true},{x:0,y:1,open:true},{x:0,y:0,open:false}], hint:"Salto en 0 con f(0)=0." },
];

// ===== Canvas con ejes numerados =====
const canvas=document.getElementById('plotCanvas'); const ctx=canvas.getContext('2d');
let W=0,H=0, DPR=window.devicePixelRatio||1;
let world={xmin:-6,xmax:6,ymin:-6,ymax:6};
function setSize(){ const wrap=document.getElementById('plotWrap'); const r=wrap?wrap.getBoundingClientRect():canvas.getBoundingClientRect(); const cssW=Math.max(1,Math.floor(r.width)); const cssH=Math.max(1, Math.floor(canvas.clientHeight||r.height||360)); W=cssW; H=cssH; if(canvas.width!==Math.floor(W*DPR)||canvas.height!==Math.floor(H*DPR)){ canvas.width=Math.floor(W*DPR); canvas.height=Math.floor(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);} draw(); }
window.addEventListener('resize', setSize);
if(window.ResizeObserver){ try{ const ro=new ResizeObserver(()=>setSize()); ro.observe(document.getElementById('plotWrap')); }catch(e){} }
function x2p(x){ return (x-world.xmin)/(world.xmax-world.xmin)*W; } function y2p(y){ return H-(y-world.ymin)/(world.ymax-world.ymin)*H; }
function sampleY(f,x){ const y=f(x); return Number.isFinite(y)?y:null; }
function drawGrid(){
  // menor 0.5
  ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.beginPath();
  for(let x=Math.ceil(world.xmin-0.5); x<=Math.floor(world.xmax); x+=1){ const px=x2p(x+0.5); ctx.moveTo(px,0); ctx.lineTo(px,H); }
  for(let y=Math.ceil(world.ymin-0.5); y<=Math.floor(world.ymax); y+=1){ const py=y2p(y+0.5); ctx.moveTo(0,py); ctx.lineTo(W,py); }
  ctx.stroke();
  // mayor 1
  ctx.strokeStyle='rgba(255,255,255,0.10)'; ctx.beginPath();
  for(let x=Math.ceil(world.xmin); x<=Math.floor(world.xmax); x++){ const px=x2p(x); ctx.moveTo(px,0); ctx.lineTo(px,H); }
  for(let y=Math.ceil(world.ymin); y<=Math.floor(world.ymax); y++){ const py=y2p(y); ctx.moveTo(0,py); ctx.lineTo(W,py); }
  ctx.stroke();
  // ejes
  ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2;
  const py0=y2p(0); ctx.beginPath(); ctx.moveTo(0,py0); ctx.lineTo(W,py0); ctx.stroke();
  const px0=x2p(0); ctx.beginPath(); ctx.moveTo(px0,0); ctx.lineTo(px0,H); ctx.stroke();
  // etiquetas numéricas
  ctx.fillStyle='#94a3b8'; ctx.font='12px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Arial';
  const labelSpacingPx=35;
  const pxPerUnitX=W/(world.xmax-world.xmin);
  const pxPerUnitY=H/(world.ymax-world.ymin);
  const stepX=Math.max(1, Math.ceil(labelSpacingPx/pxPerUnitX));
  const stepY=Math.max(1, Math.ceil(labelSpacingPx/pxPerUnitY));
  const yLabelX=(py0>=14 && py0<=H-6)? py0+14 : (H-6);
  for(let xi=Math.ceil(world.xmin); xi<=Math.floor(world.xmax); xi+=stepX){ const px=x2p(xi); if(px<12||px>W-12) continue; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(String(xi), px, yLabelX); }
  const hasYaxis=(px0>=18 && px0<=W-6);
  for(let yi=Math.ceil(world.ymin); yi<=Math.floor(world.ymax); yi+=stepY){ const py=y2p(yi); if(py<10||py>H-10) continue; ctx.textAlign='right'; ctx.textBaseline='middle'; const xText=hasYaxis? (px0-6) : 28; ctx.fillText(String(yi), xText, py); }
}
function drawFunction(f){ ctx.lineWidth=3; ctx.strokeStyle='#60a5fa'; ctx.beginPath(); const n=900; const step=(world.xmax-world.xmin)/n; let penUp=true; for(let i=0;i<=n;i++){ const x=world.xmin+i*step; const y=sampleY(f,x); if(y===null){ penUp=true; continue; } const px=x2p(x), py=y2p(y); if(penUp){ ctx.moveTo(px,py); penUp=false; } else { ctx.lineTo(px,py); } } ctx.stroke(); }
function drawMarks(ex){
  const marks = ex.marks||[];
  marks.forEach(m=>{ const px=x2p(m.x), py=y2p(m.y); ctx.lineWidth=2; ctx.strokeStyle='#f59e0b'; ctx.fillStyle='#f59e0b'; ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); m.open?ctx.stroke():ctx.fill(); });
  // marcar a y b con color extra
  const pts=[{x:ex.a,color:'#22d3ee'},{x:ex.b,color:'#a78bfa'}];
  pts.forEach(p=>{ const y=ex.f(p.x); if(!Number.isFinite(y)) return; ctx.beginPath(); ctx.fillStyle=p.color; ctx.arc(x2p(p.x), y2p(y), 4, 0, Math.PI*2); ctx.fill(); });
}
function clear(){ ctx.clearRect(0,0,W,H); }
function draw(){ if(!current) return; clear(); drawGrid(); drawFunction(current.f); drawMarks(current); }

// Pan y zoom
let dragging=false,lastX=0,lastY=0;
canvas.addEventListener('mousedown', e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener('mouseup', ()=> dragging=false);
window.addEventListener('mousemove', e=>{ if(!dragging) return; const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; const sx=(world.xmax-world.xmin)/W, sy=(world.ymax-world.ymin)/H; world.xmin-=dx*sx; world.xmax-=dx*sx; world.ymin+=dy*sy; world.ymax+=dy*sy; draw(); });
canvas.addEventListener('wheel', e=>{ e.preventDefault(); const zoom=Math.exp(-e.deltaY*0.0015); const mx=e.offsetX, my=e.offsetY; const x0=world.xmin+(mx/W)*(world.xmax-world.xmin); const y0=world.ymin+((H-my)/H)*(world.ymax-world.ymin); const nx=(world.xmax-world.xmin)*zoom; const ny=(world.ymax-world.ymin)*zoom; world.xmin=x0-(mx/W)*nx; world.xmax=world.xmin+nx; world.ymin=y0-((H-my)/H)*ny; world.ymax=world.ymin+ny; draw(); }, {passive:false});

// ===== UI =====
let i=0; const results=new Array(EX.length).fill(null); let current=null;
function setupWorld(ex){ const [xmin,xmax]=ex.range; let ys=[]; const n=800; const step=(xmax-xmin)/n; for(let k=0;k<=n;k++){ const x=xmin+k*step; const y=ex.f(x); if(Number.isFinite(y)) ys.push(y); } let yMin=ys.length?Math.min(...ys):-5, yMax=ys.length?Math.max(...ys):5; const pad=(yMax-yMin)*0.12||1; yMin-=pad; yMax+=pad; world={xmin,xmax,ymin:yMin,ymax:yMax}; }
function drawEx(ex){ current=ex; setupWorld(ex); setSize(); document.getElementById('hA').textContent=`Punto a = ${fmt(ex.a)}`; document.getElementById('hB').textContent=`Punto b = ${fmt(ex.b)}`; document.getElementById('hint').textContent = ex.hint; }
function render(){ const ex=EX[i]; ['ansA_L','ansA_R','ansA_T','ansA_V','ansB_L','ansB_R','ansB_T','ansB_V'].forEach(id=>{ const el=document.getElementById(id); el.value=''; el.classList.remove('ok-field','err-field'); }); document.getElementById('fb').innerHTML=''; drawEx(ex); updateScore(0); document.getElementById('score').textContent=`Ejercicio ${i+1}/${EX.length} — Aciertos en este: 0/8 — Global: ${(results.filter(v=>v&&v.ok!=null).reduce((p,c)=>p+c.ok,0))} correctos`; }
function updateScore(localOk){ const globalOk=results.filter(v=>v&&v.ok!=null).reduce((p,c)=>p+c.ok,0); document.getElementById('score').textContent=`Ejercicio ${i+1}/${EX.length} — Aciertos en este: ${localOk}/8 — Global: ${globalOk} correctos`; }
document.getElementById('btnCheck').addEventListener('click',()=>{
  const ex=EX[i];
  const EA=expectedForPoint(ex.f, ex.a);
  const EB=expectedForPoint(ex.f, ex.b);
  const vals=[
    ['ansA_L', EA.L], ['ansA_R', EA.R], ['ansA_T', EA.T], ['ansA_V', EA.V],
    ['ansB_L', EB.L], ['ansB_R', EB.R], ['ansB_T', EB.T], ['ansB_V', EB.V],
  ];
  let okCount=0;
  let feedbackParts=[];
  vals.forEach(([id,correct], idx)=>{
    const el=document.getElementById(id);
    const user=parseAns(el.value);
    const ok=cmp(user, correct);
    el.classList.toggle('ok-field', ok);
    el.classList.toggle('err-field', !ok);
    if(ok) okCount++;
  });
  document.getElementById('fb').innerHTML = `<span class="pill ${okCount===8?'ok':(okCount>=4?'warn':'err')}">Resultado</span> — Aciertos: ${okCount}/8. ` +
    ` Para a=${fmt(ex.a)} ⇒ (L=${fmt(EA.L)}, R=${fmt(EA.R)}, lim=${fmt(EA.T)}, f(a)=${fmt(EA.V)}). ` +
    ` Para b=${fmt(ex.b)} ⇒ (L=${fmt(EB.L)}, R=${fmt(EB.R)}, lim=${fmt(EB.T)}, f(b)=${fmt(EB.V)}).`;
  results[i]={ok:okCount};
  updateScore(okCount);
});
document.getElementById('btnNext').addEventListener('click',()=>{ if(i<EX.length-1){ i++; render(); } });
document.getElementById('btnReset').addEventListener('click',()=>{ for(let k=0;k<results.length;k++) results[k]=null; i=0; render(); });
(function whenReady(){ const wrap=document.getElementById('plotWrap'); const w=wrap.getBoundingClientRect().width; if(w>10){ render(); } else { requestAnimationFrame(whenReady); } })();
