/* =====================================================================
   FICHA DE PRODUCTO — panel lateral (escritorio) / hoja inferior (celular).
   Detail.open(id, "hero" | "store")
   ===================================================================== */
const Detail = (() => {
  const panel = $("#panel"), body = document.body;
  let p = null, qty = 1, variant = 0, lastFocus = null, open = false, source = "store", onClose = null;

  function render() {
    const v = p.vars[variant], price = varPrice(p, v), old = varOld(p, v), off = offPct(price, old);
    $("#pMedia").replaceChildren(productMedia(p, { cls: "pmedia-lg" }));
    $("#pCat").textContent = catById(p.cat).name;
    $("#pName").textContent = p.name;
    $("#pTag").textContent = p.tag;
    $("#pNow").textContent = money.format(price);
    $("#pOld").textContent = off ? money.format(old) : "";
    $("#pOff").textContent = off ? `-${off}%` : "";
    $("#pOff").hidden = !off;
    $("#pVarH").textContent = p.varLabel;
    $("#pVars").replaceChildren(...p.vars.map((x, i) => {
      const c = h("button", "chip"); c.type = "button";
      c.setAttribute("aria-pressed", i === variant ? "true" : "false");
      if (x.swatch) { const d = h("span", "dot"); d.style.background = x.swatch; c.appendChild(d); }
      c.append(x.label);
      if (hasRange(p)) c.append(h("span", "chip-sub", money.format(varPrice(p, x))));
      c.addEventListener("click", () => { variant = i; render(); });
      return c;
    }));
    $("#pFeats").replaceChildren(...p.feats.map(f => { const li = h("li"); li.append(icon("i-check"), f); return li; }));
    $("#pBox").textContent = p.box;
    $("#qOut").textContent = qty;
    $("#qMinus").disabled = qty <= 1;
    $("#pTotal").textContent = money.format(price * qty);
    $("#pWa").href = waLink(`Hola BrandStore, quiero comprar:\n- ${p.name} (${v.label}) x ${qty}\nTotal: ${money.format(price * qty)}\n¿Está disponible?`);
  }

  function openDetail(id, src = "store", opts = {}) {
    if (open) return;
    p = productById(id); if (!p) return;
    source = src; onClose = opts.onClose || null; qty = 1; variant = 0;
    render();
    open = true;
    lastFocus = document.activeElement;
    panel.style.setProperty("--accent", p.color);
    body.classList.add("is-detail", src === "hero" ? "is-detail-hero" : "is-detail-store");
    ScrollLock.on("detail");
    panel.querySelector(".panel-scroll").scrollTop = 0;
    setTimeout(() => $("#close").focus({ preventScroll: true }), 60);
  }
  function closeDetail() {
    if (!open) return;
    open = false;
    body.classList.remove("is-detail", "is-detail-hero", "is-detail-store");
    ScrollLock.off("detail");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (onClose) onClose();
  }

  $("#close").addEventListener("click", closeDetail);
  $("#scrim").addEventListener("click", closeDetail);
  $("#qMinus").addEventListener("click", () => { if (qty > 1) { qty--; render(); } });
  $("#qPlus").addEventListener("click", () => { if (qty < 20) { qty++; render(); } });
  addEventListener("keydown", e => { if (open && e.key === "Escape") closeDetail(); });
  panel.addEventListener("keydown", e => {        // keep focus inside the dialog
    if (e.key !== "Tab") return;
    const f = $$("button:not(:disabled), a[href]", panel);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  return { open: openDetail, close: closeDetail, get isOpen() { return open; } };
})();
