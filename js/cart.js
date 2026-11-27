/* =====================================================================
   CARRITO — modelo puro (testeable en node) + panel (solo con DOM).
   Cart.add(id, variantLabel, qty) · Cart.open() · Cart.close() · Cart.isOpen
   El precio NUNCA se guarda: siempre se calcula desde el catálogo.
   ===================================================================== */
const CART_MAX_QTY = 20, CART_MAX_LINES = 50, CART_KEY = "brandstore:cart:v1";

/* ---------- modelo (sin DOM ni localStorage) ---------- */
function createCartModel({ productById, varPrice, money, whatsappGreeting = "Hola BrandStore, quiero hacer este pedido:" }) {
  let lines = [];                                   // [{ id, variant, qty }]
  const clampQty = n => Math.max(1, Math.min(CART_MAX_QTY, Math.trunc(n)));
  const find = (id, variant) => lines.find(l => l.id === id && l.variant === variant);
  const variantOf = (id, label) => {
    const p = productById(id);
    const v = p && Array.isArray(p.vars) ? p.vars.find(x => x.label === label) : null;
    return p && v ? { p, v } : null;
  };
  const validQty = n => typeof n === "number" && Number.isFinite(n);

  function add(id, variant, qty = 1) {
    if (typeof id !== "string" || typeof variant !== "string" || !validQty(qty) || !variantOf(id, variant)) return null;
    const cur = find(id, variant);
    if (cur) { cur.qty = clampQty(cur.qty + clampQty(qty)); return cur; }
    if (lines.length >= CART_MAX_LINES) return null;
    const l = { id, variant, qty: clampQty(qty) };
    lines.push(l);
    return l;
  }
  function setQty(id, variant, qty) {
    const l = find(id, variant);
    if (!l || !validQty(qty)) return false;
    l.qty = clampQty(qty);
    return true;
  }
  function remove(id, variant) {
    const n = lines.length;
    lines = lines.filter(l => !(l.id === id && l.variant === variant));
    return lines.length !== n;
  }
  const clear = () => { lines = []; };
  const count = () => lines.reduce((s, l) => s + l.qty, 0);
  function resolved() {
    return lines.map(l => {
      const r = variantOf(l.id, l.variant);
      const unit = varPrice(r.p, r.v);
      return { id: l.id, variant: l.variant, qty: l.qty, product: r.p, vari: r.v, unit, subtotal: unit * l.qty };
    });
  }
  const total = () => resolved().reduce((s, l) => s + l.subtotal, 0);

  function fromJSON(raw) {
    const next = [];
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(data)) {
        for (const it of data) {
          if (!it || typeof it !== "object" || typeof it.id !== "string" || typeof it.variant !== "string") continue;
          if (!validQty(it.qty) || !variantOf(it.id, it.variant)) continue;
          const q = clampQty(it.qty), cur = next.find(l => l.id === it.id && l.variant === it.variant);
          if (cur) cur.qty = clampQty(cur.qty + q);
          else if (next.length < CART_MAX_LINES) next.push({ id: it.id, variant: it.variant, qty: q });
        }
      }
    } catch (_) { /* JSON corrupto → carrito vacío */ }
    lines = next;
  }
  const toJSON = () => JSON.stringify(lines.map(l => ({ id: l.id, variant: l.variant, qty: l.qty })));

  function message() {
    const rs = resolved();
    const rows = rs.map((l, i) => `${i + 1}. ${l.product.name} (${l.variant}) x ${l.qty} — ${money.format(l.subtotal)}`);
    return [whatsappGreeting, ...rows, `Total: ${money.format(rs.reduce((s, l) => s + l.subtotal, 0))}`, "¿Está disponible?"].join("\n");
  }
  return { add, setQty, remove, clear, count, total, fromJSON, toJSON, message, get lines() { return resolved(); } };
}

/* ---------- panel (solo navegador) ---------- */
const Cart = (typeof document !== "undefined" && typeof document.getElementById === "function" && document.getElementById("cart")) ? (() => {
  const model = createCartModel({ productById, varPrice, money });
  const panel = $("#cart"), list = $("#cartList"), body = document.body;
  let open = false, lastFocus = null;

  /* persistencia: si localStorage falla, sigue en memoria */
  const store = {
    read() { try { return localStorage.getItem(CART_KEY); } catch (_) { return null; } },
    write(s) { try { localStorage.setItem(CART_KEY, s); } catch (_) { /* bloqueado */ } }
  };
  model.fromJSON(store.read());

  const plural = n => `${n} ${n === 1 ? "producto" : "productos"}`;
  const announce = msg => { const e = $("#cartLive"); e.textContent = ""; setTimeout(() => { e.textContent = msg; }, 30); };

  function lineEl(l) {
    const li = h("li", "cl");
    const key = l.id + "|" + l.variant;
    const media = h("div", "cl-media"); media.appendChild(productMedia(l.product));
    const info = h("div", "cl-info");
    info.append(h("p", "cl-name", l.product.name), h("p", "cl-var", `${l.product.varLabel}: ${l.variant}`), h("p", "cl-unit", money.format(l.unit)));
    const qty = h("div", "cl-qty"); qty.setAttribute("role", "group"); qty.setAttribute("aria-label", `Cantidad de ${l.product.name}, ${l.variant}`);
    const minus = h("button", null, "−"); minus.type = "button"; minus.dataset.k = key + "|m"; minus.setAttribute("aria-label", "Quitar uno"); minus.disabled = l.qty <= 1;
    const out = h("output", null, String(l.qty));
    const plus = h("button", null, "+"); plus.type = "button"; plus.dataset.k = key + "|p"; plus.setAttribute("aria-label", "Agregar uno"); plus.disabled = l.qty >= CART_MAX_QTY;
    minus.addEventListener("click", () => change(() => model.setQty(l.id, l.variant, l.qty - 1)));
    plus.addEventListener("click", () => change(() => model.setQty(l.id, l.variant, l.qty + 1)));
    qty.append(minus, out, plus);
    const sub = h("strong", "cl-sub", money.format(l.subtotal));
    const rm = h("button", "cl-rm"); rm.type = "button"; rm.dataset.k = key + "|r";
    rm.setAttribute("aria-label", `Quitar ${l.product.name} (${l.variant}) del carrito`); rm.appendChild(icon("i-trash"));
    rm.addEventListener("click", () => {
      const ls = model.lines, i = ls.findIndex(x => x.id === l.id && x.variant === l.variant);
      const nb = ls[i + 1] || ls[i - 1];
      change(() => model.remove(l.id, l.variant), nb ? nb.id + "|" + nb.variant + "|r" : "#cartShop");
    });
    li.append(media, info, qty, sub, rm);
    return li;
  }

  function render(focusKey) {
    const ls = model.lines, n = model.count(), empty = !ls.length;
    const kept = focusKey || (panel.contains(document.activeElement) ? document.activeElement.dataset.k : null);
    list.replaceChildren(...ls.map(lineEl));
    $("#cartCount").textContent = empty ? "" : plural(n);
    $("#cartEmpty").hidden = !empty;
    $("#cartBody").hidden = empty;
    $("#cartFoot").hidden = empty;
    $("#cartTotal").textContent = money.format(model.total());
    const wa = $("#cartWa");
    if (empty) { wa.removeAttribute("href"); wa.setAttribute("aria-disabled", "true"); }
    else { wa.href = waLink(model.message()); wa.removeAttribute("aria-disabled"); }
    $$("[data-cart-open]").forEach(b => {
      b.setAttribute("aria-label", `Carrito, ${plural(n)}`);
      const bd = $(".cart-badge", b); bd.textContent = n > 99 ? "99+" : String(n); bd.hidden = !n;
    });
    if (kept && open) {
      let t = kept === "#cartShop" ? (empty ? $("#cartShop") : $("#cartClose")) : $(`[data-k="${CSS.escape(kept)}"]`, panel);
      if (t && t.disabled) t = $(`[data-k="${CSS.escape(kept.replace(/\|[mp]$/, kept.endsWith("|m") ? "|p" : "|m"))}"]`, panel);
      if (!t || t.disabled) t = empty ? $("#cartShop") : $("#cartClose");
      t.focus({ preventScroll: true });
    }
  }
  function change(fn, focusKey) { fn(); store.write(model.toJSON()); render(focusKey); }

  function add(id, variantLabel, qty = 1, { announce: say = true } = {}) {
    // devuelve las unidades que realmente se agregaron (0 si la línea ya estaba en el tope o es inválida)
    const before = model.count(), l = model.add(id, variantLabel, qty);
    if (!l) return 0;
    const added = model.count() - before;
    if (!added) return 0;
    store.write(model.toJSON()); render();
    const p = productById(id);
    if (say) announce(`Agregado al carrito: ${p.name} (${variantLabel}). ${plural(model.count())} en el carrito.`);
    return added;
  }

  function openCart(trigger) {
    if (open) return;
    if (typeof Detail !== "undefined" && Detail.isOpen) Detail.close();   // la ficha se cierra primero
    if (body.classList.contains("is-filters")) { const c = $("#fClose"); if (c) c.click(); }
    open = true;
    lastFocus = trigger instanceof Element ? trigger : document.activeElement;
    render();
    body.classList.add("is-cart");
    ScrollLock.on("cart");
    $("#cartScroll").scrollTop = 0;
    setTimeout(() => { if (open) $("#cartClose").focus({ preventScroll: true }); }, 60);
  }
  function closeCart() {
    if (!open) return;
    open = false;
    body.classList.remove("is-cart");
    ScrollLock.off("cart");
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  $$("[data-cart-open]").forEach(b => b.addEventListener("click", () => openCart(b)));
  $("#cartClose").addEventListener("click", closeCart);
  $("#cartScrim").addEventListener("click", closeCart);
  $("#cartClear").addEventListener("click", () => change(() => model.clear(), "#cartShop"));
  $("#cartShop").addEventListener("click", () => {
    closeCart();
    const t = $("#tienda"); if (t) t.scrollIntoView({ behavior: RM.matches ? "auto" : "smooth" });
  });
  $("#cartWa").addEventListener("click", e => { if (!model.count()) e.preventDefault(); });
  // registrado antes que detail/hero/store: Esc con el carrito abierto no llega a los demás
  addEventListener("keydown", e => {
    if (open && e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeCart(); }
  });
  panel.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const f = $$("button:not(:disabled), a[href]", panel).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  addEventListener("storage", e => {                  // otra pestaña modificó el carrito
    if (e.key !== CART_KEY && e.key !== null) return;
    model.fromJSON(store.read()); render();
  });

  render();
  return { add, open: openCart, close: closeCart, get isOpen() { return open; }, get count() { return model.count(); } };
})() : null;
