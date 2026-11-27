import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const noop = () => {};
const ctx = vm.createContext({
  // stubs mínimos que core.js necesita al cargarse; sin elementos, así la UI de cart.js no se activa
  document: { documentElement: { style: { setProperty: noop }, classList: { add: noop, remove: noop } }, getElementById: () => null },
  matchMedia: () => ({ matches: false }), addEventListener: noop, innerWidth: 1600, innerHeight: 900, Intl, console
});
for (const f of ["config", "products", "media", "core", "cart"]) {
  vm.runInContext(readFileSync(join(root, "js", f + ".js"), "utf8"), ctx, { filename: f + ".js" });
}
const run = code => vm.runInContext(code, ctx);
const newCart = () => run("createCartModel({ productById, varPrice, money })");
const money = n => run(`money.format(${n})`);

// productos del catálogo real
const max = run("PRODUCTS.find(p => p.id === 'max')");
const withPrices = run("PRODUCTS.find(p => p.vars.some(v => v.price != null))");
const first = p => p.vars[0].label;
const unit = (p, i = 0) => run(`varPrice(PRODUCTS.find(p => p.id === '${p.id}'), PRODUCTS.find(p => p.id === '${p.id}').vars[${i}])`);

test("add suma la misma línea y respeta el tope 20", () => {
  const c = newCart();
  c.add(max.id, first(max), 2); c.add(max.id, first(max), 3);
  assert.equal(c.lines.length, 1); assert.equal(c.lines[0].qty, 5);
  c.add(max.id, first(max), 999);
  assert.equal(c.lines[0].qty, 20); assert.equal(c.count(), 20);
});

test("add rechaza producto/variante inexistente y cantidad inválida", () => {
  const c = newCart();
  assert.equal(c.add("nope", "x", 1), null);
  assert.equal(c.add(max.id, "Inexistente", 1), null);
  assert.equal(c.add(max.id, first(max), NaN), null);
  assert.equal(c.add(max.id, first(max), "2"), null);
  assert.equal(c.count(), 0);
});

test("líneas distintas por variante; remove y clear", () => {
  const c = newCart();
  const [a, b] = [max.vars[0].label, max.vars[1].label];
  c.add(max.id, a, 1); c.add(max.id, b, 1);
  assert.equal(c.lines.length, 2);
  assert.equal(c.remove(max.id, a), true);
  assert.equal(c.remove(max.id, a), false);
  assert.equal(c.lines.length, 1);
  c.clear(); assert.equal(c.count(), 0); assert.equal(c.lines.length, 0);
});

test("setQty limita a 1..20 e ignora inválidos", () => {
  const c = newCart(); c.add(max.id, first(max), 2);
  c.setQty(max.id, first(max), 0); assert.equal(c.count(), 1);
  c.setQty(max.id, first(max), -5); assert.equal(c.count(), 1);
  c.setQty(max.id, first(max), 500); assert.equal(c.count(), 20);
  c.setQty(max.id, first(max), 7); assert.equal(c.count(), 7);
  assert.equal(c.setQty(max.id, first(max), NaN), false); assert.equal(c.count(), 7);
  assert.equal(c.setQty("nope", "x", 3), false);
});

test("total y subtotales, con variantes de precio propio", () => {
  const c = newCart();
  const vi = withPrices.vars.findIndex(v => v.price != null);
  c.add(withPrices.id, withPrices.vars[vi].label, 3);
  c.add(max.id, first(max), 2);
  const [l1, l2] = c.lines;
  assert.equal(l1.unit, unit(withPrices, vi)); assert.equal(l1.subtotal, unit(withPrices, vi) * 3);
  assert.equal(l2.subtotal, unit(max) * 2);
  assert.equal(c.total(), unit(withPrices, vi) * 3 + unit(max) * 2);
});

test("fromJSON: corrupto, no-array, inexistentes y cantidades", () => {
  const c = newCart();
  for (const bad of ["{no json", "", null, undefined, '{"a":1}', "42", '"x"']) {
    c.add(max.id, first(max), 1); c.fromJSON(bad);
    assert.equal(c.count(), 0, String(bad));
  }
  const L = first(max);
  c.fromJSON(JSON.stringify([
    { id: "nope", variant: "x", qty: 1 },
    { id: max.id, variant: "Inexistente", qty: 1 },
    null, 5, { id: max.id, qty: 1 },
    { id: max.id, variant: L, qty: 0 },
  ]));
  assert.equal(JSON.stringify(c.lines.map(l => [l.id, l.variant, l.qty])), JSON.stringify([[max.id, L, 1]]));   // qty 0 → 1
  const q = n => { c.fromJSON(JSON.stringify([{ id: max.id, variant: L, qty: n }])); return c.lines[0]?.qty; };
  assert.equal(q(-3), 1); assert.equal(q(2.5), 2); assert.equal(q(999), 20);
  c.fromJSON(JSON.stringify([{ id: max.id, variant: L, qty: "3" }])); assert.equal(c.lines.length, 0);
});

test("fromJSON: máximo 50 líneas y precio nunca persistido", () => {
  const c = newCart();
  const all = run("PRODUCTS.flatMap(p => p.vars.map(v => ({ id: p.id, variant: v.label, qty: 1, price: 1 })))");
  c.fromJSON(JSON.stringify([...all, ...all, ...all, ...all]));
  assert.ok(c.lines.length <= 50);
  c.fromJSON(JSON.stringify([{ id: max.id, variant: first(max), qty: 2, price: 1 }]));
  assert.equal(c.lines[0].unit, unit(max));              // precio del catálogo, no del JSON
  assert.doesNotMatch(c.toJSON(), /price|unit|subtotal/);
  const d = newCart(); d.fromJSON(c.toJSON());
  assert.equal(d.count(), 2);
});

test("message() exacto con 2 líneas", () => {
  const c = newCart();
  const o = max.vars[1] ?? max.vars[0];
  c.add(max.id, o.label, 2);
  c.add(withPrices.id, withPrices.vars[0].label, 1);
  const s1 = unit(max, max.vars.indexOf(o)) * 2, s2 = unit(withPrices, 0);
  const expected = [
    "Hola BrandStore, quiero hacer este pedido:",
    `1. ${max.name} (${o.label}) x 2 — ${money(s1)}`,
    `2. ${withPrices.name} (${withPrices.vars[0].label}) x 1 — ${money(s2)}`,
    `Total: ${money(s1 + s2)}`,
    "¿Está disponible?"
  ].join("\n");
  assert.equal(c.message(), expected);
});

test("carrito vacío", () => {
  const c = newCart();
  assert.equal(c.count(), 0); assert.equal(c.total(), 0); assert.equal(c.lines.length, 0);
  assert.equal(c.toJSON(), "[]");
  assert.equal(c.message(), `Hola BrandStore, quiero hacer este pedido:\nTotal: ${money(0)}\n¿Está disponible?`);
});
