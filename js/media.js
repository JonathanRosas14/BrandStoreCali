/* =====================================================================
   MEDIA — imágenes, recortes y diapositivas de la portada.
   Cada foto es un PNG/WebP con fondo transparente; ITEM recorta una zona
   de una foto ([x, y, ancho, alto] en píxeles de la imagen original).
   ===================================================================== */
const IMG = {
  pro2:  { src: "Assets/web/airpods-pro-2.webp",          w: 736,  h: 980 },
  pro3:  { src: "Assets/web/airpods-pro-3.webp",          w: 735,  h: 883 },
  max:   { src: "Assets/web/airpods-max.webp",            w: 1000, h: 1000 },
  c20:   { src: "Assets/web/cargador-20w.webp",           w: 1536, h: 1024 },
  c40:   { src: "Assets/web/cargador-40w.webp",           w: 1237, h: 1272 },
  usbc:  { src: "Assets/web/cable-usb-c.webp",            w: 1230, h: 1278 },
  light: { src: "Assets/web/cable-usb-c-lightning.webp",  w: 1241, h: 1268 },
  aw11:  { src: "Assets/web/apple-watch-series-11.webp",  w: 426,  h: 484 }
};
const ITEM = {
  pro2:  ["pro2",  [49, 91, 629, 754]],
  pro3:  ["pro3",  [138, 161, 487, 653]],
  max:   ["max",   [67, 21, 865, 959]],
  c20:   ["c20",   [466, 32, 607, 854]],
  c40:   ["c40",   [152, 85, 933, 944]],
  usbc:  ["usbc",  [344, 30, 557, 1057]],
  light: ["light", [331, 29, 571, 1065]],
  aw11:  ["aw11",  [12, 9, 402, 467]],
  budL:  ["pro3",  [212, 155, 160, 225]],   // auricular suelto (izquierdo)
  budR:  ["pro3",  [418, 276, 212, 156]]    // auricular suelto (derecho)
};

/* ---------- portada ---------- */
// Auriculares sueltos que flotan (los mismos en Pro 2 y Pro 3):
// [item, x, y, width, rotation, mirror, corner(blurred)]
const PRO_BUDS = [
  ["budL", 372, 168, 112, -12, 0], ["budR", 250, 482, 156, 8, 0], ["budR", 1196, 300, 150, -10, 1], ["budL", 1000, 566, 108, 22, 1],
  ["budR", -40, 560, 270, 0, 0, 1], ["budL", 1300, 118, 200, 18, 1, 1]
];
// product: id en PRODUCTS · media: recorte · h: alto del producto en el marco de 1440×900
const SLIDES = [
  { product: "pro2",  media: "pro2",  tab: "Pro 2",     h: 560, buds: PRO_BUDS },
  { product: "pro3",  media: "pro3",  tab: "Pro 3",     h: 540, buds: PRO_BUDS },
  { product: "max",   media: "max",   tab: "Max",       h: 560 },
  { product: "c20",   media: "c20",   tab: "20W",       h: 500 },
  { product: "c40",   media: "c40",   tab: "40W",       h: 500 },
  { product: "usbc",  media: "usbc",  tab: "USB-C",     h: 600 },
  { product: "aw11",  media: "aw11",  tab: "Watch",     h: 540 }
];

/* ---------- crop helpers ---------- */
// Fixed-size crop in design units (--u), used by the hero frame.
function cropU(el, key, W) {
  const [imgKey, [bx, by, bw, bh]] = ITEM[key];
  const im = IMG[imgKey], s = W / bw;
  el.style.backgroundImage = `url("${im.src}")`;
  el.style.backgroundSize = `calc(var(--u) * ${im.w * s}) calc(var(--u) * ${im.h * s})`;
  el.style.backgroundPosition = `calc(var(--u) * ${-bx * s}) calc(var(--u) * ${-by * s})`;
  return bh * s;
}
// Responsive crop in percentages: the element keeps the crop's aspect ratio at any size.
function cropPct(el, key) {
  const [imgKey, [bx, by, bw, bh]] = ITEM[key];
  const im = IMG[imgKey];
  el.style.backgroundImage = `url("${im.src}")`;
  el.style.backgroundSize = `${(im.w / bw) * 100}% ${(im.h / bh) * 100}%`;
  el.style.backgroundPosition = `${(bx / (im.w - bw)) * 100}% ${(by / (im.h - bh)) * 100}%`;
  el.style.aspectRatio = `${bw} / ${bh}`;
}
// Where each image sits inside a product tile: [center x %, center y %, height %]
const MEDIA_LAYOUT = {
  1: [[50, 50, 74]],
  2: [[36, 47, 70], [67, 57, 62]],
  3: [[50, 45, 68], [21, 58, 54], [79, 60, 56]]
};
