/* ===========================================================================
   RÉPLICA — maximiliankaspar.com
   Todos los efectos, reescritos sin Webflow.
   =========================================================================== */

gsap.registerPlugin(Flip, ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------
   1. SCROLL CON INERCIA (Lenis)
   El scroll no es el del navegador: tiene peso y desaceleración.
--------------------------------------------------------------------------- */
const lenis = new Lenis({ autoRaf: true });
window.lenis = lenis;
lenis.on('scroll', ScrollTrigger.update);

/* ---------------------------------------------------------------------------
   2. PAPEL MILIMETRADO
   Hairlines cada 10px, generadas según el tamaño de la ventana.
--------------------------------------------------------------------------- */
function buildPixelGrid() {
  const gap = 10;
  const h = document.querySelector('.bg-flex-horizontal');
  const v = document.querySelector('.bg-flex-vertical');
  if (!h || !v) return;

  h.innerHTML = '';
  v.innerHTML = '';

  const cols = Math.floor(window.innerWidth / gap);
  const rows = Math.floor(window.innerHeight / gap);

  for (let i = 0; i < cols; i++) {
    const line = document.createElement('div');
    line.className = 'line-horizontal';
    h.appendChild(line);
  }
  for (let i = 0; i < rows; i++) {
    const line = document.createElement('div');
    line.className = 'line-vertical';
    v.appendChild(line);
  }
}

/* ---------------------------------------------------------------------------
   3. EL TITULAR SE CALCULA A SÍ MISMO
   Crece hasta llenar el ancho disponible y el 40% del alto del hero.
--------------------------------------------------------------------------- */
function fitHeadline(selector, heightRatioDesktop = 0.4, heightRatioMobile = 0.37) {
  const el = document.querySelector(selector);
  if (!el) return;

  function resize() {
    const container = el.parentElement;
    const targetWidth = container.clientWidth - 10;
    const isMobile = window.innerWidth < 768;
    const targetHeight = container.offsetHeight * (isMobile ? heightRatioMobile : heightRatioDesktop);

    // Búsqueda binaria: mismo resultado que el bucle de +1px del original,
    // pero sin 300 reflows por resize.
    let lo = 10;
    let hi = 500;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      el.style.fontSize = mid + 'px';
      if (el.scrollWidth <= targetWidth && el.scrollHeight <= targetHeight) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    el.style.fontSize = lo + 'px';
  }

  resize();
  window.addEventListener('resize', resize);

  // Hay que volver a medir cuando la tipografía web terminó de cargar:
  // con la de reserva el texto ocupa menos y el cálculo queda pasado de tamaño.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resize);
  }
}

/* ---------------------------------------------------------------------------
   4. "scroll down" PERSIGUE AL CURSOR
   Aparece letra por letra (30ms), sigue al mouse con mucho retraso
   (factor 0.05 → flota, nunca lo alcanza) y se va para siempre al scrollear.
--------------------------------------------------------------------------- */
function initCursorTag() {
  const tag = document.querySelector('.scroll-down-tag');
  const navbar = document.querySelector('.navbar');
  if (!tag) return;

  const STAGGER = 30;
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasScrolled = false;
  let hasInitialized = false;
  let isAnimating = false;

  // Cada letra en su propio span, para poder escalonarlas
  const text = tag.textContent;
  tag.innerHTML = text
    .split('')
    .map((c) => `<span style="display:inline-block;opacity:0">${c === ' ' ? '&nbsp;' : c}</span>`)
    .join('');
  const letters = tag.querySelectorAll('span');

  const revealForward = () => {
    letters.forEach((l, i) => setTimeout(() => (l.style.opacity = '1'), i * STAGGER));
  };
  // Se esconde en orden inverso: de la última letra a la primera
  const hideReverse = () => {
    letters.forEach((l, i) => {
      const rev = letters.length - 1 - i;
      setTimeout(() => (l.style.opacity = '0'), rev * STAGGER);
    });
  };

  const overNavbar = (x, y) => {
    if (!navbar) return false;
    const r = navbar.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!hasInitialized) {
      if (overNavbar(mouseX, mouseY)) return;
      currentX = mouseX;
      currentY = mouseY;
      tag.style.left = currentX + 15 + 'px';
      tag.style.top = currentY - 20 + 'px';
      tag.style.opacity = '0.5';
      revealForward();
      setTimeout(() => (hasInitialized = true), letters.length * STAGGER);
    }
  });

  (function follow() {
    if (!hasScrolled) {
      if (hasInitialized) {
        const ease = 0.05;
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;
        tag.style.left = currentX + 15 + 'px';
        tag.style.top = currentY - 20 + 'px';
      }
      requestAnimationFrame(follow);
    }
  })();

  if (navbar) {
    navbar.addEventListener('mouseenter', () => {
      if (hasScrolled || isAnimating || !hasInitialized) return;
      isAnimating = true;
      hideReverse();
      setTimeout(() => (isAnimating = false), letters.length * STAGGER);
    });
    navbar.addEventListener('mouseleave', () => {
      if (hasScrolled || isAnimating || !hasInitialized) return;
      isAnimating = true;
      revealForward();
      setTimeout(() => (isAnimating = false), letters.length * STAGGER);
    });
    const hideNow = () => {
      if (hasScrolled || !hasInitialized) return;
      letters.forEach((l) => (l.style.opacity = '0'));
      tag.style.opacity = '0';
    };
    navbar.addEventListener('pointerdown', hideNow, { capture: true });
    navbar.addEventListener('click', hideNow, { capture: true });
  }

  // Cumplió su función: al primer 2% de scroll se retira y se borra del DOM
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = (window.scrollY / max) * 100;
    if (pct > 2 && !hasScrolled) {
      hasScrolled = true;
      hideReverse();
      setTimeout(() => tag.remove(), letters.length * STAGGER + 200);
    }
  });
}

/* ---------------------------------------------------------------------------
   5. RENDER DE LOS PROYECTOS
--------------------------------------------------------------------------- */
function renderProjects() {
  const root = document.querySelector('#projects');
  if (!root || typeof PROJECTS === 'undefined') return;

  root.innerHTML = PROJECTS.map((p, pi) => {
    const images = Array.from({ length: p.count }, (_, i) => {
      const n = String(i + 1).padStart(3, '0');
      const file = `${p.prefix}_${n}.jpg`;
      const wide = p.wide && p.wide.includes(i + 1) ? ' is-wide' : '';
      return `
        <div class="layout-grid-item${wide}" data-layout-grid-item>
          <img class="thumbnail portrait" src="img/${p.slug}/${file}" alt="${p.name}" loading="lazy">
          <div class="filename">${file}</div>
        </div>`;
    }).join('');

    const meta = p.meta
      .map(([k, v]) => `<div class="meta-row">${k}</div>`)
      .join('');
    const metaValues = p.meta
      .map(([k, v]) => `<div class="meta-row">${v}</div>`)
      .join('');

    return `
      <section class="project-wrapper" data-layout-group>
        <div class="project-text-wrapper">
          <div class="project-text-header">
            ${pi === 0 ? '<div class="project-tag-wrapper"><div class="project-tag">proyectos</div></div>' : ''}
            <div class="project-header-container">
              <div class="project-header">
                <div class="project-info-container text-inverse">
                  <h2 class="project-info">${p.name}</h2>
                </div>
                <div class="project-info-container text-inverse">
                  <div class="project-info">${p.tags}</div>
                </div>
                <div class="project-info-container text-inverse">
                  <div class="project-info">${p.year}</div>
                  <svg class="plus-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.2"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="project-content-wrapper">
            <div class="acc-content-inner">
              <div class="acc-content-col">
                <p class="project-description">${p.description}</p>
              </div>
              <div class="acc-content-col">${meta}</div>
              <div class="acc-content-col">${metaValues}</div>
            </div>
          </div>
        </div>
        <div class="project-image-wrapper">
          <div class="project-image-grid" data-layout-grid data-gsap="stagger-container">
            ${images}
          </div>
        </div>
      </section>`;
  }).join('');
}

/* ---------------------------------------------------------------------------
   6. ACORDEÓN
   Abre en 500ms con desaceleración fuerte, los textos suben 12px al aparecer,
   el + rota hasta volverse ×.
   Y no espera al clic: se abre solo cuando entra en pantalla.
--------------------------------------------------------------------------- */
function initAccordions() {
  document.querySelectorAll('.project-wrapper').forEach((wrapper) => {
    const trigger = wrapper.querySelector('.project-header-container');
    const content = wrapper.querySelector('.project-content-wrapper');
    const inner = wrapper.querySelector('.acc-content-inner');
    const cols = wrapper.querySelectorAll('.acc-content-col');
    if (!trigger || !content) return;

    let open = false;

    function setOpen(next) {
      if (next === open) return;
      open = next;
      wrapper.classList.toggle('is-open', open);

      gsap.killTweensOf([content, cols]);

      if (open) {
        gsap.to(content, {
          height: inner.offsetHeight,
          duration: 0.5,
          ease: 'power4.out',
          onComplete: () => {
            gsap.set(content, { height: 'auto' });
            ScrollTrigger.refresh();
            lenis.resize();
          },
        });
        gsap.to(cols, { opacity: 1, y: 0, duration: 0.5, ease: 'power4.out' });
      } else {
        gsap.to(content, {
          height: 0,
          duration: 0.5,
          ease: 'power4.out',
          onComplete: () => {
            ScrollTrigger.refresh();
            lenis.resize();
          },
        });
        gsap.to(cols, { opacity: 0, y: 12, duration: 0.5, ease: 'power4.out' });
      }
    }

    trigger.addEventListener('click', () => setOpen(!open));

    // Apertura automática al entrar en el viewport
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            io.disconnect();
            setOpen(true);
          }
        });
      },
      { rootMargin: '0px 0px -25% 0px', threshold: 0 }
    );
    io.observe(wrapper.querySelector('.project-text-header'));
  });
}

/* ---------------------------------------------------------------------------
   7. ENTRADA DE IMÁGENES
   Suben 80px y aparecen en 0.6s, pero cada una con un retraso AL AZAR
   de 0 a 0.3s. No es un stagger prolijo: es irregular, y por eso respira.
--------------------------------------------------------------------------- */
function initImageReveal() {
  document.querySelectorAll('[data-gsap="stagger-container"]').forEach((container) => {
    const items = container.querySelectorAll('.layout-grid-item');
    if (!items.length) return;

    let running = 0;
    let timer = null;

    const disableClicks = () => (container.style.pointerEvents = 'none');
    const enableClicks = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (running === 0) container.style.pointerEvents = 'auto';
      }, 100);
    };

    gsap.set(items, { y: 80, opacity: 0 });

    items.forEach((item) => {
      item.addEventListener('dblclick', (e) => e.preventDefault());

      ScrollTrigger.create({
        trigger: item,
        start: 'top 115%',
        once: true,
        onEnter: () => {
          if (item.dataset.animated) return;
          item.dataset.animated = 'true';

          running++;
          disableClicks();

          gsap.to(item, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.inOut',
            delay: Math.random() * 0.3,
            overwrite: 'auto',
            onComplete: () => {
              running--;
              enableClicks();
            },
          });
        },
      });
    });
  });
}

/* ---------------------------------------------------------------------------
   8. CLIC EN UNA FOTO → LA GRILLA SE REACOMODA (GSAP Flip)
   Mide dónde estaba todo, cambia el layout, mide dónde quedó,
   y anima la diferencia. 0.65s.
--------------------------------------------------------------------------- */
function initGridFlip() {
  document.querySelectorAll('[data-layout-group]').forEach((group) => {
    const grid = group.querySelector('[data-layout-grid]');
    const items = grid ? grid.querySelectorAll('[data-layout-grid-item]') : null;
    if (!items || !items.length) return;

    let activeTween = null;

    items.forEach((item) => {
      item.addEventListener('click', () => {
        if (activeTween) {
          activeTween.kill();
          activeTween = null;
        }

        if (reduceMotion) {
          item.classList.toggle('is--active');
          ScrollTrigger.refresh();
          lenis.resize();
          return;
        }

        const wasActive = item.classList.contains('is--active');
        const state = Flip.getState(items, { simple: true });
        const prevHeight = grid.offsetHeight;

        item.classList.toggle('is--active');

        const nextHeight = grid.offsetHeight;
        gsap.set(grid, { height: prevHeight });

        const tl = gsap.timeline({
          onComplete: () => {
            gsap.set(grid, { clearProps: 'height' });
            ScrollTrigger.refresh();
            lenis.resize();
            activeTween = null;
          },
          onInterrupt: () => gsap.set(grid, { clearProps: 'height' }),
        });

        tl.add(
          Flip.from(state, {
            duration: 0.65,
            ease: 'power2.inOut',
            absolute: true,
            nested: true,
            prune: true,
          }),
          0
        );

        // Al cerrar, la altura se ajusta un toque después, para que
        // las imágenes no se recorten a mitad del viaje.
        tl.to(
          grid,
          { height: nextHeight, duration: wasActive ? 0.4 : 0.65, ease: 'power2.inOut' },
          wasActive ? 0.45 : 0
        );

        activeTween = tl;
      });
    });
  });
}

/* ---------------------------------------------------------------------------
   9. TRANSICIÓN ENTRE PÁGINAS
   4 columnas negras. Al entrar barren hacia la derecha (revelan),
   al salir entran desde la izquierda (tapan). 300ms de espera + 500ms de viaje.
--------------------------------------------------------------------------- */
function initPageTransition() {
  const overlay = document.querySelector('.page-transition');
  if (!overlay) return;
  const columns = overlay.querySelectorAll('.transition-column-background');
  const DURATION = 0.5;
  const DELAY = 0.3;

  // Al llegar: las columnas tapan la pantalla y se van hacia la derecha
  overlay.classList.add('is-visible');
  gsap.set(columns, { xPercent: 0 });
  document.body.classList.add('no-scroll-transition');

  gsap.to(columns, {
    xPercent: 100,
    duration: DURATION,
    delay: DELAY,
    ease: 'power2.inOut',
    onComplete: () => {
      overlay.classList.remove('is-visible');
      document.body.classList.remove('no-scroll-transition');
    },
  });

  // Al salir: entran desde la izquierda y recién ahí se navega
  document.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank' ||
        link.hostname !== window.location.hostname ||
        link.classList.contains('no-transition')
      ) {
        return;
      }

      e.preventDefault();
      document.body.classList.add('no-scroll-transition');
      overlay.classList.add('is-visible');
      gsap.set(columns, { xPercent: -100 });
      gsap.to(columns, {
        xPercent: 0,
        duration: DURATION,
        delay: DELAY,
        ease: 'power2.inOut',
        onComplete: () => (window.location = href),
      });
    });
  });
}

/* ---------------------------------------------------------------------------
   10. HUEVO DE PASCUA — Shift + G
   Muestra la grilla de debug de 12 columnas.
--------------------------------------------------------------------------- */
function initGridToggle() {
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      const grid = document.querySelector('.gridlayout-invisible');
      if (!grid) return;
      const hidden = getComputedStyle(grid).display === 'none';
      grid.style.setProperty('display', hidden ? 'flex' : 'none', 'important');
    }
  });
}

/* ---------------------------------------------------------------------------
   11. HUEVO DE PASCUA — tecla A
   Modo "escáner": 4 recuadros saltan entre palabras al azar del titular,
   etiquetados, unidos por líneas entre sus esquinas más cercanas.
--------------------------------------------------------------------------- */
function initScanMode() {
  const RECT_COUNT = 4;
  const MIN_INTERVAL = 800;
  const MAX_INTERVAL = 1400;
  const HEIGHT_REDUCTION = 30;

  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;display:none';
  document.body.appendChild(overlay);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none';
  overlay.appendChild(canvas);

  let active = false;
  let rects = [];
  let timers = [];

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function wrapWords(el) {
    if (el.dataset.scanWrapped) return;
    el.dataset.scanWrapped = '1';

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (/^\s*$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'mk-scan-word';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(el.childNodes).forEach(walk);
  }

  function makeRect() {
    const box = document.createElement('div');
    box.style.cssText =
      'position:fixed;background:rgba(0,0,0,0.3);border:1px solid #000;pointer-events:none;display:none;box-sizing:border-box';
    const label = document.createElement('div');
    label.style.cssText =
      'position:fixed;font-size:11px;font-family:"Space Mono",monospace;color:#000;white-space:nowrap;pointer-events:none;display:none;line-height:1';
    overlay.appendChild(box);
    overlay.appendChild(label);
    return { box, label, corners: null };
  }

  function assign(ro, span) {
    const r = span.getBoundingClientRect();
    const half = HEIGHT_REDUCTION / 2;
    const top = r.top + half;
    const left = r.left;
    const width = r.width;
    const height = Math.max(4, r.height - HEIGHT_REDUCTION);

    Object.assign(ro.box.style, {
      left: left + 'px',
      top: top + 'px',
      width: width + 'px',
      height: height + 'px',
      display: 'block',
    });

    ro.label.textContent = span.textContent.replace(/[.,!?]/g, '').trim();
    ro.label.style.left = left + 'px';
    ro.label.style.top = top - 13 + 'px';
    ro.label.style.display = 'block';

    ro.corners = {
      tl: { x: left, y: top },
      tr: { x: left + width, y: top },
      bl: { x: left, y: top + height },
      br: { x: left + width, y: top + height },
    };
  }

  // Une cada recuadro con el siguiente por sus dos esquinas más cercanas
  function drawLines() {
    resizeCanvas();
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;

    const visible = rects.filter((r) => r.corners);
    visible.forEach((a, i) => {
      const b = visible[(i + 1) % visible.length];
      let min = Infinity;
      let best = null;
      Object.values(a.corners).forEach((ca) => {
        Object.values(b.corners).forEach((cb) => {
          const d = Math.hypot(ca.x - cb.x, ca.y - cb.y);
          if (d < min) {
            min = d;
            best = { ca, cb };
          }
        });
      });
      if (best) {
        ctx.beginPath();
        ctx.moveTo(best.ca.x, best.ca.y);
        ctx.lineTo(best.cb.x, best.cb.y);
        ctx.stroke();
      }
    });
  }

  function start() {
    const target = document.querySelector('h1, .statement');
    if (!target) return;

    wrapWords(target);
    const spans = Array.from(target.querySelectorAll('.mk-scan-word'));
    if (!spans.length) return;

    active = true;
    overlay.style.display = 'block';
    resizeCanvas();

    rects = Array.from({ length: RECT_COUNT }, makeRect);
    const pool = spans.slice().sort(() => Math.random() - 0.5);
    rects.forEach((ro, i) => assign(ro, pool[i % pool.length]));
    drawLines();

    rects.forEach((ro) => {
      const cycle = () => {
        assign(ro, spans[Math.floor(Math.random() * spans.length)]);
        drawLines();
        timers.push(setTimeout(cycle, MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL)));
      };
      timers.push(setTimeout(cycle, MIN_INTERVAL + Math.random() * (MAX_INTERVAL - MIN_INTERVAL)));
    });
  }

  function stop() {
    active = false;
    timers.forEach(clearTimeout);
    timers = [];
    rects.forEach((ro) => {
      ro.box.remove();
      ro.label.remove();
    });
    rects = [];
    canvas.getContext('2d').clearRect(0, 0, window.innerWidth, window.innerHeight);
    overlay.style.display = 'none';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'a' || e.shiftKey || e.metaKey || e.ctrlKey) return;
    active ? stop() : start();
  });

  window.addEventListener('resize', () => {
    if (!active) return;
    const target = document.querySelector('h1, .statement');
    const spans = Array.from(target.querySelectorAll('.mk-scan-word'));
    rects.forEach((ro) => ro.corners && assign(ro, spans[Math.floor(Math.random() * spans.length)]));
    drawLines();
  });
}

/* ---------------------------------------------------------------------------
   12. FONDO ASCII
   Un toroide que gira, dibujado con caracteres. Se carga 1 segundo después
   que el resto, para no competir con la primera impresión.
--------------------------------------------------------------------------- */
function initAscii() {
  const canvas = document.getElementById('ascii-canvas');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  const CHARS = '.,-~:;=!*#$@';
  const FONT_SIZE = 11;
  const CHAR_W = FONT_SIZE * 0.6;
  const CHAR_H = FONT_SIZE;

  let cols = 0;
  let rows = 0;
  let A = 0;
  let B = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.floor(window.innerWidth / CHAR_W);
    rows = Math.floor(window.innerHeight / CHAR_H);
    ctx.font = `${FONT_SIZE}px "Space Mono", monospace`;
    ctx.textBaseline = 'top';
  }

  function frame() {
    const buffer = new Array(cols * rows).fill(' ');
    const zbuf = new Array(cols * rows).fill(0);

    // Toroide clásico: se recorre su superficie y se proyecta en 2D,
    // guardando la profundidad para saber qué tapa a qué.
    const R1 = 1;
    const R2 = 2;
    const K2 = 5;
    // SCALE controla cuánto de la pantalla ocupa. Tiene que quedar chico:
    // es un fondo, no compite con la tipografía.
    const SCALE = 0.42;
    const K1 = ((cols * K2 * 3) / (8 * (R1 + R2))) * SCALE;

    const cosA = Math.cos(A);
    const sinA = Math.sin(A);
    const cosB = Math.cos(B);
    const sinB = Math.sin(B);

    for (let theta = 0; theta < 6.28; theta += 0.09) {
      const costheta = Math.cos(theta);
      const sintheta = Math.sin(theta);

      for (let phi = 0; phi < 6.28; phi += 0.025) {
        const cosphi = Math.cos(phi);
        const sinphi = Math.sin(phi);

        const circleX = R2 + R1 * costheta;
        const circleY = R1 * sintheta;

        const x = circleX * (cosB * cosphi + sinA * sinB * sinphi) - circleY * cosA * sinB;
        const y = circleX * (sinB * cosphi - sinA * cosB * sinphi) + circleY * cosA * cosB;
        const z = K2 + cosA * circleX * sinphi + circleY * sinA;
        const ooz = 1 / z;

        const xp = Math.floor(cols / 2 + K1 * ooz * x);
        const yp = Math.floor(rows / 2 - (K1 * ooz * y) / 2);

        if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;

        const L =
          cosphi * costheta * sinB -
          cosA * costheta * sinphi -
          sinA * sintheta +
          cosB * (cosA * sintheta - costheta * sinA * sinphi);

        if (L <= 0) continue;

        const idx = xp + cols * yp;
        if (ooz > zbuf[idx]) {
          zbuf[idx] = ooz;
          buffer[idx] = CHARS[Math.max(0, Math.min(CHARS.length - 1, Math.floor(L * 8)))];
        }
      }
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    for (let j = 0; j < rows; j++) {
      let line = '';
      for (let i = 0; i < cols; i++) line += buffer[i + cols * j];
      if (line.trim()) ctx.fillText(line, 0, j * CHAR_H);
    }

    A += 0.03;
    B += 0.015;
  }

  resize();
  window.addEventListener('resize', resize);

  // 1 segundo de espera, igual que el original
  setTimeout(() => {
    canvas.classList.add('is-ready');
    let last = 0;
    (function loop(t) {
      // ~24fps: alcanza para que se vea fluido y no castiga la CPU
      if (t - last > 40) {
        frame();
        last = t;
      }
      requestAnimationFrame(loop);
    })(0);
  }, 1000);
}

/* ---------------------------------------------------------------------------
   ARRANQUE
--------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  buildPixelGrid();
  window.addEventListener('resize', buildPixelGrid);

  renderProjects();

  fitHeadline('.title-h1');
  fitHeadline('.statement', 0.3, 0.3);

  initCursorTag();
  initAccordions();
  initImageReveal();
  initGridFlip();
  initPageTransition();
  initGridToggle();
  initScanMode();
  initAscii();
});
