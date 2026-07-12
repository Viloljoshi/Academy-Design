/* FX Academy, shared helpers: SVG charts (lime gradients), toasts, utils */
(function (w) {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in (a||{})) e.setAttribute(k, a[k]); return e; };

  function uid(p){ return p + Math.random().toString(36).slice(2,8); }

  // ---- Area / line chart ----
  // opts: {data:[..], width, height, color, fill(bool), pad, dark}
  function areaChart(mount, opts){
    const o = Object.assign({width:mount.clientWidth||520, height:160, color:'#a8d642', fill:true, pad:6, smooth:true, dark:false, axis:false}, opts);
    const data = o.data; const W=o.width, H=o.height, P=o.pad;
    const max = Math.max(...data), min = Math.min(...data);
    const rng = (max-min)||1;
    const sx = (W-P*2)/(data.length-1);
    const sy = (H-P*2)/rng;
    const pts = data.map((d,i)=>[P+i*sx, H-P-(d-min)*sy]);
    let path = '';
    if(o.smooth){
      path = `M${pts[0][0]},${pts[0][1]}`;
      for(let i=1;i<pts.length;i++){
        const [x0,y0]=pts[i-1],[x1,y1]=pts[i];
        const cx=(x0+x1)/2; path+=` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
      }
    } else { path = 'M'+pts.map(p=>p.join(',')).join(' L'); }
    const svg = el('svg',{viewBox:`0 0 ${W} ${H}`, width:'100%', height:H, preserveAspectRatio:'none'});
    const gid = uid('g');
    const defs = el('defs'); const lg = el('linearGradient',{id:gid,x1:0,y1:0,x2:0,y2:1});
    lg.append(el('stop',{offset:'0%','stop-color':o.color,'stop-opacity':o.dark?.55:.45}));
    lg.append(el('stop',{offset:'100%','stop-color':o.color,'stop-opacity':0}));
    defs.append(lg); svg.append(defs);
    if(o.fill){ const area = el('path',{d:`${path} L${pts[pts.length-1][0]},${H-P} L${pts[0][0]},${H-P} Z`, fill:`url(#${gid})`}); svg.append(area); }
    svg.append(el('path',{d:path, fill:'none', stroke:o.color, 'stroke-width':2.4, 'stroke-linecap':'round','stroke-linejoin':'round'}));
    // last dot
    const last = pts[pts.length-1];
    svg.append(el('circle',{cx:last[0], cy:last[1], r:3.5, fill:o.color, stroke:o.dark?'#0a1410':'#fff','stroke-width':2}));
    mount.innerHTML=''; mount.append(svg);
  }

  // ---- Sparkline (tiny) ----
  function spark(mount, data, color){
    areaChart(mount,{data, height: mount.clientHeight||44, color:color||'#a8d642', fill:true, pad:3, dark:true});
  }

  // ---- Bar chart ----
  // opts:{data:[{label,value,color?}], height, dark, max}
  function barChart(mount, opts){
    const o = Object.assign({width:mount.clientWidth||520, height:200, dark:false, color:'#a8d642'}, opts);
    const data=o.data; const W=o.width,H=o.height; const P=24; const gap=10;
    const max = o.max || Math.max(...data.map(d=>d.value))*1.1;
    const bw = (W - P*2 - gap*(data.length-1))/data.length;
    const svg = el('svg',{viewBox:`0 0 ${W} ${H}`, width:'100%', height:H});
    data.forEach((d,i)=>{
      const h = (d.value/max)*(H-P-18);
      const x = P + i*(bw+gap); const y = H-18-h;
      svg.append(el('rect',{x, y, width:bw, height:Math.max(h,2), rx:5, fill:d.color||o.color, opacity:d.dim?0.45:1}));
      const t = el('text',{x:x+bw/2, y:H-4, 'text-anchor':'middle', 'font-size':11, fill:o.dark?'#a9bcae':'#727971','font-family':'Manrope'}); t.textContent=d.label; svg.append(t);
    });
    mount.innerHTML=''; mount.append(svg);
  }

  // ---- Donut ----
  // opts:{segments:[{value,color,label}], size, thickness, center}
  function donut(mount, opts){
    const o=Object.assign({size:160, thickness:22, dark:false}, opts);
    const S=o.size, R=S/2, r=R-o.thickness/2; const cx=R, cy=R;
    const total=o.segments.reduce((a,s)=>a+s.value,0)||1;
    const svg=el('svg',{viewBox:`0 0 ${S} ${S}`, width:S, height:S});
    svg.append(el('circle',{cx,cy,r,fill:'none',stroke:o.dark?'rgba(255,255,255,.08)':'#e7e9e4','stroke-width':o.thickness}));
    let off=0; const C=2*Math.PI*r;
    o.segments.forEach(s=>{
      const len=(s.value/total)*C;
      const c=el('circle',{cx,cy,r,fill:'none',stroke:s.color,'stroke-width':o.thickness,
        'stroke-dasharray':`${len} ${C-len}`,'stroke-dashoffset':-off,'stroke-linecap':'butt',
        transform:`rotate(-90 ${cx} ${cy})`});
      svg.append(c); off+=len;
    });
    if(o.center){ const t=el('text',{x:cx,y:cy+1,'text-anchor':'middle','dominant-baseline':'middle','font-size':o.centerSize||26,'font-weight':700,'font-family':'Hanken Grotesk, sans-serif',fill:o.dark?'#eef3ec':'#191c1a'}); t.textContent=o.center; svg.append(t);
      if(o.centerSub){ const s2=el('text',{x:cx,y:cy+18,'text-anchor':'middle','font-size':11,'font-family':'Manrope',fill:o.dark?'#a9bcae':'#727971'}); s2.textContent=o.centerSub; svg.append(s2);} }
    mount.innerHTML=''; mount.append(svg);
  }

  // ---- Toast ----
  function toast(msg, kind){
    let host=document.getElementById('toast-host');
    if(!host){ host=document.createElement('div'); host.id='toast-host';
      host.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;align-items:center;'; document.body.append(host); }
    const t=document.createElement('div');
    const bg = kind==='neg' ? '#ba1a1a' : kind==='warn' ? '#8a5a06' : '#0f3218';
    t.style.cssText=`background:${bg};color:#fff;padding:12px 18px;border-radius:9999px;font:600 14px Manrope;box-shadow:0 8px 28px rgba(0,0,0,.25);display:flex;align-items:center;gap:9px;opacity:0;transform:translateY(8px);transition:.25s;`;
    t.innerHTML = (kind!=='neg'?'<span style="width:7px;height:7px;border-radius:50%;background:#c3f35c"></span>':'') + msg;
    host.append(t); requestAnimationFrame(()=>{t.style.opacity=1;t.style.transform='none';});
    setTimeout(()=>{t.style.opacity=0;t.style.transform='translateY(8px)';setTimeout(()=>t.remove(),300);}, kind==='neg'?3200:2200);
  }

  function copy(text, ok){ navigator.clipboard?.writeText(text).then(()=>toast(ok||'Copied to clipboard')).catch(()=>toast('Copy failed','neg')); }

  // ---- Scroll reveal (v3 — per-element, flash-free, background-load safe) ----
  function initReveal(){
    var io = null;
    function reveal(el){ var d=+el.dataset.revealDelay||0; if(d) setTimeout(function(){el.classList.add('in');}, d); else el.classList.add('in'); }
    function process(){
      if(document.visibilityState !== 'visible') return;   // only animate a visible page
      var vh = window.innerHeight || 800;
      var els = [].slice.call(document.querySelectorAll('.reveal, .reveal-stagger, .reveal-fade, .reveal-words, .reveal-letters'))
                  .filter(function(e){ return !e.classList.contains('armed') && !e.classList.contains('in'); });
      if(!els.length) return;
      if('IntersectionObserver' in window && !io){
        io = new IntersectionObserver(function(ents){ ents.forEach(function(en){ if(en.isIntersecting){ reveal(en.target); io.unobserve(en.target); } }); }, {rootMargin:'0px 0px -8% 0px', threshold:0.05});
      }
      els.forEach(function(e){
        var top = e.getBoundingClientRect().top;
        if(e.hasAttribute('data-reveal-now')){            // explicit load-in (above the fold)
          e.classList.add('armed'); requestAnimationFrame(function(){ requestAnimationFrame(function(){ reveal(e); }); });
        } else if(top > vh*0.80){                          // below the fold → animate on scroll
          e.classList.add('armed'); if(io) io.observe(e); else reveal(e);
        }                                                  // already visible above the fold → leave static (no flash)
      });
    }
    initReveal._process = process;
    process();
    // If the page first loaded hidden (background tab), arm once it becomes visible.
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='visible') process(); });
  }
  function rescanReveal(){ if(initReveal._process) initReveal._process(); else initReveal(); }

  // ---- Animate an areaChart line drawing itself in ----
  function drawChart(mount){
    try{
      var path = mount.querySelector('path[stroke]');
      if(!path) return;
      var len = path.getTotalLength();
      path.style.setProperty('--len', len);
      path.classList.add('draw-line');
    }catch(e){}
  }

  const REDUCE = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Animated candlestick engine (v4) ----
  // Procedural OHLC walk → SVG candles that grow in staggered, then go LIVE:
  // the last candle breathes with a tracking price line + pulsing dot.
  // opts:{count, height, live, animate, bull, bear, seed}
  function candles(mount, opts){
    if(!mount) return;
    const o = Object.assign({count:26, width:mount.clientWidth||560, height:mount.clientHeight||220,
      live:false, animate:true, bull:'#a8d642', bear:'#e06a5e', seed:7, pad:8}, opts);
    const W=o.width, H=o.height, P=o.pad, N=o.count;
    let s = o.seed;
    const rnd = () => { s = (s*16807)%2147483647; return (s-1)/2147483646; };
    // random walk with mild uptrend
    const data = []; let v = 50;
    for(let i=0;i<N;i++){
      const open = v, drift = (rnd()-.44)*7;
      const close = open + drift;
      const hi = Math.max(open,close) + rnd()*3.2;
      const lo = Math.min(open,close) - rnd()*3.2;
      data.push({open,close,hi,lo}); v = close;
    }
    const vals = data.flatMap(c=>[c.hi,c.lo]);
    const min = Math.min(...vals), max = Math.max(...vals), rng = (max-min)||1;
    const y = (p)=> P + (max-p)/rng*(H-P*2);
    const bw = (W-P*2)/N, body = Math.max(3, bw*.55);
    const svg = el('svg',{viewBox:`0 0 ${W} ${H}`, width:'100%', height:'100%', preserveAspectRatio:'none', class:'candles'});
    const anim = o.animate && !REDUCE() && document.visibilityState==='visible';
    data.forEach((c,i)=>{
      const cx = P + i*bw + bw/2;
      const up = c.close>=c.open;
      const col = up?o.bull:o.bear;
      const g = el('g',{class: anim?'cndl':'', style: anim?`--d:${i*38}ms`:''});
      g.append(el('line',{x1:cx,x2:cx,y1:y(c.hi),y2:y(c.lo),stroke:col,'stroke-width':1.2,opacity:.7}));
      const top = y(Math.max(c.open,c.close)), h = Math.max(2, Math.abs(y(c.open)-y(c.close)));
      g.append(el('rect',{x:cx-body/2,y:top,width:body,height:h,rx:1.5,fill:col,opacity:up?1:.92}));
      svg.append(g);
    });
    // tracking price line + pulse dot on last close
    const lastY = y(data[N-1].close);
    const line = el('line',{x1:P,x2:W-P,y1:lastY,y2:lastY,stroke:o.bull,'stroke-width':1,'stroke-dasharray':'3 4',opacity:.5,class:'px-line'});
    const dot = el('circle',{cx:P + (N-1)*bw + bw/2, cy:lastY, r:3.2, fill:o.bull, class: anim?'px-dot':''});
    svg.append(line, dot);
    mount.innerHTML=''; mount.append(svg);

    if(o.live && !REDUCE()){
      let visible = true, base = data[N-1].close;
      if('IntersectionObserver' in window){
        new IntersectionObserver(en=>{visible = en[0].isIntersecting}, {threshold:.1}).observe(mount);
      }
      const g = svg.querySelectorAll('g'); const last = g[g.length-1];
      const rect = last.querySelector('rect'), wick = last.querySelector('line');
      let t = 0;
      setInterval(()=>{
        if(document.hidden || !visible) return;
        t += .9;
        const c = data[N-1];
        c.close = base + Math.sin(t)*1.6 + (rnd()-.5)*2.2;
        c.hi = Math.max(c.hi, c.close); c.lo = Math.min(c.lo, c.close);
        const up = c.close>=c.open, col = up?o.bull:o.bear;
        const top = y(Math.max(c.open,c.close)), h = Math.max(2, Math.abs(y(c.open)-y(c.close)));
        rect.setAttribute('y',top); rect.setAttribute('height',h); rect.setAttribute('fill',col);
        wick.setAttribute('y1',y(c.hi)); wick.setAttribute('y2',y(c.lo)); wick.setAttribute('stroke',col);
        const ly = y(c.close);
        line.setAttribute('y1',ly); line.setAttribute('y2',ly); line.setAttribute('stroke',col);
        dot.setAttribute('cy',ly); dot.setAttribute('fill',col);
      }, 900);
    }
  }

  // ---- Word choreography (v4) ----
  // Splits an element's words into spans with a stagger index, preserving
  // nested markup (e.g. an accent <span>). CSS animates: rise + de-blur.
  function words(eln){
    if(!eln || eln.dataset.split || REDUCE()) return;
    eln.dataset.split = 1;
    let i = 0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.append(document.createTextNode(part)); return; }
            if(/^[,.!?;:—–-]+$/.test(part)){ frag.append(document.createTextNode(part)); return; } // glue bare punctuation
            const w = document.createElement('span');
            w.className='w'; w.style.setProperty('--i', i++); w.textContent = part;
            frag.append(w);
          });
          node.replaceChild(frag, ch);
        } else if(ch.nodeType===1) walk(ch);
      });
    })(eln);
    eln.classList.add('words');
  }

  // ---- Pointer tilt + glare (v4) ----
  // Desktop fine-pointer only. Applies rotateX/Y to `eln`, tracks a glare
  // highlight via --gx/--gy on `glareTarget` (or eln).
  function tilt(eln, opts){
    if(!eln || REDUCE() || !matchMedia('(pointer:fine)').matches) return;
    const o = Object.assign({max:5, scale:1.012}, opts);
    const glare = o.glare || eln;
    let raf = null, rx=0, ry=0, active=false;
    function apply(){ raf=null;
      eln.style.transform = active
        ? `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${o.scale})` : '';
    }
    eln.style.willChange='transform';
    eln.style.transition='transform .55s cubic-bezier(.22,1,.36,1)';
    eln.addEventListener('pointermove', function(e){
      const r = eln.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width, py = (e.clientY-r.top)/r.height;
      ry = (px-.5)*o.max*2; rx = (.5-py)*o.max*2; active=true;
      glare.style.setProperty('--gx', (px*100)+'%');
      glare.style.setProperty('--gy', (py*100)+'%');
      if(!raf) raf = requestAnimationFrame(apply);
    });
    eln.addEventListener('pointerleave', function(){ active=false; rx=ry=0; if(!raf) raf=requestAnimationFrame(apply); });
  }

  // ---- Scroll parallax (v4) ----
  // data-parallax="0.12" → element drifts at that fraction of scroll delta.
  // Transform-only, rAF-throttled, disabled under reduced motion.
  function parallax(scope){
    if(REDUCE()) return;
    const els = [].slice.call((scope||document).querySelectorAll('[data-parallax]'));
    if(!els.length) return;
    let raf = null;
    function frame(){ raf=null;
      const vh = innerHeight;
      els.forEach(function(e){
        const r = e.getBoundingClientRect();
        if(r.bottom<-80 || r.top>vh+80) return;
        const mid = r.top + r.height/2 - vh/2;
        e.style.transform = 'translate3d(0,'+(mid*-parseFloat(e.dataset.parallax)).toFixed(1)+'px,0)';
      });
    }
    addEventListener('scroll', function(){ if(!raf) raf=requestAnimationFrame(frame); }, {passive:true});
    frame();
  }

  // ---- Unify scroll-spy (v3) ----
  // Pins nothing itself (CSS sticky does that); just watches .unify-step
  // elements and switches the matching .unify-panel — one cross-fade per
  // pillar. Skips itself under reduced-motion (CSS shows the static stack).
  function unify(section){
    if(!section || REDUCE()) return;
    var steps = [].slice.call(section.querySelectorAll('.unify-step'));
    var panels = [].slice.call(section.querySelectorAll('.unify-panel'));
    if(!steps.length) return;
    var current = -1;
    function activate(i){
      if(i===current) return; current = i;
      steps.forEach(function(s,j){ s.classList.toggle('active', j===i); });
      panels.forEach(function(p,j){ p.classList.toggle('show', j===i); });
    }
    // Closest-step-to-viewport-center — never goes stale, even on fast
    // scroll flicks or programmatic jumps that skip the trigger band.
    var raf = null, on = true;
    function pick(){
      raf = null;
      var mid = (window.innerHeight||800)*0.5, best = 0, bd = Infinity;
      steps.forEach(function(s,j){
        var r = s.getBoundingClientRect(), c = r.top + r.height/2, d = Math.abs(c - mid);
        if(d < bd){ bd = d; best = j; }
      });
      activate(best);
    }
    if('IntersectionObserver' in window){
      on = false;
      new IntersectionObserver(function(en){ on = en[0].isIntersecting; if(on) pick(); },
        {rootMargin:'25% 0px'}).observe(section);
    }
    addEventListener('scroll', function(){ if(on && !raf) raf = requestAnimationFrame(pick); }, {passive:true});
    activate(0); pick();
  }

  // ---- Letter-split (v5) ----
  // Splits words into per-character spans (words wrapped nowrap so line
  // breaking is preserved). Pairs with .reveal-letters for scroll cascades.
  function letters(eln){
    if(!eln || eln.dataset.split || REDUCE()) return;
    eln.dataset.split = 1;
    var i = 0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType === 3){
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.append(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'lw';
            for(var k = 0; k < part.length; k++){
              var l = document.createElement('span'); l.className = 'l';
              l.style.setProperty('--i', i++); l.textContent = part[k];
              w.appendChild(l);
            }
            frag.append(w);
          });
          node.replaceChild(frag, ch);
        } else if(ch.nodeType === 1) walk(ch);
      });
    })(eln);
    eln.classList.add('reveal-letters');
  }

  // ---- Ambient particles (v5) ----
  // ~30 lime fireflies drifting inside a dark section. Wraps at edges,
  // pauses off-screen and in hidden tabs. Purely decorative.
  function particles(host, opts){
    if(!host || REDUCE() || host.dataset.fxp) return;
    host.dataset.fxp = 1;
    var o = Object.assign({count: 30}, opts);
    var cv = document.createElement('canvas'); cv.className = 'fx-particles';
    var pos = getComputedStyle(host).position;
    if(pos === 'static') host.style.position = 'relative';
    host.prepend(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dots = [], visible = false;
    function size(){
      var d = Math.min(devicePixelRatio || 1, 1.5);
      W = host.clientWidth; H = host.clientHeight;
      cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    size(); addEventListener('resize', size, {passive: true});
    for(var i = 0; i < o.count; i++) dots.push({
      x: Math.random() * 1e4 % 1, y: Math.random() * 1e4 % 1,
      r: .4 + Math.random() * 1.4, a: .06 + Math.random() * .3,
      vx: (Math.random() - .5) * .00022, vy: -.00008 - Math.random() * .00025,
      tw: 2 + Math.random() * 3, ph: Math.random() * 7
    });
    if('IntersectionObserver' in window)
      new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }, {threshold: .02}).observe(host);
    else visible = true;
    (function tick(t){
      requestAnimationFrame(tick);
      if(!visible || document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      dots.forEach(function(p){
        p.x = (p.x + p.vx + 1) % 1; p.y = (p.y + p.vy + 1) % 1;
        var a = p.a * (.55 + .45 * Math.sin(t / (p.tw * 1000) + p.ph));
        ctx.globalAlpha = a;
        ctx.fillStyle = p.r > 1.2 ? '#c3f35c' : '#e9f5d8';
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
    })(0);
  }

  // ---- Custom cursor (v5) ----
  // 6px difference-blend dot tracks instantly; lime ring trails with lerp
  // and swells over interactive elements. Fine pointers only.
  function cursor(){
    if(REDUCE() || !matchMedia('(pointer:fine)').matches || document.querySelector('.fx-dot')) return;
    document.documentElement.classList.add('fx-cursor-on');
    var dot = document.createElement('div'); dot.className = 'fx-dot';
    var ring = document.createElement('div'); ring.className = 'fx-ring';
    document.body.append(dot, ring);
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    var DARK = '.dark-deep,.dark-sec,.hero,.wb-live-card,.tk-card.dark,.unify-sec,footer,.welcome,.pubnav.float';
    addEventListener('pointermove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      var t = e.target.closest && e.target.closest('a,button,select,summary,input,.card-hover,.fx-ch');
      ring.classList.toggle('hot', !!t);
      // adapt ring ink to the surface underneath: lime on dark, forest on light
      ring.classList.toggle('dark', !!(e.target.closest && e.target.closest(DARK)));
    }, {passive: true});
    (function tick(){
      requestAnimationFrame(tick);
      rx += (mx - rx) * .16; ry += (my - ry) * .16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
    })();
  }

  // ---- Auto-motion for marketing pages (v4) ----
  // Every public page gets the house choreography for free: word-by-word
  // headline reveal, a breathing aurora in the dark hero, and staggered
  // section reveals. Member app pages (.app) stay quiet. Idempotent.
  function autoMotion(){
    if(document.querySelector('.app')) return;
    var reduce = REDUCE();
    var h1 = document.querySelector('h1');
    if(h1) words(h1);
    var hero = document.querySelector('.dark-deep');
    if(hero){
      if(!hero.querySelector('.aurora') && !hero.querySelector('.hero-pin')){
        var a = document.createElement('div'); a.className = 'aurora';
        hero.prepend(a);
      }
      // Staggered hero entrance: everything around the headline rises in
      // sequence (the headline itself is handled by the word choreography).
      if(!reduce && !hero.dataset.choreo){
        hero.dataset.choreo = 1;
        var scope = hero.querySelector('.wrap') || hero, d = 80;
        function rise(el){ el.style.animation = 'riseIn .8s cubic-bezier(.22,1,.36,1) ' + (d += 130) + 'ms both'; }
        // Walk toward the headline through any nesting, animating every
        // sibling along the path — the h1 itself is left to the word reveal.
        (function choreo(container){
          [].slice.call(container.children).forEach(function(c){
            if(/aurora|mesh|glow|hero-media|hero-scrim|hero-spot/.test(c.className)) return;
            if(c === h1) return;
            if(h1 && c.contains(h1)) choreo(c);
            else rise(c);
          });
        })(scope);
      }
    }
    // Grids cascade child-by-child as they enter the viewport
    document.querySelectorAll('.section .grid, .tier-strip, .tk-bento, .plans, .wb-grid, .feat4, .faq')
      .forEach(function(g){ g.classList.add('reveal-stagger'); });
    document.querySelectorAll('.section > .wrap').forEach(function(w){ w.classList.add('reveal'); });

    // ---- Luxury layer (v5): grain, cursor, particles, letter cascades ----
    if(!document.querySelector('.fx-grain')){
      var grain = document.createElement('div'); grain.className = 'fx-grain';
      grain.setAttribute('aria-hidden', 'true');
      document.body.appendChild(grain);
    }
    cursor();
    // fireflies in every dark section except the hero film
    document.querySelectorAll('.dark-deep, .dark-sec').forEach(function(sec){
      if(sec.querySelector('.hero-pin') || sec.tagName === 'FOOTER') return;
      particles(sec, {count: Math.min(34, Math.max(16, Math.round(sec.offsetHeight / 26)))});
    });
    // section statement headers cascade letter-by-letter (h1s keep word reveal)
    document.querySelectorAll('.section h2.h-lg, .section h2.h-md, .section h2.display, .unify-sec .h-lg').forEach(function(hd){
      if(h1 && (hd === h1 || hd.contains(h1) || (h1.contains && h1.contains(hd)))) return;
      hd.classList.remove('reveal-words');
      letters(hd);
    });
    rescanReveal();
  }

  if(document.readyState !== 'loading') setTimeout(function(){ initReveal(); autoMotion(); },0);
  else document.addEventListener('DOMContentLoaded', function(){ initReveal(); autoMotion(); });

  w.FX = { areaChart, spark, barChart, donut, toast, copy, initReveal, rescanReveal, drawChart, unify,
           candles, words, tilt, parallax, letters, particles, cursor };
})(window);
