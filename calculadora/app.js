
// ===== Canvas renderer con ejes numerados =====
const canvas=document.getElementById('plotCanvas'); const ctx=canvas.getContext('2d');
let W=0,H=0, DPR=window.devicePixelRatio||1;
let world={xmin:-6,xmax:6,ymin:-6,ymax:6};
function setSize(){ const wrap=document.getElementById('plotWrap'); const r=wrap.getBoundingClientRect(); const cssW=Math.max(1, Math.floor(r.width)); const cssH=Math.max(1, Math.floor(canvas.clientHeight || r.height || 360)); W=cssW; H=cssH; if(canvas.width!==Math.floor(W*DPR)||canvas.height!==Math.floor(H*DPR)){ canvas.width=Math.floor(W*DPR); canvas.height=Math.floor(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0); } draw(); }
window.addEventListener('resize', setSize);
if(window.ResizeObserver){ try{ const ro=new ResizeObserver(()=>setSize()); ro.observe(document.getElementById('plotWrap')); }catch(e){} }
function x2p(x){ return (x-world.xmin)/(world.xmax-world.xmin)*W; } function y2p(y){ return H-(y-world.ymin)/(world.ymax-world.ymin)*H; }
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
function sampleY(f,x){ const y=f(x); return Number.isFinite(y)?y:null; }
function drawFunction(f){ ctx.lineWidth=3; ctx.strokeStyle='#60a5fa'; ctx.beginPath(); const n=1000; const step=(world.xmax-world.xmin)/n; let penUp=true; for(let i=0;i<=n;i++){ const x=world.xmin+i*step; const y=sampleY(f,x); if(y===null){ penUp=true; continue; } const px=x2p(x), py=y2p(y); if(penUp){ ctx.moveTo(px,py); penUp=false; } else { ctx.lineTo(px,py); } } ctx.stroke(); }
function clear(){ ctx.clearRect(0,0,W,H); } function draw(){ clear(); drawGrid(); if(currentF) drawFunction(currentF); }
// Pan/zoom
let dragging=false,lastX=0,lastY=0; canvas.addEventListener('mousedown',e=>{dragging=true; lastX=e.clientX; lastY=e.clientY;}); window.addEventListener('mouseup',()=>dragging=false); window.addEventListener('mousemove',e=>{ if(!dragging)return; const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; const sx=(world.xmax-world.xmin)/W, sy=(world.ymax-world.ymin)/H; world.xmin-=dx*sx; world.xmax-=dx*sx; world.ymin+=dy*sy; world.ymax+=dy*sy; draw(); }); canvas.addEventListener('wheel',e=>{ e.preventDefault(); const zoom=Math.exp(-e.deltaY*0.0015); const mx=e.offsetX,my=e.offsetY; const x0=world.xmin+(mx/W)*(world.xmax-world.xmin); const y0=world.ymin+((H-my)/H)*(world.ymax-world.ymin); const nx=(world.xmax-world.xmin)*zoom; const ny=(world.ymax-world.ymin)*zoom; world.xmin=x0-(mx/W)*nx; world.xmax=world.xmin+nx; world.ymin=y0-((H-my)/H)*ny; world.ymax=world.ymin+ny; draw(); },{passive:false});

// ===== parser f(x) =====
function compileExpr(src){
  const map = { 'sin':'Math.sin','cos':'Math.cos','tan':'Math.tan','sqrt':'Math.sqrt','abs':'Math.abs','log':'Math.log','ln':'Math.log','exp':'Math.exp','pow':'Math.pow','min':'Math.min','max':'Math.max','pi':'Math.PI','e':'Math.E' };
  src = src.trim();
  for (const k in map){ const re = new RegExp("\\\\b"+k+"\\\\b","gi"); src = src.replace(re, map[k]); }
  if (!/^[0-9+\-*/^()., xMathEPIsincotaqrlgmdwx]+$/i.test(src.replace(/\s+/g,''))) { throw new Error("Carácter no permitido en la expresión."); }
  src = src.replace(/\^/g, "**");
  try{ const fn = new Function("x", "return ("+src+");"); void fn(0); return fn; }catch(e){ throw new Error("Expresión inválida."); }
}
// ===== límites numéricos =====
function robustMean(arr){ if(!arr||!arr.length) return NaN; const s=[...arr].sort((a,b)=>a-b); const cut=Math.floor(s.length*0.2); const core=s.slice(cut,s.length-cut); if(!core.length) return NaN; return core.reduce((p,c)=>p+c,0)/core.length; }
function estOne(f,a,side='left',steps=12){ const vals=[]; for(let k=1;k<=steps;k++){ const h=Math.pow(10,-k); const x = side==='left'? a-h: a+h; let y; try{ y = f(x);}catch{ y = NaN;} if(Number.isFinite(y)) vals.push(y);} return robustMean(vals); }
function expectedForF(f,a){ const L=estOne(f,a,'left',12); const R=estOne(f,a,'right',12); let T='DNE'; if(Number.isFinite(L)&&Number.isFinite(R)&&Math.abs(L-R)<1e-4) T=(L+R)/2; else if(L===Infinity&&R===Infinity) T=Infinity; else if(L===-Infinity&&R===-Infinity) T=-Infinity; let V; try{ V=f(a);}catch{ V=NaN;} return {L,R,T,V}; }
const fmt=(v)=>{ if(v==='DNE')return 'DNE'; if(!isFinite(v)) return v>0?'+∞':'−∞'; if(Math.abs(v)<1e-9) return '0'; return (Math.abs(v)>=1e6||Math.abs(v)<1e-4)? v.toExponential(6): (''+Number(v.toFixed(8))).replace(/0+$/,'').replace(/\.$/,''); }

// ===== UI calculadora =====
let currentF = null;
function drawForF(f, range=[-6,6]){
  const xs=range; let ys=[]; const n=600; const step=(xs[1]-xs[0])/n;
  for(let i=0;i<=n;i++){ const x=xs[0]+i*step; let y; try{ y=f(x);}catch{ y=NaN;} if(Number.isFinite(y)) ys.push(y); }
  let yMin=ys.length?Math.min(...ys):-5, yMax=ys.length?Math.max(...ys):5; const pad=(yMax-yMin)*0.12||1; yMin-=pad; yMax+=pad;
  world={xmin:xs[0],xmax:xs[1],ymin:yMin,ymax:yMax}; currentF=f; setSize();
}
function run(){
  const fx = document.getElementById('fx').value;
  const a = parseFloat(document.getElementById('a').value);
  const out = document.getElementById('out'); const info = document.getElementById('info');
  try{
    const f = compileExpr(fx);
    drawForF(f, [-6,6]);
    const ex = expectedForF(f,a);
    out.innerHTML = `<span class="pill ok">Resultado</span> L=${fmt(ex.L)} · R=${fmt(ex.R)} · lim=${fmt(ex.T)} · f(a)=${fmt(ex.V)}`;
    info.innerHTML = `<tr><td><b>Función</b></td><td><code>${fx}</code></td></tr><tr><td><b>Punto a</b></td><td>${a}</td></tr>`;
  }catch(e){
    out.innerHTML = `<span class="pill err">Error</span> ${e.message}`;
  }
}
document.getElementById('btnRun').addEventListener('click', run);
document.getElementById('btnClear').addEventListener('click', ()=>{ document.getElementById('fx').value=''; document.getElementById('a').value=''; document.getElementById('out').innerHTML=''; document.getElementById('info').innerHTML=''; currentF=null; draw(); });
(function whenReady(){ const wrap=document.getElementById('plotWrap'); const w=wrap.getBoundingClientRect().width; if(w>10){ draw(); } else { requestAnimationFrame(whenReady); } })();
