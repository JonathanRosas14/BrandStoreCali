/* =====================================================================
   PORTADA — carrusel de productos con transición de cortina, paralaje
   y piezas que flotan al hacer scroll hacia la tienda.
   ===================================================================== */
const Hero = (() => {
  const LAYERS = ["word", "shadow", "bottle", "fruit", "corner"];
  const FACTOR = { word: .40, shadow: .30, bottle: .15, fruit: .55, corner: .75 };
  const FLOAT  = { word: -40, shadow: -20, bottle: -110, fruit: -230, corner: -330 };  // design px when the hero has scrolled away
  const COVER_T = [0, .031, .134, .206, .278, .34, .412, .485, .546, .583, .62, .69, .79, .85, .93, 1];
  const COVER_C = [0, .006, .012, .023, .047, .07, .105, .158, .246, .55, .825, .9, .94, .956, .975, 1];
  const MOBILE = matchMedia("(max-width: 820px), (orientation: portrait)");

  const hero = $("#hero"), stage = $("#stage"), tabsEl = $("#tabs"), uline = $("#uline");
  let U = 1, cur = 0, busy = false, lastUser = -1e9, heroVisible = true, mobileSlots = [];
  const slideEls = [], tabBtns = [];
  const px = v => `calc(var(--u) * ${v})`;
  function box(el, x, y, w, ht) { el.style.left = px(x); el.style.top = px(y); el.style.width = px(w); el.style.height = px(ht); }
  const user = () => { lastUser = performance.now(); };

  /* ---------- build ---------- */
  SLIDES.forEach((d, i) => {
    const p = productById(d.product);
    const sec = h("section", "slide"); sec.style.background = p.color;
    sec.setAttribute("aria-roledescription", "diapositiva");
    sec.setAttribute("aria-label", `${i + 1} de ${SLIDES.length}: ${p.name}`);
    const frame = h("div", "frame"), L = {};
    LAYERS.forEach(n => { const l = h("div", "layer " + n); frame.appendChild(l); L[n] = l; });

    const word = h("div", "word", p.word); word.style.color = p.tone;
    word.setAttribute("aria-hidden", "true"); L.word.appendChild(word);

    const [, [, , bw, bh]] = ITEM[d.media];
    const pw = d.h * bw / bh;
    const prod = h("button", "prod"); prod.type = "button";
    prod.setAttribute("aria-label", `Ver ${p.name}: precio y detalles`);
    box(prod, 720 - pw / 2, 712 - d.h, pw, d.h);
    const pi = h("span", "prod-i"); cropU(pi, d.media, pw);
    prod.appendChild(pi); L.bottle.appendChild(prod);
    prod.addEventListener("click", e => { if (dragMoved) { e.preventDefault(); return; } openDetail(); });

    const sw = Math.max(240, pw * .78);
    const sh = h("div", "shadow"); box(sh, 720 - sw / 2, 699, sw, 30); L.shadow.appendChild(sh);

    let slot = 0;
    (d.buds || []).forEach(([it, x, y, w, r, mir, corner]) => {
      const o = h("div", "pc" + (mir ? " mir" : "")), inner = h("div", "pc-i");
      const ht = cropU(inner, it, w);
      box(o, x, y, w, ht);
      o.dataset.p = [x, y, w, ht].join(",");
      inner.style.setProperty("--r", r + "deg");
      inner.style.setProperty("--d", (3.2 + Math.random() * 1.8).toFixed(2) + "s");
      inner.style.setProperty("--dl", (-Math.random() * 4).toFixed(2) + "s");
      if (corner) o.dataset.corner = "1"; else o.dataset.slot = slot++;
      o.appendChild(inner); (corner ? L.corner : L.fruit).appendChild(o);
    });

    sec.appendChild(frame); stage.appendChild(sec);
    slideEls.push({ sec, frame, L, word });

    const b = h("button", null, d.tab); b.type = "button";
    b.addEventListener("click", () => { user(); if (i !== cur) go(i, i > cur ? 1 : -1); });
    tabsEl.appendChild(b); tabBtns.push(b);
  });

  /* ---------- scaling & word fitting ---------- */
  const mctx = document.createElement("canvas").getContext("2d");
  function inkAt100(text) {
    mctx.font = "italic 800 100px Poppins";
    const m = mctx.measureText(text);
    return m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  }
  function layout() {
    const vw = hero.clientWidth, vh = hero.clientHeight, mob = MOBILE.matches;
    U = mob ? Math.min(vw / 640, (vh - 200) / 620) : Math.min(vw / 1440, vh / 900);
    const fy = mob ? Math.min(40, Math.max(8, (vh - 900 * U) / 2 - 120)) : 0;
    hero.style.setProperty("--u", U + "px");
    hero.style.setProperty("--fy", fy + "px");
    const vis = Math.min(1440, vw / U) * .92;
    const limit = mob ? vis : 1330, target = mob ? vis : 1400;
    slideEls.forEach((s, i) => {
      const text = productById(SLIDES[i].product).word, n = text.length, ink100 = inkAt100(text);
      let ls = .005, F = 445;
      if (ink100 * F / 100 + ls * F * (n - 1) > limit) { ls = -.035; F = Math.min(445, target / (ink100 / 100 + ls * (n - 1))); }
      s.word.style.fontSize = px(F);
      s.word.style.letterSpacing = ls + "em";
      s.word.style.top = px(403.5 + .698 * F / 2 - .85 * F);
    });
    if (mob) {
      // phone: sharp earbuds go in the free bands under the tabs and above the CTA
      const fTop = vh / 2 - 450 * U + fy, toD = y => (y - fTop) / U;
      const upTop = 104, upBot = fTop + 135 * U - 4, dnTop = fTop + 712 * U + 14, dnBot = vh - 98;
      const xs = [720 - (vw / U) * .36, 720 + (vw / U) * .36];
      mobileSlots = [];
      if (upBot - upTop > 64) { const c = toD((upTop + upBot) / 2); mobileSlots[0] = [xs[0], c - 14]; mobileSlots[1] = [xs[1], c + 14]; }
      if (dnBot - dnTop > 64) { const c = toD((dnTop + dnBot) / 2); mobileSlots[2] = [xs[0] + 10, c + 12]; mobileSlots[3] = [xs[1] - 10, c - 12]; }
      mobileSlots.scale = Math.min(.72, Math.max(.42, Math.min(upBot - upTop, dnBot - dnTop) / (190 * U)));
    }
    $$(".pc", hero).forEach(o => {
      const [x, y, w, ht] = o.dataset.p.split(",").map(Number);
      if (!mob || o.dataset.corner) { o.style.scale = ""; return box(o, x, y, w, ht); }
      const c = mobileSlots[o.dataset.slot];
      if (!c) { o.style.scale = ""; return box(o, -9999, 0, w, ht); }
      box(o, c[0] - w / 2, c[1] - ht / 2, w, ht); o.style.scale = String(mobileSlots.scale || .72);
    });
    placeUnderline();
    written = -1;
  }
  function placeUnderline() {
    const b = tabBtns[cur]; if (!b) return;
    uline.style.width = b.offsetWidth + "px";
    uline.style.transform = `translateX(${b.offsetLeft}px)`;
    tabBtns.forEach((t, i) => t.setAttribute("aria-current", i === cur ? "true" : "false"));
    if (MOBILE.matches && tabsEl.scrollWidth > tabsEl.clientWidth) {
      tabsEl.scrollTo({ left: b.offsetLeft - tabsEl.clientWidth / 2 + b.offsetWidth / 2, behavior: RM.matches ? "auto" : "smooth" });
    }
  }
  addEventListener("resize", layout);

  /* ---------- curtain transition ---------- */
  function cover(t) {
    if (t <= 0) return 0; if (t >= 1) return 1;
    let i = 1; while (COVER_T[i] < t) i++;
    const k = (t - COVER_T[i - 1]) / (COVER_T[i] - COVER_T[i - 1]), s = k * k * (3 - 2 * k);
    return COVER_C[i - 1] + (COVER_C[i] - COVER_C[i - 1]) * s;
  }
  const easeOutQuad = k => 1 - (1 - k) * (1 - k);
  function setX(s, fn) { LAYERS.forEach(n => { s.L[n].style.transform = `translateX(${fn(n)}px)`; }); }
  function clearX(s) { s.sec.style.clipPath = ""; LAYERS.forEach(n => { s.L[n].style.transform = ""; }); }
  function clearFloat(s) { LAYERS.forEach(n => { s.L[n].style.translate = ""; }); }

  function go(to, dir) {
    if (busy || Detail.isOpen || to === cur) return;
    const A = slideEls[cur], B = slideEls[to];
    cur = to; placeUnderline(); written = -1;
    if (RM.matches) {
      clearX(A); clearFloat(A); A.sec.classList.remove("is-current");
      B.sec.classList.add("is-current"); return;
    }
    busy = true;
    B.sec.style.visibility = "visible"; B.sec.style.zIndex = 1; A.sec.style.zIndex = 2;
    const fw = 1440 * U, start = performance.now();
    setX(B, n => dir * FACTOR[n] * fw);
    (function tick(now) {
      const t = (now - start) / 970, c = cover(t);
      A.sec.style.clipPath = dir > 0 ? `inset(0 ${c * 100}% 0 0)` : `inset(0 0 0 ${c * 100}%)`;
      setX(A, () => -dir * c * .14 * fw);
      const k = easeOutQuad(clamp01((t - .5) / .42));
      setX(B, n => dir * (1 - k) * FACTOR[n] * fw);
      if (t < 1 || k < 1) return requestAnimationFrame(tick);
      A.sec.classList.remove("is-current"); A.sec.style.zIndex = ""; A.sec.style.visibility = "";
      B.sec.classList.add("is-current"); B.sec.style.zIndex = ""; B.sec.style.visibility = "";
      clearX(A); clearFloat(A); clearX(B);
      busy = false;
    })(start);
  }
  const next = () => go((cur + 1) % SLIDES.length, 1);
  const prev = () => go((cur - 1 + SLIDES.length) % SLIDES.length, -1);
  function openDetail() { if (busy) return; user(); Detail.open(SLIDES[cur].product, "hero", { onClose: user }); }

  $("#next").addEventListener("click", () => { user(); next(); });
  $("#prev").addEventListener("click", () => { user(); prev(); });
  $("#cta").addEventListener("click", openDetail);
  addEventListener("keydown", e => {
    if (Detail.isOpen || !heroVisible || isTyping(e.target) || document.body.classList.contains("is-filters")) return;
    if (e.key === "ArrowRight") { user(); next(); }
    else if (e.key === "ArrowLeft") { user(); prev(); }
  });

  /* ---------- scroll: pieces float up at different depths ---------- */
  let floatV = 0, floatTarget = 0, written = -1;
  const onScroll = () => { floatTarget = clamp01(scrollY / (hero.clientHeight || 1)); };
  addEventListener("scroll", onScroll, { passive: true });
  function floatLoop() {
    floatV += (floatTarget - floatV) * .16;
    if (Math.abs(floatTarget - floatV) < .0005) floatV = floatTarget;
    if (!RM.matches && floatV !== written) {
      const s = slideEls[cur];
      LAYERS.forEach(n => { s.L[n].style.translate = floatV ? `0 ${FLOAT[n] * floatV * U}px` : ""; });
      written = floatV;
    }
    requestAnimationFrame(floatLoop);
  }

  /* ---------- horizontal swipe / drag ---------- */
  let pd = null, dragMoved = false;
  stage.addEventListener("pointerdown", e => { if (Detail.isOpen) return; pd = { x: e.clientX, y: e.clientY }; dragMoved = false; });
  addEventListener("pointermove", e => { if (pd && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 10) dragMoved = true; });
  addEventListener("pointerup", e => {
    if (!pd) return;
    const dx = e.clientX - pd.x, dy = e.clientY - pd.y; pd = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { user(); dx < 0 ? next() : prev(); }
    setTimeout(() => { dragMoved = false; }, 0);
  });
  addEventListener("pointercancel", () => { pd = null; });

  /* ---------- autoplay (only while the hero is on screen) ---------- */
  new IntersectionObserver(([en]) => { heroVisible = en.intersectionRatio > .35; }, { threshold: [0, .35, 1] }).observe(hero);
  setInterval(() => {
    if (document.visibilityState !== "visible" || Detail.isOpen || !heroVisible) return;
    if (performance.now() - lastUser < 6000) return;
    next();
  }, 2600);

  /* ---------- header links ---------- */
  $("#waTopTxt").textContent = CONFIG.whatsappLabel;
  $("#waTop").href = waLink("Hola BrandStore, quiero información sobre sus productos.");

  /* ---------- opening sequence ---------- */
  slideEls[0].sec.classList.add("is-current");
  layout(); onScroll();
  requestAnimationFrame(floatLoop);
  let revealed = false;
  function reveal() {
    if (revealed) return; revealed = true;
    layout();
    if (!RM.matches && scrollY < hero.clientHeight * .5) {
      const s = slideEls[0], fw = 1440 * U;
      LAYERS.forEach(n => {
        s.L[n].animate([{ transform: `translateX(${FACTOR[n] * fw}px)` }, { transform: "translateX(0)" }],
          { duration: 900, easing: "cubic-bezier(0.22, 0.8, 0.3, 1)" });
      });
    }
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }
  document.fonts.ready.then(reveal);
  setTimeout(reveal, 3000);   // failsafe

  return { next, prev, hold() { lastUser = performance.now() + 1e12; } };
})();
