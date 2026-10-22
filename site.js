(() => {
'use strict';
const REPO = 'nathanhart06-ops/primal-releases';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ───────── live download button: always the newest installer, with its version and size ─────────
fetch(`https://api.github.com/repos/${REPO}/releases/latest`).then(r => (r.ok ? r.json() : null)).then(rel => {
  if (!rel) return;
  const a = (rel.assets || []).find(x => /^Primal-Setup-[\d.]+\.exe$/.test(x.name));
  const v = String(rel.tag_name || '').replace(/^v/, '');
  if (a) document.querySelectorAll('.dl-link').forEach(el => { el.href = a.browser_download_url; });
  if (v) {
    const mb = a ? ` · ${Math.round(a.size / 1048576)} MB` : '';
    document.querySelectorAll('.dl-meta').forEach(el => { el.textContent = `Version ${v} · Windows 10 & 11${mb}`; });
    document.querySelectorAll('.ver').forEach(el => { el.textContent = 'v' + v; });
  }
  const notes = document.querySelector('.notes-link');
  if (notes && rel.html_url) notes.href = rel.html_url;
}).catch(() => {});

// ───────── nav shadow on scroll ─────────
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ───────── reveal on scroll + count-up numbers ─────────
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    io.unobserve(e.target);
    const n = e.target.querySelector('[data-count]');
    if (n) countUp(n);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  // Stagger siblings that enter together.
  const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6) * 0.07 + 's');
  io.observe(el);
});
function countUp(el) {
  const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
  if (reduce) { el.textContent = target.toLocaleString() + suffix; return; }
  const t0 = performance.now(), dur = 1600;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(target * e).toLocaleString() + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ───────── 3D tilt on the hero screenshot ─────────
const tilt = document.getElementById('tilt');
if (tilt && !reduce && matchMedia('(pointer: fine)').matches) {
  const win = tilt.querySelector('.window');
  tilt.addEventListener('mousemove', e => {
    const r = tilt.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    win.style.transform = `rotateY(${-9 + x * 10}deg) rotateX(${5 - y * 8}deg)`;
  });
  tilt.addEventListener('mouseleave', () => { win.style.transform = ''; });
}

// ───────── spotlight on feature cards ─────────
document.querySelectorAll('.card').forEach(c => c.addEventListener('mousemove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', `${e.clientX - r.left}px`);
  c.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

// ───────── tour tabs (auto-advance until someone picks one) ─────────
const tabs = [...document.querySelectorAll('.tabs button')];
const img = document.getElementById('tourImg'), cap = document.getElementById('tourCap');
let auto = !reduce, tourTimer = null;
tabs.forEach(t => { const p = new Image(); p.src = `assets/${t.dataset.shot}.jpg`; });
function show(btn) {
  tabs.forEach(t => t.classList.toggle('on', t === btn));
  img.classList.add('out');
  setTimeout(() => {
    img.src = `assets/${btn.dataset.shot}.jpg`;
    img.alt = 'Primal ' + btn.textContent;
    cap.textContent = btn.dataset.cap;
    img.onload = () => img.classList.remove('out');
    if (img.complete) img.classList.remove('out');
  }, 220);
}
tabs.forEach(t => t.addEventListener('click', () => { auto = false; clearInterval(tourTimer); show(t); }));
const tourIO = new IntersectionObserver(([e]) => {
  clearInterval(tourTimer);
  if (e.isIntersecting && auto) tourTimer = setInterval(() => { const i = tabs.findIndex(t => t.classList.contains('on')); show(tabs[(i + 1) % tabs.length]); }, 4200);
}, { threshold: 0.4 });
const stage = document.querySelector('.stage');
if (stage) tourIO.observe(stage);

// ───────── aurora background (the same shader as the app) ─────────
const cv = document.getElementById('bg');
const gl = cv && cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
if (!gl) { if (cv) cv.style.background = 'radial-gradient(80% 60% at 70% 10%, #2a1650, #07070c)'; return; }
const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const fs = `precision highp float;
uniform vec2 r;uniform float t;uniform vec3 c1;uniform vec3 c2;uniform vec2 m;uniform float sy;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*n(p);p=R*p*2.03;a*=.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;p.y+=sy;float tt=t*.035;
 vec2 q=vec2(fbm(p*1.5+tt),fbm(p*1.5-tt+3.1));
 vec2 w=vec2(fbm(p*1.1+q*1.9+vec2(1.7,9.2)+tt*1.3),fbm(p*1.1+q*1.9+vec2(8.3,2.8)-tt));
 float f=fbm(p*1.3+w*2.2);vec3 col=vec3(.012,.012,.02);
 col+=c1*pow(smoothstep(.3,1.,f),2.)*.75;col+=c2*pow(w.y,3.2)*.5;col+=mix(c1,c2,.5)*pow(q.x,6.)*.35;
 float md=length(p-m);col+=c1*.09/(1.+md*md*7.);
 col*=mix(.25,1.,smoothstep(1.25,.15,length((uv-vec2(.55,.75))*vec2(1.,1.3))));
 col+=(h(gl_FragCoord.xy+fract(t))-.5)/200.;gl_FragColor=vec4(col,1.);}`;
const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
const pr = gl.createProgram();
gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = k => gl.getUniformLocation(pr, k);
const u = { r: U('r'), t: U('t'), c1: U('c1'), c2: U('c2'), m: U('m'), sy: U('sy') };
const resize = () => { cv.width = Math.round(innerWidth * 0.5); cv.height = Math.round(innerHeight * 0.5); gl.viewport(0, 0, cv.width, cv.height); };
addEventListener('resize', resize); resize();
let mouse = [0.3, 0.2], mt = mouse.slice(), time = 40, last = performance.now(), lastDraw = 0;
addEventListener('mousemove', e => { mt = [(e.clientX - innerWidth / 2) / innerHeight, (innerHeight / 2 - e.clientY) / innerHeight]; }, { passive: true });
// Colour shifts from violet to pink as you scroll down the page.
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || now - lastDraw < 1000 / 40) return;
  const dt = Math.min(0.1, (now - last) / 1000); last = now; lastDraw = now;
  if (!reduce) time += dt;
  mouse = lerp(mouse, mt, 0.05);
  const k = Math.min(1, scrollY / Math.max(1, document.body.scrollHeight - innerHeight));
  const c1 = lerp([0.545, 0.36, 0.965], [0.925, 0.28, 0.6], k), c2 = lerp([0.93, 0.28, 0.6], [0.3, 0.55, 1], k);
  gl.uniform2f(u.r, cv.width, cv.height); gl.uniform1f(u.t, time); gl.uniform3fv(u.c1, c1); gl.uniform3fv(u.c2, c2);
  gl.uniform2f(u.m, mouse[0], mouse[1]); gl.uniform1f(u.sy, scrollY / innerHeight * 0.15);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
requestAnimationFrame(frame);
})();

// Screenshot helper: ?shot=<section id> jumps straight to a section with everything visible.
(() => {
  const id = new URLSearchParams(location.search).get('shot');
  if (!id) return;
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelectorAll('.reveal').forEach(el => { el.classList.add('in'); el.style.transition = 'none'; });
  const go = () => { const el = document.getElementById(id); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - 90); };
  go(); addEventListener('load', go);
})();
