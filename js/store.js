/* =====================================================================
   TIENDA — destacados, catálogo con búsqueda y filtros, novedades y kits.
   Todo se filtra en el navegador, sin recargar la página.
   ===================================================================== */
(() => {
  const PAGE = CONFIG.pageSize;
  const PRICE_RANGES = [
    { id: "all",    label: "Todos los precios",     test: () => true },
    { id: "lt100",  label: "Hasta $100.000",        test: v => v <= 100000 },
    { id: "100-500", label: "$100.000 – $500.000",  test: v => v > 100000 && v <= 500000 },
    { id: "gt500",  label: "Más de $500.000",       test: v => v > 500000 }
  ];
  const SORTS = {
    featured: (a, b) => a.rank - b.rank,
    asc:      (a, b) => priceFrom(a) - priceFrom(b),
    desc:     (a, b) => priceFrom(b) - priceFrom(a),
    name:     (a, b) => a.name.localeCompare(b.name, "es"),
    new:      (a, b) => (!!b.isNew - !!a.isNew) || a.rank - b.rank
  };
  const DEFAULTS = { q: "", cat: "all", price: "all", offers: false, news: false, sort: "featured" };
  const S = { ...DEFAULTS, shown: PAGE };

  const input = $("#q"), grid = $("#grid"), empty = $("#empty"), more = $("#more"), catalog = $("#catalogo");
  const desktop = matchMedia("(min-width: 1024px)");
  const phone = matchMedia("(max-width: 640px)");
  const setPlaceholder = () => { input.placeholder = phone.matches ? "Buscar productos…" : "Buscar AirPods, cargadores, cables…"; };
  setPlaceholder(); phone.addEventListener("change", setPlaceholder);

  /* ---------- search (accent-insensitive) ---------- */
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  PRODUCTS.forEach(p => {
    p._hay = norm([p.name, p.short, p.word, catById(p.cat).name, catById(p.cat).desc, ...p.vars.map(v => v.label)].join(" "));
  });
  const tokens = () => norm(S.q).trim().split(/\s+/).filter(Boolean);

  // Wrap matches in <mark>, comparing without accents but keeping the original text.
  function highlight(el, text, toks) {
    el.textContent = "";
    if (!toks.length) { el.textContent = text; return; }
    let flat = "", map = [];
    [...text].forEach((ch, i) => { const n = norm(ch); for (const c of n) { flat += c; map.push(i); } });
    const marks = new Array(text.length).fill(false);
    toks.forEach(t => { let k = flat.indexOf(t); while (k > -1) { for (let j = k; j < k + t.length; j++) marks[map[j]] = true; k = flat.indexOf(t, k + 1); } });
    let buf = "", on = false;
    const flush = () => { if (!buf) return; el.append(on ? h("mark", null, buf) : buf); buf = ""; };
    [...text].forEach((ch, i) => { if (marks[i] !== on) { flush(); on = marks[i]; } buf += ch; });
    flush();
  }

  /* ---------- filtering ---------- */
  function passes(p, skip) {
    const t = tokens();
    if (skip !== "q" && t.length && !t.every(w => p._hay.includes(w))) return false;
    if (skip !== "cat" && S.cat !== "all" && p.cat !== S.cat) return false;
    if (skip !== "price" && !PRICE_RANGES.find(r => r.id === S.price).test(priceFrom(p))) return false;
    if (skip !== "offers" && S.offers && !isOffer(p)) return false;
    if (skip !== "news" && S.news && !p.isNew) return false;
    return true;
  }
  const results = () => PRODUCTS.filter(p => passes(p)).sort(SORTS[S.sort]);
  const activeFilters = () => (S.cat !== "all") + (S.price !== "all") + S.offers + S.news;

  /* ---------- product card (shared by grid and rows) ---------- */
  function makeCard(p) {
    const a = h("article", "card");
    a.style.setProperty("--c", p.color);
    const media = productMedia(p);
    const badges = h("div", "badges");
    if (p.isNew) badges.appendChild(h("span", "badge", "Nuevo"));
    const off = offPct(priceFrom(p), oldFrom(p));
    if (off) badges.appendChild(h("span", "badge badge-off", `-${off}%`));
    media.appendChild(badges);

    const body = h("div", "card-body");
    const name = h("h3", "card-name"); name.textContent = p.name;
    const price = h("div", "card-price");
    if (hasRange(p)) price.appendChild(h("small", null, "Desde"));
    price.appendChild(h("strong", null, money.format(priceFrom(p))));
    if (off) price.appendChild(h("s", null, money.format(oldFrom(p))));
    const go = h("span", "card-go"); go.appendChild(icon("i-arrow"));
    const foot = h("div", "card-foot"); foot.append(price, go);
    body.append(h("span", "card-cat", catById(p.cat).name), name, h("p", "card-desc", p.short), foot);

    const hit = h("button", "card-hit"); hit.type = "button";
    hit.setAttribute("aria-label", `Ver ${p.name}, ${money.format(priceFrom(p))}`);
    hit.addEventListener("click", () => Detail.open(p.id, "store"));
    a.append(media, body, hit);
    a._name = name;
    return a;
  }

  /* ---------- catalog grid ---------- */
  const gridCards = new Map();
  let enterIndex = 0;
  function renderGrid() {
    const list = results(), toks = tokens();
    const visible = list.slice(0, S.shown);
    enterIndex = 0;
    const els = visible.map(p => {
      let c = gridCards.get(p.id);
      if (!c) { c = makeCard(p); gridCards.set(p.id, c); }
      if (!c.isConnected && grid.dataset.ready) {          // newly shown → animate in
        c.classList.remove("enter"); void c.offsetWidth;
        c.style.setProperty("--i", Math.min(enterIndex++, 7));
        c.classList.add("enter");
      }
      highlight(c._name, p.name, toks);
      return c;
    });
    grid.replaceChildren(...els);
    grid.dataset.ready = "1";

    empty.hidden = list.length > 0;
    grid.hidden = !list.length;
    $("#emptyQ").textContent = S.q.trim() ? `“${S.q.trim()}”` : "estos filtros";
    const left = list.length - visible.length;
    more.hidden = left <= 0;
    more.textContent = `Mostrar más productos (${left})`;

    const n = list.length;
    $("#resultTxt").innerHTML = "";
    $("#resultTxt").append(h("strong", null, `${n} ${n === 1 ? "producto" : "productos"}`),
      S.q.trim() ? ` para “${S.q.trim()}”` : "");
    $("#fApply").textContent = n ? `Ver ${n} ${n === 1 ? "producto" : "productos"}` : "Sin resultados";
    renderFilters();
  }

  /* ---------- filters (sidebar / drawer / chips) ---------- */
  function optButton(label, count, pressed, onClick, cls = "f-opt") {
    const b = h("button", cls); b.type = "button";
    b.setAttribute("aria-pressed", pressed ? "true" : "false");
    b.append(h("span", null, label));
    if (count != null) b.append(h("span", "f-count", String(count)));
    b.disabled = count === 0 && !pressed;
    b.addEventListener("click", onClick);
    return b;
  }
  function renderFilters() {
    const inCat = PRODUCTS.filter(p => passes(p, "cat"));
    const catOpts = [{ id: "all", name: "Todo", n: inCat.length }, ...CATEGORIES.map(c => ({ id: c.id, name: c.name, n: inCat.filter(p => p.cat === c.id).length }))];
    const setCat = id => () => update({ cat: id });
    $("#fCats").replaceChildren(...catOpts.map(c => optButton(c.name, c.n, S.cat === c.id, setCat(c.id))));
    $("#chipsRow").replaceChildren(...catOpts.map(c => optButton(c.name, null, S.cat === c.id, setCat(c.id), "qchip")));

    const inPrice = PRODUCTS.filter(p => passes(p, "price"));
    $("#fPrice").replaceChildren(...PRICE_RANGES.map(r =>
      optButton(r.label, inPrice.filter(p => r.test(priceFrom(p))).length, S.price === r.id, () => update({ price: r.id }))));

    $("#fOffers").setAttribute("aria-checked", S.offers ? "true" : "false");
    $("#fNew").setAttribute("aria-checked", S.news ? "true" : "false");
    $("#sort").value = S.sort;

    const n = activeFilters();
    $("#fBtnCount").textContent = n ? String(n) : "";
    $("#fBtnCount").hidden = !n;
    $("#fClear").hidden = !n;

    // active filter chips above the grid
    const chips = [];
    const chip = (label, patch) => {
      const b = h("button", "achip"); b.type = "button";
      b.append(label, icon("i-x"));
      b.setAttribute("aria-label", `Quitar filtro: ${label}`);
      b.addEventListener("click", () => update(patch));
      chips.push(b);
    };
    if (S.q.trim()) chip(`Búsqueda: ${S.q.trim()}`, { q: "" });
    if (S.cat !== "all") chip(catById(S.cat).name, { cat: "all" });
    if (S.price !== "all") chip(PRICE_RANGES.find(r => r.id === S.price).label, { price: "all" });
    if (S.offers) chip("En oferta", { offers: false });
    if (S.news) chip("Novedades", { news: false });
    if (chips.length > 1) {
      const all = h("button", "achip achip-clear", "Limpiar todo"); all.type = "button";
      all.addEventListener("click", () => update({ ...DEFAULTS, sort: S.sort }));
      chips.push(all);
    }
    $("#activeChips").replaceChildren(...chips);
  }

  function update(patch, { scroll = true } = {}) {
    const before = S.q;
    Object.assign(S, patch, { shown: PAGE });
    if ("q" in patch && input.value !== S.q) input.value = S.q;
    $("#search").classList.toggle("has-q", !!S.q);
    grid.classList.add("is-swapping");
    renderGrid();
    requestAnimationFrame(() => grid.classList.remove("is-swapping"));
    // bring the results into view when a filter changes far from the catalog
    if (scroll && !(("q" in patch) && before && S.q)) scrollToCatalog(true);
  }

  function scrollToCatalog(onlyIfAway) {
    const barH = $(".bar").getBoundingClientRect().height;
    const top = catalog.getBoundingClientRect().top;
    if (onlyIfAway && top > barH - 40 && top < innerHeight * .55) return;
    if (onlyIfAway && top < barH && catalog.getBoundingClientRect().bottom > innerHeight * .6) return;
    scrollTo({ top: scrollY + top - barH - 12, behavior: RM.matches ? "auto" : "smooth" });
  }

  /* ---------- search box ---------- */
  input.addEventListener("input", () => update({ q: input.value }));
  input.addEventListener("keydown", e => {
    if (e.key === "Escape" && input.value) { e.stopPropagation(); update({ q: "" }, { scroll: false }); }
    if (e.key === "Enter") { e.preventDefault(); scrollToCatalog(false); }
  });
  $("#qClear").addEventListener("click", () => { update({ q: "" }, { scroll: false }); input.focus(); });
  $("#emptyClear").addEventListener("click", () => { update({ ...DEFAULTS, sort: S.sort }, { scroll: false }); input.focus({ preventScroll: true }); });
  addEventListener("keydown", e => {                 // "/" focuses the search from anywhere
    if (e.key === "/" && !isTyping(e.target) && !Detail.isOpen && !Cart.isOpen) { e.preventDefault(); focusSearch(); }
  });
  function focusSearch() {
    const bar = $(".bar"), y = scrollY + bar.getBoundingClientRect().top;
    if (bar.getBoundingClientRect().top > 0) scrollTo({ top: y, behavior: RM.matches ? "auto" : "smooth" });
    input.focus({ preventScroll: true });
  }
  $("#heroSearch").addEventListener("click", focusSearch);

  /* ---------- other controls ---------- */
  $("#sort").addEventListener("change", e => update({ sort: e.target.value }, { scroll: false }));
  $("#fOffers").addEventListener("click", () => update({ offers: !S.offers }));
  $("#fNew").addEventListener("click", () => update({ news: !S.news }));
  $("#fClear").addEventListener("click", () => update({ ...DEFAULTS, q: S.q, sort: S.sort }));
  more.addEventListener("click", () => { S.shown += PAGE; renderGrid(); });
  // keep revealing products as the visitor reaches the end of the grid
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !more.hidden && grid.dataset.ready) { S.shown += PAGE; renderGrid(); }
  }, { rootMargin: "0px 0px 200px 0px" }).observe($("#sentinel"));

  /* ---------- filter drawer (tablet & phone) ---------- */
  const drawer = $("#filters");
  function openDrawer() {
    document.body.classList.add("is-filters"); ScrollLock.on("filters");
    drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-modal", "true");
    setTimeout(() => $("#fClose").focus({ preventScroll: true }), 50);
  }
  function closeDrawer() {
    if (!document.body.classList.contains("is-filters")) return;
    document.body.classList.remove("is-filters"); ScrollLock.off("filters");
    drawer.removeAttribute("role"); drawer.removeAttribute("aria-modal");
    $("#fBtn").focus({ preventScroll: true });
  }
  $("#fBtn").addEventListener("click", openDrawer);
  $("#fClose").addEventListener("click", closeDrawer);
  $("#fApply").addEventListener("click", () => { closeDrawer(); scrollToCatalog(false); });
  $("#fScrim").addEventListener("click", closeDrawer);
  addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  desktop.addEventListener("change", () => { if (desktop.matches) closeDrawer(); });

  /* ---------- featured tiles ---------- */
  $("#featured").replaceChildren(...CONFIG.featured.map(productById).filter(Boolean).map((p, i) => {
    const t = h("article", "tile" + (i === 0 ? " tile-lg" : ""));
    t.appendChild(productMedia(p, { cls: "pmedia-fill" }));
    const info = h("div", "tile-info");
    const pr = h("p", "tile-price");
    if (hasRange(p)) pr.append("Desde ");
    pr.append(money.format(priceFrom(p)));
    const cta = h("span", "tile-cta", "Ver producto"); cta.appendChild(icon("i-arrow"));
    info.append(h("span", "tile-cat", catById(p.cat).name), h("h3", "tile-name", p.name), pr, cta);
    const hit = h("button", "card-hit"); hit.type = "button";
    hit.setAttribute("aria-label", `Ver ${p.name}`);
    hit.addEventListener("click", () => Detail.open(p.id, "store"));
    t.append(info, hit);
    return t;
  }));

  /* ---------- horizontal rows ---------- */
  function fillRow(id, list) {
    const row = $("#" + id);
    row.replaceChildren(...list.map(makeCard));
    const nav = $(`[data-row="${id}"]`);
    const sync = () => {
      const max = row.scrollWidth - row.clientWidth - 2;
      nav.hidden = max <= 0;
      nav.querySelector("[data-dir='-1']").disabled = row.scrollLeft <= 2;
      nav.querySelector("[data-dir='1']").disabled = row.scrollLeft >= max;
    };
    nav.querySelectorAll("button").forEach(b => b.addEventListener("click", () =>
      row.scrollBy({ left: +b.dataset.dir * row.clientWidth * .85, behavior: RM.matches ? "auto" : "smooth" })));
    row.addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync);
    requestAnimationFrame(sync);
  }
  fillRow("rowNew", PRODUCTS.filter(p => p.isNew));
  fillRow("rowKits", PRODUCTS.filter(p => p.cat === "kits"));

  /* ---------- footer ---------- */
  $("#footCats").replaceChildren(...CATEGORIES.map(c => {
    const li = h("li"), b = h("button", "foot-link", c.name); b.type = "button";
    b.addEventListener("click", () => { update({ cat: c.id }, { scroll: false }); scrollToCatalog(false); });
    li.appendChild(b); return li;
  }));
  $$("[data-wa]").forEach(a => { a.href = waLink("Hola BrandStore, quiero información sobre sus productos."); });
  $$("[data-wa-label]").forEach(e => { e.textContent = "+57 " + CONFIG.whatsappLabel; });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- search bar: square corners + soft shadow once it sticks to the top ---------- */
  const bar = $(".bar");
  let stuckTick = 0;
  const syncStuck = () => { stuckTick = 0; bar.classList.toggle("is-stuck", bar.getBoundingClientRect().top <= 0.5); };
  addEventListener("scroll", () => { if (!stuckTick) stuckTick = requestAnimationFrame(syncStuck); }, { passive: true });
  syncStuck();

  /* ---------- reveal sections on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -12% 0px" });
  $$("[data-reveal]").forEach(sec => {
    [...sec.children].forEach((c, i) => c.style.setProperty("--i", Math.min(i, 8)));
    io.observe(sec);
  });

  renderGrid();
  $$("[data-reveal]").forEach(sec => [...sec.children].forEach((c, i) => c.style.setProperty("--i", Math.min(i, 8))));
})();
