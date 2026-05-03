// ======== THREE.JS 3D SCENE ========
const canvas = document.getElementById('bg');
const W = window.innerWidth, H = window.innerHeight;
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(W,H);
renderer.setClearColor(0x050510,1);

const scene3 = new THREE.Scene();
scene3.fog = new THREE.FogExp2(0x050510, 0.005);

const cam = new THREE.PerspectiveCamera(72, W/H, 0.1, 1000);
cam.position.set(0,0,130);

// ---- PARTICLES (purple/cyan) ----
const N = 4500;
const pos = new Float32Array(N*3);
const col = new Float32Array(N*3);
const C1 = new THREE.Color(0x7C3AED); // purple
const C2 = new THREE.Color(0x06B6D4); // cyan
const C3 = new THREE.Color(0xffffff); // white

for(let i=0;i<N;i++){
  const i3=i*3;
  const angle = Math.random()*Math.PI*2;
  const r = 12 + Math.pow(Math.random(),.4)*95;
  const z = (Math.random()-.5)*500;
  pos[i3]   = Math.cos(angle)*r;
  pos[i3+1] = Math.sin(angle)*r;
  pos[i3+2] = z;
  const m = Math.random();
  const c = m<.5?C1:m<.78?C2:C3;
  const b = .2+Math.random()*.8;
  col[i3]=c.r*b; col[i3+1]=c.g*b; col[i3+2]=c.b*b;
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
pGeo.setAttribute('color', new THREE.BufferAttribute(col,3));
const pMat = new THREE.PointsMaterial({
  size:.5, vertexColors:true,
  transparent:true, opacity:.88,
  blending:THREE.AdditiveBlending,
  depthWrite:false, sizeAttenuation:true
});
scene3.add(new THREE.Points(pGeo,pMat));

// ---- NEURAL LINES ----
const nodes = [];
for(let i=0;i<280;i++) nodes.push(Math.floor(Math.random()*N));
const lp=[];
for(let i=0;i<nodes.length;i++){
  const ai=nodes[i]*3;
  const ax=pos[ai],ay=pos[ai+1],az=pos[ai+2];
  for(let j=i+1;j<nodes.length;j++){
    if(lp.length>8000) break;
    const bi=nodes[j]*3;
    const dx=pos[bi]-ax,dy=pos[bi+1]-ay,dz=pos[bi+2]-az;
    const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(d<36) lp.push(ax,ay,az,pos[bi],pos[bi+1],pos[bi+2]);
  }
}
if(lp.length){
  const lGeo=new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp),3));
  const lMat=new THREE.LineBasicMaterial({
    color:0x7C3AED, transparent:true, opacity:.08,
    blending:THREE.AdditiveBlending, depthWrite:false
  });
  scene3.add(new THREE.LineSegments(lGeo,lMat));
}

// ---- GLOW ORBS ----
[[0,0,50],[-20,8,-30],[12,-8,-100],[-5,15,-180],[0,0,-280]].forEach(([x,y,z])=>{
  const g=new THREE.SphereGeometry(3+Math.random()*5,12,12);
  const m=new THREE.MeshBasicMaterial({
    color:Math.random()>.5?0x7C3AED:0x06B6D4,
    transparent:true,opacity:.04,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  const mesh=new THREE.Mesh(g,m);
  mesh.position.set(x,y,z);
  scene3.add(mesh);
});

// ======== SCROLL SYSTEM ========
gsap.registerPlugin(ScrollTrigger);

let camZ=130, mx=0, my=0;
let statsTriggered=false;

const RANGES=[
  [0,    .13],  // hero
  [.11,  .24],  // problem
  [.22,  .35],  // services
  [.33,  .44],  // stats
  [.42,  .53],  // proof
  [.51,  .64],  // reviews
  [.62,  .77],  // founder
  [.75,  1.0],  // cta
];

const SCENES=[
  document.getElementById('sh'),
  document.getElementById('sp'),
  document.getElementById('svc'),
  document.getElementById('st'),
  document.getElementById('prf'),
  document.getElementById('rev'),
  document.getElementById('fnd'),
  document.getElementById('cta'),
];

const DOTS=document.querySelectorAll('.dd');

function updateScenes(p){
  SCENES.forEach((s,i)=>{
    if(!s)return;
    const [a,b]=RANGES[i];
    let op=0;
    if(p>=a&&p<=b){
      const r=b-a, local=(p-a)/r;
      op=local<.18?local/.18:local>.82?(1-local)/.18:1;
    }
    s.style.opacity=op;
    s.style.pointerEvents=op>.1?'all':'none';

    // 3D scene transform
    const inner = s.querySelector('.scene-3d');
    if(inner && p>=a && p<=b){
      const r=b-a, local=(p-a)/r;
      let tz=0, rx=0;
      if(local<.2){
        const t=local/.2;
        tz = -400*(1-t);
        rx = 4*(1-t);
      } else if(local>.8){
        const t=(local-.8)/.2;
        tz = 150*t;
        rx = -3*t;
      }
      inner.style.transform = `translateZ(${tz}px) rotateX(${rx}deg)`;
    }

    // Toggle active class for element animations
    if(op > 0.3){
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  let active=0;
  RANGES.forEach(([a,b],i)=>{ if(p>=a&&p<=b) active=i; });
  DOTS.forEach((d,i)=>d.classList.toggle('on',i===active));
}

ScrollTrigger.create({
  start:0, end:'max',
  onUpdate(self){
    const p=self.progress;
    camZ = 130 - p*440;
    document.getElementById('prog').style.width=(p*100)+'%';
    updateScenes(p);
    if(!statsTriggered && p>=.33 && p<=.44){
      statsTriggered=true;
      document.querySelectorAll('.sn[data-target]').forEach(countUp);
    }
    if(p<.33||p>.44) statsTriggered=false;
  }
});

function countUp(el){
  const t=parseInt(el.dataset.target);
  const suf=el.dataset.suf||'';
  const dur=1400, s=performance.now();
  (function tick(now){
    const prog=Math.min((now-s)/dur,1);
    const e=1-Math.pow(1-prog,3);
    el.textContent=Math.floor(e*t)+suf;
    if(prog<1) requestAnimationFrame(tick);
  })(s);
}

// ======== MOUSE ========
document.addEventListener('mousemove',e=>{
  mx=(e.clientX/innerWidth-.5)*2;
  my=(e.clientY/innerHeight-.5)*2;
  document.getElementById('cur').style.left=e.clientX+'px';
  document.getElementById('cur').style.top=e.clientY+'px';
  gsap.to('#cur-r',{left:e.clientX,top:e.clientY,duration:.14,ease:'power2.out'});
});

document.querySelectorAll('a,button,.bc').forEach(el=>{
  el.addEventListener('mouseenter',()=>{
    const r=document.getElementById('cur-r');
    r.style.width=r.style.height='56px';
    r.style.borderColor='rgba(139,92,246,.5)';
    r.style.background='rgba(139,92,246,.04)';
  });
  el.addEventListener('mouseleave',()=>{
    const r=document.getElementById('cur-r');
    r.style.width=r.style.height='44px';
    r.style.borderColor='rgba(139,92,246,.2)';
    r.style.background='transparent';
  });
});

// Bento card glow
document.querySelectorAll('.bc').forEach(c=>{
  c.addEventListener('mousemove',e=>{
    const r=c.getBoundingClientRect();
    c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
    c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
  });
});

// ======== CARD CLICK MODAL ========
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

document.querySelectorAll('.bc[data-title]').forEach(card=>{
  card.addEventListener('click',()=>{
    document.getElementById('modalIcon').textContent = card.dataset.icon || '';
    document.getElementById('modalTitle').textContent = card.dataset.title || '';
    document.getElementById('modalDesc').textContent = card.dataset.desc || '';
    const feats = document.getElementById('modalFeatures');
    feats.innerHTML = '';
    try {
      const list = JSON.parse(card.dataset.features || '[]');
      list.forEach(f=>{
        const li = document.createElement('li');
        li.textContent = f;
        feats.appendChild(li);
      });
    } catch(e){}
    modal.classList.add('open');
  });
});

modalClose.addEventListener('click',()=> modal.classList.remove('open'));
modal.addEventListener('click',(e)=>{
  if(e.target===modal) modal.classList.remove('open');
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') modal.classList.remove('open');
});

// Case study tilt
const tc=document.getElementById('tcard');
if(tc){
  tc.addEventListener('mousemove',e=>{
    const r=tc.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    gsap.to(tc,{rotationY:x*10,rotationX:-y*10,duration:.3,ease:'power2.out',transformPerspective:900});
  });
  tc.addEventListener('mouseleave',()=>{
    gsap.to(tc,{rotationY:0,rotationX:0,duration:.5});
  });
}

// ======== RENDER LOOP ========
const clock=new THREE.Clock();
const pts=scene3.children.find(c=>c instanceof THREE.Points);

function render(){
  requestAnimationFrame(render);
  const t=clock.getElapsedTime();
  cam.position.z+=(camZ-cam.position.z)*.05;
  cam.position.x+=(mx*7-cam.position.x)*.04;
  cam.position.y+=(-my*4-cam.position.y)*.04;
  cam.lookAt(cam.position.x*.4, cam.position.y*.4, cam.position.z-60);
  if(pts) pts.rotation.z=t*.006;
  renderer.render(scene3,cam);
}
render();

window.addEventListener('resize',()=>{
  cam.aspect=innerWidth/innerHeight;
  cam.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

// ======== INTRO ========
const intro=document.getElementById('intro');
const ibar=document.getElementById('ibar');
const ilogo=document.querySelector('.i-logo');
const itxt=document.querySelector('.i-txt');

gsap.set(SCENES[0],{opacity:1});

const itl=gsap.timeline();
itl
  .to(ilogo,{opacity:1,duration:.5,ease:'power2.out'})
  .to(itxt,{opacity:1,duration:.4},'-=.1')
  .call(()=>{ setTimeout(()=>ibar.style.width='220px',50); })
  .to([ilogo,itxt],{opacity:0,duration:.4,delay:.9})
  .to(intro,{opacity:0,duration:.7,ease:'power2.inOut'},'-=.2')
  .set(intro,{display:'none'})
  .call(()=>{
    SCENES[0].classList.add('active');
  });

