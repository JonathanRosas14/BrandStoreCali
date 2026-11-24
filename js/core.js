/* =====================================================================
   CORE — utilidades compartidas por portada, tienda y ficha.
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia("(prefers-reduced-motion: reduce)");
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0 });
const clamp01 = v => Math.max(0, Math.min(1, v));

const PRODUCT_BY_ID = new Map(PRODUCTS.map(p => [p.id, p]));
const CATEGORY_BY_ID = new Map(CATEGORIES.map(c => [c.id, c]));
const productById = id => PRODUCT_BY_ID.get(id);
const catById = id => CATEGORY_BY_ID.get(id);

/* ---------- prices ---------- */
const varPrice = (p, v) => v.price ?? p.price;
const varOld = (p, v) => (v.price != null ? v.old ?? null : p.old ?? null);
function cheapestVar(p) { return p.vars.reduce((a, v) => (varPrice(p, v) < varPrice(p, a) ? v : a), p.vars[0]); }
const priceFrom = p => varPrice(p, cheapestVar(p));
const oldFrom = p => varOld(p, cheapestVar(p));
const hasRange = p => new Set(p.vars.map(v => varPrice(p, v))).size > 1;
const offPct = (price, old) => (old && old > price ? Math.round((1 - price / old) * 100) : 0);
const isOffer = p => offPct(priceFrom(p), oldFrom(p)) > 0;

/* ---------- misc ---------- */
const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function icon(id, cls = "ic") {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("class", cls); s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", "#" + id); s.appendChild(u);
  return s;
}

/* ---------- large screens: scale the store, footer and panel with the viewport ---------- */
// 1 up to 1600×900, grows proportionally after that (max 1.6 at 2560×1440).
function fitScale() {
  const z = Math.max(1, Math.min(innerWidth / 1600, innerHeight / 900, 1.6));
  document.documentElement.style.setProperty("--z", z.toFixed(3));
}
fitScale();
addEventListener("resize", fitScale);

/* ---------- scroll lock (panel and filter drawer) ---------- */
const ScrollLock = (() => {
  const holders = new Set();
  return {
    on(k) { holders.add(k); document.documentElement.classList.add("is-locked"); },
    off(k) { holders.delete(k); if (!holders.size) document.documentElement.classList.remove("is-locked"); }
  };
})();

/* ---------- product media: coloured tile + big word + cut-out(s) ---------- */
function productMedia(p, { cls = "" } = {}) {
  const m = h("div", "pmedia " + cls);
  m.style.setProperty("--c", p.color);
  m.style.setProperty("--tone", p.tone);
  const w = h("span", "pmedia-word", p.word);
  w.style.setProperty("--len", Math.max(3, p.word.length));
  w.setAttribute("aria-hidden", "true");
  m.append(w, h("span", "pmedia-shadow"));
  const slots = p.layout || MEDIA_LAYOUT[p.media.length] || MEDIA_LAYOUT[1];
  // Con layout propio, las imágenes van en un lienzo cuadrado centrado:
  // así el grupo queda centrado en tarjetas 1:1, 5:4 o 16:11 por igual.
  const holder = p.layout ? m.appendChild(h("span", "pmedia-group")) : m;
  p.media.forEach((key, i) => {
    const [x, y, ht] = slots[i];
    const im = h("span", "pmedia-img");
    cropPct(im, key);
    im.style.left = x + "%"; im.style.top = y + "%"; im.style.height = ht + "%";
    im.style.setProperty("--d", i);
    holder.appendChild(im);
  });
  m.setAttribute("role", "img");
  m.setAttribute("aria-label", p.name);
  return m;
}
